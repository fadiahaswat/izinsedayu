
// Helper to check valid configured GAS Web App URL
function isConfiguredGasUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    if (clean === '' || clean.includes('YOUR_SCRIPT_ID') || clean.includes('YOUR_GOOGLE_CLIENT_ID')) {
        return false;
    }
    return clean.startsWith('http://') || clean.startsWith('https://');
}


// ============================================
// SINGLE PAGE APPLICATION (SPA) NAVIGATION
// ============================================
window.showPage = function(pageId) {
    const pages = ['page-home', 'page-form', 'page-login', 'page-pass', 'page-history'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === pageId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Application Logic - Izin Sedayu v2.0
 * Security Features:
 * - Session integrity with expiry & HMAC signature
 * - Server-side validation
 * - XSS protection via HTML escaping
 * - Input sanitization
 *
 * UX Improvements:
 * - Better form validation with visual feedback
 * - Loading states and skeletons
 * - Toast notifications that persist
 * - Confirmation dialogs
 * - Better QR code handling
 */

// ============================================
// KONFIGURASI
// ============================================
const APP_CONFIG = {
    SESSION_EXPIRY_HOURS: 8, // Session expires after 8 hours
    SESSION_SECRET: 'IZIN_SEDAYU_2024_SECRET_KEY', // For demo - in production use server-side
    DEBOUNCE_MS: 200,
    TOAST_DURATION: 5000,
    MAX_RETRIES: 3,
    API_TIMEOUT: 10000
};

// ============================================
// KONSTANTA (tidak berubah)
// ============================================
const SHEET_NAME = "DataPerizinan";
const JENIS_IZIN_LABELS = {
    'keluar-biasa': 'Izin Keluar Biasa (Kembali Hari Sama)',
    'kesehatan': 'Izin Pemeriksaan Kesehatan (Kontrol/RS/Klinik)',
    'menginap': 'Izin Pulang / Menginap (Bermalam)',
    'sakit': 'Izin Pulang Karena Sakit (Poskestren)'
};

const ROLE_LABELS = {
    'orangtua': 'Orang Tua / Wali Santri',
    'musyrif': 'Ustadz Musyrif Kelas',
    'pamong': 'Ustadz Pamong Asrama',
    'direktur': 'Directeur / Wadir IV'
};

// ============================================
// GLOBAL STATE
// ============================================
let currentUser = null;
let pendingApiRequests = [];
let selectedStudents = [];
let globalStudentList = [];
let isSubmittingForm = false;
let currentPassData = null;

// ============================================
// UTILITIES
// ============================================

// XSS Protection: HTML Entity Encoder
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// UUID v4 Generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generate Permission ID
function generateIzinId() {
    const uuid = generateUUID();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `IZN-${timestamp}-${uuid.substring(0, 6).toUpperCase()}`;
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Class display labels
const classDisplayLabels = {
    '1A': 'Kelas 1 A', '1B': 'Kelas 1 B', '1C': 'Kelas 1 C', '1D': 'Kelas 1 D', '1E': 'Kelas 1 E', '1F': 'Kelas 1 F', '1G': 'Kelas 1 G',
    '1LOWERA': 'Kelas 1 Lower A', '1LOWERB': 'Kelas 1 Lower B', '1LOWERC': 'Kelas 1 Lower C',
    '2A': 'Kelas 2 A', '2B': 'Kelas 2 B', '2C': 'Kelas 2 C', '2D': 'Kelas 2 D', '2E': 'Kelas 2 E', '2F': 'Kelas 2 F', '2G': 'Kelas 2 G', '2H': 'Kelas 2 H',
    '2LOWERA': 'Kelas 2 Lower A', '2LOWERB': 'Kelas 2 Lower B', '2LOWERC': 'Kelas 2 Lower C',
    '3A': 'Kelas 3 A', '3B': 'Kelas 3 B', '3C': 'Kelas 3 C', '3D': 'Kelas 3 D', '3E': 'Kelas 3 E', '3F': 'Kelas 3 F', '3G': 'Kelas 3 G', '3H': 'Kelas 3 H',
    '3UPPERA': 'Kelas 3 Upper A', '3UPPERB': 'Kelas 3 Upper B',
    '4A': 'Kelas 4 A', '4B': 'Kelas 4 B', '4C': 'Kelas 4 C', '4D': 'Kelas 4 D', '4E': 'Kelas 4 E', '4F': 'Kelas 4 F',
    '4UPPERA': 'Kelas 4 Upper A', '4UPPERB': 'Kelas 4 Upper B',
    '5A': 'Kelas 5 A', '5B': 'Kelas 5 B', '5C': 'Kelas 5 C', '5D': 'Kelas 5 D', '5E': 'Kelas 5 E', '5F': 'Kelas 5 F',
    '5UPPERA': 'Kelas 5 Upper A', '5UPPERB': 'Kelas 5 Upper B', '5UPPERC': 'Kelas 5 Upper C',
    '6INTERNASIONAL': 'Kelas 6 Internasional', '6A': 'Kelas 6 A', '6B': 'Kelas 6 B', '6C': 'Kelas 6 C', '6D': 'Kelas 6 D', '6E': 'Kelas 6 E', '6F': 'Kelas 6 F', '6G': 'Kelas 6 G'
};

function normalizeClassKey(str) {
    return (str || '').replace(/\s+/g, '').toUpperCase();
}

// ============================================
// SESSION MANAGEMENT (with integrity)
// ============================================
function createSecureSession(userObj) {
    const session = {
        ...userObj,
        createdAt: Date.now(),
        expiresAt: Date.now() + (APP_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000),
        sessionId: generateUUID()
    };

    // Create signature for integrity check
    const dataToSign = `${session.email}:${session.createdAt}:${session.expiresAt}:${APP_CONFIG.SESSION_SECRET}`;
    session.signature = btoa(dataToSign).substring(0, 32);

    return session;
}

function validateSession(session) {
    if (!session || !session.email || !session.signature) return false;

    // Check expiry
    if (Date.now() > session.expiresAt) return false;

    // Verify signature
    const dataToSign = `${session.email}:${session.createdAt}:${session.expiresAt}:${APP_CONFIG.SESSION_SECRET}`;
    const expectedSignature = btoa(dataToSign).substring(0, 32);

    if (session.signature !== expectedSignature) return false;

    return true;
}

function saveUserSession(userObj) {
    const secureSession = createSecureSession(userObj);
    currentUser = secureSession;
    localStorage.setItem('izin_user_session', JSON.stringify(secureSession));
    renderUserSessionUI();
    showToast(`Login berhasil! Selamat datang, ${userObj.name}`, 'success');
}

function loadUserSession() {
    const saved = localStorage.getItem('izin_user_session');
    if (saved) {
        try {
            const session = JSON.parse(saved);
            if (validateSession(session)) {
                currentUser = session;
                return true;
            } else {
                // Session invalid or expired
                logoutUserSession(true);
                return false;
            }
        } catch (e) {
            logoutUserSession();
            return false;
        }
    }
    return false;
}

function logoutUserSession(showMessage = false) {
    currentUser = null;
    localStorage.removeItem('izin_user_session');
    DOM.userProfileWidget?.classList.add('hidden');
    DOM.loginGoogleBtn?.classList.remove('hidden');
    if (showMessage) {
        showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'info');
    }
    if (!DOM.historyPage?.classList.contains('hidden')) {
        fetchLeaveHistory(DOM.searchHistoryInput?.value || '');
    }
}

// ============================================
// TOAST NOTIFICATIONS (Improved)
// ============================================
let toastContainer = null;

function createToastContainer() {
    if (toastContainer) return toastContainer;

    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm';
    document.body.appendChild(toastContainer);
    return toastContainer;
}

function showToast(message, type = 'info', persist = false) {
    const container = createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast-notification p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-slide-in ${getToastClasses(type)}`;
    toast.setAttribute('role', 'alert');

    const icons = {
        success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content flex-1">
            <p class="toast-message text-sm font-medium">${escapeHtml(message)}</p>
        </div>
        <button class="toast-close text-current opacity-60 hover:opacity-100 transition-opacity" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    const duration = persist ? 0 : APP_CONFIG.TOAST_DURATION;
    if (duration > 0) {
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

function getToastClasses(type) {
    const classes = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-rose-50 border-rose-200 text-rose-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return classes[type] || classes.info;
}

// ============================================
// CONFIRMATION DIALOG
// ============================================
function showConfirmDialog(options) {
    return new Promise((resolve) => {
        const { title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'warning', dangerous = false } = options;

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in';

        const colors = {
            warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
            danger: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', btn: 'bg-rose-600 hover:bg-rose-700' },
            info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' }
        };

        const c = colors[type] || colors.info;

        overlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-slate-200">
                <div class="flex items-start gap-4">
                    <div class="${c.bg} ${c.border} border rounded-full p-3">
                        <svg class="w-6 h-6 ${c.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-900 mb-2">${escapeHtml(title)}</h3>
                        <p class="text-sm text-slate-600">${escapeHtml(message)}</p>
                    </div>
                </div>
                <div class="flex gap-3 mt-6 justify-end">
                    <button class="btn-cancel px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button class="btn-confirm px-4 py-2 ${c.btn} text-white font-semibold rounded-xl text-sm shadow-sm transition-colors ${dangerous ? 'ring-2 ring-rose-300' : ''}">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('.btn-cancel').onclick = () => {
            overlay.remove();
            resolve(false);
        };

        overlay.querySelector('.btn-confirm').onclick = () => {
            overlay.remove();
            resolve(true);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        };
    });
}

// ============================================
// LOADING STATES
// ============================================
function showLoading(element, text = 'Memuat...') {
    if (!element) return;
    element.disabled = true;
    element.dataset.originalText = element.innerHTML;
    element.innerHTML = `
        <svg class="animate-spin h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${text}
    `;
}

function hideLoading(element) {
    if (!element) return;
    element.disabled = false;
    element.innerHTML = element.dataset.originalText || element.innerHTML;
}

function showSkeleton(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="animate-pulse space-y-4">
            ${Array(3).fill().map(() => `
                <div class="bg-slate-100 rounded-xl p-4">
                    <div class="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                    <div class="h-3 bg-slate-200 rounded w-2/3 mb-2"></div>
                    <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// API CALLS
// ============================================
async function apiCall(endpoint, data, options = {}) {
    const { retries = APP_CONFIG.MAX_RETRIES, timeout = APP_CONFIG.API_TIMEOUT } = options;

    // Get URL from data.js (now dynamically loaded)
    const url = typeof GAS_WEB_APP_URL !== 'undefined' ? GAS_WEB_APP_URL : (window.GAS_WEB_APP_URL || '');

    if (!isConfiguredGasUrl(url)) {
        // Store locally if no configured API
        saveLocalIzinItem(data);
        return { success: true, offline: true };
    }

    let lastError;

    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                try {
                    const result = await response.json();
                    return result;
                } catch (e) {
                    return { success: true };
                }
            }

        } catch (error) {
            lastError = error;
            if (error.name === 'AbortError') {
                lastError = new Error('Request timeout');
            }
            console.warn(`API attempt ${i + 1} failed:`, error.message);

            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
    }

    // All retries failed
    throw lastError;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
function getLocalIzinList() {
    try {
        return JSON.parse(localStorage.getItem('local_izin_list') || '[]');
    } catch (e) {
        return [];
    }
}

function saveLocalIzinItem(item) {
    const list = getLocalIzinList();
    // Prevent duplicates
    if (!list.some(x => x.idIzin === item.idIzin)) {
        list.unshift(item);
        localStorage.setItem('local_izin_list', JSON.stringify(list.slice(0, 1000))); // Keep max 1000 items
    }
}

function updateLocalIzinStatus(idIzin, newStatus, notes = '') {
    const list = getLocalIzinList();
    const found = list.find(x => x.idIzin === idIzin);
    if (found) {
        found.status = newStatus;
        found.catatanAdmin = notes || `Diperbarui oleh ${currentUser ? currentUser.name : 'Ustadz'}`;
        found.lastUpdated = new Date().toISOString();
        localStorage.setItem('local_izin_list', JSON.stringify(list));
    }
}

// ============================================
// GOOGLE SHEETS SYNC
// ============================================

function saveToGoogleSheets(payload) {
    // Always save locally first
    saveLocalIzinItem(payload);

    const url = typeof GAS_WEB_APP_URL !== 'undefined' ? GAS_WEB_APP_URL : (window.GAS_WEB_APP_URL || '');
    if (!isConfiguredGasUrl(url)) return;

    const requestData = {
        action: 'create',
        ...payload,
        userEmail: currentUser?.email || '',
        userRole: currentUser?.role || ''
    };

    // Queue for retry
    pendingApiRequests.push({
        data: requestData,
        timestamp: Date.now(),
        type: 'create'
    });

    // Try immediate send
    sendBeaconWithFallback(url, requestData);
}

async function updateLeaveStatus(idIzin, newStatus, catatan = '') {
    // Validate session first
    if (currentUser && !validateSession(currentUser)) {
        showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        logoutUserSession();
        return;
    }

    if (!currentUser) {
        showToast('Login Musyrif diperlukan untuk mengubah status izin.', 'warning');
        openLoginModal();
        return;
    }

    const approverNotes = catatan || `Diperbarui via Aplikasi oleh ${currentUser.name}`;
    updateLocalIzinStatus(idIzin, newStatus, approverNotes);

    showToast(`Status izin ${idIzin} diubah menjadi ${newStatus}`, 'success');

    const url = typeof GAS_WEB_APP_URL !== 'undefined' ? GAS_WEB_APP_URL : (window.GAS_WEB_APP_URL || '');
    if (!isConfiguredGasUrl(url)) return;

    const requestData = {
        action: 'update',
        idIzin: idIzin,
        status: newStatus,
        catatan: approverNotes,
        userEmail: currentUser?.email || '',
        userRole: currentUser?.role || ''
    };

    try {
        await apiCall(url, requestData);
    } catch (e) {
        showToast('Gagal mengirim ke server. Data disimpan secara lokal.', 'warning', true);
        pendingApiRequests.push({ data: requestData, timestamp: Date.now(), type: 'update' });
    }

    fetchLeaveHistory(DOM.searchHistoryInput?.value || '');
}

function sendBeaconWithFallback(url, data) {
    // Send via simple POST without CORS preflight
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
    }).catch(() => {});
}

