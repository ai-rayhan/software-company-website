/* ShopSync — API wiring, forms, and motion enhancements */
(function () {
  'use strict';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── API helper + toast ───────────────────────────────── */
  async function post(url, body) {
    let res, data = {};
    try {
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      data = await res.json().catch(() => ({}));
    } catch { throw new Error('Network error. Please check your connection and try again.'); }
    if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }
  let toastEl, toastT;
  function toast(msg, isErr) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.toggle('err', !!isErr);
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 5000);
  }
  const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  /* ── Contact form (index + contact page) ──────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    const btn = form.querySelector('.form-submit');
    const idleHTML = btn.innerHTML;
    const status = document.createElement('div'); status.className = 'form-status'; status.setAttribute('aria-live', 'polite');
    form.appendChild(status);
    const val = (n) => { const el = form.elements[n]; return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      $$('.invalid', form).forEach((el) => el.classList.remove('invalid'));

      const name = val('name') || [val('first'), val('last')].filter(Boolean).join(' ');
      const email = val('email'), message = val('message');
      const bad = [];
      if (name.length < 2) bad.push(form.elements.name || form.elements.first);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push(form.elements.email);
      if (message.length < 10) bad.push(form.elements.message);
      if (bad.length) {
        bad.forEach((el) => el && el.classList.add('invalid'));
        status.textContent = 'Please complete the highlighted fields (message needs at least 10 characters).';
        status.classList.add('err'); bad[0] && bad[0].focus(); return;
      }

      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const res = await post('/api/contact', {
          name, email, message, company: val('company'), service: val('service'),
          budget: val('budget'), timeline: val('timeline'), nda: val('nda'), website: val('website'),
          source: location.pathname.includes('contact') ? 'contact-page' : 'home',
        });
        status.textContent = res.message; status.classList.add('ok');
        form.reset(); btn.innerHTML = 'Message Sent! ' + ICON_CHECK; toast(res.message);
      } catch (err) {
        status.textContent = err.message; status.classList.add('err'); toast(err.message, true);
        btn.innerHTML = idleHTML; btn.disabled = false; return;
      }
      setTimeout(() => { btn.innerHTML = idleHTML; btn.disabled = false; if (window.lucide) window.lucide.createIcons(); }, 3500);
    });
    form.addEventListener('input', (e) => e.target.classList.remove('invalid'));
  }

  /* ── Estimator → saved quote ──────────────────────────── */
  const est = document.getElementById('projectEstimator');
  if (est) {
    const cta = est.querySelector('.est-summary-box a.btn');
    const box = est.querySelector('.est-summary-box');
    const lock = document.createElement('form');
    lock.className = 'est-lock'; lock.style.flexBasis = '100%';
    lock.innerHTML = '<input name="name" placeholder="Your name" required autocomplete="name"><input name="email" type="email" placeholder="Work email" required autocomplete="email"><button class="btn btn-primary" type="submit">Save my estimate</button>';
    box.appendChild(lock);
    if (cta) cta.addEventListener('click', (e) => { e.preventDefault(); lock.classList.toggle('open'); lock.elements.name.focus(); });
    lock.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selections = $$('.est-chip.selected', est).map((c) => ({
        label: c.textContent.trim().replace(/\s+/g, ' '), group: c.dataset.group,
        pmin: +c.dataset.pmin || 0, pmax: +c.dataset.pmax || 0, wmin: +c.dataset.wmin || 0, wmax: +c.dataset.wmax || 0,
      }));
      const b = lock.querySelector('button'); b.disabled = true; b.textContent = 'Saving…';
      try {
        const r = await post('/api/quote', { name: lock.elements.name.value, email: lock.elements.email.value, selections });
        toast(r.message); lock.reset(); lock.classList.remove('open');
      } catch (err) { toast(err.message, true); }
      b.disabled = false; b.textContent = 'Save my estimate';
    });
  }

  /* ── Newsletter (injected in every footer) ────────────── */
  const brand = document.querySelector('.footer-brand');
  if (brand) {
    const wrap = document.createElement('div');
    wrap.innerHTML = '<span class="nl-title">Newsletter</span><form class="newsletter"><input type="email" name="email" placeholder="you@company.com" aria-label="Email address" required autocomplete="email"><button type="submit">Join</button></form>';
    brand.appendChild(wrap);
    wrap.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target, b = f.querySelector('button'); b.disabled = true;
      try { const r = await post('/api/newsletter', { email: f.elements.email.value }); toast(r.message); f.reset(); }
      catch (err) { toast(err.message, true); }
      b.disabled = false;
    });
  }

  /* ── Goal tabs + play/pause ───────────────────────────── */
  const tabs = $$('.goal-tab');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    $$('.goal-panel').forEach((p) => p.classList.toggle('active', p.id === 'goal-' + t.dataset.goal));
  }));
  $$('[data-play]').forEach((b) => b.addEventListener('click', () => {
    const demo = b.closest('.goal-panel').querySelector('.demo');
    const paused = demo.classList.toggle('paused');
    b.querySelector('span').textContent = paused ? 'Play animation' : 'Pause animation';
    b.querySelector('svg,i').setAttribute('data-lucide', paused ? 'play' : 'pause');
    if (window.lucide) window.lucide.createIcons();
  }));

  /* ── FAQ expand/collapse all ──────────────────────────── */
  const faqList = document.querySelector('.faq-list');
  if (faqList) {
    const tools = document.createElement('div'); tools.className = 'faq-tools';
    tools.innerHTML = '<button type="button" data-a="open">Expand all</button><button type="button" data-a="close">Collapse all</button>';
    faqList.parentNode.insertBefore(tools, faqList);
    tools.addEventListener('click', (e) => {
      const a = e.target.dataset.a; if (!a) return;
      $$('.faq-item').forEach((i) => i.classList.toggle('open', a === 'open'));
    });
  }

  /* ── Scroll progress bar ──────────────────────────────── */
  const bar = document.createElement('div'); bar.id = 'scrollBar'; document.body.appendChild(bar);
  addEventListener('scroll', () => {
    const h = document.documentElement; bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + '%';
  }, { passive: true });

  /* ── Extra reveal motion: stagger groups & chart bars ─── */
  const grp = '.services-bento,.process-grid,.portfolio-grid,.team-grid,.blog-grid,.trust-grid,.pricing-grid,.stats-band-grid';
  $$(grp).forEach((g) => g.classList.add('stagger'));
  $$('.dash-chart .d-bar').forEach((b, i) => b.style.setProperty('--i', i));
  const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('visible'); io.unobserve(x.target); } }), { threshold: .12 });
  $$('.stagger').forEach((el) => io.observe(el));

  /* ── Reveal fallback (if IntersectionObserver callbacks are delayed/throttled) ── */
  function revealInView() {
    $$('.reveal:not(.visible),.stagger:not(.visible)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight - 40 && r.bottom > 0) el.classList.add('visible');
    });
  }
  addEventListener('scroll', revealInView, { passive: true });
  addEventListener('load', () => setTimeout(revealInView, 600));

  /* ── Hero parallax (mouse) ────────────────────────────── */
  const hero = document.getElementById('hero');
  if (hero && matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches) {
    const mock = hero.querySelector('.browser-mockup');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      if (mock) mock.style.transform = `perspective(1100px) rotateY(${x * 6}deg) rotateX(${-y * 5}deg)`;
      $$('.hero-shape', hero).forEach((s, i) => (s.style.marginLeft = x * (i ? -30 : 40) + 'px'));
    });
    hero.addEventListener('mouseleave', () => mock && (mock.style.transform = ''));
    if (mock) mock.style.transition = 'transform .25s ease-out';
  }

  if (window.lucide) window.lucide.createIcons();
})();
