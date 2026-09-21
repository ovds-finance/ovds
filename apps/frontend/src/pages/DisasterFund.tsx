/* eslint-disable */
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo } from 'react';
import { AppPage } from '@ovds/ui';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { BEARER_PREFIX } from '../utils/constants';
import {
  ShieldAlert,
  Plus,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Download,
  BarChart3,
  ListChecks,
  LayoutDashboard,
  Zap,
  Edit2,
  X,
  Search,
  History,
  CalendarClock,
  ChevronRight,
  Info,
  FileText,
  Calculator,
  Printer,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Eye,
  Building2,
  Send,
  Globe,
  BadgeCheck,
  Copy,
  Layers,
  RotateCcw,
  BookOpen,
  Landmark,
  Wallet,
  Users2,
  Mail,
  Phone,
  MapPin,
  Scale,
  ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../rbac/AuthContext';
import { useInterval } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { confirm, prompt } from '../utils/confirm';
import { useDebounce } from '../hooks';
import { useLocalStorage } from '../hooks';
import {
  LedgerModal,
  AccountModal,
  JournalModal,
  BankModal,
  PeriodManager,
  ReportsPanel,
  BankTransactionModal,
  VendorModal,
  VendorBillSummary,
  BankAccountCard } from '../components/accounting';
import LevyCollectionPanel from '../components/disaster-fund/LevyCollectionPanel';
import IASBUpdateBanner from '../components/iasbUpdateBanner';
import { useAuditLog } from '../hooks/useAuditLog';
import { useBusiness } from '../context/businessContext';
import { useMutation } from '../hooks/useMutation';
import { useFormValidation } from '../hooks';
import { useErrorHandler } from '../hooks/useErrorHandler';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  Legend, RadialBarChart, RadialBar, ComposedChart,
} from 'recharts';

// -- Types ---------------------------------------------------------------------
type FundStatus = 'PENDING' | 'REMITTED' | 'OVERDUE';
type SortDir = 'asc' | 'desc';
type FundCategory =
  | 'LOAN_VALUE'
  | 'INSURANCE_PREMIUM'
  | 'SERVICE_FEES'
  | 'AIRTIME_SALES'
  | 'TICKET_SALES'
  | 'ANNUAL_SALES_REVENUE'
  | 'FUEL_SALES'
  | 'TOBACCO_ALCOHOL'
  | 'GOVERNMENT_SERVICES'
  | 'GOVERNMENT_BUDGET'
  | 'SALARY_CONTRIBUTION'
  | 'DIVIDEND'
  | 'CONTRABAND_PROCEEDS'
  | 'TELECOM_DIGITAL'
  | 'OTHER';
interface Contribution {
  id: string;
  category: FundCategory;
  description?: string;
  baseAmount: number;
  levyAmount: number;
  period: string;
  status: FundStatus;
  remittedAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}
interface Summary {
  totalLevy: number;
  totalRemitted: number;
  totalPending: number;
  totalOverdue: number;
  byCategory: Record<string, number>;
  count: { total: number; remitted: number; pending: number; overdue: number };
}
interface TrendPoint {
  period: string;
  total: number;
  remitted: number;
  pending: number;
  overdue: number;
}
interface LevyRule {
  category: string;
  description: string;
  exampleBase: number;
  exampleLevy: number;
  isQuarterly: boolean;
}
interface AuditEntry {
  id: string;
  contributionId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy?: string;
  detail?: string;
  createdAt: string;
}
interface ScheduleEntry {
  id: string;
  year: number;
  quarter: number;
  category: string;
  dueDate: string;
  estimatedLevy: number;
  status: string;
  notes?: string;
}
interface QuarterSummary {
  quarter: number;
  period: string;
  total: number;
  remitted: number;
  pending: number;
  overdue: number;
  count: number;
}
interface CalcRow {
  id: string;
  category: FundCategory;
  label: string;
  baseAmount: string;
  levyAmount: number | null;
}
interface FundNote {
  id: string;
  contributionId: string;
  content: string;
  authorName?: string;
  createdAt: string;
}
interface TargetRow {
  category: string;
  targetAmount: number;
  actualTotal: number;
  remitted: number;
  variance: number;
  pctOfTarget: number | null;
  targetId: string | null;
  notes: string | null;
}
interface ComplianceScore {
  score: number;
  grade: string;
  breakdown: {
    total: number;
    remitted: number;
    overdue: number;
    onTime: number;
    remittanceRate: number;
    overdueRate: number;
    onTimeRate: number;
  };
}
interface UpcomingDue {
  id: string;
  category: FundCategory;
  description?: string;
  levyAmount: number;
  period: string;
  dueDate: string;
}
interface RemittanceRecord {
  id: string;
  contributionId: string;
  amount: number;
  bankName?: string;
  referenceNo?: string;
  remittedAt: string;
  remittedBy?: string;
  notes?: string;
}
interface YearComparison {
  year: number;
  total: number;
  remitted: number;
  pending: number;
  overdue: number;
  count: number;
}
interface SavedReport {
  id: string;
  title: string;
  period?: string;
  year?: number;
  status?: string;
  totalLevy: number;
  totalRemitted: number;
  totalPending: number;
  totalOverdue: number;
  recordCount: number;
  generatedBy?: string;
  createdAt: string;
}
interface DrillDown {
  category: string;
  totalLevy: number;
  totalRemitted: number;
  count: number;
  byPeriod: {
    period: string;
    total: number;
    remitted: number;
    count: number;
  }[];
  recent: Contribution[];
}

// ERCA types
type ErcaStatus = 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'FAILED';
interface ErcaSubmission {
  id: string;
  period: string;
  dueDate: string;
  totalLevy: number;
  totalRemitted: number;
  totalPending: number;
  categoryBreakdown: Record<
    string,
    { levy: number; base: number; count: number }
  >;
  contributionIds: string[];
  status: ErcaStatus;
  submittedAt?: string;
  submittedBy?: string;
  ercaReferenceNo?: string;
  paymentMethod?: string;
  bankName?: string;
  paymentReference?: string;
  notes?: string;
  acknowledgedAt?: string;
  createdAt: string;
}
interface ErcaPayload {
  period: string;
  dueDate: string;
  totalLevy: number;
  totalRemitted: number;
  totalPending: number;
  categoryBreakdown: Record<
    string,
    { levy: number; base: number; count: number }
  >;
  contributionIds: string[];
  contributionCount: number;
}
interface ErcaDashboardStats {
  recentSubmissions: ErcaSubmission[];
  overdue: ErcaSubmission[];
  counts: {
    pending: number;
    submitted: number;
    acknowledged: number;
    overdue: number;
  };
  totalLevyPending: number;
  totalLevySubmitted: number;
}
interface ForecastResult {
  nextPeriod: string;
  nextDueDate: string;
  daysUntilDue: number;
  totalForecast: number;
  forecasts: { category: string; forecastLevy: number }[];
  basedOnPeriods: string[];
}
interface NextDue {
  period: string;
  dueDate: string;
  daysLeft: number;
  isUrgent: boolean;
  isOverdue: boolean;
}
interface MonthlyHeatmapPoint {
  month: number;
  label: string;
  total: number;
  remitted: number;
  pending: number;
  overdue: number;
  count: number;
  topCategory: string | null;
}
interface ErcaComplianceYear {
  year: number;
  total: number;
  submitted: number;
  acknowledged: number;
  onTime: number;
  complianceRate: number;
  onTimeRate: number;
  totalLevy: number;
}
const BUSINESS_TYPES = [
  { key: 'MANUFACTURING', label: 'Manufacturing', icon: '🏭' },
  { key: 'LARGE_ENTERPRISE', label: 'Large Enterprise', icon: '🏢' },
  { key: 'MEDIUM_ENTERPRISE', label: 'Medium Enterprise', icon: '🏬' },
  { key: 'SMALL_BUSINESS', label: 'Small Business', icon: '🏪' },
  { key: 'FREELANCER', label: 'Freelancer', icon: '💼' },
  { key: 'GOVERNMENT', label: 'Government', icon: '🏛️' },
];

// -- Constants -----------------------------------------------------------------
const CATEGORY_LABELS: Record<FundCategory, string> = {
  LOAN_VALUE: 'Loan Value',
  INSURANCE_PREMIUM: 'Insurance Premium',
  SERVICE_FEES: 'Service Fees (Bank/Mobile)',
  AIRTIME_SALES: 'Airtime Sales',
  TICKET_SALES: 'Domestic Flight Ticket',
  ANNUAL_SALES_REVENUE: 'Annual Sales Revenue',
  FUEL_SALES: 'Fuel Sales',
  TOBACCO_ALCOHOL: 'Tobacco & Alcohol',
  GOVERNMENT_SERVICES: 'Government Service Fee',
  GOVERNMENT_BUDGET: 'Government Budget',
  SALARY_CONTRIBUTION: 'Salary Contribution',
  DIVIDEND: 'Dividend Income',
  CONTRABAND_PROCEEDS: 'Contraband Proceeds',
  TELECOM_DIGITAL: 'Telecom / Digital Services',
  OTHER: 'Other' };
// Regulation No. 570/2025 — updated rates
const CATEGORY_DESCS: Record<FundCategory, string> = {
  LOAN_VALUE: '1% of disbursed loan amount',
  INSURANCE_PREMIUM: '1% of insurance premium',
  SERVICE_FEES: '5% of bank & mobile service fees',
  AIRTIME_SALES: '5% of telecom airtime revenue',
  TICKET_SALES: 'ETB 100 flat per domestic flight ticket',
  ANNUAL_SALES_REVENUE: '5% of paid invoice subtotals',
  FUEL_SALES: 'ETB 200 flat per fuel issuance',
  TOBACCO_ALCOHOL: '5% of sales value',
  GOVERNMENT_SERVICES: 'ETB 200 flat per government service rendered',
  GOVERNMENT_BUDGET: '0.25% of annual government budget',
  SALARY_CONTRIBUTION: '1% of net salary per payroll period',
  DIVIDEND: '1% of dividend distributions',
  CONTRABAND_PROCEEDS: '1% of confiscated goods value',
  TELECOM_DIGITAL: '5% of telecom/digital service revenue — Reg. 570/2025',
  OTHER: '1% — default fallback for uncategorized' };
const FLAT_CATS = ['TICKET_SALES', 'FUEL_SALES', 'GOVERNMENT_SERVICES'];
const STATUS_CLS: Record<FundStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REMITTED: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200' };
const SCHED_CLS: Record<string, string> = {
  UPCOMING: 'bg-slate-500/15 text-slate-500 border-slate-200',
  DUE: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  MISSED: 'bg-rose-50 text-rose-700 border-rose-200' };
const ERCA_STATUS_CLS: Record<ErcaStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  SUBMITTED: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  ACKNOWLEDGED: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200' };
const CAT_COLORS = [
  '#f97316',
  '#00E784',
  '#00E784',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#4FBA6F',
  '#ef4444',
  '#84cc16',
  '#06b6d4',
  '#a855f7',
  '#64748b',
];
const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 }).format(n);
const currentYear = () => new Date().getFullYear();
const currentPeriod = () => {
  const d = new Date();
return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;}
const BLANK_FORM = {
  category: 'LOAN_VALUE' as FundCategory,
  description: '',
  baseAmount: '',
  period: currentPeriod(),
  dueDate: '',
  notes: '' };
const newCalcRow = (): CalcRow => ({
  id: Math.random().toString(36).slice(2),
  category: 'LOAN_VALUE',
  label: '',
  baseAmount: '',
  levyAmount: null });

// -- Keyboard shortcuts modal --------------------------------------------------
const ShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-sm shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Keyboard Shortcuts</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-1.5">
        {[
          ['N', 'New contribution'],
          ['?', 'Toggle shortcuts panel'],
          ['Esc', 'Close modal / collapse row'],
          ['Enter', 'Confirm inline edit'],
          ['↑ / ↓', 'Sort column (click header)'],
        ].map(([key, desc]) => (
          <div
            key={key}
            className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
          >
            <span className="ovds-caption">{desc}</span>
            <kbd className="px-2 py-0.5 bg-slate-200 border border-slate-300 rounded text-[10px] text-slate-600 font-mono">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// -- Skeleton loader -----------------------------------------------------------
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);
const StatsSkeleton = () => (
  <div className="ovds-grid-layout cols-4">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 space-y-3"
      >
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-32" />
      </div>
    ))}
  </div>
);

// -- Sort icon -----------------------------------------------------------------
const SortIcon: React.FC<{
  col: string;
  sortCol: string;
  sortDir: SortDir;
}> = ({ col, sortCol, sortDir }) => {
  if (col !== sortCol)
    return <ChevronDownIcon size={10} className="text-slate-400 ml-0.5" />;
return sortDir === 'asc' ? (
    <ChevronUp size={10} className="text-[var(--pro-azure)] ml-0.5" />
  ) : (
    <ChevronDownIcon size={10} className="text-[var(--pro-azure)] ml-0.5" />
  );}

// -- Mini bar chart ------------------------------------------------------------
const MiniBarChart: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  if (!data.length)
    return (
      <p className="text-slate-400 text-xs text-center py-6">
        No trend data yet.
      </p>
    );
const max = Math.max(...data.map((d, i) => d.total), 1);
return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.slice(-12).map((d, i) => (
        <div
          key={d.period}
          className="flex-1 flex flex-col items-center gap-0.5 group relative"
        >
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-slate-900 shadow-lg text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-xl">
            <p className="font-bold mb-0.5">{d.period}</p>
            <p>Total: ETB {fmt(d.total)}</p>
            <p className="text-[var(--pro-azure)]">Remitted: ETB {fmt(d.remitted)}</p>
            <p className="text-amber-600">Pending: ETB {fmt(d.pending)}</p>
            {d.overdue > 0 && (
              <p className="text-rose-600">Overdue: ETB {fmt(d.overdue)}</p>
            )}
          </div>
          <div
            className="w-full rounded-t-sm bg-slate-100 relative overflow-hidden rounded-t-sm"
            style={{ height: `${(d.total / max) * 100}%`, minHeight: 4 }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 bg-[var(--pro-azure-50)]0 rounded-t-sm"
              style={{
                height: `${(d.remitted / Math.max(d.total, 1)) * 100}%` }}
            />
          </div>
          <span className="text-[8px] text-slate-400 truncate w-full text-center">
            {d.period.replace(/\d{4}-/, '')}
          </span>
        </div>
      ))}
    </div>
  );}

// -- Donut chart ---------------------------------------------------------------
const DonutChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
const total = entries.reduce((s, [, v]) => s + v, 0);
if (!total)
    return (
      <p className="text-slate-400 text-xs text-center py-6">No data yet.</p>
    );
let cumAngle = -90;
const r = 60;
const cx = 80;
const cy = 80;
const slices = entries.map(([cat, val], i) => {
    const angle = (val / total) * 360;
const start = cumAngle;
    cumAngle += angle;
const toRad = (a: number) => (a * Math.PI) / 180;
const x1 = cx + r * Math.cos(toRad(start));
const y1 = cy + r * Math.sin(toRad(start));
const x2 = cx + r * Math.cos(toRad(start + angle));
const y2 = cy + r * Math.sin(toRad(start + angle));
return {
      cat,
      val,
      color: CAT_COLORS[i % CAT_COLORS.length],
      path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${angle > 180 ? 1 : 0},1 ${x2},${y2} Z` };
  });
return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width="160" height="160" className="shrink-0">
        {slices.map((s, i) => (
          <path key={s.cat} d={s.path} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="#0f172a" />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9"
          fontWeight="bold"
        >
          TOTAL
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
        >
          ETB {fmt(total)}
        </text>
      </svg>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {slices.slice(0, 8).map((s, i) => (
          <div key={s.cat} className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-[11px] text-slate-500 truncate flex-1">
              {CATEGORY_LABELS[s.cat as FundCategory] ?? s.cat}
            </span>
            <span className="text-[11px] text-slate-900 font-mono shrink-0">
              {((s.val / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );}

// -- Audit drawer --------------------------------------------------------------
const AuditDrawer: React.FC<{
  logs: AuditEntry[];
  onClose: () => void;
  title: string;
}> = ({ logs, onClose, title }) => {
  const [auditFilter, setAuditFilter] = useState('');
const filtered = auditFilter
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
          (l.performedBy ?? '')
            .toLowerCase()
            .includes(auditFilter.toLowerCase()) ||
          (l.detail ?? '').toLowerCase().includes(auditFilter.toLowerCase()),
      )
    : logs;
return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[var(--pro-azure)]" />
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
              {logs.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {logs.length > 4 && (
          <div className="px-4 py-2.5 border-b border-slate-100">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                placeholder="Filter by action, user, detail..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-600 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-8">
              {auditFilter ? 'No matching entries.' : 'No audit entries.'}
            </p>
          ) : (
            filtered.map((l, i) => (
              <div key={l.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full mt-1 shrink-0 ${l.action === 'CREATED' ? 'bg-[var(--pro-azure-light)]' : l.action === 'DELETED' ? 'bg-rose-400' : l.action === 'STATUS_CHANGED' ? 'bg-orange-400' : 'bg-slate-500'}`}
                  />
                  {i < filtered.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200/60 mt-1" />
                  )}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {l.action.replace(/_/g, ' ')}
                    </span>
                    {l.fromStatus && l.toStatus && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${STATUS_CLS[l.fromStatus as FundStatus] ?? 'bg-slate-200 text-slate-500 border-slate-300'}`}
                        >
                          {l.fromStatus}
                        </span>
                        <ChevronRight size={10} />
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${STATUS_CLS[l.toStatus as FundStatus] ?? 'bg-slate-200 text-slate-500 border-slate-300'}`}
                        >
                          {l.toStatus}
                        </span>
                      </span>
                    )}
                  </div>
                  {l.detail && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {l.detail}
                    </p>
                  )}
                  <p className="ovds-caption mt-0.5">
                    {l.performedBy && (
                      <span className="text-slate-400 mr-1">
                        {l.performedBy} ·
                      </span>
                    )}
                    {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );}

