import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';
import './i18n';
import { registerSW } from 'virtual:pwa-register';
import { prefetchRoutes } from './lib/routePreloader';
import { sanitizeUiState, THEME_KEY } from './utils/storage';

// -- Stale UI state purge — runs before React mounts --------------------------
// Drops superseded keys (e.g. three generations of sidebar group state) and
// any key whose persisted JSON no longer parses, both of which otherwise throw
// during layout render and surface as a blank or flickering shell.
// Session keys are preserved on purpose — see utils/storage.ts.
sanitizeUiState();

// -- Expired token pre-clear — runs synchronously before React mounts ---------
// Prevents the 401 polling flood that occurs when components mount with a
// stale expired token in localStorage and all fire their initial useEffect
// fetches simultaneously.
(function () {
  try {
    const token = localStorage.getItem('ovds_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
        // Token is expired — wipe session keys before any component reads them
        localStorage.removeItem('ovds_token');
        localStorage.removeItem('ovds_user');
        localStorage.removeItem('auth0_token');
        localStorage.removeItem('selectedCompanyId');
      }
    }
  } catch { /* malformed token — leave as-is, AuthContext will handle it */ }
})();

// Only register service worker in production to avoid stale cache issues in dev
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

// -- Dark mode flash prevention ------------------------------------------------
// Apply dark class synchronously before first paint to avoid FOUC.
// Must read the SAME key the Settings → Appearance tab writes (THEME_KEY),
// otherwise a saved theme silently fails to persist across reloads.
(function () {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || ((!stored || stored === 'system') && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// -- Idle prefetch — load common page chunks when the browser is idle ----------
// These are the most frequently navigated-to pages; preloading them at idle
// time makes menu clicks feel instantaneous.
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  requestIdleCallback(() => {
    prefetchRoutes([
      '/dashboard', '/sales/invoices', '/banking/accounts', '/crm/contacts',
      '/inventory', '/settings/users', '/hr/employees', '/reports/financial-statements',
      '/accounting', '/tax/vat', '/customers', '/purchases/bills',
    ]);
  }, { timeout: 5_000 });
}


