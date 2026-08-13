# Panduan Setup Google Sheets & Google Apps Script (GAS) Database SCRUD

Aplikasi **Izin Sedayu** dapat dihubungkan langsung ke **Google Spreadsheet** menggunakan **Google Apps Script (GAS)** secara 100% GRATIS tanpa membutuhkan server tambahan.

---

## 🚀 Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.google.com) di browser Anda.
2. Klik **+ Kosong** (Blank Spreadsheet).
3. Beri judul spreadsheet: `Database Izin Sedayu`.

---

## ⚙️ Langkah 2: Pemasangan Google Apps Script (Code.gs)
1. Pada menu atas Spreadsheet, klik **Ekstensi (Extensions)** > **Apps Script**.
2. Hapus seluruh kode bawaan yang ada di Script Editor (`myFunction()`).
3. Buka file [`google_apps_script/Code.gs`](file:///d:/ANDI/izinasramasatu-main/izinasramasatu-main/google_apps_script/Code.gs), salin seluruh kodenya, dan tempelkan ke editor Apps Script.
4. Klik ikon **Simpan (Disk/Ctrl+S)**.

---

## 🌐 Langkah 3: Deploy (Terapkan) Sebagai Web App REST API
1. Di pojok kanan atas Apps Script, klik **Terapkan (Deploy)** > **Terapkan baru (New deployment)**.
2. Di samping judul *Pilih jenis*, klik ikon roda gigi ⚙️ > pilih **Aplikasi Web (Web app)**.
3. Isikan setelan berikut:
   - **Deskripsi**: `Izin Sedayu API`
   - **Jalankan sebagai (Execute as)**: `Saya (Me)`
   - **Yang memiliki akses (Who has access)**: `Siapa saja (Anyone)` *(Sangat Penting agar form dapat mengirimkan data dari mana saja)*
4. Klik **Terapkan (Deploy)**.
5. Klik **Beri akses (Authorize access)**, pilih akun Google Anda, klik *Advanced (Lanjutan)* > *Go to Untitled project (unsafe)* > *Allow (Izinkan)*.
6. Salin **URL Aplikasi Web (Web App URL)** yang dihasilkan (berawalan `https://script.google.com/macros/s/.../exec`).

---

## 🔗 Langkah 4: Hubungkan ke Aplikasi Izin Sedayu
1. Buka file [`js/data.js`](file:///d:/ANDI/izinasramasatu-main/izinasramasatu-main/js/data.js).
2. Tempelkan URL yang sudah Anda salin ke variabel `GAS_WEB_APP_URL`:

```javascript
// Konfigurasi Database Google Apps Script (GAS)
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
```
3. Simpan file `js/data.js`.

---

## 🎉 Hasil & Cara Kerja
- **Penyimpanan Otomatis (Create)**: Setiap kali wali santri klik submit form, data izin akan **secara nyata tersimpan ke baris baru Google Spreadsheet** Anda.
- **Monitoring & Akses Pengurus (Read/Update)**: Pengurus atau admin dapat membuka spreadsheet atau mengklik **"🔍 Cek Status & Riwayat Perizinan"** pada web untuk memantau & mengubah status izin (PENDING, APPROVED, REJECTED, RETURNED).
