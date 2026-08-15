import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Building2, Plus, BarChart2, LogOut, Search, X, Check,
  CheckCircle2, Clock, XCircle, ChevronDown, FileText,
  Printer, Share2, Home, RefreshCw, ArrowLeft,
  UserCheck, ShieldCheck, Send, Wifi, WifiOff,
  Calendar, MapPin, User, Heart, Stethoscope, Moon,
  TrendingUp, Shield, AlertTriangle, Info, Bell,
  ChevronRight
} from "lucide-react";

// ─── Styles ────────────────────────────────────────────────────
const GLOBAL_CSS = `
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(22px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-22px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scalePop {
  0%   { transform: scale(0.9); opacity: 0; }
  65%  { transform: scale(1.04); }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@keyframes progressFill {
  from { width: 0%; }
}
.step-enter-fwd  { animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both; }
.step-enter-back { animation: slideInLeft  0.28s cubic-bezier(0.16,1,0.3,1) both; }
.fade-up         { animation: fadeUp       0.32s cubic-bezier(0.16,1,0.3,1) both;
                   animation-delay: var(--delay, 0s); }
.scale-pop       { animation: scalePop     0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
.live-dot        { animation: pulse-dot    1.8s ease-in-out infinite; }
.card-hover {
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.card-hover:hover {
  box-shadow: 0 10px 28px -6px rgba(15,23,42,0.13);
  transform: translateY(-2px);
}
.btn-press:active { transform: scale(0.96); }
.chip-active { box-shadow: 0 0 0 2px currentColor; }
input, select, textarea { font-family: inherit; }
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  body { background: white !important; }
}
`;

// ─── Types ─────────────────────────────────────────────────────
type PageId       = "home" | "form" | "login" | "pass" | "history";
type StatusType   = "PENDING" | "APPROVED" | "CHECKED_OUT" | "RETURNED" | "REJECTED";
type JenisIzinKey = "keluar-biasa" | "kesehatan" | "menginap" | "sakit";

interface Student         { name: string; class: string; }
interface SelectedStudent { name: string; classKey: string; classLabel: string; musyrifName: string; }
interface UserSession     { name: string; email: string; role: string; }
interface IzinRecord {
  idIzin: string; namaSantri: string; kelas: string; jenisIzin: string;
  status: StatusType; namaWali: string; alamatWali: string;
  keperluan: string; tujuan: string; tanggalKeluar: string;
  tanggalKembali: string; jamKeluar: string; jamKembali: string;
  namaPenjemput: string; hubunganPenjemput: string;
  pemberiIzin: string; catatanAdmin: string; createdAt?: string;
}

// ─── GAS Backend ───────────────────────────────────────────────
const GAS_URL = "https://script.google.com/macros/s/AKfycbwQnacuM2ZsgWYP20M9Gjwi--adZsNxzJk14IyH2l8iBuv_tKZCPPrYKdLeJhZhU7iz/exec";

// Timestamp of last successful remote fetch for incremental sync
let _lastFetchedAt = "";

async function fetchRemoteData(incremental = false): Promise<IzinRecord[]> {
  try {
    const params = new URLSearchParams({ action: "list" });
    if (incremental && _lastFetchedAt) params.append("since", _lastFetchedAt);
    const res = await fetch(`${GAS_URL}?${params}`);
    if (!res.ok) throw new Error("GAS error");
    const json = await res.json();
    _lastFetchedAt = new Date().toISOString();
    if (!Array.isArray(json?.data)) return getLocal();
    // Merge remote into local without clobbering local-only records
    const localList = getLocal();
    const remoteMap = new Map((json.data as IzinRecord[]).map(r => [r.idIzin, r]));
    const localMap  = new Map(localList.map(r => [r.idIzin, r]));
    remoteMap.forEach((v, k) => localMap.set(k, v));
    const merged = Array.from(localMap.values())
      .sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||""));
    localStorage.setItem("local_izin_list", JSON.stringify(merged.slice(0,500)));
    return merged;
  } catch {
    return getLocal();
  }
}

// ─── Config ─────────────────────────────────────────────────────
// Place your actual Google OAuth Client ID here:
const GOOGLE_CLIENT_ID = "";

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
    gradient: "from-blue-600 to-blue-500",
    accent: "#2563eb",
    bg: "bg-blue-50", border: "border-blue-200",
    color: "text-blue-700", ring: "ring-blue-300",
  },
  {
    key: "kesehatan" as JenisIzinKey,
    icon: <Stethoscope className="w-5 h-5" />,
    title: "Ke Dokter / RS",
    subtitle: "Pemeriksaan kesehatan",
    gradient: "from-emerald-600 to-teal-500",
    accent: "#059669",
    bg: "bg-emerald-50", border: "border-emerald-200",
    color: "text-emerald-700", ring: "ring-emerald-300",
  },
  {
    key: "menginap" as JenisIzinKey,
    icon: <Moon className="w-5 h-5" />,
    title: "Pulang / Menginap",
    subtitle: "Bermalam di luar asrama",
    gradient: "from-violet-600 to-indigo-500",
    accent: "#7c3aed",
    bg: "bg-violet-50", border: "border-violet-200",
    color: "text-violet-700", ring: "ring-violet-300",
  },
  {
    key: "sakit" as JenisIzinKey,
    icon: <Heart className="w-5 h-5" />,
    title: "Sakit – Rawat Rumah",
    subtitle: "Rekomendasi Poskestren",
    gradient: "from-rose-600 to-pink-500",
    accent: "#dc2626",
    bg: "bg-rose-50", border: "border-rose-200",
    color: "text-rose-700", ring: "ring-rose-300",
  },
] as const;

// Context-aware quick-fill chips per jenis
const QUICK_CHIPS: Record<JenisIzinKey, string[]> = {
  "keluar-biasa": ["Acara Keluarga", "Keluarga Sakit", "Keperluan Madrasah", "Kondisi Darurat", "Mengurus Dokumen"],
  "menginap":     ["Libur Semester", "Acara Keluarga", "Keperluan Medis", "Kondisi Darurat", "Pernikahan Saudara"],
  "kesehatan":    ["Kontrol Rutin", "Gigi & Mulut", "Mata", "Rawat Jalan RS", "THT"],
  "sakit":        ["Rawat Rumah", "Rawat Inap RS", "Operasi", "Observasi Dokter", "Demam Tinggi"],
};

// Context-aware placeholders per jenis
const KEPERLUAN_PLACEHOLDER: Record<JenisIzinKey, string> = {
  "keluar-biasa": "cth: Menghadiri acara wisuda kakak di Jl. Ringroad...",
  "menginap":     "cth: Libur semester, pulang ke rumah orang tua di Solo...",
  "kesehatan":    "cth: Kontrol gigi di RS Islam, jadwal 09:00...",
  "sakit":        "cth: Demam 3 hari, direkomendasikan Poskestren untuk rawat rumah...",
};

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

