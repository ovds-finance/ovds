import { ServerCrash, RefreshCw, Clock, Wifi, Landmark } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

interface Props {
  status?: 502 | 503 | 504;
  message?: string;
  retryAfter?: number;
  onRetry?: () => void;
}

const STATUS_CONFIG = {
  502: {
    title: 'Bad Gateway',
    desc: 'The server received an invalid response from an upstream service.',
    icon: Wifi,
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  503: {
    title: 'Service Unavailable',
    desc: 'The server is temporarily unavailable. Please try again shortly.',
    icon: ServerCrash,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
  },
  504: {
    title: 'Gateway Timeout',
    desc: 'The upstream server did not respond in time.',
    icon: Clock,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
  },
};

const ServiceUnavailable: React.FC<Props> = ({
  status: propStatus,
  message: propMessage,
  retryAfter: propRetryAfter,
  onRetry,
}) => {
  const { t } = useTranslation();
  void t;

  const [searchParams] = useSearchParams();
  const statusParam = parseInt(searchParams.get('status') ?? '0', 10);
  const retryParam  = parseInt(searchParams.get('retryAfter') ?? '0', 10);
  const status      = (propStatus ?? (statusParam as 502 | 503 | 504)) || 503;
  const retryAfter  = propRetryAfter ?? retryParam;

  const [countdown, setCountdown] = useState(retryAfter);
  const [retrying,  setRetrying]  = useState(false);

  const cfg        = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[503];
  const StatusIcon = cfg.icon;
  const handleRetry = onRetry ?? (() => window.location.replace('/'));

  useEffect(() => {
    if (!retryAfter) return;
    setCountdown(retryAfter);
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(iv); handleRetry(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [retryAfter]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRetryClick = async () => {
    setRetrying(true);
    try { await handleRetry(); } finally { setRetrying(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.25rem',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: '2.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#0f172a', letterSpacing: '-.04em', lineHeight: 1 }}>OVDS FINCLOUD</div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Top accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}99)` }}/>

        <div style={{ padding: '2rem 2rem 2rem', textAlign: 'center' }}>

          {/* Icon + status code */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
            <div style={{
              fontSize: '5rem', fontWeight: 900, color: '#f1f5f9',
              lineHeight: 1, letterSpacing: '-.04em', userSelect: 'none',
            }}>{status}</div>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StatusIcon size={24} color={cfg.color} strokeWidth={1.8}/>
              </div>
            </div>
          </div>

          {/* Title + description */}
          <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-.025em', marginBottom: '.5rem' }}>
            {cfg.title}
          </h1>
          <p style={{ fontSize: '.875rem', color: '#64748b', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 1.5rem' }}>
            {propMessage ?? cfg.desc}
          </p>

          {/* Auto-retry countdown */}
          {countdown > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              fontSize: '.75rem', fontWeight: 600, color: '#64748b',
              marginBottom: '1.25rem',
            }}>
              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }}/>
              Auto-retrying in {countdown}s…
            </div>
          )}

          {/* Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              `HTTP ${status}`,
              retryAfter ? `Retry in ${retryAfter}s` : 'Manual retry',
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ].map(label => (
              <span key={label} style={{
                fontSize: '.6875rem', fontWeight: 600, color: '#94a3b8',
                padding: '3px 10px', borderRadius: 999,
                background: '#f8fafc', border: '1px solid #e2e8f0',
              }}>{label}</span>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onRetryClick}
              disabled={retrying}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '.6875rem', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: '#4FBA6F', color: '#fff',
                fontSize: '.875rem', fontWeight: 700, fontFamily: 'inherit',
                opacity: retrying ? 0.6 : 1, transition: 'opacity .15s',
              }}
            >
              <RefreshCw size={14} style={retrying ? { animation: 'spin 1s linear infinite' } : undefined}/>
              {retrying ? 'Retrying…' : 'Try Again'}
            </button>
            <Link
              to="/dashboard"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '.6875rem', borderRadius: 12,
                border: '1px solid #e2e8f0', background: '#fff',
                color: '#475569', fontSize: '.875rem', fontWeight: 600,
                textDecoration: 'none', transition: 'border-color .15s',
              }}
            >
              Dashboard
            </Link>
          </div>

          <p style={{ fontSize: '.6875rem', color: '#94a3b8', marginTop: '1.25rem' }}>
            If this persists, contact your system administrator.
          </p>

        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: '.6875rem', color: '#cbd5e1', marginTop: '1.5rem' }}>
        © {new Date().getFullYear()} OVDS AI ERP · Ethiopia 🇪🇹
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ServiceUnavailable;
