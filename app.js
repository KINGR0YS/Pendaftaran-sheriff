/* =======================================================
   BCSO RECRIUTMENT & ROSTER MANAGEMENT SYSTEM - CORE LOGIC
   ======================================================= */

// GLOBAL STATES
let currentStep = 1;
let db = null; // Supabase client instance
let isDemoMode = true;
let currentView = 'home';
let currentUser = null;
let activeBatch = '1';
let recruitmentStatus = 'open';

// Mock Seed Data (Stored in LocalStorage if Supabase is not connected)
const DEFAULT_ROSTER = [
  { id: "r1", ic_name: "John Davis", callsign: "101", rank: "Sheriff", division: "LEGON", status: "Active", join_date: "2025-01-15T08:00:00Z" },
  { id: "r2", ic_name: "Sarah Connor", callsign: "105", rank: "Captain", division: "INREGIS", status: "Active", join_date: "2025-02-20T09:30:00Z" },
  { id: "r3", ic_name: "Kyle Reese", callsign: "204", rank: "Sergeant", division: "ARLION", status: "Active", join_date: "2025-03-10T14:00:00Z" },
  { id: "r4", ic_name: "Frank Miller", callsign: "308", rank: "Cadet", division: "VIGILIS", status: "Active", join_date: "2026-06-01T10:15:00Z" },
  { id: "r5", ic_name: "Marcus Wright", callsign: "112", rank: "Deputy Sheriff", division: "DISMAG", status: "LOA", join_date: "2025-05-18T11:00:00Z" }
];

const DEFAULT_APPLICATIONS = [
  {
    id: "a1",
    ooc_name: "Ahmad Jalal",
    passport_name_ooc: "Jalal_Ahmad",
    ooc_age: 19,
    ooc_gender: "Laki-laki",
    discord_id: "ahmadjalal#9923",
    steam_hex: "steam:11000010f3c5b8b",
    playtime: "1 tahun",
    rp_experience_ooc: "Pernah bermain di server Indopride (warga biasa) dan server Jakarta RP (Polisi Cadet selama 2 minggu).",
    obligations_other_cities: "Tidak ada",
    ic_name: "Tommy Vercetti",
    ic_age: 28,
    ic_gender: "Laki-laki",
    ic_dob: "1998-04-12",
    phone_number: "555-9011",
    origin: "Italy",
    experience: "Pernah menjadi Officer Cadet di Los Santos Police Department selama 2 minggu.",
    criminal_record: "TIDAK PERNAH",
    work_experience_ic: "Mantan supir taksi di Los Santos dan mekanik magang.",
    motivation_roxwood: "Saya ingin bergabung dengan Sheriff Kerajaan Roxwood karena memiliki ketertarikan tinggi pada pelayanan kepolisian taktis di wilayah Roxwood dan ingin menegakkan hukum kerajaan.",
    why_accept_roxwood: "Saya adalah orang yang disiplin, mematuhi rantai komando, dan memiliki jam aktif berpatroli yang konsisten.",
    active_hours: "19:00 - 23:00 WIB",
    chain_of_command: "Sistem hierarki yang mengatur rantai instruksi, penting agar tidak terjadi overlap perintah di lapangan dan menjaga kedisiplinan taktis.",
    scenario_use_of_force: "Mendekati pelaku dengan menodongkan Taser terlebih dahulu (level ancaman senjata tajam), menjaga jarak aman sekitar 21 kaki (Tueller Drill), memanggil backup, and memberikan instruksi verbal keras untuk menjatuhkan pisau. Jika menyerang, menembak dengan senjata pelumpuh taser terlebih dahulu sebelum mempertimbangkan lethal force jika nyawa terancam.",
    status: "pending",
    created_at: "2026-06-23T12:00:00Z"
  },
  {
    id: "a2",
    ooc_name: "Rian Hidayat",
    passport_name_ooc: "Rian_Hidayat",
    ooc_age: 21,
    ooc_gender: "Laki-laki",
    discord_id: "rian_h",
    steam_hex: "steam:110000109988ffaa",
    playtime: "2 tahun",
    rp_experience_ooc: "Pernah bermain di server Negara RP sebagai Dokter EMS dan Sheriff.",
    obligations_other_cities: "Ada tanggungan faksi aktif sebagai Anggota Hubungan Masyarakat di server X.",
    ic_name: "Carl Johnson",
    ic_age: 24,
    ic_gender: "Laki-laki",
    ic_dob: "2002-08-25",
    phone_number: "555-4089",
    origin: "America",
    experience: "Mantan Kapten Sheriff di server kota sebelah (mengabdi 3 bulan).",
    criminal_record: "Pernah ditangkap sekali karena pelanggaran lalu lintas (ngebut).",
    work_experience_ic: "Pekerja serabutan, supir truk, dan mekanik.",
    motivation_roxwood: "Bergabung dengan Sheriff Roxwood untuk membawa taktis baru dan memperkuat jajaran K9 unit.",
    why_accept_roxwood: "Memiliki pengalaman tinggi di faksi hukum dan siap mendedikasikan waktu patroli malam.",
    active_hours: "20:00 - 02:00 WIB",
    chain_of_command: "Chain of command adalah patokan perintah dari atasan ke bawahan.",
    scenario_use_of_force: "Memanggil bantuan dan menembak pelaku jika menolak menyerah.",
    status: "approved",
    created_at: "2026-06-20T10:00:00Z"
  }
];

// =======================================================
// INITIALIZATION
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load saved UI settings
  applySavedUISettings();
  
  // Load active batch & recruitment status
  activeBatch = localStorage.getItem('active_batch') || '1';
  recruitmentStatus = localStorage.getItem('recruitment_status') || 'open';
  
  initDatabase();
  initializeDemoData();
  setupEventListeners();
  navigateTo('home');
  updateRecruitmentStats();
  updateRecruitmentBadges();
  
  // Render Lucide Icons
  lucide.createIcons();
});

function updateRecruitmentBadges() {
  const dot = document.getElementById('recruitment-status-dot');
  const text = document.getElementById('recruitment-status-text');
  
  if (recruitmentStatus === 'open') {
    if (dot) {
      dot.className = 'pulse-dot active';
    }
    if (text) {
      text.innerText = `REKRUTMEN: BUKA (ANGKATAN ${activeBatch})`;
      text.parentElement.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
      text.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    }
  } else {
    if (dot) {
      dot.className = 'pulse-dot closed';
    }
    if (text) {
      text.innerText = `REKRUTMEN: TUTUP`;
      text.parentElement.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
      text.parentElement.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    }
  }
}

