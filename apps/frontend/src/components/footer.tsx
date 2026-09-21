import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Icon } from './ui';

const APP_VERSION = '1.0.0';

/**
 * Footer — Ovds SaaS minimal status bar.
 *
 * Design: single horizontal strip with a very subtle top border.
 * Left: brand mark + copyright + version + locale switcher.
 * Right: TLS badge, API health dot, latency, network status.
 * No decorative gradients — clean, unobtrusive, data-only.
 */
const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const currentLocale = i18n.language?.split('-')[0] || 'en';

  const [online,      setOnline]      = useState(navigator.onLine);
  const [serverOk,    setServerOk]    = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking,    setChecking]    = useState(false);
  const [latencyMs,   setLatencyMs]   = useState<number | null>(null);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online',  on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const checkServer = useCallback(() => {
    setChecking(true);
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    fetch('/api/health/ready', { method: 'GET', signal: controller.signal })
      .then(r => {
        clearTimeout(timeoutId);
        setLatencyMs(Date.now() - start);
        setServerOk(r.ok || r.status < 500);
        setLastChecked(new Date());
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setServerOk(false);
        setLatencyMs(null);
        setLastChecked(new Date());
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    checkServer();
    const id = setInterval(checkServer, 60_000);
    return () => clearInterval(id);
  }, [checkServer]);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const LOCALE_LABELS: Record<string, string> = {
    en: 'English', am: 'አማርኛ', ti: 'ትግርኛ',
  };

  const latencyColor =
    latencyMs === null ? 'var(--text-4)'
    : latencyMs < 200  ? 'var(--pro-indigo)'
    : latencyMs < 600  ? 'var(--pro-amber)'
    :                    'var(--pro-rose)';

  /* ── shared separator ─────────────────────────────────────────────── */
  const Sep = () => (
    <span aria-hidden style={{ color: 'var(--border)', userSelect: 'none', margin: '0 2px' }}>·</span>
  );

  return (
    <footer
      style={{
        height: 'var(--footer-h)',
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0 24px',
        gap: 0,
      }}
    >
      {/* ── Left ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 500, color: 'var(--text-4)',
          flex: 1, minWidth: 0,
        }}
      >
        {/* Ovds SaaS style brand mark — small green square */}
        <div
          style={{
            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
            background: 'var(--pro-gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 7, fontWeight: 900,
          }}
        >
          O
        </div>

        <span style={{ fontWeight: 600, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          © {year} {t('brand.full', 'OVDS')}
        </span>

        <Sep />

        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 9, color: 'var(--text-5)', userSelect: 'none',
          }}
        >
          v{APP_VERSION}
        </span>

        <Sep />

        {/* Locale switcher */}
        <button
          onClick={() => navigate('/settings?tab=localization')}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-4)', fontSize: 10, fontWeight: 500,
            fontFamily: 'inherit',
            padding: '1px 4px', borderRadius: 4,
            transition: 'color 120ms, background 120ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure-50)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          title={t('footer.change_language', 'Change language')}
        >
          <Icon name="GLOBE" size={9} />
          {LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}
        </button>
      </div>

      {/* ── Right: status strip ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 600, flexShrink: 0,
        }}
      >
        {/* TLS — always green */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--pro-indigo)' }}>
          <Icon name="SUCCESS" size={9} />
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>TLS</span>
        </div>

        <Sep />

        {/* API health */}
        {serverOk !== null && (
          <>
            <button
              onClick={checkServer}
              title={lastChecked ? `Last checked: ${fmtTime(lastChecked)}` : 'Check server'}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: serverOk ? 'var(--pro-indigo)' : 'var(--pro-rose)',
                fontWeight: 600, fontSize: 10, fontFamily: 'inherit',
                transition: 'opacity 120ms', padding: 0,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >
              {checking
                ? <Icon name="REFRESH" size={9} className="animate-aki-spin" />
                : <Icon name="ACTIVITY" size={9} />
              }
              <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {serverOk ? 'API' : 'API Down'}
              </span>
            </button>

            {/* Latency badge */}
            {latencyMs !== null && serverOk && (
              <>
                <Sep />
                <span
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontWeight: 700, color: latencyColor,
                  }}
                >
                  <Icon name="ZAP" size={9} />
                  {latencyMs}ms
                </span>
              </>
            )}

            <Sep />
          </>
        )}

        {/* Network status */}
        <div
          role="status"
          aria-label={online ? 'Online' : 'Offline'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: online ? 'var(--pro-indigo)' : 'var(--pro-rose)',
          }}
        >
          {/* Pulsing live dot */}
          <span
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'currentColor',
              flexShrink: 0,
              animation: online ? 'aki-pulse 2.5s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {online
              ? t('footer.online',  'Online')
              : t('footer.offline', 'Offline')
            }
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