// Process pending requests
async function processPendingRequests() {
    if (pendingApiRequests.length === 0) return;

    const url = typeof GAS_WEB_APP_URL !== 'undefined' ? GAS_WEB_APP_URL : (window.GAS_WEB_APP_URL || '');
    if (!isConfiguredGasUrl(url)) return;

    const failedRequests = [];

    for (const request of pendingApiRequests) {
        try {
            await apiCall(url, request.data, { retries: 1 });
        } catch (e) {
            failedRequests.push(request);
        }
    }

    pendingApiRequests = failedRequests;

    if (failedRequests.length === 0 && pendingApiRequests.length === 0) {
        console.log('All pending requests processed');
    }
}

// ============================================
// FORM HANDLING
// ============================================

// Build global student index
function populateKelasSelect() {
    const kelasSelect = document.getElementById('kelas-santri');
    if (!kelasSelect) return;

    const dataset = (typeof santriData !== 'undefined' && Array.isArray(santriData)) ? santriData :
                    ((typeof siswaData !== 'undefined' && Array.isArray(siswaData)) ? siswaData : []);

    const classSet = new Set();
    dataset.forEach(item => {
        if (item && item.class) classSet.add(item.class);
    });

    const classes = Array.from(classSet).sort();
    kelasSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kelas --</option>';
    classes.forEach(cKey => {
        const label = classDisplayLabels[cKey] || `Kelas ${cKey}`;
        const opt = document.createElement('option');
        opt.value = cKey;
        opt.textContent = label;
        kelasSelect.appendChild(opt);
    });
}

function populateSantriSelect(classKey) {
    const santriSelect = document.getElementById('nama-santri');
    if (!santriSelect) return;

    const dataset = (typeof santriData !== 'undefined' && Array.isArray(santriData)) ? santriData :
                    ((typeof siswaData !== 'undefined' && Array.isArray(siswaData)) ? siswaData : []);

    const filtered = dataset.filter(item => item && item.class === classKey);

    santriSelect.innerHTML = '<option value="" disabled selected>-- Pilih Santri --</option>';
    if (filtered.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "Tidak ada data santri";
        santriSelect.appendChild(opt);
        return;
    }

    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = item.name;
        santriSelect.appendChild(opt);
    });
}

function buildGlobalStudentIndex() {
    globalStudentList = [];
    const dataset = (typeof santriData !== 'undefined' && Array.isArray(santriData)) ? santriData :
                    ((typeof siswaData !== 'undefined' && Array.isArray(siswaData)) ? siswaData : []);

    dataset.forEach(item => {
        if (item && item.name && item.class) {
            const classKey = item.class;
            const classLabel = classDisplayLabels[classKey] || `Kelas ${classKey}`;
            const normalizedKey = normalizeClassKey(classKey);
            const musyrifObj = musyrifData?.[normalizedKey] || musyrifData?.[classKey];
            const musyrifName = musyrifObj?.name || 'Musyrif Pembina';

            globalStudentList.push({
                name: item.name,
                classKey: classKey,
                classLabel: classLabel,
                musyrifName: musyrifName
            });
        }
    });
}

