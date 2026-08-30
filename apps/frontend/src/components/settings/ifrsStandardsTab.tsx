/**
 * IFRSStandardsTab — IFRS configuration panel inside Settings.
 *
 * Allows ovds/ADMIN roles to:
 *  - Set the company's IFRS tier (Full IFRS / IFRS for SMEs / Micro-entity)
 *  - Enable/disable specific IFRS standards
 *  - Configure materiality threshold
 *  - View AABE compliance status
 *
 * Props mirror the Settings page pattern:
 *   settings: Record<string, string>  — SystemSetting key-value store
 *   setSettings: (s) => void          — optimistic local update
 *   canWrite: boolean                 — permission gate
 *   onSave: () => void                — triggers the parent save
 *   isSaving: boolean
 */
import React, { useState } from 'react';
import {
  Globe, CheckCircle2, AlertTriangle,
  Info, Save, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

// -- IFRS tier definitions (AABE — Proclamation 847/2014) ---------------------
const IFRS_TIERS = [
  {
    id: 'full',
    label: 'Tier 1 — Full IFRS',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    description: 'Mandatory for entities meeting 2 of 4 criteria: turnover > ETB 300M, employees > 200, assets > ETB 200M, liabilities > ETB 200M. Also mandatory for banks, insurers, and government-owned enterprises.',
    standards: ['IFRS 15', 'IFRS 16', 'IFRS 9', 'IAS 1', 'IAS 2', 'IAS 7', 'IAS 10', 'IAS 16', 'IAS 19', 'IAS 21', 'IAS 36', 'IAS 37', 'IAS 38'],
    since: '7 July 2023',
  },
  {
    id: 'sme',
    label: 'Tier 2 — IFRS for SMEs',
    badge: 'bg-emerald-100 text-emerald-600 dark:text-emerald-400 border-emerald-200',
    description: 'Mandatory for entities meeting 2 of 4 criteria: turnover > ETB 20M, employees > 20, assets > ETB 20M, liabilities > ETB 20M.',
    standards: ['Section 2', 'Section 3', 'Section 4', 'Section 5', 'Section 6', 'Section 7', 'Section 11', 'Section 12', 'Section 13', 'Section 17', 'Section 19', 'Section 20', 'Section 21', 'Section 23', 'Section 25', 'Section 27', 'Section 28', 'Section 30'],
    since: '7 July 2024',
  },
  {
    id: 'micro',
    label: 'Tier 3 — Micro-entity',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Entities below Tier 2 thresholds (e.g. sole traders, freelancers). Outside IFRS scope per Proclamation 847/2014. Basic cash-basis or accrual records sufficient.',
    standards: [],
    since: 'N/A',
  },
];

// -- Key IFRS standards with descriptions -------------------------------------
const STANDARD_DETAILS: Record<string, { title: string; summary: string; impact: string }> = {
  'IFRS 15': { title: 'Revenue from Contracts with Customers', summary: '5-step revenue recognition model', impact: 'Invoices, recurring revenue, multi-element arrangements' },
  'IFRS 16': { title: 'Leases', summary: 'All leases > 12 months on balance sheet as ROU asset + liability', impact: 'Office leases, equipment leases, vehicle leases' },
  'IFRS 9':  { title: 'Financial Instruments', summary: 'ECL impairment model; 3 classification categories', impact: 'AR aging provisions, bank balances, loans' },
  'IAS 1':   { title: 'Presentation of Financial Statements', summary: 'Complete set of 5 financial statements with comparatives', impact: 'Balance Sheet, P&L, Cash Flow, Equity, Notes' },
  'IAS 2':   { title: 'Inventories', summary: 'Lower of cost and NRV; FIFO or WA only (LIFO prohibited)', impact: 'Inventory costing, write-downs to NRV' },
  'IAS 7':   { title: 'Statement of Cash Flows', summary: 'Operating, investing, financing activities', impact: 'Cash flow report, bank reconciliation' },
  'IAS 16':  { title: 'Property, Plant and Equipment', summary: 'Cost or revaluation model; depreciation schedule', impact: 'Fixed assets, depreciation, disposals' },
  'IAS 19':  { title: 'Employee Benefits', summary: 'Pension, leave accruals, severance obligations', impact: 'Payroll, pension contributions, leave liability' },
  'IAS 37':  { title: 'Provisions, Contingent Liabilities', summary: 'Recognition criteria for provisions', impact: 'VAT penalties, DRRF overdue, legal claims' },
};

interface IFRSStandardsTabProps {
  settings: Record<string, string>;
  setSettings: (s: Record<string, string>) => void;
  canWrite: boolean;
  onSave: () => void;
  isSaving: boolean;
}

const IFRSStandardsTab: React.FC<IFRSStandardsTabProps> = ({
  settings,
  setSettings,
  canWrite,
  onSave,
  isSaving,
}) => {
  const currentTier = settings.ifrs_tier ?? 'sme';
  const materialityThreshold = settings.ifrs_materiality_threshold ?? '50000';
  const enabledStandards: string[] = (() => {
    try { return JSON.parse(settings.ifrs_enabled_standards ?? '[]'); }
    catch { return []; }
  })();
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);

  const selectedTier = IFRS_TIERS.find(t => t.id === currentTier) ?? IFRS_TIERS[1];

  const toggleStandard = (std: string) => {
    if (!canWrite) return;
    const next = enabledStandards.includes(std)
      ? enabledStandards.filter(s => s !== std)
      : [...enabledStandards, std];
    setSettings({ ...settings, ifrs_enabled_standards: JSON.stringify(next) });
  };

  const handleTierChange = (tierId: string) => {
    if (!canWrite) return;
    const tier = IFRS_TIERS.find(t => t.id === tierId);
    if (!tier) return;
    // Auto-enable all standards for the selected tier
    setSettings({
      ...settings,
      ifrs_tier: tierId,
      ifrs_enabled_standards: JSON.stringify(tier.standards),
    });
    toast.success(`IFRS tier set to ${tier.label}`);
  };

  return (
    <div className="space-y-8">
      {/* AABE header */}
      <div className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 rounded-xl text-white">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center shrink-0">
          <Globe size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-white/40 mb-0.5">AABE — Accounting and Auditing Board of Ethiopia</p>
          <h3 className="text-sm font-semibold text-white">IFRS Configuration</h3>
          <p className="text-xs text-white/50 mt-1">
            Proclamation 847/2014 · Regulation 332/2014 · Mandatory adoption since July 2023 (Tier 1) and July 2024 (Tier 2)
          </p>
        </div>
        <a
          href="http://www.aabe.gov.et"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-white/40 hover:text-slate-500 dark:text-white/70 transition-colors shrink-0"
        >
          AABE <ExternalLink size={10} />
        </a>
      </div>

      {/* Tier selector */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">IFRS Tier</p>
        <div className="ovds-grid-layout cols-3">
          {IFRS_TIERS.map(tier => (
            <button
              key={tier.id}
              onClick={() => handleTierChange(tier.id)}
              disabled={!canWrite}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                currentTier === tier.id
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/10 dark:bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                  {tier.id === 'full' ? 'Full IFRS' : tier.id === 'sme' ? 'IFRS for SMEs' : 'Micro-entity'}
                </span>
                {currentTier === tier.id && (
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{tier.label}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{tier.description.slice(0, 80)}…</p>
              {tier.since !== 'N/A' && (
                <p className="text-[9px] text-slate-400 mt-2 font-bold">Mandatory since: {tier.since}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Materiality threshold */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Materiality Threshold (ETB)</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            step="1000"
            value={materialityThreshold}
            onChange={e => canWrite && setSettings({ ...settings, ifrs_materiality_threshold: e.target.value })}
            disabled={!canWrite}
            className="w-48 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60"
          />
          <p className="text-xs text-slate-400">
            Items below this threshold may be expensed rather than capitalised (IAS 16 / IAS 38).
          </p>
        </div>
      </div>

      {/* Standards checklist */}
      {selectedTier.standards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Applicable Standards — {selectedTier.label}
            </p>
            <span className="ovds-caption">
              {enabledStandards.length} of {selectedTier.standards.length} enabled
            </span>
          </div>
          <div className="space-y-2">
            {selectedTier.standards.map(std => {
              const detail = STANDARD_DETAILS[std];
              const isEnabled = enabledStandards.includes(std);
              const isExpanded = expandedStandard === std;
              return (
                <div
                  key={std}
                  className={`rounded-2xl border transition-all ${
                    isEnabled
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10 dark:bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleStandard(std)}
                      disabled={!canWrite}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all disabled:opacity-60 ${
                        isEnabled
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-600'
                      }`}
                      aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${std}`}
                    >
                      {isEnabled && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{std}</span>
                        {detail && (
                          <span className="text-[10px] text-slate-400 truncate">{detail.title}</span>
                        )}
                      </div>
                      {detail && isExpanded && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{detail.summary}</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 dark:text-emerald-600 dark:text-emerald-400 font-bold">
                            Impact: {detail.impact}
                          </p>
                        </div>
                      )}
                    </div>
                    {detail && (
                      <button
                        onClick={() => setExpandedStandard(isExpanded ? null : std)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors shrink-0"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded
                          ? <ChevronUp size={13} />
                          : <ChevronDown size={13} />
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IFRS 18 readiness banner */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-2xl">
        <AlertTriangle size={15} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">
            IFRS 18 replaces IAS 1 on 1 January 2027
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 leading-relaxed">
            Map P&L to Operating / Investing / Financing categories. Identify Management-defined Performance Measures (MPMs).
            Plan comparative restatement for the 2026 comparative period.
          </p>
        </div>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl">
        <Info size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Note:</strong> IFRS tier and enabled standards affect financial report generation, disclosure checklists,
          and the IFRS Compliance Matrix. Changing the tier does not retroactively alter posted journal entries.
          Consult your auditor before changing the tier for a live company.
        </p>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={isSaving || !canWrite}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/30"
      >
        <Save size={16} />
        {isSaving ? 'Saving…' : 'Save IFRS Configuration'}
      </button>
    </div>
  );
};

export default IFRSStandardsTab;








