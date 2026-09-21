/**
 * CentralControlPanelContent — unified settings hub for Ovds SaaS
 *
 * Ovds SaaS sidebar-driven layout. All configuration sections
 * are accessible from one place: Company, Localization, Financial, Invoice,
 * Defaults, Currencies, Email/SMTP, Taxes, Users & Access, Modules, Developers.
 *
 * This is a thick feature-lib component. The app shell (Settings.tsx) is thin.
 * Data: orpc.settings.profile.* via TanStack Query through @ovds/features/settings hooks.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Globe, DollarSign, Receipt, Layers, FileText,
  Mail, Save, RefreshCw, CheckCircle2, AlertCircle, ArrowRight,
  Wallet, UserCog, Shield, Code, Settings as SettingsIcon,
  ChevronDown, Eye, EyeOff, ExternalLink, Plug,
  Users, Lock, KeyRound, ShieldCheck, LogIn, ClipboardList,
  Network, UserPlus, ChevronRight, Palette, LayoutTemplate,
  Sparkles, Wand2, Type, AlignLeft, Columns, StickyNote, Hash,
  CreditCard,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SettingsSection =
  | 'profile' | 'localization' | 'financial' | 'invoice'
  | 'defaults' | 'currency' | 'email' | 'taxes'
  | 'users' | 'modules' | 'developers' | 'integrations';

interface FieldRowProps {
  label: string;
  hint?: string;
  required?: boolean;
  source?: string;
  children: React.ReactNode;
}

interface SectionMeta {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
  group: 'general' | 'advanced' | 'system';
}


// ── Section metadata ──────────────────────────────────────────────────────────

export const SETTINGS_SECTIONS: SectionMeta[] = [
  // General
  { id: 'profile',      label: 'Company',        icon: <Building2 size={14} />,  description: 'Business identity & contacts', group: 'general' },
  { id: 'localization', label: 'Localization',   icon: <Globe size={14} />,      description: 'Language, timezone & format',  group: 'general' },
  { id: 'financial',    label: 'Financial',      icon: <DollarSign size={14} />, description: 'Currency & fiscal calendar',   group: 'general' },
  { id: 'invoice',      label: 'Invoice',        icon: <FileText size={14} />,   description: 'Templates, prefixes & QR',     group: 'general' },
  { id: 'defaults',     label: 'Defaults',       icon: <Wallet size={14} />,     description: 'Bank, payment & tax defaults', group: 'general' },
  // Advanced
  { id: 'currency',     label: 'Currencies',     icon: <DollarSign size={14} />, description: 'Base currency & exchange rates', group: 'advanced' },
  { id: 'email',        label: 'Email & SMTP',   icon: <Mail size={14} />,       description: 'Outgoing mail & SMTP config',  group: 'advanced' },
  { id: 'taxes',        label: 'Tax Rules',      icon: <Receipt size={14} />,    description: 'VAT, TOT, WHT, BIT & DRRF',   group: 'advanced' },
  { id: 'users',        label: 'Users & Access', icon: <UserCog size={14} />,    description: 'Roles, portals & security',    group: 'advanced' },
  // System
  { id: 'modules',      label: 'Modules',        icon: <Layers size={14} />,     description: 'Enable / disable modules',     group: 'system' },
  { id: 'developers',   label: 'Developers',     icon: <Code size={14} />,       description: '.env, API keys & webhooks',    group: 'system' },
  { id: 'integrations', label: 'Integrations',   icon: <Plug size={14} />,       description: 'AI, SIEM & third-party keys',  group: 'system' },
];

const GROUP_LABELS: Record<string, string> = {
  general: 'General',
  advanced: 'Advanced',
  system: 'System',
};

// ── Shared primitives ─────────────────────────────────────────────────────────

function FieldRow({ label, hint, required, source, children }: FieldRowProps) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
          </p>
          {source && <SourceBadge source={source} />}
        </div>
        {hint && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputCls = 'ovds-input w-full max-w-xs';

function TI({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input className={inputCls} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function SI({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="relative max-w-xs">
      <select className={inputCls + ' appearance-none pr-8'} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const checked = value === 'true';
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(checked ? 'false' : 'true')}
        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    </label>
  );
}

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative max-w-xs">
      <input className={inputCls + ' pr-10'} type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete="new-password" />
      <button type="button" onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    'company-kv': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
    'global-kv': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800',
    'module-defaults': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800',
    'definition': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    'legacy': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
    'hardcoded': 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };
  const labels: Record<string, string> = {
    'company-kv': 'Company',
    'global-kv': 'Global',
    'module-defaults': 'Module',
    'definition': 'Default',
    'legacy': 'Legacy',
    'hardcoded': 'Hardcoded',
  };
  const color = colors[source] || colors['hardcoded'];
  const label = labels[source] || source;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${color}`}>{label}</span>
  );
}


// ── Currency options (shared) ─────────────────────────────────────────────────

const CURRENCY_OPTS = [
  { label: 'ETB — Ethiopian Birr', value: 'ETB' },
  { label: 'USD — US Dollar',      value: 'USD' },
  { label: 'EUR — Euro',           value: 'EUR' },
  { label: 'GBP — British Pound',  value: 'GBP' },
  { label: 'SAR — Saudi Riyal',    value: 'SAR' },
  { label: 'AED — UAE Dirham',     value: 'AED' },
  { label: 'KES — Kenyan Shilling',value: 'KES' },
];

// ── Section forms ─────────────────────────────────────────────────────────────

function ProfileSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        Update your business trading name, contacts, and corporate logo used across all external customer-facing paperwork.
      </p>
      <FieldRow label="Company Name" hint="Legal trade name registered with ERCA" required source={src('companyName')}><TI {...f('companyName')} placeholder="e.g. Acme Trading PLC" /></FieldRow>
      <FieldRow label="TIN" hint="10-digit Ethiopian Taxpayer ID" source={src('companyTin')}><TI {...f('companyTin')} placeholder="0000000000" /></FieldRow>
      <FieldRow label="VAT Registration No." hint="ERCA-issued VAT registration number" source={src('companyVatNumber')}><TI {...f('companyVatNumber')} placeholder="ETR-XXXX" /></FieldRow>
      <FieldRow label="Business Email" source={src('companyEmail')}><TI {...f('companyEmail')} placeholder="accounts@company.com" type="email" /></FieldRow>
      <FieldRow label="Phone" source={src('companyPhone')}><TI {...f('companyPhone')} placeholder="+251 911 000 000" /></FieldRow>
      <FieldRow label="Address" source={src('companyAddress')}><TI {...f('companyAddress')} placeholder="Addis Ababa, Ethiopia" /></FieldRow>
      <FieldRow label="Business Type" source={src('companyBusinessType')}>
        <SI {...f('companyBusinessType')} options={[
          { label: 'Private Limited Company (PLC)', value: 'PLC' },
          { label: 'One Member PLC',                value: 'ONE_MEMBER_PLC' },
          { label: 'Share Company',                 value: 'SHARE_COMPANY' },
          { label: 'Sole Proprietorship',           value: 'SOLE_PROPRIETORSHIP' },
          { label: 'Non-Profit / NGO',              value: 'NGO' },
          { label: 'Government Entity',             value: 'GOVERNMENT' },
        ]} />
      </FieldRow>
      <FieldRow label="Company Logo URL" hint="Direct URL to your logo image (HTTPS)" source={src('companyLogoUrl')}>
        <TI {...f('companyLogoUrl')} placeholder="https://cdn.example.com/logo.png" />
      </FieldRow>
    </div>
  );
}

function LocalizationSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        Establish your operational region by defining the primary language, local timezone, data sorting, and fiscal year calendar.
      </p>
      <FieldRow label="Language" source={src('language')}>
        <SI {...f('language')} options={[
          { label: 'English',              value: 'en' },
          { label: 'አማርኛ (Amharic)',      value: 'am' },
          { label: 'ትግርኛ (Tigrinya)',     value: 'ti' },
        ]} />
      </FieldRow>
      <FieldRow label="Timezone" source={src('timezone')}>
        <SI {...f('timezone')} options={[
          { label: 'Addis Ababa (EAT, UTC+3)', value: 'Africa/Addis_Ababa' },
          { label: 'Nairobi (EAT, UTC+3)',     value: 'Africa/Nairobi' },
          { label: 'Dubai (GST, UTC+4)',        value: 'Asia/Dubai' },
          { label: 'UTC',                       value: 'UTC' },
        ]} />
      </FieldRow>
      <FieldRow label="Date Format" source={src('dateFormat')}>
        <SI {...f('dateFormat')} options={[
          { label: 'DD/MM/YYYY', value: 'd/m/Y' },
          { label: 'YYYY-MM-DD', value: 'Y-m-d' },
          { label: 'MM/DD/YYYY', value: 'm/d/Y' },
          { label: 'DD-MMM-YYYY', value: 'd-M-Y' },
        ]} />
      </FieldRow>
      <FieldRow label="Decimal Separator" source={src('decimalSeparator')}>
        <SI {...f('decimalSeparator')} options={[
          { label: 'Dot — 1,000.00',  value: '.' },
          { label: 'Comma — 1.000,00', value: ',' },
        ]} />
      </FieldRow>
      <FieldRow label="Thousands Separator" source={src('thousandsSeparator')}>
        <SI {...f('thousandsSeparator')} options={[
          { label: 'Comma — 1,000', value: ',' },
          { label: 'Dot — 1.000',   value: '.' },
          { label: 'Space — 1 000', value: ' ' },
        ]} />
      </FieldRow>
    </div>
  );
}


function FinancialSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        Set your base currency, fiscal year start month, and reporting preferences. Ethiopian Fiscal Year (EFY) starts in Hamle (July).
      </p>
      <FieldRow label="Default Currency" hint="Anchors all internal ledger math" source={src('defaultCurrency')}>
        <SI {...f('defaultCurrency')} options={CURRENCY_OPTS} />
      </FieldRow>
      <FieldRow label="Currency Position" source={src('currencyPosition')}>
        <SI {...f('currencyPosition')} options={[
          { label: 'Before amount — ETB 1,000', value: 'before' },
          { label: 'After amount — 1,000 ETB',  value: 'after' },
        ]} />
      </FieldRow>
      <FieldRow label="Fiscal Year Start" hint="Month the fiscal year begins (default: July = 7 for EFY)" source={src('fiscalYearStart')}>
        <SI {...f('fiscalYearStart')} options={months.map((m, i) => ({ label: `${m} (${i+1})`, value: String(i+1) }))} />
      </FieldRow>
      <FieldRow label="Report Currency" source={src('reportCurrency')}>
        <SI {...f('reportCurrency')} options={CURRENCY_OPTS.slice(0, 3)} />
      </FieldRow>
    </div>
  );
}

// ── Invoice color swatches ────────────────────────────────────────────────────
const INVOICE_COLORS = [
  { name: 'Emerald',  value: '#10B981' },
  { name: 'Azure',    value: '#2563EB' },
  { name: 'Indigo',   value: '#4F46E5' },
  { name: 'Violet',   value: '#7C3AED' },
  { name: 'Rose',     value: '#E11D48' },
  { name: 'Amber',    value: '#D97706' },
  { name: 'Teal',     value: '#0D9488' },
  { name: 'Slate',    value: '#475569' },
];

function InvoiceSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };

  const selectedColor = data['invoiceThemeColor'] || '#10B981';

  return (
    <div className="space-y-0">
      {/* ── Description ─────────────────────────────────────────────────── */}
      <p className="text-xs text-slate-500 mb-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 leading-relaxed">
        Configure invoice numbering, default payment terms, color theme, content visibility, and footer text.
        For advanced drag-and-drop template design, use the{' '}
        <Link to="/apps/invoice-templates" className="font-semibold text-[var(--pro-azure)] hover:underline inline-flex items-center gap-0.5">
          Print-ready Invoice Template App <ExternalLink size={10} />
        </Link>.
      </p>

      {/* ── Sub-section: Numbering ───────────────────────────────────────── */}
      <div className="mb-1">
        <div className="flex items-center gap-2 py-2 mb-1">
          <Hash size={13} className="text-slate-400 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Numbering</p>
        </div>
        <FieldRow label="Invoice Prefix" hint="Custom prefix for invoice document numbers (e.g. INV-, RCPT-, PFI-)" required source={src('invoicePrefix')}>
          <TI {...f('invoicePrefix')} placeholder="INV-" />
        </FieldRow>
        <FieldRow label="Next Invoice Number" hint="Next sequential number to assign — auto-increments on every new invoice" source={src('invoiceNextNumber')}>
          <TI {...f('invoiceNextNumber')} placeholder="1001" />
        </FieldRow>
        <FieldRow label="Estimate Prefix" hint="Prefix for estimate / proforma documents" source={src('estimatePrefix')}>
          <TI {...f('estimatePrefix')} placeholder="EST-" />
        </FieldRow>
      </div>

      {/* ── Sub-section: Appearance ──────────────────────────────────────── */}
      <div className="mb-1 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 py-2 mb-1">
          <Palette size={13} className="text-slate-400 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Appearance</p>
        </div>
        <FieldRow label="Default Document Title" hint="Printed at the top of every invoice PDF" source={src('invoiceDefaultTitle')}>
          <SI {...f('invoiceDefaultTitle')} options={[
            { label: 'TAX INVOICE',      value: 'TAX INVOICE' },
            { label: 'INVOICE',          value: 'INVOICE' },
            { label: 'PROFORMA INVOICE', value: 'PROFORMA INVOICE' },
            { label: 'RECEIPT',          value: 'RECEIPT' },
            { label: 'CREDIT NOTE',      value: 'CREDIT NOTE' },
            { label: 'DEBIT NOTE',       value: 'DEBIT NOTE' },
          ]} />
        </FieldRow>
        <FieldRow label="PDF Layout Template" hint="Base layout used when generating invoice PDFs" source={src('invoiceTemplate')}>
          <SI {...f('invoiceTemplate')} options={[
            { label: 'Simple — clean single-column',      value: 'simple' },
            { label: 'Modern — two-column with sidebar',  value: 'modern' },
            { label: 'Detailed — full IFRS/ERCA fields',  value: 'detailed' },
            { label: 'Compact — condensed for reprints',  value: 'compact' },
          ]} />
        </FieldRow>
        <FieldRow label="Template Color Theme" hint="Accent color used for headers, borders, and totals row in the PDF" source={src('invoiceThemeColor')}>
          <div className="flex flex-wrap gap-2 items-center">
            {INVOICE_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => onChange('invoiceThemeColor', c.value)}
                className="w-7 h-7 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400"
                style={{
                  background: c.value,
                  borderColor: selectedColor === c.value ? '#111827' : 'transparent',
                  transform: selectedColor === c.value ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: selectedColor === c.value ? `0 0 0 1px white, 0 0 0 3px ${c.value}` : 'none',
                }}
                aria-pressed={selectedColor === c.value}
                aria-label={`Color: ${c.name}`}
              />
            ))}
            {/* Custom hex input */}
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600" style={{ background: selectedColor }} />
              <input
                type="text"
                maxLength={7}
                value={selectedColor}
                onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange('invoiceThemeColor', e.target.value)}
                className="ovds-input w-20 text-xs font-mono"
                placeholder="#10B981"
                aria-label="Custom color hex"
              />
            </div>
          </div>
        </FieldRow>
      </div>

      {/* ── Sub-section: Default Payment Terms ──────────────────────────── */}
      <div className="mb-1 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 py-2 mb-1">
          <CreditCard size={13} className="text-slate-400 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Payment Terms</p>
        </div>
        <FieldRow label="Default Payment Terms" hint="Pre-selected on every new invoice — can be changed per-invoice" source={src('invoiceDefaultPaymentTerms')}>
          <SI {...f('invoiceDefaultPaymentTerms')} options={[
            { label: 'Due Immediately',  value: 'IMMEDIATE' },
            { label: 'Net 7 days',       value: 'NET7' },
            { label: 'Net 15 days',      value: 'NET15' },
            { label: 'Net 30 days',      value: 'NET30' },
            { label: 'Net 60 days',      value: 'NET60' },
            { label: 'Net 90 days',      value: 'NET90' },
          ]} />
        </FieldRow>
        <FieldRow label="Due Days (override)" hint="Exact number of days — overrides the terms selection above if set" source={src('invoiceDueDays')}>
          <TI {...f('invoiceDueDays')} placeholder="30" />
        </FieldRow>
        <FieldRow label="Reminder Days" hint="Days after due date to automatically send a payment reminder" source={src('invoiceReminderDays')}>
          <TI {...f('invoiceReminderDays')} placeholder="7" />
        </FieldRow>
      </div>

      {/* ── Sub-section: Content Toggles ─────────────────────────────────── */}
      <div className="mb-1 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 py-2 mb-1">
          <Eye size={13} className="text-slate-400 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Content Visibility</p>
        </div>
        <p className="text-xs text-slate-400 mb-3 ml-0.5 leading-relaxed">
          Control which fields and sections appear on every generated invoice PDF. These are global defaults — individual invoices can still override them.
        </p>
        <FieldRow label="Item Descriptions" hint="Show the free-text description line beneath each line item name" source={src('invoiceShowItemDesc')}>
          <Toggle {...f('invoiceShowItemDesc')} label="Show item descriptions on PDF" />
        </FieldRow>
        <FieldRow label="Unit Prices & Amounts" hint="Show the unit price, quantity, and per-line net amount columns" source={src('invoiceShowAmounts')}>
          <Toggle {...f('invoiceShowAmounts')} label="Show amounts and unit prices" />
        </FieldRow>
        <FieldRow label="Discount Column" hint="Show the discount column in the line items table when discounts are applied" source={src('invoiceShowDiscountCol')}>
          <Toggle {...f('invoiceShowDiscountCol')} label="Show discount column" />
        </FieldRow>
        <FieldRow label="Tax / VAT Column" hint="Show the per-line VAT rate and amount column" source={src('invoiceShowTaxCol')}>
          <Toggle {...f('invoiceShowTaxCol')} label="Show tax / VAT column" />
        </FieldRow>
        <FieldRow label="Custom Columns" hint="Show any additional custom columns added via the Invoice Template App" source={src('invoiceShowCustomColumns')}>
          <Toggle {...f('invoiceShowCustomColumns')} label="Show custom columns" />
        </FieldRow>
        <FieldRow label="Customer Notes" hint="Show the 'Notes to Customer' block on the PDF" source={src('invoiceShowNotes')}>
          <Toggle {...f('invoiceShowNotes')} label="Show customer notes section" />
        </FieldRow>
        <FieldRow label="Footer / Terms" hint="Show the footer text and payment terms block at the bottom of the PDF" source={src('invoiceShowFooter')}>
          <Toggle {...f('invoiceShowFooter')} label="Show footer and terms section" />
        </FieldRow>
        <FieldRow label="Show MoR Tax QR Code" hint="Print the NBE-IQR QR code for ERCA e-Tax verification" source={src('invoiceShowQr')}>
          <Toggle {...f('invoiceShowQr')} label="Print QR code on invoice" />
        </FieldRow>
        <FieldRow label="Show Company Logo" hint="Display your company logo from the Company profile section" source={src('invoiceShowLogo')}>
          <Toggle {...f('invoiceShowLogo')} label="Display company logo on PDF" />
        </FieldRow>
        <FieldRow label="Show Bank Details" hint="Print bank account and payment instructions in the footer" source={src('invoiceShowBankDetails')}>
          <Toggle {...f('invoiceShowBankDetails')} label="Print bank details on invoice" />
        </FieldRow>
      </div>

      {/* ── Sub-section: Footer ──────────────────────────────────────────── */}
      <div className="mb-1 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 py-2 mb-1">
          <AlignLeft size={13} className="text-slate-400 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Footer</p>
        </div>
        <FieldRow label="Default Footer Terms" hint="Printed at the bottom of every invoice PDF; supports plain text" source={src('invoiceFooter')}>
          <textarea className="ovds-input w-full max-w-lg" rows={3}
            value={data['invoiceFooter'] ?? ''} onChange={e => onChange('invoiceFooter', e.target.value)}
            placeholder="Payment is due within 30 days. Late payments attract 15% p.a. interest. Thank you for your business." />
        </FieldRow>
      </div>

      {/* ── Print-ready Invoice Template App upsell ──────────────────────── */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                <Wand2 size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-violet-900 dark:text-violet-200">Print-ready Invoice Template App</p>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-violet-600 text-white">App</span>
                </div>
                <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed max-w-sm">
                  Visually design invoice layouts with a drag-and-drop builder — no coding required. Add custom backgrounds, unlimited custom fields, and multiple distinct template designs for PDF printing and sharing.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {[
                    { icon: <LayoutTemplate size={11} />, text: 'Drag-and-drop layout editor with live preview' },
                    { icon: <Columns size={11} />,        text: 'Unlimited custom fields and column definitions' },
                    { icon: <Sparkles size={11} />,       text: 'Multiple distinct templates — switch per invoice' },
                    { icon: <Type size={11} />,           text: 'Add your logo, business details, and payment terms' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-violet-700 dark:text-violet-300">
                      <span className="text-violet-500 shrink-0">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Link
              to="/apps/invoice-templates"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-violet-500/30"
            >
              <Wand2 size={13} /> Open Template Builder
            </Link>
            <a
              href="https://ovds.com/apps/invoice-template"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
            >
              Learn more <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultsSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        Pre-set common base parameters — default bank account, payment methods, and tax rates — to maximize data entry speed.
      </p>
      <FieldRow label="Default Bank Account" hint="Primary bank account for new invoices and payments" source={src('defaultBankAccount')}>
        <TI {...f('defaultBankAccount')} placeholder="e.g. CBE-1234567890" />
      </FieldRow>
      <FieldRow label="Default Payment Method" source={src('defaultPaymentMethod')}>
        <SI {...f('defaultPaymentMethod')} options={[
          { label: 'Cash',          value: 'cash' },
          { label: 'Bank Transfer', value: 'bank_transfer' },
          { label: 'Telebirr',      value: 'telebirr' },
          { label: 'CBE Birr',      value: 'cbe_birr' },
          { label: 'Check',         value: 'check' },
        ]} />
      </FieldRow>
      <FieldRow label="Default Tax Rate (%)" hint="Default tax rate applied to new line items" source={src('defaultTaxRate')}>
        <TI {...f('defaultTaxRate')} placeholder="15" />
      </FieldRow>
      <FieldRow label="Default Invoice Due Days" source={src('defaultInvoiceDueDays')}><TI {...f('defaultInvoiceDueDays')} placeholder="30" /></FieldRow>
      <FieldRow label="Default Invoice Reminder Days" source={src('defaultInvoiceReminderDays')}><TI {...f('defaultInvoiceReminderDays')} placeholder="7" /></FieldRow>
      <FieldRow label="Default Currency" source={src('defaultCurrency')}>
        <SI {...f('defaultCurrency')} options={CURRENCY_OPTS} />
      </FieldRow>
    </div>
  );
}


function CurrencySection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5">
        This framework dictates how the ledger handles foreign transactions. Establish a single Base Currency that anchors all internal ledger math, and optionally automate daily exchange rate updates.
      </p>
      <FieldRow label="Base Currency" hint="Single target currency that anchors all ledger math" source={src('defaultCurrency')}>
        <SI {...f('defaultCurrency')} options={CURRENCY_OPTS} />
      </FieldRow>
      <FieldRow label="Currency Symbol Position" source={src('currencyPosition')}>
        <SI {...f('currencyPosition')} options={[
          { label: 'Before amount — ETB 1,000', value: 'before' },
          { label: 'After amount — 1,000 ETB',  value: 'after' },
        ]} />
      </FieldRow>
      <FieldRow label="Exchange Rate Provider" hint="Source for automatic rate calculations" source={src('currencyRateProvider')}>
        <SI {...f('currencyRateProvider')} options={[
          { label: 'Manual entry',                 value: 'manual' },
          { label: 'National Bank of Ethiopia (NBE)', value: 'nbe' },
          { label: 'Open Exchange Rates',           value: 'openexchangerates' },
          { label: 'Fixer.io',                      value: 'fixer' },
        ]} />
      </FieldRow>
      <FieldRow label="Auto-update Rates" hint="Fetch rates automatically daily to calculate realized FX gains/losses" source={src('currencyAutoUpdate')}>
        <Toggle {...f('currencyAutoUpdate')} label="Enable daily automatic rate updates" />
      </FieldRow>
      <FieldRow label="Report Currency" hint="Currency for financial reports and statements" source={src('reportCurrency')}>
        <SI {...f('reportCurrency')} options={CURRENCY_OPTS.slice(0, 3)} />
      </FieldRow>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Link to="/banking/fx-rates"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <DollarSign size={14} /> Manage Exchange Rates
        </Link>
        <p className="text-xs text-slate-400 mt-2">View and update daily exchange rates, fetch live NBE rates, and convert amounts.</p>
      </div>
    </div>
  );
}

function EmailSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5">
        Configure your outgoing mail server so invoices, reminders, and alerts are delivered reliably. Toggle between standard PHP mail or external SMTP connections.
      </p>
      <FieldRow label="Mail Engine" hint="Method used to route outgoing emails" source={src('mailEngine')}>
        <SI {...f('mailEngine')} options={[
          { label: 'SMTP (recommended)', value: 'smtp' },
          { label: 'PHP Mail',           value: 'php_mail' },
          { label: 'Mailgun',            value: 'mailgun' },
          { label: 'SendGrid',           value: 'sendgrid' },
        ]} />
      </FieldRow>
      <FieldRow label="SMTP Host" hint="e.g., smtp.gmail.com or smtp.mailtrap.io" source={src('smtpHost')}>
        <TI {...f('smtpHost')} placeholder="smtp.mailtrap.io" />
      </FieldRow>
      <FieldRow label="SMTP Port" hint="587 for TLS (recommended), 465 for SSL" source={src('smtpPort')}>
        <TI {...f('smtpPort')} placeholder="587" />
      </FieldRow>
      <FieldRow label="Encryption Protocol" source={src('smtpEncryption')}>
        <SI {...f('smtpEncryption')} options={[
          { label: 'TLS (recommended)', value: 'tls' },
          { label: 'SSL',              value: 'ssl' },
          { label: 'None',             value: 'none' },
        ]} />
      </FieldRow>
      <FieldRow label="SMTP Username" hint="Your SMTP authentication username" source={src('smtpUsername')}>
        <TI {...f('smtpUsername')} placeholder="user@example.com" />
      </FieldRow>
      <FieldRow label="SMTP Password" hint="Your SMTP authentication password" source={src('smtpPassword')}>
        <PasswordField {...f('smtpPassword')} placeholder="••••••••" />
      </FieldRow>
      <FieldRow label="From Name" hint="Display name in outgoing emails" source={src('mailFromName')}>
        <TI {...f('mailFromName')} placeholder="OVDS" />
      </FieldRow>
      <FieldRow label="From Address" hint="Email address used as the sender" source={src('mailFromAddress')}>
        <TI {...f('mailFromAddress')} placeholder="noreply@ovds.com.et" type="email" />
      </FieldRow>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Link to="/admin/notifications-settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Mail size={14} /> Advanced Notification Settings <ExternalLink size={12} />
        </Link>
        <p className="text-xs text-slate-400 mt-2">Configure templates, campaigns, Slack, and Intercom integrations.</p>
      </div>
    </div>
  );
}


function TaxSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5">
        Ethiopian tax rates are governed by Proclamation No. 1395/2025. Consult MoR / ERCA before changing any rates. All taxes integrate with EIMS for MoR compliance.
      </p>
      <FieldRow label="VAT (Value Added Tax)" source={src('vatEnabled')}><Toggle {...f('vatEnabled')} label="15% on taxable goods and services" /></FieldRow>
      <FieldRow label="VAT Rate (%)" hint="Standard statutory rate is 15%" source={src('vatRate')}><TI {...f('vatRate')} placeholder="15" /></FieldRow>
      <FieldRow label="TOT (Turnover Tax)" source={src('totEnabled')}><Toggle {...f('totEnabled')} label="2% for below-VAT-threshold businesses" /></FieldRow>
      <FieldRow label="WHT (Withholding Tax)" source={src('whtEnabled')}><Toggle {...f('whtEnabled')} label="3% on qualifying service payments" /></FieldRow>
      <FieldRow label="WHT Rate (%)" hint="Standard: 2% on goods, 3% on services (Proc. 1395/2025 Art. 52). Check MoR ruling for your transaction type." source={src('whtRate')}><TI {...f('whtRate')} placeholder="2" /></FieldRow>
      <FieldRow label="BIT (Business Income Tax)" source={src('bitEnabled')}><Toggle {...f('bitEnabled')} label="30% flat on business income" /></FieldRow>
      <FieldRow label="PIT (Personal Income Tax / PAYE)" source={src('pitEnabled')}><Toggle {...f('pitEnabled')} label="0–35% via 6 PIT brackets (Proc. 1395/2025)" /></FieldRow>
      <FieldRow label="DRRF (Disaster Risk Fund)" source={src('drrfEnabled')}><Toggle {...f('drrfEnabled')} label="1% quarterly contribution" /></FieldRow>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Link to="/settings/taxes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Receipt size={14} /> Manage Tax Rate Profiles
        </Link>
        <p className="text-xs text-slate-400 mt-2">Create custom tax profiles, configure calculation methods (Normal, Inclusive, Compound, Fixed), and withholding rules.</p>
      </div>
    </div>
  );
}

