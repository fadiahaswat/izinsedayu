import { useState, useEffect, useRef, useMemo } from "react";
import { toast, Toaster } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Building2, Plus, BarChart2, LogOut, Search, X,
  CheckCircle2, Clock, XCircle, ChevronDown, FileText,
  Printer, Share2, Home, RefreshCw, ArrowLeft,
  UserCheck, AlertCircle, Send, ShieldCheck, BookOpen, Users
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
type PageId = "home" | "form" | "login" | "pass" | "history";
type StatusType = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
type JenisIzinKey = "keluar-biasa" | "kesehatan" | "menginap" | "sakit";

interface Student { name: string; class: string; }
interface SelectedStudent { name: string; classKey: string; classLabel: string; musyrifName: string; }
interface UserSession { name: string; email: string; role: string; }
interface IzinRecord {
  idIzin: string; namaSantri: string; kelas: string; jenisIzin: string;
  status: StatusType; namaWali: string; alamatWali: string; keperluan: string;
  tujuan: string; tanggalKeluar: string; tanggalKembali: string;
  jamKeluar: string; jamKembali: string; namaPenjemput: string;
  hubunganPenjemput: string; pemberiIzin: string; catatanAdmin: string;
  createdAt?: string;
}

// ─── Constants ─────────────────────────────────────────────────
const JENIS_IZIN_LABELS: Record<JenisIzinKey, string> = {
  "keluar-biasa": "Izin Keluar Biasa (Kembali Hari Sama)",
  "kesehatan":    "Izin Pemeriksaan Kesehatan (RS/Klinik)",
  "menginap":     "Izin Pulang / Menginap (Bermalam)",
  "sakit":        "Izin Pulang Karena Sakit (Poskestren)",
};

const CLASS_LABELS: Record<string, string> = {
  "1A":"Kelas 1 A","1B":"Kelas 1 B","1C":"Kelas 1 C","1D":"Kelas 1 D","1E":"Kelas 1 E",
  "1F":"Kelas 1 F","1G":"Kelas 1 G","1LOWERA":"Kelas 1 Lower A","1LOWERB":"Kelas 1 Lower B","1LOWERC":"Kelas 1 Lower C",
  "2A":"Kelas 2 A","2B":"Kelas 2 B","2C":"Kelas 2 C","2D":"Kelas 2 D","2E":"Kelas 2 E",
  "2F":"Kelas 2 F","2G":"Kelas 2 G","2H":"Kelas 2 H","2LOWERA":"Kelas 2 Lower A","2LOWERB":"Kelas 2 Lower B","2LOWERC":"Kelas 2 Lower C",
  "3A":"Kelas 3 A","3B":"Kelas 3 B","3C":"Kelas 3 C","3D":"Kelas 3 D","3E":"Kelas 3 E",
  "3F":"Kelas 3 F","3G":"Kelas 3 G","3H":"Kelas 3 H","3UPPERA":"Kelas 3 Upper A","3UPPERB":"Kelas 3 Upper B",
  "4A":"Kelas 4 A","4B":"Kelas 4 B","4C":"Kelas 4 C","4D":"Kelas 4 D","4E":"Kelas 4 E","4F":"Kelas 4 F",
  "4UPPERA":"Kelas 4 Upper A","4UPPERB":"Kelas 4 Upper B",
  "5A":"Kelas 5 A","5B":"Kelas 5 B","5C":"Kelas 5 C","5D":"Kelas 5 D","5E":"Kelas 5 E","5F":"Kelas 5 F",
  "5UPPERA":"Kelas 5 Upper A","5UPPERB":"Kelas 5 Upper B","5UPPERC":"Kelas 5 Upper C",
  "6A":"Kelas 6 A","6B":"Kelas 6 B","6C":"Kelas 6 C","6D":"Kelas 6 D","6E":"Kelas 6 E","6F":"Kelas 6 F","6G":"Kelas 6 G",
  "6INTERNASIONAL":"Kelas 6 Internasional",
};

const TIME_SLOTS: string[] = [];
for (let h = 5; h <= 22; h++) {
  for (const m of [0, 30]) {
    TIME_SLOTS.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  }
}

