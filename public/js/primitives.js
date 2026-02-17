/**
 * primitives.js — Shared utilities for FlowOps360 Command Center
 */

function showToast(message, type) {
  type = type || 'success';
  var el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return '\u2014';
  var dt = new Date(d);
  if (isNaN(dt)) return '\u2014';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d) {
  if (!d) return '\u2014';
  var dt = new Date(d);
  if (isNaN(dt)) return '\u2014';
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Phoenix' });
}

function formatCurrency(n) {
  if (n == null) return '\u2014';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function daysAgo(d) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function staleBadge(days) {
  if (days == null) return '';
  if (days > 90) return '<span class="badge badge-error">' + days + 'd</span>';
  if (days > 30) return '<span class="badge badge-warning">' + days + 'd</span>';
  if (days > 14) return '<span class="badge badge-info">' + days + 'd</span>';
  return '<span class="badge badge-muted">' + days + 'd</span>';
}

function statusBadge(status) {
  var map = {
    now:'badge-error', in_review:'badge-warning', next:'badge-info',
    'new':'badge-muted', waiting:'badge-warning', in_queue:'badge-info',
    pending:'badge-warning', healthy:'badge-success', critical:'badge-error',
    stale:'badge-warning', warning:'badge-warning'
  };
  var cls = map[status] || 'badge-muted';
  return '<span class="badge ' + cls + '">' + escapeHtml(status || '\u2014') + '</span>';
}

function clientBadge(name) {
  if (!name) return '<span class="badge badge-muted">Unknown</span>';
  return '<span class="badge badge-info">' + escapeHtml(name) + '</span>';
}

function linkIcon(url) {
  if (!url) return '';
  return ' <a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">&#8599;</a>';
}

function shimmerBlock() {
  return '<div class="shimmer" style="width:80%"></div><div class="shimmer" style="width:60%"></div><div class="shimmer" style="width:70%"></div>';
}

function emptyMsg(msg) {
  return '<div class="card-empty">' + escapeHtml(msg || 'No data') + '</div>';
}

function errorMsg(msg) {
  return '<div class="card-error"><p>' + escapeHtml(msg) + '</p></div>';
}

function simpleTable(headers, rows) {
  if (!rows || rows.length === 0) return '';
  var h = '<table class="data-table"><thead><tr>';
  headers.forEach(function(hdr) { h += '<th>' + escapeHtml(hdr) + '</th>'; });
  h += '</tr></thead><tbody>';
  rows.forEach(function(r) {
    h += '<tr>';
    r.forEach(function(cell) { h += '<td>' + cell + '</td>'; });
    h += '</tr>';
  });
  h += '</tbody></table>';
  return h;
}

function kpiRow(metrics) {
  var h = '<div class="kpi-row">';
  metrics.forEach(function(m) {
    h += '<div class="kpi-metric"><div class="kpi-value"' +
      (m.color ? ' style="color:var(--' + m.color + ')"' : '') + '>' +
      escapeHtml(String(m.value)) + '</div><div class="kpi-label">' +
      escapeHtml(m.label) + '</div></div>';
  });
  h += '</div>';
  return h;
}