// Initialize Database connection (Supabase or Demo Mode)
function initDatabase() {
  const defaultUrl = 'https://gcmrspogwppcuynmmwkd.supabase.co';
  const defaultKey = 'sb_publishable_p1VpNGh_CtKO-ZmWin6cNw_l0Arp0uX';

  const useDemo = localStorage.getItem('use_demo_mode') === 'true';
  
  if (useDemo) {
    setupDemoMode();
    // Tampilkan nilai kosong atau placeholder pada form pengaturan
    const urlInput = document.getElementById('config-supabase-url');
    const keyInput = document.getElementById('config-supabase-key');
    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    return;
  }

  const savedUrl = localStorage.getItem('supabase_url') || defaultUrl;
  const savedKey = localStorage.getItem('supabase_key') || defaultKey;
  
  // Tampilkan nilai konfigurasi pada form pengaturan jika elemen ada
  const urlInput = document.getElementById('config-supabase-url');
  const keyInput = document.getElementById('config-supabase-key');
  if (urlInput) urlInput.value = savedUrl;
  if (keyInput) keyInput.value = savedKey;

  if (savedUrl && savedKey) {
    try {
      db = window.supabase.createClient(savedUrl, savedKey);
      isDemoMode = false;
      
      const statusEl = document.getElementById('db-connection-status');
      if (statusEl) {
        statusEl.innerText = "Supabase Cloud Database (Connected)";
        statusEl.style.color = "var(--color-success)";
      }
      console.log("Connected to Supabase successfully.");
      
      // Cek sesi aktif
      checkActiveSession();
    } catch (error) {
      console.error("Failed to connect to Supabase, switching to Demo Mode:", error);
      setupDemoMode();
    }
  } else {
    setupDemoMode();
  }
}

function setupDemoMode() {
  db = null;
  isDemoMode = true;
  document.getElementById('db-connection-status').innerText = "Local Storage (Demo Mode)";
  document.getElementById('db-connection-status').style.color = "var(--color-warning)";
  
  // Check local session
  const localSession = localStorage.getItem('demo_session');
  if (localSession) {
    currentUser = JSON.parse(localSession);
    onLoginSuccess(currentUser);
  }
}

// Seed local storage with mock data if empty
function initializeDemoData() {
  if (!localStorage.getItem('roster_data')) {
    localStorage.setItem('roster_data', JSON.stringify(DEFAULT_ROSTER));
  }
  if (!localStorage.getItem('applications_data')) {
    localStorage.setItem('applications_data', JSON.stringify(DEFAULT_APPLICATIONS));
  }
  if (!localStorage.getItem('activity_logs')) {
    localStorage.setItem('activity_logs', JSON.stringify([
      { time: new Date().toISOString(), text: "Database demo berhasil diinisialisasi." }
    ]));
  }
}

function setupEventListeners() {
  // Listen to hash changes for router
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash) navigateTo(hash);
  });
}

// Check active session on Supabase
async function checkActiveSession() {
  if (isDemoMode || !db) return;
  
  const { data, error } = await db.auth.getSession();
  if (data?.session) {
    currentUser = data.session.user;
    onLoginSuccess(currentUser);
  } else {
    currentUser = null;
    onLogoutCleanup();
  }
}

// =======================================================
// NAVIGATION & SPA ROUTER
// =======================================================
function navigateTo(viewId) {
  // Guard dashboard access if not logged in
  if (viewId === 'admin' && !currentUser) {
    showToast('Akses Ditolak! Silakan login terlebih dahulu.', 'error');
    window.location.hash = '#login';
    navigateTo('login');
    return;
  }
  
  // Guard registration access if recruitment is closed
  if (viewId === 'apply' && recruitmentStatus === 'closed') {
    showToast('Pendaftaran ditutup saat ini!', 'error');
    window.location.hash = '#home';
    navigateTo('home');
    return;
  }
  
  currentView = viewId;
  
  // Update view classes
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(`${viewId}-view`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update navbar links active classes
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Execute view-specific initializations
  if (viewId === 'home') {
    updateRecruitmentStats();
  } else if (viewId === 'admin') {
    switchDashboardTab('stats');
  } else if (viewId === 'apply') {
    resetRegistrationForm();
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
  lucide.createIcons();
}

// Update home stats cards
async function updateRecruitmentStats() {
  let deputiesCount = 0;
  
  if (isDemoMode) {
    const roster = JSON.parse(localStorage.getItem('roster_data') || '[]');
    deputiesCount = roster.filter(m => m.status === 'Active').length;
  } else if (db) {
    try {
      const { count, error } = await db
        .from('roster')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
      if (!error) deputiesCount = count || 0;
    } catch (e) {
      console.error(e);
    }
  }
  
  const statTotalEl = document.getElementById('stat-total-deputies');
  if (statTotalEl) {
    statTotalEl.innerText = deputiesCount;
  }
}

// =======================================================
// FORM REGISTRATION LOGIC (MULTI-STEP)
// =======================================================
function nextStep(step) {
  // Validate current step fields
  const currentStepEl = document.getElementById(`form-step-${currentStep}`);
  const inputs = currentStepEl.querySelectorAll('input[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = 'var(--color-error)';
      isValid = false;
    } else {
      input.style.borderColor = 'var(--color-border)';
    }
  });
  
  if (!isValid) {
    showToast('Harap lengkapi semua kolom wajib diisi (*)!', 'error');
    return;
  }

  // Set visual steps classes
  document.getElementById(`step-dot-${currentStep}`).classList.add('completed');
  document.getElementById(`step-line-${currentStep}`).classList.add('completed');
  
  currentStep = step;
  
  // Show new step
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`form-step-${step}`).classList.add('active');
  document.getElementById(`step-dot-${step}`).classList.add('active');
  
  lucide.createIcons();
}

function prevStep(step) {
  // Revert visual indicators
  document.getElementById(`step-dot-${currentStep}`).classList.remove('active');
  document.getElementById(`step-line-${step}`).classList.remove('completed');
  document.getElementById(`step-dot-${step}`).classList.remove('completed');
  
  currentStep = step;
  
  // Show previous step
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`form-step-${step}`).classList.add('active');
  document.getElementById(`step-dot-${step}`).classList.add('active');
  
  lucide.createIcons();
}