// ─── Student Data ───────────────────────────────────────────────
const santriData: Student[] = [
  // 1A
  {name:"Agha Faeyza Barra",class:"1A"},{name:"Ahmad Ibrahim Al Mahmudi",class:"1A"},{name:"Almer Bahi Mahdy",class:"1A"},
  {name:"Ammar Abdul Aziz",class:"1A"},{name:"Attaya Fikri Rizqullah",class:"1A"},{name:"Bisma Pragaswara Suprapto",class:"1A"},
  {name:"Dava Ad Dzikri",class:"1A"},{name:"Dhio Itqon Ilmi Izzulhaqq",class:"1A"},{name:"Fajri Annaafi'u Alfarizi",class:"1A"},
  {name:"Fatih Al Faiz",class:"1A"},{name:"Fayzan Ghadi Safaraz",class:"1A"},{name:"H. Muhammad Musthofa El Akhyar Ar",class:"1A"},
  {name:"Hafeez Azmi Muhammad",class:"1A"},{name:"Hakam Naja Hasan",class:"1A"},{name:"Harits Tammam Rahman",class:"1A"},
  {name:"Ibrohim Rofiq",class:"1A"},{name:"Iman Ashraf Athaillah",class:"1A"},{name:"Khenan Naufal Dary Abiyyu",class:"1A"},
  {name:"Mikail Ahmad Zaidan",class:"1A"},{name:"Moh. Athariz Chalief Hamidy",class:"1A"},{name:"Muhamad Fathan Sakhi Zaidan",class:"1A"},
  {name:"Muhammad Azmi An Najah",class:"1A"},{name:"Muhammad Hafis Makarim",class:"1A"},{name:"Muhammad Robii'ul Awwal",class:"1A"},
  {name:"Radhin Nabil Alauna",class:"1A"},{name:"Rafa Rizki Ramadhansyah Haris",class:"1A"},{name:"Rajendra Zhafran Arsaputra",class:"1A"},
  {name:"Salman Abqary Haidar Al Hanif",class:"1A"},{name:"Wisanggeni Pamungkas Pamujaning Rheinandy",class:"1A"},{name:"Zidan Al Fatir Siregar",class:"1A"},
  // 1B
  {name:"A.Dinar Sayuto",class:"1B"},{name:"Adhyastha Ainur Rizky",class:"1B"},{name:"Aditya Giri Reksa Nu'aimi",class:"1B"},
  {name:"Alaika Syamil Al-Hadzik",class:"1B"},{name:"Arjuna Satria Pradipta",class:"1B"},{name:"Aryatama Febrian Danendra",class:"1B"},
  {name:"Faiz Fadhlurrahman",class:"1B"},{name:"Faqih Keyaanurasyid",class:"1B"},{name:"Fauzan Nur Hidayat",class:"1B"},
  {name:"Fazila Akbar Ikhlas",class:"1B"},{name:"Firnas Alfariel",class:"1B"},{name:"Hafizh Nizar Prasetya",class:"1B"},
  {name:"Ibrahim Al Azzam",class:"1B"},{name:"Ilian Badranaya El Qurafi",class:"1B"},{name:"Kenzo Zafran Al Abiyyu",class:"1B"},
  {name:"Lintang Mahardika",class:"1B"},{name:"Muhammad Alkhali Dzikri",class:"1B"},{name:"Muhammad Azzam Al Fatih",class:"1B"},
  {name:"Muhammad Elvin Ishahda",class:"1B"},{name:"Muhammad Farrel Anhar",class:"1B"},{name:"Muhammad Fatih El Ezza",class:"1B"},
  {name:"Muhammad Ghozi Al Faruqi",class:"1B"},{name:"Naufal Afkar",class:"1B"},{name:"Nirwaseta Putra Purnama",class:"1B"},
  {name:"Raditya Asyam Adz Dzaqi",class:"1B"},{name:"Rakha Naufal Alfarisi",class:"1B"},{name:"Rifat Inet Firas",class:"1B"},
  {name:"Sayeed Muhammad 'Alauddin Fakhri",class:"1B"},{name:"Wildan Hawwari",class:"1B"},{name:"Zafran Ilham Sujati",class:"1B"},{name:"Zaky Fakhry Yanto",class:"1B"},
  // 1C
  {name:"Abdullah Alfaqih",class:"1C"},{name:"Ahlam Zulfadli Firdaus",class:"1C"},{name:"Ahmad Mumtaz Dhiya El Haq",class:"1C"},
  {name:"Arsyad Farkhi Ismail",class:"1C"},{name:"Fadlliy Dzaka Triyono",class:"1C"},{name:"Kenzie Abdurahman Haziq",class:"1C"},
  {name:"Muhammad Azhar Nazhifurrahman",class:"1C"},{name:"Muhammad Bilal Najmu Tsaqib",class:"1C"},{name:"Muhammad Hanif Adhinugraha",class:"1C"},
  {name:"Rafiandra Yusuf Al-Ghifari",class:"1C"},{name:"Raihan Nizar Daniswara",class:"1C"},{name:"Zhafran Ramadhan",class:"1C"},
  // 1D
  {name:"Ahmad Amirul A'zam",class:"1D"},{name:"Athariz Zidane Ferdiansyah",class:"1D"},{name:"Azzam Fahrezzi Shaquille",class:"1D"},
  {name:"Fairel Atharizz Chalief",class:"1D"},{name:"Jaris Jalu Randita",class:"1D"},{name:"Muhammad Airlangga Abbyansyah Fajar",class:"1D"},
  {name:"Muhammad Bagus Al Farizi",class:"1D"},{name:"Salahuddin Nafis Al Farisi",class:"1D"},{name:"Syamil Ramadhani Saputra",class:"1D"},
  // 1E
  {name:"Abuwildan Najid Arrasyad",class:"1E"},{name:"Afif Agil Saputra",class:"1E"},{name:"Chelsea Safaraz Majiid",class:"1E"},
  {name:"Evan Rafif Firjatullah",class:"1E"},{name:"Ibrahim Arkaan Dhiya Ulhaq",class:"1E"},{name:"Muhammad Lantang Wirayudha Akbar",class:"1E"},
  {name:"Nabhan Ghazy Pradipta",class:"1E"},{name:"Randa Kamil Bahta",class:"1E"},{name:"Syauqi Musyaffa Fikri",class:"1E"},
  // 1F
  {name:"Acapella Akbar Alhafizh Hartono",class:"1F"},{name:"Ahmad Kenzie Kayana",class:"1F"},{name:"Arakata Aqila Jannahpia",class:"1F"},
  {name:"Bisma Hilal Mahadika Abiyu Haidar",class:"1F"},{name:"Hamdan Pandega",class:"1F"},{name:"Latief Haziq Maulana",class:"1F"},
  {name:"Muhammad Naufal Rahman",class:"1F"},{name:"Zufar Calief Nurdaffa",class:"1F"},
  // 1G
  {name:"Adam Iskandar",class:"1G"},{name:"Ammar Tejananta Himawan",class:"1G"},{name:"Fatih Shuja Arkana",class:"1G"},
  {name:"Lisan Shidqie",class:"1G"},{name:"Muhammad Aksan Al Fatih",class:"1G"},{name:"Raditya Candra Arsakha",class:"1G"},
  {name:"Sultan Fizhansyah Fauzi",class:"1G"},{name:"Yudhistira Putra Prabowo",class:"1G"},
  // 1LOWERA
  {name:"Abid Tsaqif Atha Jati",class:"1LOWERA"},{name:"Ahza Danish Fahreza",class:"1LOWERA"},{name:"Danendra Athallah Zaheen",class:"1LOWERA"},
  {name:"Fikri Nur Fauzan",class:"1LOWERA"},{name:"Muhammad Alfath Arroyyan",class:"1LOWERA"},{name:"Raufa Arkhan Akhtara",class:"1LOWERA"},
  // 1LOWERB
  {name:"Abimantrana Keitaro Jevera",class:"1LOWERB"},{name:"Daffa Mibras Ghosan",class:"1LOWERB"},{name:"Kai Raska Ibrahim",class:"1LOWERB"},
  {name:"Muhammad Haekal Abdullah Andreago",class:"1LOWERB"},{name:"Ryuuta Mikan Abdullah",class:"1LOWERB"},{name:"Zaidan Arkaan Adisya",class:"1LOWERB"},
  // 1LOWERC
  {name:"Bara Habibi Tama",class:"1LOWERC"},{name:"Bilal Geno Al Ghaisan",class:"1LOWERC"},{name:"Ibnu Hafidz Elfathin",class:"1LOWERC"},
  {name:"Muhammad Haikal Akram",class:"1LOWERC"},{name:"Naufal Ahnaf Abqary",class:"1LOWERC"},{name:"Prabu Airlangga Wicaksono",class:"1LOWERC"},
  // 2A
  {name:"Achmad Raffasya Izzudin Althafurrahman",class:"2A"},{name:"Ahmad Abdullah Azzam Syah",class:"2A"},{name:"Arta Nugraha",class:"2A"},
  {name:"Ghaisan Aidan Maheswara",class:"2A"},{name:"Haidar Azfar Abdurrahman",class:"2A"},{name:"Muhammad Faisal Abdurrahman",class:"2A"},
  {name:"Muhammad Mumtaz Al-Dzahabiy",class:"2A"},{name:"Nabil Abriansa",class:"2A"},{name:"Rafif Zikri Makarim",class:"2A"},
  {name:"Razan Rashdan Rakhshan Hidayatullah",class:"2A"},{name:"Athallah Kareem Aljabar",class:"2A"},{name:"Bariq Alfath Abdhila Putra",class:"2A"},
  // 2B
  {name:"Abhivandya Ahmad Hazmi Ardhie",class:"2B"},{name:"Ahmad Khayruddin Fahmi",class:"2B"},{name:"Al Wazif",class:"2B"},
  {name:"Athallah Sidqi As Sakha",class:"2B"},{name:"Dzaky Muhammad El Faiz",class:"2B"},{name:"Keanu Utsman Afrianto",class:"2B"},
  {name:"Muhammad Gibran Habiburrahman",class:"2B"},{name:"Naufal Fadhil Syahputra",class:"2B"},{name:"Rizky Mirza Abdillah",class:"2B"},
  // 2C
  {name:"Abdul Majid Siregar",class:"2C"},{name:"Ahmad Najwan Karnanda",class:"2C"},{name:"Kenzie Rafiandra Putra",class:"2C"},
  {name:"Muhammad Mahardika Al Ghozy",class:"2C"},{name:"Rayyan Nabil Al Faruq",class:"2C"},{name:"Zaverio Ozil Riyadi",class:"2C"},
  {name:"Ebeesio Aquillino Jeevan Setyawan",class:"2C"},{name:"Excel Yanuar Arya Syahrial",class:"2C"},
  // 2D
  {name:"Abdullah Raya Nureno",class:"2D"},{name:"Alessandro El Fathih Siregar",class:"2D"},{name:"Fadhil Askar Parakas",class:"2D"},
  {name:"Gantheng Poerba Ilyasa",class:"2D"},{name:"Muhammad Hakam Tsaqif",class:"2D"},{name:"Muhammad Najmus Tsaaqib",class:"2D"},
  {name:"Arka Panodi Widyanatha",class:"2D"},{name:"Hanan Rasyid Yunur",class:"2D"},
  // 2E
  {name:"Abdullah Hasni Bramapta",class:"2E"},{name:"Alif Alfarizqi Annur Rohman",class:"2E"},{name:"Dzaky Hariri Akbar Raziq",class:"2E"},
  {name:"Muhammad Fikra Avicena",class:"2E"},{name:"Muhammad Kurniawan Putranto",class:"2E"},{name:"Zora Phalosa Nareswara",class:"2E"},
  // 2F
  {name:"Affan Valerino Alfarisqy",class:"2F"},{name:"Azam Zufar Keyara",class:"2F"},{name:"Faiq Rosyad Habibie",class:"2F"},
  {name:"Muhammad Lais Chaniago",class:"2F"},{name:"Rafa Rajendra Wikrama",class:"2F"},{name:"Nuha Rayyan Mazaya",class:"2F"},
  // 2G
  {name:"Abdan Alimul Fikriy",class:"2G"},{name:"Ahmad Fitroh Ramadhan",class:"2G"},{name:"Muhammad Affan Wirasena",class:"2G"},
  {name:"Naraya Jagatsatria",class:"2G"},{name:"Rayhan Ibrahim Pratama Andrianto",class:"2G"},{name:"Uwais Al Qarni",class:"2G"},
  // 2H
  {name:"Achmad Azmi As Siddiq",class:"2H"},{name:"Ahza Dzaky Al-Fattah",class:"2H"},{name:"Fairuz Razqa El Bahri",class:"2H"},
  {name:"Lu'ay Rajendra Yogitaswara",class:"2H"},{name:"Muhammad Arfan Hamizan",class:"2H"},{name:"Zain Muhammad Yusuf",class:"2H"},
  // 2LOWERA
  {name:"Achmad Abiyyu Nur Afkari",class:"2LOWERA"},{name:"Aysar Muhammad Casey",class:"2LOWERA"},{name:"Muhammad Azzam Alvaro",class:"2LOWERA"},
  {name:"Surya Arga Bintara",class:"2LOWERA"},
  // 2LOWERB
  {name:"Ahmad Arsyad Amirudin",class:"2LOWERB"},{name:"Fatih Arelian Pradana",class:"2LOWERB"},{name:"Muhammad Fattan Rahman",class:"2LOWERB"},
  {name:"Satrio Adli Anandito",class:"2LOWERB"},
  // 2LOWERC
  {name:"Abdullah Azzam Pratama",class:"2LOWERC"},{name:"Ahmad Fadlillah Kusuma Alby",class:"2LOWERC"},{name:"Muhammad Arham Habiburrahman",class:"2LOWERC"},
  {name:"Reyhal Nabil Sunandar",class:"2LOWERC"},
  // Higher grades – representative
  {name:"Abdul Ghani Irfan Rafif",class:"3A"},{name:"Ahmad Darwis",class:"3A"},{name:"Faiq Fauzil Adhim",class:"3A"},{name:"Muhammad Mahdi Hanafi",class:"3A"},
  {name:"Ahmad Fadhil Haris",class:"3B"},{name:"Muhammad Karim Fauzi",class:"3B"},{name:"Haris Fadlurrohman",class:"3B"},
  {name:"Azzam Abdullah Zaki",class:"4A"},{name:"Farhan Izzatul Islam",class:"4A"},{name:"Muhammad Iqbal Firmansyah",class:"4A"},
  {name:"Ahmad Zulfikar Ramadhan",class:"5A"},{name:"Hafidz Al Haq Maulana",class:"5A"},{name:"Rizal Maulana Syah",class:"5A"},
  {name:"Hamzah Ibrahim Pratama",class:"6A"},{name:"Muhammad Yusuf Hakim",class:"6A"},{name:"Omar Abdillah Fauzan",class:"6A"},
];