// -- Detail slide-over ---------------------------------------------------------
const DetailPanel: React.FC<{
  contribution: Contribution;
  onClose: () => void;
  onRemit: (id: string) => void;
  onReceipt: (id: string) => void;
  onAudit: (id: string, label: string) => void;
  onRecordRemittance: (c: Contribution) => void;
}> = ({
  contribution: c,
  onClose,
  onRemit,
  onReceipt,
  onAudit,
  onRecordRemittance }) => {
  const effectiveRate =
    c.baseAmount > 0 ? ((c.levyAmount / c.baseAmount) * 100).toFixed(2) : null;
const daysLeft = c.dueDate
    ? Math.ceil((new Date(c.dueDate).getTime() - Date.now()) / 86400000)
    : null;
return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[var(--pro-azure)]" />
            <h3 className="text-sm font-semibold text-slate-900">
              Contribution Detail
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CLS[c.status]}`}
            >
              {c.status}
            </span>
            <div className="flex items-center gap-2">
              {daysLeft !== null && c.status !== 'REMITTED' && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${daysLeft < 0 ? 'bg-rose-50 text-rose-600' : daysLeft <= 7 ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-200 text-slate-500'}`}
                >
                  {daysLeft < 0
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0
                      ? 'due today'
                      : `${daysLeft}d left`}
                </span>
              )}
              <span className="ovds-caption">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
              Category
            </p>
            <p className="text-sm font-bold text-slate-900">
              {CATEGORY_LABELS[c.category]}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {CATEGORY_DESCS[c.category]}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-white rounded-xl border border-slate-100 p-3 border border-slate-200 group cursor-pointer"
              onClick={() => {
                navigator.clipboard?.writeText(String(c.baseAmount));
toast.success('Copied!', { duration: 800 });
              }}
            >
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Base Amount
              </p>
              <p className="text-sm font-mono font-bold text-slate-700">
                ETB {fmt(c.baseAmount)}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 group-hover:text-slate-400 transition-colors">
                click to copy
              </p>
            </div>
            <div
              className="bg-[var(--pro-azure-50)] rounded-xl p-3 border border-[var(--pro-azure-100)] group cursor-pointer"
              onClick={() => {
                navigator.clipboard?.writeText(String(c.levyAmount));
toast.success('Copied!', { duration: 800 });
              }}
            >
              <p className="text-[10px] font-bold text-[var(--pro-azure)]/70 uppercase tracking-wider mb-1">
                Levy Amount
              </p>
              <p className="text-sm font-mono font-bold text-[var(--pro-azure)]">
                ETB {fmt(c.levyAmount)}
              </p>
              {effectiveRate && (
                <p className="text-[9px] text-[var(--pro-azure)]/50 mt-0.5">
                  {effectiveRate}% effective rate
                </p>
              )}
            </div>
          </div>
          {[
            { label: 'Period', value: c.period },
            {
              label: 'Due Date',
              value: c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—' },
            {
              label: 'Remitted At',
              value: c.remittedAt
                ? new Date(c.remittedAt).toLocaleDateString()
                : '—' },
            { label: 'Description', value: c.description || '—' },
            { label: 'Notes', value: c.notes || '—' },
          ].map((f, i) => (
            <div
              key={f.label}
              className="flex justify-between gap-3 py-1.5 border-b border-slate-100"
            >
              <span className="text-[11px] font-bold text-slate-400">
                {f.label}
              </span>
              <span className="text-[11px] text-slate-600 text-right max-w-[180px] break-words">
                {f.value}
              </span>
            </div>
          ))}
          <div className="space-y-2 pt-2">
            {c.status === 'PENDING' && (
              <button
                onClick={() => {
                  onRemit(c.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-sm font-semibold transition-all"
              >
                <CheckCircle2 size={14} />
                Mark as Remitted
              </button>
            )}
            <button
              onClick={() => onRecordRemittance(c)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-sm font-bold transition-all"
            >
              <Building2 size={14} />
              Record Bank Remittance
            </button>
            <button
              onClick={() => onReceipt(c.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-bold transition-all"
            >
              <Printer size={14} />
              Download Receipt
            </button>
            <button
              onClick={() => onAudit(c.id, CATEGORY_LABELS[c.category])}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-bold transition-all"
            >
              <History size={14} />
              View Audit Trail
            </button>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <NotesPanel contributionId={c.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Category drill-down modal -------------------------------------------------
const DrillDownModal: React.FC<{
  category: FundCategory;
  onClose: () => void;
}> = ({ category, onClose }) => {
  const [data, setData] = useState<DrillDown | null>(null);
useEffect(() => {
    api
      .get(`/disaster-fund/category/${category}/drill-down`)
      .then((r: any) => setData(r.data.data))
      .catch(() => {});
  }, [category]);
const maxPeriod = data
    ? Math.max(...data.byPeriod.map((p, i) => p.total), 1)
    : 1;
const remittanceRate =
    data && data.totalLevy > 0
      ? (data.totalRemitted / data.totalLevy) * 100
      : 0;
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {CATEGORY_LABELS[category]}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {CATEGORY_DESCS[category]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {!data ? (
          <div className="p-5 text-center text-slate-400 text-sm">
            Loading...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="ovds-grid-layout cols-3 gap-sm">
              {[
                {
                  label: 'Total Levy',
                  value: `ETB ${fmt(data.totalLevy)}`,
                  color: 'text-[var(--pro-azure)]' },
                {
                  label: 'Remitted',
                  value: `ETB ${fmt(data.totalRemitted)}`,
                  color: 'text-[var(--pro-azure)]' },
                {
                  label: 'Records',
                  value: String(data.count),
                  color: 'text-slate-600' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 text-center"
                >
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className={`text-lg font-semibold mt-1 ${s.color}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            {/* Remittance rate bar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Remittance Rate
                </p>
                <span
                  className={`text-sm font-semibold ${remittanceRate >= 80 ? 'text-[var(--pro-azure)]' : remittanceRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}
                >
                  {remittanceRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${remittanceRate >= 80 ? 'bg-[var(--pro-azure-50)]0' : remittanceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(remittanceRate, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                By Period
              </p>
              <div className="space-y-2">
                {data.byPeriod.map((p, i) => {
                  const pRate = p.total > 0 ? (p.remitted / p.total) * 100 : 0;
return (
                    <div key={p.period} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-20 shrink-0">
                        {p.period}
                      </span>
                      <div className="flex-1 h-4 bg-slate-200 rounded-lg overflow-hidden flex">
                        <div
                          className="h-full bg-[var(--pro-azure-50)]0/70"
                          style={{
                            width: `${(p.remitted / maxPeriod) * 100}%` }}
                        />
                        <div
                          className="h-full bg-[var(--pro-azure-50)]0/40"
                          style={{
                            width: `${((p.total - p.remitted) / maxPeriod) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 w-10 text-right shrink-0">
                        {pRate.toFixed(0)}%
                      </span>
                      <span className="text-xs font-mono text-[var(--pro-azure)] w-28 text-right shrink-0">
                        ETB {fmt(p.total)}
                      </span>
                      <span className="text-[10px] text-slate-400 w-12 text-right shrink-0">
                        {p.count} rec
                      </span>
                    </div>
                  );
                })}
                {data.byPeriod.length === 0 && (
                  <p className="text-slate-400 text-xs">No period data.</p>
                )}
              </div>
            </div>
            {data.recent.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                  Recent Contributions
                </p>
                <div className="space-y-1.5">
                  {data.recent.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_CLS[r.status]}`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-500 flex-1 truncate">
                        {r.description || r.period}
                      </span>
                      <span className="text-xs font-mono text-[var(--pro-azure)] shrink-0">
                        ETB {fmt(r.levyAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {r.period}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// -- Auto-Generate from Activity Modal ----------------------------------------
const AUTO_SOURCES = [
  {
    key: 'SALARY_CONTRIBUTION',
    label: 'Salary Contribution',
    desc: '1% of approved payroll net pay',
    icon: '👥',
    source: 'payroll' },
  {
    key: 'LOAN_VALUE',
    label: 'Loan Value',
    desc: '1% of approved loan amounts',
    icon: '🏦',
    source: 'loans' },
  {
    key: 'ANNUAL_SALES_REVENUE',
    label: 'Sales Revenue',
    desc: '5% of paid invoice subtotals',
    icon: '🧾',
    source: 'invoices' },
  {
    key: 'SERVICE_FEES',
    label: 'Service Fees',
    desc: '5% of mobile/bank payment invoices',
    icon: '📱',
    source: 'invoices (mobile/bank)' },
  {
    key: 'INSURANCE_PREMIUM',
    label: 'Insurance Premium',
    desc: '1% of paid insurance bills',
    icon: '🛡️',
    source: 'bills' },
  {
    key: 'AIRTIME_SALES',
    label: 'Airtime Sales',
    desc: '5% of paid airtime bills',
    icon: '📶',
    source: 'bills' },
  {
    key: 'FUEL_SALES',
    label: 'Fuel Sales',
    desc: 'ETB 200 flat per fuel bill',
    icon: '⛽',
    source: 'bills' },
  {
    key: 'TOBACCO_ALCOHOL',
    label: 'Tobacco & Alcohol',
    desc: '5% of tobacco/alcohol bills',
    icon: '🚬',
    source: 'bills' },
  {
    key: 'TICKET_SALES',
    label: 'Ticket Sales',
    desc: 'ETB 100 flat per ticket invoice',
    icon: '🎫',
    source: 'invoices' },
  {
    key: 'GOVERNMENT_SERVICES',
    label: 'Govt. Services',
    desc: 'ETB 200 per passport/visa bill',
    icon: '🏛️',
    source: 'bills' },
  {
    key: 'GOVERNMENT_BUDGET',
    label: 'Govt. Budget',
    desc: '0.25% of annual budget (quarterly)',
    icon: '📊',
    source: 'system settings' },
];
const BUSINESS_TYPE_DEFAULTS: Record<string, string[]> = {
  MANUFACTURING: [
    'ANNUAL_SALES_REVENUE',
    'LOAN_VALUE',
    'INSURANCE_PREMIUM',
    'SALARY_CONTRIBUTION',
    'FUEL_SALES',
  ],
  LARGE_ENTERPRISE: [
    'ANNUAL_SALES_REVENUE',
    'LOAN_VALUE',
    'INSURANCE_PREMIUM',
    'SALARY_CONTRIBUTION',
    'SERVICE_FEES',
    'AIRTIME_SALES',
    'TOBACCO_ALCOHOL',
    'FUEL_SALES',
  ],
  MEDIUM_ENTERPRISE: [
    'ANNUAL_SALES_REVENUE',
    'LOAN_VALUE',
    'INSURANCE_PREMIUM',
    'SALARY_CONTRIBUTION',
    'SERVICE_FEES',
  ],
  SMALL_BUSINESS: ['ANNUAL_SALES_REVENUE', 'LOAN_VALUE', 'SALARY_CONTRIBUTION'],
  FREELANCER: ['SALARY_CONTRIBUTION', 'SERVICE_FEES'],
  GOVERNMENT: [
    'GOVERNMENT_BUDGET',
    'GOVERNMENT_SERVICES',
    'SALARY_CONTRIBUTION',
  ] };
const AutoGenerateModal: React.FC<{
  onClose: () => void;
  onGenerated: () => void;
}> = ({ onClose, onGenerated }) => {
  const [period, setPeriod] = useState(currentPeriod());
const [businessType, setBusinessType] = useState('');
const [sources, setSources] = useState<string[]>([
    'SALARY_CONTRIBUTION',
    'LOAN_VALUE',
    'ANNUAL_SALES_REVENUE',
    'SERVICE_FEES',
  ]);
const [previewing, setPreviewing] = useState(false);
const [generating, setGenerating] = useState(false);
const [previews, setPreviews] = useState<
    | {
        category: string;
        description: string;
        baseAmount: number;
        levyAmount: number;
        source: string;
      }[]
    | null
  >(null);
const toggleSource = (key: string) =>
    setSources((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
const applyBusinessType = (bt: string) => {
    setBusinessType(bt);
if (bt && BUSINESS_TYPE_DEFAULTS[bt])
      setSources(BUSINESS_TYPE_DEFAULTS[bt]);
    setPreviews(null);
  };
const handlePreview = async () => {
    if (!sources.length) {
      toast.error('Select at least one source');
return;
    }
    setPreviewing(true);
try {
      const res = await api.post('/disaster-fund/auto-generate', {
        period,
        sources,
        dryRun: true,
        businessType: businessType || undefined });
      setPreviews(res.data.data.previews);
if (!res.data.data.previews.length)
        toast('No activity found for the selected period and sources', {
          icon: 'ℹ️' });
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Preview failed');
    }
finally {
      setPreviewing(false);
    }
  };
const handleGenerate = async () => {
    if (!previews?.length) return;
    setGenerating(true);
try {
      const res = await api.post('/disaster-fund/auto-generate', {
        period,
        sources,
        dryRun: false,
        businessType: businessType || undefined });
toast.success(
        `${res.data.data.created} contributions generated${res.data.data.skipped > 0 ? `, ${res.data.data.skipped} skipped` : ''}`,
      );
      onGenerated();
      onClose();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Generation failed');
    }
finally {
      setGenerating(false);
    }
  };
const totalLevy = previews?.reduce((s, p) => s + p.levyAmount, 0) ?? 0;
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[var(--pro-azure)]" />
            <h2 className="text-base font-semibold text-slate-900">
              Auto-Generate from Business Activity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                Period
              </label>
              <input
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setPreviews(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                placeholder="e.g. 2026-Q1 or 2026-04"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Quarterly (2026-Q1) or monthly (2026-04)
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                Business Type (optional)
              </label>
              <select
                value={businessType}
                onChange={(e) => applyBusinessType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              >
                <option value="">All categories</option>
                {BUSINESS_TYPES.map((bt, i) => (
                  <option key={bt.key} value={bt.key}>
                    {bt.icon} {bt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-selects applicable levy categories
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Data Sources
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSources(AUTO_SOURCES.map((s, i) => s.key));
                    setPreviews(null);
                  }}
                  className="text-[10px] text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-bold transition-colors"
                >
                  All
                </button>
                <span className="text-slate-700">·</span>
                <button
                  onClick={() => {
                    setSources([]);
                    setPreviews(null);
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold transition-colors"
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AUTO_SOURCES.map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => {
                    toggleSource(s.key);
                    setPreviews(null);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${sources.includes(s.key) ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <span className="text-lg leading-none mt-0.5">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{s.label}</p>
                    <p className="ovds-caption mt-0.5 leading-tight">
                      {s.desc}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      from {s.source}
                    </p>
                  </div>
                  {sources.includes(s.key) && (
                    <CheckCircle2
                      size={12}
                      className="text-[var(--pro-azure)] shrink-0 mt-0.5"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          {previews !== null && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {previews.length} contributions to create
                </p>
                {previews.length > 0 && (
                  <p className="text-xs font-bold text-[var(--pro-azure)]">
                    Total levy: ETB {fmt(totalLevy)}
                  </p>
                )}
              </div>
              {previews.length === 0 ? (
                <p className="px-4 py-6 text-center text-slate-400 text-sm">
                  No activity found for this period and sources.
                </p>
              ) : (
                <div className="divide-y divide-slate-700/30 max-h-52 overflow-y-auto">
                  {previews.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900">
                          {CATEGORY_LABELS[p.category as FundCategory] ??
                            p.category}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {p.description}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Base: ETB {fmt(p.baseAmount)} · from {p.source}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[var(--pro-azure)]">
                          ETB {fmt(p.levyAmount)}
                        </p>
                        <p className="ovds-caption">levy</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={previewing || !sources.length}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-200 text-slate-900 text-sm font-bold transition-all disabled:opacity-50"
            >
              <Eye size={14} />
              {previewing ? 'Scanning...' : 'Preview'}
            </button>
            {previews !== null && previews.length > 0 && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                <Zap size={14} />
                {generating
                  ? 'Generating...'
                  : `Generate ${previews.length} Contributions`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// -- CSV import modal ----------------------------------------------------------
const ImportModal: React.FC<{
  onClose: () => void;
  onImported: () => void;
}> = ({ onClose, onImported }) => {
  const [csvText, setCsvText] = useState('');
const [preview, setPreview] = useState<any[]>([]);
const [importing, setImporting] = useState(false);
const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
const [dragging, setDragging] = useState(false);
const dropRef = useRef<HTMLDivElement>(null);
const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
const file = e.dataTransfer.files[0];
if (!file) return;
const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? '');
      setPreview([]);
    };
    reader.readAsText(file);
  };
const TEMPLATE = `Category,Description,Base Amount,Period,Due Date,Notes
LOAN_VALUE,Q1 loan portfolio,5000000,2026-Q1,2026-04-15,
SALARY_CONTRIBUTION,March payroll,2000000,2026-Q1,
GOVERNMENT_BUDGET,Q1 budget levy,10000000,2026-Q1,2026-04-15,`;
const parse = (text: string) => {
    const lines = text
      .trim()
      .split('\n')
      .filter((l) => l.trim());
if (lines.length < 2) return [];
const headers = lines[0]
      .split(',')
      .map((h, i) => h.trim().toLowerCase().replace(/\s+/g, '_'));
return lines
      .slice(1)
      .map((line, i) => {
        const vals = line.split(',').map((v, i) => v.trim().replace(/^"|"$/g, ''));
const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = vals[i] ?? '';
        });
return {
          category: obj.category?.toUpperCase().replace(/\s+/g, '_'),
          description: obj.description || undefined,
          baseAmount: parseFloat(obj.base_amount || obj.baseamount || '0'),
          period: obj.period,
          dueDate: obj.due_date || obj.duedate || undefined,
          notes: obj.notes || undefined };
      })
      .filter((r) => r.category && r.period && !isNaN(r.baseAmount));
  };
const handleParse = () => setPreview(parse(csvText));
const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
try {
      const res = await api.post('/disaster-fund/import-csv', {
        rows: preview });
      setResult(res.data.data);
if (res.data.data.success > 0) onImported();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Import failed');
    }
finally {
      setImporting(false);
    }
  };
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-slate-900">
            Import Contributions from CSV
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          {result ? (
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${result.failed === 0 ? 'bg-[var(--pro-azure-50)] border-slate-200' : 'bg-amber-50 border-amber-500/30'}`}
              >
                <CheckCircle2
                  size={16}
                  className={
                    result.failed === 0 ? 'text-[var(--pro-azure)]' : 'text-amber-600'
                  }
                />
                <p className="text-sm font-bold text-slate-900">
                  {result.success} imported successfully
                  {result.failed > 0 ? `, ${result.failed} failed` : ''}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-1">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-[11px] text-rose-600">
                      {e}
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-bold transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="ovds-caption">
                  Paste CSV data below or drag & drop a .csv file. Required
                  columns: Category, Base Amount, Period.
                </p>
                <button
                  onClick={() => setCsvText(TEMPLATE)}
                  className="text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-semibold transition-colors shrink-0"
                >
                  Load template
                </button>
              </div>
              <div
                ref={dropRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all ${dragging ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/60' : 'border-slate-200'}`}
              >
                {dragging && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--pro-azure-50)] z-10 pointer-events-none">
                    <p className="text-[var(--pro-azure)] font-bold text-sm">
                      Drop CSV file here
                    </p>
                  </div>
                )}
                <textarea
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setPreview([]);
                  }}
                  rows={8}
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-600 font-mono focus:outline-none resize-none"
                  placeholder="Category,Description,Base Amount,Period,Due Date,Notes&#10;LOAN_VALUE,Q1 loans,5000000,2026-Q1,..."
                />
              </div>
              {preview.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 py-2 ovds-label border-b border-slate-200">
                    {preview.length} rows parsed
                  </p>
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full text-xs ovds-table">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white">
                          {[
                            'Category',
                            'Description',
                            'Base Amount',
                            'Period',
                          ].map((h, i) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left text-[10px] text-slate-400 font-bold"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 8).map((r, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="px-3 py-1.5 text-slate-600">
                              {CATEGORY_LABELS[r.category as FundCategory] ??
                                r.category}
                            </td>
                            <td className="px-3 py-1.5 text-slate-500 truncate max-w-[120px]">
                              {r.description || '—'}
                            </td>
                            <td className="px-3 py-1.5 text-[var(--pro-azure)] font-mono">
                              ETB {fmt(r.baseAmount)}
                            </td>
                            <td className="px-3 py-1.5 text-slate-500">
                              {r.period}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleParse}
                  disabled={!csvText.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-bold transition-all disabled:opacity-40"
                >
                  Parse CSV
                </button>
                <button
                  onClick={handleImport}
                  disabled={!preview.length || importing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  {importing ? 'Importing...' : `Import ${preview.length} rows`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// -- Multi-year comparison chart -----------------------------------------------
const MultiYearChart: React.FC<{ data: YearComparison[] }> = ({ data }) => {
  if (!data.length)
    return <p className="text-slate-400 text-xs text-center py-6">No data.</p>;
const max = Math.max(...data.map((d, i) => d.total), 1);
return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.year} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 w-12">{d.year}</span>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[var(--pro-azure)]">R: ETB {fmt(d.remitted)}</span>
              <span className="text-amber-600">P: ETB {fmt(d.pending)}</span>
              {d.overdue > 0 && (
                <span className="text-rose-600">O: ETB {fmt(d.overdue)}</span>
              )}
              <span className="text-slate-500 font-mono">
                {d.count} records
              </span>
            </div>
          </div>
          <div className="w-full h-5 bg-slate-200 rounded-lg overflow-hidden flex">
            <div
              className="h-full bg-[var(--pro-azure-50)]0/70 transition-all"
              style={{ width: `${(d.remitted / max) * 100}%` }}
              title={`Remitted: ETB ${fmt(d.remitted)}`}
            />
            <div
              className="h-full bg-amber-500/70 transition-all"
              style={{ width: `${(d.pending / max) * 100}%` }}
              title={`Pending: ETB ${fmt(d.pending)}`}
            />
            <div
              className="h-full bg-rose-500/70 transition-all"
              style={{ width: `${(d.overdue / max) * 100}%` }}
              title={`Overdue: ETB ${fmt(d.overdue)}`}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>ETB 0</span>
            <span className="text-[var(--pro-azure)] font-mono font-bold">
              Total: ETB {fmt(d.total)}
            </span>
            <span>ETB {fmt(max)}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-4 pt-1">
        {[
          ['bg-[var(--pro-azure-50)]0/70', 'Remitted'],
          ['bg-amber-500/70', 'Pending'],
          ['bg-rose-500/70', 'Overdue'],
        ].map(([cls, label]) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-[10px] text-slate-500"
          >
            <span className={`w-3 h-2 rounded-sm ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );}

// -- Remittance modal ----------------------------------------------------------
const PAYMENT_METHODS = [
  {
    key: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: '🏦',
    desc: 'CBE, Awash, Dashen, etc.' },
  {
    key: 'TELECOM',
    label: 'Ethio Telecom',
    icon: '📱',
    desc: 'CBE Birr / Telebirr' },
  {
    key: 'MOBILE_BANKING',
    label: 'Mobile Banking',
    icon: '💳',
    desc: 'HelloCash, M-Pesa, etc.' },
  { key: 'CASH', label: 'Cash', icon: '💵', desc: 'Direct cash payment' },
  { key: 'CHEQUE', label: 'Cheque', icon: '📄', desc: 'Bank cheque' },
];
const RemittanceModal: React.FC<{
  contribution: Contribution;
  onClose: () => void;
  onSaved: () => void;
}> = ({ contribution: c, onClose, onSaved }) => {
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
const [form, setForm] = useState({
    amount: String(c.levyAmount),
    bankName: '',
    referenceNo: '',
    remittedAt: new Date().toISOString().split('T')[0],
    notes: '' });
const [saving, setSaving] = useState(false);
const [records, setRecords] = useState<RemittanceRecord[]>([]);
useEffect(() => {
    api
      .get(`/disaster-fund/${c.id}/remittances`)
      .then((r: any) => setRecords(r.data.data))
      .catch(() => {});
  }, [c.id]);
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
if (!form.amount || isNaN(Number(form.amount))) {
      toast.error('Enter a valid amount');
return;
    }
    setSaving(true);
try {
      await api.post(`/disaster-fund/${c.id}/remittances`, {
        ...form,
        amount: Number(form.amount) });
toast.success('Remittance recorded');
      onSaved();
      onClose();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to record remittance');
    }
finally {
      setSaving(false);
    }
  };
const handleDelete = async (id: string) => {
    try {
      await api.delete(`/disaster-fund/remittances/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
toast.success('Remittance deleted');
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to delete');
    }
  };
return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[var(--pro-azure)]" />
            <h2 className="text-base font-semibold text-slate-900">
              Record Bank Remittance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-6 mt-4 bg-white border border-slate-200 rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-slate-900">
                {CATEGORY_LABELS[c.category]}
              </p>
              <p className="text-[10px] text-slate-500">
                {c.period} · {c.description || '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--pro-azure)]">
                ETB {fmt(c.levyAmount)}
              </p>
              <p className="ovds-caption">levy due</p>
            </div>
          </div>
          {records.length > 0 &&
            (() => {
              const paid = records.reduce((s, r) => s + r.amount, 0);
const pct = Math.min((paid / c.levyAmount) * 100, 100);
return (
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Coverage: ETB {fmt(paid)} paid</span>
                    <span
                      className={
                        pct >= 100
                          ? 'text-[var(--pro-azure)] font-bold'
                          : 'text-amber-600'
                      }
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-[var(--pro-azure-50)]0' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
        </div>{' '}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block ovds-label mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PAYMENT_METHODS.map((m, i) => (
                <button
                  key={m.key}
type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${paymentMethod === m.key ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <span className="text-xl leading-none">{m.icon}</span>
                  <span className="text-[9px] font-bold leading-tight">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
            {paymentMethod === 'TELECOM' && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl">
                <span className="text-[var(--pro-azure)] text-sm">📱</span>
                <p className="text-[10px] text-[var(--pro-azure-dark)]">
                  Enter the Telebirr/CBE Birr transaction reference number
                  below.
                </p>
              </div>
            )}
            {paymentMethod === 'MOBILE_BANKING' && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-purple-50 border border-purple-500/20 rounded-xl">
                <span className="text-purple-400 text-sm">💳</span>
                <p className="text-[10px] text-purple-300">
                  Enter the mobile banking transaction ID (HelloCash, M-Pesa,
                  etc.) as the reference number.
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Amount (ETB)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Remittance Date
              </label>
              <input
                type="date"
                value={form.remittedAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remittedAt: e.target.value }))
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {paymentMethod === 'TELECOM'
                  ? 'Telecom Provider'
                  : paymentMethod === 'MOBILE_BANKING'
                    ? 'Mobile Service'
                    : 'Bank Name'}
              </label>
              <input
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
                placeholder={
                  paymentMethod === 'TELECOM'
                    ? 'e.g. Telebirr / CBE Birr'
                    : paymentMethod === 'MOBILE_BANKING'
                      ? 'e.g. HelloCash, M-Pesa'
                      : 'e.g. Commercial Bank of Ethiopia'
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {paymentMethod === 'TELECOM'
                  ? 'Transaction Ref.'
                  : paymentMethod === 'MOBILE_BANKING'
                    ? 'Transaction ID'
                    : 'Reference No.'}
              </label>
              <input
                value={form.referenceNo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, referenceNo: e.target.value }))
                }
                placeholder={
                  paymentMethod === 'TELECOM'
                    ? 'Telebirr transaction ref'
                    : paymentMethod === 'MOBILE_BANKING'
                      ? 'Mobile transaction ID'
                      : 'Bank transfer reference'
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Notes (optional)
            </label>
            <input
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Send size={13} />
              {saving ? 'Saving...' : 'Record Remittance'}
            </button>
          </div>
        </form>
        {records.length > 0 && (
          <div className="px-6 pb-6 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Previous Remittances
              </p>
              <div className="text-right">
                <span className="text-xs font-mono text-[var(--pro-azure)] font-bold">
                  ETB {fmt(records.reduce((s, r) => s + r.amount, 0))} paid
                </span>
                {records.reduce((s, r) => s + r.amount, 0) < c.levyAmount && (
                  <span className="ml-2 text-xs font-mono text-amber-600">
                    ETB{' '}
                    {fmt(
                      c.levyAmount - records.reduce((s, r) => s + r.amount, 0),
                    )}{' '}
                    remaining
                  </span>
                )}
              </div>
            </div>
            {records.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--pro-azure)]">
                      ETB {fmt(r.amount)}
                    </span>
                    {r.bankName && (
                      <span className="text-[10px] text-slate-500">
                        {r.bankName}
                      </span>
                    )}
                    {r.referenceNo && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{r.referenceNo}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {new Date(r.remittedAt).toLocaleDateString()}
                    {r.remittedBy && ` · ${r.remittedBy}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// -- Grade badge ---------------------------------------------------------------
const GradeBadge: React.FC<{ grade: string; score: number }> = ({
  grade,
  score }) => {
  const colors: Record<string, string> = {
    A: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    B: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] border-[var(--pro-azure)]/40',
    C: 'bg-amber-500/20 text-amber-700 border-amber-500/40',
    D: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure)] border-[var(--pro-azure-light)]',
    F: 'bg-rose-100 text-rose-700 border-rose-500/40',
    'N/A': 'bg-slate-500/20 text-slate-500 border-slate-300' };
return (
    <div
      className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 ${colors[grade] ?? colors['N/A']}`}
    >
      <span className="text-3xl font-semibold leading-none">{grade}</span>
      <span className="text-[10px] font-bold mt-0.5 opacity-70">
        {score}/100
      </span>
    </div>
  );}

// -- Notes panel (inside detail slide-over) ------------------------------------
const NotesPanel: React.FC<{ contributionId: string }> = ({
  contributionId }) => {
  const [notes, setNotes] = useState<FundNote[]>([]);
const [newNote, setNewNote] = useState('');
const [posting, setPosting] = useState(false);
const loadNotes = useCallback(async () => {
    try {
      const r = await api.get(`/disaster-fund/${contributionId}/notes`);
      setNotes(r.data.data);
    }
catch {
      /* silent */
    }
  }, [contributionId]);
useEffect(() => {
    loadNotes();
  }, [loadNotes]);
const post = async () => {
    if (!newNote.trim()) return;
    setPosting(true);
try {
      await api.post(`/disaster-fund/${contributionId}/notes`, {
        content: newNote.trim() });
      setNewNote('');
      loadNotes();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to post note');
    }
finally {
      setPosting(false);
    }
  };
const del = async (id: string) => {
    try {
      await api.delete(`/disaster-fund/notes/${id}`);
      loadNotes();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to delete note');
    }
  };
return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        Notes
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-slate-400 text-xs text-center py-3">
            No notes yet.
          </p>
        )}
        {notes.map((n, i) => (
          <div
            key={n.id}
            className="bg-white rounded-xl border border-slate-100 px-3 py-2.5 group relative"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              {n.content}
            </p>
            <p className="text-[9px] text-slate-400 mt-1.5">
              {n.authorName && (
                <span className="text-slate-400 mr-1">{n.authorName} ·</span>
              )}
              {new Date(n.createdAt).toLocaleString()}
            </p>
            <button
              onClick={() => del(n.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              post();
            }
          }}
          placeholder="Add a note... (Enter to post)"
          maxLength={500}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
        />
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={post}
            disabled={posting || !newNote.trim()}
            className="px-3 py-2 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-xs font-bold transition-all disabled:opacity-40"
          >
            Post
          </button>
          {newNote.length > 0 && (
            <span
              className={`text-[9px] ${newNote.length > 450 ? 'text-amber-600' : 'text-slate-400'}`}
            >
              {newNote.length}/500
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// -- ERCA Submit Modal ---------------------------------------------------------
const ERCA_PAYMENT_METHODS = [
  {
    key: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: '🏦',
    hint: 'CBE, Awash, Dashen, Abyssinia...' },
  {
    key: 'TELECOM',
    label: 'Telebirr',
    icon: '📱',
    hint: 'Ethio Telecom / CBE Birr' },
  {
    key: 'MOBILE_BANKING',
    label: 'Mobile Banking',
    icon: '💳',
    hint: 'HelloCash, M-Pesa, etc.' },
  {
    key: 'CASH',
    label: 'Cash',
    icon: '💵',
    hint: 'Direct cash at ERCA office' },
];
const ErcaSubmitModal: React.FC<{
  submission: ErcaSubmission;
  onClose: () => void;
  onSubmitted: () => void;
}> = ({ submission: sub, onClose, onSubmitted }) => {
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
const [form, setForm] = useState({
    bankName: '',
    paymentReference: '',
    ercaReferenceNo: '',
    notes: '' });
const [submitting, setSubmitting] = useState(false);
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
try {
      await api.post('/disaster-fund/erca/submit', {
        period: sub.period,
        paymentMethod,
        bankName: form.bankName || undefined,
        paymentReference: form.paymentReference || undefined,
        ercaReferenceNo: form.ercaReferenceNo || undefined,
        notes: form.notes || undefined });
toast.success(`ERCA submission for ${sub.period} submitted successfully`);
      onSubmitted();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Submission failed');
    }
finally {
      setSubmitting(false);
    }
  };
return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-[var(--pro-azure)]" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Submit to ERCA
              </h2>
              <p className="text-[10px] text-slate-500">
                Ethiopian Revenue and Customs Authority
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-6 mt-5 bg-[var(--pro-azure-50)] border border-[var(--pro-azure)]/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-500">Period</p>
              <p className="text-lg font-semibold text-slate-900">{sub.period}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500">Total Levy Due</p>
              <p className="text-2xl font-semibold text-[var(--pro-azure)]">
                ETB {fmt(sub.totalLevy)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-lg border border-slate-100 p-2">
              <p className="text-[9px] text-slate-400 font-bold uppercase">
                Remitted
              </p>
              <p className="text-xs font-bold text-[var(--pro-azure)] mt-0.5">
                ETB {fmt(sub.totalRemitted)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-100 p-2">
              <p className="text-[9px] text-slate-400 font-bold uppercase">
                Pending
              </p>
              <p className="text-xs font-bold text-amber-600 mt-0.5">
                ETB {fmt(sub.totalPending)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-100 p-2">
              <p className="text-[9px] text-slate-400 font-bold uppercase">
                Due Date
              </p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {new Date(sub.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          {sub.totalLevy > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                <span>Remittance coverage</span>
                <span
                  className={`font-bold ${sub.totalRemitted / sub.totalLevy >= 1 ? 'text-[var(--pro-azure)]' : 'text-amber-600'}`}
                >
                  {((sub.totalRemitted / sub.totalLevy) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((sub.totalRemitted / sub.totalLevy) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block ovds-label mb-2">
              Payment Method to ERCA
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ERCA_PAYMENT_METHODS.map((m, i) => (
                <button
                  key={m.key}
type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${paymentMethod === m.key ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-xs font-bold">{m.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{m.hint}</p>
                  </div>
                  {paymentMethod === m.key && (
                    <CheckCircle2
                      size={12}
                      className="text-[var(--pro-azure)] ml-auto shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {paymentMethod === 'TELECOM'
                  ? 'Telecom Provider'
                  : paymentMethod === 'MOBILE_BANKING'
                    ? 'Mobile Service'
                    : 'Bank Name'}
              </label>
              <input
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
                placeholder={
                  paymentMethod === 'TELECOM'
                    ? 'e.g. Telebirr'
                    : paymentMethod === 'MOBILE_BANKING'
                      ? 'e.g. HelloCash'
                      : 'e.g. Commercial Bank of Ethiopia'
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Payment Reference
              </label>
              <input
                value={form.paymentReference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentReference: e.target.value }))
                }
                placeholder="Transaction / transfer ref"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              ERCA Reference No. (if available)
            </label>
            <input
              value={form.ercaReferenceNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, ercaReferenceNo: e.target.value }))
              }
              placeholder="ERCA receipt / confirmation number"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 resize-none"
              placeholder="Additional submission notes..."
            />
          </div>
          <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl px-4 py-3 text-[11px] text-[var(--pro-azure-dark)]">
            Submitting will mark all {sub.contributionIds.length} included
            contributions as{' '}
            <span className="font-bold text-[var(--pro-azure)]">REMITTED</span> and
            record this submission in the audit trail.
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm shadow-lg shadow-green-500/20"
            >
              <Send size={13} />
              {submitting
                ? 'Submitting...'
                : `Submit ETB ${fmt(sub.totalLevy)} to ERCA`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );}

// -- Monthly heatmap -----------------------------------------------------------
const MonthlyHeatmap: React.FC<{
  data: MonthlyHeatmapPoint[];
  year: number;
}> = ({ data, year }) => {
  if (!data.length)
    return (
      <p className="text-slate-400 text-xs text-center py-6">
        No data for {year}.
      </p>
    );
const max = Math.max(...data.map((d, i) => d.total), 1);
const getIntensity = (val: number) => {
    const pct = val / max;
if (pct === 0) return 'bg-white border-slate-100';
if (pct < 0.2) return 'bg-[var(--pro-azure-50)] border-[var(--pro-azure)]/20';
if (pct < 0.4) return 'bg-[var(--pro-azure-100)] border-[var(--pro-azure-100)]';
if (pct < 0.6) return 'bg-[var(--pro-azure-50)]0/35 border-[var(--pro-azure-light)]';
if (pct < 0.8) return 'bg-[var(--pro-azure-50)]/605 border-[var(--pro-azure)]/50';
return 'bg-[var(--pro-azure-50)]0/80 border-[var(--pro-azure)]/70';}
return (
    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
      {data.map((d, i) => (
        <div
          key={d.label ?? d.month}
          className={`relative group rounded-xl border p-2 text-center cursor-default transition-all hover:scale-105 ${getIntensity(d.total)}`}
        >
          <p className="text-[9px] font-bold text-slate-500">{d.label}</p>
          <p className="text-[10px] font-semibold text-slate-900 mt-0.5">
            {d.count > 0 ? d.count : '—'}
          </p>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-left whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-20 shadow-xl min-w-[140px]">
            <p className="text-xs font-semibold text-slate-900 mb-1">
              {d.label} {year}
            </p>
            <p className="text-[10px] text-[var(--pro-azure)]">
              Total: ETB {fmt(d.total)}
            </p>
            <p className="text-[10px] text-[var(--pro-azure)]">
              Remitted: ETB {fmt(d.remitted)}
            </p>
            {d.pending > 0 && (
              <p className="text-[10px] text-amber-600">
                Pending: ETB {fmt(d.pending)}
              </p>
            )}
            {d.overdue > 0 && (
              <p className="text-[10px] text-rose-600">
                Overdue: ETB {fmt(d.overdue)}
              </p>
            )}
            {d.topCategory && (
              <p className="text-[9px] text-slate-400 mt-1">
                Top:{' '}
                {CATEGORY_LABELS[d.topCategory as FundCategory] ??
                  d.topCategory}
              </p>
            )}
            <p className="ovds-caption">{d.count} records</p>
          </div>
        </div>
      ))}
    </div>
  );}

// -- Progress ring -------------------------------------------------------------
const ProgressRing: React.FC<{
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}> = ({ pct, size = 64, stroke = 6, color = '#f97316', label }) => {
  const r = (size - stroke) / 2;
const circ = 2 * Math.PI * r;
const offset = circ - (Math.min(pct, 100) / 100) * circ;
return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-semibold text-slate-900 leading-none">
          {Math.round(pct)}%
        </span>
        {label && (
          <span className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase tracking-wide">
            {label}
          </span>
        )}
      </div>
    </div>
  );}

// -- Fund health widget --------------------------------------------------------
const FundHealthWidget: React.FC<{
  summary: Summary | null;
  loading: boolean;
}> = ({ summary, loading }) => {
  if (loading || !summary) return <Skeleton className="h-28" />;
const remRate =
    summary.totalLevy > 0
      ? (summary.totalRemitted / summary.totalLevy) * 100
      : 100;
const ovdRate =
    summary.count.total > 0
      ? (summary.count.overdue / summary.count.total) * 100
      : 0;
const score = Math.max(0, Math.round(remRate * 0.7 - ovdRate * 1.5));
const grade =
    score >= 90
      ? 'A'
      : score >= 75
        ? 'B'
        : score >= 60
          ? 'C'
          : score >= 40
            ? 'D'
            : 'F';
const color =
    score >= 90
      ? '#00E784'
      : score >= 75
        ? '#00E784'
        : score >= 60
          ? '#f59e0b'
          : score >= 40
            ? '#f97316'
            : '#ef4444';
const label =
    score >= 90
      ? 'Excellent'
      : score >= 75
        ? 'Good'
        : score >= 60
          ? 'Fair'
          : score >= 40
            ? 'Poor'
            : 'Critical';
return (
    <div className="flex items-center gap-5">
      <ProgressRing pct={score} size={72} stroke={7} color={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl font-semibold" style={{ color }}>
            {grade}
          </span>
          <span className="text-sm font-bold text-slate-900">{label}</span>
        </div>
        <div className="space-y-1">
          {[
            {
              label: 'Remittance rate',
              val: remRate,
              color:
                remRate >= 80
                  ? 'bg-[var(--pro-azure-50)]0'
                  : remRate >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500' },
            {
              label: 'Overdue rate',
              val: ovdRate,
              color:
                ovdRate === 0
                  ? 'bg-[var(--pro-azure-50)]0'
                  : ovdRate < 10
                    ? 'bg-amber-500'
                    : 'bg-rose-500',
              invert: true },
          ].map((s, i) => (
            <div key={s.label}>
              <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                <span>{s.label}</span>
                <span
                  className={
                    s.invert
                      ? s.val === 0
                        ? 'text-[var(--pro-azure)]'
                        : s.val < 10
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      : s.val >= 80
                        ? 'text-[var(--pro-azure)]'
                        : s.val >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                  }
                >
                  {s.val.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.color}`}
                  style={{ width: `${Math.min(s.val, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );}

// -- ERCA compliance history chart ---------------------------------------------
const ErcaComplianceChart: React.FC<{ data: ErcaComplianceYear[] }> = ({
  data }) => {
  if (!data.length)
    return (
      <p className="text-slate-400 text-xs text-center py-6">
        No compliance data.
      </p>
    );
return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.year} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 w-12">{d.year}</span>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[var(--pro-azure)]">
                Compliance: {d.complianceRate}%
              </span>
              <span className="text-[var(--pro-azure)]">On-time: {d.onTimeRate}%</span>
              <span className="text-slate-500">
                {d.submitted}/{d.total} submitted
              </span>
              <span className="text-[var(--pro-azure)] font-mono">
                ETB {fmt(d.totalLevy)}
              </span>
            </div>
          </div>
          <div className="w-full h-4 bg-slate-200 rounded-lg overflow-hidden flex gap-px">
            <div
              className="h-full bg-[var(--pro-azure-50)]0/70 rounded-l-lg transition-all"
              style={{ width: `${d.complianceRate}%` }}
              title={`Submitted: ${d.complianceRate}%`}
            />
            <div
              className="h-full bg-[var(--pro-azure-50)]0 transition-all"
              style={{
                width: `${Math.max(0, d.onTimeRate - d.complianceRate)}%` }}
              title="On-time bonus"
            />
          </div>
          <div className="flex gap-3 text-[9px] text-slate-400">
            <span>{d.acknowledged} acknowledged</span>
            <span>{d.onTime} on-time</span>
            <span>{d.total - d.submitted} pending/missed</span>
          </div>
        </div>
      ))}
      <div className="flex gap-4 pt-1">
        {[
          ['bg-[var(--pro-azure-50)]0/70', 'Submitted'],
          ['bg-[var(--pro-azure-50)]0', 'On-time'],
        ].map(([cls, label]) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-[10px] text-slate-500"
          >
            <span className={`w-3 h-2 rounded-sm ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );}

// -- Regulatory Compliance Timeline -------------------------------------------
const ComplianceTimeline: React.FC = () => {
  const deadlines = [
    {
      label: 'VAT Monthly Filing',
      date: '2026-04-30',
      type: 'VAT',
      status: 'PENDING',
      desc: 'Monthly VAT return for March 2026 due by end of April.' },
    {
      label: 'Income Tax Withholding',
      date: '2026-04-30',
      type: 'TAX',
      status: 'OVERDUE',
      desc: '2% Income tax withholding for March 2026 must be remitted.' },
    {
      label: 'Disaster Fund (Q1)',
      date: '2026-04-15',
      type: 'FUND',
      status: 'SUBMITTED',
      desc: 'Quarterly levy for Jan-Mar 2026 submitted to ERCA.' },
    {
      label: 'Business License Renewal',
      date: '2026-06-30',
      type: 'LICENSE',
      status: 'UPCOMING',
      desc: 'Annual trade license renewal period begins.' },
    {
      label: 'Employee Pension',
      date: '2026-04-15',
      type: 'PAYROLL',
      status: 'PENDING',
      desc: 'Pension contributions for March 2026 payroll.' },
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
return (
    <div className="space-y-4">
      {deadlines.map((d, i) => {
        const isPast =
          new Date(d.date) < new Date() && d.status !== 'SUBMITTED';
return (
          <div key={i} className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 border-slate-200 z-10 ${
                  d.status === 'SUBMITTED'
                    ? 'bg-[var(--pro-azure-50)]0'
                    : isPast
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                }`}
              />
              {i < deadlines.length - 1 && (
                <div className="w-px flex-1 bg-slate-200 my-1" />
              )}
            </div>
            <div
              className={`flex-1 pb-6 transition-all ${isPast ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  {d.label}
                </p>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(d.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
                {d.desc}
              </p>
              <div className="flex gap-2">
                <span
                  className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border ${
                    d.status === 'SUBMITTED'
                      ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] border-[var(--pro-azure)]/20'
                      : d.status === 'OVERDUE' || isPast
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  {isPast ? 'OVERDUE' : d.status}
                </span>
                <span className="text-[8px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200 uppercase tracking-tighter">
                  {d.type}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// -- Main component ------------------------------------------------------------
const DisasterFund: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { t } = useTranslation();
  usePageTitle('DRRF — Disaster Risk Reduction Fund');
  const { can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canWrite = can('disaster_fund:write');
  const canDelete = can('disaster_fund:delete');

  // -- Derive active group from URL ------------------------------------------
  const activeGroup = useMemo(() => {
    const p = location.pathname;
    if (p === '/disaster-fund' || p === '/disaster-fund/') return 'overview';
    if (p.startsWith('/disaster-fund/contributions')) return 'contributions';
    if (p.startsWith('/disaster-fund/remittance'))    return 'remittance';
    if (p.startsWith('/disaster-fund/erca'))          return 'erca';
    if (p.startsWith('/disaster-fund/analytics'))     return 'analytics';
    if (p.startsWith('/disaster-fund/config'))        return 'config';
    return 'overview';
  }, [location.pathname]);

  // -- Inner tab state (per group) -------------------------------------------
  type Tab =
    | 'dashboard' | 'contributions' | 'analytics' | 'compliance'
    | 'calculator' | 'targets' | 'reports' | 'erca';
  const [tab, setTab] = useState<Tab>('dashboard');

  // Sync inner tab when group changes
  useEffect(() => {
    const defaults: Record<string, Tab> = {
      overview: 'dashboard',
      contributions: 'contributions',
      remittance: 'compliance',
      erca: 'erca',
      analytics: 'analytics',
      config: 'targets',
    };
    setTab(defaults[activeGroup] ?? 'dashboard');
  }, [activeGroup]);

  // -- Shared state ----------------------------------------------------------
  type RootTab = 'disaster-fund' | 'levy-collection' | 'financial-reports' | 'tax-vat-reports' | 'accounting';
  const [rootTab, setRootTab] = useState<RootTab>('disaster-fund');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [rules, setRules] = useState<LevyRule[]>([]);
  const [yearSummary, setYearSummary] = useState<QuarterSummary[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditDrawer, setAuditDrawer] = useState<{ open: boolean; title: string; logs: AuditEntry[] }>({ open: false, title: '', logs: [] });
  const [detailPanel, setDetailPanel] = useState<Contribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Contribution | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [sortCol, setSortCol] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(BLANK_FORM);
  const [previewLevy, setPreviewLevy] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [analyticsYear, setAnalyticsYear] = useState(currentYear());
  const [scheduleYear, setScheduleYear] = useState(currentYear());
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [page, setPage] = useState(1);
  const [inlineNotes, setInlineNotes] = useState<{ id: string; value: string } | null>(null);

  // Accounting sub-tab and modal states
  type AccTab = 'accounts' | 'journal' | 'banks' | 'vendors' | 'recurring' | 'reconcile' | 'reports';
const [accTab, setAccTab] = useState<AccTab>('accounts');
const [accLoading, setAccLoading] = useState(false);
const [jSearch, setJSearch] = useState('');
const [jDateFrom, setJDateFrom] = useState('');
const [jDateTo, setJDateTo] = useState('');
const [accSearch, setAccSearch] = useState('');
const [accTypeFilter, setAccTypeFilter] = useState('');
const [vendorSearch, setVendorSearch] = useState('');
const [activeReportType, setActiveReportType] = useState<string>('');
const [showAccountModal, setShowAccountModal] = useState(false);
const [showJournalModal, setShowJournalModal] = useState(false);
const [showBankModal, setShowBankModal] = useState(false);
const [showVendorModal, setShowVendorModal] = useState(false);
const [journalModalIsTemplate, setJournalModalIsTemplate] = useState(false);
const [editingAccount, setEditingAccount] = useState<any>(null);
const [editingVendor, setEditingVendor] = useState<any>(null);
const [txnBank, setTxnBank] = useState<any>(null);
const [ledgerAccount, setLedgerAccount] = useState<any>(null);
  // Financial summary states
  const [finSummary, setFinSummary] = useState<any>(null);
const [healthScore, setHealthScore] = useState<any>(null);
const [reconSummary, setReconSummary] = useState<any>(null);

  // Withholding summary — fetched from real API, not localStorage
  const [withholdingApiData, setWithholdingApiData] = useState<{ total: number; unremitted: number; count: number }>({ total: 0, unremitted: 0, count: 0 });
useEffect(() => {
    if (rootTab !== 'tax-vat-reports') return;
api.get('/vat/withholding').then((res: any) => {
      const entries: any[] = res.data?.data ?? res.data ?? [];
const total = entries.reduce((s: number, e: any) => s + (e.withheldVat ?? e.withheldAmount ?? 0), 0);
const unremittedEntries = entries.filter((e: any) => !e.remitted);
      setWithholdingApiData({
        total,
        unremitted: unremittedEntries.reduce((s: number, e: any) => s + (e.withheldVat ?? e.withheldAmount ?? 0), 0),
        count: unremittedEntries.length });
    }).catch(() => {});
  }, [rootTab]);
const withholdingSummary = useMemo(() => ({
    total: withholdingApiData.unremitted,
    count: withholdingApiData.count }), [withholdingApiData]);
const [calcRows, setCalcRows] = useState<CalcRow[]>(() => {
    try {
      const d = localStorage.getItem('drf_calc_draft');
return d ? JSON.parse(d) : [newCalcRow()];
    }
catch {
      return [newCalcRow()];
    }
  });
const [calcPeriod, setCalcPeriod] = useState(
    () => localStorage.getItem('drf_calc_period') || currentPeriod(),
  );
const [calcRunning, setCalcRunning] = useState(false);
const [calcSaving, setCalcSaving] = useState(false);
const [targetsYear, setTargetsYear] = useState(currentYear());
const [targetRows, setTargetRows] = useState<TargetRow[]>([]);
const [complianceScore, setComplianceScore] =
    useState<ComplianceScore | null>(null);
const [upcomingDues, setUpcomingDues] = useState<UpcomingDue[]>([]);
const [editingTarget, setEditingTarget] = useState<{
    category: string;
    value: string;
  } | null>(null);
const [savingTarget, setSavingTarget] = useState(false);
const [remittanceModal, setRemittanceModal] = useState<Contribution | null>(
    null,
  );
const [multiYearData, setMultiYearData] = useState<YearComparison[]>([]);
const [drillDown, setDrillDown] = useState<FundCategory | null>(null);
const [showImport, setShowImport] = useState(false);
const [showAutoGenerate, setShowAutoGenerate] = useState(false);
const [ercaSubmissions, setErcaSubmissions] = useState<ErcaSubmission[]>([]);
const [ercaLoading, setErcaLoading] = useState(false);
const [ercaPreview, setErcaPreview] = useState<ErcaPayload | null>(null);
const [ercaPreviewing, setErcaPreviewing] = useState(false);
const [ercaSubmitModal, setErcaSubmitModal] = useState<ErcaSubmission | null>(
    null,
  );
const [ercaYear, setErcaYear] = useState(currentYear());
const [ercaDashStats, setErcaDashStats] = useState<ErcaDashboardStats | null>(
    null,
  );
const [ercaPeriodInput, setErcaPeriodInput] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
const [forecast, setForecast] = useState<ForecastResult | null>(null);
const [nextDue, setNextDue] = useState<NextDue | null>(null);
const [heatmapData, setHeatmapData] = useState<MonthlyHeatmapPoint[]>([]);
const [heatmapYear, setHeatmapYear] = useState(currentYear());
const [complianceHistory, setComplianceHistory] = useState<
    ErcaComplianceYear[]
  >([]);
const [oneShotPeriod, setOneShotPeriod] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
const [oneShotBizType, setOneShotBizType] = useState('');
const [oneShotRunning, setOneShotRunning] = useState(false);
const [oneShotResult, setOneShotResult] = useState<any>(null);
const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
const [savingReport, setSavingReport] = useState(false);
const [reportTitle, setReportTitle] = useState('');
const [bulkStatus, setBulkStatus] = useState('');
const [filterStatus, setFilterStatus] = useLocalStorage(
    'drf_filter_status',
    '',
  );
const [filterCategory, setFilterCategory] = useLocalStorage(
    'drf_filter_category',
    '',
  );
const [filterPeriod, setFilterPeriod] = useLocalStorage(
    'drf_filter_period',
    '',
  );
const [showShortcuts, setShowShortcuts] = useState(false);
const [ercaSearchTerm, setErcaSearchTerm] = useState('');
const [expandedRow, setExpandedRow] = useState<string | null>(null);
const [expandedErcaRow, setExpandedErcaRow] = useState<string | null>(null);
const [jumpPage, setJumpPage] = useState('');
const [autoRefresh, setAutoRefresh] = useState(false);
const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
const PER_PAGE = 15;
const exportRef = useRef<HTMLAnchorElement>(null);

  // Accounting states
  const [accounts, setAccounts] = useState<any[]>([]);
const [accountBalances, setAccountBalances] = useState<{
    accounts: any[];
    totals: any;
  } | null>(null);
const [journals, setJournals] = useState<any[]>([]);
const [banks, setBanks] = useState<any[]>([]);
const [vendors, setVendors] = useState<any[]>([]);
const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]);
const [, setLockedPeriods] = useState<string[]>([]);
const fetchFinSummary = useCallback(async () => {
    try {
      const [sumRes, balRes, reconRes, healthRes] = await Promise.all([
        api.get('/ovds/reports/financial-summary'),
        api.get('/ovds/accounts/balances'),
        api.get('/ovds/reconciliation/summary'),
        api.get('/ovds/reports/health-score'),
      ]);
      setFinSummary(sumRes.data.data || sumRes.data);
      setAccountBalances(balRes.data.data || balRes.data);
      setReconSummary(reconRes.data.data || reconRes.data);
      setHealthScore(healthRes.data.data || healthRes.data);
    }
catch {
      /* Silent fail for background summary */
    }
  }, []);
const fetchAccounting = useCallback(async () => {
    if (rootTab !== 'accounting') return;
    setAccLoading(true);
try {
      const [accRes, balRes, jRes, bRes, vRes, rRes, pRes] = await Promise.all([
        api.get('/ovds/accounts'),
        api.get('/ovds/accounts/balances'),
        api.get(
          `/ovds/journals?search=${jSearch}&startDate=${jDateFrom}&endDate=${jDateTo}`,
        ),
        api.get('/ovds/banks'),
        api.get('/ovds/vendors'),
        api.get('/ovds/recurring-journals'),
        api.get('/ovds/periods/locked'),
      ]);
      setAccounts(accRes.data.data);
      setAccountBalances(balRes.data.data);
      setJournals(jRes.data.data);
      setBanks(bRes.data.data);
      setVendors(vRes.data.data);
      setRecurringTemplates(rRes.data.data);
      setLockedPeriods(pRes.data.data);
    }
catch (err: any) { if (!err?.isRateLimited) toast.error('Failed to load accounting data');
    }
finally {
      setAccLoading(false);
    }
  }, [rootTab, jSearch, jDateFrom, jDateTo]);
useEffect(() => {
    fetchAccounting();
  }, [fetchAccounting]);
useEffect(() => {
    if (rootTab === 'disaster-fund' || rootTab === 'financial-reports')
      fetchFinSummary();
  }, [rootTab, fetchFinSummary]);
useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
if (e.ctrlKey || e.metaKey) return;
if (e.key === 'n') openAdd();
if (e.key === '?') setShowShortcuts((s) => !s);
if (e.key === 'Escape') {
        setShowShortcuts(false);
        setExpandedRow(null);
      }
    };
    window.addEventListener('keydown', handler);
return () => window.removeEventListener('keydown', handler);
  }, []);
const load = useCallback(async () => {
    setLoading(true);
try {
      const params = new URLSearchParams();
if (filterStatus) params.set('status', filterStatus);
if (filterCategory) params.set('category', filterCategory);
if (filterPeriod) params.set('period', filterPeriod);
if (debouncedSearch) params.set('search', debouncedSearch);
if (selectedCompanyId) params.set('companyId', selectedCompanyId);
const [listRes, dashRes] = await Promise.all([
        api.get(`/disaster-fund?${params}`),
        api.get(`/disaster-fund/dashboard-stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`),
      ]);
      setContributions(listRes.data.data ?? []);
      setSummary(dashRes.data.data.summary);
      setTrends(dashRes.data.data.trends ?? []);
      setUpcomingDues(dashRes.data.data.upcoming ?? []);
      setAuditLogs(dashRes.data.data.recentAudit ?? []);
if (dashRes.data.data.ercaStats)
        setErcaDashStats(dashRes.data.data.ercaStats);
if (dashRes.data.data.forecast) setForecast(dashRes.data.data.forecast);
if (dashRes.data.data.nextDue) setNextDue(dashRes.data.data.nextDue);
      setSelected(new Set());
      setPage(1);
      setLastRefreshed(new Date());
    }
catch (err: any) { if (!err?.isRateLimited) toast.error('Failed to load fund data');
    }
finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterPeriod, debouncedSearch, selectedCompanyId]);
const loadYearData = useCallback(async (year: number) => {
    try {
      const [ysRes, schedRes] = await Promise.all([
        api.get(`/disaster-fund/year-summary/${year}`),
        api.get(`/disaster-fund/schedule/${year}`),
      ]);
      setYearSummary(ysRes.data.data);
      setSchedule(schedRes.data.data);
    }
catch {
      /* silent */
    }
  }, []);
const loadTargetsData = useCallback(async (year: number) => {
    try {
      const [tvRes, csRes, udRes] = await Promise.all([
        api.get(`/disaster-fund/targets/${year}/vs-actual`),
        api.get(`/disaster-fund/compliance-score/${year}`),
        api.get('/disaster-fund/upcoming-dues?days=30'),
      ]);
      setTargetRows(tvRes.data.data);
      setComplianceScore(csRes.data.data);
      setUpcomingDues(udRes.data.data ?? []);
    }
catch {
      /* silent */
    }
  }, []);
useEffect(() => {
    load();
  }, [load]);
useEffect(() => {
    loadYearData(analyticsYear);
  }, [analyticsYear, loadYearData]);
useEffect(() => {
    if (tab === 'compliance') {
      loadYearData(scheduleYear);
      loadTargetsData(scheduleYear);
    }
  }, [tab, scheduleYear, loadYearData, loadTargetsData]);
useEffect(() => {
    loadTargetsData(targetsYear);
  }, [targetsYear, loadTargetsData]);
useEffect(() => {
    if (tab === 'targets') loadTargetsData(targetsYear);
  }, [tab, targetsYear, loadTargetsData]);
useEffect(() => {
    api
      .get('/disaster-fund/upcoming-dues?days=30')
      .then((r: any) => setUpcomingDues(r.data.data ?? []))
      .catch(() => {});
  }, []);
useEffect(() => {
    api
      .get('/disaster-fund/rules')
      .then((r: any) => setRules(r.data.data))
      .catch(() => {});
  }, []);
useEffect(() => {
    if (tab === 'analytics') {
      const cur = currentYear();
      api
        .get(`/disaster-fund/multi-year?years=${cur - 2},${cur - 1},${cur}`)
        .then((r: any) => setMultiYearData(r.data.data))
        .catch(() => {});
      api
        .get(`/disaster-fund/analytics/monthly-heatmap/${heatmapYear}`)
        .then((r: any) => setHeatmapData(r.data.data))
        .catch(() => {});
      api
        .get(`/disaster-fund/erca/compliance-history`)
        .then((r: any) => setComplianceHistory(r.data.data))
        .catch(() => {});
    }
  }, [tab, heatmapYear]);
useEffect(() => {
    if (tab === 'reports') {
      api
        .get('/disaster-fund/reports')
        .then((r: any) => setSavedReports(r.data.data))
        .catch(() => {});
    }
  }, [tab]);
const loadErcaSubmissions = useCallback(async (year: number) => {
    setErcaLoading(true);
try {
      const res = await api.get(`/disaster-fund/erca/submissions?year=${year}`);
      setErcaSubmissions(res.data.data ?? []);
    }
catch {
      /* silent */
    }
finally {
      setErcaLoading(false);
    }
  }, []);
useEffect(() => {
    if (tab === 'erca') loadErcaSubmissions(ercaYear);
  }, [tab, ercaYear, loadErcaSubmissions]);

  // Auto-refresh every 60s when enabled
  useInterval(load, autoRefresh ? 60_000 : null);

  // Persist calculator draft
  useEffect(() => {
    try {
      localStorage.setItem('drf_calc_draft', JSON.stringify(calcRows));
    }
catch {
      /* ignore */
    }
  }, [calcRows]);
useEffect(() => {
    try {
      localStorage.setItem('drf_calc_period', calcPeriod);
    }
catch {
      /* ignore */
    }
  }, [calcPeriod]);
const sortedContributions = useMemo(() => {
    const arr = [...contributions];
    arr.sort((a, b) => {
      let av: any = a[sortCol as keyof Contribution] ?? '';
let bv: any = b[sortCol as keyof Contribution] ?? '';
if (typeof av === 'string') av = av.toLowerCase();
if (typeof bv === 'string') bv = bv.toLowerCase();
if (av < bv) return sortDir === 'asc' ? -1 : 1;
if (av > bv) return sortDir === 'asc' ? 1 : -1;
return 0;
    });
return arr;
  }, [contributions, sortCol, sortDir]);
const paged = sortedContributions.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );
const totalPages = Math.max(1, Math.ceil(contributions.length / PER_PAGE));
const remittanceRate = summary
    ? summary.totalLevy > 0
      ? (summary.totalRemitted / summary.totalLevy) * 100
      : 0
    : 0;
const hasOverdue = (summary?.totalOverdue ?? 0) > 0;
const yearOptions = Array.from(
    { length: 5 },
    (_, i) => currentYear() - 2 + i,
  );
const ercaFilteredSubmissions = useMemo(() => {
    if (!ercaSearchTerm.trim()) return ercaSubmissions;
const q = ercaSearchTerm.toLowerCase();
return ercaSubmissions.filter(
      (s) =>
        s.period.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        (s.ercaReferenceNo ?? '').toLowerCase().includes(q) ||
        (s.bankName ?? '').toLowerCase().includes(q),
    );
  }, [ercaSubmissions, ercaSearchTerm]);
const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  };
const handlePreview = async (cat = form.category, amt = form.baseAmount) => {
    if (!amt || isNaN(Number(amt))) return;
try {
      const res = await api.post('/disaster-fund/calculate-levy', {
        category: cat,
        baseAmount: Number(amt) });
      setPreviewLevy(res.data.data.levyAmount);
    }
catch {
      /* silent */
    }
  };
const openAdd = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setPreviewLevy(null);
    setShowModal(true);
  };
const openEdit = (c: Contribution) => {
    setEditTarget(c);
    setForm({
      category: c.category,
      description: c.description ?? '',
      baseAmount: String(c.baseAmount),
      period: c.period,
      dueDate: c.dueDate ? c.dueDate.split('T')[0] : '',
      notes: c.notes ?? '' });
    setPreviewLevy(c.levyAmount);
    setShowModal(true);
  };
const openAudit = async (id: string, label: string) => {
    try {
      const res = await api.get(`/disaster-fund/${id}/audit-logs`);
      setAuditDrawer({
        open: true,
        title: `Audit — ${label}`,
        logs: res.data.data });
    }
catch (err: any) { if (!err?.isRateLimited) toast.error('Failed to load audit log');
    }
  };
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
if (!form.baseAmount || isNaN(Number(form.baseAmount))) {
      toast.error('Enter a valid base amount');
return;
    }
    setSaving(true);
try {
      if (editTarget) {
        await api.patch(`/disaster-fund/${editTarget.id}`, {
          notes: form.notes });
toast.success('Updated');
      } else {
        await api.post('/disaster-fund', {
          ...form,
          baseAmount: Number(form.baseAmount),
          dueDate: form.dueDate || undefined });
toast.success('Contribution recorded');
      }
      setShowModal(false);
      setForm(BLANK_FORM);
      setPreviewLevy(null);
      setEditTarget(null);
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to save');
    }
finally {
      setSaving(false);
    }
  };
const handleRemit = async (id: string) => {
    try {
      await api.patch(`/disaster-fund/${id}`, {
        status: 'REMITTED',
        remittedAt: new Date().toISOString() });
toast.success('Marked as remitted');
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to update');
    }
  };
const handleBulkRemit = async () => {
    if (!selected.size) return;
try {
      await api.patch('/disaster-fund/bulk-remit', { ids: [...selected] });
toast.success(`${selected.size} contributions remitted`);
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Bulk remit failed');
    }
  };
const handleBulkStatusChange = async (status: string) => {
    if (!selected.size || !status) return;
try {
      const r = await api.post('/disaster-fund/bulk-status', {
        ids: [...selected],
        status });
toast.success(
        `${r.data.data.updated} contributions updated to ${status}`,
      );
      setBulkStatus('');
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Bulk update failed');
    }
  };
const handleSaveReport = async () => {
    const title =
      reportTitle.trim() || `Report ${new Date().toLocaleDateString()}`;
    setSavingReport(true);
try {
      await api.post('/disaster-fund/reports', {
        title,
        period: filterPeriod || undefined,
        status: filterStatus || undefined,
        year: filterPeriod ? undefined : currentYear() });
toast.success('Report saved');
      setReportTitle('');
      api
        .get('/disaster-fund/reports')
        .then((r: any) => setSavedReports(r.data.data))
        .catch(() => {});
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to save report');
    }
finally {
      setSavingReport(false);
    }
  };
const handleDeleteReport = async (id: string) => {
    try {
      await api.delete(`/disaster-fund/reports/${id}`);
      setSavedReports((prev) => prev.filter((r) => r.id !== id));
toast.success('Report deleted');
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to delete report');
    }
  };
const handleFlagOverdue = async () => {
    setFlagging(true);
try {
      const r = await api.patch('/disaster-fund/flag-overdue', {});
toast.success(`${r.data.data?.flagged ?? 0} contributions flagged as overdue`);
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to flag overdue');
    }
finally {
      setFlagging(false);
    }
  };
const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error('Insufficient permissions');
return;
    }
if (
      !(await confirm({
        title: 'Delete this contribution record?',
        variant: 'danger',
        confirmLabel: 'Delete' }))
    )
      return;
try {
      await api.delete(`/disaster-fund/${id}`);
toast.success('Deleted');
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to delete');
    }
  };
const handleInlineNotesSave = async () => {
    if (!inlineNotes) return;
try {
      await api.patch(`/disaster-fund/${inlineNotes.id}`, {
        notes: inlineNotes.value });
toast.success('Notes saved');
      setInlineNotes(null);
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to save notes');
    }
  };
const handleReceipt = async (id: string) => {
    try {
      const token = localStorage.getItem('ovds_token') || '';
const res = await fetch(`/api/disaster-fund/${id}/receipt`, {
        headers: { Authorization: `${BEARER_PREFIX}${token}` } });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = exportRef.current!;
      a.href = url;
      a.download = `receipt-${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to download receipt');
    }
  };
const handleExportPdf = async () => {
    try {
      const params = new URLSearchParams();
if (filterStatus) params.set('status', filterStatus);
if (filterPeriod) params.set('period', filterPeriod);
const token = localStorage.getItem('ovds_token') || '';
const res = await fetch(`/api/disaster-fund/export-pdf?${params}`, {
        headers: { Authorization: `${BEARER_PREFIX}${token}` } });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = exportRef.current!;
      a.href = url;
      a.download = `disaster-fund-report-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('PDF export failed');
    }
  };
const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
if (filterStatus) params.set('status', filterStatus);
if (filterPeriod) params.set('period', filterPeriod);
if (search) params.set('search', search);
const token = localStorage.getItem('ovds_token') || '';
const res = await fetch(`/api/disaster-fund/export-csv?${params}`, {
        headers: { Authorization: `${BEARER_PREFIX}${token}` } });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = exportRef.current!;
      a.href = url;
      a.download = `disaster-fund-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Export failed');
    }
  };
const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
if (n.has(id)) { n.delete(id); } else { n.add(id); }
return n;
    });
const toggleAll = () => {
    const pageIds = paged.map((c, i) => c.id);
const allSel = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const n = new Set(prev);
      pageIds.forEach((id) => (allSel ? n.delete(id) : n.add(id)));
return n;
    });
  };
const handleGenerateSchedule = async () => {
    setGeneratingSchedule(true);
try {
      const r = await api.post('/disaster-fund/schedule/generate', {
        year: scheduleYear });
toast.success(
        `Generated ${r.data.data.generated} schedule entries for ${scheduleYear}`,
      );
      loadYearData(scheduleYear);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to generate schedule');
    }
finally {
      setGeneratingSchedule(false);
    }
  };
const handleScheduleStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/disaster-fund/schedule/${id}`, { status });
      loadYearData(scheduleYear);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to update schedule');
    }
  };
const handleOneShotGenerate = async () => {
    if (!oneShotPeriod.trim()) {
      toast.error('Enter a period');
return;
    }
    setOneShotRunning(true);
    setOneShotResult(null);
try {
      const res = await api.post('/disaster-fund/erca/bulk-generate-prepare', {
        period: oneShotPeriod.trim(),
        businessType: oneShotBizType || undefined });
      setOneShotResult(res.data.data);
toast.success(
        `Generated ${res.data.data.generated} contributions, ERCA prepared — ETB ${fmt(res.data.data.ercaSubmission?.totalLevy ?? 0)}`,
      );
      load();
      loadErcaSubmissions(ercaYear);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('One-shot generation failed');
    }
finally {
      setOneShotRunning(false);
    }
  };
const runCalculator = async () => {
    const valid = calcRows.filter(
      (r) => r.baseAmount && !isNaN(Number(r.baseAmount)),
    );
if (!valid.length) {
      toast.error('Add at least one row with a base amount');
return;
    }
    setCalcRunning(true);
try {
      const res = await api.post('/disaster-fund/batch-calculate', {
        items: valid.map((r, i) => ({
          category: r.category,
          baseAmount: Number(r.baseAmount),
          label: r.label || undefined })) });
const results: any[] = res.data.data;
      setCalcRows((prev) =>
        prev.map((row, i) => {
          const match = results.find((_, ri) => ri === valid.indexOf(prev[i]));
return match ? { ...row, levyAmount: match.levyAmount } : row;
        }),
      );
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Calculation failed');
    }
finally {
      setCalcRunning(false);
    }
  };
const saveAllCalcRows = async () => {
    const ready = calcRows.filter((r) => r.levyAmount !== null && r.baseAmount);
if (!ready.length) {
      toast.error('Run the calculator first');
return;
    }
    setCalcSaving(true);
try {
      await Promise.all(
        ready.map((r, i) =>
          api.post('/disaster-fund', {
            category: r.category,
            baseAmount: Number(r.baseAmount),
            description: r.label || undefined,
            period: calcPeriod }),
        ),
      );
toast.success(`${ready.length} contributions recorded`);
      setCalcRows([newCalcRow()]);
      localStorage.removeItem('drf_calc_draft');
      load();
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to save contributions');
    }
finally {
      setCalcSaving(false);
    }
  };
const calcTotal = calcRows.reduce((s, r) => s + (r.levyAmount ?? 0), 0);
const handleSaveTarget = async (category: string, value: string) => {
    const amt = Number(value);
if (isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount');
return;
    }
    setSavingTarget(true);
try {
      await api.put('/disaster-fund/targets', {
        year: targetsYear,
        category,
        targetAmount: amt });
toast.success('Target saved');
      setEditingTarget(null);
      loadTargetsData(targetsYear);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to save target');
    }
finally {
      setSavingTarget(false);
    }
  };
const handleDeleteTarget = async (id: string) => {
    try {
      await api.delete(`/disaster-fund/targets/${id}`);
toast.success('Target removed');
      loadTargetsData(targetsYear);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to delete target');
    }
  };
const duplicateCalcRow = (idx: number) => {
    const row = calcRows[idx];
    setCalcRows((prev) => [
      ...prev.slice(0, idx + 1),
      { ...row, id: Math.random().toString(36).slice(2), levyAmount: null },
      ...prev.slice(idx + 1),
    ]);
  };
const loadReport = (r: SavedReport) => {
    if (r.period) setFilterPeriod(r.period);
if (r.status) setFilterStatus(r.status);
    setTab('contributions');
    navigate('/disaster-fund/contributions');
toast.success(`Loaded: ${r.title}`);
  };
const TABS = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={14} /> },
    {
      key: 'contributions',
      label: 'Contributions',
      icon: <ListChecks size={14} />,
      badge: summary?.count.overdue },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
    {
      key: 'compliance',
      label: 'Compliance',
      icon: <CalendarClock size={14} /> },
    { key: 'targets', label: 'Targets', icon: <TrendingUp size={14} /> },
    { key: 'calculator', label: 'Calculator', icon: <Calculator size={14} /> },
    { key: 'reports', label: 'Reports', icon: <FileText size={14} /> },
    {
      key: 'erca',
      label: 'ERCA Submit',
      icon: <Globe size={14} />,
      badge:
        ercaSubmissions.filter((s) => s.status === 'PENDING').length ||
        undefined },
  ] as const;
const SortTh: React.FC<{ col: string; label: string }> = ({ col, label }) => (
    <th
      className="px-4 py-3 text-left cursor-pointer select-none group bg-white first:rounded-tl-xl last:rounded-tr-xl"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-0.5 ovds-label group-hover:text-slate-700 transition-colors">
        {label}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </span>
    </th>
  );
return (
    <AppPage
      title="Disaster Risk Reduction Fund (DRRF)"
      subtitle="Tax & Compliance → Reg. 570/2025 · Levy collection, remittance, and ERCA submissions"
      icon={<ShieldAlert size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <RefreshCw size={14} />
          </button>
          {canWrite && (
            <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-xs font-bold transition-colors">
              <Plus size={13} /> New Contribution
            </button>
          )}
        </div>
      }
    >
      <a ref={exportRef} className="hidden" />
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* IASB strip */}
      {can('disaster_fund:read') && <IASBUpdateBanner variant="strip" filterByImpact="high" />}

      {/* -- Two-column layout: left group nav + right content ----------------- */}
      {rootTab === 'disaster-fund' && <div className="flex min-h-[calc(100vh-120px)]">

        {/* -- Left group navigation (ovds-style) ----------------------- */}
        <aside className="w-56 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 py-4 px-3 space-y-0.5">

          {/* Fund summary pill */}
          <div className="mb-4 px-2 py-3 rounded-xl bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]">
            <p className="text-[10px] font-medium text-[var(--pro-azure-light)] uppercase tracking-wider mb-2">Fund Status</p>
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-3 bg-[var(--pro-azure-100)] rounded animate-pulse" />
                <div className="h-3 bg-[var(--pro-azure-100)] rounded animate-pulse w-3/4" />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Total Levy</span>
                  <span className="font-bold text-slate-900">ETB {fmt(summary?.totalLevy ?? 0)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--pro-azure)]">Remitted</span>
                  <span className="font-semibold text-[var(--pro-azure-dark)]">ETB {fmt(summary?.totalRemitted ?? 0)}</span>
                </div>
                {(summary?.totalOverdue ?? 0) > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-rose-600">Overdue</span>
                    <span className="font-semibold text-rose-700">ETB {fmt(summary?.totalOverdue ?? 0)}</span>
                  </div>
                )}
                {/* Remittance progress bar */}
                <div className="mt-2 h-1.5 bg-[var(--pro-azure-100)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(summary && summary.totalLevy > 0 ? (summary.totalRemitted / summary.totalLevy) * 100 : 0, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-[var(--pro-azure-light)] text-right">
                  {summary && summary.totalLevy > 0 ? ((summary.totalRemitted / summary.totalLevy) * 100).toFixed(1) : '0'}% remitted
                </p>
              </div>
            )}
          </div>

          {/* -- Functional groups -- */}
          {[
            {
              group: 'overview',
              to: '/disaster-fund',
              icon: <LayoutDashboard size={15} />,
              label: 'Overview',
              desc: 'Dashboard & KPIs',
              badge: undefined as number | undefined,
            },
            {
              group: 'contributions',
              to: '/disaster-fund/contributions',
              icon: <ListChecks size={15} />,
              label: 'Levy Collection',
              desc: 'Record & manage levies',
              badge: summary?.count.pending,
            },
            {
              group: 'remittance',
              to: '/disaster-fund/remittance',
              icon: <ArrowUpRight size={15} />,
              label: 'Remittance',
              desc: 'Schedule & bank transfers',
              badge: summary?.count.overdue,
            },
            {
              group: 'erca',
              to: '/disaster-fund/erca',
              icon: <Globe size={15} />,
              label: 'ERCA Submissions',
              desc: 'File & acknowledge',
              badge: undefined,
            },
            {
              group: 'analytics',
              to: '/disaster-fund/analytics',
              icon: <BarChart3 size={15} />,
              label: 'Analytics',
              desc: 'Trends & forecasts',
              badge: undefined,
            },
            ...(canWrite ? [{
              group: 'config',
              to: '/disaster-fund/config',
              icon: <Calculator size={15} />,
              label: 'Configuration',
              desc: 'Targets & rules',
              badge: undefined as number | undefined,
            }] : []),
          ].map(item => {
            const isActive = activeGroup === item.group;
            return (
              <NavLink
                key={item.group}
                to={item.to}
                end={item.group === 'overview'}
                className={() =>
                  `group flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg transition-all duration-150 relative
                   ${isActive
                     ? 'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]'
                     : 'hover:bg-white border border-transparent'}`
                }
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[var(--pro-azure-50)]0 rounded-r-full" />
                )}
                <span className={`shrink-0 mt-0.5 ${isActive ? 'text-[var(--pro-azure)]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[12px] font-semibold truncate ${isActive ? 'text-[var(--pro-azure-dark)]' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    {!!item.badge && item.badge > 0 && (
                      <span className={`shrink-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium rounded-full px-1
                        ${item.group === 'remittance' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-[var(--pro-azure)]' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </div>
              </NavLink>
            );
          })}

          {/* -- Policy inheritance indicator -- */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="px-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Policy Inheritance</p>
            <div className="space-y-1 px-2">
              {[
                { label: 'Reg. 570/2025', color: 'bg-[var(--pro-azure-50)]0', desc: 'Levy rates' },
                { label: 'ERCA Rules', color: 'bg-[var(--pro-azure-50)]0', desc: 'Filing deadlines' },
                { label: 'Company Policy', color: 'bg-amber-500', desc: 'Remittance flow' },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.color}`} />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-600">{p.label}</span>
                    <span className="text-[9px] text-slate-400 ml-1">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* -- Related modules -- */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="px-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Related Modules</p>
            <div className="space-y-0.5">
              {[
                { key: 'financial-reports', label: 'Financial Reports', icon: <BarChart3 size={13} />, color: 'text-[var(--pro-azure)]' },
                { key: 'tax-vat-reports',   label: 'VAT & Tax',         icon: <ShieldCheck size={13} />, color: 'text-[var(--pro-azure)]' },
                { key: 'levy-collection',   label: 'Levy Collection',   icon: <Banknote size={13} />, color: 'text-rose-600' },
                { key: 'accounting',        label: 'Accounting',        icon: <Landmark size={13} />, color: 'text-violet-600' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setRootTab(m.key as any)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all
                    ${rootTab === m.key
                      ? 'bg-slate-100 text-slate-800'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <span className={m.color}>{m.icon}</span>
                  {m.label}
                  {rootTab === m.key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-400" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* -- Right content area --------------------------------------------- */}
        <main className="flex-1 min-w-0 p-6 space-y-5">

          {/* Group header with breadcrumb */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <span>Disaster Fund</span>
                <ChevronRight size={10} />
                <span className="text-slate-600 font-medium capitalize">
                  {activeGroup === 'overview' ? 'Overview' :
                   activeGroup === 'contributions' ? 'Levy Collection' :
                   activeGroup === 'remittance' ? 'Remittance' :
                   activeGroup === 'erca' ? 'ERCA Submissions' :
                   activeGroup === 'analytics' ? 'Analytics' : 'Configuration'}
                </span>
              </div>
              {/* Policy inheritance chain */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-[var(--pro-azure-50)] text-[var(--pro-azure)] font-semibold border border-[var(--pro-azure-100)]">Reg. 570/2025</span>
                <ChevronRight size={9} />
                <span className="px-1.5 py-0.5 rounded bg-[var(--pro-azure-50)] text-[var(--pro-azure)] font-semibold border border-[var(--pro-azure-100)]">ERCA</span>
                <ChevronRight size={9} />
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200 capitalize">
                  {activeGroup === 'overview' ? 'Dashboard' :
                   activeGroup === 'contributions' ? 'Levy Collection' :
                   activeGroup === 'remittance' ? 'Remittance' :
                   activeGroup === 'erca' ? 'ERCA Submissions' :
                   activeGroup === 'analytics' ? 'Analytics' : 'Configuration'}
                </span>
              </div>
            </div>

            {/* Group-specific quick actions */}
            <div className="flex items-center gap-2">
              {activeGroup === 'contributions' && canWrite && (
                <button onClick={openAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-xs font-semibold transition-all shadow-sm">
                  <Plus size={13} /> Record Levy
                </button>
              )}
              {activeGroup === 'contributions' && (
                <button onClick={() => setShowAutoGenerate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-xs font-medium transition-all">
                  <Zap size={13} /> Auto-Generate
                </button>
              )}
              {activeGroup === 'remittance' && (
                <button onClick={handleFlagOverdue} disabled={flagging}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-all disabled:opacity-50">
                  <AlertTriangle size={13} /> {flagging ? 'Flagging…' : 'Flag Overdue'}
                </button>
              )}
              {activeGroup === 'erca' && canWrite && (
                <button onClick={() => { setTab('erca'); navigate('/disaster-fund/erca'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-xs font-semibold transition-all shadow-sm">
                  <Send size={13} /> Prepare Submission
                </button>
              )}
              <button onClick={() => setAuditDrawer({ open: true, title: 'Recent Activity', logs: auditLogs })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all">
                <History size={13} /> Activity
              </button>
            </div>
          </div>

          {/* -- Overdue alert -- */}
          {(summary?.count.overdue ?? 0) > 0 && activeGroup !== 'analytics' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <p className="text-sm text-rose-700 flex-1">
                <span className="font-bold">{summary!.count.overdue} overdue contribution{summary!.count.overdue > 1 ? 's' : ''}</span>
                {' '}totalling <span className="font-bold">ETB {fmt(summary!.totalOverdue)}</span> require immediate remittance.
              </p>
              <button
                onClick={() => { navigate('/disaster-fund/remittance'); setTab('compliance'); }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 whitespace-nowrap flex items-center gap-1">
                View <ChevronRight size={11} />
              </button>
            </div>
          )}

          {/* -- Inner tabs (group-specific) -- */}
          {activeGroup === 'overview' && (
            <div className="flex gap-0 border-b border-slate-200 -mb-px overflow-x-auto">
              {([
                { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={13} /> },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px
                    ${tab === t.key ? 'border-[var(--pro-azure)] text-[var(--pro-azure)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          )}

          {activeGroup === 'contributions' && (
            <div className="flex gap-0 border-b border-slate-200 -mb-px overflow-x-auto">
              {([
                { key: 'contributions' as Tab, label: 'Contributions', icon: <ListChecks size={13} />, badge: summary?.count.overdue },
                { key: 'calculator' as Tab, label: 'Levy Calculator', icon: <Calculator size={13} /> },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px
                    ${tab === t.key ? 'border-[var(--pro-azure)] text-[var(--pro-azure)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {t.icon}{t.label}
                  {t.badge ? <span className="min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">{t.badge}</span> : null}
                </button>
              ))}
            </div>
          )}

          {activeGroup === 'remittance' && (
            <div className="flex gap-0 border-b border-slate-200 -mb-px overflow-x-auto">
              {([
                { key: 'compliance' as Tab, label: 'Schedule', icon: <CalendarClock size={13} /> },
                { key: 'reports' as Tab, label: 'Saved Reports', icon: <FileText size={13} /> },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px
                    ${tab === t.key ? 'border-[var(--pro-azure)] text-[var(--pro-azure)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          )}

          {activeGroup === 'erca' && (
            <div className="flex gap-0 border-b border-slate-200 -mb-px overflow-x-auto">
              {([
                { key: 'erca' as Tab, label: 'ERCA Submissions', icon: <Globe size={13} /> },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px
                    ${tab === t.key ? 'border-[var(--pro-azure)] text-[var(--pro-azure)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          )}

          {activeGroup === 'analytics' && (
            <div className="flex gap-0 border-b border-slate-200 -mb-px overflow-x-auto">
              {([
                { key: 'analytics' as Tab, label: 'Trends & Forecast', icon: <BarChart3 size={13} /> },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px
                    ${tab === t.key ? 'border-[var(--pro-azure)] text-[var(--pro-azure)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          )}

          {activeGroup === 'config' && (
            <div className="flex gap-0 border-b border-slate-200 -mb-px overflow-x-auto">
              {([
                { key: 'targets' as Tab, label: 'Targets', icon: <TrendingUp size={13} /> },
              ]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px
                    ${tab === t.key ? 'border-[var(--pro-azure)] text-[var(--pro-azure)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          )}

          {/* -- Modals & drawers -- */}
          {selected.size > 0 && tab === 'contributions' && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-gray-900/10 backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-600 mr-1">{selected.size} selected</span>
              <button onClick={handleBulkRemit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-xs font-bold transition-all">
                <CheckCircle2 size={12} /> Remit all
              </button>
              <button onClick={() => handleBulkStatusChange('OVERDUE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all">
                <AlertTriangle size={12} /> Mark overdue
              </button>
              {canDelete && (
                <button onClick={async () => {
                  if (!(await confirm({ title: `Delete ${selected.size} contributions?`, variant: 'danger', confirmLabel: 'Delete All' }))) return;
                  try {
                    await Promise.all([...selected].map(id => api.delete(`/disaster-fund/${id}`)));
                    toast.success(`${selected.size} deleted`);
                    setSelected(new Set());
                    load();
                  } catch (err: any) { if (!err?.isRateLimited) toast.error('Bulk delete failed'); }
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all">
                  <Trash2 size={12} /> Delete
                </button>
              )}
              <button onClick={() => setSelected(new Set())} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all ml-1">
                <X size={13} />
              </button>
            </div>
          )}
          {auditDrawer.open && <AuditDrawer logs={auditDrawer.logs} title={auditDrawer.title} onClose={() => setAuditDrawer(a => ({ ...a, open: false }))} />}
          {detailPanel && <DetailPanel contribution={detailPanel} onClose={() => setDetailPanel(null)} onRemit={handleRemit} onReceipt={handleReceipt} onAudit={openAudit} onRecordRemittance={c => { setDetailPanel(null); setRemittanceModal(c); }} />}
          {remittanceModal && <RemittanceModal contribution={remittanceModal} onClose={() => setRemittanceModal(null)} onSaved={load} />}
          {drillDown && <DrillDownModal category={drillDown} onClose={() => setDrillDown(null)} />}
          {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={load} />}
          {showAutoGenerate && <AutoGenerateModal onClose={() => setShowAutoGenerate(false)} onGenerated={load} />}
          {ercaSubmitModal && <ErcaSubmitModal submission={ercaSubmitModal} onClose={() => setErcaSubmitModal(null)} onSubmitted={() => { setErcaSubmitModal(null); loadErcaSubmissions(ercaYear); }} />}

          {/* -- Tab content -- */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <>
          {/* -- DASHBOARD TAB -- */}
          {(activeGroup === 'overview') && tab === 'dashboard' && (
            <div className="space-y-5">
              {/* Unified Financial Hub Summary */}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--pro-azure-100)] flex items-center justify-center">
                      <Globe size={16} className="text-[var(--pro-azure)]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Unified Financial Hub
                      </h2>
                      <p className="ovds-caption mt-0.5">
                        Real-time system-wide financial & tax status
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRootTab('financial-reports')}
                      className="px-3 py-1.5 bg-[var(--pro-azure-50)] text-[var(--pro-azure)] rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--pro-azure-100)] transition-all"
                    >
                      Reports
                    </button>
                    <button
                      onClick={() => setRootTab('accounting')}
                      className="px-3 py-1.5 bg-[var(--pro-azure-50)] text-[var(--pro-azure-light)] rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--pro-azure-100)] transition-all"
                    >
                      Accounting
                    </button>
                    <button
                      onClick={() => setRootTab('tax-vat-reports')}
                      className="px-3 py-1.5 bg-[var(--pro-azure-50)] text-[var(--pro-azure)] rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--pro-azure-100)] transition-all"
                    >
                      Tax / VAT
                    </button>
                  </div>
                </div>

                <div className="ovds-grid-layout cols-4">
                  <div
                    className="bg-white/40 border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all cursor-pointer group"
                    onClick={() => setRootTab('financial-reports')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-[var(--pro-azure)]" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Profit & Loss
                        </span>
                      </div>
                      <ArrowUpRight
                        size={12}
                        className="text-slate-400 group-hover:text-[var(--pro-azure)] transition-colors"
                      />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      ETB {fmt(finSummary?.netProfit ?? 0)}
                    </p>
                    <p
                      className={`text-[9px] mt-1 flex items-center gap-1 ${(finSummary?.netProfit ?? 0) >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}
                    >
                      {(finSummary?.netProfit ?? 0) >= 0 ? (
                        <ArrowUpRight size={10} />
                      ) : (
                        <ArrowDownRight size={10} />
                      )}
                      Monthly Net position
                    </p>
                  </div>

                  <div
                    className="bg-white/40 border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all cursor-pointer group"
                    onClick={() => setRootTab('tax-vat-reports')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[var(--pro-azure)]" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Aged Withholding
                        </span>
                      </div>
                      <ArrowUpRight
                        size={12}
                        className="text-slate-400 group-hover:text-[var(--pro-azure)] transition-colors"
                      />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      ETB {fmt(withholdingSummary.total)}
                    </p>
                    <p className="text-[9px] text-amber-600 mt-1">
                      {withholdingSummary.count} unremitted items
                    </p>
                  </div>

                  <div
                    className="bg-white/40 border border-slate-100 rounded-xl p-4 hover:border-violet-500/30 transition-all cursor-pointer group"
                    onClick={() => setRootTab('accounting')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Landmark size={14} className="text-violet-400" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Bank Balances
                        </span>
                      </div>
                      <ArrowUpRight
                        size={12}
                        className="text-slate-400 group-hover:text-violet-400 transition-colors"
                      />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      ETB {fmt(accountBalances?.totals?.balance ?? 0)}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Across {accountBalances?.accounts?.length ?? 0} accounts
                    </p>
                  </div>

                  <div
                    className="bg-white/40 border border-slate-100 rounded-xl p-4 hover:border-[var(--pro-azure-100)] transition-all cursor-pointer group"
                    onClick={() => setRootTab('financial-reports')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-[var(--pro-azure)]" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Health Score
                        </span>
                      </div>
                      <ArrowUpRight
                        size={12}
                        className="text-slate-400 group-hover:text-[var(--pro-azure)] transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl font-semibold ${healthScore?.grade === 'A' ? 'text-[var(--pro-azure)]' : healthScore?.grade === 'B' ? 'text-[var(--pro-azure)]' : 'text-amber-500'}`}
                      >
                        {healthScore?.grade ?? '—'}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {healthScore?.overall ?? 0}%
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                          Overall Score
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <StatsSkeleton />
              ) : (
                <div className="ovds-grid-layout cols-4">
                  {[
                    {
                      label: 'Total Levy',
                      value: summary?.totalLevy ?? 0,
                      sub: `${summary?.count.total ?? 0} records`,
                      icon: <TrendingUp size={16} />,
                      color: 'text-[var(--pro-azure)]',
                      bg: 'bg-[var(--pro-azure-50)]',
                      filter: '' },
                    {
                      label: 'Remitted',
                      value: summary?.totalRemitted ?? 0,
                      sub: `${summary?.count.remitted ?? 0} records`,
                      icon: <CheckCircle2 size={16} />,
                      color: 'text-[var(--pro-azure)]',
                      bg: 'bg-[var(--pro-azure-50)]',
                      filter: 'REMITTED' },
                    {
                      label: 'Pending',
                      value: summary?.totalPending ?? 0,
                      sub: `${summary?.count.pending ?? 0} records`,
                      icon: <Clock size={16} />,
                      color: 'text-amber-600',
                      bg: 'bg-amber-50',
                      filter: 'PENDING' },
                    {
                      label: 'Overdue',
                      value: summary?.totalOverdue ?? 0,
                      sub: `${summary?.count.overdue ?? 0} records`,
                      icon: <AlertTriangle size={16} />,
                      color: 'text-rose-600',
                      bg: 'bg-rose-50',
                      filter: 'OVERDUE' },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      onClick={() => {
                        if (s.filter) {
                          setFilterStatus(s.filter);
                          setTab('contributions');
                          navigate('/disaster-fund/contributions');
                        }
                      }}
                      className={`bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 transition-all ${s.filter ? 'hover:border-slate-300/60 cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3 ${s.color}`}
                      >
                        {s.icon}
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {s.label}
                      </p>
                      <p className={`text-xl font-semibold mt-1 ${s.color}`}>
                        ETB {fmt(s.value)}
                      </p>
                      <p className="ovds-caption mt-0.5">
                        {s.sub}
                        {s.filter && (
                          <span className="ml-1 text-slate-700">→</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="ovds-grid-layout cols-4">
                <div className="lg:col-span-3 ovds-grid-layout cols-3">
                  <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Fund Health
                    </p>
                    <FundHealthWidget summary={summary} loading={loading} />
                  </div>
                  <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Remittance Rate
                    </p>
                    {loading ? (
                      <Skeleton className="h-24" />
                    ) : (
                      <>
                        <div className="flex items-end gap-3 mb-3">
                          <span className="text-4xl font-semibold text-slate-900">
                            {remittanceRate.toFixed(1)}%
                          </span>
                          <span className="text-sm text-slate-400 mb-1">
                            of total levy remitted
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-indigo-500 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(remittanceRate, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {[
                            {
                              label: 'Remitted',
                              pct: summary
                                ? (summary.totalRemitted /
                                    Math.max(summary.totalLevy, 1)) *
                                  100
                                : 0,
                              color: 'text-[var(--pro-azure)]' },
                            {
                              label: 'Pending',
                              pct: summary
                                ? (summary.totalPending /
                                    Math.max(summary.totalLevy, 1)) *
                                  100
                                : 0,
                              color: 'text-amber-600' },
                            {
                              label: 'Overdue',
                              pct: summary
                                ? (summary.totalOverdue /
                                    Math.max(summary.totalLevy, 1)) *
                                  100
                                : 0,
                              color: 'text-rose-600' },
                          ].map((s, i) => (
                            <div
                              key={s.label}
                              className="bg-white/60 rounded-xl p-2.5 text-center"
                            >
                              <p className={`text-base font-semibold ${s.color}`}>
                                {s.pct.toFixed(1)}%
                              </p>
                              <p className="ovds-caption">
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Levy by Period
                    </p>
                    {loading ? (
                      <Skeleton className="h-28" />
                    ) : (
                      <MiniBarChart data={trends} />
                    )}
                    <div className="flex gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-2 h-2 rounded-sm bg-slate-100 inline-block" />
                        Total
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--pro-azure)]">
                        <span className="w-2 h-2 rounded-sm bg-[var(--pro-azure-50)]0/70 inline-block" />
                        Remitted
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Compliance Timeline
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Clock size={10} /> 2 AT RISK
                    </div>
                  </div>
                  <ComplianceTimeline />
                </div>
              </div>

              {/* Category breakdown donut */}
              {summary && Object.keys(summary.byCategory).length > 0 && (
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Levy by Category
                    </p>
                    <button
                      onClick={() => { setTab('analytics'); navigate('/disaster-fund/analytics'); }}
                      className="text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-semibold transition-colors flex items-center gap-1"
                    >
                      Full analytics <ArrowUpRight size={10} />
                    </button>
                  </div>
                  <DonutChart data={summary.byCategory} />
                </div>
              )}

              {/* Recent activity */}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Recent Activity
                  </p>
                  <button
                    onClick={() =>
                      setAuditDrawer({
                        open: true,
                        title: 'All Recent Activity',
                        logs: auditLogs })
                    }
                    className="text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-semibold transition-colors flex items-center gap-1"
                  >
                    View all <ExternalLink size={10} />
                  </button>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-8" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {auditLogs.slice(0, 6).map((l, i) => (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${l.action === 'CREATED' ? 'bg-[var(--pro-azure-light)]' : l.action === 'DELETED' ? 'bg-rose-400' : 'bg-orange-400'}`}
                        />
                        <span className="text-xs font-semibold text-slate-900">
                          {l.action.replace(/_/g, ' ')}
                        </span>
                        {l.fromStatus && l.toStatus && (
                          <span className="ovds-caption">
                            {l.fromStatus} → {l.toStatus}
                          </span>
                        )}
                        {l.performedBy && (
                          <span className="ovds-caption">
                            {l.performedBy}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                          {new Date(l.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-slate-400 text-xs text-center py-3">
                        No activity yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming dues widget */}
              {upcomingDues.length > 0 && (
                <div className="bg-white border border-amber-500/30 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-600" />
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                        Due in Next 30 Days
                      </p>
                    </div>
                    <span className="ovds-caption">
                      {upcomingDues.length} contribution
                      {upcomingDues.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {upcomingDues.slice(0, 5).map((d, i) => {
                      const daysLeft = Math.ceil(
                        (new Date(d.dueDate).getTime() - Date.now()) / 86400000,
                      );
return (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-semibold ${daysLeft <= 7 ? 'bg-rose-100 text-rose-600' : 'bg-amber-500/20 text-amber-600'}`}
                          >
                            {daysLeft}d
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {CATEGORY_LABELS[d.category]}
                            </p>
                            <p className="ovds-caption">
                              {d.period} ·{' '}
                              {d.description || CATEGORY_DESCS[d.category]}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-[var(--pro-azure)] shrink-0">
                            ETB {fmt(d.levyAmount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Forecast & next-due widget */}
              {(forecast || nextDue) && (
                <div className="ovds-grid-layout cols-2">
                  {nextDue && (
                    <div
                      className={`bg-white border rounded-xl p-5 ${nextDue.isOverdue ? 'border-rose-500/40' : nextDue.isUrgent ? 'border-amber-500/40' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarClock
                          size={14}
                          className={
                            nextDue.isOverdue
                              ? 'text-rose-600'
                              : nextDue.isUrgent
                                ? 'text-amber-600'
                                : 'text-[var(--pro-azure)]'
                          }
                        />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Next ERCA Due Date
                        </p>
                      </div>
                      <div className="flex items-end gap-3">
                        <div>
                          <p className="text-2xl font-semibold text-slate-900">
                            {nextDue.period}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Due{' '}
                            {new Date(nextDue.dueDate).toLocaleDateString(
                              'en-ET',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric' },
                            )}
                          </p>
                        </div>
                        <div
                          className={`ml-auto px-4 py-2 rounded-xl text-center ${nextDue.isOverdue ? 'bg-rose-100 border border-rose-500/30' : nextDue.isUrgent ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]'}`}
                        >
                          <p
                            className={`text-2xl font-semibold ${nextDue.isOverdue ? 'text-rose-600' : nextDue.isUrgent ? 'text-amber-600' : 'text-[var(--pro-azure)]'}`}
                          >
                            {nextDue.daysLeft}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            days left
                          </p>
                        </div>
                      </div>
                      {(nextDue.isOverdue || nextDue.isUrgent) && (
                        <div
                          className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${nextDue.isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}
                        >
                          <AlertTriangle size={12} />
                          {nextDue.isOverdue
                            ? 'Submission is overdue — submit immediately to avoid penalties.'
                            : 'Submission due soon — prepare and submit now.'}
                        </div>
                      )}
                      <button
                        onClick={() => setTab('erca')}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-xs font-bold transition-all"
                      >
                        <Send size={11} />
                        Go to ERCA Submissions
                      </button>
                    </div>
                  )}
                  {forecast && (
                    <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} className="text-purple-400" />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Levy Forecast
                        </p>
                        <span className="ml-auto text-[10px] text-slate-400">
                          next period: {forecast.nextPeriod}
                        </span>
                      </div>
                      <div className="flex items-end gap-3 mb-3">
                        <div>
                          <p className="text-2xl font-semibold text-purple-400">
                            ETB {fmt(forecast.totalForecast)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            estimated levy · {forecast.daysUntilDue}d until due
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2">
                        Based on avg of: {forecast.basedOnPeriods.join(', ')}
                      </p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {forecast.forecasts.slice(0, 6).map((f, i) => (
                          <div
                            key={f.category}
                            className="flex items-center gap-2"
                          >
                            <span className="text-[10px] text-slate-500 flex-1 truncate">
                              {CATEGORY_LABELS[f.category as FundCategory] ??
                                f.category}
                            </span>
                            <span className="text-[10px] font-mono text-purple-400 shrink-0">
                              ETB {fmt(f.forecastLevy)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Levy rate reference */}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Levy Rate Reference
                  </p>
                  <Info size={12} className="text-slate-400" />
                  <button
                    onClick={() => setTab('calculator')}
                    className="ml-auto text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-semibold transition-colors flex items-center gap-1"
                  >
                    Open Calculator <Calculator size={10} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {rules.map((r, i) => (
                    <div
                      key={r.category}
                      className="bg-white/60 rounded-xl p-3 border border-slate-200 hover:border-slate-300/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: CAT_COLORS[i % CAT_COLORS.length] }}
                        />
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {CATEGORY_LABELS[r.category as FundCategory] ??
                            r.category}
                        </p>
                        {r.isQuarterly && (
                          <span className="ml-auto text-[9px] bg-[var(--pro-azure-100)] text-[var(--pro-azure)] border border-slate-200 px-1 rounded font-bold shrink-0">
                            Q
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {r.description}
                      </p>
                      <p className="text-[11px] text-[var(--pro-azure)] mt-1 font-semibold">
                        ETB {fmt(r.exampleBase)} → ETB {fmt(r.exampleLevy)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ERCA status widget */}
              {ercaDashStats && (
                <div
                  className={`bg-white border rounded-xl p-5 ${ercaDashStats.counts.overdue > 0 ? 'border-rose-500/40' : 'border-slate-200'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe
                        size={14}
                        className={
                          ercaDashStats.counts.overdue > 0
                            ? 'text-rose-600'
                            : 'text-[var(--pro-azure)]'
                        }
                      />
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        ERCA Submission Status
                      </p>
                      {ercaDashStats.counts.overdue > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-600 border border-rose-500/30">
                          {ercaDashStats.counts.overdue} OVERDUE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setTab('erca')}
                      className="text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-semibold transition-colors flex items-center gap-1"
                    >
                      Manage <ArrowUpRight size={10} />
                    </button>
                  </div>
                  {ercaDashStats.counts.overdue > 0 && (
                    <div className="mb-3 flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-500/20 rounded-xl">
                      <AlertTriangle
                        size={13}
                        className="text-rose-600 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-rose-700">
                        <span className="font-bold">
                          {ercaDashStats.counts.overdue} overdue ERCA submission
                          {ercaDashStats.counts.overdue > 1 ? 's' : ''}
                        </span>{' '}
                        — ETB {fmt(ercaDashStats.totalLevyPending)} pending.
                        Submit immediately to avoid penalties.
                      </p>
                    </div>
                  )}
                  <div className="ovds-grid-layout cols-4 gap-sm mb-4">
                    {[
                      {
                        label: 'Pending',
                        val: ercaDashStats.counts.pending,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50' },
                      {
                        label: 'Submitted',
                        val: ercaDashStats.counts.submitted,
                        color: 'text-[var(--pro-azure)]',
                        bg: 'bg-[var(--pro-azure-50)]' },
                      {
                        label: 'Acknowledged',
                        val: ercaDashStats.counts.acknowledged,
                        color: 'text-[var(--pro-azure)]',
                        bg: 'bg-[var(--pro-azure-50)]' },
                      {
                        label: 'Overdue',
                        val: ercaDashStats.counts.overdue,
                        color: 'text-rose-600',
                        bg: 'bg-rose-50' },
                    ].map((s, i) => (
                      <div
                        key={s.label}
                        className={`${s.bg} rounded-xl p-2.5 text-center`}
                      >
                        <p className={`text-xl font-semibold ${s.color}`}>
                          {s.val}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  {ercaDashStats.recentSubmissions.length > 0 && (
                    <div className="space-y-1.5">
                      {ercaDashStats.recentSubmissions
                        .slice(0, 3)
                        .map((sub, i) => {
                          const isOverdue =
                            sub.status === 'PENDING' &&
                            new Date(sub.dueDate) < new Date();
return (
                            <div
                              key={sub.id}
                              className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0"
                            >
                              <span className="text-xs font-bold text-slate-900 w-16 shrink-0">
                                {sub.period}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : ERCA_STATUS_CLS[sub.status]}`}
                              >
                                {isOverdue ? 'OVERDUE' : sub.status}
                              </span>
                              <span className="text-xs font-mono text-[var(--pro-azure)] flex-1 text-right">
                                ETB {fmt(sub.totalLevy)}
                              </span>
                              {sub.status === 'PENDING' && (
                                <button
                                  onClick={() => {
                                    setErcaSubmitModal(sub);
                                    setTab('erca');
                                  }}
                                  className="text-[10px] text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-bold transition-colors shrink-0"
                                >
                                  Submit →
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* -- CONTRIBUTIONS TAB -- */}
          {(activeGroup === 'contributions') && tab === 'contributions' && (
            <div className="space-y-4">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-6 px-6 pt-1 pb-3 flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search description..."
                    className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-600 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-48"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="REMITTED">Remitted</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  placeholder="Period (e.g. 2026-Q1)"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-40"
                />
                {(filterStatus || filterCategory || filterPeriod || search) && (
                  <button
                    onClick={() => {
                      setFilterStatus('');
                      setFilterCategory('');
                      setFilterPeriod('');
                      setSearch('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
                {/* Status quick-chips */}
                <div className="flex gap-1">
                  {(['PENDING', 'REMITTED', 'OVERDUE'] as FundStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setFilterStatus(filterStatus === s ? '' : s)
                        }
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${filterStatus === s ? STATUS_CLS[s] : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200'}`}
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
                {/* Period quick-select */}
                <div className="flex gap-1">
                  {[
                    currentPeriod(),
                    `${currentYear()}-Q${Math.max(1, Math.ceil((new Date().getMonth() + 1) / 3) - 1)}`,
                    String(currentYear()),
                  ].map((p, i) => (
                    <button
                      key={p}
                      onClick={() =>
                        setFilterPeriod(filterPeriod === p ? '' : p)
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${filterPeriod === p ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure)] border border-[var(--pro-azure-100)]' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {selected.size > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleBulkRemit}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-sm font-bold transition-all"
                    >
                      <Zap size={13} />
                      Remit {selected.size}
                    </button>
                    <select
                      value={bulkStatus}
                      onChange={(e) => {
                        setBulkStatus(e.target.value);
if (e.target.value)
                          handleBulkStatusChange(e.target.value);
                      }}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                    >
                      <option value="">Change status...</option>
                      <option value="PENDING">→ Pending</option>
                      <option value="OVERDUE">→ Overdue</option>
                    </select>
                    {canDelete && (
                      <button
                        onClick={async () => {
                          if (
                            !(await confirm({
                              title: `Delete ${selected.size} selected contributions?`,
                              variant: 'danger',
                              confirmLabel: 'Delete All' }))
                          )
                            return;
try {
                            await Promise.all(
                              [...selected].map((id, i) =>
                                api.delete(`/disaster-fund/${id}`),
                              ),
                            );
toast.success(
                              `${selected.size} contributions deleted`,
                            );
                            setSelected(new Set());
                            load();
                          }
catch (err: any) {
                            if (!err?.isRateLimited) toast.error('Bulk delete failed');
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-500/25 text-rose-600 text-sm font-bold transition-all"
                      >
                        <Trash2 size={13} />
                        Delete {selected.size}
                      </button>
                    )}
                    {contributions.length > paged.length && (
                      <button
                        onClick={() =>
                          setSelected(new Set(contributions.map((c, i) => c.id)))
                        }
                        className="text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure)] font-bold transition-colors whitespace-nowrap"
                      >
                        Select all {contributions.length}
                      </button>
                    )}
                  </div>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {contributions.length} records
                  {(filterStatus ||
                    filterCategory ||
                    filterPeriod ||
                    search) && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-[var(--pro-azure-100)] text-[var(--pro-azure)] rounded text-[10px] font-bold">
                      {
                        [
                          filterStatus,
                          filterCategory,
                          filterPeriod,
                          search,
                        ].filter(Boolean).length
                      }{' '}
                      filter
                      {[
                        filterStatus,
                        filterCategory,
                        filterPeriod,
                        search,
                      ].filter(Boolean).length > 1
                        ? 's'
                        : ''}
                    </span>
                  )}
                </span>
              </div>

              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm ovds-table">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white">
                        <th className="px-4 py-3 w-8 bg-white">
                          <input
                            type="checkbox"
                            checked={
                              paged.length > 0 &&
                              paged.every((c) => selected.has(c.id))
                            }
                            onChange={toggleAll}
                            className="rounded border-slate-300 bg-slate-200 text-[var(--pro-azure)] focus:ring-teal-400/30"
                          />
                        </th>
                        <SortTh col="category" label="Category" />
                        <SortTh col="description" label="Description" />
                        <SortTh col="baseAmount" label="Base Amount" />
                        <SortTh col="levyAmount" label="Levy (ETB)" />
                        <SortTh col="period" label="Period" />
                        <SortTh col="dueDate" label="Due Date" />
                        {filterStatus === 'OVERDUE' && (
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                            Age
                          </th>
                        )}
                        <SortTh col="status" label="Status" />
                        <th className="px-4 py-3 text-left ovds-label">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            {[...Array(9)].map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <Skeleton className="h-4" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : paged.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center">
                            <Banknote
                              size={32}
                              className="text-slate-700 mx-auto mb-3"
                            />
                            <p className="text-slate-400 text-sm font-semibold">
                              No contributions found
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                              Try adjusting your filters or record a new
                              contribution.
                            </p>
                            <button
                              onClick={openAdd}
                              className="mt-3 px-4 py-2 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-xs font-bold transition-all"
                            >
                              + Record Contribution
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paged.map((c, i) => (
                          <React.Fragment key={c.id}>
                            <tr
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selected.has(c.id) ? 'bg-[var(--pro-azure-50)]/60' : ''} ${c.status === 'OVERDUE' ? 'border-l-2 border-l-red-400' : ''}`}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selected.has(c.id)}
                                  onChange={() => toggleSelect(c.id)}
                                  className="rounded border-slate-300 bg-slate-200 text-[var(--pro-azure)] focus:ring-teal-400/30"
                                />
                              </td>
                              <td
                                className="px-4 py-3 cursor-pointer"
                                onClick={() =>
                                  setExpandedRow(
                                    expandedRow === c.id ? null : c.id,
                                  )
                                }
                              >
                                <span className="text-slate-900 font-semibold text-xs">
                                  {CATEGORY_LABELS[c.category] ?? c.category}
                                </span>
                                <p className="ovds-caption mt-0.5">
                                  {CATEGORY_DESCS[c.category]}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs max-w-[130px]">
                                {inlineNotes?.id === c.id ? (
                                  <div className="flex gap-1">
                                    <input
                                      autoFocus
                                      value={inlineNotes.value}
                                      onChange={(e) =>
                                        setInlineNotes({
                                          id: c.id,
                                          value: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                          handleInlineNotesSave();
if (e.key === 'Escape')
                                          setInlineNotes(null);
                                      }}
                                      className="bg-white border border-[var(--pro-azure)] rounded px-2 py-0.5 text-xs text-slate-900 w-full focus:outline-none focus:ring-1 focus:ring-teal-400/30"
                                    />
                                    <button
                                      onClick={handleInlineNotesSave}
                                      className="text-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:text-green-300 text-[10px] font-bold"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setInlineNotes(null)}
                                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    className="truncate block cursor-pointer hover:text-slate-600 transition-colors"
                                    title="Click to edit notes"
                                    onClick={() =>
                                      setInlineNotes({
                                        id: c.id,
                                        value: c.description || '' })
                                    }
                                  >
                                    {c.description || (
                                      <span className="text-slate-400 italic">
                                        —
                                      </span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                                ETB {fmt(c.baseAmount)}
                              </td>
                              <td
                                className="px-4 py-3 text-[var(--pro-azure)] text-xs font-mono font-bold cursor-pointer group/levy relative"
                                onClick={() => {
                                  navigator.clipboard?.writeText(
                                    String(c.levyAmount),
                                  );
toast.success('Copied!', { duration: 1000 });
                                }}
                                title="Click to copy"
                              >
                                ETB {fmt(c.levyAmount)}
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--pro-azure-50)]0 dark:bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/levy:opacity-100 pointer-events-none whitespace-nowrap">
                                  copy
                                </span>
                              </td>
                              <td
                                className="px-4 py-3 text-slate-500 text-xs cursor-pointer group/period relative"
                                onClick={() => {
                                  navigator.clipboard?.writeText(c.period);
toast.success('Period copied!', {
                                    duration: 800 });
                                }}
                                title="Click to copy period"
                              >
                                {c.period}
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--pro-azure-50)]0 dark:bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/period:opacity-100 pointer-events-none whitespace-nowrap">
                                  copy
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                {c.dueDate
                                  ? (() => {
                                      const daysLeft = Math.ceil(
                                        (new Date(c.dueDate).getTime() -
                                          Date.now()) /
                                          86400000,
                                      );
const isPast =
                                        daysLeft < 0 && c.status !== 'REMITTED';
const isUrgent =
                                        daysLeft >= 0 &&
                                        daysLeft <= 7 &&
                                        c.status !== 'REMITTED';
return (
                                        <div className="flex flex-col gap-0.5">
                                          <span
                                            className={
                                              isPast
                                                ? 'text-rose-600'
                                                : isUrgent
                                                  ? 'text-amber-600'
                                                  : ''
                                            }
                                          >
                                            {new Date(
                                              c.dueDate,
                                            ).toLocaleDateString()}
                                          </span>
                                          {c.status !== 'REMITTED' && (
                                            <span
                                              className={`text-[9px] font-bold ${isPast ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-slate-400'}`}
                                            >
                                              {isPast
                                                ? `${Math.abs(daysLeft)}d overdue`
                                                : daysLeft === 0
                                                  ? 'due today'
                                                  : `${daysLeft}d left`}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CLS[c.status]}`}
                                >
                                  {c.status}
                                </span>
                                {c.remittedAt && (
                                  <p className="text-[9px] text-slate-400 mt-0.5">
                                    {new Date(
                                      c.remittedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setDetailPanel(c)}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-[var(--pro-azure)] transition-all"
                                    title="View detail"
                                  >
                                    <Eye size={12} />
                                  </button>
                                  {c.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleRemit(c.id)}
                                      className="px-2 py-1 rounded-lg bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-[10px] font-bold transition-all whitespace-nowrap"
                                    >
                                      Remit
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setRemittanceModal(c)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--pro-azure-50)] text-slate-400 hover:text-[var(--pro-azure)] transition-all"
                                    title="Record bank remittance"
                                  >
                                    <Building2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleReceipt(c.id)}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                                    title="Download receipt"
                                  >
                                    <Printer size={12} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      openAudit(
                                        c.id,
                                        CATEGORY_LABELS[c.category],
                                      )
                                    }
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-[var(--pro-azure)] transition-all"
                                    title="Audit trail"
                                  >
                                    <History size={12} />
                                  </button>
                                  <button
                                    onClick={() => openEdit(c)}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(c.id)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedRow === c.id && (
                              <tr className="bg-white/60 border-b border-slate-100">
                                <td colSpan={9} className="px-6 py-4">
                                  <div className="ovds-grid-layout cols-4 text-xs">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                        Base Amount
                                      </p>
                                      <p className="font-mono text-slate-700">
                                        ETB {fmt(c.baseAmount)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                        Levy Amount
                                      </p>
                                      <p className="font-mono font-bold text-[var(--pro-azure)]">
                                        ETB {fmt(c.levyAmount)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                        Due Date
                                      </p>
                                      <p
                                        className={
                                          c.dueDate &&
                                          new Date(c.dueDate) < new Date() &&
                                          c.status !== 'REMITTED'
                                            ? 'text-rose-600'
                                            : 'text-slate-600'
                                        }
                                      >
                                        {c.dueDate
                                          ? new Date(
                                              c.dueDate,
                                            ).toLocaleDateString()
                                          : '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                        Remitted At
                                      </p>
                                      <p className="text-slate-600">
                                        {c.remittedAt
                                          ? new Date(
                                              c.remittedAt,
                                            ).toLocaleDateString()
                                          : '—'}
                                      </p>
                                    </div>
                                    {c.description && (
                                      <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                          Description
                                        </p>
                                        <p className="text-slate-600">
                                          {c.description}
                                        </p>
                                      </div>
                                    )}
                                    {c.notes && (
                                      <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                          Notes
                                        </p>
                                        <p className="text-slate-500">
                                          {c.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={() => {
                                        setExpandedRow(null);
                                        setDetailPanel(c);
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                                    >
                                      <Eye size={11} />
                                      Full detail
                                    </button>
                                    {c.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleRemit(c.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-xs font-bold transition-all"
                                      >
                                        <CheckCircle2 size={11} />
                                        Mark Remitted
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setRemittanceModal(c)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-xs font-bold transition-all"
                                    >
                                      <Building2 size={11} />
                                      Record Remittance
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                    {paged.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-white/40">
                          <td
                            colSpan={4}
                            className="px-4 py-2.5 ovds-label text-right"
                          >
                            Page total
                          </td>
                          <td className="px-4 py-2.5 text-[var(--pro-azure)] font-mono font-semibold text-xs">
                            ETB{' '}
                            {fmt(paged.reduce((s, c) => s + c.levyAmount, 0))}
                          </td>
                          <td colSpan={4} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                    <span className="text-xs text-slate-400">
                      Page {page} of {totalPages} · {contributions.length} total
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[
                          ['«', 1],
                          ['‹', Math.max(1, page - 1)],
                          ['›', Math.min(totalPages, page + 1)],
                          ['»', totalPages],
                        ].map(([label, target]) => (
                          <button
                            key={label}
                            onClick={() => setPage(Number(target))}
                            disabled={page === Number(target)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 transition-all"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {totalPages > 5 && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
const n = parseInt(jumpPage);
if (n >= 1 && n <= totalPages) {
                              setPage(n);
                              setJumpPage('');
                            }
                          }}
                        >
                          <input
                            value={jumpPage}
                            onChange={(e) => setJumpPage(e.target.value)}
                            placeholder="Go to…"
                            className="w-16 bg-slate-200 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                          />
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -- ANALYTICS TAB -- */}
          {(activeGroup === 'analytics') && tab === 'analytics' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs font-bold text-slate-500">Year</label>
                <select
                  value={analyticsYear}
                  onChange={(e) => setAnalyticsYear(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                >
                  {yearOptions.map((y, i) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleExportCsv}
                  className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-semibold transition-all"
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>
              <div className="ovds-grid-layout cols-4">
                {yearSummary.length === 0
                  ? [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4"
                      >
                        <Skeleton className="h-20" />
                      </div>
                    ))
                  : yearSummary.map((q, i) => (
                      <div
                        key={q.quarter}
                        className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4"
                      >
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                          Q{q.quarter} · {q.period}
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          ETB {fmt(q.total)}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-[var(--pro-azure)]">Remitted</span>
                            <span className="text-[var(--pro-azure)] font-mono">
                              ETB {fmt(q.remitted)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-amber-600">Pending</span>
                            <span className="text-amber-600 font-mono">
                              ETB {fmt(q.pending)}
                            </span>
                          </div>
                          {q.overdue > 0 && (
                            <div className="flex justify-between text-[10px]">
                              <span className="text-rose-600">Overdue</span>
                              <span className="text-rose-600 font-mono">
                                ETB {fmt(q.overdue)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--pro-azure-50)]0/70 rounded-full"
                            style={{
                              width: `${q.total > 0 ? (q.remitted / q.total) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {q.count} contributions
                        </p>
                      </div>
                    ))}
              </div>
              <div className="ovds-grid-layout cols-2 gap-lg">
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Levy by Category
                  </p>
                  <DonutChart data={summary?.byCategory ?? {}} />
                </div>
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Levy Trend by Period
                  </p>
                  <MiniBarChart data={trends} />
                  <div className="mt-4 space-y-2">
                    {trends
                      .slice(-6)
                      .reverse()
                      .map((t, i, arr) => {
                        const prev = arr[i + 1];
const change =
                          prev && prev.total > 0
                            ? ((t.total - prev.total) / prev.total) * 100
                            : null;
return (
                          <div
                            key={t.period}
                            className="flex items-center gap-3"
                          >
                            <span className="text-xs text-slate-500 w-20 shrink-0">
                              {t.period}
                            </span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--pro-azure-50)]0/70 rounded-full"
                                style={{
                                  width: `${trends.length ? (t.total / Math.max(...trends.map((x, i) => x.total), 1)) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-[var(--pro-azure)] w-28 text-right shrink-0">
                              ETB {fmt(t.total)}
                            </span>
                            {change !== null && (
                              <span
                                className={`text-[10px] font-bold w-14 text-right shrink-0 ${change > 0 ? 'text-[var(--pro-azure)]' : change < 0 ? 'text-rose-600' : 'text-slate-400'}`}
                              >
                                {change > 0 ? '+' : ''}
                                {change.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              {multiYearData.length > 0 && (
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Multi-Year Comparison
                  </p>
                  <MultiYearChart data={multiYearData} />
                </div>
              )}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Category Breakdown
                  </p>
                  <p className="ovds-caption">
                    Click a row to drill down
                  </p>
                </div>
                <div className="space-y-2">
                  {Object.entries(summary?.byCategory ?? {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, val], i) => {
                      const total = Object.values(
                        summary?.byCategory ?? {},
                      ).reduce((s, v) => s + v, 0);
const pct = total > 0 ? (val / total) * 100 : 0;
const medal =
                        i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
return (
                        <div
                          key={cat}
                          className="flex items-center gap-3 group cursor-pointer"
                          onClick={() => setDrillDown(cat as FundCategory)}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              background: CAT_COLORS[i % CAT_COLORS.length] }}
                          />
                          <span className="text-xs text-slate-600 w-44 shrink-0 truncate group-hover:text-slate-900 transition-colors">
                            {medal && <span className="mr-1">{medal}</span>}
                            {CATEGORY_LABELS[cat as FundCategory] ?? cat}
                          </span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: CAT_COLORS[i % CAT_COLORS.length] }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-10 text-right shrink-0">
                            {pct.toFixed(1)}%
                          </span>
                          <span className="text-xs font-mono text-slate-900 w-32 text-right shrink-0">
                            ETB {fmt(val)}
                          </span>
                          <ChevronRight
                            size={12}
                            className="text-slate-400 group-hover:text-[var(--pro-azure)] transition-colors shrink-0"
                          />
                        </div>
                      );
                    })}
                  {!Object.keys(summary?.byCategory ?? {}).length && (
                    <p className="text-slate-400 text-xs text-center py-4">
                      No data yet.
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Monthly Levy Heatmap
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Year</label>
                    <select
                      value={heatmapYear}
                      onChange={(e) => setHeatmapYear(Number(e.target.value))}
                      className="bg-slate-200 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                    >
                      {yearOptions.map((y, i) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <MonthlyHeatmap data={heatmapData} year={heatmapYear} />
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {[
                    ['bg-white border-slate-100', 'No activity'],
                    ['bg-[var(--pro-azure-50)] border-[var(--pro-azure)]/20', 'Low'],
                    ['bg-[var(--pro-azure-50)]0/35 border-[var(--pro-azure-light)]', 'Medium'],
                    ['bg-[var(--pro-azure-50)]0/80 border-[var(--pro-azure)]/70', 'High'],
                  ].map(([cls, label]) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 text-[10px] text-slate-500"
                    >
                      <span className={`w-3 h-3 rounded border ${cls}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {complianceHistory.length > 0 && (
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    ERCA Submission Compliance History
                  </p>
                  <ErcaComplianceChart data={complianceHistory} />
                </div>
              )}
            </div>
          )}

          {/* -- COMPLIANCE TAB -- */}
          {(activeGroup === 'remittance') && tab === 'compliance' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs font-bold text-slate-500">Year</label>
                <select
                  value={scheduleYear}
                  onChange={(e) => setScheduleYear(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                >
                  {yearOptions.map((y, i) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGenerateSchedule}
                  disabled={generatingSchedule}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pro-azure-100)] hover:bg-[var(--pro-azure-dark)]/25 text-[var(--pro-azure)] text-sm font-bold transition-all disabled:opacity-50"
                >
                  <CalendarClock size={14} />
                  {generatingSchedule
                    ? 'Generating...'
                    : `Generate ${scheduleYear} Schedule`}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('ovds_token') || '';
const res = await fetch(
                        `/api/disaster-fund/export-pdf?year=${scheduleYear}`,
                        { headers: { Authorization: `${BEARER_PREFIX}${token}` } },
                      );
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = exportRef.current!;
                      a.href = url;
                      a.download = `compliance-report-${scheduleYear}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
catch (err: any) {
                      if (!err?.isRateLimited) toast.error('Export failed');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-semibold transition-all"
                >
                  <Printer size={13} />
                  Export PDF
                </button>
                {/* Quarterly completion rings */}
                {schedule.length > 0 && (
                  <div className="ml-auto flex items-center gap-3">
                    {[1, 2, 3, 4].map((q, i) => {
                      const qEntries = schedule.filter((s) => s.quarter === q);
if (!qEntries.length) return null;
const paid = qEntries.filter(
                        (e) => e.status === 'PAID',
                      ).length;
const pct = (paid / qEntries.length) * 100;
const color =
                        pct === 100
                          ? '#00E784'
                          : pct > 0
                            ? '#f59e0b'
                            : '#64748b';
return (
                        <ProgressRing
                          key={q}
                          pct={pct}
                          size={48}
                          stroke={5}
                          color={color}
                          label={`Q${q}`}
                        />
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 text-[10px]">
                  {[
                    ['UPCOMING', 'bg-slate-500/15 text-slate-500'],
                    ['DUE', 'bg-amber-500/15 text-amber-600'],
                    ['PAID', 'bg-[var(--pro-azure-50)]0/15 text-[var(--pro-azure)]'],
                    ['MISSED', 'bg-rose-50 text-rose-600'],
                  ].map(([s, cls]) => (
                    <span
                      key={s}
                      className={`px-2 py-1 rounded-lg border border-transparent font-bold ${cls}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compliance score card */}
              {complianceScore && (
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Compliance Score — {scheduleYear}
                  </p>
                  <div className="flex items-center gap-6 flex-wrap">
                    <GradeBadge
                      grade={complianceScore.grade}
                      score={complianceScore.score}
                    />
                    <div className="flex-1 ovds-grid-layout cols-3 gap-sm min-w-0">
                      {[
                        {
                          label: 'Remittance Rate',
                          value: `${complianceScore.breakdown.remittanceRate?.toFixed(1) ?? 0}%`,
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'On-Time Rate',
                          value: `${complianceScore.breakdown.onTimeRate?.toFixed(1) ?? 0}%`,
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'Overdue Rate',
                          value: `${complianceScore.breakdown.overdueRate?.toFixed(1) ?? 0}%`,
                          color: 'text-rose-600' },
                        {
                          label: 'Total Records',
                          value: String(complianceScore.breakdown.total ?? 0),
                          color: 'text-slate-600' },
                        {
                          label: 'Remitted',
                          value: String(
                            complianceScore.breakdown.remitted ?? 0,
                          ),
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'On Time',
                          value: String(complianceScore.breakdown.onTime ?? 0),
                          color: 'text-[var(--pro-azure)]' },
                      ].map((s, i) => (
                        <div
                          key={s.label}
                          className="bg-white/60 rounded-xl p-3 border border-slate-200"
                        >
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {s.label}
                          </p>
                          <p className={`text-lg font-semibold mt-0.5 ${s.color}`}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Score</span>
                      <span>{complianceScore.score}/100</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          complianceScore.score >= 90
                            ? 'bg-[var(--pro-azure-50)]0'
                            : complianceScore.score >= 75
                              ? 'bg-[var(--pro-azure-50)]0'
                              : complianceScore.score >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                        }`}
                        style={{ width: `${complianceScore.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 px-4 py-3 bg-[var(--pro-azure-50)] border border-slate-200 rounded-xl">
                <Info size={15} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--pro-azure-dark)]">
                  Quarterly remittance schedule covers categories mandated to
                  remit every quarter: Government Budget (0.25%), Salary
                  Contribution (1%), Loan Value (1%), Insurance Premium (1%),
                  and Annual Sales Revenue (5%). Generate the schedule for a
                  year to track due dates and mark payments.
                </p>
              </div>

              {schedule.length === 0 ? (
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-10 text-center">
                  <CalendarClock
                    size={32}
                    className="text-slate-400 mx-auto mb-3"
                  />
                  <p className="text-slate-500 text-sm font-semibold">
                    No schedule for {scheduleYear}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Click "Generate Schedule" to create quarterly remittance
                    entries.
                  </p>
                </div>
              ) : (
                <div className="ovds-grid-layout cols-2">
                  {[1, 2, 3, 4].map((q, i) => {
                    const qEntries = schedule.filter((s) => s.quarter === q);
if (!qEntries.length) return null;
const qTotal = qEntries.reduce(
                      (s, e) => s + Number(e.estimatedLevy),
                      0,
                    );
const allPaid = qEntries.every((e) => e.status === 'PAID');
const hasMissed = qEntries.some(
                      (e) => e.status === 'MISSED',
                    );
return (
                      <div
                        key={q}
                        className={`bg-white border rounded-2xl overflow-hidden ${hasMissed ? 'border-rose-500/30' : allPaid ? 'border-slate-200' : 'border-slate-200'}`}
                      >
                        <div
                          className={`px-4 py-3 border-b flex items-center justify-between ${hasMissed ? 'border-rose-500/20 bg-rose-500/5' : allPaid ? 'border-[var(--pro-azure)]/20 bg-[var(--pro-azure-50)]0/5' : 'border-slate-200'}`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Q{q} · {scheduleYear}
                            </p>
                            <p className="ovds-caption">
                              Due:{' '}
                              {new Date(
                                qEntries[0]?.dueDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-[var(--pro-azure)] font-bold">
                              ETB {fmt(qTotal)}
                            </p>
                            <p className="ovds-caption">
                              estimated
                            </p>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-700/30">
                          {qEntries.map((entry, i) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-3 px-4 py-2.5"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {CATEGORY_LABELS[
                                    entry.category as FundCategory
                                  ] ?? entry.category}
                                </p>
                                <p className="ovds-caption mt-0.5">
                                  Est. ETB {fmt(Number(entry.estimatedLevy))}
                                  {entry.notes && (
                                    <span className="ml-1">
                                      · {entry.notes}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${SCHED_CLS[entry.status] ?? 'bg-slate-200 text-slate-500 border-slate-300'}`}
                              >
                                {entry.status}
                              </span>
                              {entry.status !== 'PAID' ? (
                                <button
                                  onClick={() =>
                                    handleScheduleStatus(entry.id, 'PAID')
                                  }
                                  className="px-2 py-1 rounded-lg bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-[10px] font-bold transition-all whitespace-nowrap"
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleScheduleStatus(entry.id, 'UPCOMING')
                                  }
                                  className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-200 text-slate-500 text-[10px] font-bold transition-all whitespace-nowrap"
                                >
                                  Undo
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -- TARGETS TAB -- */}
          {(activeGroup === 'config') && tab === 'targets' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs font-bold text-slate-500">Year</label>
                <select
                  value={targetsYear}
                  onChange={(e) => setTargetsYear(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                >
                  {yearOptions.map((y, i) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">
                  Set annual levy targets per category and track actual vs
                  target performance.
                </span>
                <button
                  onClick={async () => {
                    const prevYear = targetsYear - 1;
try {
                      const res = await api.get(
                        `/disaster-fund/targets/${prevYear}/vs-actual`,
                      );
const rows: TargetRow[] = res.data.data;
const withTargets = rows.filter(
                        (r) => r.targetAmount > 0,
                      );
if (!withTargets.length) {
                        toast('No targets found for ' + prevYear, {
                          icon: 'ℹ️' });
return;
                      }
                      await Promise.all(
                        withTargets.map((r, i) =>
                          api.put('/disaster-fund/targets', {
                            year: targetsYear,
                            category: r.category,
                            targetAmount: r.targetAmount }),
                        ),
                      );
toast.success(
                        `Copied ${withTargets.length} targets from ${prevYear}`,
                      );
                      loadTargetsData(targetsYear);
                    }
catch (err: any) {
                      if (!err?.isRateLimited) toast.error('Failed to copy targets');
                    }
                  }}
                  className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-xs font-semibold transition-all"
                >
                  <Copy size={12} />
                  Copy from {targetsYear - 1}
                </button>
              </div>

              {complianceScore && (
                <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Compliance Score — {targetsYear}
                  </p>
                  <div className="flex items-center gap-6 flex-wrap">
                    <GradeBadge
                      grade={complianceScore.grade}
                      score={complianceScore.score}
                    />
                    <div className="flex-1 ovds-grid-layout cols-3 gap-sm min-w-0">
                      {[
                        {
                          label: 'Remittance Rate',
                          value: `${complianceScore.breakdown.remittanceRate?.toFixed(1) ?? 0}%`,
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'On-Time Rate',
                          value: `${complianceScore.breakdown.onTimeRate?.toFixed(1) ?? 0}%`,
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'Overdue Rate',
                          value: `${complianceScore.breakdown.overdueRate?.toFixed(1) ?? 0}%`,
                          color: 'text-rose-600' },
                        {
                          label: 'Total Records',
                          value: String(complianceScore.breakdown.total ?? 0),
                          color: 'text-slate-600' },
                        {
                          label: 'Remitted',
                          value: String(
                            complianceScore.breakdown.remitted ?? 0,
                          ),
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'On Time',
                          value: String(complianceScore.breakdown.onTime ?? 0),
                          color: 'text-[var(--pro-azure)]' },
                      ].map((s, i) => (
                        <div
                          key={s.label}
                          className="bg-white/60 rounded-xl p-3 border border-slate-200"
                        >
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {s.label}
                          </p>
                          <p className={`text-lg font-semibold mt-0.5 ${s.color}`}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Score</span>
                      <span>{complianceScore.score}/100</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          complianceScore.score >= 90
                            ? 'bg-[var(--pro-azure-50)]0'
                            : complianceScore.score >= 75
                              ? 'bg-[var(--pro-azure-50)]0'
                              : complianceScore.score >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                        }`}
                        style={{ width: `${complianceScore.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Target vs Actual — {targetsYear}
                  </p>
                  <p className="ovds-caption">
                    Click a target cell to edit
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm ovds-table">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white">
                        {[
                          'Category',
                          'Target (ETB)',
                          'Actual (ETB)',
                          'Remitted',
                          'Variance',
                          '% of Target',
                          'Progress',
                          '',
                        ].map((h, i) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left ovds-label"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {targetRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-10 text-center text-slate-400 text-xs"
                          >
                            No data for {targetsYear}. Record contributions or
                            set targets to see comparisons.
                          </td>
                        </tr>
                      ) : (
                        targetRows.map((row, i) => {
                          const pct = row.pctOfTarget;
const isEditing =
                            editingTarget?.category === row.category;
const varColor =
                            row.variance >= 0
                              ? 'text-[var(--pro-azure)]'
                              : 'text-rose-600';
return (
                            <tr
                              key={row.category}
                              className="border-b border-slate-100 hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{
                                      background:
                                        CAT_COLORS[i % CAT_COLORS.length] }}
                                  />
                                  <span className="text-xs font-semibold text-slate-900">
                                    {CATEGORY_LABELS[
                                      row.category as FundCategory
                                    ] ?? row.category}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <div className="flex gap-1 items-center">
                                    <input
                                      autoFocus
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editingTarget!.value}
                                      onChange={(e) =>
                                        setEditingTarget({
                                          category: row.category,
                                          value: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                          handleSaveTarget(
                                            row.category,
                                            editingTarget!.value,
                                          );
if (e.key === 'Escape')
                                          setEditingTarget(null);
                                      }}
                                      className="bg-slate-200 border border-[var(--pro-azure)]/50 rounded px-2 py-1 text-xs text-slate-900 w-28 focus:outline-none font-mono"
                                    />
                                    <button
                                      onClick={() =>
                                        handleSaveTarget(
                                          row.category,
                                          editingTarget!.value,
                                        )
                                      }
                                      disabled={savingTarget}
                                      className="text-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:text-green-300 text-[10px] font-bold disabled:opacity-50"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingTarget(null)}
                                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setEditingTarget({
                                        category: row.category,
                                        value: String(row.targetAmount) })
                                    }
                                    className="text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors group flex items-center gap-1"
                                  >
                                    {row.targetAmount > 0 ? (
                                      `ETB ${fmt(row.targetAmount)}`
                                    ) : (
                                      <span className="text-slate-400 italic">
                                        Set target
                                      </span>
                                    )}
                                    <Edit2
                                      size={10}
                                      className="opacity-0 group-hover:opacity-100 text-slate-400"
                                    />
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-[var(--pro-azure)] font-bold">
                                ETB {fmt(row.actualTotal)}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-[var(--pro-azure)]">
                                ETB {fmt(row.remitted)}
                              </td>
                              <td
                                className={`px-4 py-3 text-xs font-mono font-bold ${varColor}`}
                              >
                                {row.variance >= 0 ? '+' : ''}
                                {fmt(row.variance)}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                              </td>
                              <td className="px-4 py-3 w-36">
                                {row.targetAmount > 0 ? (
                                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        (pct ?? 0) >= 100
                                          ? 'bg-[var(--pro-azure-50)]0'
                                          : (pct ?? 0) >= 75
                                            ? 'bg-[var(--pro-azure-50)]0'
                                            : (pct ?? 0) >= 50
                                              ? 'bg-amber-500'
                                              : 'bg-rose-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(pct ?? 0, 100)}%` }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">
                                    No target set
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {row.targetId && (
                                  <button
                                    onClick={() =>
                                      handleDeleteTarget(row.targetId!)
                                    }
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                    title="Remove target"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {targetRows.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-white/40">
                          <td className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-600 font-bold">
                            ETB{' '}
                            {fmt(
                              targetRows.reduce(
                                (s, r) => s + r.targetAmount,
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-[var(--pro-azure)] font-bold">
                            ETB{' '}
                            {fmt(
                              targetRows.reduce((s, r) => s + r.actualTotal, 0),
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-[var(--pro-azure)] font-bold">
                            ETB{' '}
                            {fmt(
                              targetRows.reduce((s, r) => s + r.remitted, 0),
                            )}
                          </td>
                          <td colSpan={4} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* -- CALCULATOR TAB -- */}
          {(activeGroup === 'contributions') && tab === 'calculator' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 px-4 py-3 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl">
                <Calculator
                  size={15}
                  className="text-[var(--pro-azure)] shrink-0 mt-0.5"
                />
                <p className="text-xs text-[var(--pro-azure)]">
                  Use this batch calculator to estimate levy obligations across
                  multiple categories before recording them. Enter base amounts,
                  calculate, then save all to contributions in one click.
                </p>
              </div>
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Levy Estimator
                    </p>
                    {calcRows.some((r) => r.baseAmount) && (
                      <span className="text-[9px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded font-semibold">
                        draft saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-500 font-bold">
                      Period
                    </label>
                    <input
                      value={calcPeriod}
                      onChange={(e) => setCalcPeriod(e.target.value)}
                      className="bg-slate-200 border border-slate-300 rounded-xl px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-28"
                      placeholder="2026-Q1"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm ovds-table">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white">
                        <th className="px-4 py-3 text-left ovds-label">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left ovds-label">
                          Label / Description
                        </th>
                        <th className="px-4 py-3 text-left ovds-label">
                          Base Amount / Count
                        </th>
                        <th className="px-4 py-3 text-left ovds-label">
                          Levy (ETB)
                        </th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {calcRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-2.5">
                            <select
                              value={row.category}
                              onChange={(e) =>
                                setCalcRows((prev) =>
                                  prev.map((r, i) =>
                                    i === idx
                                      ? {
                                          ...r,
                                          category: e.target
                                            .value as FundCategory,
                                          levyAmount: null }
                                      : r,
                                  ),
                                )
                              }
                              className="bg-slate-200 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-full"
                            >
                              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1 mt-0.5 px-1">
                              <p className="ovds-caption">
                                {CATEGORY_DESCS[row.category]}
                              </p>
                              {FLAT_CATS.includes(row.category) && (
                                <span className="text-[8px] bg-[var(--pro-azure-100)] text-[var(--pro-azure)] px-1 py-0.5 rounded font-bold shrink-0">
                                  FLAT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              value={row.label}
                              onChange={(e) =>
                                setCalcRows((prev) =>
                                  prev.map((r, i) =>
                                    i === idx
                                      ? { ...r, label: e.target.value }
                                      : r,
                                  ),
                                )
                              }
                              className="bg-slate-200 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-full"
                              placeholder="Optional label..."
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.baseAmount}
                              onChange={(e) =>
                                setCalcRows((prev) =>
                                  prev.map((r, i) =>
                                    i === idx
                                      ? {
                                          ...r,
                                          baseAmount: e.target.value,
                                          levyAmount: null }
                                      : r,
                                  ),
                                )
                              }
                              className="bg-slate-200 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-full font-mono"
                              placeholder={
                                FLAT_CATS.includes(row.category)
                                  ? 'Count...'
                                  : '0.00'
                              }
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            {row.levyAmount !== null ? (
                              <span className="text-[var(--pro-azure)] font-mono font-bold text-xs">
                                ETB {fmt(row.levyAmount)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              <button
                                onClick={() => duplicateCalcRow(idx)}
                                title="Duplicate row"
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={() =>
                                  setCalcRows((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                disabled={calcRows.length === 1}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all disabled:opacity-30"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {calcRows.some((r) => r.levyAmount !== null) && (
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-white/40">
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-xs font-semibold text-slate-500 text-right uppercase tracking-wider"
                          >
                            Total Levy
                          </td>
                          <td className="px-4 py-3 text-[var(--pro-azure)] font-mono font-semibold text-sm">
                            ETB {fmt(calcTotal)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                <div className="px-5 py-4 border-t border-slate-200 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() =>
                      setCalcRows((prev) => [...prev, newCalcRow()])
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-all"
                  >
                    <Plus size={13} />
                    Add Row
                  </button>
                  <button
                    onClick={runCalculator}
                    disabled={calcRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-sm font-bold transition-all disabled:opacity-50"
                  >
                    <Calculator size={13} />
                    {calcRunning ? 'Calculating...' : 'Calculate All'}
                  </button>
                  {calcRows.some((r) => r.levyAmount !== null) && (
                    <button
                      onClick={saveAllCalcRows}
                      disabled={calcSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle2 size={13} />
                      {calcSaving
                        ? 'Saving...'
                        : `Save ${calcRows.filter((r) => r.levyAmount !== null).length} Contributions`}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCalcRows([newCalcRow()]);
                      localStorage.removeItem('drf_calc_draft');
                    }}
                    className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -- REPORTS TAB -- */}
          {(activeGroup === 'remittance') && tab === 'reports' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Save Report Snapshot
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Capture the current fund state as a named snapshot for future
                  reference.
                </p>
                <div className="flex gap-3">
                  <input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder={`Report ${new Date().toLocaleDateString()} — ${filterPeriod || 'All periods'}`}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                  />
                  <button
                    onClick={handleSaveReport}
                    disabled={savingReport}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-green-500/20"
                  >
                    <FileText size={13} />
                    {savingReport ? 'Saving...' : 'Save Snapshot'}
                  </button>
                </div>
                {(filterPeriod || filterStatus) && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Snapshot will include:{' '}
                    {[
                      filterPeriod && `Period: ${filterPeriod}`,
                      filterStatus && `Status: ${filterStatus}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Saved Snapshots
                  </p>
                  <span className="ovds-caption">
                    {savedReports.length} reports
                  </span>
                </div>
                {savedReports.length === 0 ? (
                  <div className="p-10 text-center">
                    <FileText
                      size={28}
                      className="text-slate-700 mx-auto mb-3"
                    />
                    <p className="text-slate-400 text-sm font-semibold">
                      No saved reports yet
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Save a snapshot above to track fund state over time.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/30">
                    {savedReports.map((r, i) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {r.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {r.period && (
                              <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                {r.period}
                              </span>
                            )}
                            {r.year && !r.period && (
                              <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                {r.year}
                              </span>
                            )}
                            {r.status && (
                              <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                {r.status}
                              </span>
                            )}
                            <span className="ovds-caption">
                              {r.recordCount} records
                            </span>
                            {r.generatedBy && (
                              <span className="ovds-caption">
                                by {r.generatedBy}
                              </span>
                            )}
                            <span className="ovds-caption">
                              {new Date(r.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-right shrink-0">
                          <span className="ovds-caption">
                            Total
                          </span>
                          <span className="text-[10px] font-mono text-[var(--pro-azure)]">
                            ETB {fmt(r.totalLevy)}
                          </span>
                          <span className="ovds-caption">
                            Remitted
                          </span>
                          <span className="text-[10px] font-mono text-[var(--pro-azure)]">
                            ETB {fmt(r.totalRemitted)}
                          </span>
                          {Number(r.totalOverdue) > 0 && (
                            <>
                              <span className="ovds-caption">
                                Overdue
                              </span>
                              <span className="text-[10px] font-mono text-rose-600">
                                ETB {fmt(r.totalOverdue)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => loadReport(r)}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure)] text-[10px] font-bold transition-all"
                          >
                            <ArrowUpRight size={10} />
                            Load
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const token =
                                  localStorage.getItem('ovds_token') || '';
const params = new URLSearchParams();
if (r.period) params.set('period', r.period);
if (r.status) params.set('status', r.status);
const res = await fetch(
                                  `/api/disaster-fund/export-csv?${params}`,
                                  {
                                    headers: {
                                      Authorization: `${BEARER_PREFIX}${token}` } },
                                );
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = exportRef.current!;
                                a.href = url;
                                a.download = `${r.title.replace(/\s+/g, '-')}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }
catch (err: any) {
                                if (!err?.isRateLimited) toast.error('Export failed');
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-all"
                          >
                            <Download size={10} />
                            CSV
                          </button>
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -- ADD/EDIT MODAL -- */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <h2 className="text-base font-semibold text-slate-900">
                    {editTarget ? 'Edit Contribution' : 'Record Contribution'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setPreviewLevy(null);
                      setEditTarget(null);
                    }}
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!editTarget && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                          Category
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) => {
                            const c = e.target.value as FundCategory;
                            setForm((f) => ({ ...f, category: c }));
                            setPreviewLevy(null);
                            handlePreview(c, form.baseAmount);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                        >
                          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-[var(--pro-azure)] mt-1">
                          {CATEGORY_DESCS[form.category]}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            {FLAT_CATS.includes(form.category)
                              ? 'Count / Units'
                              : 'Base Amount (ETB)'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.baseAmount}
                            onChange={(e) => {
                              setForm((f) => ({
                                ...f,
                                baseAmount: e.target.value }));
                              setPreviewLevy(null);
                            }}
                            onBlur={() => handlePreview()}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Period
                          </label>
                          <input
                            value={form.period}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, period: e.target.value }))
                            }
                            className={`w-full bg-white border rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 ${
                              form.period &&
                              !/^\d{4}-(Q[1-4]|\d{2})$/.test(form.period)
                                ? 'border-rose-500/50'
                                : 'border-slate-200'
                            }`}
                            placeholder="2026-Q1"
                            required
                          />
                          {form.period &&
                            !/^\d{4}-(Q[1-4]|\d{2})$/.test(form.period) && (
                              <p className="text-[10px] text-rose-600 mt-1">
                                Format: 2026-Q1 or 2026-04
                              </p>
                            )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                          Due Date (optional)
                        </label>
                        <input
                          type="date"
                          value={form.dueDate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dueDate: e.target.value }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                        />
                      </div>
                    </>
                  )}
                  {previewLevy !== null && (
                    <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl px-4 py-3 flex items-center justify-between">
                      <p className="ovds-caption">Computed Levy</p>
                      <p className="text-2xl font-semibold text-[var(--pro-azure)]">
                        ETB {fmt(previewLevy)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Description (optional)
                    </label>
                    <input
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                      placeholder="e.g. Q1 loan portfolio levy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50 resize-none"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setPreviewLevy(null);
                        setEditTarget(null);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-bold transition-all"
                    >
                      {saving
                        ? 'Saving...'
                        : editTarget
                          ? 'Update'
                          : 'Save Contribution'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* -- ERCA SUBMISSION TAB -- */}
          {(activeGroup === 'erca') && tab === 'erca' && (
            <div className="space-y-5">
              {ercaDashStats && ercaDashStats.counts.overdue > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertTriangle
                    size={16}
                    className="text-rose-600 shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-rose-700">
                      {ercaDashStats.counts.overdue} overdue ERCA submission
                      {ercaDashStats.counts.overdue > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-rose-600/70 mt-0.5">
                      ETB {fmt(ercaDashStats.totalLevyPending)} total pending —
                      submit immediately to avoid ERCA penalties.
                    </p>
                  </div>
                  <button
                    onClick={() => loadErcaSubmissions(ercaYear)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors shrink-0"
                  >
                    Refresh
                  </button>
                </div>
              )}

              <div className="flex items-start gap-3 px-4 py-3 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl">
                <Globe size={15} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
                <p className="ovds-caption">
                  Disaster fund levy is submitted to{' '}
                  <span className="text-slate-900 font-semibold">ERCA</span> by the
                  <span className="text-slate-900 font-semibold">
                    {' '}
                    1st of each following month
                  </span>
                  . The system auto-prepares submissions via cron. Use the tools
                  below to preview, prepare, and submit.
                </p>
              </div>

              {ercaDashStats && (
                <div className="ovds-grid-layout cols-4 gap-sm">
                  {[
                    {
                      label: 'Pending',
                      val: ercaDashStats.counts.pending,
                      color: 'text-amber-600',
                      bg: 'bg-amber-50',
                      border: 'border-amber-500/20' },
                    {
                      label: 'Submitted',
                      val: ercaDashStats.counts.submitted,
                      color: 'text-[var(--pro-azure)]',
                      bg: 'bg-[var(--pro-azure-50)]',
                      border: 'border-[var(--pro-azure)]/20' },
                    {
                      label: 'Acknowledged',
                      val: ercaDashStats.counts.acknowledged,
                      color: 'text-[var(--pro-azure)]',
                      bg: 'bg-[var(--pro-azure-50)]',
                      border: 'border-[var(--pro-azure)]/20' },
                    {
                      label: 'Overdue',
                      val: ercaDashStats.counts.overdue,
                      color: 'text-rose-600',
                      bg: 'bg-rose-50',
                      border: 'border-rose-500/20' },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className={`${s.bg} border ${s.border} rounded-xl p-4 text-center`}
                    >
                      <p className={`text-3xl font-semibold ${s.color}`}>
                        {s.val}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 font-semibold">
                    Year
                  </label>
                  <select
                    value={ercaYear}
                    onChange={(e) => setErcaYear(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                  >
                    {yearOptions.map((y, i) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => loadErcaSubmissions(ercaYear)}
                  disabled={ercaLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-semibold transition-all"
                >
                  <RefreshCw
                    size={13}
                    className={ercaLoading ? 'animate-spin' : ''}
                  />
                  Refresh
                </button>
                <button
                  onClick={async () => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - 1);
const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
try {
                      await api.post('/disaster-fund/erca/prepare', { period });
toast.success(`Submission prepared for ${period}`);
                      loadErcaSubmissions(ercaYear);
                    }
catch (err: any) {
                      if (!err?.isRateLimited) toast.error('Failed to prepare submission');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-sm font-medium transition-all"
                >
                  <Zap size={13} />
                  Prepare Last Month
                </button>
                <button
                  onClick={() => setShowAutoGenerate(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white border border-slate-200 text-slate-600 text-sm font-semibold transition-all"
                >
                  <Layers size={13} />
                  Auto-Generate Contributions
                </button>
              </div>

              {/* One-shot: auto-generate + prepare ERCA */}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[var(--pro-azure)]" />
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    One-Shot: Generate Contributions + Prepare ERCA
                  </p>
                </div>
                <p className="ovds-caption">
                  Scans payroll, loans, invoices, and bills for the selected
                  period, creates all applicable levy contributions, then
                  immediately prepares the ERCA submission record — in a single
                  click.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <input
                    value={oneShotPeriod}
                    onChange={(e) => {
                      setOneShotPeriod(e.target.value);
                      setOneShotResult(null);
                    }}
                    className="flex-1 min-w-[140px] bg-slate-200 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                    placeholder="e.g. 2026-03 or 2026-Q1"
                  />
                  <select
                    value={oneShotBizType}
                    onChange={(e) => setOneShotBizType(e.target.value)}
                    className="bg-slate-200 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                  >
                    <option value="">All categories</option>
                    {BUSINESS_TYPES.map((bt, i) => (
                      <option key={bt.key} value={bt.key}>
                        {bt.icon} {bt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleOneShotGenerate}
                    disabled={oneShotRunning || !oneShotPeriod.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-green-500/20"
                  >
                    <Zap size={13} />
                    {oneShotRunning ? 'Running...' : 'Generate & Prepare'}
                  </button>
                </div>
                {oneShotResult && (
                  <div className="bg-slate-200 border border-slate-300/40 rounded-xl p-4 space-y-3">
                    <div className="ovds-grid-layout cols-3 gap-sm">
                      {[
                        {
                          label: 'Generated',
                          value: String(oneShotResult.generated),
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'Skipped',
                          value: String(oneShotResult.skipped),
                          color: 'text-amber-600' },
                        {
                          label: 'ERCA Levy',
                          value: `ETB ${fmt(oneShotResult.ercaSubmission?.totalLevy ?? 0)}`,
                          color: 'text-[var(--pro-azure)]' },
                      ].map((s, i) => (
                        <div
                          key={s.label}
                          className="bg-white rounded-xl border border-slate-100 p-3 text-center"
                        >
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {s.label}
                          </p>
                          <p className={`text-lg font-semibold mt-1 ${s.color}`}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {oneShotResult.previews?.length > 0 && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Created contributions
                        </p>
                        {oneShotResult.previews.map((p: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 py-1 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-xs text-slate-600 flex-1 truncate">
                              {CATEGORY_LABELS[p.category as FundCategory] ??
                                p.category}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {p.description}
                            </span>
                            <span className="text-xs font-mono text-[var(--pro-azure)] shrink-0">
                              ETB {fmt(p.levyAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-[var(--pro-azure)]">
                      <CheckCircle2 size={11} />
                      <span>
                        ERCA submission prepared for{' '}
                        <span className="font-bold">
                          {oneShotResult.period}
                        </span>{' '}
                        — ready to submit
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview & Prepare panel */}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 space-y-4">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Preview & Prepare Submission
                </p>
                <div className="flex gap-3 flex-wrap">
                  <input
                    value={ercaPeriodInput}
                    onChange={(e) => {
                      setErcaPeriodInput(e.target.value);
                      setErcaPreview(null);
                    }}
                    className="flex-1 min-w-[160px] bg-slate-200 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                    placeholder="e.g. 2026-03 or 2026-Q1"
                  />
                  <button
                    onClick={async () => {
                      if (!ercaPeriodInput.trim()) {
                        toast.error('Enter a period');
return;
                      }
                      setErcaPreviewing(true);
try {
                        const res = await api.get(
                          `/disaster-fund/erca/preview/${ercaPeriodInput.trim()}`,
                        );
                        setErcaPreview(res.data.data);
                      }
catch (err: any) {
                        if (!err?.isRateLimited) toast.error('Preview failed');
                      }
finally {
                        setErcaPreviewing(false);
                      }
                    }}
                    disabled={ercaPreviewing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-200 text-slate-900 text-sm font-bold transition-all disabled:opacity-50"
                  >
                    <Eye size={13} />
                    {ercaPreviewing ? 'Scanning...' : 'Preview'}
                  </button>
                  {ercaPreview && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post('/disaster-fund/erca/prepare', {
                            period: ercaPreview!.period });
toast.success(`Prepared for ${ercaPreview!.period}`);
                          loadErcaSubmissions(ercaYear);
                        }
catch (err: any) {
                          if (!err?.isRateLimited) toast.error('Failed to prepare');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-semibold transition-all shadow-sm"
                    >
                      <Send size={13} />
                      Prepare Submission
                    </button>
                  )}
                </div>
                {ercaPreview && (
                  <div className="space-y-4">
                    <div className="ovds-grid-layout cols-4 gap-sm">
                      {[
                        {
                          label: 'Period',
                          value: ercaPreview.period,
                          color: 'text-slate-900' },
                        {
                          label: 'Total Levy',
                          value: `ETB ${fmt(ercaPreview.totalLevy)}`,
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'Remitted',
                          value: `ETB ${fmt(ercaPreview.totalRemitted)}`,
                          color: 'text-[var(--pro-azure)]' },
                        {
                          label: 'Pending',
                          value: `ETB ${fmt(ercaPreview.totalPending)}`,
                          color: 'text-amber-600' },
                      ].map((s, i) => (
                        <div
                          key={s.label}
                          className="bg-slate-200 rounded-xl p-3 text-center"
                        >
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {s.label}
                          </p>
                          <p className={`text-sm font-semibold mt-1 ${s.color}`}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {ercaPreview.totalLevy > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Remittance coverage</span>
                          <span className="text-slate-900 font-bold">
                            {(
                              (ercaPreview.totalRemitted /
                                ercaPreview.totalLevy) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-indigo-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min((ercaPreview.totalRemitted / ercaPreview.totalLevy) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                        Breakdown by Category
                      </p>
                      <div className="space-y-1.5">
                        {Object.entries(ercaPreview.categoryBreakdown)
                          .sort(([, a], [, b]) => b.levy - a.levy)
                          .map(([cat, d]) => {
                            const pct =
                              ercaPreview!.totalLevy > 0
                                ? (d.levy / ercaPreview!.totalLevy) * 100
                                : 0;
return (
                              <div
                                key={cat}
                                className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs text-slate-600 truncate">
                                      {CATEGORY_LABELS[cat as FundCategory] ??
                                        cat}
                                    </span>
                                    <span className="text-xs font-mono text-[var(--pro-azure)] shrink-0 ml-2">
                                      ETB {fmt(d.levy)}
                                    </span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[var(--pro-azure-50)]0/60 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 w-14 text-right shrink-0">
                                  {d.count} rec · {pct.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <CalendarClock size={11} />
                      <span>
                        Due:{' '}
                        <span className="text-slate-900 font-semibold">
                          {new Date(ercaPreview.dueDate).toLocaleDateString(
                            'en-ET',
                            { year: 'numeric', month: 'long', day: 'numeric' },
                          )}
                        </span>
                      </span>
                      <span className="ml-2">
                        · {ercaPreview.contributionCount} contributions included
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submission history */}
              <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Submission History — {ercaYear}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search
                        size={11}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={ercaSearchTerm}
                        onChange={(e) => setErcaSearchTerm(e.target.value)}
                        placeholder="Filter by period, status, ref..."
                        className="bg-slate-200 border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-600 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400/50 w-48"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {ercaFilteredSubmissions.length} records
                    </span>
                    {ercaSubmissions.length > 0 && (
                      <span className="text-xs font-mono text-[var(--pro-azure)]">
                        ETB{' '}
                        {fmt(
                          ercaSubmissions.reduce(
                            (s, sub) => s + sub.totalLevy,
                            0,
                          ),
                        )}{' '}
                        total
                      </span>
                    )}
                  </div>
                </div>
                {ercaLoading ? (
                  <div className="p-5 text-center">
                    <RefreshCw
                      size={20}
                      className="text-slate-400 animate-spin mx-auto"
                    />
                  </div>
                ) : ercaFilteredSubmissions.length === 0 ? (
                  <div className="p-10 text-center">
                    <Globe size={28} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">
                      {ercaSearchTerm
                        ? 'No submissions match your search.'
                        : `No ERCA submissions for ${ercaYear}.`}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {ercaSearchTerm
                        ? 'Try a different search term.'
                        : 'Use "Prepare Last Month" or the preview tool above.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/30">
                    {ercaFilteredSubmissions.map((sub, i) => {
                      const isOverdue =
                        sub.status === 'PENDING' &&
                        new Date(sub.dueDate) < new Date();
const steps = [
                        'PENDING',
                        'SUBMITTED',
                        'ACKNOWLEDGED',
                      ] as const;
const stepIdx = steps.indexOf(sub.status as any);
return (
                        <div
                          key={sub.id}
                          className={`px-5 py-4 hover:bg-white/[0.02] transition-colors ${isOverdue ? 'border-l-2 border-rose-500/60' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-900">
                                  {sub.period}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : ERCA_STATUS_CLS[sub.status]}`}
                                >
                                  {isOverdue ? 'OVERDUE' : sub.status}
                                </span>
                                {sub.ercaReferenceNo && (
                                  <span className="text-[10px] text-slate-500 font-mono bg-slate-200 px-2 py-0.5 rounded">
                                    Ref: {sub.ercaReferenceNo}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 flex-wrap">
                                <span className="text-sm font-semibold text-[var(--pro-azure)]">
                                  ETB {fmt(sub.totalLevy)}
                                </span>
                                <span className="text-[10px] text-[var(--pro-azure)]">
                                  ✓ ETB {fmt(sub.totalRemitted)}
                                </span>
                                {sub.totalPending > 0 && (
                                  <span className="text-[10px] text-amber-600">
                                    ⏳ ETB {fmt(sub.totalPending)}
                                  </span>
                                )}
                                <span className="ovds-caption">
                                  Due{' '}
                                  {new Date(sub.dueDate).toLocaleDateString()}
                                </span>
                                {sub.paymentMethod && (
                                  <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                    {sub.paymentMethod.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {sub.bankName && (
                                  <span className="ovds-caption">
                                    {sub.bankName}
                                  </span>
                                )}
                              </div>
                              {sub.submittedAt && (
                                <p className="text-[9px] text-slate-400 mt-0.5">
                                  Submitted{' '}
                                  {new Date(sub.submittedAt).toLocaleString()}{' '}
                                  by {sub.submittedBy ?? '—'}
                                  {sub.acknowledgedAt &&
                                    ` · Acknowledged ${new Date(sub.acknowledgedAt).toLocaleDateString()}`}
                                </p>
                              )}
                              {sub.notes && (
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                  "{sub.notes}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                              {sub.status === 'PENDING' && (
                                <button
                                  onClick={() => setErcaSubmitModal(sub)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-xs font-bold transition-all shadow-md shadow-green-500/20"
                                >
                                  <Send size={11} />
                                  Submit to ERCA
                                </button>
                              )}
                              {sub.status === 'SUBMITTED' && (
                                <button
                                  onClick={async () => {
                                    const ref = await prompt({
                                      title: 'ERCA Acknowledgement',
                                      message: 'Enter the ERCA acknowledgement reference number:',
                                      placeholder: 'e.g. ERCA-2026-XXXXXX',
                                    });
if (!ref) return;
try {
                                      await api.post(
                                        '/disaster-fund/erca/acknowledge',
                                        {
                                          period: sub.period,
                                          ercaReferenceNo: ref },
                                      );
toast.success('Acknowledged');
                                      loadErcaSubmissions(ercaYear);
                                    }
catch (err: any) {
                                      if (!err?.isRateLimited) toast.error('Failed to acknowledge');
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--pro-azure-50)] hover:bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] text-xs font-bold transition-all border border-slate-200"
                                >
                                  <BadgeCheck size={11} />
                                  Acknowledge
                                </button>
                              )}
                              {sub.status === 'SUBMITTED' && (
                                <button
                                  onClick={async () => {
                                    if (
                                      !(await confirm({
                                        title: `Mark submission for ${sub.period} as failed?`,
                                        variant: 'danger',
                                        confirmLabel: 'Mark Failed' }))
                                    )
                                      return;
try {
                                      await api.patch(
                                        `/disaster-fund/erca/submissions/${sub.period}/status`,
                                        { status: 'FAILED' },
                                      );
toast.success('Marked as failed');
                                      loadErcaSubmissions(ercaYear);
                                    }
catch (err: any) {
                                      if (!err?.isRateLimited) toast.error('Failed to update');
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-500/20"
                                >
                                  <X size={11} />
                                  Failed
                                </button>
                              )}
                              {sub.status === 'ACKNOWLEDGED' && (
                                <span className="flex items-center gap-1 text-xs text-[var(--pro-azure)] font-semibold px-2">
                                  <BadgeCheck size={12} />
                                  Confirmed
                                </span>
                              )}
                              {(sub.status === 'SUBMITTED' ||
                                sub.status === 'ACKNOWLEDGED') && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const token =
                                        localStorage.getItem('ovds_token') ||
                                        '';
const res = await fetch(
                                        `/api/disaster-fund/erca/receipt/${sub.period}`,
                                        {
                                          headers: {
                                            Authorization: `${BEARER_PREFIX}${token}` } },
                                      );
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = exportRef.current!;
                                      a.href = url;
                                      a.download = `erca-receipt-${sub.period}.pdf`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }
catch (err: any) {
                                      if (!err?.isRateLimited) toast.error('Failed to download receipt');
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
                                >
                                  <Printer size={11} />
                                  Receipt
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={async () => {
                                    if (
                                      !(await confirm({
                                        title: `Delete ERCA submission for ${sub.period}?`,
                                        variant: 'danger',
                                        confirmLabel: 'Delete' }))
                                    )
                                      return;
try {
                                      await api.delete(
                                        `/disaster-fund/erca/submissions/${sub.period}`,
                                      );
toast.success('Deleted');
                                      loadErcaSubmissions(ercaYear);
                                    }
catch (err: any) {
                                      if (!err?.isRateLimited) toast.error('Failed to delete');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Category breakdown toggle */}
                          {Object.keys(sub.categoryBreakdown ?? {}).length >
                            0 && (
                            <button
                              onClick={() =>
                                setExpandedErcaRow(
                                  expandedErcaRow === sub.id ? null : sub.id,
                                )
                              }
                              className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors font-semibold"
                            >
                              <ChevronRight
                                size={10}
                                className={`transition-transform ${expandedErcaRow === sub.id ? 'rotate-90' : ''}`}
                              />
                              {expandedErcaRow === sub.id ? 'Hide' : 'Show'}{' '}
                              category breakdown (
                              {Object.keys(sub.categoryBreakdown).length}{' '}
                              categories)
                            </button>
                          )}
                          {expandedErcaRow === sub.id && (
                            <div className="mt-2 bg-white rounded-xl border border-slate-100 overflow-hidden border border-slate-200">
                              <div className="divide-y divide-slate-700/30">
                                {Object.entries(sub.categoryBreakdown)
                                  .sort(([, a], [, b]) => b.levy - a.levy)
                                  .map(([cat, d]) => {
                                    const pct =
                                      sub.totalLevy > 0
                                        ? (d.levy / sub.totalLevy) * 100
                                        : 0;
return (
                                      <div
                                        key={cat}
                                        className="flex items-center gap-3 px-3 py-2"
                                      >
                                        <span className="text-xs text-slate-600 flex-1 truncate">
                                          {CATEGORY_LABELS[
                                            cat as FundCategory
                                          ] ?? cat}
                                        </span>
                                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                                          <div
                                            className="h-full bg-[var(--pro-azure-50)]0/60 rounded-full"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] text-slate-400 w-8 text-right shrink-0">
                                          {d.count}×
                                        </span>
                                        <span className="text-xs font-mono text-[var(--pro-azure)] w-28 text-right shrink-0">
                                          ETB {fmt(d.levy)}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Timeline progress */}
                          <div className="mt-3 flex items-center gap-0">
                            {' '}
                            {(
                              ['PENDING', 'SUBMITTED', 'ACKNOWLEDGED'] as const
                            ).map((step, i) => {
                              const done = stepIdx >= i;
const active = stepIdx === i;
return (
                                <React.Fragment key={step}>
                                  <div className="flex flex-col items-center gap-1">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-all ${done ? (active ? 'bg-[var(--pro-azure-50)]0 border-[var(--pro-azure)] text-slate-900' : 'bg-[var(--pro-azure-50)]0/20 border-[var(--pro-azure)] text-[var(--pro-azure)]') : 'bg-slate-200 border-slate-300 text-slate-400'}`}
                                    >
                                      {done && !active ? '✓' : i + 1}
                                    </div>
                                    <span
                                      className={`text-[8px] font-bold uppercase tracking-wide ${done ? (active ? 'text-[var(--pro-azure)]' : 'text-[var(--pro-azure)]') : 'text-slate-400'}`}
                                    >
                                      {step === 'PENDING'
                                        ? 'Prepared'
                                        : step === 'SUBMITTED'
                                          ? 'Submitted'
                                          : 'Confirmed'}
                                    </span>
                                  </div>
                                  {i < 2 && (
                                    <div
                                      className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${stepIdx > i ? 'bg-[var(--pro-azure-50)]0/60' : 'bg-slate-200'}`}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
            </>
        </div>

        </main>
      </div>}
      {/* -- Other root tabs (full-width, outside two-column layout) -- */}

      {rootTab === 'financial-reports' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--pro-azure-dark)] to-teal-800 rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--pro-azure-100)] border border-[var(--pro-azure)]/30 rounded-xl flex items-center justify-center shrink-0">
                <BarChart3 size={22} className="text-[var(--pro-azure-dark)]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-900/40 mb-0.5">
                  Integrated Financial Platform
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Financial Reports & Statements
                </h2>
                <p className="text-xs text-slate-900/50 mt-0.5">
                  Know your cash position — Balance Sheet · P&L · Trial Balance · AR/AP Aging · Cash Flow
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  label: 'Accounting',
                  to: '/accounting',
                  color: 'bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900' },
                {
                  label: 'Invoices',
                  to: '/sales/invoices',
                  color: 'bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900' },
                {
                  label: 'Bills',
                  to: '/purchases/bills',
                  color: 'bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900' },
                {
                  label: 'VAT Admin',
                  to: '/tax/vat',
                  color: 'bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900' },
              ].map((l, i) => (
                <a
                  key={l.label}
                  href={l.to}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--pro-azure-100)] dark:border-white/10 transition-all ${l.color}`}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          {/* Financial health + KPI strip */}
          <div className="ovds-grid-layout cols-auto" style={{ '--grid-col-min': '160px' } as React.CSSProperties}>
            {/* Health score card */}
            {healthScore && (
              <div
                className={`col-span-2 rounded-xl p-5 border flex items-center gap-5 ${healthScore.grade === 'A' ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : healthScore.grade === 'B' ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-amber-50 border-amber-200'}`}
              >
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-semibold shrink-0 ${healthScore.grade === 'A' ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : healthScore.grade === 'B' ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure)]' : 'bg-amber-100 text-amber-700'}`}
                >
                  {healthScore.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Financial Health
                  </p>
                  <p
                    className={`text-2xl font-semibold mt-0.5 ${healthScore.grade === 'A' ? 'text-[var(--pro-azure-dark)]' : healthScore.grade === 'B' ? 'text-[var(--pro-azure)]' : 'text-amber-700'}`}
                  >
                    {healthScore.overall ?? 0}%
                  </p>
                  <div className="w-full h-1.5 bg-white/60 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${healthScore.grade === 'A' ? 'bg-[var(--pro-azure-50)]0' : healthScore.grade === 'B' ? 'bg-[var(--pro-azure-50)]0' : 'bg-amber-500'}`}
                      style={{ width: `${healthScore.overall ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            {[
              {
                label: 'Net Profit',
                value: `ETB ${fmt(finSummary?.netProfit ?? 0)}`,
                sub: 'monthly position',
                color:
                  (finSummary?.netProfit ?? 0) >= 0
                    ? 'text-[var(--pro-azure-dark)]'
                    : 'text-rose-700',
                bg: 'bg-white dark:bg-white' },
              {
                label: 'Total Assets',
                value: accountBalances
                  ? `ETB ${fmt(accountBalances.totals?.assets ?? 0)}`
                  : '—',
                sub: 'from GL',
                color: 'text-[var(--pro-azure)]',
                bg: 'bg-white dark:bg-white' },
              {
                label: 'Bank Balance',
                value: `ETB ${fmt(banks.reduce((s: number, b: any) => s + Number(b.balance), 0))}`,
                sub: `${banks.length} accounts`,
                color: 'text-[var(--pro-azure-dark)]',
                bg: 'bg-white dark:bg-white' },
              {
                label: 'GL Accounts',
                value: accounts.length,
                sub: `${accounts.filter((a: any) => a.isActive).length} active`,
                color: 'text-violet-700',
                bg: 'bg-white dark:bg-white' },
            ].map((k, i) => (
              <div
                key={k.label}
                className={`${k.bg} rounded-xl p-4 border border-slate-200 dark:border-slate-100`}
              >
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {k.label}
                </p>
                <p className={`text-lg font-semibold mt-1 ${k.color}`}>
                  {k.value}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick-access report tiles */}
          <div className="ovds-grid-layout cols-auto" style={{ '--grid-col-min': '130px' } as React.CSSProperties}>
            {(
              [
                {
                  key: 'balance-sheet',
                  label: 'Balance Sheet',
                  icon: <Scale size={18} />,
                  color: 'text-[var(--pro-azure)]',
                  bg: 'bg-[var(--pro-azure-50)]',
                  border: 'border-[var(--pro-azure-100)]',
                  activeBg: 'bg-[var(--pro-azure-50)]0' },
                {
                  key: 'profit-loss',
                  label: 'Profit & Loss',
                  icon: <TrendingUp size={18} />,
                  color: 'text-[var(--pro-azure)]',
                  bg: 'bg-[var(--pro-azure-50)]',
                  border: 'border-[var(--pro-azure-100)]',
                  activeBg: 'bg-[var(--pro-azure-50)]0' },
                {
                  key: 'trial-balance',
                  label: 'Trial Balance',
                  icon: <BarChart3 size={18} />,
                  color: 'text-violet-600',
                  bg: 'bg-violet-50',
                  border: 'border-violet-200',
                  activeBg: 'bg-[var(--pro-azure-50)]0' },
                {
                  key: 'ar-aging',
                  label: 'AR Aging',
                  icon: <ArrowUpRight size={18} />,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                  border: 'border-amber-200',
                  activeBg: 'bg-amber-600' },
                {
                  key: 'ap-aging',
                  label: 'AP Aging',
                  icon: <ArrowDownRight size={18} />,
                  color: 'text-rose-600',
                  bg: 'bg-rose-50',
                  border: 'border-rose-200',
                  activeBg: 'bg-rose-600' },
                {
                  key: 'cash-flow',
                  label: 'Cash Flow',
                  icon: <Wallet size={18} />,
                  color: 'text-teal-600',
                  bg: 'bg-teal-50',
                  border: 'border-teal-200',
                  activeBg: 'bg-teal-600' },
                {
                  key: 'expense-summary',
                  label: 'Expenses',
                  icon: <FileText size={18} />,
                  color: 'text-[var(--pro-azure)]',
                  bg: 'bg-[var(--pro-azure-50)]',
                  border: 'border-orange-200',
                  activeBg: 'bg-amber-600' },
              ] as const
            ).map((r, i) => {
              const isActive = activeReportType === r.key;
return (
                <button
                  key={r.key}
                  onClick={() => {
                    setActiveReportType(r.key);
                    document
                      .getElementById('reports-panel-anchor')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${isActive ? `${r.activeBg} border-transparent text-slate-900 shadow-lg` : `${r.bg} ${r.border} hover:shadow-md hover:-translate-y-0.5`}`}
                >
                  <span className={isActive ? 'text-slate-900' : r.color}>
                    {r.icon}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider leading-tight ${isActive ? 'text-slate-900' : r.color}`}
                  >
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="reports-panel-anchor"
            className="bg-white dark:ovds-widget-card dark:border-slate-100 p-5"
          >
            <ReportsPanel initialReportType={activeReportType || undefined} />
          </div>
          <div className="bg-white dark:ovds-widget-card dark:border-slate-100 p-5">
            <PeriodManager />
          </div>
        </div>
      )}

      {rootTab === 'levy-collection' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <LevyCollectionPanel />
        </div>
      )}

      {rootTab === 'tax-vat-reports' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--pro-azure-dark)] to-teal-900 rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="text-[var(--pro-azure)] dark:text-green-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-900/40 mb-0.5">
                  Tax & Government Compliance
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  VAT & Tax Withholding Reports
                </h2>
                <p className="text-xs text-slate-900/50 mt-0.5">
                  Maintain compliance — know your tax days and never miss them · VAT withholding · ERCA submission
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/tax/vat"
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--pro-azure-100)] dark:border-white/10 bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900 transition-all"
              >
                VAT Admin
              </Link>
              <Link
                to="/purchases/bills"
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--pro-azure-100)] dark:border-white/10 bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900 transition-all"
              >
                Purchase Bills
              </Link>
              <Link
                to="/sales/invoices"
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--pro-azure-100)] dark:border-white/10 bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-slate-900 transition-all"
              >
                Sales Invoices
              </Link>
            </div>
          </div>
          {/* Government Submission Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--pro-azure-50)]0/20 rounded-xl flex items-center justify-center shrink-0">
                <Globe size={18} className="text-[var(--pro-azure)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Submit to Tax & Government Service (ERCA)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aged summary of tax withholding, VAT withholding, and VAT
                  report — entire system, one submission
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setRootTab('disaster-fund')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300"
              >
                <ShieldAlert size={14} /> Disaster Fund ERCA
              </button>
              <button
                onClick={() => {
                  const w = window.open('', '_blank');
if (!w) return;
                  w.document
                    .write(`<!DOCTYPE html><html><head><title>Tax & VAT Withholding Submission</title>
                  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:11px}
                  h1{font-size:18px;font-weight:900;margin-bottom:4px}h2{font-size:13px;font-weight:900;margin:20px 0 10px}
                  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:900;text-transform:uppercase;background:#dcfce7;color:#166534}
                  table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f8fafc;padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;border-bottom:2px solid #e2e8f0}
                  td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px}.total-row td{font-weight:900;background:#f8fafc;border-top:2px solid #e2e8f0}
                  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0}
                  .card{background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0}
                  .card p:first-child{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px}
                  .card p:last-child{font-size:15px;font-weight:900}</style></head>
                  <body>
                  <h1>Tax & VAT Withholding Report</h1>
                  <p style="color:#64748b;font-size:11px;margin-bottom:4px">Submitted to Ethiopian Revenue and Customs Authority (ERCA)</p>
                  <p style="color:#64748b;font-size:10px;margin-bottom:16px">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Period: ${new Date().toLocaleDateString('en-ET', { month: 'long', year: 'numeric' })}</p>
                  <span class="badge">System-Wide Combined Report</span>
                  <h2>Aged Summary — Unremitted Withholding</h2>
                  <div class="grid">
                    <div class="card"><p>Current (0-30 days)</p><p style="color:#00E784">ETB —</p></div>
                    <div class="card"><p>31-60 Days</p><p style="color:#d97706">ETB —</p></div>
                    <div class="card"><p>61-90 Days</p><p style="color:#ea580c">ETB —</p></div>
                    <div class="card"><p>90+ Days (Overdue)</p><p style="color:#e11d48">ETB —</p></div>
                  </div>
                  <h2>VAT Withholding Register</h2>
                  <table><thead><tr><th>Supplier</th><th>TIN</th><th>Invoice Date</th><th>Invoice Amount</th><th>VAT Withheld (15%)</th><th>Status</th></tr></thead>
                  <tbody><tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8">See system VAT withholding register</td></tr></tbody></table>
                  <h2>Income Tax Withholding Register</h2>
                  <table><thead><tr><th>Supplier</th><th>TIN</th><th>Invoice Date</th><th>Invoice Amount</th><th>Tax Withheld (2%)</th><th>Status</th></tr></thead>
                  <tbody><tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8">See system income tax withholding register</td></tr></tbody></table>
                  <h2>VAT Return Summary</h2>
                  <table><thead><tr><th>Description</th><th>Amount (ETB)</th></tr></thead>
                  <tbody>
                    <tr><td>Output VAT (from Sales Invoices)</td><td>—</td></tr>
                    <tr><td>Input VAT (from Purchase Bills)</td><td>—</td></tr>
                    <tr class="total-row"><td>Net VAT Payable / (Refundable)</td><td>—</td></tr>
                  </tbody></table>
                  <p style="margin-top:32px;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px">
                    This report is generated from the integrated financial system. All figures are subject to final audit verification.
                    Submitted in compliance with ERCA regulations and Ethiopian VAT Proclamation No. 1341/2024 · DRRF Regulation No. 570/2025.
                  </p>
                  </body></html>`);
                  w.document.close();
                  w.print();
                  w.addEventListener('afterprint', () => w.close());
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-slate-900 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-500/20"
              >
                <Printer size={14} /> Print Submission Report
              </button>
              <button
                onClick={() =>
                  toast.success(
                    'Submission package prepared — review and confirm in ERCA portal',
                  )
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-slate-900 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-500/20"
              >
                <Send size={14} /> Submit to ERCA
              </button>
            </div>
          </div>

          {/* Live aged withholding KPI strip */}
          <div className="ovds-grid-layout cols-4">
            {[
              {
                label: 'Total Withheld',
                value: `ETB ${fmt(withholdingApiData.total)}`,
                color: 'text-slate-700',
                bg: 'bg-white dark:bg-white',
                border: 'border-slate-200' },
              {
                label: 'Unremitted (Aged)',
                value: `ETB ${fmt(withholdingApiData.unremitted)}`,
                color: 'text-amber-700',
                bg: 'bg-amber-50',
                border: 'border-amber-200' },
              {
                label: 'VAT Withholding',
                value: '15% rate',
                color: 'text-[var(--pro-azure-dark)]',
                bg: 'bg-[var(--pro-azure-50)]',
                border: 'border-[var(--pro-azure-100)]' },
              {
                label: 'Income Tax W/H',
                value: '2% rate',
                color: 'text-[var(--pro-azure)]',
                bg: 'bg-[var(--pro-azure-50)]',
                border: 'border-[var(--pro-azure-100)]' },
            ].map((k, i) => (
              <div
                key={k.label}
                className={`${k.bg} border ${k.border} rounded-xl p-4`}
              >
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {k.label}
                </p>
                <p className={`text-lg font-semibold mt-1 ${k.color}`}>
                  {k.value}
                </p>
                {k.label === 'Unremitted (Aged)' &&
                  withholdingSummary.count > 0 && (
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      {withholdingSummary.count} items pending
                    </p>
                  )}
              </div>
            ))}
          </div>
          <div className="ovds-grid-layout cols-3">
            {[
              {
                title: 'VAT Return',
                desc: 'Monthly output vs input VAT reconciliation',
                icon: <BarChart3 size={16} />,
                color: 'text-[var(--pro-azure)]',
                bg: 'bg-[var(--pro-azure-50)]',
                border: 'border-[var(--pro-azure-100)]',
                items: [
                  'Output VAT from sales invoices',
                  'Input VAT from purchase bills',
                  'Net VAT payable / refundable',
                  'Filed to ERCA by 30th of following month',
                ] },
              {
                title: 'VAT Withholding',
                desc: '15% withheld from VAT-registered suppliers',
                icon: <ShieldCheck size={16} />,
                color: 'text-[var(--pro-azure)]',
                bg: 'bg-[var(--pro-azure-50)]',
                border: 'border-[var(--pro-azure-100)]',
                items: [
                  'Supplier TIN verification',
                  'Invoice-level withholding register',
                  'Aged summary (0-30, 31-60, 61-90, 90+)',
                  'Remittance to ERCA within 30 days',
                ] },
              {
                title: 'Income Tax Withholding',
                desc: '2% withheld on local purchases ≥ ETB 10,000',
                icon: <FileText size={16} />,
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                border: 'border-violet-200',
                items: [
                  'Auto-detected from purchase bills',
                  'Supplier TIN required',
                  'Aged summary tracking',
                  'Monthly remittance to ERCA',
                ] },
            ].map((c, i) => (
              <div
                key={c.title}
                className={`${c.bg} border ${c.border} rounded-xl p-5`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center ${c.color}`}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${c.color}`}>{c.title}</p>
                    <p className="ovds-caption">{c.desc}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {c.items.map((item, i) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <CheckCircle2
                        size={12}
                        className={`${c.color} shrink-0 mt-0.5`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-white dark:ovds-widget-card dark:border-slate-100 p-5">
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)] flex items-center justify-center">
                <ShieldCheck size={24} className="text-[var(--pro-azure)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-900">Full VAT & Withholding Register</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  The complete VAT withholding register, input/output ledgers, refund tracker, and ERCA filing tools are in the VAT Administration page.
                </p>
              </div>
              <Link
                to="/tax/vat"
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shadow-lg shadow-green-500/20"
              >
                <ExternalLink size={14} /> Open VAT Administration
              </Link>
              <p className="text-[10px] text-slate-500">
                Withholding unremitted: <span className="font-semibold text-amber-600">ETB {fmt(withholdingApiData.unremitted)}</span>
                {withholdingApiData.count > 0 && <span className="ml-1">({withholdingApiData.count} items)</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {rootTab === 'accounting' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Header */}
          <div className="bg-[var(--pro-azure-50)] dark:bg-gradient-to-r dark:from-green-900 dark:to-slate-900 rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30 rounded-xl flex items-center justify-center shrink-0">
                <Landmark size={22} className="text-[var(--pro-azure)] dark:text-green-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-900/40 mb-0.5">
                  Full Accounting Suite
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Chart of Accounts & Accounting
                </h2>
                <p className="text-xs text-slate-900/50 mt-0.5">
                  Maintain clean records — journal entries · bank reconciliation · financial reports · never miss a tax day
                </p>
              </div>
            </div>
            <button
              onClick={fetchAccounting}
              className="p-2.5 rounded-xl hover:bg-[var(--pro-azure-100)] dark:bg-white/10 text-slate-900/60 hover:text-slate-900 transition-all"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={accLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>
          {/* KPI strip */}
          {!accLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                {
                  label: 'GL Accounts',
                  value: accounts.length,
                  sub: `${accounts.filter((a: any) => a.isActive).length} active`,
                  color: 'text-[var(--pro-azure)]',
                  bg: 'bg-[var(--pro-azure-50)]',
                  tab: 'accounts' as AccTab },
                {
                  label: 'Journal Entries',
                  value: journals.length,
                  sub: 'posted entries',
                  color: 'text-violet-700',
                  bg: 'bg-violet-50',
                  tab: 'journal' as AccTab },
                {
                  label: 'Bank Balance',
                  value: `ETB ${fmt(banks.reduce((s: number, b: any) => s + Number(b.balance), 0))}`,
                  sub: `${banks.length} accounts`,
                  color: 'text-[var(--pro-azure-dark)]',
                  bg: 'bg-[var(--pro-azure-50)]',
                  tab: 'banks' as AccTab },
                {
                  label: 'Unreconciled',
                  value: reconSummary?.totalPending ?? '—',
                  sub: 'bank transactions',
                  color:
                    (reconSummary?.totalPending ?? 0) > 0
                      ? 'text-amber-700'
                      : 'text-[var(--pro-azure-dark)]',
                  bg:
                    (reconSummary?.totalPending ?? 0) > 0
                      ? 'bg-amber-50'
                      : 'bg-[var(--pro-azure-50)]',
                  tab: 'reconcile' as AccTab },
                {
                  label: 'Total Assets',
                  value: accountBalances
                    ? `ETB ${fmt(accountBalances.totals?.assets ?? 0)}`
                    : '—',
                  sub: 'from GL',
                  color: 'text-[var(--pro-azure)]',
                  bg: 'bg-[var(--pro-azure-50)]',
                  tab: 'reports' as AccTab },
                {
                  label: 'Net Worth',
                  value: accountBalances
                    ? `ETB ${fmt((accountBalances.totals?.equity ?? 0) + ((accountBalances.totals?.income ?? 0) - (accountBalances.totals?.expenses ?? 0)))}`
                    : '—',
                  sub: 'equity + P&L',
                  color:
                    (accountBalances?.totals?.equity ?? 0) >= 0
                      ? 'text-[var(--pro-azure-dark)]'
                      : 'text-rose-700',
                  bg: 'bg-white',
                  tab: 'reports' as AccTab },
              ].map((k, i) => (
                <button
                  key={k.label}
                  onClick={() => setAccTab(k.tab)}
                  className={`${k.bg} rounded-xl p-4 border border-current/10 text-left hover:shadow-md hover:-translate-y-0.5 transition-all`}
                >
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {k.label}
                  </p>
                  <p className={`text-lg font-semibold mt-1 ${k.color}`}>
                    {typeof k.value === 'number' ? k.value : k.value}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{k.sub}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[
              {
                key: 'accounts',
                label: 'Chart of Accounts',
                icon: <Landmark size={14} /> },
              {
                key: 'journal',
                label: 'Journal Entries',
                icon: <BookOpen size={14} /> },
              {
                key: 'banks',
                label: 'Bank Accounts',
                icon: <Wallet size={14} /> },
              { key: 'vendors', label: 'Vendors', icon: <Users2 size={14} /> },
              {
                key: 'recurring',
                label: 'Recurring',
                icon: <RefreshCw size={14} /> },
              {
                key: 'reconcile',
                label: 'Reconciliation',
                icon: <ShieldAlert size={14} />,
                badge: reconSummary?.totalPending },
              {
                key: 'reports',
                label: 'Financial Reports',
                icon: <BarChart3 size={14} /> },
            ].map((t, i) => (
              <button
                key={t.key}
                onClick={() => setAccTab(t.key as any)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${accTab === t.key ? 'bg-white dark:bg-slate-200 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              >
                {t.icon} {t.label}
                {'badge' in t && t.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white dark:ovds-widget-card dark:border-slate-100 p-6 min-h-[400px]">
            {accTab === 'accounts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        value={accSearch}
                        onChange={(e) => setAccSearch(e.target.value)}
                        placeholder="Search accounts…"
                        className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 w-52"
                      />
                    </div>
                    <select
                      value={accTypeFilter}
                      onChange={(e) => setAccTypeFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20"
                    >
                      <option value="">All Types</option>
                      {[
                        'ASSET',
                        'LIABILITY',
                        'EQUITY',
                        'INCOME',
                        'EXPENSE',
                      ].map((t, i) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {(accSearch || accTypeFilter) && (
                      <button
                        onClick={() => {
                          setAccSearch('');
                          setAccTypeFilter('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const rows = accounts
                          .filter(
                            (a: any) =>
                              (!accSearch ||
                                a.name
                                  .toLowerCase()
                                  .includes(accSearch.toLowerCase()) ||
                                a.code
                                  .toLowerCase()
                                  .includes(accSearch.toLowerCase())) &&
                              (!accTypeFilter || a.type === accTypeFilter),
                          )
                          .map(
                            (a: any) =>
                              `${a.code},"${a.name}",${a.type},${a.category?.replace(/_/g, ' ')},${a.isActive ? 'Active' : 'Inactive'}`,
                          )
                          .join('\n');
const blob = new Blob(
                          [`Code,Name,Type,Category,Status\n${rows}`],
                          { type: 'text/csv' },
                        );
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
                        link.href = url;
                        link.download = `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                      <Download size={14} /> CSV
                    </button>
                    <button
                      onClick={() => {
                        setEditingAccount(null);
                        setShowAccountModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
                    >
                      <Plus size={16} /> New Account
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm ovds-table">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="text-left px-4 py-3 ovds-label">
                          Code
                        </th>
                        <th className="text-left px-4 py-3 ovds-label">
                          Account Name
                        </th>
                        <th className="text-left px-4 py-3 ovds-label">
                          Category
                        </th>
                        <th className="text-right px-4 py-3 ovds-label">
                          Balance
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const balMap = new Map(
                          (accountBalances?.accounts || []).map((a: any) => [
                            a.id,
                            a.balance,
                          ]),
                        );
const TYPE_COLORS: Record<string, string> = {
                          ASSET: 'text-[var(--pro-azure)]',
                          LIABILITY: 'text-rose-700',
                          EQUITY: 'text-violet-700',
                          INCOME: 'text-[var(--pro-azure-dark)]',
                          EXPENSE: 'text-amber-700' };
const TYPE_BG: Record<string, string> = {
                          ASSET: 'bg-[var(--pro-azure-50)]',
                          LIABILITY: 'bg-rose-50',
                          EQUITY: 'bg-violet-50',
                          INCOME: 'bg-[var(--pro-azure-50)]',
                          EXPENSE: 'bg-amber-50' };
const grouped = [
                          'ASSET',
                          'LIABILITY',
                          'EQUITY',
                          'INCOME',
                          'EXPENSE',
                        ].reduce(
                          (acc, type) => {
                            const items = accounts.filter(
                              (a: any) =>
                                a.type === type &&
                                (!accSearch ||
                                  a.name
                                    .toLowerCase()
                                    .includes(accSearch.toLowerCase()) ||
                                  a.code
                                    .toLowerCase()
                                    .includes(accSearch.toLowerCase())) &&
                                (!accTypeFilter || a.type === accTypeFilter),
                            );
if (items.length) acc[type] = items;
return acc;
                          },
                          {} as Record<string, any[]>,
                        );
return Object.entries(grouped).map(([type, items]) => (
                          <React.Fragment key={type}>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                              <td colSpan={5} className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLORS[type] ?? 'text-slate-400'}`}
                                  >
                                    {type}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    ({items.length})
                                  </span>
                                  {accountBalances && (
                                    <span
                                      className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BG[type]} ${TYPE_COLORS[type]}`}
                                    >
                                      ETB{' '}
                                      {fmt(
                                        items.reduce(
                                          (s: number, a: any) =>
                                            s + (balMap.get(a.id) ?? 0),
                                          0,
                                        ),
                                      )}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {items.map((a: any) => {
                              const bal = balMap.get(a.id) ?? 0;
return (
                                <tr
                                  key={a.id}
                                  className="hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                    {a.code}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-700">
                                    {a.name}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-400">
                                    {a.category?.replace(/_/g, ' ')}
                                  </td>
                                  <td
                                    className={`px-4 py-3 text-right font-semibold text-sm ${bal > 0 ? 'text-slate-800' : bal < 0 ? 'text-rose-600' : 'text-slate-600'}`}
                                  >
                                    {bal !== 0 ? fmt(bal) : '—'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => setLedgerAccount(a)}
                                      className="p-1.5 text-slate-500 hover:text-violet-600 transition-colors"
                                      title="View Ledger"
                                    >
                                      <BookOpen size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()}
                      {!accounts.length && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-12 text-center text-slate-500 text-sm"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <Landmark size={36} className="text-slate-700" />
                              <p className="font-bold text-slate-400">
                                No accounts yet
                              </p>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await api.post(
                                      '/ovds/accounts/seed',
                                      {},
                                    );
toast.success(
                                      res.data.data?.message ||
                                        'Default accounts created',
                                    );
                                    fetchAccounting();
                                  }
catch (err: any) {
                                    toast.error(
                                      err.response?.data?.message ||
                                        'Failed to seed',
                                    );
                                  }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)]"
                              >
                                <Plus size={14} /> Setup Default Chart of
                                Accounts
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {accTab === 'journal' && (
              <div className="space-y-4">
                {/* Filter bar */}
                <div className="flex flex-wrap gap-3 items-end p-4 bg-white rounded-2xl border border-slate-200">
                  <div className="flex-1 min-w-44 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Search
                    </label>
                    <div className="relative">
                      <Search
                        size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        value={jSearch}
                        onChange={(e) => setJSearch(e.target.value)}
                        placeholder="Reference or description…"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-white border border-slate-200 dark:border-slate-200 rounded-xl text-sm text-slate-800 dark:text-slate-700 outline-none focus:ring-2 focus:ring-teal-400/20"
                      />
                    </div>
                  </div>
                  {[
                    { label: 'From', val: jDateFrom, set: setJDateFrom },
                    { label: 'To', val: jDateTo, set: setJDateTo },
                  ].map((f, i) => (
                    <div key={f.label} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {f.label}
                      </label>
                      <input
                        type="date"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-white border border-slate-200 dark:border-slate-200 rounded-xl text-sm text-slate-800 dark:text-slate-700 outline-none focus:ring-2 focus:ring-teal-400/20"
                      />
                    </div>
                  ))}
                  <button
                    onClick={fetchAccounting}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
                  >
                    <RefreshCw size={13} /> Apply
                  </button>
                  {(jSearch || jDateFrom || jDateTo) && (
                    <button
                      onClick={() => {
                        setJSearch('');
                        setJDateFrom('');
                        setJDateTo('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setJournalModalIsTemplate(false);
                      setShowJournalModal(true);
                    }}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                  >
                    <Plus size={15} /> New Entry
                  </button>
                </div>
                {/* Summary strip */}
                {journals.length > 0 && (
                  <div className="ovds-grid-layout cols-3 gap-sm">
                    {[
                      {
                        label: 'Entries',
                        value: String(journals.length),
                        color: 'text-slate-700',
                        bg: 'bg-white' },
                      {
                        label: 'Total Debits',
                        value: `ETB ${fmt(journals.reduce((s: number, j: any) => s + (j.lines || []).reduce((ls: number, l: any) => ls + Number(l.debit || 0), 0), 0))}`,
                        color: 'text-[var(--pro-azure)]',
                        bg: 'bg-[var(--pro-azure-50)]' },
                      {
                        label: 'Total Credits',
                        value: `ETB ${fmt(journals.reduce((s: number, j: any) => s + (j.lines || []).reduce((ls: number, l: any) => ls + Number(l.credit || 0), 0), 0))}`,
                        color: 'text-rose-700',
                        bg: 'bg-rose-50' },
                    ].map((k, i) => (
                      <div
                        key={k.label}
                        className={`${k.bg} rounded-xl p-3 border border-current/10`}
                      >
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {k.label}
                        </p>
                        <p className={`text-lg font-semibold mt-0.5 ${k.color}`}>
                          {k.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Entry list */}
                <div className="space-y-2">
                  {journals.map((j: any) => {
                    const totalDebit = (j.lines || []).reduce(
                      (s: number, l: any) => s + Number(l.debit || 0),
                      0,
                    );
const totalCredit = (j.lines || []).reduce(
                      (s: number, l: any) => s + Number(l.credit || 0),
                      0,
                    );
const amount = totalDebit || j.totalAmount || 0;
return (
                      <div
                        key={j.id}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-4 px-5 py-4">
                          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={15} className="text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {j.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {j.reference && (
                                <span className="font-mono mr-2 text-slate-400">
                                  {j.reference}
                                </span>
                              )}
                              {j.date
                                ? new Date(j.date).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${j.status === 'POSTED' ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-amber-100 text-amber-700'}`}
                            >
                              {j.status}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              ETB {fmt(amount)}
                            </span>
                          </div>
                        </div>
                        {(j.lines || []).length > 0 && (
                          <div className="border-t border-slate-100 px-5 pb-3">
                            <table className="w-full text-xs mt-2 ovds-table">
                              <thead>
                                <tr className="border-b border-slate-100">
                                  <th className="text-left py-1.5 ovds-label">
                                    Account
                                  </th>
                                  <th className="text-right py-1.5 ovds-label">
                                    Debit
                                  </th>
                                  <th className="text-right py-1.5 ovds-label">
                                    Credit
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {j.lines.map((l: any) => (
                                  <tr
                                    key={l.id}
                                    className="border-b border-slate-50 last:border-0"
                                  >
                                    <td className="py-1.5 font-medium text-slate-700">
                                      {l.account?.code} — {l.account?.name}
                                    </td>
                                    <td className="py-1.5 text-right font-semibold text-[var(--pro-azure)]">
                                      {l.debit > 0 ? fmt(l.debit) : '—'}
                                    </td>
                                    <td className="py-1.5 text-right font-semibold text-rose-700">
                                      {l.credit > 0 ? fmt(l.credit) : '—'}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-white border-t border-slate-200">
                                  <td className="py-1.5 ovds-label">
                                    Totals
                                  </td>
                                  <td className="py-1.5 text-right font-semibold text-[var(--pro-azure)]">
                                    {fmt(totalDebit)}
                                  </td>
                                  <td className="py-1.5 text-right font-semibold text-rose-700">
                                    {fmt(totalCredit)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!journals.length && (
                    <div className="py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      {jSearch || jDateFrom || jDateTo
                        ? 'No entries match your filters.'
                        : 'No journal entries yet.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {accTab === 'banks' && (
              <div className="space-y-4">
                {banks.length > 0 && (
                  <div className="ovds-grid-layout cols-4">
                    {[
                      {
                        label: 'Total Balance',
                        value: `ETB ${fmt(banks.reduce((s: number, b: any) => s + Number(b.balance), 0))}`,
                        color: 'text-[var(--pro-azure-dark)]',
                        bg: 'bg-[var(--pro-azure-50)]' },
                      {
                        label: 'Accounts',
                        value: banks.length,
                        color: 'text-[var(--pro-azure)]',
                        bg: 'bg-[var(--pro-azure-50)]' },
                      {
                        label: 'Unreconciled',
                        value: reconSummary?.totalPending ?? 0,
                        color:
                          (reconSummary?.totalPending ?? 0) > 0
                            ? 'text-amber-700'
                            : 'text-[var(--pro-azure-dark)]',
                        bg:
                          (reconSummary?.totalPending ?? 0) > 0
                            ? 'bg-amber-50'
                            : 'bg-[var(--pro-azure-50)]' },
                      {
                        label: 'Last Reconciled',
                        value: reconSummary?.lastReconciledDate
                          ? new Date(
                              reconSummary.lastReconciledDate,
                            ).toLocaleDateString()
                          : 'Never',
                        color: 'text-slate-700',
                        bg: 'bg-white' },
                    ].map((k, i) => (
                      <div
                        key={k.label}
                        className={`${k.bg} rounded-xl p-4 border border-current/10`}
                      >
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {k.label}
                        </p>
                        <p className={`text-lg font-semibold mt-1 ${k.color}`}>
                          {k.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowBankModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
                  >
                    <Plus size={16} /> Add Bank Account
                  </button>
                </div>
                <div className="ovds-grid-layout cols-2">
                  {banks.map((b: any) => (
                    <BankAccountCard
                      key={b.id}
                      bank={b}
                      onRecordTxn={() => setTxnBank(b)}
                    />
                  ))}
                  {!banks.length && (
                    <div className="col-span-2 py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No bank accounts yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {accTab === 'vendors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search vendors…"
                      className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 w-56"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingVendor(null);
                      setShowVendorModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
                  >
                    <Plus size={16} /> New Vendor
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vendors
                    .filter(
                      (v: any) =>
                        !vendorSearch ||
                        v.name
                          .toLowerCase()
                          .includes(vendorSearch.toLowerCase()) ||
                        (v.tin || '').includes(vendorSearch),
                    )
                    .map((v: any) => (
                      <div
                        key={v.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                              <span className="text-violet-700 font-semibold text-sm">
                                {v.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm">
                                {v.name}
                              </h4>
                              {v.paymentTerms && (
                                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                                  {v.paymentTerms}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingVendor(v);
                                setShowVendorModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !(await confirm({
                                    title: 'Delete vendor?',
                                    variant: 'danger',
                                    confirmLabel: 'Delete' }))
                                )
                                  return;
try {
                                  await api.delete(`/ovds/vendors/${v.id}`);
toast.success('Vendor deleted');
                                  fetchAccounting();
                                }
catch (err: any) {
                                  if (!err?.isRateLimited) toast.error('Failed to delete');
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {v.email && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail size={11} />
                              {v.email}
                            </div>
                          )}
                          {v.phone && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Phone size={11} />
                              {v.phone}
                            </div>
                          )}
                          {v.address && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <MapPin size={11} />
                              <span className="truncate">{v.address}</span>
                            </div>
                          )}
                          {v.tin && (
                            <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                              TIN: {v.tin}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <VendorBillSummary vendorId={v.id} />
                        </div>
                      </div>
                    ))}
                  {!vendors.length && (
                    <div className="col-span-3 py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No vendors yet. Add your first vendor.
                    </div>
                  )}
                </div>
              </div>
            )}

            {accTab === 'recurring' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Templates for monthly entries like depreciation, rent, and
                    subscriptions. Post them with one click each period.
                  </p>
                  <button
                    onClick={() => {
                      setJournalModalIsTemplate(true);
                      setShowJournalModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all shrink-0"
                  >
                    <Plus size={16} /> New Template
                  </button>
                </div>
                <div className="space-y-3">
                  {recurringTemplates.map((t: any) => {
                    const totalDebit = (t.lines || []).reduce(
                      (s: number, l: any) => s + Number(l.debit || 0),
                      0,
                    );
const amount = totalDebit || t.totalAmount || 0;
return (
                      <div
                        key={t.id}
                        className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                              <RefreshCw
                                size={15}
                                className="text-violet-600"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {t.description || t.name}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                {t.reference} · ETB {fmt(amount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="date"
                              id={`post-date-${t.id}`}
                              defaultValue={
                                new Date().toISOString().split('T')[0]
                              }
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-400/20"
                            />
                            <button
                              onClick={async () => {
                                const dateInput = document.getElementById(
                                  `post-date-${t.id}`,
                                ) as HTMLInputElement;
try {
                                  await api.post(
                                    `/ovds/journal-entries/recurring/${t.id}/post`,
                                    { date: dateInput.value },
                                  );
toast.success('Entry posted to journal');
                                  fetchAccounting();
                                }
catch (err: any) {
                                  toast.error(
                                    err.response?.data?.message ||
                                      'Failed to post',
                                  );
                                }
                              }}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
                            >
                              Post Entry
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !(await confirm({
                                    title: 'Delete template?',
                                    variant: 'danger',
                                    confirmLabel: 'Delete' }))
                                )
                                  return;
try {
                                  await api.delete(
                                    `/ovds/journal-entries/${t.id}`,
                                  );
toast.success('Template deleted');
                                  fetchAccounting();
                                }
catch (err: any) {
                                  if (!err?.isRateLimited) toast.error('Failed to delete');
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {(t.lines || []).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {t.lines.map((l: any) => (
                              <div key={l.id} className="text-xs">
                                <p className="font-bold text-slate-700 truncate">
                                  {l.account?.code} {l.account?.name}
                                </p>
                                <p
                                  className={
                                    l.debit > 0
                                      ? 'text-[var(--pro-azure)]'
                                      : 'text-rose-600'
                                  }
                                >
                                  {l.debit > 0
                                    ? `DR ${fmt(l.debit)}`
                                    : `CR ${fmt(l.credit)}`}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!recurringTemplates.length && (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <RefreshCw
                        size={36}
                        className="text-slate-700 mx-auto mb-3"
                      />
                      <p className="font-bold text-slate-400 text-sm">
                        No recurring templates yet
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Create templates for monthly depreciation, rent,
                        subscriptions, etc.
                      </p>
                      <button
                        onClick={() => {
                          setJournalModalIsTemplate(true);
                          setShowJournalModal(true);
                        }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)]"
                      >
                        <Plus size={14} /> Create First Template
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {accTab === 'reconcile' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Bank Reconciliation
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Match your GL balances against bank statements
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      fetchFinSummary();
                      fetchAccounting();
                    }}
                    className="flex items-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-400"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Summary KPIs */}
                <div className="ovds-grid-layout cols-4">
                  {[
                    {
                      label: 'Unreconciled Items',
                      val:
                        reconSummary?.totalPending ??
                        reconSummary?.unreconciledCount ??
                        0,
                      color: 'text-amber-600',
                      bg: 'bg-amber-50' },
                    {
                      label: 'Unreconciled Amount',
                      val: `ETB ${fmt(reconSummary?.unreconciledAmount ?? 0)}`,
                      color: 'text-[var(--pro-azure)]',
                      bg: 'bg-[var(--pro-azure-50)]' },
                    {
                      label: 'Last Reconciled',
                      val: reconSummary?.lastReconciledDate
                        ? new Date(
                            reconSummary.lastReconciledDate,
                          ).toLocaleDateString()
                        : 'Never',
                      color: 'text-[var(--pro-azure)]',
                      bg: 'bg-[var(--pro-azure-50)]' },
                    {
                      label: 'GL vs Bank Diff',
                      val: `ETB ${fmt(reconSummary?.difference ?? 0)}`,
                      color:
                        (reconSummary?.difference ?? 0) === 0
                          ? 'text-[var(--pro-azure)]'
                          : 'text-rose-600',
                      bg:
                        (reconSummary?.difference ?? 0) === 0
                          ? 'bg-[var(--pro-azure-50)]'
                          : 'bg-rose-50' },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className={`p-5 rounded-2xl border border-slate-200 ${s.bg}`}
                    >
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                        {s.label}
                      </p>
                      <p className={`text-lg font-semibold ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Per-bank reconciliation */}
                {banks.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Per-Account Reconciliation
                    </p>
                    {banks.map((b: any) => {
                       
                      const account = accountBalances?.accounts?.find(
                          (a: any) =>
                            a.bankAccountId === b.id ||
                            a.name
                              ?.toLowerCase()
                              .includes(b.name?.toLowerCase()),
                        )?.balance ??
                        b.balance ??
                        0;
return (
                        <div
                          key={b.id}
                          className="bg-white border border-slate-200 rounded-xl p-5"
                        >
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[var(--pro-azure-100)] rounded-xl flex items-center justify-center shrink-0">
                                <Landmark size={16} className="text-[var(--pro-azure)]" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">
                                  {b.name}
                                </p>
                                <p className="ovds-caption">
                                  {b.bankName} · {b.accountNumber}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 flex-wrap">
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  GL Balance
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                  ETB {fmt(Number(b.balance))}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  Statement Balance
                                </p>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={fmt(Number(b.balance))}
                                  className="w-36 px-3 py-1.5 bg-white dark:bg-white border border-slate-200 dark:border-slate-200 rounded-lg text-sm font-medium text-right text-slate-800 dark:text-slate-700 outline-none focus:ring-2 focus:ring-teal-400/20"
                                  id={`stmt-bal-${b.id}`}
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  Difference
                                </p>
                                <p
                                  className="text-sm font-semibold text-[var(--pro-azure)]"
                                  id={`diff-${b.id}`}
                                >
                                  ETB 0.00
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const stmtInput = document.getElementById(
                                    `stmt-bal-${b.id}`,
                                  ) as HTMLInputElement;
const diffEl = document.getElementById(
                                    `diff-${b.id}`,
                                  );
const stmt =
                                    parseFloat(stmtInput.value) ||
                                    Number(b.balance);
const diff = Number(b.balance) - stmt;
if (diffEl) {
                                    diffEl.textContent = `ETB ${fmt(Math.abs(diff))}`;
                                    diffEl.className = `text-sm font-semibold ${diff === 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`;
                                  }
if (diff === 0)
                                    toast.success(
                                      `${b.name} reconciled — balances match`,
                                    );
                                  else
                                    toast.error(
                                      `${b.name}: difference of ETB ${fmt(Math.abs(diff))}`,
                                    );
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
                              >
                                <CheckCircle2 size={13} /> Reconcile
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl p-5 flex items-start gap-3">
                  <Info size={16} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--pro-azure)]">
                    Enter your bank statement closing balance for each account,
                    then click Reconcile to compare against the GL. Any
                    difference indicates unrecorded transactions or timing
                    differences.
                  </p>
                </div>
              </div>
            )}

            {accTab === 'reports' && (
              <div className="space-y-5">
                <ReportsPanel />
                <PeriodManager />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accounting Modals */}
      {showAccountModal && (
        <AccountModal
          account={editingAccount}
           companyId={selectedCompanyId ?? undefined}
           onClose={() => setShowAccountModal(false)}
           onSave={fetchAccounting}
         />
       )}
       {showJournalModal && (
         <JournalModal
           onClose={() => setShowJournalModal(false)}
           onSave={fetchAccounting}
           accounts={accounts}
           isTemplate={journalModalIsTemplate}
         />
       )}
       {showBankModal && (
         <BankModal
           onClose={() => setShowBankModal(false)}
           onSave={fetchAccounting}
         />
       )}
       {showVendorModal && (
         <VendorModal
           vendor={editingVendor}
           companyId={selectedCompanyId ?? undefined}
          onClose={() => setShowVendorModal(false)}
          onSave={fetchAccounting}
        />
      )}
      {txnBank && (
        <BankTransactionModal
          bankAccountId={txnBank.id}
          bankName={txnBank.name || txnBank.bankName || ''}
          onClose={() => setTxnBank(null)}
          onSave={fetchAccounting}
        />
      )}
      {ledgerAccount && (
        <LedgerModal
          account={ledgerAccount}
          onClose={() => setLedgerAccount(null)}
        />
      )}
    </AppPage>
  );
};
export default DisasterFund;














