// FlowOps360 Command Center — Preferences
// Handles saved user preferences (card density, theme, etc.)
// Lightweight shim — settings panel UI is in auth.js

var PREF_KEYS = {
  CARD_WIDTH: 'fo360-card-width',
  THEME: 'fo360-theme'
};

function getPref(key, defaultVal) {
  try { var v = localStorage.getItem(key); return v !== null ? v : defaultVal; }
  catch (e) { return defaultVal; }
}

function setPref(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}