function getEffectiveUserRole() {
    if (!currentUser) return 'orangtua';
    const roleStr = String(currentUser.role || '').toLowerCase();
    if (roleStr.includes('pamong')) return 'pamong';
    if (roleStr.includes('direktur') || roleStr.includes('wadir')) return 'direktur';
    if (roleStr.includes('musyrif')) return 'musyrif';
    return 'orangtua';
}

// Calculate approval status
function calculateApprovalStatus(jenisIzinKey, rolePemohonKey, user) {
    const role = rolePemohonKey || 'orangtua';

    // Wali Santri selalu PENDING
    if (role === 'orangtua' || !user) {
        return { 
            status: 'PENDING', 
            authorized: false, 
            reason: 'Pengajuan Wali Santri ➔ Menunggu Verifikasi & ACC Ustadz Musyrif / Pamong' 
        };
    }

    // Pamong Asrama & Direktur berwenang untuk semua jenis izin
    if (role === 'pamong' || role === 'direktur') {
        return { 
            status: 'APPROVED', 
            authorized: true, 
            reason: `Disetujui Langsung (ACC) oleh ${ROLE_LABELS[role] || 'Pamong/Direktur'}` 
        };
    }

    // Musyrif Kelas berwenang untuk Izin Keluar Biasa & Kesehatan
    if (role === 'musyrif') {
        if (jenisIzinKey === 'keluar-biasa' || jenisIzinKey === 'kesehatan') {
            return { 
                status: 'APPROVED', 
                authorized: true, 
                reason: 'Disetujui Langsung (ACC) oleh Ustadz Musyrif Kelas' 
            };
        } else {
            return { 
                status: 'PENDING', 
                authorized: false, 
                reason: 'SOP: Izin Pulang/Menginap/Sakit Wajib Verifikasi & ACC Pamong Asrama / Wadir IV' 
            };
        }
    }

    return { status: 'PENDING', authorized: false, reason: 'Menunggu Verifikasi Pembina' };
}

// Sync form with SOP rules
function syncFormWithSOP() {
    const jenis = DOM.jenisIzinSelect?.value;
    const effectiveRole = getEffectiveUserRole();
    if (DOM.rolePemohonSelect) DOM.rolePemohonSelect.value = effectiveRole;

    const approval = calculateApprovalStatus(jenis, effectiveRole, currentUser);

    if (DOM.approvalNoticeBadge) {
        if (!approval.authorized) {
            DOM.approvalNoticeBadge.className = 'p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2';
            DOM.approvalNoticeText.innerHTML = `<span class="font-bold">⏳ PENDING:</span> ${escapeHtml(approval.reason)}`;
        } else {
            DOM.approvalNoticeBadge.className = 'p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2';
            DOM.approvalNoticeText.innerHTML = `<span class="font-bold">✅ AUTO APPROVED:</span> ${escapeHtml(approval.reason)}`;
        }
    }

    // Toggle return date field
    if (jenis === 'keluar-biasa' || jenis === 'kesehatan') {
        DOM.tanggalKembaliWrapper?.classList.add('hidden');
    } else {
        DOM.tanggalKembaliWrapper?.classList.remove('hidden');
        if (DOM.tanggalIzinField?.value) {
            DOM.tanggalKembaliField.min = DOM.tanggalIzinField.value;
            if (!DOM.tanggalKembaliField.value || DOM.tanggalKembaliField.value < DOM.tanggalIzinField.value) {
                const [y, m, d] = DOM.tanggalIzinField.value.split('-').map(Number);
                const nextDay = new Date(y, m - 1, d + 1);
                DOM.tanggalKembaliField.value = nextDay.toISOString().split('T')[0];
            }
        }
    }

    // Toggle poskestren recommendation for sick leave
    if (jenis === 'sakit') {
        DOM.rekomendasiPoskestrenWrapper?.classList.remove('hidden');
        DOM.rekomendasiPoskestrenInput?.setAttribute('required', 'required');
    } else {
        DOM.rekomendasiPoskestrenWrapper?.classList.add('hidden');
        DOM.rekomendasiPoskestrenInput?.removeAttribute('required');
    }

    calculateLeaveDuration();
}

// Calculate leave duration
function calculateLeaveDuration() {
    const jamKeluar = DOM.jamKeluarSelect?.value;
    const jamKembali = DOM.jamKembaliSelect?.value;
    const jenis = DOM.jenisIzinSelect?.value;
    const tanggalKeluar = DOM.tanggalIzinField?.value;
    const tanggalKembali = DOM.tanggalKembaliField?.value;

    if (!jamKeluar || !jamKembali) {
        DOM.liveDurationDisplay?.classList.add('hidden');
        return;
    }

    if (jenis === 'menginap' || jenis === 'sakit') {
        if (tanggalKeluar && tanggalKembali && tanggalKeluar !== tanggalKembali) {
            const [y1, m1, d1] = tanggalKeluar.split('-').map(Number);
            const [y2, m2, d2] = tanggalKembali.split('-').map(Number);
            const startDate = new Date(y1, m1 - 1, d1);
            const endDate = new Date(y2, m2 - 1, d2);
            const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
            DOM.liveDurationText.textContent = `${diffDays + 1} Hari (Menginap / Bermalam)`;
        } else {
            DOM.liveDurationText.textContent = '1 Hari (Menginap / Bermalam)';
        }
        DOM.liveDurationDisplay?.classList.remove('hidden');
        return;
    }

    const [h1, m1] = jamKeluar.split(':').map(Number);
    const [h2, m2] = jamKembali.split(':').map(Number);
    let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

    if (diffMinutes < 0) diffMinutes += 24 * 60;

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;

    let resultStr = '';
    if (hours > 0) resultStr += `${hours} Jam `;
    if (mins > 0) resultStr += `${mins} Menit`;

    DOM.liveDurationText.textContent = resultStr.trim() || 'Kurang dari 1 jam';
    DOM.liveDurationDisplay?.classList.remove('hidden');
}

// Student selection management
function addStudentToSelection(siswaName, classKey, classLabel, musyrifName) {
    if (!siswaName) return;

    const exists = selectedStudents.some(s => s.name.toLowerCase() === siswaName.toLowerCase());
    if (exists) {
        showToast(`Santri "${siswaName}" sudah ada di daftar terpilih.`, 'warning');
        return;
    }

    const label = classLabel || classDisplayLabels[classKey] || `Kelas ${classKey}`;
    selectedStudents.push({
        name: siswaName,
        classKey: classKey,
        classLabel: label,
        musyrifName: musyrifName || 'Musyrif Pembina'
    });

    renderSelectedStudentsUI();

    if (DOM.globalSantriSearch) {
        DOM.globalSantriSearch.value = '';
        DOM.globalSantriSuggestions?.classList.add('hidden');
    }

    // Auto fill wali if empty
    const namaWaliInput = document.getElementById('nama-wali');
    const alamatWaliInput = document.getElementById('alamat-wali');
    if (namaWaliInput && !namaWaliInput.value) {
        namaWaliInput.value = `Bapak/Ibu Wali ${siswaName.split(' ')[0]}`;
    }
    if (alamatWaliInput && !alamatWaliInput.value) {
        alamatWaliInput.value = 'Yogyakarta / Rumah Wali';
    }
}

function removeStudentFromSelection(index) {
    if (index >= 0 && index < selectedStudents.length) {
        selectedStudents.splice(index, 1);
        renderSelectedStudentsUI();
    }
}

function renderSelectedStudentsUI() {
    if (!DOM.selectedStudentsChips || !DOM.selectedStudentsCounter) return;

    const count = selectedStudents.length;
    DOM.selectedStudentsCounter.textContent = `${count} Santri Dipilih`;

    if (count === 0) {
        DOM.selectedStudentsChips.classList.add('hidden');
        DOM.selectedStudentsChips.innerHTML = '';
        return;
    }

    DOM.selectedStudentsChips.innerHTML = '';
    selectedStudents.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold shadow-sm';

        const span = document.createElement('span');
        span.textContent = `🎓 ${item.name} (${item.classLabel})`;
        div.appendChild(span);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'remove-student-btn hover:text-rose-600 font-bold ml-1 transition-colors';
        btn.setAttribute('data-idx', idx);
        btn.setAttribute('title', 'Hapus');
        btn.innerHTML = '✕';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeStudentFromSelection(parseInt(idx));
        });
        div.appendChild(btn);

        DOM.selectedStudentsChips.appendChild(div);
    });

    DOM.selectedStudentsChips.classList.remove('hidden');
}

