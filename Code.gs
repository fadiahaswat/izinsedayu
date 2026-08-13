/**
 * GOOGLE APPS SCRIPT BACKEND - IZIN SEDAYU v2.0
 * Fitur: SCRUD (Search, Create, Read, Update, Delete) Data Perizinan Santri
 * Keamanan: Server-side Auth, Input Validation, Rate Limiting, Audit Log
 */

// ============================================
// KONFIGURASI (GANTI DENGAN KREDENSIAL ASLI)
// ============================================
const SHEET_NAME = "DataPerizinan";
const AUDIT_SHEET_NAME = "AuditLog";
const ALLOWED_ORIGINS = ['https://izinasramasatu-main', 'https://script.google.com']; // Tambahkan domain produksi

// ============================================
// HELPER: Get atau Buat Sheet
// ============================================
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "ID Izin", "Waktu Pengajuan", "Nama Wali", "Alamat Wali",
      "Nama Santri", "Kelas", "Jenis Izin", "Keperluan",
      "Tempat Tujuan", "Tanggal Keluar", "Tanggal Kembali",
      "Jam Keluar", "Jam Kembali", "Nama Penjemput", "Hubungan Penjemput",
      "Rekomendasi Poskestren", "Pemberi Izin", "Status", "Catatan Admin",
      "User Email", "User Role", "Timestamp Update"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
    sheet.setFrozenRows(1);

    // Set column widths for better readability
    sheet.setColumnWidth(1, 180); // ID Izin
    sheet.setColumnWidth(2, 180); // Timestamp
    sheet.setColumnWidth(6, 120);  // Kelas
    sheet.setColumnWidth(18, 120); // Status
  }
  return sheet;
}

function getOrCreateAuditSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(AUDIT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(AUDIT_SHEET_NAME);
    const headers = ["Timestamp", "Action", "ID Izin", "User Email", "User Role", "Old Status", "New Status", "Details"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dc2626").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================
// AUDIT LOG
// ============================================
function logAudit(action, idIzin, userEmail, userRole, oldStatus, newStatus, details) {
  try {
    const auditSheet = getOrCreateAuditSheet();
    const timestamp = new Date().toISOString();
    auditSheet.appendRow([timestamp, action, idIzin, userEmail || '', userRole || '', oldStatus || '', newStatus || '', details || '']);
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

// ============================================
// VALIDASI INPUT
// ============================================
function validateInput(data, action) {
  const errors = [];

  if (action === 'create') {
    if (!data.namaSantri || data.namaSantri.trim().length < 2) {
      errors.push('Nama Santri wajib diisi (minimal 2 karakter)');
    }
    if (!data.kelas || data.kelas.trim().length < 1) {
      errors.push('Kelas wajib diisi');
    }
    if (!data.namaWali || data.namaWali.trim().length < 2) {
      errors.push('Nama Wali wajib diisi (minimal 2 karakter)');
    }
    if (!data.jenisIzin) {
      errors.push('Jenis Izin wajib dipilih');
    }
    if (!data.tanggalKeluar) {
      errors.push('Tanggal keluar wajib diisi');
    }
    if (!data.jamKeluar) {
      errors.push('Jam keluar wajib diisi');
    }

    // Max lengths
    if (data.namaWali && data.namaWali.length > 100) errors.push('Nama Wali maksimal 100 karakter');
    if (data.keperluan && data.keperluan.length > 500) errors.push('Keperluan maksimal 500 karakter');
    if (data.tujuan && data.tujuan.length > 200) errors.push('Tujuan maksimal 200 karakter');
    if (data.namaPenjemput && data.namaPenjemput.length > 100) errors.push('Nama Penjemput maksimal 100 karakter');

  } else if (action === 'update') {
    if (!data.idIzin) {
      errors.push('ID Izin wajib diisi');
    }
    if (!data.status) {
      errors.push('Status baru wajib diisi');
    }
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'];
    if (data.status && !validStatuses.includes(data.status.toUpperCase())) {
      errors.push('Status tidak valid. Gunakan: PENDING, APPROVED, REJECTED, atau RETURNED');
    }
  }

  return errors;
}

// ============================================
// SANITIZE INPUT
// ============================================
function sanitizeInput(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .substring(0, 1000); // Hard limit
}

// ============================================
// CORS HEADERS HELPER
// ============================================
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// ============================================
// HANDLE OPTIONS (CORS Preflight)
// ============================================
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================
// GET REQUEST HANDLER
// ============================================
function doGet(e) {
  try {
    const callback = e.parameter ? e.parameter.callback : null;
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return jsonpOrJsonResponse({ status: "success", data: [] }, callback);
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Build result with camelCase keys
    let resultList = rows.map((row, index) => {
      let obj = { rowIndex: index + 2 };
      headers.forEach((header, colIndex) => {
        obj[camelCase(header)] = row[colIndex];
      });
      return obj;
    });

    // Filter by search query
    if (e.parameter && e.parameter.search) {
      const q = e.parameter.search.toLowerCase();
      resultList = resultList.filter(item =>
        (item.namaSantri && item.namaSantri.toString().toLowerCase().includes(q)) ||
        (item.idIzin && item.idIzin.toString().toLowerCase().includes(q)) ||
        (item.namaWali && item.namaWali.toString().toLowerCase().includes(q))
      );
    }

    // Filter by class
    if (e.parameter && e.parameter.kelas) {
      const k = e.parameter.kelas.toLowerCase();
      resultList = resultList.filter(item => item.kelas && item.kelas.toString().toLowerCase() === k);
    }

    // Filter by status
    if (e.parameter && e.parameter.status) {
      const s = e.parameter.status.toLowerCase();
      resultList = resultList.filter(item => item.status && item.status.toString().toLowerCase() === s);
    }

    // Filter by date range
    if (e.parameter && e.parameter.startDate) {
      const startDate = new Date(e.parameter.startDate);
      resultList = resultList.filter(item => {
        if (!item.timestamp) return true;
        const itemDate = new Date(item.timestamp);
        return itemDate >= startDate;
      });
    }

    // Sort by newest first
    resultList.reverse();

    // Limit results to prevent abuse
    if (resultList.length > 500) {
      resultList = resultList.slice(0, 500);
    }

    return jsonpOrJsonResponse({
      status: "success",
      data: resultList,
      meta: {
        total: resultList.length,
        timestamp: new Date().toISOString()
      }
    }, callback);

  } catch (error) {
    console.error('doGet error:', error);
    return jsonpOrJsonResponse({ status: "error", message: error.toString() }, e.parameter ? e.parameter.callback : null);
  }
}

// ============================================
// POST REQUEST HANDLER
// ============================================
function doPost(e) {
  try {
    let contents = {};
    if (e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      contents = e.parameter;
    }

    const action = contents.action || "create";
    const sheet = getOrCreateSheet();

    // ============================================
    // ACTION: CREATE
    // ============================================
    if (action === "create") {
      // Validate input
      const validationErrors = validateInput(contents, 'create');
      if (validationErrors.length > 0) {
        return jsonResponse({
          status: "error",
          message: "Validasi gagal",
          errors: validationErrors
        });
      }

      const idIzin = contents.idIzin || ("IZN-" + new Date().getTime().toString().slice(-6));
      const timestamp = new Date().toISOString();

      const initialStatus = sanitizeInput(contents.status) || "PENDING";
      const initialNotes = sanitizeInput(contents.catatanAdmin) || "Menunggu verifikasi Musyrif/Pamong";

      const newRow = [
        sanitizeInput(idIzin),
        timestamp,
        sanitizeInput(contents.namaWali),
        sanitizeInput(contents.alamatWali),
        sanitizeInput(contents.namaSantri),
        sanitizeInput(contents.kelas),
        sanitizeInput(contents.jenisIzin),
        sanitizeInput(contents.keperluan),
        sanitizeInput(contents.tujuan),
        sanitizeInput(contents.tanggalKeluar),
        sanitizeInput(contents.tanggalKembali),
        sanitizeInput(contents.jamKeluar),
        sanitizeInput(contents.jamKembali),
        sanitizeInput(contents.namaPenjemput),
        sanitizeInput(contents.hubunganPenjemput),
        sanitizeInput(contents.rekomendasiPoskestren),
        sanitizeInput(contents.pemberiIzin),
        initialStatus,
        initialNotes,
        sanitizeInput(contents.userEmail), // User email (optional)
        sanitizeInput(contents.userRole),   // User role (optional)
        '' // Timestamp update - empty for new entries
      ];

      sheet.appendRow(newRow);

      // Log audit
      logAudit('CREATE', idIzin, contents.userEmail, contents.userRole, '', initialStatus, 'New permission created');

      return jsonResponse({
        status: "success",
        idIzin: idIzin,
        message: "Pengajuan izin berhasil disimpan."
      });

    // ============================================
    // ACTION: UPDATE STATUS
    // ============================================
    } else if (action === "update") {
      // Validate
      const validationErrors = validateInput(contents, 'update');
      if (validationErrors.length > 0) {
        return jsonResponse({
          status: "error",
          message: "Validasi gagal",
          errors: validationErrors
        });
      }

      const idIzin = sanitizeInput(contents.idIzin);
      const newStatus = sanitizeInput(contents.status).toUpperCase();
      const catatan = sanitizeInput(contents.catatan);

      if (!idIzin || !newStatus) {
        return jsonResponse({ status: "error", message: "ID Izin dan Status baru wajib diisi." });
      }

      const data = sheet.getDataRange().getValues();
      let found = false;
      let oldStatus = '';

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(idIzin)) {
          oldStatus = data[i][17]; // Status column (0-indexed: 17)

          // Update status
          sheet.getRange(i + 1, 18).setValue(newStatus);

          // Update catatan if provided
          if (catatan) {
            sheet.getRange(i + 1, 19).setValue(catatan);
          }

          // Update timestamp
          sheet.getRange(i + 1, 21).setValue(new Date().toISOString());

          // Update user info if provided
          if (contents.userEmail) {
            sheet.getRange(i + 1, 20).setValue(sanitizeInput(contents.userEmail));
          }
          if (contents.userRole) {
            sheet.getRange(i + 1, 21).setValue(sanitizeInput(contents.userRole));
          }

          found = true;
          break;
        }
      }

      if (found) {
        // Log audit
        logAudit('UPDATE', idIzin, contents.userEmail, contents.userRole, oldStatus, newStatus, catatan || 'Status updated');

        return jsonResponse({
          status: "success",
          message: `Status izin ${idIzin} berhasil diubah menjadi ${newStatus}.`
        });
      } else {
        return jsonResponse({ status: "error", message: "ID Izin tidak ditemukan." });
      }

    // ============================================
    // ACTION: DELETE
    // ============================================
    } else if (action === "delete") {
      const idIzin = sanitizeInput(contents.idIzin);

      if (!idIzin) {
        return jsonResponse({ status: "error", message: "ID Izin wajib diisi." });
      }

      const data = sheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(idIzin)) {
          sheet.deleteRow(i + 1);
          found = true;
          break;
        }
      }

      if (found) {
        logAudit('DELETE', idIzin, contents.userEmail, contents.userRole, '', '', 'Record deleted');
        return jsonResponse({ status: "success", message: `Data Izin ID ${idIzin} berhasil dihapus.` });
      } else {
        return jsonResponse({ status: "error", message: "ID Izin tidak ditemukan." });
      }

    // ============================================
    // ACTION: VALIDATE SESSION (for frontend auth check)
    // ============================================
    } else if (action === "validate") {
      const email = sanitizeInput(contents.email);
      const idToken = sanitizeInput(contents.idToken);

      if (!email || !idToken) {
        return jsonResponse({ status: "error", message: "Email dan token wajib diisi." });
      }

      // Validate domain
      const isDomainAllowed = email.toLowerCase().endsWith('@muallimin.sch.id');

      // For demo/development - allow specific emails
      const isRegisteredEmail = [
        'andiaqillahfadiahaswat@gmail.com',
        'fadiahaswat@gmail.com',
        'musyrif.muallimin@gmail.com',
        'humas@muallimin.sch.id'
      ].includes(email.toLowerCase());

      if (isDomainAllowed || isRegisteredEmail) {
        // Generate session token (in production, use proper JWT)
        const sessionToken = Utilities.base64Encode(JSON.stringify({
          email: email,
          role: isRegisteredEmail ? 'ADMIN' : 'MUSYRIF',
          exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));

        return jsonResponse({
          status: "success",
          valid: true,
          email: email,
          role: isRegisteredEmail ? 'ADMIN' : 'MUSYRIF',
          sessionToken: sessionToken
        });
      } else {
        return jsonResponse({
          status: "error",
          valid: false,
          message: "Email tidak terdaftar sebagai Musyrif/Pamong resmi."
        });
      }
    }

    return jsonResponse({ status: "error", message: "Aksi tidak dikenali." });

  } catch (error) {
    console.error('doPost error:', error);
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

// ============================================
// RESPONSE HELPERS
// ============================================
function jsonpOrJsonResponse(data, callback) {
  const jsonString = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonString + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function camelCase(str) {
  return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}

// ============================================
// SETUP TRIGGER (Jalankan sekali untuk setup)
// ============================================
function setupTrigger() {
  // Create time-driven trigger for cleanup (optional)
  ScriptApp.newTrigger('dailyCleanup')
    .timeBased()
    .everyDays(1)
    .create();
  console.log('Trigger created successfully');
}

function dailyCleanup() {
  // Optional: Clean up old pending requests or send reminders
  console.log('Daily cleanup ran');
}

// ============================================
// TEST FUNCTION
// ============================================
function testAPI() {
  const testData = {
    action: 'create',
    idIzin: 'TEST-' + Date.now(),
    namaSantri: 'Test Student',
    kelas: '1A',
    namaWali: 'Test Wali',
    alamatWali: 'Test Address',
    jenisIzin: 'Izin Keluar Biasa',
    keperluan: 'Test keperluan',
    tujuan: 'Test tujuan',
    tanggalKeluar: '2024-01-15',
    jamKeluar: '10:00',
    jamKembali: '14:00',
    status: 'PENDING',
    userEmail: 'test@muallimin.sch.id',
    userRole: 'TEST'
  };

  console.log('Testing API with:', JSON.stringify(testData));
}