function resetRegistrationForm() {
  currentStep = 1;
  const form = document.getElementById('recruitment-form');
  if (form) form.reset();
  
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.getElementById('form-step-1').classList.add('active');
  
  // Reset step indicators visual
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    if (dot) {
      dot.className = 'step-indicator';
      if (i === 1) dot.classList.add('active');
    }
    const line = document.getElementById(`step-line-${i}`);
    if (line) line.className = 'step-line';
  }
}

// Handle application submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // 1. Validasi semua field yang wajib diisi secara manual di seluruh step
  const form = document.getElementById('recruitment-form');
  const steps = [1, 2, 3];
  let firstInvalidStep = null;
  
  steps.forEach(stepNum => {
    const stepEl = document.getElementById(`form-step-${stepNum}`);
    const stepInputs = stepEl.querySelectorAll('input[required], textarea[required], select[required]');
    let stepValid = true;
    
    stepInputs.forEach(input => {
      if (!input.value || !input.value.trim()) {
        input.style.borderColor = 'var(--color-error)';
        stepValid = false;
      } else {
        input.style.borderColor = 'var(--color-border)';
      }
    });
    
    if (!stepValid && firstInvalidStep === null) {
      firstInvalidStep = stepNum;
    }
  });
  
  if (firstInvalidStep !== null) {
    showToast('Harap lengkapi semua kolom wajib diisi (*)!', 'error');
    // Arahkan ke step yang belum lengkap
    if (firstInvalidStep !== currentStep) {
      if (firstInvalidStep < currentStep) {
        prevStep(firstInvalidStep);
      } else {
        nextStep(firstInvalidStep);
      }
    }
    return;
  }

  // 2. Validasi Batasan Umur OOC (17 - 60)
  const oocAgeInput = document.getElementById('ooc_age');
  const oocAge = parseInt(oocAgeInput.value);
  if (isNaN(oocAge) || oocAge < 17 || oocAge > 60) {
    oocAgeInput.style.borderColor = 'var(--color-error)';
    showToast('Umur OOC harus antara 17 hingga 60 tahun!', 'error');
    if (currentStep !== 1) prevStep(1);
    oocAgeInput.focus();
    return;
  }

  // 3. Validasi Batasan Umur IC (17 - 100)
  const icAgeInput = document.getElementById('ic_age');
  const icAge = parseInt(icAgeInput.value);
  if (isNaN(icAge) || icAge < 17 || icAge > 100) {
    icAgeInput.style.borderColor = 'var(--color-error)';
    showToast('Umur Karakter IC harus antara 17 hingga 100 tahun!', 'error');
    if (currentStep !== 2) {
      if (currentStep === 3) prevStep(2);
      else nextStep(2);
    }
    icAgeInput.focus();
    return;
  }
  
  const submitBtn = document.getElementById('submit-application-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = "Mengirim...";

  // Construct application object
  const appData = {
    ooc_name: document.getElementById('ooc_name').value,
    passport_name_ooc: document.getElementById('passport_name_ooc').value,
    ooc_age: parseInt(document.getElementById('ooc_age').value),
    ooc_gender: document.getElementById('ooc_gender').value,
    discord_id: document.getElementById('discord_id').value,
    steam_hex: document.getElementById('steam_hex').value,
    playtime: document.getElementById('playtime').value,
    rp_experience_ooc: document.getElementById('rp_experience_ooc').value,
    obligations_other_cities: document.getElementById('obligations_other_cities').value,
    ic_name: document.getElementById('ic_name').value,
    ic_age: parseInt(document.getElementById('ic_age').value),
    ic_gender: document.getElementById('ic_gender').value,
    ic_dob: document.getElementById('ic_dob').value,
    phone_number: document.getElementById('phone_number').value,
    origin: document.getElementById('origin').value,
    experience: document.getElementById('experience').value,
    criminal_record: document.getElementById('criminal_record').value,
    work_experience_ic: document.getElementById('work_experience_ic').value,
    motivation_roxwood: document.getElementById('motivation_roxwood').value,
    why_accept_roxwood: document.getElementById('why_accept_roxwood').value,
    active_hours: document.getElementById('active_hours').value,
    chain_of_command: document.getElementById('chain_of_command').value,
    scenario_use_of_force: document.getElementById('scenario_use_of_force').value,
    batch: activeBatch,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  try {
    if (isDemoMode) {
      // Demo mode insertion
      const apps = JSON.parse(localStorage.getItem('applications_data') || '[]');
      appData.id = "app_" + Math.random().toString(36).substr(2, 9);
      apps.push(appData);
      localStorage.setItem('applications_data', JSON.stringify(apps));
      
      // Log to activity
      logActivity(`Pendaftaran baru dikirim oleh OOC: <strong>${appData.ooc_name}</strong> (IC: ${appData.ic_name})`);
      
      onFormSubmitSuccess();
    } else if (db) {
      // Supabase insertion
      const { data, error } = await db
        .from('applications')
        .insert([appData]);
        
      if (error) throw error;
      
      onFormSubmitSuccess();
    }
  } catch (error) {
    console.error("Submission failed:", error);
    showToast('Gagal mengirim pendaftaran. Hubungi Admin!', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Kirim Pendaftaran <i data-lucide="check"></i>`;
    lucide.createIcons();
  }
}

function onFormSubmitSuccess() {
  showToast('Pendaftaran Anda berhasil dikirim! Silakan tunggu evaluasi pimpinan.', 'success');
  resetRegistrationForm();
  setTimeout(() => {
    navigateTo('home');
  }, 1000);
}

// =======================================================
// AUTENTIKASI ADMIN LOGIC
// =======================================================
async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const loginBtn = document.getElementById('login-btn-submit');
  
  loginBtn.disabled = true;
  loginBtn.innerText = "Mengautentikasi...";

  try {
    if (isDemoMode) {
      // Simulated administration login
      if (email === 'admin@roxwood.gov' && password === 'admin123') {
        const demoUser = { email: email, name: "Sheriff Command" };
        localStorage.setItem('demo_session', JSON.stringify(demoUser));
        currentUser = demoUser;
        onLoginSuccess(demoUser);
        showToast('Login berhasil (Demo Mode). Selamat datang!', 'success');
        navigateTo('admin');
      } else {
        showToast('Kredensial salah! Gunakan: admin@roxwood.gov & admin123', 'error');
      }
    } else if (db) {
      // Real Supabase login
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      currentUser = data.user;
      onLoginSuccess(currentUser);
      showToast('Koneksi aman terjalin. Selamat datang Sheriff!', 'success');
      navigateTo('admin');
    }
  } catch (error) {
    console.error("Login failed:", error);
    showToast(error.message || 'Gagal login. Periksa email/password.', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = `Autentikasi Akses <i data-lucide="shield-check"></i>`;
    lucide.createIcons();
  }
}

function autoLoginAdmin() {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  if (emailEl && passEl) {
    emailEl.value = 'admin@roxwood.gov';
    passEl.value = 'admin123';
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      const submitEvent = new Event('submit', { cancelable: true });
      loginForm.dispatchEvent(submitEvent);
    }
  }
}

function onLoginSuccess(user) {
  document.getElementById('nav-login-btn').style.display = 'none';
  document.getElementById('nav-dashboard-btn').style.display = 'flex';
  document.getElementById('logout-btn').style.display = 'flex';
  document.getElementById('admin-display-email').innerText = user.email;
  
  // Set window hash if we are in login view to move to dashboard
  if (currentView === 'login') {
    window.location.hash = '#admin';
  }
}

async function handleLogout() {
  if (isDemoMode) {
    localStorage.removeItem('demo_session');
  } else if (db) {
    await db.auth.signOut();
  }
  
  currentUser = null;
  onLogoutCleanup();
  showToast('Sesi ditutup dengan aman.', 'info');
  window.location.hash = '#home';
  navigateTo('home');
}

function onLogoutCleanup() {
  document.getElementById('nav-login-btn').style.display = 'flex';
  document.getElementById('nav-dashboard-btn').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'none';
}

// =======================================================
// ADMIN DASHBOARD TAB NAVIGATION
// =======================================================
function switchDashboardTab(tabId) {
  // Update active tab buttons
  document.querySelectorAll('.sidebar-menu-item').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update active tab contents
  document.querySelectorAll('.dashboard-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeContent = document.getElementById(`dashboard-tab-${tabId}`);
  if (activeContent) activeContent.classList.add('active');

  // Load appropriate data
  if (tabId === 'stats') {
    loadDashboardStats();
  } else if (tabId === 'applications') {
    loadApplications();
  } else if (tabId === 'roster') {
    loadRoster();
  } else if (tabId === 'config') {
    loadSettingsTab();
  }
  
  lucide.createIcons();
}

// =======================================================
// TAB A: STATS & RINGKASAN LOGIC
// =======================================================
async function loadDashboardStats() {
  let roster = [];
  let apps = [];
  
  if (isDemoMode) {
    roster = JSON.parse(localStorage.getItem('roster_data') || '[]');
    apps = JSON.parse(localStorage.getItem('applications_data') || '[]');
  } else if (db) {
    try {
      const rosterRes = await db.from('roster').select('*');
      const appsRes = await db.from('applications').select('*');
      if (!rosterRes.error) roster = rosterRes.data || [];
      if (!appsRes.error) apps = appsRes.data || [];
    } catch (e) {
      console.error(e);
    }
  }

  // Total members
  document.getElementById('dash-total-members').innerText = roster.length;
  
  // Pending applications
  const pendingCount = apps.filter(a => a.status === 'pending').length;
  document.getElementById('dash-pending-apps').innerText = pendingCount;
  
  // Dashboard application counts badge
  const pendingBadge = document.getElementById('badge-pending-count');
  if (pendingCount > 0) {
    pendingBadge.innerText = pendingCount;
    pendingBadge.style.display = 'inline-block';
  } else {
    pendingBadge.style.display = 'none';
  }

  // Accepted applications (month overview)
  const acceptedCount = apps.filter(a => a.status === 'approved').length;
  document.getElementById('dash-accepted-apps').innerText = acceptedCount;

  // Render recent activity logs
  renderActivityLogs();
}

function logActivity(text) {
  const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
  logs.unshift({ time: new Date().toISOString(), text: text });
  // Limit to 10 logs
  if (logs.length > 10) logs.pop();
  localStorage.setItem('activity_logs', JSON.stringify(logs));
}

function renderActivityLogs() {
  const logContainer = document.getElementById('dashboard-recent-activity');
  const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
  
  if (logs.length === 0) {
    logContainer.innerHTML = `<div class="log-item">Belum ada aktivitas.</div>`;
    return;
  }
  
  logContainer.innerHTML = logs.map(l => {
    const formattedTime = new Date(l.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="log-item">
        <span class="log-time">[${formattedTime}]</span>
        <span class="log-text">${l.text}</span>
      </div>
    `;
  }).join('');
}

// =======================================================
// TAB B: APPLICATIONS REVIEW LOGIC
// =======================================================
async function loadApplications() {
  const container = document.getElementById('applications-container');
  const statusFilter = document.getElementById('filter-app-status').value;
  let apps = [];

  container.innerHTML = `<div class="no-data-msg">Memuat data pendaftaran...</div>`;

  try {
    if (isDemoMode) {
      apps = JSON.parse(localStorage.getItem('applications_data') || '[]');
    } else if (db) {
      let query = db.from('applications').select('*');
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      apps = data || [];
    }
  } catch (error) {
    console.error("Failed to load apps:", error);
    container.innerHTML = `<div class="no-data-msg text-danger">Gagal memuat data dari database cloud.</div>`;
    return;
  }

  // Apply filters locally in demo mode
  if (isDemoMode && statusFilter !== 'all') {
    apps = apps.filter(a => a.status === statusFilter);
  }

  // Sort by date descending
  apps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (apps.length === 0) {
    container.innerHTML = `<div class="no-data-msg">Tidak ada formulir pendaftaran ditemukan untuk filter ini.</div>`;
    return;
  }

  container.innerHTML = apps.map(app => {
    const createdDate = new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    let statusClass = 'warning';
    let statusLabel = 'PENDING';
    if (app.status === 'approved') { statusClass = 'success'; statusLabel = 'DITERIMA'; }
    if (app.status === 'rejected') { statusClass = 'error'; statusLabel = 'DITOLAK'; }

    return `
      <div class="glass-card app-card">
        <div class="app-info-left">
          <div class="app-name-row">
            <h3>${app.ic_name}</h3>
            <span class="badge-status ${app.status}">${statusLabel}</span>
          </div>
          <div class="app-ooc-sub">Pendaftar OOC: <strong>${app.ooc_name}</strong> (Umur: ${app.ooc_age})</div>
          <div class="app-details-quick">
            <span><i data-lucide="hash"></i> Discord: ${app.discord_id}</span>
            <span><i data-lucide="calendar"></i> Tanggal: ${createdDate}</span>
            <span><i data-lucide="award"></i> Angkatan: ${app.batch || '1'}</span>
          </div>
        </div>
        <div class="app-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewApplicationDetail('${app.id}')">
            Lihat Detail <i data-lucide="eye"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

async function viewApplicationDetail(appId) {
  let app = null;
  
  if (isDemoMode) {
    const apps = JSON.parse(localStorage.getItem('applications_data') || '[]');
    app = apps.find(a => a.id === appId);
  } else if (db) {
    try {
      const { data, error } = await db.from('applications').select('*').eq('id', appId).single();
      if (!error) app = data;
    } catch (e) {
      console.error(e);
    }
  }

  if (!app) {
    showToast('Aplikasi tidak ditemukan!', 'error');
    return;
  }

  const modalBody = document.getElementById('app-modal-body');
  const modalFooter = document.getElementById('app-modal-footer');

  // Construct modal content
  modalBody.innerHTML = `
    <!-- OOC INFO -->
    <div class="modal-detail-section">
      <h4>Informasi Out Of Character (OOC)</h4>
      <div class="detail-row-grid">
        <div class="detail-label-value">
          <span>Nama Asli</span>
          <span>${app.ooc_name}</span>
        </div>
        <div class="detail-label-value">
          <span>Nama Paspor (OOC)</span>
          <span>${app.passport_name_ooc || '-'}</span>
        </div>
        <div class="detail-label-value">
          <span>Umur</span>
          <span>${app.ooc_age} Tahun</span>
        </div>
        <div class="detail-label-value">
          <span>Jenis Kelamin</span>
          <span>${app.ooc_gender || '-'}</span>
        </div>
        <div class="detail-label-value">
          <span>Discord Username</span>
          <span>${app.discord_id}</span>
        </div>
        <div class="detail-label-value">
          <span>Steam Hex / License</span>
          <span><code>${app.steam_hex}</code></span>
        </div>
        <div class="detail-label-value">
          <span>Lama RP</span>
          <span>${app.playtime}</span>
        </div>
        <div class="detail-label-value">
          <span>Angkatan</span>
          <span>Angkatan ${app.batch || '1'}</span>
        </div>
        <div class="detail-label-value" style="grid-column: span 2; margin-top: 0.5rem;">
          <span>Pengalaman RP</span>
          <span>${app.rp_experience_ooc || '-'}</span>
        </div>
        <div class="detail-label-value" style="grid-column: span 2; margin-top: 0.5rem;">
          <span>Tanggungan di Kota Lain</span>
          <span>${app.obligations_other_cities || '-'}</span>
        </div>
      </div>
    </div>

    <!-- IC INFO -->
    <div class="modal-detail-section">
      <h4>Informasi In Character (IC)</h4>
      <div class="detail-row-grid">
        <div class="detail-label-value">
          <span>Nama Karakter</span>
          <span><strong>${app.ic_name}</strong></span>
        </div>
        <div class="detail-label-value">
          <span>Umur Karakter</span>
          <span>${app.ic_age} Tahun</span>
        </div>
        <div class="detail-label-value">
          <span>Jenis Kelamin Karakter</span>
          <span>${app.ic_gender || '-'}</span>
        </div>
        <div class="detail-label-value">
          <span>Tanggal Lahir</span>
          <span>${app.ic_dob || '-'}</span>
        </div>
        <div class="detail-label-value">
          <span>Nomor HP</span>
          <span>${app.phone_number}</span>
        </div>
        <div class="detail-label-value">
          <span>Asal Negara</span>
          <span>${app.origin}</span>
        </div>
        <div class="detail-label-value" style="grid-column: span 2; margin-top: 0.5rem;">
          <span>Riwayat Pengalaman LEO</span>
          <span>${app.experience}</span>
        </div>
      </div>
    </div>

    <!-- QUESTIONS & SCENARIOS -->
    <div class="modal-detail-section">
      <h4>Kualifikasi Personal & Skenario Taktis</h4>
      <div class="modal-question-box">
        <p>Kasus Kriminal:</p>
        <p>${app.criminal_record || '-'}</p>
      </div>
      <div class="modal-question-box">
        <p>Pengalaman Kerja Sebelumnya:</p>
        <p>${app.work_experience_ic || '-'}</p>
      </div>
      <div class="modal-question-box">
        <p>Kenapa ingin mendaftar di Sheriff Kerajaan Roxwood?</p>
        <p>${app.motivation_roxwood || app.motivation || '-'}</p>
      </div>
      <div class="modal-question-box">
        <p>Mengapa kami harus menerima Anda menjadi bagian dari Sheriff Kerajaan Roxwood?</p>
        <p>${app.why_accept_roxwood || '-'}</p>
      </div>
      <div class="modal-question-box">
        <p>Jam Aktif Berdinas:</p>
        <p>${app.active_hours || '-'}</p>
      </div>
      <div class="modal-question-box">
        <p>Apa arti Rantai Komando?</p>
        <p>${app.chain_of_command}</p>
      </div>
      <div class="modal-question-box">
        <p>Skenario Tindakan Penembakan / Penggunaan Kekuatan (Use of Force):</p>
        <p>${app.scenario_use_of_force}</p>
      </div>
    </div>

    ${app.status === 'rejected' ? `
      <div class="decision-box reject">
        <h4>Alasan Penolakan Aplikasi:</h4>
        <p>${app.rejection_reason || 'Tidak ada alasan yang diberikan.'}</p>
      </div>
    ` : ''}
  `;

  // Actions footer
  if (app.status === 'pending') {
    modalFooter.innerHTML = `
      <div style="width: 100%;">
        <!-- Toggle decision containers -->
        <div id="decision-actions" style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button class="btn btn-secondary" onclick="showAppRejectPanel('${app.id}')">
            Tolak Aplikasi <i data-lucide="x-circle"></i>
          </button>
          <button class="btn btn-success" onclick="showAppApprovePanel('${app.id}', '${app.ic_name.replace(/'/g, "\\'")}')">
            Terima Aplikasi <i data-lucide="check-circle-2"></i>
          </button>
        </div>

        <!-- Approval Action Panel -->
        <div id="approve-panel" class="decision-box approve" style="display: none;">
          <h4>Penerimaan Deputi Baru</h4>
          <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label for="approve-callsign">Berikan Badge Callsign <span class="required">*</span></label>
              <input type="text" id="approve-callsign" placeholder="Contoh: 302" required>
            </div>
            <div class="form-group">
              <label for="approve-rank">Pangkat Awal</label>
              <select id="approve-rank">
                <option value="Cadet">Cadet</option>
                <option value="Deputy Sheriff">Deputy Sheriff</option>
              </select>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-sm btn-secondary" onclick="hideAppDecisionPanels()">Batal</button>
            <button class="btn btn-sm btn-success" onclick="submitAppApproval('${app.id}', '${app.ic_name.replace(/'/g, "\\'")}')">Konfirmasi & Simpan Roster <i data-lucide="check"></i></button>
          </div>
        </div>

        <!-- Rejection Action Panel -->
        <div id="reject-panel" class="decision-box reject" style="display: none;">
          <h4>Tolak Aplikasi Pendaftaran</h4>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label for="reject-reason">Alasan Penolakan <span class="required">*</span></label>
            <textarea id="reject-reason" rows="2" placeholder="Tulis alasan pendaftaran ditolak agar dibaca pendaftar..." required></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-sm btn-secondary" onclick="hideAppDecisionPanels()">Batal</button>
            <button class="btn btn-sm btn-primary" onclick="submitAppRejection('${app.id}')">Konfirmasi Tolak <i data-lucide="x"></i></button>
          </div>
        </div>
      </div>
    `;
  } else {
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeAppModal()">Tutup</button>
    `;
  }

  // Open modal
  document.getElementById('app-detail-modal').classList.add('open');
  lucide.createIcons();
}

