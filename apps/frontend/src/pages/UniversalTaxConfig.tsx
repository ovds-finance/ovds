/**
 * Universal Tax Configuration Page
 * Route: /tax/universal-config
 * Permission: settings:read (view) | settings:write (edit profile)
 *
 * Blueprint:
 *   Tab 1 — Tax Rules         : canonical rate table, all 21 tax types, IAS 12 + IFRS 18 labels
 *   Tab 2 — Company Profile   : VAT/TOT band, BIT schedule, active taxes, deferred tax toggle
 *   Tab 3 — GL Account Map    : canonical GL codes for every tax posting
 *   Tab 4 — Filing Calendar   : upcoming deadlines (next 90 days)
 *   Tab 5 — Compliance Health : live status per tax type vs filed records
 *   Tab 6 — Sector Overrides  : exemptions per Ethiopian sector
 *   Tab 7 — RBAC Matrix       : who can do what with tax operations
 */
import React, { useState, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { rbac } from '../rbac/rbac';
import {
  useUniversalTaxRules,
  useCompanyTaxProfile,
  useComplianceHealth,
  useFilingDeadlines,
} from '../services/taxApi';
import { updateCompanyTaxProfile } from '@ovds/features/tax';
import { AppPage, Btn, Icon } from '../components/ui';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'rules',     label: 'Tax Rules',         icon: 'SHIELD_CHECK' },
  { id: 'profile',   label: 'Company Profile',   icon: 'SETTINGS' },
  { id: 'gl',        label: 'GL Account Map',    icon: 'BOOK_OPEN' },
  { id: 'calendar',  label: 'Filing Calendar',   icon: 'CALENDAR' },
  { id: 'health',    label: 'Compliance Health', icon: 'ACTIVITY' },
  { id: 'sectors',   label: 'Sector Overrides',  icon: 'COMPANY' },
  { id: 'rbac',      label: 'RBAC Matrix',       icon: 'LOCK' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─────────────────────────────────────────────────────────────────────────────
// Static data (matches universal-tax-config.ts constants — no extra fetch)
// ─────────────────────────────────────────────────────────────────────────────

const IAS12_BADGE: Record<string, { label: string; cls: string }> = {
  CURRENT_TAX:    { label: 'Current Tax',    cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  DEFERRED_TAX:   { label: 'Deferred Tax',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  NOT_INCOME_TAX: { label: 'Not Income Tax', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

const IFRS18_BADGE: Record<string, { label: string; cls: string }> = {
  OPERATING:   { label: 'Operating',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  INCOME_TAX:  { label: 'Income Tax',  cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  FINANCING:   { label: 'Financing',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
  INVESTING:   { label: 'Investing',   cls: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
};

const SEVERITY_CLS: Record<string, string> = {
  CRITICAL: 'border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-950/20',
  WARNING:  'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20',
  INFO:     'border-l-4 border-sky-400 bg-sky-50 dark:bg-sky-950/20',
};

const STATUS_CLS: Record<string, string> = {
  COMPLIANT:       'text-emerald-600 dark:text-emerald-400',
  PENDING:         'text-amber-600 dark:text-amber-400',
  NOT_FILED:       'text-rose-600 dark:text-rose-400',
  OVERDUE:         'text-rose-600 dark:text-rose-400 font-semibold',
  CURRENT:         'text-emerald-600 dark:text-emerald-400',
  NOT_APPLICABLE:  'text-slate-400 dark:text-slate-500',
  UNREMITTED:      'text-orange-600 dark:text-orange-400',
};

/** Ethiopian sectors list for the sector override tab */
const ET_SECTORS = [
  'AGRICULTURE','MANUFACTURING','CONSTRUCTION','TRADE_WHOLESALE','TRADE_RETAIL',
  'FINANCIAL_SERVICES','TRANSPORT_LOGISTICS','HEALTHCARE','EDUCATION',
  'HOSPITALITY_TOURISM','ICT','MEDIA','MINING','NGO_NONPROFIT','GOVERNMENT','OTHER',
];

/** Sector exemptions — mirrors TAX_RULE_OVERRIDES from universal-tax-config.ts */
const SECTOR_EXEMPTIONS: Record<string, { taxCode: string; condition: string; authority: string }[]> = {
  AGRICULTURE:       [
    { taxCode: 'VAT',          condition: 'Basic unprocessed produce is VAT-exempt', authority: 'Proc. 1341/2024 Sch. 2' },
    { taxCode: 'EXCISE',       condition: 'Agricultural equipment & fertilisers exempt', authority: 'Proc. 1186/2020' },
    { taxCode: 'IMPORT_SURTAX',condition: 'Agricultural inputs exempt from surtax', authority: 'Investment Proc. 1180/2020' },
  ],
  FINANCIAL_SERVICES:[
    { taxCode: 'VAT', condition: 'Banking/insurance/financial intermediation is VAT-exempt', authority: 'Proc. 1341/2024 Sch. 1' },
    { taxCode: 'TOT', condition: 'Exempt from TOT when VAT-exempt', authority: 'Proc. 1395/2025 Art. 35' },
  ],
  EDUCATION:         [
    { taxCode: 'VAT', condition: 'Educational services are VAT-exempt', authority: 'Proc. 1341/2024 Sch. 1' },
    { taxCode: 'TOT', condition: 'Exempt from TOT when VAT-exempt', authority: 'Proc. 1395/2025' },
  ],
  HEALTHCARE:        [
    { taxCode: 'VAT', condition: 'Medical services and pharmaceutical supplies are VAT-exempt', authority: 'Proc. 1341/2024 Sch. 1' },
  ],
  NGO_NONPROFIT:     [
    { taxCode: 'BIT', condition: 'Charitable orgs exempt from BIT on activities within mandate', authority: 'Proc. 979/2016 Art. 8' },
  ],
  MANUFACTURING:     [
    { taxCode: 'IMPORT_SURTAX', condition: 'Capital goods surtax exemptions available', authority: 'Investment Proc. 1180/2020' },
  ],
  GOVERNMENT:        [
    { taxCode: 'VAT', condition: 'Government bodies not VAT registrants for own activities', authority: 'Proc. 1341/2024' },
    { taxCode: 'BIT', condition: 'Government enterprises may have BIT exemption per charter', authority: 'Proc. 979/2016 Art. 8' },
  ],
};

/** RBAC matrix — mirrors TAX_RBAC_MATRIX from universal-tax-config.ts */
const RBAC_ROWS = [
  { action: 'view',          minLevel: 30,  minRole: 'AUDITOR',     desc: 'Read-only access to all tax reports and dashboards' },
  { action: 'calculate',     minLevel: 55,  minRole: 'ACCOUNTING',  desc: 'Run tax calculations — no write access' },
  { action: 'create_draft',  minLevel: 55,  minRole: 'ACCOUNTING',  desc: 'Create DRAFT filing records' },
  { action: 'submit',        minLevel: 60,  minRole: 'OVDS',        desc: 'Submit filings to MoR eTax portal' },
  { action: 'approve',       minLevel: 60,  minRole: 'OVDS',        desc: 'Approve a filing before eTax submission' },
  { action: 'pay',           minLevel: 60,  minRole: 'OVDS',        desc: 'Mark filings as PAID' },
  { action: 'amend',         minLevel: 100, minRole: 'ADMIN',       desc: 'Amend a previously filed return (creates audit log)' },
  { action: 'override_rate', minLevel: 190, minRole: 'SUPERADMIN',  desc: 'Override a statutory tax rate — mandatory audit trail' },
  { action: 'configure',     minLevel: 100, minRole: 'ADMIN',       desc: 'Update company tax profile and system settings' },
  { action: 'export',        minLevel: 30,  minRole: 'AUDITOR',     desc: 'Export tax reports to PDF / CSV' },
  { action: 'delete_draft',  minLevel: 55,  minRole: 'ACCOUNTING',  desc: 'Delete DRAFT (unfiled) records only' },
];

/** Canonical GL accounts for tax entries */
const GL_ACCOUNTS = [
  { code: '1130', name: 'VAT Receivable (Input VAT)',           type: 'ASSET',     nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '1131', name: 'WHT Receivable (Supplier Credit)',     type: 'ASSET',     nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '1132', name: 'Advance BIT Prepaid (Imports)',        type: 'ASSET',     nb: 'DR', ias12: 'Current Tax',    ifrs18: 'Income Tax' },
  { code: '1133', name: 'Deferred Tax Asset (IAS 12)',          type: 'ASSET',     nb: 'DR', ias12: 'Deferred Tax',  ifrs18: 'Income Tax' },
  { code: '2150', name: 'VAT Payable (Output VAT)',             type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2155', name: 'TOT Payable',                          type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2160', name: 'Income Tax Payable (BIT/CIT)',         type: 'LIABILITY', nb: 'CR', ias12: 'Current Tax',    ifrs18: 'Income Tax' },
  { code: '2161', name: 'PAYE / PIT Payable',                   type: 'LIABILITY', nb: 'CR', ias12: 'Current Tax',    ifrs18: 'Income Tax' },
  { code: '2162', name: 'WHT Payable to MoR',                   type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2163', name: 'DRRF Levy Payable',                    type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2164', name: 'Pension Payable — Employee (7%)',      type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2165', name: 'Pension Payable — Employer (11%)',     type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2166', name: 'Excise Tax Payable',                   type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2167', name: 'Stamp Duty Payable',                   type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2168', name: 'Property Tax Payable',                 type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2169', name: 'Customs Duty Payable',                 type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2170', name: 'Import Surtax / Advance BIT Payable',  type: 'LIABILITY', nb: 'CR', ias12: '—',              ifrs18: 'Operating' },
  { code: '2171', name: 'Capital Gains / Schedule D Payable',   type: 'LIABILITY', nb: 'CR', ias12: 'Current Tax',    ifrs18: 'Income Tax' },
  { code: '2175', name: 'Deferred Tax Liability (IAS 12)',      type: 'LIABILITY', nb: 'CR', ias12: 'Deferred Tax',  ifrs18: 'Income Tax' },
  { code: '5410', name: 'Excise Tax Expense (COGS)',            type: 'EXPENSE',   nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '5420', name: 'TOT Expense',                          type: 'EXPENSE',   nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '5430', name: 'DRRF Levy Expense',                    type: 'EXPENSE',   nb: 'DR', ias12: 'Not Income Tax', ifrs18: 'Operating' },
  { code: '5440', name: 'Non-Resident Service Expense',         type: 'EXPENSE',   nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '5450', name: 'Rent Expense (WHT 30%)',               type: 'EXPENSE',   nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '5460', name: 'Stamp Duty Expense',                   type: 'EXPENSE',   nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '5470', name: 'Property Tax Expense',                 type: 'EXPENSE',   nb: 'DR', ias12: '—',              ifrs18: 'Operating' },
  { code: '8100', name: 'Income Tax Expense — Current',         type: 'EXPENSE',   nb: 'DR', ias12: 'Current Tax',    ifrs18: 'Income Tax' },
  { code: '8105', name: 'Income Tax Expense — Deferred',        type: 'EXPENSE',   nb: 'DR', ias12: 'Deferred Tax',  ifrs18: 'Income Tax' },
  { code: '8110', name: 'Capital Gains / Schedule D Expense',   type: 'EXPENSE',   nb: 'DR', ias12: 'Current Tax',    ifrs18: 'Income Tax' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
      <div className="text-4xl mb-3">📋</div>
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse">
      Loading…
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Tax Rules Table
// ─────────────────────────────────────────────────────────────────────────────

function TaxRulesTab({ rules, loading }: { rules: any; loading: boolean }) {
  const [search, setSearch] = useState('');

  const entries: [string, any][] = rules
    ? Object.entries(rules).filter(([code, rule]: [string, any]) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          code.toLowerCase().includes(q) ||
          rule.name?.toLowerCase().includes(q) ||
          rule.proclamation?.toLowerCase().includes(q)
        );
      })
    : [];

  if (loading) return <LoadingState />;
  if (!rules)  return <EmptyState message="No tax rules loaded. Check backend connection." />;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search tax code, name, or proclamation…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard label="Total Tax Types" value={Object.keys(rules).length} sub="All industries" />
        <InfoCard label="Income Taxes (IAS 12)" value={Object.values(rules).filter((r: any) => r.ias12Treatment === 'CURRENT_TAX').length} sub="BIT, PIT, CGT, Advance BIT" />
        <InfoCard label="Operating Levies" value={Object.values(rules).filter((r: any) => r.ias12Treatment === 'NOT_INCOME_TAX').length} sub="VAT, WHT, DRRF, Pension…" />
        <InfoCard label="Monthly Obligations" value={Object.values(rules).filter((r: any) => r.frequency === 'MONTHLY').length} sub="Due 30th each month" />
      </div>

      {/* Rules table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-white dark:bg-slate-800/60">
            <tr>
              {['Code','Name','Rate','Threshold','Direction','IAS 12','IFRS 18','Freq.','Portal','Proclamation'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {entries.map(([code, rule]: [string, any]) => {
              const ias = IAS12_BADGE[rule.ias12Treatment] ?? IAS12_BADGE.NOT_INCOME_TAX;
              const i18 = IFRS18_BADGE[rule.ifrs18Category] ?? IFRS18_BADGE.OPERATING;
              const rateDisplay = rule.rate > 0
                ? `${(rule.rate * 100).toFixed(rule.rate < 0.01 ? 2 : 0)}%`
                : rule.specificRateEtb
                  ? `ETB ${rule.specificRateEtb}/unit`
                  : 'Variable';
              const threshDisplay = rule.thresholdEtb > 0
                ? `≥ ETB ${Number(rule.thresholdEtb).toLocaleString()}`
                : rule.annualTurnoverThresholdEtb
                  ? `< ETB ${Number(rule.annualTurnoverThresholdEtb).toLocaleString()}/yr`
                  : '—';
              return (
                <tr key={code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{code}</td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 min-w-[180px]">
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{rule.notes?.slice(0, 70)}{rule.notes?.length > 70 ? '…' : ''}</div>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{rateDisplay}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">{threshDisplay}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      rule.direction === 'OUTPUT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      rule.direction === 'INPUT'  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>{rule.direction}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><Badge label={ias.label} cls={ias.cls} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><Badge label={i18.label} cls={i18.cls} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{rule.frequency}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{rule.portal}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 dark:text-slate-500 min-w-[200px]">{rule.proclamation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Source: <code className="font-mono">packages/shared/src/ovds/universal-tax-config.ts → UNIVERSAL_TAX_RULES</code>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — Company Profile
// ─────────────────────────────────────────────────────────────────────────────

function ProfileTab({
  profile, loading, canEdit, onSave,
}: {
  profile: any; loading: boolean; canEdit: boolean;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);

  const set = (key: string, val: unknown) => {
    setForm(f => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); setDirty(false); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;
  if (!profile) return <EmptyState message="Tax profile not loaded yet." />;

  const p = { ...profile, ...form };

  const bandColor = (band: string) =>
    band === 'A' ? 'text-emerald-600 dark:text-emerald-400' :
    band === 'B' ? 'text-amber-600 dark:text-amber-400' :
                  'text-slate-500 dark:text-slate-400';

  return (
    <div className="space-y-6">
      {/* Identity strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard label="TIN"              value={p.tin      || '—'} sub="Ministry of Revenues" />
        <InfoCard label="VAT Number"       value={p.vatNumber || 'Not registered'} sub={p.isVatRegistered ? 'VAT registered' : 'Below ETB 2M threshold'} />
        <InfoCard label="AABE Framework"   value={p.aabéFramework || p.aabeFramework || '—'} sub="IFRS tier classification" />
        <InfoCard label="Sector"           value={(p.sector || '—').replace(/_/g, ' ')} sub="Ethiopian economic sector" />
      </div>

      {/* Band determination */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <SectionTitle>Tax Band Determination</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {/* VAT/TOT band */}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">VAT / TOT Compliance Band</p>
            <p className={`text-3xl font-bold ${bandColor(p.vatTotBand)}`}>{p.vatTotBand || '—'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {p.vatTotBand === 'A' ? 'VAT registered (turnover ≥ ETB 2M)' :
               p.vatTotBand === 'B' ? 'TOT — turnover ETB 500K–2M' :
               'TOT — turnover < ETB 500K'}
            </p>
          </div>
          {/* BIT schedule */}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">BIT / MAT Schedule</p>
            <p className={`text-3xl font-bold ${bandColor(p.incomeTaxSchedule)}`}>{p.incomeTaxSchedule || '—'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {p.incomeTaxSchedule === 'A' ? 'Turnover > ETB 1M — 30% flat' :
               p.incomeTaxSchedule === 'B' ? 'Turnover ETB 500K–1M — 30% / MAT' :
               'Turnover < ETB 500K — progressive brackets'}
            </p>
          </div>
          {/* Annual turnover */}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Annual Turnover (ETB)</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">
              {p.annualTurnoverEtb ? `ETB ${Number(p.annualTurnoverEtb).toLocaleString()}` : '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Used for band & MAT calculations</p>
          </div>
        </div>
      </div>

      {/* Active taxes toggle grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <SectionTitle>Active Taxes</SectionTitle>
        {(() => {
          const taxes: Record<string, boolean> =
            typeof p.taxes === 'object' && p.taxes !== null ? p.taxes :
            typeof p.activeTaxes === 'string' ? (() => { try { return JSON.parse(p.activeTaxes); } catch { return {}; } })() :
            {};
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(taxes).map(([key, active]) => (
                <div key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    active
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-500'
                  }`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span className="font-mono text-xs font-semibold">{key.replace(/([A-Z])/g, '_$1').toUpperCase()}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* IAS 12 Deferred Tax */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <SectionTitle>IAS 12 — Deferred Tax Settings</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <InfoCard label="Deferred Tax Enabled" value={p.enableDeferredTax ? '✓ Yes' : '✗ No'} sub={p.enableDeferredTax ? 'DTA/DTL computed monthly' : 'Enable for IFRS_FOR_SMES and above'} />
          <InfoCard label="Deferred Tax Rate"     value={p.deferredTaxRate ? `${(Number(p.deferredTaxRate) * 100).toFixed(0)}%` : '30%'} sub="Must match BIT rate (IAS 12.47)" />
          <InfoCard label="Materiality Threshold" value={p.materialityThresholdEtb ? `ETB ${Number(p.materialityThresholdEtb).toLocaleString()}` : '—'} sub="0.1% of annual turnover" />
          <InfoCard label="Rounding Method"       value={p.roundingMethod || 'HALF_UP'} sub="Applied to all tax amounts" />
        </div>

        {/* Pool depreciation rates */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
            Ethiopian Pool Depreciation Rates — Proc. 979/2016 Art. 25
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { cat: 'CAT 1', field: 'poolCat1',  rate: p.poolCat1  ?? p.depreciationPoolRates?.cat1 ?? 0.25, desc: 'Computers / Software / Vehicles' },
              { cat: 'CAT 2', field: 'poolCat2',  rate: p.poolCat2  ?? p.depreciationPoolRates?.cat2 ?? 0.20, desc: 'Plant & Machinery' },
              { cat: 'CAT 3', field: 'poolCat3',  rate: p.poolCat3  ?? p.depreciationPoolRates?.cat3 ?? 0.15, desc: 'Buildings Used in Business' },
              { cat: 'CAT 4', field: 'poolCat4',  rate: p.poolCat4  ?? p.depreciationPoolRates?.cat4 ?? 0.10, desc: 'Other Fixed Assets' },
            ].map(({ cat, rate, desc }) => (
              <div key={cat} className="bg-white dark:bg-slate-700/40 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{cat}</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-100">{(Number(rate) * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      {canEdit && dirty && (
        <div className="flex justify-end">
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            size="sm"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </Btn>
        </div>
      )}
      {!canEdit && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
          Editing requires ADMIN role or above.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — GL Account Map
// ─────────────────────────────────────────────────────────────────────────────

function GlAccountMapTab() {
  const groups = [
    { label: 'Asset Accounts (Tax Receivables & Prepaid)', type: 'ASSET',     cls: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800' },
    { label: 'Liability Accounts (Tax Payables)',          type: 'LIABILITY', cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' },
    { label: 'Expense Accounts (Tax Charges)',             type: 'EXPENSE',   cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Canonical GL account codes for all tax journal entries. These codes must exist in the Chart of Accounts for every company.
        Seeded automatically by <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">universal_tax_config.sql</code>.
      </p>

      {groups.map(({ label, type, cls }) => {
        const rows = GL_ACCOUNTS.filter(a => a.type === type);
        return (
          <div key={type} className={`rounded-xl border ${cls} overflow-hidden`}>
            <div className={`px-4 py-2.5 font-semibold text-sm ${cls}`}>{label}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white dark:bg-slate-800">
                <thead className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Code', 'Account Name', 'Normal Balance', 'IAS 12 Treatment', 'IFRS 18 Category'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {rows.map(a => {
                    const ias = IAS12_BADGE[
                      a.ias12 === 'Current Tax'    ? 'CURRENT_TAX'  :
                      a.ias12 === 'Deferred Tax'   ? 'DEFERRED_TAX' : 'NOT_INCOME_TAX'
                    ];
                    const i18 = IFRS18_BADGE[
                      a.ifrs18 === 'Income Tax' ? 'INCOME_TAX' :
                      a.ifrs18 === 'Financing'  ? 'FINANCING'  :
                      a.ifrs18 === 'Investing'  ? 'INVESTING'  : 'OPERATING'
                    ];
                    return (
                      <tr key={a.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">{a.code}</td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{a.name}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            a.nb === 'DR'
                              ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>{a.nb === 'DR' ? '↑ Debit' : '↑ Credit'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {a.ias12 === '—'
                            ? <span className="text-xs text-slate-400">—</span>
                            : <Badge label={ias.label} cls={ias.cls} />}
                        </td>
                        <td className="px-4 py-2.5"><Badge label={i18.label} cls={i18.cls} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* IAS 12 journal entry examples */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <SectionTitle>Standard IAS 12 Journal Entries</SectionTitle>
        <div className="space-y-3 text-sm font-mono">
          {[
            { label: 'BIT / CIT Accrual (Current Tax)',      dr: '8100 Income Tax Expense — Current', cr: '2160 Income Tax Payable',         ref: 'IAS 12.46' },
            { label: 'PAYE Payroll Deduction',               dr: '5010 Salaries & Wages',             cr: '2161 PAYE / PIT Payable',          ref: 'IAS 12 + Labour Proc.' },
            { label: 'VAT Output on Sales Invoice',          dr: '1130 Accounts Receivable',          cr: '2150 VAT Payable (Output VAT)',     ref: 'Proc. 1341/2024' },
            { label: 'Deferred Tax Asset (ECL Provision)',   dr: '1133 Deferred Tax Asset',           cr: '8105 Income Tax Expense — Deferred',ref: 'IAS 12.26 (IFRS 9 ECL)' },
            { label: 'Deferred Tax Liability (PPE Temp Diff)',dr: '8105 Income Tax Expense — Deferred',cr: '2175 Deferred Tax Liability',      ref: 'IAS 12.15 (pool depreciation)' },
            { label: 'DRRF Levy Accrual',                    dr: '5430 DRRF Levy Expense',            cr: '2163 DRRF Levy Payable',            ref: 'Reg. 570/2025 — NOT income tax' },
            { label: 'WHT Deducted from Supplier',           dr: '2162 WHT Payable to MoR',           cr: '1131 WHT Receivable',               ref: 'Proc. 1395/2025 Art. 94' },
          ].map(({ label, dr, cr, ref }) => (
            <div key={label} className="bg-white dark:bg-slate-700/40 rounded-lg p-3 space-y-1">
              <p className="font-sans text-xs font-semibold text-slate-600 dark:text-slate-300">{label} <span className="text-slate-400 font-normal">— {ref}</span></p>
              <p className="text-emerald-700 dark:text-emerald-400">Dr  {dr}</p>
              <p className="text-amber-600 dark:text-amber-300 ml-6">Cr  {cr}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4 — Filing Calendar
// ─────────────────────────────────────────────────────────────────────────────

function FilingCalendarTab({ deadlines, loading }: { deadlines: any[]; loading: boolean }) {
  if (loading) return <LoadingState />;

  const sorted = [...(deadlines ?? [])].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const overdue  = sorted.filter(d => d.overdue || d.daysUntilDue < 0);
  const upcoming = sorted.filter(d => !d.overdue && d.daysUntilDue >= 0 && d.daysUntilDue <= 14);
  const future   = sorted.filter(d => !d.overdue && d.daysUntilDue > 14);

  const DeadlineCard = ({ d }: { d: any }) => {
    const due   = new Date(d.dueDate);
    const label = due.toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' });
    const cls   = SEVERITY_CLS[d.severity] ?? SEVERITY_CLS.INFO;
    return (
      <div className={`rounded-lg p-4 ${cls} flex items-start gap-3`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{d.taxCode}</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{d.portal}</span>
          </div>
          <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-100">{label}</p>
          {d.overdue || d.daysUntilDue < 0
            ? <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">⚠ OVERDUE — {Math.abs(d.daysUntilDue)} days late</p>
            : <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Due in {d.daysUntilDue} day{d.daysUntilDue !== 1 ? 's' : ''}</p>
          }
        </div>
      </div>
    );
  };

  if (!sorted.length) {
    // Show static reference calendar when API returns nothing
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
          No upcoming deadlines returned from backend. The reference calendar below shows the standard Ethiopian filing schedule.
        </div>
        <ReferenceCalendar />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <InfoCard label="Overdue"      value={overdue.length}  sub="Requires immediate action" />
        <InfoCard label="Due ≤ 14 days" value={upcoming.length} sub="Action required soon" />
        <InfoCard label="Upcoming"     value={future.length}   sub="Next 90 days" />
      </div>

      {overdue.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>⚠ Overdue</SectionTitle>
          {overdue.map((d, i) => <DeadlineCard key={i} d={d} />)}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Due within 14 days</SectionTitle>
          {upcoming.map((d, i) => <DeadlineCard key={i} d={d} />)}
        </div>
      )}
      {future.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Coming up</SectionTitle>
          {future.map((d, i) => <DeadlineCard key={i} d={d} />)}
        </div>
      )}

      <ReferenceCalendar />
    </div>
  );
}

function ReferenceCalendar() {
  const rows = [
    { obligation: 'VAT Return',                freq: 'Monthly',   deadline: '30th of following month',     portal: 'eTax',  proc: 'Proc. 1341/2024' },
    { obligation: 'TOT Filing',                freq: 'Monthly',   deadline: '30th of following month',     portal: 'eTax',  proc: 'Proc. 1395/2025' },
    { obligation: 'WHT Remittance',            freq: 'Monthly',   deadline: '30th of following month',     portal: 'eTax',  proc: 'Proc. 1395/2025 Art. 94' },
    { obligation: 'PAYE / PIT',               freq: 'Monthly',   deadline: '30th of following month',     portal: 'eTax',  proc: 'Proc. 1395/2025 Art. 7' },
    { obligation: 'Pension (PFSA)',            freq: 'Monthly',   deadline: '30th of following month',     portal: 'PFSA',  proc: 'Proc. 715/2011' },
    { obligation: 'DRRF Quarterly Levy',       freq: 'Quarterly', deadline: '15 Dec / 15 Mar / 15 Jun / 15 Sep', portal: 'eTax', proc: 'Reg. 570/2025' },
    { obligation: 'BIT / CIT Declaration',    freq: 'Annual',    deadline: 'November 7 (4 months after EFY)', portal: 'eTax', proc: 'Proc. 979/2016' },
    { obligation: 'Excise Tax',                freq: 'Monthly',   deadline: '30 days after production / clearance', portal: 'eTax', proc: 'Proc. 1186/2020' },
    { obligation: 'Stamp Duty',                freq: 'At tx',     deadline: 'At document execution',       portal: 'eTax',  proc: 'Proc. 110/1998' },
    { obligation: 'Property Tax',              freq: 'Annual',    deadline: 'Municipal deadline',          portal: 'Muni.', proc: 'Proc. 1161/2019' },
    { obligation: 'Customs / Surtax / Adv BIT',freq: 'At clearance', deadline: 'Before goods released', portal: 'Customs', proc: 'Proc. 1265/2021' },
    { obligation: 'Schedule D (dividends…)',   freq: 'At tx',     deadline: '30 days after month-end',     portal: 'eTax',  proc: 'Proc. 1395/2025 Art. 52' },
  ];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Standard Ethiopian Filing Calendar</p>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-700/50">
            {['Tax Obligation', 'Frequency', 'Deadline', 'Portal', 'Proclamation'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {rows.map(r => (
            <tr key={r.obligation} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{r.obligation}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  r.freq === 'Monthly'     ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' :
                  r.freq === 'Quarterly'   ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                  r.freq === 'Annual'      ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>{r.freq}</span>
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs">{r.deadline}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">{r.portal}</td>
              <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{r.proc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 5 — Compliance Health
// ─────────────────────────────────────────────────────────────────────────────

function ComplianceHealthTab({ health, loading }: { health: any; loading: boolean }) {
  if (loading) return <LoadingState />;
  if (!health) return <EmptyState message="Compliance health data not available." />;

  const score     = health.complianceScore ?? 0;
  const scoreColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                     score >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                   'text-rose-600 dark:text-rose-400';
  const checks: any[] = health.checks ?? [];

  return (
    <div className="space-y-6">
      {/* Score + profile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Compliance Score</p>
          <p className={`text-5xl font-extrabold ${scoreColor}`}>{score}<span className="text-xl">%</span></p>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <InfoCard label="Sector"           value={(health.profile?.sector || '—').replace(/_/g, ' ')} sub="Exemptions applied" />
        <InfoCard label="AABE Framework"   value={health.profile?.aabéFramework || health.profile?.aabeFramework || '—'} sub="Reporting tier" />
        <InfoCard label="Overdue Filings"  value={health.overdueCount ?? 0} sub={health.overdueCount > 0 ? '⚠ Action required' : '✓ All current'} />
      </div>

      {/* Checks table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filing Status by Tax Type</p>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              {['Tax Code', 'Obligation', 'Applicable?', 'Status', 'Period', 'Due Date'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {checks.map((c: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">{c.taxCode}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{c.label}</td>
                <td className="px-4 py-2.5">
                  {c.applicable
                    ? <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓ Yes</span>
                    : <span className="text-slate-400 text-xs">N/A</span>}
                </td>
                <td className="px-4 py-2.5 font-semibold text-sm">
                  <span className={STATUS_CLS[c.status] ?? 'text-slate-500'}>{c.status}</span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">{c.period || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">
                  {c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upcoming deadlines preview */}
      {health.upcomingDeadlines?.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Upcoming Deadlines (next 90 days)</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-2">
            {health.upcomingDeadlines.slice(0, 6).map((d: any, i: number) => (
              <div key={i} className={`rounded-lg p-3 ${SEVERITY_CLS[d.severity] ?? SEVERITY_CLS.INFO} flex items-center justify-between`}>
                <div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{d.taxCode}</span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">{d.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-4 whitespace-nowrap">
                  {d.daysUntilDue < 0 ? `${Math.abs(d.daysUntilDue)}d overdue` : `${d.daysUntilDue}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 6 — Sector Overrides
// ─────────────────────────────────────────────────────────────────────────────

function SectorOverridesTab() {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  const displaySectors = selectedSector === 'ALL'
    ? Object.keys(SECTOR_EXEMPTIONS)
    : Object.keys(SECTOR_EXEMPTIONS).filter(s => s === selectedSector);

  const allHaveExemptions = new Set(Object.keys(SECTOR_EXEMPTIONS));

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Sector-specific exemptions applied on top of the universal rates. All other sectors receive the full universal rates with no modification.
      </p>

      {/* Sector filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSector('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedSector === 'ALL'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}>
          All Sectors
        </button>
        {ET_SECTORS.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSector(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedSector === s
                ? 'bg-emerald-600 text-white'
                : allHaveExemptions.has(s)
                  ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/40'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}>
            {s.replace(/_/g, ' ')}
            {allHaveExemptions.has(s) && <span className="ml-1">⚡</span>}
          </button>
        ))}
      </div>

      {/* Exemption cards */}
      {displaySectors.map(sector => {
        const exs = SECTOR_EXEMPTIONS[sector] ?? [];
        return (
          <div key={sector} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">{sector.replace(/_/g, ' ')}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{exs.length} exemption{exs.length !== 1 ? 's' : ''} — universal rates apply to all other taxes</p>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/50">
                <tr>
                  {['Tax Code', 'Exempt?', 'Condition', 'Legal Authority'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {exs.map((ex, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">{ex.taxCode}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">EXEMPT</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{ex.condition}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{ex.authority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Sectors with no overrides */}
      {(selectedSector === 'ALL' || !allHaveExemptions.has(selectedSector)) && (
        <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">Sectors with no overrides — full universal rates apply:</p>
          <div className="flex flex-wrap gap-2">
            {ET_SECTORS.filter(s => !allHaveExemptions.has(s)).map(s => (
              <span key={s} className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-600 dark:text-slate-300">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 7 — RBAC Matrix
// ─────────────────────────────────────────────────────────────────────────────

function RbacMatrixTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Minimum role level required per tax action. Matches <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">TAX_RBAC_MATRIX</code> in <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">universal-tax-config.ts</code>.
        The ROLE_HIERARCHY in <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">rbac.ts</code> governs enforcement.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {['Action', 'Min. Level', 'Min. Role', 'Description'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {RBAC_ROWS.map(row => (
              <tr key={row.action} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{row.action}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    row.minLevel >= 150 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                    row.minLevel >= 100 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                    row.minLevel >= 55  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    {row.minLevel}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    row.minLevel >= 190 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' :
                    row.minLevel >= 100 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                    row.minLevel >= 55  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  }`}>{row.minRole}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs">{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Segregation of duties note */}
      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 text-sm text-violet-800 dark:text-violet-300 space-y-1">
        <p className="font-semibold">Segregation of Duties (IAS 1 / Ethiopian Commercial Code)</p>
        <ul className="list-disc list-inside text-xs space-y-0.5 text-violet-700 dark:text-violet-400">
          <li>The same user must NOT both <strong>create_draft</strong> AND <strong>submit</strong> a VAT or BIT filing.</li>
          <li>Rate <strong>override_rate</strong> is SUPERADMIN-only and always creates an immutable audit log entry.</li>
          <li>EXTERNAL_AUDITOR role receives <strong>view</strong> + <strong>export</strong> only — no write access.</li>
          <li>DATA_CLERK (level 8) is explicitly excluded from all tax actions — ovds data only.</li>
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function UniversalTaxConfig() {
  usePageTitle('Universal Tax Configuration');
  const { user }  = useAuth();
  const [tab, setTab]   = useState<TabId>('rules');

  const canEdit = rbac.can((user?.role ?? 'EMPLOYEE') as any, 'settings:write');

  const { rules,    loading: rulesLoading }   = useUniversalTaxRules();
  const { profile,  loading: profileLoading } = useCompanyTaxProfile();
  const { health,   loading: healthLoading }  = useComplianceHealth();
  const { deadlines,loading: deadlinesLoading } = useFilingDeadlines();

  const handleSaveProfile = useCallback(async (updates: Record<string, unknown>) => {
    await updateCompanyTaxProfile(updates);
    toast.success('Tax profile saved');
  }, []);

  return (
    <AppPage
      title="Universal Tax Configuration"
      subtitle="Canonical Ethiopian tax rules, GL mappings, IAS 12 treatments, RBAC, and company filing profile — all industries"
      icon="SHIELD_CHECK"
      crumbs={[{ label: 'System Administration' }, { label: 'Universal Tax Config' }]}
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/docs/06-tax-compliance/universal-tax-configuration.md"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon name="FILE_TEXT" size={13} />
            Docs
          </a>
        </div>
      }
    >
      {/* Compliance health banner */}
      {!healthLoading && health && health.complianceScore < 80 && (
        <div className={`mb-4 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          health.complianceScore < 50
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}>
          <Icon name="WARNING" size={15} />
          Compliance score: {health.complianceScore}%
          {health.overdueCount > 0 && ` — ${health.overdueCount} overdue filing${health.overdueCount !== 1 ? 's' : ''}`}
          . Review the Compliance Health tab.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200 dark:border-slate-700 pb-0 -mb-px">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t.id
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Icon name={t.icon as any} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="min-h-96">
        {tab === 'rules'    && <TaxRulesTab      rules={rules}        loading={rulesLoading}    />}
        {tab === 'profile'  && <ProfileTab       profile={profile}    loading={profileLoading}   canEdit={canEdit} onSave={handleSaveProfile} />}
        {tab === 'gl'       && <GlAccountMapTab  />}
        {tab === 'calendar' && <FilingCalendarTab deadlines={deadlines} loading={deadlinesLoading} />}
        {tab === 'health'   && <ComplianceHealthTab health={health}    loading={healthLoading}   />}
        {tab === 'sectors'  && <SectorOverridesTab />}
        {tab === 'rbac'     && <RbacMatrixTab    />}
      </div>
    </AppPage>
  );
}
