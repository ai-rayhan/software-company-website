/* Renders admin-managed content (team + careers) from the API.
   The static HTML stays in place as a fallback if the API is unreachable. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PHOTO = /^assets\/images\/[\w\-\/.]+\.(jpe?g|png|webp)$/i;
  var PAL = ['#F6660F', '#0A0C0B', '#FF8A3D', '#2a2d2c'];
  var initials = function (n) { return n.split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  function done(root) {
    if (window.initImageSlots) window.initImageSlots(root);
    if (window.lucide) window.lucide.createIcons();
  }
  function load(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { return d.ok ? d.rows : Promise.reject(); }); }

  var team = document.getElementById('teamGrid');
  if (team) load('/api/team').then(function (rows) {
    team.innerHTML = rows.map(function (m, i) {
      var hasPhoto = PHOTO.test(m.photo || '') && m.photo.indexOf('..') < 0;
      var photo = hasPhoto
        ? '<img data-slot src="' + esc(m.photo) + '" alt="' + esc(m.name) + '" loading="lazy" decoding="async">'
        : '<svg viewBox="0 0 24 24" class="person-icon" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(255,255,255,0.92)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      return '<div class="card2 person reveal visible"><div class="av' + (hasPhoto ? '' : ' no-photo') + '" style="background:' + PAL[i % PAL.length] + '">' + photo + '</div><h4>' + esc(m.name) + '</h4><small>' + esc(m.role) + '</small><p>' + esc(m.bio) + '</p></div>';
    }).join('');
    team.classList.add('visible'); done(team);
  }).catch(function () {});

  var roles = document.getElementById('rolesList');
  if (roles) load('/api/careers').then(function (rows) {
    roles.innerHTML = rows.length ? rows.map(function (r) {
      var meta = [r.department, r.location, r.type].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
      return '<div class="role"><div><h4>' + esc(r.title) + '</h4><p>' + esc(r.description) + '</p><div class="meta">' + meta + '</div></div>' +
        '<a class="btn btn-dark" href="contact.html?service=careers&role=' + encodeURIComponent(r.title) + '">Apply now <i data-lucide="arrow-right" style="width:16px;height:16px"></i></a></div>';
    }).join('') : '<div class="role"><div><h4>No open roles right now</h4><p>We are not hiring for a specific position at the moment, but we always like to hear from talented people.</p></div></div>';
    roles.classList.add('visible'); done(roles);
  }).catch(function () {});
})();
