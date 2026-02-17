// FlowOps360 Command Center — Tier 2: Revenue Pipeline
// Sections: outreach_pending, engagement_pending, content_today,
//           content_pending_approval, content_icp_coverage, lead_pipeline

window.renderOpsSection_outreach_pending = function(d) {
  return renderOpsGenericList(d, 'No outreach pending', ['topic', 'title', 'name'], ['icp_type', 'status']);
};

window.renderOpsSection_engagement_pending = function(d) {
  return renderOpsGenericList(d, 'No engagement opportunities', ['topic', 'title', 'name'], ['icp_type', 'platform']);
};

window.renderOpsSection_content_today = function(d) {
  if (!d || d.length === 0) return '<div class="card-empty">No content scheduled today</div>';
  let html = '<table class="data-table"><thead><tr><th>Content</th><th>ICP</th><th>Type</th></tr></thead><tbody>';
  d.forEach(c => {
    html += '<tr><td>' + escapeHtml(c.topic || c.title) + '</td>' +
      '<td>' + escapeHtml(c.icp_type || '') + '</td>' +
      '<td>' + statusBadge(c.content_type) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};

window.renderOpsSection_content_pending_approval = function(d) {
  if (!d || d.length === 0) return '<div class="card-empty">No content awaiting approval</div>';
  let html = '<table class="data-table"><thead><tr><th>Topic</th><th>ICP</th><th>Type</th><th>Created</th></tr></thead><tbody>';
  d.forEach(c => {
    html += '<tr><td title="' + escapeHtml(c.preview || '') + '">' + escapeHtml(truncate(c.topic, 60)) + '</td>' +
      '<td>' + escapeHtml(c.icp_type || '') + '</td>' +
      '<td>' + statusBadge(c.content_type) + '</td>' +
      '<td>' + relativeTime(c.created_at) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};

window.renderOpsSection_content_icp_coverage = function(d) {
  if (!d || d.length === 0) return '<div class="card-empty">No ICP coverage data</div>';
  let html = '<table class="data-table"><thead><tr><th>ICP</th><th>Expected</th><th>Scheduled</th><th>Gap</th></tr></thead><tbody>';
  d.forEach(i => {
    const gapStyle = i.gap > 0 ? 'color:var(--warning);font-weight:600' : 'color:var(--success)';
    html += '<tr><td>' + escapeHtml(i.icp_type) + '</td>' +
      '<td>' + i.expected + '</td>' +
      '<td>' + i.scheduled + '</td>' +
      '<td style="' + gapStyle + '">' + (i.gap > 0 ? '\u26A0 ' + i.gap + ' missing' : '\u2713') + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};

window.renderOpsSection_lead_pipeline = function(d) {
  return renderOpsGenericList(d, 'No leads in pipeline', ['name', 'title', 'company'], ['stage', 'status', 'source']);
};

// Shared generic list renderer for simple array sections
function renderOpsGenericList(d, emptyMsg, titleKeys, detailKeys) {
  if (!d || (Array.isArray(d) && d.length === 0)) return '<div class="card-empty">' + escapeHtml(emptyMsg) + '</div>';
  let html = '<table class="data-table"><thead><tr><th>Item</th><th>Details</th></tr></thead><tbody>';
  d.forEach(item => {
    const title = pickFirst(item, titleKeys) || 'Untitled';
    const detail = pickFirst(item, detailKeys) || '';
    html += '<tr><td>' + escapeHtml(title) + '</td><td>' + escapeHtml(detail) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
}

function pickFirst(obj, keys) {
  for (const k of keys) { if (obj[k]) return obj[k]; }
  return null;
}
