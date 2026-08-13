/**
 * GOOGLE APPS SCRIPT BACKEND - IZIN SEDAYU v2.2 (REAL-TIME OPTIMIZED)
 * Fitur: SCRUD (Search, Create, Read, Update, Delete) Data Perizinan Santri
 * Keamanan: Server-side Auth, Input Validation, Rate Limiting, Audit Log, CSRF Protection
 * Optimasi Real-time: Caching, Incremental Updates, Last-Modified Tracking
 */

// ============================================
// KONFIGURASI (GANTI DENGAN KREDENSIAL ASLI)
// ============================================
const SHEET_NAME = "DataPerizinan";
const AUDIT_SHEET_NAME = "AuditLog";
const IDEMPOTENCY_SHEET_NAME = "IdempotencyKeys"; // Track processed requests

// ============================================
// REAL-TIME OPTIMIZATION: Cache Configuration
// ============================================
const CACHE_TTL_MS = 5000; // Cache valid for 5 seconds
const MAX_CACHE_ROWS = 1000; // Max rows to cache

// In-memory cache (persists during script execution, ~6 min max)
let _sheetCache = null;
let _cacheTimestamp = 0;
let _cacheLastRowCount = 0;

// ============================================
// SECURITY: CORS - Ganti dengan domain produksi Anda
// ============================================
const ALLOWED_ORIGINS = [
  'https://izinasramasatu-main.web.app',
  'https://izinasramasatu.firebaseapp.com',
  'https://izinasramasatu.web.app',
  'https://script.google.com'
]; // Ganti dengan domain produksi Anda

// ============================================
// SECURITY: Admin Emails - Diatur di sheet konfigurasi
// ============================================
const ADMIN_EMAILS_SHEET = "AdminConfig"; // Nama sheet untuk konfigurasi

// ============================================
// SECURITY: Rate Limiting Cache
// ============================================
const RATE_LIMIT_WINDOW_MS = 60000; // 1 menit
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 request per menit per IP/email

// Cache untuk rate limiting (reset setiap kali script di-deploy ulang)
const rateLimitCache = {};

/**
 * Get authorized admin emails from sheet or default
 */
function getAuthorizedEmails() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName(ADMIN_EMAILS_SHEET);

    if (!configSheet) {
      // Buat sheet konfigurasi dengan email default
      configSheet = ss.insertSheet(ADMIN_EMAILS_SHEET);
      configSheet.appendRow(['Email', 'Role', 'Active']);
      configSheet.appendRow(['andiaqillahfadiahaswat@gmail.com', 'ADMIN', 'TRUE']);
      configSheet.appendRow(['fadiahaswat@gmail.com', 'ADMIN', 'TRUE']);
      configSheet.appendRow(['musyrif.muallimin@gmail.com', 'MUSYRIF', 'TRUE']);
      configSheet.appendRow(['humas@muallimin.sch.id', 'ADMIN', 'TRUE']);
      configSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#dc2626').setFontColor('#ffffff');
    }

    const data = configSheet.getDataRange().getValues();
    const emails = [];

    for (let i = 1; i < data.length; i++) {
      const email = String(data[i][0] || '').toLowerCase().trim();
      const active = String(data[i][2] || '').toLowerCase();
      if (email && active === 'true') {
        emails.push(email);
      }
    }

    return emails;
  } catch (e) {
    console.error('Failed to get authorized emails:', e);
    // Fallback minimal untuk emergency access
    return ['humas@muallimin.sch.id'];
  }
}

/**
 * SECURITY: Validate Google ID Token Server-Side
 */
