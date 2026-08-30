/**
 * SessionExpiryBanner — sticky warning when the JWT is about to expire.
 *
 * For Auth0 SSO users: attempts a silent token refresh automatically when
 * the warning first appears. A "Refresh" button lets the user retry manually.
 * If the Auth0 session has also expired, the banner falls back to "Sign out".
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  X,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../rbac/AuthContext';
import type { AuthUser } from '../rbac/AuthContext';
import { getAuth0Token } from '../rbac/auth0Client';
import { BEARER_PREFIX } from '../utils/constants';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';

async function attemptAuth0Refresh(
  login: (token: string, user: AuthUser) => void,
): Promise<boolean> {
  try {
    const auth0Token = await getAuth0Token();
    if (!auth0Token) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);

    let res: Response;
    try {
      res = await fetch('/api/auth/auth0/session', {
        method: 'POST',
        headers: { Authorization: `${BEARER_PREFIX}${auth0Token}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return false;

    const data = (await res.json()) as { access_token: string; user: AuthUser };
    login(data.access_token, { ...data.user, isAuth0User: true });
    return true;
  } catch {
    return false;
  }
}

const SessionExpiryBanner: React.FC = () => {
  const { t } = useTranslation();
  const auth = useAuth();
  const {
    sessionExpiring,
    expiresInMinutes,
    isAuth0User,
    stepUp,
    mfaEnrolled,
  } = auth;
  const logout = () => auth.logout();
  const dismissExpiryWarning = () => auth.dismissExpiryWarning();
  const login = useCallback((token: string, user: AuthUser) => auth.login(token, user), [auth]);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const autoAttempted = useRef(false);

  useEffect(() => {
    if (!sessionExpiring) {
      autoAttempted.current = false;
      setRefreshFailed(false);
    }
  }, [sessionExpiring]);

  useEffect(() => {
    if (!sessionExpiring || !isAuth0User || !AUTH0_ENABLED) return;
    if (autoAttempted.current) return;
    autoAttempted.current = true;

    setRefreshing(true);
    void attemptAuth0Refresh((token, user) => login(token, user))
      .then((ok) => {
        setRefreshing(false);
        if (!ok) setRefreshFailed(true);
      })
      .catch(() => {
        setRefreshing(false);
        setRefreshFailed(true);
      });
  }, [sessionExpiring, isAuth0User, refreshTick, login]);

  const handleManualRefresh = useCallback(() => {
    autoAttempted.current = false;
    setRefreshFailed(false);
    setRefreshTick((t) => t + 1);
  }, []);

  if (!sessionExpiring || refreshing) return null;

  const mins = expiresInMinutes ?? 0;
  const showRefresh = isAuth0User && AUTH0_ENABLED && !refreshFailed;
  const timeLabel =
    mins <= 1
      ? t('session.less_than_minute')
      : t('session.expires_in', { mins });

  const mfaBadge =
    isAuth0User && AUTH0_ENABLED ? (
      stepUp === 'full' ? (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck size={10} /> {t('session.mfa_full')}
        </span>
      ) : mfaEnrolled ? (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
          <ShieldAlert size={10} /> {t('session.mfa_password')}
        </span>
      ) : null
    ) : null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] w-full max-w-lg px-4 animate-aki-slide-in-right">
      <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 rounded-2xl shadow-xl shadow-amber-100 dark:shadow-amber-950/50 px-5 py-4 flex items-center gap-4 transition-colors">
        <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle
            size={18}
            className="text-amber-600 dark:text-amber-400"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {t('session.expiring_soon')}
            </p>
            {mfaBadge}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            {showRefresh
              ? t('session.click_refresh', { time: timeLabel })
              : refreshFailed
                ? t('session.refresh_failed')
                : t('session.save_work', { time: timeLabel })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showRefresh ? (
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              <RefreshCw size={13} /> {t('session.refresh_btn')}
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              <LogOut size={13} /> {t('a11y.sign_out')}
            </button>
          )}
          <button
            onClick={() => dismissExpiryWarning()}
            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors"
            aria-label={t('a11y.dismiss')}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiryBanner;
