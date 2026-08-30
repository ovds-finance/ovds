import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../rbac/AuthContext';
import { Can } from '../components/can';
import api from '../services/api';
import { AppPage } from '../components/ui';
import {
  BookOpen, ShieldCheck, Globe, FileText, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock,
  BarChart3, Layers, Award, RefreshCw, ExternalLink, ArrowRight,
  Activity, Building2, Receipt, Landmark, Users2,
  ChevronDown, ChevronUp, Info, Zap, Star,
} from 'lucide-react';
import { IFRSComplianceReport } from './IFRSComplianceReport';
import { getLiveDashboard, IfrsLiveDashboard } from '../services/ifrsApi';

// -- Types ---------------------------------------------------------------------
type IfrsTier = '1' | '2' | '3';

// -- Constants -----------------------------------------------------------------
const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
  high:     { label: 'High',     cls: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  medium:   { label: 'Medium',   cls: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  low:      { label: 'Low',      cls: 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
};

const IFRS18_TASKS = [
  { id: 'map-pl',      title: 'Map P&L to Operating/Investing/Financing categories', ref: 'IFRS 18.B1–B12',  priority: 'critical', description: 'Reclassify all income statement line items into the three new IFRS 18 categories.' },
  { id: 'mpm',         title: 'Identify Management Performance Measures (MPMs)',      ref: 'IFRS 18.43–52',  priority: 'high',     description: 'List all non-IFRS subtotals used in external communications (e.g. "adjusted EBITDA").' },
  { id: 'reconcile',   title: 'Prepare MPM reconciliation note',                      ref: 'IFRS 18.53–60',  priority: 'high',     description: 'For each MPM, prepare a tabular reconciliation showing adjustments from the IFRS subtotal.' },
  { id: 'comparative', title: 'Plan comparative period restatement',                  ref: 'IFRS 18.C1–C5',  priority: 'medium',   description: 'IFRS 18 requires full retrospective application. Restate prior-year P&L to the new format.' },
  { id: 'systems',     title: 'Update chart of accounts for new categories',          ref: 'IFRS 18.B1',     priority: 'medium',   description: 'Add account tags for Operating/Investing/Financing in OVDS Chart of Accounts.' },
  { id: 'disclosures', title: 'Draft new disclosure notes',                           ref: 'IFRS 18.61–70',  priority: 'low',      description: 'Prepare disclosure notes explaining the new P&L structure and MPMs used.' },
];

const TIERS: Array<{ tier: IfrsTier; label: string; standard: string; since: string; criteria: string[]; businessTypes: string[]; keyStandards: string[]; color: string; bg: string; border: string }> = [
  {
    tier: '1', label: 'Full IFRS', standard: 'IFRS Accounting Standards (IASB)', since: '7 July 2023',
    criteria: ['Turnover > ETB 300M', 'Employees > 200', 'Assets > ETB 200M', 'Liabilities > ETB 200M'],
    businessTypes: ['Large Enterprise', 'Government', 'Banks & Insurance (always)', 'Large Manufacturing'],
    keyStandards: ['IFRS 15', 'IFRS 16', 'IFRS 9', 'IAS 1', 'IAS 2', 'IAS 16', 'IAS 19', 'IAS 36', 'IAS 37', 'IFRS 18 (2027)'],
    color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50/50 dark:bg-violet-950/10', border: 'border-violet-200 dark:border-violet-800',
  },
  {
    tier: '2', label: 'IFRS for SMEs', standard: 'IFRS for SMEs Accounting Standard', since: '7 July 2024',
    criteria: ['Turnover > ETB 20M', 'Employees > 20', 'Assets > ETB 20M', 'Liabilities > ETB 20M'],
    businessTypes: ['Small Business', 'Medium Enterprise', 'Cooperative Society', 'Partnership'],
    keyStandards: ['Section 23 (Revenue)', 'Section 20 (Leases)', 'Sections 11–12 (Financial Instruments)', 'Section 17 (PP&E)', 'Section 28 (Employee Benefits)'],
    color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50/50 dark:bg-emerald-950/10', border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    tier: '3', label: 'Micro-entity', standard: 'Outside IFRS scope', since: 'N/A',
    criteria: ['Below Tier 2 thresholds on all 4 criteria'],
    businessTypes: ['Freelancer', 'Sole Proprietorship', 'Very small partnerships'],
    keyStandards: ['No IFRS obligation', 'VAT still applies', 'PIT still applies', 'DRRF still applies'],
    color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50/50 dark:bg-amber-950/10', border: 'border-amber-200 dark:border-amber-800',
  },
];

const AABE_THRESHOLDS = [
  { tier: 'Tier 1 — Full IFRS',    since: '7 July 2023', criteria: 'Meet 2 of 4: Turnover > ETB 300M · Employees > 200 · Assets > ETB 200M · Liabilities > ETB 200M', always: 'Banks, insurance companies, and government-owned enterprises are always Tier 1 regardless of size.', color: 'border-violet-400 bg-violet-50/50 dark:bg-violet-950/10' },
  { tier: 'Tier 2 — IFRS for SMEs', since: '7 July 2024', criteria: 'Meet 2 of 4: Turnover > ETB 20M · Employees > 20 · Assets > ETB 20M · Liabilities > ETB 20M', always: null, color: 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10' },
  { tier: 'Tier 3 — Micro-entity',  since: 'N/A',         criteria: 'Below Tier 2 thresholds on all 4 criteria. No IFRS obligation.', always: 'VAT (15%), PIT, pension (7%/11%), and DRRF obligations still apply regardless of IFRS tier.', color: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/10' },
];

const FINANCIAL_STATEMENTS = [
  { label: 'Balance Sheet',       sub: 'Assets, liabilities, equity as of date',    standard: 'IAS 1 / Section 4', route: '/reports?type=bs',           icon: <BarChart3 size={16} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { label: 'Profit & Loss',       sub: 'Income, expenses, net profit for period',   standard: 'IAS 1 / Section 5', route: '/reports?type=pl',           icon: <TrendingUp size={16} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { label: 'Changes in Equity',   sub: 'Opening equity + movements = closing',      standard: 'IAS 1 / Section 6', route: '/reports?type=equity',       icon: <Users2 size={16} />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
  { label: 'Cash Flow',           sub: 'Operating, investing, financing activities', standard: 'IAS 7 / Section 7', route: '/reports?type=cf',           icon: <Landmark size={16} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  { label: 'Notes to Financials', sub: 'IFRS-compliant disclosure notes',           standard: 'IAS 1 / Section 8', route: '/reports?type=notes',        icon: <FileText size={16} />, color: 'text-slate-600 bg-white dark:bg-slate-800' },
  { label: 'Trial Balance',       sub: 'All accounts with debit/credit totals',     standard: 'Supports IAS 1',    route: '/reports?type=trial-balance', icon: <Receipt size={16} />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
];

const STANDARDS = [
  { code: 'IFRS 15', title: 'Revenue from Contracts with Customers', tier: ['1', '2'] as IfrsTier[], summary: '5-step revenue recognition model. Revenue recognised when performance obligation satisfied.', ethiopian: 'VAT Proclamation 1341/2024 — output VAT is a liability, not revenue.' },
  { code: 'IFRS 16', title: 'Leases',                                 tier: ['1'] as IfrsTier[],      summary: 'All leases > 12 months on balance sheet as ROU asset + lease liability.',                  ethiopian: 'Office/equipment leases must be capitalised. Short-term (≤12m) and low-value exempt.' },
  { code: 'IFRS 9',  title: 'Financial Instruments',                  tier: ['1'] as IfrsTier[],      summary: 'ECL impairment model. 3 classification categories: amortised cost, FVOCI, FVTPL.',          ethiopian: 'Trade receivables use simplified ECL approach. AR aging buckets map to provision rates.' },
  { code: 'IAS 1',   title: 'Presentation of Financial Statements',   tier: ['1', '2'] as IfrsTier[], summary: 'Complete set of 5 financial statements with prior-year comparatives.',                      ethiopian: 'AABE requires full set for Tier 1 & 2. Replaced by IFRS 18 effective 1 Jan 2027.' },
  { code: 'IAS 2',   title: 'Inventories',                            tier: ['1', '2'] as IfrsTier[], summary: 'Lower of cost and NRV. FIFO or Weighted Average only — LIFO prohibited.',                  ethiopian: 'Manufacturing entities must include direct materials, labour, and overheads in cost.' },
  { code: 'IAS 16',  title: 'Property, Plant and Equipment',          tier: ['1', '2'] as IfrsTier[], summary: 'Cost or revaluation model. Depreciation over useful life.',                                ethiopian: 'Componentisation required for significant parts with different useful lives.' },
  { code: 'IAS 19',  title: 'Employee Benefits',                      tier: ['1', '2'] as IfrsTier[], summary: 'Short-term benefits expensed when service rendered. Defined contribution = contribution due.', ethiopian: 'Ethiopian pension 7% (employee) + 11% (employer), capped at ETB 15,000 insurable earnings.' },
  { code: 'IAS 36',  title: 'Impairment of Assets',                   tier: ['1', '2'] as IfrsTier[], summary: 'Annual impairment review for goodwill; others when indicators exist.',                      ethiopian: 'Recoverable amount = higher of fair value less costs of disposal and value in use.' },
  { code: 'IAS 37',  title: 'Provisions, Contingent Liabilities',     tier: ['1', '2'] as IfrsTier[], summary: 'Recognise provision when: present obligation, probable outflow, reliable estimate.',         ethiopian: 'VAT late penalties (ETB 500/day), DRRF overdue contributions must be provisioned.' },
  { code: 'IAS 12',  title: 'Income Taxes',                           tier: ['1', '2'] as IfrsTier[], summary: 'Current tax + deferred tax. Deferred tax on temporary differences.',                        ethiopian: 'BIT 30% flat rate. File within 4 months of FY end (by November 7).' },
  { code: 'IFRS 18', title: 'Presentation and Disclosure (replaces IAS 1)', tier: ['1'] as IfrsTier[], summary: 'New P&L categories: Operating/Investing/Financing. MPM disclosures required.',           ethiopian: 'Effective 1 January 2027. Retrospective application required.' },
];

function buildTimeline() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextQuarterMonth = [2, 5, 8, 11].find(m => m >= month) ?? 11;
  return [
    { id: 'vat',     label: 'VAT Return',         detail: 'Monthly — 30th of following month',       route: '/tax/vat',                  due: new Date(year, month + 1, 30), daysLeft: 0, status: 'ok' as const },
    { id: 'drrf',    label: 'DRRF Quarterly',      detail: '15th of last month of quarter',           route: '/disaster-fund',        due: new Date(year, nextQuarterMonth, 15), daysLeft: 0, status: 'ok' as const },
    { id: 'bit',     label: 'BIT Declaration',     detail: 'Within 4 months of FY end — Nov 7',      route: '/tax/business-income',  due: new Date(year, 10, 7), daysLeft: 0, status: 'ok' as const },
    { id: 'pension', label: 'Pension Remittance',  detail: 'Monthly — same cycle as payroll',        route: '/hr/payroll',              due: new Date(year, month, 28), daysLeft: 0, status: 'ok' as const },
  ].map(item => {
    const diff = Math.ceil((item.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { ...item, daysLeft: diff, status: diff < 0 ? 'overdue' as const : diff <= 7 ? 'urgent' as const : 'ok' as const };
  });
}

// -- Sub-components -------------------------------------------------------------
const StandardCard: React.FC<{ s: typeof STANDARDS[0] }> = ({ s }) => (
  <div className="ovds-widget-card p-5 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
    <div className="flex items-start justify-between gap-2 mb-2">
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">{s.code}</span>
      <div className="flex gap-1">
        {s.tier.map(t => (
          <span key={t} className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">T{t}</span>
        ))}
      </div>
    </div>
    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-1">{s.title}</p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{s.summary}</p>
    <div className="flex items-start gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-800">
      <Info size={10} className="text-amber-500 shrink-0 mt-0.5" />
      <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">{s.ethiopian}</p>
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string; sub: string; icon: React.ReactNode }> = ({ title, sub, icon }) => (  <div className="flex items-start gap-3 mb-4">
    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">{icon}</div>
    <div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
      <p className="ovds-caption mt-0.5">{sub}</p>
    </div>
  </div>
);

const ComplianceRow: React.FC<{ item: ReturnType<typeof buildTimeline>[0] }> = ({ item }) => {
  const statusColor = item.status === 'overdue' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' : item.status === 'urgent' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
  return (
    <Link to={item.route} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <Clock size={12} className="text-slate-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">{item.label}</p>
          <p className="text-[9px] text-slate-400 truncate">{item.detail}</p>
        </div>
      </div>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusColor}`}>
        {item.status === 'overdue' ? 'Overdue' : item.status === 'urgent' ? `${item.daysLeft}d` : 'OK'}
      </span>
    </Link>
  );
};

const TierCard: React.FC<{ info: typeof TIERS[0]; active: boolean; onClick: () => void }> = ({ info, active, onClick }) => (
  <button onClick={onClick} className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md w-full ${active ? info.border + ' ' + info.bg : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.border} ${info.color} mb-2 inline-block`}>Tier {info.tier}</span>
    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{info.label}</p>
    <p className="text-[10px] text-slate-500 mt-0.5">{info.standard}</p>
    <p className="text-[9px] text-slate-400 mt-1">Since {info.since}</p>
    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">View details <ArrowRight size={9} /></div>
  </button>
);

// -- IFRS 18 Tracker with API persistence -------------------------------------
const Ifrs18Tracker: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
const [done, setDone] = React.useState<Set<string>>(new Set());
const [expanded, setExpanded] = React.useState<string | null>(null);
const [saving, setSaving] = React.useState(false);

  // Load persisted state from API
  const { data: savedTasks } = useApiQuery<{ completedIds: string[] }>(
    selectedCompanyId ? `/settings/ifrs/ifrs18-tasks?companyId=${selectedCompanyId}` : '',
    { enabled: !!selectedCompanyId, staleTime: 60_000 }
  );

  React.useEffect(() => {
    if (savedTasks?.completedIds) {
      setDone(new Set(savedTasks.completedIds));
    }
  }, [savedTasks]);
const pct = Math.round((done.size / IFRS18_TASKS.length) * 100);
const toggleTask = async (id: string) => {
    const newDone = new Set(done);
    if (newDone.has(id)) { newDone.delete(id); } else { newDone.add(id); }
    setDone(newDone);
if (!selectedCompanyId) return;
    setSaving(true);
try {
      await api.post('/settings/ifrs/ifrs18-tasks', { companyId: selectedCompanyId, completedIds: Array.from(newDone) });
    }
catch { /* silent */ }
finally { setSaving(false); }
  };
return (
    <div className="ovds-widget-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              IFRS 18
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
              Effective 1 Jan 2027
            </span>
            {saving && <RefreshCw size={11} className="text-slate-400 animate-spin" />}
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">IFRS 18 Readiness Tracker</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Replaces IAS 1 — new P&L presentation and disclosure requirements</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{pct}%</p>
          <p className="ovds-caption">{done.size}/{IFRS18_TASKS.length} done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {IFRS18_TASKS.map(task => {
          const isDone = done.has(task.id);
const isOpen = expanded === task.id;
const pc = PRIORITY_CONFIG[task.priority];
return (
            <div key={task.id} className={`rounded-xl border transition-all ${isDone ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-600'}`}
                >
                  {isDone && <CheckCircle size={12} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</p>
                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${pc.cls}`}>{pc.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{task.ref}</p>
                </div>
                <button onClick={() => setExpanded(isOpen ? null : task.id)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors shrink-0">
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              {isOpen && (
                <div className="px-4 pb-3 pt-0 border-t border-slate-50 dark:border-slate-800">
                  <p className="ovds-body">{task.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const IfsDashboard: React.FC = () => {
  usePageTitle('IFRS Dashboard');
const { user } = useAuth();
const { selectedCompanyId, companies } = useBusiness();
const [searchParams] = useSearchParams();

  // Tab from URL: ?tier=1|2|3 | ?view=thresholds|statements|standards|sustainability|compliance
  const tierParam = searchParams.get('tier') as IfrsTier | null;
const viewParam = searchParams.get('view');
const [activeTier, setActiveTier] = useState<IfrsTier>(tierParam ?? '1');
const [activeTab, setActiveTab] = useState<string>(
    viewParam ?? (tierParam ? 'tier' : 'overview')
  );
const [stdFilter, setStdFilter] = useState<'all' | '1' | '2' | '3'>('all');
const [stdSearch, setStdSearch] = useState('');
const effectiveCompanyId = selectedCompanyId || companies[0]?.id || '';

  // Compliance score from API
  const { data: complianceDashboard } = useApiQuery<{ score: number; config: any; taxSummary: any }>(
    effectiveCompanyId
      ? `/settings/ifrs/dashboard?companyId=${effectiveCompanyId}`
      : '/settings/ifrs/dashboard',
    { enabled: !!user && !!effectiveCompanyId, staleTime: 120_000 }
  );
  const complianceScore = complianceDashboard?.score ?? 0;

  // Live IFRS 15/16/IAS 38 balances from canonical ledger
  const { data: liveDashboard } = useApiQuery<IfrsLiveDashboard>(
    effectiveCompanyId
      ? `/ovds/ifrs/dashboard?companyId=${effectiveCompanyId}`
      : '/ovds/ifrs/dashboard',
    { enabled: !!user && !!effectiveCompanyId, staleTime: 30_000 }
  );
const timeline = useMemo(() => buildTimeline(), []);
const urgentCount = timeline.filter(t => t.status !== 'ok').length;
const filteredStandards = useMemo(() => {
    return STANDARDS.filter(s => {
      const matchTier = stdFilter === 'all' || s.tier.includes(stdFilter as any);
const matchSearch = !stdSearch || s.code.toLowerCase().includes(stdSearch.toLowerCase()) || s.title.toLowerCase().includes(stdSearch.toLowerCase());
return matchTier && matchSearch;
    });
  }, [stdFilter, stdSearch]);
const currentTierInfo = TIERS.find(t => t.tier === activeTier)!;
const TABS = [
    { id: 'overview',       label: 'Overview',        icon: <BarChart3 size={13} /> },
    { id: 'tier',           label: 'IFRS Tiers',      icon: <Layers size={13} /> },
    { id: 'thresholds',     label: 'AABE Thresholds', icon: <Award size={13} /> },
    { id: 'statements',     label: 'Statements',      icon: <FileText size={13} /> },
    { id: 'standards',      label: 'Key Standards',   icon: <BookOpen size={13} /> },
    { id: 'sustainability', label: 'Sustainability',   icon: <Globe size={13} /> },
    { id: 'compliance',     label: 'Compliance',      icon: <ShieldCheck size={13} />, badge: urgentCount > 0 ? urgentCount : undefined },
    { id: 'ifrs18',         label: 'IFRS 18',         icon: <Star size={13} />, isNew: true },
    { id: 'ifrs-report',    label: 'IFRS Report',     icon: <FileText size={13} /> },
  ];
return (
    <AppPage
      title="IFRS Dashboard"
      subtitle="International Financial Reporting Standards — Ethiopian context, AABE compliance &amp; key standards"
      icon={<BookOpen size={18} />}
      iconBg="bg-emerald-500"
      crumbs={[{ label: 'ovds' }, { label: 'IFRS' }]}
      actions={
        <Can permission="ovds:write">
          <Link to="/settings?tab=ifrs-standards" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all shadow-sm">
            <Zap size={13} /> Configure IFRS
          </Link>
        </Can>
      }
    >
    <div className="space-y-5 pb-12">

      {/* -- KPI Strip ----------------------------------------------------- */}
      <div className="ovds-grid-layout cols-4">
        {[
          { label: 'AABE Mandatory Since', value: '7 Jul 2023', sub: 'Tier 1 — Full IFRS', icon: <Award size={18} className="text-violet-500" />, bg: 'bg-violet-50 dark:bg-violet-950/20' },
          { label: 'Compliance Score', value: complianceScore > 0 ? `${complianceScore}%` : '—', sub: complianceScore >= 80 ? 'Audit-ready' : complianceScore >= 60 ? 'Minor gaps' : 'Needs review', icon: <ShieldCheck size={18} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Upcoming Deadlines', value: urgentCount.toString(), sub: `${timeline.filter(t => t.status === 'overdue').length} overdue`, icon: <Clock size={18} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Key Standards', value: STANDARDS.length.toString(), sub: 'Tier 1 + Tier 2 coverage', icon: <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{kpi.label}</p>
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-tight">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 truncate">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* -- Tabs ---------------------------------------------------------- */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-semibold rounded-full leading-none">{tab.badge}</span>
            )}
            {tab.isNew && (
              <span className="text-[7px] font-semibold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide leading-none">New</span>
            )}
          </button>
        ))}
      </div>

      {/* -- Tab Content --------------------------------------------------- */}

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="ovds-grid-layout cols-3">
          {/* Left: Tier summary + quick links */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tier overview cards */}
            <div className="ovds-grid-layout cols-3">
                {TIERS.map(t => (
                  <button
                    key={t.tier}
                    onClick={() => { setActiveTier(t.tier); setActiveTab('tier'); }}
                    className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${t.border} ${t.bg}`}
                  >
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${t.border} ${t.color} mb-2 inline-block`}>Tier {t.tier}</span>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{t.standard}</p>
                    <p className="text-[9px] text-slate-400 mt-1">Since {t.since}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      View details <ArrowRight size={9} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Live IFRS Engines */}
              <div className="ovds-widget-card p-5">
                <SectionHeader title="IFRS Engines — Live Ledger Balances" sub="Canonical IFRS projections (IFRS 15 / 16 / IAS 38)" icon={<Activity size={16} />} />
                <div className="ovds-grid-layout cols-3 gap-sm">
                  {[
                    {
                      label: 'IFRS 15 — Deferred Revenue',
                      value: liveDashboard ? `ETB ${liveDashboard.ifrs15.totalDeferredRevenue.toLocaleString()}` : '—',
                      sub: liveDashboard?.ifrs15.scheduleByPeriod.length ? `${liveDashboard.ifrs15.scheduleByPeriod.length} periods pending` : 'No pending revenue',
                      icon: <TrendingUp size={16} className="text-violet-500" />,
                      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30',
                    },
                    {
                      label: 'IFRS 16 — ROU Asset',
                      value: liveDashboard ? `ETB ${liveDashboard.ifrs16.totalRouAsset.toLocaleString()}` : '—',
                      sub: liveDashboard ? `${liveDashboard.ifrs16.activeLeases} active leases · Liability ETB ${liveDashboard.ifrs16.totalLeaseLiability.toLocaleString()}` : 'No leases',
                      icon: <Building2 size={16} className="text-emerald-500" />,
                      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
                    },
                    {
                      label: 'IAS 38 — Capitalized Software',
                      value: liveDashboard ? `ETB ${liveDashboard.ias38.totalCapitalizedSoftware.toLocaleString()}` : '—',
                      sub: liveDashboard ? `${liveDashboard.ias38.activeAssets} active assets` : 'No software assets',
                      icon: <FileText size={16} className="text-amber-500" />,
                      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
                    },
                  ].map(kpi => (
                    <div key={kpi.label} className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800 ${kpi.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
                          {kpi.icon}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
                      </div>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">{kpi.value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</p>
                    </div>
                  ))}
                </div>
                {liveDashboard?.generatedAt && (
                  <p className="text-[9px] text-slate-400 mt-3 text-right">
                    Last computed: {new Date(liveDashboard.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>

             {/* Financial Statements quick access */}
            <div className="ovds-widget-card p-5">
              <SectionHeader title="Financial Statements" sub="IAS 1 — complete set required for IFRS-compliant entities" icon={<FileText size={16} />} />
              <div className="ovds-grid-layout cols-3 gap-sm">
                {FINANCIAL_STATEMENTS.map(fs => (
                  <Link
                    key={fs.label}
                    to={fs.route}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:border-emerald-800 hover:shadow-sm transition-all bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0 ${fs.color}`}>
                      {fs.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors truncate">{fs.label}</p>
                      <p className="text-[9px] text-slate-400 truncate">{fs.standard}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* IFRS ↔ Ethiopian Tax mapping */}
            <div className="ovds-widget-card p-5">
              <SectionHeader title="IFRS ↔ Ethiopian Tax Standards" sub="How each IFRS standard maps to Ethiopian fiscal law" icon={<Globe size={16} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm ovds-table">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">IFRS Standard</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">Ethiopian Law</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Key Rate / Rule</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">IFRS Treatment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { std: 'IFRS 15', eth: 'VAT Proclamation 1341/2024', rate: '15% output VAT', treatment: 'Output VAT is a liability, not revenue', stdColor: 'bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30' },
                      { std: 'IAS 12',  eth: 'Income Tax Proc. 979/2016',  rate: '30% BIT flat rate', treatment: 'Current tax liability + deferred tax', stdColor: 'bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30' },
                      { std: 'IAS 19',  eth: 'Pension Proc. 714/2011',     rate: '7% + 11% pension (cap ETB 15,000)', treatment: 'Defined contribution — expense when due', stdColor: 'bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30' },
                      { std: 'IAS 37',  eth: 'DRRF Reg. 570/2025',         rate: '1%–5% + flat fees', treatment: 'Provision recognised when obligation arises', stdColor: 'bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30' },
                      { std: 'IFRS 9',  eth: 'NBE FIS/01/2012',            rate: 'ECL provisioning', treatment: 'Lifetime ECL for trade receivables', stdColor: 'bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30' },
                      { std: 'IFRS 18', eth: 'AABE IFRS Adoption (2027)',  rate: 'Effective 1 Jan 2027', treatment: 'Replaces IAS 1 — new P&L categories', stdColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
                    ].map((row, i) => (
                      <tr key={row.std} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${row.stdColor}`}>{row.std}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">{row.eth}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 hidden md:table-cell">{row.rate}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 hidden lg:table-cell">{row.treatment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Compliance timeline */}
          <div className="space-y-5">
            <div className="ovds-widget-card p-5">
              <SectionHeader title="Compliance Calendar" sub="Upcoming filing deadlines" icon={<Clock size={16} />} />
              <div className="space-y-1">
                {timeline.map(item => <ComplianceRow key={item.id} item={item} />)}
              </div>
              <Link to="/compliance/auditor" className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Full compliance dashboard <ArrowRight size={11} />
              </Link>
            </div>

            {/* Quick actions */}
            <div className="ovds-widget-card p-5">
              <SectionHeader title="Quick Actions" sub="Common IFRS tasks" icon={<Zap size={16} />} />
              <div className="space-y-1.5">
                {[
                  { label: 'Balance Sheet', to: '/reports?type=bs', icon: <BarChart3 size={14} /> },
                  { label: 'Profit & Loss', to: '/reports?type=pl', icon: <TrendingUp size={14} /> },
                  { label: 'Trial Balance', to: '/reports?type=trial-balance', icon: <Layers size={14} /> },
                  { label: 'Depreciation Schedule', to: '/accounting/fixed-assets?action=depreciate', icon: <TrendingDown size={14} /> },
                  { label: 'AR Aging (ECL)', to: '/reports?type=ar-aging&view=ecl', icon: <Activity size={14} /> },
                  { label: 'Period Close', to: '/accounting/period-close', icon: <CheckCircle size={14} /> },
                  { label: 'Audit Outsourcing', to: '/compliance/audit-outsourcing', icon: <ShieldCheck size={14} /> },
                  { label: 'IFRS Settings', to: '/settings?tab=ifrs-standards', icon: <Zap size={14} /> },
                ].map(a => (
                  <Link key={a.label} to={a.to} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-emerald-50/50 dark:bg-emerald-950/10 hover:text-emerald-600 dark:text-emerald-400 transition-all group">
                    <span className="text-slate-400 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">{a.icon}</span>
                    {a.label}
                    <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIER DETAIL */}
      {activeTab === 'tier' && (
        <div className="space-y-5">
          <div className="ovds-grid-layout cols-3">
            {TIERS.map(t => <TierCard key={t.tier} info={t} active={activeTier === t.tier} onClick={() => setActiveTier(t.tier)} />)}
          </div>

          {/* Active tier detail */}
          <div className={`rounded-2xl border-2 p-6 ${currentTierInfo.border} ${currentTierInfo.bg}`}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentTierInfo.border} ${currentTierInfo.color} mb-2 inline-block`}>
                  Tier {currentTierInfo.tier}
                </span>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{currentTierInfo.label}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{currentTierInfo.standard}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mandatory Since</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{currentTierInfo.since}</p>
              </div>
            </div>

            <div className="ovds-grid-layout cols-3">
              {/* Criteria */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Qualification Criteria</p>
                <p className="text-[11px] text-slate-500 mb-2">Meet 2 of {currentTierInfo.criteria.length} criteria:</p>
                <div className="space-y-1.5">
                  {currentTierInfo.criteria.map(c => (
                    <div key={c} className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business types */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Applicable Business Types</p>
                <div className="space-y-1.5">
                  {currentTierInfo.businessTypes.map(bt => (
                    <div key={bt} className="flex items-center gap-2">
                      <Building2 size={12} className="text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{bt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key standards */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Key Standards</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentTierInfo.keyStandards.map(s => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tier-specific notes */}
            {currentTierInfo.tier === '1' && (
              <div className="mt-4 p-3 bg-violet-100/50 dark:bg-violet-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <Info size={12} /> Banks, insurance companies, and government-owned enterprises are always Tier 1 regardless of size.
                </p>
              </div>
            )}
            {currentTierInfo.tier === '2' && (
              <div className="mt-4 p-3 bg-emerald-100/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Info size={12} /> Key difference from Full IFRS: cost model only for PP&E, borrowing costs expensed, goodwill amortized over max 10 years.
                </p>
              </div>
            )}
            {currentTierInfo.tier === '3' && (
              <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> No IFRS obligation, but VAT (15%), PIT, pension, and DRRF obligations still apply regardless of tier.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AABE THRESHOLDS */}
      {activeTab === 'thresholds' && (
        <div className="space-y-5">
          <div className="ovds-widget-card p-5">
            <SectionHeader title="AABE IFRS Threshold Quick Reference" sub="Accounting and Auditing Board of Ethiopia — Proclamation 847/2014 + Regulation 332/2014" icon={<Award size={16} />} />
            <div className="space-y-4">
              {AABE_THRESHOLDS.map(t => (
                <div key={t.tier} className={`p-5 rounded-2xl border-l-4 ${t.color}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.tier}</h3>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">Since {t.since}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t.criteria}</p>
                  {t.always && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <Info size={11} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">{t.always}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Business type → tier mapping */}
          <div className="ovds-widget-card p-5">
            <SectionHeader title="Business Type → IFRS Tier Mapping" sub="Default tier assignment by OVDS business type" icon={<Building2 size={16} />} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm ovds-table">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50">
                    {['Business Type', 'Code', 'Default Tier', 'Rationale'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'Large Enterprise', code: 'LARGE', tier: 'Tier 1', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300', rationale: 'Publicly accountable; always exceeds Threshold 1' },
                    { type: 'Government', code: 'GOV', tier: 'Tier 1', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300', rationale: 'Government-owned enterprises — mandatory Full IFRS' },
                    { type: 'Manufacturing', code: 'MFG', tier: 'Tier 1 or 2', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300', rationale: 'Depends on turnover/asset size; large manufacturers → Tier 1' },
                    { type: 'Medium Enterprise', code: 'MED', tier: 'Tier 1 or 2', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300', rationale: 'Straddles both thresholds; AABE criteria determine tier' },
                    { type: 'Small Business', code: 'SMB', tier: 'Tier 2', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300', rationale: 'Typically meets Threshold 2 but not Threshold 1' },
                    { type: 'Freelancer', code: 'FRLNC', tier: 'Tier 3', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', rationale: 'Below Threshold 2; outside IFRS scope' },
                  ].map((row, i) => (
                    <tr key={row.code} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{row.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.code}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.color}`}>{row.tier}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL STATEMENTS */}
      {activeTab === 'statements' && (
        <div className="space-y-5">
          <div className="ovds-widget-card p-5">
            <SectionHeader title="Complete Set of Financial Statements" sub="IAS 1 — required for all IFRS-compliant entities with prior-year comparatives" icon={<FileText size={16} />} />
            <div className="ovds-grid-layout cols-3">
              {FINANCIAL_STATEMENTS.map(fs => (
                <Link
                  key={fs.label}
                  to={fs.route}
                  className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all bg-slate-50/30 dark:bg-slate-800/20"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold mb-3 ${fs.color}`}>
                    {fs.icon}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors mb-0.5">{fs.label}</p>
                  <p className="text-[11px] text-slate-500 mb-1">{fs.sub}</p>
                  <p className="text-[10px] font-bold text-slate-400">{fs.standard}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open report <ArrowRight size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">IAS 1 Minimum Comparative Period</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">All financial statements must include prior-year figures. Pass <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-[11px]">startDate</code> / <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-[11px]">endDate</code> for prior period comparison in OVDS reports.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KEY STANDARDS */}
      {activeTab === 'standards' && (
        <div className="space-y-5">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={stdSearch}
                onChange={e => setStdSearch(e.target.value)}
                placeholder="Search standards (e.g. IFRS 15, IAS 2)…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20"
              />
              <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="flex gap-1.5">
              {(['all', '1', '2', '3'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStdFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    stdFilter === f
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-600 hover:text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {f === 'all' ? 'All' : `Tier ${f}`}
                </button>
              ))}
            </div>
          </div>

          {filteredStandards.length === 0 ? (
            <div className="ovds-empty">
              <BookOpen size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-400">No standards match your filter</p>
            </div>
          ) : (
            <div className="ovds-grid-layout cols-3">
              {filteredStandards.map(s => <StandardCard key={s.code} s={s} />)}
            </div>
          )}
        </div>
      )}

      {/* SUSTAINABILITY */}
      {activeTab === 'sustainability' && (
        <div className="space-y-5">
          {/* IFRS S1 */}
          <div className="ovds-widget-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">IFRS S1</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">New</span>
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Sustainability-related Financial Disclosures</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">General requirements for sustainability-related financial information</p>
              </div>
              <Link to="/compliance/auditor?view=sustainability" className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-all border border-emerald-200 dark:border-emerald-800">
                Open <ArrowRight size={11} />
              </Link>
            </div>
            <div className="ovds-grid-layout cols-4 gap-sm">
              {[
                { pillar: 'Governance', icon: <ShieldCheck size={18} />, desc: 'Board oversight of sustainability risks and opportunities', route: '/compliance/auditor?view=sustainability&pillar=governance', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
                { pillar: 'Strategy', icon: <TrendingUp size={18} />, desc: 'How sustainability affects business model and strategy', route: '/compliance/auditor?view=sustainability&pillar=strategy', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
                { pillar: 'Risk Management', icon: <AlertTriangle size={18} />, desc: 'Processes for identifying and managing sustainability risks', route: '/compliance/auditor?view=sustainability&pillar=risk', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
                { pillar: 'Metrics & Targets', icon: <BarChart3 size={18} />, desc: 'Quantitative measures and targets for sustainability performance', route: '/compliance/auditor?view=sustainability&pillar=metrics', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
              ].map(p => (
                <Link key={p.pillar} to={p.route} className="group p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:border-emerald-800 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${p.color}`}>{p.icon}</div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">{p.pillar}</p>
                  <p className="ovds-caption mt-0.5 leading-relaxed">{p.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* IFRS S2 */}
          <div className="ovds-widget-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">IFRS S2</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">New</span>
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Climate-related Disclosures</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Climate-related risks, opportunities, and GHG emissions reporting</p>
              </div>
              <Link to="/compliance/auditor?view=climate" className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-all border border-sky-200 dark:border-sky-800">
                Open <ArrowRight size={11} />
              </Link>
            </div>
            <div className="ovds-grid-layout cols-3">
              {[
                { label: 'Climate Risks', desc: 'Physical and transition risks from climate change', route: '/compliance/auditor?view=climate&tab=risks', icon: <AlertTriangle size={16} />, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
                { label: 'GHG Emissions', desc: 'Scope 1, 2, and 3 greenhouse gas emissions', route: '/compliance/auditor?view=climate&tab=emissions', icon: <Activity size={16} />, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30' },
                { label: 'Transition Plan', desc: 'Strategy for transitioning to a lower-carbon economy', route: '/compliance/auditor?view=climate&tab=transition', icon: <ArrowRight size={16} />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
              ].map(item => (
                <Link key={item.label} to={item.route} className="group flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:border-emerald-800 hover:shadow-sm transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>{item.icon}</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">{item.label}</p>
                    <p className="ovds-caption">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ESG */}
          <div className="ovds-widget-card p-5">
            <SectionHeader title="ESG Reporting" sub="Environmental, Social, and Governance — integrated with IFRS S1 & S2" icon={<Globe size={16} />} />
            <div className="ovds-grid-layout cols-3">
              {[
                { label: 'Environmental', code: 'E', desc: 'Climate, emissions, energy, water, waste', route: '/reports/insights?view=esg&tab=e', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
                { label: 'Social', code: 'S', desc: 'Labour practices, community, human rights', route: '/reports/insights?view=esg&tab=s', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
                { label: 'Governance', code: 'G', desc: 'Board structure, ethics, transparency, RBAC', route: '/reports/insights?view=esg&tab=g', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800' },
              ].map(esg => (
                <Link key={esg.code} to={esg.route} className={`group p-5 rounded-2xl border-2 ${esg.color} hover:shadow-md transition-all`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-semibold mb-3 bg-white dark:bg-slate-900 shadow-sm`}>{esg.code}</div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">{esg.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{esg.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View ESG data <ArrowRight size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="ovds-grid-layout cols-2">
          {/* Timeline */}
          <div className="ovds-widget-card p-5">
            <SectionHeader title="Filing Deadlines" sub="Upcoming ERCA, EDRRFO, and pension obligations" icon={<Clock size={16} />} />
            <div className="space-y-1">
              {timeline.map(item => <ComplianceRow key={item.id} item={item} />)}
            </div>
          </div>

          {/* Compliance tools */}
          <div className="space-y-4">
            {[
              { label: 'IFRS Compliance Auditor', sub: 'ERCA checklist + compliance score', route: '/compliance/auditor', icon: <ShieldCheck size={18} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
              { label: 'Audit Outsourcing', sub: 'Statutory audit, tax audit, compliance certificate', route: '/compliance/audit-outsourcing', icon: <Award size={18} />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
              { label: 'Period Close (IAS 10)', sub: 'Lock fiscal period — prevents backdated entries', route: '/accounting/period-close', icon: <CheckCircle size={18} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
              { label: 'Audit Logs', sub: 'Immutable activity trail — 7-year retention', route: '/settings/audit-logs', icon: <Activity size={18} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
            ].map(tool => (
              <Link key={tool.label} to={tool.route} className="group flex items-center gap-4 p-4 ovds-widget-card hover:border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tool.color}`}>{tool.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">{tool.label}</p>
                  <p className="text-[11px] text-slate-400">{tool.sub}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors shrink-0" />
              </Link>
            ))}

            {/* External links */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Regulatory Authorities</p>
              <div className="space-y-2">
                {[
                  { label: 'AABE — IFRS Authority', url: 'https://aabe.gov.et', sub: 'Accounting and Auditing Board of Ethiopia' },
                  { label: 'eTax Portal (ERCA)', url: 'https://etax.erca.gov.et', sub: 'File VAT, BIT, and withholding tax' },
                  { label: 'IASB — IFRS Standards', url: 'https://www.ifrs.org', sub: 'Official IFRS standard-setter' },
                ].map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors group">
                    <Globe size={13} className="text-slate-400 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors truncate">{link.label}</p>
                      <p className="text-[9px] text-slate-400 truncate">{link.sub}</p>
                    </div>
                    <ExternalLink size={10} className="text-slate-300 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IFRS 18 */}
      {activeTab === 'ifrs18' && (
        <div className="ovds-grid-layout cols-3">
          <div className="lg:col-span-2">
            <Ifrs18Tracker />
          </div>
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">IFRS 18</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">Effective 1 Jan 2027</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">What Changes?</h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {[
                  'Replaces IAS 1 — Presentation of Financial Statements',
                  'New P&L structure: Operating, Investing, Financing categories',
                  'Management Performance Measures (MPMs) must be disclosed',
                  'Subtotals policy must be documented',
                  'Prior-year comparatives must be restated',
                  'Aggregation/disaggregation principles tightened',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={11} className="text-purple-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ovds-widget-card p-5">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Ethiopian Context</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                AABE has indicated adoption of IFRS 18 effective <strong>1 January 2027</strong> for Tier 1 entities. Ethiopian businesses should begin readiness assessments now to avoid last-minute restatements.
              </p>
              <a href="https://aabe.gov.et" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                AABE guidance <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      )}


      {/* ── IFRS COMPLIANCE REPORT ──────────────────────────────────────────── */}
      {activeTab === 'ifrs-report' && <IFRSComplianceReport />}
      {/* ── END IFRS COMPLIANCE REPORT ──────────────────────────────────────── */}

    </div>
    </AppPage>
  );
};
export default IfsDashboard;
