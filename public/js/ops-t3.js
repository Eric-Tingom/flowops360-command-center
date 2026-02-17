// FlowOps360 Command Center — Tier 3: Revenue Protection
// RENDERING RULE: All sections use markdown-style tables. Never bullets.
// Sections: overdue_tickets, client_health, retainer_items, now_items, stale_waiting, new_tickets

window.renderOpsSection_now_items = function(d, constants, dr) {
  if (!d || (Array.isArray(d) && d.length === 0)) return '<div class="card-empty">No active NOW items</div>';
  const items = Array.isArray(d) ? d : [d];
  const max = (dr && dr.now_items_limit) || 5;
  let html = '<table class="data-table"><thead><tr><th>#</th><th>Item</th><th>Client</th><th>Next Meeting</th></tr></thead><tbody>';
  items.slice(0, max).forEach((item, idx) => {
    html += '<tr><td>' + (idx + 1) + '</td><td>' + linkWrap(item.title || 'Untitled', item.hubspot_ticket_url) + '</td><td>' + clientBadge(item.client_name) + '</td><td>' + escapeHtml(item.next_meeting || '\u2014') + '</td></tr>';
    if (item.description) html += '<tr><td></td><td colspan="3" style="color:var(--text-dim);font-style:italic;font-size:0.75rem;padding-top:0">' + escapeHtml(truncate(item.description, 80)) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};
window.renderOpsSection_new_tickets = function(d, constants) {
  if (!d) return '<div class="card-empty">No new tickets</div>';
  const total = parseInt(d.total_new) || 0;
  const hasEric = d.erics_queue && d.erics_queue.length > 0;
  const hasClient = d.clients_court && d.clients_court.length > 0;
  if (total === 0 && !hasEric && !hasClient) return '<div class="card-empty">No new tickets in last 48h</div>';
  let html = '<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:0.5rem">' + total + ' new tickets</div>';
  if (hasEric) { html += '<div style="font-weight:600;font-size:0.8rem;margin:0.5rem 0 0.25rem">Eric\'s Queue</div>'; html += ticketSubTable(d.erics_queue.slice(0, 5)); }
  if (hasClient) { html += '<div style="font-weight:600;font-size:0.8rem;margin:0.5rem 0 0.25rem">Client\'s Court</div>'; html += ticketSubTable(d.clients_court.slice(0, 5)); }
  return html;
};
window.renderOpsSection_overdue_tickets = function(d, constants, dr) {
  if (!d || !d.by_client || d.by_client.length === 0) return '<div class="card-empty">No overdue tickets</div>';
  const maxPerClient = (dr && dr.overdue_tickets_top_per_client) || 3;
  let html = '<div class="kpi-row" style="margin-bottom:0.75rem"><div class="kpi-metric"><div class="kpi-value" style="color:var(--error)">' + (d.total_overdue || 0) + '</div><div class="kpi-label">Overdue</div></div><div class="kpi-metric"><div class="kpi-value">' + (d.total_open || 0) + '</div><div class="kpi-label">Total Open</div></div></div>';
  d.by_client.forEach(client => {
    const name = normalizeClientName(client.client_name);
    html += '<div style="font-weight:600;font-size:0.8rem;margin:0.75rem 0 0.25rem">' + escapeHtml(name) + ' <span class="badge badge-muted">' + client.count + ' overdue</span></div>';
    html += '<table class="data-table"><thead><tr><th>#</th><th>Ticket</th><th>Days Stale</th><th>Band</th></tr></thead><tbody>';
    (client.tickets || []).slice(0, maxPerClient).forEach((t, i) => {
      const bandEmoji = t.staleness_band === 'critical' ? '\uD83D\uDD34' : t.staleness_band === 'warning' ? '\uD83D\uDFE0' : '\uD83D\uDFE1';
      html += '<tr><td>' + (i + 1) + '</td><td>' + linkWrap(t.subject, t.hubspot_ticket_url) + '</td><td>' + (t.days_stale || '') + 'd</td><td>' + bandEmoji + '</td></tr>';
      if (t.description) html += '<tr><td></td><td colspan="3" style="color:var(--text-dim);font-style:italic;font-size:0.75rem;padding-top:0">' + escapeHtml(truncate(t.description, 60)) + '</td></tr>';
    });
    html += '</tbody></table>';
  });
  return html;
};
window.renderOpsSection_client_health = function(d) {
  if (!d || d.length === 0) return '<div class="card-empty">All clients healthy</div>';
  let html = '<table class="data-table"><thead><tr><th>Client</th><th>Status</th><th>Risk</th></tr></thead><tbody>';
  d.forEach(c => { html += '<tr><td>' + clientBadge(c.client_name) + '</td><td>' + statusBadge(c.health_status) + '</td><td>' + escapeHtml(c.risk_reason || '') + '</td></tr>'; });
  html += '</tbody></table>';
  return html;
};
window.renderOpsSection_retainer_items = function(d, constants) {
  if (!d || d.length === 0) return '<div class="card-empty">No retainer items this week</div>';
  let html = '<table class="data-table"><thead><tr><th>#</th><th>Deliverable</th><th>Owner</th><th>Due</th><th>Trello</th><th>HubSpot</th></tr></thead><tbody>';
  d.forEach((item, i) => {
    const trelloHtml = item.trello_card ? '<a href="' + escapeHtml(item.trello_card.card_url) + '" target="_blank" rel="noopener">' + escapeHtml(item.trello_card.list_name) + '</a>' : '\u2014';
    html += '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(item.activity_name) + '</td><td>' + escapeHtml(item.owner || '') + '</td><td>' + formatDate(item.scheduled_date) + '</td><td>' + trelloHtml + '</td><td>' + linkIcon(item.hubspot_ticket_url) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};
window.renderOpsSection_stale_waiting = function(d, constants) {
  if (!d || d.length === 0) return '<div class="card-empty">Nothing stale or waiting</div>';
  let html = '<table class="data-table"><thead><tr><th>Item</th><th>Client</th><th>Status</th><th>Age</th></tr></thead><tbody>';
  d.forEach(item => {
    const url = item.hubspot_ticket_url || item.source_url || '';
    const days = item.days_stale || daysAgo(item.last_modified);
    html += '<tr><td>' + linkWrap(item.title || item.subject, url) + '</td><td>' + clientBadge(item.client_name) + '</td><td>' + statusBadge(item.status) + '</td><td>' + staleBadge(days) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};
function ticketSubTable(tickets) {
  let html = '<table class="data-table"><thead><tr><th>#</th><th>Ticket</th><th>Client</th><th>Created</th></tr></thead><tbody>';
  tickets.forEach((t, i) => { html += '<tr><td>' + (i + 1) + '</td><td>' + linkWrap(t.subject, t.hubspot_ticket_url) + '</td><td>' + clientBadge(t.client_name) + '</td><td>' + relativeTime(t.created_at) + '</td></tr>'; });
  html += '</tbody></table>';
  return html;
}
