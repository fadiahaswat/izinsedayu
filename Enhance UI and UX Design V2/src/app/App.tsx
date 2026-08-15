import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Html5Qrcode } from "html5-qrcode";
import html2canvas from "html2canvas";
import logoBlue from "../assets/logo-muallimin-blue.png";
import logoWhite from "../assets/logo-muallimin-white.png";
import { santriData, musyrifData, koordinatorMusyrif, pamongList, pamongData, GOOGLE_CLIENT_ID, REGISTERED_EMAILS } from "../data";
import {
  Building2, Plus, BarChart2, LogOut, Search, X, Check,
  CheckCircle2, Clock, XCircle, ChevronDown, FileText,
  Printer, Share2, Home, RefreshCw, ArrowLeft, ChevronRight,
  UserCheck, AlertCircle, ShieldCheck, Users, Send,
  Calendar, MapPin, User, Heart, Stethoscope, Moon,
  Sparkles, TrendingUp, ClipboardList, Shield, Download,
  ScanLine, Camera, CreditCard, AlertTriangle, Info
} from "lucide-react";

// ─── Styles injected once ──────────────────────────────────────
const GLOBAL_CSS = `
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scalePop {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.03); }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes progressFill {
  from { width: 0%; }
}
.step-enter-fwd  { animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both; }
.step-enter-back { animation: slideInLeft  0.28s cubic-bezier(0.16,1,0.3,1) both; }
.fade-up         { animation: fadeUp       0.3s  cubic-bezier(0.16,1,0.3,1) both; }
.scale-pop       { animation: scalePop     0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
.card-hover {
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.card-hover:hover {
  box-shadow: 0 8px 24px -4px rgba(15,23,42,0.12);
  transform: translateY(-1px);
}
.btn-press:active { transform: scale(0.97); }
input, select {
  font-family: inherit;
}

/* Student Card ISO 7810 ID-1 (85.6mm x 54mm) Styles */
.id-card {
  width: 85.6mm;
  height: 54mm;
  background: #ffffff;
  border-radius: 3.5mm;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 0.8px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  page-break-inside: avoid;
  break-inside: avoid;
  background-image: 
    radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 60%),
    radial-gradient(circle at 0% 100%, rgba(245, 158, 11, 0.05) 0%, transparent 50%);
}

@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .cards-print-grid {
    display: grid !important;
    grid-template-columns: 85.6mm 85.6mm !important;
    gap: 6mm 10mm !important;
    justify-content: center !important;
    padding: 8mm 6mm !important;
  }
  .id-card {
    box-shadow: none !important;
    border: 0.3mm solid #94a3b8 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page { size: A4 portrait; margin: 8mm 6mm; }
}
`;

// ─── Types ─────────────────────────────────────────────────────
type PageId      = "home" | "form" | "login" | "pass" | "history" | "verify" | "scanner" | "cards";
type StatusType  = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
type JenisIzinKey = "keluar-biasa" | "kesehatan" | "menginap" | "sakit";

interface Student        { name: string; class: string; }
interface SelectedStudent{ name: string; classKey: string; classLabel: string; musyrifName: string; }
interface UserSession    { 
  name: string; 
  email?: string; 
  role: string; 
  picture?: string;
  santriName?: string;
  santriClass?: string;
}
interface IzinRecord     {
  idIzin: string; namaSantri: string; kelas: string; jenisIzin: string;
  status: StatusType; namaWali: string; alamatWali: string;
  keperluan: string; tujuan: string; tanggalKeluar: string;
  tanggalKembali: string; jamKeluar: string; jamKembali: string;
  namaPenjemput: string; hubunganPenjemput: string;
  pemberiIzin: string; catatanAdmin: string; createdAt?: string;
}

// ─── Jenis Izin Config ──────────────────────────────────────────
const JENIS_IZIN_LABELS: Record<JenisIzinKey, string> = {
  "keluar-biasa": "Izin Keluar Biasa (Kembali Hari Sama)",
  "kesehatan":    "Izin Pemeriksaan Kesehatan (RS/Klinik)",
  "menginap":     "Izin Pulang / Menginap (Bermalam)",
  "sakit":        "Izin Pulang Karena Sakit (Poskestren)",
};

const JENIS_OPTIONS = [
  {
    key: "keluar-biasa" as JenisIzinKey,
    icon: <MapPin className="w-5 h-5" />,
    title: "Keluar Hari Ini",
    subtitle: "Kembali hari yang sama",
    accent: "#2563eb",
    bg: "bg-blue-50", border: "border-blue-200",
    color: "text-blue-700", ring: "ring-blue-300",
    gradient: "from-blue-600 to-blue-500",
  },
  {
    key: "kesehatan" as JenisIzinKey,
    icon: <Stethoscope className="w-5 h-5" />,
    title: "Ke Dokter / RS",
    subtitle: "Pemeriksaan kesehatan",
    accent: "#059669",
    bg: "bg-emerald-50", border: "border-emerald-200",
    color: "text-emerald-700", ring: "ring-emerald-300",
    gradient: "from-emerald-600 to-teal-500",
  },
  {
    key: "menginap" as JenisIzinKey,
    icon: <Moon className="w-5 h-5" />,
    title: "Pulang / Menginap",
    subtitle: "Bermalam di luar asrama",
    accent: "#7c3aed",
    bg: "bg-violet-50", border: "border-violet-200",
    color: "text-violet-700", ring: "ring-violet-300",
    gradient: "from-violet-600 to-indigo-500",
  },
  {
    key: "sakit" as JenisIzinKey,
    icon: <Heart className="w-5 h-5" />,
    title: "Sakit – Rawat Rumah",
    subtitle: "Rekomendasi Poskestren",
    accent: "#dc2626",
    bg: "bg-rose-50", border: "border-rose-200",
    color: "text-rose-700", ring: "ring-rose-300",
    gradient: "from-rose-600 to-pink-500",
  },
] as const;

const CLASS_LABELS: Record<string, string> = {
  "1A":"Kelas 1 A","1B":"Kelas 1 B","1C":"Kelas 1 C","1D":"Kelas 1 D","1E":"Kelas 1 E",
  "1F":"Kelas 1 F","1G":"Kelas 1 G","1LOWERA":"1 Lower A","1LOWERB":"1 Lower B","1LOWERC":"1 Lower C",
  "2A":"Kelas 2 A","2B":"Kelas 2 B","2C":"Kelas 2 C","2D":"Kelas 2 D","2E":"Kelas 2 E",
  "2F":"Kelas 2 F","2G":"Kelas 2 G","2H":"Kelas 2 H","2LOWERA":"2 Lower A","2LOWERB":"2 Lower B","2LOWERC":"2 Lower C",
  "3A":"Kelas 3 A","3B":"Kelas 3 B","3C":"Kelas 3 C","3D":"Kelas 3 D","3E":"Kelas 3 E",
  "4A":"Kelas 4 A","4B":"Kelas 4 B","4C":"Kelas 4 C","4D":"Kelas 4 D",
  "5A":"Kelas 5 A","5B":"Kelas 5 B","5C":"Kelas 5 C",
  "6A":"Kelas 6 A","6B":"Kelas 6 B","6C":"Kelas 6 C","6INTERNASIONAL":"6 Internasional",
};

const TIME_SLOTS: string[] = [];
for (let h = 5; h <= 22; h++)
  for (const m of [0, 30])
    TIME_SLOTS.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);

// ─── Utils ─────────────────────────────────────────────────────
function genId() {
  return `IZN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
}
function getClassLabel(k: string) { return CLASS_LABELS[k] || `Kelas ${k}`; }
function getMusyrif(k: string) { return musyrifData[k] || { name: "Ustadz Musyrif Pembina" }; }

function calcDuration(jk: string, jb: string, jenis: string, tl?: string, tk?: string): string {
  if (!jk || !jb) return "";

  // If overnight / menginap / sakit (bermalam)
  if (jenis === "menginap" || jenis === "sakit") {
    if (tl && tk && tl !== tk) {
      const diffDays = Math.round((new Date(tk).getTime() - new Date(tl).getTime()) / 86400000);
      if (diffDays > 0) {
        return `${diffDays + 1} Hari (${diffDays} Malam)`;
      }
    }
    return "1 Hari (Bermalam)";
  }

  // Parse hours & minutes safely (handling "06:30", "06:30 WIB", etc.)
  const m1 = String(jk).match(/(\d{1,2}):(\d{2})/);
  const m2 = String(jb).match(/(\d{1,2}):(\d{2})/);

  if (!m1 || !m2) return "";

  const h1 = parseInt(m1[1], 10);
  const min1 = parseInt(m1[2], 10);
  const h2 = parseInt(m2[1], 10);
  const min2 = parseInt(m2[2], 10);

  let totalMinutes = (h2 * 60 + min2) - (h1 * 60 + min1);
  if (totalMinutes < 0) {
    totalMinutes += 1440; // overnight wrap around
  }

  if (totalMinutes === 0) {
    return "< 1 Menit";
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} Jam`);
  if (mins > 0) parts.push(`${mins} Menit`);

  return parts.join(" ") || "< 1 Menit";
}

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwQnacuM2ZsgWYP20M9Gjwi--adZsNxzJk14IyH2l8iBuv_tKZCPPrYKdLeJhZhU7iz/exec";

function getLocal(): IzinRecord[] {
  try { return JSON.parse(localStorage.getItem("local_izin_list")||"[]"); } catch { return []; }
}

// Real-time sync state
let lastFetchTimestamp = 0;
const DATA_TIMESTAMP_KEY = "izin_last_fetch_time";

async function fetchRemoteData(incremental = false): Promise<IzinRecord[]> {
  try {
    const sinceVal = localStorage.getItem(DATA_TIMESTAMP_KEY);
    const fetchUrl = (incremental && sinceVal && sinceVal !== "0")
      ? `${GAS_WEB_APP_URL}?action=read&since=${sinceVal}`
      : `${GAS_WEB_APP_URL}?action=read`;

    const res = await fetch(fetchUrl);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        if (json.meta?.lastModified) {
          lastFetchTimestamp = json.meta.lastModified;
          localStorage.setItem(DATA_TIMESTAMP_KEY, String(lastFetchTimestamp));
        }

        if (incremental && json.meta?.hasChanges === false && json.data.length === 0) {
          return getLocal();
        }

        if (!incremental || json.data.length > 0) {
          localStorage.setItem("local_izin_list", JSON.stringify(json.data));
          return json.data;
        }
      }
    }
  } catch (e) {
    console.warn("GAS sync read error:", e);
  }
  return getLocal();
}

function saveLocal(item: IzinRecord) {
  const list = getLocal();
  if (!list.some(x => x.idIzin === item.idIzin)) {
    list.unshift(item);
    localStorage.setItem("local_izin_list", JSON.stringify(list.slice(0,500)));
  }
  // Sync to GAS Google Sheets backend
  fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "create",
      ...item
    })
  }).catch(err => console.warn("GAS save error:", err));
}

function updateStatus(id: string, status: StatusType, note: string, user?: UserSession|null, approver?: string) {
  const list = getLocal();
  const f = list.find(x => x.idIzin === id);
  if (f) {
    f.status = status;
    f.catatanAdmin = note;
    if (approver) {
      f.pemberiIzin = approver;
    }
    localStorage.setItem("local_izin_list", JSON.stringify(list));
  }
  // Sync to GAS Google Sheets backend
  fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "update",
      idIzin: id,
      status: status,
      catatan: note,
      pemberiIzin: approver || f?.pemberiIzin || '',
      userEmail: user?.email || '',
      userRole: user?.role || ''
    })
  }).catch(err => console.warn("GAS update status error:", err));
}

function getRole(user: UserSession|null) {
  if (!user) return "orangtua";
  const r = user.role.toLowerCase();
  if (r.includes("pamong")||r.includes("direktur")) return "pamong";
  if (r.includes("musyrif")) return "musyrif";
  return "orangtua";
}

// ─── Kewenangan sesuai SOP Resmi Asrama ────────────────────────
// Musyrif : Keluar Biasa & Kesehatan saja (APPROVED langsung)
// Pamong  : Keluar Biasa, Kesehatan, Pulang/Menginap, & Sakit (semua APPROVED)
// Wadir   : sama seperti Pamong
// Wali    : semua PENDING menunggu Musyrif/Pamong
// Catatan : Sakit → WAJIB koordinasi Poskestren terlebih dahulu
function calcApproval(jenis: JenisIzinKey, role: string) {
  if (role==="pamong") {
    if (jenis==="sakit")
      return { status:"APPROVED" as StatusType, text:"Disetujui Pamong — pastikan sudah koordinasi dengan Poskestren / Dokter" };
    return { status:"APPROVED" as StatusType, text:"Disetujui langsung oleh Pamong Asrama" };
  }
  if (role==="musyrif") {
    if (jenis==="keluar-biasa")
      return { status:"APPROVED" as StatusType, text:"Disetujui Musyrif Kelas — wajib informasikan ke grup PKM" };
    if (jenis==="kesehatan")
      return { status:"APPROVED" as StatusType, text:"Disetujui Musyrif Kelas — catat nama penjemput jika ada" };
    if (jenis==="menginap")
      return { status:"PENDING" as StatusType, text:"Musyrif tidak berwenang — izin pulang/menginap harus disetujui Pamong atau Wadir" };
    if (jenis==="sakit")
      return { status:"PENDING" as StatusType, text:"Musyrif tidak berwenang memulangkan — koordinasikan dengan Poskestren / Pamong terlebih dahulu" };
  }
  // Wali / tidak login
  return { status:"PENDING" as StatusType, text:"Menunggu verifikasi Musyrif Kelas atau Pamong Asrama" };
}

function cleanTimeOnly(s: string): string {
  if (!s) return "-";
  let str = String(s).replace(/\s*WIB/gi, "").trim();
  if (str.includes("1899-12-30")) {
    const m = str.match(/T(\d{2}:\d{2})/);
    return m ? m[1] : "-";
  }
  if (str.includes("T")) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
    } catch {}
  }
  const m = str.match(/(\d{1,2}:\d{2})/);
  if (m) {
    const [h, min] = m[1].split(":");
    return `${h.padStart(2, "0")}:${min}`;
  }
  return str || "-";
}

function fmtTime(s: string): string {
  const t = cleanTimeOnly(s);
  return t === "-" ? "-" : `${t} WIB`;
}

function fmtDate(s: string) {
  if (!s || s.includes("1899-12-30")) return "-";
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1950) {
      return d.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
    }
  } catch {}
  return s;
}

function fmtDateLong(s: string) {
  if (!s || s.includes("1899-12-30")) return "-";
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1950) {
      return d.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    }
  } catch {}
  return s;
}

const JENIS_LABELS = JENIS_IZIN_LABELS;
const JENIS_IZIN = JENIS_OPTIONS;

function getJenisMeta(jenisStr: string) {
  const found = JENIS_OPTIONS.find(j => 
    j.key === jenisStr || 
    (jenisStr && j.title.toLowerCase().includes(jenisStr.toLowerCase())) || 
    (jenisStr && JENIS_IZIN_LABELS[j.key]?.toLowerCase() === jenisStr.toLowerCase())
  );
  return found || {
    key: "keluar-biasa" as JenisIzinKey,
    icon: <FileText className="w-3.5 h-3.5" />,
    title: jenisStr || "Izin Keluar",
    subtitle: "Perizinan Santri",
    accent: "#2563eb",
    bg: "bg-blue-50",
    border: "border-blue-200",
    color: "text-blue-700",
    ring: "ring-blue-300",
    gradient: "from-blue-600 to-blue-500",
  };
}