function closeAppModal() {
  document.getElementById('app-detail-modal').classList.remove('open');
}

// Subpanel switch decisions
function showAppApprovePanel(appId, icName) {
  document.getElementById('decision-actions').style.display = 'none';
  document.getElementById('approve-panel').style.display = 'block';
  document.getElementById('approve-callsign').focus();
  lucide.createIcons();
}

function showAppRejectPanel(appId) {
  document.getElementById('decision-actions').style.display = 'none';
  document.getElementById('reject-panel').style.display = 'block';
  document.getElementById('reject-reason').focus();
  lucide.createIcons();
}

function hideAppDecisionPanels() {
  document.getElementById('decision-actions').style.display = 'flex';
  document.getElementById('approve-panel').style.display = 'none';
  document.getElementById('reject-panel').style.display = 'none';
  lucide.createIcons();
}

// Approve action API
async function submitAppApproval(appId, icName) {
  const callsign = document.getElementById('approve-callsign').value.trim();
  const rank = document.getElementById('approve-rank').value;

  if (!callsign) {
    showToast('Badge Callsign wajib diisi!', 'error');
    return;
  }

  try {
    if (isDemoMode) {
      // 1. Update status di local applications
      const apps = JSON.parse(localStorage.getItem('applications_data') || '[]');
      const index = apps.findIndex(a => a.id === appId);
      if (index !== -1) {
        apps[index].status = 'approved';
        localStorage.setItem('applications_data', JSON.stringify(apps));
      }

      // 2. Tambah ke local roster
      const roster = JSON.parse(localStorage.getItem('roster_data') || '[]');
      
      // Cek apakah callsign duplikat
      if (roster.some(r => r.callsign === callsign)) {
        showToast('Callsign badge sudah digunakan oleh deputi lain!', 'error');
        return;
      }

      roster.push({
        id: "r_" + Math.random().toString(36).substr(2, 9),
        ic_name: icName,
        callsign: callsign,
        rank: rank,
        division: 'VIGILIS',
        status: 'Active',
        batch: apps[index].batch || '1',
        join_date: new Date().toISOString()
      });
      localStorage.setItem('roster_data', JSON.stringify(roster));

      // Log activity
      logActivity(`Pimpinan menyetujui aplikasi <strong>${icName}</strong> dengan Badge Callsign: <strong>[${callsign}]</strong>`);

      onApprovalSuccess();
    } else if (db) {
      // Supabase transaction simulation (since we call two tables)
      
      // Cek duplikat callsign di supabase
      const { data: duplicate } = await db.from('roster').select('id').eq('callsign', callsign).maybeSingle();
      if (duplicate) {
        showToast('Callsign badge sudah digunakan oleh deputi lain!', 'error');
        return;
      }

      // 1. Get batch from application
      const { data: appData, error: fetchErr } = await db.from('applications').select('batch').eq('id', appId).single();
      if (fetchErr) throw fetchErr;
      const appBatch = appData?.batch || '1';

      // 2. Update application status
      const { error: appErr } = await db.from('applications').update({ status: 'approved' }).eq('id', appId);
      if (appErr) throw appErr;

      // 3. Insert to roster
      const { error: rosterErr } = await db.from('roster').insert([{
        ic_name: icName,
        callsign: callsign,
        rank: rank,
        division: 'VIGILIS',
        status: 'Active',
        batch: appBatch
      }]);
      if (rosterErr) throw rosterErr;

      onApprovalSuccess();
    }
  } catch (error) {
    console.error(error);
    showToast('Gagal menyetujui aplikasi.', 'error');
  }
}

