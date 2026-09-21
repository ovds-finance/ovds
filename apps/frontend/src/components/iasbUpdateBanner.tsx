/**
 * IASBUpdateBanner
 * Surfaces critical IASB standard updates relevant to all business types.
 * Covers IFRS 18, IFRS 19, IAS 1 amendments, IFRS 9/7 amendments (2024–2027).
 * Shown across all IFRS components — dismissible per session per update.
 * Enhanced: readiness score, role-aware action items, print/export.
 */
import { Bell, ChevronDown, ChevronUp, X, AlertTriangle, Clock, CheckCircle2, Zap, ExternalLink, Printer, Download, TrendingUp } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { useIFRSAccess } from '../hooks/useIfrsAccess';

export interface IASBUpdate {
  id: string;
  standard: string;
  title: string;
  effectiveDate: string;
  status: 'mandatory' | 'early-adoption' | 'exposure-draft';
  impact: 'high' | 'medium' | 'low';
  appliesTo: string[];          // business types or ['ALL']
  summary: string;
  keyChanges: string[];
  actionRequired: string;
  replacesOrAmends?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const IASB_UPDATES_2024_2027: IASBUpdate[] = [
  {
    id: 'ifrs18',
    standard: 'IFRS 18',
    title: 'Presentation and Disclosure in Financial Statements',
    effectiveDate: '1 January 2027',
    status: 'mandatory',
    impact: 'high',
    appliesTo: ['ALL'],
    summary:
      'IFRS 18 replaces IAS 1. It introduces three mandatory income statement categories (Operating, Investing, Financing) and requires disclosure of Management-defined Performance Measures (MPMs).',
    keyChanges: [
      'New income statement structure: Operating / Investing / Financing categories',
      'Management-defined Performance Measures (MPMs) must be disclosed in notes',
      'Standardised subtotals in the income statement',
      'Enhanced aggregation and disaggregation guidance',
      'Retrospective application required on adoption',
    ],
    actionRequired:
      'Review your income statement presentation. Identify any MPMs (e.g. EBITDA, adjusted profit) used in communications — these must now be reconciled to IFRS line items in the notes.',
    replacesOrAmends: 'Replaces IAS 1 (Presentation of Financial Statements)',
  },
  {
    id: 'ifrs19',
    standard: 'IFRS 19',
    title: 'Subsidiaries without Public Accountability: Disclosures',
    effectiveDate: '1 January 2027',
    status: 'mandatory',
    impact: 'medium',
    appliesTo: ['MEDIUM_ENTERPRISE', 'SMALL_BUSINESS', 'FREELANCER'],
    summary:
      'IFRS 19 allows eligible subsidiaries (those without public accountability) to apply reduced disclosure requirements while still using full IFRS recognition and measurement.',
    keyChanges: [
      'Subsidiaries can opt out of ~70% of IFRS disclosure requirements',
      'Full IFRS recognition and measurement still applies',
      'Parent must use full IFRS; subsidiary uses IFRS 19 disclosures',
      'Reduces compliance burden for non-listed subsidiaries',
      'AABE adoption timeline for Ethiopia TBD',
    ],
    actionRequired:
      'Assess whether any of your entities qualify as subsidiaries without public accountability. If so, plan for reduced disclosure preparation from 2027.',
    replacesOrAmends: 'New standard — supplements full IFRS for eligible subsidiaries',
  },
  {
    id: 'ias1-amend-2024',
    standard: 'IAS 1 (Amended)',
    title: 'Classification of Liabilities as Current or Non-current',
    effectiveDate: '1 January 2024',
    status: 'mandatory',
    impact: 'high',
    appliesTo: ['ALL'],
    summary:
      'Amendments clarify that classification of liabilities as current or non-current is based on rights existing at the reporting date. Covenants tested after the reporting date do not affect classification.',
    keyChanges: [
      'Classification based on rights at reporting date only',
      'Covenants tested after reporting date → liability remains non-current',
      'New disclosure required for non-current liabilities subject to covenants',
      'Retrospective application required',
      'Affects loan agreements, overdrafts, and revolving credit facilities',
    ],
    actionRequired:
      'Review all loan agreements and credit facilities. Reclassify any liabilities where covenant testing occurs after year-end. Add new covenant disclosure note.',
    replacesOrAmends: 'Amends IAS 1.69–76 (Classification of Liabilities)',
  },
  {
    id: 'ifrs9-amend-2026',
    standard: 'IFRS 9 / IFRS 7 (Amended)',
    title: 'Classification and Measurement of Financial Instruments',
    effectiveDate: '1 January 2026',
    status: 'mandatory',
    impact: 'medium',
    appliesTo: ['LARGE_ENTERPRISE', 'MANUFACTURING', 'MEDIUM_ENTERPRISE'],
    summary:
      'Amendments clarify the classification of financial assets with ESG-linked features, settlement of liabilities via equity instruments, and enhanced disclosures for financial instruments with contingent features.',
    keyChanges: [
      'Clarification on SPPI test for ESG-linked financial instruments',
      'New guidance on settlement of financial liabilities via equity',
      'Enhanced IFRS 7 disclosures for instruments with contingent features',
      'Transition relief for retrospective application',
      'Affects trade receivables, loans, and investment portfolios',
    ],
    actionRequired:
      'Review financial instrument classifications. Assess any ESG-linked or contingent-feature instruments. Update IFRS 7 disclosures in notes to financial statements.',
    replacesOrAmends: 'Amends IFRS 9 and IFRS 7',
  },
  {
    id: 'ias12-amend-2025',
    standard: 'IAS 12 (Amended)',
    title: 'Deferred Tax — Pillar Two Model Rules',
    effectiveDate: '1 January 2023 (mandatory exception)',
    status: 'mandatory',
    impact: 'medium',
    appliesTo: ['LARGE_ENTERPRISE', 'MANUFACTURING'],
    summary:
      'Mandatory temporary exception to recognising and disclosing deferred tax assets and liabilities arising from the OECD Pillar Two global minimum tax rules. Disclosure of exposure is required.',
    keyChanges: [
      'Mandatory exception: do NOT recognise deferred tax for Pillar Two',
      'Disclose that the exception has been applied',
      'Disclose known or reasonably estimable Pillar Two tax exposure',
      'Applies to top-up taxes under Pillar Two model rules',
      'Ethiopia not yet a Pillar Two jurisdiction — monitor ERCA guidance',
    ],
    actionRequired:
      'If your group has entities in Pillar Two jurisdictions, apply the mandatory exception and add the required disclosure. Monitor ERCA for Ethiopian adoption timeline.',
    replacesOrAmends: 'Amends IAS 12 (Income Taxes)',
  },
  {
    id: 'ifrs16-amend-2024',
    standard: 'IFRS 16 (Amended)',
    title: 'Lease Liability in a Sale and Leaseback',
    effectiveDate: '1 January 2024',
    status: 'mandatory',
    impact: 'low',
    appliesTo: ['LARGE_ENTERPRISE', 'MANUFACTURING', 'MEDIUM_ENTERPRISE'],
    summary:
      'Amendments specify how a seller-lessee measures the lease liability in a sale and leaseback transaction, ensuring no gain or loss is recognised for the retained right-of-use.',
    keyChanges: [
      'Seller-lessee measures lease liability using variable payments only',
      'No gain or loss recognised for the retained right-of-use',
      'Retrospective application to sale and leaseback transactions after IFRS 16 adoption',
      'Affects entities that have completed sale and leaseback transactions',
    ],
    actionRequired:
      'Review any sale and leaseback transactions. Remeasure lease liabilities using the amended guidance. Adjust retained earnings if retrospective adjustment is required.',
    replacesOrAmends: 'Amends IFRS 16 (Leases)',
  },
];

const STATUS_CONFIG = {
  mandatory:       { label: 'Mandatory',       cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',       icon: <AlertTriangle size={11} /> },
  'early-adoption':{ label: 'Early Adoption',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: <Clock size={11} /> },
  'exposure-draft':{ label: 'Exposure Draft',  cls: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-[var(--pro-azure)] dark:text-green-300',    icon: <Zap size={11} /> },
};

const IMPACT_CONFIG = {
  high:   { cls: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800',    dot: 'bg-rose-500',    label: 'High Impact' },
  medium: { cls: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800', dot: 'bg-amber-500', label: 'Medium Impact' },
  low:    { cls: 'bg-white border-slate-200 dark:bg-slate-800/40 dark:border-slate-700', dot: 'bg-slate-400', label: 'Low Impact' },
};

interface Props {
  businessType?: string;
  compact?: boolean;
  /** Show readiness score panel above the update list */
  showReadiness?: boolean;
  /** Only show updates of this impact level or higher */
  filterByImpact?: 'high' | 'medium' | 'low';
  /** Show a "dismiss all" button in the header */
  showDismissAll?: boolean;
  /**
   * "strip" — single-line dismissible bar, shows count + highest-impact standard only.
   * Ideal for page headers where space is tight.
   */
  variant?: 'default' | 'strip';
}

// -- Readiness score per update ------------------------------------------------
// Stored in localStorage so it persists across sessions
function getReadiness(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('iasb_readiness') || '{}'); }
  catch { return {}; }
}
function saveReadiness(r: Record<string, number>) {
  localStorage.setItem('iasb_readiness', JSON.stringify(r));
}

const IASBUpdateBanner: React.FC<Props> = ({ businessType = 'ALL', compact = false, showReadiness = false, filterByImpact, showDismissAll = false, variant = 'default' }) => {
  const { canFile, canCompute, roleLabel } = useIFRSAccess();
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('iasb_dismissed') || '[]')); }
    catch { return new Set(); }
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, number>>(getReadiness);

