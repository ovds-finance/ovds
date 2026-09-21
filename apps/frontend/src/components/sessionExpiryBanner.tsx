/**
 * SessionExpiryBanner — sticky warning when the JWT is about to expire.
 *
 * For Auth0 SSO users: attempts a silent token refresh automatically when
 * the warning first appears. A "Refresh" button lets the user retry manually.
 * If the Auth0 session has also expired, the banner falls back to "Sign out".
 */
import {
  AlertTriangle,
  X,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getAuth0Token } from '../rbac/auth0Client';
import { useAuth } from '../rbac/AuthContext';
import type { AuthUser } from '../rbac/AuthContext';
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
        <span
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--sys-state-success)',
            color: 'var(--sys-state-success-text)',
            border: '1px solid var(--sys-state-success-border, #A7F3D0)',
          }}
        >
          <ShieldCheck size={10} /> {t('session.mfa_full')}
        </span>
      ) : mfaEnrolled ? (
        <span
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--sys-state-alert)',
            color: 'var(--sys-state-alert-text)',
            border: '1px solid var(--sys-state-alert-border, #FDE68A)',
          }}
        >
          <ShieldAlert size={10} /> {t('session.mfa_password')}
        </span>
      ) : null
    ) : null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] w-full max-w-lg px-4 animate-aki-slide-up"
    >
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--pro-amber-dim, rgba(217,119,6,0.25))',
          boxShadow: '0 20px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(217,119,6,0.10)', color: 'var(--pro-amber)' }}
        >
          <AlertTriangle size={18} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-[13px] font-bold"
              style={{ color: 'var(--text)' }}
            >
              {t('session.expiring_soon')}
            </p>
            {mfaBadge}
          </div>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: 'var(--text-3)' }}
          >
            {showRefresh
              ? t('session.click_refresh', { time: timeLabel })
              : refreshFailed
                ? t('session.refresh_failed')
                : t('session.save_work', { time: timeLabel })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {showRefresh ? (
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all hover:opacity-90 active:scale-97"
              style={{ background: 'var(--pro-amber)', color: '#fff', boxShadow: '0 2px 8px rgba(217,119,6,0.30)' }}
            >
              <RefreshCw size={13} /> {t('session.refresh_btn')}
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all hover:opacity-90 active:scale-97"
              style={{ background: 'var(--pro-amber)', color: '#fff', boxShadow: '0 2px 8px rgba(217,119,6,0.30)' }}
            >
              <LogOut size={13} /> {t('a11y.sign_out')}
            </button>
          )}
          <button
            onClick={() => dismissExpiryWarning()}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
            }}
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