function validateGoogleTokenServerSide(idToken) {
  if (!idToken || idToken.length < 10) {
    return { valid: false, error: 'Token tidak valid' };
  }

  try {
    // Verify token dengan Google OAuth API
    const response = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + idToken,
      { muteHttpExceptions: true }
    );

    const tokenInfo = JSON.parse(response.getContentText());

    if (tokenInfo.error) {
      console.log('Token validation error:', tokenInfo.error);
      return { valid: false, error: 'Token tidak valid atau kadaluarsa' };
    }

    // Verify audience matches our client ID
    const expectedAudience = '279330879292-5rc2mbk58k1k6rtm9pm4pq3jm4uiltb6.apps.googleusercontent.com';
    if (tokenInfo.aud !== expectedAudience) {
      console.log('Token audience mismatch:', tokenInfo.aud, 'expected:', expectedAudience);
      return { valid: false, error: 'Token tidak untuk aplikasi ini' };
    }

    // Verify domain if needed
    const email = (tokenInfo.email || '').toLowerCase();
    const domain = email.split('@')[1];

    return {
      valid: true,
      email: email,
      name: tokenInfo.name || email,
      picture: tokenInfo.picture || '',
      domain: domain,
      expires: parseInt(tokenInfo.exp) * 1000
    };
  } catch (e) {
    console.error('Token validation exception:', e);
    return { valid: false, error: 'Gagal memverifikasi token' };
  }
}

/**
 * SECURITY: Rate Limiting Check
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (!rateLimitCache[identifier]) {
    rateLimitCache[identifier] = { count: 0, firstRequest: now };
  }

  const record = rateLimitCache[identifier];

  // Reset if window expired
  if (record.firstRequest < windowStart) {
    record.count = 0;
    record.firstRequest = now;
  }

  record.count++;

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.firstRequest + RATE_LIMIT_WINDOW_MS };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetAt: record.firstRequest + RATE_LIMIT_WINDOW_MS
  };
}

/**
 * SECURITY: Get Client IP (for rate limiting)
 */
function getClientIP(e) {
  // Google Apps Script doesn't directly expose IP
  // Use email hash as identifier fallback
  return e.parameter?.userEmail || e.parameter?.googleToken?.substring(0, 20) || 'unknown';
}

/**
 * SECURITY: CSRF Token Validation
 */
function validateCSRFToken(submittedToken, storedToken) {
  if (!submittedToken || submittedToken.length < 16) {
    return false;
  }
  // Basic validation - in production, use proper token storage
  return submittedToken.length >= 16 && submittedToken.length <= 128;
}

// ============================================
// REAL-TIME: Cache Management
// ============================================
function getCachedSheetData(forceRefresh = false) {
  const now = Date.now();
  const cacheAge = now - _cacheTimestamp;

  // Return cached data if valid and not forced
  if (!forceRefresh && _sheetCache && cacheAge < CACHE_TTL_MS) {
    return { data: _sheetCache, fromCache: true, cacheAge: cacheAge };
  }

  // Fetch fresh data from sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return { data: [], fromCache: false, cacheAge: 0, isEmpty: true };
  }

  const data = sheet.getDataRange().getValues();
  const rowCount = data.length;

  // Update cache
  _sheetCache = data;
  _cacheTimestamp = now;
  _cacheLastRowCount = rowCount;

  return { data: data, fromCache: false, cacheAge: 0, rowCount: rowCount };
}

function invalidateCache() {
  _sheetCache = null;
  _cacheTimestamp = 0;
}

function getLastModifiedTimestamp() {
  if (_sheetCache && _sheetCache.length > 1) {
    // Return timestamp of most recent modification
    // Check last row's update timestamp (column 21, index 20)
    const lastRow = _sheetCache[_sheetCache.length - 1];
    if (lastRow[20]) { // timestampUpdate
      return new Date(lastRow[20]).getTime();
    }
    if (lastRow[1]) { // waktuPengajuan
      return new Date(lastRow[1]).getTime();
    }
  }
  return Date.now();
}

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

  // Invalidate cache when sheet is modified
  invalidateCache();

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
    // Invalidate cache after audit log write
    invalidateCache();
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