// ─── Musyrif & Pamong Data ──────────────────────────────────────
const musyrifData: Record<string, { name: string; email: string }> = {
  "1A":{ name:"Ust. Ahmad Fauzi, S.Pd.",    email:"musyrif.1a@muallimin.sch.id" },
  "1B":{ name:"Ust. Budi Santoso, S.Ag.",   email:"musyrif.1b@muallimin.sch.id" },
  "1C":{ name:"Ust. Cahyo Nugroho, M.Pd.",  email:"musyrif.1c@muallimin.sch.id" },
  "1D":{ name:"Ust. Doni Pratama, S.Pd.",   email:"musyrif.1d@muallimin.sch.id" },
  "1E":{ name:"Ust. Eko Wibowo, S.Ag.",     email:"musyrif.1e@muallimin.sch.id" },
  "1F":{ name:"Ust. Faisal Rahman, M.Pd.",  email:"musyrif.1f@muallimin.sch.id" },
  "1G":{ name:"Ust. Ghani Putra, S.Pd.",    email:"musyrif.1g@muallimin.sch.id" },
  "1LOWERA":{ name:"Ust. Hasan Basri",      email:"musyrif.1la@muallimin.sch.id" },
  "1LOWERB":{ name:"Ust. Imam Ghazali",     email:"musyrif.1lb@muallimin.sch.id" },
  "1LOWERC":{ name:"Ust. Joko Susilo",      email:"musyrif.1lc@muallimin.sch.id" },
  "2A":{ name:"Ust. Karim Abdullah, S.Pd.", email:"musyrif.2a@muallimin.sch.id" },
  "2B":{ name:"Ust. Lutfi Hakim, M.Pd.",   email:"musyrif.2b@muallimin.sch.id" },
  "2C":{ name:"Ust. Musa Al Amin, S.Ag.",  email:"musyrif.2c@muallimin.sch.id" },
  "2D":{ name:"Ust. Nizar Fauzan, S.Pd.",  email:"musyrif.2d@muallimin.sch.id" },
  "2E":{ name:"Ust. Omar Faruq, M.Pd.",    email:"musyrif.2e@muallimin.sch.id" },
  "2F":{ name:"Ust. Purnomo Hadi, S.Ag.",  email:"musyrif.2f@muallimin.sch.id" },
  "2G":{ name:"Ust. Qodir Amrullah",       email:"musyrif.2g@muallimin.sch.id" },
  "2H":{ name:"Ust. Ridwan Saleh, S.Pd.",  email:"musyrif.2h@muallimin.sch.id" },
};

const pamongData = {
  name: "Ust. Abdul Rahman, M.Pd.",
  email: "pamong@muallimin.sch.id",
};

