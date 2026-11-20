/* ShopSync Technologies — Main JS */

/* ── Navbar scroll ─────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
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


/* ══════════════════════════════════════════════════════════════════
   INTERACTIVE ESTIMATOR & GLOBAL AGENCY ENHANCEMENTS
   ══════════════════════════════════════════════════════════════════ */

/* ── Interactive Scope Estimator ────────────────────────────── */
(function() {
  const estWrapper = document.getElementById('projectEstimator');
  if (!estWrapper) return;

  const chips = estWrapper.querySelectorAll('.est-chip');
  const priceDisplay = document.getElementById('estPrice');
  const timeDisplay = document.getElementById('estTime');

  function calculateEstimate() {
    let baseMin = 4500;
    let baseMax = 9000;
    let weeksMin = 3;
    let weeksMax = 6;

    const selectedChips = estWrapper.querySelectorAll('.est-chip.selected');
    selectedChips.forEach(chip => {
      const pMin = parseInt(chip.dataset.pmin || 0, 10);
      const pMax = parseInt(chip.dataset.pmax || 0, 10);
      const wMin = parseInt(chip.dataset.wmin || 0, 10);
      const wMax = parseInt(chip.dataset.wmax || 0, 10);
      baseMin += pMin;
      baseMax += pMax;
      weeksMin += wMin;
      weeksMax += wMax;
    });

    if (priceDisplay) {
      priceDisplay.textContent = `$${baseMin.toLocaleString()} - $${baseMax.toLocaleString()}`;
    }
    if (timeDisplay) {
      timeDisplay.textContent = `Estimated Delivery: ~${weeksMin} - ${weeksMax} Weeks (Agile Sprints)`;
    }
  }

  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      const group = this.dataset.group;
      if (group === 'type' || group === 'timeline') {
        estWrapper.querySelectorAll(`.est-chip[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
      } else {
        this.classList.toggle('selected');
      }
      calculateEstimate();
    });
  });

  calculateEstimate();
})();

/* ── Dynamic Company Info Sync ─────────────────── */
(function () {
  fetch('/api/info', { cache: 'default' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.ok || !data.info) return;
      var info = data.info;

      if (info.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
          a.href = 'mailto:' + info.email;
          if (a.textContent.includes('@')) a.textContent = info.email;
        });
        document.querySelectorAll('[data-company="email"]').forEach(function (el) {
          el.textContent = info.email;
          if (el.tagName === 'A') el.href = 'mailto:' + info.email;
        });
      }

      if (info.phone) {
        var cleanTel = info.phone.replace(/[^\d+]/g, '');
        document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
          a.href = 'tel:' + cleanTel;
          if (/\+?\d[\d\s-]+/.test(a.textContent)) a.textContent = info.phone;
        });
        document.querySelectorAll('[data-company="phone"]').forEach(function (el) {
          el.textContent = info.phone;
          if (el.tagName === 'A') el.href = 'tel:' + cleanTel;
        });
      }

      if (info.facebook_url) {
        document.querySelectorAll('a[href*="facebook.com"], [data-company="facebook"]').forEach(function (a) {
          a.href = info.facebook_url;
        });
      }

      if (info.tagline) {
        document.querySelectorAll('.footer-brand p, [data-company="tagline"]').forEach(function (el) {
          el.textContent = info.tagline;
        });
      }

      if (info.hours) {
        document.querySelectorAll('[data-company="hours"]').forEach(function (el) {
          el.textContent = info.hours;
        });
      }

      if (info.presence || info.address) {
        var presHtml = String(info.presence || info.address).replace(/\n/g, '<br>');
        document.querySelectorAll('[data-company="presence"]').forEach(function (el) {
          el.innerHTML = presHtml;
        });
        document.querySelectorAll('[data-company="address"]').forEach(function (el) {
          el.textContent = info.address;
        });
      }

      if (info.company_name) {
        document.querySelectorAll('[data-company="name"]').forEach(function (el) {
          el.textContent = info.company_name;
        });
      }
    })
    .catch(function () {});
})();

/* Initialize Lucide icons if available */
if (window.lucide) {
  window.lucide.createIcons();
}
