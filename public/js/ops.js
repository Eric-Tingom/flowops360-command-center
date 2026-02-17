// FlowOps360 Command Center — Operations Pillar Orchestrator
// Single RPC call -> accordion tiers -> dispatches to ops-t{1-4}.js renderers
// Architecture: ops.js never renders section content — tier modules do that
// Convention: each tier module registers window.renderOpsSection_{section_key}

function loadOperations(container) {
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.id = 'ops-pillar';
  wrap.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-dim)"><div class="shimmer" style="width:60%;margin:0 auto 0.5rem"></div><div class="shimmer" style="width:40%;margin:0 auto 0.5rem"></div><div class="shimmer" style="width:50%;margin:0 auto"></div></div>';
  container.appendChild(wrap);
  fetchStandupBriefing(wrap);
}

async function fetchStandupBriefing(wrap) {
  try {
    const { data, error } = await sb.rpc('get_standup_briefing_safe');
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    if (data.fatal) { wrap.innerHTML = '<div class="card-error"><p>Standup RPC fatal: ' + escapeHtml(data.error || 'Unknown') + '</p></div>'; return; }
    window._opsData = data;
    renderOpsPillar(wrap, data);
  } catch (e) {
    console.error('[Ops] get_standup_briefing_safe failed:', e);
    wrap.innerHTML = '<div class="card-error"><p>Failed to load operations: ' + escapeHtml(e.message) + '</p><button class="btn-retry" onclick="loadOperations(document.getElementById(\'pillar-content\'))">Retry</button></div>';
  }
}

