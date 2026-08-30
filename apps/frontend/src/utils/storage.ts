/**
 * storage.ts — thin localStorage helpers.
 *
 * Session identity is owned by AuthContext.
 * These helpers exist only for the few places that need to read
 * session data outside of React (e.g. api.ts interceptor, seed scripts).
 *
 * Do NOT add RBAC logic here — that lives in src/rbac/rbac.ts.
 */

// -- Raw session readers (non-React) ------------------------------------------

export function getStoredUser<T = Record<string, unknown>>(
  fallback: T = {} as T,
): T {
  try {
    const raw = localStorage.getItem('ovds_user');
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem('ovds_user');
    localStorage.removeItem('ovds_token');
    return fallback;
  }
}

export function setStoredUser(user: Record<string, unknown>): void {
  try {
    localStorage.setItem('ovds_user', JSON.stringify(user));
  } catch {
    /* storage full */
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('ovds_token');
}

export function clearSession(): void {
  // Auth keys
  localStorage.removeItem('ovds_token');
  localStorage.removeItem('ovds_user');
  localStorage.removeItem('auth0_token');
  try { sessionStorage.removeItem('ovds_csrf'); } catch { /* ignore */ }
  // Sidebar state
  localStorage.removeItem('sidebar_groups');
  localStorage.removeItem('sidebar_groups_v4');
  localStorage.removeItem('sidebar_groups_v7');
  localStorage.removeItem('sidebar_favorites_v2');
  localStorage.removeItem('sidebar_recent');
  // User-specific UI state
  localStorage.removeItem('ovds_saved_reports');
  localStorage.removeItem('ovds_recent_tabs');
  localStorage.removeItem('ovds_backup_history');
  localStorage.removeItem('col_vis_invoice_columns');
  localStorage.removeItem('pinned_companies');
  localStorage.removeItem('company_notes');
  localStorage.removeItem('default_tab_reports');
  localStorage.removeItem('global_search_recent');
  localStorage.removeItem('chunk_retry');

  // Clear in-memory query cache to prevent cross-user data exposure
  // when user B logs in on the same tab after user A logs out.
  import('../hooks/useApiQuery').then(({ clearQueryCache }) => clearQueryCache()).catch(() => {});
}

// -- Theme key (single source of truth) ---------------------------------------

/**
 * The ONLY key that stores the colour theme.
 *
 * `main.tsx` reads this synchronously before first paint to apply the `dark`
 * class (FOUC prevention), and the Settings → Appearance tab writes it. They
 * previously disagreed (`theme` vs `ovds_theme`), so saving a theme in Settings
 * had no effect on reload and the pre-paint class fought React state, producing
 * a visible flash. Keep every reader/writer on this constant.
 */
export const THEME_KEY = 'theme';

/** Legacy theme key kept only so the sanitizer can migrate + drop it. */
const LEGACY_THEME_KEY = 'ovds_theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function getStoredTheme(): ThemePreference {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function setStoredTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage full */
  }
}

// -- Stale / corrupt UI state sanitizer ---------------------------------------

/**
 * Keys that hold JSON. If the stored value is not parseable the consuming
 * component throws while rendering the layout, which surfaces as a blank or
 * flickering shell. We drop them instead of letting them crash a render.
 */
const JSON_STATE_KEYS = [
  'ovds_user',
  'sidebar_groups_v7',
  'sidebar_favorites_v2',
  'sidebar_recent',
  'ovds_saved_reports',
  'ovds_recent_tabs',
  'ovds_backup_history',
  'ovds_invoice_templates',
  'col_vis_invoice_columns',
  'pinned_companies',
  'company_notes',
  'dashboards_config',
  'global_search_recent',
  'ovds_ecl_rates',
  'payment_receipt_history',
] as const;

/**
 * Superseded keys. Left behind by earlier releases, they still shadow current
 * state (e.g. three generations of sidebar group state) and cause conflicting
 * expand/collapse rendering.
 */
const LEGACY_KEYS = [
  'sidebar_groups',
  'sidebar_groups_v4',
  'sidebar_favorites',
  'token', // superseded by 'ovds_token'
] as const;

/** Bump when LEGACY_KEYS / JSON_STATE_KEYS change so clients re-run the purge. */
const SANITIZER_VERSION = '2';
const SANITIZER_KEY = 'ovds_ui_state_version';

export interface SanitizeResult {
  /** True when the purge actually ran (i.e. it had not run for this version). */
  ran: boolean;
  /** Keys removed because they were legacy/superseded. */
  legacyRemoved: string[];
  /** Keys removed because their JSON was unparseable. */
  corruptRemoved: string[];
}

/**
 * Remove stale and corrupt client UI state without touching the active session.
 *
 * Deliberately NOT `localStorage.clear()`: that would drop `ovds_token` /
 * `ovds_user` on every boot, bouncing the user to /login and creating exactly
 * the redirect flicker we are trying to remove. It also wipes unrelated
 * third-party and PWA data.
 *
 * Runs at most once per `SANITIZER_VERSION` unless `force` is set.
 */
export function sanitizeUiState(force = false): SanitizeResult {
  const result: SanitizeResult = { ran: false, legacyRemoved: [], corruptRemoved: [] };
  if (typeof localStorage === 'undefined') return result;

  try {
    if (!force && localStorage.getItem(SANITIZER_KEY) === SANITIZER_VERSION) {
      return result;
    }

    // Migrate the theme preference before dropping the legacy key so the user
    // keeps the theme they chose under the old key.
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacyTheme && !localStorage.getItem(THEME_KEY)) {
      localStorage.setItem(THEME_KEY, legacyTheme);
    }
    if (legacyTheme !== null) {
      localStorage.removeItem(LEGACY_THEME_KEY);
      result.legacyRemoved.push(LEGACY_THEME_KEY);
    }

    for (const key of LEGACY_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        result.legacyRemoved.push(key);
      }
    }

    for (const key of JSON_STATE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        JSON.parse(raw);
      } catch {
        localStorage.removeItem(key);
        result.corruptRemoved.push(key);
      }
    }

    localStorage.setItem(SANITIZER_KEY, SANITIZER_VERSION);
    result.ran = true;
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
  return result;
}

/**
 * Drop Service Worker / HTTP caches so a stale JS chunk manifest cannot keep
 * serving a build whose lazy chunks no longer exist (the usual cause of
 * "chunk load failed" blank screens after a deploy).
 */
export async function clearBrowserCaches(): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
  } catch {
    /* ignore */
  }
}

/**
 * Full client-side reset used by the "having display problems?" recovery
 * action: purge caches + all non-session UI state, keep the user signed in.
 */
export async function hardResetUiState(): Promise<SanitizeResult> {
  const res = sanitizeUiState(true);
  for (const key of [...JSON_STATE_KEYS, 'sidebar_collapsed', 'chunk_retry']) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  await clearBrowserCaches();
  return res;
}

// safeJsonParse is now in @ovds/shared — re-exported here for backward compat
 export {
   safeJsonParse,
 } from '@ovds/shared';



