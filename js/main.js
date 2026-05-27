/* ShopSync Technologies — Main JS */

/* ── Navbar scroll ─────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── Mobile nav ────────────────────────────────── */
const hamburger   = document.getElementById('hamburger');
const mobileNav   = document.getElementById('mobileNav');
const mobileClose = document.getElementById('mobileClose');

hamburger.addEventListener('click',   () => mobileNav.classList.add('open'));
mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));
mobileNav.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobileNav.classList.remove('open'))
);

/* ── Scroll reveal ─────────────────────────────── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Active nav link ───────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const activeObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const lnk = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (lnk) lnk.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => activeObs.observe(s));

/* ── Portfolio filter ──────────────────────────── */
const filterBtns = document.querySelectorAll('.filter-btn');
const portCards  = document.querySelectorAll('.port-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    portCards.forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
    });
  });
});

/* ── Animated counters ─────────────────────────── */
function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  let cur = 0;
  const inc = target / (1800 / 16);
  const timer = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = Math.round(cur) + suffix;
    if (cur >= target) clearInterval(timer);
  }, 16);
}

const cntObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCount(e.target); cntObs.unobserve(e.target); }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => cntObs.observe(el));

/* ── Contact form ──────────────────────────────── */
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = this.querySelector('.form-submit');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = 'Message Sent! <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    this.reset();
    setTimeout(() => {
      btn.innerHTML = 'Send Message';
      btn.disabled = false;
    }, 3500);
  }, 1400);
});

/* ── Tech stack slider ─────────────────────────── */
(function () {
  const track   = document.getElementById('techSliderTrack');
  const dotsEl  = document.getElementById('tsDots');
  const prevBtn = document.getElementById('tsPrev');
  const nextBtn = document.getElementById('tsNext');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.tech-slide'));
  const total  = slides.length;
  let current  = 0;
  let autoTimer;

  function perView() {
    const w = window.innerWidth;
    if (w < 480) return 1;
    if (w < 768) return 2;
    if (w < 1024) return 3;
    return 5;
  }

  function maxIdx() { return Math.max(0, total - perView()); }

  function buildDots() {
    dotsEl.innerHTML = '';
    const max = maxIdx();
    for (let i = 0; i <= max; i++) {
      const d = document.createElement('button');
      d.className = 'slider-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Slide ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
    }
  }

  function updateDots() {
    dotsEl.querySelectorAll('.slider-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIdx()));
    const slideW = slides[0].offsetWidth + 16; /* 16 = gap */
    track.style.transform = `translateX(-${current * slideW}px)`;
    updateDots();
    resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current < maxIdx() ? current + 1 : 0), 3200);
  }

  buildDots();
  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  window.addEventListener('resize', () => { buildDots(); goTo(0); });
  resetAuto();
})();

/* ── FAQ accordion ─────────────────────────────── */
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ── Smooth scroll ─────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