function onApprovalSuccess() {
  showToast('Aplikasi berhasil disetujui dan dimasukkan ke Roster.', 'success');
  closeAppModal();
  loadApplications();
}

// Reject action API
async function submitAppRejection(appId) {
  const reason = document.getElementById('reject-reason').value.trim();

  if (!reason) {
    showToast('Alasan penolakan wajib diisi!', 'error');
    return;
  }

  try {
    if (isDemoMode) {
      const apps = JSON.parse(localStorage.getItem('applications_data') || '[]');
      const index = apps.findIndex(a => a.id === appId);
      if (index !== -1) {
        apps[index].status = 'rejected';
        apps[index].rejection_reason = reason;
        localStorage.setItem('applications_data', JSON.stringify(apps));
        
        // Log activity
        logActivity(`Pimpinan menolak aplikasi <strong>${apps[index].ic_name}</strong>. Alasan: ${reason}`);
      }
      onRejectionSuccess();
    } else if (db) {
      const { error } = await db
        .from('applications')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', appId);
        
      if (error) throw error;
      onRejectionSuccess();
    }
  } catch (error) {
    console.error(error);
    showToast('Gagal menolak aplikasi.', 'error');
  }
}

function onRejectionSuccess() {
  showToast('Aplikasi telah ditolak.', 'info');
  closeAppModal();
  loadApplications();
}

