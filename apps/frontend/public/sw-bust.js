// Service worker cache bust script
// Force-clears stale SW caches that cause blank pages after deploys
(function () {
  var bust = localStorage.getItem('sw_cache_bust');
  var current = 'v4';
  if (bust !== current && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.update(); });
    });
    caches.keys().then(function (names) {
      names.forEach(function (n) {
        if (n !== 'ovds-' + current) caches.delete(n);
      });
    });
    localStorage.setItem('sw_cache_bust', current);
  }
})();
