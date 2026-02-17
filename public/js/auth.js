// FlowOps360 Command Center — Auth & Navigation
// Handles: Supabase client init, login/logout, pillar tabs, settings, error handling

var SUPABASE_URL = 'https://bbsldtgusmjpulohxzpa.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJic2xkdGd1c21qcHVsb2h4enBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTAyNzQsImV4cCI6MjA4NTYyNjI3NH0.wnRJpsDrXn2dRqQQsGVzToAeauxZgboPiXPxRc-5Xq8';
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var failedLogins = 0;
var activePillar = 'operations';

var PILLARS = [
  { id: 'operations', label: 'Operations', loader: typeof loadOperations === 'function' ? loadOperations : null },
  { id: 'sales', label: 'Sales', loader: null },
  { id: 'marketing', label: 'Marketing', loader: null },
  { id: 'leadership', label: 'Leadership', loader: null },
  { id: 'finance', label: 'Finance', loader: null },
  { id: 'legal', label: 'Legal', loader: null },
  { id: 'system', label: 'System', loader: typeof loadSystem === 'function' ? loadSystem : null }
];

// Login
async function doLogin() {
  var email = document.getElementById('email').value.trim();
  var pw = document.getElementById('password').value;
  var errEl = document.getElementById('login-error');
  var btn = document.getElementById('login-btn');
  errEl.style.display = 'none';
  if (!email || !pw) { errEl.textContent = 'Email and password required.'; errEl.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    var res = await sb.auth.signInWithPassword({ email: email, password: pw });
    if (res.error) {
      failedLogins++;
      if (res.error.message && res.error.message.indexOf('Invalid login credentials') >= 0) {
        errEl.textContent = 'Invalid email or password.';
      } else if (failedLogins >= 3) {
        errEl.textContent = 'Authentication may not be configured. Contact admin.';
      } else {
        errEl.textContent = res.error.message || 'Login failed.';
      }
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Sign In';
      return;
    }
    showDashboard(res.data.user);
  } catch (e) {
    errEl.textContent = 'Unable to connect. Check your network.';
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

// Logout
async function doLogout() {
  await sb.auth.signOut();
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

// Dashboard
function showDashboard(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('user-email').textContent = user.email;
  PILLARS[0].loader = typeof loadOperations === 'function' ? loadOperations : null;
  PILLARS[6].loader = typeof loadSystem === 'function' ? loadSystem : null;
  renderNav();
  navigateTo('operations');
}

// Navigation
function renderNav() {
  var nav = document.getElementById('nav-tabs');
  nav.innerHTML = '';
  PILLARS.forEach(function(p) {
    var tab = document.createElement('div');
    tab.className = 'nav-tab' + (p.id === activePillar ? ' active' : '');
    tab.textContent = p.label;
    tab.onclick = function() { navigateTo(p.id); };
    nav.appendChild(tab);
  });
}

function navigateTo(pillarId) {
  activePillar = pillarId;
  renderNav();
  var content = document.getElementById('pillar-content');
  content.innerHTML = '';
  var pillar = PILLARS.find(function(p) { return p.id === pillarId; });
  if (pillar && pillar.loader) {
    pillar.loader(content);
  } else {
    content.innerHTML = '<div class="placeholder-pillar"><h2>' + escapeHtml(pillar ? pillar.label : pillarId) + '</h2><p>Coming in Phase 2</p></div>';
  }
}

// Error Handling
function logError(cardId, rpcName, code, message) {
  console.error({ card_id: cardId, rpc_name: rpcName, error_code: code, error_message: message, timestamp: new Date().toISOString() });
}

async function handleCardError(containerId, rpcName, error, retryFn) {
  if (error && (error.code === 'PGRST301' || (error.message && error.message.indexOf('JWT') >= 0))) {
    showToast('Session expired. Signing out...', 'error');
    await doLogout();
    return;
  }
  logError(containerId, rpcName, error && error.code, error && error.message);
  cardError(containerId, (error && error.message) || 'Failed to load', retryFn);
}

// Settings Panel
function renderSettingsPanel() {
  var existing = document.querySelector('.settings-overlay');
  if (existing) { existing.remove(); document.querySelector('.settings-drawer').remove(); return; }

  var overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.onclick = closeSettings;

  var drawer = document.createElement('div');
  drawer.className = 'settings-drawer';
  drawer.innerHTML = '<div class="settings-header"><h2>Settings</h2><button class="btn-icon" onclick="closeSettings()">&times;</button></div>'
    + '<div class="settings-body">'
    + '<div class="settings-section"><span class="settings-label">Card Density</span>'
    + '<div class="settings-toggle-group" id="density-toggle">'
    + '<button onclick="setDensity(300)" ' + (getCardWidth() <= 300 ? 'class="active"' : '') + '>Compact</button>'
    + '<button onclick="setDensity(400)" ' + (getCardWidth() === 400 ? 'class="active"' : '') + '>Default</button>'
    + '<button onclick="setDensity(500)" ' + (getCardWidth() >= 500 ? 'class="active"' : '') + '>Wide</button>'
    + '</div></div>'
    + '<div class="settings-section"><span class="settings-label">Theme</span>'
    + '<div class="settings-toggle-group">'
    + '<button class="active">Dark</button>'
    + '<button disabled title="Coming soon">Light</button>'
    + '</div></div>'
    + '</div>';

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

function closeSettings() {
  var o = document.querySelector('.settings-overlay');
  var d = document.querySelector('.settings-drawer');
  if (o) o.remove();
  if (d) d.remove();
}

function getCardWidth() {
  var val = getComputedStyle(document.documentElement).getPropertyValue('--card-min-width').trim();
  return parseInt(val) || 400;
}

function setDensity(px) {
  document.documentElement.style.setProperty('--card-min-width', px + 'px');
  try { localStorage.setItem('fo360-card-width', px); } catch (e) {}
  var btns = document.querySelectorAll('#density-toggle button');
  btns.forEach(function(b) { b.classList.remove('active'); });
  var idx = px <= 300 ? 0 : px >= 500 ? 2 : 1;
  if (btns[idx]) btns[idx].classList.add('active');
}

// Init — auto-login if session exists
(async function() {
  try {
    var saved = localStorage.getItem('fo360-card-width');
    if (saved) document.documentElement.style.setProperty('--card-min-width', saved + 'px');
  } catch (e) {}

  var s = await sb.auth.getSession();
  if (s.data.session && s.data.session.user) {
    showDashboard(s.data.session.user);
  }

  sb.auth.onAuthStateChange(function(ev) {
    if (ev === 'SIGNED_OUT') {
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
    }
  });
})();