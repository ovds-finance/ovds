// Language and sidebar initialization script
// Runs before React hydrates to prevent flash of untranslated content
(function () {
  var VALID = ['en', 'am', 'ti'];
  var stored = localStorage.getItem('i18nextLng') || '';
  var lang = stored.split('-')[0];
  if (VALID.indexOf(lang) !== -1) {
    document.documentElement.setAttribute('lang', lang);
  }
  var collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  document.documentElement.style.setProperty('--sidebar-w', collapsed ? '56px' : '296px');
})();
