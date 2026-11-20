/* Image slots: show the photo when it exists, otherwise keep the designed gradient fallback. */
(function () {
  function mark(img) { var p = img.parentElement; if (p) p.classList.add('has-img'); }
  function drop(img) { var p = img.parentElement; img.remove(); if (p) p.classList.remove('has-img'); }
  document.querySelectorAll('img[data-slot]').forEach(function (img) {
    if (img.complete) { img.naturalWidth ? mark(img) : drop(img); return; }
    img.addEventListener('load', function () { mark(img); });
    img.addEventListener('error', function () { drop(img); });
  });
})();
