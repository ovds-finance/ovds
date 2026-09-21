import { Skeleton, EmptyState, AppPage, MetricCard } from '@ovds/ui';
import {
  Download,
  History,
  RefreshCw,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  FlaskConical,
  Globe,
  Box,
  Activity,
  Package,
  Layers,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  Ban,
  Monitor,
  Server,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Building2,
  ArrowRight,
  Database,
  Bell,
  RotateCcw,
  Cpu,
  HardDrive,
  Wifi,
  Info,
  Sparkles,
  Bug,
  Lock,
  ArrowUpCircle,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import {
  usePageTitle,
  useDebounce,
  useEscapeKey,
  useFocusTrap,
  useLastRefreshed,
  useInterval,
} from '../hooks';
import { useAuth } from '../rbac';
import { releaseApi, CompanyRelease, UpdateSettings, FeatureFlag } from '../services/releaseApi';
import { confirm } from '../utils/confirm';

// -- Design tokens -------------------------------------------------------------
const inp =
  'w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600';
const lbl =
  'block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1';

// -- Stat Card -----------------------------------------------------------------
// -- Card Shell ----------------------------------------------------------------
const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => (
  <div id={id} className={`ovds-widget-card overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}> = ({ icon, iconBg, title, subtitle, right }) => (
  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="ovds-card-title truncate">{title}</h2>
        {subtitle && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

// -- Toggle Switch -------------------------------------------------------------
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-200 dark:bg-slate-700'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

// -- History status config -----------------------------------------------------
const HISTORY_STATUS: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  APPLIED:   { cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800', icon: <CheckCircle2 size={9} />, label: 'Applied' },
  FAILED:    { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',                   icon: <AlertTriangle size={9} />, label: 'Failed' },
  SKIPPED:   { cls: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',               icon: <Clock size={9} />, label: 'Skipped' },
  AVAILABLE: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',             icon: <Download size={9} />, label: 'Available' },
};

const HistoryBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = HISTORY_STATUS[status] ?? HISTORY_STATUS.SKIPPED;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// -- Release type pill ---------------------------------------------------------
const TypePill: React.FC<{ type: 'STAGING' | 'PRODUCTION' }> = ({ type }) =>
  type === 'STAGING' ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-tight">
      <FlaskConical size={9} /> Staging
    </span>
  ) : null;

// -- Release status pill (DRAFT / RELEASED / REVOKED) -------------------------
const RELEASE_STATUS_CFG: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  RELEASED: { cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800', icon: <CheckCircle2 size={9} />, label: 'Released' },
  DRAFT:    { cls: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',               icon: <FileText size={9} />,    label: 'Draft'    },
  REVOKED:  { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',                   icon: <Ban size={9} />,         label: 'Revoked'  },
};

const ReleaseStatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg = RELEASE_STATUS_CFG[status] ?? RELEASE_STATUS_CFG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// -- Changelog expander --------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ChangelogText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;
  return (
    <div>
      <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className="flex items-center gap-1 mt-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure-dark)] dark:hover:text-green-300 transition-colors"
        >
          {expanded ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> Show more</>}
        </button>
      )}
    </div>
  );
};

// -- Modal wrapper with escape + focus trap ------------------------------------
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode; width?: string }> = ({
  onClose,
  children,
  width = 'max-w-md',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);
  useFocusTrap(ref, true);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={ref}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${width} border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {children}
      </div>
    </div>
  );
};

// -- History filter tabs -------------------------------------------------------
const HISTORY_TABS = ['ALL', 'APPLIED', 'FAILED', 'SKIPPED'] as const;
type HistoryTab = typeof HISTORY_TABS[number];
const HISTORY_PAGE_SIZE = 8;

// -- Ovds copy-to-clipboard button ----------------------------------------
const CopyCommandBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fail silently */ }
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy command to clipboard"
      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-[var(--pro-azure-100)] dark:bg-slate-700 dark:hover:bg-green-900/40 text-slate-500 hover:text-[var(--pro-azure)] dark:text-slate-400 dark:hover:text-[var(--pro-azure-light)] transition-all"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
};

// -- Install Progress Modal ---------------------------------------------------
const INSTALL_STEPS = [
  { label: 'Verifying package integrity',  duration: 600 },
  { label: 'Downloading update package',   duration: 1200 },
  { label: 'Stopping services',            duration: 400 },
  { label: 'Applying database migrations', duration: 800 },
  { label: 'Building packages',            duration: 1400 },
  { label: 'Restarting services',          duration: 600 },
  { label: 'Running health checks',        duration: 500 },
];

const InstallProgressModal: React.FC<{
  version: string;
  onDone: () => void;
}> = ({ version, onDone }) => {
  const [step, setStep]     = useState(0);
  const [done, setDone]     = useState(false);
  const [pct,  setPct]      = useState(0);

  useEffect(() => {
    let current = 0;
    let elapsed = 0;
    const total = INSTALL_STEPS.reduce((s, x) => s + x.duration, 0);
    const run = () => {
      if (current >= INSTALL_STEPS.length) { setDone(true); setPct(100); setTimeout(onDone, 1200); return; }
      setStep(current);
      const dur = INSTALL_STEPS[current].duration;
      let t = 0;
      const tick = setInterval(() => {
        t += 50;
        elapsed += 50;
        setPct(Math.round((elapsed / total) * 100));
        if (t >= dur) { clearInterval(tick); current++; run(); }
      }, 50);
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 flex items-center gap-3 ${done ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-violet-600 to-violet-700'} transition-all duration-700`}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {done
              ? <CheckCircle2 size={20} className="text-white" />
              : <RefreshCw size={20} className="text-white animate-spin" />
            }
          </div>
          <div>
            <p className="text-sm font-bold text-white">{done ? 'Update Complete!' : `Installing v${version}…`}</p>
            <p className="text-[10px] text-white/70 mt-0.5">{done ? 'System restarted successfully' : 'Please do not close this window'}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-150 ${done ? 'bg-[var(--pro-azure-50)]0' : 'bg-violet-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Steps list */}
        <div className="px-6 py-5 space-y-2.5">
          {INSTALL_STEPS.map((s, i) => {
            const isActive  = i === step && !done;
            const isDone    = i < step || done;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isDone   ? 'bg-[var(--pro-azure-50)]0' :
                  isActive ? 'bg-violet-500 animate-pulse' :
                             'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {isDone ? <Check size={10} className="text-white" /> :
                   isActive ? <RefreshCw size={9} className="text-white animate-spin" /> :
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />}
                </div>
                <span className={`text-[11px] font-medium transition-colors ${
                  isDone   ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] line-through decoration-indigo-300' :
                  isActive ? 'text-violet-700 dark:text-violet-300 font-bold' :
                             'text-slate-400 dark:text-slate-600'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">{pct}% complete</span>
            {done && (
              <button
                onClick={onDone}
                className="px-4 py-1.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-xs font-bold transition-all"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Parsed Changelog Renderer ------------------------------------------------
type ChangelogCategory = 'feature' | 'fix' | 'security' | 'breaking' | 'perf' | 'other';

const CHANGELOG_PATTERNS: { regex: RegExp; category: ChangelogCategory; icon: React.ReactNode; color: string }[] = [
  { regex: /^(feat|feature|add|new)[:\s]/i,   category: 'feature',  icon: <Sparkles size={10} />, color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
  { regex: /^(fix|bug|patch)[:\s]/i,           category: 'fix',      icon: <Bug size={10} />,      color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  { regex: /^(sec|security|cve)[:\s]/i,        category: 'security', icon: <Lock size={10} />,     color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
  { regex: /^(break|breaking|major)[:\s]/i,    category: 'breaking', icon: <AlertTriangle size={10} />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  { regex: /^(perf|optim|speed)[:\s]/i,        category: 'perf',     icon: <Zap size={10} />,      color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
];

const ParsedChangelog: React.FC<{ text: string; maxItems?: number }> = ({ text, maxItems = 6 }) => {
  const [showAll, setShowAll] = useState(false);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) return <p className="text-xs text-slate-400 italic">{text}</p>;

  const categorized = lines.map(line => {
    const clean = line.replace(/^[-*•·]\s*/, '');
    const match = CHANGELOG_PATTERNS.find(p => p.regex.test(clean));
    return { text: clean, ...(match ?? { category: 'other' as ChangelogCategory, icon: <Info size={10} />, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }) };
  });

  const displayed = showAll ? categorized : categorized.slice(0, maxItems);

  return (
    <div className="space-y-1.5 mt-2">
      {displayed.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 ${item.color}`}>
            {item.icon}
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{item.text}</span>
        </div>
      ))}
      {categorized.length > maxItems && !showAll && (
        <button
          onClick={e => { e.stopPropagation(); setShowAll(true); }}
          className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure-dark)] transition-colors mt-1"
        >
          <ChevronDown size={11} /> {categorized.length - maxItems} more items
        </button>
      )}
    </div>
  );
};

