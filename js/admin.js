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
    $('tabTeam').classList.toggle('hidden', t.dataset.tab !== 'team');
    $('tabRoles').classList.toggle('hidden', t.dataset.tab !== 'roles');
    $('tabInfo').classList.toggle('hidden', t.dataset.tab !== 'info');
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

  /* ── Team & Careers management ───────────────────────── */
  const safePhoto = (p) => (/^assets\/images\/[\w\-\/.]+\.(jpe?g|png|webp)$/i.test(p || '') ? p : '');
  const PERSON_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const state = { team: [], roles: [] };

  async function loadTeam() {
    const { rows } = await api('/api/admin/team'); state.team = rows;
    $('teamBody').innerHTML = rows.length ? rows.map((r) => `<tr data-id="${r.id}">
      <td>${safePhoto(r.photo) ? `<img class="thumb" src="${esc(safePhoto(r.photo))}" alt="" />` : `<div class="thumb no-photo">${PERSON_ICON}</div>`}</td>
      <td><b>${esc(r.name)}</b><br><small>${esc(r.bio).slice(0, 80)}</small></td><td>${esc(r.role)}</td><td>${r.sort_order}</td>
      <td><span class="pill ${r.active ? 'on' : 'off'}">${r.active ? 'Visible' : 'Hidden'}</span></td>
      <td><button class="small-btn" data-act="edit">Edit</button><button class="small-btn del" data-act="del">Delete</button></td></tr>`).join('')
      : '<tr><td colspan="6" class="empty">No team members yet.</td></tr>';
  }
  async function loadRoles() {
    const { rows } = await api('/api/admin/roles'); state.roles = rows;
    $('roleBody').innerHTML = rows.length ? rows.map((r) => `<tr data-id="${r.id}">
      <td><b>${esc(r.title)}</b><br><small>${esc(r.description).slice(0, 80)}</small></td><td>${esc(r.department)}</td><td>${esc(r.location)}</td><td>${esc(r.type)}</td><td>${r.sort_order}</td>
      <td><span class="pill ${r.active ? 'on' : 'off'}">${r.active ? 'Open' : 'Closed'}</span></td>
      <td><button class="small-btn" data-act="edit">Edit</button><button class="small-btn del" data-act="del">Delete</button></td></tr>`).join('')
      : '<tr><td colspan="7" class="empty">No roles yet.</td></tr>';
  }

  function setupCrud(kind, dlgId, formId, errId, titleId, label, endpoint, reload, bodyId) {
    const dlg = $(dlgId), form = $(formId); let editId = null;
    const open = (row) => {
      editId = row ? row.id : null; $(errId).textContent = ''; form.reset();
      $(titleId).textContent = (row ? 'Edit ' : 'Add ') + label;
      const defaults = { sort_order: state[kind].length, active: 1 };
      Array.from(form.elements).forEach((el) => {
        if (!el.name) return;
        const v = row ? row[el.name] : defaults[el.name];
        if (el.type === 'checkbox') el.checked = row ? !!v : true;
        else if (v !== undefined && v !== null) el.value = v;
      });
      if (kind === 'team') {
        const p = safePhoto(form.elements.photo.value);
        $('teamPreview').classList.toggle('hidden', !p);
        if (p) $('teamPreview').src = p;
        $('teamNoPhoto').classList.toggle('hidden', !!p);
        $('removePhotoBtn').classList.toggle('hidden', !p);
        $('teamFile').value = '';
      }
      dlg.showModal();
    };
    document.querySelector(`[data-new="${kind}"]`).addEventListener('click', () => open(null));
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    $(bodyId).addEventListener('click', async (e) => {
      const act = e.target.dataset.act; if (!act) return;
      const id = +e.target.closest('tr').dataset.id;
      if (act === 'edit') open(state[kind].find((r) => r.id === id));
      if (act === 'del' && confirm('Delete this entry permanently?')) { await api(`${endpoint}/${id}`, { method: 'DELETE' }); reload(); }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); $(errId).textContent = '';
      const body = {}; Array.from(form.elements).forEach((el) => { if (el.name) body[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
      try {
        await api(editId ? `${endpoint}/${editId}` : endpoint, { method: editId ? 'PUT' : 'POST', body: JSON.stringify(body) });
        dlg.close(); reload();
      } catch (err) { $(errId).textContent = err.message; }
    });
  }
  setupCrud('team', 'teamDlg', 'teamForm', 'teamErr', 'teamTitle', 'team member', '/api/admin/team', loadTeam, 'teamBody');
  setupCrud('roles', 'roleDlg', 'roleForm', 'roleErr', 'roleTitle', 'career role', '/api/admin/roles', loadRoles, 'roleBody');

  $('teamFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return; $('teamErr').textContent = '';
    if (f.size > 3 * 1024 * 1024) { $('teamErr').textContent = 'Image is larger than 3 MB.'; return; }
    try {
      const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': f.type }, body: f });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      $('teamPhotoInput').value = d.path;
      $('teamPreview').src = d.path;
      $('teamPreview').classList.remove('hidden');
      $('teamNoPhoto').classList.add('hidden');
      $('removePhotoBtn').classList.remove('hidden');
    } catch (err) { $('teamErr').textContent = err.message; }
  });

  $('removePhotoBtn').addEventListener('click', () => {
    $('teamPhotoInput').value = '';
    $('teamFile').value = '';
    $('teamPreview').classList.add('hidden');
    $('teamPreview').src = '';
    $('teamNoPhoto').classList.remove('hidden');
    $('removePhotoBtn').classList.add('hidden');
  });

  /* ── Company Info management ─────────────────────────── */
  async function loadInfo() {
    try {
      const { info } = await api('/api/admin/info');
      if (!info) return;
      const form = $('infoForm');
      ['company_name', 'email', 'phone', 'address', 'presence', 'hours', 'tagline', 'facebook_url'].forEach((k) => {
        if (form.elements[k]) form.elements[k].value = info[k] || '';
      });
    } catch (_) {}
  }

  $('infoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('infoErr').textContent = '';
    $('infoSuccess').classList.add('hidden');
    const form = $('infoForm');
    const body = {};
    Array.from(form.elements).forEach((el) => {
      if (el.name) body[el.name] = el.value.trim();
    });
    try {
      const { info } = await api('/api/admin/info', { method: 'PUT', body: JSON.stringify(body) });
      if (info) {
        ['company_name', 'email', 'phone', 'address', 'presence', 'hours', 'tagline', 'facebook_url'].forEach((k) => {
          if (form.elements[k]) form.elements[k].value = info[k] || '';
        });
      }
      $('infoSuccess').classList.remove('hidden');
      setTimeout(() => $('infoSuccess').classList.add('hidden'), 4000);
    } catch (err) {
      $('infoErr').textContent = err.message;
    }
  });

  async function boot() {
    try {
      const me = await api('/api/admin/me');
      $('meEmail').textContent = me.email; show(true);
      await Promise.all([loadSummary(), loadInquiries(), loadSubs(), loadTeam(), loadRoles(), loadInfo()]);
    } catch (err) { show(false); }
  }
  boot();
})();