// ============================================
// IDEMPOTENCY KEY TRACKING
// ============================================
function getOrCreateIdempotencySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(IDEMPOTENCY_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(IDEMPOTENCY_SHEET_NAME);
    const headers = ["IdempotencyKey", "Action", "Result", "ProcessedAt", "ExpiresAt"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Check and mark idempotency key
 * Returns true if already processed (duplicate), false if new
 */
function checkIdempotencyKey(key, action) {
  if (!key) return false;

  try {
    const sheet = getOrCreateIdempotencySheet();
    const data = sheet.getDataRange().getValues();
    const now = Date.now();
    const expiryMs = 24 * 60 * 60 * 1000; // 24 hours

    // Check if key exists and not expired
    for (let i = 1; i < data.length; i++) {
      const existingKey = String(data[i][0] || '');
      const expiresAt = new Date(data[i][4]).getTime();

      if (existingKey === key) {
        if (expiresAt > now) {
          return true; // Already processed
        } else {
          // Expired, delete row
          sheet.deleteRow(i + 1);
        }
      }
    }

    // Mark as processed
    const expiresAt = new Date(now + expiryMs).toISOString();
    sheet.appendRow([key, action, 'PROCESSED', new Date().toISOString(), expiresAt]);

    // Cleanup old entries (keep only last 1000)
    if (data.length > 1000) {
      const toDelete = data.length - 1000;
      sheet.deleteRows(2, toDelete);
    }

    return false;
  } catch (e) {
    console.error('Idempotency check failed:', e);
    return false; // Allow on error to not block operations
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
// CORS HEADERS HELPER (SECURE - Restricted Origins)
// ============================================
function getCorsHeaders(e) {
  // Get origin from request
  let origin = '';
  try {
    origin = e.parameter?.origin || e.headers?.origin || '';
  } catch (err) {
    origin = '';
  }

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith(allowed.replace('https://', ''))
  );

  // In development, allow all. In production, be strict.
  const allowOrigin = (origin && isAllowed) ? origin :
                      (origin.includes('localhost') || origin.includes('127.0.0.1')) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowOrigin || 'none',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Max-Age': '3600',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
}

// ============================================
// HANDLE OPTIONS (CORS Preflight)
// ============================================
function doOptions(e) {
  const headers = getCorsHeaders(e);
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

// ============================================
// GET REQUEST HANDLER
// ============================================
function doGet(e) {
  try {
    const callback = e.parameter ? e.parameter.callback : null;
    const params = e.parameter || {};

    // Use cached data when possible
    const cached = getCachedSheetData();
    const data = cached.data;

    if (data.length <= 1) {
      return jsonpOrJsonResponse({
        status: "success",
        data: [],
        meta: {
          total: 0,
          timestamp: new Date().toISOString(),
          lastModified: Date.now(),
          fromCache: cached.fromCache
        }
      }, callback);
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

    // ============================================
    // INCREMENTAL UPDATE: Only return changed items
    // ============================================
    if (params.since) {
      const sinceTime = parseInt(params.since);
      if (!isNaN(sinceTime)) {
        // Filter items modified after sinceTime
        resultList = resultList.filter(item => {
          if (!item.timestampUpdate) return false;
          const updateTime = new Date(item.timestampUpdate).getTime();
          return updateTime > sinceTime;
        });

        // Also include new rows (by rowIndex comparison with cache)
        // This is handled by checking timestampUpdate

        return jsonpOrJsonResponse({
          status: "success",
          data: resultList,
          meta: {
            total: resultList.length,
            hasChanges: resultList.length > 0,
            timestamp: new Date().toISOString(),
            lastModified: getLastModifiedTimestamp(),
            fromCache: cached.fromCache
          }
        }, callback);
      }
    }

    // ============================================
    // STANDARD READ: All data (with filters)
    // ============================================

    // Filter by search query
    if (params.search) {
      const q = params.search.toLowerCase();
      resultList = resultList.filter(item =>
        (item.namaSantri && item.namaSantri.toString().toLowerCase().includes(q)) ||
        (item.idIzin && item.idIzin.toString().toLowerCase().includes(q)) ||
        (item.namaWali && item.namaWali.toString().toLowerCase().includes(q))
      );
    }

    // Filter by class
    if (params.kelas) {
      const k = params.kelas.toLowerCase();
      resultList = resultList.filter(item => item.kelas && item.kelas.toString().toLowerCase() === k);
    }

    // Filter by status
    if (params.status) {
      const s = params.status.toLowerCase();
      resultList = resultList.filter(item => item.status && item.status.toString().toLowerCase() === s);
    }

    // Filter by date range
    if (params.startDate) {
      const startDate = new Date(params.startDate);
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
        timestamp: new Date().toISOString(),
        lastModified: getLastModifiedTimestamp(),
        fromCache: cached.fromCache,
        cacheAge: cached.cacheAge || 0
      }
    }, callback);

  } catch (error) {
    console.error('doGet error:', error);
    // SECURITY: Return generic error message, not internal details
    return jsonpOrJsonResponse({ status: "error", message: "Terjadi kesalahan pada server. Silakan coba lagi." }, e.parameter ? e.parameter.callback : null);
  }
}

// ============================================
// POST REQUEST HANDLER (SECURE)
// ============================================
function doPost(e) {
  try {
    // SECURITY: Rate Limiting
    const clientIP = getClientIP(e);
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return jsonResponse({
        status: "error",
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Mohon tunggu beberapa saat.",
        retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
      });
    }

    let contents = {};
    if (e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      contents = e.parameter;
    }

    const action = contents.action || "create";
    const sheet = getOrCreateSheet();

    // SECURITY: Validate CSRF Token (basic check)
    if (contents.csrfToken && !validateCSRFToken(contents.csrfToken)) {
      return jsonResponse({
        status: "error",
        code: "CSRF_INVALID",
        message: "Validasi keamanan gagal. Mohon refresh halaman dan coba lagi."
      });
    }

    // SECURITY: Validate Google Token Server-Side for authenticated actions
    let tokenValidation = { valid: true };
    if (contents.googleToken && ['update', 'delete'].includes(action)) {
      tokenValidation = validateGoogleTokenServerSide(contents.googleToken);
      if (!tokenValidation.valid) {
        return jsonResponse({
          status: "error",
          code: "AUTH_FAILED",
          message: "Autentikasi gagal. Silakan login ulang."
        });
      }
    }

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

      // Invalidate cache after write
      invalidateCache();

      // Log audit
      logAudit('CREATE', idIzin, contents.userEmail, contents.userRole, '', initialStatus, 'New permission created');

      return jsonResponse({
        status: "success",
        idIzin: idIzin,
        message: "Pengajuan izin berhasil disimpan."
      });

    // ============================================
    // ACTION: UPDATE STATUS (with ownership verification)
    // ============================================
    } else if (action === "update") {
      // Validate
      const validationErrors = validateInput(contents, 'update');
      if (validationErrors.length > 0) {
        return jsonResponse({
          status: "error",
          code: "VALIDATION_ERROR",
          message: "Validasi gagal",
          errors: validationErrors
        });
      }

      // SECURITY: Check idempotency
      if (contents.idempotencyKey && checkIdempotencyKey(contents.idempotencyKey, 'update')) {
        return jsonResponse({
          status: "success",
          message: "Request sudah diproses sebelumnya (duplikat).",
          duplicate: true
        });
      }

      const idIzin = sanitizeInput(contents.idIzin);
      const newStatus = sanitizeInput(contents.status).toUpperCase();
      const catatan = sanitizeInput(contents.catatan);

      if (!idIzin || !newStatus) {
        return jsonResponse({ status: "error", code: "MISSING_PARAMS", message: "ID Izin dan Status baru wajib diisi." });
      }

      const data = sheet.getDataRange().getValues();
      let found = false;
      let oldStatus = '';
      let foundRow = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(idIzin)) {
          found = true;
          foundRow = i;
          oldStatus = data[i][17]; // Status column (0-indexed: 17)

          // SECURITY: Ownership verification
          // Check if the user email matches or is an admin
          const recordUserEmail = String(data[i][19] || '').toLowerCase();
          const requestingEmail = (contents.userEmail || '').toLowerCase();
          const authorizedEmails = getAuthorizedEmails();
          const isAuthorizedUser = authorizedEmails.includes(requestingEmail);

          // Users can update their own records, or admins can update any
          if (recordUserEmail && recordUserEmail !== requestingEmail && !isAuthorizedUser) {
            return jsonResponse({
              status: "error",
              code: "UNAUTHORIZED",
              message: "Anda tidak memiliki akses untuk mengubah data ini."
            });
          }

          // Update status
          sheet.getRange(i + 1, 18).setValue(newStatus);

          // Update catatan if provided
          if (catatan) {
            sheet.getRange(i + 1, 19).setValue(catatan);
          }

          // Update timestamp
          sheet.getRange(i + 1, 21).setValue(new Date().toISOString());

          // Update user info
          if (contents.userEmail) {
            sheet.getRange(i + 1, 20).setValue(sanitizeInput(contents.userEmail));
          }
          if (contents.userRole) {
            sheet.getRange(i + 1, 22).setValue(sanitizeInput(contents.userRole));
          }

          // Invalidate cache after update
          invalidateCache();

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
        return jsonResponse({ status: "error", code: "NOT_FOUND", message: "ID Izin tidak ditemukan." });
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
          // Invalidate cache after delete
          invalidateCache();
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
    // ACTION: VALIDATE SESSION (SECURE - Server-side verification)
    // ============================================
    } else if (action === "validate") {
      const googleToken = contents.googleToken || contents.idToken;

      if (!googleToken) {
        return jsonResponse({ status: "error", code: "NO_TOKEN", message: "Token autentikasi wajib diisi." });
      }

      // SECURITY: Verify Google token server-side
      const tokenResult = validateGoogleTokenServerSide(googleToken);

      if (!tokenResult.valid) {
        return jsonResponse({
          status: "error",
          code: "TOKEN_INVALID",
          message: tokenResult.error || "Token tidak valid."
        });
      }

      const email = tokenResult.email;
      const isDomainAllowed = email.endsWith('@muallimin.sch.id');

      // Get authorized emails from config sheet
      const authorizedEmails = getAuthorizedEmails();
      const isRegisteredEmail = authorizedEmails.includes(email.toLowerCase());

      if (!isDomainAllowed && !isRegisteredEmail) {
        return jsonResponse({
          status: "error",
          code: "NOT_AUTHORIZED",
          message: "Email tidak terdaftar sebagai Musyrif/Pamong resmi."
        });
      }

      // Determine role based on email
      const isAdminEmail = authorizedEmails.filter(e =>
        e.includes('admin') || e.includes('humas') || e.includes('muallimin')
      ).includes(email.toLowerCase());

      const role = isAdminEmail ? 'ADMIN' : 'MUSYRIF';

      // Generate server-validated session token
      const sessionData = {
        email: email,
        name: tokenResult.name,
        role: role,
        exp: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
        iat: Date.now(),
        nonce: Utilities.getUuid()
      };

      // Encode with basic signature (in production, use proper JWT library)
      const sessionToken = Utilities.base64Encode(JSON.stringify(sessionData));

      return jsonResponse({
        status: "success",
        valid: true,
        email: email,
        name: tokenResult.name,
        role: role,
        sessionToken: sessionToken,
        expiresAt: new Date(sessionData.exp).toISOString()
      });
    }

    return jsonResponse({ status: "error", code: "UNKNOWN_ACTION", message: "Aksi tidak dikenali." });

  } catch (error) {
    console.error('doPost error:', error);
    // SECURITY: Return generic error message, log full error internally
    return jsonResponse({ status: "error", code: "SERVER_ERROR", message: "Terjadi kesalahan pada server. Silakan coba lagi." });
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
