(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const api = async (url, opts = {}) => {
    const r = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Request failed'); e.status = r.status; throw e; }
    return data;
  };

  const show = (authed) => { $('loginView').classList.toggle('hidden', authed); $('appView').classList.toggle('hidden', !authed); };

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); $('loginErr').textContent = '';
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: $('lEmail').value, password: $('lPass').value }) });
      $('lPass').value = ''; boot();
    } catch (err) { $('loginErr').textContent = err.message; }
  });
  $('logoutBtn').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST', body: '{}' }); show(false); });

  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
    $('tabInq').classList.toggle('hidden', t.dataset.tab !== 'inq');
    $('tabSubs').classList.toggle('hidden', t.dataset.tab !== 'subs');
  }));

  async function loadSummary() {
    const s = await api('/api/admin/summary');
    const k = [['New inquiries', s.newInquiries], ['Total inquiries', s.inquiries], ['Last 7 days', s.last7], ['Estimator quotes', s.quotes], ['Subscribers', s.subscribers]];
    $('kpis').innerHTML = k.map(([l, v]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  async function loadInquiries() {
    const p = new URLSearchParams({ q: $('search').value, status: $('statusFilter').value });
    const { rows } = await api('/api/admin/inquiries?' + p);
    $('inqBody').innerHTML = rows.length ? rows.map((r) => `
      <tr data-id="${r.id}">
        <td>${esc(r.created_at)}<br><small>${esc(r.source)}</small></td>
        <td><b>${esc(r.name)}</b><br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a>${r.company ? `<br><small>${esc(r.company)}</small>` : ''}</td>
        <td><small>${esc([r.service, r.budget, r.timeline].filter(Boolean).join(' · '))}${r.nda ? ' · NDA' : ''}</small><div class="msg">${esc(r.message)}</div></td>
        <td><span class="pill ${esc(r.status)}">${esc(r.status.replace('_', ' '))}</span></td>
        <td><div class="row-actions">
          <select data-act="status">${['new', 'in_progress', 'closed'].map((s) => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}</select>
          <button data-act="del">Delete</button></div></td>
      </tr>`).join('') : '<tr><td colspan="5" class="empty">No inquiries yet.</td></tr>';
  }

  async function loadSubs() {
    const { rows } = await api('/api/admin/subscribers');
    $('subBody').innerHTML = rows.length ? rows.map((r) => `<tr><td>${esc(r.email)}</td><td>${esc(r.created_at)}</td></tr>`).join('') : '<tr><td colspan="2" class="empty">No subscribers yet.</td></tr>';
  }

  $('inqBody').addEventListener('change', async (e) => {
    if (e.target.dataset.act !== 'status') return;
    await api('/api/admin/inquiries/' + e.target.closest('tr').dataset.id, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) });
    loadInquiries(); loadSummary();
  });
  $('inqBody').addEventListener('click', async (e) => {
    if (e.target.dataset.act !== 'del') return;
    if (!confirm('Delete this inquiry permanently?')) return;
    await api('/api/admin/inquiries/' + e.target.closest('tr').dataset.id, { method: 'DELETE' });
    loadInquiries(); loadSummary();
  });
  let t; $('search').addEventListener('input', () => { clearTimeout(t); t = setTimeout(loadInquiries, 250); });
  $('statusFilter').addEventListener('change', loadInquiries);

  async function boot() {
    try {
      const me = await api('/api/admin/me');
      $('meEmail').textContent = me.email; show(true);
      await Promise.all([loadSummary(), loadInquiries(), loadSubs()]);
    } catch (err) { show(false); }
  }
  boot();
})();