// ── UsersSection sub-components ───────────────────────────────────────────────

function SubSectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3 mt-5 first:mt-0">
      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{title}</p>
        <p className="text-[10px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function UserQuickStats({ companyId }: { companyId?: string | null }) {
  const statsQuery = useQuery({
    queryKey: ['users-quick-stats', companyId],
    queryFn: async () => {
      const token = localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(
        `/api/auth/users?limit=200${companyId ? `&companyId=${encodeURIComponent(companyId)}` : ''}`,
        { headers }
      );
      if (!res.ok) return null;
      const json = await res.json();
      const rows: any[] = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);
      const total   = rows.length;
      const active  = rows.filter((u: any) => !u.isLocked && (u.failedLoginAttempts ?? 0) < 5).length;
      const admins  = rows.filter((u: any) => ['ADMIN', 'SPURADMIN', 'SUPERADMIN'].includes(u.role)).length;
      const locked  = rows.filter((u: any) => u.isLocked || (u.failedLoginAttempts ?? 0) >= 5).length;
      return { total, active, admins, locked };
    },
    staleTime: 60_000,
    enabled: true,
  });

  if (statsQuery.isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (!statsQuery.data) return null;

  const { total, active, admins, locked } = statsQuery.data;
  const stats = [
    { label: 'Total Users',  value: total,  color: 'text-slate-700 dark:text-slate-200',  bg: 'bg-slate-50 dark:bg-slate-800/60',   border: 'border-slate-200 dark:border-slate-700', icon: <Users size={12} className="text-slate-400" /> },
    { label: 'Active',       value: active,  color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 size={12} className="text-emerald-500" /> },
    { label: 'Admins',       value: admins,  color: 'text-violet-700 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/30',  border: 'border-violet-200 dark:border-violet-800',  icon: <ShieldCheck size={12} className="text-violet-500" /> },
    { label: 'Locked',       value: locked,  color: locked > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500', bg: locked > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-slate-50 dark:bg-slate-800/60', border: locked > 0 ? 'border-rose-200 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700', icon: <Lock size={12} className={locked > 0 ? 'text-rose-500' : 'text-slate-400'} /> },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {stats.map(s => (
        <Link
          key={s.label}
          to="/users"
          className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border ${s.bg} ${s.border} transition-all hover:shadow-sm group`}
        >
          <div className="flex items-center gap-1.5">
            {s.icon}
            <span className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{s.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── Main UsersSection ─────────────────────────────────────────────────────────

function UsersSection({ data, onChange, sources, companyId }: {
  data: Record<string, string>;
  onChange: (k: string, v: string) => void;
  sources?: Record<string, { value: string; source: string; conflicts: string[] }>;
  companyId?: string | null;
}) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };

  return (
    <div>
      {/* ── Description banner ── */}
      <div className="flex items-start gap-3 mb-5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl px-4 py-3">
        <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck size={14} className="text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-sky-800 dark:text-sky-300 mb-0.5">Access & security policies</p>
          <p className="text-[11px] text-sky-700/80 dark:text-sky-400/80 leading-relaxed">
            Configure role defaults, portal access, session timeouts, and authentication rules.
            These settings apply company-wide and are enforced at login time.
          </p>
        </div>
      </div>

      {/* ── Quick stats strip ── */}
      <UserQuickStats companyId={companyId} />

      {/* ══ Access Policies ══════════════════════════════════════════════════ */}
      <SubSectionHeader
        icon={<UserCog size={13} />}
        title="Access Policies"
        description="Default roles, portal access, and session rules"
      />
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-1">
        <FieldRow label="Default User Role" hint="Role assigned to newly created users" source={src('defaultUserRole')}>
          <SI {...f('defaultUserRole')} options={[
            { label: 'Admin — Full system access',           value: 'ADMIN' },
            { label: 'Accounting — Finance & billing',       value: 'ACCOUNTING' },
            { label: 'HR — Payroll & employee management',   value: 'HR' },
            { label: 'Data Clerk — Data entry only',         value: 'DATA_CLERK' },
            { label: 'Auditor — Read-only audit view',       value: 'AUDITOR' },
            { label: 'Employee — Self-service portal',       value: 'EMPLOYEE' },
            { label: 'Customer — Portal view/print',         value: 'CUSTOMER' },
            { label: 'Vendor — Portal view/print',           value: 'VENDOR' },
          ]} />
        </FieldRow>
        <FieldRow label="Customer Portal" hint="Allow customers to view invoices and statements" source={src('allowCustomerPortal')}>
          <Toggle {...f('allowCustomerPortal')} label="Enable customer self-service portal" />
        </FieldRow>
        <FieldRow label="Vendor Portal" hint="Allow vendors to submit invoices and track payments" source={src('allowVendorPortal')}>
          <Toggle {...f('allowVendorPortal')} label="Enable vendor self-service portal" />
        </FieldRow>
        <FieldRow label="Employee Portal" hint="Allow employees to access payslips, leave, and claims" source={src('allowEmployeePortal')}>
          <Toggle {...f('allowEmployeePortal')} label="Enable employee self-service portal" />
        </FieldRow>
        <FieldRow label="User Invitation" hint="How new users are added to the system" source={src('invitationPolicy')}>
          <SI {...f('invitationPolicy')} options={[
            { label: 'Admin-only — Admins create accounts',      value: 'admin_only' },
            { label: 'Invite link — Admin sends invite email',   value: 'invite_link' },
            { label: 'Open registration — Anyone can sign up',   value: 'open' },
          ]} />
        </FieldRow>
        <FieldRow label="Session Timeout" hint="Auto-logout after inactivity period" source={src('sessionTimeoutMinutes')}>
          <div className="flex items-center gap-2">
            <TI {...f('sessionTimeoutMinutes')} placeholder="60" />
            <span className="text-xs text-slate-400 shrink-0">minutes</span>
          </div>
        </FieldRow>
        <FieldRow label="Concurrent Sessions" hint="Maximum simultaneous logins per user" source={src('maxConcurrentSessions')}>
          <SI {...f('maxConcurrentSessions')} options={[
            { label: '1 — Single session only',   value: '1' },
            { label: '2 — Two sessions',          value: '2' },
            { label: '5 — Up to five sessions',   value: '5' },
            { label: 'Unlimited',                 value: '0' },
          ]} />
        </FieldRow>
      </div>

      {/* ══ Security Policies ════════════════════════════════════════════════ */}
      <SubSectionHeader
        icon={<Lock size={13} />}
        title="Security Policies"
        description="Password rules, 2FA, and lockout controls"
      />
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-1">
        <FieldRow label="Require Two-Factor Auth" hint="Enforce 2FA via TOTP or email OTP" source={src('requireTwoFactor')}>
          <Toggle {...f('requireTwoFactor')} label="Enforce 2FA for all admin users" />
        </FieldRow>
        <FieldRow label="Minimum Password Length" hint="Enforced on all user accounts" source={src('passwordMinLength')}>
          <div className="flex items-center gap-2">
            <TI {...f('passwordMinLength')} placeholder="8" />
            <span className="text-xs text-slate-400 shrink-0">characters</span>
          </div>
        </FieldRow>
        <FieldRow label="Password Complexity" hint="Require uppercase, numbers and symbols" source={src('requirePasswordComplexity')}>
          <Toggle {...f('requirePasswordComplexity')} label="Require complex passwords" />
        </FieldRow>
        <FieldRow label="Password Expiry (days)" hint="Force password rotation — 0 to disable" source={src('passwordExpiryDays')}>
          <div className="flex items-center gap-2">
            <TI {...f('passwordExpiryDays')} placeholder="0" />
            <span className="text-xs text-slate-400 shrink-0">days (0 = off)</span>
          </div>
        </FieldRow>
        <FieldRow label="Max Login Attempts" hint="Lock account after N failed attempts" source={src('maxLoginAttempts')}>
          <TI {...f('maxLoginAttempts')} placeholder="5" />
        </FieldRow>
        <FieldRow label="Lockout Duration" hint="How long a locked account stays locked" source={src('lockoutDurationMinutes')}>
          <SI {...f('lockoutDurationMinutes')} options={[
            { label: '5 minutes',    value: '5' },
            { label: '15 minutes',   value: '15' },
            { label: '30 minutes',   value: '30' },
            { label: '1 hour',       value: '60' },
            { label: 'Until unlocked by admin', value: '0' },
          ]} />
        </FieldRow>
      </div>

      {/* ══ Audit & Compliance ═══════════════════════════════════════════════ */}
      <SubSectionHeader
        icon={<ClipboardList size={13} />}
        title="Audit & Compliance"
        description="Log retention and IP access controls"
      />
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-5">
        <FieldRow label="Audit Log Retention" hint="How long login and action logs are kept" source={src('auditLogRetentionDays')}>
          <SI {...f('auditLogRetentionDays')} options={[
            { label: '30 days',   value: '30' },
            { label: '90 days',   value: '90' },
            { label: '180 days',  value: '180' },
            { label: '1 year',    value: '365' },
            { label: '2 years',   value: '730' },
          ]} />
        </FieldRow>
        <FieldRow label="IP Allowlist" hint="Restrict logins to specific IP ranges" source={src('ipAllowlistEnabled')}>
          <Toggle {...f('ipAllowlistEnabled')} label="Enable IP allowlist (configure in Security settings)" />
        </FieldRow>
        <FieldRow label="Login Notifications" hint="Email users on new device or location logins" source={src('loginNotificationsEnabled')}>
          <Toggle {...f('loginNotificationsEnabled')} label="Send login alert emails" />
        </FieldRow>
      </div>

      {/* ── Action footer ── */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick access</p>
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/users"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Users size={12} />
            </div>
            <div className="min-w-0">
              <p className="leading-tight">Manage Users</p>
              <p className="text-[9px] font-normal opacity-75 truncate">Create, edit &amp; assign roles</p>
            </div>
            <ChevronRight size={12} className="ml-auto opacity-60 group-hover:opacity-100 shrink-0" />
          </Link>
          <Link
            to="/settings/roles"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-semibold transition-colors group"
          >
            <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <Shield size={12} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="leading-tight">Roles &amp; Permissions</p>
              <p className="text-[9px] font-normal opacity-75 truncate">RBAC permission matrix</p>
            </div>
            <ChevronRight size={12} className="ml-auto opacity-60 group-hover:opacity-100 shrink-0" />
          </Link>
          <Link
            to="/settings/security"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors group"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <KeyRound size={12} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="leading-tight">Security Settings</p>
              <p className="text-[9px] font-normal opacity-75 truncate">MFA, sessions &amp; IP rules</p>
            </div>
            <ChevronRight size={12} className="ml-auto opacity-60 group-hover:opacity-100 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Module labels ─────────────────────────────────────────────────────────────

const MODULE_META: Record<string, { label: string; desc: string; isCore: boolean; icon: string }> = {
  invoice:       { label: 'Invoice',        desc: 'Create and send tax-compliant EIMS invoices',        isCore: true,  icon: '🧾' },
  accounting:    { label: 'Accounting',     desc: 'Double-entry GL, journals & period close',           isCore: true,  icon: '📒' },
  banking:       { label: 'Banking',        desc: 'Bank accounts, feeds & reconciliation',              isCore: false, icon: '🏦' },
  expenses:      { label: 'Expenses',       desc: 'Employee expense claims & approvals',                isCore: false, icon: '💳' },
  payroll:       { label: 'HR & Payroll',   desc: 'Salary, PAYE, pension, benefits & leave',           isCore: false, icon: '👥' },
  projects:      { label: 'Projects',       desc: 'Project tracking, timesheets & billing',            isCore: false, icon: '📋' },
  inventory:     { label: 'Inventory',      desc: 'Stock items, FIFO/WA costing & warehouses',         isCore: false, icon: '📦' },
  crm:           { label: 'CRM',            desc: 'Customer relationship management & pipeline',       isCore: false, icon: '🤝' },
  vat:           { label: 'VAT',            desc: 'VAT ledgers and MoR monthly filings',               isCore: false, icon: '📑' },
  bit:           { label: 'BIT',            desc: 'Business income tax returns & advance payments',    isCore: false, icon: '🏢' },
  pit:           { label: 'PIT / PAYE',     desc: 'Personal income tax & employer PAYE',               isCore: false, icon: '👤' },
  drrf:          { label: 'DRRF',           desc: 'Disaster Risk & Resilience Fund contributions',     isCore: false, icon: '🛡️' },
  ifrs:          { label: 'IFRS',           desc: 'IFRS financial statements (IAS 1/7/17)',            isCore: false, icon: '📊' },
  manufacturing: { label: 'Manufacturing',  desc: 'BOM, work orders & production costing',             isCore: false, icon: '🏭' },
  treasury:      { label: 'Treasury',       desc: 'Cash forecasting, investments & FX',                isCore: false, icon: '💰' },
  notifications: { label: 'Notifications',  desc: 'Email, SMS & push notification channels',          isCore: true,  icon: '🔔' },
  api:           { label: 'API Access',     desc: 'REST & oRPC API and webhook integrations',          isCore: true,  icon: '🔌' },
};

function ModulesSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const core = Object.entries(MODULE_META).filter(([, m]) => m.isCore);
  const optional = Object.entries(MODULE_META).filter(([, m]) => !m.isCore);
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  const renderModule = ([key, meta]: [string, typeof MODULE_META[string]]) => {
    const enabled = data[key] === 'true';
    return (
      <div key={key} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
        enabled ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{meta.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{meta.label}</p>
              {meta.isCore && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-bold uppercase">Core</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{meta.desc}</p>
          </div>
        </div>
        <Toggle value={data[key] ?? 'false'} onChange={v => onChange(key, v)} label="" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Core Modules</p>
        <div className="grid gap-2">{core.map(renderModule)}</div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Optional Modules</p>
        <div className="grid gap-2">{optional.map(renderModule)}</div>
      </div>
      <div className="pt-2">
        <Link to="/settings/app-store"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Layers size={14} /> Browse Modules & Extensions <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

function DevelopersSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        For self-hosted installations, configuration is split: the web UI handles operational rules, the server <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.env</code> file handles database strings, security keys, and debug logs.
      </p>
      <div className="grid gap-3">
        {[
          { label: 'API Documentation',    desc: 'REST & oRPC endpoints, Swagger UI, webhook guides', to: '/settings/api-docs',   icon: <Code size={16} /> },
          { label: 'Developer Guide',      desc: 'SDK references, quickstart, sandbox environments',  to: '/settings/developers', icon: <Code size={16} /> },
          { label: 'Webhook Configuration',desc: 'Manage webhook endpoints and delivery logs',         to: '/settings/api-docs',   icon: <Code size={16} /> },
          { label: 'Settings Catalog',     desc: 'Admin CRUD for categories, groups & field defs',    to: '/settings/catalog',    icon: <SettingsIcon size={16} /> },
          { label: 'Audit Logs',           desc: 'Track all settings changes with timestamps',         to: '/settings/audit-logs', icon: <SettingsIcon size={16} /> },
          { label: 'System Updates',       desc: 'Update channel, auto-update & release notes',        to: '/settings/releases',   icon: <SettingsIcon size={16} /> },
        ].map(item => (
          <Link key={item.to + item.label} to={item.to}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-emerald-600 transition-colors">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
              <p className="text-xs text-slate-500 truncate">{item.desc}</p>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function IntegrationsSection({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const f = (key: string) => ({ value: data[key] ?? '', onChange: (v: string) => onChange(key, v) });
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        Manage third-party API keys and webhook endpoints. These settings are encrypted at rest.
      </p>
      <FieldRow label="OpenAI API Key" hint="For AI-powered insights and automation">
        <input className={inputCls + ' pr-10'} type="password" value={data['openaiApiKey'] ?? ''} onChange={e => onChange('openaiApiKey', e.target.value)} placeholder="sk-..." />
      </FieldRow>
      <FieldRow label="Gemini API Key" hint="Google Gemini AI integration">
        <input className={inputCls + ' pr-10'} type="password" value={data['geminiApiKey'] ?? ''} onChange={e => onChange('geminiApiKey', e.target.value)} placeholder="AI..." />
      </FieldRow>
      <FieldRow label="SIEM Webhook URL" hint="Security event forwarding endpoint">
        <input className={inputCls} type="url" value={data['siemWebhookUrl'] ?? ''} onChange={e => onChange('siemWebhookUrl', e.target.value)} placeholder="https://siem.example.com/webhook" />
      </FieldRow>
      <FieldRow label="SIEM Token" hint="Bearer token for SIEM authentication">
        <input className={inputCls + ' pr-10'} type="password" value={data['siemToken'] ?? ''} onChange={e => onChange('siemToken', e.target.value)} placeholder="token" />
      </FieldRow>
      <FieldRow label="Request Signing Secret" hint="Used to sign banking transfer requests">
        <input className={inputCls + ' pr-10'} type="password" value={data['requestSigningSecret'] ?? ''} onChange={e => onChange('requestSigningSecret', e.target.value)} placeholder="secret" />
      </FieldRow>
    </div>
  );
}


// ── Sidebar ───────────────────────────────────────────────────────────────────

function PanelSidebar({ active, onSelect }: { active: SettingsSection; onSelect: (s: SettingsSection) => void }) {
  const groups = ['general', 'advanced', 'system'] as const;
  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <SettingsIcon size={15} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Settings</p>
            <p className="text-[9px] text-slate-400 leading-tight">Central Control Panel</p>
          </div>
        </div>
      </div>
      <nav className="py-2" aria-label="Settings navigation">
        {groups.map(group => {
          const items = SETTINGS_SECTIONS.filter(s => s.group === group);
          return (
            <div key={group} className="px-2 py-1">
              <p className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{GROUP_LABELS[group]}</p>
              <div className="space-y-0.5 mt-0.5">
                {items.map(section => {
                  const isActive = active === section.id;
                  return (
                    <button key={section.id} type="button" onClick={() => onSelect(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {section.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs truncate ${isActive ? 'font-bold' : 'font-medium'}`}>{section.label}</p>
                        <p className="text-[9px] text-slate-400 leading-tight truncate">{section.description}</p>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ── Setup progress banner ─────────────────────────────────────────────────────

function SetupBanner({ passedChecks, totalChecks, pct }: { passedChecks: number; totalChecks: number; pct: number }) {
  if (pct >= 100) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <AlertCircle size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
            Setup incomplete — {pct}% ({passedChecks}/{totalChecks} sections configured)
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Complete the setup wizard to unlock all features.</p>
        </div>
      </div>
      <Link to="/settings/setup-wizard"
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-all shrink-0">
        Continue Setup <ArrowRight size={10} />
      </Link>
    </div>
  );
}


// ── Main component ────────────────────────────────────────────────────────────

export interface CentralControlPanelContentProps {
  /** orpc client bound to the app — passed in so the feature lib stays framework-neutral */
  orpc: any;
  canWrite: boolean;
  companyId: string | null | undefined;
  /**
   * Pin the panel to a specific section on mount.
   * When set the URL ?tab= param is still honoured if present, but this value
   * is used as the fallback instead of 'profile'.  Dedicated sub-pages pass
   * their own section key so the sidebar starts on the right item.
   */
  defaultSection?: SettingsSection;
}

export function CentralControlPanelContent({ orpc, canWrite, companyId, defaultSection }: CentralControlPanelContentProps) {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as SettingsSection | null;
  const validSections = SETTINGS_SECTIONS.map(s => s.id);
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    rawTab && validSections.includes(rawTab) ? rawTab : (defaultSection ?? 'profile'),
  );
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['settings', 'profile', companyId],
    queryFn: () => orpc.settings.profile.get({ companyId: companyId! }),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const checklistQuery = useQuery({
    queryKey: ['settings', 'checklist', companyId],
    queryFn: () => orpc.settings.profile.checklist({ companyId: companyId! }),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const mergeSourcesQuery = useQuery({
    queryKey: ['settings', 'merge-sources', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/settings/merge-sources/${companyId}`, {
        headers: { Authorization: `Bearer ${(localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '')}` },
      });
      if (!res.ok) throw new Error('Failed to load merge sources');
      return res.json() as Promise<Record<string, { value: string; source: string; conflicts: string[] }>>;
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ section, data }: { section: SettingsSection; data: Record<string, string> }) =>
      orpc.settings.profile.update({ companyId: companyId!, section, data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'profile', companyId] });
      qc.invalidateQueries({ queryKey: ['settings', 'checklist', companyId] });
    },
  });

  // Merge server data with in-memory draft for the active section
  const serverData = ((profileQuery.data as any)?.[activeSection] ?? {}) as Record<string, string>;
  const effectiveData: Record<string, string> = { ...serverData, ...draft };

  const handleChange = useCallback((key: string, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!isDirty || Object.keys(draft).length === 0 || !canWrite) return;
    await updateMutation.mutateAsync({ section: activeSection, data: draft });
    setDraft({});
    setIsDirty(false);
  }, [isDirty, draft, activeSection, updateMutation, canWrite]);

  const handleSectionChange = useCallback((section: SettingsSection) => {
    if (isDirty && !confirm('You have unsaved changes. Discard them?')) return;
    setActiveSection(section);
    setDraft({});
    setIsDirty(false);
    setSearchParams((prev: URLSearchParams) => { prev.set('tab', section); return prev; }, { replace: true });
  }, [isDirty, setSearchParams]);

  const checklist = (checklistQuery.data as any)?.checks;
  const setupPct = checklist ? Math.round((checklist.passedChecks / checklist.totalChecks) * 100) : 0;
  const activeMeta = SETTINGS_SECTIONS.find(s => s.id === activeSection);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4">
          <AlertCircle size={22} />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No company selected</p>
        <p className="text-xs text-slate-500 mt-1">Select a company from the top bar to manage settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Central control panel for company profile, tax laws, currency, security, and email configuration.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <button onClick={() => { setDraft({}); setIsDirty(false); }}
              className="ovds-btn-secondary flex items-center gap-1.5 text-xs">
              <RefreshCw size={12} /> Discard
            </button>
          )}
          {canWrite && activeSection !== 'developers' && (
            <button onClick={handleSave} disabled={!isDirty || updateMutation.isPending}
              className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50">
              <Save size={13} />
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      {/* ── Setup banner ───────────────────────────────────────────────────── */}
      {checklist && (
        <SetupBanner passedChecks={checklist.passedChecks} totalChecks={checklist.totalChecks} pct={setupPct} />
      )}

      {/* ── Progress bar (visible until fully configured) ──────────────────── */}
      {checklist && setupPct < 100 && (
        <div className="ovds-widget-card px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Setup progress</p>
            <span className="text-[10px] font-bold text-slate-500">{checklist.passedChecks}/{checklist.totalChecks}</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${setupPct}%`, background: setupPct === 100 ? '#22c55e' : '#f59e0b' }} />
          </div>
        </div>
      )}

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '248px 1fr' }}>

        {/* Sidebar */}
        <PanelSidebar active={activeSection} onSelect={handleSectionChange} />

        {/* Content panel */}
        <div className="ovds-widget-card p-6 min-w-0">

          {/* Section header */}
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
              {activeMeta?.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeMeta?.label}</p>
              <p className="text-[10px] text-slate-400">{activeMeta?.description}</p>
            </div>
            {isDirty && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 rounded-lg">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>

          {/* Section body */}
          {profileQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : profileQuery.isError ? (
            <div className="flex items-center gap-2 text-rose-600 text-sm">
              <AlertCircle size={14} /> Failed to load settings. Check your connection and try again.
            </div>
          ) : (
            <>
              {activeSection === 'profile'      && <ProfileSection      data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'localization' && <LocalizationSection data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'financial'    && <FinancialSection    data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'invoice'      && <InvoiceSection      data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'defaults'     && <DefaultsSection     data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'currency'     && <CurrencySection     data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'email'        && <EmailSection        data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'taxes'        && <TaxSection          data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
              {activeSection === 'users'        && <UsersSection        data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} companyId={companyId} />}
              {activeSection === 'modules'      && <ModulesSection      data={effectiveData} onChange={handleChange} />}
              {activeSection === 'developers'   && <DevelopersSection />}
              {activeSection === 'integrations' && <IntegrationsSection data={effectiveData} onChange={handleChange} />}
            </>
          )}

          {/* Inline save footer */}
          {isDirty && activeSection !== 'developers' && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={handleSave} disabled={updateMutation.isPending || !canWrite}
                className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50">
                <Save size={13} />
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {updateMutation.isSuccess && !isDirty && (
            <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
              <CheckCircle2 size={13} /> Changes saved successfully.
            </div>
          )}
          {updateMutation.isError && (
            <div className="mt-4 flex items-center gap-1.5 text-rose-600 text-xs font-medium">
              <AlertCircle size={13} /> Failed to save — {(updateMutation.error as any)?.message ?? 'unknown error'}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CentralControlPanelContent;
