/* ShopSync — homepage interactions */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* services strip arrows */
  const track = $('#reachTrack');
  if (track) {
    const step = () => (track.querySelector('.rc')?.offsetWidth || 340) + 20;
    $('#reachPrev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('#reachNext').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
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