function renderOpsPillar(wrap, data) {
  const sc = data.section_config || [];
  const rc = data.rendering_templates?.standup_briefing?.rendering_config || {};
  const dr = rc.display_rules || {};
  const sd = buildSectionDataMap(data);
  const tierEmoji = { 1: '\uD83D\uDCB0', 2: '\uD83C\uDFAF', 3: '\uD83D\uDEE1\uFE0F', 4: '\uD83D\uDCCB' };
  const tierMap = {};
  sc.forEach(s => { if (!tierMap[s.tier]) tierMap[s.tier] = { tier: s.tier, label: s.tier_label, sections: [] }; tierMap[s.tier].sections.push(s); });
  const tiers = Object.values(tierMap).sort((a, b) => a.tier - b.tier);
  let html = '';
  if (data.generated_at) {
    const gen = new Date(data.generated_at);
    html += '<div style="padding:0.75rem 1.5rem;font-size:0.75rem;color:var(--text-dim);display:flex;justify-content:space-between;align-items:center"><span>Operations Briefing \u2014 ' + escapeHtml(data.day_of_week || '') + ', ' + formatDate(data.date) + '</span><span>Last refreshed: ' + gen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Phoenix' }) + ' MST</span></div>';
  }
  if (data.carry_forward && data.carry_forward.length > 0) html += renderCarryForward(data.carry_forward);
  tiers.forEach(t => {
    const nonEmpty = t.sections.filter(s => !isSectionEmpty(s.section_key, sd)).length;
    const emoji = tierEmoji[t.tier] || '\uD83D\uDCCB';
    const tierLabel = (rc.tiers && rc.tiers.find(rt => rt.tier === t.tier)?.label) || t.label;
    const isExpanded = nonEmpty > 0;
    const tierId = 'tier-' + t.tier;
    html += '<div class="ops-tier" id="' + tierId + '">';
    html += '<div class="ops-tier-header" onclick="toggleTier(\'' + tierId + '\')" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.5rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);margin:0.5rem 1.5rem">';
    html += '<span style="font-weight:600;font-size:0.9rem">' + emoji + ' TIER ' + t.tier + ': ' + escapeHtml(tierLabel).toUpperCase() + '</span>';
    html += '<span style="display:flex;align-items:center;gap:0.75rem">';
    html += nonEmpty > 0 ? '<span class="badge badge-info">' + nonEmpty + ' active</span>' : '<span class="badge badge-muted">all clear</span>';
    html += '<span class="tier-chevron" style="transition:transform 0.2s;display:inline-block;' + (isExpanded ? '' : 'transform:rotate(-90deg)') + '">\u25BC</span>';
    html += '</span></div>';
    html += '<div class="ops-tier-body" style="' + (isExpanded ? '' : 'display:none') + '">';
    t.sections.forEach(s => {
      if (s.skip_if_empty && isSectionEmpty(s.section_key, sd)) return;
      const renderer = window['renderOpsSection_' + s.section_key];
      if (typeof renderer === 'function') { const inner = renderer(sd[s.section_key], data.constants || {}, dr); if (inner) html += opsSection(s.display_label, inner); }
      else console.warn('[Ops] No renderer found for:', s.section_key);
    });
    html += '</div></div>';
  });
  wrap.innerHTML = html;
}
function toggleTier(tierId) {
  const el = document.getElementById(tierId); if (!el) return;
  const body = el.querySelector('.ops-tier-body'); const chevron = el.querySelector('.tier-chevron'); if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  if (chevron) chevron.style.transform = hidden ? '' : 'rotate(-90deg)';
}
function buildSectionDataMap(data) {
  const t1 = data.tier1_money_in_motion || {}, t2 = data.tier2_revenue_pipeline || {}, t3 = data.tier3_revenue_protection || {}, t4 = data.tier4_operational || {};
  return { revenue_pipeline: t1.revenue_pipeline, build_queue: t1.build_queue, retainer_billing: t1.retainer_billing, follow_ups_needed: t1.follow_ups, outreach_pending: t2.outreach_pending, engagement_pending: t2.engagement_pending, content_today: t2.content_today, content_pending_approval: t2.content_pending_approval, content_icp_coverage: t2.icp_coverage, lead_pipeline: t2.lead_pipeline, overdue_tickets: t3.overdue_tickets, client_health: t3.client_health, retainer_items: t3.retainer_items, now_items: t3.now_items, stale_waiting: t3.stale_waiting, new_tickets: t3.new_tickets, todays_calendar: t4.todays_calendar, tomorrows_calendar: t4.tomorrows_calendar, email_digest: t4.email_digest, automation_errors: t4.automation_errors, data_quality: t4.data_quality, alignment_check: t4.alignment_check };
}
function isSectionEmpty(key, sd) {
  const d = sd[key]; if (d == null) return true;
  if (Array.isArray(d)) return d.length === 0;
  if (typeof d === 'object') {
    if (key === 'overdue_tickets') return !d.by_client || d.by_client.length === 0;
    if (key === 'new_tickets') return (!d.erics_queue || d.erics_queue.length === 0) && (!d.clients_court || d.clients_court.length === 0);
    if (key === 'retainer_billing') return !d.billing || d.billing.length === 0;
    if (key === 'email_digest') return !d.stats;
    if (key === 'data_quality') return false;
    if (key === 'automation_errors') return (!d.recent_errors || d.recent_errors.length === 0) && (!d.email_processor_health || d.email_processor_health.length === 0);
    if (key === 'alignment_check') return d.status === 'clean';
    if (key === 'build_queue') return false;
    if (key === 'revenue_pipeline') return !d.deals || d.deals.length === 0;
    const vals = Object.values(d); return vals.every(v => v == null || (Array.isArray(v) && v.length === 0) || v === '0' || v === 0);
  }
  return !d;
}
function renderCarryForward(items) {
  let html = '<table class="data-table"><thead><tr><th>Item</th><th>Type</th><th>Priority</th></tr></thead><tbody>';
  items.forEach(i => { html += '<tr><td>' + escapeHtml(i.title || i.detail || i.note) + '</td><td>' + statusBadge(i.note_type || i.type) + '</td><td>' + statusBadge(i.priority) + '</td></tr>'; });
  html += '</tbody></table>';
  return opsSection('\uD83D\uDCCC Carry Forward', html);
}
