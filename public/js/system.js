// FlowOps360 Command Center — System Tab
// Sub-tabs: Cron Jobs, HTTP Log, Agent Registry, Brains, Configuration

function loadSystem(container) {
  var subNav = document.createElement('div');
  subNav.className = 'sub-tabs';
  var tabs = [
    { id: 'sys-cron', label: 'Cron Jobs', loader: loadCronJobs },
    { id: 'sys-http', label: 'HTTP Log', loader: loadHttpLog },
    { id: 'sys-agents', label: 'Agent Registry', loader: loadAgentRegistry },
    { id: 'sys-brains', label: 'Brains', loader: null },
    { id: 'sys-config', label: 'Configuration', loader: null }
  ];

  var contentDiv = document.createElement('div');
  contentDiv.className = 'sub-content';
  contentDiv.id = 'sys-content';

  var activeSubTab = 'sys-cron';

  function renderSubTabs() {
    subNav.innerHTML = '';
    tabs.forEach(function(t) {
      var tab = document.createElement('div');
      tab.className = 'sub-tab' + (t.id === activeSubTab ? ' active' : '');
      tab.textContent = t.label;
      tab.onclick = function() {
        activeSubTab = t.id;
        renderSubTabs();
        contentDiv.innerHTML = '';
        if (t.loader) t.loader(contentDiv);
        else contentDiv.innerHTML = '<div class="placeholder-pillar"><h2>' + escapeHtml(t.label) + '</h2><p>Coming in Phase 2</p></div>';
      };
      subNav.appendChild(tab);
    });
  }

  renderSubTabs();
  container.appendChild(subNav);
  container.appendChild(contentDiv);
  loadCronJobs(contentDiv);
}

// Cron Jobs
async function loadCronJobs(container) {
  container.innerHTML = '<div style="padding:1rem"><div class="shimmer" style="width:80%"></div><div class="shimmer" style="width:60%"></div></div>';
  try {
    var res = await sb.rpc('get_cron_job_status');
    if (res.error) throw res.error;
    var jobs = res.data || [];
    var showActiveOnly = true;

    function render() {
      var filtered = showActiveOnly ? jobs.filter(function(j) { return j.active; }) : jobs;
      var html = '<div class="filter-bar"><label class="toggle-wrap"><input type="checkbox" '
        + (showActiveOnly ? 'checked' : '')
        + ' onchange="window._cronToggle(this.checked)"> Active only</label></div>';
      html += '<table class="data-table"><thead><tr>'
        + '<th>Job Name</th><th>Schedule</th><th>Status</th><th>Command</th>'
        + '</tr></thead><tbody>';
      if (filtered.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:1rem">No cron jobs found</td></tr>';
      } else {
        filtered.forEach(function(j) {
          var statusHtml = j.active
            ? '<span class="badge badge-success">active</span>'
            : '<span class="badge badge-muted">inactive</span>';
          var cmdShort = (j.command || '').length > 80 ? j.command.substring(0, 80) + '\u2026' : (j.command || '\u2014');
          html += '<tr><td><strong>' + escapeHtml(j.jobname) + '</strong></td>'
            + '<td><code style="font-size:0.75rem;color:var(--accent)">' + escapeHtml(j.schedule) + '</code></td>'
            + '<td>' + statusHtml + '</td>'
            + '<td class="truncate" style="max-width:300px" title="' + escapeHtml(j.command) + '">' + escapeHtml(cmdShort) + '</td></tr>';
        });
      }
      html += '</tbody></table>';
      container.innerHTML = html;
    }

    window._cronToggle = function(checked) { showActiveOnly = checked; render(); };
    render();
  } catch (e) {
    container.innerHTML = '<div class="card-error"><p>' + escapeHtml(e.message || 'Failed to load cron jobs') + '</p>'
      + '<button class="btn-retry" onclick="loadCronJobs(document.getElementById(\'sys-content\'))">Retry</button></div>';
  }
}

