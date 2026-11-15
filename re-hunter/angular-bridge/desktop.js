// Share the existing desktop preload with the trusted same-origin engine only.
// Browser clients have no alaaApp bridge and continue through web-shim.js.
(() => {
  if (window.parent === window || new URLSearchParams(location.search).get('aqm-embedded') !== '1') return;
  try {
    if (location.pathname !== '/d/dashboard.html' || window.parent.location.origin !== location.origin || window.parent.location.pathname !== '/d/angular/index.html') return;
    if (!window.parent.alaaApp || window.parent.chrome?.runtime?.id !== 'alaa-deals') return;
    window.chrome = window.parent.chrome;
    window.alaaApp = window.parent.alaaApp;
    delete window.__alaaWeb;
    document.documentElement.classList.add('in-app');
  } catch { /* An isolated or external frame receives no desktop API. */ }
})();
