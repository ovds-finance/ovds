/**
 * security-shield.js
 *
 * Production-only client-side defence layer.
 * Loaded via a plain <script> tag in index.html (before the React bundle)
 * so it runs synchronously at parse time — before any framework code.
 *
 * Capabilities
 * ────────────
 *  1. Console Poisoning
 *     Replaces every console method with a no-op in production to prevent
 *     manual inspection of app state through the browser DevTools console.
 *     A single decoy warning is left visible to deter casual snoopers.
 *
 *  2. DevTools Keyboard Shortcut Blocking
 *     Intercepts F12, Ctrl/Cmd+Shift+I, Ctrl/Cmd+Shift+J, Ctrl/Cmd+U
 *     (view-source) and Ctrl+Shift+C (inspector picker) at the document level.
 *
 *  3. Context-Menu Blocking
 *     Prevents right-click → "Inspect Element" in production builds.
 *
 *  4. DOM Tampering Detection (MutationObserver)
 *     Monitors the <head> and <body> for unauthorised script/style injections
 *     by browser extensions or in-page XSS.  On detection, the page reloads
 *     from the server to restore a clean state and the event is logged to
 *     /api/security/dom-alert.
 *
 *  5. Headless / Automation Detection
 *     Detects Puppeteer, Playwright, and PhantomJS fingerprints and redirects
 *     to the home page so scrapers cannot harvest authenticated data.
 *
 * This file intentionally uses no import/export so it can be loaded as a
 * plain synchronous <script> without a module bundler.
 *
 * ⚠  None of these techniques are a substitute for server-side security.
 *    They raise the cost of casual reverse-engineering; a determined attacker
 *    with source access can bypass them.  Pair with CSP, CORS, and JWT
 *    validation on every API request.
 */
(function (global) {
  'use strict';

  // ── Guard: only run in production ──────────────────────────────────────────
  // Vite sets import.meta.env.PROD but this script runs before the module
  // system, so we detect production by checking the hostname and the absence
  // of the Vite dev server port.
  var isProd = (function () {
    var host = global.location && global.location.hostname;
    var port = global.location && global.location.port;
    if (!host) return false;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) return false;
    if (port === '5173' || port === '3000' || port === '3002') return false;
    return true;
  })();

  if (!isProd) return;

  // ── 1. Console Poisoning ───────────────────────────────────────────────────
  // Replace every console method with a no-op so that React DevTools,
  // Redux DevTools, and manual console inspection produce no output.
  var methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'dir',
                 'dirxml', 'group', 'groupEnd', 'groupCollapsed', 'trace',
                 'assert', 'count', 'countReset', 'time', 'timeEnd', 'timeLog',
                 'profile', 'profileEnd', 'clear'];

  var noop = function () {};

  // Keep a reference to the real console.warn for the decoy message only.
  var realWarn = global.console.warn.bind(global.console);

  methods.forEach(function (method) {
    try {
      global.console[method] = noop;
    } catch (_) {}
  });

  // Decoy: a single message that looks like a security notice to deter
  // curious users and makes automated console-scrapers collect junk.
  try {
    realWarn(
      '%c⛔ STOP — Restricted Area',
      'color: red; font-size: 24px; font-weight: bold;'
    );
    realWarn(
      'This browser console is restricted. Entering commands here could ' +
      'expose your account to attackers. If someone told you to paste ' +
      'something here, it is a scam.'
    );
  } catch (_) {}

  // ── 2. DevTools Keyboard Shortcut Blocking ────────────────────────────────
  global.document.addEventListener('keydown', function (e) {
    var key = e.key || e.keyCode;
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;

    // F12
    if (key === 'F12' || key === 123) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl/Cmd + Shift + I  (Inspector)
    if (ctrl && shift && (key === 'I' || key === 'i' || key === 73)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl/Cmd + Shift + J  (Console)
    if (ctrl && shift && (key === 'J' || key === 'j' || key === 74)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl/Cmd + Shift + C  (Inspector picker)
    if (ctrl && shift && (key === 'C' || key === 'c' || key === 67)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl + U  (View source)
    if (ctrl && !shift && (key === 'U' || key === 'u' || key === 85)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl + S  (Save page — leaks full HTML)
    if (ctrl && !shift && (key === 'S' || key === 's' || key === 83)) { e.preventDefault(); e.stopPropagation(); return false; }
  }, true);

  // ── 3. Context-Menu Blocking ──────────────────────────────────────────────
  global.document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  }, true);

  // ── 4. DOM Tampering Detection (MutationObserver) ─────────────────────────
  // Watch for injected <script> or <link> nodes that were not placed by the
  // OVDS bundle itself (identified by the absence of a data-ovds attribute).
  var observeMutations = function () {
    if (!global.MutationObserver) return;

    var reportTamper = function (node) {
      var detail = {
        tag: node.tagName,
        src: node.src || node.href || '',
        time: Date.now(),
        url: global.location.href,
      };

      // Best-effort beacon to the backend — fire-and-forget
      try {
        if (global.navigator.sendBeacon) {
          global.navigator.sendBeacon('/api/security/dom-alert', JSON.stringify(detail));
        }
      } catch (_) {}

      // Reload from network to restore clean DOM
      global.location.reload();
    };

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return; // element nodes only
          var tag = (node.tagName || '').toUpperCase();
          // Flag external scripts not added by the app bundle
          if (tag === 'SCRIPT' && !node.hasAttribute('data-ovds')) {
            reportTamper(node);
          }
          // Flag external stylesheet injections
          if (tag === 'LINK' && node.rel === 'stylesheet' && !node.hasAttribute('data-ovds')) {
            reportTamper(node);
          }
        });
      });
    });

    observer.observe(global.document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', observeMutations);
  } else {
    observeMutations();
  }

  // ── 5. Headless / Automation Detection ───────────────────────────────────
  var detectHeadless = function () {
    var navigator = global.navigator;
    if (!navigator) return;

    var signs = [
      // Puppeteer/Playwright navigator.webdriver flag
      navigator.webdriver === true,
      // PhantomJS
      typeof global.callPhantom !== 'undefined',
      typeof global._phantom !== 'undefined',
      // Selenium
      typeof global.document.__selenium_unwrapped !== 'undefined',
      typeof global.document.__webdriver_evaluate !== 'undefined',
      typeof global.document.__driver_evaluate !== 'undefined',
      // Chrome headless plugin list is empty
      (navigator.plugins && navigator.plugins.length === 0 && !navigator.webdriver),
      // Zero-length language list (headless Chrome default)
      (navigator.languages && navigator.languages.length === 0),
    ];

    if (signs.some(Boolean)) {
      // Redirect headless agents away from authenticated pages
      try {
        global.location.replace('/');
      } catch (_) {}
    }
  };

  detectHeadless();

})(typeof window !== 'undefined' ? window : this);