// HTTP Log
async function loadHttpLog(container) {
  container.innerHTML = '<div style="padding:1rem"><div class="shimmer" style="width:80%"></div><div class="shimmer" style="width:60%"></div></div>';
  try {
    var res = await sb.rpc('get_cron_http_responses', { p_limit: 50 });
    if (res.error) throw res.error;
    var rows = res.data || [];
    var html = '<table class="data-table"><thead><tr>'
      + '<th>ID</th><th>Status</th><th>Timed Out</th><th>Error</th><th>Created</th>'
      + '</tr></thead><tbody>';
    if (rows.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1rem">No HTTP responses found</td></tr>';
    } else {
      rows.forEach(function(r) {
        var statusCls = r.status_code >= 200 && r.status_code < 300 ? 'badge-success'
          : r.status_code >= 400 ? 'badge-error' : 'badge-warning';
        html += '<tr>'
          + '<td>' + r.id + '</td>'
          + '<td><span class="badge ' + statusCls + '">' + (r.status_code || '\u2014') + '</span></td>'
          + '<td>' + (r.timed_out ? '<span class="badge badge-error">yes</span>' : '<span class="badge badge-muted">no</span>') + '</td>'
          + '<td class="truncate" style="max-width:250px">' + escapeHtml(r.error_msg || '\u2014') + '</td>'
          + '<td>' + relativeTime(r.created) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div class="card-error"><p>' + escapeHtml(e.message || 'Failed to load HTTP log') + '</p>'
      + '<button class="btn-retry" onclick="loadHttpLog(document.getElementById(\'sys-content\'))">Retry</button></div>';
  }
}

// Agent Registry
async function loadAgentRegistry(container) {
  container.innerHTML = '<div style="padding:1rem"><div class="shimmer" style="width:80%"></div><div class="shimmer" style="width:60%"></div></div>';
  try {
    var res = await sb.rpc('get_agent_health_report');
    if (res.error) throw res.error;
    var report = res.data || {};
    var agents = report.agents || [];
    var showAll = false;
    var filterText = '';

    function render() {
      var filtered = agents;
      if (!showAll) filtered = filtered.filter(function(a) { return a.status === 'active'; });
      if (filterText) {
        var q = filterText.toLowerCase();
        filtered = filtered.filter(function(a) {
          return (a.agent_name || '').toLowerCase().indexOf(q) >= 0
            || (a.category || '').toLowerCase().indexOf(q) >= 0
            || (a.scope || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      var html = '<div class="filter-bar">'
        + '<input type="text" placeholder="Search agents..." value="' + escapeHtml(filterText) + '" onkeyup="window._agentFilter(this.value)">'
        + '<label class="toggle-wrap"><input type="checkbox" ' + (showAll ? 'checked' : '') + ' onchange="window._agentShowAll(this.checked)"> Show inactive</label>'
        + '</div>';
      var activeCount = agents.filter(function(a) { return a.status === 'active'; }).length;
      html += '<div class="kpi-row" style="margin-bottom:1rem">'
        + '<div class="kpi-metric"><div class="kpi-value" style="color:var(--success)">' + activeCount + '</div><div class="kpi-label">Active</div></div>'
        + '<div class="kpi-metric"><div class="kpi-value">' + agents.length + '</div><div class="kpi-label">Total</div></div>'
        + '</div>';
      html += '<table class="data-table"><thead><tr>'
        + '<th>Agent</th><th>Category</th><th>Scope</th><th>Status</th><th>Model</th>'
        + '</tr></thead><tbody>';
      if (filtered.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1rem">No agents found</td></tr>';
      } else {
        filtered.forEach(function(a) {
          var sBadge = a.status === 'active' ? '<span class="badge badge-success">active</span>'
            : a.status === 'inactive' ? '<span class="badge badge-muted">inactive</span>'
            : statusBadge(a.status);
          html += '<tr>'
            + '<td><strong>' + escapeHtml(a.agent_name || '\u2014') + '</strong></td>'
            + '<td><span class="badge badge-info">' + escapeHtml(a.category || '\u2014') + '</span></td>'
            + '<td>' + escapeHtml(a.scope || '\u2014') + '</td>'
            + '<td>' + sBadge + '</td>'
            + '<td style="font-size:0.75rem;color:var(--text-muted)">' + escapeHtml(a.operating_model || '\u2014') + '</td>'
            + '</tr>';
        });
      }
      html += '</tbody></table>';
      container.innerHTML = html;
    }

    window._agentFilter = function(val) { filterText = val; render(); };
    window._agentShowAll = function(checked) { showAll = checked; render(); };
    render();
  } catch (e) {
    container.innerHTML = '<div class="card-error"><p>' + escapeHtml(e.message || 'Failed to load agent registry') + '</p>'
      + '<button class="btn-retry" onclick="loadAgentRegistry(document.getElementById(\'sys-content\'))">Retry</button></div>';
  }
}