// ─── Inline Student Data ────────────────────────────────────────
const santriData: Student[] = [
  {name:"Agha Faeyza Barra",class:"1A"},{name:"Ahmad Ibrahim Al Mahmudi",class:"1A"},{name:"Almer Bahi Mahdy",class:"1A"},
  {name:"Ammar Abdul Aziz",class:"1A"},{name:"Attaya Fikri Rizqullah",class:"1A"},{name:"Bisma Pragaswara Suprapto",class:"1A"},
  {name:"Dava Ad Dzikri",class:"1A"},{name:"Dhio Itqon Ilmi Izzulhaqq",class:"1A"},{name:"Fajri Annaafi'u Alfarizi",class:"1A"},
  {name:"Fatih Al Faiz",class:"1A"},{name:"Fayzan Ghadi Safaraz",class:"1A"},{name:"Hafeez Azmi Muhammad",class:"1A"},
  {name:"Hakam Naja Hasan",class:"1A"},{name:"Harits Tammam Rahman",class:"1A"},{name:"Ibrohim Rofiq",class:"1A"},
  {name:"Iman Ashraf Athaillah",class:"1A"},{name:"Khenan Naufal Dary Abiyyu",class:"1A"},{name:"Mikail Ahmad Zaidan",class:"1A"},
  {name:"Muhammad Azmi An Najah",class:"1A"},{name:"Muhammad Hafis Makarim",class:"1A"},{name:"Muhammad Robii'ul Awwal",class:"1A"},
  {name:"Radhin Nabil Alauna",class:"1A"},{name:"Rafa Rizki Ramadhansyah Haris",class:"1A"},{name:"Rajendra Zhafran Arsaputra",class:"1A"},
  {name:"Salman Abqary Haidar Al Hanif",class:"1A"},{name:"Zidan Al Fatir Siregar",class:"1A"},
  {name:"A.Dinar Sayuto",class:"1B"},{name:"Adhyastha Ainur Rizky",class:"1B"},{name:"Aditya Giri Reksa Nu'aimi",class:"1B"},
  {name:"Alaika Syamil Al-Hadzik",class:"1B"},{name:"Arjuna Satria Pradipta",class:"1B"},{name:"Aryatama Febrian Danendra",class:"1B"},
  {name:"Faiz Fadhlurrahman",class:"1B"},{name:"Faqih Keyaanurasyid",class:"1B"},{name:"Fauzan Nur Hidayat",class:"1B"},
  {name:"Fazila Akbar Ikhlas",class:"1B"},{name:"Firnas Alfariel",class:"1B"},{name:"Hafizh Nizar Prasetya",class:"1B"},
  {name:"Ibrahim Al Azzam",class:"1B"},{name:"Ilian Badranaya El Qurafi",class:"1B"},{name:"Kenzo Zafran Al Abiyyu",class:"1B"},
  {name:"Lintang Mahardika",class:"1B"},{name:"Muhammad Alkhali Dzikri",class:"1B"},{name:"Muhammad Azzam Al Fatih",class:"1B"},
  {name:"Muhammad Elvin Ishahda",class:"1B"},{name:"Muhammad Farrel Anhar",class:"1B"},{name:"Naufal Afkar",class:"1B"},
  {name:"Nirwaseta Putra Purnama",class:"1B"},{name:"Raditya Asyam Adz Dzaqi",class:"1B"},{name:"Rakha Naufal Alfarisi",class:"1B"},
  {name:"Wildan Hawwari",class:"1B"},{name:"Zafran Ilham Sujati",class:"1B"},{name:"Zaky Fakhry Yanto",class:"1B"},
  {name:"Abdullah Alfaqih",class:"1C"},{name:"Ahlam Zulfadli Firdaus",class:"1C"},{name:"Ahmad Mumtaz Dhiya El Haq",class:"1C"},
  {name:"Arsyad Farkhi Ismail",class:"1C"},{name:"Kenzie Abdurahman Haziq",class:"1C"},{name:"Muhammad Azhar Nazhifurrahman",class:"1C"},
  {name:"Muhammad Hanif Adhinugraha",class:"1C"},{name:"Rafiandra Yusuf Al-Ghifari",class:"1C"},{name:"Raihan Nizar Daniswara",class:"1C"},
  {name:"Ahmad Amirul A'zam",class:"1D"},{name:"Athariz Zidane Ferdiansyah",class:"1D"},{name:"Azzam Fahrezzi Shaquille",class:"1D"},
  {name:"Fairel Atharizz Chalief",class:"1D"},{name:"Jaris Jalu Randita",class:"1D"},{name:"Salahuddin Nafis Al Farisi",class:"1D"},
  {name:"Abuwildan Najid Arrasyad",class:"1E"},{name:"Afif Agil Saputra",class:"1E"},{name:"Chelsea Safaraz Majiid",class:"1E"},
  {name:"Ibrahim Arkaan Dhiya Ulhaq",class:"1E"},{name:"Muhammad Lantang Wirayudha Akbar",class:"1E"},{name:"Syauqi Musyaffa Fikri",class:"1E"},
  {name:"Acapella Akbar Alhafizh Hartono",class:"1F"},{name:"Ahmad Kenzie Kayana",class:"1F"},{name:"Hamdan Pandega",class:"1F"},
  {name:"Latief Haziq Maulana",class:"1F"},{name:"Muhammad Naufal Rahman",class:"1F"},{name:"Zufar Calief Nurdaffa",class:"1F"},
  {name:"Adam Iskandar",class:"1G"},{name:"Ammar Tejananta Himawan",class:"1G"},{name:"Fatih Shuja Arkana",class:"1G"},
  {name:"Lisan Shidqie",class:"1G"},{name:"Muhammad Aksan Al Fatih",class:"1G"},{name:"Sultan Fizhansyah Fauzi",class:"1G"},
  {name:"Abid Tsaqif Atha Jati",class:"1LOWERA"},{name:"Ahza Danish Fahreza",class:"1LOWERA"},{name:"Fikri Nur Fauzan",class:"1LOWERA"},
  {name:"Muhammad Alfath Arroyyan",class:"1LOWERA"},{name:"Raufa Arkhan Akhtara",class:"1LOWERA"},
  {name:"Abimantrana Keitaro Jevera",class:"1LOWERB"},{name:"Daffa Mibras Ghosan",class:"1LOWERB"},{name:"Kai Raska Ibrahim",class:"1LOWERB"},
  {name:"Muhammad Haekal Abdullah Andreago",class:"1LOWERB"},{name:"Zaidan Arkaan Adisya",class:"1LOWERB"},
  {name:"Bara Habibi Tama",class:"1LOWERC"},{name:"Bilal Geno Al Ghaisan",class:"1LOWERC"},{name:"Ibnu Hafidz Elfathin",class:"1LOWERC"},
  {name:"Muhammad Haikal Akram",class:"1LOWERC"},{name:"Naufal Ahnaf Abqary",class:"1LOWERC"},
  {name:"Achmad Raffasya Izzudin Althafurrahman",class:"2A"},{name:"Ahmad Abdullah Azzam Syah",class:"2A"},{name:"Arta Nugraha",class:"2A"},
  {name:"Ghaisan Aidan Maheswara",class:"2A"},{name:"Haidar Azfar Abdurrahman",class:"2A"},{name:"Muhammad Faisal Abdurrahman",class:"2A"},
  {name:"Muhammad Mumtaz Al-Dzahabiy",class:"2A"},{name:"Nabil Abriansa",class:"2A"},{name:"Rafif Zikri Makarim",class:"2A"},
  {name:"Abhivandya Ahmad Hazmi Ardhie",class:"2B"},{name:"Ahmad Khayruddin Fahmi",class:"2B"},{name:"Al Wazif",class:"2B"},
  {name:"Athallah Sidqi As Sakha",class:"2B"},{name:"Dzaky Muhammad El Faiz",class:"2B"},{name:"Keanu Utsman Afrianto",class:"2B"},
  {name:"Muhammad Gibran Habiburrahman",class:"2B"},{name:"Naufal Fadhil Syahputra",class:"2B"},{name:"Rizky Mirza Abdillah",class:"2B"},
  {name:"Abdul Majid Siregar",class:"2C"},{name:"Ahmad Najwan Karnanda",class:"2C"},{name:"Kenzie Rafiandra Putra",class:"2C"},
  {name:"Muhammad Mahardika Al Ghozy",class:"2C"},{name:"Rayyan Nabil Al Faruq",class:"2C"},{name:"Zaverio Ozil Riyadi",class:"2C"},
  {name:"Abdullah Raya Nureno",class:"2D"},{name:"Alessandro El Fathih Siregar",class:"2D"},{name:"Fadhil Askar Parakas",class:"2D"},
  {name:"Gantheng Poerba Ilyasa",class:"2D"},{name:"Muhammad Hakam Tsaqif",class:"2D"},{name:"Hanan Rasyid Yunur",class:"2D"},
  {name:"Abdullah Hasni Bramapta",class:"2E"},{name:"Alif Alfarizqi Annur Rohman",class:"2E"},{name:"Dzaky Hariri Akbar Raziq",class:"2E"},
  {name:"Muhammad Fikra Avicena",class:"2E"},{name:"Muhammad Kurniawan Putranto",class:"2E"},{name:"Zora Phalosa Nareswara",class:"2E"},
  {name:"Affan Valerino Alfarisqy",class:"2F"},{name:"Azam Zufar Keyara",class:"2F"},{name:"Faiq Rosyad Habibie",class:"2F"},
  {name:"Muhammad Lais Chaniago",class:"2F"},{name:"Rafa Rajendra Wikrama",class:"2F"},{name:"Nuha Rayyan Mazaya",class:"2F"},
  {name:"Abdan Alimul Fikriy",class:"2G"},{name:"Ahmad Fitroh Ramadhan",class:"2G"},{name:"Muhammad Affan Wirasena",class:"2G"},
  {name:"Naraya Jagatsatria",class:"2G"},{name:"Rayhan Ibrahim Pratama Andrianto",class:"2G"},{name:"Uwais Al Qarni",class:"2G"},
  {name:"Achmad Azmi As Siddiq",class:"2H"},{name:"Ahza Dzaky Al-Fattah",class:"2H"},{name:"Fairuz Razqa El Bahri",class:"2H"},
  {name:"Lu'ay Rajendra Yogitaswara",class:"2H"},{name:"Muhammad Arfan Hamizan",class:"2H"},{name:"Zain Muhammad Yusuf",class:"2H"},
  {name:"Achmad Abiyyu Nur Afkari",class:"2LOWERA"},{name:"Aysar Muhammad Casey",class:"2LOWERA"},{name:"Surya Arga Bintara",class:"2LOWERA"},
  {name:"Ahmad Arsyad Amirudin",class:"2LOWERB"},{name:"Fatih Arelian Pradana",class:"2LOWERB"},{name:"Satrio Adli Anandito",class:"2LOWERB"},
  {name:"Abdullah Azzam Pratama",class:"2LOWERC"},{name:"Ahmad Fadlillah Kusuma Alby",class:"2LOWERC"},{name:"Reyhal Nabil Sunandar",class:"2LOWERC"},
  {name:"Abdul Ghani Irfan Rafif",class:"3A"},{name:"Ahmad Darwis",class:"3A"},{name:"Faiq Fauzil Adhim",class:"3A"},{name:"Muhammad Mahdi Hanafi",class:"3A"},
  {name:"Ahmad Fadhil Haris",class:"3B"},{name:"Muhammad Karim Fauzi",class:"3B"},{name:"Haris Fadlurrohman",class:"3B"},
  {name:"Azzam Abdullah Zaki",class:"4A"},{name:"Farhan Izzatul Islam",class:"4A"},{name:"Muhammad Iqbal Firmansyah",class:"4A"},
  {name:"Ahmad Zulfikar Ramadhan",class:"5A"},{name:"Hafidz Al Haq Maulana",class:"5A"},{name:"Rizal Maulana Syah",class:"5A"},
  {name:"Hamzah Ibrahim Pratama",class:"6A"},{name:"Muhammad Yusuf Hakim",class:"6A"},{name:"Omar Abdillah Fauzan",class:"6A"},
];

