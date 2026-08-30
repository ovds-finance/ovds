/**
 * Dashboard — CycleIQ-inspired modern executive dashboard
 * Clean white cards, gauge indicators, trend charts, compliance status
 */
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';

// Lazy-load the chart component so recharts + d3 are deferred until after
// the initial Dashboard render (saves ~816 kB from the first-load critical path).
const DashboardTrendChart = lazy(() => import('../components/dashboard/DashboardTrendChart'));
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { useDebounce } from '../hooks';
import api from '../services/api';
import toast from 'react-hot-toast';
import { fmtCompact } from '../utils/fmt';
import {
  FinancialHealthWidget,
  CashFlowWidget,
  SmartAlertsWidget,
  QuickActionsBar,
  StrategicInsightsWidget,
  BusinessCredibilityWidget,
  GrowthInsightsBanner,
  LiveComplianceWidget,
  WhoIsInWidget,
  RecentAttendanceLogs,
  PayrollSummaryWidget,
  PayrollInsightsWidget,
  PayrollActionItems,
  TaxCalendarWidget,
  WeeklyActivityChart,
  LivePnLBanner,
  EmployeeDashboard,
  WelcomeBanner,
  IFRSReadinessWidget,
  ERCAComplianceDashboard,
  ExecutiveSummaryWidget,
  FinancialRatioWidget,
  AccountingChainWidget,
  AccountingSetupHealthWidget,
  AuditReadinessWidget,
  RealtimePresenceWidget,
  RecentInvoicesWidget,
  ExpensesWidget,
  BankingWidget,
  PieBreakdownWidget,
  CompaniesWidget,
  InventoryWidget,
  IotOverviewWidget,
  IotAlertsWidget,
  IotBillingWidget,
  ETaxStatusWidget,
  ReceivablesPayablesWidget,
  CashFlowSummaryWidget,
  AccountBalanceWidget,
  ModuleQuickAccessPanel,
  QuickActionFAB,
} from '../components/dashboard';
import { OvdsKpiCard, OvdsSummaryBar, PaymentVerificationPanel } from '../components/ovds';
import CustomerSummaryCard from '../components/dashboard/CustomerSummaryCard';
import OvdsSummary from '../components/dashboard/OvdsSummary';
import LatestTransactions from '../components/dashboard/LatestTransactions';
import { EthTaxDeadlines } from '../components/ui';
import SoftwareUpdateBanner from '../components/softwareUpdateBanner';
import { usePageTitle } from '../hooks/usePageTitle';
import { Icon } from '../components/ui';
import { Role, useLocalStorage, DashboardSlider, GridLayout, ContextPill, ContextStrip, SectionTitle } from '@ovds/ui';