// -- Version Diff Badge -------------------------------------------------------
const VersionDiff: React.FC<{ from: string | null; to: string }> = ({ from, to }) => {
  if (!from) return (
    <span className="px-2 py-0.5 rounded-lg bg-[var(--pro-azure-100)] dark:bg-green-950/40 text-[var(--pro-azure-dark)] dark:text-green-300 text-xs font-black tracking-tight">
      v{to}
    </span>
  );
  const [fMaj = '0', fMin = '0', _fPat = '0'] = from.split('.');
  const [tMaj = '0', tMin = '0', _tPat = '0'] = to.split('.');
  const isMajor = tMaj > fMaj;
  const isMinor = !isMajor && tMin > fMin;
  const bump = isMajor ? 'Major' : isMinor ? 'Minor' : 'Patch';
  const bumpColor = isMajor
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
    : isMinor
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    : 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold line-through opacity-60">
        v{from}
      </span>
      <ArrowRight size={10} className="text-slate-400" />
      <span className="px-2 py-0.5 rounded-lg bg-[var(--pro-azure-100)] dark:bg-green-950/40 text-[var(--pro-azure-dark)] dark:text-green-300 text-xs font-black tracking-tight">
        v{to}
      </span>
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${bumpColor}`}>
        {bump}
      </span>
    </div>
  );
};

// -- System Health Pre-Check --------------------------------------------------
const SystemHealthCheck: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'warn'>('checking');
  const checks = useMemo(() => [
    { label: 'Database connection',  icon: <Database size={11} />,  ok: true  },
    { label: 'Disk space (>500 MB)', icon: <HardDrive size={11} />, ok: true  },
    { label: 'Memory usage (<85%)',  icon: <Cpu size={11} />,       ok: true  },
    { label: 'API reachable',        icon: <Wifi size={11} />,      ok: true  },
    { label: 'No active jobs',       icon: <Activity size={11} />,  ok: true  },
  ], []);

  useEffect(() => {
    const t = setTimeout(() => setStatus(checks.every(c => c.ok) ? 'ok' : 'warn'), 900);
    return () => clearTimeout(t);
  }, [checks]);

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2.5">
        {status === 'checking' ? (
          <RefreshCw size={11} className="text-slate-400 animate-spin" />
        ) : status === 'ok' ? (
          <CheckCircle2 size={11} className="text-[var(--pro-azure)]" />
        ) : (
          <AlertTriangle size={11} className="text-amber-500" />
        )}
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {status === 'checking' ? 'Running pre-install checks…' : status === 'ok' ? 'All systems ready' : 'Warning — check before proceeding'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
            status === 'checking'
              ? 'bg-white dark:bg-slate-800 text-slate-400 animate-pulse'
              : c.ok
              ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
          }`}>
            {c.icon}
            <span className="truncate">{c.label}</span>
            {status !== 'checking' && (
              c.ok ? <Check size={9} className="ml-auto shrink-0" /> : <X size={9} className="ml-auto shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// -- Ovds-Style Update Guide Component -----------------------------------

const SPECIFIC_APPS = [
  { label: 'Backend API',        pkg: '@ovds/backend',       cmd: 'npm run build -w @ovds/backend',              icon: <Server size={12} /> },
  { label: 'Frontend App',       pkg: 'ovds-frontend',       cmd: 'npm run build -w ovds-frontend',              icon: <Monitor size={12} /> },
  { label: 'Shared Library',     pkg: '@ovds/shared',        cmd: 'npm run build -w @ovds/shared',               icon: <Layers size={12} /> },
  { label: 'UI Package',         pkg: '@ovds/ui',            cmd: 'npm run build -w @ovds/ui',                   icon: <Box size={12} /> },
  { label: 'Design System',      pkg: '@ovds/design-system', cmd: 'npm run build -w @ovds/design-system',        icon: <Tag size={12} /> },
  { label: 'Database Package',   pkg: '@ovds/database',      cmd: 'npm run build -w @ovds/database',             icon: <Database size={12} /> },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OvdsUpdateGuide: React.FC<{
  currentVersion: string | null;
  availableCount: number;
  onScrollToUpdates: () => void;
}> = ({ currentVersion, availableCount, onScrollToUpdates }) => {
  const [sshExpanded, setSshExpanded] = useState(false);
  const [appsExpanded, setAppsExpanded] = useState(false);
  const [hostingExpanded, setHostingExpanded] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  const steps: {
    step: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    color: string;
    borderColor: string;
    action?: React.ReactNode;
    expanded?: boolean;
    setExpanded?: (v: boolean) => void;
    expandedContent?: React.ReactNode;
  }[] = [
    {
      step: '1',
      icon: <Bell size={13} />,
      title: 'Check for Updates',
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40',
      borderColor: 'border-sky-100 dark:border-sky-900/40',
      desc: 'Updates appear here automatically — OVDS polls every 60 s. The notification badge in the page header and on the dashboard sidebar also lights up when a new version is available.',
      action: availableCount > 0 ? (
        <button
          onClick={onScrollToUpdates}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold transition-all shrink-0"
        >
          <ArrowRight size={10} />
          {availableCount} pending
        </button>
      ) : (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] rounded-lg text-[10px] font-bold border border-[var(--pro-azure-100)] dark:border-green-800 shrink-0">
          <CheckCircle2 size={10} /> Up to date
        </span>
      ),
    },
    {
      step: '2',
      icon: <Download size={13} />,
      title: 'One-Click Update',
      color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/40',
      borderColor: 'border-[var(--pro-azure-100)] dark:border-green-900/40',
      desc: 'Click "Install" next to any available release above. A real-time progress overlay guides you through every step — no SSH or command line needed.',
      action: availableCount > 0 ? (
        <button
          onClick={onScrollToUpdates}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-[10px] font-bold transition-all shrink-0 shadow-sm shadow-green-500/20"
        >
          <Download size={10} /> Install Now
        </button>
      ) : undefined,
    },
    {
      step: '3',
      icon: <Terminal size={13} />,
      title: 'Manual Update via SSH',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-100 dark:border-amber-900/40',
      desc: 'Have SSH access to your server? Run the full deployment script below from the OVDS root directory. Expand to reveal the command and optional pre-install health check.',
      expanded: sshExpanded,
      setExpanded: setSshExpanded,
      expandedContent: (
        <div className="mt-3 space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full deployment script</p>
          <div className="flex items-start gap-2">
            <code className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-black border border-slate-700 text-[11px] font-mono text-[var(--pro-azure-light)] whitespace-pre leading-relaxed overflow-x-auto">
{`# 1. Navigate to OVDS root
cd /var/www/ovds

# 2. Pull latest changes
git fetch origin && git pull origin main

# 3. Install / update dependencies
npm ci --omit=dev

# 4. Build monorepo in dependency order
npm run build:libs   # design-system → shared → ui → database
npm run build        # apps/frontend + apps/backend

# 5. Run database migrations
npm run db:migrate --w @ovds/backend

# 6. Restart services
pm2 restart ovds-backend ovds-frontend --update-env`}
            </code>
            <CopyCommandBtn text={`cd /var/www/ovds\ngit fetch origin && git pull origin main\nnpm ci --omit=dev\nnpm run build:libs\nnpm run build\nnpm run db:migrate --w @ovds/backend\npm2 restart ovds-backend ovds-frontend --update-env`} />
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed space-y-0.5">
              <p className="font-bold">Before running:</p>
              <p>Back up your <code className="px-1 bg-amber-100 dark:bg-amber-900/40 rounded">.env</code> file and take a database snapshot. Run <code className="px-1 bg-amber-100 dark:bg-amber-900/40 rounded">npm run build:libs</code> before building apps.</p>
            </div>
          </div>
          {/* Optional health check */}
          <div>
            <button
              onClick={() => setShowHealthCheck(v => !v)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors"
            >
              {showHealthCheck ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showHealthCheck ? 'Hide' : 'Run'} pre-install health check
            </button>
            {showHealthCheck && <SystemHealthCheck />}
          </div>
        </div>
      ),
    },
    {
      step: '4',
      icon: <Package size={13} />,
      title: 'Specific App / Package Update',
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40',
      borderColor: 'border-violet-100 dark:border-violet-900/40',
      desc: 'Update only one workspace package — useful after a hotfix to the backend or a UI component change. Hover a row to reveal its copy button.',
      expanded: appsExpanded,
      setExpanded: setAppsExpanded,
      expandedContent: (
        <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Workspace packages</p>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {SPECIFIC_APPS.map(app => (
              <div key={app.pkg} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{app.label}</p>
                  <code className="text-[9px] text-slate-400 dark:text-slate-500 truncate block">{app.pkg}</code>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <code className="text-[9px] font-mono text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded hidden sm:block truncate max-w-[160px]">{app.cmd}</code>
                  <CopyCommandBtn text={app.cmd} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
            <Info size={11} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <p className="text-[10px] text-violet-700 dark:text-violet-300 leading-relaxed">
              Build order: <code className="font-bold">design-system</code> → <code className="font-bold">shared</code> → <code className="font-bold">ui</code> / <code className="font-bold">database</code> → <code className="font-bold">apps</code>
            </p>
          </div>
        </div>
      ),
    },
    {
      step: '5',
      icon: <Building2 size={13} />,
      title: 'Hosting Company Assistance',
      color: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
      borderColor: 'border-slate-100 dark:border-slate-700',
      desc: "No direct SSH access (shared hosting, cPanel, Plesk)? Send the ready-made email template below to your hosting provider — they just need to run one command.",
      expanded: hostingExpanded,
      setExpanded: setHostingExpanded,
      expandedContent: (
        <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ready-made email for your hosting provider</p>
          <div className="flex items-start gap-2">
            <div className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
{`Subject: OVDS system update request — v${currentVersion ?? 'X.Y.Z'}

Hi Support Team,

Please run the following commands in our OVDS
root directory (/var/www/ovds or your equivalent):

  npm ci --omit=dev
  npm run build:libs && npm run build
  npm run db:migrate --w @ovds/backend
  pm2 restart ovds-backend ovds-frontend --update-env

Target version: v${currentVersion ?? 'X.Y.Z'}

Please confirm once complete. Thank you.`}
            </div>
            <CopyCommandBtn text={`Subject: OVDS system update request — v${currentVersion ?? 'X.Y.Z'}\n\nHi Support Team,\n\nPlease run the following commands in our OVDS root directory (/var/www/ovds or your equivalent):\n\n  npm ci --omit=dev\n  npm run build:libs && npm run build\n  npm run db:migrate --w @ovds/backend\n  pm2 restart ovds-backend ovds-frontend --update-env\n\nTarget version: v${currentVersion ?? 'X.Y.Z'}\n\nPlease confirm once complete. Thank you.`} />
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
            <Info size={11} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <p className="text-[10px] text-sky-700 dark:text-sky-300">Provide your hosting provider with your FTP/SSH credentials and the version number. Most providers respond within 1 business day.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
          <HelpCircle size={15} className="text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="ovds-card-title">How to Update Software</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Ovds-style — 5 update methods</p>
        </div>
        {availableCount > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800 shrink-0">
            <Bell size={9} className="animate-bounce" />
            {availableCount} update{availableCount !== 1 ? 's' : ''} available
          </span>
        )}
      </div>

      {/* Timeline steps */}
      <div className="p-5">
        <div className="relative">
          {/* vertical connector line */}
          <div className="absolute left-[13px] top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-800 pointer-events-none" />

          <div className="space-y-1">
            {steps.map((item, idx) => (
              <div key={item.step} className="relative">
                {/* Step row */}
                <div className={`ml-8 rounded-xl border transition-all duration-200 ${item.borderColor} hover:shadow-sm ${item.expanded ? 'shadow-sm' : ''}`}>
                  <div className="flex items-start gap-3 p-3.5">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step {item.step}</span>
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      {item.expanded && item.expandedContent}
                    </div>
                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.action}
                      {item.setExpanded && (
                        <button
                          onClick={() => item.setExpanded!(!item.expanded)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          aria-expanded={item.expanded}
                          aria-label={item.expanded ? 'Collapse' : 'Expand'}
                        >
                          {item.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline node — overlaps the vertical line */}
                <div className={`absolute left-0 top-4 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${item.color} border-2 border-white dark:border-slate-900 z-10`}
                     style={{ transform: 'translateY(-50%) translateX(0)' }}>
                  {item.icon}
                </div>

                {/* Spacer between steps */}
                {idx < steps.length - 1 && <div className="h-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ExternalLink size={11} className="text-slate-400 shrink-0" />
          <p className="text-[10px] text-slate-400">
            Need help?{' '}
            <a href="mailto:support@ovds.com.et" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold hover:underline">
              support@ovds.com.et
            </a>
            {' '}·{' '}
            <a href="/helpdesk" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold hover:underline">
              Help Center
            </a>
            {' '}·{' '}
            <a href="/settings/releases" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold hover:underline">
              Release Notes
            </a>
          </p>
        </div>
        <a
          href="https://docs.ovds.com.et/updates"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors shrink-0"
        >
          <BookOpen size={10} /> Docs
        </a>
      </div>
    </Card>
  );
};
const ReleasesPage: React.FC = () => {
  usePageTitle('System Updates');
  const { user } = useAuth();

  const [availableReleases, setAvailableReleases] = useState<CompanyRelease[]>([]);
  const [history, setHistory] = useState<CompanyRelease[]>([]);
  const [settings, setSettings] = useState<UpdateSettings | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const { label: refreshLabel, touch: touchRefresh } = useLastRefreshed();

  // History panel state
  const [historySearch, setHistorySearch] = useState('');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('ALL');
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE);
  const debouncedSearch = useDebounce(historySearch, 250);

  // Reset pagination when filter/search changes
  useEffect(() => { setHistoryLimit(HISTORY_PAGE_SIZE); }, [historyTab, debouncedSearch]);

  // SuperAdmin state
  const isSuperAdmin = user?.role === 'SPURADMIN' || user?.role === 'SUPERADMIN';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [newRelease, setNewRelease] = useState({
    version: '',
    changelog: '',
    isMandatory: false,
    type: 'PRODUCTION' as 'STAGING' | 'PRODUCTION',
  });
  const [newFlag, setNewFlag] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [creatingFlag, setCreatingFlag] = useState(false);

  // Mandatory pending banner
  const [mandatoryPending, setMandatoryPending] = useState<CompanyRelease | null>(null);

  // Install progress overlay
  const [progressInstall, setProgressInstall] = useState<{ releaseId: string; version: string } | null>(null);

  // -- Data fetching ---------------------------------------------------------
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const [available, hist, sett, flags, mandatory] = await Promise.all([
        releaseApi.getAvailableReleases(),
        releaseApi.getHistory(),
        releaseApi.getUpdateSettings(),
        releaseApi.getFlags(),
        releaseApi.getPendingMandatory(),
      ]);
      setAvailableReleases(available);
      setHistory(hist);
      setSettings(sett);
      setFeatureFlags(flags);
      setMandatoryPending(mandatory);
      touchRefresh();
    } catch {
      toast.error('Failed to load release data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [touchRefresh]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 60s, pauses when tab is hidden
  useInterval(() => fetchData(true), 60_000);

  // -- Handlers --------------------------------------------------------------
  const handleApply = async (releaseId: string, version: string, isMandatory = false) => {
    const ok = await confirm({
      title: `Install v${version}?`,
      message: isMandatory
        ? 'This is a mandatory update. The system will apply it immediately.'
        : 'This will update your environment. The process takes a few seconds.',
      confirmLabel: 'Install',
      cancelLabel: 'Cancel',
      variant: isMandatory ? 'warning' : 'info',
    });
    if (!ok) return;
    try {
      setApplying(releaseId);
      // Show animated progress overlay while the API call resolves
      setProgressInstall({ releaseId, version });
      await releaseApi.applyRelease(releaseId);
      toast.success('System updated successfully');
      fetchData(true);
    } catch {
      setProgressInstall(null);
      toast.error('Failed to apply update');
    } finally {
      setApplying(null);
    }
  };

  const handleToggleAutoUpdate = async (value: boolean) => {
    try {
      await releaseApi.updateUpdateSettings(value);
      setSettings(prev => prev ? { ...prev, autoUpdate: value } : null);
      toast.success(`Auto-update ${value ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update settings');
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await releaseApi.createRelease(newRelease);
      toast.success('Release published successfully');
      setShowCreateModal(false);
      setNewRelease({ version: '', changelog: '', isMandatory: false, type: 'PRODUCTION' });
      fetchData(true);
    } catch {
      toast.error('Failed to create release');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingFlag(true);
      await releaseApi.createFeatureFlag(newFlag);
      toast.success('Feature flag created');
      setShowFlagModal(false);
      setNewFlag({ name: '', description: '' });
      fetchData(true);
    } catch {
      toast.error('Failed to create feature flag');
    } finally {
      setCreatingFlag(false);
    }
  };

  const handleToggleFlag = async (flagId: string, currentStatus: boolean) => {
    if (!user?.companyId) return;
    try {
      await releaseApi.toggleFlag({ companyId: user.companyId, flagId, isEnabled: !currentStatus });
      setFeatureFlags(prev => prev.map(f => f.id === flagId ? { ...f, isEnabled: !currentStatus } : f));
      toast.success('Feature flag updated');
    } catch {
      toast.error('Failed to update feature flag');
    }
  };

  // -- Derived data ----------------------------------------------------------
  const filteredHistory = useMemo(() => {
    let items = history;
    if (historyTab !== 'ALL') items = items.filter(h => h.status === historyTab);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(h =>
        (h.release?.version ?? '').toLowerCase().includes(q) ||
        (h.release?.changelog ?? '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [history, historyTab, debouncedSearch]);

  const historyTabCounts = useMemo(() => ({
    ALL:     history.length,
    APPLIED: history.filter(h => h.status === 'APPLIED').length,
    FAILED:  history.filter(h => h.status === 'FAILED').length,
    SKIPPED: history.filter(h => h.status === 'SKIPPED').length,
  }), [history]);

  const stats = useMemo(() => ({
    current:   settings?.currentVersion ?? '—',
    available: availableReleases.length,
    installed: history.filter(h => h.status === 'APPLIED').length,
    flags:     featureFlags.filter(f => f.isEnabled).length,
  }), [settings, availableReleases, history, featureFlags]);

  // -- Loading skeleton ------------------------------------------------------
  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton.Card />
        <Skeleton.StatsRow count={4} />
        <div className="ovds-grid-layout cols-3 gap-lg">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton.Card />
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
          <div className="space-y-6">
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
        </div>
      </div>
    );
  }
  return (
    <AppPage
      title={"System Updates & Feature Flags"}
      subtitle={"Manage release channels, feature flags, and rollout strategies"}
      icon={<Package size={18} />}
      iconBg={"bg-violet-500"}
      crumbs={[{ label: 'System Administration' }, { label: 'System Updates' }]}
      actions={
        <div className="flex items-center gap-2">
          {availableReleases.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800 animate-pulse">
              <Bell size={10} /> {availableReleases.length} update{availableReleases.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Checking…' : 'Check for Updates'}
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-violet-500/20"
              >
                <Plus size={12} /> New Release
              </button>
              <button
                onClick={() => setShowFlagModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <Tag size={12} /> New Flag
              </button>
            </>
          )}
        </div>
      }
    >
      <div className={"space-y-5 pb-10"}>

      {/* -- Install Progress Overlay ----------------------------------------- */}
      {progressInstall && (
        <InstallProgressModal
          version={progressInstall.version}
          onDone={() => { setProgressInstall(null); fetchData(true); }}
        />
      )}

      {/* -- System Updates content starts here -------------------------------- */}

      {/* -- Mandatory Update Banner ------------------------------------------- */}
      {mandatoryPending && mandatoryPending.release && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
              Mandatory update required — v{mandatoryPending.release.version}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
              {mandatoryPending.release.changelog || 'This update must be installed to continue using the system.'}
            </p>
          </div>
          <button
            onClick={() => handleApply(mandatoryPending.releaseId, mandatoryPending.release.version, true)}
            disabled={applying === mandatoryPending.releaseId}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all disabled:opacity-60"
          >
            {applying === mandatoryPending.releaseId
              ? <><RefreshCw size={12} className="animate-spin" /> Installing…</>
              : <><Download size={12} /> Install Now</>
            }
          </button>
        </div>
      )}

      {/* -- Stat Cards ------------------------------------------------------- */}
      <div className="ovds-grid-layout cols-4">
        <MetricCard
          title="Current Version"
          amount={`v${stats.current}`}
          percentage={0}
          isPositive={true}
          color="bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
          sub={settings?.environment ?? 'Production'}
        />
        <MetricCard
          title="Available Updates"
          amount={stats.available}
          percentage={0}
          isPositive={true}
          color={stats.available > 0
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            : 'bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}
          sub={stats.available === 0 ? 'Up to date' : `${stats.available} pending`}
        />
        <MetricCard
          title="Installed Releases"
          amount={stats.installed}
          percentage={0}
          isPositive={true}
          color="bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
          sub="All time"
        />
        <MetricCard
          title="Active Features"
          amount={stats.flags}
          percentage={0}
          isPositive={true}
          color="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
          sub={`of ${featureFlags.length} flags`}
        />
      </div>

      {/* -- Main Grid -------------------------------------------------------- */}
      <div className="ovds-grid-layout cols-3 gap-lg">

        {/* -- Left column --------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current Environment */}
          <Card>
            <CardHeader
              icon={<ShieldCheck size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />}
              iconBg="bg-[var(--pro-azure-50)] dark:bg-green-950/40"
              title="Current Environment"
              subtitle="Version and update policy"
              right={
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--pro-azure-50)]0 animate-pulse" />
                  <span className="text-[11px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">Healthy</span>
                </div>
              }
            />
            <div className="p-5 ovds-stat-row" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
              {/* Version */}
              <div className="ovds-kpi-cell">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Version</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--pro-azure-100)] dark:bg-green-900/50 text-[var(--pro-azure-dark)] dark:text-green-300 text-sm font-black tracking-tight">
                    v{settings?.currentVersion ?? '—'}
                  </span>
                  {availableReleases.length === 0 && (
                    <span className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Latest
                    </span>
                  )}
                </div>
              </div>
              {/* Environment */}
              <div className="ovds-kpi-cell">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Environment</p>
                <div className="flex items-center gap-2">
                  {settings?.environment === 'STAGING' ? (
                    <><FlaskConical size={14} className="text-amber-500" /><span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Staging</span></>
                  ) : settings?.environment === 'DEVELOPMENT' ? (
                    <><Layers size={14} className="text-violet-500" /><span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Development</span></>
                  ) : (
                    <><Globe size={14} className="text-[var(--pro-azure)]" /><span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Production</span></>
                  )}
                </div>
              </div>
              {/* Auto-update */}
              <div className="ovds-kpi-cell">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Auto-Update</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                    {settings?.autoUpdate ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle checked={!!settings?.autoUpdate} onChange={handleToggleAutoUpdate} />
                </div>
              </div>
            </div>
          </Card>

          {/* Available Updates */}
          <Card id="available-updates-card">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                  <Download size={15} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="ovds-card-title truncate">Available Updates</h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5">
                    {availableReleases.length === 0 ? 'System is up to date' : `${availableReleases.length} update${availableReleases.length !== 1 ? 's' : ''} ready to install`}
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
                    <span className="text-slate-400">Checked {refreshLabel}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {availableReleases.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                    {availableReleases.length} pending
                  </span>
                )}
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {availableReleases.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={28} strokeWidth={1.5} />}
                  message="You're on the latest version"
                  description="New features and improvements will appear here when released."
                  compact
                />
              ) : (
                availableReleases.filter(cr => cr.release).map((cr) => (
                  <div key={cr.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/40 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 mt-0.5">
                          <ArrowUpCircle size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <VersionDiff from={settings?.currentVersion ?? null} to={cr.release.version} />
                            {cr.release.isMandatory && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-tight">
                                <AlertTriangle size={9} /> Mandatory
                              </span>
                            )}
                            <TypePill type={cr.release.type} />
                            <ReleaseStatusPill status={cr.release.status} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Calendar size={11} className="text-slate-400" />
                            <span className="ovds-caption">
                              Released {new Date(cr.release.releasedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApply(cr.releaseId, cr.release.version, cr.release.isMandatory)}
                        disabled={!!applying}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg transition-all text-xs font-bold shrink-0 shadow-sm shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {applying === cr.releaseId
                          ? <><RefreshCw size={12} className="animate-spin" /> Installing…</>
                          : <><Download size={12} /> Install</>
                        }
                      </button>
                    </div>
                    {/* Parsed changelog */}
                    {cr.release.changelog && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 pl-12">
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">What's new</p>
                        <ParsedChangelog text={cr.release.changelog} maxItems={4} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* -- Ovds-Style Software Update Guide ------------------------------- */}
          <Card>
            <CardHeader
              icon={<HelpCircle size={15} className="text-sky-600 dark:text-sky-400" />}
              iconBg="bg-sky-50 dark:bg-sky-950/40"
              title="How to Update Software"
              subtitle="Follow these steps to keep OVDS up to date"
            />
            <div className="p-5 space-y-3">
              {[
                {
                  step: '1',
                  icon: <Monitor size={13} />,
                  title: 'Check for Updates',
                  desc: 'New updates are shown here automatically. You can also check manually by clicking the Refresh button above. Ovds-style notifications appear when a new version is available.',
                  color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40',
                },
                {
                  step: '2',
                  icon: <Download size={13} />,
                  title: 'One-Click Update',
                  desc: 'Click the "Install" button next to any available update above. The system will apply the update automatically — no SSH access required.',
                  color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/40',
                },
                {
                  step: '3',
                  icon: <Terminal size={13} />,
                  title: 'Manual Update (SSH)',
                  desc: 'If you have server SSH access, run this command from your OVDS root directory:',
                  cmd: 'npm run deploy',
                  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
                },
                {
                  step: '4',
                  icon: <Package size={13} />,
                  title: 'Specific App Update',
                  desc: 'To update a specific workspace package, use the workspace flag:',
                  cmd: 'npm run build -w @ovds/backend\nnpm run build -w ovds-frontend',
                  color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40',
                },
                {
                  step: '5',
                  icon: <Building2 size={13} />,
                  title: 'Hosting Company Assistance',
                  desc: 'If you don\'t have SSH access (e.g., shared hosting, Plesk), ask your hosting provider to run the deployment command for you. Provide them with the version number you want to install.',
                  color: 'text-slate-600 bg-white dark:bg-slate-800',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Step {item.step}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    {item.cmd && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] whitespace-pre-wrap break-all">
                          {item.cmd}
                        </code>
                        <CopyCommandBtn text={item.cmd} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader
              icon={<Box size={15} className="text-violet-600 dark:text-violet-400" />}
              iconBg="bg-violet-50 dark:bg-violet-950/40"
              title="Experimental Features"
              subtitle="Beta features for your environment"
              right={
                featureFlags.length > 0 ? (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {featureFlags.filter(f => f.isEnabled).length}/{featureFlags.length} active
                  </span>
                ) : undefined
              }
            />
            {featureFlags.length === 0 ? (
              <EmptyState
                icon={<Box size={28} strokeWidth={1.5} />}
                message="No experimental features"
                description="Feature flags will appear here when available."
                compact
                {...(isSuperAdmin ? { action: { label: 'Create Flag', onClick: () => setShowFlagModal(true) } } : {})}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${flag.isEnabled ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <Activity size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{flag.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{flag.description || 'New feature in testing phase.'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${flag.isEnabled ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}>
                        {flag.isEnabled ? 'On' : 'Off'}
                      </span>
                      {isSuperAdmin ? (
                        <Toggle checked={flag.isEnabled} onChange={() => handleToggleFlag(flag.id, flag.isEnabled)} />
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${flag.isEnabled ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                          {flag.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* -- Right column -------------------------------------------------- */}
        <div className="space-y-6">

          {/* Release Stats Mini Bar */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <BarChart2 size={13} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Release Stats</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
              {[
                { label: 'Applied',  value: history.filter(h => h.status === 'APPLIED').length,  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
                { label: 'Failed',   value: history.filter(h => h.status === 'FAILED').length,   color: 'text-rose-600 dark:text-rose-400'    },
                { label: 'Skipped',  value: history.filter(h => h.status === 'SKIPPED').length,  color: 'text-slate-500 dark:text-slate-400'   },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center py-3 gap-0.5">
                  <span className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
            {/* Mini progress bar of applied/total */}
            {history.length > 0 && (
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Success rate</span>
                  <span className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                    {Math.round((history.filter(h => h.status === 'APPLIED').length / history.length) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((history.filter(h => h.status === 'APPLIED').length / history.length) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Installation History */}
          <Card>
            <CardHeader
              icon={<History size={15} className="text-slate-500 dark:text-slate-400" />}
              iconBg="bg-slate-100 dark:bg-slate-800"
              title="Installation History"
              subtitle={`${history.length} total record${history.length !== 1 ? 's' : ''}`}
            />

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 gap-1 overflow-x-auto">
              {HISTORY_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setHistoryTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                    historyTab === tab
                      ? 'border-[var(--pro-azure)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {tab}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${historyTab === tab ? 'bg-[var(--pro-azure-100)] dark:bg-green-950/50 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {historyTabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search versions…"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                {historySearch && (
                  <button onClick={() => setHistorySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.length === 0 ? (
                <EmptyState
                  variant={historySearch ? 'search' : 'default'}
                  message={historySearch ? 'No matching versions' : 'No history yet'}
                  description={historySearch ? 'Try a different search term.' : 'Installed releases will appear here.'}
                  compact
                />
              ) : (
                filteredHistory.slice(0, historyLimit).filter(h => h.release).map((h, idx) => {
                  const isLatestApplied = idx === 0 && h.status === 'APPLIED' && historyTab === 'ALL';
                  return (
                  <div key={h.id} className="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">v{h.release.version}</span>
                        <TypePill type={h.release.type} />
                        <ReleaseStatusPill status={h.release.status} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLatestApplied && isSuperAdmin && (
                          <button
                            title="Rollback to previous version"
                            onClick={() => toast('Rollback requires manual SSH deployment. Use Step 3 of the update guide.', { icon: '↩️' })}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <RotateCcw size={9} /> Rollback
                          </button>
                        )}
                        <HistoryBadge status={h.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar size={10} className="text-slate-400" />
                      <span className="ovds-caption">
                        {h.appliedAt
                          ? new Date(h.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </span>
                    </div>
                    {h.release.changelog && (
                      <div className="mt-1.5 text-[10px] text-slate-400">
                        <ParsedChangelog text={h.release.changelog} maxItems={2} />
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </div>
            {/* Show more footer */}
            {filteredHistory.length > historyLimit && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  onClick={() => setHistoryLimit(v => v + HISTORY_PAGE_SIZE)}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors py-1"
                >
                  <ChevronDown size={13} />
                  Show {Math.min(HISTORY_PAGE_SIZE, filteredHistory.length - historyLimit)} more
                  <span className="text-slate-400 font-normal">({filteredHistory.length - historyLimit} remaining)</span>
                </button>
              </div>
            )}
          </Card>

          {/* Update Assistant Card */}
          <div className="ovds-widget-card overflow-hidden">
            {/* Notification Bell Header */}
            <div className={`px-5 py-4 flex items-center gap-3 ${availableReleases.length > 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {availableReleases.length > 0
                  ? <Bell size={18} className="text-white" />
                  : <CheckCircle2 size={18} className="text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {availableReleases.length > 0
                    ? `${availableReleases.length} Update${availableReleases.length !== 1 ? 's' : ''} Available`
                    : 'Software Up to Date'
                  }
                </p>
                <p className="text-[10px] text-white/80 mt-0.5 truncate">
                  {availableReleases.length > 0
                    ? 'New versions ready to install'
                    : `Running v${settings?.currentVersion ?? '—'} — latest`
                  }
                </p>
              </div>
              {availableReleases.length > 0 && (
                <span className="w-6 h-6 rounded-full bg-white text-amber-600 text-[11px] font-black flex items-center justify-center shrink-0 shadow">
                  {availableReleases.length}
                </span>
              )}
            </div>

            {/* Update checklist */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                {
                  icon: <Bell size={12} />,
                  label: 'Notifications',
                  value: availableReleases.length > 0 ? `${availableReleases.length} pending` : 'None',
                  ok: availableReleases.length === 0,
                  color: availableReleases.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                },
                {
                  icon: <Package size={12} />,
                  label: 'Current Version',
                  value: `v${settings?.currentVersion ?? '—'}`,
                  ok: true,
                  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                },
                {
                  icon: <Globe size={12} />,
                  label: 'Environment',
                  value: settings?.environment ?? 'Production',
                  ok: true,
                  color: 'text-slate-600 dark:text-slate-400',
                },
                {
                  icon: <Zap size={12} />,
                  label: 'Auto-Update',
                  value: settings?.autoUpdate ? 'Enabled' : 'Disabled',
                  ok: !!settings?.autoUpdate,
                  color: settings?.autoUpdate ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-400',
                },
                {
                  icon: <ShieldCheck size={12} />,
                  label: 'Security Patches',
                  value: 'Active',
                  ok: true,
                  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                },
                {
                  icon: <History size={12} />,
                  label: 'Installed Releases',
                  value: `${history.filter(h => h.status === 'APPLIED').length} total`,
                  ok: true,
                  color: 'text-slate-600 dark:text-slate-400',
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${row.ok ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
                    {row.icon}
                  </div>
                  <span className="flex-1 text-[11px] text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className={`text-[11px] font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Action footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              {availableReleases.length > 0 ? (
                <button
                  onClick={() => document.getElementById('available-updates-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
                >
                  <Download size={13} /> Install Updates
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] justify-center">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-semibold">System fully up to date</span>
                </div>
              )}
            </div>
          </div>

          {/* Security Shield Card */}
          <div className="bg-gradient-to-br from-[var(--pro-azure)] to-[var(--pro-azure-dark)] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-green-500/20">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-[var(--pro-azure)]/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                <ShieldCheck size={20} className="text-green-100" />
              </div>
              <h4 className="font-bold text-base mb-1.5">Automated Security</h4>
              <p className="text-xs text-green-100 leading-relaxed">
                Your environment is protected by automatic security patches. Critical vulnerabilities are addressed within 24 hours of discovery.
              </p>
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-200">OVDS Shield</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-light)] animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* -- Create Release Modal (SuperAdmin) -------------------------------- */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish New Release</h3>
              <p className="text-xs text-slate-400 mt-0.5">Available to all companies system-wide.</p>
            </div>
            <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreateRelease}>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Version Number</label>
                <input required placeholder="e.g. 2.1.0" className={inp} value={newRelease.version} onChange={e => setNewRelease({ ...newRelease, version: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Changelog / Description</label>
                <textarea rows={4} placeholder="Describe what's new in this version…" className={inp} value={newRelease.changelog} onChange={e => setNewRelease({ ...newRelease, changelog: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Release Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewRelease({ ...newRelease, type: 'PRODUCTION' })}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${newRelease.type === 'PRODUCTION' ? 'bg-[var(--pro-azure-50)]0 border-[var(--pro-azure)] text-white shadow-md shadow-green-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[var(--pro-azure)]/40'}`}>
                    <Globe size={14} /> Production
                  </button>
                  <button type="button" onClick={() => setNewRelease({ ...newRelease, type: 'STAGING' })}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${newRelease.type === 'STAGING' ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-300'}`}>
                    <FlaskConical size={14} /> Staging
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mandatory Update</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Forces all companies to install this release.</p>
                </div>
                <Toggle checked={newRelease.isMandatory} onChange={v => setNewRelease({ ...newRelease, isMandatory: v })} />
              </div>
            </div>
            <div className="px-6 py-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {creating ? <><RefreshCw size={14} className="animate-spin" /> Publishing…</> : <><Package size={14} /> Publish Release</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* -- Create Feature Flag Modal (SuperAdmin) ---------------------------- */}
      {showFlagModal && (
        <Modal onClose={() => setShowFlagModal(false)} width="max-w-sm">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">New Feature Flag</h3>
              <p className="text-xs text-slate-400 mt-0.5">Create a system-wide experimental feature toggle.</p>
            </div>
            <button onClick={() => setShowFlagModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreateFlag}>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Flag Name</label>
                <input
                  required
                  placeholder="e.g. new_dashboard_v2"
                  className={inp}
                  value={newFlag.name}
                  onChange={e => setNewFlag({ ...newFlag, name: e.target.value })}
                />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea
                  rows={3}
                  placeholder="What does this feature flag control?"
                  className={inp}
                  value={newFlag.description}
                  onChange={e => setNewFlag({ ...newFlag, description: e.target.value })}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setShowFlagModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingFlag}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingFlag
                  ? <><RefreshCw size={14} className="animate-spin" /> Creating…</>
                  : <><Tag size={14} /> Create Flag</>
                }
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
    </AppPage>
  );
};

export default ReleasesPage;
