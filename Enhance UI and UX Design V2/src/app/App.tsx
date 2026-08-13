import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import logoBlue from "../assets/logo-muallimin-blue.png";
import logoWhite from "../assets/logo-muallimin-white.png";
import { santriData, musyrifData, koordinatorMusyrif, pamongList, pamongData, GOOGLE_CLIENT_ID, REGISTERED_EMAILS } from "../data";
import {
  Building2, Plus, BarChart2, LogOut, Search, X, Check,
  CheckCircle2, Clock, XCircle, ChevronDown, FileText,
  Printer, Share2, Home, RefreshCw, ArrowLeft, ChevronRight,
  UserCheck, AlertCircle, ShieldCheck, Users, Send,
  Calendar, MapPin, User, Heart, Stethoscope, Moon,
  Sparkles, TrendingUp, ClipboardList, Shield
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
`;

// ─── Types ─────────────────────────────────────────────────────
type PageId      = "home" | "form" | "login" | "pass" | "history";
type StatusType  = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
type JenisIzinKey = "keluar-biasa" | "kesehatan" | "menginap" | "sakit";

interface Student        { name: string; class: string; }
interface SelectedStudent{ name: string; classKey: string; classLabel: string; musyrifName: string; }
interface UserSession    { name: string; email: string; role: string; }
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
  return [h>0&&`${h} Jam`, m>0&&`${m} Menit`].filter(Boolean).join(" ") || "< 1 Menit";
}

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwQnacuM2ZsgWYP20M9Gjwi--adZsNxzJk14IyH2l8iBuv_tKZCPPrYKdLeJhZhU7iz/exec";

function getLocal(): IzinRecord[] {
  try { return JSON.parse(localStorage.getItem("local_izin_list")||"[]"); } catch { return []; }
}

async function fetchRemoteData(): Promise<IzinRecord[]> {
  try {
    const res = await fetch(`${GAS_WEB_APP_URL}?action=read`);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        localStorage.setItem("local_izin_list", JSON.stringify(json.data));
        return json.data;
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

function updateStatus(id: string, status: StatusType, note: string, user?: UserSession|null) {
  const list = getLocal();
  const f = list.find(x => x.idIzin === id);
  if (f) {
    f.status = status;
    f.catatanAdmin = note;
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

function calcApproval(jenis: JenisIzinKey, role: string) {
  if (role==="pamong") return { status:"APPROVED" as StatusType, text:"Disetujui langsung oleh Pamong Asrama" };
  if (role==="musyrif") {
    if (jenis==="keluar-biasa"||jenis==="kesehatan")
      return { status:"APPROVED" as StatusType, text:"Disetujui langsung oleh Musyrif Kelas" };
    return { status:"PENDING" as StatusType, text:"Izin pulang/menginap harus disetujui Pamong Asrama" };
  }
  return { status:"PENDING" as StatusType, text:"Menunggu verifikasi Ustadz Musyrif / Pamong" };
}

function fmtDate(s: string) {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short",year:"numeric"}); }
  catch { return s; }
}
function fmtDateLong(s: string) {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
  catch { return s; }
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

// ─── NavBar ─────────────────────────────────────────────────────
function NavBar({ setPage, currentUser, onLogout }: {
  setPage:(p:PageId)=>void; currentUser:UserSession|null; onLogout:()=>void;
}) {
  return (
    <nav className="sticky top-0 z-40 bg-white/92 backdrop-blur-lg border-b border-border" style={{boxShadow:"0 1px 0 0 rgba(15,23,42,0.06)"}}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={()=>setPage("home")} className="flex items-center gap-2.5 btn-press">
          <img src={logoBlue} alt="Logo Mu'allimin" className="w-10 h-10 object-contain"/>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={()=>setPage("form")}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors btn-press shadow-sm">
            <Plus className="w-3.5 h-3.5"/> Ajukan Izin
          </button>
          <button onClick={()=>setPage("history")}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors btn-press">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400"/> Cek Status
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
            <button onClick={()=>setPage("login")}
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
function BottomNav({ page, setPage }: { page: PageId; setPage:(p:PageId)=>void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md border-t border-border"
      style={{ paddingBottom:"env(safe-area-inset-bottom,0px)", boxShadow:"0 -1px 0 0 rgba(15,23,42,0.06)" }}>
      <div className="flex items-center justify-around h-16 px-8">
        <button onClick={()=>setPage("home")}
          className={`flex flex-col items-center gap-1 transition-all btn-press
            ${page==="home" ? "text-primary scale-105" : "text-muted-foreground"}`}>
          <Home className="w-5 h-5"/>
          <span className="text-[10px] font-semibold">Beranda</span>
        </button>

        <button onClick={()=>setPage("form")} className="flex flex-col items-center gap-1 -mt-5 btn-press">
          <span className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex items-center justify-center"
            style={{boxShadow:"0 8px 20px -4px rgba(37,99,235,0.45)"}}>
            <Plus className="w-6 h-6"/>
          </span>
          <span className="text-[10px] font-semibold text-primary mt-0.5">Ajukan</span>
        </button>

        <button onClick={()=>setPage("history")}
          className={`flex flex-col items-center gap-1 transition-all btn-press
            ${page==="history" ? "text-primary scale-105" : "text-muted-foreground"}`}>
          <BarChart2 className="w-5 h-5"/>
          <span className="text-[10px] font-semibold">Status</span>
        </button>
      </div>
    </nav>
  );
}

// ─── Step Progress ──────────────────────────────────────────────
const STEP_LABELS = ["Santri","Jenis Izin","Waktu","Wali"];

function StepProgress({ step }: { step: number }) {
  const pct = ((step-1)/(STEP_LABELS.length-1))*100;
  return (
    <div className="px-5 pt-5 pb-4">
      {/* Bar */}
      <div className="relative h-1.5 bg-slate-100 rounded-full mb-4">
        <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width:`${pct}%` }}/>
        {STEP_LABELS.map((_,i) => {
          const s = i+1;
          const done = s<step, active = s===step;
          return (
            <div key={s}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
              style={{ left:`${(i/(STEP_LABELS.length-1))*100}%` }}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all duration-300
                ${done  ? "bg-blue-600 border-blue-600 text-white"
                : active ? "bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 text-slate-400"}`}>
                {done ? <Check className="w-3 h-3"/> : s}
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {STEP_LABELS.map((label,i) => {
          const s = i+1, active = s===step, done = s<step;
          return (
            <span key={s} className={`text-[10px] font-semibold transition-colors
              ${active ? "text-primary" : done ? "text-blue-400" : "text-slate-300"}`}
              style={{ width:`${100/STEP_LABELS.length}%`, textAlign:i===0?"left":i===STEP_LABELS.length-1?"right":"center" }}>
              {label}
            </span>
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
    const list = getLocal();
    const t = todayISO();
    setStats({
      total:    list.length,
      pending:  list.filter(i=>i.status==="PENDING").length,
      approved: list.filter(i=>i.status==="APPROVED").length,
      today:    list.filter(i=>(i.createdAt||"").startsWith(t)).length,
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
              <img src={logoWhite} alt="Logo Mu'allimin" className="w-10 h-10 object-contain opacity-90 flex-shrink-0"/>
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
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Pilih Jenis Izin</p>
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
    setAutoAdvancing(true);
    setTimeout(()=>{ setAutoAdvancing(false); nav(3,"fwd"); }, 350);
  }

  function handleSubmit() {
    if (!namaWali.trim())   { setError("Isi nama wali."); return; }
    if (!alamatWali.trim()) { setError("Isi alamat wali."); return; }

    localStorage.setItem("last_wali_name", namaWali.trim());
    localStorage.setItem("last_wali_addr", alamatWali.trim());

    setSubmitting(true);
    const namaSantri = students.map(s=>s.name).join(", ");
    const kelas      = [...new Set(students.map(s=>s.classLabel))].join(", ");
    const musyrif    = students.length===1 ? getMusyrif(students[0].classKey) : null;
    const pemberiIzin= role==="pamong" ? pamongData.name : (musyrif?.name||"Ustadz Musyrif Pembina");

    const record: IzinRecord = {
      idIzin: genId(), namaSantri, kelas,
      jenisIzin: JENIS_IZIN_LABELS[jenis], status: approval.status,
      namaWali: namaWali.trim(), alamatWali: alamatWali.trim(),
      keperluan: keperluan.trim(), tujuan: tujuan.trim(),
      tanggalKeluar: tglKeluar, tanggalKembali: overnight?(tglKembali||tglKeluar):tglKeluar,
      jamKeluar, jamKembali,
      namaPenjemput:  bedaPenjemput ? namaPenjemput : namaWali.trim(),
      hubunganPenjemput: bedaPenjemput ? hubungan : "Orang Tua (Ayah/Ibu)",
      pemberiIzin,
      catatanAdmin: `Diterbitkan oleh ${role==="orangtua"?"Wali Santri":currentUser?.name||"Ustadz"}`,
      createdAt: new Date().toISOString(),
    };
    saveLocal(record);
    setTimeout(()=>{ setSubmitting(false); onSubmit(record); toast.success("Surat izin berhasil diterbitkan!"); }, 600);
  }

  const animClass = dir==="fwd" ? "step-enter-fwd" : "step-enter-back";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl border border-border overflow-hidden" style={{boxShadow:"0 4px 24px -4px rgba(15,23,42,0.1)"}}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <h2 className="font-extrabold text-base text-foreground">Formulir Perizinan Santri</h2>
            <p className="text-xs text-muted-foreground">Mu'allimin Yogyakarta</p>
          </div>
          <button onClick={()=>setPage("home")} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <StepProgress step={step}/>

        {/* Step content */}
        <div className="border-t border-border">
          <div key={stepKey} className={`${animClass} p-5 space-y-4`}>

            {/* ── Step 1 ── */}
            {step===1 && <>
              <div>
                <h3 className="font-bold text-sm text-foreground">Siapa yang akan izin?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ketik nama santri, pilih dari saran.</p>
              </div>

              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input
                    value={query} autoFocus
                    onChange={e=>{setQuery(e.target.value);setShowSug(true);}}
                    onFocus={()=>setShowSug(true)}
                    placeholder="Ketik nama santri..."
                    className="pl-10 pr-10"/>
                  {query && <button onClick={()=>{setQuery("");setShowSug(false);}}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4"/></button>}
                </div>

                {showSug && suggestions.length>0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border rounded-2xl shadow-lg z-50 max-h-56 overflow-y-auto fade-up"
                    style={{boxShadow:"0 8px 24px -4px rgba(15,23,42,0.12)"}}>
                    {suggestions.map(s=>(
                      <button key={s.name} type="button" onMouseDown={()=>addStudent(s)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 border-b border-border last:border-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.classLabel} &bull; {s.musyrifName}</p>
                        </div>
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Plus className="w-4 h-4"/>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {showSug && query.length>=2 && suggestions.length===0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border rounded-2xl shadow-md z-50 px-4 py-4 text-center text-sm text-muted-foreground fade-up">
                    Nama "{query}" tidak ditemukan dalam data
                  </div>
                )}
              </div>

              {students.length>0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{students.length} santri dipilih:</p>
                  <div className="flex flex-wrap gap-2">
                    {students.map((s,i)=>(
                      <div key={i}
                        className="inline-flex items-center gap-2 pl-3 pr-2 py-2 bg-primary/8 border border-primary/20 rounded-xl text-sm font-semibold text-primary scale-pop"
                        style={{"--delay":`${i*0.04}s`} as React.CSSProperties}>
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <span className="truncate max-w-[130px]">{s.name}</span>
                        <span className="text-[10px] font-normal text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded-md">{s.classLabel}</span>
                        <button onClick={()=>setStudents(p=>p.filter((_,j)=>j!==i))}
                          className="hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-300"/>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Belum ada santri dipilih</p>
                  <p className="text-xs text-slate-300">Ketik nama di atas untuk mencari</p>
                </div>
              )}
            </>}

            {/* ── Step 2 ── */}
            {step===2 && <>
              <div>
                <h3 className="font-bold text-sm text-foreground">Apa keperluan izinnya?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {autoAdvancing ? "Melanjutkan ke langkah berikutnya..." : "Pilih salah satu — akan otomatis lanjut."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {JENIS_OPTIONS.map((j,i)=>{
                  const selected = jenis===j.key;
                  return (
                    <button key={j.key} type="button" onClick={()=>selectJenis(j.key)}
                      style={{"--delay":`${i*0.06}s`} as React.CSSProperties}
                      className={`fade-up relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 btn-press
                        ${selected ? `${j.bg} ${j.border} shadow-sm ring-2 ${j.ring}` : "bg-white border-border hover:border-slate-300 hover:shadow-sm"}`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${j.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-white">{j.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${selected?j.color:"text-foreground"}`}>{j.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{j.subtitle}</p>
                      </div>
                      {selected && <Check className={`w-5 h-5 flex-shrink-0 ${j.color}`}/>}
                    </button>
                  );
                })}
              </div>

              <div className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs font-medium
                ${approval.status==="APPROVED"?"bg-emerald-50 border-emerald-200 text-emerald-800":"bg-amber-50 border-amber-200 text-amber-800"}`}>
                {approval.status==="APPROVED"
                  ?<CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                  :<Clock className="w-4 h-4 flex-shrink-0 mt-0.5"/>}
                <span><strong>{approval.status==="APPROVED"?"Langsung Disetujui:":"Status Menunggu:"}</strong> {approval.text}</span>
              </div>
            </>}

            {/* ── Step 3 ── */}
            {step===3 && <>
              <div>
                <h3 className="font-bold text-sm text-foreground">Kapan &amp; ke mana?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Keperluan, tujuan, dan jadwal keluar.</p>
              </div>

              {/* Jenis badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${jenisInfo.bg} ${jenisInfo.border} border`}>
                <span className={jenisInfo.color}>{jenisInfo.icon}</span>
                <span className={`text-xs font-bold ${jenisInfo.color}`}>{jenisInfo.title}</span>
                <button onClick={()=>nav(2,"back")} className={`text-xs underline ${jenisInfo.color} opacity-60 hover:opacity-100`}>Ganti</button>
              </div>

              {/* Quick fill */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Isi cepat:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {label:"Acara Keluarga", kep:"Menghadiri acara keluarga penting",      tuj:"Rumah Orang Tua / Wali"},
                    {label:"Kontrol RS",     kep:"Pemeriksaan kesehatan / kontrol medis",   tuj:"Klinik / Rumah Sakit"},
                    {label:"Keluar Biasa",   kep:"Izin keluar khusus di luar jadwal rutin", tuj:"Area Sekitar Sedayu"},
                    {label:"Beli Keperluan", kep:"Membeli kebutuhan santri",                tuj:"Toko / Minimarket"},
                  ].map(c=>(
                    <button key={c.label} type="button"
                      onClick={()=>{setKeperluan(c.kep);setTujuan(c.tuj);}}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-white hover:bg-primary/8 hover:border-primary/30 hover:text-primary transition-all btn-press">
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label required>Detail Keperluan</Label><Input value={keperluan} onChange={e=>setKeperluan(e.target.value)} placeholder="Misal: beli obat, acara pernikahan..."/></div>
                <div><Label required>Tempat Tujuan</Label><Input value={tujuan} onChange={e=>setTujuan(e.target.value)} placeholder="Misal: RS PKU, Rumah Orang Tua..."/></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tanggal Keluar</Label><Input type="date" value={tglKeluar} onChange={e=>setTglKeluar(e.target.value)}/></div>
                {overnight && <div><Label>Tanggal Kembali</Label><Input type="date" min={tglKeluar} value={tglKembali} onChange={e=>setTglKembali(e.target.value)}/></div>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Jam Keluar</Label>
                  <SelectField value={jamKeluar} onChange={e=>setJamKeluar(e.target.value)}>
                    {TIME_SLOTS.map(t=><option key={t}>{t} WIB</option>)}
                  </SelectField>
                </div>
                <div>
                  <Label>Jam Kembali</Label>
                  <SelectField value={jamKembali} onChange={e=>setJamKembali(e.target.value)}>
                    {TIME_SLOTS.map(t=><option key={t}>{t} WIB</option>)}
                  </SelectField>
                </div>
              </div>

              {duration && (
                <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/15 rounded-2xl">
                  <span className="text-sm text-muted-foreground font-medium">Durasi izin:</span>
                  <span className="text-sm font-extrabold text-primary">{duration}</span>
                </div>
              )}
            </>}

            {/* ── Step 4 ── */}
            {step===4 && <>
              <div>
                <h3 className="font-bold text-sm text-foreground">Data wali &amp; penjemput</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Siapa yang bertanggung jawab menjemput santri?</p>
              </div>

              <div className="space-y-3">
                <div><Label required>Nama Wali</Label><Input value={namaWali} onChange={e=>setNamaWali(e.target.value)} placeholder="Bapak / Ibu..."/></div>
                <div><Label required>Alamat / Kota</Label><Input value={alamatWali} onChange={e=>setAlamatWali(e.target.value)} placeholder="Yogyakarta / Solo..."/></div>
              </div>

              {/* Toggle penjemput beda */}
              <label className="flex items-center justify-between px-4 py-3.5 bg-slate-50 border border-border rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">Penjemput berbeda dengan wali?</p>
                  <p className="text-xs text-muted-foreground">Aktifkan jika yang menjemput bukan wali santri</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${bedaPenjemput?"bg-primary":"bg-slate-200"}`}
                  onClick={()=>setBedaPenjemput(p=>!p)}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${bedaPenjemput?"left-7":"left-1"}`}/>
                </div>
              </label>

              {bedaPenjemput && (
                <div className="grid sm:grid-cols-2 gap-3 fade-up">
                  <div><Label>Nama Penjemput</Label><Input value={namaPenjemput} onChange={e=>setNamaPenjemput(e.target.value)} placeholder="Nama penjemput..."/></div>
                  <div>
                    <Label>Hubungan</Label>
                    <SelectField value={hubungan} onChange={e=>setHubungan(e.target.value)}>
                      <option>Orang Tua (Ayah/Ibu)</option>
                      <option>Wali / Keluarga</option>
                      <option>Saudara Kandung</option>
                      <option>Travel / Kendaraan Online</option>
                      <option>Lainnya</option>
                    </SelectField>
                  </div>
                </div>
              )}

              {/* Summary card */}
              <div className="rounded-2xl border border-border bg-slate-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary"/>
                  <span className="text-xs font-bold text-foreground">Ringkasan Surat Izin</span>
                </div>
                <div className="px-4 py-3 space-y-1.5 text-xs">
                  {[
                    ["Santri",    students.map(s=>s.name).join(", ")],
                    ["Jenis",     jenisInfo.title],
                    ["Keperluan", keperluan],
                    ["Tujuan",    tujuan],
                    ["Keluar",    `${fmtDate(tglKeluar)} — ${jamKeluar} WIB`],
                    ["Kembali",   overnight?`${fmtDate(tglKembali||tglKeluar)} — ${jamKembali} WIB`:`${jamKembali} WIB`],
                    ["Status",    approval.status==="APPROVED"?"✅ Langsung Disetujui":"⏳ Menunggu ACC Ustadz"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0 font-medium">{k}:</span>
                      <span className="font-semibold text-foreground break-words">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>}

          </div>{/* /step content */}

          {/* Error */}
          {error && (
            <div className="mx-5 mb-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 font-medium fade-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/> {error}
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-slate-50/50">
          <button type="button" onClick={goBack}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-2xl border border-border bg-white hover:bg-muted transition-colors btn-press">
            <ArrowLeft className="w-4 h-4"/>{step===1?"Batal":"Kembali"}
          </button>
          {step<4
            ? <button type="button" onClick={goNext} disabled={step===1&&students.length===0}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl bg-primary text-white hover:bg-blue-700 transition-colors btn-press disabled:opacity-40"
                style={{boxShadow:"0 2px 12px -2px rgba(37,99,235,0.35)"}}>
                Lanjut <ChevronRight className="w-4 h-4"/>
              </button>
            : <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl bg-primary text-white hover:bg-blue-700 transition-colors btn-press disabled:opacity-40"
                style={{boxShadow:"0 2px 12px -2px rgba(37,99,235,0.35)"}}>
                {submitting?<><RefreshCw className="w-4 h-4 animate-spin"/>Menyimpan...</>:<><Send className="w-4 h-4"/>Terbitkan Izin</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Page: Login ────────────────────────────────────────────────
function PageLogin({ setPage, onLogin }: { setPage:(p:PageId)=>void; onLogin:(u:UserSession)=>void }) {
  const [selectedClass, setSelectedClass] = useState<string>("1A");

  useEffect(() => {
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

        (window as any).google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "pill"
        });
      } catch (e) {
        console.warn("GSI rendering error:", e);
      }
    }
  }, []);

  function loginAsPamong(p: { name: string; email: string }) {
    onLogin({ name: p.name, email: p.email, role: "pamong" });
    setPage("history");
  }

  function loginAsMusyrif(cKey: string) {
    const m = musyrifData[cKey] || { name: `Musyrif ${cKey}`, email: `musyrif.${cKey.toLowerCase()}@muallimin.sch.id` };
    onLogin({ name: `${m.name} (${getClassLabel(cKey)})`, email: m.email || `${cKey.toLowerCase()}@muallimin.sch.id`, role: "musyrif" });
    setPage("history");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-border overflow-hidden" style={{boxShadow:"0 8px 32px -8px rgba(15,23,42,0.12)"}}>
        <div className="px-6 py-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
          <button onClick={()=>setPage("home")} className="flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5"/> Beranda
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-blue-300"/>
          </div>
          <h3 className="font-extrabold text-lg">Login Autentikasi Ustadz</h3>
          <p className="text-sm text-blue-300 mt-1">Verifikasi &amp; Persetujuan Perizinan Santri</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-muted-foreground space-y-1 border border-border">
            <p><strong className="text-foreground">Wali Santri:</strong> Bebas mengajukan &amp; cek status tanpa login.</p>
            <p><strong className="text-foreground">Musyrif / Pamong:</strong> Wajib login terautentikasi untuk menyetujui (ACC) atau menolak izin.</p>
          </div>

          <div className="space-y-4">
            {/* Google Authentication Only */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Login Autentikasi Resmi Google</p>
              <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]"></div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0"/> Ketentuan Hak Akses Pengurus:
              </p>
              <ul className="list-disc pl-4 text-[11px] text-blue-800 space-y-0.5">
                <li>Gunakan email Google resmi yang terdaftar sebagai <strong>Musyrif Kelas</strong> atau <strong>Pamong Asrama</strong>.</li>
                <li>Sistem otomatis mencocokkan email dengan whitelist server untuk menentukan hak persetujuan perizinan (ACC).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Pass ─────────────────────────────────────────────────
function PagePass({ passData, setPage }: { passData:IzinRecord|null; setPage:(p:PageId)=>void }) {
  if (!passData) return null;

  function shareWA() {
    const t = `*SURAT IZIN SEDAYU RESMI*\n\n*ID:* ${passData!.idIzin}\n*Santri:* ${passData!.namaSantri} (${passData!.kelas})\n*Jenis:* ${passData!.jenisIzin}\n*Wali:* ${passData!.namaWali}\n*Keperluan:* ${passData!.keperluan}\n*Tujuan:* ${passData!.tujuan}\n*Keluar:* ${fmtDateLong(passData!.tanggalKeluar)} — ${passData!.jamKeluar} WIB\n*Kembali:* ${fmtDateLong(passData!.tanggalKembali)} — ${passData!.jamKembali} WIB\n*Status:* ${passData!.status}\n\n_Diterbitkan via Izin Sedayu — Mu'allimin Yogyakarta_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`,"_blank");
  }

  const isApproved = passData.status === "APPROVED";

  return (
    <div className="max-w-sm mx-auto px-4 py-6">

      {/* Success banner */}
      <div className={`mb-4 flex items-center gap-3 p-4 rounded-2xl scale-pop
        ${isApproved ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isApproved ? "bg-emerald-100" : "bg-amber-100"}`}>
          {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-600"/> : <Clock className="w-5 h-5 text-amber-600"/>}
        </div>
        <div>
          <p className={`font-bold text-sm ${isApproved?"text-emerald-900":"text-amber-900"}`}>
            {isApproved ? "Izin Disetujui!" : "Izin Terkirim"}
          </p>
          <p className={`text-xs ${isApproved?"text-emerald-600":"text-amber-600"}`}>
            {isApproved ? "Santri dapat keluar sesuai jadwal" : "Menunggu persetujuan ustadz"}
          </p>
        </div>
      </div>

      {/* Official pass card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden"
        style={{boxShadow:"0 8px 32px -8px rgba(15,23,42,0.15)"}}>

        {/* Card header */}
        <div className="relative px-5 py-4 overflow-hidden"
          style={{background:"linear-gradient(135deg,#0f172a,#1e3a8a)"}}>
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage:`url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='white'/%3E%3C/svg%3E")`}}/>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white"/>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-widest text-blue-300 uppercase">Madrasah Mu'allimin</p>
                <p className="text-sm font-extrabold text-white tracking-tight">SURAT IZIN RESMI</p>
              </div>
            </div>
            <StatusBadge status={passData.status} size="md"/>
          </div>
          <p className="relative mt-2 font-mono text-xs text-blue-300 opacity-80">{passData.idIzin}</p>
        </div>

        {/* Main content */}
        <div className="px-5 py-4 space-y-4">

          {/* Santri highlight */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-extrabold text-lg flex items-center justify-center flex-shrink-0">
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
              ["Jenis Izin",  passData.jenisIzin],
              ["Keperluan",   passData.keperluan],
              ["Tujuan",      passData.tujuan],
              ["Wali",        passData.namaWali],
              ["Penjemput",   `${passData.namaPenjemput} (${passData.hubunganPenjemput})`],
            ].map(([k,v])=>(
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground w-20 flex-shrink-0 font-medium">{k}:</span>
                <span className="font-semibold text-foreground break-words">{v}</span>
              </div>
            ))}
          </div>

          {/* Time block */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {label:"Keluar",  date:passData.tanggalKeluar, jam:passData.jamKeluar,  icon:<Calendar className="w-3.5 h-3.5"/>},
              {label:"Kembali", date:passData.tanggalKembali,jam:passData.jamKembali, icon:<CheckCircle2 className="w-3.5 h-3.5"/>},
            ].map(t=>(
              <div key={t.label} className="p-3 bg-slate-50 rounded-2xl border border-border text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  {t.icon}<span className="text-[10px] font-bold uppercase">{t.label}</span>
                </div>
                <p className="text-xs font-bold text-foreground">{fmtDate(t.date)}</p>
                <p className="text-lg font-extrabold text-primary">{t.jam}</p>
                <p className="text-[10px] text-muted-foreground">WIB</p>
              </div>
            ))}
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center gap-3 p-4 bg-slate-900 rounded-2xl">
            <QRCodeSVG value={passData.idIzin} size={100} level="H" bgColor="#0f172a" fgColor="#f8fafc"/>
            <div className="text-center">
              <p className="text-xs font-bold text-white">Kode Verifikasi</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Scan untuk memverifikasi keaslian surat</p>
            </div>
          </div>

          {/* Pemberi izin */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0"/>
            <span>Diterbitkan oleh: <strong className="text-foreground">{passData.pemberiIzin}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
          <button onClick={shareWA}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-colors btn-press">
            <Share2 className="w-4 h-4"/> WhatsApp
          </button>
          <button onClick={()=>window.print()}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-slate-800 text-white rounded-2xl text-xs font-bold hover:bg-slate-700 transition-colors btn-press">
            <Printer className="w-4 h-4"/> Cetak
          </button>
          <button onClick={()=>setPage("history")}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-colors btn-press"
            style={{boxShadow:"0 2px 12px -2px rgba(37,99,235,0.35)"}}>
            <BarChart2 className="w-4 h-4"/> Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Card ───────────────────────────────────────────────
function HistoryCard({ item, currentUser, onApprove, onReject, onReturn }: {
  item:IzinRecord; currentUser:UserSession|null;
  onApprove:()=>void; onReject:()=>void; onReturn:()=>void;
}) {
  const [expanded, setExpanded] = useState(false);
  const leftColor: Record<StatusType,string> = {
    APPROVED:"border-l-emerald-500", PENDING:"border-l-amber-400",
    REJECTED:"border-l-rose-500",    RETURNED:"border-l-blue-500",
  };
  const names = item.namaSantri?.split(",").map(s=>s.trim())||[];

  return (
    <div className={`bg-white rounded-2xl border border-border border-l-4 ${leftColor[item.status as StatusType]||leftColor.PENDING} overflow-hidden transition-shadow hover:shadow-md`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {names.map((n,i)=>(
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-border rounded-lg text-xs font-bold">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">{n.charAt(0)}</span>
                  {n}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="font-mono text-primary text-[10px]">{item.idIzin}</span>
              <span className="text-slate-200">|</span>
              <span>{item.kelas}</span>
              <span className="text-slate-200">|</span>
              <span>{item.jamKeluar}–{item.jamKembali} WIB</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={item.status as StatusType}/>
            <button onClick={()=>setExpanded(o=>!o)}
              className="w-7 h-7 rounded-xl bg-slate-50 border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded?"rotate-180":""}`}/>
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{item.keperluan} &rarr; {item.tujuan}</p>
      </div>

      {expanded && (
        <div className="px-4 py-3.5 border-t border-border bg-slate-50/50 space-y-1.5 text-xs fade-up">
          {[
            ["Jenis Izin",   item.jenisIzin],
            ["Wali",         item.namaWali],
            ["Penjemput",    `${item.namaPenjemput} (${item.hubunganPenjemput})`],
            ["Keluar",       `${fmtDateLong(item.tanggalKeluar)} — ${item.jamKeluar} WIB`],
            ["Kembali",      `${fmtDateLong(item.tanggalKembali)} — ${item.jamKembali} WIB`],
            ["Pemberi Izin", item.pemberiIzin],
            ...(item.catatanAdmin?[["Catatan",item.catatanAdmin]]:[]),
          ].map(([k,v])=>(
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground w-20 flex-shrink-0 font-medium">{k}:</span>
              <span className="text-foreground break-words">{v}</span>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <div className="px-4 py-3 border-t border-border flex flex-wrap gap-2">
          {item.status==="PENDING" && <>
            <button onClick={onApprove}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors btn-press">
              <CheckCircle2 className="w-3.5 h-3.5"/> Setujui
            </button>
            <button onClick={onReject}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors btn-press">
              <XCircle className="w-3.5 h-3.5"/> Tolak
            </button>
          </>}
          {item.status==="APPROVED" && (
            <button onClick={onReturn}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-press">
              <RefreshCw className="w-3.5 h-3.5"/> Tandai Kembali
            </button>
          )}
          {(item.status==="REJECTED"||item.status==="RETURNED") && (
            <span className="text-xs text-muted-foreground italic py-1.5">{item.catatanAdmin}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page: History ──────────────────────────────────────────────
function PageHistory({ currentUser, setPage, onLoginRequest }: {
  currentUser:UserSession|null; setPage:(p:PageId)=>void; onLoginRequest:()=>void;
}) {
  const [items,      setItems]      = useState<IzinRecord[]>([]);
  const [statusF,    setStatusF]    = useState<"all"|StatusType>("all");
  const [dateF,      setDateF]      = useState<"today"|"all">("today");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);

  const load = useCallback(()=>{
    setLoading(true);
    fetchRemoteData().then(data => {
      setItems(data);
      setLoading(false);
    });
  },[]);

  useEffect(()=>{ load(); },[load]);

  function approve(id:string) {
    if(!currentUser){toast.error("Login Musyrif diperlukan");return;}
    updateStatus(id,"APPROVED",`Disetujui oleh ${currentUser.name}`, currentUser);
    setItems(getLocal()); toast.success("Izin disetujui.");
  }
  function reject(id:string) {
    if(!currentUser){toast.error("Login Musyrif diperlukan");return;}
    updateStatus(id,"REJECTED",`Ditolak oleh ${currentUser.name}`, currentUser);
    setItems(getLocal()); toast.info("Izin ditolak.");
  }
  function returnItem(id:string) {
    if(!currentUser)return;
    updateStatus(id,"RETURNED",`Santri kembali — dicatat ${currentUser.name}`, currentUser);
    setItems(getLocal()); toast.success("Status: Santri Kembali");
  }

  // Counts per status for badge
  const counts = useMemo(()=>({
    all:      items.length,
    PENDING:  items.filter(i=>i.status==="PENDING").length,
    APPROVED: items.filter(i=>i.status==="APPROVED").length,
    REJECTED: items.filter(i=>i.status==="REJECTED").length,
  }),[items]);

  const filtered = useMemo(()=>{
    let r = items;
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
  },[items,statusF,dateF,search]);

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
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center font-extrabold text-emerald-700 text-base">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-900">{currentUser.name}</p>
              <p className="text-xs text-emerald-600">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {counts.PENDING>0 && (
              <span className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full animate-pulse">
                <Clock className="w-3 h-3"/>{counts.PENDING} Menunggu
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-border rounded-2xl">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4"/>
            </div>
            <span>Login untuk menyetujui / menolak izin santri.</span>
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
            <BarChart2 className="w-4 h-4 text-primary"/> Riwayat Perizinan
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
                  onReturn={()=>returnItem(item.idIzin)}/>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────
export default function App() {
  const [page,         setPage]         = useState<PageId>("home");
  const [currentUser,  setCurrentUser]  = useState<UserSession|null>(null);
  const [passData,     setPassData]     = useState<IzinRecord|null>(null);
  const [initialJenis, setInitialJenis] = useState<JenisIzinKey>("keluar-biasa");

  useEffect(()=>{
    try {
      const s = localStorage.getItem("izin_user_session");
      if(s){ const u=JSON.parse(s); if(u?.name&&u?.email) setCurrentUser(u); }
    } catch {}

    fetchRemoteData();
    const timer = setInterval(() => {
      fetchRemoteData();
    }, 10000);
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

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="min-h-screen bg-background" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        <Toaster position="top-center" richColors closeButton expand={false}/>

        <NavBar setPage={navigate} currentUser={currentUser} onLogout={handleLogout}/>

        <main className="pb-24 md:pb-10">
          {page==="home"    && <PageHome setPage={navigate} setInitialJenis={setInitialJenis}/>}
          {page==="form"    && <PageForm currentUser={currentUser} setPage={navigate} initialJenis={initialJenis}
                                         onSubmit={r=>{setPassData(r);navigate("pass");}}/>}
          {page==="login"   && <PageLogin setPage={navigate} onLogin={handleLogin}/>}
          {page==="pass"    && <PagePass passData={passData} setPage={navigate}/>}
          {page==="history" && <PageHistory currentUser={currentUser} setPage={navigate} onLoginRequest={()=>navigate("login")}/>}
        </main>

        <BottomNav page={page} setPage={navigate}/>
      </div>
    </>
  );
}