// ─── Musyrif / Pamong Data ──────────────────────────────────────
const musyrifData: Record<string, { name: string; email?: string }> = {
  "1A":{ name:"Ust. Ahmad Fauzi, S.Pd.",      email:"ahmad.fauzi@muallimin.sch.id" },
  "1B":{ name:"Ust. Budi Santoso, S.Ag.",     email:"budi.santoso@muallimin.sch.id" },
  "1C":{ name:"Ust. Cahyo Nugroho, M.Pd.",    email:"cahyo.nugroho@muallimin.sch.id" },
  "1D":{ name:"Ust. Doni Pratama, S.Pd.",     email:"doni.pratama@muallimin.sch.id" },
  "1E":{ name:"Ust. Eko Wibowo, S.Ag.",       email:"eko.wibowo@muallimin.sch.id" },
  "1F":{ name:"Ust. Faisal Rahman, M.Pd.",    email:"faisal.rahman@muallimin.sch.id" },
  "1G":{ name:"Ust. Ghani Putra, S.Pd.",      email:"ghani.putra@muallimin.sch.id" },
  "1LOWERA":{ name:"Ust. Hasan Basri",        email:"hasan.basri@muallimin.sch.id" },
  "1LOWERB":{ name:"Ust. Imam Ghazali",       email:"imam.ghazali@muallimin.sch.id" },
  "1LOWERC":{ name:"Ust. Joko Susilo",        email:"joko.susilo@muallimin.sch.id" },
  "2A":{ name:"Ust. Karim Abdullah, S.Pd.",   email:"karim.abdullah@muallimin.sch.id" },
  "2B":{ name:"Ust. Lutfi Hakim, M.Pd.",      email:"lutfi.hakim@muallimin.sch.id" },
  "2C":{ name:"Ust. Musa Al Amin, S.Ag.",     email:"musa.alamin@muallimin.sch.id" },
  "2D":{ name:"Ust. Nizar Fauzan, S.Pd.",     email:"nizar.fauzan@muallimin.sch.id" },
  "2E":{ name:"Ust. Omar Faruq, M.Pd.",       email:"omar.faruq@muallimin.sch.id" },
  "2F":{ name:"Ust. Purnomo Hadi, S.Ag.",     email:"purnomo.hadi@muallimin.sch.id" },
  "2G":{ name:"Ust. Qodir Amrullah",          email:"qodir.amrullah@muallimin.sch.id" },
  "2H":{ name:"Ust. Ridwan Saleh, S.Pd.",     email:"ridwan.saleh@muallimin.sch.id" },
};

// Koordinator Musyrif (can approve all types)
const koordinatorMusyrif = [
  { name:"Ust. Zainal Arifin, M.Pd.",   email:"zainal.arifin@muallimin.sch.id",    role:"koordinator-musyrif" },
  { name:"Ust. Syarif Hidayat, S.Ag.",  email:"syarif.hidayat@muallimin.sch.id",   role:"koordinator-musyrif" },
];

const pamongList = [
  { name:"Ust. Abdul Rahman, M.Pd.",    email:"abdul.rahman@muallimin.sch.id",     role:"pamong" },
  { name:"Ust. Wahyu Prasetyo, M.Ag.",  email:"wahyu.prasetyo@muallimin.sch.id",   role:"pamong" },
  { name:"Ust. Zulkifli Hasan, Dr.",    email:"zulkifli.hasan@muallimin.sch.id",   role:"pamong" },
];

// ─── LocalStorage Helpers ───────────────────────────────────────
function getLocal(): IzinRecord[] {
  try { return JSON.parse(localStorage.getItem("local_izin_list") || "[]"); } catch { return []; }
}

function saveLocal(item: IzinRecord) {
  const list = getLocal();
  if (!list.some(x => x.idIzin === item.idIzin)) {
    list.unshift(item);
    localStorage.setItem("local_izin_list", JSON.stringify(list.slice(0, 500)));
  }
  // Async POST to GAS (fire-and-forget)
  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", ...item }),
  }).catch(() => {});
}

function updateStatus(id: string, status: StatusType, note: string, user?: UserSession | null) {
  const list = getLocal();
  const f = list.find(x => x.idIzin === id);
  if (f) {
    f.status = status;
    f.catatanAdmin = note;
    localStorage.setItem("local_izin_list", JSON.stringify(list));
  }
  // Async sync to GAS
  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update", idIzin: id, status, catatan: note,
      userEmail: user?.email, userRole: user?.role,
    }),
  }).catch(() => {});
}

