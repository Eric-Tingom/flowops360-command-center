// FlowOps360 Command Center — Tier 1: Money in Motion
// Sections: revenue_pipeline, build_queue, retainer_billing, follow_ups_needed
// Each function registers as window.renderOpsSection_{section_key}

window.renderOpsSection_revenue_pipeline = function(d, constants) {
  if (!d || !d.deals || d.deals.length === 0) return '<div class="card-empty">No active deals</div>';
  let html = '';
  if (d.total) html += '<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:0.5rem">' + d.total + ' total deals</div>';
  html += '<table class="data-table"><thead><tr><th>Deal</th><th>Client</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>';
  d.deals.forEach(deal => {
    const url = deal.url || (constants.hubspot_deal_url || '').replace('{deal_id}', deal.id);
    html += '<tr><td>' + linkWrap(deal.dealname, url) + '</td>' +
      '<td>' + clientBadge(deal.client_name) + '</td>' +
      '<td>' + formatCurrency(deal.amount) + '</td>' +
      '<td>' + statusBadge(deal.invoice_status) + '</td>' +
      '<td>' + linkIcon(url) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};

window.renderOpsSection_build_queue = function(d) {
  if (!d) return '<div class="card-empty">No build queue data</div>';
  if (Array.isArray(d) && d.length === 0) return '<div class="card-empty">Build queue is empty</div>';
  if (typeof d === 'object' && !Array.isArray(d)) {
    let html = '';
    if (d.mvp_progress) {
      html += '<div class="kpi-row"><div class="kpi-metric"><div class="kpi-value">' +
        escapeHtml(d.mvp_progress) + '</div><div class="kpi-label">MVP Progress</div></div></div>';
    }
    if (d.items && d.items.length > 0) {
      html += '<table class="data-table"><thead><tr><th>Item</th><th>Status</th><th>Priority</th></tr></thead><tbody>';
      d.items.forEach(i => {
        html += '<tr><td>' + escapeHtml(i.title || i.item_key) + '</td>' +
          '<td>' + statusBadge(i.status) + '</td>' +
          '<td>' + escapeHtml(i.priority || '') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    return html || '<div class="card-empty">No build items</div>';
  }
  return '<div class="card-empty">Build queue format not recognized</div>';
};

window.renderOpsSection_retainer_billing = function(d, constants) {
  if (!d || !d.billing || d.billing.length === 0) return '<div class="card-empty">No retainer data</div>';
  let html = '<table class="data-table"><thead><tr><th>Client</th><th>Amount</th><th>Invoice</th><th>Planned</th><th>Done</th><th></th></tr></thead><tbody>';
  d.billing.forEach(b => {
    const cap = d.capped_status && d.capped_status.find(c => c.client_name === b.client_name);
    let extra = '';
    if (cap) extra = ' <span class="badge badge-warning">' + cap.hours_used + '/' + cap.included_hours_per_month + 'h | ' + cap.hours_remaining + ' remaining</span>';
    const url = b.hubspot_deal_id
      ? (constants.hubspot_deal_url || 'https://app.hubspot.com/contacts/4736045/record/0-3/{deal_id}').replace('{deal_id}', b.hubspot_deal_id)
      : '';
    html += '<tr><td>' + clientBadge(b.client_name) + extra + '</td>' +
      '<td>' + formatCurrency(b.retainer_amount) + '</td>' +
      '<td>' + statusBadge(b.invoice_status) + '</td>' +
      '<td>' + (b.total_items_planned || 0) + '</td>' +
      '<td>' + (b.total_items_completed || 0) + '</td>' +
      '<td>' + linkIcon(url) + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};

window.renderOpsSection_follow_ups_needed = function(d) {
  if (!d || (Array.isArray(d) && d.length === 0)) return '<div class="card-empty">No follow-ups needed</div>';
  let html = '<table class="data-table"><thead><tr><th>Follow-Up</th><th>Client</th><th>Urgency</th></tr></thead><tbody>';
  d.forEach(f => {
    html += '<tr><td>' + escapeHtml(f.title || f.description) + '</td>' +
      '<td>' + clientBadge(f.client_name) + '</td>' +
      '<td>' + escapeHtml(f.urgency || '') + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
};
