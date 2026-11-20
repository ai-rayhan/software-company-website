/* Highlight current section in the legal TOC */
(function () {
  const links = Array.from(document.querySelectorAll('.legal-toc a[href^="#"]'));
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!secs.length) return;
  const upd = () => {
    let cur = secs[0];
    secs.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s; });
    links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
  };
  addEventListener('scroll', upd, { passive: true }); upd();
})();