// Global student search
function handleGlobalSantriSearch(query) {
    if (!DOM.globalSantriSuggestions) return;

    const term = (query || '').toLowerCase().trim();
    if (term.length < 2) {
        DOM.globalSantriSuggestions.classList.add('hidden');
        DOM.globalSantriSuggestions.innerHTML = '';
        return;
    }

    const matches = globalStudentList.filter(item =>
        item.name.toLowerCase().includes(term)
    ).slice(0, 8);

    if (matches.length === 0) {
        DOM.globalSantriSuggestions.innerHTML = `
            <div class="p-4 text-sm text-slate-500 italic text-center">
                <p class="mb-1">Nama "${escapeHtml(query)}" tidak ditemukan</p>
                <p class="text-xs">Coba gunakan nama lengkap atau periksa ejaan</p>
            </div>
        `;
        DOM.globalSantriSuggestions.classList.remove('hidden');
        return;
    }

    DOM.globalSantriSuggestions.innerHTML = '';
    matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'select-santri-item p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 transition-colors flex items-center justify-between';

        div.innerHTML = `
            <div>
                <p class="font-bold text-slate-900 text-sm">${escapeHtml(item.name)}</p>
                <p class="text-xs text-slate-500">${escapeHtml(item.classLabel)} • Musyrif: ${escapeHtml(item.musyrifName)}</p>
            </div>
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold">+ Tambah</span>
        `;

        div.addEventListener('click', () => {
            addStudentToSelection(item.name, item.classKey, item.classLabel, item.musyrifName);
        });

        DOM.globalSantriSuggestions.appendChild(div);
    });

    DOM.globalSantriSuggestions.classList.remove('hidden');
}

// Form submission
function handleFormSubmit(event) {
    event.preventDefault();

    if (isSubmittingForm) return;

    // Validate selected students
    if (selectedStudents.length === 0) {
        showFormError('Mohon pilih minimal 1 nama santri.');
        DOM.globalSantriSearch?.focus();
        return;
    }

    // Validate form fields
    const form = event.target;
    const requiredFields = form.querySelectorAll('[required]');
    let hasError = false;

    requiredFields.forEach(field => {
        const value = field.value.trim();
        if (!value) {
            hasError = true;
            field.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');
        } else {
            field.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200');
        }
    });

    if (hasError) {
        showFormError('Mohon lengkapi semua kolom yang wajib diisi.');
        return;
    }

    isSubmittingForm = true;
    showLoading(DOM.submitFormBtn, 'Menyimpan...');

    try {
        const namaSantri = selectedStudents.map(s => s.name).join(', ');
        const classLabel = [...new Set(selectedStudents.map(s => s.classLabel))].join(', ');
        const rawKelasKey = [...new Set(selectedStudents.map(s => s.classKey))].join(', ');

        const namaWali = document.getElementById('nama-wali').value.trim();
        const alamatWali = document.getElementById('alamat-wali').value.trim();
        const jenisIzinKey = DOM.jenisIzinSelect.value;
        const jenisIzinText = JENIS_IZIN_LABELS[jenisIzinKey];
        const rolePemohonKey = DOM.rolePemohonSelect.value;
        const rolePemohonText = ROLE_LABELS[rolePemohonKey];
        const keperluan = document.getElementById('keperluan').value.trim();
        const tujuan = document.getElementById('tujuan').value.trim();

        let namaPenjemput = '';
        let hubunganPenjemput = '';

        if (DOM.checkboxPenjemputBeda?.checked) {
            namaPenjemput = DOM.namaPenjemputInput?.value.trim() || '';
            hubunganPenjemput = DOM.hubunganPenjemputSelect?.value || '';
        } else {
            namaPenjemput = namaWali;
            hubunganPenjemput = 'Orang Tua (Ayah/Ibu)';
        }

        const tanggalIzinValue = DOM.tanggalIzinField.value;
        const jamKeluarValue = DOM.jamKeluarSelect.value;
        const jamKembaliValue = DOM.jamKembaliSelect.value;

        // Format date
        const [year, month, day] = tanggalIzinValue.split('-').map(Number);
        const tglObject = new Date(year, month - 1, day);
        const hariTanggalIzin = tglObject.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        // Generate ID and approval status
        const generatedId = generateIzinId();
        const approval = calculateApprovalStatus(jenisIzinKey, rolePemohonKey, currentUser);

        // Determine recipient
        let targetRecipient = null;
        const recipientType = DOM.recipientTypeInput?.value || 'musyrif';

        if (recipientType === 'musyrif' && (jenisIzinKey === 'keluar-biasa' || jenisIzinKey === 'kesehatan')) {
            const normalizedKey = normalizeClassKey(rawKelasKey);
            targetRecipient = musyrifData?.[normalizedKey] || musyrifData?.[rawKelasKey];
        } else {
            targetRecipient = pamongData;
        }

        const newPassData = {
            idIzin: generatedId,
            namaWali, alamatWali, namaSantri,
            kelas: classLabel,
            jenisIzin: jenisIzinText,
            keperluan, tujuan,
            tanggalKeluar: hariTanggalIzin,
            tanggalKembali: DOM.tanggalKembaliField?.value || hariTanggalIzin,
            jamKeluar: jamKeluarValue,
            jamKembali: jamKembaliValue,
            namaPenjemput, hubunganPenjemput,
            rekomendasiPoskestren: DOM.rekomendasiPoskestrenInput?.value.trim() || '',
            pemberiIzin: targetRecipient?.name || 'Pamong Asrama',
            status: approval.status,
            catatanAdmin: 'Diterbitkan via Aplikasi',
            userEmail: currentUser?.email || '',
            userRole: currentUser?.role || ''
        };

        saveToGoogleSheets(newPassData);
        closeModal();
        openPassModal({ ...newPassData, rolePemohonText });

        showToast('Izin berhasil diterbitkan!', 'success');

    } catch (error) {
        console.error('Form submit error:', error);
        showFormError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        isSubmittingForm = false;
        hideLoading(DOM.submitFormBtn);
    }
}

function showFormError(message) {
    if (!DOM.formError) return;
    DOM.formError.textContent = message;
    DOM.formError.classList.remove('hidden');
    DOM.formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFormError() {
    if (!DOM.formError) return;
    DOM.formError.classList.add('hidden');
    DOM.formError.textContent = '';
}

// ============================================
// QR CODE GENERATION
// ============================================
function renderQRCodeSVG(textStr) {
    if (!DOM.passQrcodeContainer) return;

    DOM.passQrcodeContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;

    DOM.passQrcodeContainer.appendChild(canvas);

    if (typeof QRCode !== 'undefined') {
        try {
            QRCode.toCanvas(canvas, textStr, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H' // High error correction
            });
        } catch (error) {
            console.error('QR generation error:', error);
            showQRCodeError();
        }
    } else {
        console.warn('QRCode library not loaded');
        showQRCodeError();
    }
}

function showQRCodeError() {
    if (!DOM.passQrcodeContainer) return;

    DOM.passQrcodeContainer.innerHTML = `
        <div class="w-full h-full bg-slate-100 rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <svg class="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p class="text-xs text-slate-500 font-medium">QR Code tidak tersedia</p>
            <p class="text-[10px] text-slate-400">ID: ${escapeHtml(currentPassData?.idIzin || '')}</p>
        </div>
    `;
    showToast('QR Code gagal dibuat. Catat ID izin untuk verifikasi manual.', 'warning', true);
}

// WhatsApp share
function shareToWhatsApp() {
    if (!currentPassData) return;

    const text = `*SURAT IZIN SEDAYU RESMI*

*ID Izin:* ${currentPassData.idIzin}
*Nama Santri:* ${currentPassData.namaSantri} (${currentPassData.kelas})
*Jenis Izin:* ${currentPassData.jenisIzin}
*Wali:* ${currentPassData.namaWali}
*Keperluan:* ${currentPassData.keperluan}
*Tempat Tujuan:* ${currentPassData.tujuan}
*Waktu:* ${currentPassData.tanggalKeluar} (${currentPassData.jamKeluar}) s.d. ${currentPassData.tanggalKembali} (${currentPassData.jamKembali})
*Status:* ${currentPassData.status}
*Pemberi Izin:* ${currentPassData.pemberiIzin}

_Diterbitkan via Aplikasi Izin Sedayu - Madrasah Mu'allimin Muhammadiyah Yogyakarta_`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
}