// Helper mencari data & kontak nomor WhatsApp Musyrif berdasarkan kelas santri
function findMusyrifByClass(kelasStr: string) {
  if (!kelasStr) return null;
  const clean = kelasStr.replace(/\s+/g, "").toLowerCase();
  
  // 1. Cocokkan langsung dengan key musyrifData (cth: "4c", "1a", "1lowera")
  for (const [k, v] of Object.entries(musyrifData)) {
    const kClean = k.toLowerCase().replace(/\s+/g, "");
    if (clean === kClean || clean === `kelas${kClean}` || clean.endsWith(kClean)) {
      return { key: k, ...(v as { name: string; number?: string; email?: string; waliKelas?: string }) };
    }
  }

  // 2. Cocokkan dengan label kelas di CLASS_LABELS
  for (const [k, label] of Object.entries(CLASS_LABELS)) {
    const labelClean = label.replace(/\s+/g, "").toLowerCase();
    if (clean === labelClean || clean.includes(labelClean)) {
      const m = musyrifData[k as keyof typeof musyrifData];
      if (m) return { key: k, ...(m as { name: string; number?: string; email?: string; waliKelas?: string }) };
    }
  }

  // 3. Substring matching
  for (const [k, v] of Object.entries(musyrifData)) {
    const kClean = k.toLowerCase();
    if (clean.includes(kClean)) {
      return { key: k, ...(v as { name: string; number?: string; email?: string; waliKelas?: string }) };
    }
  }

  return null;
}

// Helper multi-musyrif jika memilih beberapa santri bersaudara beda kelas
function findAllMusyrifByClass(kelasStr: string) {
  if (!kelasStr) return [];
  const classes = kelasStr.split(",").map(s => s.trim()).filter(Boolean);
  const result: { key: string; name: string; number?: string; waliKelas?: string; classLabel: string }[] = [];
  const seenKeys = new Set<string>();

  for (const c of classes) {
    const m = findMusyrifByClass(c);
    if (m && !seenKeys.has(m.key)) {
      seenKeys.add(m.key);
      result.push({ ...m, classLabel: c });
    }
  }

  if (result.length === 0) {
    const m = findMusyrifByClass(kelasStr);
    if (m) result.push({ ...m, classLabel: kelasStr });
  }

  return result;
}

// Helper mengecek apakah santri terlambat kembali (Overdue)
function isOverdue(item: IzinRecord): boolean {
  if (item.status !== "APPROVED") return false;
  if (!item.tanggalKembali) return false;
  try {
    const rawTime = cleanTimeOnly(item.jamKembali || "23:59");
    const [h, m] = rawTime.split(":").map(Number);
    const dateParts = item.tanggalKembali.split("-").map(Number);
    if (dateParts.length === 3) {
      const deadline = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], h || 23, m || 59, 0);
      return new Date() > deadline;
    }
  } catch {}
  return false;
}

// Helper validasi hierarki kewenangan persetujuan (Musyrif vs Pamong)
function canApprove(item: IzinRecord, user: UserSession | null): { allowed: boolean; reason?: string } {
  if (!user) return { allowed: false, reason: "Login Ustadz diperlukan" };
  const role = getRole(user);
  if (role === "pamong") {
    return { allowed: true };
  }
  if (role === "musyrif") {
    const isMenginapOrSakit = (item.jenisIzin || "").toLowerCase().includes("menginap") || 
                              (item.jenisIzin || "").toLowerCase().includes("pulang") ||
                              (item.jenisIzin || "").toLowerCase().includes("sakit");
    if (isMenginapOrSakit) {
      return { allowed: false, reason: "Memerlukan persetujuan Pamong Asrama" };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "Akses dibatasi" };
}

// Logika cerdas pengiriman WhatsApp:
// - KHUSUS Musyrif / Pamong yang LOGIN (isPengurus === true) & izin APPROVED -> kirim surat izin resmi ke Grup Satpam / Pos Gerbang
// - WALI SANTRI (tanpa login) -> WhatsApp SELALU mengarah ke nomor pribadi Musyrif Kelas
function sendWhatsAppMessage(passData: IzinRecord, isPengurus = false, targetMusyrifNumber?: string) {
  const isApproved = passData.status === "APPROVED";
  const musyrifList = findAllMusyrifByClass(passData.kelas);
  const timeOutStr = fmtTime(passData.jamKeluar).replace(":", ".");
  const timeInStr = fmtTime(passData.jamKembali).replace(":", ".");

  // HANYA Musyrif & Pamong yang login yang diizinkan mengirim surat izin ke Grup Satpam
  if (isPengurus && isApproved) {
    // Format Surat Izin Keluar Asrama Resmi ke Pos Keamanan / Satpam
    const approverText = passData.pemberiIzin && passData.pemberiIzin !== "-" ? passData.pemberiIzin : (passData.catatanAdmin || "Ustadz Pembina");
    const penjemputDesc = passData.namaPenjemput 
      ? `${passData.namaPenjemput}, ${passData.hubunganPenjemput || "orang tua santri"}`
      : `${passData.namaWali}, orang tua santri`;

    const text = `SURAT IZIN KELUAR ASRAMA
POS KEAMANAN / SATPAM

Madrasah Mu’allimin Muhammadiyah Yogyakarta
Kampus Sedayu

Assalamu’alaikum Wr. Wb.

Dengan hormat, disampaikan bahwa santri berikut telah mendapatkan izin keluar asrama yang telah disetujui dan diverifikasi secara resmi:

Nama Santri: ${passData.namaSantri}
Kelas: ${passData.kelas}
No. ID Izin: ${passData.idIzin}
Status: DISETUJUI

Jenis Izin: ${passData.jenisIzin}
Keperluan: ${passData.keperluan}
Tujuan: ${passData.tujuan}

Jadwal Keluar: ${fmtDateLong(passData.tanggalKeluar)} pukul ${timeOutStr}
Jadwal Kembali: ${fmtDateLong(passData.tanggalKembali)} pukul ${timeInStr}

Penjemput: ${penjemputDesc}
Wali: ${passData.namaWali}
Disetujui oleh: ${approverText}

Kepada Petugas Keamanan / Satpam Pos Gerbang, mohon membantu melakukan pemeriksaan dan pencocokan identitas santri serta penjemput pada saat santri keluar dan kembali ke asrama.

Demikian pemberitahuan ini disampaikan untuk dapat menjadi perhatian dan acuan petugas.

Wassalamu’alaikum Wr. Wb.`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  } else {
    // Wali Santri (tanpa login): WhatsApp SELALU mengarah ke nomor pribadi Musyrif Kelas
    const targetMusyrif = musyrifList.find(m => m.number === targetMusyrifNumber) || musyrifList[0];
    const musyrifTitle = targetMusyrif?.name || "Ustadz Musyrif Kelas";
    const penjemputDesc = passData.namaPenjemput 
      ? `${passData.namaPenjemput}, ${passData.hubunganPenjemput || "orang tua santri"}`
      : `${passData.namaWali}, orang tua santri`;

    const text = `PERMOHONAN IZIN SANTRI
ASRAMA MU’ALLIMIN SEDAYU

Assalamu’alaikum Wr. Wb.

Yth. ${musyrifTitle}

Mohon izin menyampaikan permohonan izin santri dengan rincian sebagai berikut:

ID Izin: ${passData.idIzin}
Nama Santri: ${passData.namaSantri}
Kelas: ${passData.kelas}
Jenis Izin: ${passData.jenisIzin}
Keperluan: ${passData.keperluan}
Tempat Tujuan: ${passData.tujuan}
Rencana Keluar: ${fmtDateLong(passData.tanggalKeluar)} pukul ${timeOutStr}
Rencana Kembali: ${fmtDateLong(passData.tanggalKembali)} pukul ${timeInStr}
Nama Wali: ${passData.namaWali}
Penjemput: ${penjemputDesc}

Mohon kesediaan Ustadz untuk berkenan memeriksa dan memverifikasi permohonan izin tersebut melalui Sistem Izin Sedayu.

Atas perhatian dan kesediaan Ustadz, kami sampaikan terima kasih.

Wassalamu’alaikum Wr. Wb.`;

    const numToCall = targetMusyrifNumber || targetMusyrif?.number;
    if (numToCall) {
      window.open(`https://api.whatsapp.com/send?phone=${numToCall}&text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    }
  }
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isToday(s: string) { return !!s && s.startsWith(todayISO()); }

// ─── StatusBadge ────────────────────────────────────────────────
function StatusBadge({ status, size = "sm" }: { status: StatusType; size?: "sm"|"md" }) {
  const map: Record<StatusType, { icon: React.ReactNode; cls: string; label: string }> = {
    APPROVED:{ icon:<CheckCircle2 className="w-3.5 h-3.5"/>, cls:"bg-emerald-50 text-emerald-700 border-emerald-200", label:"Disetujui" },
    PENDING: { icon:<Clock className="w-3.5 h-3.5"/>,        cls:"bg-amber-50 text-amber-700 border-amber-200",   label:"Menunggu"  },
    REJECTED:{ icon:<XCircle className="w-3.5 h-3.5"/>,      cls:"bg-rose-50 text-rose-700 border-rose-200",      label:"Ditolak"   },
    RETURNED:{ icon:<RefreshCw className="w-3.5 h-3.5"/>,    cls:"bg-blue-50 text-blue-700 border-blue-200",      label:"Kembali"   },
  };
  const c = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${c.cls}
      ${size==="md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ─── Accordion ──────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <button onClick={()=>setOpen(o=>!o)}
        className="w-full flex justify-between items-center px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open?"rotate-180":""}`}/>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border text-sm text-muted-foreground space-y-2 fade-up">{children}</div>
      )}
    </div>
  );
}

