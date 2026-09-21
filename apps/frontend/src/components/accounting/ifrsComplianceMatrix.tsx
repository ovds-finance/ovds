/**
 * IFRS Compliance Matrix
 * Maps Ethiopian tax proclamations to IFRS standards
 * Provides a visual compliance lifecycle from purchase to audit
 * Enhanced with IASB 2024–2027 update banner and role-based access.
 */
import {
  CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp,
  BookOpen, Shield, Scale, Package,
  FileText, Globe, BarChart3, ArrowRight,
  Info, Zap, Lock, Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';

import { useBusiness } from '../../context/businessContext';
import { useIFRSAccess } from '../../hooks/useIfrsAccess';
import IASBUpdateBanner from '../iasbUpdateBanner';

interface ProclamationMapping {
  proclamation: string;
  shortName: string;
  ifrsStandard: string;
  ifrsTitle: string;
  description: string;
  status: 'compliant' | 'partial' | 'pending';
  keyRequirements: string[];
  ethiopianRate?: string;
}

interface LifecycleStep {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  ifrsRef: string;
  proclamation: string;
  actions: string[];
}

const PROCLAMATION_MAPPINGS: ProclamationMapping[] = [
  {
    proclamation: 'VAT Proclamation No. 1341/2024',
    shortName: 'VAT 1341/2024',
    ifrsStandard: 'IFRS 15',
    ifrsTitle: 'Revenue from Contracts with Customers',
    description: 'VAT on sales aligns with IFRS 15 revenue recognition — output VAT is a liability, not revenue.',
    status: 'compliant',
    keyRequirements: ['15% standard rate', 'Monthly filing by 30th', 'ETB 2M registration threshold', 'E-Invoice QR (NBE-IQR)'],
    ethiopianRate: '15%',
  },
  {
    proclamation: 'Income Tax Proclamation No. 979/2016',
    shortName: 'Income Tax 979/2016',
    ifrsStandard: 'IAS 12',
    ifrsTitle: 'Income Taxes',
    description: 'Corporate income tax (BIT 30%) creates current and deferred tax obligations per IAS 12.',
    status: 'compliant',
    keyRequirements: ['30% BIT flat rate', 'File within 4 months of FY end', 'Deferred tax on temporary differences', 'PIT 0-35% progressive'],
    ethiopianRate: '30% BIT',
  },
  {
    proclamation: 'Excise Tax Proclamation No. 1186/2020',
    shortName: 'Excise 1186/2020',
    ifrsStandard: 'IAS 2 / IFRS 15',
    ifrsTitle: 'Inventories / Revenue',
    description: 'Excise duties on imports are included in inventory cost (IAS 2) or reduce revenue (IFRS 15).',
    status: 'partial',
    keyRequirements: ['Excise on tobacco, alcohol, vehicles', 'Customs duties in inventory cost', 'Import VAT treatment', 'Zero-rated exports'],
    ethiopianRate: 'Varies by category',
  },
  {
    proclamation: 'Pension Proclamation No. 714/2011',
    shortName: 'Pension 714/2011',
    ifrsStandard: 'IAS 19',
    ifrsTitle: 'Employee Benefits',
    description: 'Mandatory pension contributions (7% employee + 11% employer) are defined contribution plans per IAS 19.',
    status: 'compliant',
    keyRequirements: ['Employee: 7% of basic salary', 'Employer: 11% of basic salary', 'Monthly remittance to Pension Authority', 'Defined contribution plan'],
    ethiopianRate: '7% + 11%',
  },
  {
    proclamation: 'DRRF Regulation No. 570/2025',
    shortName: 'DRRF 570/2025',
    ifrsStandard: 'IAS 37',
    ifrsTitle: 'Provisions, Contingent Liabilities',
    description: 'DRRF levies are present obligations that meet IAS 37 recognition criteria — recognised as provisions.',
    status: 'compliant',
    keyRequirements: ['17+ levy categories (1%-5%)', 'Quarterly remittance to EDRRFO', 'Auto-generated from transactions', 'Compliance score A-F'],
    ethiopianRate: '1%-5% + flat fees',
  },
  {
    proclamation: 'AABE IFRS Adoption Directive',
    shortName: 'AABE IFRS',
    ifrsStandard: 'IAS 1',
    ifrsTitle: 'Presentation of Financial Statements',
    description: 'AABE mandates IFRS for public interest entities. Financial statements must comply with IAS 1 presentation requirements.',
    status: 'compliant',
    keyRequirements: ['Full IFRS for large enterprises', 'IFRS for SMEs for smaller entities', 'Amharic/English dual reporting', 'AABE filing deadlines'],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'Commercial Code of Ethiopia 2021',
    shortName: 'Commercial Code 2021',
    ifrsStandard: 'IFRS 3 / IAS 27',
    ifrsTitle: 'Business Combinations / Subsidiaries',
    description: 'New Commercial Code governs company formation, mergers, and group structures — aligns with IFRS 3 acquisition method.',
    status: 'partial',
    keyRequirements: ['Acquisition method for mergers', 'Goodwill recognition and impairment', 'Consolidated statements for groups', 'Non-controlling interests'],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'NBE Directive FIS/01/2012',
    shortName: 'NBE FIS/01/2012',
    ifrsStandard: 'IFRS 9',
    ifrsTitle: 'Financial Instruments',
    description: 'NBE directives on financial instruments align with IFRS 9 classification, measurement, and ECL impairment.',
    status: 'partial',
    keyRequirements: ['ECL provisioning for receivables', 'FVTPL / FVOCI / Amortised cost', 'Hedge accounting disclosure', 'Foreign currency (IAS 21)'],
    ethiopianRate: 'N/A',
  },
  // -- IASB 2024–2027 Updates ------------------------------------------------
  {
    proclamation: 'IFRS 18 (IASB — effective 1 Jan 2027)',
    shortName: 'IFRS 18 (2027)',
    ifrsStandard: 'IFRS 18',
    ifrsTitle: 'Presentation and Disclosure in Financial Statements',
    description: 'IFRS 18 replaces IAS 1. Introduces mandatory Operating/Investing/Financing income statement categories and requires disclosure of Management-defined Performance Measures (MPMs). Applies to all entities.',
    status: 'pending',
    keyRequirements: ['New income statement: Operating / Investing / Financing', 'MPMs must be disclosed and reconciled to IFRS line items', 'Standardised subtotals', 'Retrospective application required', 'Prepare comparatives now'],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'IAS 1 Amendment — Liability Classification (effective 1 Jan 2024)',
    shortName: 'IAS 1 Amend. (2024)',
    ifrsStandard: 'IAS 1 (Amended)',
    ifrsTitle: 'Classification of Liabilities as Current or Non-current',
    description: 'Liabilities are classified based on rights existing at the reporting date. Post-reporting-date covenant tests do not affect classification. New covenant disclosure required.',
    status: 'compliant',
    keyRequirements: ['Rights-based classification at reporting date', 'Post-date covenants → non-current', 'New covenant disclosure note', 'Retrospective application', 'Review all loan agreements'],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'IFRS 9 / IFRS 7 Amendment (effective 1 Jan 2026)',
    shortName: 'IFRS 9/7 Amend. (2026)',
    ifrsStandard: 'IFRS 9 / IFRS 7',
    ifrsTitle: 'Classification and Measurement of Financial Instruments',
    description: 'Clarifies SPPI test for ESG-linked instruments, settlement via equity, and enhanced IFRS 7 disclosures for contingent-feature instruments.',
    status: 'partial',
    keyRequirements: ['SPPI test for ESG-linked instruments', 'Settlement via equity guidance', 'Enhanced IFRS 7 disclosures', 'Transition relief available', 'Review trade receivables and loans'],
    ethiopianRate: 'N/A',
  },
  // -- IFRS Sustainability Standards -----------------------------------------
  {
    proclamation: 'IFRS S1 — ISSB (effective 1 Jan 2024)',
    shortName: 'IFRS S1 (2024)',
    ifrsStandard: 'IFRS S1',
    ifrsTitle: 'General Requirements for Disclosure of Sustainability-related Financial Information',
    description: 'IFRS S1 requires entities to disclose material sustainability-related risks and opportunities across governance, strategy, risk management, and metrics & targets. Mandatory for large public interest entities in Ethiopia.',
    status: 'pending',
    keyRequirements: [
      'Governance: Board oversight of sustainability risks',
      'Strategy: Sustainability risks affecting business model',
      'Risk Management: Identification and assessment processes',
      'Metrics & Targets: Quantitative sustainability KPIs',
      'Applies to Tier 1 entities (LARGE_ENTERPRISE, GOVERNMENT)',
    ],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'IFRS S2 — ISSB (effective 1 Jan 2024)',
    shortName: 'IFRS S2 (2024)',
    ifrsStandard: 'IFRS S2',
    ifrsTitle: 'Climate-related Disclosures',
    description: 'IFRS S2 requires disclosure of climate-related risks and opportunities. Highly relevant for Ethiopian agriculture, energy, and manufacturing sectors exposed to climate variability and transition risks.',
    status: 'pending',
    keyRequirements: [
      'Physical risks: Drought, flooding, temperature impacts on operations',
      'Transition risks: Carbon pricing, regulatory changes',
      'Scope 1, 2 & 3 greenhouse gas emissions disclosure',
      'Climate scenario analysis (1.5°C, 2°C, 4°C)',
      'Relevant for agriculture, agro-processing, energy sectors in Ethiopia',
    ],
    ethiopianRate: 'N/A',
  },
  // -- Core IFRS Disclosure Standards ----------------------------------------
  {
    proclamation: 'IAS 24 — Related Party Disclosures',
    shortName: 'IAS 24',
    ifrsStandard: 'IAS 24',
    ifrsTitle: 'Related Party Disclosures',
    description: 'Entities must disclose transactions, outstanding balances, and KMP compensation with related parties. Now implemented via Financial Statements → IAS 24 tab.',
    status: 'compliant',
    keyRequirements: [
      'Disclose all transactions with parent, subsidiaries, associates, joint ventures',
      'KMP compensation — short-term, post-employment, share-based (IAS 24.17)',
      'Government-related entity exemptions (IAS 24.25–27)',
      'Arm\'s-length pricing disclosure required even if no charge',
    ],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'IFRS 8 — Operating Segments',
    shortName: 'IFRS 8',
    ifrsStandard: 'IFRS 8',
    ifrsTitle: 'Operating Segments',
    description: 'Entities with publicly traded securities must disclose segment information. Cost Centers page provides IFRS 8 segment P&L per profit center.',
    status: 'partial',
    keyRequirements: [
      'Mandatory for entities with publicly traded ordinary or debt instruments',
      'Management approach — reportable segments based on internal reports to CODM',
      'Revenue, profit/loss, assets per segment (IFRS 8.23)',
      'Reconciliation of segment totals to entity totals (IFRS 8.28)',
      'Entity-wide disclosures: products/services, geography, major customers (IFRS 8.31–34)',
    ],
    ethiopianRate: 'N/A',
  },
  {
    proclamation: 'IAS 33 — Earnings Per Share',
    shortName: 'IAS 33',
    ifrsStandard: 'IAS 33',
    ifrsTitle: 'Earnings Per Share',
    description: 'Basic and diluted EPS required on the face of the income statement for entities with publicly traded ordinary shares. Now available via Financial Statements → Reports → IAS 33 EPS endpoint.',
    status: 'partial',
    keyRequirements: [
      'Mandatory for entities with publicly traded ordinary or potential ordinary shares',
      'Basic EPS = Net profit ÷ Weighted average shares outstanding (IAS 33.10)',
      'Diluted EPS adjusts for convertible bonds, warrants, share options (IAS 33.31)',
      'Present on the face of the income statement — both continuing and discontinued (IAS 33.66)',
      'Supply weighted average shares via Settings → IFRS → Share Capital',
    ],
    ethiopianRate: 'N/A',
  },
];

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    id: 'purchase',
    step: 1,
    title: 'Item Purchase / Import',
    subtitle: 'IAS 2 · IAS 16 · Excise 1186/2020',
    icon: <Package size={16} />,
    color: 'text-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    ifrsRef: 'IAS 2.10 — Cost of inventories',
    proclamation: 'Excise Tax Proclamation No. 1186/2020',
    actions: ['Record purchase bill', 'Include customs duties in cost', 'Apply FIFO/LIFO/WA costing', 'Claim input VAT (15%)'],
  },
  {
    id: 'registration',
    step: 2,
    title: 'Business Registration',
    subtitle: 'IAS 1 · Commercial Code 2021',
    icon: <Shield size={16} />,
    color: 'text-violet-700',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    ifrsRef: 'IAS 1.16 — Statement of compliance',
    proclamation: 'Commercial Code of Ethiopia 2021',
    actions: ['Register TIN with ERCA', 'VAT registration (ETB 2M threshold)', 'AABE IFRS adoption declaration', 'Set fiscal year (Ethiopian calendar)'],
  },
  {
    id: 'sale',
    step: 3,
    title: 'Sale / Invoice',
    subtitle: 'IFRS 15 · VAT 1341/2024',
    icon: <FileText size={16} />,
    color: 'text-teal-700',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    ifrsRef: 'IFRS 15.31 — Satisfaction of performance obligation',
    proclamation: 'VAT Proclamation No. 1341/2024',
    actions: ['Issue e-Invoice with QR (NBE-IQR)', 'Recognise revenue per IFRS 15', 'Charge 15% output VAT', 'Auto-post journal entry (DR AR / CR Revenue / CR VAT)'],
  },
  {
    id: 'journal',
    step: 4,
    title: 'Journal Entry',
    subtitle: 'IAS 1 · Double-entry',
    icon: <BookOpen size={16} />,
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    border: 'border-[var(--pro-azure-100)] dark:border-green-800',
    ifrsRef: 'IAS 1.46 — Accrual basis of accounting',
    proclamation: 'AABE IFRS Adoption Directive',
    actions: ['Auto-post on invoice/bill creation', 'Balanced debits = credits (tolerance < 0.01 ETB)', 'Period locking prevents backdating', 'Recurring templates for depreciation/rent'],
  },
  {
    id: 'tax',
    step: 5,
    title: 'Tax Declaration',
    subtitle: 'IAS 12 · VAT 1341/2024 · DRRF 570/2025',
    icon: <Scale size={16} />,
    color: 'text-orange-700',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    ifrsRef: 'IAS 12.46 — Current tax liability',
    proclamation: 'Income Tax Proclamation No. 979/2016',
    actions: ['Monthly VAT return (by 30th)', 'DRRF quarterly remittance (by 15th)', 'Annual BIT declaration (30%)', 'eTax portal submission (SIGTAS)'],
  },
  {
    id: 'fines',
    step: 6,
    title: 'Fines & Penalties',
    subtitle: 'IAS 37 · Late filing penalties',
    icon: <AlertCircle size={16} />,
    color: 'text-rose-700',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    ifrsRef: 'IAS 37.14 — Recognition of provisions',
    proclamation: 'VAT Proclamation No. 1341/2024',
    actions: ['ETB 500/day late VAT filing penalty', 'System flags overdue filings', 'Provision recognised per IAS 37', 'Smart alerts for upcoming deadlines'],
  },
  {
    id: 'audit',
    step: 7,
    title: 'Audit & Reporting',
    subtitle: 'IAS 1 · IFRS 7 · AABE',
    icon: <BarChart3 size={16} />,
    color: 'text-[var(--pro-azure-dark)]',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    border: 'border-[var(--pro-azure-100)] dark:border-green-800',
    ifrsRef: 'IAS 1.10 — Complete set of financial statements',
    proclamation: 'AABE IFRS Adoption Directive',
    actions: ['Balance Sheet (IAS 1.54)', 'P&L / OCI (IAS 1.81A)', 'Cash Flow Statement (IAS 7)', 'Notes to Financials (IAS 1.112-138)'],
  },
  {
    id: 'ifrs18_prep',
    step: 8,
    title: 'IFRS 18 Readiness (2027)',
    subtitle: 'IFRS 18 · Replaces IAS 1 · All entities',
    icon: <Sparkles size={16} />,
    color: 'text-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    ifrsRef: 'IFRS 18 — Presentation and Disclosure in Financial Statements',
    proclamation: 'IASB — effective 1 January 2027 (prepare now)',
    actions: [
      'Map P&L lines to Operating / Investing / Financing categories',
      'Identify all Management-defined Performance Measures (MPMs)',
      'Prepare MPM reconciliation note to IFRS line items',
      'Plan comparative period restatement for 2026',
    ],
  },
];

