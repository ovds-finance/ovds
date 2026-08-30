/**
 * IFRS Disclosure Checklist
 * IAS 1.112–138 — Minimum disclosure requirements for Ethiopian businesses
 * Covers all mandatory notes and supplementary disclosures
 * Enhanced with IASB 2024–2027 update banner and role-based access gating.
 */
import React, { useState } from 'react';
import {
  CheckSquare, Square, ChevronDown, ChevronUp,
  BookOpen, Scale, TrendingUp, Banknote, Package,
  Users, Printer, Info, Lock, Sparkles, Globe,
} from 'lucide-react';
import { useBusiness } from '../../context/businessContext';
import IASBUpdateBanner from '../iasbUpdateBanner';
import { useIFRSAccess } from '../../hooks/useIfrsAccess';

interface DisclosureItem {
  id: string;
  standard: string;
  title: string;
  required: boolean;
  applicableTo: string[];
  description: string;
  checked: boolean;
}

interface DisclosureGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  items: DisclosureItem[];
}

const buildGroups = (businessType: string): DisclosureGroup[] => {
  const isLarge = ['LARGE_ENTERPRISE', 'MANUFACTURING'].includes(businessType);
  const isMediumPlus = ['LARGE_ENTERPRISE', 'MANUFACTURING', 'MEDIUM_ENTERPRISE'].includes(businessType);

  return [
    {
      id: 'basis',
      title: 'Basis of Preparation',
      icon: <BookOpen size={14} />,
      color: 'text-emerald-700 dark:text-emerald-600 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      items: [
        { id: 'b1', standard: 'IAS 1.16',   title: 'Statement of IFRS compliance',           required: true,  applicableTo: ['all'], description: 'Explicit statement that FS comply with IFRS as issued by IASB', checked: false },
        { id: 'b2', standard: 'IAS 1.25',   title: 'Going concern assessment',               required: true,  applicableTo: ['all'], description: 'Management assessment of ability to continue for 12+ months', checked: false },
        { id: 'b3', standard: 'IAS 1.117',  title: 'Measurement basis (historical cost)',    required: true,  applicableTo: ['all'], description: 'Basis of measurement used in preparing the FS', checked: false },
        { id: 'b4', standard: 'IAS 21.17',  title: 'Functional currency (ETB)',              required: true,  applicableTo: ['all'], description: 'Ethiopian Birr as functional and presentation currency', checked: false },
        { id: 'b5', standard: 'IAS 8.28',   title: 'Changes in accounting policies',         required: false, applicableTo: ['all'], description: 'Nature and reason for any policy changes; retrospective application', checked: false },
        { id: 'b6', standard: 'IAS 10.17',  title: 'Events after reporting date',            required: true,  applicableTo: ['all'], description: 'Adjusting and non-adjusting events after the reporting date', checked: false },
      ],
    },
    {
      id: 'revenue',
      title: 'Revenue & Tax (IFRS 15 / IAS 12)',
      icon: <TrendingUp size={14} />,
      color: 'text-emerald-700 dark:text-emerald-600 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      items: [
        { id: 'r1', standard: 'IFRS 15.114', title: 'Disaggregation of revenue by type',     required: true,  applicableTo: ['all'], description: 'Revenue split by goods, services, exports, zero-rated, exempt', checked: false },
        { id: 'r2', standard: 'IFRS 15.116', title: 'Contract assets and liabilities',       required: true,  applicableTo: ['all'], description: 'Opening/closing balances of contract assets and deferred revenue', checked: false },
        { id: 'r3', standard: 'IAS 12.79',   title: 'Income tax expense reconciliation',     required: true,  applicableTo: ['all'], description: 'Reconciliation of tax expense to accounting profit × 30% BIT rate', checked: false },
        { id: 'r4', standard: 'IAS 12.81',   title: 'Deferred tax assets and liabilities',  required: true,  applicableTo: ['all'], description: 'Nature and amount of temporary differences; recognition criteria', checked: false },
        { id: 'r5', standard: 'VAT 1341/24', title: 'VAT compliance disclosure',             required: true,  applicableTo: ['all'], description: 'VAT registration status, rate (15%), monthly filing compliance', checked: false },
        { id: 'r6', standard: 'DRRF 570/25', title: 'DRRF levy disclosure',                  required: true,  applicableTo: ['all'], description: 'DRRF categories applicable, amounts recognised as provisions', checked: false },
      ],
    },
    {
      id: 'assets',
      title: 'Assets (IAS 2 / IAS 16 / IFRS 16)',
      icon: <Package size={14} />,
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      items: [
        { id: 'a1', standard: 'IAS 2.36',   title: 'Inventory accounting policy (FIFO/WA)',  required: true,  applicableTo: ['all'], description: 'Cost formula used; carrying amount; write-downs to NRV', checked: false },
        { id: 'a2', standard: 'IAS 16.73',  title: 'PPE movement schedule',                  required: true,  applicableTo: ['all'], description: 'Gross carrying amount, accumulated depreciation, additions, disposals', checked: false },
        { id: 'a3', standard: 'IAS 16.75',  title: 'Depreciation methods and useful lives',  required: true,  applicableTo: ['all'], description: 'Method (straight-line), rates, and residual values per asset class', checked: false },
        { id: 'a4', standard: 'IFRS 16.47', title: 'Right-of-use assets and lease liabilities', required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING'], description: 'ROU asset carrying amount; lease liability maturity analysis', checked: false },
        { id: 'a5', standard: 'IAS 36.130', title: 'Impairment losses recognised',           required: false, applicableTo: ['all'], description: 'Events leading to impairment; recoverable amount determination', checked: false },
        { id: 'a6', standard: 'IAS 38.118', title: 'Intangible assets disclosure',           required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING'], description: 'Useful lives; amortisation method; carrying amounts', checked: false },
      ],
    },
    {
      id: 'liabilities',
      title: 'Liabilities & Provisions (IAS 37 / IAS 19)',
      icon: <Scale size={14} />,
      color: 'text-rose-700 dark:text-rose-300',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800',
      items: [
        { id: 'l1', standard: 'IAS 37.84',  title: 'Provisions movement table',              required: true,  applicableTo: ['all'], description: 'Opening balance, additions, utilised, released, closing balance', checked: false },
        { id: 'l2', standard: 'IAS 37.86',  title: 'Contingent liabilities',                 required: true,  applicableTo: ['all'], description: 'Nature of obligation; estimate of financial effect; uncertainties', checked: false },
        { id: 'l3', standard: 'IAS 19.135', title: 'Employee benefit obligations',           required: true,  applicableTo: ['all'], description: 'Pension contributions (7%/11%); accrued leave; short-term benefits', checked: false },
        { id: 'l4', standard: 'IAS 23.26',  title: 'Borrowing costs capitalised',            required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING'], description: 'Amount capitalised; capitalisation rate used', checked: false },
        { id: 'l5', standard: 'IAS 12.81e', title: 'Unrecognised deferred tax assets',       required: false, applicableTo: ['all'], description: 'Unused tax losses; expiry dates; reasons for non-recognition', checked: false },
      ],
    },
    {
      id: 'financial_instruments',
      title: 'Financial Instruments (IFRS 9 / IFRS 7)',
      icon: <Banknote size={14} />,
      color: 'text-violet-700 dark:text-violet-300',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200 dark:border-violet-800',
      items: [
        { id: 'fi1', standard: 'IFRS 7.6',  title: 'Classification of financial instruments', required: true,  applicableTo: ['all'], description: 'Amortised cost / FVOCI / FVTPL categories with carrying amounts', checked: false },
        { id: 'fi2', standard: 'IFRS 7.36', title: 'Credit risk — AR aging analysis',         required: true,  applicableTo: ['all'], description: 'Maximum exposure; aging buckets; ECL provision matrix', checked: false },
        { id: 'fi3', standard: 'IFRS 9.35M','title': 'ECL impairment — provision matrix',     required: true,  applicableTo: ['all'], description: 'Lifetime ECL for trade receivables; simplified approach', checked: false },
        { id: 'fi4', standard: 'IAS 21.52', title: 'Foreign currency balances',               required: false, applicableTo: ['all'], description: 'Monetary items in foreign currencies; exchange differences in P&L', checked: false },
        { id: 'fi5', standard: 'IFRS 7.31', title: 'Liquidity risk maturity analysis',        required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING'], description: 'Contractual maturity of financial liabilities', checked: false },
      ],
    },
    {
      id: 'equity',
      title: 'Equity & Related Parties (IAS 24 / IFRS 8)',
      icon: <Users size={14} />,
      color: 'text-teal-700 dark:text-teal-300',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      border: 'border-teal-200 dark:border-teal-800',
      items: [
        { id: 'e1', standard: 'IAS 1.79',   title: 'Share capital and reserves',             required: true,  applicableTo: ['all'], description: 'Number of shares; rights; restrictions on dividends', checked: false },
        { id: 'e2', standard: 'IAS 24.17',  title: 'Key management personnel compensation',  required: true,  applicableTo: ['all'], description: 'Short-term benefits; post-employment; share-based payments', checked: false },
        { id: 'e3', standard: 'IAS 24.18',  title: 'Related party transactions',             required: true,  applicableTo: ['all'], description: 'Nature of relationship; amounts; outstanding balances; terms', checked: false },
        { id: 'e4', standard: 'IFRS 8.22',  title: 'Segment reporting',                      required: isLarge, applicableTo: ['LARGE_ENTERPRISE'], description: 'Operating segments; revenue; profit; assets per segment', checked: false },
        { id: 'e5', standard: 'IFRS 3.59',  title: 'Business combinations',                  required: isLarge, applicableTo: ['LARGE_ENTERPRISE'], description: 'Acquisition date; consideration; goodwill; fair values', checked: false },
      ],
    },
    // -- IFRS 18 Readiness (effective 1 Jan 2027 — prepare now) --------------
    {
      id: 'ifrs18_readiness',
      title: 'IFRS 18 Readiness (Effective 1 Jan 2027)',
      icon: <Sparkles size={14} />,
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      items: [
        { id: 'i18a', standard: 'IFRS 18.B1',  title: 'Income statement category mapping',       required: true,  applicableTo: ['all'], description: 'Map all P&L line items to Operating / Investing / Financing categories', checked: false },
        { id: 'i18b', standard: 'IFRS 18.21',  title: 'Identify Management Performance Measures', required: true,  applicableTo: ['all'], description: 'List all MPMs (e.g. EBITDA, adjusted profit) used in external communications', checked: false },
        { id: 'i18c', standard: 'IFRS 18.22',  title: 'MPM reconciliation to IFRS line items',   required: true,  applicableTo: ['all'], description: 'Prepare note reconciling each MPM to the nearest IFRS subtotal', checked: false },
        { id: 'i18d', standard: 'IFRS 18.45',  title: 'Subtotals policy documented',             required: true,  applicableTo: ['all'], description: 'Document which subtotals will be presented and why they are useful', checked: false },
        { id: 'i18e', standard: 'IFRS 18.B12', title: 'Comparative period restatement plan',     required: isMediumPlus, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING','MEDIUM_ENTERPRISE'], description: 'Plan for restating prior year comparatives under IFRS 18 structure', checked: false },
        { id: 'i18f', standard: 'IFRS 18.B20', title: 'Aggregation / disaggregation review',     required: false, applicableTo: ['all'], description: 'Review whether current line items meet IFRS 18 aggregation principles', checked: false },
      ],
    },
    // -- IAS 1 Amendment — Liability Classification (effective 1 Jan 2024) ---
    {
      id: 'ias1_liab_amend',
      title: 'IAS 1 Amendment — Liability Classification (2024)',
      icon: <Scale size={14} />,
      color: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      items: [
        { id: 'la1', standard: 'IAS 1.69',  title: 'Rights-based classification applied',       required: true,  applicableTo: ['all'], description: 'Confirm all liabilities classified based on rights at reporting date, not expectations', checked: false },
        { id: 'la2', standard: 'IAS 1.72A', title: 'Post-reporting-date covenant disclosure',   required: true,  applicableTo: ['all'], description: 'Disclose non-current liabilities subject to covenants tested after reporting date', checked: false },
        { id: 'la3', standard: 'IAS 1.76',  title: 'Loan reclassification review',              required: isMediumPlus, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING','MEDIUM_ENTERPRISE'], description: 'Review all loan agreements for covenant timing; reclassify if required', checked: false },
      ],
    },
    // -- IFRS S1 & S2 — Sustainability Reporting (effective 1 Jan 2024) -------
    {
      id: 'sustainability',
      title: 'IFRS S1 & S2 — Sustainability Disclosures (2024)',
      icon: <Globe size={14} />,
      color: 'text-teal-700 dark:text-teal-300',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      border: 'border-teal-200 dark:border-teal-800',
      items: [
        { id: 's1a', standard: 'IFRS S1.6',   title: 'Governance — Board sustainability oversight',  required: isLarge, applicableTo: ['LARGE_ENTERPRISE','GOVERNMENT'], description: 'Disclose board and management oversight of sustainability-related risks and opportunities', checked: false },
        { id: 's1b', standard: 'IFRS S1.13',  title: 'Strategy — Sustainability risks to business model', required: isLarge, applicableTo: ['LARGE_ENTERPRISE','GOVERNMENT'], description: 'Describe sustainability risks and opportunities that could affect business model, strategy, and cash flows', checked: false },
        { id: 's1c', standard: 'IFRS S1.25',  title: 'Risk Management — Identification processes',  required: isLarge, applicableTo: ['LARGE_ENTERPRISE','GOVERNMENT'], description: 'Describe processes for identifying, assessing, and managing sustainability-related risks', checked: false },
        { id: 's1d', standard: 'IFRS S1.29',  title: 'Metrics & Targets — Quantitative KPIs',       required: isLarge, applicableTo: ['LARGE_ENTERPRISE','GOVERNMENT'], description: 'Disclose metrics used to monitor sustainability performance and progress against targets', checked: false },
        { id: 's2a', standard: 'IFRS S2.10',  title: 'Climate — Physical risk assessment',          required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING','GOVERNMENT'], description: 'Assess physical climate risks: drought, flooding, temperature impacts on Ethiopian operations (agriculture, agro-processing)', checked: false },
        { id: 's2b', standard: 'IFRS S2.12',  title: 'Climate — Transition risk assessment',        required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING','GOVERNMENT'], description: 'Assess transition risks: carbon pricing, regulatory changes, technology shifts affecting Ethiopian energy and manufacturing sectors', checked: false },
        { id: 's2c', standard: 'IFRS S2.29',  title: 'GHG Emissions — Scope 1 & 2 disclosure',     required: isLarge, applicableTo: ['LARGE_ENTERPRISE','MANUFACTURING'], description: 'Disclose Scope 1 (direct) and Scope 2 (indirect energy) greenhouse gas emissions in CO₂ equivalent', checked: false },
        { id: 's2d', standard: 'IFRS S2.30',  title: 'GHG Emissions — Scope 3 (value chain)',      required: false,   applicableTo: ['LARGE_ENTERPRISE'], description: 'Disclose Scope 3 emissions from supply chain, customer use, and end-of-life — encouraged for large Ethiopian manufacturers', checked: false },
        { id: 's2e', standard: 'IFRS S2.22',  title: 'Climate scenario analysis',                   required: isLarge, applicableTo: ['LARGE_ENTERPRISE','GOVERNMENT'], description: 'Conduct climate scenario analysis (1.5°C, 2°C, 4°C) to assess resilience of business strategy', checked: false },
      ],
    },
  ];
};

const IFRSDisclosureChecklist: React.FC = () => {
  const { companies, selectedCompanyId } = useBusiness();
  const company = companies.find(c => c.id === selectedCompanyId);
  const businessType = (company as any)?.type ?? 'MEDIUM_ENTERPRISE';
  const { canView, canCompute, roleLabel, blockedHint } = useIFRSAccess();

  const [groups, setGroups] = useState<DisclosureGroup[]>(() => buildGroups(businessType));
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['basis', 'revenue']));
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);

  // Read-only mode for roles that can view but not interact (AUDITOR, HR, ADMIN)
  const readOnly = !canCompute;

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleItem = (groupId: string, itemId: string) => {
    setGroups(prev => prev.map(g =>
      g.id !== groupId ? g : {
        ...g,
        items: g.items.map(i => i.id !== itemId ? i : { ...i, checked: !i.checked }),
      }
    ));
  };

  const checkAll = (groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id !== groupId ? g : { ...g, items: g.items.map(i => ({ ...i, checked: true })) }
    ));
  };

  const allItems   = groups.flatMap(g => g.items);
  const required   = allItems.filter(i => i.required);
  const reqChecked = required.filter(i => i.checked);
  const pct        = required.length ? Math.round((reqChecked.length / required.length) * 100) : 0;
  const grade      = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';

  const gradeColor = { A: 'text-emerald-600', B: 'text-emerald-600', C: 'text-amber-600', D: 'text-orange-600', F: 'text-rose-600' }[grade];
  const gradeBg    = { A: 'bg-emerald-50 dark:bg-emerald-950/30', B: 'bg-emerald-50 dark:bg-emerald-950/30', C: 'bg-amber-50 dark:bg-amber-950/30', D: 'bg-orange-50 dark:bg-orange-950/30', F: 'bg-rose-50 dark:bg-rose-950/30' }[grade];

  const printChecklist = () => {
    const rows = groups.flatMap(g => g.items.map(i =>
      `<tr><td>${i.standard}</td><td>${i.title}</td><td>${i.required ? 'Required' : 'Optional'}</td><td style="color:${i.checked ? '#00C96E' : '#dc2626'}">${i.checked ? '✓ Done' : '✗ Pending'}</td></tr>`
    )).join('');
    const html = `<!DOCTYPE html><html><head><title>IFRS Disclosure Checklist</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;font-size:11px}h1{font-size:14px;font-weight:900;margin-bottom:4px}
    p{font-size:10px;color:#64748b;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:6px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
    td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}</style></head>
    <body><h1>IFRS Disclosure Checklist — IAS 1.112–138</h1>
    <p>Generated: ${new Date().toLocaleString()} | Compliance: ${pct}% (Grade ${grade}) | ${reqChecked.length}/${required.length} required items complete</p>
    <table><thead><tr><th>Standard</th><th>Disclosure</th><th>Type</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const w    = window.open(url, '_blank');
    if (w) w.addEventListener('load', () => { w.print(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  };

  const exportCSV = () => {
    const header = 'Group,Standard,Title,Required,Status\n';
    const rows = groups.flatMap(g =>
      g.items.map(i =>
        `"${g.title}","${i.standard}","${i.title}","${i.required ? 'Required' : 'Optional'}","${i.checked ? 'Done' : 'Pending'}"`
      )
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `IFRS_Disclosure_Checklist_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="space-y-4">
      {/* IASB Update Banner — shown to all roles that can view ovds */}
      {canView && <IASBUpdateBanner businessType={businessType} />}

      {/* Access-denied state for non-ovds roles */}
      {!canView && (
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <Lock size={18} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">IFRS Disclosure Checklist</p>
            <p className="text-xs text-slate-400 mt-0.5">{blockedHint('view IFRS disclosures')}</p>
          </div>
        </div>
      )}

      {canView && (
        <>
          {/* Read-only notice for non-compute roles */}
          {readOnly && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <Lock size={12} className="text-slate-400 shrink-0" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold">{roleLabel}</span> — read-only view. ovds or ACCOUNTING role required to mark items.
              </p>
            </div>
          )}

      {/* Header */}
      <div className="bg-emerald-50 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 rounded-xl p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-white/40 mb-0.5">IAS 1.112–138</p>
              <h3 className="text-base font-semibold text-white">IFRS Disclosure Checklist</h3>
              <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5">Minimum required disclosures for Ethiopian AABE-compliant financial statements</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl ${gradeBg} text-center`}>
              <p className={`text-2xl font-semibold ${gradeColor}`}>{grade}</p>
              <p className="ovds-caption">{pct}% complete</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{reqChecked.length}<span className="text-slate-500 dark:text-white/40 text-sm">/{required.length}</span></p>
              <p className="text-[9px] text-slate-500 dark:text-white/40">required</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-emerald-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${grade === 'A' ? 'bg-emerald-400' : grade === 'B' ? 'bg-teal-400' : grade === 'C' ? 'bg-amber-400' : 'bg-rose-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60 cursor-pointer select-none">
            <input type="checkbox" checked={showOnlyRequired} onChange={e => setShowOnlyRequired(e.target.checked)}
              className="rounded" />
            Show required only
          </label>
          <button onClick={printChecklist}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-500 dark:text-white/70 hover:text-white transition-colors">
            <Printer size={12} /> Print
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-500 dark:text-white/70 hover:text-white transition-colors">
            ↓ CSV
          </button>
          <button onClick={() => setGroups(buildGroups(businessType))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-500 dark:text-white/70 hover:text-white transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Groups */}
      {groups.map(group => {
        const visibleItems = showOnlyRequired ? group.items.filter(i => i.required) : group.items;
        if (visibleItems.length === 0) return null;
        const groupChecked = visibleItems.filter(i => i.checked).length;
        const isOpen = openGroups.has(group.id);

        return (
          <div key={group.id} className={`rounded-2xl border ${group.border} overflow-hidden`}>
            <button
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left ${group.bg} hover:opacity-90 transition-opacity`}
            >
              <div className={`w-7 h-7 rounded-lg bg-white/60 dark:bg-emerald-100 dark:bg-white/10 flex items-center justify-center shrink-0 ${group.color}`}>
                {group.icon}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-semibold ${group.color}`}>{group.title}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">{groupChecked}/{visibleItems.length} complete</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); checkAll(group.id); }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/60 dark:bg-emerald-100 dark:bg-white/10 ${group.color} hover:bg-white/80 dark:hover:bg-white/20 transition-colors`}
              >
                Check all
              </button>
              {isOpen ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
            </button>

            {isOpen && (
              <div className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                {visibleItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => !readOnly && toggleItem(group.id, item.id)}
                    className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${readOnly ? 'cursor-default opacity-80' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.checked
                        ? <CheckSquare size={16} className="text-emerald-500" />
                        : <Square size={16} className="text-slate-300 dark:text-slate-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">{item.standard}</span>
                        <span className={`text-xs font-bold ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{item.title}</span>
                        {item.required && (
                          <span className="text-[10px] font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full">Required</span>
                        )}
                      </div>
                      <p className="ovds-caption mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3">
        <Info size={14} className="text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <strong>AABE Requirement:</strong> All public interest entities in Ethiopia must prepare financial statements in accordance with full IFRS. Smaller entities may use IFRS for SMEs. Disclosures must be filed with the Accounting and Auditing Board of Ethiopia (AABE) within the prescribed deadlines.
        </p>
      </div>
        </>
      )}
    </div>
  );
};

export default IFRSDisclosureChecklist;