// Helper unduh kartu izin resmi sebagai gambar PNG (e-Pass) resolusi tinggi 1080 x 1920 Full HD
async function downloadPassImage(passData: IzinRecord) {
  const tId = toast.loading("Sedang membuat gambar e-Pass Full HD (1080x1920)...");
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context failed");

    // Resolusi Full HD 1080 x 1920 (9:16)
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    // Aktifkan High Quality Smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 1. Background Luar
    ctx.fillStyle = "#091224";
    ctx.fillRect(0, 0, w, h);

    // 2. Card Utama Putih (Modern Floating Card)
    const cardX = 40;
    const cardY = 50;
    const cardW = w - 80;
    const cardH = h - 100;
    const radius = 40;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // 3. Card Header (Gradient Navy Mewah)
    const headerH = 260;
    const headGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
    headGrad.addColorStop(0, "#0b1736");
    headGrad.addColorStop(0.5, "#152a65");
    headGrad.addColorStop(1, "#1e3a8a");

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, headerH, [radius, radius, 0, 0]);
    ctx.clip();
    ctx.fillStyle = headGrad;
    ctx.fillRect(cardX, cardY, cardW, headerH);

    // Subtle header pattern
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let px = cardX; px < cardX + cardW; px += 40) {
      for (let py = cardY; py < cardY + headerH; py += 40) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Header Typography
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("MADRASAH MU'ALLIMIN MUHAMMADIYAH YOGYAKARTA", cardX + 50, cardY + 65);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("KAMPUS SEDAYU BANTUL", cardX + 50, cardY + 95);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("SURAT IZIN RESMI (e-PASS)", cardX + 50, cardY + 155);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 20px monospace";
    ctx.fillText(`ID IZIN: ${passData.idIzin}`, cardX + 50, cardY + 195);

    // Status Badge (Top Right Header)
    const badgeW = 230;
    const badgeH = 54;
    const badgeX = cardX + cardW - badgeW - 45;
    const badgeY = cardY + 50;

    ctx.fillStyle = "#059669";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 27);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓ DISETUJUI (ACC)", badgeX + (badgeW / 2), badgeY + 34);
    ctx.textAlign = "left";

    // 4. Student Profile Highlight Card
    const profY = cardY + headerH + 35;
    const profH = 145;
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cardX + 45, profY, cardW - 90, profH, 24);
    ctx.fill();
    ctx.stroke();

    // Student Initial Avatar Circle
    const circleX = cardX + 115;
    const circleY = profY + 72;
    const circleR = 48;
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(passData.namaSantri ? passData.namaSantri.charAt(0).toUpperCase() : "S", circleX, circleY + 14);
    ctx.textAlign = "left";

    // Student Name & Class
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(passData.namaSantri, cardX + 185, profY + 62);

    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`Kelas: ${passData.kelas}   •   ${passData.jenisIzin}`, cardX + 185, profY + 105);

    // 5. Details Section (Table of rows)
    const detailRows = [
      ["Keperluan Izin", passData.keperluan || "-"],
      ["Tempat Tujuan",  passData.tujuan || "-"],
      ["Nama Wali",      passData.namaWali || "-"],
      ["Penjemput",      `${passData.namaPenjemput || passData.namaWali || "-"} (${passData.hubunganPenjemput || "Wali"})`],
      ["Pemberi ACC",    passData.pemberiIzin && passData.pemberiIzin !== "-" ? passData.pemberiIzin : (passData.catatanAdmin || "Musyrif / Pamong Asrama")],
    ];

    let rowY = profY + profH + 45;
    detailRows.forEach(([label, val]) => {
      // Row divider
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardX + 50, rowY - 10);
      ctx.lineTo(cardX + cardW - 50, rowY - 10);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(label, cardX + 55, rowY + 22);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`:  ${val}`, cardX + 240, rowY + 22);

      rowY += 48;
    });

    // 6. Schedule Boxes (Out & Return - Side by Side)
    rowY += 15;
    const schedW = (cardW - 110) / 2;
    const schedH = 175;

    // Out box (Left)
    ctx.fillStyle = "#eff6ff";
    ctx.strokeStyle = "#bfdbfe";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX + 45, rowY, schedW, schedH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("JADWAL KELUAR ASRAMA", cardX + 70, rowY + 38);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${fmtDate(passData.tanggalKeluar)}`, cardX + 70, rowY + 82);

    ctx.fillStyle = "#2563eb";
    ctx.font = "900 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${cleanTimeOnly(passData.jamKeluar)} WIB`, cardX + 70, rowY + 138);

    // Return box (Right)
    const schedX2 = cardX + 45 + schedW + 20;
    ctx.fillStyle = "#ecfdf5";
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(schedX2, rowY, schedW, schedH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#065f46";
    ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("JADWAL KEMBALI ASRAMA", schedX2 + 25, rowY + 38);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${fmtDate(passData.tanggalKembali || passData.tanggalKeluar)}`, schedX2 + 25, rowY + 82);

    ctx.fillStyle = "#059669";
    ctx.font = "900 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${cleanTimeOnly(passData.jamKembali)} WIB`, schedX2 + 25, rowY + 138);

    // 7. QR Code Security Box
    rowY += schedH + 35;
    const qrBoxH = 460;
    const qrBoxY = rowY;

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(cardX + 45, qrBoxY, cardW - 90, qrBoxH, 28);
    ctx.fill();

    // White QR Container in Center
    const qrContainerW = 280;
    const qrContainerH = 280;
    const qrContainerX = cardX + ((cardW - qrContainerW) / 2);
    const qrContainerY = qrBoxY + 35;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrContainerX, qrContainerY, qrContainerW, qrContainerH, 20);
    ctx.fill();

    // Embed QR from DOM or Draw high-contrast QR
    const qrSvg = document.getElementById("pass-qrcode-svg") || document.querySelector("svg.qr-code-svg");
    if (qrSvg) {
      try {
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const DOMURL = window.URL || window.webkitURL || window;
        const url = DOMURL.createObjectURL(svgBlob);
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, qrContainerX + 15, qrContainerY + 15, qrContainerW - 30, qrContainerH - 30);
            DOMURL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        });
      } catch (err) {
        console.warn("QR embed issue:", err);
      }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR CODE VERIFIKASI RESMI SATPAM", w / 2, qrBoxY + 365);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Arahkan kamera smartphone atau scanner satpam untuk memverifikasi keabsahan surat", w / 2, qrBoxY + 405);
    ctx.textAlign = "left";

    // 8. Security Watermark & Sign-off Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Dokumen elektronik sah diterbitkan oleh Sistem Izin Sedayu • Kampus Asrama Mu'allimin Yogyakarta`, w / 2, cardY + cardH - 35);
    ctx.textAlign = "left";

    // Trigger Download PNG High Res
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `ePass_1080x1920_${passData.idIzin}_${(passData.namaSantri || "santri").replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 500);

    toast.dismiss(tId);
    toast.success("Kartu e-Pass Full HD (1080x1920) berhasil diunduh!");
  } catch (err) {
    console.error("Gagal membuat gambar e-Pass HD:", err);
    toast.dismiss(tId);
    toast.error("Gagal memproses gambar kartu e-Pass Full HD.");
  }
}

// Modal Pemindai Kamera QR Code (Html5Qrcode)
function QRScannerModal({ isOpen, onClose, onScanSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedId: string) => void;
}) {
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"camera" | "file">("camera");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDecoded = useCallback((decodedText: string) => {
    let id = decodedText.trim();
    if (id.includes("verify=")) {
      try {
        const url = new URL(id);
        id = url.searchParams.get("verify") || id;
      } catch {
        const match = id.match(/verify=([^&]+)/);
        if (match) id = match[1];
      }
    }

    // Haptic / Sound feedback
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {}

    // Stop scanner async
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
      } catch {}
      scannerRef.current = null;
    }

    onScanSuccess(id);
  }, [onScanSuccess]);

  useEffect(() => {
    if (!isOpen || activeTab !== "camera") return;
    let isMounted = true;
    const qrElementId = "qr-camera-stream";

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5Qrcode(qrElementId);
        scannerRef.current = scanner;

        // Try back camera first, fallback to any camera
        scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: Math.floor(minEdge * 0.75), height: Math.floor(minEdge * 0.75) };
            },
          },
          (decodedText) => {
            if (isMounted) {
              handleDecoded(decodedText);
            }
          },
          () => {}
        ).catch((err) => {
          console.warn("Camera back failed, trying any camera:", err);
          // Fallback to any user camera
          scanner.start(
            { facingMode: "user" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              if (isMounted) handleDecoded(decodedText);
            },
            () => {}
          ).catch((err2) => {
            console.warn("All camera start error:", err2);
            setError("Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan opsi 'Unggah Foto QR'.");
          });
        });
      } catch (e) {
        console.warn("QR init error:", e);
        setError("Inisialisasi pemindai kamera gagal.");
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {}
        scannerRef.current = null;
      }
    };
  }, [isOpen, activeTab, handleDecoded]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const tId = toast.loading("Memindai file gambar QR...");
    try {
      const html5QrCode = new Html5Qrcode("qr-file-processor");
      const decodedResult = await html5QrCode.scanFile(file, true);
      toast.dismiss(tId);
      handleDecoded(decodedResult);
    } catch (err) {
      console.error("Gagal membaca QR dari file:", err);
      toast.dismiss(tId);
      toast.error("Tidak ditemukan QR Code yang valid pada gambar tersebut.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm fade-up">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden max-w-sm w-full shadow-2xl">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Scan QR Surat Izin</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-2 bg-slate-100 flex gap-1 border-b border-slate-200">
          <button
            onClick={() => { setActiveTab("camera"); setError(""); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "camera" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" /> Kamera Live
          </button>
          <button
            onClick={() => {
              setActiveTab("file");
              if (scannerRef.current) {
                try { scannerRef.current.stop().catch(() => {}); } catch {}
                scannerRef.current = null;
              }
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "file" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" /> Unggah Foto QR
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === "camera" ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[260px] flex items-center justify-center border border-slate-800">
              <div id="qr-camera-stream" className="w-full" />
              {error && (
                <div className="absolute inset-0 p-6 bg-slate-900/95 text-white flex flex-col items-center justify-center text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                  <p className="text-xs text-rose-200">{error}</p>
                  <button
                    onClick={() => setActiveTab("file")}
                    className="mt-2 text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                  >
                    Gunakan Unggah Foto QR
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3 bg-slate-50">
              <div id="qr-file-processor" className="hidden" />
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Pilih Foto / Screenshot QR Code</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mendukung format JPG, PNG, WebP</p>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors btn-press shadow-sm inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 rotate-180" /> Pilih File Gambar
              </button>
            </div>
          )}

          <p className="text-center text-[11px] text-slate-500 font-medium">
            Arahkan kamera ke QR Code pada surat izin santri untuk memverifikasi secara instan.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── NavBar ─────────────────────────────────────────────────────
function NavBar({ setPage, currentUser, onLogout, onOpenScanner }: {
  setPage:(p:PageId)=>void; currentUser:UserSession|null; onLogout:()=>void; onOpenScanner:()=>void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 no-print">
      <div className="max-w-5xl mx-auto px-4 h-15 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <button onClick={()=>setPage("home")} className="flex items-center gap-2.5 btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1">
          <img src={logoBlue} alt="Logo Mu'allimin" className="h-8 w-auto object-contain"/>
        </button>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2">
          <button onClick={()=>setPage("scanner")}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors btn-press">
            <Camera className="w-4 h-4 text-emerald-600"/>
            <span>Pos Satpam</span>
          </button>
          
          <button onClick={()=>setPage("cards")}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors btn-press">
            <CreditCard className="w-4 h-4 text-amber-600"/>
            <span>Cetak Kartu</span>
          </button>

          <button onClick={()=>setPage("history")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors btn-press">
            <BarChart2 className="w-4 h-4 text-blue-600"/>
            <span className="hidden xs:inline">Riwayat</span>
          </button>

          <button onClick={()=>setPage("form")}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 transition-all btn-press shadow-sm">
            <Plus className="w-4 h-4"/>
            <span>Ajukan Izin</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </span>
                <span className="text-xs font-semibold text-emerald-900 max-w-[90px] truncate">{currentUser.name}</span>
              </div>
              <button onClick={onLogout} title="Keluar Akun"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors btn-press" aria-label="Keluar">
                <LogOut className="w-4 h-4"/>
              </button>
            </div>
          ) : (
            <button onClick={()=>setPage("login")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors btn-press">
              <UserCheck className="w-4 h-4 text-primary"/>
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── BottomNav ──────────────────────────────────────────────────
function BottomNav({ page, setPage }: { page: PageId; setPage:(p:PageId)=>void }) {
  const items = [
    { id: "home" as PageId, label: "Beranda", icon: Home },
    { id: "form" as PageId, label: "Ajukan", icon: Plus, highlight: true },
    { id: "history" as PageId, label: "Riwayat", icon: BarChart2 },
    { id: "scanner" as PageId, label: "Satpam", icon: Camera },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 no-print"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="flex flex-col items-center justify-center -mt-4 btn-press focus:outline-none"
              >
                <span className="w-12 h-12 rounded-2xl bg-primary text-white shadow-md flex items-center justify-center border-4 border-white transition-transform active:scale-95">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-primary mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors btn-press focus:outline-none
                ${active ? "text-primary font-bold" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Step Progress ──────────────────────────────────────────────
const STEP_LABELS = ["Santri","Jenis Izin","Waktu","Wali"];

function StepProgress({ step }: { step: number }) {
  return (
    <div className="px-5 pt-5 pb-5">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          const done  = s < step;
          const active = s === step;
          const isLast = i === STEP_LABELS.length - 1;
          return (
            <div key={s} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
              {/* Circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0
                  ${done   ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : active ? "bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-100 ring-4 ring-blue-50"
                  : "bg-white border-slate-200 text-slate-400"}`}>
                  {done ? <Check className="w-4 h-4"/> : s}
                </div>
                <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors
                  ${active ? "text-primary" : done ? "text-blue-400" : "text-slate-300"}`}>
                  {label}
                </span>
              </div>
              {/* Connector line between steps */}
              {!isLast && (
                <div className="flex-1 mx-2 mb-5">
                  <div className="h-0.5 w-full rounded-full bg-slate-100 relative overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500
                      ${done ? "w-full" : "w-0"}`}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page: Home ─────────────────────────────────────────────────
function PageHome({ setPage, setInitialJenis }: {
  setPage:(p:PageId)=>void;
  setInitialJenis:(j:JenisIzinKey)=>void;
}) {
  const [stats, setStats] = useState({ total:0, pending:0, approved:0, today:0 });

  useEffect(()=>{
    function updateStats(list: IzinRecord[]) {
      const t = todayISO();
      setStats({
        total:    list.length,
        pending:  list.filter(i=>i.status==="PENDING").length,
        approved: list.filter(i=>i.status==="APPROVED").length,
        today:    list.filter(i=>(i.createdAt||"").startsWith(t)||isToday(i.tanggalKeluar)).length,
      });
    }
    updateStats(getLocal());
    fetchRemoteData(false).then(data => {
      if (data && data.length > 0) updateStats(data);
    });
  },[]);

  function goForm(jenis: JenisIzinKey) {
    setInitialJenis(jenis);
    setPage("form");
  }

  // Dot-grid SVG pattern
  const dotGrid = `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Hero */}
      <section className="relative rounded-3xl overflow-hidden text-white"
        style={{background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#312e81 100%)"}}>
        <div className="absolute inset-0" style={{backgroundImage:dotGrid}}/>
        {/* glow blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{background:"radial-gradient(circle,#60a5fa,transparent)"}}/>
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{background:"radial-gradient(circle,#818cf8,transparent)"}}/>

        <div className="relative z-10 p-6 sm:p-8 space-y-5">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-blue-300 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
                Sistem Perizinan Resmi
              </div>
              <img src={logoWhite} alt="Logo Mu'allimin" className="h-8 w-auto object-contain opacity-90 flex-shrink-0"/>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Izin Keluar &amp; Pulang<br/>
              <span className="text-blue-300">Santri Asrama</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xs">
              Madrasah Mu'allimin Muhammadiyah Yogyakarta — Kampus Sedayu
            </p>
          </div>

          {/* Stats row */}
          {stats.total > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label:"Total",    val:stats.total,    icon:<ClipboardList className="w-3.5 h-3.5"/>, color:"text-blue-300" },
                { label:"Menunggu", val:stats.pending,  icon:<Clock className="w-3.5 h-3.5"/>,         color:"text-amber-300" },
                { label:"Disetujui",val:stats.approved, icon:<CheckCircle2 className="w-3.5 h-3.5"/>, color:"text-emerald-300" },
                { label:"Hari Ini", val:stats.today,    icon:<TrendingUp className="w-3.5 h-3.5"/>,    color:"text-indigo-300" },
              ].map(s=>(
                <div key={s.label} className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <span className={s.color}>{s.icon}</span>
                  <span className="text-lg font-extrabold leading-none">{s.val}</span>
                  <span className="text-[9px] text-white/60 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={()=>setPage("form")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors btn-press shadow-lg">
              <Plus className="w-4 h-4"/> Ajukan Izin Baru
            </button>
            <button onClick={()=>setPage("history")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors btn-press">
              <BarChart2 className="w-4 h-4 text-blue-300"/> Cek Status
            </button>
          </div>
        </div>
      </section>

      {/* 4 Jenis Izin — tap to open form with pre-selected type */}
      <section className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Pilih Jenis Izin Non-Rutin</p>
        <div className="grid grid-cols-2 gap-3">
          {JENIS_OPTIONS.map((j,i)=>(
            <button key={j.key} onClick={()=>goForm(j.key)}
              style={{"--delay":`${i*0.05}s`} as React.CSSProperties}
              className={`group relative flex items-start gap-3 p-4 rounded-2xl border-2 ${j.bg} ${j.border}
                text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
                fade-up`}
              >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${j.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white">{j.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm ${j.color}`}>{j.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{j.subtitle}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${j.color} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5`}/>
            </button>
          ))}
        </div>
      </section>

      {/* Routine Weekend Free Pass Section (Sabtu 15-17 & Ahad 07-11) */}
      <section className="bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 p-5 rounded-3xl border border-emerald-500/30 text-white space-y-3.5 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-xs shadow-sm">
              QR
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Izin Rutin Bebas Akhir Pekan (Tanpa Pengajuan)</h2>
              <p className="text-[11px] text-emerald-300">Sabtu: 15.00 – 17.00 • Ahad: 07.00 – 11.00</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Wajib Kartu QR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button onClick={() => setPage("scanner")}
            className="p-3.5 bg-slate-900/90 hover:bg-slate-800 rounded-2xl border border-emerald-500/40 text-left transition-all btn-press flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
              <Camera className="w-5 h-5"/>
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1">
                <span>Buka Scanner Pos Satpam</span>
                <span className="text-emerald-400">&rarr;</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Scan kartu santri saat keluar &amp; kembali gerbang</p>
            </div>
          </button>

          <button onClick={() => setPage("cards")}
            className="p-3.5 bg-slate-900/90 hover:bg-slate-800 rounded-2xl border border-amber-500/40 text-left transition-all btn-press flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
              <CreditCard className="w-5 h-5"/>
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1">
                <span>Cetak Kartu Santri QR</span>
                <span className="text-amber-400">&rarr;</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Ukuran KTP/ATM (85.6 &times; 54 mm) siap print A4</p>
            </div>
          </button>
        </div>
      </section>

      {/* Info cards row */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon:<Users className="w-5 h-5 text-blue-500"/>, val:`${santriData.length}+`, label:"Total Santri" },
          { icon:<Shield className="w-5 h-5 text-indigo-500"/>, val:"4 SOP", label:"Jenis Izin" },
          { icon:<Sparkles className="w-5 h-5 text-emerald-500"/>, val:"Resmi", label:"Terverifikasi" },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4 flex flex-col items-center gap-2 text-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-border flex items-center justify-center">{s.icon}</div>
            <span className="text-base font-extrabold text-foreground">{s.val}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Accordions */}
      <section className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Informasi SOP</p>
        <Accordion title="Kewenangan Persetujuan Izin">
          <ul className="space-y-2">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">M</span>
              <div><strong className="text-foreground">Musyrif Kelas:</strong> ACC izin keluar biasa &amp; pemeriksaan kesehatan</div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">P</span>
              <div><strong className="text-foreground">Pamong Asrama:</strong> ACC semua jenis perizinan termasuk menginap</div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">W</span>
              <div><strong className="text-foreground">Wali Santri:</strong> Dapat mengajukan — status menunggu persetujuan ustadz</div>
            </li>
          </ul>
        </Accordion>
        <Accordion title="Jadwal Bebas Pekanan">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
            <strong>Sabtu Sore:</strong> 15.30–17.00 &bull; <strong>Ahad Pagi:</strong> 06.30–11.00
          </div>
          <p>Santri boleh keluar tanpa surat izin pada jadwal rutin di atas.</p>
        </Accordion>
        <Accordion title="Ketentuan Izin Menginap">
          <p><strong className="text-foreground">1 Malam:</strong> Ajukan melalui form ini ke Pamong Asrama.</p>
          <p><strong className="text-foreground">2–3 Hari:</strong> Lampirkan surat permohonan resmi.</p>
          <p><strong className="text-foreground">&gt; 3 Hari:</strong> Surat kepada Direktur Madrasah diperlukan.</p>
        </Accordion>
      </section>

      <footer className="text-center pt-2 pb-4 text-xs text-muted-foreground">
        &copy; 2026 Madrasah Mu'allimin Muhammadiyah Yogyakarta
      </footer>
    </div>
  );
}

// ─── Form Input helpers ─────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}
function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full text-sm bg-white border border-border rounded-xl px-3 py-2.5
        focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all
        placeholder:text-slate-300 ${props.className||""}`}/>
  );
}
function SelectField({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={`w-full text-sm bg-white border border-border rounded-xl px-3 py-2.5
        focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all ${props.className||""}`}>
      {children}
    </select>
  );
}