// ─── Utility Functions ──────────────────────────────────────────
function genId() {
  return `IZN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
}
function getClassLabel(k: string) { return CLASS_LABELS[k] || `Kelas ${k}`; }
function getMusyrif(k: string) { return musyrifData[k] || { name: "Ustadz Musyrif Pembina" }; }

function calcDuration(jk: string, jb: string, jenis: string, tl: string, tk: string) {
  if (!jk || !jb) return "";
  if (jenis === "menginap" || jenis === "sakit") {
    if (tl && tk && tl !== tk) {
      const diff = Math.round((new Date(tk).getTime() - new Date(tl).getTime()) / 86400000);
      return `${diff + 1} Hari (Bermalam)`;
    }
    return "1 Hari (Bermalam)";
  }
  const [h1, m1] = jk.split(":").map(Number);
  const [h2, m2] = jb.split(":").map(Number);
  let d = (h2*60+m2) - (h1*60+m1);
  if (d < 0) d += 1440;
  const h = Math.floor(d/60), m = d%60;
  return [h>0 && `${h} Jam`, m>0 && `${m} Menit`].filter(Boolean).join(" ") || "< 1 Menit";
}

function fmtDate(s: string) {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString("id-ID", { weekday:"short", day:"numeric", month:"short", year:"numeric" }); }
  catch { return s; }
}
function fmtDateLong(s: string) {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" }); }
  catch { return s; }
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isToday(s: string) { return !!s && s.startsWith(todayISO()); }

function getRole(user: UserSession | null): string {
  if (!user) return "orangtua";
  const r = user.role.toLowerCase();
  if (r.includes("pamong") || r.includes("direktur") || r.includes("wadir")) return "pamong";
  if (r.includes("koordinator")) return "koordinator-musyrif";
  if (r.includes("musyrif")) return "musyrif";
  return "orangtua";
}

function isOverdue(item: IzinRecord): boolean {
  if (item.status !== "CHECKED_OUT") return false;
  if (!item.tanggalKembali || !item.jamKembali) return false;
  try {
    const tgl = item.tanggalKembali;
    const d = new Date(tgl);
    if (!isNaN(d.getTime())) {
      const [hh, mm] = (item.jamKembali || "00:00").split(":").map(Number);
      d.setHours(hh || 0, mm || 0, 0, 0);
      return Date.now() > d.getTime();
    }
    return false;
  } catch {
    return false;
  }
}

function calcApproval(jenis: JenisIzinKey, role: string): { status: StatusType; text: string } {
  if (role === "pamong") {
    if (jenis === "sakit")
      return { status:"APPROVED", text:"Disetujui Pamong — pastikan koordinasi dengan Poskestren / Dokter terlebih dahulu." };
    if (jenis === "menginap")
      return { status:"APPROVED", text:"Disetujui Pamong Asrama — wajib informasikan ke grup koordinasi PKM." };
    return { status:"APPROVED", text:"Disetujui langsung oleh Pamong Asrama." };
  }
  if (role === "koordinator-musyrif") {
    return { status:"APPROVED", text:"Disetujui oleh Koordinator Musyrif — berlaku untuk semua jenis izin." };
  }
  if (role === "musyrif") {
    if (jenis === "keluar-biasa")
      return { status:"APPROVED", text:"Disetujui Musyrif Pembina — berlaku untuk perorangan maupun rombongan santri multi-kelas (ACC langsung)." };
    if (jenis === "kesehatan")
      return { status:"APPROVED", text:"Disetujui Musyrif Pembina — kontrol kesehatan hari yang sama." };
    if (jenis === "menginap")
      return { status:"PENDING", text:"SOP: Musyrif tidak berwenang untuk izin bermalam — wajib disetujui Pamong Asrama / Wadir IV." };
    if (jenis === "sakit")
      return { status:"PENDING", text:"SOP: Izin pulang sakit wajib rekomendasi Poskestren & persetujuan Pamong Asrama." };
  }
  return { status:"PENDING", text:"Menunggu verifikasi Musyrif Kelas atau Pamong Asrama. Harap tunggu konfirmasi." };
}

// ─── StatusBadge ────────────────────────────────────────────────
function StatusBadge({ status, isOverdue = false, size = "sm" }: { status: StatusType; isOverdue?: boolean; size?: "sm" | "md" }) {
  if (isOverdue && status === "CHECKED_OUT") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border bg-rose-50 text-rose-700 border-rose-300 animate-pulse
        ${size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}>
        <AlertTriangle className="w-3.5 h-3.5"/>⚠️ Terlambat
      </span>
    );
  }
  const map: Record<StatusType, { icon: React.ReactNode; cls: string; label: string }> = {
    APPROVED:    { icon:<CheckCircle2 className="w-3.5 h-3.5"/>, cls:"bg-emerald-50 text-emerald-700 border-emerald-200", label:"Disetujui" },
    PENDING:     { icon:<Clock className="w-3.5 h-3.5"/>,        cls:"bg-amber-50 text-amber-700 border-amber-200",       label:"Menunggu"  },
    CHECKED_OUT: { icon:<LogOut className="w-3.5 h-3.5"/>,       cls:"bg-indigo-50 text-indigo-700 border-indigo-200",    label:"Di Luar Asrama" },
    RETURNED:    { icon:<RefreshCw className="w-3.5 h-3.5"/>,    cls:"bg-blue-50 text-blue-700 border-blue-200",          label:"Sudah Kembali" },
    REJECTED:    { icon:<XCircle className="w-3.5 h-3.5"/>,      cls:"bg-rose-50 text-rose-700 border-rose-200",          label:"Ditolak"   },
  };
  const c = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${c.cls}
      ${size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ─── Accordion ──────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border text-sm text-muted-foreground space-y-2 fade-up">{children}</div>
      )}
    </div>
  );
}

// ─── NavBar ─────────────────────────────────────────────────────
function NavBar({ setPage, currentUser, onLogout, pendingCount, syncing }: {
  setPage: (p: PageId) => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  pendingCount?: number;
  syncing?: boolean;
}) {
  return (
    <nav className="sticky top-0 z-40 bg-white/92 backdrop-blur-lg border-b border-border"
      style={{ boxShadow:"0 1px 0 0 rgba(15,23,42,0.06)" }}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={() => setPage("home")} className="flex items-center gap-2.5 btn-press">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Building2 className="w-4 h-4 text-white"/>
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-sm text-foreground tracking-tight block leading-none">Izin Sedayu</span>
            <span className="text-[10px] text-muted-foreground">Mu'allimin Yogyakarta</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Live sync indicator */}
          {syncing !== undefined && (
            <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg
              ${syncing ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground bg-muted"}`}>
              {syncing
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot"/><Wifi className="w-3 h-3"/>Live</>
                : <><WifiOff className="w-3 h-3"/>Offline</>
              }
            </div>
          )}

          <button onClick={() => setPage("form")}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors btn-press shadow-sm">
            <Plus className="w-3.5 h-3.5"/> Ajukan Izin
          </button>

          <button onClick={() => setPage("history")}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors btn-press relative">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400"/> Cek Status
            {pendingCount! > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </span>
                <span className="text-xs font-semibold text-emerald-800 max-w-[80px] truncate">{currentUser.name}</span>
              </div>
              <button onClick={onLogout} title="Keluar"
                className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut className="w-4 h-4"/>
              </button>
            </div>
          ) : (
            <button onClick={() => setPage("login")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <UserCheck className="w-3.5 h-3.5 text-primary"/>
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── BottomNav ──────────────────────────────────────────────────
function BottomNav({ page, setPage, pendingCount }: {
  page: PageId; setPage: (p: PageId) => void; pendingCount?: number;
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md border-t border-border no-print"
      style={{ paddingBottom:"env(safe-area-inset-bottom,0px)", boxShadow:"0 -1px 0 0 rgba(15,23,42,0.06)" }}>
      <div className="flex items-center justify-around h-16 px-8">
        <button onClick={() => setPage("home")}
          className={`flex flex-col items-center gap-0.5 transition-all btn-press
            ${page === "home" ? "text-primary scale-105" : "text-muted-foreground"}`}>
          <Home className="w-5 h-5"/>
          <span className="text-[10px] font-semibold">Beranda</span>
        </button>

        <button onClick={() => setPage("form")} className="flex flex-col items-center gap-0.5 -mt-5 btn-press">
          <span className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex items-center justify-center"
            style={{ boxShadow:"0 8px 20px -4px rgba(37,99,235,0.5)" }}>
            <Plus className="w-6 h-6"/>
          </span>
          <span className="text-[10px] font-semibold text-primary mt-0.5">Ajukan</span>
        </button>

        <button onClick={() => setPage("history")}
          className={`flex flex-col items-center gap-0.5 transition-all btn-press relative
            ${page === "history" ? "text-primary scale-105" : "text-muted-foreground"}`}>
          <BarChart2 className="w-5 h-5"/>
          <span className="text-[10px] font-semibold">Status</span>
          {pendingCount! > 0 && (
            <span className="absolute -top-0.5 right-0 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ─── StepProgress ───────────────────────────────────────────────
const STEP_LABELS = ["Santri", "Jenis Izin", "Waktu & Keperluan", "Wali / Penjemput"];

function StepProgress({ step }: { step: number }) {
  const pct = ((step - 1) / (STEP_LABELS.length - 1)) * 100;
  return (
    <div className="px-5 pt-5 pb-4">
      <div className="relative h-1.5 bg-slate-100 rounded-full mb-4">
        <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width:`${pct}%` }}/>
        {STEP_LABELS.map((_, i) => {
          const s = i + 1;
          const done = s < step, active = s === step;
          return (
            <div key={s}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
              style={{ left:`${(i / (STEP_LABELS.length - 1)) * 100}%` }}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all duration-300
                ${done  ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                : active ? "bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-100 scale-110"
                : "bg-white border-slate-200 text-slate-400"}`}>
                {done ? <Check className="w-3 h-3"/> : s}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-0.5">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1, active = s === step, done = s < step;
          return (
            <span key={s}
              className={`text-[9.5px] font-semibold transition-colors leading-tight
                ${active ? "text-primary" : done ? "text-blue-400" : "text-slate-300"}`}
              style={{
                width:`${100 / STEP_LABELS.length}%`,
                textAlign: i === 0 ? "left" : i === STEP_LABELS.length - 1 ? "right" : "center",
              }}>
              {label.split(" ")[0]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page: Home ─────────────────────────────────────────────────
function PageHome({ setPage, setInitialJenis }: {
  setPage: (p: PageId) => void;
  setInitialJenis: (j: JenisIzinKey) => void;
}) {
  const [stats, setStats] = useState({ total:0, pending:0, approved:0, today:0 });

  useEffect(() => {
    const list = getLocal();
    const t = todayISO();
    setStats({
      total:    list.length,
      pending:  list.filter(i => i.status === "PENDING").length,
      approved: list.filter(i => i.status === "APPROVED").length,
      today:    list.filter(i => (i.createdAt || "").startsWith(t)).length,
    });
  }, []);

  function goForm(jenis: JenisIzinKey) {
    setInitialJenis(jenis);
    setPage("form");
  }

  const dotGrid = `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='rgba(255,255,255,0.07)'/%3E%3C/svg%3E")`;

  const statItems = [
    { label:"Hari Ini",  value:stats.today,    color:"text-blue-300", bg:"bg-blue-500/20" },
    { label:"Menunggu",  value:stats.pending,   color:"text-amber-300", bg:"bg-amber-500/20" },
    { label:"Disetujui", value:stats.approved,  color:"text-emerald-300", bg:"bg-emerald-500/20" },
    { label:"Total",     value:stats.total,     color:"text-slate-300", bg:"bg-white/10" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Hero */}
      <section className="relative rounded-3xl overflow-hidden text-white"
        style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#312e81 100%)" }}>
        <div className="absolute inset-0" style={{ backgroundImage:dotGrid }}/>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background:"radial-gradient(circle,#60a5fa,transparent)" }}/>
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background:"radial-gradient(circle,#a78bfa,transparent)" }}/>

        <div className="relative px-6 pt-7 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full mb-3">
                <Shield className="w-3.5 h-3.5 text-blue-300"/>
                <span className="text-[11px] font-bold text-blue-200 tracking-wide uppercase">Sistem Perizinan Resmi</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight mb-1">
                Ajukan Izin<br/>
                <span className="text-blue-300">Santri Mu'allimin</span>
              </h1>
              <p className="text-sm text-blue-200/80 leading-relaxed">
                Proses cepat, transparan, dan terdokumentasi digital.
              </p>
            </div>
            {/* Logo placeholder */}
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 ml-4">
              <Building2 className="w-6 h-6 text-blue-200"/>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {statItems.map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl px-3 py-3 text-center border border-white/10`}>
                <p className={`text-xl font-extrabold ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] text-white/50 font-medium mt-1 leading-none">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jenis Izin Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-sm text-foreground">Ajukan Izin Baru</h2>
          <span className="text-xs text-muted-foreground">Pilih jenis izin</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {JENIS_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => goForm(opt.key)}
              className={`relative text-left p-4 rounded-2xl border ${opt.border} ${opt.bg} card-hover btn-press overflow-hidden`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white mb-3 shadow-sm`}>
                {opt.icon}
              </div>
              <p className={`font-bold text-sm ${opt.color} leading-snug`}>{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.subtitle}</p>
              <ChevronRight className={`absolute bottom-3.5 right-3.5 w-4 h-4 ${opt.color} opacity-50`}/>
            </button>
          ))}
        </div>
      </section>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"/>
        <div className="text-xs text-blue-800">
          <p className="font-bold mb-1">Alur Perizinan Resmi</p>
          <p className="text-blue-700 leading-relaxed">Izin keluar biasa & kesehatan disetujui Musyrif Kelas. Izin menginap & sakit memerlukan persetujuan Pamong Asrama atau Wadir.</p>
        </div>
      </div>

      {/* Accordion FAQs */}
      <div className="space-y-2">
        <h2 className="font-extrabold text-sm text-foreground mb-2">Panduan & SOP</h2>
        <Accordion title="Siapa yang berwenang menyetujui izin?">
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li><strong>Musyrif Kelas:</strong> Izin keluar biasa dan pemeriksaan kesehatan.</li>
            <li><strong>Pamong Asrama / Wadir:</strong> Izin pulang menginap dan pemulangan karena sakit.</li>
            <li>Izin yang diajukan wali tanpa login akan berstatus <em>Menunggu</em> hingga diverifikasi.</li>
          </ul>
        </Accordion>
        <Accordion title="Apa itu Izin Keluar Biasa?">
          <p className="text-xs">Izin untuk keluar asrama dan kembali pada hari yang sama, misalnya untuk keperluan keluarga, acara, atau urusan non-medis di luar pesantren.</p>
        </Accordion>
        <Accordion title="Bagaimana proses izin sakit?">
          <p className="text-xs">Izin sakit harus dikoordinasikan terlebih dahulu dengan Poskestren / Dokter Pesantren. Setelah mendapat rekomendasi, ajukan melalui sistem ini. Pamong Asrama yang akan memberikan persetujuan akhir.</p>
        </Accordion>
        <Accordion title="Izin menginap perlu persetujuan apa?">
          <p className="text-xs">Izin bermalam/pulang ke rumah memerlukan persetujuan Pamong Asrama atau Wakil Direktur. Musyrif Kelas tidak berwenang menyetujui jenis izin ini.</p>
        </Accordion>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPage("history")}
          className="flex items-center gap-3 p-4 bg-white border border-border rounded-2xl card-hover btn-press shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-4 h-4 text-blue-400"/>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Riwayat Izin</p>
            <p className="text-xs text-muted-foreground">Lihat & setujui</p>
          </div>
        </button>
        <button onClick={() => setPage("login")}
          className="flex items-center gap-3 p-4 bg-white border border-border rounded-2xl card-hover btn-press shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-4 h-4 text-white"/>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Login Ustadz</p>
            <p className="text-xs text-muted-foreground">Musyrif / Pamong</p>
          </div>
        </button>
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-muted-foreground/60 pb-2">
        Madrasah Mu'allimin Muhammadiyah Yogyakarta &middot; Sistem Izin Sedayu v3
      </p>
    </div>
  );
}

// ─── Page: Form ─────────────────────────────────────────────────
function PageForm({ currentUser, setPage, initialJenis, onSubmit }: {
  currentUser: UserSession | null;
  setPage: (p: PageId) => void;
  initialJenis: JenisIzinKey;
  onSubmit: (r: IzinRecord) => void;
}) {
  const [step, setStep] = useState(1);
  const [dir,  setDir]  = useState<"fwd" | "back">("fwd");
  const [stepKey, setStepKey] = useState(0);

  // Step 1 – Student search
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<SelectedStudent[]>([]);

  // Step 2 – Jenis Izin
  const [jenis, setJenis] = useState<JenisIzinKey>(initialJenis);

  // Step 3 – Waktu & Keperluan
  const [tKeluar,  setTKeluar]  = useState(todayISO());
  const [tKembali, setTKembali] = useState(todayISO());
  const [jKeluar,  setJKeluar]  = useState("08:00");
  const [jKembali, setJKembali] = useState("17:00");
  const [keperluan, setKeperluan] = useState("");
  const [tujuan,    setTujuan]    = useState("");

  // Step 4 – Wali / Penjemput
  const [namaWali,          setNamaWali]          = useState(() => localStorage.getItem("izin_wali_nama") || "");
  const [alamatWali,        setAlamatWali]        = useState(() => localStorage.getItem("izin_wali_alamat") || "");
  const [namaPenjemput,     setNamaPenjemput]     = useState("");
  const [hubunganPenjemput, setHubunganPenjemput] = useState("Ayah");

  const inputRef = useRef<HTMLInputElement>(null);

  // When jenis is menginap/sakit, kembali date defaults to tomorrow
  useEffect(() => {
    if (jenis === "menginap" || jenis === "sakit") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setTKembali(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
    } else {
      setTKembali(tKeluar);
    }
  }, [jenis]);

  const searchResults = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return santriData
      .filter(s => s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  function addStudent(s: Student) {
    if (selected.some(x => x.name === s.name)) return;
    const musyrif = getMusyrif(s.class);
    setSelected(prev => [...prev, {
      name: s.name,
      classKey: s.class,
      classLabel: getClassLabel(s.class),
      musyrifName: musyrif.name,
    }]);
    setQuery("");
    inputRef.current?.focus();
  }

  function nav(nextStep: number) {
    setDir(nextStep > step ? "fwd" : "back");
    setStepKey(k => k + 1);
    setStep(nextStep);
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function canGoNext() {
    if (step === 1) return selected.length > 0;
    if (step === 3) return !!keperluan.trim() && !!tujuan.trim();
    if (step === 4) return !!namaWali.trim() && !!alamatWali.trim() && !!namaPenjemput.trim();
    return true;
  }

  function submit() {
    if (!canGoNext()) return;
    // Persist wali name/address for next time
    localStorage.setItem("izin_wali_nama",   namaWali);
    localStorage.setItem("izin_wali_alamat", alamatWali);

    const role = getRole(currentUser);
    const approval = calcApproval(jenis, role);
    const musyrif = getMusyrif(selected[0]?.classKey || "");

    const pemberi = currentUser
      ? currentUser.name
      : approval.status === "APPROVED"
        ? musyrif.name
        : "Sistem — Menunggu Verifikasi";

    const record: IzinRecord = {
      idIzin:           genId(),
      namaSantri:       selected.map(s => s.name).join(", "),
      kelas:            selected.map(s => s.classLabel).join(", "),
      jenisIzin:        JENIS_IZIN_LABELS[jenis],
      status:           approval.status,
      namaWali, alamatWali, keperluan, tujuan,
      tanggalKeluar:    tKeluar,
      tanggalKembali:   tKembali,
      jamKeluar:        jKeluar,
      jamKembali:       jKembali,
      namaPenjemput, hubunganPenjemput,
      pemberiIzin:      pemberi,
      catatanAdmin:     approval.text,
      createdAt:        new Date().toISOString(),
    };

    saveLocal(record);
    toast.success(approval.status === "APPROVED" ? "Izin disetujui!" : "Izin terkirim — menunggu verifikasi");
    onSubmit(record);
  }

  const jOption = JENIS_OPTIONS.find(o => o.key === jenis)!;
  const duration = calcDuration(jKeluar, jKembali, jenis, tKeluar, tKembali);

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => step > 1 ? nav(step - 1) : setPage("home")}
          className="w-9 h-9 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors btn-press flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-muted-foreground"/>
        </button>
        <div>
          <h1 className="font-extrabold text-base text-foreground leading-none">Formulir Izin Santri</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Langkah {step} dari {STEP_LABELS.length}</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden" style={{ boxShadow:"0 4px 24px -8px rgba(15,23,42,0.1)" }}>
        <StepProgress step={step}/>

        {/* Step body */}
        <div key={stepKey} className={step === 1 || step === 4 ? "fade-up" : dir === "fwd" ? "step-enter-fwd" : "step-enter-back"}>

          {/* ── Step 1: Santri ── */}
          {step === 1 && (
            <div className="px-5 pb-6 space-y-4">
              <div>
                <h2 className="font-extrabold text-base text-foreground mb-1">Pilih Santri</h2>
                <p className="text-xs text-muted-foreground">Cari nama santri atau kelas yang akan mengajukan izin.</p>
              </div>

              {/* Selected chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map(s => (
                    <span key={s.name}
                      className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {s.name.charAt(0)}
                      </span>
                      <span className="max-w-[120px] truncate">{s.name}</span>
                      <span className="text-blue-400 text-[10px]">({s.classLabel})</span>
                      <button onClick={() => setSelected(prev => prev.filter(x => x.name !== s.name))}
                        className="ml-0.5 text-blue-400 hover:text-rose-500 transition-colors">
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <input ref={inputRef} type="text" value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ketik nama atau kelas santri..."
                  className="w-full pl-10 pr-10 py-3 text-sm border border-border rounded-2xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all"/>
                {query && (
                  <button onClick={() => setQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4"/>
                  </button>
                )}
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-white">
                  {searchResults.map((s, i) => (
                    <button key={s.name} onClick={() => addStudent(s)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors btn-press
                        ${i > 0 ? "border-t border-border" : ""}`}>
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                        {s.name.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{getClassLabel(s.class)} &mdash; {getMusyrif(s.class).name}</p>
                      </div>
                      {selected.some(x => x.name === s.name) && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0"/>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 text-slate-200"/>
                  Tidak ada santri ditemukan.
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Jenis Izin ── */}
          {step === 2 && (
            <div className="px-5 pb-6 space-y-4">
              <div>
                <h2 className="font-extrabold text-base text-foreground mb-1">Jenis Izin</h2>
                <p className="text-xs text-muted-foreground">Pilih jenis izin yang sesuai dengan kebutuhan santri.</p>
              </div>
              <div className="space-y-2.5">
                {JENIS_OPTIONS.map(opt => {
                  const active = jenis === opt.key;
                  return (
                    <button key={opt.key}
                      onClick={() => {
                        setJenis(opt.key);
                        setTimeout(() => nav(3), 340);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all btn-press text-left
                        ${active
                          ? `${opt.border} ${opt.bg} ring-2 ${opt.ring}`
                          : "border-border bg-white hover:bg-slate-50"}`}>
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${active ? opt.color : "text-foreground"}`}>{opt.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.subtitle}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${active ? `border-current ${opt.color} bg-current` : "border-slate-200"}`}>
                        {active && <Check className="w-3 h-3 text-white"/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Waktu & Keperluan ── */}
          {step === 3 && (
            <div className="px-5 pb-6 space-y-4">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${jOption.bg} ${jOption.border} border mb-2`}>
                  <span className={`${jOption.color}`}>{jOption.icon}</span>
                  <span className={`text-xs font-bold ${jOption.color}`}>{jOption.title}</span>
                </div>
                <h2 className="font-extrabold text-base text-foreground mb-1">Waktu & Keperluan</h2>
                <p className="text-xs text-muted-foreground">Isi detail waktu keluar, tujuan, dan keperluan izin.</p>
              </div>

              {/* SOP Warning Banners */}
              {jenis === "sakit" && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-bold text-amber-800">Wajib Koordinasi Poskestren Terlebih Dahulu</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Sesuai SOP, pemulangan karena sakit harus dikoordinasikan dengan Poskestren / Dokter Pesantren.
                      Pastikan santri sudah diperiksa dan mendapat rekomendasi rawat rumah sebelum mengajukan izin ini.
                    </p>
                  </div>
                </div>
              )}
              {jenis === "menginap" && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-violet-50 border border-violet-200">
                  <Info className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-bold text-violet-800">Perlu Persetujuan Pamong / Wadir</p>
                    <p className="text-xs text-violet-700 mt-1 leading-relaxed">
                      Izin pulang/menginap tidak dapat disetujui oleh Musyrif Kelas.
                      Permohonan ini akan diteruskan ke Pamong Asrama atau Wakil Direktur untuk persetujuan akhir.
                    </p>
                  </div>
                </div>
              )}

              {/* Keperluan with quick chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Keperluan Izin</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS[jenis].map(chip => (
                    <button key={chip}
                      onClick={() => setKeperluan(chip)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all btn-press
                        ${keperluan === chip
                          ? `${jOption.bg} ${jOption.border} ${jOption.color} chip-active`
                          : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-slate-300"}`}>
                      {chip}
                    </button>
                  ))}
                </div>
                <textarea value={keperluan} onChange={e => setKeperluan(e.target.value)}
                  placeholder={KEPERLUAN_PLACEHOLDER[jenis]}
                  rows={2}
                  className="w-full px-3.5 py-3 text-sm border border-border rounded-2xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all resize-none"/>
              </div>

              {/* Tujuan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Alamat Tujuan</label>
                <input type="text" value={tujuan} onChange={e => setTujuan(e.target.value)}
                  placeholder={jenis === "kesehatan" || jenis === "sakit" ? "cth: RS PKU Muhammadiyah Yogyakarta" : "cth: Rumah orang tua, Jl. Magelang No. 12, Sleman"}
                  className="w-full px-3.5 py-3 text-sm border border-border rounded-2xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all"/>
              </div>

              {/* Tanggal Keluar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary"/> Tgl Keluar
                  </label>
                  <input type="date" value={tKeluar} min={todayISO()}
                    onChange={e => { setTKeluar(e.target.value); if (jenis !== "menginap" && jenis !== "sakit") setTKembali(e.target.value); }}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600"/> Tgl Kembali
                  </label>
                  <input type="date" value={tKembali} min={tKeluar}
                    onChange={e => setTKembali(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all"/>
                </div>
              </div>

              {/* Jam */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Jam Keluar</label>
                  <select value={jKeluar} onChange={e => setJKeluar(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all appearance-none">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t} WIB</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Jam Kembali</label>
                  <select value={jKembali} onChange={e => setJKembali(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all appearance-none">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t} WIB</option>)}
                  </select>
                </div>
              </div>

              {/* Duration */}
              {duration && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0"/>
                  <span className="text-xs font-semibold text-blue-700">Durasi: <strong>{duration}</strong></span>
                </div>
              )}

              {/* Santri summary */}
              {selected.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-border rounded-2xl">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Santri yang Mengajukan</p>
                  <div className="space-y-1.5">
                    {selected.map(s => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {s.name.charAt(0)}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-foreground">{s.name}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">{s.classLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Wali / Penjemput ── */}
          {step === 4 && (
            <div className="px-5 pb-6 space-y-4">
              <div>
                <h2 className="font-extrabold text-base text-foreground mb-1">Data Wali & Penjemput</h2>
                <p className="text-xs text-muted-foreground">Isi data wali dan penanggung jawab penjemputan santri.</p>
              </div>

              {/* Wali */}
              <div className="p-4 bg-slate-50 border border-border rounded-2xl space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Wali Santri</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nama Wali</label>
                  <input type="text" value={namaWali} onChange={e => setNamaWali(e.target.value)}
                    placeholder="cth: H. Ahmad Fauzan, S.E."
                    className="w-full px-3.5 py-3 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Alamat Wali</label>
                  <input type="text" value={alamatWali} onChange={e => setAlamatWali(e.target.value)}
                    placeholder="cth: Jl. Magelang No. 45, Sleman, DIY"
                    className="w-full px-3.5 py-3 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"/>
                </div>
              </div>

              {/* Penjemput */}
              <div className="p-4 bg-slate-50 border border-border rounded-2xl space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Penanggung Jawab Penjemputan</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nama Penjemput</label>
                  <input type="text" value={namaPenjemput} onChange={e => setNamaPenjemput(e.target.value)}
                    placeholder="Nama lengkap yang menjemput"
                    className="w-full px-3.5 py-3 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Hubungan dengan Santri</label>
                  <select value={hubunganPenjemput} onChange={e => setHubunganPenjemput(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all appearance-none">
                    {["Ayah","Ibu","Kakak","Adik","Paman","Bibi","Kakek","Nenek","Wali","Lainnya"].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Persetujuan preview */}
              {(() => {
                const role = getRole(currentUser);
                const ap = calcApproval(jenis, role);
                return (
                  <div className={`flex items-start gap-3 p-4 rounded-2xl border
                    ${ap.status === "APPROVED"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-amber-50 border-amber-200"}`}>
                    {ap.status === "APPROVED"
                      ? <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"/>
                      : <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>}
                    <div>
                      <p className={`text-xs font-bold ${ap.status === "APPROVED" ? "text-emerald-800" : "text-amber-800"}`}>
                        {ap.status === "APPROVED" ? "Akan Disetujui Otomatis" : "Menunggu Verifikasi"}
                      </p>
                      <p className={`text-xs mt-0.5 leading-relaxed ${ap.status === "APPROVED" ? "text-emerald-700" : "text-amber-700"}`}>
                        {ap.text}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-5 pb-5 flex gap-3 border-t border-border pt-4">
          {step > 1 && (
            <button onClick={() => nav(step - 1)}
              className="flex-1 py-3.5 border border-border rounded-2xl text-sm font-bold text-foreground hover:bg-muted transition-colors btn-press">
              Kembali
            </button>
          )}
          {step < STEP_LABELS.length ? (
            <button onClick={() => nav(step + 1)} disabled={!canGoNext()}
              className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors btn-press disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow:canGoNext() ? "0 4px 16px -4px rgba(37,99,235,0.4)" : "none" }}>
              Lanjutkan
            </button>
          ) : (
            <button onClick={submit} disabled={!canGoNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors btn-press disabled:opacity-40"
              style={{ boxShadow:canGoNext() ? "0 4px 16px -4px rgba(37,99,235,0.4)" : "none" }}>
              <Send className="w-4 h-4"/> Kirim Permohonan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page: Login ─────────────────────────────────────────────────
// JWT decode helper (minimal, no crypto verification)
function decodeJwt(token: string): Record<string, string> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

function PageLogin({ setPage, onLogin }: {
  setPage: (p: PageId) => void;
  onLogin: (u: UserSession) => void;
}) {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load GSI script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => {
          const payload = decodeJwt(resp.credential);
          if (!payload?.email) { toast.error("Gagal membaca data akun Google."); return; }

          const email = payload.email.toLowerCase();
          const name  = payload.name || email;

          // Check pamong list
          const pamong = pamongList.find(p => p.email === email);
          if (pamong) { onLogin({ name: pamong.name, email, role: "pamong" }); setPage("history"); return; }

          // Check koordinator musyrif
          const kord = koordinatorMusyrif.find(k => k.email === email);
          if (kord) { onLogin({ name: kord.name, email, role: "koordinator-musyrif" }); setPage("history"); return; }

          // Check musyrif
          const musyrifEntry = Object.entries(musyrifData).find(([, v]) => v.email === email);
          if (musyrifEntry) {
            const [classKey, m] = musyrifEntry;
            onLogin({ name: m.name, email, role: `musyrif-${classKey}` }); setPage("history"); return;
          }

          toast.error("Email tidak terdaftar. Hubungi admin sistem.");
        },
      });
      if (googleBtnRef.current) {
        g.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard", theme: "outline", size: "large",
          text: "signin_with", shape: "rectangular", width: 320,
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  function loginDev(role: string) {
    if (role === "pamong") {
      onLogin({ name: pamongList[0].name, email: pamongList[0].email, role: "pamong" });
    } else if (role === "musyrif") {
      if (!selectedClass) { toast.error("Pilih kelas musyrif terlebih dahulu."); return; }
      const m = musyrifData[selectedClass];
      if (!m) { toast.error("Data musyrif tidak ditemukan."); return; }
      onLogin({ name: m.name, email: m.email || `musyrif.${selectedClass.toLowerCase()}@muallimin.sch.id`, role: `musyrif-${selectedClass}` });
    } else {
      const k = koordinatorMusyrif[0];
      onLogin({ name: k.name, email: k.email, role: "koordinator-musyrif" });
    }
    setPage("history");
  }

  const classOptions = Object.entries(musyrifData).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg"
          style={{ boxShadow:"0 8px 24px -4px rgba(37,99,235,0.35)" }}>
          <ShieldCheck className="w-8 h-8 text-white"/>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Login Ustadz</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Masuk sebagai Musyrif Kelas atau Pamong Asrama untuk menyetujui perizinan santri.
        </p>
      </div>

      <div className="space-y-4">
        {/* Google Sign-In */}
        {GOOGLE_CLIENT_ID ? (
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-foreground">Login dengan Google</span>
            </div>
            <div ref={googleBtnRef} className="flex justify-center"/>
            <p className="text-[11px] text-muted-foreground text-center">
              Gunakan email Google resmi yang terdaftar sebagai Musyrif atau Pamong.
            </p>
          </div>
        ) : (
          /* Dev/Demo mode when no Client ID */
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600"/>
              <p className="text-xs font-bold text-amber-800">Mode Demo</p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Google Client ID belum dikonfigurasi. Gunakan login demo di bawah untuk testing.
            </p>
          </div>
        )}

        {/* Manual / Demo login */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => setDevMode(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-primary"/>
              <span className="text-sm font-bold text-foreground">Login Manual / Demo</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${devMode ? "rotate-180" : ""}`}/>
          </button>

          {devMode && (
            <div className="px-5 pb-5 border-t border-border space-y-4 fade-up">
              <p className="text-xs text-muted-foreground pt-3">
                Pilih role untuk login tanpa verifikasi (hanya untuk keperluan demo / pengujian).
              </p>

              {/* Musyrif login with class dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Login sebagai Musyrif Kelas</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:bg-white transition-all appearance-none">
                  <option value="">-- Pilih Kelas --</option>
                  {classOptions.map(([key, m]) => (
                    <option key={key} value={key}>{getClassLabel(key)} — {m.name}</option>
                  ))}
                </select>
                <button onClick={() => loginDev("musyrif")} disabled={!selectedClass}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors btn-press disabled:opacity-40">
                  Masuk sebagai Musyrif
                </button>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border"/>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">atau</span>
                <div className="flex-1 h-px bg-border"/>
              </div>

              <div className="space-y-2">
                <button onClick={() => loginDev("koordinator")}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors btn-press">
                  Masuk sebagai Koordinator Musyrif
                </button>
                <button onClick={() => loginDev("pamong")}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors btn-press">
                  Masuk sebagai Pamong Asrama
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-blue-800 flex items-center gap-2">
            <Info className="w-3.5 h-3.5"/> Hak Akses Berdasarkan Role
          </p>
          <ul className="text-xs text-blue-700 space-y-1 leading-relaxed list-disc pl-4">
            <li><strong>Musyrif Kelas:</strong> Menyetujui izin keluar biasa & kesehatan.</li>
            <li><strong>Koordinator Musyrif:</strong> Menyetujui semua jenis izin kelas.</li>
            <li><strong>Pamong Asrama:</strong> Menyetujui semua jenis izin termasuk menginap & sakit.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Pass ─────────────────────────────────────────────────
function PagePass({ passData, setPage }: { passData: IzinRecord | null; setPage: (p: PageId) => void }) {
  if (!passData) return null;

  const isApproved = passData.status === "APPROVED";

  function shareWA() {
    const jenis = JENIS_OPTIONS.find(o => JENIS_IZIN_LABELS[o.key] === passData.jenisIzin);
    const t = [
      `*SURAT IZIN RESMI — IZIN SEDAYU*`,
      `Madrasah Mu'allimin Muhammadiyah Yogyakarta`,
      ``,
      `*ID:* ${passData.idIzin}`,
      `*Santri:* ${passData.namaSantri}`,
      `*Kelas:* ${passData.kelas}`,
      `*Jenis:* ${passData.jenisIzin}`,
      `*Wali:* ${passData.namaWali}`,
      `*Keperluan:* ${passData.keperluan}`,
      `*Tujuan:* ${passData.tujuan}`,
      `*Keluar:* ${fmtDateLong(passData.tanggalKeluar)} — ${passData.jamKeluar} WIB`,
      `*Kembali:* ${fmtDateLong(passData.tanggalKembali)} — ${passData.jamKembali} WIB`,
      `*Status:* ${passData.status === "APPROVED" ? "✅ DISETUJUI" : "⏳ MENUNGGU"}`,
      `*Pemberi Izin:* ${passData.pemberiIzin}`,
      ``,
      `_Diterbitkan via Izin Sedayu — Sistem Perizinan Digital Mu'allimin_`,
    ].join("\n");
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`, "_blank");
  }

  const dotGrid = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E")`;

  return (
    <div className="max-w-sm mx-auto px-4 py-6">

      {/* Success banner */}
      <div className={`mb-4 flex items-center gap-3 p-4 rounded-2xl scale-pop
        ${isApproved ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isApproved ? "bg-emerald-100" : "bg-amber-100"}`}>
          {isApproved
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
            : <Clock className="w-5 h-5 text-amber-600"/>}
        </div>
        <div>
          <p className={`font-bold text-sm ${isApproved ? "text-emerald-900" : "text-amber-900"}`}>
            {isApproved ? "Izin Disetujui!" : "Izin Terkirim"}
          </p>
          <p className={`text-xs ${isApproved ? "text-emerald-600" : "text-amber-600"}`}>
            {isApproved ? "Santri dapat keluar sesuai jadwal" : "Menunggu persetujuan ustadz"}
          </p>
        </div>
      </div>

      {/* Official pass card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden"
        style={{ boxShadow:"0 10px 40px -10px rgba(15,23,42,0.18)" }}>

        {/* Card header */}
        <div className="relative px-5 py-4 overflow-hidden"
          style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)" }}>
          <div className="absolute inset-0" style={{ backgroundImage:dotGrid }}/>
          {/* Decorative circle */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 border-4 border-white"/>
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 border-2 border-white"/>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white"/>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.2em] text-blue-300 uppercase">Madrasah Mu'allimin</p>
                <p className="text-sm font-extrabold text-white tracking-tight">SURAT IZIN RESMI</p>
              </div>
            </div>
            <StatusBadge status={passData.status} size="md"/>
          </div>
          <div className="relative mt-2.5 flex items-center gap-2">
            <span className="font-mono text-[11px] text-blue-300/80">{passData.idIzin}</span>
            <span className="text-blue-500/40">·</span>
            <span className="text-[10px] text-blue-400/70">{fmtDate(passData.createdAt || "")}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="px-5 py-4 space-y-4">

          {/* Santri highlight */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-border">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              {passData.namaSantri.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-foreground truncate">{passData.namaSantri}</p>
              <p className="text-xs text-muted-foreground">{passData.kelas}</p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="space-y-2 text-xs">
            {[
              ["Jenis Izin", passData.jenisIzin],
              ["Keperluan",  passData.keperluan],
              ["Tujuan",     passData.tujuan],
              ["Wali",       passData.namaWali],
              ["Penjemput",  `${passData.namaPenjemput} (${passData.hubunganPenjemput})`],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground w-20 flex-shrink-0 font-medium">{k}:</span>
                <span className="font-semibold text-foreground break-words">{v}</span>
              </div>
            ))}
          </div>

          {/* Time block */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:"Keluar",  date:passData.tanggalKeluar,  jam:passData.jamKeluar,  icon:<Calendar className="w-3.5 h-3.5"/>, accent:"text-blue-600" },
              { label:"Kembali", date:passData.tanggalKembali, jam:passData.jamKembali, icon:<CheckCircle2 className="w-3.5 h-3.5"/>, accent:"text-emerald-600" },
            ].map(t => (
              <div key={t.label} className="p-3 bg-slate-50 rounded-2xl border border-border text-center">
                <div className={`flex items-center justify-center gap-1 ${t.accent} mb-1 opacity-70`}>
                  {t.icon}<span className="text-[10px] font-bold uppercase">{t.label}</span>
                </div>
                <p className="text-xs font-semibold text-foreground">{fmtDate(t.date)}</p>
                <p className={`text-xl font-extrabold ${t.accent}`}>{t.jam}</p>
                <p className="text-[10px] text-muted-foreground">WIB</p>
              </div>
            ))}
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center gap-3 p-5 bg-slate-900 rounded-2xl"
            style={{ background:"linear-gradient(145deg,#0f172a,#1e293b)" }}>
            <div className="p-2 bg-white rounded-xl">
              <QRCodeSVG value={passData.idIzin} size={96} level="H" bgColor="#ffffff" fgColor="#0f172a"/>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-white">Kode Verifikasi</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{passData.idIzin}</p>
              <p className="text-[10px] text-slate-500 mt-1">Scan untuk memverifikasi keaslian surat</p>
            </div>
          </div>

          {/* Pemberi izin */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-slate-50 rounded-xl border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0"/>
            <span>Diterbitkan oleh: <strong className="text-foreground">{passData.pemberiIzin}</strong></span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
          <button onClick={shareWA}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-colors btn-press">
            <Share2 className="w-4 h-4"/> WhatsApp
          </button>
          <button onClick={() => window.print()}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-slate-800 text-white rounded-2xl text-xs font-bold hover:bg-slate-700 transition-colors btn-press">
            <Printer className="w-4 h-4"/> Cetak
          </button>
          <button onClick={() => setPage("history")}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-colors btn-press"
            style={{ boxShadow:"0 4px 14px -4px rgba(37,99,235,0.4)" }}>
            <BarChart2 className="w-4 h-4"/> Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Card ───────────────────────────────────────────────
function HistoryCard({ item, currentUser, onApprove, onReject, onCheckOut, onReturn }: {
  item: IzinRecord;
  currentUser: UserSession | null;
  onApprove: () => void;
  onReject: () => void;
  onCheckOut: () => void;
  onReturn: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(item);
  const leftColor: Record<StatusType, string> = {
    APPROVED:    "border-l-emerald-500",
    PENDING:     "border-l-amber-400",
    CHECKED_OUT: overdue ? "border-l-rose-500 ring-1 ring-rose-300" : "border-l-indigo-500",
    REJECTED:    "border-l-rose-500",
    RETURNED:    "border-l-blue-500",
  };
  const names = item.namaSantri?.split(",").map(s => s.trim()) || [];
  const jOpt = JENIS_OPTIONS.find(o => JENIS_IZIN_LABELS[o.key] === item.jenisIzin);

  // Role-based action rights (Multi-santri musyrif direct approval)
  const role = getRole(currentUser);
  const jenisKey = Object.entries(JENIS_IZIN_LABELS).find(([, v]) => v === item.jenisIzin)?.[0] as JenisIzinKey | undefined;
  const canApprove = (() => {
    if (!currentUser || item.status !== "PENDING") return false;
    if (role === "pamong" || role === "koordinator-musyrif") return true;
    if (role === "musyrif") {
      return jenisKey === "keluar-biasa" || jenisKey === "kesehatan";
    }
    return false;
  })();
  const canCheckOut = currentUser && item.status === "APPROVED" && (role === "pamong" || role === "musyrif" || role === "koordinator-musyrif");
  const canReturn = currentUser && (item.status === "CHECKED_OUT" || item.status === "APPROVED") && (role === "pamong" || role === "musyrif" || role === "koordinator-musyrif");

  return (
    <div className={`bg-white rounded-2xl border border-border border-l-4 ${leftColor[item.status as StatusType] || leftColor.PENDING} overflow-hidden transition-shadow hover:shadow-md`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {names.map((n, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-border rounded-lg text-xs font-bold">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">
                    {n.charAt(0)}
                  </span>
                  {n}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="font-mono text-primary text-[10px]">{item.idIzin}</span>
              <span className="text-slate-200">·</span>
              <span>{item.kelas}</span>
              <span className="text-slate-200">·</span>
              {jOpt && (
                <span className={`inline-flex items-center gap-1 ${jOpt.color}`}>
                  {jOpt.icon && <span className="scale-75">{jOpt.icon}</span>}
                  {jOpt.title}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{fmtDate(item.tanggalKeluar)} &rarr; {fmtDate(item.tanggalKembali)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={item.status as StatusType} isOverdue={overdue}/>
            <button onClick={() => setExpanded(o => !o)}
              className="w-7 h-7 rounded-xl bg-slate-50 border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}/>
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{item.keperluan} &rarr; {item.tujuan}</p>
      </div>

      {expanded && (
        <div className="px-4 py-3.5 border-t border-border bg-slate-50/60 space-y-1.5 text-xs fade-up">
          {[
            ["Jenis Izin",   item.jenisIzin],
            ["Wali",         item.namaWali],
            ["Penjemput",    `${item.namaPenjemput} (${item.hubunganPenjemput})`],
            ["Keluar",       `${fmtDateLong(item.tanggalKeluar)} — ${item.jamKeluar} WIB`],
            ["Kembali",      `${fmtDateLong(item.tanggalKembali)} — ${item.jamKembali} WIB`],
            ["Pemberi Izin", item.pemberiIzin],
            ...(item.catatanAdmin ? [["Catatan", item.catatanAdmin]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground w-20 flex-shrink-0 font-medium">{k}:</span>
              <span className="text-foreground break-words">{v}</span>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <div className="px-4 py-3 border-t border-border flex flex-wrap gap-2 items-center">
          {item.status === "PENDING" && canApprove && (
            <>
              <button onClick={onApprove}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors btn-press">
                <CheckCircle2 className="w-3.5 h-3.5"/> Setujui (ACC)
              </button>
              <button onClick={onReject}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors btn-press">
                <XCircle className="w-3.5 h-3.5"/> Tolak
              </button>
            </>
          )}
          {item.status === "PENDING" && !canApprove && (
            <span className="text-xs text-muted-foreground italic py-1.5">
              SOP: Izin bermalam/sakit memerlukan persetujuan Pamong Asrama / Wadir IV.
            </span>
          )}
          {canCheckOut && (
            <button onClick={onCheckOut}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors btn-press shadow-xs">
              <LogOut className="w-3.5 h-3.5"/> Check-Out (Keluar)
            </button>
          )}
          {item.status === "CHECKED_OUT" && canReturn && (
            <button onClick={onReturn}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-press shadow-xs">
              <RefreshCw className="w-3.5 h-3.5"/> Check-In (Kembali)
            </button>
          )}
          {item.status === "APPROVED" && !canCheckOut && canReturn && (
            <button onClick={onReturn}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-press">
              <RefreshCw className="w-3.5 h-3.5"/> Tandai Kembali
            </button>
          )}
          {(item.status === "REJECTED" || item.status === "RETURNED") && (
            <span className="text-xs text-muted-foreground italic py-1.5">{item.catatanAdmin}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page: History ──────────────────────────────────────────────
function PageHistory({ currentUser, setPage, onLoginRequest }: {
  currentUser: UserSession | null;
  setPage: (p: PageId) => void;
  onLoginRequest: () => void;
}) {
  const [items,   setItems]   = useState<IzinRecord[]>([]);
  const [statusF, setStatusF] = useState<"all" | StatusType>("all");
  const [dateF,   setDateF]   = useState<"today" | "all">("today");
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchRemoteData().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function approve(id: string) {
    if (!currentUser) { toast.error("Login diperlukan"); return; }
    updateStatus(id, "APPROVED", `Disetujui oleh ${currentUser.name}`, currentUser);
    setItems(getLocal());
    toast.success("Izin berhasil disetujui (ACC).");
  }
  function reject(id: string) {
    if (!currentUser) { toast.error("Login diperlukan"); return; }
    updateStatus(id, "REJECTED", `Ditolak oleh ${currentUser.name}`, currentUser);
    setItems(getLocal());
    toast.info("Izin ditolak.");
  }
  function checkOut(id: string) {
    if (!currentUser) { toast.error("Login diperlukan"); return; }
    const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    updateStatus(id, "CHECKED_OUT", `Santri keluar asrama via PKM — dicatat ${currentUser.name} (${jam} WIB)`, currentUser);
    setItems(getLocal());
    toast.success("Santri tercatat keluar asrama (Check-Out).");
  }
  function returnItem(id: string) {
    if (!currentUser) return;
    const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    updateStatus(id, "RETURNED", `Santri kembali ke asrama — dicatat ${currentUser.name} (${jam} WIB)`, currentUser);
    setItems(getLocal());
    toast.success("Status: Santri sudah kembali (Check-In).");
  }

  const counts = useMemo(() => ({
    all:         items.length,
    PENDING:     items.filter(i => i.status === "PENDING").length,
    APPROVED:    items.filter(i => i.status === "APPROVED").length,
    CHECKED_OUT: items.filter(i => i.status === "CHECKED_OUT").length,
    RETURNED:    items.filter(i => i.status === "RETURNED").length,
    REJECTED:    items.filter(i => i.status === "REJECTED").length,
    overdue:     items.filter(i => isOverdue(i)).length,
  }), [items]);

  const filtered = useMemo(() => {
    let r = items;
    if (statusF !== "all") r = r.filter(i => i.status === statusF);
    if (dateF === "today") {
      const t = r.filter(i => isToday(i.tanggalKeluar) || isToday(i.tanggalKembali) || isToday(i.createdAt || ""));
      if (t.length > 0 || r.length === 0) r = t;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(i =>
        i.namaSantri?.toLowerCase().includes(q) ||
        i.kelas?.toLowerCase().includes(q) ||
        i.idIzin?.toLowerCase().includes(q) ||
        i.keperluan?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [items, statusF, dateF, search]);

  const TAB_LABELS: { key: "all" | StatusType; label: string }[] = [
    { key:"all",         label:"Semua" },
    { key:"PENDING",     label:"Menunggu" },
    { key:"APPROVED",    label:"Disetujui" },
    { key:"CHECKED_OUT", label:"Di Luar" },
    { key:"RETURNED",    label:"Kembali" },
    { key:"REJECTED",    label:"Ditolak" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Auth state banner */}
      {currentUser ? (
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-900">{currentUser.name}</p>
              <p className="text-xs text-emerald-600">{currentUser.role} · {currentUser.email}</p>
            </div>
          </div>
          {counts.PENDING > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex-shrink-0">
              <Bell className="w-3.5 h-3.5"/>{counts.PENDING} Menunggu
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-border rounded-2xl">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4"/>
            </div>
            <span className="text-sm">Login untuk menyetujui / menolak izin santri.</span>
          </div>
          <button onClick={onLoginRequest}
            className="flex-shrink-0 text-xs font-bold px-3.5 py-2 bg-primary text-white rounded-xl hover:bg-blue-700 transition-colors btn-press"
            style={{ boxShadow:"0 2px 8px -2px rgba(37,99,235,0.35)" }}>
            Login
          </button>
        </div>
      )}

      {/* Filter card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden" style={{ boxShadow:"0 2px 12px -4px rgba(15,23,42,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary"/> Riwayat Perizinan
          </h2>
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-muted border border-border rounded-xl hover:bg-slate-100 transition-colors btn-press">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}/>
            Refresh
          </button>
        </div>

        {/* Filter controls */}
        <div className="px-5 py-3.5 space-y-3 border-b border-border">
          {/* Status tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {TAB_LABELS.map(tab => {
              const count = tab.key === "all" ? counts.all : (counts[tab.key as StatusType] || 0);
              const active = statusF === tab.key;
              return (
                <button key={tab.key} onClick={() => setStatusF(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all btn-press flex-shrink-0
                    ${active ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-slate-100"}`}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${active ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Date toggle + search */}
          <div className="flex gap-2">
            <div className="flex bg-muted border border-border rounded-xl p-1 gap-0.5 flex-shrink-0">
              {(["today", "all"] as const).map(d => (
                <button key={d} onClick={() => setDateF(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors btn-press
                    ${dateF === d ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {d === "today" ? "Hari Ini" : "Semua"}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, kelas, ID..."
                className="w-full pl-9 pr-9 py-2 text-xs border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"/>
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-24" style={{ animationDelay:`${i*0.08}s` }}/>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300"/>
              </div>
              <p className="font-bold text-foreground">Belum Ada Data</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusF !== "all" ? "Tidak ada izin dengan status tersebut." : "Ajukan izin baru untuk melihat data di sini."}
              </p>
              {(statusF !== "all" || dateF !== "all") && (
                <button onClick={() => { setStatusF("all"); setDateF("all"); setSearch(""); }}
                  className="mt-4 text-xs font-bold px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-700 transition-colors btn-press">
                  Tampilkan Semua
                </button>
              )}
            </div>
          ) : (
            filtered.map((item, i) => (
              <div key={item.idIzin} className="fade-up" style={{ "--delay":`${i * 0.04}s` } as React.CSSProperties}>
                <HistoryCard
                  item={item}
                  currentUser={currentUser}
                  onApprove={() => approve(item.idIzin)}
                  onReject={() => reject(item.idIzin)}
                  onCheckOut={() => checkOut(item.idIzin)}
                  onReturn={() => returnItem(item.idIzin)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label:"Total Izin",  value:counts.all,         icon:<TrendingUp className="w-4 h-4 text-blue-600"/>,      bg:"bg-blue-50 border-blue-200" },
            { label:"Menunggu",    value:counts.PENDING,     icon:<Clock className="w-4 h-4 text-amber-600"/>,         bg:"bg-amber-50 border-amber-200" },
            { label:"Di Luar",     value:counts.CHECKED_OUT, icon:<LogOut className="w-4 h-4 text-indigo-600"/>,       bg:"bg-indigo-50 border-indigo-200" },
            { label:"Kembali",     value:counts.RETURNED,    icon:<RefreshCw className="w-4 h-4 text-emerald-600"/>,    bg:"bg-emerald-50 border-emerald-200" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-3 text-center`}>
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────
export default function App() {
  const [page,        setPage]        = useState<PageId>("home");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [passData,    setPassData]    = useState<IzinRecord | null>(null);
  const [initialJenis, setInitialJenis] = useState<JenisIzinKey>("keluar-biasa");
  const [syncing,     setSyncing]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Restore session + initial sync + polling
  useEffect(() => {
    try {
      const s = localStorage.getItem("izin_user_session");
      if (s) {
        const u = JSON.parse(s);
        if (u?.name && u?.email) setCurrentUser(u);
      }
    } catch {}

    // Update pending count
    function refreshPending() {
      const list = getLocal();
      setPendingCount(list.filter(i => i.status === "PENDING").length);
    }
    refreshPending();

    // Initial full fetch
    setSyncing(true);
    fetchRemoteData(false).then(() => {
      setSyncing(false);
      refreshPending();
    }).catch(() => setSyncing(false));

    // Incremental polling every 5s
    const timer = setInterval(() => {
      fetchRemoteData(true).then(() => refreshPending()).catch(() => {});
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  function handleLogin(u: UserSession) {
    setCurrentUser(u);
    localStorage.setItem("izin_user_session", JSON.stringify(u));
    toast.success(`Selamat datang, ${u.name}!`);
  }
  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem("izin_user_session");
    toast.info("Berhasil keluar.");
    navigate("home");
  }
  function navigate(p: PageId) {
    setPage(p);
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="min-h-screen bg-background" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <Toaster position="top-center" richColors closeButton expand={false}/>

        <NavBar
          setPage={navigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          pendingCount={pendingCount}
          syncing={syncing}
        />

        <main className="pb-24 md:pb-10">
          {page === "home"    && <PageHome setPage={navigate} setInitialJenis={setInitialJenis}/>}
          {page === "form"    && (
            <PageForm
              currentUser={currentUser}
              setPage={navigate}
              initialJenis={initialJenis}
              onSubmit={r => { setPassData(r); navigate("pass"); }}
            />
          )}
          {page === "login"   && <PageLogin setPage={navigate} onLogin={handleLogin}/>}
          {page === "pass"    && <PagePass passData={passData} setPage={navigate}/>}
          {page === "history" && (
            <PageHistory
              currentUser={currentUser}
              setPage={navigate}
              onLoginRequest={() => navigate("login")}
            />
          )}
        </main>

        <BottomNav page={page} setPage={navigate} pendingCount={pendingCount}/>
      </div>
    </>
  );
}