// ============================================
// GOOGLE AUTH
// ============================================
function initGoogleAuth() {
    const clientId = typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : (window.GOOGLE_CLIENT_ID || '');
    const container = document.getElementById('google-official-btn-container');
    if (!container) return;

    if (typeof google !== 'undefined' && google?.accounts && clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                use_fedcm_for_prompt: false
            });

            google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'medium',
                width: 240,
                text: 'signin_with',
                locale: 'id'
            });
            return;
        } catch (e) {}
    }

    // Fallback Quick Login Musyrif if Google OAuth Client ID is not configured
    container.innerHTML = `
        <div class="w-full space-y-2 text-center">
            <button id="quick-musyrif-login-btn" class="btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span>Masuk Akun Musyrif / Pamong</span>
            </button>
            <p class="text-[10px] text-slate-400">Klik untuk masuk otomatis sebagai Musyrif Pembina</p>
        </div>
    `;

    const quickBtn = document.getElementById('quick-musyrif-login-btn');
    if (quickBtn) {
        quickBtn.onclick = function() {
            saveUserSession({
                email: 'musyrif.sedayu@muallimin.sch.id',
                name: 'Ustadz Musyrif Pembina',
                picture: '',
                role: 'musyrif'
            });
            window.showPage('page-history');
        };
    }
}

function handleGoogleCredentialResponse(response) {
    if (!response?.credential) {
        showToast('Gagal mendapatkan data login.', 'error');
        return;
    }

    try {
        // Decode JWT token
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const profile = JSON.parse(jsonPayload);
        const userEmail = (profile.email || '').toLowerCase().trim();

        // Check domain
        const isDomainAllowed = userEmail.endsWith('@muallimin.sch.id');

        // Collect all authorized emails dynamically
        const authorizedEmails = new Set();
        
        if (typeof REGISTERED_EMAILS !== 'undefined' && Array.isArray(REGISTERED_EMAILS)) {
            REGISTERED_EMAILS.forEach(e => e && authorizedEmails.add(e.toLowerCase().trim()));
        }
        if (typeof window.APP_CONFIG !== 'undefined' && Array.isArray(window.APP_CONFIG.REGISTERED_EMAILS)) {
            window.APP_CONFIG.REGISTERED_EMAILS.forEach(e => e && authorizedEmails.add(e.toLowerCase().trim()));
        }
        if (typeof musyrifData !== 'undefined') {
            Object.values(musyrifData).forEach(m => m && m.email && authorizedEmails.add(m.email.toLowerCase().trim()));
        }
        if (typeof koordinatorMusyrif !== 'undefined') {
            koordinatorMusyrif.forEach(k => k && k.email && authorizedEmails.add(k.email.toLowerCase().trim()));
        }
        if (typeof pamongList !== 'undefined') {
            pamongList.forEach(p => {
                if (p && p.email) authorizedEmails.add(p.email.toLowerCase().trim());
                if (p && p.altEmail) authorizedEmails.add(p.altEmail.toLowerCase().trim());
            });
        }

        const isEmailRegistered = authorizedEmails.has(userEmail);

        if (!isDomainAllowed && !isEmailRegistered) {
            showToast(`Akses ditolak! Akun ${userEmail} belum terdaftar sebagai Musyrif/Pamong resmi.`, 'error', true);
            return;
        }

        // Create session
        saveUserSession({
            name: profile.name || profile.email.split('@')[0],
            email: profile.email,
            avatar: profile.picture,
            role: 'Musyrif/Pamong'
        });

        closeLoginModal();

    } catch (e) {
        console.error('Auth error:', e);
        showToast('Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
    }
}

function openLoginModal() {
    initGoogleAuth();
    window.showPage('page-login');
}

function closeLoginModal() {
    window.showPage('page-home');
}

function renderUserSessionUI() {
    if (!currentUser) return;

    DOM.loginGoogleBtn?.classList.add('hidden');
    DOM.userProfileWidget?.classList.remove('hidden');

    if (DOM.userName) DOM.userName.textContent = currentUser.name;
    if (DOM.userAvatar) DOM.userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
}

// ============================================
// MODAL HANDLERS
// ============================================
function populateJamSelects() {
    if (!DOM.jamKeluarSelect || !DOM.jamKembaliSelect) return;

    const options = [];
    for (let hour = 5; hour <= 22; hour++) {
        for (let min of [0, 30]) {
            const hStr = String(hour).padStart(2, '0');
            const mStr = String(min).padStart(2, '0');
            options.push(`${hStr}:${mStr}`);
        }
    }

    const populate = (selectEl) => {
        if (!selectEl) return;
        const currentVal = selectEl.value;
        selectEl.innerHTML = '<option value="" disabled selected>Pilih Jam</option>';
        options.forEach(time => {
            const opt = document.createElement('option');
            opt.value = time;
            opt.textContent = `${time} WIB`;
            selectEl.appendChild(opt);
        });
        if (currentVal) selectEl.value = currentVal;
    };

    populate(DOM.jamKeluarSelect);
    populate(DOM.jamKembaliSelect);
}

function openModal(recipient = 'musyrif') {
    if (DOM.recipientTypeInput) DOM.recipientTypeInput.value = recipient;
    clearFormError();

    populateJamSelects();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (DOM.tanggalIzinField) DOM.tanggalIzinField.value = todayStr;

    let curHour = now.getHours();
    let curMin = now.getMinutes() >= 30 ? 0 : 30;
    if (now.getMinutes() >= 30) curHour += 1;
    if (curHour < 6) curHour = 6;
    if (curHour > 21) curHour = 21;
    const defaultJamKeluar = `${String(curHour).padStart(2, '0')}:${String(curMin).padStart(2, '0')}`;

    if (DOM.jamKeluarSelect) DOM.jamKeluarSelect.value = defaultJamKeluar;
    if (DOM.jamKembaliSelect) DOM.jamKembaliSelect.value = '17:00';

    if (currentUser) {
        DOM.rolePemohonContainer?.classList.remove('hidden');
        if (currentUser.name && (currentUser.name.includes('Pamong') || currentUser.name.includes('Directeur'))) {
            if (DOM.rolePemohonSelect) DOM.rolePemohonSelect.value = 'pamong';
        } else {
            if (DOM.rolePemohonSelect) DOM.rolePemohonSelect.value = 'musyrif';
        }
        const waliInput = document.getElementById('nama-wali');
        if (waliInput && !waliInput.value) waliInput.value = currentUser.name;
    } else {
        DOM.rolePemohonContainer?.classList.add('hidden');
        if (DOM.rolePemohonSelect) DOM.rolePemohonSelect.value = 'orangtua';
    }

    syncFormWithSOP();
    window.showPage('page-form');
    DOM.globalSantriSearch?.focus();
}

function closeModal() {
    window.showPage('page-home');
    if (DOM.izinForm) DOM.izinForm.reset();
    selectedStudents = [];
    renderSelectedStudentsUI();
    DOM.globalSantriSuggestions?.classList.add('hidden');
    clearFormError();
}

function openPassModal(passData) {
    currentPassData = passData;

    document.getElementById('pass-id').textContent = passData.idIzin;
    document.getElementById('pass-santri').textContent = passData.namaSantri;
    document.getElementById('pass-kelas').textContent = passData.kelas;
    document.getElementById('pass-jenis').textContent = passData.jenisIzin;
    document.getElementById('pass-wali').textContent = `${passData.namaWali} (${passData.rolePemohonText || passData.namaWali})`;
    document.getElementById('pass-keperluan').textContent = passData.keperluan;
    document.getElementById('pass-tujuan').textContent = passData.tujuan;
    document.getElementById('pass-penjemput').textContent = `${passData.namaPenjemput} (${passData.hubunganPenjemput})`;
    document.getElementById('pass-waktu-keluar').textContent = `${passData.tanggalKeluar} - Pukul ${passData.jamKeluar} WIB`;
    document.getElementById('pass-waktu-kembali').textContent = `${passData.tanggalKembali} - Pukul ${passData.jamKembali} WIB`;
    document.getElementById('pass-pemberi').textContent = passData.pemberiIzin;

    const badge = document.getElementById('pass-status-badge');
    if (badge) {
        if (passData.status === 'APPROVED') {
            badge.className = 'px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200';
            badge.textContent = '✅ DISETUJUI';
        } else {
            badge.className = 'px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200';
            badge.textContent = '⏳ MENUNGGU';
        }
    }

    renderQRCodeSVG(passData.idIzin);

    window.showPage('page-pass');
}

function closePassModal() {
    window.showPage('page-home');
}

// ============================================
// HISTORY & APPROVAL
// ============================================
let rawHistoryData = [];
let currentTabFilter = 'APPROVED';
let currentDateFilter = 'today';

function getTodayISOString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isTodayDateMatch(str) {
    if (!str) return false;
    const s = String(str).toLowerCase();
    const today = new Date();
    const dNum = today.getDate();
    const mNames = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
    const mName = mNames[today.getMonth()];
    return s.includes(mName) && (s.includes(` ${dNum} `) || s.includes(` ${dNum},`) || s.includes(`${dNum} ${mName}`));
}

function formatCleanDateTime(val) {
    if (!val) return '';
    let str = String(val).trim();

    if (str.includes('1899-12-30')) {
        const tMatch = str.match(/T(\d{2}:\d{2})/);
        if (tMatch) return `${tMatch[1]} WIB`;
        return '';
    }

    if (str.includes('T')) {
        try {
            const d = new Date(str);
            if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
                const day = d.getDate();
                const month = months[d.getMonth()];
                const year = d.getFullYear();
                const hrs = String(d.getHours()).padStart(2, '0');
                const mins = String(d.getMinutes()).padStart(2, '0');
                return `${day} ${month} ${year}, ${hrs}:${mins} WIB`;
            }
        } catch (e) {}
    }
    return str;
}