// ─── Page: Form (Wizard) ────────────────────────────────────────
function PageForm({ currentUser, setPage, onSubmit, initialJenis }: {
  currentUser: UserSession|null; setPage:(p:PageId)=>void;
  onSubmit:(r:IzinRecord)=>void; initialJenis: JenisIzinKey;
}) {
  const [step, setStep]  = useState(1);
  const [dir,  setDir]   = useState<"fwd"|"back">("fwd");
  const [stepKey, setStepKey] = useState(0);

  // Step 1
  const [students, setStudents]   = useState<SelectedStudent[]>([]);
  const [query, setQuery]         = useState("");
  const [showSug, setShowSug]     = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Step 2
  const [jenis, setJenis] = useState<JenisIzinKey>(initialJenis);
  const [autoAdvancing, setAutoAdvancing] = useState(false);

  // Step 3
  const [keperluan, setKeperluan] = useState("");
  const [tujuan,    setTujuan]    = useState("");
  const [tglKeluar, setTglKeluar] = useState(todayISO());
  const [tglKembali,setTglKembali]= useState("");
  const [jamKeluar, setJamKeluar] = useState("08:00");
  const [jamKembali,setJamKembali]= useState("17:00");

  // Step 4
  const [namaWali,   setNamaWali]   = useState(()=>localStorage.getItem("last_wali_name")||"");
  const [alamatWali, setAlamatWali] = useState(()=>localStorage.getItem("last_wali_addr")||"");
  const [bedaPenjemput,setBedaPenjemput] = useState(false);
  const [namaPenjemput,setNamaPenjemput] = useState("");
  const [hubungan,   setHubungan]   = useState("Orang Tua (Ayah/Ibu)");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const role = getRole(currentUser);
  const approval = calcApproval(jenis, role);
  const duration = calcDuration(jamKeluar, jamKembali, jenis, tglKeluar, tglKembali);
  const overnight = jenis==="menginap"||jenis==="sakit";
  const jenisInfo = JENIS_OPTIONS.find(j=>j.key===jenis)!;

  const suggestions = useMemo(()=>{
    const q = query.trim().toLowerCase();
    if (q.length<2) return [];
    return santriData.filter(s=>s.name.toLowerCase().includes(q)).slice(0,7).map(s=>({
      name:s.name, classKey:s.class, classLabel:getClassLabel(s.class), musyrifName:getMusyrif(s.class).name,
    }));
  },[query]);

  useEffect(()=>{
    const fn = (e:MouseEvent)=>{ if(searchRef.current&&!searchRef.current.contains(e.target as Node)) setShowSug(false); };
    document.addEventListener("mousedown",fn);
    return ()=>document.removeEventListener("mousedown",fn);
  },[]);

  function nav(newStep: number, direction: "fwd"|"back") {
    setDir(direction);
    setStepKey(k=>k+1);
    setStep(newStep);
    setError("");
  }

  function goBack() { step===1 ? setPage("home") : nav(step-1,"back"); }

  function goNext() {
    if (step===1&&students.length===0) { setError("Pilih minimal 1 santri."); return; }
    if (step===3) {
      if (!keperluan.trim()) { setError("Isi keperluan izin."); return; }
      if (!tujuan.trim())    { setError("Isi tempat tujuan."); return; }
      
      if (!overnight) {
        // Validasi jam pada hari yang sama
        const m1 = String(jamKeluar).match(/(\d{1,2}):(\d{2})/);
        const m2 = String(jamKembali).match(/(\d{1,2}):(\d{2})/);
        if (m1 && m2) {
          const mins1 = parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
          const mins2 = parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
          if (mins2 <= mins1) {
            setError("Jam kembali harus setelah jam keluar (minimal 15 menit setelah jam keluar).");
            return;
          }
        }
      } else {
        if (tglKembali && tglKeluar && tglKembali < tglKeluar) {
          setError("Tanggal kembali tidak boleh sebelum tanggal keluar.");
          return;
        }
      }
    }
    nav(step+1,"fwd");
  }

  function addStudent(s: SelectedStudent) {
    if (students.some(x=>x.name.toLowerCase()===s.name.toLowerCase())) {
      toast.warning(`${s.name} sudah dipilih`); return;
    }
    setStudents(p=>[...p,s]);
    setQuery(""); setShowSug(false);
    if (!namaWali)   setNamaWali(`Bapak/Ibu Wali ${s.name.split(" ")[0]}`);
    if (!alamatWali) setAlamatWali("Yogyakarta");
  }

  function selectJenis(k: JenisIzinKey) {
    setJenis(k);
    setError("");
  }

  function handleSubmit() {
    if (!namaWali.trim())   { setError("Harap lengkapi nama wali santri."); return; }
    if (!alamatWali.trim()) { setError("Harap lengkapi kota / alamat asal."); return; }

    localStorage.setItem("last_wali_name", namaWali.trim());
    localStorage.setItem("last_wali_addr", alamatWali.trim());

    setSubmitting(true);
    const namaSantri = students.map(s=>s.name).join(", ");
    const kelas      = [...new Set(students.map(s=>s.classLabel))].join(", ");
    const musyrif    = students.length===1 ? getMusyrif(students[0].classKey) : null;

    // Logika penerbit & pemberi izin:
    let pemberiIzin = "-";
    let catatanAdmin = "";

    if (role === "orangtua") {
      pemberiIzin = "-";
      catatanAdmin = `Diajukan oleh Wali Santri (${namaWali.trim()})`;
    } else if (role === "pamong") {
      const pamongName = currentUser?.name ? `${currentUser.name} (Pamong Asrama)` : pamongData.name;
      pemberiIzin = pamongName;
      catatanAdmin = `Disetujui langsung oleh ${pamongName}`;
    } else if (role === "musyrif") {
      const musyrifName = currentUser?.name ? `${currentUser.name} (Musyrif Kelas)` : (musyrif?.name || "Ustadz Musyrif");
      if (approval.status === "APPROVED") {
        pemberiIzin = musyrifName;
        catatanAdmin = `Disetujui langsung oleh ${musyrifName}`;
      } else {
        pemberiIzin = "-";
        catatanAdmin = `Diajukan oleh ${musyrifName} (Menunggu ACC Pamong)`;
      }
    }

    const record: IzinRecord = {
      idIzin: genId(), namaSantri, kelas,
      jenisIzin: JENIS_IZIN_LABELS[jenis], status: approval.status,
      namaWali: namaWali.trim(), alamatWali: alamatWali.trim(),
      keperluan: keperluan.trim(), tujuan: tujuan.trim(),
      tanggalKeluar: tglKeluar, tanggalKembali: overnight?(tglKembali||tglKeluar):tglKeluar,
      jamKeluar, jamKembali,
      namaPenjemput:  bedaPenjemput ? (namaPenjemput.trim() || namaWali.trim()) : namaWali.trim(),
      hubunganPenjemput: bedaPenjemput ? hubungan : "Orang Tua (Ayah/Ibu)",
      pemberiIzin,
      catatanAdmin,
      createdAt: new Date().toISOString(),
    };
    saveLocal(record);
    setTimeout(()=>{ setSubmitting(false); onSubmit(record); toast.success("Surat izin berhasil diterbitkan!"); }, 500);
  }

  const animClass = dir==="fwd" ? "step-enter-fwd" : "step-enter-back";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">Formulir Perizinan Santri</h2>
            <p className="text-xs text-slate-500">Madrasah Mu'allimin Muhammadiyah Yogyakarta</p>
          </div>
          <button onClick={()=>setPage("home")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700" aria-label="Tutup form">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <StepProgress step={step}/>

        {/* Step content */}
        <div className="border-t border-slate-100">
          <div key={stepKey} className={`${animClass} p-6 space-y-5`}>

            {/* ── Step 1: Santri ── */}
            {step===1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Pilih Santri yang Mengajukan Izin</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Ketik nama santri di bawah untuk mencari data dari sistem.</p>
                </div>

                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <Input
                      value={query} autoFocus
                      onChange={e=>{setQuery(e.target.value);setShowSug(true);}}
                      onFocus={()=>setShowSug(true)}
                      placeholder="Ketik minimal 2 huruf nama santri..."
                      className="pl-10 pr-10"/>
                    {query && (
                      <button onClick={()=>{setQuery("");setShowSug(false);}}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-4 h-4"/>
                      </button>
                    )}
                  </div>

                  {showSug && suggestions.length>0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 fade-up">
                      {suggestions.map(s=>(
                        <button key={s.name} type="button" onMouseDown={()=>addStudent(s)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-slate-900 truncate">{s.name}</p>
                            <p className="text-[11px] text-slate-500">{s.classLabel} &bull; {s.musyrifName}</p>
                          </div>
                          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                            <Plus className="w-4 h-4"/>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSug && query.length>=2 && suggestions.length===0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-md z-50 px-4 py-4 text-center text-xs text-slate-500 fade-up">
                      Santri dengan nama "{query}" tidak ditemukan dalam data kelas.
                    </div>
                  )}
                </div>

                {students.length>0 ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-600">{students.length} santri dipilih:</p>
                    <div className="flex flex-wrap gap-2">
                      {students.map((s,i)=>(
                        <div key={i}
                          className="inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-900 scale-pop">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <span className="truncate max-w-[140px]">{s.name}</span>
                          <span className="text-[10px] font-normal text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-md">{s.classLabel}</span>
                          <button onClick={()=>setStudents(p=>p.filter((_,j)=>j!==i))}
                            className="hover:text-rose-600 transition-colors p-0.5" aria-label="Hapus santri">
                            <X className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5"/>
                    </div>
                    <p className="text-xs font-bold text-slate-600">Belum ada santri yang dipilih</p>
                    <p className="text-[11px] text-slate-400">Cari nama santri pada kotak pencarian di atas</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Jenis Izin ── */}
            {step===2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Pilih Kategori Perizinan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih kategori yang sesuai dengan keperluan santri, lalu klik <strong>Lanjut</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {JENIS_OPTIONS.map((j)=>{
                    const selected = jenis===j.key;
                    return (
                      <button key={j.key} type="button" onClick={()=>selectJenis(j.key)}
                        className={`relative flex items-center gap-3.5 p-4 rounded-xl border-2 text-left transition-all btn-press
                          ${selected ? "bg-blue-50/60 border-blue-600 ring-2 ring-blue-100 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${j.gradient} flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
                          {j.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-slate-900">{j.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{j.subtitle}</p>
                        </div>
                        {selected && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-blue-600"/>}
                      </button>
                    );
                  })}
                </div>

                <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium
                  ${approval.status==="APPROVED"?"bg-emerald-50 border-emerald-200 text-emerald-900":"bg-amber-50 border-amber-200 text-amber-900"}`}>
                  {approval.status==="APPROVED"
                    ?<CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600"/>
                    :<Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600"/>}
                  <span><strong>{approval.status==="APPROVED"?"Otoritas Persetujuan:":"Status Alur: "}</strong> {approval.text}</span>
                </div>
              </div>
            )}

            {/* ── Step 3: Waktu & Keperluan ── */}
            {step===3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Keperluan &amp; Jadwal Perizinan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lengkapi detail keperluan, tujuan, dan jam keluar-kembali santri.</p>
                </div>

                {/* Jenis badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
                  <span className="text-blue-600">{jenisInfo.icon}</span>
                  <span>{jenisInfo.title}</span>
                  <button onClick={()=>nav(2,"back")} className="text-blue-600 hover:underline text-[11px] font-bold ml-1">Ganti</button>
                </div>

                {/* SOP notice for specific types */}
                {jenis === "sakit" && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
                    <p>
                      <strong>Koordinasi Poskestren Wajib:</strong> Pemulangan karena sakit harus atas rekomendasi Dokter/Petugas Poskestren.
                    </p>
                  </div>
                )}

                {jenis === "menginap" && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"/>
                    <p>
                      <strong>Izin Menginap:</strong> Wewenang persetujuan izin bermalam di luar asrama berada pada Pamong Asrama / Wadir.
                    </p>
                  </div>
                )}

                {/* Quick fill chips */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600">Pilihan Keperluan Cepat:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(jenis === "keluar-biasa"
                      ? [
                          {label:"Acara Keluarga", kep:"Menghadiri acara keluarga penting (pernikahan, lelayu, dsb)", tuj:"Rumah Orang Tua / Wali"},
                          {label:"Keluarga Sakit", kep:"Keluarga inti sakit / kondisi keluarga mendesak", tuj:"Rumah Orang Tua / RS"},
                          {label:"Keperluan Madrasah", kep:"Keperluan madrasah mendesak", tuj:"Lokasi Keperluan Madrasah"},
                          {label:"Keperluan Mendesak", kep:"Keperluan mendesak yang harus keluar asrama", tuj:"Sesuai Lokasi Tujuan"},
                        ]
                      : jenis === "menginap"
                      ? [
                          {label:"Libur Semester", kep:"Pulang liburan semester ke rumah orang tua", tuj:"Rumah Orang Tua"},
                          {label:"Acara Keluarga", kep:"Menghadiri acara penting keluarga", tuj:"Rumah Orang Tua / Wali"},
                          {label:"Keperluan Medis", kep:"Pemeriksaan / pengobatan lanjutan yang tidak bisa selesai hari yang sama", tuj:"Rumah Sakit / Klinik"},
                          {label:"Keluarga Mendesak", kep:"Keperluan keluarga mendesak / darurat", tuj:"Rumah Orang Tua"},
                        ]
                      : jenis === "kesehatan"
                      ? [
                          {label:"Kontrol Rutin", kep:"Kontrol kesehatan rutin / cek up (kembali hari yang sama)", tuj:"Klinik / Puskesmas Terdekat"},
                          {label:"Gigi & Mulut", kep:"Pemeriksaan dan perawatan gigi", tuj:"Dokter Gigi / Klinik"},
                          {label:"Pemeriksaan Mata", kep:"Pemeriksaan mata dan pembuatan kacamata", tuj:"Optik / Dokter Mata"},
                          {label:"Rawat Jalan RS", kep:"Pemeriksaan di rumah sakit (kembali hari yang sama)", tuj:"RS PKU / RSUD Terdekat"},
                        ]
                      : [
                          {label:"Rawat Rumah", kep:"Perawatan di rumah atas rekomendasi Dokter Poskestren", tuj:"Rumah Orang Tua"},
                          {label:"Rawat Inap RS", kep:"Dirawat inap di rumah sakit atas rekomendasi Poskestren", tuj:"RS PKU / RSUD Terdekat"},
                          {label:"Tindakan Medis", kep:"Menjalani operasi / tindakan medis berdasar rekomendasi Poskestren", tuj:"Rumah Sakit"},
                          {label:"Observasi", kep:"Observasi kondisi kesehatan pasca sakit", tuj:"Rumah Orang Tua / Wali"},
                        ]
                    ).map(c=>(
                      <button key={c.label} type="button"
                        onClick={()=>{setKeperluan(c.kep);setTujuan(c.tuj);}}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors btn-press">
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label required>Detail Keperluan</Label>
                    <Input value={keperluan} onChange={e=>setKeperluan(e.target.value)}
                      placeholder={jenis==="keluar-biasa"?"Misal: acara keluarga, keperluan penting...":jenis==="menginap"?"Misal: acara keluarga, liburan semester...":jenis==="kesehatan"?"Misal: kontrol gigi, periksa mata...":"Misal: dirawat di rumah sakit..."}/>
                  </div>
                  <div>
                    <Label required>Tempat Tujuan</Label>
                    <Input value={tujuan} onChange={e=>setTujuan(e.target.value)}
                      placeholder={jenis==="keluar-biasa"?"Misal: Rumah Orang Tua, Toko Buku...":jenis==="menginap"?"Misal: Rumah Orang Tua di Solo...":jenis==="kesehatan"?"Misal: RS PKU Gamping...":"Misal: RS PKU / Rumah Orang Tua..."}/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Tanggal Keluar</Label>
                    <Input type="date" value={tglKeluar} onChange={e=>setTglKeluar(e.target.value)}/>
                  </div>
                  {overnight ? (
                    <div>
                      <Label required>Tanggal Kembali</Label>
                      <Input type="date" min={tglKeluar} value={tglKembali} onChange={e=>setTglKembali(e.target.value)}/>
                    </div>
                  ) : (
                    <div>
                      <Label>Durasi</Label>
                      <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs font-bold text-slate-700">
                        {duration || "Hari yang sama"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Jam Keluar</Label>
                    <SelectField value={jamKeluar} onChange={e=>setJamKeluar(e.target.value)}>
                      {TIME_SLOTS.map(t=><option key={t} value={t}>{t} WIB</option>)}
                    </SelectField>
                  </div>
                  <div>
                    <Label required>Jam Kembali</Label>
                    <SelectField value={jamKembali} onChange={e=>setJamKembali(e.target.value)}>
                      {TIME_SLOTS.map(t=><option key={t} value={t}>{t} WIB</option>)}
                    </SelectField>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Data Wali & Penjemput ── */}
            {step===4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Data Wali &amp; Penjemput Santri</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Pastikan identitas penanggung jawab santri telah terisi benar.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label required>Nama Wali Santri</Label>
                    <Input value={namaWali} onChange={e=>setNamaWali(e.target.value)} placeholder="Contoh: Bapak/Ibu Ahmad"/>
                  </div>
                  <div>
                    <Label required>Kota Asal / Alamat</Label>
                    <Input value={alamatWali} onChange={e=>setAlamatWali(e.target.value)} placeholder="Contoh: Yogyakarta / Solo / Jakarta"/>
                  </div>
                </div>

                {/* Toggle Penjemput */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Penjemput berbeda dengan Wali?</p>
                    <p className="text-[11px] text-slate-500">Aktifkan jika santri dijemput oleh pihak lain / keluarga selain wali</p>
                  </div>
                  <button type="button" onClick={()=>setBedaPenjemput(p=>!p)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${bedaPenjemput ? "bg-primary" : "bg-slate-300"}`}>
                    <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${bedaPenjemput ? "translate-x-5" : "translate-x-0"}`}/>
                  </button>
                </div>

                {bedaPenjemput && (
                  <div className="grid sm:grid-cols-2 gap-3 fade-up">
                    <div>
                      <Label required>Nama Penjemput</Label>
                      <Input value={namaPenjemput} onChange={e=>setNamaPenjemput(e.target.value)} placeholder="Nama penjemput..."/>
                    </div>
                    <div>
                      <Label required>Hubungan Penjemput</Label>
                      <SelectField value={hubungan} onChange={e=>setHubungan(e.target.value)}>
                        <option>Orang Tua (Ayah/Ibu)</option>
                        <option>Keluarga / Saudara Kandung</option>
                        <option>Wali Santri</option>
                        <option>Travel / Layanan Jemputan</option>
                        <option>Lainnya</option>
                      </SelectField>
                    </div>
                  </div>
                )}

                {/* Ringkasan Pengajuan */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600"/>
                    <span className="text-xs font-bold text-slate-900">Ringkasan Surat Perizinan</span>
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    {[
                      ["Santri", students.map(s=>s.name).join(", ")],
                      ["Jenis Izin", jenisInfo.title],
                      ["Keperluan", keperluan],
                      ["Tujuan", tujuan],
                      ["Waktu Keluar", `${fmtDate(tglKeluar)} — ${jamKeluar} WIB`],
                      ["Waktu Kembali", overnight ? `${fmtDate(tglKembali||tglKeluar)} — ${jamKembali} WIB` : `${jamKembali} WIB`],
                      ["Status Izin", approval.status==="APPROVED" ? "Disetujui Langsung (e-Pass Terbit)" : "Menunggu ACC Musyrif/Pamong"],
                    ].map(([k,v])=>(
                      <div key={k} className="flex gap-2">
                        <span className="text-slate-500 w-24 flex-shrink-0 font-medium">{k}:</span>
                        <span className="font-semibold text-slate-900 break-words flex-1">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>{/* /step content */}

          {/* Error Message banner */}
          {error && (
            <div className="mx-6 mb-3">
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold fade-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600"/>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button type="button" onClick={goBack}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors btn-press">
            <ArrowLeft className="w-4 h-4"/>
            <span>{step===1 ? "Batal" : "Kembali"}</span>
          </button>
          
          {step<4 ? (
            <button type="button" onClick={goNext} disabled={step===1&&students.length===0}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors btn-press disabled:opacity-40 shadow-sm">
              <span>Lanjut</span>
              <ChevronRight className="w-4 h-4"/>
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors btn-press disabled:opacity-40 shadow-sm">
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin"/>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4"/>
                  <span>Terbitkan Surat Izin</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page: Login ────────────────────────────────────────────────
function PageLogin({ setPage, onLogin }: { setPage:(p:PageId)=>void; onLogin:(u:UserSession)=>void }) {
  const [loginTab, setLoginTab] = useState<"wali" | "ustadz">("wali");
  const [searchSantri, setSearchSantri] = useState("");
  const [selectedSantri, setSelectedSantri] = useState<{name: string; class: string} | null>(null);
  const [namaWaliInput, setNamaWaliInput] = useState("");

  const santriResults = useMemo(() => {
    if (!searchSantri.trim() || searchSantri.length < 2) return [];
    const q = searchSantri.toLowerCase();
    return santriData.filter(s => s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q)).slice(0, 6);
  }, [searchSantri]);

  function handleWaliLogin() {
    if (!selectedSantri) {
      toast.error("Silakan cari dan pilih nama santri putra Anda terlebih dahulu.");
      return;
    }
    const waliTitle = namaWaliInput.trim() ? `${namaWaliInput.trim()}` : `Wali dari ${selectedSantri.name}`;
    onLogin({
      name: waliTitle,
      role: "wali",
      santriName: selectedSantri.name,
      santriClass: selectedSantri.class
    });
    toast.success(`Selamat datang, ${waliTitle}!`);
    setPage("history");
  }

  useEffect(() => {
    if (loginTab !== "ustadz") return;
    const btnContainer = document.getElementById("google-signin-btn");
    const clientId = GOOGLE_CLIENT_ID || "279330879292-5rc2mbk58k1k6rtm9pm4pq3jm4uiltb6.apps.googleusercontent.com";
    
    if ((window as any).google?.accounts?.id && btnContainer) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const payload = JSON.parse(jsonPayload);
                const email = (payload.email || '').toLowerCase().trim();
                const name = payload.name || email;

                // Server-aligned Whitelist validation
                const isPamong = pamongList.some(p => p.email.toLowerCase() === email || (p.altEmail && p.altEmail.toLowerCase() === email));
                const isMusyrif = Object.values(musyrifData).some(m => m.email?.toLowerCase() === email) ||
                                  koordinatorMusyrif.some(k => k.email.toLowerCase() === email) ||
                                  REGISTERED_EMAILS.some(e => e.toLowerCase() === email);

                if (isPamong) {
                  onLogin({ name: `${name} (Pamong Asrama)`, email, picture: payload.picture, role: "pamong" });
                  toast.success(`Selamat datang, ${name}! Login via Google sebagai Pamong.`);
                  setPage("history");
                } else if (isMusyrif) {
                  onLogin({ name: `${name} (Musyrif)`, email, picture: payload.picture, role: "musyrif" });
                  toast.success(`Selamat datang, ${name}! Login via Google sebagai Musyrif.`);
                  setPage("history");
                } else {
                  toast.error(`Email (${email}) belum terdaftar sebagai Musyrif atau Pamong resmi.`, { duration: 6000 });
                }
              } catch (err) {
                toast.error("Gagal memverifikasi token Google OAuth.");
              }
            }
          }
        });

        const containerWidth = Math.min(btnContainer.offsetWidth || 360, 400);
        (window as any).google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: containerWidth,
          text: "continue_with",
          shape: "pill"
        });
      } catch (e) {
        console.warn("GSI rendering error:", e);
      }
    }
  }, [loginTab]);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-6 bg-slate-900 text-white">
          <button onClick={()=>setPage("home")} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white mb-3 transition-colors btn-press">
            <ArrowLeft className="w-3.5 h-3.5"/> Beranda
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-300"/>
          </div>
          <h3 className="font-extrabold text-lg text-white">Pusat Akses &amp; Login</h3>
          <p className="text-xs text-slate-300 mt-0.5">Pilih tipe akses akun perizinan santri asrama</p>
        </div>

        {/* Tab Selector */}
        <div className="p-1.5 bg-slate-100 border-b border-slate-200 flex gap-1">
          <button
            onClick={() => setLoginTab("wali")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${loginTab === "wali" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Users className="w-4 h-4 text-blue-600" /> Wali Santri
          </button>
          <button
            onClick={() => setLoginTab("ustadz")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${loginTab === "ustadz" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Ustadz / Pamong
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loginTab === "wali" ? (
            /* WALI SANTRI LOGIN TAB */
            <div className="space-y-4 fade-up">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  Akses Khusus Wali Santri
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Cari dan pilih nama santri putra Anda untuk memantau status surat izin dan membuka tiket digital (e-Pass).
                </p>
              </div>

              {/* Santri Search Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Santri / Kelas</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchSantri}
                    onChange={(e) => {
                      setSearchSantri(e.target.value);
                      if (selectedSantri && e.target.value !== selectedSantri.name) {
                        setSelectedSantri(null);
                      }
                    }}
                    placeholder="Ketik minimal 2 huruf nama santri..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                  {searchSantri && (
                    <button onClick={() => { setSearchSantri(""); setSelectedSantri(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {searchSantri.length >= 2 && !selectedSantri && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 fade-up z-20 relative">
                    {santriResults.length === 0 ? (
                      <p className="p-3 text-xs text-slate-500 text-center">Nama santri tidak ditemukan.</p>
                    ) : (
                      santriResults.map((s) => (
                        <button
                          key={`${s.name}-${s.class}`}
                          type="button"
                          onClick={() => {
                            setSelectedSantri(s);
                            setSearchSantri(s.name);
                          }}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/70 flex items-center justify-between transition-colors"
                        >
                          <span className="text-xs font-bold text-slate-900">{s.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            Kelas {s.class}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Santri Badge */}
              {selectedSantri && (
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between fade-up">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {selectedSantri.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">{selectedSantri.name}</p>
                      <p className="text-[11px] text-emerald-700">Kelas: {selectedSantri.class}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                </div>
              )}

              {/* Nama Wali Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Wali (Opsional)</label>
                <input
                  type="text"
                  value={namaWaliInput}
                  onChange={(e) => setNamaWaliInput(e.target.value)}
                  placeholder="Contoh: Bapak/Ibu Ahmad"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
              </div>

              <button
                onClick={handleWaliLogin}
                disabled={!selectedSantri}
                className="w-full py-2.5 bg-primary hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all btn-press shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Masuk &amp; Buka Riwayat Santri</span>
              </button>
            </div>
          ) : (
            /* USTADZ / PAMONG LOGIN TAB */
            <div className="space-y-4 fade-up">
              <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-200">
                <p><strong className="text-slate-900">Musyrif / Pamong:</strong> Gunakan akun Google yang terdaftar resmi untuk menyetujui (ACC) atau menolak izin santri.</p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Autentikasi Akun Google</p>
                <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]" style={{minWidth:"280px"}}></div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0"/> Hak Akses Pengurus:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-blue-800 space-y-0.5">
                  <li>Email otomatis divalidasi dengan whitelist resmi Musyrif Kelas &amp; Pamong Asrama.</li>
                  <li>Musyrif berwenang ACC izin keluar biasa &amp; periksa kesehatan. Pamong berwenang ACC seluruh izin termasuk menginap.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page: Pass (Digital Permit Pass) ───────────────────────────
function PagePass({ passData, setPage, currentUser }: { 
  passData:IzinRecord|null; 
  setPage:(p:PageId)=>void; 
  currentUser:UserSession|null;
}) {
  if (!passData) return null;

  const isPengurus = !!currentUser && (currentUser.role === "musyrif" || currentUser.role === "pamong" || currentUser.role === "admin");

  const isApproved = passData.status === "APPROVED";
  const isRejected = passData.status === "REJECTED";
  const isReturned = passData.status === "RETURNED";
  const isPending  = passData.status === "PENDING";

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">

      {/* Back button */}
      <button onClick={()=>setPage("history")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors btn-press">
        <ArrowLeft className="w-4 h-4"/> Kembali ke Riwayat
      </button>

      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border scale-pop
        ${isApproved ? "bg-emerald-50 border-emerald-200 text-emerald-950" :
          isRejected ? "bg-rose-50 border-rose-200 text-rose-950" :
          isReturned ? "bg-blue-50 border-blue-200 text-blue-950" :
          "bg-amber-50 border-amber-200 text-amber-950"}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
          ${isApproved ? "bg-emerald-600 text-white" :
            isRejected ? "bg-rose-600 text-white" :
            isReturned ? "bg-blue-600 text-white" :
            "bg-amber-600 text-white"}`}>
          {isApproved ? <CheckCircle2 className="w-5 h-5"/> :
           isRejected ? <XCircle className="w-5 h-5"/> :
           isReturned ? <Check className="w-5 h-5"/> :
           <Clock className="w-5 h-5"/>}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs">
            {isApproved ? "Izin Disetujui (e-Pass Resmi Terbit)" :
             isRejected ? "Permohonan Izin Ditolak" :
             isReturned ? "Santri Telah Kembali ke Asrama" :
             "Menunggu Persetujuan (ACC)"}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5 truncate">
            {isApproved ? "Santri diizinkan keluar asrama sesuai jadwal" :
             isRejected ? (passData.catatanAdmin || "Izin tidak disetujui oleh ustadz") :
             isReturned ? "Telah tercatat kembali ke asrama" :
             "Menunggu konfirmasi Ustadz Musyrif / Pamong"}
          </p>
        </div>
      </div>

      {/* Official pass card */}
      <div 
        id="official-pass-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-300"/>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Madrasah Mu'allimin</p>
                <p className="text-sm font-extrabold text-white">
                  {isApproved ? "SURAT IZIN RESMI (e-PASS)" : isPending ? "BUKTI PENGAJUAN IZIN" : "SURAT PERIZINAN"}
                </p>
              </div>
            </div>
            <StatusBadge status={passData.status} size="md"/>
          </div>
          <p className="mt-2 font-mono text-[11px] text-blue-300">{passData.idIzin}</p>
        </div>

        {/* Main content */}
        <div className="p-5 space-y-4">

          {/* Santri highlight */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
              {passData.namaSantri.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-slate-900 truncate">{passData.namaSantri}</p>
              <p className="text-[11px] text-slate-500">{passData.kelas}</p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="space-y-1.5 text-xs">
            {[
              ["Jenis Izin",  passData.jenisIzin],
              ["Keperluan",   passData.keperluan],
              ["Tujuan",      passData.tujuan],
              ["Wali",        passData.namaWali],
              ["Penjemput",   `${passData.namaPenjemput} (${passData.hubunganPenjemput})`],
            ].map(([k,v])=>(
              <div key={k} className="flex gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0 font-medium">{k}:</span>
                <span className="font-semibold text-slate-900 break-words flex-1">{v}</span>
              </div>
            ))}
          </div>

          {/* Time block */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {label:"Keluar",  date:passData.tanggalKeluar, jam:cleanTimeOnly(passData.jamKeluar),  icon:<Calendar className="w-3.5 h-3.5"/>},
              {label:"Kembali", date:passData.tanggalKembali,jam:cleanTimeOnly(passData.jamKembali), icon:<CheckCircle2 className="w-3.5 h-3.5"/>},
            ].map(t=>(
              <div key={t.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                  {t.icon}<span className="text-[10px] font-bold uppercase">{t.label}</span>
                </div>
                <p className="text-xs font-bold text-slate-900">{fmtDate(t.date)}</p>
                <p className="text-base font-extrabold text-blue-600">{t.jam} <span className="text-[10px] font-normal text-slate-500">WIB</span></p>
              </div>
            ))}
          </div>

          {/* QR code OR Pending/Rejected Alert */}
          {isApproved ? (
            <div className="flex flex-col items-center gap-2.5 p-4 bg-slate-900 rounded-xl">
              <div className="p-2.5 bg-white rounded-xl shadow-xs flex items-center justify-center">
                <QRCodeSVG 
                  id="pass-qrcode-svg"
                  className="qr-code-svg"
                  value={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(passData.idIzin)}` : passData.idIzin} 
                  size={130} 
                  level="M" 
                  bgColor="#ffffff" 
                  fgColor="#000000"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">QR Verifikasi Satpam</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Arahkan kamera di pos gerbang keamanan</p>
              </div>
            </div>
          ) : isPending ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1.5">
              <Clock className="w-6 h-6 text-amber-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-amber-950">TIKET MASIH MENUNGGU ACC</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  QR Code Satpam akan aktif otomatis setelah disetujui (ACC) oleh Musyrif Kelas atau Pamong Asrama.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-1">
              <XCircle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-rose-950">SURAT IZIN TIDAK BERLAKU</p>
              <p className="text-[11px] text-rose-800">{passData.catatanAdmin || "Permohonan perizinan ditolak oleh Musyrif/Pamong."}</p>
            </div>
          )}

          {/* Pemberi izin / Penerbit Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0"/>
            <span className="text-[11px]">
              {isApproved ? (
                <>Disetujui: <strong className="text-slate-900">{passData.pemberiIzin && passData.pemberiIzin !== "-" ? passData.pemberiIzin : (passData.catatanAdmin || "Ustadz Pembina")}</strong></>
              ) : isRejected ? (
                <>Ditolak: <strong className="text-rose-700">{passData.catatanAdmin || "Oleh Ustadz Pembina"}</strong></>
              ) : (
                <>Diajukan: <strong className="text-slate-900">{passData.catatanAdmin || `Wali Santri (${passData.namaWali})`}</strong></>
              )}
            </span>
          </div>
        </div>

        {/* Multi-Musyrif WhatsApp Contact Badges ONLY if PENDING */}
        {isPending && findAllMusyrifByClass(passData.kelas).length > 1 && (
          <div className="px-5 pb-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-600">Hubungi Musyrif Kelas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {findAllMusyrifByClass(passData.kelas).map(m => (
                <button
                  key={m.key}
                  onClick={() => sendWhatsAppMessage(passData, false, m.number)}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition-colors flex items-center justify-between btn-press"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-950 truncate">{m.classLabel}</p>
                    <p className="text-[11px] text-emerald-800 truncate">{m.name}</p>
                  </div>
                  <Share2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0"/>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 px-5 pb-5 border-t border-slate-100 pt-3">
          {isRejected ? (
            <button onClick={()=>setPage("home")}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors btn-press">
              Kembali ke Beranda
            </button>
          ) : isPending ? (
            <div className="space-y-2">
              <button onClick={()=>sendWhatsAppMessage(passData, false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors btn-press shadow-sm">
                <Share2 className="w-4 h-4"/>
                <span>Hubungi Ustadz Musyrif via WhatsApp</span>
              </button>
              <button onClick={()=>setPage("history")}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors btn-press">
                <ClipboardList className="w-3.5 h-3.5 text-slate-600"/>
                <span>Pantau Status di Riwayat Izin</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>downloadPassImage(passData)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors btn-press shadow-sm">
                  <Download className="w-4 h-4"/> Simpan Gambar
                </button>
                <button onClick={()=>{
                  const url = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?verify=${passData.idIzin}` : passData.idIzin;
                  navigator.clipboard.writeText(url);
                  toast.success("Tautan verifikasi resmi berhasil disalin!");
                }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors btn-press shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-400"/>
                  <span>Salin Link</span>
                </button>
              </div>
              {isApproved && isPengurus && (
                <button onClick={()=>sendWhatsAppMessage(passData, true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors btn-press shadow-sm">
                  <Share2 className="w-3.5 h-3.5"/> Kirim ke Grup Satpam
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── History Card ───────────────────────────────────────────────
function HistoryCard({ item, currentUser, onApprove, onReject, onReturn, onViewPass }: {
  item:IzinRecord; currentUser:UserSession|null;
  onApprove:()=>void; onReject:()=>void; onReturn:()=>void;
  onViewPass?:(item:IzinRecord)=>void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPengurus = !!currentUser && (currentUser.role === "musyrif" || currentUser.role === "pamong" || currentUser.role === "admin");
  const leftColor: Record<StatusType,string> = {
    APPROVED:"border-l-emerald-500", PENDING:"border-l-amber-500",
    REJECTED:"border-l-rose-500",    RETURNED:"border-l-blue-500",
  };
  const names = item.namaSantri?.split(",").map(s=>s.trim()).filter(Boolean)||[];
  const jenisMeta = getJenisMeta(item.jenisIzin);
  const dateOut = fmtDate(item.tanggalKeluar);
  const dateIn = fmtDate(item.tanggalKembali || item.tanggalKeluar);
  const timeOut = fmtTime(item.jamKeluar);
  const timeIn = fmtTime(item.jamKembali);
  const overdue = isOverdue(item);

  const isApproved = item.status === "APPROVED";
  const isRejected = item.status === "REJECTED";
  const isReturned = item.status === "RETURNED";
  const isPending  = item.status === "PENDING";

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 border-l-[5px] ${leftColor[item.status as StatusType]||leftColor.PENDING} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-4 space-y-3">
        {/* Header: Student Name + Badges + Status */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Student Name */}
            <div className="flex flex-wrap items-center gap-1.5">
              {names.map((n, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {n.charAt(0)}
                  </span>
                  <span className="truncate max-w-[170px] sm:max-w-xs">{n}</span>
                </div>
              ))}
              {overdue && isApproved && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold text-[10px] animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> Overdue
                </span>
              )}
            </div>

            {/* Subline: Class, ID, Jenis Izin */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                {item.kelas}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                {item.idIzin}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${jenisMeta.bg} ${jenisMeta.border} ${jenisMeta.color}`}>
                {jenisMeta.title}
              </span>
            </div>
          </div>

          {/* Status Badge & Accordion Toggle */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={item.status as StatusType}/>
            <button onClick={()=>setExpanded(o=>!o)}
              title={expanded ? "Tutup detail" : "Lihat detail"}
              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded?"rotate-180":""}`}/>
            </button>
          </div>
        </div>

        {/* Schedule Box */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
              OUT
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Keluar</span>
              <p className="font-bold text-slate-800 text-xs truncate">{dateOut}</p>
              <p className="text-[11px] font-bold text-blue-600">{timeOut}</p>
            </div>
          </div>

          <div className="min-w-0 flex items-center gap-2 border-l border-slate-200 pl-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
              IN
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Kembali</span>
              <p className="font-bold text-slate-800 text-xs truncate">{dateIn}</p>
              <p className="text-[11px] font-bold text-emerald-600">{timeIn}</p>
            </div>
          </div>
        </div>

        {/* Keperluan & Tujuan */}
        <div className="text-xs space-y-1 bg-white pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-slate-400 font-medium flex-shrink-0 text-[11px]">Keperluan:</span>
            <span className="font-semibold text-slate-800 line-clamp-1">{item.keperluan || "-"}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-slate-400 font-medium flex-shrink-0 text-[11px]">Tujuan:</span>
            <span className="text-slate-700 font-medium truncate">{item.tujuan || "-"}</span>
          </div>
        </div>

        {/* Quick Access Action in Card */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {isApproved ? (
            <button
              onClick={() => onViewPass && onViewPass(item)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-press shadow-sm"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Lihat QR & e-Pass</span>
            </button>
          ) : isPending ? (
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu verifikasi
            </span>
          ) : isRejected ? (
            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Izin Ditolak
            </span>
          ) : (
            <button
              onClick={() => onViewPass && onViewPass(item)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors btn-press"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lihat Surat</span>
            </button>
          )}

          {/* Quick WA button ONLY when relevant */}
          {isPending ? (
            <button
              onClick={() => sendWhatsAppMessage(item, false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors btn-press shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WA Musyrif</span>
            </button>
          ) : isApproved && isPengurus ? (
            <button
              onClick={() => sendWhatsAppMessage(item, true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors btn-press shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim Grup Satpam</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Accordion Details */}
      {expanded && (
        <div className="px-4 py-3.5 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Data Wali & Penjemput</span>
              <p className="text-slate-700"><strong className="text-slate-900">Wali:</strong> {item.namaWali || "-"}</p>
              <p className="text-slate-700"><strong className="text-slate-900">Penjemput:</strong> {item.namaPenjemput ? `${item.namaPenjemput} (${item.hubunganPenjemput || "Wali"})` : item.namaWali || "-"}</p>
              {item.alamatWali && <p className="text-slate-700"><strong className="text-slate-900">Alamat:</strong> {item.alamatWali}</p>}
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status & Verifikasi</span>
              <p className="text-slate-700">
                <strong className="text-slate-900">Diajukan oleh:</strong> {item.catatanAdmin?.includes("Diajukan") ? item.catatanAdmin.replace("Diajukan oleh ", "") : (item.namaWali ? `Wali Santri (${item.namaWali})` : "Wali Santri")}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Pemberi Izin / ACC:</strong> {
                  isApproved
                    ? (item.pemberiIzin && item.pemberiIzin !== "-" ? item.pemberiIzin : (item.catatanAdmin || "Ustadz Pembina"))
                    : isRejected
                    ? (item.catatanAdmin || "Ditolak oleh Ustadz Pembina")
                    : isPending
                    ? "Menunggu ACC Ustadz"
                    : (item.catatanAdmin || "-")
                }
              </p>
              {item.catatanAdmin && !item.catatanAdmin.includes("Diajukan") && (
                <p className="text-slate-700"><strong className="text-slate-900">Riwayat:</strong> {item.catatanAdmin}</p>
              )}
            </div>
          </div>

          {/* Embedded QR Code in History for Approved or Returned */}
          {(isApproved || isReturned) && (
            <div className="p-3 bg-slate-900 rounded-2xl flex items-center justify-between gap-3 text-white">
              <div className="p-2 bg-white rounded-xl flex-shrink-0">
                <QRCodeSVG
                  value={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(item.idIzin)}` : item.idIzin}
                  size={64}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-white">QR Tiket Perizinan</p>
                <p className="text-[10px] text-slate-300">Scan untuk verifikasi di pos keamanan satpam</p>
              </div>
              <button
                onClick={() => onViewPass && onViewPass(item)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors btn-press shadow-sm flex-shrink-0"
              >
                Buka e-Pass
              </button>
            </div>
          )}

          {/* Rejection Notice Banner */}
          {isRejected && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Permohonan Izin Ditolak</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{item.catatanAdmin || "Izin tidak disetujui oleh Musyrif/Pamong Asrama."}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Action Buttons with Permission Check */}
      {currentUser && isPengurus && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2">
          {isPending && (
            canApprove(item, currentUser).allowed ? (
              <>
                <button onClick={onApprove}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors btn-press shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5"/> Setujui
                </button>
                <button onClick={onReject}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors btn-press shadow-sm">
                  <XCircle className="w-3.5 h-3.5"/> Tolak
                </button>
              </>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0"/> {canApprove(item, currentUser).reason}
              </span>
            )
          )}
          {isApproved && (
            <button onClick={onReturn}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-press shadow-sm">
              <RefreshCw className="w-3.5 h-3.5"/> Tandai Santri Kembali
            </button>
          )}
          {(isRejected || isReturned) && item.catatanAdmin && (
            <span className="text-xs text-slate-500 italic py-1.5">{item.catatanAdmin}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page: History ──────────────────────────────────────────────
function PageHistory({ currentUser, setPage, onLoginRequest, setPassData }: {
  currentUser:UserSession|null; setPage:(p:PageId)=>void; onLoginRequest:()=>void;
  setPassData: (r: IzinRecord) => void;
}) {
  const [items,      setItems]      = useState<IzinRecord[]>(() => getLocal());
  const [statusF,    setStatusF]    = useState<"all"|StatusType>("all");
  const [dateF,      setDateF]      = useState<"today"|"all">("all");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);

  const load = useCallback(()=>{
    setLoading(true);
    fetchRemoteData(false).then(data => {
      setItems(data);
      setLoading(false);
    });
  },[]);

  useEffect(()=>{ load(); },[load]);

  function approve(id:string) {
    if(!currentUser){toast.error("Login Musyrif diperlukan");return;}
    const approverLabel = `${currentUser.name} (${currentUser.role === 'pamong' ? 'Pamong Asrama' : 'Musyrif'})`;
    updateStatus(id, "APPROVED", `Disetujui oleh ${approverLabel}`, currentUser, approverLabel);
    setItems(getLocal()); toast.success(`Izin disetujui oleh ${currentUser.name}.`);
  }
  function reject(id:string) {
    if(!currentUser){toast.error("Login Musyrif diperlukan");return;}
    const rejectorLabel = `${currentUser.name} (${currentUser.role === 'pamong' ? 'Pamong Asrama' : 'Musyrif'})`;
    updateStatus(id, "REJECTED", `Ditolak oleh ${rejectorLabel}`, currentUser);
    setItems(getLocal()); toast.info(`Izin ditolak oleh ${currentUser.name}.`);
  }
  function returnItem(id:string) {
    if(!currentUser)return;
    const returnerLabel = `${currentUser.name} (${currentUser.role === 'pamong' ? 'Pamong Asrama' : 'Musyrif'})`;
    updateStatus(id, "RETURNED", `Santri telah kembali — dicatat oleh ${returnerLabel}`, currentUser);
    setItems(getLocal()); toast.success("Status: Santri Telah Kembali");
  }

  // Filter khusus: jika login sebagai Wali Santri, hanya tampilkan perizinan santri anaknya
  const filtered = useMemo(()=>{
    let r = items;
    if (currentUser?.role === "wali" && currentUser.santriName) {
      const sName = currentUser.santriName.toLowerCase();
      r = r.filter(i => i.namaSantri?.toLowerCase().includes(sName));
    }
    if(statusF!=="all") r=r.filter(i=>i.status===statusF);
    if(dateF==="today"){
      const t=r.filter(i=>isToday(i.tanggalKeluar)||isToday(i.tanggalKembali)||isToday(i.createdAt||""));
      if(t.length>0||r.length===0) r=t;
    }
    if(search.trim()){
      const q=search.toLowerCase();
      r=r.filter(i=>i.namaSantri?.toLowerCase().includes(q)||i.kelas?.toLowerCase().includes(q)||i.idIzin?.toLowerCase().includes(q));
    }
    return r;
  },[items,statusF,dateF,search,currentUser]);

  // Counts per status for badge
  const counts = useMemo(()=>({
    all:      filtered.length,
    PENDING:  filtered.filter(i=>i.status==="PENDING").length,
    APPROVED: filtered.filter(i=>i.status==="APPROVED").length,
    REJECTED: filtered.filter(i=>i.status==="REJECTED").length,
  }),[filtered]);

  const TAB_LABELS: {key:"all"|StatusType; label:string}[] = [
    {key:"all",      label:"Semua"},
    {key:"PENDING",  label:"Menunggu"},
    {key:"APPROVED", label:"Disetujui"},
    {key:"REJECTED", label:"Ditolak"},
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Auth state banner */}
      {currentUser ? (
        currentUser.role === "wali" ? (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 fade-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm">
                {currentUser.santriName ? currentUser.santriName.charAt(0) : "W"}
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">Santri: {currentUser.santriName} ({currentUser.santriClass})</p>
                <p className="text-[11px] text-blue-700">Login: {currentUser.name}</p>
              </div>
            </div>
            <button
              onClick={() => setPage("form")}
              className="text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-press shadow-sm flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Ajukan Izin
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl fade-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center font-extrabold text-emerald-700 text-base">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-900">{currentUser.name}</p>
                <p className="text-xs text-emerald-600">{currentUser.email || "Pengurus Asrama"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {counts.PENDING>0 && (
                <span className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full animate-pulse">
                  <Clock className="w-3.5 h-3.5"/>{counts.PENDING} Menunggu
                </span>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-border rounded-2xl">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4"/>
            </div>
            <span>Login Wali Santri untuk melihat riwayat santri putra Anda atau login Ustadz untuk persetujuan.</span>
          </div>
          <button onClick={onLoginRequest}
            className="flex-shrink-0 text-xs font-bold px-3.5 py-2 bg-primary text-white rounded-xl hover:bg-blue-700 transition-colors btn-press"
            style={{boxShadow:"0 2px 8px -2px rgba(37,99,235,0.35)"}}>
            Login
          </button>
        </div>
      )}

      {/* Filter card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden" style={{boxShadow:"0 2px 12px -4px rgba(15,23,42,0.08)"}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary"/> {currentUser?.role === "wali" ? `Riwayat Izin: ${currentUser.santriName}` : "Riwayat Perizinan"}
          </h2>
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-muted border border-border rounded-xl hover:bg-muted/80 transition-colors btn-press">
            <RefreshCw className={`w-3.5 h-3.5 ${loading?"animate-spin":""}`}/> Refresh
          </button>
        </div>

        <div className="px-5 py-3 space-y-3 border-b border-border">
          {/* Status tabs with badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {TAB_LABELS.map(tab=>{
              const count = tab.key==="all" ? counts.all : counts[tab.key as StatusType]||0;
              const active = statusF===tab.key;
              return (
                <button key={tab.key} onClick={()=>setStatusF(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all btn-press flex-shrink-0
                    ${active?"bg-primary text-white shadow-sm":"bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                  {count>0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active?"bg-white/25 text-white":"bg-slate-200 text-slate-600"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Date + search */}
          <div className="flex gap-2">
            <div className="flex bg-muted border border-border rounded-xl p-1 gap-0.5 flex-shrink-0">
              {(["today","all"] as const).map(d=>(
                <button key={d} onClick={()=>setDateF(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors btn-press
                    ${dateF===d?"bg-primary text-white shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
                  {d==="today"?"Hari Ini":"Semua"}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Cari nama, ID..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"/>
              {search && <button onClick={()=>setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3.5 h-3.5"/></button>}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-3">
          {loading ? (
            [1,2,3].map(i=>(
              <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-24" style={{animationDelay:`${i*0.08}s`}}/>
            ))
          ) : filtered.length===0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300"/>
              </div>
              <p className="font-bold text-foreground">Belum Ada Data</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusF!=="all"?"Tidak ada izin dengan status tersebut.":"Ajukan izin baru untuk melihat data di sini."}
              </p>
              {(statusF!=="all"||dateF!=="all") && (
                <button onClick={()=>{setStatusF("all");setDateF("all");}}
                  className="mt-4 text-xs font-bold px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-700 transition-colors btn-press">
                  Tampilkan Semua
                </button>
              )}
            </div>
          ) : (
            filtered.map((item,i)=>(
              <div key={item.idIzin} className="fade-up" style={{"--delay":`${i*0.04}s`} as React.CSSProperties}>
                <HistoryCard item={item} currentUser={currentUser}
                  onApprove={()=>approve(item.idIzin)}
                  onReject={()=>reject(item.idIzin)}
                  onReturn={()=>returnItem(item.idIzin)}
                  onViewPass={(rec) => {
                    setPassData(rec);
                    setPage("pass");
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page: Verify (Khusus Satpam / Pos Gerbang) ─────────────────
function PageVerify({ verifyId, setPage, currentUser }: {
  verifyId: string; setPage: (p: PageId) => void; currentUser: UserSession | null;
}) {
  const cleanId = (verifyId || "").trim().toLowerCase();
  const [item, setItem] = useState<IzinRecord | null>(() => {
    const list = getLocal();
    return list.find(x => x.idIzin?.trim().toLowerCase() === cleanId) || null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !getLocal().some(x => x.idIzin?.trim().toLowerCase() === cleanId);
  });

  useEffect(() => {
    if (!verifyId) return;
    const target = verifyId.trim().toLowerCase();
    const local = getLocal().find(x => x.idIzin?.trim().toLowerCase() === target);
    if (local) {
      setItem(local);
      setLoading(false);
    }
    fetchRemoteData(false).then(list => {
      const found = list.find(x => x.idIzin?.trim().toLowerCase() === target);
      if (found) setItem(found);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [verifyId]);

  function handleReturn() {
    if (!item) return;
    const returner = currentUser?.name ? `${currentUser.name} (${currentUser.role === 'pamong' ? 'Pamong' : 'Musyrif'})` : "Petugas Keamanan (Satpam)";
    updateStatus(item.idIzin, "RETURNED", `Santri telah kembali — diverifikasi oleh ${returner}`, currentUser);
    setItem(prev => prev ? { ...prev, status: "RETURNED", catatanAdmin: `Santri telah kembali — diverifikasi oleh ${returner}` } : null);
    toast.success("Status santri berhasil ditandai telah kembali!");
  }

  const overdue = item ? isOverdue(item) : false;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <button onClick={() => setPage("home")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors btn-press">
        <ArrowLeft className="w-4 h-4"/> Kembali ke Beranda
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400"/>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Verifikasi Resmi Satpam</p>
              <p className="text-xs font-extrabold text-white">Madrasah Mu'allimin Sedayu</p>
            </div>
          </div>
          <span className="font-mono text-xs text-blue-300">{verifyId}</span>
        </div>

        {/* Verification Status */}
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
            <p className="text-xs text-slate-500 font-medium">Memeriksa keaslian surat izin di database server...</p>
          </div>
        ) : !item ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6"/>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Surat Izin Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">ID Izin <span className="font-mono font-bold text-slate-700">{verifyId}</span> tidak terdaftar atau tidak valid.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Status Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              item.status === "RETURNED" ? "bg-blue-50 border-blue-200 text-blue-950" :
              item.status === "APPROVED" && overdue ? "bg-amber-50 border-amber-300 text-amber-950" :
              item.status === "APPROVED" ? "bg-emerald-50 border-emerald-200 text-emerald-950" :
              item.status === "PENDING" ? "bg-amber-50 border-amber-200 text-amber-950" :
              "bg-rose-50 border-rose-200 text-rose-950"
            }`}>
              {item.status === "RETURNED" ? <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0"/> :
               item.status === "APPROVED" && overdue ? <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 animate-bounce"/> :
               item.status === "APPROVED" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0"/> :
               item.status === "PENDING" ? <Clock className="w-5 h-5 text-amber-600 flex-shrink-0"/> :
               <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0"/>}
              <div className="min-w-0">
                <p className="font-extrabold text-xs">
                  {item.status === "RETURNED" ? "SANTRI SUDAH KEMBALI" :
                   item.status === "APPROVED" && overdue ? "DISETUJUI — LEWAT WAKTU (OVERDUE)" :
                   item.status === "APPROVED" ? "SURAT IZIN RESMI & AKTIF" :
                   item.status === "PENDING" ? "BELUM BERLAKU (MENUNGGU ACC)" :
                   "SURAT IZIN DITOLAK"}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {item.status === "RETURNED" ? "Santri telah masuk dan dicatat kembali ke asrama." :
                   item.status === "APPROVED" && overdue ? "Batas jadwal jam kembali santri sudah terlewati." :
                   item.status === "APPROVED" ? "Santri diizinkan keluar asrama sesuai jadwal." :
                   item.status === "PENDING" ? "Surat izin ini belum disetujui oleh Ustadz." :
                   "Izin keluar santri ini tidak disetujui."}
                </p>
              </div>
            </div>

            {/* Santri Data */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Santri</span>
                <span className="font-bold text-slate-900">{item.namaSantri}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Kelas</span>
                <span className="font-semibold text-slate-800">{item.kelas}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Jenis Izin</span>
                <span className="font-semibold text-blue-700">{item.jenisIzin}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Jadwal Keluar</span>
                <span className="font-semibold text-slate-800">{fmtDate(item.tanggalKeluar)} — {fmtTime(item.jamKeluar)}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Rencana Kembali</span>
                <span className="font-semibold text-slate-800">{fmtDate(item.tanggalKembali || item.tanggalKeluar)} — {fmtTime(item.jamKembali)}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Penjemput</span>
                <span className="font-semibold text-slate-800">{item.namaPenjemput || item.namaWali} ({item.hubunganPenjemput || "Wali"})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Disetujui Oleh</span>
                <span className="font-bold text-emerald-700">{item.pemberiIzin && item.pemberiIzin !== "-" ? item.pemberiIzin : item.catatanAdmin || "-"}</span>
              </div>
            </div>

            {/* Quick Action for Satpam */}
            {item.status === "APPROVED" && (
              <button
                onClick={handleReturn}
                className="w-full py-2.5 bg-primary hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all btn-press flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4"/> Tandai Santri Telah Kembali ke Asrama
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component: PageScanner (Pos Satpam Real-time Scanner HP/Desktop) ───────
interface RoutineLog {
  id: string; date: string; santriId: string; santriName: string;
  santriClass: string; sessionType: string; exitTime: string;
  returnTime: string; deadline: string; status: "DI_LUAR" | "KEMBALI" | "TERLAMBAT";
  lateMinutes: number;
}

function playSynthesizerBeep(type: 'out' | 'in_ontime' | 'late' | 'invalid') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'out') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'in_ontime') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'late') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(); osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

function PageScanner({ setPage }: { setPage: (p: PageId) => void }) {
  const [logs, setLogs] = useState<RoutineLog[]>(() => {
    try {
      const saved = localStorage.getItem("izin_sedayu_routine_logs");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [testMode, setTestMode] = useState(true);
  const [timeStr, setTimeStr] = useState("");
  const [manualText, setManualText] = useState("");
  const [lastScanned, setLastScanned] = useState<RoutineLog | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clock interval
  useEffect(() => {
    function tick() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem("izin_sedayu_routine_logs", JSON.stringify(logs));
  }, [logs]);

  // Session check (Sabtu 15-17 & Ahad 07-11)
  const sessionInfo = useMemo(() => {
    if (testMode) {
      return { active: true, name: "Mode Uji Coba (Bebas)", deadline: "17:00", deadlineHours: 17, deadlineMins: 0, type: "UJI_COBA" };
    }
    const now = new Date();
    const day = now.getDay();
    const timeDec = now.getHours() + (now.getMinutes() / 60);

    if (day === 6 && timeDec >= 15.0 && timeDec <= 17.0) {
      return { active: true, name: "Sesi Sabtu Sore (15.00 – 17.00)", deadline: "17:00", deadlineHours: 17, deadlineMins: 0, type: "SABTU_SORE" };
    }
    if (day === 0 && timeDec >= 7.0 && timeDec <= 11.0) {
      return { active: true, name: "Sesi Ahad Pagi (07.00 – 11.00)", deadline: "11:00", deadlineHours: 11, deadlineMins: 0, type: "AHAD_PAGI" };
    }
    return { active: false, name: "Di Luar Jam Izin Rutin", deadline: "-", type: "NONE" };
  }, [testMode, timeStr]);

  const sessionInfoRef = useRef(sessionInfo);
  useEffect(() => { sessionInfoRef.current = sessionInfo; }, [sessionInfo]);

  const logsRef = useRef(logs);
  useEffect(() => { logsRef.current = logs; }, [logs]);

  // Enumerate cameras
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label || `Kamera ${d.id}` })));
        setSelectedCameraId(devices[0].id);
      }
    }).catch(err => {
      console.warn("Camera enum err:", err);
    });
  }, []);

  const handleProcessScan = useCallback((rawInput: string) => {
    const text = rawInput.trim();
    if (!text) return;

    const nowTs = Date.now();
    if (lastScannedCodeRef.current.text === text && nowTs - lastScannedCodeRef.current.time < 1500) {
      return;
    }
    lastScannedCodeRef.current = { text, time: nowTs };

    const currentSession = sessionInfoRef.current;
    if (!currentSession.active) {
      toast.error("Saat ini di luar jam izin rutin akhir pekan. Aktifkan 'Mode Uji Coba' untuk simulasi.");
      playSynthesizerBeep('invalid');
      return;
    }

    let sId = "";
    let sName = "";
    let sClass = "";

    if (text.startsWith("IZIN|")) {
      const parts = text.split("|");
      sId = parts[1] || "";
      sName = parts[2] || "";
      sClass = parts[3] || "";
    } else {
      const found = santriData.find(s => s.name.toLowerCase() === text.toLowerCase() || text.includes(s.name));
      if (found) {
        sName = found.name;
        sClass = found.class;
        sId = `STD-${found.class}-MANUAL`;
      } else {
        sName = text;
        sClass = "-";
        sId = "STD-UNKNOWN";
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentTime = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const currentLogs = logsRef.current;
    const existingIndex = currentLogs.findIndex(l => 
      l.date === todayStr && 
      ((sId && l.santriId === sId) || l.santriName.toLowerCase() === sName.toLowerCase()) && 
      l.status === "DI_LUAR"
    );

    if (existingIndex === -1) {
      // 1. SCAN KELUAR
      const newEntry: RoutineLog = {
        id: "LOG-" + Date.now(),
        date: todayStr,
        santriId: sId,
        santriName: sName,
        santriClass: sClass,
        sessionType: currentSession.type,
        exitTime: currentTime,
        returnTime: "-",
        deadline: currentSession.deadline,
        status: "DI_LUAR",
        lateMinutes: 0
      };

      setLogs(prev => [newEntry, ...prev]);
      setLastScanned(newEntry);
      playSynthesizerBeep('out');
      toast.success(`Izin Keluar: ${sName} (Kelas ${sClass})`);
      syncToGAS(newEntry, 'CREATE_EXIT');
    } else {
      // 2. SCAN KEMBALI
      const entry = { ...currentLogs[existingIndex] };
      entry.returnTime = currentTime;

      const curH = now.getHours();
      const curM = now.getMinutes();
      let lateMin = 0;
      if (currentSession.deadlineHours !== undefined) {
        const deadlineMin = (currentSession.deadlineHours * 60) + (currentSession.deadlineMins || 0);
        const curTotalMin = (curH * 60) + curM;
        if (curTotalMin > deadlineMin) {
          lateMin = curTotalMin - deadlineMin;
        }
      }

      if (lateMin > 0) {
        entry.status = "TERLAMBAT";
        entry.lateMinutes = lateMin;
        playSynthesizerBeep('late');
        toast.warning(`TERLAMBAT ${lateMin} Menit: ${sName}!`);
      } else {
        entry.status = "KEMBALI";
        entry.lateMinutes = 0;
        playSynthesizerBeep('in_ontime');
        toast.success(`Kembali Tepat Waktu: ${sName}!`);
      }

      const updated = [...currentLogs];
      updated[existingIndex] = entry;
      setLogs(updated);
      setLastScanned(entry);
      syncToGAS(entry, 'UPDATE_RETURN');
    }

    setManualText("");
  }, []);

  const startCamera = async () => {
    setCameraError("");
    const elementId = "pos-satpam-stream";
    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (w: number, h: number) => {
          const edge = Math.min(w, h);
          return { width: Math.max(220, Math.floor(edge * 0.85)), height: Math.max(220, Math.floor(edge * 0.85)) };
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      const cameraConfig = selectedCameraId 
        ? selectedCameraId 
        : { facingMode: "environment" };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleProcessScan(decodedText);
        },
        () => {}
      ).catch(async () => {
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            handleProcessScan(decodedText);
          },
          () => {}
        );
      });

      setCameraActive(true);
    } catch (err: any) {
      console.error("Gagal start camera scanner:", err);
      setCameraError("Kamera tidak dapat diakses atau izin ditolak oleh browser.");
      setCameraActive(false);
      toast.error("Gagal menyalakan kamera scanner.");
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const tId = toast.loading("Memindai foto kartu QR...");
    try {
      const html5QrCode = new Html5Qrcode("pos-satpam-file-temp");
      const decodedResult = await html5QrCode.scanFile(file, true);
      toast.dismiss(tId);
      handleProcessScan(decodedResult);
    } catch (err) {
      console.error("Gagal scan file:", err);
      toast.dismiss(tId);
      toast.error("QR Code tidak terdeteksi pada gambar.");
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}); } catch {}
      }
    };
  }, []);

  function syncToGAS(logData: RoutineLog, actionType: string) {
    try {
      fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: JSON.stringify({
          action: "scan_rutin",
          actionType: actionType,
          logData: logData
        })
      }).catch(() => {});
    } catch {}
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.date === todayStr);
  const totalOut = todayLogs.length;
  const totalIn = todayLogs.filter(l => l.status === "KEMBALI" || l.status === "TERLAMBAT").length;
  const stillOut = todayLogs.filter(l => l.status === "DI_LUAR");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      
      {/* Header Banner - Standardized with App Theme */}
      <section className="relative rounded-2xl overflow-hidden bg-slate-900 text-white shadow-sm">
        <div className="p-5 sm:p-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              POS KEAMANAN &bull; SCANNER IZIN RUTIN
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Pemindai Kartu Santri
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              Izin Bebas Akhir Pekan (Sabtu 15.00–17.00 &bull; Ahad 07.00–11.00 WIB)
            </p>
          </div>

          {/* Live Clock & Session Status */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 text-right flex flex-col items-end">
            <span className="text-2xl font-extrabold font-mono tracking-wider text-emerald-300 leading-none">
              {timeStr}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-[11px] text-slate-200 flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-black/40 transition-colors">
                <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} className="rounded text-emerald-500"/>
                <span className="font-semibold">Uji Coba</span>
              </label>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5
                ${sessionInfo.active ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/40" : "bg-rose-500/25 text-rose-200 border-rose-400/40"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sessionInfo.active ? "bg-emerald-400" : "bg-rose-400"}`}/>
                {sessionInfo.name}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Camera & Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4 text-emerald-600"/>
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-slate-900">Kamera Pemindai</h2>
                <p className="text-[11px] text-slate-500">Arahkan kartu QR santri ke kamera</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Otomatis Keluar / Masuk
            </span>
          </div>

          {/* Camera Selector */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="text-xs text-slate-600 font-bold flex-shrink-0">Pilih Kamera:</label>
              <select
                value={selectedCameraId}
                onChange={e => setSelectedCameraId(e.target.value)}
                className="bg-white text-xs text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 outline-none flex-1">
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Viewport */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-200 min-h-[260px] flex items-center justify-center shadow-inner">
            <div id="pos-satpam-stream" className="w-full" />
            
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3 text-slate-400 bg-slate-900/95 z-10">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <Camera className="w-6 h-6"/>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Kamera Belum Aktif</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Nyalakan kamera untuk memindai kartu fisik santri</p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 p-6 bg-slate-950/95 text-white flex flex-col items-center justify-center text-center space-y-2 z-20">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
                <p className="text-xs text-rose-200 font-semibold">{cameraError}</p>
                <p className="text-[11px] text-slate-400">Pastikan izin kamera di browser telah diizinkan.</p>
              </div>
            )}
          </div>

          <div id="pos-satpam-file-temp" className="hidden" />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Camera Buttons */}
          <div className="flex gap-2">
            {!cameraActive ? (
              <button onClick={startCamera} className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 btn-press shadow-sm transition-colors">
                <Camera className="w-4 h-4"/> Aktifkan Kamera Scanner
              </button>
            ) : (
              <button onClick={stopCamera} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 btn-press shadow-sm transition-colors">
                Matikan Kamera
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 btn-press border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 rotate-180 text-slate-600" /> Unggah Foto QR
            </button>
          </div>

          {/* Manual Input / Barcode Scanner */}
          <div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleProcessScan(manualText); }}
                placeholder="Scan Barcode USB atau ketik Nama Santri..."
                className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary font-medium"
              />
              <button onClick={() => handleProcessScan(manualText)} className="absolute right-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg btn-press transition-colors">
                Proses
              </button>
            </div>
          </div>

          {/* Scanned Result Banner */}
          {lastScanned && (
            <div className={`p-3.5 rounded-xl border space-y-2 scale-pop
              ${lastScanned.status === "DI_LUAR" ? "bg-amber-50 border-amber-300" : lastScanned.status === "TERLAMBAT" ? "bg-rose-50 border-rose-300" : "bg-emerald-50 border-emerald-300"}`}>
              <div className="flex justify-between items-center pb-1.5 border-b border-black/5">
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold
                  ${lastScanned.status === "DI_LUAR" ? "bg-amber-500 text-slate-950" : lastScanned.status === "TERLAMBAT" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
                  {lastScanned.status === "DI_LUAR" ? "IZIN KELUAR (CHECK-OUT)" : lastScanned.status === "TERLAMBAT" ? `TERLAMBAT ${lastScanned.lateMinutes} MENIT` : "KEMBALI TEPAT WAKTU"}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {lastScanned.status === "DI_LUAR" ? lastScanned.exitTime : lastScanned.returnTime} WIB
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {lastScanned.santriName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs text-slate-900 truncate">{lastScanned.santriName}</h3>
                  <p className="text-[11px] text-slate-600">
                    <span className="text-emerald-700 font-bold">KELAS {lastScanned.santriClass}</span> &bull; {lastScanned.santriId}
                  </p>
                  <p className={`text-[11px] font-bold mt-0.5 ${lastScanned.status === "TERLAMBAT" ? "text-rose-700" : "text-amber-800"}`}>
                    {lastScanned.status === "DI_LUAR" ? `Batas Waktu Masuk: ${lastScanned.deadline} WIB` : lastScanned.status === "TERLAMBAT" ? "Melewati batas waktu!" : "Santri telah kembali ke asrama."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Counters & Outside List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Counters */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Keluar</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">{totalOut}</span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl shadow-xs">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Kembali</span>
              <span className="text-xl font-extrabold text-emerald-900 font-mono">{totalIn}</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl shadow-xs">
              <span className="text-[10px] text-amber-700 font-bold uppercase block">Di Luar</span>
              <span className="text-xl font-extrabold text-amber-900 font-mono">{stillOut.length}</span>
            </div>
          </div>

          {/* Outside List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Santri Sedang di Luar</h3>
                <p className="text-[10px] text-slate-400">Total: {stillOut.length} santri</p>
              </div>
              <button onClick={() => setPage("cards")} className="text-[11px] bg-slate-100 text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold border border-slate-200 transition-colors btn-press">
                Cetak Kartu
              </button>
            </div>

            <div className="overflow-y-auto max-h-[340px] space-y-2 pr-1">
              {stillOut.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5"/>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Semua santri sudah berada di dalam asrama.</p>
                </div>
              ) : (
                stillOut.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{s.santriName}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        <span className="text-blue-700 font-bold">Kls {s.santriClass}</span> &bull; Keluar: {s.exitTime} &bull; Batas: {s.deadline}
                      </p>
                    </div>
                    <button
                      onClick={() => handleProcessScan(s.santriName)}
                      className="px-3 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors btn-press flex-shrink-0 shadow-xs">
                      Scan Masuk
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component: PageCards (Cetak Kartu Santri QR ISO 85.6x54mm) ──
function getStudentCardDetails(santriClass: string) {
  const cls = (santriClass || "").toUpperCase();
  
  // 1. Musyrif & Wali Kelas
  const musyrif = musyrifData[santriClass as keyof typeof musyrifData] || { 
    name: "Ustadz Pembina Asrama", 
    number: "6285339213109",
    waliKelas: "-" 
  };

  // 2. Pamong Asrama
  let pamong = pamongList[3]; // default Ahnaf Lubab
  if (cls.startsWith("1") || cls.startsWith("2")) {
    pamong = pamongList[0]; // Ustadz M. Ismail Marzuq, S.Sos. (6285326693918)
  } else if (cls.startsWith("3") || cls.startsWith("4")) {
    pamong = pamongList[2]; // Ustadz Rais Yudhistira, Lc. (6281399548580)
  } else {
    pamong = pamongList[3]; // Ustadz Muh. Ahnaf Lubab, M.Pd. (6285779006160)
  }

  // 3. Nama Gedung Asrama
  let asramaName = "Asrama Sedayu";
  if (cls.startsWith("1")) asramaName = "Asrama 1 (KH. Ahmad Dahlan)";
  else if (cls.startsWith("2")) asramaName = "Asrama 2 (KH. AR Fachruddin)";
  else if (cls.startsWith("3")) asramaName = "Asrama 3 (Buya Syafii Maarif)";
  else if (cls.startsWith("4")) asramaName = "Asrama 4 (KH. Mas Mansur)";
  else if (cls.startsWith("5")) asramaName = "Asrama 5 (Ki Bagus Hadikusumo)";
  else if (cls.startsWith("6")) asramaName = "Asrama 6 (H. M. Yunus Anis)";

  return { musyrif, pamong, asramaName };
}

function formatCardPhone(num?: string) {
  if (!num) return "-";
  const c = num.replace(/[^0-9]/g, "");
  if (c.startsWith("62")) return "0" + c.slice(2);
  return c;
}

function PageCards({ setPage }: { setPage: (p: PageId) => void }) {
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const classList = useMemo(() => {
    const s = new Set<string>();
    santriData.forEach(item => { if (item.class) s.add(item.class); });
    return Array.from(s).sort();
  }, []);

  const filteredStudents = useMemo(() => {
    return santriData.filter((s) => {
      const matchClass = selectedClass === "ALL" || s.class === selectedClass;
      const matchName = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchName;
    });
  }, [selectedClass, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Top Filter Bar (No Print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm no-print">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Kelas:</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary">
              <option value="ALL">Semua Kelas</option>
              {classList.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Cari:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ketik nama santri..."
              className="text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary"
            />
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {filteredStudents.length} Santri
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPage("scanner")} className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors btn-press">
            📷 Scanner Satpam
          </button>
          <button onClick={() => window.print()} className="text-xs font-bold px-4 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white transition-all btn-press shadow-sm flex items-center gap-1.5">
            <Printer className="w-4 h-4"/> Cetak Kartu (A4 / PDF)
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-print-grid flex flex-wrap gap-4 justify-center">
        {filteredStudents.map((s, idx) => {
          const cleanClass = (s.class || "XX").replace(/[^a-zA-Z0-9]/g, "");
          const paddedIdx = String(idx + 1).padStart(4, "0");
          const santriId = `STD-${cleanClass}-${paddedIdx}`;
          const qrPayload = `IZIN|${santriId}|${s.name}|${s.class}`;
          const { musyrif, pamong, asramaName } = getStudentCardDetails(s.class);

          return (
            <div key={santriId} className="id-card">
              {/* Header */}
              <div className="card-header" style={{
                background: "linear-gradient(135deg, #064e3b 0%, #047857 65%, #059669 100%)",
                color: "white",
                padding: "1.8mm 3mm",
                display: "flex",
                alignItems: "center",
                gap: "2mm",
                borderBottom: "0.8mm solid #f59e0b"
              }}>
                <div style={{ width: "7.5mm", height: "7.5mm", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#047857", fontSize: "2.8mm", flexShrink: 0, boxShadow: "0 0.2mm 0.5mm rgba(0,0,0,0.2)" }}>
                  M
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "2.1mm", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.1 }}>
                    Madrasah Mu'allimin
                  </div>
                  <div style={{ fontSize: "1.5mm", fontWeight: 700, color: "#a7f3d0", letterSpacing: "0.03em", lineHeight: 1.1 }}>
                    KARTU IZIN ASRAMA SEDAYU
                  </div>
                </div>
                <div style={{ background: "#f59e0b", color: "#78350f", fontSize: "1.5mm", fontWeight: 900, padding: "0.6mm 1.6mm", borderRadius: "0.8mm", flexShrink: 0, letterSpacing: "0.02em" }}>
                  SABTU-AHAD
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "1.8mm 3mm", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "2.5mm", flex: 1, background: "linear-gradient(to bottom, #ffffff, #fcfdfd)" }}>
                {/* Left Data Details */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.6mm" }}>
                  {/* Student Name */}
                  <div>
                    <div style={{ fontSize: "1.3mm", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>NAMA SANTRI</div>
                    <div style={{ fontSize: "2.3mm", fontWeight: 900, color: "#064e3b", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </div>
                  </div>

                  {/* Class, NIS & Dorm */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5mm", flexWrap: "wrap", marginTop: "0.1mm" }}>
                    <span style={{ background: "#047857", color: "white", fontSize: "1.7mm", fontWeight: 900, padding: "0.3mm 1.4mm", borderRadius: "0.6mm" }}>
                      KELAS {s.class || "-"}
                    </span>
                    <span style={{ fontSize: "1.6mm", fontWeight: 700, color: "#334155", fontFamily: "monospace" }}>
                      {santriId}
                    </span>
                  </div>

                  {/* Asrama */}
                  <div style={{ fontSize: "1.45mm", color: "#475569", lineHeight: 1.15, marginTop: "0.3mm", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong style={{ color: "#0f172a" }}>Asrama:</strong> {asramaName}
                  </div>

                  {/* Musyrif Info */}
                  <div style={{ fontSize: "1.4mm", color: "#475569", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong style={{ color: "#0f172a" }}>Musyrif:</strong> {musyrif.name}
                    {musyrif.number && <span style={{ color: "#047857", fontWeight: 700, marginLeft: "1mm" }}>({formatCardPhone(musyrif.number)})</span>}
                  </div>

                  {/* Pamong Info */}
                  <div style={{ fontSize: "1.4mm", color: "#475569", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong style={{ color: "#0f172a" }}>Pamong:</strong> {pamong.name}
                    {pamong.number && <span style={{ color: "#0284c7", fontWeight: 700, marginLeft: "1mm" }}>({formatCardPhone(pamong.number)})</span>}
                  </div>
                </div>

                {/* Right QR Code Box */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: "0.8mm" }}>
                  <div style={{ width: "21mm", height: "21mm", background: "white", border: "0.5mm solid #cbd5e1", borderRadius: "1.5mm", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.6mm", boxShadow: "0 0.2mm 0.5mm rgba(0,0,0,0.06)" }}>
                    <QRCodeSVG value={qrPayload} size={74} fgColor="#064e3b" />
                  </div>
                  <span style={{ fontSize: "1.2mm", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    Scan Pos Satpam
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: "#f1f5f9", borderTop: "0.4mm solid #e2e8f0", padding: "1mm 3mm", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.3mm", color: "#475569", fontWeight: 700 }}>
                <span style={{ color: "#047857" }}>⏰ Sabtu 15-17 • Ahad 07-11 WIB</span>
                <span style={{ color: "#b45309" }}>Wajib Scan Keluar/Masuk</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────
export default function App() {
  const [verifyId,       setVerifyId]       = useState<string|null>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("verify") || null;
    }
    return null;
  });
  const [page,           setPage]           = useState<PageId>(() => verifyId ? "verify" : "home");
  const [currentUser,    setCurrentUser]    = useState<UserSession|null>(null);
  const [passData,       setPassData]       = useState<IzinRecord|null>(null);
  const [initialJenis,   setInitialJenis]   = useState<JenisIzinKey>("keluar-biasa");
  const [isScannerOpen,  setIsScannerOpen]  = useState<boolean>(false);

  // Global helper for opening scanner
  useEffect(() => {
    (window as any).__openQrScanner = () => setIsScannerOpen(true);
    return () => { delete (window as any).__openQrScanner; };
  }, []);

  useEffect(()=>{
    try {
      const s = localStorage.getItem("izin_user_session");
      if(s){ const u=JSON.parse(s); if(u?.name&&u?.email) setCurrentUser(u); }
    } catch {}

    // Initial full fetch
    fetchRemoteData(false);
    // Real-time sync every 3 seconds with incremental updates
    const timer = setInterval(() => {
      fetchRemoteData(true);
    }, 3000);
    return () => clearInterval(timer);
  },[]);

  function handleLogin(u: UserSession) {
    setCurrentUser(u);
    localStorage.setItem("izin_user_session",JSON.stringify(u));
    toast.success(`Selamat datang, ${u.name}!`);
  }
  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem("izin_user_session");
    toast.info("Berhasil keluar.");
    setPage("home");
  }
  function navigate(p: PageId) {
    setPage(p);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function handleScanSuccess(scannedId: string) {
    setIsScannerOpen(false);
    setVerifyId(scannedId);
    setPage("verify");
    toast.success(`QR Berhasil Dipindai: ${scannedId}`);
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="min-h-screen bg-background" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        <Toaster position="top-center" richColors closeButton expand={false}/>

        <NavBar 
          setPage={navigate} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        <main className="pb-24 md:pb-10">
          {page==="home"    && <PageHome setPage={navigate} setInitialJenis={setInitialJenis}/>}
          {page==="form"    && <PageForm currentUser={currentUser} setPage={navigate} initialJenis={initialJenis}
                                         onSubmit={r=>{setPassData(r);navigate("pass");}}/>}
          {page==="login"   && <PageLogin setPage={navigate} onLogin={handleLogin}/>}
          {page==="pass"    && <PagePass passData={passData} setPage={navigate} currentUser={currentUser}/>}
          {page==="history" && <PageHistory currentUser={currentUser} setPage={navigate} onLoginRequest={()=>navigate("login")} setPassData={setPassData}/>}
          {page==="verify"  && <PageVerify verifyId={verifyId || ""} setPage={navigate} currentUser={currentUser}/>}
          {page==="scanner" && <PageScanner setPage={navigate}/>}
          {page==="cards"   && <PageCards setPage={navigate}/>}
        </main>

        <BottomNav page={page} setPage={navigate}/>

        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      </div>
    </>
  );
}
