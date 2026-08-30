import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { ServerCrash, RefreshCw, Clock, Wifi, Zap } from 'lucide-react';

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
    accent: '#f97316',
    iconBg: 'bg-orange-50 border-orange-100',
    iconColor: 'text-orange-500',
    stripe: 'linear-gradient(90deg,#f97316,#fb923c)',
    blob: 'rgba(249,115,22,0.09)',
  },
  503: {
    title: 'Service Unavailable',
    desc: 'The server is temporarily down for maintenance or is overloaded.',
    icon: ServerCrash,
    accent: '#ef4444',
    iconBg: 'bg-red-50 border-red-100',
    iconColor: 'text-red-500',
    stripe: 'linear-gradient(90deg,#ef4444,#f87171)',
    blob: 'rgba(239,68,68,0.08)',
  },
  504: {
    title: 'Gateway Timeout',
    desc: 'The upstream server failed to respond in time.',
    icon: Clock,
    accent: '#f59e0b',
    iconBg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-500',
    stripe: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
    blob: 'rgba(245,158,11,0.09)',
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
  const statusParam  = parseInt(searchParams.get('status')     ?? '0', 10);
  const retryParam   = parseInt(searchParams.get('retryAfter') ?? '0', 10);
  const status       = (propStatus ?? (statusParam as 502 | 503 | 504)) || 503;
  const retryAfter   = propRetryAfter ?? retryParam;

  const [countdown, setCountdown] = useState(retryAfter);
  const [retrying,  setRetrying]  = useState(false);

  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[503];
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.blob} 0%, transparent 70%)`, transform: 'translate(25%,-25%)' }}/>
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(85,188,126,0.08) 0%, transparent 70%)', transform: 'translate(-25%,25%)' }}/>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Colored top stripe */}
          <div className="h-[3px]" style={{ background: cfg.stripe }}/>

          <div className="p-8 sm:p-10 space-y-6 text-center">

            {/* Status illustration */}
            <div className="flex justify-center">
              <div className="relative select-none">
                <div className="text-[96px] font-black text-gray-100 leading-none tracking-tighter">{status}</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-15 h-15 rounded-2xl flex items-center justify-center border shadow-sm ${cfg.iconBg} ${cfg.iconColor}`}
                    style={{ width: '60px', height: '60px' }}>
                    <StatusIcon size={28} strokeWidth={1.8}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{cfg.title}</h1>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                {propMessage ?? cfg.desc}
              </p>
            </div>

            {/* Auto-retry countdown */}
            {countdown > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-[12px] font-semibold text-gray-500">
                <RefreshCw size={12} className="animate-spin"/>
                Auto-retrying in {countdown}s…
              </div>
            )}

            {/* Status detail pills */}
            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { label: `HTTP ${status}` },
                { label: retryAfter ? `Retry in ${retryAfter}s` : 'Manual retry' },
                { label: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ].map(p => (
                <span key={p.label} className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                  {p.label}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onRetryClick} disabled={retrying}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{ background: '#55bc7e' }}>
                <RefreshCw size={14} className={retrying ? 'animate-spin' : ''}/>
                {retrying ? 'Retrying…' : 'Try Again'}
              </button>
              <Link to="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-600 rounded-xl text-sm font-semibold transition-all">
                Dashboard
              </Link>
            </div>

            <p className="text-[11px] text-gray-400">
              If this persists, contact your system administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <Zap size={10} className="text-emerald-400"/> OVDS AI ERP · Ethiopia 🇪🇹
        </p>
      </div>
    </div>
  );
};

export default ServiceUnavailable;
