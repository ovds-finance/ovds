import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuditLog } from '../hooks/useAuditLog';
import { useInterval } from '../hooks';
import { AppPage, Btn } from '../components/ui';
import {
  Activity, AlertTriangle, ArrowUp, BarChart3, Banknote,
  Building2, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, FileText, HeartHandshake, Landmark,
  Layers, LayoutGrid, Printer, RefreshCw, Shield,
  ShieldAlert, ShieldCheck, Star, TrendingUp, User,
  Users, Zap, Download,
} from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

// -- ovds-style section header --------------------------------------------
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ovds-section-label">{children}</div>
);

// -- Collapsible card (ovds accordion style) ------------------------------
interface AccordionCardProps {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
}
const AccordionCard: React.FC<AccordionCardProps> = ({
  icon, iconBg, title, subtitle, expanded, onToggle, children, accentColor = 'accent-blue',
}) => (
  <div className={`card-accent-left ${accentColor} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm block">{title}</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{subtitle}</span>
        </div>
      </div>
      <div className="text-slate-400 shrink-0">
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>
    </button>
    {expanded && (
      <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-5">
        {children}
      </div>
    )}
  </div>
);

// -- Live Credibility Dashboard ------------------------------------------------
const CredibilityDashboard: React.FC<{ refetchInterval?: number }> = ({ refetchInterval }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ovds/partnerships/credibility-dashboard');
      setData(res.data.data || res.data);
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return;
    const id = setInterval(load, refetchInterval);
    return () => clearInterval(id);
  }, [load, refetchInterval]);

  if (loading) return (
    <div className="kpi-strip-unified rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-6 py-5 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20 mb-3" />
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-28" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!data) return null;
  const s = data.summary || {};

  const kpis = [
    {
      label: 'Active Partnerships',
      value: s.activePartnerships ?? '—',
      sub: `of ${s.totalPartnerships ?? 0} total`,
      icon: <HeartHandshake size={15} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Credibility Score',
      value: `${s.avgCredibilityScore ?? '—'}/100`,
      sub: 'partnership health',
      icon: <Star size={15} />,
      iconBg: s.avgCredibilityScore >= 70 ? 'bg-emerald-50' : 'bg-amber-50',
      color: s.avgCredibilityScore >= 70 ? 'text-emerald-600' : 'text-amber-600',
    },
    {
      label: 'Credit Score',
      value: `${s.avgCreditScore ?? '—'}/100`,
      sub: 'bank loan scoring',
      icon: <Landmark size={15} />,
      iconBg: s.avgCreditScore >= 70 ? 'bg-emerald-50' : 'bg-amber-50',
      color: s.avgCreditScore >= 70 ? 'text-emerald-600' : 'text-amber-600',
    },
    {
      label: 'Total Investment',
      value: `ETB ${fmt(s.totalInvestmentAmount || 0)}`,
      sub: `${s.activeInvestments ?? 0} active`,
      icon: <TrendingUp size={15} />,
      iconBg: 'bg-violet-50 dark:bg-violet-950/30',
      color: 'text-violet-600 dark:text-violet-400',
    },
  ];

  // income vs outstanding split bar
  const paidPct = s.totalPartnerships > 0
    ? Math.round((s.activePartnerships / s.totalPartnerships) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Split bar */}
      <div className="split-bar">
        <div className="split-bar-income" style={{ width: `${paidPct}%` }} />
        <div className="split-bar-expense" />
      </div>

      {/* Header */}
      <div className="ovds-toolbar px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
            <Activity size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Live Credibility Dashboard</p>
            <p className="ovds-caption">Partnerships → Customers → Loans → Investments</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip-unified grid grid-cols-2 md:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`kpi-strip-cell px-5 py-4 ${i < kpis.length - 1 ? 'border-r border-slate-100 dark:border-slate-800' : ''}`}>
            <div className={`w-7 h-7 rounded-lg ${k.iconBg} flex items-center justify-center ${k.color} mb-2`}>
              {k.icon}
            </div>
            <p className={`text-lg font-bold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
            <p className="ovds-caption mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Loan pipeline */}
      {s.totalLoans > 0 && (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <SectionLabel>Bank Loan Pipeline</SectionLabel>
          <div className="ovds-grid-layout cols-3 mt-3">
            {[['Applied', s.totalLoanApplied], ['Approved', s.totalLoanApproved], ['Outstanding', s.totalLoanOutstanding]].map(([l, v]) => (
              <div key={l as string} className="text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">ETB {fmt(Number(v))}</p>
                <p className="ovds-caption mt-0.5">{l as string}</p>
              </div>
            ))}
          </div>
          {Object.keys(data.loansByStatus || {}).length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {Object.entries(data.loansByStatus).map(([status, count]) => (
                <span key={status} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {status}: {count as number}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top customers */}
      {(data.topCustomers || []).length > 0 && (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <SectionLabel>Top Customers by Engagement</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.topCustomers.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 rounded-md flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  {c.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.name}</p>
                  <p className="ovds-caption">{c.interactions} interactions · {c.partnerships} partnerships</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 flex-wrap">
        <Link to="/ovds/partnerships" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-600 transition-colors">
          <HeartHandshake size={12} /> Partnerships
        </Link>
        <Link to="/ovds/loans" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-700 transition-colors">
          <Landmark size={12} /> Business Loans
        </Link>
        <Link to="/ovds/investments" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-600 transition-colors">
          <TrendingUp size={12} /> Investments
        </Link>
      </div>
    </div>
  );
};

// -- Static data ---------------------------------------------------------------
const sections = [
  {
    id: 'partnerships',
    icon: <HeartHandshake size={18} className="text-emerald-600 dark:text-emerald-400" />,
    title: '1. Partnerships',
    points: [
      'Business partnerships (co-founders, suppliers, joint ventures) strengthen organizational capacity.',
      'Banks assess whether partnerships are formalized, legally registered, and well-structured — this reduces risk.',
      'A clear division of roles signals management efficiency, increasing loan approval likelihood.',
    ],
  },
  {
    id: 'customers',
    icon: <Users size={18} className="text-emerald-600" />,
    title: '2. Customers',
    points: [
      'A loyal customer base demonstrates market demand and revenue stability.',
      'Ethiopian banks review sales records, contracts, and retention rates to evaluate repayment capacity.',
      'Strong customer relationships attract investors who see proof of sustainable demand.',
    ],
  },
  {
    id: 'loans',
    icon: <Landmark size={18} className="text-violet-600" />,
    title: '3. Bank Loans & Investments',
    points: [
      'Commercial banks (CBE, Awash, Zemen) focus on financial records, business governance, and customer base strength.',
      'Investment decisions depend on partnership credibility and customer traction.',
      'The National Bank of Ethiopia emphasizes financial stability and careful risk management.',
    ],
  },
];

const challenges = [
  { label: 'Limited collateral', desc: 'Many SMEs struggle to provide property or assets required by banks.' },
  { label: 'Informal businesses', desc: 'Partnerships without legal registration face difficulties accessing loans.' },
  { label: 'Customer concentration risk', desc: 'Over-reliance on a few clients weakens credibility.' },
  { label: 'High interest rates & inflation', desc: 'These increase repayment burdens and make banks cautious.' },
];

const advice = [
  'Formalize partnerships with clear contracts and legal registration.',
  'Document customer relationships (sales agreements, invoices, retention data).',
  'Maintain transparent financial records to meet bank requirements.',
  'Diversify customer base to reduce risk and attract investors.',
  'Engage in open communication with banks to build long-term trust.',
];

const tableRows = [
  { factor: 'Partnerships', role: 'Formal agreements, clear management', impact: 'Builds trust with banks & investors', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-600 dark:text-emerald-300' },
  { factor: 'Customers', role: 'Proof of demand, loyalty, contracts', impact: 'Demonstrates repayment capacity', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-600 dark:text-emerald-300' },
  { factor: 'Bank Loans', role: 'Require strong governance & records', impact: 'Provide capital for growth', badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300' },
  { factor: 'Investments', role: 'Attracted by credibility & demand', impact: 'Fuel expansion beyond loans', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
];

const payrollRoles = [
  { key: 'payroll_admin', label: 'Payroll Admin', badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300', desc: 'Configure all settings, generate & approve salaries, and fetch all reports.' },
  { key: 'payroll_pcm', label: 'Payroll Change Manager', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-600 dark:text-emerald-300', desc: 'Responsible for bulk updating salary heads and configurations.' },
  { key: 'payroll_pda', label: 'Payroll Dealing Assistant', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-600 dark:text-emerald-300', desc: 'Responsible for the initial generation of salaries.' },
  { key: 'payroll_pvo', label: 'Payroll Verifying Officer', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300', desc: 'Reviews and verifies the generated salary details.' },
  { key: 'payroll_pfo', label: 'Payroll Finalizing Officer', badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300', desc: 'Finalizes verified salaries for the approval stage.' },
  { key: 'payroll_ar', label: 'Payroll Approving Officer', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300', desc: 'Gives final approval (AR Salary); after this, payslips are public.' },
];

const workflowSteps = [
  { step: 1, label: 'Generate', desc: 'PDA generates salary based on logs', color: 'bg-emerald-500' },
  { step: 2, label: 'Verify', desc: 'PVO reviews and verifies details', color: 'bg-amber-500' },
  { step: 3, label: 'Finalize', desc: 'PFO finalizes verified salaries', color: 'bg-orange-500' },
  { step: 4, label: 'Approve', desc: 'AR gives final approval for release', color: 'bg-emerald-500' },
];

const orgMechanisms = [
  {
    id: 'parent-subsidiary',
    icon: <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    title: 'Parent Company with Subsidiaries',
    desc: 'A parent company oversees several sub-companies, each focusing on a specific sector (agriculture, manufacturing, logistics).',
    advantages: ['Diversification reduces risk — banks see stability if one sector struggles.', 'Easier to attract different customer bases across industries.'],
    challenges: ['Requires strong governance and consolidated financial reporting.', 'Ethiopian banks demand audited group accounts to evaluate loan eligibility.'],
  },
  {
    id: 'partnership-group',
    icon: <HeartHandshake size={16} className="text-emerald-600" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    title: 'Partnership-Based Groups',
    desc: 'Partnerships can evolve into holding structures, where partners manage multiple ventures under one umbrella.',
    impact: ['Banks assess the strength of the partnership agreement and whether profits are reinvested.', 'Customers benefit from integrated services (e.g., a construction company with a materials subsidiary).'],
  },
  {
    id: 'cooperative-jv',
    icon: <LayoutGrid size={16} className="text-violet-600" />,
    iconBg: 'bg-violet-50 dark:bg-violet-950/30',
    title: 'Cooperative or Joint Ventures',
    desc: 'Common in Ethiopia, especially in agriculture (coffee, sesame, livestock). Farmers or small businesses pool resources under a cooperative.',
    impact: ['Customers gain access to standardized products.', 'Banks and development funds are more willing to lend to cooperatives than to fragmented individuals.'],
  },
];

const structureImpacts = [
  { type: 'Single Company', customer: 'Focused service, clear brand', loan: 'Easier to evaluate', investor: 'Limited diversification' },
  { type: 'Parent + Subsidiaries', customer: 'Multiple customer bases', loan: 'Requires consolidated accounts', investor: 'Attractive for diversification' },
  { type: 'Partnership Group', customer: 'Shared resources', loan: 'Depends on legal clarity', investor: 'Strong if governance is transparent' },
  { type: 'Cooperative', customer: 'Collective bargaining power', loan: 'Easier access to development loans', investor: 'Appeals to social impact investors' },
];

const ethiopianContext = [
  { title: 'Banks prefer collateralized loans', desc: 'A parent company with assets across subsidiaries can pledge more collateral.' },
  { title: 'Investors look for governance', desc: 'Multiple sub-companies must show clear reporting lines to avoid mismanagement.' },
  { title: 'Customers trust integrated services', desc: 'Conglomerates like MIDROC Ethiopia leverage their structure to serve diverse markets.' },
];

const reports = [
  { label: 'PFMS Report (Excel)', desc: 'Standard CSV/Excel format for Public Financial Management System uploads.' },
  { label: 'Treasury Report (JSON)', desc: 'Structured JSON data for direct integration with Treasury/IBEX systems.' },
  { label: 'Monthly Bank Advice', desc: 'Consolidated transfer list for CBE, Awash, or Zemen bank disbursements.' },
  { label: 'Salary Summary', desc: 'High-level dashboard of total gross, tax, pension, and net pay.' },
  { label: 'Earning-Deduction Report', desc: 'Detailed table showing every pay head for every employee.' },
  { label: 'Overtime Report', desc: 'Specific breakdown of OT hours and payments per department.' },
];

// -- ESG Section ---------------------------------------------------------------
export const ESGSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'e' | 's' | 'g'>('e');

  const tabs: { key: 'e' | 's' | 'g'; label: string; icon: string; color: string }[] = [
    { key: 'e', label: 'Environmental', icon: '🌿', color: 'emerald' },
    { key: 's', label: 'Social', icon: '🤝', color: 'blue' },
    { key: 'g', label: 'Governance', icon: '🏛️', color: 'violet' },
  ];

  const content: Record<'e' | 's' | 'g', { title: string; items: { label: string; desc: string; ifrs?: string }[] }> = {
    e: {
      title: 'Environmental Disclosures (IFRS S2)',
      items: [
        { label: 'GHG Emissions (Scope 1 & 2)', desc: 'Direct emissions from owned operations and purchased energy. Mandatory under IFRS S2 for Tier 1 entities.', ifrs: 'IFRS S2.29' },
        { label: 'Climate-Related Risks', desc: 'Physical risks (floods, drought) and transition risks (carbon pricing, regulation changes) affecting Ethiopian operations.', ifrs: 'IFRS S2.10' },
        { label: 'Energy Consumption', desc: 'Track electricity, fuel, and renewable energy usage. Ethio Telecom and CBE are key partners for green ovds.', ifrs: 'IFRS S2.29(a)' },
        { label: 'Water Usage', desc: 'Critical for manufacturing and agro-processing SMEs in Ethiopia. Report water withdrawal and consumption.', ifrs: 'IFRS S2.29(b)' },
        { label: 'Waste Management', desc: 'Solid waste, hazardous materials, and recycling rates. Relevant for manufacturing and food processing sectors.', ifrs: 'IFRS S2.29(c)' },
      ],
    },
    s: {
      title: 'Social Disclosures (IFRS S1)',
      items: [
        { label: 'Workforce Diversity', desc: 'Gender ratio, age distribution, and regional representation across departments. Tracked via HR → Employees.', ifrs: 'IFRS S1.33' },
        { label: 'Employee Health & Safety', desc: 'Incident rates, safety training hours, and compliance with Ethiopian Labour Proclamation 1156/2019.', ifrs: 'IFRS S1.33(b)' },
        { label: 'Community Investment', desc: 'DRRF contributions, local hiring rates, and SME supplier engagement. Demonstrates social license to operate.', ifrs: 'IFRS S1.33(c)' },
        { label: 'Customer Welfare', desc: 'KYC compliance, data privacy, and fair pricing practices. Relevant for financial services and retail sectors.', ifrs: 'IFRS S1.33(d)' },
        { label: 'Supply Chain Ethics', desc: 'Vendor KYC status, anti-corruption policies, and fair trade practices with Ethiopian suppliers.', ifrs: 'IFRS S1.33(e)' },
      ],
    },
    g: {
      title: 'Governance Disclosures (IFRS S1 — Four Pillars)',
      items: [
        { label: 'Board Oversight', desc: 'How the board monitors sustainability risks and opportunities. Required for Tier 1 IFRS entities under IFRS S1.', ifrs: 'IFRS S1.6' },
        { label: 'Management Accountability', desc: 'Roles and responsibilities for sustainability reporting. Link to OVDS RBAC roles (ovds, ADMIN, AUDITOR).', ifrs: 'IFRS S1.6(b)' },
        { label: 'Risk Management Integration', desc: 'How sustainability risks are identified, assessed, and managed alongside financial risks.', ifrs: 'IFRS S1.25' },
        { label: 'Metrics & Targets', desc: 'Quantitative targets for emissions, diversity, and governance KPIs. Tracked and reported annually.', ifrs: 'IFRS S1.33' },
        { label: 'Anti-Corruption & Ethics', desc: 'Compliance with Ethiopian Anti-Corruption Commission requirements and ERCA transparency standards.', ifrs: 'IFRS S1.33(f)' },
      ],
    },
  };

  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-600 dark:text-emerald-300' },
    blue: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-600 dark:text-emerald-300' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  };

  const active = tabs.find((t) => t.key === activeTab)!;
  const c = colorMap[active.color];
  const section = content[activeTab];

  return (
    <div id="esg-section" className="card-accent-left accent-emerald bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="ovds-toolbar px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <span className="text-base">🌍</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">ESG Reporting</h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">IFRS S1 & S2 — Sustainability Disclosures</p>
          </div>
        </div>
        <span className="ml-auto text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          IFRS S1 · IFRS S2 · 2024
        </span>
      </div>

      <div className="px-5 pt-4 pb-2">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          IFRS S1 and S2 require entities to disclose material sustainability-related risks and opportunities. Ethiopian Tier 1 entities (turnover &gt; ETB 300M or assets &gt; ETB 200M) must comply from <strong>July 2024</strong>.
        </p>
      </div>

      {/* Status tabs (ovds underline style) */}
      <div className="px-5 pb-3 flex gap-1 border-b border-slate-100 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`status-tab gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`mx-5 my-4 rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
        <div className={`px-5 py-3 border-b ${c.border}`}>
          <h3 className={`font-semibold text-sm ${c.text}`}>{section.title}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-3.5">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${c.badge}`}>
                <span className="text-[10px] font-semibold">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                  {item.ifrs && (
                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${c.badge}`}>{item.ifrs}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Four Pillars */}
      <div className="px-5 pb-5">
        <SectionLabel>IFRS S1 — Four Pillars Framework</SectionLabel>
        <div className="ovds-grid-layout cols-4 mt-3">
          {[
            { pillar: 'Governance', icon: '🏛️', desc: 'Board oversight of sustainability risks', color: 'violet' },
            { pillar: 'Strategy', icon: '🎯', desc: 'How risks affect business model & plans', color: 'blue' },
            { pillar: 'Risk Mgmt', icon: '🛡️', desc: 'Processes to identify & manage risks', color: 'emerald' },
            { pillar: 'Metrics', icon: '📊', desc: 'Quantitative targets & performance data', color: 'emerald' },
          ].map(({ pillar, icon, desc, color }) => {
            const pc = colorMap[color] ?? colorMap.blue;
            return (
              <div key={pillar} className={`rounded-xl p-3 border ${pc.border} ${pc.bg}`}>
                <div className="text-xl mb-1.5">{icon}</div>
                <p className={`text-xs font-semibold ${pc.text}`}>{pillar}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const BusinessInsights: React.FC = () => {
  usePageTitle('Business Insights');
  const { log } = useAuditLog();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    overview: true,
    payroll: false,
    org: false,
    reports: false,
    esg: false,
  });

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handlePrint = () => {
    log('business_insights_print' as any, {});
    window.print();
  };

  const handleExport = () => {
    log('business_insights_export' as any, {});
    const blob = new Blob([JSON.stringify({ sections, challenges, advice, tableRows }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business-insights.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-refresh credibility dashboard every 5 minutes (wired via refetchInterval prop)

  return (
    <AppPage
      title="Business Insights"
      subtitle="Partnerships · Customers · Loans · Investments · ESG · Payroll Analytics · Business Intelligence & Analytics · Market Segmentation · Investment Trends · Revenue · Growth · Strategic Insights · Market Share · Competitive Landscape"
      icon={<BarChart3 size={18} />}
      iconBg="bg-emerald-500"
      crumbs={[{ label: 'Business Insights' }]}
      actions={
        <>
          <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExport}>Export</Btn>
          <Btn variant="ghost" size="sm" icon={<Printer size={13} />} onClick={handlePrint}>Print</Btn>
        </>
      }
    >
    <div className="space-y-6">

      {/* Live Credibility Dashboard */}
      <CredibilityDashboard refetchInterval={300_000} />

      {/* Overview accordion */}
      <AccordionCard
        id="overview"
        icon={<Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        title="Business Credibility Overview"
        subtitle="Partnerships · Customers · Loans"
        expanded={expanded.overview}
        onToggle={() => toggle('overview')}
        accentColor="accent-blue"
      >
        {/* Key factors */}
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-xl">
              <div className="shrink-0 mt-0.5">{s.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{s.title}</p>
                <ul className="space-y-1">
                  {s.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Summary table */}
        <div>
          <SectionLabel>Factor Summary</SectionLabel>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Factor</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Role</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tableRows.map((row) => (
                  <tr key={row.factor} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.badge}`}>{row.factor}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{row.role}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Challenges */}
        <div>
          <SectionLabel>Common Challenges</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {challenges.map((c) => (
              <div key={c.label} className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{c.label}</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advice */}
        <div>
          <SectionLabel>Recommended Actions</SectionLabel>
          <ul className="mt-3 space-y-2">
            {advice.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-600 dark:text-emerald-300">
                  {i + 1}
                </div>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </AccordionCard>

      {/* Org Structure accordion */}
      <AccordionCard
        id="org"
        icon={<Layers size={16} className="text-violet-600 dark:text-violet-400" />}
        iconBg="bg-violet-50 dark:bg-violet-950/30"
        title="Organizational Structures"
        subtitle="Parent · Subsidiaries · Cooperatives"
        expanded={expanded.org}
        onToggle={() => toggle('org')}
        accentColor="accent-violet"
      >
        <div className="space-y-4">
          {orgMechanisms.map((m) => (
            <div key={m.id} className="p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center`}>{m.icon}</div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.title}</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{m.desc}</p>
              {m.advantages && (
                <div className="space-y-1">
                  {m.advantages.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck size={11} className="shrink-0 mt-0.5" /> {a}
                    </div>
                  ))}
                </div>
              )}
              {m.challenges && (
                <div className="space-y-1 mt-1">
                  {m.challenges.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                      <ShieldAlert size={11} className="shrink-0 mt-0.5" /> {c}
                    </div>
                  ))}
                </div>
              )}
              {m.impact && (
                <div className="space-y-1 mt-1">
                  {m.impact.map((imp, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <Zap size={11} className="shrink-0 mt-0.5" /> {imp}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Structure impact table */}
        <div>
          <SectionLabel>Structure Impact Comparison</SectionLabel>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Customer</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Loan</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">Investor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {structureImpacts.map((row) => (
                  <tr key={row.type} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{row.type}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.customer}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.loan}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.investor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ethiopian context */}
        <div>
          <SectionLabel>Ethiopian Context</SectionLabel>
          <div className="ovds-grid-layout cols-3 mt-3">
            {ethiopianContext.map((ctx) => (
              <div key={ctx.title} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-600 dark:text-emerald-300 mb-1">{ctx.title}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{ctx.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AccordionCard>

      {/* Payroll accordion */}
      <AccordionCard
        id="payroll"
        icon={<Banknote size={16} className="text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        title="Payroll Workflow & Roles"
        subtitle="RBAC · Approval Pipeline"
        expanded={expanded.payroll}
        onToggle={() => toggle('payroll')}
        accentColor="accent-emerald"
      >
        {/* Workflow steps */}
        <div>
          <SectionLabel>Approval Pipeline</SectionLabel>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {workflowSteps.map((ws, i) => (
              <React.Fragment key={ws.step}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full ${ws.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {ws.step}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{ws.label}</p>
                  <p className="text-[9px] text-slate-400 text-center max-w-[80px]">{ws.desc}</p>
                </div>
                {i < workflowSteps.length - 1 && (
                  <ArrowUp size={14} className="text-slate-300 rotate-90 shrink-0 mb-6" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div>
          <SectionLabel>Payroll Roles</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {payrollRoles.map((r) => (
              <div key={r.key} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <User size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${r.badge} mb-1`}>
                    {r.label}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AccordionCard>

      {/* Reports accordion */}
      <AccordionCard
        id="reports"
        icon={<FileText size={16} className="text-amber-600 dark:text-amber-400" />}
        iconBg="bg-amber-50 dark:bg-amber-950/30"
        title="Available Reports"
        subtitle="PFMS · Treasury · Payroll"
        expanded={expanded.reports}
        onToggle={() => toggle('reports')}
        accentColor="accent-amber"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {reports.map((r) => (
            <div key={r.label} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
              <FileText size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{r.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap pt-1">
          <Link to="/reports" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[11px] font-semibold hover:bg-amber-700 transition-colors">
            <ExternalLink size={12} /> View All Reports
          </Link>
          <Link to="/hr/payroll" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-700 transition-colors">
            <Banknote size={12} /> Payroll
          </Link>
        </div>
      </AccordionCard>

      {/* ESG accordion */}
      <AccordionCard
        id="esg"
        icon={<Shield size={16} className="text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        title="ESG & Sustainability"
        subtitle="IFRS S1 · IFRS S2"
        expanded={expanded.esg}
        onToggle={() => toggle('esg')}
        accentColor="accent-emerald"
      >
        <ESGSection />
      </AccordionCard>
    </div>
    </AppPage>
  );
};

export default BusinessInsights;