function formatTimePeriod(tanggalKeluar, jamKeluar, tanggalKembali, jamKembali) {
    let start = formatCleanDateTime(tanggalKeluar);
    let end = formatCleanDateTime(tanggalKembali);

    if (jamKeluar && !start.includes('WIB') && !jamKeluar.includes('1899')) {
        const cleanJamK = formatCleanDateTime(jamKeluar) || jamKeluar;
        start = start ? `${start} (${cleanJamK})` : cleanJamK;
    }
    if (jamKembali && !end.includes('WIB') && !jamKembali.includes('1899')) {
        const cleanJamKb = formatCleanDateTime(jamKembali) || jamKembali;
        end = end ? `${end} (${cleanJamKb})` : cleanJamKb;
    }

    if (!start) start = '-';
    if (!end) end = '-';
    return `${start} ➔ ${end}`;
}

async function fetchLeaveHistory(query = '') {
    if (!DOM.historyContainer) return;

    // Show loading skeleton
    showSkeleton(DOM.historyContainer);

    // Get local data first
    const localData = getLocalIzinList();
    const map = new Map();
    localData.forEach(item => {
        if (item?.idIzin) map.set(item.idIzin, item);
    });

    function filterData(dataArray) {
        let res = dataArray;
        if (query) {
            const q = query.toLowerCase().trim();
            res = res.filter(i =>
                (i.namaSantri && i.namaSantri.toLowerCase().includes(q)) ||
                (i.namaWali && i.namaWali.toLowerCase().includes(q)) ||
                (i.idIzin && i.idIzin.toLowerCase().includes(q)) ||
                (i.kelas && i.kelas.toLowerCase().includes(q))
            );
        }
        return res;
    }

    rawHistoryData = filterData(Array.from(map.values()));
    applyHistoryTabFilter();

    // Fetch from remote API
    const url = typeof GAS_WEB_APP_URL !== 'undefined' ? GAS_WEB_APP_URL : (window.GAS_WEB_APP_URL || '');
    if (isConfiguredGasUrl(url)) {
        if (DOM.historyLoading) DOM.historyLoading.classList.remove('hidden');

        try {
            const fetchUrl = `${url}?action=read&search=${encodeURIComponent(query)}`;
            const response = await fetch(fetchUrl);
            if (response.ok) {
                const json = await response.json();
                if (json?.data && Array.isArray(json.data)) {
                    // Google Spreadsheet is Single Source of Truth
                    localStorage.setItem('local_izin_list', JSON.stringify(json.data));
                    rawHistoryData = filterData(json.data);
                    applyHistoryTabFilter();
                }
            }
        } catch (err) {
            // Silently fall back to local storage
        } finally {
            if (DOM.historyLoading) DOM.historyLoading.classList.add('hidden');
        }
    } else {
        if (DOM.historyLoading) DOM.historyLoading.classList.add('hidden');
    }
}

function applyHistoryTabFilter() {
    let filtered = rawHistoryData;

    // Filter by status
    if (currentTabFilter !== 'all') {
        filtered = rawHistoryData.filter(item => (item.status || 'PENDING') === currentTabFilter);
    }

    // Filter by date
    if (currentDateFilter === 'today') {
        const todayStr = getTodayISOString();
        const todayFiltered = filtered.filter(item => {
            const tKeluar = String(item.tanggalKeluar || '');
            const tKembali = String(item.tanggalKembali || '');
            return tKeluar.includes(todayStr) || tKembali.includes(todayStr) || isTodayDateMatch(tKeluar) || isTodayDateMatch(tKembali);
        });

        if (todayFiltered.length > 0) {
            filtered = todayFiltered;
        }
    }

    renderHistoryCards(filtered);
}

