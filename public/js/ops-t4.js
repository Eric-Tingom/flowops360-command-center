// FlowOps360 Command Center — Tier 4: Operational Awareness
// Sections: todays_calendar, tomorrows_calendar, email_digest, automation_errors, data_quality, alignment_check

window.renderOpsSection_todays_calendar = function(d) { return renderCalendarSection(d, 'today'); };
window.renderOpsSection_tomorrows_calendar = function(d) { return renderCalendarSection(d, 'tomorrow'); };

function renderCalendarSection(d, label) {
  if (!d || d.length === 0) return '<div class="card-empty">No meetings ' + label + '</div>';
  let html = '<table class="data-table"><thead><tr><th>Time</th><th>Meeting</th><th>Client</th></tr></thead><tbody>';
  d.forEach(evt => {
    const time = escapeHtml(evt.start_mst || '') + (evt.end_mst ? ' \u2013 ' + escapeHtml(evt.end_mst) : '');
    const meetingLink = evt.is_online && evt.online_meeting_url ? ' <a href="' + escapeHtml(evt.online_meeting_url) + '" target="_blank">\uD83D\uDD17</a>' : '';
    html += '<tr><td style="white-space:nowrap">' + time + '</td><td>' + escapeHtml(evt.subject) + meetingLink + '</td><td>' + clientBadge(evt.client_name) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
window.renderOpsSection_email_digest = function(d) {
  if (!d || !d.stats) return '<div class="card-empty">No email data</div>';
  const s = d.stats;
  let html = '<div class="kpi-row">';
  html += '<div class="kpi-metric"><div class="kpi-value">' + (s.total_processed || 0) + '</div><div class="kpi-label">Processed</div></div>';
  html += '<div class="kpi-metric"><div class="kpi-value">' + (s.auto_filed || 0) + '</div><div class="kpi-label">Auto-Filed</div></div>';
  html += '<div class="kpi-metric"><div class="kpi-value" style="color:' + ((s.needs_action || 0) > 0 ? 'var(--warning)' : 'var(--success)') + '">' + (s.needs_action || 0) + '</div><div class="kpi-label">Needs Action</div></div>';
  html += '<div class="kpi-metric"><div class="kpi-value">' + (d.unprocessed || 0) + '</div><div class="kpi-label">Unprocessed</div></div>';
  html += '</div>';
  if (d.standup_queue && d.standup_queue.length > 0) {
    html += '<table class="data-table" style="margin-top:0.75rem"><thead><tr><th>Subject</th><th>From</th><th>Type</th></tr></thead><tbody>';
    d.standup_queue.forEach(e => { html += '<tr><td>' + escapeHtml(e.subject) + '</td><td>' + escapeHtml(e.sender_email || e.from) + '</td><td>' + statusBadge(e.email_type || e.type) + '</td></tr>'; });
    html += '</tbody></table>';
  }
  return html;
};
window.renderOpsSection_automation_errors = function(d) {
  if (!d) return '<div class="card-empty">No automation data</div>';
  const hasErrors = d.recent_errors && d.recent_errors.length > 0;
  const hasHealth = d.email_processor_health && d.email_processor_health.length > 0;
  if (!hasErrors && !hasHealth) return '<div class="card-empty" style="color:var(--success)">\u2713 All automations healthy</div>';
  let html = '';
  if (hasErrors) {
    html += '<table class="data-table"><thead><tr><th>Error</th><th>Source</th><th>Time</th></tr></thead><tbody>';
    d.recent_errors.forEach(e => { html += '<tr><td style="color:var(--error)">' + escapeHtml(e.message || e.error) + '</td><td>' + escapeHtml(e.source || '') + '</td><td>' + relativeTime(e.created_at) + '</td></tr>'; });
    html += '</tbody></table>';
  }
  return html;
};
window.renderOpsSection_data_quality = function(d) {
  if (!d) return '<div class="card-empty">No data quality info</div>';
  const scoreColor = d.score === 'healthy' ? 'var(--success)' : d.score === 'warning' ? 'var(--warning)' : 'var(--error)';
  let html = '<div class="kpi-row">';
  html += '<div class="kpi-metric"><div class="kpi-value" style="color:' + scoreColor + '">' + escapeHtml(d.score || '\u2014') + '</div><div class="kpi-label">Score</div></div>';
  html += '<div class="kpi-metric"><div class="kpi-value">' + (d.total_open || 0) + '</div><div class="kpi-label">Open Issues</div></div>';
  html += '<div class="kpi-metric"><div class="kpi-value">' + escapeHtml(d.trend || '\u2014') + '</div><div class="kpi-label">Trend</div></div>';
  html += '</div>';
  if (d.by_severity) {
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem">';
    if (d.by_severity.critical > 0) html += '<span class="badge badge-error">Critical: ' + d.by_severity.critical + '</span>';
    if (d.by_severity.high > 0) html += '<span class="badge badge-warning">High: ' + d.by_severity.high + '</span>';
    if (d.by_severity.medium > 0) html += '<span class="badge badge-info">Medium: ' + d.by_severity.medium + '</span>';
    if (d.by_severity.low > 0) html += '<span class="badge badge-muted">Low: ' + d.by_severity.low + '</span>';
    html += '</div>';
  }
  if (d.rules_summary) html += '<div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.5rem">' + d.rules_summary.executed + ' executed, ' + d.rules_summary.failed + ' failed, ' + d.rules_summary.skipped + ' skipped</div>';
  if (d.threshold_violations && d.threshold_violations.length > 0) {
    html += '<table class="data-table" style="margin-top:0.75rem"><thead><tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Severity</th></tr></thead><tbody>';
    d.threshold_violations.forEach(v => { html += '<tr><td>' + escapeHtml(v.metric) + '</td><td>' + v.value + '</td><td>' + v.threshold + '</td><td>' + statusBadge(v.severity) + '</td></tr>'; });
    html += '</tbody></table>';
  }
  return html;
};
window.renderOpsSection_alignment_check = function(d) {
  if (!d || d.status === 'clean') return '';
  return '<div style="padding:0.5rem;border:1px solid var(--warning);border-radius:var(--radius);background:rgba(245,158,11,0.1)"><span style="color:var(--warning);font-weight:600">\u26A0 Strategic Drift Detected</span><div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem">' + escapeHtml(JSON.stringify(d.stale_references || d)) + '</div></div>';
};
