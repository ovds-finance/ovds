import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Globe, DollarSign, Receipt, Layers, FileText, Mail, Save, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Wallet, UserCog, Shield, Code, Settings as SettingsIcon, ChevronDown, Eye, EyeOff, ExternalLink, Plug, Users, Lock, KeyRound, ShieldCheck, ClipboardList, ChevronRight, Palette, LayoutTemplate, Sparkles, Wand2, Type, AlignLeft, Columns, Hash, CreditCard, } from 'lucide-react';
// ── Section metadata ──────────────────────────────────────────────────────────
export const SETTINGS_SECTIONS = [
    // General
    { id: 'profile', label: 'Company', icon: _jsx(Building2, { size: 14 }), description: 'Business identity & contacts', group: 'general' },
    { id: 'localization', label: 'Localization', icon: _jsx(Globe, { size: 14 }), description: 'Language, timezone & format', group: 'general' },
    { id: 'financial', label: 'Financial', icon: _jsx(DollarSign, { size: 14 }), description: 'Currency & fiscal calendar', group: 'general' },
    { id: 'invoice', label: 'Invoice', icon: _jsx(FileText, { size: 14 }), description: 'Templates, prefixes & QR', group: 'general' },
    { id: 'defaults', label: 'Defaults', icon: _jsx(Wallet, { size: 14 }), description: 'Bank, payment & tax defaults', group: 'general' },
    // Advanced
    { id: 'currency', label: 'Currencies', icon: _jsx(DollarSign, { size: 14 }), description: 'Base currency & exchange rates', group: 'advanced' },
    { id: 'email', label: 'Email & SMTP', icon: _jsx(Mail, { size: 14 }), description: 'Outgoing mail & SMTP config', group: 'advanced' },
    { id: 'taxes', label: 'Tax Rules', icon: _jsx(Receipt, { size: 14 }), description: 'VAT, TOT, WHT, BIT & DRRF', group: 'advanced' },
    { id: 'users', label: 'Users & Access', icon: _jsx(UserCog, { size: 14 }), description: 'Roles, portals & security', group: 'advanced' },
    // System
    { id: 'modules', label: 'Modules', icon: _jsx(Layers, { size: 14 }), description: 'Enable / disable modules', group: 'system' },
    { id: 'developers', label: 'Developers', icon: _jsx(Code, { size: 14 }), description: '.env, API keys & webhooks', group: 'system' },
    { id: 'integrations', label: 'Integrations', icon: _jsx(Plug, { size: 14 }), description: 'AI, SIEM & third-party keys', group: 'system' },
];
const GROUP_LABELS = {
    general: 'General',
    advanced: 'Advanced',
    system: 'System',
};
// ── Shared primitives ─────────────────────────────────────────────────────────
function FieldRow({ label, hint, required, source, children }) {
    return (_jsxs("div", { className: "grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsxs("p", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: [label, required && _jsx("span", { className: "text-rose-500 ml-0.5", children: "*" })] }), source && _jsx(SourceBadge, { source: source })] }), hint && _jsx("p", { className: "text-xs text-slate-400 mt-0.5 leading-relaxed", children: hint })] }), _jsx("div", { children: children })] }));
}
const inputCls = 'ovds-input w-full max-w-xs';
function TI({ value, onChange, placeholder, type = 'text' }) {
    return _jsx("input", { className: inputCls, type: type, value: value, onChange: e => onChange(e.target.value), placeholder: placeholder });
}
function SI({ value, onChange, options }) {
    return (_jsxs("div", { className: "relative max-w-xs", children: [_jsx("select", { className: inputCls + ' appearance-none pr-8', value: value, onChange: e => onChange(e.target.value), children: options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) }), _jsx(ChevronDown, { size: 12, className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" })] }));
}
function Toggle({ value, onChange, label }) {
    const checked = value === 'true';
    return (_jsxs("label", { className: "flex items-center gap-2.5 cursor-pointer", children: [_jsx("button", { type: "button", role: "switch", "aria-checked": checked, onClick: () => onChange(checked ? 'false' : 'true'), className: `relative inline-flex w-9 h-5 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`, children: _jsx("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}` }) }), _jsx("span", { className: "text-sm text-slate-600 dark:text-slate-400", children: label })] }));
}
function PasswordField({ value, onChange, placeholder }) {
    const [visible, setVisible] = useState(false);
    return (_jsxs("div", { className: "relative max-w-xs", children: [_jsx("input", { className: inputCls + ' pr-10', type: visible ? 'text' : 'password', value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, autoComplete: "new-password" }), _jsx("button", { type: "button", onClick: () => setVisible(v => !v), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600", children: visible ? _jsx(EyeOff, { size: 13 }) : _jsx(Eye, { size: 13 }) })] }));
}
function SourceBadge({ source }) {
    const colors = {
        'company-kv': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
        'global-kv': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800',
        'module-defaults': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800',
        'definition': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
        'legacy': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
        'hardcoded': 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };
    const labels = {
        'company-kv': 'Company',
        'global-kv': 'Global',
        'module-defaults': 'Module',
        'definition': 'Default',
        'legacy': 'Legacy',
        'hardcoded': 'Hardcoded',
    };
    const color = colors[source] || colors['hardcoded'];
    const label = labels[source] || source;
    return (_jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded border ${color}`, children: label }));
}
// ── Currency options (shared) ─────────────────────────────────────────────────
const CURRENCY_OPTS = [
    { label: 'ETB — Ethiopian Birr', value: 'ETB' },
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'EUR — Euro', value: 'EUR' },
    { label: 'GBP — British Pound', value: 'GBP' },
    { label: 'SAR — Saudi Riyal', value: 'SAR' },
    { label: 'AED — UAE Dirham', value: 'AED' },
    { label: 'KES — Kenyan Shilling', value: 'KES' },
];
// ── Section forms ─────────────────────────────────────────────────────────────
function ProfileSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5", children: "Update your business trading name, contacts, and corporate logo used across all external customer-facing paperwork." }), _jsx(FieldRow, { label: "Company Name", hint: "Legal trade name registered with ERCA", required: true, source: src('companyName'), children: _jsx(TI, { ...f('companyName'), placeholder: "e.g. Acme Trading PLC" }) }), _jsx(FieldRow, { label: "TIN", hint: "10-digit Ethiopian Taxpayer ID", source: src('companyTin'), children: _jsx(TI, { ...f('companyTin'), placeholder: "0000000000" }) }), _jsx(FieldRow, { label: "VAT Registration No.", hint: "ERCA-issued VAT registration number", source: src('companyVatNumber'), children: _jsx(TI, { ...f('companyVatNumber'), placeholder: "ETR-XXXX" }) }), _jsx(FieldRow, { label: "Business Email", source: src('companyEmail'), children: _jsx(TI, { ...f('companyEmail'), placeholder: "accounts@company.com", type: "email" }) }), _jsx(FieldRow, { label: "Phone", source: src('companyPhone'), children: _jsx(TI, { ...f('companyPhone'), placeholder: "+251 911 000 000" }) }), _jsx(FieldRow, { label: "Address", source: src('companyAddress'), children: _jsx(TI, { ...f('companyAddress'), placeholder: "Addis Ababa, Ethiopia" }) }), _jsx(FieldRow, { label: "Business Type", source: src('companyBusinessType'), children: _jsx(SI, { ...f('companyBusinessType'), options: [
                        { label: 'Private Limited Company (PLC)', value: 'PLC' },
                        { label: 'One Member PLC', value: 'ONE_MEMBER_PLC' },
                        { label: 'Share Company', value: 'SHARE_COMPANY' },
                        { label: 'Sole Proprietorship', value: 'SOLE_PROPRIETORSHIP' },
                        { label: 'Non-Profit / NGO', value: 'NGO' },
                        { label: 'Government Entity', value: 'GOVERNMENT' },
                    ] }) }), _jsx(FieldRow, { label: "Company Logo URL", hint: "Direct URL to your logo image (HTTPS)", source: src('companyLogoUrl'), children: _jsx(TI, { ...f('companyLogoUrl'), placeholder: "https://cdn.example.com/logo.png" }) })] }));
}
function LocalizationSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5", children: "Establish your operational region by defining the primary language, local timezone, data sorting, and fiscal year calendar." }), _jsx(FieldRow, { label: "Language", source: src('language'), children: _jsx(SI, { ...f('language'), options: [
                        { label: 'English', value: 'en' },
                        { label: 'አማርኛ (Amharic)', value: 'am' },
                        { label: 'ትግርኛ (Tigrinya)', value: 'ti' },
                    ] }) }), _jsx(FieldRow, { label: "Timezone", source: src('timezone'), children: _jsx(SI, { ...f('timezone'), options: [
                        { label: 'Addis Ababa (EAT, UTC+3)', value: 'Africa/Addis_Ababa' },
                        { label: 'Nairobi (EAT, UTC+3)', value: 'Africa/Nairobi' },
                        { label: 'Dubai (GST, UTC+4)', value: 'Asia/Dubai' },
                        { label: 'UTC', value: 'UTC' },
                    ] }) }), _jsx(FieldRow, { label: "Date Format", source: src('dateFormat'), children: _jsx(SI, { ...f('dateFormat'), options: [
                        { label: 'DD/MM/YYYY', value: 'd/m/Y' },
                        { label: 'YYYY-MM-DD', value: 'Y-m-d' },
                        { label: 'MM/DD/YYYY', value: 'm/d/Y' },
                        { label: 'DD-MMM-YYYY', value: 'd-M-Y' },
                    ] }) }), _jsx(FieldRow, { label: "Decimal Separator", source: src('decimalSeparator'), children: _jsx(SI, { ...f('decimalSeparator'), options: [
                        { label: 'Dot — 1,000.00', value: '.' },
                        { label: 'Comma — 1.000,00', value: ',' },
                    ] }) }), _jsx(FieldRow, { label: "Thousands Separator", source: src('thousandsSeparator'), children: _jsx(SI, { ...f('thousandsSeparator'), options: [
                        { label: 'Comma — 1,000', value: ',' },
                        { label: 'Dot — 1.000', value: '.' },
                        { label: 'Space — 1 000', value: ' ' },
                    ] }) })] }));
}
function FinancialSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5", children: "Set your base currency, fiscal year start month, and reporting preferences. Ethiopian Fiscal Year (EFY) starts in Hamle (July)." }), _jsx(FieldRow, { label: "Default Currency", hint: "Anchors all internal ledger math", source: src('defaultCurrency'), children: _jsx(SI, { ...f('defaultCurrency'), options: CURRENCY_OPTS }) }), _jsx(FieldRow, { label: "Currency Position", source: src('currencyPosition'), children: _jsx(SI, { ...f('currencyPosition'), options: [
                        { label: 'Before amount — ETB 1,000', value: 'before' },
                        { label: 'After amount — 1,000 ETB', value: 'after' },
                    ] }) }), _jsx(FieldRow, { label: "Fiscal Year Start", hint: "Month the fiscal year begins (default: July = 7 for EFY)", source: src('fiscalYearStart'), children: _jsx(SI, { ...f('fiscalYearStart'), options: months.map((m, i) => ({ label: `${m} (${i + 1})`, value: String(i + 1) })) }) }), _jsx(FieldRow, { label: "Report Currency", source: src('reportCurrency'), children: _jsx(SI, { ...f('reportCurrency'), options: CURRENCY_OPTS.slice(0, 3) }) })] }));
}
// ── Invoice color swatches ────────────────────────────────────────────────────
const INVOICE_COLORS = [
    { name: 'Emerald', value: '#10B981' },
    { name: 'Azure', value: '#2563EB' },
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Violet', value: '#7C3AED' },
    { name: 'Rose', value: '#E11D48' },
    { name: 'Amber', value: '#D97706' },
    { name: 'Teal', value: '#0D9488' },
    { name: 'Slate', value: '#475569' },
];
function InvoiceSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    const selectedColor = data['invoiceThemeColor'] || '#10B981';
    return (_jsxs("div", { className: "space-y-0", children: [_jsxs("p", { className: "text-xs text-slate-500 mb-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 leading-relaxed", children: ["Configure invoice numbering, default payment terms, color theme, content visibility, and footer text. For advanced drag-and-drop template design, use the", ' ', _jsxs(Link, { to: "/apps/invoice-templates", className: "font-semibold text-[var(--pro-azure)] hover:underline inline-flex items-center gap-0.5", children: ["Print-ready Invoice Template App ", _jsx(ExternalLink, { size: 10 })] }), "."] }), _jsxs("div", { className: "mb-1", children: [_jsxs("div", { className: "flex items-center gap-2 py-2 mb-1", children: [_jsx(Hash, { size: 13, className: "text-slate-400 shrink-0" }), _jsx("p", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-widest", children: "Numbering" })] }), _jsx(FieldRow, { label: "Invoice Prefix", hint: "Custom prefix for invoice document numbers (e.g. INV-, RCPT-, PFI-)", required: true, source: src('invoicePrefix'), children: _jsx(TI, { ...f('invoicePrefix'), placeholder: "INV-" }) }), _jsx(FieldRow, { label: "Next Invoice Number", hint: "Next sequential number to assign \u2014 auto-increments on every new invoice", source: src('invoiceNextNumber'), children: _jsx(TI, { ...f('invoiceNextNumber'), placeholder: "1001" }) }), _jsx(FieldRow, { label: "Estimate Prefix", hint: "Prefix for estimate / proforma documents", source: src('estimatePrefix'), children: _jsx(TI, { ...f('estimatePrefix'), placeholder: "EST-" }) })] }), _jsxs("div", { className: "mb-1 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2 py-2 mb-1", children: [_jsx(Palette, { size: 13, className: "text-slate-400 shrink-0" }), _jsx("p", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-widest", children: "Appearance" })] }), _jsx(FieldRow, { label: "Default Document Title", hint: "Printed at the top of every invoice PDF", source: src('invoiceDefaultTitle'), children: _jsx(SI, { ...f('invoiceDefaultTitle'), options: [
                                { label: 'TAX INVOICE', value: 'TAX INVOICE' },
                                { label: 'INVOICE', value: 'INVOICE' },
                                { label: 'PROFORMA INVOICE', value: 'PROFORMA INVOICE' },
                                { label: 'RECEIPT', value: 'RECEIPT' },
                                { label: 'CREDIT NOTE', value: 'CREDIT NOTE' },
                                { label: 'DEBIT NOTE', value: 'DEBIT NOTE' },
                            ] }) }), _jsx(FieldRow, { label: "PDF Layout Template", hint: "Base layout used when generating invoice PDFs", source: src('invoiceTemplate'), children: _jsx(SI, { ...f('invoiceTemplate'), options: [
                                { label: 'Simple — clean single-column', value: 'simple' },
                                { label: 'Modern — two-column with sidebar', value: 'modern' },
                                { label: 'Detailed — full IFRS/ERCA fields', value: 'detailed' },
                                { label: 'Compact — condensed for reprints', value: 'compact' },
                            ] }) }), _jsx(FieldRow, { label: "Template Color Theme", hint: "Accent color used for headers, borders, and totals row in the PDF", source: src('invoiceThemeColor'), children: _jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [INVOICE_COLORS.map(c => (_jsx("button", { type: "button", title: c.name, onClick: () => onChange('invoiceThemeColor', c.value), className: "w-7 h-7 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400", style: {
                                        background: c.value,
                                        borderColor: selectedColor === c.value ? '#111827' : 'transparent',
                                        transform: selectedColor === c.value ? 'scale(1.2)' : 'scale(1)',
                                        boxShadow: selectedColor === c.value ? `0 0 0 1px white, 0 0 0 3px ${c.value}` : 'none',
                                    }, "aria-pressed": selectedColor === c.value, "aria-label": `Color: ${c.name}` }, c.value))), _jsxs("div", { className: "flex items-center gap-1.5 ml-2", children: [_jsx("div", { className: "w-5 h-5 rounded border border-slate-200 dark:border-slate-600", style: { background: selectedColor } }), _jsx("input", { type: "text", maxLength: 7, value: selectedColor, onChange: e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange('invoiceThemeColor', e.target.value), className: "ovds-input w-20 text-xs font-mono", placeholder: "#10B981", "aria-label": "Custom color hex" })] })] }) })] }), _jsxs("div", { className: "mb-1 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2 py-2 mb-1", children: [_jsx(CreditCard, { size: 13, className: "text-slate-400 shrink-0" }), _jsx("p", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-widest", children: "Payment Terms" })] }), _jsx(FieldRow, { label: "Default Payment Terms", hint: "Pre-selected on every new invoice \u2014 can be changed per-invoice", source: src('invoiceDefaultPaymentTerms'), children: _jsx(SI, { ...f('invoiceDefaultPaymentTerms'), options: [
                                { label: 'Due Immediately', value: 'IMMEDIATE' },
                                { label: 'Net 7 days', value: 'NET7' },
                                { label: 'Net 15 days', value: 'NET15' },
                                { label: 'Net 30 days', value: 'NET30' },
                                { label: 'Net 60 days', value: 'NET60' },
                                { label: 'Net 90 days', value: 'NET90' },
                            ] }) }), _jsx(FieldRow, { label: "Due Days (override)", hint: "Exact number of days \u2014 overrides the terms selection above if set", source: src('invoiceDueDays'), children: _jsx(TI, { ...f('invoiceDueDays'), placeholder: "30" }) }), _jsx(FieldRow, { label: "Reminder Days", hint: "Days after due date to automatically send a payment reminder", source: src('invoiceReminderDays'), children: _jsx(TI, { ...f('invoiceReminderDays'), placeholder: "7" }) })] }), _jsxs("div", { className: "mb-1 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2 py-2 mb-1", children: [_jsx(Eye, { size: 13, className: "text-slate-400 shrink-0" }), _jsx("p", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-widest", children: "Content Visibility" })] }), _jsx("p", { className: "text-xs text-slate-400 mb-3 ml-0.5 leading-relaxed", children: "Control which fields and sections appear on every generated invoice PDF. These are global defaults \u2014 individual invoices can still override them." }), _jsx(FieldRow, { label: "Item Descriptions", hint: "Show the free-text description line beneath each line item name", source: src('invoiceShowItemDesc'), children: _jsx(Toggle, { ...f('invoiceShowItemDesc'), label: "Show item descriptions on PDF" }) }), _jsx(FieldRow, { label: "Unit Prices & Amounts", hint: "Show the unit price, quantity, and per-line net amount columns", source: src('invoiceShowAmounts'), children: _jsx(Toggle, { ...f('invoiceShowAmounts'), label: "Show amounts and unit prices" }) }), _jsx(FieldRow, { label: "Discount Column", hint: "Show the discount column in the line items table when discounts are applied", source: src('invoiceShowDiscountCol'), children: _jsx(Toggle, { ...f('invoiceShowDiscountCol'), label: "Show discount column" }) }), _jsx(FieldRow, { label: "Tax / VAT Column", hint: "Show the per-line VAT rate and amount column", source: src('invoiceShowTaxCol'), children: _jsx(Toggle, { ...f('invoiceShowTaxCol'), label: "Show tax / VAT column" }) }), _jsx(FieldRow, { label: "Custom Columns", hint: "Show any additional custom columns added via the Invoice Template App", source: src('invoiceShowCustomColumns'), children: _jsx(Toggle, { ...f('invoiceShowCustomColumns'), label: "Show custom columns" }) }), _jsx(FieldRow, { label: "Customer Notes", hint: "Show the 'Notes to Customer' block on the PDF", source: src('invoiceShowNotes'), children: _jsx(Toggle, { ...f('invoiceShowNotes'), label: "Show customer notes section" }) }), _jsx(FieldRow, { label: "Footer / Terms", hint: "Show the footer text and payment terms block at the bottom of the PDF", source: src('invoiceShowFooter'), children: _jsx(Toggle, { ...f('invoiceShowFooter'), label: "Show footer and terms section" }) }), _jsx(FieldRow, { label: "Show MoR Tax QR Code", hint: "Print the NBE-IQR QR code for ERCA e-Tax verification", source: src('invoiceShowQr'), children: _jsx(Toggle, { ...f('invoiceShowQr'), label: "Print QR code on invoice" }) }), _jsx(FieldRow, { label: "Show Company Logo", hint: "Display your company logo from the Company profile section", source: src('invoiceShowLogo'), children: _jsx(Toggle, { ...f('invoiceShowLogo'), label: "Display company logo on PDF" }) }), _jsx(FieldRow, { label: "Show Bank Details", hint: "Print bank account and payment instructions in the footer", source: src('invoiceShowBankDetails'), children: _jsx(Toggle, { ...f('invoiceShowBankDetails'), label: "Print bank details on invoice" }) })] }), _jsxs("div", { className: "mb-1 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2 py-2 mb-1", children: [_jsx(AlignLeft, { size: 13, className: "text-slate-400 shrink-0" }), _jsx("p", { className: "text-[11px] font-bold text-slate-500 uppercase tracking-widest", children: "Footer" })] }), _jsx(FieldRow, { label: "Default Footer Terms", hint: "Printed at the bottom of every invoice PDF; supports plain text", source: src('invoiceFooter'), children: _jsx("textarea", { className: "ovds-input w-full max-w-lg", rows: 3, value: data['invoiceFooter'] ?? '', onChange: e => onChange('invoiceFooter', e.target.value), placeholder: "Payment is due within 30 days. Late payments attract 15% p.a. interest. Thank you for your business." }) })] }), _jsx("div", { className: "mt-6 pt-5 border-t border-slate-100 dark:border-slate-800", children: _jsxs("div", { className: "rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 p-5", children: [_jsx("div", { className: "flex items-start justify-between gap-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0", children: _jsx(Wand2, { size: 18, className: "text-white" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: "text-sm font-bold text-violet-900 dark:text-violet-200", children: "Print-ready Invoice Template App" }), _jsx("span", { className: "px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-violet-600 text-white", children: "App" })] }), _jsx("p", { className: "text-xs text-violet-700 dark:text-violet-300 leading-relaxed max-w-sm", children: "Visually design invoice layouts with a drag-and-drop builder \u2014 no coding required. Add custom backgrounds, unlimited custom fields, and multiple distinct template designs for PDF printing and sharing." }), _jsx("ul", { className: "mt-3 space-y-1.5", children: [
                                                    { icon: _jsx(LayoutTemplate, { size: 11 }), text: 'Drag-and-drop layout editor with live preview' },
                                                    { icon: _jsx(Columns, { size: 11 }), text: 'Unlimited custom fields and column definitions' },
                                                    { icon: _jsx(Sparkles, { size: 11 }), text: 'Multiple distinct templates — switch per invoice' },
                                                    { icon: _jsx(Type, { size: 11 }), text: 'Add your logo, business details, and payment terms' },
                                                ].map((item, i) => (_jsxs("li", { className: "flex items-center gap-2 text-[11px] text-violet-700 dark:text-violet-300", children: [_jsx("span", { className: "text-violet-500 shrink-0", children: item.icon }), item.text] }, i))) })] })] }) }), _jsxs("div", { className: "mt-4 flex items-center gap-3", children: [_jsxs(Link, { to: "/apps/invoice-templates", className: "inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-violet-500/30", children: [_jsx(Wand2, { size: 13 }), " Open Template Builder"] }), _jsxs("a", { href: "https://ovds.com/apps/invoice-template", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors", children: ["Learn more ", _jsx(ExternalLink, { size: 11 })] })] })] }) })] }));
}
function DefaultsSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5", children: "Pre-set common base parameters \u2014 default bank account, payment methods, and tax rates \u2014 to maximize data entry speed." }), _jsx(FieldRow, { label: "Default Bank Account", hint: "Primary bank account for new invoices and payments", source: src('defaultBankAccount'), children: _jsx(TI, { ...f('defaultBankAccount'), placeholder: "e.g. CBE-1234567890" }) }), _jsx(FieldRow, { label: "Default Payment Method", source: src('defaultPaymentMethod'), children: _jsx(SI, { ...f('defaultPaymentMethod'), options: [
                        { label: 'Cash', value: 'cash' },
                        { label: 'Bank Transfer', value: 'bank_transfer' },
                        { label: 'Telebirr', value: 'telebirr' },
                        { label: 'CBE Birr', value: 'cbe_birr' },
                        { label: 'Check', value: 'check' },
                    ] }) }), _jsx(FieldRow, { label: "Default Tax Rate (%)", hint: "Default tax rate applied to new line items", source: src('defaultTaxRate'), children: _jsx(TI, { ...f('defaultTaxRate'), placeholder: "15" }) }), _jsx(FieldRow, { label: "Default Invoice Due Days", source: src('defaultInvoiceDueDays'), children: _jsx(TI, { ...f('defaultInvoiceDueDays'), placeholder: "30" }) }), _jsx(FieldRow, { label: "Default Invoice Reminder Days", source: src('defaultInvoiceReminderDays'), children: _jsx(TI, { ...f('defaultInvoiceReminderDays'), placeholder: "7" }) }), _jsx(FieldRow, { label: "Default Currency", source: src('defaultCurrency'), children: _jsx(SI, { ...f('defaultCurrency'), options: CURRENCY_OPTS }) })] }));
}
function CurrencySection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5", children: "This framework dictates how the ledger handles foreign transactions. Establish a single Base Currency that anchors all internal ledger math, and optionally automate daily exchange rate updates." }), _jsx(FieldRow, { label: "Base Currency", hint: "Single target currency that anchors all ledger math", source: src('defaultCurrency'), children: _jsx(SI, { ...f('defaultCurrency'), options: CURRENCY_OPTS }) }), _jsx(FieldRow, { label: "Currency Symbol Position", source: src('currencyPosition'), children: _jsx(SI, { ...f('currencyPosition'), options: [
                        { label: 'Before amount — ETB 1,000', value: 'before' },
                        { label: 'After amount — 1,000 ETB', value: 'after' },
                    ] }) }), _jsx(FieldRow, { label: "Exchange Rate Provider", hint: "Source for automatic rate calculations", source: src('currencyRateProvider'), children: _jsx(SI, { ...f('currencyRateProvider'), options: [
                        { label: 'Manual entry', value: 'manual' },
                        { label: 'National Bank of Ethiopia (NBE)', value: 'nbe' },
                        { label: 'Open Exchange Rates', value: 'openexchangerates' },
                        { label: 'Fixer.io', value: 'fixer' },
                    ] }) }), _jsx(FieldRow, { label: "Auto-update Rates", hint: "Fetch rates automatically daily to calculate realized FX gains/losses", source: src('currencyAutoUpdate'), children: _jsx(Toggle, { ...f('currencyAutoUpdate'), label: "Enable daily automatic rate updates" }) }), _jsx(FieldRow, { label: "Report Currency", hint: "Currency for financial reports and statements", source: src('reportCurrency'), children: _jsx(SI, { ...f('reportCurrency'), options: CURRENCY_OPTS.slice(0, 3) }) }), _jsxs("div", { className: "mt-4 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs(Link, { to: "/banking/fx-rates", className: "inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors", children: [_jsx(DollarSign, { size: 14 }), " Manage Exchange Rates"] }), _jsx("p", { className: "text-xs text-slate-400 mt-2", children: "View and update daily exchange rates, fetch live NBE rates, and convert amounts." })] })] }));
}
function EmailSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5", children: "Configure your outgoing mail server so invoices, reminders, and alerts are delivered reliably. Toggle between standard PHP mail or external SMTP connections." }), _jsx(FieldRow, { label: "Mail Engine", hint: "Method used to route outgoing emails", source: src('mailEngine'), children: _jsx(SI, { ...f('mailEngine'), options: [
                        { label: 'SMTP (recommended)', value: 'smtp' },
                        { label: 'PHP Mail', value: 'php_mail' },
                        { label: 'Mailgun', value: 'mailgun' },
                        { label: 'SendGrid', value: 'sendgrid' },
                    ] }) }), _jsx(FieldRow, { label: "SMTP Host", hint: "e.g., smtp.gmail.com or smtp.mailtrap.io", source: src('smtpHost'), children: _jsx(TI, { ...f('smtpHost'), placeholder: "smtp.mailtrap.io" }) }), _jsx(FieldRow, { label: "SMTP Port", hint: "587 for TLS (recommended), 465 for SSL", source: src('smtpPort'), children: _jsx(TI, { ...f('smtpPort'), placeholder: "587" }) }), _jsx(FieldRow, { label: "Encryption Protocol", source: src('smtpEncryption'), children: _jsx(SI, { ...f('smtpEncryption'), options: [
                        { label: 'TLS (recommended)', value: 'tls' },
                        { label: 'SSL', value: 'ssl' },
                        { label: 'None', value: 'none' },
                    ] }) }), _jsx(FieldRow, { label: "SMTP Username", hint: "Your SMTP authentication username", source: src('smtpUsername'), children: _jsx(TI, { ...f('smtpUsername'), placeholder: "user@example.com" }) }), _jsx(FieldRow, { label: "SMTP Password", hint: "Your SMTP authentication password", source: src('smtpPassword'), children: _jsx(PasswordField, { ...f('smtpPassword'), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }) }), _jsx(FieldRow, { label: "From Name", hint: "Display name in outgoing emails", source: src('mailFromName'), children: _jsx(TI, { ...f('mailFromName'), placeholder: "OVDS" }) }), _jsx(FieldRow, { label: "From Address", hint: "Email address used as the sender", source: src('mailFromAddress'), children: _jsx(TI, { ...f('mailFromAddress'), placeholder: "noreply@ovds.com.et", type: "email" }) }), _jsxs("div", { className: "mt-4 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs(Link, { to: "/admin/notifications-settings", className: "inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors", children: [_jsx(Mail, { size: 14 }), " Advanced Notification Settings ", _jsx(ExternalLink, { size: 12 })] }), _jsx("p", { className: "text-xs text-slate-400 mt-2", children: "Configure templates, campaigns, Slack, and Intercom integrations." })] })] }));
}
function TaxSection({ data, onChange, sources }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5", children: "Ethiopian tax rates are governed by Proclamation No. 1395/2025. Consult MoR / ERCA before changing any rates. All taxes integrate with EIMS for MoR compliance." }), _jsx(FieldRow, { label: "VAT (Value Added Tax)", source: src('vatEnabled'), children: _jsx(Toggle, { ...f('vatEnabled'), label: "15% on taxable goods and services" }) }), _jsx(FieldRow, { label: "VAT Rate (%)", hint: "Standard statutory rate is 15%", source: src('vatRate'), children: _jsx(TI, { ...f('vatRate'), placeholder: "15" }) }), _jsx(FieldRow, { label: "TOT (Turnover Tax)", source: src('totEnabled'), children: _jsx(Toggle, { ...f('totEnabled'), label: "2% for below-VAT-threshold businesses" }) }), _jsx(FieldRow, { label: "WHT (Withholding Tax)", source: src('whtEnabled'), children: _jsx(Toggle, { ...f('whtEnabled'), label: "3% on qualifying service payments" }) }), _jsx(FieldRow, { label: "WHT Rate (%)", hint: "Standard: 2% on goods, 3% on services (Proc. 1395/2025 Art. 52). Check MoR ruling for your transaction type.", source: src('whtRate'), children: _jsx(TI, { ...f('whtRate'), placeholder: "2" }) }), _jsx(FieldRow, { label: "BIT (Business Income Tax)", source: src('bitEnabled'), children: _jsx(Toggle, { ...f('bitEnabled'), label: "30% flat on business income" }) }), _jsx(FieldRow, { label: "PIT (Personal Income Tax / PAYE)", source: src('pitEnabled'), children: _jsx(Toggle, { ...f('pitEnabled'), label: "0\u201335% via 6 PIT brackets (Proc. 1395/2025)" }) }), _jsx(FieldRow, { label: "DRRF (Disaster Risk Fund)", source: src('drrfEnabled'), children: _jsx(Toggle, { ...f('drrfEnabled'), label: "1% quarterly contribution" }) }), _jsxs("div", { className: "mt-4 pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsxs(Link, { to: "/settings/taxes", className: "inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors", children: [_jsx(Receipt, { size: 14 }), " Manage Tax Rate Profiles"] }), _jsx("p", { className: "text-xs text-slate-400 mt-2", children: "Create custom tax profiles, configure calculation methods (Normal, Inclusive, Compound, Fixed), and withholding rules." })] })] }));
}
// ── UsersSection sub-components ───────────────────────────────────────────────
function SubSectionHeader({ icon, title, description }) {
    return (_jsxs("div", { className: "flex items-center gap-2.5 mb-3 mt-5 first:mt-0", children: [_jsx("div", { className: "w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0", children: icon }), _jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide", children: title }), _jsx("p", { className: "text-[10px] text-slate-400", children: description })] })] }));
}
function UserQuickStats({ companyId }) {
    const statsQuery = useQuery({
        queryKey: ['users-quick-stats', companyId],
        queryFn: async () => {
            const token = localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token)
                headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`/api/auth/users?limit=200${companyId ? `&companyId=${encodeURIComponent(companyId)}` : ''}`, { headers });
            if (!res.ok)
                return null;
            const json = await res.json();
            const rows = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);
            const total = rows.length;
            const active = rows.filter((u) => !u.isLocked && (u.failedLoginAttempts ?? 0) < 5).length;
            const admins = rows.filter((u) => ['ADMIN', 'SPURADMIN', 'SUPERADMIN'].includes(u.role)).length;
            const locked = rows.filter((u) => u.isLocked || (u.failedLoginAttempts ?? 0) >= 5).length;
            return { total, active, admins, locked };
        },
        staleTime: 60000,
        enabled: true,
    });
    if (statsQuery.isLoading) {
        return (_jsx("div", { className: "grid grid-cols-4 gap-2 mb-5", children: [1, 2, 3, 4].map(i => (_jsx("div", { className: "h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" }, i))) }));
    }
    if (!statsQuery.data)
        return null;
    const { total, active, admins, locked } = statsQuery.data;
    const stats = [
        { label: 'Total Users', value: total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-700', icon: _jsx(Users, { size: 12, className: "text-slate-400" }) },
        { label: 'Active', value: active, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: _jsx(CheckCircle2, { size: 12, className: "text-emerald-500" }) },
        { label: 'Admins', value: admins, color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', icon: _jsx(ShieldCheck, { size: 12, className: "text-violet-500" }) },
        { label: 'Locked', value: locked, color: locked > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500', bg: locked > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-slate-50 dark:bg-slate-800/60', border: locked > 0 ? 'border-rose-200 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700', icon: _jsx(Lock, { size: 12, className: locked > 0 ? 'text-rose-500' : 'text-slate-400' }) },
    ];
    return (_jsx("div", { className: "grid grid-cols-4 gap-2 mb-5", children: stats.map(s => (_jsxs(Link, { to: "/users", className: `flex flex-col items-center justify-center gap-1 p-3 rounded-xl border ${s.bg} ${s.border} transition-all hover:shadow-sm group`, children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [s.icon, _jsx("span", { className: `text-lg font-bold leading-none ${s.color}`, children: s.value })] }), _jsx("span", { className: "text-[9px] text-slate-400 font-medium uppercase tracking-wide group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors", children: s.label })] }, s.label))) }));
}
// ── Main UsersSection ─────────────────────────────────────────────────────────
function UsersSection({ data, onChange, sources, companyId }) {
    const f = (k) => ({ value: data[k] ?? '', onChange: (v) => onChange(k, v) });
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-start gap-3 mb-5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl px-4 py-3", children: [_jsx("div", { className: "w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 mt-0.5", children: _jsx(ShieldCheck, { size: 14, className: "text-sky-600 dark:text-sky-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-sky-800 dark:text-sky-300 mb-0.5", children: "Access & security policies" }), _jsx("p", { className: "text-[11px] text-sky-700/80 dark:text-sky-400/80 leading-relaxed", children: "Configure role defaults, portal access, session timeouts, and authentication rules. These settings apply company-wide and are enforced at login time." })] })] }), _jsx(UserQuickStats, { companyId: companyId }), _jsx(SubSectionHeader, { icon: _jsx(UserCog, { size: 13 }), title: "Access Policies", description: "Default roles, portal access, and session rules" }), _jsxs("div", { className: "rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-1", children: [_jsx(FieldRow, { label: "Default User Role", hint: "Role assigned to newly created users", source: src('defaultUserRole'), children: _jsx(SI, { ...f('defaultUserRole'), options: [
                                { label: 'Admin — Full system access', value: 'ADMIN' },
                                { label: 'Accounting — Finance & billing', value: 'ACCOUNTING' },
                                { label: 'HR — Payroll & employee management', value: 'HR' },
                                { label: 'Data Clerk — Data entry only', value: 'DATA_CLERK' },
                                { label: 'Auditor — Read-only audit view', value: 'AUDITOR' },
                                { label: 'Employee — Self-service portal', value: 'EMPLOYEE' },
                                { label: 'Customer — Portal view/print', value: 'CUSTOMER' },
                                { label: 'Vendor — Portal view/print', value: 'VENDOR' },
                            ] }) }), _jsx(FieldRow, { label: "Customer Portal", hint: "Allow customers to view invoices and statements", source: src('allowCustomerPortal'), children: _jsx(Toggle, { ...f('allowCustomerPortal'), label: "Enable customer self-service portal" }) }), _jsx(FieldRow, { label: "Vendor Portal", hint: "Allow vendors to submit invoices and track payments", source: src('allowVendorPortal'), children: _jsx(Toggle, { ...f('allowVendorPortal'), label: "Enable vendor self-service portal" }) }), _jsx(FieldRow, { label: "Employee Portal", hint: "Allow employees to access payslips, leave, and claims", source: src('allowEmployeePortal'), children: _jsx(Toggle, { ...f('allowEmployeePortal'), label: "Enable employee self-service portal" }) }), _jsx(FieldRow, { label: "User Invitation", hint: "How new users are added to the system", source: src('invitationPolicy'), children: _jsx(SI, { ...f('invitationPolicy'), options: [
                                { label: 'Admin-only — Admins create accounts', value: 'admin_only' },
                                { label: 'Invite link — Admin sends invite email', value: 'invite_link' },
                                { label: 'Open registration — Anyone can sign up', value: 'open' },
                            ] }) }), _jsx(FieldRow, { label: "Session Timeout", hint: "Auto-logout after inactivity period", source: src('sessionTimeoutMinutes'), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TI, { ...f('sessionTimeoutMinutes'), placeholder: "60" }), _jsx("span", { className: "text-xs text-slate-400 shrink-0", children: "minutes" })] }) }), _jsx(FieldRow, { label: "Concurrent Sessions", hint: "Maximum simultaneous logins per user", source: src('maxConcurrentSessions'), children: _jsx(SI, { ...f('maxConcurrentSessions'), options: [
                                { label: '1 — Single session only', value: '1' },
                                { label: '2 — Two sessions', value: '2' },
                                { label: '5 — Up to five sessions', value: '5' },
                                { label: 'Unlimited', value: '0' },
                            ] }) })] }), _jsx(SubSectionHeader, { icon: _jsx(Lock, { size: 13 }), title: "Security Policies", description: "Password rules, 2FA, and lockout controls" }), _jsxs("div", { className: "rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-1", children: [_jsx(FieldRow, { label: "Require Two-Factor Auth", hint: "Enforce 2FA via TOTP or email OTP", source: src('requireTwoFactor'), children: _jsx(Toggle, { ...f('requireTwoFactor'), label: "Enforce 2FA for all admin users" }) }), _jsx(FieldRow, { label: "Minimum Password Length", hint: "Enforced on all user accounts", source: src('passwordMinLength'), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TI, { ...f('passwordMinLength'), placeholder: "8" }), _jsx("span", { className: "text-xs text-slate-400 shrink-0", children: "characters" })] }) }), _jsx(FieldRow, { label: "Password Complexity", hint: "Require uppercase, numbers and symbols", source: src('requirePasswordComplexity'), children: _jsx(Toggle, { ...f('requirePasswordComplexity'), label: "Require complex passwords" }) }), _jsx(FieldRow, { label: "Password Expiry (days)", hint: "Force password rotation \u2014 0 to disable", source: src('passwordExpiryDays'), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TI, { ...f('passwordExpiryDays'), placeholder: "0" }), _jsx("span", { className: "text-xs text-slate-400 shrink-0", children: "days (0 = off)" })] }) }), _jsx(FieldRow, { label: "Max Login Attempts", hint: "Lock account after N failed attempts", source: src('maxLoginAttempts'), children: _jsx(TI, { ...f('maxLoginAttempts'), placeholder: "5" }) }), _jsx(FieldRow, { label: "Lockout Duration", hint: "How long a locked account stays locked", source: src('lockoutDurationMinutes'), children: _jsx(SI, { ...f('lockoutDurationMinutes'), options: [
                                { label: '5 minutes', value: '5' },
                                { label: '15 minutes', value: '15' },
                                { label: '30 minutes', value: '30' },
                                { label: '1 hour', value: '60' },
                                { label: 'Until unlocked by admin', value: '0' },
                            ] }) })] }), _jsx(SubSectionHeader, { icon: _jsx(ClipboardList, { size: 13 }), title: "Audit & Compliance", description: "Log retention and IP access controls" }), _jsxs("div", { className: "rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-5", children: [_jsx(FieldRow, { label: "Audit Log Retention", hint: "How long login and action logs are kept", source: src('auditLogRetentionDays'), children: _jsx(SI, { ...f('auditLogRetentionDays'), options: [
                                { label: '30 days', value: '30' },
                                { label: '90 days', value: '90' },
                                { label: '180 days', value: '180' },
                                { label: '1 year', value: '365' },
                                { label: '2 years', value: '730' },
                            ] }) }), _jsx(FieldRow, { label: "IP Allowlist", hint: "Restrict logins to specific IP ranges", source: src('ipAllowlistEnabled'), children: _jsx(Toggle, { ...f('ipAllowlistEnabled'), label: "Enable IP allowlist (configure in Security settings)" }) }), _jsx(FieldRow, { label: "Login Notifications", hint: "Email users on new device or location logins", source: src('loginNotificationsEnabled'), children: _jsx(Toggle, { ...f('loginNotificationsEnabled'), label: "Send login alert emails" }) })] }), _jsxs("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-800", children: [_jsx("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3", children: "Quick access" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs(Link, { to: "/users", className: "flex items-center gap-2.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors group", children: [_jsx("div", { className: "w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0", children: _jsx(Users, { size: 12 }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "leading-tight", children: "Manage Users" }), _jsx("p", { className: "text-[9px] font-normal opacity-75 truncate", children: "Create, edit & assign roles" })] }), _jsx(ChevronRight, { size: 12, className: "ml-auto opacity-60 group-hover:opacity-100 shrink-0" })] }), _jsxs(Link, { to: "/settings/roles", className: "flex items-center gap-2.5 px-3 py-2.5 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-semibold transition-colors group", children: [_jsx("div", { className: "w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0", children: _jsx(Shield, { size: 12, className: "text-violet-600 dark:text-violet-400" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "leading-tight", children: "Roles & Permissions" }), _jsx("p", { className: "text-[9px] font-normal opacity-75 truncate", children: "RBAC permission matrix" })] }), _jsx(ChevronRight, { size: 12, className: "ml-auto opacity-60 group-hover:opacity-100 shrink-0" })] }), _jsxs(Link, { to: "/settings/security", className: "flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors group", children: [_jsx("div", { className: "w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0", children: _jsx(KeyRound, { size: 12, className: "text-slate-500 dark:text-slate-400" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "leading-tight", children: "Security Settings" }), _jsx("p", { className: "text-[9px] font-normal opacity-75 truncate", children: "MFA, sessions & IP rules" })] }), _jsx(ChevronRight, { size: 12, className: "ml-auto opacity-60 group-hover:opacity-100 shrink-0" })] })] })] })] }));
}
// ── Module labels ─────────────────────────────────────────────────────────────
const MODULE_META = {
    invoice: { label: 'Invoice', desc: 'Create and send tax-compliant EIMS invoices', isCore: true, icon: '🧾' },
    accounting: { label: 'Accounting', desc: 'Double-entry GL, journals & period close', isCore: true, icon: '📒' },
    banking: { label: 'Banking', desc: 'Bank accounts, feeds & reconciliation', isCore: false, icon: '🏦' },
    expenses: { label: 'Expenses', desc: 'Employee expense claims & approvals', isCore: false, icon: '💳' },
    payroll: { label: 'HR & Payroll', desc: 'Salary, PAYE, pension, benefits & leave', isCore: false, icon: '👥' },
    projects: { label: 'Projects', desc: 'Project tracking, timesheets & billing', isCore: false, icon: '📋' },
    inventory: { label: 'Inventory', desc: 'Stock items, FIFO/WA costing & warehouses', isCore: false, icon: '📦' },
    crm: { label: 'CRM', desc: 'Customer relationship management & pipeline', isCore: false, icon: '🤝' },
    vat: { label: 'VAT', desc: 'VAT ledgers and MoR monthly filings', isCore: false, icon: '📑' },
    bit: { label: 'BIT', desc: 'Business income tax returns & advance payments', isCore: false, icon: '🏢' },
    pit: { label: 'PIT / PAYE', desc: 'Personal income tax & employer PAYE', isCore: false, icon: '👤' },
    drrf: { label: 'DRRF', desc: 'Disaster Risk & Resilience Fund contributions', isCore: false, icon: '🛡️' },
    ifrs: { label: 'IFRS', desc: 'IFRS financial statements (IAS 1/7/17)', isCore: false, icon: '📊' },
    manufacturing: { label: 'Manufacturing', desc: 'BOM, work orders & production costing', isCore: false, icon: '🏭' },
    treasury: { label: 'Treasury', desc: 'Cash forecasting, investments & FX', isCore: false, icon: '💰' },
    notifications: { label: 'Notifications', desc: 'Email, SMS & push notification channels', isCore: true, icon: '🔔' },
    api: { label: 'API Access', desc: 'REST & oRPC API and webhook integrations', isCore: true, icon: '🔌' },
};
function ModulesSection({ data, onChange, sources }) {
    const core = Object.entries(MODULE_META).filter(([, m]) => m.isCore);
    const optional = Object.entries(MODULE_META).filter(([, m]) => !m.isCore);
    const src = (camel) => {
        if (!sources)
            return undefined;
        const snake = camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        return sources[snake]?.source;
    };
    const renderModule = ([key, meta]) => {
        const enabled = data[key] === 'true';
        return (_jsxs("div", { className: `flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${enabled ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("span", { className: "text-lg shrink-0", children: meta.icon }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("p", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", children: meta.label }), meta.isCore && _jsx("span", { className: "text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-bold uppercase", children: "Core" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5 truncate", children: meta.desc })] })] }), _jsx(Toggle, { value: data[key] ?? 'false', onChange: v => onChange(key, v), label: "" })] }, key));
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2", children: "Core Modules" }), _jsx("div", { className: "grid gap-2", children: core.map(renderModule) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2", children: "Optional Modules" }), _jsx("div", { className: "grid gap-2", children: optional.map(renderModule) })] }), _jsx("div", { className: "pt-2", children: _jsxs(Link, { to: "/settings/app-store", className: "inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors", children: [_jsx(Layers, { size: 14 }), " Browse Modules & Extensions ", _jsx(ExternalLink, { size: 12 })] }) })] }));
}
function DevelopersSection() {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5", children: ["For self-hosted installations, configuration is split: the web UI handles operational rules, the server ", _jsx("code", { className: "font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded", children: ".env" }), " file handles database strings, security keys, and debug logs."] }), _jsx("div", { className: "grid gap-3", children: [
                    { label: 'API Documentation', desc: 'REST & oRPC endpoints, Swagger UI, webhook guides', to: '/settings/api-docs', icon: _jsx(Code, { size: 16 }) },
                    { label: 'Developer Guide', desc: 'SDK references, quickstart, sandbox environments', to: '/settings/developers', icon: _jsx(Code, { size: 16 }) },
                    { label: 'Webhook Configuration', desc: 'Manage webhook endpoints and delivery logs', to: '/settings/api-docs', icon: _jsx(Code, { size: 16 }) },
                    { label: 'Settings Catalog', desc: 'Admin CRUD for categories, groups & field defs', to: '/settings/catalog', icon: _jsx(SettingsIcon, { size: 16 }) },
                    { label: 'Audit Logs', desc: 'Track all settings changes with timestamps', to: '/settings/audit-logs', icon: _jsx(SettingsIcon, { size: 16 }) },
                    { label: 'System Updates', desc: 'Update channel, auto-update & release notes', to: '/settings/releases', icon: _jsx(SettingsIcon, { size: 16 }) },
                ].map(item => (_jsxs(Link, { to: item.to, className: "flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all group", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-emerald-600 transition-colors", children: item.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", children: item.label }), _jsx("p", { className: "text-xs text-slate-500 truncate", children: item.desc })] }), _jsx(ArrowRight, { size: 14, className: "text-slate-300 group-hover:text-emerald-500 shrink-0 transition-colors" })] }, item.to + item.label))) })] }));
}
function IntegrationsSection({ data, onChange }) {
    const f = (key) => ({ value: data[key] ?? '', onChange: (v) => onChange(key, v) });
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5", children: "Manage third-party API keys and webhook endpoints. These settings are encrypted at rest." }), _jsx(FieldRow, { label: "OpenAI API Key", hint: "For AI-powered insights and automation", children: _jsx("input", { className: inputCls + ' pr-10', type: "password", value: data['openaiApiKey'] ?? '', onChange: e => onChange('openaiApiKey', e.target.value), placeholder: "sk-..." }) }), _jsx(FieldRow, { label: "Gemini API Key", hint: "Google Gemini AI integration", children: _jsx("input", { className: inputCls + ' pr-10', type: "password", value: data['geminiApiKey'] ?? '', onChange: e => onChange('geminiApiKey', e.target.value), placeholder: "AI..." }) }), _jsx(FieldRow, { label: "SIEM Webhook URL", hint: "Security event forwarding endpoint", children: _jsx("input", { className: inputCls, type: "url", value: data['siemWebhookUrl'] ?? '', onChange: e => onChange('siemWebhookUrl', e.target.value), placeholder: "https://siem.example.com/webhook" }) }), _jsx(FieldRow, { label: "SIEM Token", hint: "Bearer token for SIEM authentication", children: _jsx("input", { className: inputCls + ' pr-10', type: "password", value: data['siemToken'] ?? '', onChange: e => onChange('siemToken', e.target.value), placeholder: "token" }) }), _jsx(FieldRow, { label: "Request Signing Secret", hint: "Used to sign banking transfer requests", children: _jsx("input", { className: inputCls + ' pr-10', type: "password", value: data['requestSigningSecret'] ?? '', onChange: e => onChange('requestSigningSecret', e.target.value), placeholder: "secret" }) })] }));
}
// ── Sidebar ───────────────────────────────────────────────────────────────────
function PanelSidebar({ active, onSelect }) {
    const groups = ['general', 'advanced', 'system'];
    return (_jsxs("div", { className: "ovds-widget-card overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-slate-100 dark:border-slate-800", children: _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center", children: _jsx(SettingsIcon, { size: 15, className: "text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-slate-700 dark:text-slate-200", children: "Settings" }), _jsx("p", { className: "text-[9px] text-slate-400 leading-tight", children: "Central Control Panel" })] })] }) }), _jsx("nav", { className: "py-2", "aria-label": "Settings navigation", children: groups.map(group => {
                    const items = SETTINGS_SECTIONS.filter(s => s.group === group);
                    return (_jsxs("div", { className: "px-2 py-1", children: [_jsx("p", { className: "px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest", children: GROUP_LABELS[group] }), _jsx("div", { className: "space-y-0.5 mt-0.5", children: items.map(section => {
                                    const isActive = active === section.id;
                                    return (_jsxs("button", { type: "button", onClick: () => onSelect(section.id), className: `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`, children: [_jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`, children: section.icon }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: `text-xs truncate ${isActive ? 'font-bold' : 'font-medium'}`, children: section.label }), _jsx("p", { className: "text-[9px] text-slate-400 leading-tight truncate", children: section.description })] }), isActive && _jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" })] }, section.id));
                                }) })] }, group));
                }) })] }));
}
// ── Setup progress banner ─────────────────────────────────────────────────────
function SetupBanner({ passedChecks, totalChecks, pct }) {
    if (pct >= 100)
        return null;
    return (_jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0", children: _jsx(AlertCircle, { size: 15 }) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "text-xs font-bold text-amber-800 dark:text-amber-300", children: ["Setup incomplete \u2014 ", pct, "% (", passedChecks, "/", totalChecks, " sections configured)"] }), _jsx("p", { className: "text-[10px] text-amber-600 dark:text-amber-400", children: "Complete the setup wizard to unlock all features." })] })] }), _jsxs(Link, { to: "/settings/setup-wizard", className: "inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-all shrink-0", children: ["Continue Setup ", _jsx(ArrowRight, { size: 10 })] })] }));
}
export function CentralControlPanelContent({ orpc, canWrite, companyId, defaultSection }) {
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get('tab');
    const validSections = SETTINGS_SECTIONS.map(s => s.id);
    const [activeSection, setActiveSection] = useState(rawTab && validSections.includes(rawTab) ? rawTab : (defaultSection ?? 'profile'));
    const [draft, setDraft] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const profileQuery = useQuery({
        queryKey: ['settings', 'profile', companyId],
        queryFn: () => orpc.settings.profile.get({ companyId: companyId }),
        enabled: !!companyId,
        staleTime: 30000,
    });
    const checklistQuery = useQuery({
        queryKey: ['settings', 'checklist', companyId],
        queryFn: () => orpc.settings.profile.checklist({ companyId: companyId }),
        enabled: !!companyId,
        staleTime: 60000,
    });
    const mergeSourcesQuery = useQuery({
        queryKey: ['settings', 'merge-sources', companyId],
        queryFn: async () => {
            const res = await fetch(`/api/settings/merge-sources/${companyId}`, {
                headers: { Authorization: `Bearer ${(localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '')}` },
            });
            if (!res.ok)
                throw new Error('Failed to load merge sources');
            return res.json();
        },
        enabled: !!companyId,
        staleTime: 60000,
    });
    const updateMutation = useMutation({
        mutationFn: ({ section, data }) => orpc.settings.profile.update({ companyId: companyId, section, data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['settings', 'profile', companyId] });
            qc.invalidateQueries({ queryKey: ['settings', 'checklist', companyId] });
        },
    });
    // Merge server data with in-memory draft for the active section
    const serverData = (profileQuery.data?.[activeSection] ?? {});
    const effectiveData = { ...serverData, ...draft };
    const handleChange = useCallback((key, value) => {
        setDraft(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);
    const handleSave = useCallback(async () => {
        if (!isDirty || Object.keys(draft).length === 0 || !canWrite)
            return;
        await updateMutation.mutateAsync({ section: activeSection, data: draft });
        setDraft({});
        setIsDirty(false);
    }, [isDirty, draft, activeSection, updateMutation, canWrite]);
    const handleSectionChange = useCallback((section) => {
        if (isDirty && !confirm('You have unsaved changes. Discard them?'))
            return;
        setActiveSection(section);
        setDraft({});
        setIsDirty(false);
        setSearchParams((prev) => { prev.set('tab', section); return prev; }, { replace: true });
    }, [isDirty, setSearchParams]);
    const checklist = checklistQuery.data?.checks;
    const setupPct = checklist ? Math.round((checklist.passedChecks / checklist.totalChecks) * 100) : 0;
    const activeMeta = SETTINGS_SECTIONS.find(s => s.id === activeSection);
    if (!companyId) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-center", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4", children: _jsx(AlertCircle, { size: 22 }) }), _jsx("p", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", children: "No company selected" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Select a company from the top bar to manage settings." })] }));
    }
    return (_jsxs("div", { className: "space-y-4 animate-in fade-in duration-300", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Settings" }), _jsx("p", { className: "text-sm text-slate-500 mt-0.5", children: "Central control panel for company profile, tax laws, currency, security, and email configuration." })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [isDirty && (_jsxs("button", { onClick: () => { setDraft({}); setIsDirty(false); }, className: "ovds-btn-secondary flex items-center gap-1.5 text-xs", children: [_jsx(RefreshCw, { size: 12 }), " Discard"] })), canWrite && activeSection !== 'developers' && (_jsxs("button", { onClick: handleSave, disabled: !isDirty || updateMutation.isPending, className: "ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50", children: [_jsx(Save, { size: 13 }), updateMutation.isPending ? 'Saving…' : 'Save changes'] }))] })] }), checklist && (_jsx(SetupBanner, { passedChecks: checklist.passedChecks, totalChecks: checklist.totalChecks, pct: setupPct })), checklist && setupPct < 100 && (_jsxs("div", { className: "ovds-widget-card px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Setup progress" }), _jsxs("span", { className: "text-[10px] font-bold text-slate-500", children: [checklist.passedChecks, "/", checklist.totalChecks] })] }), _jsx("div", { className: "h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${setupPct}%`, background: setupPct === 100 ? '#22c55e' : '#f59e0b' } }) })] })), _jsxs("div", { className: "grid gap-5", style: { gridTemplateColumns: '248px 1fr' }, children: [_jsx(PanelSidebar, { active: activeSection, onSelect: handleSectionChange }), _jsxs("div", { className: "ovds-widget-card p-6 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0", children: activeMeta?.icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-slate-200", children: activeMeta?.label }), _jsx("p", { className: "text-[10px] text-slate-400", children: activeMeta?.description })] }), isDirty && (_jsxs("span", { className: "ml-auto flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 rounded-lg", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" }), "Unsaved changes"] }))] }), profileQuery.isLoading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3, 4].map(i => _jsx("div", { className: "h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" }, i)) })) : profileQuery.isError ? (_jsxs("div", { className: "flex items-center gap-2 text-rose-600 text-sm", children: [_jsx(AlertCircle, { size: 14 }), " Failed to load settings. Check your connection and try again."] })) : (_jsxs(_Fragment, { children: [activeSection === 'profile' && _jsx(ProfileSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'localization' && _jsx(LocalizationSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'financial' && _jsx(FinancialSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'invoice' && _jsx(InvoiceSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'defaults' && _jsx(DefaultsSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'currency' && _jsx(CurrencySection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'email' && _jsx(EmailSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'taxes' && _jsx(TaxSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data }), activeSection === 'users' && _jsx(UsersSection, { data: effectiveData, onChange: handleChange, sources: mergeSourcesQuery.data, companyId: companyId }), activeSection === 'modules' && _jsx(ModulesSection, { data: effectiveData, onChange: handleChange }), activeSection === 'developers' && _jsx(DevelopersSection, {}), activeSection === 'integrations' && _jsx(IntegrationsSection, { data: effectiveData, onChange: handleChange })] })), isDirty && activeSection !== 'developers' && (_jsx("div", { className: "mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end", children: _jsxs("button", { onClick: handleSave, disabled: updateMutation.isPending || !canWrite, className: "ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50", children: [_jsx(Save, { size: 13 }), updateMutation.isPending ? 'Saving…' : 'Save changes'] }) })), updateMutation.isSuccess && !isDirty && (_jsxs("div", { className: "mt-4 flex items-center gap-1.5 text-emerald-600 text-xs font-medium", children: [_jsx(CheckCircle2, { size: 13 }), " Changes saved successfully."] })), updateMutation.isError && (_jsxs("div", { className: "mt-4 flex items-center gap-1.5 text-rose-600 text-xs font-medium", children: [_jsx(AlertCircle, { size: 13 }), " Failed to save \u2014 ", updateMutation.error?.message ?? 'unknown error', "."] }))] })] })] }));
}
export default CentralControlPanelContent;