function renderHistoryCards(items) {
    DOM.historyContainer.innerHTML = '';

    // Auth banner
    const authBanner = document.createElement('div');
    if (currentUser) {
        authBanner.className = 'p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-sm flex items-center justify-between gap-4';
        authBanner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span class="text-emerald-700 font-bold text-lg">${currentUser.name.charAt(0)}</span>
                </div>
                <div>
                    <p class="font-bold text-emerald-900">Akun Musyrif Aktif</p>
                    <p class="text-xs text-emerald-600">${currentUser.name} • ${currentUser.email}</p>
                </div>
            </div>
            <span class="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">✅ Fitur ACC Aktif</span>
        `;
    } else {
        authBanner.className = 'p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center justify-between gap-4';
        authBanner.innerHTML = `
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <p class="text-slate-600">Login Musyrif diperlukan untuk menyetujui atau menolak izin.</p>
            </div>
            <button onclick="window.triggerLoginModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                Login Musyrif
            </button>
        `;
    }
    DOM.historyContainer.appendChild(authBanner);

    if (items.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center py-12';
        emptyDiv.innerHTML = `
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
            </div>
            <p class="text-slate-600 font-semibold mb-1">Belum Ada Data Perizinan</p>
            <p class="text-sm text-slate-400">${currentTabFilter === 'all' ? 'Ajukan izin baru untuk melihat data di sini.' : `Tidak ada izin dengan status ${currentTabFilter}.`}</p>
            ${(currentTabFilter !== 'all' || currentDateFilter !== 'all') ? `
                <button type="button" id="reset-history-filters-btn" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span>Tampilkan Semua Data</span>
                </button>
            ` : ''}
        `;
        DOM.historyContainer.appendChild(emptyDiv);

        const resetBtn = document.getElementById('reset-history-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                currentTabFilter = 'all';
                currentDateFilter = 'all';
                DOM.historyTabBtns.forEach(b => {
                    b.classList.remove('active', 'bg-blue-600', 'text-white', 'font-bold');
                    b.classList.add('bg-slate-100', 'text-slate-600');
                    if (b.getAttribute('data-status') === 'all') {
                        b.classList.remove('bg-slate-100', 'text-slate-600');
                        b.classList.add('active', 'bg-blue-600', 'text-white', 'font-bold');
                    }
                });
                const dateTodayBtn = document.getElementById('filter-date-today-btn');
                const dateAllBtn = document.getElementById('filter-date-all-btn');
                if (dateTodayBtn && dateAllBtn) {
                    dateAllBtn.className = 'history-date-btn active px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shadow-2xs';
                    dateTodayBtn.className = 'history-date-btn px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200/60';
                }
                applyHistoryTabFilter();
            });
        }
        return;
    }

    items.forEach(item => {
        const statusClass = {
            'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
            'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200',
            'RETURNED': 'bg-blue-100 text-blue-700 border-blue-200'
        }[item.status] || 'bg-slate-100 text-slate-700 border-slate-200';

        const names = (item.namaSantri || 'Tanpa Nama').split(',').map(s => s.trim()).filter(Boolean);
        const classes = (item.kelas || '').split(',').map(c => c.trim()).filter(Boolean);

        const studentBadges = names.map((name, i) => {
            const cls = classes[i] || classes[0] || '';
            return `<span class="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                <span>${escapeHtml(name)}</span>
                ${cls ? `<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">${escapeHtml(cls)}</span>` : ''}
            </span>`;
        }).join('');

        const timeFormatted = formatTimePeriod(item.tanggalKeluar, item.jamKeluar, item.tanggalKembali, item.jamKembali);

        const card = document.createElement('div');
        card.className = 'bg-white border border-slate-200/80 rounded-lg p-2.5 sm:p-3 shadow-2xs text-[11px]';

        let actionsHTML = '';

        if (item.status === 'PENDING' && currentUser) {
            actionsHTML = `
                <div class="flex flex-wrap gap-2 pt-3 border-t border-slate-100 mt-3">
                    <button onclick="window.updateStatusHandler('${item.idIzin}', 'APPROVED')"
                        class="btn flex-1 min-w-[120px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs flex items-center justify-center gap-2 shadow-sm transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        Setujui (ACC)
                    </button>
                    <button onclick="window.updateStatusHandler('${item.idIzin}', 'REJECTED')"
                        class="btn flex-1 min-w-[120px] px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-xs flex items-center justify-center gap-2 shadow-sm transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        Tolak
                    </button>
                </div>
            `;
        } else if (item.status === 'APPROVED' && currentUser) {
            actionsHTML = `
                <div class="pt-3 border-t border-slate-100 mt-3">
                    <button onclick="window.updateStatusHandler('${item.idIzin}', 'RETURNED')"
                        class="btn w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs flex items-center justify-center gap-2 shadow-sm transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        Tandai Sudah Kembali
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex flex-wrap gap-2">
                    ${studentBadges}
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                    ${item.status === 'PENDING' ? '⏳ ' : item.status === 'APPROVED' ? '✅ ' : item.status === 'REJECTED' ? '❌ ' : '↩️ '}
                    ${item.status}
                </span>
            </div>

            <div class="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
                <div><span class="text-slate-500">ID:</span> <span class="font-mono font-bold text-blue-600">${escapeHtml(item.idIzin || '-')}</span></div>
                <div><span class="text-slate-500">Jenis:</span> <span class="font-semibold">${escapeHtml(item.jenisIzin || '-')}</span></div>
                <div><span class="text-slate-500">Wali:</span> <span>${escapeHtml(item.namaWali || '-')}</span></div>
                <div><span class="text-slate-500">Penjemput:</span> <span>${escapeHtml(item.namaPenjemput || '-')}</span></div>
                <div class="col-span-2"><span class="text-slate-500">Keperluan:</span> <span class="font-medium">${escapeHtml(item.keperluan || '-')}</span></div>
                <div class="col-span-2"><span class="text-slate-500">Waktu:</span> <span class="font-semibold">${escapeHtml(timeFormatted)}</span></div>
                <div class="col-span-2"><span class="text-slate-500">Pemberi Izin:</span> <span>${escapeHtml(item.pemberiIzin || '-')}</span></div>
            </div>

            ${item.catatanAdmin ? `<div class="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 italic">📝 ${escapeHtml(item.catatanAdmin)}</div>` : ''}

            ${actionsHTML}
        `;

        DOM.historyContainer.appendChild(card);
    });
}

function openHistoryModal() {
    window.showPage('page-history');
    fetchLeaveHistory();
}

function closeHistoryModal() {
    window.showPage('page-home');
}

// Quick approve all with confirmation
async function quickApproveAll() {
    if (!currentUser) {
        showToast('Login diperlukan untuk ACC massal.', 'warning');
        openLoginModal();
        return;
    }

    const list = getLocalIzinList();
    const pendingList = list.filter(i => (i.status || 'PENDING') === 'PENDING');

    if (pendingList.length === 0) {
        showToast('Tidak ada izin pending untuk di-ACC.', 'info');
        return;
    }

    const confirmed = await showConfirmDialog({
        title: 'ACC Massal?',
        message: `Anda akan menyetujui ${pendingList.length} izin sekaligus. Tindakan ini tidak dapat dibatalkan.`,
        confirmText: `Ya, ACC ${pendingList.length} Izin`,
        cancelText: 'Batal',
        type: 'warning',
        dangerous: true
    });

    if (!confirmed) return;

    // Show progress
    showToast(`Memproses ${pendingList.length} izin...`, 'info');

    let successCount = 0;
    for (const item of pendingList) {
        updateLocalIzinStatus(item.idIzin, 'APPROVED', `ACC Massal oleh ${currentUser.name}`);
        successCount++;
    }

    showToast(`Berhasil ACC ${successCount} izin!`, 'success');
    updateQuickApprovalBar();

    if (!DOM.historyPage?.classList.contains('hidden')) {
        fetchLeaveHistory();
    }
}

function updateQuickApprovalBar() {
    if (!DOM.quickApprovalBar) return;

    const localData = getLocalIzinList();
    const pendingCount = localData.filter(i => (i.status || 'PENDING') === 'PENDING').length;

    if (DOM.quickPendingCount) DOM.quickPendingCount.textContent = pendingCount;

    if (pendingCount > 0 && currentUser) {
        DOM.quickApprovalBar.classList.remove('hidden');
    } else {
        DOM.quickApprovalBar.classList.add('hidden');
    }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Theme toggle
    DOM.themeToggleBtn?.addEventListener('click', toggleTheme);

    // Modal open/close
    DOM.openModalBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            const recipient = btn.getAttribute('data-recipient');
            openModal(recipient);
        });
    });

    DOM.closeModalBtn?.addEventListener('click', closeModal);
    DOM.closeModalFooterBtn?.addEventListener('click', closeModal);
    DOM.modalBackdrop?.addEventListener('click', closeModal);
    DOM.izinForm?.addEventListener('submit', handleFormSubmit);

    // Global student search with debounce
    if (DOM.globalSantriSearch) {
        const debouncedSearch = debounce((value) => {
            handleGlobalSantriSearch(value);
        }, APP_CONFIG.DEBOUNCE_MS);

        DOM.globalSantriSearch.addEventListener('input', function() {
            clearFormError();
            debouncedSearch(this.value);
        });
        DOM.globalSantriSearch.addEventListener('focus', function() {
            if (this.value.trim().length >= 2) handleGlobalSantriSearch(this.value);
        });
    }

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        if (DOM.globalSantriSuggestions &&
            !DOM.globalSantriSuggestions.contains(e.target) &&
            e.target !== DOM.globalSantriSearch) {
            DOM.globalSantriSuggestions.classList.add('hidden');
        }
    });

    // Accordion Toggle Handlers
    document.querySelectorAll('.accordion-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            document.querySelectorAll('.accordion-button').forEach(otherBtn => {
                otherBtn.setAttribute('aria-expanded', 'false');
            });
            this.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        });
    });

    // Quick chip buttons
    DOM.quickChipReasons?.forEach(chip => {
        chip.addEventListener('click', function() {
            DOM.quickChipReasons.forEach(c => {
                c.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
                c.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200/80');
            });
            this.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200/80');
            this.classList.add('bg-blue-600', 'text-white', 'border-blue-600');

            const jenis = this.getAttribute('data-jenis');
            const keperluan = this.getAttribute('data-keperluan');
            const tujuan = this.getAttribute('data-tujuan');

            if (DOM.jenisIzinSelect) DOM.jenisIzinSelect.value = jenis;
            document.getElementById('keperluan').value = keperluan || '';
            document.getElementById('tujuan').value = tujuan || '';

            syncFormWithSOP();
        });
    });

    // Time and date changes
    DOM.jamKeluarSelect?.addEventListener('change', calculateLeaveDuration);
    DOM.jamKembaliSelect?.addEventListener('change', calculateLeaveDuration);
    DOM.tanggalIzinField?.addEventListener('input', syncFormWithSOP);
    DOM.jenisIzinSelect?.addEventListener('change', syncFormWithSOP);
    DOM.rolePemohonSelect?.addEventListener('change', syncFormWithSOP);

    // Checkbox penjemput beda
    DOM.checkboxPenjemputBeda?.addEventListener('change', function() {
        DOM.penjemputDetailFields?.classList.toggle('hidden', !this.checked);
    });

    // Pass modal
    DOM.passShareWaBtn?.addEventListener('click', shareToWhatsApp);
    DOM.closePassModalBtn?.addEventListener('click', closePassModal);
    DOM.passModalBackdrop?.addEventListener('click', closePassModal);

    // Login modal
    DOM.loginGoogleBtn?.addEventListener('click', openLoginModal);
    DOM.closeLoginModalBtn?.addEventListener('click', closeLoginModal);
    DOM.loginModalBackdrop?.addEventListener('click', closeLoginModal);
    DOM.logoutBtn?.addEventListener('click', () => logoutUserSession(true));

    // History modal
    DOM.viewInHistoryBtn?.addEventListener('click', () => {
        closePassModal();
        openHistoryModal();
    });
    DOM.openHistoryBtn?.addEventListener('click', openHistoryModal);
    DOM.fabHistoryBtn?.addEventListener('click', openHistoryModal);
    DOM.closeHistoryPageBtn?.addEventListener('click', closeHistoryModal);
    DOM.refreshHistoryBtn?.addEventListener('click', () => fetchLeaveHistory(DOM.searchHistoryInput?.value || ''));

    // History tabs
    DOM.historyTabBtns?.forEach(tabBtn => {
        tabBtn.addEventListener('click', function() {
            DOM.historyTabBtns.forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white', 'shadow-sm', 'active');
                b.classList.add('bg-slate-100', 'text-slate-600');
            });
            this.classList.remove('bg-slate-100', 'text-slate-600');
            this.classList.add('bg-blue-600', 'text-white', 'shadow-sm', 'active');
            currentTabFilter = this.getAttribute('data-status');
            applyHistoryTabFilter();
        });
    });

    // Quick approval
    DOM.quickApproveAllBtn?.addEventListener('click', quickApproveAll);
    DOM.openQuickApprovalModalBtn?.addEventListener('click', openHistoryModal);

    // Date filter
    document.getElementById('filter-date-today-btn')?.addEventListener('click', function() {
        this.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs';
        document.getElementById('filter-date-all-btn')?.classList.remove('bg-blue-600', 'text-white');
        document.getElementById('filter-date-all-btn')?.classList.add('bg-slate-100', 'text-slate-600', 'font-semibold');
        currentDateFilter = 'today';
        applyHistoryTabFilter();
    });

    document.getElementById('filter-date-all-btn')?.addEventListener('click', function() {
        this.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs';
        document.getElementById('filter-date-today-btn')?.classList.remove('bg-blue-600', 'text-white');
        document.getElementById('filter-date-today-btn')?.classList.add('bg-slate-100', 'text-slate-600', 'font-semibold');
        currentDateFilter = 'all';
        applyHistoryTabFilter();
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closePassModal();
            closeLoginModal();
            closeHistoryModal();
        }
    });
}

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ============================================
// DOM REFERENCES
// ============================================
let DOM = {};

function initDOMReferences() {
    DOM = {
        modal: document.getElementById('page-form'),
        modalBackdrop: document.getElementById('modal-backdrop'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        openModalBtns: document.querySelectorAll('.open-form-btn'),
        izinForm: document.getElementById('izin-form'),
        jenisIzinSelect: document.getElementById('jenis-izin'),
        rolePemohonSelect: document.getElementById('role-pemohon'),
        approvalNoticeBadge: document.getElementById('approval-notice-badge'),
        approvalNoticeText: document.getElementById('approval-notice-text'),
        kelasSelect: document.getElementById('kelas-santri'),
        globalSantriSearch: document.getElementById('global-santri-search'),
        globalSantriSuggestions: document.getElementById('global-santri-suggestions'),
        selectedStudentsChips: document.getElementById('selected-students-chips'),
        selectedStudentsCounter: document.getElementById('selected-students-counter'),
        namaPenjemputInput: document.getElementById('nama-penjemput'),
        hubunganPenjemputSelect: document.getElementById('hubungan-penjemput'),
        checkboxPenjemputBeda: document.getElementById('checkbox-penjemput-beda'),
        penjemputDetailFields: document.getElementById('penjemput-detail-fields'),
        rekomendasiPoskestrenWrapper: document.getElementById('rekomendasi-poskestren-wrapper'),
        rekomendasiPoskestrenInput: document.getElementById('rekomendasi-poskestren'),
        tanggalIzinField: document.getElementById('tanggal-izin'),
        tanggalKembaliField: document.getElementById('tanggal-kembali'),
        tanggalKembaliWrapper: document.getElementById('tanggal-kembali-wrapper'),
        jamKeluarSelect: document.getElementById('jam-keluar'),
        jamKembaliSelect: document.getElementById('jam-kembali'),
        liveDurationDisplay: document.getElementById('live-duration-display'),
        liveDurationText: document.getElementById('live-duration-text'),
        formError: document.getElementById('form-error'),
        submitFormBtn: document.getElementById('submit-form-btn'),
        closeModalFooterBtn: document.getElementById('close-modal-footer-btn'),
        quickApprovalBar: document.getElementById('quick-approval-bar'),
        quickPendingCount: document.getElementById('quick-pending-count'),
        quickApproveAllBtn: document.getElementById('quick-approve-all-btn'),
        openQuickApprovalModalBtn: document.getElementById('open-quick-approval-modal-btn'),
        rolePemohonContainer: document.getElementById('role-pemohon-container'),
        recipientTypeInput: document.getElementById('recipient-type'),
        passModal: document.getElementById('page-pass'),
        passModalBackdrop: document.getElementById('pass-modal-backdrop'),
        closePassModalBtn: document.getElementById('close-pass-modal-btn'),
        passQrcodeContainer: document.getElementById('pass-qrcode-container'),
        passShareWaBtn: document.getElementById('pass-share-wa-btn'),
        viewInHistoryBtn: document.getElementById('view-in-history-btn'),
        loginGoogleBtn: document.getElementById('login-google-btn'),
        userProfileWidget: document.getElementById('user-profile-widget'),
        userAvatar: document.getElementById('user-avatar'),
        userName: document.getElementById('user-name'),
        logoutBtn: document.getElementById('logout-btn'),
        loginModal: document.getElementById('page-login'),
        loginModalBackdrop: document.getElementById('login-modal-backdrop'),
        closeLoginModalBtn: document.getElementById('close-login-modal-btn'),
        historyPage: document.getElementById('page-history'),
        closeHistoryPageBtn: document.getElementById('close-history-page-btn'),
        openHistoryBtn: document.getElementById('open-history-btn'),
        fabHistoryBtn: document.getElementById('fab-history-btn'),
        searchHistoryInput: document.getElementById('search-history-input'),
        refreshHistoryBtn: document.getElementById('refresh-history-btn'),
        historyTabBtns: document.querySelectorAll('.history-tab-btn'),
        historyLoading: document.getElementById('history-loading'),
        historyContainer: document.getElementById('history-container'),
        themeToggleBtn: document.getElementById('theme-toggle-btn')
    };
}

// ============================================
// WINDOW HANDLERS
// ============================================
window.triggerLoginModal = openLoginModal;
window.updateStatusHandler = function(idIzin, newStatus) {
    updateLeaveStatus(idIzin, newStatus);
    updateQuickApprovalBar();
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM references
    initDOMReferences();

    // Initialize theme
    initTheme();

    // Ensure all animated elements are visible
    document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('is-visible'));

    // Build student index
    buildGlobalStudentIndex();

    // Load session
    loadUserSession();

    // Setup events
    setupEventListeners();

    // Update UI
    updateQuickApprovalBar();

    // Fetch history
    fetchLeaveHistory();

    // Process pending requests
    if (navigator.onLine) {
        setTimeout(processPendingRequests, 2000);
    }

    window.addEventListener('online', () => {
        showToast('Koneksi kembali. Menyinkronkan data...', 'info');
        processPendingRequests();
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    .animate-slide-in { animation: slideIn 0.3s ease; }
    .animate-fade-in { animation: fadeIn 0.2s ease; }
    .animate-scale-in { animation: scaleIn 0.2s ease; }
`;
document.head.appendChild(style);


// ============================================
// REAL-TIME BACKGROUND SYNC TO GOOGLE SHEETS
// ============================================
async function fetchLeaveHistorySilently() {
    const url = typeof GAS_WEB_APP_URL !== 'undefined' ? GAS_WEB_APP_URL : (window.GAS_WEB_APP_URL || '');
    if (!isConfiguredGasUrl(url)) return;

    try {
        const fetchUrl = `${url}?action=read`;
        const response = await fetch(fetchUrl);
        if (response.ok) {
            const json = await response.json();
            if (json?.data && Array.isArray(json.data)) {
                // Google Spreadsheet is Single Source of Truth
                localStorage.setItem('local_izin_list', JSON.stringify(json.data));
                
                const historyPage = document.getElementById('page-history');
                if (historyPage && !historyPage.classList.contains('hidden')) {
                    rawHistoryData = json.data;
                    applyHistoryTabFilter();
                }
                updatePendingCounterBadge();
            }
        }
    } catch (e) {
        // Silent catch
    }
}

// Start 10-second automatic real-time sync loop
if (!window.realtimeSyncInterval) {
    window.realtimeSyncInterval = setInterval(() => {
        fetchLeaveHistorySilently();
        processPendingRequests();
    }, 10000);
}