// =======================================================
// TAB C: ROSTER OPERATIONAL LOGIC (CRUD)
// =======================================================
let localRosterState = [];

async function loadRoster() {
  const tableBody = document.getElementById('roster-table-body');
  tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Memuat data roster...</td></tr>`;

  try {
    if (isDemoMode) {
      localRosterState = JSON.parse(localStorage.getItem('roster_data') || '[]');
    } else if (db) {
      const { data, error } = await db.from('roster').select('*').order('callsign', { ascending: true });
      if (error) throw error;
      localRosterState = data || [];
    }
    
    renderRosterTable(localRosterState);
  } catch (error) {
    console.error("Failed to load roster:", error);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat data dari database cloud.</td></tr>`;
  }
}

function renderRosterTable(rosterList) {
  const tableBody = document.getElementById('roster-table-body');
  
  if (rosterList.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Belum ada anggota terdaftar di Roster.</td></tr>`;
    return;
  }

  // Sort by callsign number order naturally
  rosterList.sort((a, b) => parseInt(a.callsign) - parseInt(b.callsign));

  tableBody.innerHTML = rosterList.map(member => {
    const formattedDate = new Date(member.join_date || member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Status Badge classes
    let statusClass = 'active';
    let statusLabel = 'ACTIVE';
    if (member.status === 'LOA') { statusClass = 'loa'; statusLabel = 'CUTI (LOA)'; }
    if (member.status === 'Suspended') { statusClass = 'suspended'; statusLabel = 'SUSPENDED'; }
    if (member.status === 'Retired') { statusClass = 'retired'; statusLabel = 'RETIRED'; }

    // Rank class styling
    const rankLower = member.rank.toLowerCase();
    let rankClass = 'cadet';
    if (rankLower.includes('sheriff')) rankClass = 'sheriff';
    if (rankLower.includes('undersheriff')) rankClass = 'undersheriff';
    if (rankLower.includes('captain')) rankClass = 'captain';
    if (rankLower.includes('lieutenant')) rankClass = 'lieutenant';
    if (rankLower.includes('sergeant')) rankClass = 'sergeant';

    return `
      <tr>
        <td><strong>${member.ic_name}</strong></td>
        <td><code style="font-size: 1rem; color: var(--color-gold);">[${member.callsign}]</code></td>
        <td><span class="badge-rank ${rankClass}">${member.rank}</span></td>
        <td>
          <span class="badge-division">
            ${getDivisionIcon(member.division)} ${member.division}
          </span>
        </td>
        <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
        <td>${formattedDate}<br><small style="color: var(--color-text-muted); font-size: 0.75rem;">Angkatan ${member.batch || '1'}</small></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon edit" onclick="openEditMemberModal('${member.id}')" title="Edit Anggota">
              <i data-lucide="pencil"></i>
            </button>
            <button class="btn-icon delete" onclick="deleteMember('${member.id}', '${member.ic_name.replace(/'/g, "\\'")}')" title="Pecat / Hapus Anggota">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

function getDivisionIcon(division) {
  if (division === 'K9') return '<i data-lucide="dog" style="width: 13px; height: 13px;"></i>';
  if (division === 'SEU') return '<i data-lucide="navigation" style="width: 13px; height: 13px;"></i>';
  if (division === 'ASD') return '<i data-lucide="plane" style="width: 13px; height: 13px;"></i>';
  if (division === 'Detective') return '<i data-lucide="search" style="width: 13px; height: 13px;"></i>';
  return '<i data-lucide="shield" style="width: 13px; height: 13px;"></i>';
}

// Local filters
function filterRoster() {
  const query = document.getElementById('roster-search').value.toLowerCase();
  const rank = document.getElementById('roster-filter-rank').value;
  const status = document.getElementById('roster-filter-status').value;

  const filtered = localRosterState.filter(member => {
    const matchesQuery = member.ic_name.toLowerCase().includes(query) || member.callsign.includes(query);
    const matchesRank = !rank || member.rank === rank;
    const matchesStatus = !status || member.status === status;
    
    return matchesQuery && matchesRank && matchesStatus;
  });

  renderRosterTable(filtered);
}

// Modal handling CRUD members
function openAddMemberModal() {
  document.getElementById('member-modal-title').innerText = "Tambah Anggota Roster Manual";
  document.getElementById('edit-member-id').value = "";
  document.getElementById('member-form').reset();
  
  document.getElementById('member-modal').classList.add('open');
  lucide.createIcons();
}

function openEditMemberModal(memberId) {
  const member = localRosterState.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('member-modal-title').innerText = "Edit Detail Deputi";
  document.getElementById('edit-member-id').value = member.id;
  document.getElementById('member-ic-name').value = member.ic_name;
  document.getElementById('member-callsign').value = member.callsign;
  document.getElementById('member-rank').value = member.rank;
  document.getElementById('member-division').value = member.division;
  document.getElementById('member-status').value = member.status;

  document.getElementById('member-modal').classList.add('open');
  lucide.createIcons();
}

function closeMemberModal() {
  document.getElementById('member-modal').classList.remove('open');
}

// Add/Update member submission
async function handleMemberSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('edit-member-id').value;
  const icName = document.getElementById('member-ic-name').value.trim();
  const callsign = document.getElementById('member-callsign').value.trim();
  const rank = document.getElementById('member-rank').value;
  const division = document.getElementById('member-division').value;
  const status = document.getElementById('member-status').value;

  const memberData = {
    ic_name: icName,
    callsign: callsign,
    rank: rank,
    division: division,
    status: status
  };

  try {
    if (isDemoMode) {
      const roster = JSON.parse(localStorage.getItem('roster_data') || '[]');

      if (id) {
        // Mode EDIT
        // Cek duplikat callsign di luar member yang sedang di-edit
        if (roster.some(r => r.callsign === callsign && r.id !== id)) {
          showToast('Callsign badge sudah digunakan!', 'error');
          return;
        }

        const idx = roster.findIndex(m => m.id === id);
        if (idx !== -1) {
          // Log promo atau perubahan
          const old = roster[idx];
          if (old.rank !== rank) logActivity(`Pangkat <strong>${icName}</strong> diubah dari ${old.rank} ke <strong>${rank}</strong>`);
          
          roster[idx] = { ...old, ...memberData };
          showToast('Data deputi berhasil diperbarui.', 'success');
        }
      } else {
        // Mode TAMBAH MANUAL
        if (roster.some(r => r.callsign === callsign)) {
          showToast('Callsign badge sudah digunakan!', 'error');
          return;
        }

        memberData.id = "r_" + Math.random().toString(36).substr(2, 9);
        memberData.join_date = new Date().toISOString();
        memberData.batch = activeBatch;
        roster.push(memberData);
        
        logActivity(`Anggota baru terdaftar manual: <strong>${icName}</strong> [Badge: ${callsign}]`);
        showToast('Deputi berhasil didaftarkan.', 'success');
      }

      localStorage.setItem('roster_data', JSON.stringify(roster));
      closeMemberModal();
      loadRoster();
    } else if (db) {
      if (id) {
        // Edit Supabase
        const { error } = await db.from('roster').update(memberData).eq('id', id);
        if (error) throw error;
        showToast('Data berhasil disimpan ke cloud database.', 'success');
      } else {
        // Tambah Supabase
        const { error } = await db.from('roster').insert([{ ...memberData, batch: activeBatch }]);
        if (error) throw error;
        showToast('Deputi baru ditambahkan ke cloud database.', 'success');
      }
      closeMemberModal();
      loadRoster();
    }
  } catch (error) {
    console.error(error);
    showToast('Gagal memproses data anggota.', 'error');
  }
}