// -- Gauge / Speedometer SVG component (CycleIQ-style) ------------------------
interface GaugeProps {
  value: number; // 0-100
  color?: string;
  size?: number;
}
const Gauge: React.FC<GaugeProps> = ({ value, color = '#00E784', size = 56 }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  const r = 20;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const circumference = Math.PI * r;
  const pct = Math.min(100, Math.max(0, animated));
  const offset = circumference - (pct / 100) * circumference;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(180));
  const y1 = cy + r * Math.sin(toRad(180));
  const x2 = cx + r * Math.cos(toRad(0));
  const y2 = cy + r * Math.sin(toRad(0));
  const trackColor = color === '#ef4444' ? '#fee2e2' : color === '#f59e0b' ? '#fef3c7' : '#d1fae5';
  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={trackColor} strokeWidth="5" strokeLinecap="round" />
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }} />
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{Math.round(pct)}%</text>
    </svg>
  );
};
// -- Akaunting-style KPI Stat Card --------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  iconBg: string;
  gaugeValue?: number;
  gaugeColor?: string;
  to?: string;
  accent?: string;
  sublabel?: string;
}
const StatCard: React.FC<StatCardProps> = ({
  label, value, trend, icon, iconBg, gaugeValue = 65, gaugeColor = '#10b981', to, accent, sublabel,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  // Animated count-up for numeric values
  const [displayed, setDisplayed] = useState<string | number>(typeof value === 'number' ? 0 : value);
  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const dur = 900;
      const step = 16;
      const inc = end / (dur / step);
      const timer = setInterval(() => {
        start += inc;
        if (start >= end) { clearInterval(timer); setDisplayed(end); }
        else setDisplayed(Math.floor(start));
      }, step);
      return () => clearInterval(timer);
    } else {
      setDisplayed(value);
    }
  }, [value]);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 1.1s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${gaugeValue}%`;
    }, 300);
    return () => clearTimeout(t);
  }, [gaugeValue]);

  const accentColor = accent ?? gaugeColor;

  const content = (
    <div className="group dash-stat-cell overflow-hidden" style={{ cursor: to ? 'pointer' : 'default' }}>
      {/* Top accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: '14px 14px 0 0' }}/>
      {/* Hover tint */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14, opacity: 0, background: `${accentColor}08`, transition: 'opacity .2s', pointerEvents: 'none' }} className="group-hover:opacity-100"/>

      {/* Top row: icon + trend */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, marginTop: 4, position: 'relative' }}>
        {/* Icon square */}
        <div className={`${iconBg}`} style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${accentColor}28` }}>
          {icon}
        </div>
        {/* Trend badge */}
        {trend !== undefined && (
          <span style={{
            fontSize: '.6875rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 2,
            padding: '3px 8px', borderRadius: 999,
            background: trend >= 0 ? 'oklch(0.95 0.05 155)' : 'oklch(0.97 0.03 25)',
            color: trend >= 0 ? 'oklch(0.42 0.16 155)' : 'oklch(0.52 0.18 25)',
            border: `1px solid ${trend >= 0 ? 'oklch(0.88 0.08 155)' : 'oklch(0.92 0.06 25)'}`,
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Label */}
      <p style={{ fontSize: '.6875rem', fontWeight: 700, color: 'oklch(0.60 0.015 258)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</p>

      {/* Value */}
      <p className="ovds-value">{typeof value === 'number' ? displayed.toLocaleString() : value}</p>

      {/* Sublabel */}
      {sublabel && <p style={{ fontSize: '.6875rem', color: 'oklch(0.60 0.015 258)', marginTop: 4, fontWeight: 500 }}>{sublabel}</p>}

      {/* Progress bar */}
      <div style={{ marginTop: 14, height: 4, background: 'oklch(0.94 0.005 258)', borderRadius: 99, overflow: 'hidden' }}>
        <div ref={barRef} style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${accentColor}aa, ${accentColor})`, width: 0 }}/>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ display: 'block' }}>{content}</Link> : content;
};

// -- Compliance Status Row -----------------------------------------------------
interface ComplianceItemProps {
  label: string;
  expires: string;
  status: 'valid' | 'expiring' | 'expired';
}
const ComplianceItem: React.FC<ComplianceItemProps> = ({ label, expires, status }) => {
  const cfg = {
    valid:    { dot: 'bg-emerald-500', bar: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700', label: 'Valid',          icon: '✓' },
    expiring: { dot: 'bg-amber-400',   bar: 'border-amber-400',   badge: 'bg-amber-100 text-amber-700',   label: 'Expiring Soon',  icon: '⚠' },
    expired:  { dot: 'bg-slate-400',   bar: 'border-rose-400',    badge: 'bg-rose-100 text-rose-700',     label: 'Expired',        icon: '✕' },
  }[status];
  return (
    <div className={`flex items-center justify-between py-3 pl-3 pr-2 border-b border-slate-50 last:border-0 border-l-2 ${cfg.bar} hover:bg-slate-50/50 transition-colors rounded-r-lg`}>
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
        <div>
          <p className="text-[13px] font-semibold text-slate-700">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Expires: {expires}</p>
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.icon} {cfg.label}</span>
    </div>
  );
};

// -- 7-Day Trend Chart — rendered via lazy DashboardTrendChart ----------------
// (component definition moved to components/Dashboard/DashboardTrendChart.tsx)


// -- AI Forecast Card ----------------------------------------------------------
interface ForecastCardProps {
  nextWeekVolume: string | number;
  forecastPayout: string | number;
  trend?: number;
}
const ForecastCard: React.FC<ForecastCardProps> = ({ nextWeekVolume, forecastPayout, trend = 12 }) => {
  // Mini sparkline bars (simulated forecast trend)
  const bars = [40, 55, 48, 70, 65, 82, 90].map((v, i) => ({ v, i }));
  return (
    <div className="ovds-widget-card p-5 overflow-hidden relative">
      {/* Subtle gradient bg */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, #d1fae5 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center">
            <Icon name="SPARKLES" size={14} className="text-emerald-400" />
          </div>
          <h3 className="ovds-card-title">AI Forecast</h3>
          <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            87% confidence
          </span>
        </div>

        {/* Mini sparkline */}
        <div className="flex items-end gap-1 mb-4" style={{ height: 32 }}>
          {bars.map(b => (
            <div key={b.i} className="flex-1 rounded-t-sm transition-all"
              style={{ height: `${b.v}%`, background: b.i === bars.length - 1 ? '#10b981' : '#e2e8f0' }} />
          ))}
          <div className="flex-1 rounded-t-sm border-2 border-dashed border-emerald-400"
            style={{ height: '95%', background: 'rgba(16,185,129,0.08)' }} />
        </div>

        <div className="ovds-grid-layout cols-2">
          <div>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mb-2.5">
              <Icon name="ITEM" size={15} className="text-slate-500" />
            </div>
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">Next Week</p>
            <p className="text-[22px] font-extrabold text-slate-800 tabular-nums leading-none">{nextWeekVolume}</p>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-0.5">
              ↑ +{trend}% <span className="text-slate-400 font-normal">vs this week</span>
            </p>
          </div>
          <div>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mb-2.5">
              <Icon name="WALLET" size={15} className="text-slate-500" />
            </div>
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">Forecast Payout</p>
            <p className="text-[22px] font-extrabold text-slate-800 tabular-nums leading-none">{forecastPayout}</p>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-0.5">
              ↑ +{trend}% <span className="text-slate-400 font-normal">vs this week</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Environmental / Business Impact Card --------------------------------------
interface ImpactCardProps {
  title: string;
  mainValue: string | number;
  mainLabel: string;
  progressPct: number;
  progressLabel: string;
  stat1Value: string | number;
  stat1Label: string;
  stat2Value: string | number;
  stat2Label: string;
}
const ImpactCard: React.FC<ImpactCardProps> = ({
  title, mainValue, mainLabel, progressPct, progressLabel,
  stat1Value, stat1Label, stat2Value, stat2Label,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 1.2s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${Math.min(100, progressPct)}%`;
    }, 250);
    return () => clearTimeout(t);
  }, [progressPct]);

  const color = progressPct >= 70 ? '#10b981' : progressPct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="ovds-widget-card p-5 overflow-hidden relative">
      <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, transform: 'translate(30%,30%)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Icon name="TREND_UP" size={14} className="text-emerald-600" />
          </div>
          <h3 className="ovds-card-title">{title}</h3>
        </div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[32px] font-extrabold tabular-nums leading-none" style={{ color }}>{mainValue}<span className="text-[18px] text-slate-400 font-bold">%</span></p>
            <p className="text-[11px] text-slate-400 mt-1">{mainLabel}</p>
          </div>
          {/* Circular mini-gauge */}
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4" stroke="#f1f5f9" />
            <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4" stroke={color} strokeLinecap="round"
              strokeDasharray={`${(progressPct / 100) * 125.6} 125.6`}
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)', transformOrigin: '26px 26px', transform: 'rotate(-90deg)' }} />
          </svg>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full mb-1.5 overflow-hidden">
          <div ref={barRef} className="h-full rounded-full" style={{ width: 0, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        </div>
        <p className="text-[10px] text-slate-400 mb-4">{progressLabel}</p>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-[14px] font-extrabold text-slate-700 leading-none">{stat1Value}</p>
              <p className="ovds-caption mt-0.5">{stat1Label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <div>
              <p className="text-[14px] font-extrabold text-slate-700 leading-none">{stat2Value}</p>
              <p className="ovds-caption mt-0.5">{stat2Label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Live Clock + Greeting ------------------------------------------------------
const LiveClock: React.FC<{ name: string }> = ({ name }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const emoji = h < 12 ? '🌅' : h < 17 ? '☀️' : '🌙';
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        {/* Live status dot */}
        <div className="relative w-2 h-2 shrink-0">
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" style={{ animationDuration: '2s' }} />
          <div className="relative w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xl select-none" role="img" aria-label="greeting">{emoji}</span>
        <h1 className="text-[21px] font-extrabold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          {greeting}, <span style={{ color: 'oklch(0.55 0.22 278)' }}>{name.split('@')[0]}</span>
        </h1>
      </div>
      <p className="text-[12px] text-slate-400 flex items-center gap-2 pl-[22px]">
        <span className="tabular-nums font-mono font-semibold text-slate-500 tracking-tight">{timeStr}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
        <span>{dateStr}</span>
      </p>
    </div>
  );
};

// -- Main Dashboard Component --------------------------------------------------
const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`ovds-widget-card p-5 animate-pulse ${className ?? ''}`}>
    <div className="space-y-3">
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-full" />
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
    </div>
  </div>
);

const SkeletonStatCard: React.FC = () => (
  <div className="dash-stat-cell animate-pulse">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  usePageTitle('Dashboard');
  const { user, is } = useAuth();
  const { selectedCompanyId, companies } = useBusiness();
  const [activeTab, setActiveTab] = useState<'overview' | 'hr' | 'ovds' | 'insights'>('overview');

  // -- Multi-dashboard system -------------------------------------------------
  // Synced with DashboardManager via the same localStorage keys
  const [dashboards] = useLocalStorage<Array<{ id: string; name: string; widgets: Array<{ id: string; visible: boolean }> }>>(
    'dashboards_config', []
  );
  const [activeDashIdx, setActiveDashIdx] = useLocalStorage<number>('dashboard_active_idx', 0);
  const activeDash = dashboards[activeDashIdx] ?? dashboards[0] ?? null;

  /** Returns true when a widget should render on the active dashboard.
   *  Falls back to true when no dashboards are configured yet (first run). */
  const widgetVisible = useCallback((widgetId: string): boolean => {
    if (!activeDash) return true;
    const w = activeDash.widgets.find(w => w.id === widgetId);
    if (!w) return true; // widget not yet in config → show by default
    return w.visible;
  }, [activeDash]);

  // -- Attendance state -------------------------------------------------------
  const [whoIsIn, setWhoIsIn] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // -- Data fetching ----------------------------------------------------------
  const { data: dashStats, loading: statsLoading, refetch: refetchStats } = useApiQuery<any>(
    `/dashboard/stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!user, staleTime: 30_000, suppressToast: true }
  );
  const { data: payrollCurrent, refetch: refetchPayroll } = useApiQuery<any>(
    `/payroll/dashboard-stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 60_000, suppressToast: true }
  );
  const { data: invoiceStats, refetch: refetchInvoices } = useApiQuery<any>(
    `/ovds/invoices/stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 30_000, suppressToast: true }
  );
  const { data: recentTransactions } = useApiQuery<any[]>(
    `/banking/transactions?take=8&page=1&sortBy=date&sortOrder=desc${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 30_000, suppressToast: true }
  );
  const { data: reportsData, loading: reportsLoading } = useApiQuery<any>(
    `/dashboard/reports${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 60_000, suppressToast: true }
  );
  const { data: strategicInsights } = useApiQuery<any>(
    `/dashboard/strategic-insights${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!(selectedCompanyId && (is(Role.ADMIN) || is(Role.SPURADMIN))), staleTime: 30_000, suppressToast: true }
  );

  // -- Attendance data --------------------------------------------------------
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedCompanyId) return;
    setAttendanceLoading(true);
    try {
      const [whoRes, logsRes] = await Promise.all([
        api.get(`/hr/attendance/who-is-in?companyId=${selectedCompanyId}`, { headers: { 'x-background': '1' } }),
        api.get(`/hr/attendance?companyId=${selectedCompanyId}&take=50&page=1`, { headers: { 'x-background': '1' } }),
      ]);
      const whoRaw = whoRes.data?.data ?? whoRes.data ?? [];
      setWhoIsIn(Array.isArray(whoRaw) ? whoRaw : []);
      const logsRaw = logsRes.data?.data?.data ?? logsRes.data?.data ?? logsRes.data ?? [];
      setAttendanceLogs(Array.isArray(logsRaw) ? logsRaw : []);
    } catch {
      // silently fail
    } finally {
      setAttendanceLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { fetchAttendanceData(); }, [fetchAttendanceData]);

  const filteredLogs = debouncedSearch
    ? attendanceLogs.filter((l: any) => {
        const name = `${l.employee?.firstName ?? ''} ${l.employee?.lastName ?? ''}`.toLowerCase();
        return name.includes(debouncedSearch.toLowerCase());
      })
    : attendanceLogs;

  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/hr/attendance/verify/${id}`);
      toast.success('Attendance verified');
      fetchAttendanceData();
    } catch {
      toast.error('Failed to verify');
    }
  };

  const exportAttendance = (type: 'csv' | 'pdf') => {
    if (!selectedCompanyId) return;
    window.open(`/api/attendance/export?companyId=${selectedCompanyId}&format=${type}`);
  };

  // -- Refresh all data -------------------------------------------------------
  const refreshAll = useCallback(() => {
    refetchStats();
    refetchPayroll();
    refetchInvoices();
    fetchAttendanceData();
    toast.success('Dashboard refreshed');
  }, [refetchStats, refetchPayroll, refetchInvoices, fetchAttendanceData]);

  const currency = 'ETB';
  const isEmployee = is(Role.EMPLOYEE);
  const isHR = is(Role.HR);
  const isOvds = is(Role.OVDS) || is(Role.ACCOUNTING);
  const isAdmin = is(Role.ADMIN) || is(Role.SPURADMIN);
  const isAuditor = is(Role.AUDITOR) || is(Role.EXTERNAL_AUDITOR);
  const isIfrsOfficer = is(Role.IFRS_OFFICER);

  const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const companyName = companies.find(c => c.id === selectedCompanyId)?.name ?? 'All Companies';
  const fmt = (n: number) => fmtCompact(n, currency);

  // -- Derived stats ----------------------------------------------------------
  const totalEmployees = dashStats?.totalEmployees ?? 0;
  const presentToday   = dashStats?.presentToday ?? 0;
  const netPay         = payrollCurrent?.totalNet ?? payrollCurrent?.currentMonth?.totalPaid ?? 0;
  const overdueCount   = invoiceStats?.overdueCount ?? 0;
  const overdueAmount  = invoiceStats?.overdueAmount ?? 0;
  const thisTotal      = invoiceStats?.thisTotal ?? 0;
  const paidThis       = invoiceStats?.paidThis ?? 0;
  const paidAmount     = invoiceStats?.paidAmount ?? 0;
  const pendingCount   = invoiceStats?.pendingCount ?? 0;
  const pendingAmount  = invoiceStats?.pendingAmount ?? 0;
  const collectionPct  = thisTotal > 0 ? Math.min(100, Math.round((paidAmount / thisTotal) * 100)) : 0;
  const attendancePct  = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  // -- 7-day trend data (from reportsData or fallback) ------------------------
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (reportsData?.weeklyTrend && Array.isArray(reportsData.weeklyTrend)) {
      return reportsData.weeklyTrend.map((v: number, i: number) => ({ day: days[i] ?? `D${i+1}`, value: v }));
    }
    // Fallback placeholder data
    return days.map((day, _i) => ({ day, value: Math.floor(Math.random() * 400000) + 100000 }));
  }, [reportsData]);

  const trendTotal = fmt(trendData.reduce((s: number, d: any) => s + d.value, 0));

  const MiniSparkline: React.FC<{ data: number[]; color: string; stroke?: string }> = ({ data, color, stroke = '#fff' }) => {
    const w = 64, h = 28;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`);
    const poly = pts.join(' ');
    const fill = `0,${h} ${poly} ${w},${h}`;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
        <polygon points={fill} fill={color} fillOpacity="0.18" />
        <polyline points={poly} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const makeSpark = (total: number, count: number) => {
    const base = total / Math.max(count, 1);
    return Array.from({ length: 7 }, (_, i) => base * (0.7 + Math.random() * 0.6));
  };

  // -- Compliance items -------------------------------------------------------
  const complianceItems: Array<{ label: string; expires: string; status: 'valid' | 'expiring' | 'expired' }> = [
    { label: 'Operating License',    expires: 'Dec 2025', status: 'valid' },
    { label: 'Tax Clearance',        expires: 'Dec 2025', status: 'valid' },
    { label: 'Business Registration',expires: 'Dec 2025', status: 'valid' },
    { label: 'Environmental Permit', expires: 'Dec 2025', status: 'expiring' },
  ];

  // -- Employee self-service view ---------------------------------------------
  if (isEmployee && !isAdmin && !isHR && !isOvds) {
    return (
      <div className="p-4 sm:p-6 lg:p-5 max-w-[1400px] mx-auto">
        <EmployeeDashboard user={{ username: user?.username, employeeId: user?.employeeId }} />
      </div>
    );
  }

  // -- No company set up yet --------------------------------------------------
  if (!selectedCompanyId && isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-5 max-w-[1400px] mx-auto">
        <WelcomeBanner />
      </div>
    );
  }

  // -- Tab definitions --------------------------------------------------------
  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    ...(isHR || isAdmin ? [{ id: 'hr' as const, label: 'HR & Attendance' }] : []),
    ...(isOvds || isAdmin ? [{ id: 'ovds' as const, label: 'ovds' }] : []),
    ...(isAdmin || isAuditor || isIfrsOfficer ? [{ id: 'insights' as const, label: 'Insights' }] : []),
  ];

  return (
    <div className="min-h-full dark:bg-slate-950" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: 'oklch(0.978 0.004 258)' }}>

      {/* ── Scoped Dashboard CSS ── */}
      <style>{`
        /* ─── Page background ─────────────────────────────────────── */
        .db-bg { background: oklch(0.976 0.005 258); min-height: 100%; }

        /* ─── KPI stat cards ──────────────────────────────────────── */
        .dash-stat-cell {
          background: #fff !important;
          border: 1px solid oklch(0.91 0.01 258) !important;
          border-radius: 16px !important;
          padding: 20px 20px 16px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 4px 16px -4px rgba(0,0,0,.07) !important;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
          transition: transform 200ms cubic-bezier(.16,1,.3,1), box-shadow 200ms !important;
          position: relative !important; overflow: hidden !important;
        }
        .dash-stat-cell:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 6px 24px -4px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.04) !important;
        }
        .ovds-value {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          letter-spacing: -0.04em !important;
          color: oklch(0.15 0.02 258) !important;
          line-height: 1.1 !important;
        }

        /* ─── Widget cards ─────────────────────────────────────────── */
        .ovds-widget-card {
          background: #fff !important;
          border: 1px solid oklch(0.91 0.01 258) !important;
          border-radius: 16px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,.04) !important;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
        }
        .ovds-card-title {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
          font-size: .875rem !important;
          font-weight: 700 !important;
          color: oklch(0.15 0.02 258) !important;
          letter-spacing: -.02em !important;
        }
        .aki-card {
          border-radius: 16px !important;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
        }

        /* ─── Pill tabs ─────────────────────────────────────────────── */
        .db-tabs {
          display: flex; align-items: center; gap: .375rem;
          padding: .5rem 0 0; overflow-x: auto;
          scrollbar-width: none;
        }
        .db-tabs::-webkit-scrollbar { display: none; }
        .db-tab {
          display: inline-flex; align-items: center; gap: .4375rem;
          padding: .4375rem .9375rem; border-radius: 999px;
          font-size: .8125rem; font-weight: 600; cursor: pointer;
          border: 1.5px solid transparent;
          color: oklch(0.50 0.02 258); background: transparent;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transition: all .18s cubic-bezier(.16,1,.3,1); white-space: nowrap;
          line-height: 1;
        }
        .db-tab:hover {
          color: oklch(0.15 0.02 258);
          background: oklch(0.963 0.008 258);
          border-color: oklch(0.89 0.012 258);
        }
        .db-tab.active {
          color: oklch(0.55 0.22 278);
          background: oklch(0.94 0.04 278);
          border-color: oklch(0.84 0.09 278);
          box-shadow: 0 2px 8px oklch(0.55 0.22 278 / .14);
          font-weight: 700;
        }

        /* ─── Welcome hero ──────────────────────────────────────────── */
        .db-hero {
          background: linear-gradient(135deg, oklch(0.21 0.07 268) 0%, oklch(0.28 0.10 278) 100%);
          border-radius: 20px;
          padding: 1.5rem 2rem;
          position: relative;
          overflow: hidden;
          margin-bottom: .25rem;
        }
        .db-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0V40' fill='none' stroke='rgba(255,255,255,.05)' stroke-width='1'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .db-hero-glow {
          position: absolute; top: -30%; right: -10%;
          width: 50%; padding-bottom: 50%; border-radius: 50%;
          background: radial-gradient(circle, oklch(0.55 0.22 278 / .25) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ─── Section header ────────────────────────────────────────── */
        .db-section {
          margin-top: 2rem; margin-bottom: 1rem;
          display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem;
          padding-bottom: .75rem;
          border-bottom: 1px solid oklch(0.93 0.008 258);
        }
        .db-section-left { display: flex; flex-direction: column; gap: .3rem; }
        .db-section-pill {
          display: inline-flex; align-items: center; gap: .375rem;
          font-size: .6875rem; font-weight: 700; letter-spacing: .04em;
          color: oklch(0.55 0.22 278);
          background: oklch(0.94 0.04 278);
          border: 1px solid oklch(0.84 0.09 278);
          border-radius: 999px; padding: .1875rem .625rem;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          width: fit-content;
        }
        .db-section-title {
          font-size: 1.0625rem; font-weight: 800;
          color: oklch(0.15 0.02 258); letter-spacing: -.025em; line-height: 1.2;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .db-section-sub {
          font-size: .8125rem; color: oklch(0.52 0.018 258);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .db-section-action {
          display: inline-flex; align-items: center; gap: .25rem;
          font-size: .8125rem; font-weight: 700;
          color: oklch(0.55 0.22 278); text-decoration: none;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          white-space: nowrap; flex-shrink: 0;
        }
        .db-section-action:hover { text-decoration: underline; }

        /* ─── Context strip ─────────────────────────────────────────── */
        .ovds-context-strip {
          gap: .375rem !important;
          flex-wrap: wrap !important;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
        }

        /* ─── Summary numbers ───────────────────────────────────────── */
        .db-money-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          background: #fff; border: 1px solid oklch(0.91 0.01 258);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .db-money-cell {
          padding: 1.125rem 1.375rem;
          border-right: 1px solid oklch(0.93 0.008 258);
          position: relative;
        }
        .db-money-cell:last-child { border-right: none; }
        .db-money-label {
          font-size: .6875rem; font-weight: 700; color: oklch(0.60 0.015 258);
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: .375rem;
        }
        .db-money-value {
          font-size: 1.25rem; font-weight: 800; letter-spacing: -.03em;
          color: oklch(0.15 0.02 258); line-height: 1;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .db-money-value.positive { color: oklch(0.48 0.16 155); }
        .db-money-value.negative { color: oklch(0.50 0.18 25); }
        .db-money-sub {
          font-size: .6875rem; color: oklch(0.60 0.015 258);
          margin-top: .25rem; font-weight: 500;
        }
        .db-money-bar {
          height: 2px; background: oklch(0.93 0.008 258);
          margin-top: .625rem; border-radius: 99px; overflow: hidden;
        }
        .db-money-bar-fill {
          height: 100%; border-radius: 99px;
          transition: width 1.1s cubic-bezier(.16,1,.3,1);
        }

        /* ─── Animations ────────────────────────────────────────────── */
        .db-content { animation: db-fade .4s cubic-bezier(.16,1,.3,1) both; }
        @keyframes db-fade { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @media (prefers-reduced-motion: reduce) {
          .db-content, .db-stagger > * { animation: none !important; }
        }
        .db-stagger > *:nth-child(1) { animation: db-fade .4s .00s cubic-bezier(.16,1,.3,1) both }
        .db-stagger > *:nth-child(2) { animation: db-fade .4s .07s cubic-bezier(.16,1,.3,1) both }
        .db-stagger > *:nth-child(3) { animation: db-fade .4s .14s cubic-bezier(.16,1,.3,1) both }
        .db-stagger > *:nth-child(4) { animation: db-fade .4s .21s cubic-bezier(.16,1,.3,1) both }

        /* ─── Compliance rows ───────────────────────────────────────── */
        .db-compliance-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: .625rem .875rem; border-radius: 10px;
          transition: background .14s;
        }
        .db-compliance-row:hover { background: oklch(0.974 0.005 258); }

        /* ─── Scrollbar hide utility ────────────────────────────────── */
        .db-noscroll { scrollbar-width: none; }
        .db-noscroll::-webkit-scrollbar { display: none; }

        /* ─── Ping keyframe for live dot ────────────────────────────── */
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* -- Ethiopian tax deadline banners -- */}
      {(isAdmin || isOvds) && (
        <EthTaxDeadlines onNavigate={(path) => window.__ovds_navigate?.(path)} />
      )}

      {/* -- Software update banner -- */}
      {isAdmin && <SoftwareUpdateBanner onNavigate={(path) => window.__ovds_navigate?.(path)} />}

      {/* ── Akaunting-style Dashboard Sub-header ── */}
      <div className="sticky top-0 z-30 dark:bg-slate-950/90" style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid oklch(0.91 0.01 258)' }}>

        {/* Main header row */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" style={{ height: 56 }}>

          {/* Left: greeting + company context */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  Dashboard
                </h1>
                {selectedCompanyId && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                    <Icon name="COMPANY" size={10} className="text-slate-400 shrink-0"/>
                    <span className="max-w-[160px] truncate">{companyName}</span>
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{monthName}</p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              onClick={refreshAll}
              title="Refresh dashboard"
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 transition-all"
            >
              <Icon name="REFRESH" size={14}/>
            </button>

            {/* Widgets button — violet primary */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('ovds:open-dashboard-manager'))}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-8 text-white rounded-xl text-[12px] font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'oklch(0.55 0.22 278)', boxShadow: '0 2px 8px oklch(0.55 0.22 278 / .30)' }}
            >
              <Icon name="LAYOUT_GRID" size={13}/>
              Widgets
            </button>

            {/* New Invoice — blue */}
            <button
              onClick={() => window.__ovds_navigate?.('/sales/invoices')}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 text-white rounded-xl text-[12px] font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'oklch(0.46 0.22 265)', boxShadow: '0 2px 8px oklch(0.46 0.22 265 / .28)' }}
            >
              <Icon name="PLUS" size={13}/>
              <span className="hidden sm:inline">New Invoice</span>
            </button>
          </div>
        </div>

        {/* Dashboard slider */}
        <div className="px-4 sm:px-6 lg:px-8 pt-1">
          <DashboardSlider
            dashboards={dashboards.length > 0 ? dashboards : [{ id: 'default', name: 'Overview' }]}
            activeIdx={activeDashIdx}
            onSelect={setActiveDashIdx}
          />
        </div>

        {/* ── Pill tabs ── */}
        <div className="db-tabs px-4 sm:px-6 lg:px-8">
          {tabs.map(tab => {
            const tabIcons: Record<string, string> = { overview: 'LAYOUT_GRID', hr: 'USERS', ovds: 'WALLET', insights: 'SPARKLES' };
            const iconName = (tabIcons[tab.id] ?? 'LAYOUT_GRID') as Parameters<typeof Icon>[0]['name'];
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`db-tab${activeTab === tab.id ? ' active' : ''}`}>
                <Icon name={iconName} size={11}/>
                {tab.label}
              </button>
            );
          })}
          {/* Spacer pb for the tabs row */}
          <div style={{ paddingBottom: '.5rem' }}/>
        </div>
      </div>

      {/* -- Content -- */}
      <div key={activeTab} className="db-content p-5 sm:p-6 space-y-5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <style>{`@keyframes dash-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* -- OVERVIEW TAB -- */}
        {activeTab === 'overview' && (
          <>
            {/* ── Akaunting-style Welcome Hero ── */}
            <div className="db-hero">
              <div className="db-hero-glow"/>
              {/* Dot texture */}
              <svg aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .4 }} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="db-hero-dot" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="rgba(255,255,255,.18)"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#db-hero-dot)"/>
              </svg>
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    {/* Greeting */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.5rem' }}>
                      <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#34d399', animation: 'ping 2s ease infinite', opacity: .6 }}/>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', position: 'relative' }}/>
                      </div>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'rgba(255,255,255,.6)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Live Dashboard</span>
                    </div>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: '.375rem' }}>
                      {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, {(user?.username ?? '').split('@')[0] || 'there'} 👋
                    </h2>
                    <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
                      {companyName} · {monthName}
                    </p>
                  </div>

                  {/* Quick stat pills */}
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {attendancePct > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', padding: '.375rem .75rem', borderRadius: 999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.15)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }}/>
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#fff' }}>{attendancePct}% attendance</span>
                      </div>
                    )}
                    {overdueCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', padding: '.375rem .75rem', borderRadius: 999, background: 'rgba(239,68,68,.18)', border: '1px solid rgba(239,68,68,.35)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }}/>
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#fca5a5' }}>{overdueCount} overdue</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', padding: '.375rem .75rem', borderRadius: 999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.15)' }}>
                      <Icon name="USERS" size={11} style={{ color: 'rgba(255,255,255,.7)' }}/>
                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#fff' }}>{totalEmployees} employees</span>
                    </div>
                  </div>
                </div>

                {/* Money row inside hero */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.625rem', marginTop: '1.25rem' }}>
                  {[
                    { label: 'This Month Revenue', value: fmt(thisTotal), color: 'rgba(52,211,153,.9)', sub: `${paidThis} paid` },
                    { label: 'Net Payroll',         value: fmt(netPay),  color: 'rgba(196,181,253,.9)', sub: monthName },
                    { label: 'Pending Invoices',    value: pendingCount.toLocaleString(), color: 'rgba(253,186,116,.9)', sub: fmt(pendingAmount) },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '.75rem 1rem' }}>
                      <p style={{ fontSize: '.5875rem', fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>{item.label}</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 800, color: item.color, letterSpacing: '-.03em', lineHeight: 1 }}>{item.value}</p>
                      <p style={{ fontSize: '.625rem', color: 'rgba(255,255,255,.4)', marginTop: '.25rem', fontWeight: 500 }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Akaunting-style KPI Strip (OvdsSummary) ── */}
            <div>
              <OvdsSummary />
            </div>

            {/* ── Financial Summary ── */}
            {(widgetVisible('receivables-payables') || widgetVisible('cash-flow-summary') || widgetVisible('account-balance')) && (
              <div>
                <div className="db-section">
                  <div className="db-section-left">
                    <span className="db-section-pill"><Icon name="BANKNOTE" size={10}/> Financial</span>
                    <span className="db-section-title">Financial Summary</span>
                    <span className="db-section-sub">Receivables · Payables · Cash Flow · Account Balances</span>
                  </div>
                </div>
                <GridLayout cols={2}>
                  <div className="space-y-4">
                    {widgetVisible('receivables-payables') && <ReceivablesPayablesWidget currency={currency} />}
                    {widgetVisible('account-balance') && <AccountBalanceWidget currency={currency} />}
                  </div>
                  <div>
                    {widgetVisible('cash-flow-summary') && <CashFlowSummaryWidget currency={currency} />}
                  </div>
                </GridLayout>
              </div>
            )}

            {/* ── KPI Stat Cards ── */}
            {statsLoading ? (
              <div className="dash-stat-grid">
                <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
              </div>
            ) : (
              <div className="dash-stat-grid db-stagger">
                {widgetVisible('employees') && <StatCard
                  label="Total Employees"
                  value={totalEmployees}
                  trend={12}
                  icon={<Icon name="USERS" size={19} className="text-emerald-600"/>}
                  iconBg="bg-emerald-50"
                  gaugeValue={attendancePct}
                  gaugeColor="#10b981"
                  accent="#10b981"
                  sublabel={`${attendancePct}% present today`}
                  to="/hr/employees"
                />}
                {widgetVisible('attendance') && <StatCard
                  label="Present Today"
                  value={presentToday}
                  trend={-5}
                  icon={<Icon name="CHECK_CIRCLE" size={19} className="text-blue-500"/>}
                  iconBg="bg-blue-50"
                  gaugeValue={attendancePct}
                  gaugeColor="#3b82f6"
                  accent="#3b82f6"
                  sublabel={`of ${totalEmployees} total`}
                  to="/hr/attendance"
                />}
                {widgetVisible('payroll') && <StatCard
                  label="Net Payroll"
                  value={fmt(netPay)}
                  trend={12}
                  icon={<Icon name="WALLET" size={19} className="text-violet-600"/>}
                  iconBg="bg-violet-50"
                  gaugeValue={collectionPct}
                  gaugeColor="#8b5cf6"
                  accent="#8b5cf6"
                  sublabel={monthName}
                  to="/hr/payroll"
                />}
                {widgetVisible('invoices') && <StatCard
                  label="Active Invoices"
                  value={pendingCount}
                  trend={-12}
                  icon={<Icon name="INVOICE" size={19} className="text-amber-500"/>}
                  iconBg="bg-amber-50"
                  gaugeValue={overdueCount > 0 ? 35 : 80}
                  gaugeColor={overdueCount > 0 ? '#ef4444' : '#10b981'}
                  accent={overdueCount > 0 ? '#ef4444' : '#10b981'}
                  sublabel={overdueCount > 0 ? `${overdueCount} overdue` : 'All on track'}
                  to="/sales/invoices"
                />}
              </div>
            )}

            {/* ── App Store Discovery ── */}
            {isAdmin && (
              <Link
                to="/settings/app-store"
                className="block ovds-widget-card p-5 hover:shadow-md transition-all group"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon name="ITEM" size={22} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ovds-card-title mb-0.5">Explore Modules & Extensions</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Extend your workspace with apps for payments, payroll, VAT, inventory, and more.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    Browse <Icon name="ARROW_RIGHT" size={13} />
                  </div>
                </div>
              </Link>
            )}

            {/* ── Customer summary + Trend chart ── */}
            {statsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="lg:grid-cols-3">
                <SkeletonCard className="lg:col-span-2" /><SkeletonCard />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1rem' }}>
                {widgetVisible('invoices') && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <CustomerSummaryCard
                      paidCount={paidThis} paidAmount={paidAmount}
                      openCount={pendingCount} openAmount={pendingAmount}
                      overdueCount={overdueCount} overdueAmount={overdueAmount}
                      currency={currency} trend={invoiceStats?.trend}
                    />
                  </div>
                )}
                {widgetVisible('cash-flow') && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid oklch(0.91 0.01 258)', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
                    <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'oklch(0.15 0.02 258)', marginBottom: '.25rem', letterSpacing: '-.02em', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Cash Flow Trend</p>
                    <p style={{ fontSize: '.6875rem', color: 'oklch(0.58 0.015 258)', marginBottom: '1rem' }}>7-day revenue movement</p>
                    <Suspense fallback={<div style={{ height: 120, background: 'oklch(0.965 0.007 258)', borderRadius: 10, animation: 'pulse 2s infinite' }}/>}>
                      <DashboardTrendChart title="" data={trendData} total={trendTotal} />
                    </Suspense>
                  </div>
                )}
              </div>
            )}

            {/* Latest Transactions */}
            {widgetVisible('recent-invoices') && (
              <LatestTransactions
                transactions={recentTransactions?.data ?? recentTransactions ?? []}
                currency={currency}
                onViewAll={() => window.__ovds_navigate?.('/sales/invoices')}
              />
            )}

            {/* AI Forecast + Business Performance */}
            {widgetVisible('revenue') && (
              <GridLayout cols={2}>
                <ForecastCard nextWeekVolume={(totalEmployees + 12).toLocaleString()} forecastPayout={fmt(netPay * 1.12)} trend={12}/>
                <ImpactCard title="Business Performance" mainValue={collectionPct} mainLabel="% collection rate" progressPct={collectionPct} progressLabel={`${collectionPct.toFixed(1)}% of monthly target`} stat1Value={invoiceStats?.paidCount ?? 0} stat1Label="Paid Invoices" stat2Value={overdueCount} stat2Label="Overdue"/>
              </GridLayout>
            )}

            {/* Compliance + Alerts */}
            {widgetVisible('vat-status') && (
              <GridLayout cols={2}>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid oklch(0.91 0.01 258)', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,.04)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'oklch(0.95 0.04 155)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="SHIELD_CHECK" size={13} style={{ color: 'oklch(0.42 0.16 155)' }}/>
                    </div>
                    <span style={{ fontSize: '.875rem', fontWeight: 700, color: 'oklch(0.15 0.02 258)', letterSpacing: '-.02em' }}>Compliance Status</span>
                    <span style={{ marginLeft: 'auto', fontSize: '.6875rem', fontWeight: 700, color: 'oklch(0.42 0.16 155)', background: 'oklch(0.95 0.04 155)', border: '1px solid oklch(0.88 0.08 155)', borderRadius: 999, padding: '2px 8px' }}>
                      {complianceItems.filter(i => i.status === 'valid').length}/{complianceItems.length} valid
                    </span>
                  </div>
                  {complianceItems.map((item, i) => <ComplianceItem key={i} {...item}/>)}
                </div>
                {widgetVisible('alerts') && (
                  <SmartAlertsWidget payrollCurrent={payrollCurrent} payrollPrev={null} invoiceStats={invoiceStats} dashStats={dashStats} currency={currency} loading={statsLoading} companyId={selectedCompanyId}/>
                )}
              </GridLayout>
            )}

            {/* Quick Actions */}
            {widgetVisible('quick-actions') && <div><QuickActionsBar /></div>}
            <QuickActionFAB />

            {/* Module Quick Access */}
            {widgetVisible('module-quick-access') && (
              <div>
                <div className="db-section">
                  <div className="db-section-left">
                    <span className="db-section-pill"><Icon name="LAYOUT_GRID" size={10}/> Quick Access</span>
                    <span className="db-section-title">Quick Access</span>
                    <span className="db-section-sub">Items · Sales · Customers · Purchase · Vendors · Banking · Reports</span>
                  </div>
                </div>
                <ModuleQuickAccessPanel />
              </div>
            )}

            {/* Financial Overview */}
            {widgetVisible('financial-health') && (
              <div>
                <div className="db-section">
                  <div className="db-section-left">
                    <span className="db-section-pill"><Icon name="BANKNOTE" size={10}/> Finance</span>
                    <span className="db-section-title">Financial Overview</span>
                    <span className="db-section-sub">Real-time balance sheet and cash position</span>
                  </div>
                  <Link to="/accounting" className="db-section-action">Full Accounting <Icon name="ARROW_RIGHT" size={11}/></Link>
                </div>
                <GridLayout cols={2}>
                  <FinancialHealthWidget currency={currency}/>
                  <CashFlowWidget currency={currency}/>
                </GridLayout>
              </div>
            )}

            {/* Business Intelligence */}
            {isAdmin && (widgetVisible('credibility') || widgetVisible('insights')) && (
              <div>
                <div className="db-section">
                  <div className="db-section-left">
                    <span className="db-section-pill"><Icon name="SPARKLES" size={10}/> Intelligence</span>
                    <span className="db-section-title">Business Intelligence</span>
                    <span className="db-section-sub">Strategic insights · Market trends · Revenue growth</span>
                  </div>
                  <Link to="/reports/insights" className="db-section-action">View All <Icon name="ARROW_RIGHT" size={11}/></Link>
                </div>
                <GridLayout cols={2}>
                  {widgetVisible('credibility') && <BusinessCredibilityWidget/>}
                  {widgetVisible('insights') && <GrowthInsightsBanner/>}
                </GridLayout>
              </div>
            )}

            {/* IFRS Readiness */}
            {widgetVisible('ifrs-readiness') && (
              <div>
                <div className="db-section">
                  <div className="db-section-left">
                    <span className="db-section-pill"><Icon name="SHIELD_CHECK" size={10}/> Compliance</span>
                    <span className="db-section-title">IFRS Readiness</span>
                    <span className="db-section-sub">Standards compliance snapshot</span>
                  </div>
                </div>
                <IFRSReadinessWidget/>
              </div>
            )}

            {/* Banking */}
            {widgetVisible('banking') && (
              <div>
                <div className="db-section">
                  <div className="db-section-left">
                    <span className="db-section-pill"><Icon name="BANK" size={10}/> Banking</span>
                    <span className="db-section-title">Account Balance</span>
                    <span className="db-section-sub">Current balance of your bank accounts</span>
                  </div>
                  <Link to="/banking/accounts" className="db-section-action">All Accounts <Icon name="ARROW_RIGHT" size={11}/></Link>
                </div>
                <BankingWidget currency={currency}/>
              </div>
            )}
          </>
        )}

        {/* -- HR TAB -- */}
        {activeTab === 'hr' && (
          <>
            {/* HR mini hero strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', padding: '.875rem 1.25rem', background: '#fff', borderRadius: 14, border: '1px solid oklch(0.91 0.01 258)', boxShadow: '0 1px 2px rgba(0,0,0,.04)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', fontWeight: 700, color: 'oklch(0.15 0.02 258)' }}>
                <Icon name="USERS" size={14} style={{ color: 'oklch(0.55 0.22 278)' }}/>
                HR & Attendance
              </div>
              <div style={{ width: 1, height: 14, background: 'oklch(0.89 0.012 258)', margin: '0 .125rem' }}/>
              {[
                { label: `${totalEmployees} employees`, color: 'oklch(0.55 0.22 278)' },
                { label: `${presentToday} present`, color: 'oklch(0.48 0.16 155)' },
                ...(dashStats?.lateToday > 0 ? [{ label: `${dashStats.lateToday} late`, color: '#f59e0b' }] : []),
                ...(dashStats?.absentToday > 0 ? [{ label: `${dashStats.absentToday} absent`, color: '#ef4444' }] : []),
                { label: monthName, color: 'oklch(0.60 0.015 258)' },
              ].map((p, i) => (
                <span key={i} style={{ fontSize: '.75rem', fontWeight: 600, color: p.color, padding: '2px 8px', background: `${p.color}12`, border: `1px solid ${p.color}28`, borderRadius: 999 }}>{p.label}</span>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.6875rem', fontWeight: 600, color: 'oklch(0.60 0.015 258)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 2px #34d39938' }}/>
                Live
              </div>
            </div>

            {/* HR KPI strip */}
            <div className="dash-stat-grid db-stagger">
              <StatCard label="Present Today" value={presentToday} trend={5}
                icon={<Icon name="CHECK_CIRCLE" size={19} className="text-emerald-600"/>} iconBg="bg-emerald-50"
                gaugeValue={attendancePct} gaugeColor="#10b981" accent="#10b981" sublabel={`${attendancePct}% attendance rate`} to="/hr/attendance"/>
              <StatCard label="Late Arrivals" value={dashStats?.lateToday ?? 0}
                icon={<Icon name="CLOCK" size={19} className="text-amber-500"/>} iconBg="bg-amber-50"
                gaugeValue={dashStats?.lateToday > 0 ? 30 : 5} gaugeColor="#f59e0b" accent="#f59e0b" sublabel="today" to="/hr/attendance"/>
              <StatCard label="Absent" value={dashStats?.absentToday ?? 0}
                icon={<Icon name="ALERT_CIRCLE" size={19} className="text-rose-500"/>} iconBg="bg-rose-50"
                gaugeValue={dashStats?.absentToday > 0 ? 20 : 5} gaugeColor="#ef4444" accent="#ef4444" sublabel="no check-in" to="/hr/attendance"/>
              <StatCard label="On Leave" value={dashStats?.onLeaveToday ?? 0}
                icon={<Icon name="CALENDAR" size={19} className="text-violet-500"/>} iconBg="bg-violet-50"
                gaugeValue={30} gaugeColor="#8b5cf6" accent="#8b5cf6" sublabel="approved leave" to="/hr/leaves"/>
            </div>

            <div>
              <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="CHECK_CIRCLE" size={10}/> Attendance</span><span className="db-section-title">Live Attendance</span><span className="db-section-sub">Real-time employee presence and check-in logs</span></div></div>
              <GridLayout cols={2}>
                <WhoIsInWidget whoIsIn={whoIsIn} fetchData={fetchAttendanceData} />
                <RecentAttendanceLogs filteredLogs={filteredLogs} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  exportData={exportAttendance} handleVerify={handleVerify} loading={attendanceLoading} />
              </GridLayout>
            </div>

            <div>
              <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="BANKNOTE" size={10}/> Payroll</span><span className="db-section-title">Payroll Overview</span><span className="db-section-sub">{monthName} payroll summary</span></div></div>
              <GridLayout cols={2}>
                <PayrollSummaryWidget payrollCurrent={payrollCurrent} currency={currency} monthName={monthName} loading={!payrollCurrent} />
                <PayrollInsightsWidget payrollCurrent={payrollCurrent} payrollPrev={null} currency={currency} monthName={monthName} loading={!payrollCurrent} />
              </GridLayout>
            </div>

            <div>
              <RealtimePresenceWidget whoIsIn={whoIsIn} fetchData={fetchAttendanceData} />
            </div>
          </>
        )}

        {/* -- ovds TAB -- */}
        {activeTab === 'ovds' && (
          <>
            {/* ovds mini hero strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', padding: '.875rem 1.25rem', background: '#fff', borderRadius: 14, border: '1px solid oklch(0.91 0.01 258)', boxShadow: '0 1px 2px rgba(0,0,0,.04)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', fontWeight: 700, color: 'oklch(0.15 0.02 258)' }}>
                <Icon name="WALLET" size={14} style={{ color: 'oklch(0.55 0.22 278)' }}/> Finance & ovds
              </div>
              <div style={{ width: 1, height: 14, background: 'oklch(0.89 0.012 258)', margin: '0 .125rem' }}/>
              {[
                { label: `Revenue: ${fmt(thisTotal)}`, color: 'oklch(0.48 0.16 155)' },
                { label: `${collectionPct}% collected`, color: 'oklch(0.55 0.22 278)' },
                ...(overdueCount > 0 ? [{ label: `${overdueCount} overdue`, color: '#ef4444' }] : []),
                { label: monthName, color: 'oklch(0.60 0.015 258)' },
              ].map((p, i) => (
                <span key={i} style={{ fontSize: '.75rem', fontWeight: 600, color: p.color, padding: '2px 8px', background: `${p.color}12`, border: `1px solid ${p.color}28`, borderRadius: 999 }}>{p.label}</span>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.6875rem', fontWeight: 600, color: 'oklch(0.60 0.015 258)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 2px #34d39938' }}/>
                Live
              </div>
            </div>

            {/* ovds summary bar */}
            {widgetVisible('revenue') && (
              <ovdsSummaryBar
                moneyIn={thisTotal}
                moneyOut={invoiceStats?.totalBills ?? 0}
                netProfit={thisTotal - (invoiceStats?.totalBills ?? 0)}
                cashBalance={invoiceStats?.cashBalance ?? 0}
                currency={currency}
                loading={!invoiceStats}
                period={monthName}
              />
            )}

            {/* ovds KPI cards */}
            {widgetVisible('invoices') && (
              <div className="dash-stat-grid mt-5 aki-stagger">
                <ovdsKpiCard label="This Month Revenue" tooltip="Total amount invoiced to customers this month"
                  value={fmt(thisTotal)} trend={invoiceStats?.trend ?? 0}
                  icon={<Icon name="TREND_UP" size={16} />} iconBg="bg-emerald-50" iconColor="text-emerald-600"
                  accentColor="border-emerald-500" loading={!invoiceStats} onClick={() => window.__ovds_navigate?.('/sales/invoices')} />
                <ovdsKpiCard label="Collected" tooltip="Amount already paid by customers"
                  value={fmt(paidAmount)} icon={<Icon name="CHECK_CIRCLE" size={16} />}
                  iconBg="bg-sky-50" iconColor="text-sky-600" accentColor="border-sky-500" loading={!invoiceStats}
                  onClick={() => window.__ovds_navigate?.('/sales/invoices')} />
                <ovdsKpiCard label="Overdue Invoices" tooltip="Invoices past their payment due date — needs attention"
                  value={overdueCount.toLocaleString()} subValue={`${fmt(overdueAmount)}`} icon={<Icon name="ALERT_CIRCLE" size={16} />}
                  iconBg="bg-rose-50" iconColor="text-rose-600" accentColor="border-rose-500" loading={!invoiceStats}
                  onClick={() => window.__ovds_navigate?.('/sales/invoices')} />
                <ovdsKpiCard label="Pending" tooltip="Invoices sent but not yet paid"
                  value={pendingCount.toLocaleString()} subValue={fmt(pendingAmount)} icon={<Icon name="CLOCK" size={16} />}
                  iconBg="bg-amber-50" iconColor="text-amber-600" accentColor="border-amber-500" loading={!invoiceStats}
                  onClick={() => window.__ovds_navigate?.('/sales/invoices')} />
              </div>
            )}

            {/* Akaunting-style ovds Summary (Revenue / Expenses / Profit) */}
            {widgetVisible('revenue') && (
              <div className="mt-5">
                <OvdsSummary
                  revenue={thisTotal}
                  expenses={invoiceStats?.totalBills ?? 0}
                  profit={thisTotal - (invoiceStats?.totalBills ?? 0)}
                  currency={currency}
                  loading={!invoiceStats}
                />
              </div>
            )}

            {/* 7-Day Trend + Weekly Activity */}
            {(widgetVisible('cash-flow') || widgetVisible('tax-calendar')) && (
              <GridLayout cols={2} className="mt-5">
                {widgetVisible('cash-flow') && (
                  <Suspense fallback={<div className="ovds-widget-card h-[240px] animate-pulse" />}>
                    <DashboardTrendChart title="7-Day Revenue Trend" data={trendData} total={trendTotal} />
                  </Suspense>
                )}
                {widgetVisible('tax-calendar') && (
                  <WeeklyActivityChart reports={reportsData} loading={reportsLoading} error={null} />
                )}
              </GridLayout>
            )}

            {widgetVisible('revenue') && <div className="mt-5"><LivePnLBanner currency={currency} /></div>}

            {/* Payment Verification */}
            {widgetVisible('banking') && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="SHIELD_CHECK" size={10}/> Payments</span><span className="db-section-title">Payment Verification</span><span className="db-section-sub">Verify customer payments via CBE Birr · Telebirr · Awash · Dashen · Amole</span></div></div>
                <PaymentVerificationPanel currency={currency} />
              </div>
            )}

            {/* Tax Calendar */}
            {widgetVisible('tax-calendar') && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="CALENDAR" size={10}/> Tax</span><span className="db-section-title">Tax Calendar</span><span className="db-section-sub">Upcoming Ethiopian tax deadlines</span></div></div>
                <TaxCalendarWidget />
              </div>
            )}

            {widgetVisible('expenses') && <div style={{ marginTop: "1.25rem" }}><ExpensesWidget currency={currency} /></div>}
            {widgetVisible('recent-invoices') && <div style={{ marginTop: "1.25rem" }}><RecentInvoicesWidget currency={currency} /></div>}
            {widgetVisible('banking') && <div style={{ marginTop: "1.25rem" }}><BankingWidget currency={currency} /></div>}
            {widgetVisible('pie-breakdown') && <div style={{ marginTop: "1.25rem" }}><PieBreakdownWidget currency={currency} /></div>}

            {/* Financial Analysis */}
            {(widgetVisible('financial-health') || widgetVisible('vat-status')) && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="CALCULATOR" size={10}/> Analysis</span><span className="db-section-title">Financial Analysis</span><span className="db-section-sub">Key ratios · Compliance status · Growth analytics</span></div></div>
                <GridLayout cols={2}>
                  {widgetVisible('financial-health') && <FinancialRatioWidget />}
                  {widgetVisible('vat-status') && <LiveComplianceWidget />}
                </GridLayout>
              </div>
            )}

            {isAdmin && widgetVisible('revenue') && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="ARROW_LEFT_RIGHT" size={10}/> Accounting</span><span className="db-section-title">Accounting Compliance Chain</span><span className="db-section-sub">End-to-end transaction flow from invoice to tax submission</span></div></div>
                <GridLayout cols={2}>
                  <AccountingChainWidget />
                  <AccountingSetupHealthWidget companyId={selectedCompanyId ?? undefined} />
                </GridLayout>
              </div>
            )}
          </>
        )}

        {/* -- INSIGHTS TAB -- */}
        {activeTab === 'insights' && (
          <>
            {/* Insights mini strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', padding: '.875rem 1.25rem', background: '#fff', borderRadius: 14, border: '1px solid oklch(0.91 0.01 258)', boxShadow: '0 1px 2px rgba(0,0,0,.04)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', fontWeight: 700, color: 'oklch(0.15 0.02 258)' }}>
                <Icon name="SPARKLES" size={14} style={{ color: 'oklch(0.55 0.22 278)' }}/> Executive Insights
              </div>
              <div style={{ width: 1, height: 14, background: 'oklch(0.89 0.012 258)', margin: '0 .125rem' }}/>
              {[
                { label: 'Executive view', color: 'oklch(0.55 0.22 278)' },
                { label: monthName, color: 'oklch(0.60 0.015 258)' },
              ].map((p, i) => (
                <span key={i} style={{ fontSize: '.75rem', fontWeight: 600, color: p.color, padding: '2px 8px', background: `${p.color}12`, border: `1px solid ${p.color}28`, borderRadius: 999 }}>{p.label}</span>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.6875rem', fontWeight: 600, color: 'oklch(0.60 0.015 258)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 2px #34d39938' }}/>
                Live
              </div>
            </div>

            {isAdmin && widgetVisible('insights') && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="LAYOUT_GRID" size={10}/> Executive</span><span className="db-section-title">Executive Summary</span><span className="db-section-sub">High-level KPIs across all business domains</span></div></div>
                <ExecutiveSummaryWidget
                  dashStats={dashStats}
                  payrollCurrent={payrollCurrent}
                  payrollPrev={null}
                  invoiceStats={invoiceStats}
                  currency={currency}
                  loading={statsLoading}
                />
              </div>
            )}

            {isAdmin && strategicInsights && widgetVisible('insights') && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="SPARKLES" size={10}/> AI Intelligence</span><span className="db-section-title">Strategic Insights</span><span className="db-section-sub">AI-powered business intelligence · Market forecast · Competitive landscape</span></div></div>
                <StrategicInsightsWidget strategicInsights={strategicInsights} currency={currency} />
              </div>
            )}

            {(widgetVisible('ifrs-readiness') || widgetVisible('credibility')) && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="SHIELD_CHECK" size={10}/> Compliance</span><span className="db-section-title">Compliance & Audit</span><span className="db-section-sub">IFRS readiness and ERCA compliance status</span></div></div>
                <GridLayout cols={2}>
                  {widgetVisible('ifrs-readiness') && <IFRSReadinessWidget />}
                  {widgetVisible('credibility') && (
                    isAuditor ? <AuditReadinessWidget /> : <ERCAComplianceDashboard />
                  )}
                </GridLayout>
              </div>
            )}

            {widgetVisible('companies') && (
              <div style={{ marginTop: "1.25rem" }}><CompaniesWidget /></div>
            )}

            {widgetVisible('inventory') && (
              <div style={{ marginTop: "1.25rem" }}><InventoryWidget currency={currency} /></div>
            )}

            {/* IoT & Smart Management — device status alongside financial data */}
            {(widgetVisible('iot-overview') || widgetVisible('iot-alerts') || widgetVisible('iot-billing') || widgetVisible('etax-status')) && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="MONITOR" size={10}/> IoT</span><span className="db-section-title">IoT & Smart Management</span><span className="db-section-sub">Live device telemetry and e-Tax submissions</span></div></div>
                <GridLayout cols={2}>
                  {widgetVisible('iot-overview') && <IotOverviewWidget />}
                  {widgetVisible('iot-alerts')   && <IotAlertsWidget />}
                  {widgetVisible('iot-billing')  && <IotBillingWidget />}
                  {widgetVisible('etax-status')  && <ETaxStatusWidget />}
                </GridLayout>
              </div>
            )}

            {(isAdmin || isOvds) && payrollCurrent && widgetVisible('payroll') && (
              <div>
                <div className="db-section"><div className="db-section-left"><span className="db-section-pill"><Icon name="BANKNOTE" size={10}/> Payroll</span><span className="db-section-title">Payroll Actions</span><span className="db-section-sub">Pending approvals and payroll tasks</span></div></div>
                <PayrollActionItems payrollCurrent={payrollCurrent} stats={payrollCurrent} dashStats={dashStats} />
              </div>
            )}
          </>
        )}
      </div>

      {/* -- Content -- */}
    </div>
  );
};

export default Dashboard;