// ─── Utilities ──────────────────────────────────────────────────
function generateIzinId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IZN-${ts}-${rnd}`;
}

function getClassLabel(key: string) {
  return CLASS_LABELS[key] || `Kelas ${key}`;
}

function normalizeKey(s: string) {
  return s.replace(/\s+/g, "").toUpperCase();
}

function getMusyrif(classKey: string) {
  return musyrifData[normalizeKey(classKey)] || musyrifData[classKey] || { name: "Ustadz Musyrif Pembina", email: "" };
}

function calcDuration(jamKeluar: string, jamKembali: string, jenisIzin: string, tglKeluar: string, tglKembali: string): string {
  if (!jamKeluar || !jamKembali) return "";
  if (jenisIzin === "menginap" || jenisIzin === "sakit") {
    if (tglKeluar && tglKembali && tglKeluar !== tglKembali) {
      const d1 = new Date(tglKeluar), d2 = new Date(tglKembali);
      const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
      return `${diff + 1} Hari (Bermalam)`;
    }
    return "1 Hari (Bermalam)";
  }
  const [h1, m1] = jamKeluar.split(":").map(Number);
  const [h2, m2] = jamKembali.split(":").map(Number);
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60), m = diff % 60;
  return [h > 0 && `${h} Jam`, m > 0 && `${m} Menit`].filter(Boolean).join(" ") || "< 1 Jam";
}

function getLocalList(): IzinRecord[] {
  try { return JSON.parse(localStorage.getItem("local_izin_list") || "[]"); } catch { return []; }
}

function saveLocalItem(item: IzinRecord) {
  const list = getLocalList();
  if (!list.some(x => x.idIzin === item.idIzin)) {
    list.unshift(item);
    localStorage.setItem("local_izin_list", JSON.stringify(list.slice(0, 500)));
  }
}

function updateLocalStatus(idIzin: string, newStatus: StatusType, note: string) {
  const list = getLocalList();
  const found = list.find(x => x.idIzin === idIzin);
  if (found) {
    found.status = newStatus;
    found.catatanAdmin = note;
    localStorage.setItem("local_izin_list", JSON.stringify(list));
  }
}

function getEffectiveRole(user: UserSession | null) {
  if (!user) return "orangtua";
  const r = user.role.toLowerCase();
  if (r.includes("pamong") || r.includes("direktur") || r.includes("wadir")) return "pamong";
  if (r.includes("musyrif")) return "musyrif";
  return "orangtua";
}

function calcApproval(jenisIzin: JenisIzinKey, role: string) {
  if (role === "orangtua") return { status: "PENDING" as StatusType, text: "Menunggu verifikasi & ACC Ustadz Musyrif / Pamong" };
  if (role === "pamong") return { status: "APPROVED" as StatusType, text: "Disetujui langsung oleh Pamong Asrama" };
  if (role === "musyrif") {
    if (jenisIzin === "keluar-biasa" || jenisIzin === "kesehatan") return { status: "APPROVED" as StatusType, text: "Disetujui langsung oleh Musyrif Kelas" };
    return { status: "PENDING" as StatusType, text: "Izin Pulang/Menginap harus disetujui Pamong Asrama" };
  }
  return { status: "PENDING" as StatusType, text: "Menunggu verifikasi" };
}

function formatDate(isoStr: string) {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  } catch { return isoStr; }
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isToday(str: string) {
  if (!str) return false;
  return str.startsWith(todayISO());
}

// ─── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusType }) {
  const cfg: Record<StatusType, { icon: React.ReactNode; cls: string; label: string }> = {
    APPROVED: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Disetujui" },
    PENDING:  { icon: <Clock className="w-3.5 h-3.5" />,        cls: "bg-amber-50 text-amber-700 border-amber-200",     label: "Menunggu" },
    REJECTED: { icon: <XCircle className="w-3.5 h-3.5" />,      cls: "bg-rose-50 text-rose-700 border-rose-200",        label: "Ditolak"  },
    RETURNED: { icon: <RefreshCw className="w-3.5 h-3.5" />,    cls: "bg-blue-50 text-blue-700 border-blue-200",        label: "Kembali"  },
  };
  const c = cfg[status] || cfg.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ─── Accordion ──────────────────────────────────────────────────
function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border text-sm text-muted-foreground space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── NavBar ─────────────────────────────────────────────────────
function NavBar({ page, setPage, currentUser, onLogout }: {
  page: PageId; setPage: (p: PageId) => void;
  currentUser: UserSession | null; onLogout: () => void;
}) {
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <button onClick={() => setPage("home")} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="font-extrabold text-sm text-foreground tracking-tight block">Izin Sedayu</span>
            <span className="text-[10px] text-muted-foreground leading-none">Mu'allimin Yogyakarta</span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-emerald-800 max-w-[100px] truncate">{currentUser.name}</span>
              </div>
              <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setPage("login")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span>Login Musyrif</span>
            </button>
          )}

          <button
            onClick={() => setPage("form")}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /><span>Ajukan Izin</span>
          </button>

          <button
            onClick={() => setPage("history")}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" /><span>Cek Status</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Mobile FAB ─────────────────────────────────────────────────
function MobileFAB({ setPage }: { setPage: (p: PageId) => void }) {
  return (
    <div className="md:hidden fixed bottom-5 right-4 z-50 flex flex-col gap-3 items-end">
      <button onClick={() => setPage("history")}
        className="w-12 h-12 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center border border-slate-700 hover:bg-slate-800 transition-colors">
        <BarChart2 className="w-5 h-5 text-blue-400" />
      </button>
      <button onClick={() => setPage("form")}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-blue-700 transition-colors">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ─── Page: Home ─────────────────────────────────────────────────
function PageHome({ setPage }: { setPage: (p: PageId) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <section>
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-indigo-500/15 blur-xl" />

          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Perizinan Santri Kampus Sedayu
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-white">
                Sistem Perizinan Keluar & Pulang Santri Asrama
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Pelayanan mandiri transparan & sesuai SOP resmi Madrasah Mu'allimin Muhammadiyah Yogyakarta.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <button onClick={() => setPage("form")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-blue-500 transition-colors">
                <Plus className="w-4 h-4" /> Ajukan Perizinan Baru
              </button>
              <button onClick={() => setPage("history")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold border border-white/20 hover:bg-white/20 transition-colors">
                <BarChart2 className="w-4 h-4 text-blue-300" /> Cek Status &amp; Riwayat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { icon: <Users className="w-5 h-5 text-blue-600" />, label: "Total Santri", value: santriData.length.toString() + "+" },
          { icon: <BookOpen className="w-5 h-5 text-indigo-600" />, label: "Kelas Aktif", value: Object.keys(CLASS_LABELS).length.toString() },
          { icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, label: "SOP Perizinan", value: "4 Jenis" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">{s.icon}</div>
            <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Rules */}
      <section className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Ketentuan Umum Perizinan
        </h2>
        <ul className="space-y-2.5">
          {[
            "Prosedur ini adalah acuan resmi untuk mendukung ketertiban & kelancaran kegiatan asrama.",
            "Santri hanya diperkenankan keluar/pulang setelah mendapatkan izin resmi dari pihak berwenang.",
            "Keluar tanpa izin atau terlambat akan dikenakan pembinaan sesuai SOP yang berlaku.",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* SOP Table */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Ringkasan SOP & Kewenangan
          </h2>
          <a href="SOP_Perizinan_Keluar_dan_Pulang_Asrama.pdf" target="_blank"
            className="text-xs font-semibold text-primary hover:text-blue-700 hover:underline transition-colors">
            Dokumen PDF →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Jenis Perizinan SOP</th>
                <th className="px-3 py-3 text-center">Musyrif</th>
                <th className="px-3 py-3 text-center">Pamong</th>
                <th className="px-3 py-3 text-center">Wadir IV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-amber-50/50">
                <td className="px-5 py-3 font-semibold text-amber-900 text-xs">Sabtu Sore (15.30–17.00) &amp; Ahad Pagi (06.30–11.00)</td>
                <td colSpan={3} className="px-3 py-3 text-center text-xs font-bold text-amber-700">TANPA PERMOHONAN — Otomatis Pekanan</td>
              </tr>
              {[
                ["Izin Keluar Biasa (Urgent — Kembali Hari Sama)", true, true, true],
                ["Pemeriksaan Kesehatan (Kontrol / RS / Klinik)", true, true, true],
                ["Izin Pulang / Menginap (Bermalam)", false, true, true],
                ["Izin Pulang Karena Sakit", "Poskestren", true, true],
              ].map(([label, m, p, w], i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-sm">{label as string}</td>
                  {[m, p, w].map((v, j) => (
                    <td key={j} className="px-3 py-3 text-center">
                      {v === true ? <span className="text-emerald-600 font-bold text-base">✓</span>
                       : v === false ? <span className="text-rose-500 font-bold text-base">✕</span>
                       : <span className="text-xs text-muted-foreground">{v as string}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Accordion Procedures */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-center text-foreground mb-3">Prosedur Pengajuan Perizinan</h2>
        <AccordionItem title="Izin Keluar & Kembali Hari yang Sama">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 font-medium">
            SOP Pekanan: Sabtu Sore (15.30–17.00) &amp; Ahad Pagi (06.30–11.00) — bebas tanpa permohonan.
          </div>
          <p>Izin keluar khusus di luar jadwal rutin diajukan ke <strong>Musyrif Kelas</strong> via form online ini.</p>
        </AccordionItem>
        <AccordionItem title="Izin Terlambat Pasca Perpulangan">
          <p>Wali santri wajib membuat surat permohonan kepada Koordinator Musyrif.</p>
          <a href="https://docs.google.com/document/d/1pDJLZe5SrC2-Djql9Sw_pU-z3Nnpfx5KgNwqaMkIKNw/edit" target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1">
            <FileText className="w-3.5 h-3.5" /> Unduh Format Surat
          </a>
        </AccordionItem>
        <AccordionItem title="Izin Menginap (1–3 Hari)">
          <p><strong>1 Malam:</strong> Diajukan ke Pamong Asrama via form online.</p>
          <p><strong>2–3 Hari:</strong> Sertakan format surat permohonan resmi.</p>
          <a href="https://docs.google.com/document/d/1oQtCWzwcrBeHEeM6h3CKhEYX3dFNr5ZzzAGb3zoQFMc/edit" target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1">
            <FileText className="w-3.5 h-3.5" /> Unduh Format Surat
          </a>
        </AccordionItem>
        <AccordionItem title="Izin Khusus (> 3 Hari / Cuti Sakit)">
          <p>Surat permohonan resmi ditujukan kepada <strong>Direktur Madrasah</strong>.</p>
          <a href="https://docs.google.com/document/d/1dbbqi0mpVuBX3VPmcHOoKsvx22uDy6Oo92PswLTYFDo/edit" target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1">
            <FileText className="w-3.5 h-3.5" /> Unduh Format Surat
          </a>
        </AccordionItem>
      </section>

      <footer className="text-center py-4 border-t border-border text-xs text-muted-foreground">
        &copy; 2026 Madrasah Mu'allimin Muhammadiyah Yogyakarta
      </footer>
    </div>
  );
}

// ─── Page: Form ─────────────────────────────────────────────────
function PageForm({ currentUser, setPage, onSubmit }: {
  currentUser: UserSession | null;
  setPage: (p: PageId) => void;
  onSubmit: (record: IzinRecord) => void;
}) {
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSantri, setSelectedSantri] = useState("");

  const [jenisIzin, setJenisIzin] = useState<JenisIzinKey>("keluar-biasa");
  const [keperluan, setKeperluan] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [namaWali, setNamaWali] = useState("");
  const [alamatWali, setAlamatWali] = useState("");
  const [penjemputBeda, setPenjemputBeda] = useState(false);
  const [namaPenjemput, setNamaPenjemput] = useState("");
  const [hubunganPenjemput, setHubunganPenjemput] = useState("Orang Tua (Ayah/Ibu)");
  const [rekomendasiPoskestren, setRekomendasiPoskestren] = useState("");
  const [tanggalIzin, setTanggalIzin] = useState(todayISO());
  const [tanggalKembali, setTanggalKembali] = useState("");
  const [jamKeluar, setJamKeluar] = useState("08:00");
  const [jamKembali, setJamKembali] = useState("17:00");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const role = getEffectiveRole(currentUser);
  const approval = calcApproval(jenisIzin, role);
  const duration = calcDuration(jamKeluar, jamKembali, jenisIzin, tanggalIzin, tanggalKembali);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return santriData.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8).map(s => ({
      name: s.name, classKey: s.class, classLabel: getClassLabel(s.class),
      musyrifName: getMusyrif(s.class).name,
    }));
  }, [searchQuery]);

  const classOptions = useMemo(() => {
    const keys = [...new Set(santriData.map(s => s.class))].sort();
    return keys.map(k => ({ key: k, label: getClassLabel(k) }));
  }, []);

  const santriOptions = useMemo(() => {
    if (!selectedClass) return [];
    return santriData.filter(s => s.class === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClass]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addStudent(s: SelectedStudent) {
    if (selectedStudents.some(x => x.name.toLowerCase() === s.name.toLowerCase())) {
      toast.warning(`${s.name} sudah ada dalam daftar`); return;
    }
    setSelectedStudents(prev => [...prev, s]);
    setSearchQuery(""); setShowSuggestions(false);
    if (!namaWali) setNamaWali(`Bapak/Ibu Wali ${s.name.split(" ")[0]}`);
    if (!alamatWali) setAlamatWali("Yogyakarta");
  }

  function addFromDropdown() {
    if (!selectedClass || !selectedSantri) return;
    const s: SelectedStudent = {
      name: selectedSantri, classKey: selectedClass,
      classLabel: getClassLabel(selectedClass), musyrifName: getMusyrif(selectedClass).name,
    };
    addStudent(s);
    setSelectedSantri("");
  }

  function removeStudent(idx: number) {
    setSelectedStudents(prev => prev.filter((_, i) => i !== idx));
  }

  function applyQuickChip(jenis: JenisIzinKey, kep: string, tuj: string) {
    setJenisIzin(jenis); setKeperluan(kep); setTujuan(tuj);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (selectedStudents.length === 0) { setFormError("Pilih minimal 1 santri terlebih dahulu."); return; }
    if (!keperluan.trim()) { setFormError("Isi detail keperluan."); return; }
    if (!tujuan.trim()) { setFormError("Isi tempat tujuan."); return; }
    if (!namaWali.trim()) { setFormError("Isi nama wali."); return; }
    if (!jamKeluar || !jamKembali) { setFormError("Pilih jam keluar & kembali."); return; }

    setSubmitting(true);
    const namaSantri = selectedStudents.map(s => s.name).join(", ");
    const kelas = [...new Set(selectedStudents.map(s => s.classLabel))].join(", ");
    const rawKelasKey = [...new Set(selectedStudents.map(s => s.classKey))].join(", ");

    const targetMusyrif = selectedStudents.length === 1
      ? getMusyrif(selectedStudents[0].classKey)
      : null;
    const pemberiIzin = (role === "pamong")
      ? pamongData.name
      : (targetMusyrif?.name || "Ustadz Musyrif Pembina");

    const record: IzinRecord = {
      idIzin: generateIzinId(),
      namaSantri, kelas,
      jenisIzin: JENIS_IZIN_LABELS[jenisIzin],
      status: approval.status,
      namaWali: namaWali.trim(),
      alamatWali: alamatWali.trim() || "Yogyakarta",
      keperluan: keperluan.trim(),
      tujuan: tujuan.trim(),
      tanggalKeluar: tanggalIzin,
      tanggalKembali: (jenisIzin === "menginap" || jenisIzin === "sakit") ? tanggalKembali || tanggalIzin : tanggalIzin,
      jamKeluar, jamKembali,
      namaPenjemput: penjemputBeda ? namaPenjemput : namaWali.trim(),
      hubunganPenjemput: penjemputBeda ? hubunganPenjemput : "Orang Tua (Ayah/Ibu)",
      pemberiIzin,
      catatanAdmin: `Diterbitkan oleh ${role === "orangtua" ? "Wali Santri" : currentUser?.name || "Ustadz"}`,
      createdAt: new Date().toISOString(),
    };

    saveLocalItem(record);
    setTimeout(() => {
      setSubmitting(false);
      onSubmit(record);
      toast.success("Surat izin berhasil diterbitkan!");
    }, 600);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Formulir Perizinan Santri</h2>
              <p className="text-xs text-muted-foreground">Madrasah Mu'allimin Yogyakarta</p>
            </div>
          </div>
          <button onClick={() => setPage("home")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Beranda
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border">
          {/* Section 1: Student Selection */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">1. Pilih Santri</h3>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {selectedStudents.length} Dipilih
              </span>
            </div>

            {/* Global Search */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Cari nama santri..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border rounded-xl shadow-lg z-50 max-h-52 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.name} type="button" onMouseDown={() => addStudent(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted/60 transition-colors flex items-center justify-between border-b border-border last:border-0">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.classLabel} &bull; {s.musyrifName}</p>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg ml-2 flex-shrink-0">+ Tambah</span>
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border rounded-xl shadow-md z-50 px-4 py-3 text-sm text-muted-foreground text-center">
                  Nama "{searchQuery}" tidak ditemukan
                </div>
              )}
            </div>

            {/* Class + Student Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Pilih Kelas</label>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSantri(""); }}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                  <option value="">-- Semua Kelas --</option>
                  {classOptions.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Pilih Santri</label>
                <div className="flex gap-1.5">
                  <select value={selectedSantri} onChange={e => setSelectedSantri(e.target.value)} disabled={!selectedClass}
                    className="flex-1 text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary disabled:opacity-50">
                    <option value="">-- Pilih Santri --</option>
                    {santriOptions.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  <button type="button" onClick={addFromDropdown} disabled={!selectedSantri}
                    className="px-2.5 py-2 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chips */}
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedStudents.map((s, i) => (
                  <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-semibold">
                    <span>🎓 {s.name} ({s.classLabel})</span>
                    <button type="button" onClick={() => removeStudent(i)} className="hover:text-rose-600 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Jenis Izin */}
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-foreground">2. Jenis Perizinan</h3>
            <select value={jenisIzin} onChange={e => setJenisIzin(e.target.value as JenisIzinKey)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary font-medium">
              {Object.entries(JENIS_IZIN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium ${approval.status === "APPROVED" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              {approval.status === "APPROVED"
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span><strong>{approval.status === "APPROVED" ? "✅ AUTO APPROVED:" : "⏳ PENDING:"}</strong> {approval.text}</span>
            </div>
          </div>

          {/* Section 3: Quick Chips + Details */}
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-foreground">3. Keperluan &amp; Tujuan</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { jenis:"keluar-biasa" as JenisIzinKey, label:"Keluar Khusus",    kep:"Izin keluar khusus di luar jadwal pekanan",          tuj:"Area Sekitar Sedayu / Yogyakarta" },
                { jenis:"kesehatan"   as JenisIzinKey, label:"Kontrol Dokter/RS", kep:"Pemeriksaan kesehatan / kontrol medis ke RS",         tuj:"Klinik / Rumah Sakit" },
                { jenis:"menginap"    as JenisIzinKey, label:"Acara Keluarga",    kep:"Acara keluarga penting / urgent",                    tuj:"Rumah Orang Tua / Wali" },
                { jenis:"keluar-biasa"as JenisIzinKey, label:"Kebutuhan Santri",  kep:"Membeli kebutuhan santri",                           tuj:"Toko / Minimarket" },
              ].map(c => (
                <button key={c.label} type="button" onClick={() => applyQuickChip(c.jenis, c.kep, c.tuj)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-muted hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors">
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Detail Keperluan *</label>
                <input type="text" value={keperluan} onChange={e => setKeperluan(e.target.value)} required
                  placeholder="Beli obat / Acara keluarga..."
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tempat Tujuan *</label>
                <input type="text" value={tujuan} onChange={e => setTujuan(e.target.value)} required
                  placeholder="RS PKU / Rumah Orang Tua..."
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Section 4: Wali & Penjemput */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">4. Data Wali &amp; Penjemput</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={penjemputBeda} onChange={e => setPenjemputBeda(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-ring" />
                <span className="text-xs text-muted-foreground font-medium">Penjemput Berbeda</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Nama Wali *</label>
                <input type="text" value={namaWali} onChange={e => setNamaWali(e.target.value)} required
                  placeholder="Nama Wali"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Alamat Wali *</label>
                <input type="text" value={alamatWali} onChange={e => setAlamatWali(e.target.value)} required
                  placeholder="Alamat Wali"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
            </div>
            {penjemputBeda && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nama Penjemput</label>
                  <input type="text" value={namaPenjemput} onChange={e => setNamaPenjemput(e.target.value)}
                    placeholder="Nama Penjemput"
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hubungan</label>
                  <select value={hubunganPenjemput} onChange={e => setHubunganPenjemput(e.target.value)}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                    <option>Orang Tua (Ayah/Ibu)</option>
                    <option>Wali / Keluarga</option>
                    <option>Saudara Kandung</option>
                    <option>Travel / Kendaraan Online</option>
                    <option>Lainnya</option>
                  </select>
                </div>
              </div>
            )}
            {jenisIzin === "sakit" && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                <label className="text-xs font-semibold text-rose-700 block">Rekomendasi Dokter Poskestren</label>
                <input type="text" value={rekomendasiPoskestren} onChange={e => setRekomendasiPoskestren(e.target.value)}
                  placeholder="Rekomendasi rawat di rumah..."
                  className="w-full text-sm border border-rose-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400" />
              </div>
            )}
          </div>

          {/* Section 5: Waktu */}
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-foreground">5. Waktu Perizinan</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tanggal Keluar *</label>
                <input type="date" value={tanggalIzin} onChange={e => setTanggalIzin(e.target.value)} required
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
              {(jenisIzin === "menginap" || jenisIzin === "sakit") && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tanggal Kembali</label>
                  <input type="date" value={tanggalKembali} onChange={e => setTanggalKembali(e.target.value)}
                    min={tanggalIzin}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Jam Keluar *</label>
                <select value={jamKeluar} onChange={e => setJamKeluar(e.target.value)} required
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                  <option value="">Pilih Jam</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t} WIB</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Jam Kembali *</label>
                <select value={jamKembali} onChange={e => setJamKembali(e.target.value)} required
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                  <option value="">Pilih Jam</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t} WIB</option>)}
                </select>
              </div>
            </div>
            {duration && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                <span className="text-muted-foreground font-medium">Durasi Izin:</span>
                <span className="font-bold text-primary">{duration}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {formError && (
            <div className="mx-5 mb-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 bg-muted/30">
            <button type="button" onClick={() => setPage("home")}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-border bg-white hover:bg-muted transition-colors">
              Batal
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60">
              {submitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><Send className="w-4 h-4" /> Terbitkan Surat Izin</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page: Login ────────────────────────────────────────────────
function PageLogin({ setPage, onLogin }: {
  setPage: (p: PageId) => void;
  onLogin: (user: UserSession) => void;
}) {
  function loginAsMusyrif() {
    onLogin({ name: "Ust. Ahmad Musyrif Pembina", email: "musyrif@muallimin.sch.id", role: "musyrif" });
    setPage("history");
  }
  function loginAsPamong() {
    onLogin({ name: "Ust. Abdul Rahman (Pamong)", email: "pamong@muallimin.sch.id", role: "pamong" });
    setPage("history");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-blue-950 to-indigo-950 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Login Musyrif / Pamong</h3>
                <p className="text-xs text-blue-300">Akses fitur persetujuan izin</p>
              </div>
            </div>
            <button onClick={() => setPage("home")}
              className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground space-y-1.5">
            <p><strong className="text-foreground">Wali Santri:</strong> Bebas isi form & cek status tanpa login.</p>
            <p><strong className="text-foreground">Musyrif/Pamong:</strong> Login untuk menyetujui/menolak perizinan.</p>
          </div>

          <div className="space-y-3">
            <button onClick={loginAsMusyrif}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Masuk sebagai Musyrif Kelas</div>
                <div className="text-xs font-normal opacity-80">ACC izin keluar biasa & kesehatan</div>
              </div>
            </button>
            <button onClick={loginAsPamong}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <div>Masuk sebagai Pamong Asrama</div>
                <div className="text-xs font-normal text-slate-300">ACC semua jenis perizinan</div>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Untuk produksi, hubungkan ke Google OAuth dengan Client ID institusi.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Pass ─────────────────────────────────────────────────
function PagePass({ passData, setPage }: {
  passData: IzinRecord | null;
  setPage: (p: PageId) => void;
}) {
  if (!passData) return null;

  function shareWA() {
    const text = `*SURAT IZIN SEDAYU RESMI*\n\n*ID Izin:* ${passData!.idIzin}\n*Santri:* ${passData!.namaSantri} (${passData!.kelas})\n*Jenis:* ${passData!.jenisIzin}\n*Wali:* ${passData!.namaWali}\n*Keperluan:* ${passData!.keperluan}\n*Tujuan:* ${passData!.tujuan}\n*Waktu:* ${formatDate(passData!.tanggalKeluar)} (${passData!.jamKeluar}) s.d. (${passData!.jamKembali})\n*Status:* ${passData!.status}\n\n_Diterbitkan via Aplikasi Izin Sedayu — Mu'allimin Yogyakarta_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Surat Izin Resmi
          </span>
          <button onClick={() => setPage("home")}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Beranda
          </button>
        </div>

        {/* Card */}
        <div className="p-5">
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3 relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <Building2 className="w-48 h-48 text-primary" />
            </div>

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Madrasah Mu'allimin</p>
                <h3 className="text-base font-extrabold text-foreground tracking-tight">SURAT IZIN SEDAYU</h3>
                <code className="text-xs font-mono font-bold text-primary">{passData.idIzin}</code>
              </div>
              <StatusBadge status={passData.status} />
            </div>

            <div className="border-t border-b border-border/80 py-3 space-y-1.5 text-xs">
              {[
                ["Santri", passData.namaSantri],
                ["Kelas", passData.kelas],
                ["Jenis Izin", passData.jenisIzin],
                ["Wali", passData.namaWali],
                ["Keperluan", passData.keperluan],
                ["Tujuan", passData.tujuan],
                ["Penjemput", `${passData.namaPenjemput} (${passData.hubunganPenjemput})`],
                ["Waktu Keluar", `${formatDate(passData.tanggalKeluar)} — ${passData.jamKeluar} WIB`],
                ["Waktu Kembali", `${formatDate(passData.tanggalKembali)} — ${passData.jamKembali} WIB`],
                ["Pemberi Izin", passData.pemberiIzin],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0 font-medium">{k}:</span>
                  <span className="font-semibold text-foreground break-words">{v}</span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-border">
              <div className="text-xs font-medium text-foreground">Scan QR Verifikasi</div>
              <div className="ml-auto">
                <QRCodeSVG value={passData.idIzin} size={64} level="H"
                  bgColor="#ffffff" fgColor="#0f172a" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
          <button onClick={shareWA}
            className="flex flex-col items-center gap-1.5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={() => window.print()}
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button onClick={() => setPage("history")}
            className="flex flex-col items-center gap-1.5 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
            <BarChart2 className="w-4 h-4" /> Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page: History ──────────────────────────────────────────────
function PageHistory({ currentUser, setPage, onLoginRequest }: {
  currentUser: UserSession | null;
  setPage: (p: PageId) => void;
  onLoginRequest: () => void;
}) {
  const [historyItems, setHistoryItems] = useState<IzinRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all"|StatusType>("APPROVED");
  const [dateFilter, setDateFilter] = useState<"today"|"all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  function loadData() {
    setLoading(true);
    setTimeout(() => {
      setHistoryItems(getLocalList());
      setLoading(false);
    }, 400);
  }

  useEffect(() => { loadData(); }, []);

  function handleApprove(idIzin: string) {
    if (!currentUser) { toast.error("Login Musyrif diperlukan untuk menyetujui izin."); return; }
    updateLocalStatus(idIzin, "APPROVED", `Disetujui oleh ${currentUser.name}`);
    setHistoryItems(getLocalList());
    toast.success("Izin berhasil disetujui.");
  }

  function handleReject(idIzin: string) {
    if (!currentUser) { toast.error("Login Musyrif diperlukan untuk menolak izin."); return; }
    updateLocalStatus(idIzin, "REJECTED", `Ditolak oleh ${currentUser.name}`);
    setHistoryItems(getLocalList());
    toast.info("Izin ditolak.");
  }

  function handleReturn(idIzin: string) {
    if (!currentUser) return;
    updateLocalStatus(idIzin, "RETURNED", `Santri telah kembali — dicatat oleh ${currentUser.name}`);
    setHistoryItems(getLocalList());
    toast.success("Status diperbarui: Santri Kembali");
  }

  const filtered = useMemo(() => {
    let items = historyItems;
    if (statusFilter !== "all") items = items.filter(i => i.status === statusFilter);
    if (dateFilter === "today") {
      const today = todayISO();
      const todayFiltered = items.filter(i => isToday(i.tanggalKeluar) || isToday(i.tanggalKembali) || isToday(i.createdAt || ""));
      if (todayFiltered.length > 0) items = todayFiltered;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.namaSantri?.toLowerCase().includes(q) ||
        i.namaWali?.toLowerCase().includes(q) ||
        i.idIzin?.toLowerCase().includes(q) ||
        i.kelas?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [historyItems, statusFilter, dateFilter, searchQuery]);

  const pendingCount = historyItems.filter(i => i.status === "PENDING").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Header Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" /> Status &amp; Riwayat Perizinan
          </h2>
          <button onClick={() => setPage("home")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
        </div>

        {/* Auth Banner */}
        {currentUser ? (
          <div className="mx-5 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-900">Akun Musyrif Aktif</p>
                <p className="text-xs text-emerald-600">{currentUser.name} &bull; {currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pendingCount > 0 && (
                <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">
                  {pendingCount} Menunggu
                </span>
              )}
              <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full">✅ Fitur ACC Aktif</span>
            </div>
          </div>
        ) : (
          <div className="mx-5 mt-4 p-4 bg-muted/50 border border-border rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCheck className="w-5 h-5 text-muted-foreground" />
              <span>Login Musyrif diperlukan untuk menyetujui atau menolak izin.</span>
            </div>
            <button onClick={onLoginRequest}
              className="flex-shrink-0 text-xs font-bold px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
              Login Musyrif
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center bg-muted p-1 rounded-lg border border-border gap-0.5">
              {(["all","PENDING","APPROVED","REJECTED"] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${statusFilter === s ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {s === "all" ? "Semua" : s === "PENDING" ? "Pending" : s === "APPROVED" ? "ACC" : "Ditolak"}
                </button>
              ))}
            </div>

            {/* Date Pills */}
            <div className="flex items-center bg-muted p-1 rounded-lg border border-border gap-0.5">
              {(["today","all"] as const).map(d => (
                <button key={d} type="button" onClick={() => setDateFilter(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${dateFilter === d ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {d === "today" ? "Hari Ini" : "Semua Tgl"}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari santri, kelas, ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
            </div>
            <button onClick={loadData}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="px-5 pb-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-24" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground">Belum Ada Data Perizinan</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all" ? `Tidak ada izin dengan status ${statusFilter}.` : "Ajukan izin baru untuk melihat data di sini."}
              </p>
              {(statusFilter !== "all" || dateFilter !== "all") && (
                <button onClick={() => { setStatusFilter("all"); setDateFilter("all"); }}
                  className="mt-4 text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Tampilkan Semua Data
                </button>
              )}
            </div>
          ) : (
            filtered.map(item => (
              <HistoryCard
                key={item.idIzin} item={item}
                currentUser={currentUser}
                onApprove={() => handleApprove(item.idIzin)}
                onReject={() => handleReject(item.idIzin)}
                onReturn={() => handleReturn(item.idIzin)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ item, currentUser, onApprove, onReject, onReturn }: {
  item: IzinRecord;
  currentUser: UserSession | null;
  onApprove: () => void;
  onReject: () => void;
  onReturn: () => void;
}) {
  const borderColors: Record<StatusType, string> = {
    APPROVED: "border-l-emerald-500",
    PENDING:  "border-l-amber-500",
    REJECTED: "border-l-rose-500",
    RETURNED: "border-l-blue-500",
  };
  const [expanded, setExpanded] = useState(false);
  const names = item.namaSantri?.split(",").map(s => s.trim()) || [];
  const classes = item.kelas?.split(",").map(s => s.trim()) || [];

  return (
    <div className={`bg-white border border-border rounded-xl border-l-4 ${borderColors[item.status as StatusType] || borderColors.PENDING} overflow-hidden`}>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {names.map((n, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-lg text-xs font-semibold">
                  {n}
                  {classes[i] && <span className="px-1.5 bg-primary/10 text-primary rounded text-[10px] font-bold">{classes[i]}</span>}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-medium">{item.jenisIzin}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={item.status as StatusType} />
            <button onClick={() => setExpanded(o => !o)}
              className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-primary">{item.idIzin}</span>
          <span>&bull;</span>
          <span>{item.keperluan}</span>
          <span>&bull;</span>
          <span>{item.jamKeluar}–{item.jamKembali}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 space-y-1.5 text-xs">
          {[
            ["Wali", item.namaWali],
            ["Tujuan", item.tujuan],
            ["Penjemput", `${item.namaPenjemput} (${item.hubunganPenjemput})`],
            ["Keluar", `${formatDate(item.tanggalKeluar)} — ${item.jamKeluar} WIB`],
            ["Kembali", `${formatDate(item.tanggalKembali)} — ${item.jamKembali} WIB`],
            ["Pemberi Izin", item.pemberiIzin],
            ["Catatan", item.catatanAdmin],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground w-20 flex-shrink-0 font-medium">{k}:</span>
              <span className="text-foreground break-words">{v}</span>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <div className="px-4 py-3 border-t border-border bg-muted/10 flex flex-wrap gap-2">
          {item.status === "PENDING" && (
            <>
              <button onClick={onApprove}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACC Setujui
              </button>
              <button onClick={onReject}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Tolak
              </button>
            </>
          )}
          {item.status === "APPROVED" && (
            <button onClick={onReturn}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Tandai Kembali
            </button>
          )}
          {(item.status === "REJECTED" || item.status === "RETURNED") && (
            <span className="text-xs text-muted-foreground italic py-2">{item.catatanAdmin}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [passData, setPassData] = useState<IzinRecord | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("izin_user_session");
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session && session.name && session.email) setCurrentUser(session);
      } catch { /* ignore */ }
    }
  }, []);

  function handleLogin(user: UserSession) {
    setCurrentUser(user);
    localStorage.setItem("izin_user_session", JSON.stringify(user));
    toast.success(`Selamat datang, ${user.name}!`);
  }

  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem("izin_user_session");
    toast.info("Berhasil keluar.");
    setPage("home");
  }

  function handleFormSubmit(record: IzinRecord) {
    setPassData(record);
    setPage("pass");
  }

  const navigate = (p: PageId) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Toaster position="bottom-right" richColors closeButton />

      <NavBar page={page} setPage={navigate} currentUser={currentUser} onLogout={handleLogout} />

      <main className="pb-24 md:pb-8">
        {page === "home"    && <PageHome setPage={navigate} />}
        {page === "form"    && <PageForm currentUser={currentUser} setPage={navigate} onSubmit={handleFormSubmit} />}
        {page === "login"   && <PageLogin setPage={navigate} onLogin={handleLogin} />}
        {page === "pass"    && <PagePass passData={passData} setPage={navigate} />}
        {page === "history" && <PageHistory currentUser={currentUser} setPage={navigate} onLoginRequest={() => navigate("login")} />}
      </main>

      <MobileFAB setPage={navigate} />
    </div>
  );
}