// Delete / Fire member
async function deleteMember(memberId, icName) {
  if (!confirm(`Apakah Anda yakin ingin memecat / menghapus ${icName} dari roster?`)) return;

  try {
    if (isDemoMode) {
      const roster = JSON.parse(localStorage.getItem('roster_data') || '[]');
      const filtered = roster.filter(m => m.id !== memberId);
      localStorage.setItem('roster_data', JSON.stringify(filtered));
      
      logActivity(`Anggota <strong>${icName}</strong> dihapus/dipecat dari roster.`);
      showToast('Anggota dihapus dari roster.', 'info');
      loadRoster();
    } else if (db) {
      const { error } = await db.from('roster').delete().eq('id', memberId);
      if (error) throw error;
      showToast('Anggota terhapus dari cloud database.', 'info');
      loadRoster();
    }
  } catch (error) {
    console.error(error);
    showToast('Gagal menghapus anggota.', 'error');
  }
}

// =======================================================
// SETTINGS / CONFIGURATION TAB LOGIC
// =======================================================
function saveSupabaseConfig() {
  const url = document.getElementById('config-supabase-url').value.trim();
  const key = document.getElementById('config-supabase-key').value.trim();

  if (!url || !key) {
    showToast('Harap isi kedua kolom Supabase URL & Anon Key!', 'error');
    return;
  }

  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  localStorage.removeItem('use_demo_mode');
  
  showToast('Konfigurasi disimpan. Menghubungkan ulang...', 'success');
  
  // Reload page to re-trigger connection init
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function resetToDemoConfig() {
  localStorage.setItem('use_demo_mode', 'true');
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  
  showToast('Konfigurasi dibersihkan. Memuat ulang demo...', 'info');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function loadSettingsTab() {
  const batchEl = document.getElementById('config-active-batch');
  const statusEl = document.getElementById('config-recruitment-status');
  if (batchEl) batchEl.value = activeBatch;
  if (statusEl) statusEl.value = recruitmentStatus;
}

function saveRecruitmentSettings() {
  const batchEl = document.getElementById('config-active-batch');
  const statusEl = document.getElementById('config-recruitment-status');
  
  if (batchEl && statusEl) {
    activeBatch = batchEl.value.trim() || '1';
    recruitmentStatus = statusEl.value;
    
    localStorage.setItem('active_batch', activeBatch);
    localStorage.setItem('recruitment_status', recruitmentStatus);
    
    updateRecruitmentBadges();
    showToast('Pengaturan rekrutmen & angkatan berhasil disimpan.', 'success');
  }
}

// =======================================================
// NOTIFICATION SYSTEM (TOAST)
// =======================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  // Trigger browser visual entrance animation, then remove
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    toast.style.transform = 'translateX(100px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// =======================================================
// INTERACTIVE DISPLAY SETTINGS PANEL
// =======================================================
function toggleSettingsPanel(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('accessibility-panel');
  if (panel) {
    panel.classList.toggle('open');
  }
}

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('accessibility-panel');
  const toggleBtn = document.querySelector('.widget-toggle-btn');
  if (panel && panel.classList.contains('open')) {
    if (!panel.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
      panel.classList.remove('open');
    }
  }
});

function changeTextScale(scale) {
  let size = '16px';
  if (scale === 'small') size = '14px';
  if (scale === 'large') size = '18px';
  
  document.documentElement.style.setProperty('--base-font-size', size);
  localStorage.setItem('ui_scale_font', scale);
  
  // Update active state in buttons
  document.querySelectorAll('[id^="btn-scale-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`btn-scale-${scale}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function changeLayoutWidth(width) {
  let contentWidth = '1200px';
  if (width === 'compact') contentWidth = '1000px';
  if (width === 'fluid') contentWidth = '95%';
  
  document.documentElement.style.setProperty('--max-content-width', contentWidth);
  localStorage.setItem('ui_scale_width', width);
  
  // Update active state in buttons
  document.querySelectorAll('[id^="btn-width-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`btn-width-${width}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function applySavedUISettings() {
  const savedScale = localStorage.getItem('ui_scale_font') || 'medium';
  const savedWidth = localStorage.getItem('ui_scale_width') || 'normal';
  changeTextScale(savedScale);
  changeLayoutWidth(savedWidth);
}