  const dismiss = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    sessionStorage.setItem('iasb_dismissed', JSON.stringify([...next]));
  };

  const dismissAll = () => {
    const next = new Set(IASB_UPDATES_2024_2027.map(u => u.id));
    setDismissed(next);
    sessionStorage.setItem('iasb_dismissed', JSON.stringify([...next]));
  };

  const IMPACT_ORDER = { high: 0, medium: 1, low: 2 };

  const setScore = (id: string, score: number) => {
    const next = { ...readiness, [id]: score };
    setReadiness(next);
    saveReadiness(next);
  };

  const relevant = IASB_UPDATES_2024_2027.filter(u =>
    !dismissed.has(u.id) &&
    (u.appliesTo.includes('ALL') || u.appliesTo.includes(businessType)) &&
    (filterByImpact === undefined || IMPACT_ORDER[u.impact] <= IMPACT_ORDER[filterByImpact])
  );

  const allRelevant = IASB_UPDATES_2024_2027.filter(u =>
    u.appliesTo.includes('ALL') || u.appliesTo.includes(businessType)
  );

  // Overall readiness score (0–100)
  const overallReadiness = useMemo(() => {
    if (allRelevant.length === 0) return 100;
    const total = allRelevant.reduce((sum, u) => sum + (readiness[u.id] ?? 0), 0);
    return Math.round(total / allRelevant.length);
  }, [allRelevant, readiness]);

  const readinessGrade = overallReadiness >= 80 ? 'A' : overallReadiness >= 65 ? 'B' : overallReadiness >= 50 ? 'C' : overallReadiness >= 35 ? 'D' : 'F';
  const readinessColor = { A: 'text-[var(--pro-azure)]', B: 'text-[var(--pro-azure)]', C: 'text-amber-600', D: 'text-orange-600', F: 'text-rose-600' }[readinessGrade];
  const readinessBg    = { A: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30', B: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30', C: 'bg-amber-50 dark:bg-amber-950/30', D: 'bg-orange-50 dark:bg-orange-950/30', F: 'bg-rose-50 dark:bg-rose-950/30' }[readinessGrade];

  if (relevant.length === 0 && !showReadiness) return null;

  // -- Strip variant — single dismissible line -------------------------------
  if (variant === 'strip') {
    const top = relevant[0];
    if (!top) return null;
    const sc = STATUS_CONFIG[top.status];
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
        <Bell size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-md">{top.standard}</span>
          <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.icon} {sc.label}</span>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">{top.title}</span>
          <span className="text-[9px] text-amber-600 dark:text-amber-400">Effective: {top.effectiveDate}</span>
          {relevant.length > 1 && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">+{relevant.length - 1} more</span>
          )}
        </div>
        <a href="https://www.ifrs.org/issued-standards/list-of-standards/" target="_blank" rel="noopener noreferrer"
          className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1">
          <ExternalLink size={10} /> IASB.org
        </a>
        <button onClick={() => dismiss(top.id)}
          className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-400 transition-colors shrink-0"
          title="Dismiss">
          <X size={12} />
        </button>
      </div>
    );
  }

  const visible = showAll ? relevant : relevant.slice(0, compact ? 1 : 3);
  const highCount = relevant.filter(u => u.impact === 'high').length;

  const exportUpdates = () => {
    const rows = [['Standard', 'Title', 'Effective Date', 'Status', 'Impact', 'Applies To', 'Action Required', 'Readiness %']];
    allRelevant.forEach(u => rows.push([
      u.standard, u.title, u.effectiveDate, u.status, u.impact,
      u.appliesTo.join(', '), u.actionRequired, String(readiness[u.id] ?? 0),
    ]));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `IASB_Updates_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const printUpdates = () => {
    const rows = allRelevant.map(u => `
      <tr>
        <td><strong>${u.standard}</strong></td>
        <td>${u.title}</td>
        <td>${u.effectiveDate}</td>
        <td>${u.status}</td>
        <td>${u.impact}</td>
        <td>${readiness[u.id] ?? 0}%</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>IASB Updates</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;font-size:11px}h1{font-size:14px;font-weight:900;margin-bottom:4px}
    p{font-size:10px;color:#64748b;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:6px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
    td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}</style></head>
    <body><h1>IASB Standard Updates — 2024–2027</h1>
    <p>Generated: ${new Date().toLocaleString()} | Overall Readiness: ${overallReadiness}% (Grade ${readinessGrade})</p>
    <table><thead><tr><th>Standard</th><th>Title</th><th>Effective</th><th>Status</th><th>Impact</th><th>Readiness</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) w.addEventListener('load', () => { w.print(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  };

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
      {/* Readiness score panel */}
      {showReadiness && (
        <div className="px-5 py-4 bg-[var(--pro-azure-50)] dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 text-white flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-semibold text-2xl ${readinessBg}`}>
              <span className={readinessColor}>{readinessGrade}</span>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-white/40 mb-0.5">IASB Readiness Score</p>
              <p className="text-xl font-semibold text-white">{overallReadiness}<span className="text-slate-500 dark:text-white/40 text-sm font-bold">/100</span></p>
              <p className="text-[10px] text-slate-500 dark:text-white/40">{allRelevant.length} standards tracked · {highCount} high impact</p>
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="h-2 bg-[var(--pro-azure-100)] dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${readinessGrade === 'A' ? 'bg-[var(--pro-azure-light)]' : readinessGrade === 'B' ? 'bg-teal-400' : readinessGrade === 'C' ? 'bg-amber-400' : 'bg-rose-400'}`}
                style={{ width: `${overallReadiness}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1">
              {canFile ? 'ovds — can submit filings' : canCompute ? 'ACCOUNTING — can compute, not submit' : `${roleLabel} — read-only`}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={printUpdates} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-500 dark:text-white/70 hover:text-white transition-colors">
              <Printer size={12} /> Print
            </button>
            <button onClick={exportUpdates} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-500 dark:text-white/70 hover:text-white transition-colors">
              <Download size={12} /> CSV
            </button>
          </div>
        </div>
      )}

      {/* Banner header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30">
        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center shrink-0">
          <Bell size={15} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">IASB Standard Updates</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
              {relevant.length} update{relevant.length !== 1 ? 's' : ''}
            </span>
            {highCount > 0 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                {highCount} high impact
              </span>
            )}
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
            New and amended IFRS standards affecting your financial statements (2024–2027)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!showReadiness && (
            <>
              <button onClick={printUpdates} title="Print" className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-500 transition-colors">
                <Printer size={13} />
              </button>
              <button onClick={exportUpdates} title="Export CSV" className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-500 transition-colors">
                <Download size={13} />
              </button>
            </>
          )}
          {showDismissAll && relevant.length > 0 && (
            <button onClick={dismissAll}
              className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline px-2 py-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
              Dismiss all
            </button>
          )}
          {!compact && relevant.length > 3 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:underline"
            >
              {showAll ? 'Show less' : `+${relevant.length - 3} more`}
            </button>
          )}
        </div>
      </div>

      {/* Update cards */}
      <div className="divide-y divide-amber-100 dark:divide-amber-900/40 bg-white dark:bg-slate-900">
        {visible.map(update => {
          const sc = STATUS_CONFIG[update.status];
          const ic = IMPACT_CONFIG[update.impact];
          const isOpen = expanded === update.id;
          const score = readiness[update.id] ?? 0;

          return (
            <div key={update.id} className={`border-l-4 ${update.impact === 'high' ? 'border-l-red-400' : update.impact === 'medium' ? 'border-l-amber-400' : 'border-l-slate-300'}`}>
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-md">
                      {update.standard}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">Effective: {update.effectiveDate}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{update.title}</p>
                  {!isOpen && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{update.summary}</p>
                  )}

                  {isOpen && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300">{update.summary}</p>

                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Key Changes</p>
                        <ul className="space-y-1">
                          {update.keyChanges.map(c => (
                            <li key={c} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <CheckCircle2 size={11} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`rounded-xl border p-3 ${ic.cls}`}>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Action Required</p>
                        <p className="text-xs text-slate-700 dark:text-slate-200">{update.actionRequired}</p>
                      </div>

                      {/* Role-aware action hint */}
                      <div className="flex items-start gap-2 bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                        <TrendingUp size={12} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Your Role ({roleLabel})</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            {canFile
                              ? 'You can submit filings and approve IFRS transitions. Ensure your team completes the readiness checklist before the effective date.'
                              : canCompute
                              ? 'You can compute and prepare IFRS workings. Coordinate with ovds for final submission and approval.'
                              : 'Read-only access. Share this update with your ovds or ACCOUNTING team for action.'}
                          </p>
                        </div>
                      </div>

                      {/* Readiness slider */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Your Readiness</p>
                          <span className="text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{score}%</span>
                        </div>
                        <input
                          type="range" min={0} max={100} step={5} value={score}
                          onChange={e => setScore(update.id, Number(e.target.value))}
                          className="w-full h-1.5 rounded-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-slate-300 mt-0.5">
                          <span>Not started</span><span>In progress</span><span>Ready</span>
                        </div>
                      </div>

                      {update.replacesOrAmends && (
                        <p className="ovds-caption">
                          <span className="font-semibold">Replaces/Amends:</span> {update.replacesOrAmends}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setExpanded(isOpen ? null : update.id)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
                    >
                      {isOpen ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> Details</>}
                    </button>
                    {/* Readiness pill (collapsed) */}
                    {!isOpen && score > 0 && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${score >= 80 ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {score}% ready
                      </span>
                    )}
                    <a
                      href="https://www.ifrs.org/issued-standards/list-of-standards/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors"
                    >
                      <ExternalLink size={10} /> IASB.org
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => dismiss(update.id)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 hover:text-slate-500 transition-colors shrink-0 mt-0.5"
                  title="Dismiss for this session"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IASBUpdateBanner;







