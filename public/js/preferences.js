// FlowOps360 Command Center — Preferences
// Theme toggle (dark/light/system), card sizing, column visibility
// Persists to Supabase user_preferences table via RPCs

let userPrefs = {};
let systemThemeWatcher = null;

const DEFAULT_PREFS = {
  theme: 'dark',
  card_grid_size: 'default',
  column_visibility: {}
};

const THEMES = {
  dark: {
    '--bg': '#0f172a',
    '--bg-card': '#1e293b',
    '--bg-hover': '#334155',
    '--text': '#f1f5f9',
    '--text-muted': '#94a3b8',
    '--text-dim': '#64748b',
    '--accent': '#3b82f6',
    '--accent-hover': '#2563eb',
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--border': '#334155',
  },
  light: {
    '--bg': '#f8fafc',
    '--bg-card': '#ffffff',
    '--bg-hover': '#f1f5f9',
    '--text': '#0f172a',
    '--text-muted': '#64748b',
    '--text-dim': '#94a3b8',
    '--accent': '#2563eb',
    '--accent-hover': '#1d4ed8',
    '--success': '#16a34a',
    '--warning': '#d97706',
    '--error': '#dc2626',
    '--border': '#e2e8f0',
  }
};

const GRID_SIZES = {
  compact:  '320px',
  default:  '400px',
  wide:     '550px',
  full:     '1fr'
};

async function loadPreferences() {
  try {
    const { data, error } = await sb.rpc('get_user_preferences');
    if (error) { console.error('Failed to load preferences:', error.message); return; }
    userPrefs = { ...DEFAULT_PREFS, ...(data || {}) };
  } catch (e) {
    console.error('Preferences load error:', e);
    userPrefs = { ...DEFAULT_PREFS };
  }
  applyTheme(userPrefs.theme);
  applyGridSize(userPrefs.card_grid_size);
}

async function savePref(patch) {
  userPrefs = { ...userPrefs, ...patch };
  try {
    await sb.rpc('merge_user_preferences', { p_patch: patch });
  } catch (e) {
    console.error('Preferences save error:', e);
  }
}

function applyTheme(mode) {
  let resolvedTheme = mode;
  if (mode === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (!systemThemeWatcher) {
      systemThemeWatcher = window.matchMedia('(prefers-color-scheme: dark)');
      systemThemeWatcher.addEventListener('change', (e) => {
        if (userPrefs.theme === 'system') {
          applyThemeVars(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
  applyThemeVars(resolvedTheme);
  const btns = document.querySelectorAll('.theme-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.theme === mode));
}

function applyThemeVars(themeName) {
  const vars = THEMES[themeName] || THEMES.dark;
  const root = document.documentElement;
  Object.entries(vars).forEach(([prop, val]) => root.style.setProperty(prop, val));
  document.body.dataset.theme = themeName;
}

function applyGridSize(size) {
  const minW = GRID_SIZES[size] || GRID_SIZES.default;
  document.documentElement.style.setProperty('--card-min-width', minW);
  const btns = document.querySelectorAll('.grid-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.size === size));
}

function renderSettingsPanel() {
  const existing = document.getElementById('settings-panel');
  if (existing) { existing.remove(); return; }
  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.innerHTML = '<div class="settings-overlay" onclick="closeSettings()"></div><div class="settings-drawer"><div class="settings-header"><h2>Settings</h2><button class="btn-sm" onclick="closeSettings()">&times;</button></div><div class="settings-body"><div class="settings-section"><label class="settings-label">Theme</label><div class="settings-toggle-group"><button class="theme-btn' + (userPrefs.theme === 'dark' ? ' active' : '') + '" data-theme="dark" onclick="setTheme(\'dark\')">Dark</button><button class="theme-btn' + (userPrefs.theme === 'light' ? ' active' : '') + '" data-theme="light" onclick="setTheme(\'light\')">Light</button><button class="theme-btn' + (userPrefs.theme === 'system' ? ' active' : '') + '" data-theme="system" onclick="setTheme(\'system\')">System</button></div></div><div class="settings-section"><label class="settings-label">Card Size</label><div class="settings-toggle-group"><button class="grid-btn' + (userPrefs.card_grid_size === 'compact' ? ' active' : '') + '" data-size="compact" onclick="setGridSize(\'compact\')">Compact</button><button class="grid-btn' + (userPrefs.card_grid_size === 'default' ? ' active' : '') + '" data-size="default" onclick="setGridSize(\'default\')">Default</button><button class="grid-btn' + (userPrefs.card_grid_size === 'wide' ? ' active' : '') + '" data-size="wide" onclick="setGridSize(\'wide\')">Wide</button><button class="grid-btn' + (userPrefs.card_grid_size === 'full' ? ' active' : '') + '" data-size="full" onclick="setGridSize(\'full\')">Full</button></div></div></div></div>';
  document.body.appendChild(panel);
}

function closeSettings() {
  const panel = document.getElementById('settings-panel');
  if (panel) panel.remove();
}

function setTheme(mode) {
  applyTheme(mode);
  savePref({ theme: mode });
}

function setGridSize(size) {
  applyGridSize(size);
  savePref({ card_grid_size: size });
}