const statusConfig = {
  compliant: { icon: <CheckCircle2 size={13} />, label: 'Compliant', cls: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300' },
  partial:   { icon: <Clock size={13} />,        label: 'Partial',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  pending:   { icon: <AlertCircle size={13} />,  label: 'Pending',   cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

type ViewMode = 'lifecycle' | 'matrix';

const IFRSComplianceMatrix: React.FC = () => {
  const [view, setView] = useState<ViewMode>('lifecycle');
  const [expandedStep, setExpandedStep] = useState<string | null>('purchase');
  const [expandedMapping, setExpandedMapping] = useState<string | null>(null);
  const { canView, blockedHint } = useIFRSAccess();
  const { companies, selectedCompanyId } = useBusiness();
  const company = companies.find(c => c.id === selectedCompanyId);
  const businessType = (company as any)?.type ?? 'ALL';

  const compliantCount = PROCLAMATION_MAPPINGS.filter(m => m.status === 'compliant').length;
  const partialCount   = PROCLAMATION_MAPPINGS.filter(m => m.status === 'partial').length;
  const pendingCount   = PROCLAMATION_MAPPINGS.filter(m => m.status === 'pending').length;

  if (!canView) {
    return (
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
        <Lock size={18} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">IFRS Compliance Matrix</p>
          <p className="text-xs text-slate-400 mt-0.5">{blockedHint('view IFRS compliance data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* IASB Update Banner */}
      <IASBUpdateBanner businessType={businessType} />

      {/* Header */}
      <div className="bg-[var(--pro-azure-50)] dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--pro-azure-50)]0 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--pro-azure-50)]0 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--pro-azure-100)] dark:bg-green-900/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl flex items-center justify-center shrink-0">
              <Globe size={22} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-0.5">IFRS + Ethiopian Law</p>
              <h2 className="text-lg font-semibold tracking-tight">Full-Stack IFRS Compliance System</h2>
              <p className="text-xs text-white/50 mt-0.5">International standards · Ethiopian proclamations · End-to-end lifecycle</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-semibold text-[var(--pro-azure-light)]">{compliantCount}</p>
              <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">Compliant</p>
            </div>
            <div className="w-px h-8 bg-[var(--pro-azure-100)] dark:bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-amber-400">{partialCount}</p>
              <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">Partial</p>
            </div>
            <div className="w-px h-8 bg-[var(--pro-azure-100)] dark:bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-rose-400">{pendingCount}</p>
              <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">Pending</p>
            </div>
            <div className="w-px h-8 bg-[var(--pro-azure-100)] dark:bg-white/10" />
            <div className="text-center">
              <p className="text-xl font-semibold text-white">{PROCLAMATION_MAPPINGS.length}</p>
              <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">Standards</p>
            </div>
          </div>
        </div>
        {/* View toggle */}
        <div className="relative mt-4 flex gap-1 bg-[var(--pro-azure-100)] dark:bg-white/10 p-1 rounded-xl w-fit">
          {(['lifecycle', 'matrix'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${view === v ? 'bg-white text-slate-900' : 'text-slate-500 dark:text-white/60 hover:text-white'}`}>
              {v === 'lifecycle' ? 'Business Lifecycle' : 'Proclamation Matrix'}
            </button>
          ))}
        </div>
      </div>

      {/* Lifecycle View */}
      {view === 'lifecycle' && (
        <div className="space-y-3">
          <p className="ovds-body">
            Every business transaction follows this IFRS-compliant lifecycle — from item purchase to external audit.
          </p>
          {LIFECYCLE_STEPS.map((s, idx) => (
            <div key={s.id} className={`rounded-2xl border ${s.border} overflow-hidden transition-all`}>
              <button
                onClick={() => setExpandedStep(expandedStep === s.id ? null : s.id)}
                className={`w-full flex items-center gap-4 p-4 text-left ${s.bg} hover:opacity-90 transition-opacity`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.color} bg-white/60 dark:bg-[var(--pro-azure-100)] dark:bg-white/10`}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-medium ${s.color} opacity-60`}>STEP {s.step}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{s.subtitle}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{s.ifrsRef}</p>
                </div>
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0 hidden sm:block" />
                )}
                {expandedStep === s.id
                  ? <ChevronUp size={15} className="text-slate-400 shrink-0" />
                  : <ChevronDown size={15} className="text-slate-400 shrink-0" />
                }
              </button>
              {expandedStep === s.id && (
                <div className="px-5 pb-4 pt-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <div className="ovds-grid-layout cols-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">System Actions</p>
                      <ul className="space-y-1.5">
                        {s.actions.map(a => (
                          <li key={a} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <CheckCircle2 size={12} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/30 rounded-xl p-3 border border-[var(--pro-azure-100)] dark:border-green-900">
                        <p className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] uppercase tracking-wider mb-1">IFRS Reference</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.ifrsRef}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 border border-orange-100 dark:border-orange-900">
                        <p className="text-[10px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Ethiopian Law</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.proclamation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Matrix View */}
      {view === 'matrix' && (
        <div className="space-y-3">
          <p className="ovds-body">
            How each Ethiopian tax proclamation maps to the corresponding IFRS standard.
          </p>
          {PROCLAMATION_MAPPINGS.map(m => {
            const sc = statusConfig[m.status];
            const isOpen = expandedMapping === m.proclamation;
            return (
              <div key={m.proclamation} className="ovds-widget-card overflow-hidden">
                <button
                  onClick={() => setExpandedMapping(isOpen ? null : m.proclamation)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.shortName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-lg">{m.ifrsStandard}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.ifrsTitle}</span>
                      {m.ethiopianRate && m.ethiopianRate !== 'N/A' && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-lg">{m.ethiopianRate}</span>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{m.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Key Requirements</p>
                        <ul className="space-y-1">
                          {m.keyRequirements.map(r => (
                            <li key={r} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <Zap size={11} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-0.5 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Proclamation</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.proclamation}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Maps to: <span className="font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{m.ifrsStandard} — {m.ifrsTitle}</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-2 bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-900 rounded-xl p-3">
        <Info size={14} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <strong>AABE Compliance:</strong> Ethiopian businesses are required to adopt IFRS as issued by the IASB. Large public interest entities use full IFRS; smaller entities may use IFRS for SMEs. All financial statements must be filed with the Accounting and Auditing Board of Ethiopia (AABE).
        </p>
      </div>
    </div>
  );
};

export default IFRSComplianceMatrix;








