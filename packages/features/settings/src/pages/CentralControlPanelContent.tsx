/**
 * CentralControlPanelContent — unified settings hub for OVDS
 *
 * Akaunting-inspired sidebar-driven layout. All configuration sections
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

function InvoiceSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5">
        Set custom document naming prefixes (e.g. changing INV- to a custom layout), footer terms, and PDF generation templates.
      </p>
      <FieldRow label="Invoice Prefix" hint="Custom prefix for invoice document numbers" required source={src('invoicePrefix')}>
        <TI {...f('invoicePrefix')} placeholder="INV-" />
      </FieldRow>
      <FieldRow label="Next Invoice Number" hint="Next sequential number to assign" source={src('invoiceNextNumber')}>
        <TI {...f('invoiceNextNumber')} placeholder="1001" />
      </FieldRow>
      <FieldRow label="PDF Template" source={src('invoiceTemplate')}>
        <SI {...f('invoiceTemplate')} options={[
          { label: 'Simple',   value: 'simple' },
          { label: 'Modern',   value: 'modern' },
          { label: 'Detailed', value: 'detailed' },
        ]} />
      </FieldRow>
      <FieldRow label="Footer Terms" hint="Custom terms printed at the bottom of every invoice PDF" source={src('invoiceFooter')}>
        <textarea className="ovds-input w-full max-w-lg" rows={3}
          value={data['invoiceFooter'] ?? ''} onChange={e => onChange('invoiceFooter', e.target.value)}
          placeholder="Payment is due within 30 days. Thank you for your business." />
      </FieldRow>
      <FieldRow label="Show MoR Tax QR Code" source={src('invoiceShowQr')}><Toggle {...f('invoiceShowQr')} label="Print QR code on invoice" /></FieldRow>
      <FieldRow label="Show Company Logo" source={src('invoiceShowLogo')}><Toggle {...f('invoiceShowLogo')} label="Display logo on invoice PDF" /></FieldRow>
      <FieldRow label="Show Bank Details" source={src('invoiceShowBankDetails')}><Toggle {...f('invoiceShowBankDetails')} label="Print bank account details on invoice" /></FieldRow>
      <FieldRow label="Due Days" hint="Default payment terms in days" source={src('invoiceDueDays')}>
        <TI {...f('invoiceDueDays')} placeholder="30" />
      </FieldRow>
      <FieldRow label="Reminder Days" hint="Days after due date to send reminder" source={src('invoiceReminderDays')}>
        <TI {...f('invoiceReminderDays')} placeholder="7" />
      </FieldRow>
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

function UsersSection({ data, onChange, sources }: { data: Record<string, string>; onChange: (k: string, v: string) => void; sources?: Record<string, { value: string; source: string; conflicts: string[] }> }) {
  const f = (k: string) => ({ value: data[k] ?? '', onChange: (v: string) => onChange(k, v) });
  const src = (camel: string) => {
    if (!sources) return undefined;
    const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    return sources[snake]?.source;
  };
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5">
        Enforce compliance and data protection by defining specific user types and system boundaries. Admin: full access. Manager: invoices & bills only. Customer/Vendor: restricted portal access.
      </p>
      <FieldRow label="Default User Role" hint="Role assigned to newly created users" source={src('defaultUserRole')}>
        <SI {...f('defaultUserRole')} options={[
          { label: 'Admin — Full system access',      value: 'ADMIN' },
          { label: 'Manager — Invoices & bills',      value: 'MANAGER' },
          { label: 'Customer — Portal view/print',    value: 'CUSTOMER' },
          { label: 'Vendor — Portal view/print',      value: 'VENDOR' },
        ]} />
      </FieldRow>
      <FieldRow label="Customer Portal" source={src('allowCustomerPortal')}><Toggle {...f('allowCustomerPortal')} label="Enable customer self-service portal" /></FieldRow>
      <FieldRow label="Vendor Portal" source={src('allowVendorPortal')}><Toggle {...f('allowVendorPortal')} label="Enable vendor self-service portal" /></FieldRow>
      <FieldRow label="Session Timeout (min)" hint="Auto-logout after inactivity period" source={src('sessionTimeoutMinutes')}>
        <TI {...f('sessionTimeoutMinutes')} placeholder="60" />
      </FieldRow>
      <FieldRow label="Minimum Password Length" hint="Enforced on all user accounts" source={src('passwordMinLength')}>
        <TI {...f('passwordMinLength')} placeholder="8" />
      </FieldRow>
      <FieldRow label="Require Two-Factor Auth" source={src('requireTwoFactor')}><Toggle {...f('requireTwoFactor')} label="Enforce 2FA for all admin users" /></FieldRow>
      <FieldRow label="Max Login Attempts" hint="Lock account after N failed attempts" source={src('maxLoginAttempts')}>
        <TI {...f('maxLoginAttempts')} placeholder="5" />
      </FieldRow>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
        <Link to="/settings/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <UserCog size={14} /> Manage Users
        </Link>
        <Link to="/settings/roles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Shield size={14} /> Roles & Permissions
        </Link>
        <Link to="/settings/advanced-access-controls"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Shield size={14} /> Advanced Access Controls <ExternalLink size={12} />
        </Link>
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
}

export function CentralControlPanelContent({ orpc, canWrite, companyId }: CentralControlPanelContentProps) {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as SettingsSection | null;
  const validSections = SETTINGS_SECTIONS.map(s => s.id);
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    rawTab && validSections.includes(rawTab) ? rawTab : 'profile',
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
    setSearchParams(prev => { prev.set('tab', section); return prev; }, { replace: true });
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
              {activeSection === 'users'        && <UsersSection        data={effectiveData} onChange={handleChange} sources={mergeSourcesQuery.data} />}
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
