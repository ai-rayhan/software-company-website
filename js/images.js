/* Image slots: show the photo when it exists, otherwise keep the designed fallback. */
(function () {
  function mark(img) { var p = img.parentElement; if (p) p.classList.add('has-img'); }
  function drop(img) { var p = img.parentElement; img.remove(); if (p) p.classList.remove('has-img'); }
  window.initImageSlots = function (root) {
    (root || document).querySelectorAll('img[data-slot]:not([data-init])').forEach(function (img) {
      img.setAttribute('data-init', '1');
      if (img.complete) { img.naturalWidth ? mark(img) : drop(img); return; }
      img.addEventListener('load', function () { mark(img); });
      img.addEventListener('error', function () { drop(img); });
    });
  };
  window.initImageSlots();
})();
