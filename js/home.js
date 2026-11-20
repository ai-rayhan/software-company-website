/* ShopSync — homepage interactions */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* services strip: auto sliding + smooth buttons + left container alignment */
  const track = $('#reachTrack');
  if (track) {
    const step = () => (track.querySelector('.rc')?.offsetWidth || 340) + 20;

    // Align initial padding with the container / title left edge
    const alignTrack = () => {
      const head = $('.reach-head');
      if (!head) return;
      const rect = head.getBoundingClientRect();
      const leftOffset = Math.max(24, Math.round(rect.left));
      track.style.paddingLeft = leftOffset + 'px';
      track.style.paddingRight = Math.max(24, leftOffset) + 'px';
    };
    alignTrack();
    window.addEventListener('resize', alignTrack, { passive: true });

    // Auto-sliding interval with pause on hover/interaction
    let slideTimer = null;
    const startAutoSlide = () => {
      stopAutoSlide();
      slideTimer = setInterval(() => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 20) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: step(), behavior: 'smooth' });
        }
      }, 3500);
    };
    const stopAutoSlide = () => {
      if (slideTimer) clearInterval(slideTimer);
    };

    track.addEventListener('mouseenter', stopAutoSlide);
    track.addEventListener('mouseleave', startAutoSlide);
    track.addEventListener('touchstart', stopAutoSlide, { passive: true });
    track.addEventListener('touchend', startAutoSlide, { passive: true });

    const prevBtn = $('#reachPrev');
    const nextBtn = $('#reachNext');
    if (prevBtn) prevBtn.addEventListener('click', () => { track.scrollBy({ left: -step(), behavior: 'smooth' }); startAutoSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { track.scrollBy({ left: step(), behavior: 'smooth' }); startAutoSlide(); });

    startAutoSlide();
  }

  /* results carousel */
  const ct = $('#carTrack');
  if (ct) {
    const n = ct.children.length, dots = $('#carDots');
    let i = 0, timer;
    for (let k = 0; k < n; k++) { const b = document.createElement('button'); b.setAttribute('aria-label', 'Slide ' + (k + 1)); b.onclick = () => go(k); dots.appendChild(b); }
    function go(k) {
      i = (k + n) % n; ct.style.transform = `translateX(-${i * 100}%)`;
      $$('button', dots).forEach((d, x) => d.classList.toggle('on', x === i));
      clearInterval(timer); timer = setInterval(() => go(i + 1), 6500);
    }
    $('#carPrev').onclick = () => go(i - 1); $('#carNext').onclick = () => go(i + 1);
    go(0);
  }

  /* process: progress line + active steps */
  const proc = $('#proc');
  if (proc) {
    const steps = $$('.ps', proc);
    const upd = () => {
      const r = proc.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      proc.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      steps.forEach((s) => s.classList.toggle('on', s.getBoundingClientRect().top < vh * 0.62));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* counters that keep prefix ($) */
  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count, pre = el.dataset.prefix, suf = el.dataset.suffix || '';
    let started = false;
    const run = () => {
      if (started) return; started = true;
      const t0 = performance.now();
      (function tick(t) {
        const p = Math.min(1, (t - t0) / 1600);
        el.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    setTimeout(run, 700);
  });
})();
