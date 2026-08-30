import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui';

const APP_VERSION = '1.0.0';



// -- Footer --------------------------------------------------------------------
const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const currentLocale = i18n.language?.split('-')[0] || 'en';

  const [online, setOnline] = useState(navigator.onLine);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);


  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const checkServer = useCallback(() => {
    setChecking(true);
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    fetch('/api/health/ready', { method: 'GET', signal: controller.signal })
      .then((r) => {
        clearTimeout(timeoutId);
        const ms = Date.now() - start;
        setLatencyMs(ms);
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
    const id = setInterval(checkServer, 60000);
    return () => clearInterval(id);
  }, [checkServer]);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const LOCALE_LABELS: Record<string, string> = {
    en: 'English',
    am: 'አማርኛ',
    ti: 'ትግርኛ',
  };

  return (
    <footer
      className="mt-auto flex flex-col justify-center min-h-[40px]"
    >
      <div className="border-t border-slate-100 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: logo + copyright + version + locale */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
            <div className="w-4 h-4 bg-emerald-500 rounded-md flex items-center justify-center text-white shrink-0 font-bold text-[8px]">O</div>
             <span className="font-semibold text-slate-600">© {year} {t('brand.full', 'OVDS ovds')}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[9px] text-slate-400 select-none">v{APP_VERSION}</span>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => navigate('/settings?tab=localization')}
              className="flex items-center gap-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
              title={t('footer.change_language', 'Change language')}
            >
              <Icon name="GLOBE" size={9} />
              {LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}
            </button>
          </div>

          {/* Right: status indicators */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Icon name="SUCCESS" size={9} />
              <span className="uppercase tracking-wider">TLS</span>
            </div>
            <span className="text-slate-200">·</span>
            {serverOk !== null && (
              <>
                <button
                  onClick={checkServer}
                  title={lastChecked ? `Last checked: ${fmtTime(lastChecked)}` : 'Check server'}
                  className={`flex items-center gap-1 font-semibold transition-colors ${
                    serverOk ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {checking ? <Icon name="REFRESH" size={9} className="animate-spin" /> : <Icon name="ACTIVITY" size={9} />}
                  <span>{serverOk ? 'API ONLINE' : 'API DOWN'}</span>
                </button>
                {latencyMs !== null && serverOk && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span className={`flex items-center gap-0.5 font-mono font-semibold ${
                      latencyMs < 200 ? 'text-emerald-600'
                        : latencyMs < 600 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      <Icon name="ZAP" size={9} />{latencyMs}ms
                    </span>
                  </>
                )}
                <span className="text-slate-200">·</span>
              </>
            )}
            <div
              role="status"
              aria-label={online ? 'Online' : 'Offline'}
              className={`flex items-center gap-1 font-semibold ${online ? 'text-emerald-600' : 'text-rose-500'}`}
            >
              {online ? <Icon name="WIFI" size={9} /> : <Icon name="WIFI_OFF" size={9} />}
              <span>{online ? t('footer.online', 'ONLINE') : t('footer.offline', 'OFFLINE')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

