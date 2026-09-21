import {
  Building2, ChevronRight, ChevronLeft, Check, X,
  Banknote, Users, Package, ShieldCheck, Zap, Upload,
  Cloud, Server, AlertCircle, RefreshCw, Star, MapPin,
  Phone, Mail, Hash, Globe, FileSpreadsheet, Plus, Trash2,
  Key, Eye, EyeOff, ExternalLink, Settings,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { setupApi } from '../services/setupApi';



// -- Helpers --------------------------------------------------------------------

const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, x => chars[x % chars.length]).join('');
};

// -- Types ---------------------------------------------------------------------

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  optional?: boolean;
}

interface CompanyForm {
  name: string;
  address: string;
  tin: string;
  phone: string;
  email: string;
  website: string;
  businessType: string;
  deploymentType: 'cloud' | 'onpremise';
  apiKey: string;
  language: string;
  logoUrl?: string;
  industry?: string;
  companyAge?: string;
  teamSize?: string;
  userRole?: string;
}

interface FinancialForm {
  currency: string;
  fiscalYearStart: string;
  vatRegistered: boolean;
  vatNumber: string;
  defaultInvoiceDueDays: string;
}

interface InviteRow {
  email: string;
  role: string;
  tempPassword?: string;
}

interface ErcaForm {
  etaxActive: boolean;
  qrEnabled: boolean;
  monthlyFiling: boolean;
  drrfEnabled: boolean;
  bitRegistered: boolean;
  withholdingAgent: boolean;
  tinVerified: boolean;
}

interface FieldError {
  [key: string]: string;
}

// -- Constants -----------------------------------------------------------------

const DRAFT_KEY = 'ovds_wizard_draft';

const STEPS: WizardStep[] = [
  { id: 'deploy',     title: 'Deployment',       description: 'Cloud or self-hosted setup',              icon: <Cloud size={18} /> },
  { id: 'company',    title: 'Company Profile',   description: 'Name, address, and registration details', icon: <Building2 size={18} /> },
  { id: 'financial',  title: 'Financial Setup',   description: 'Currency, fiscal year, and tax settings', icon: <Banknote size={18} /> },
  { id: 'users',      title: 'Add Users',         description: 'Invite your team and assign roles',        icon: <Users size={18} />, optional: true },
  { id: 'apps',       title: 'Select Apps',       description: 'Choose modules to activate',               icon: <Package size={18} /> },
  { id: 'import',     title: 'Import Data',       description: 'Migrate existing data (optional)',         icon: <FileSpreadsheet size={18} />, optional: true },
  { id: 'compliance', title: 'ERCA Compliance',   description: 'VAT registration and e-Invoice setup',     icon: <ShieldCheck size={18} /> },
  { id: 'done',       title: 'Ready to Go',       description: 'Your company is set up',                   icon: <Zap size={18} /> },
];

const CURRENCIES = [
  { code: 'ETB', label: 'Ethiopian Birr (ETB)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic (አማርኛ)' },
  { code: 'om', label: 'Oromo (Afään Oromöö)' },
  { code: 'ti', label: 'Tigrinya (ትግርኛ)' },
];

const INDUSTRIES = [
  'Retail', 'Wholesale', 'Manufacturing', 'Services', 'Construction', 'Education', 'Healthcare', 'Agriculture', 'Technology', 'Other'
];

const TEAM_SIZES = [
  '1-5', '6-10', '11-50', '51-200', '201+'
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ovds-style app catalog:
// Pre-installed (always on): 2FA, Address Finder
// Optional (user selects):   Calendar, Live Currency
// Featured (recommended):    Telebirr, Payroll, VAT/ERCA, Accounting GL, HR, CRM, Inventory, Disaster Fund
const APPS = [
  // -- Pre-installed ----------------------------------------------------------
  { key: '2fa',            label: '2FA',               desc: 'Two-factor authentication protects your financial data from unauthorized access.',    icon: '🔐', preInstalled: true,  recommended: true  },
  { key: 'address-finder', label: 'Address Finder',    desc: 'Auto-complete addresses on invoices and bills, saving time on data entry.',           icon: '📍', preInstalled: true,  recommended: true  },
  // -- Optional --------------------------------------------------------------
  { key: 'calendar',       label: 'Calendar',          desc: 'See dates for invoices, bills, payroll, and business activities in one view.',        icon: '📅', preInstalled: false, recommended: false },
  { key: 'live-currency',  label: 'Live Currency',     desc: 'Retrieve live exchange rates when sending invoices in foreign currencies.',           icon: '💱', preInstalled: false, recommended: false },
  // -- Featured / Recommended ------------------------------------------------
  { key: 'telebirr',       label: 'Telebirr Payments', desc: 'Accept Ethio Telecom telebirr payments with QR code generation on invoices.',        icon: '⚡', preInstalled: false, recommended: true  },
  { key: 'payroll',        label: 'Payroll Engine',    desc: 'Ethiopian PIT-compliant payroll with pension, DRRF, and payslip generation.',         icon: '💰', preInstalled: false, recommended: true  },
  { key: 'vat',            label: 'VAT / ERCA',        desc: 'Proclamation 1341/2024 compliant VAT filing with eTax portal integration.',          icon: '🛡️', preInstalled: false, recommended: true  },
  { key: 'accounting',     label: 'Accounting GL',     desc: 'Full double-entry general ledger with IFRS-compliant financial reports.',             icon: '📒', preInstalled: false, recommended: true  },
  { key: 'hr',             label: 'HR & Attendance',   desc: 'Employee management, biometric attendance, and leave management.',                    icon: '👥', preInstalled: false, recommended: false },
  { key: 'inventory',      label: 'Inventory',         desc: 'Stock management with FIFO/WA costing (IFRS IAS 2 compliant).',                      icon: '📦', preInstalled: false, recommended: false },
  { key: 'crm',            label: 'CRM',               desc: 'Customer relationship management with deal pipeline and credit scoring.',             icon: '🤝', preInstalled: false, recommended: false },
  { key: 'disaster',       label: 'Disaster Fund',     desc: 'DRRF levy tracking across 17+ categories per Regulation 570/2025.',                  icon: '🏦', preInstalled: false, recommended: false },
];

const BUSINESS_TYPES = [
  { value: 'SMALL_BUSINESS',    label: 'Small Business',    desc: '< 50 employees' },
  { value: 'MEDIUM_ENTERPRISE', label: 'Medium Enterprise', desc: '50–250 employees' },
  { value: 'LARGE_ENTERPRISE',  label: 'Large Enterprise',  desc: '250+ employees' },
  { value: 'MANUFACTURING',     label: 'Manufacturing',     desc: 'Production & supply chain' },
  { value: 'FREELANCER',        label: 'Freelancer / NGO',  desc: 'Individual or non-profit' },
  { value: 'GOVERNMENT',        label: 'Government',        desc: 'Public sector entity' },
];

const IMPORT_TEMPLATES = [
  { key: 'chart_of_accounts', label: 'Chart of Accounts',  ext: 'CSV' },
  { key: 'customers',         label: 'Customers',           ext: 'CSV' },
  { key: 'vendors',           label: 'Vendors',             ext: 'CSV' },
  { key: 'items',             label: 'Products & Services', ext: 'CSV' },
  { key: 'opening_balances',  label: 'Opening Balances',    ext: 'CSV' },
];

// CSV template content per import type
const TEMPLATE_CSV: Record<string, { headers: string[]; sample: string[][] }> = {
  chart_of_accounts: {
    headers: ['Code', 'Name', 'Type', 'Category', 'Description', 'IsActive'],
    sample: [
      ['1010', 'Cash & Cash Equivalents', 'ASSET', 'CASH', 'Petty cash and bank notes', 'TRUE'],
      ['1200', 'Trade Receivables', 'ASSET', 'ACCOUNTS_RECEIVABLE', 'Customer invoices outstanding', 'TRUE'],
      ['2000', 'Trade Payables', 'LIABILITY', 'ACCOUNTS_PAYABLE', 'Vendor bills outstanding', 'TRUE'],
      ['4000', 'Revenue', 'INCOME', 'REVENUE', 'Sales revenue from customers', 'TRUE'],
      ['5000', 'Operating Expenses', 'EXPENSE', 'OPERATING_EXPENSE', 'General operating costs', 'TRUE'],
    ],
  },
  customers: {
    headers: ['Name', 'Email', 'Phone', 'Address', 'TIN', 'VATNumber', 'PaymentTerms', 'CreditLimit', 'Notes'],
    sample: [
      ['Tigray Manufacturing PLC', 'info@tigray-mfg.et', '+251 34 XXX XXXX', 'Mekelle, Tigray', '0000000000000', 'ETR/0000/0000', 'NET30', '500000', ''],
      ['Addis Trading Co.', 'accounts@addis-trading.et', '+251 11 XXX XXXX', 'Addis Ababa', '0000000000001', '', 'NET15', '200000', 'Key account'],
    ],
  },
  vendors: {
    headers: ['Name', 'Email', 'Phone', 'Address', 'TIN', 'BankName', 'AccountNumber', 'PaymentTerms', 'Notes'],
    sample: [
      ['Ethio Supplies Ltd', 'billing@ethio-supplies.et', '+251 11 XXX XXXX', 'Addis Ababa', '0000000000002', 'Commercial Bank of Ethiopia', '1000123456789', 'NET30', ''],
      ['Mekelle Hardware', 'info@mekelle-hw.et', '+251 34 XXX XXXX', 'Mekelle, Tigray', '0000000000003', 'Awash Bank', '0100123456789', 'NET15', ''],
    ],
  },
  items: {
    headers: ['Name', 'Code', 'Description', 'Category', 'Price', 'VATRate', 'Stock', 'Unit', 'IsService'],
    sample: [
      ['Office Chair', 'FURN-001', 'Ergonomic office chair', 'FURNITURE', '4500', '15', '20', 'PCS', 'FALSE'],
      ['Consulting Service', 'SVC-001', 'IT consulting per hour', 'SERVICES', '1500', '15', '0', 'HR', 'TRUE'],
      ['A4 Paper Ream', 'STAT-001', '500 sheets A4 80gsm', 'STATIONERY', '180', '15', '100', 'REAM', 'FALSE'],
    ],
  },
  opening_balances: {
    headers: ['AccountCode', 'AccountName', 'DebitBalance', 'CreditBalance', 'AsOfDate', 'Notes'],
    sample: [
      ['1010', 'Cash & Cash Equivalents', '250000.00', '0.00', new Date().toISOString().split('T')[0], 'Opening cash balance'],
      ['1200', 'Trade Receivables', '180000.00', '0.00', new Date().toISOString().split('T')[0], 'Outstanding customer invoices'],
      ['2000', 'Trade Payables', '0.00', '95000.00', new Date().toISOString().split('T')[0], 'Outstanding vendor bills'],
      ['3000', 'Owner Equity', '0.00', '335000.00', new Date().toISOString().split('T')[0], 'Opening equity balance'],
    ],
  },
};

function downloadTemplate(key: string, label: string) {
  const tpl = TEMPLATE_CSV[key];
  if (!tpl) return;
  const rows = [
    [`# ${label} Import Template — OVDS ovds`],
    [`# Generated: ${new Date().toLocaleString()} | Required fields marked with *`],
    [],
    tpl.headers,
    ...tpl.sample,
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${key}_template.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// -- Helpers -------------------------------------------------------------------

const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure-100)] dark:focus:ring-green-900/40 focus:border-[var(--pro-azure)] transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600 text-gray-800 dark:text-slate-200';
const labelCls = 'block text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5';
const errorCls = 'text-[11px] text-red-500 mt-1.5 flex items-center gap-1.5 font-semibold';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[var(--pro-azure-50)]0' : 'bg-gray-200 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// -- Confetti burst on completion ----------------------------------------------

function ConfettiBurst() {
  const colors = ['#00E784','#00E784','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2 h-2 rounded-sm animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 0.6}s`,
            animationDuration: `${0.6 + Math.random() * 0.8}s`,
            opacity: 0.8,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// -- Props ---------------------------------------------------------------------

interface Props {
  onClose: () => void;
  onComplete?: () => void;
}

// -- Component -----------------------------------------------------------------

const CompanySetupWizard: React.FC<Props> = ({ onClose, onComplete }) => {
  const { refreshCompanies, selectedCompanyId: businessCompanyId } = useBusiness();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // -- Form state --------------------------------------------------------------
  const [company, setCompany] = useState<CompanyForm>({
    name: '', address: '', tin: '', phone: '', email: '',
    website: '', businessType: 'SMALL_BUSINESS', deploymentType: 'cloud', apiKey: '',
    language: 'en', industry: 'Services', teamSize: '1-5', userRole: 'Owner', companyAge: 'New Business'
  });
  const [financial, setFinancial] = useState<FinancialForm>({
    currency: 'ETB', fiscalYearStart: '7', vatRegistered: false,
    vatNumber: '', defaultInvoiceDueDays: '30',
  });
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'EMPLOYEE' }]);
  const [selectedApps, setSelectedApps] = useState<string[]>(['payroll', 'vat', 'accounting', 'telebirr']);
  const [erca, setErca] = useState<ErcaForm>({ etaxActive: false, qrEnabled: false, monthlyFiling: false, drrfEnabled: false, bitRegistered: false, withholdingAgent: false, tinVerified: false });
  const [importFiles, setImportFiles] = useState<Record<string, File | null>>({});
  const [showApiKey, setShowApiKey] = useState(false);

  // -- Draft auto-save ---------------------------------------------------------
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, company, financial, invites, selectedApps, erca }));
    } catch { /* storage full — ignore */ }
  }, [step, company, financial, invites, selectedApps, erca]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.company)   setCompany(d.company);
      if (d.financial) setFinancial(d.financial);
      if (d.invites)   setInvites(d.invites);
      if (d.selectedApps) setSelectedApps(d.selectedApps);
      if (d.erca)      setErca(d.erca);
      if (typeof d.step === 'number' && d.step > 0) setStep(d.step);
    } catch { /* corrupt draft — ignore */ }
  }, []);

  // Auto-save draft on every change
  useEffect(() => { saveDraft(); }, [saveDraft]);

  // Scroll content to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setErrors({});
  }, [step]);

  const isLast = step === STEPS.length - 1;
  const currentStep = STEPS[step];
  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  // -- Validation --------------------------------------------------------------
  const validate = (): boolean => {
    const e: FieldError = {};
    if (step === 1) {
      if (!company.name.trim()) e.name = 'Company name is required';
      if (company.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email))
        e.email = 'Enter a valid email address';
      if (company.tin && !/^\d{10}$/.test(company.tin.replace(/\s/g, '')))
        e.tin = 'TIN must be 10 digits';
    }
    if (step === 2) {
      if (financial.vatRegistered && !financial.vatNumber.trim())
        e.vatNumber = 'VAT number is required when VAT registered';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // -- Finish ------------------------------------------------------------------
  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Create company record — ignore 409 (already exists from a previous run)
      try {
        await api.post('/ovds/companies', {
          name: company.name,
          type: company.businessType,
          tin: company.tin,
          vatNumber: financial.vatNumber,
          language: company.language,
          location: company.address,
          apiKey: company.apiKey,
          currencyCode: financial.currency,
          settings: {
            address: company.address,
            tin: company.tin,
            phone: company.phone,
            email: company.email,
            website: company.website,
            deploymentType: company.deploymentType,
            currency: financial.currency,
            fiscalYearStart: financial.fiscalYearStart,
            vatRegistered: financial.vatRegistered,
            vatNumber: financial.vatNumber,
            defaultInvoiceDueDays: financial.defaultInvoiceDueDays,
            enabledApps: selectedApps,
            erca,
            logoUrl: company.logoUrl,
            industry: company.industry,
            teamSize: company.teamSize,
            userRole: company.userRole,
            companyAge: company.companyAge,
          },
        }, { _background: true });
      } catch (companyErr: any) {
        // 409 = company already created (wizard re-run) — safe to continue
        if (companyErr?.response?.status !== 409) throw companyErr;
      }

      // 2. Persist system settings (flat Record<string,string>)
      await api.patch('/settings', {
        company_name: company.name,
        ovds_base_currency: financial.currency,
        fiscal_year_start_month: financial.fiscalYearStart,
        default_invoice_due_days: financial.defaultInvoiceDueDays,
        enabled_apps: selectedApps.join(','),
        ...(company.tin        && { company_tin: company.tin }),
        ...(company.email      && { company_email: company.email }),
        ...(company.phone      && { company_phone: company.phone }),
        ...(financial.vatRegistered && financial.vatNumber && { vat_number: financial.vatNumber }),
        deployment_type: company.deploymentType,
        ...(company.apiKey && { ovds_api_key: company.apiKey }),
        erca_etax_active: String(erca.etaxActive),
        erca_qr_enabled: String(erca.qrEnabled),
        erca_monthly_filing: String(erca.monthlyFiling),
        erca_drrf_enabled: String(erca.drrfEnabled),
        erca_bit_registered: String(erca.bitRegistered),
        erca_withholding_agent: String(erca.withholdingAgent),
        erca_tin_verified: String(erca.tinVerified),
      });

      // 3. Register invited users (skip blank rows)
      const validInvites = invites.filter(inv => inv.email.trim());
      if (validInvites.length > 0) {
        const invitesWithPasswords = validInvites.map(inv => ({
          ...inv,
          tempPassword: generateTempPassword(),
        }));
        const results = await Promise.allSettled(
          invitesWithPasswords.map(inv =>
            api.post('/auth/register', {
              username: inv.email.toLowerCase().trim(),
              password: inv.tempPassword,
              role: inv.role,
            }, { _background: true })
          )
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) toast.error(`${failed} user invite(s) failed — may already exist`);
        else toast.success(`${validInvites.length} user(s) added`);
      }

      // 4. Report completion to System Administration Setup Wizard
      try {
        const companyId = businessCompanyId || localStorage.getItem('selectedCompanyId') || '';
        if (companyId) {
          const stepsToComplete: Array<{ key: string; data: Record<string, string> }> = [
            { key: 'setup_wizard', data: { wizard_name: company.name } },
            { key: 'admin_setup_wizard', data: { admin_email: company.email, timezone: 'Africa/Addis_Ababa', language: company.language } },
            { key: 'cloud_deployment', data: { cloud_provider: 'ovds', region: 'africa-east' } },
            { key: 'on_premise_deployment', data: { server_url: window.location.origin, offline_mode: company.deploymentType === 'onpremise' ? 'true' : 'false' } },
            { key: 'enterprise_client', data: { sync_endpoint: window.location.origin, edge_node_count: '1' } },
            { key: 'invoice_module', data: { invoice_prefix: 'INV', next_number: '1001' } },
            { key: 'tin_mor_credentials', data: { tin: company.tin, branch_code: 'HQ', mor_username: company.email } },
            { key: 'business_registration', data: { business_structure: company.businessType || 'sole_proprietor', trade_name: company.name } },
            { key: 'sme_profile', data: { sme_classification: 'micro', sector_code: company.industry || 'other' } },
            { key: 'multi_company', data: { group_name: company.name, parent_company_id: '' } },
            { key: 'payment_gateways', data: { default_gateway: 'none' } },
            { key: 'chapa_gateway', data: { chapa_secret_key: '', chapa_public_key: '' } },
            { key: 'digital_wallets', data: { wallet_provider: 'none', phone_number: company.phone || '' } },
            { key: 'universal_tax_config', data: { vat_rate: financial.vatRegistered ? '15' : '0', tot_rate: '2', bit_rate: '30' } },
            { key: 'currency_exchange', data: { default_currency: financial.currency } },
            { key: 'fiscal_year', data: { fiscal_year_start: financial.fiscalYearStart, fiscal_year_type: 'efy' } },
            { key: 'module_selection', data: { enabled_modules: JSON.stringify(selectedApps) } },
            { key: 'project_management', data: { default_project_status: 'active', budget_alert_threshold: '80' } },
            { key: 'iot_devices', data: { device_type: 'none', sync_interval: '15' } },
            { key: 'users', data: { admin_email: company.email, admin_first_name: company.name, admin_last_name: '', user_count: String(validInvites.length + 1) } },
            { key: 'roles_permissions', data: { default_role: 'admin', permission_policy: 'moderate' } },
            { key: 'onboarding', data: { welcome_email_template: 'default' } },
            { key: 'settings_catalog', data: { catalog_version: '1.0' } },
            { key: 'control_node', data: { node_name: company.name, license_key: company.apiKey || '' } },
            { key: 'api_docs', data: { api_base_url: window.location.origin, api_version: '1.0.0' } },
            { key: 'developer_guide', data: { sdk_version: '1.0.0', docs_base_url: window.location.origin } },
            { key: 'system_updates', data: { update_channel: 'stable', auto_update: 'true' } },
            { key: 'notifications', data: { smtp_host: '', smtp_port: import.meta.env.VITE_DEFAULT_SMTP_PORT || '587', smtp_username: company.email, smtp_password: '' } },
          ];

          for (const s of stepsToComplete) {
            try {
              await setupApi.completeStep(companyId, s.key, s.data);
            } catch {
              // non-blocking: continue even if one step fails
            }
          }
        }
      } catch {
        // non-blocking: setup wizard tracking failure should not block company creation
      }

      // 5. Clear draft
      localStorage.removeItem(DRAFT_KEY);

      await refreshCompanies();
      setShowConfetti(true);
      setTimeout(() => {
        toast.success(`${company.name} is ready!`);
        onComplete?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Setup failed — you can configure settings manually';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (isLast) { await handleFinish(); return; }
    setStep(s => s + 1);
  };

  const toggleApp = (key: string) =>
    setSelectedApps(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const setC = (patch: Partial<CompanyForm>) => setCompany(p => ({ ...p, ...patch }));
  const setF = (patch: Partial<FinancialForm>) => setFinancial(p => ({ ...p, ...patch }));

  // -- Render ------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[400] flex items-center justify-center p-4 animate-aki-fade-in">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-aki-scale-in">
        {showConfetti && <ConfettiBurst />}

        {/* -- Ovds green top stripe -- */}
        <div className="h-[3px] shrink-0" style={{ background: 'linear-gradient(90deg,#3db77a,#55bc7e,#7dd8a0)' }}/>

        {/* -- Header -- */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: '#55bc7e' }}>
            <Building2 size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-[13px] leading-none tracking-tight">Getting Started with OVDS</h2>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
              Step {step + 1} of {STEPS.length} — {currentStep.title}
              {currentStep.optional && <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 rounded-full text-[8px] font-bold">Optional</span>}
            </p>
          </div>
          <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: '#55bc7e' }}>{progress}%</span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors shrink-0"
            aria-label="Close wizard"
          >
            <X size={14} />
          </button>
        </div>

        {/* -- Progress bar -- */}
        <div className="h-[3px] bg-gray-100 dark:bg-slate-800 shrink-0">
          <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: '#55bc7e' }}/>
        </div>

        {/* -- Step pills -- */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => i < step && setStep(i)}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  title={s.title}
                  disabled={i >= step}
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/50 ${
                    i < step
                      ? 'cursor-pointer hover:scale-110'
                      : i === step
                      ? 'ring-2 ring-[var(--pro-azure)]/40 ring-offset-1 cursor-default'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-default'
                  }`}
                  style={i <= step ? { background: '#55bc7e', color: '#fff' } : {}}
                >
                  {i < step ? <Check size={9} /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-px rounded-full transition-all duration-300 shrink-0"
                    style={{ width: '14px', background: i < step ? '#55bc7e' : '#e5e7eb' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* -- Step content -- */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-slate-950">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[var(--pro-azure-100)] dark:border-green-900" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              {currentStep.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-[14px] leading-none tracking-tight">{currentStep.title}</h3>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{currentStep.description}</p>
            </div>
          </div>

          {/* -- Step 0: Deployment type -- */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed">Choose how you're running OVDS. This helps configure the right defaults for your environment.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: 'cloud' as const,
                    icon: <Cloud size={24} className="text-[var(--pro-azure)]" />,
                    title: 'OVDS Cloud',
                    desc: 'Hosted by OVDS. Maintenance, updates, and backups handled for you.',
                    badge: 'RECOMMENDED',
                  },
                  {
                    key: 'onpremise' as const,
                    icon: <Server size={24} className="text-slate-400" />,
                    title: 'On-Premise',
                    desc: 'Self-hosted on your own server. Full control over data and infrastructure.',
                    badge: null,
                  },
                ].map(opt => {
                  const active = company.deploymentType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setC({ deploymentType: opt.key })}
                      className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                        active
                          ? 'border-[var(--pro-azure)] bg-white dark:bg-slate-900 shadow-sm'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[var(--pro-azure-light)] dark:hover:border-green-700'
                      }`}
                    >
                      {opt.badge && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-white text-[8px] font-black rounded-full uppercase tracking-widest" style={{ background: '#55bc7e' }}>
                          {opt.badge}
                        </span>
                      )}
                      {/* Icon in a coloured box */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/40' : 'bg-gray-50 dark:bg-slate-800'}`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className={`text-[13px] font-extrabold leading-tight ${active ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-gray-800 dark:text-slate-200'}`}>{opt.title}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                      {/* Radio dot */}
                      <div className={`absolute bottom-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        active ? 'border-[var(--pro-azure)]' : 'border-gray-300 dark:border-slate-600'
                      }`} style={active ? { background: '#55bc7e' } : {}}>
                        {active && <Check size={9} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {company.deploymentType === 'onpremise' && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-[12px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    On-premise requires NestJS, Prisma, MySQL/PostgreSQL, and a web server (Apache/Nginx). Choose Standard, Premium, or Elite plan (1–30 companies).
                  </p>
                </div>
              )}

              {/* API Key — cloud only */}
              {company.deploymentType === 'cloud' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Key size={11} /> API Key
                    </label>
                    <a href="https://ovds.com.et/login" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] hover:underline transition-colors">
                      Get key at ovds.com.et <ExternalLink size={9} />
                    </a>
                  </div>
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={company.apiKey}
                      onChange={e => setC({ apiKey: e.target.value })}
                      placeholder="Paste your API key from ovds.com.et"
                      className="w-full pl-8 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl text-sm font-mono text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure-100)] dark:focus:ring-green-900/40 focus:border-[var(--pro-azure)] transition-all"
                    />
                    <button type="button" onClick={() => setShowApiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Sign up at <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold hover:underline">ovds.com.et</a> → log in → copy the API key from the top of your Account Dashboard.</p>
                </div>
              )}
            </div>
          )}

          {/* -- Step 1: Company Profile -- */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="ovds-grid-layout cols-2">
                <div className="col-span-2">
                  <label className={labelCls}>Company Name *</label>
                  <input
                    value={company.name}
                    onChange={e => setC({ name: e.target.value })}
                    placeholder="e.g. Tigray Trading PLC"
                    className={`${inputCls} ${errors.name ? 'border-red-400 focus:ring-red-400/20' : ''}`}
                    autoFocus
                  />
                  {errors.name && <p className={errorCls}><AlertCircle size={10} />{errors.name}</p>}
                </div>

                <div className="col-span-2">
                   <label className={labelCls}>Company Logo (URL)</label>
                   <div className="relative">
                     <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input
                       value={company.logoUrl || ''}
                       onChange={e => setC({ logoUrl: e.target.value })}
                       placeholder="https://example.com/logo.png"
                       className={`${inputCls} pl-8`}
                     />
                   </div>
                </div>

                <div>
                  <label className={labelCls}>Language</label>
                  <select
                    value={company.language}
                    onChange={e => setC({ language: e.target.value })}
                    className={inputCls}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Industry</label>
                  <select
                    value={company.industry}
                    onChange={e => setC({ industry: e.target.value })}
                    className={inputCls}
                  >
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>TIN Number</label>
                  <div className="relative">
                    <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={company.tin}
                      onChange={e => setC({ tin: e.target.value })}
                      placeholder="0000000000"
                      className={`${inputCls} pl-8 ${errors.tin ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.tin && <p className={errorCls}><AlertCircle size={10} />{errors.tin}</p>}
                </div>

                <div>
                  <label className={labelCls}>Business Type</label>
                  <select
                    value={company.businessType}
                    onChange={e => setC({ businessType: e.target.value })}
                    className={inputCls}
                  >
                    {BUSINESS_TYPES.map(bt => (
                      <option key={bt.value} value={bt.value}>{bt.label} — {bt.desc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Team Size</label>
                  <select
                    value={company.teamSize}
                    onChange={e => setC({ teamSize: e.target.value })}
                    className={inputCls}
                  >
                    {TEAM_SIZES.map(ts => (
                      <option key={ts} value={ts}>{ts} members</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Your Role</label>
                  <input
                    value={company.userRole}
                    onChange={e => setC({ userRole: e.target.value })}
                    placeholder="e.g. Owner, Accountant"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Company Age</label>
                  <input
                    value={company.companyAge}
                    onChange={e => setC({ companyAge: e.target.value })}
                    placeholder="e.g. New Business, 5 years"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Phone</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={company.phone}
                      onChange={e => setC({ phone: e.target.value })}
                      placeholder="+251 9XX XXX XXX"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={company.email}
                      onChange={e => setC({ email: e.target.value })}
                      placeholder="info@company.com"
                      className={`${inputCls} pl-8 ${errors.email ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.email && <p className={errorCls}><AlertCircle size={10} />{errors.email}</p>}
                </div>

                <div>
                  <label className={labelCls}>Website</label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={company.website}
                      onChange={e => setC({ website: e.target.value })}
                      placeholder="https://company.com"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      value={company.address}
                      onChange={e => setC({ address: e.target.value })}
                      placeholder="Mekelle, Tigray, Ethiopia"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -- Step 2: Financial Setup -- */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="ovds-grid-layout cols-2">
                <div>
                  <label className={labelCls}>Default Currency</label>
                  <select
                    value={financial.currency}
                    onChange={e => setF({ currency: e.target.value })}
                    className={inputCls}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fiscal Year Start</label>
                  <select
                    value={financial.fiscalYearStart}
                    onChange={e => setF({ fiscalYearStart: e.target.value })}
                    className={inputCls}
                  >
                    {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Ethiopian fiscal year starts in July (month 7)</p>
                </div>
                <div>
                  <label className={labelCls}>Default Invoice Due Days</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={financial.defaultInvoiceDueDays}
                    onChange={e => setF({ defaultInvoiceDueDays: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-slate-200">VAT Registered</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Required if annual turnover ≥ ETB 1,000,000</p>
                </div>
                <Toggle checked={financial.vatRegistered} onChange={() => setF({ vatRegistered: !financial.vatRegistered })} />
              </div>

              {financial.vatRegistered && (
                <div>
                  <label className={labelCls}>VAT Registration Number *</label>
                  <input
                    value={financial.vatNumber}
                    onChange={e => setF({ vatNumber: e.target.value })}
                    placeholder="VAT-XXXXXXXXXX"
                    className={`${inputCls} ${errors.vatNumber ? 'border-red-400' : ''}`}
                  />
                  {errors.vatNumber && <p className={errorCls}><AlertCircle size={10} />{errors.vatNumber}</p>}
                </div>
              )}
            </div>
          )}

          {/* -- Step 3: Users -- */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
                <p className="text-xs text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
                  Users will be created with a secure temporary password — they should change it on first login. You can also add users later from <span className="font-bold">Settings → Users</span>.
                </p>
              </div>
              <div className="space-y-2">
                {invites.map((inv, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={inv.email}
                        onChange={e => setInvites(prev => prev.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                        placeholder="colleague@company.com"
                        type="email"
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                    <select
                      value={inv.role}
                      onChange={e => setInvites(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
                      className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure-100)] dark:focus:ring-green-900/40 shrink-0 transition-all"
                    >
                      <option value="ADMIN">Admin</option>
                       <option value="OVDS">OVDS</option>
                      <option value="HR">HR</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="AUDITOR">Auditor</option>
                    </select>
                    {invites.length > 1 && (
                      <button
                        onClick={() => setInvites(prev => prev.filter((_, j) => j !== i))}
                        className="p-2 text-red-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors shrink-0"
                        aria-label="Remove user"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setInvites(prev => [...prev, { email: '', role: 'EMPLOYEE' }])}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] hover:underline"
              >
                <Plus size={12} /> Add another user
              </button>
            </div>
          )}

          {/* -- Step 4: Apps (ovds-style) -- */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                At set-up, Ovds provides you with free apps. You can add more from the App Store later.
              </p>

              {/* Pre-installed */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Pre-Installed</p>
                <div className="space-y-2">
                  {APPS.filter(a => a.preInstalled).map(app => (
                    <div key={app.key} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-800 bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20">
                      <span className="text-lg shrink-0">{app.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{app.label}</p>
                          <span className="px-1.5 py-0.5 bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] text-[10px] font-medium rounded uppercase tracking-wider">Installed</span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-snug">{app.desc}</p>
                      </div>
                      <Check size={15} className="text-[var(--pro-azure)] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Optional</p>
                <div className="grid grid-cols-2 gap-2">
                  {APPS.filter(a => !a.preInstalled && !a.recommended).map(app => {
                    const active = selectedApps.includes(app.key);
                    return (
                      <button
                        key={app.key}
                        onClick={() => toggleApp(app.key)}
                        aria-pressed={active}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[var(--pro-azure)]/40'
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{app.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{app.label}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-snug line-clamp-2">{app.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          active ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]0' : 'border-gray-300 dark:border-slate-600'
                        }`}>
                          {active && <Check size={8} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended / Featured */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Recommended Apps</p>
                <div className="space-y-2">
                  {APPS.filter(a => !a.preInstalled && a.recommended).map(app => {
                    const active = selectedApps.includes(app.key);
                    return (
                      <button
                        key={app.key}
                        onClick={() => toggleApp(app.key)}
                        aria-pressed={active}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[var(--pro-azure)]/40'
                        }`}
                      >
                        <span className="text-lg shrink-0">{app.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{app.label}</p>
                            <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-snug">{app.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          active ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]0' : 'border-gray-300 dark:border-slate-600'
                        }`}>
                          {active && <Check size={8} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                Recommended apps are based on user installation data. Add more from the App Store anytime.
              </p>
            </div>
          )}

          {/* -- Step 5: Import Data -- */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-slate-400 font-medium">Migrate your existing data by uploading CSV files. Download a template first to ensure the correct format.</p>
              </div>
              <div className="space-y-2">
                {IMPORT_TEMPLATES.map(tpl => {
                  const file = importFiles[tpl.key];
                  return (
                    <div key={tpl.key} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
                      <FileSpreadsheet size={16} className="text-[var(--pro-azure)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700 dark:text-slate-200">{tpl.label}</p>
                        {file
                          ? <p className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-0.5 truncate">{file.name}</p>
                          : <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{tpl.ext} template</p>
                        }
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => downloadTemplate(tpl.key, tpl.label)}
                          className="text-[10px] font-bold text-[var(--pro-azure)] hover:underline flex items-center gap-1"
                        >
                          ↓ Template
                        </button>
                        <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-gray-600 dark:text-slate-300 transition-colors">
                          <Upload size={11} />
                          {file ? 'Replace' : 'Upload'}
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0] ?? null;
                              setImportFiles(prev => ({ ...prev, [tpl.key]: f }));
                              if (f) toast.success(`${tpl.label} file selected`);
                            }}
                          />
                        </label>
                        {file && (
                          <button
                            onClick={() => setImportFiles(prev => ({ ...prev, [tpl.key]: null }))}
                            className="p-1 text-red-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">Import is processed after setup completes. You can also import data later from Settings.</p>
            </div>
          )}

          {/* -- Step 6: ERCA Compliance -- */}
          {step === 6 && (
            <div className="space-y-3">
              {/* Chain of Evidence visual */}
              <div className="p-4 bg-[var(--pro-azure-dark)] rounded-xl border border-[var(--pro-azure-dark)]">
                <p className="text-[10px] font-medium uppercase tracking-wider text-green-200 mb-3">Ethiopian Accounting Chain of Evidence — 2026</p>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { n: 1, label: 'Item',    icon: '📦' },
                    { n: 2, label: 'Invoice', icon: '🧾' },
                    { n: 3, label: 'Journal', icon: '📒' },
                    { n: 4, label: 'VAT 15%', icon: '🛡️' },
                    { n: 5, label: 'DRRF',    icon: '🏦' },
                    { n: 6, label: 'BIT 30%', icon: '💼' },
                    { n: 7, label: 'eTax',    icon: '✅' },
                  ].map((s, i, arr) => (
                    <div key={s.n} className="flex items-center shrink-0">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm">{s.icon}</span>
                        <span className="text-[8px] font-bold text-green-100 whitespace-nowrap">{s.label}</span>
                      </div>
                      {i < arr.length - 1 && <div className="w-4 h-px bg-[var(--pro-azure-50)]0 mx-1" />}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-green-300 mt-2">Every step must be linked. A missing journal entry breaks the chain → audit penalties.</p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Proclamation No. 1341/2024 requires all VAT-registered businesses to issue ERCA QR-coded e-Invoices from January 2025. Registration threshold: ETB 1,000,000 annual turnover.
                </p>
              </div>

              <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider pt-1">VAT &amp; e-Invoice</p>
              {[
                { key: 'tinVerified',    label: 'TIN Verified with ERCA',         desc: 'Taxpayer Identification Number confirmed at erca.gov.et' },
                { key: 'etaxActive',     label: 'e-Tax Portal Active',            desc: 'Account registered at etax.erca.gov.et for electronic filing' },
                { key: 'qrEnabled',      label: 'ERCA QR on Invoices',            desc: 'Every invoice carries an ERCA-issued QR code (NBE-IQR format)' },
                { key: 'monthlyFiling',  label: 'Monthly VAT Filing Enabled',     desc: 'File by the 30th of each following month — ETB 500/day penalty for late filing' },
                { key: 'withholdingAgent', label: 'Withholding Tax Agent',        desc: 'Registered to withhold 3% income tax on supplier payments ≥ ETB 10,000' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-slate-200">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={erca[item.key as keyof ErcaForm] as boolean}
                    onChange={() => setErca(p => ({ ...p, [item.key]: !p[item.key as keyof ErcaForm] }))}
                  />
                </div>
              ))}

              <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider pt-2">Disaster Risk Response Fund (DRRF) — Regulation No. 570/2025</p>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-slate-200">DRRF Levy Tracking Enabled</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Track levies across 13 categories — 1% loans/insurance, 5% services/airtime/tobacco, flat ETB 100/200 fees. Auto-generates from invoices, payroll, and loans.</p>
                </div>
                <Toggle checked={erca.drrfEnabled} onChange={() => setErca(p => ({ ...p, drrfEnabled: !p.drrfEnabled }))} />
              </div>

              <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider pt-2">Business Income Tax — Proclamation No. 979/2016</p>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-slate-200">Annual BIT Filing Reminder</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">30% corporate / 0–35% individual — file within 4 months of fiscal year-end (deadline: Nov 7). Auto-links VAT net profit to BIT calculator.</p>
                </div>
                <Toggle checked={erca.bitRegistered} onChange={() => setErca(p => ({ ...p, bitRegistered: !p.bitRegistered }))} />
              </div>

              {/* Compliance score preview */}
              {(() => {
                const score = [erca.tinVerified, erca.etaxActive, erca.qrEnabled, erca.monthlyFiling, erca.withholdingAgent, erca.drrfEnabled, erca.bitRegistered].filter(Boolean).length;
                const pct = Math.round((score / 7) * 100);
                return (
                  <div className={`p-3 rounded-xl border ${pct >= 80 ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800' : pct >= 50 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Compliance Readiness</p>
                      <span className={`text-xs font-semibold ${pct >= 80 ? 'text-[var(--pro-azure)]' : pct >= 50 ? 'text-amber-600' : 'text-gray-500'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-[var(--pro-azure-50)]0' : pct >= 50 ? 'bg-amber-500' : 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{score}/7 compliance items configured. {pct < 80 ? 'Enable more items to reduce audit risk.' : 'Excellent compliance posture.'}</p>
                  </div>
                );
              })()}

              <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
                <p className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold">
                  These settings configure your compliance modules. You can update them anytime from Settings → Compliance. The system will auto-post journal entries for every invoice and bill to maintain the chain of evidence.
                </p>
              </div>

              {/* IFRS Adoption Section */}
              <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider pt-2">IFRS Adoption — AABE Directive</p>
              <div className="space-y-2">
                {([
                  {
                    standard: 'IAS 1',
                    title: 'Financial Statement Presentation',
                    desc: 'Balance Sheet, P&L, Cash Flow, Changes in Equity, and Notes — all IFRS-compliant.',
                    icon: '📊',
                    always: true,
                  },
                  {
                    standard: 'IFRS 15',
                    title: 'Revenue Recognition (5-step model)',
                    desc: 'Revenue recognised when performance obligations are satisfied. VAT excluded from revenue.',
                    icon: '💰',
                    always: true,
                  },
                  {
                    standard: 'IAS 12',
                    title: 'Income Taxes — BIT 30% + Deferred Tax',
                    desc: 'Current tax at 30% BIT rate. Deferred tax on temporary differences between IFRS and tax base.',
                    icon: '🧾',
                    always: true,
                  },
                  {
                    standard: 'IAS 19',
                    title: 'Employee Benefits — PIT + Pension',
                    desc: 'PIT (0–35%) and pension (7%/11%) auto-calculated per payroll. Defined contribution plan.',
                    icon: '👥',
                    always: true,
                  },
                  {
                    standard: 'IAS 37',
                    title: 'Provisions — DRRF Levies',
                    desc: 'DRRF obligations recognised as provisions when the levy event occurs.',
                    icon: '🏦',
                    always: false,
                    condition: erca.drrfEnabled,
                  },
                  {
                    standard: 'IAS 2',
                    title: 'Inventories — FIFO / LIFO / WA',
                    desc: 'Inventory costing at lower of cost and NRV. Customs duties included in cost.',
                    icon: '📦',
                    always: selectedApps.includes('inventory'),
                    condition: selectedApps.includes('inventory'),
                  },
                ] as Array<{ standard: string; title: string; desc: string; icon: string; always: boolean; condition?: boolean }>)
                  .filter(item => item.always || item.condition === true)
                  .map(item => (
                  <div key={item.standard} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/40 px-2 py-0.5 rounded-lg">{item.standard}</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
                <p className="text-[10px] text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-bold">
                  OVDS is pre-configured for full IFRS compliance as required by the Accounting and Auditing Board of Ethiopia (AABE). All financial reports include IFRS standard references and are audit-ready.
                </p>
              </div>
            </div>
          )}

          {/* -- Step 7: Done -- */}
          {step === 7 && (
            <div className="text-center py-2 space-y-5">
              {/* Success icon */}
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#55bc7e' }}/>
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#3db77a,#55bc7e)' }}>
                  <Check size={28} className="text-white" strokeWidth={2.5}/>
                </div>
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {company.name || 'Your Company'} is ready! 🎉
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">
                  Your OVDS instance is configured. Settings can be updated anytime.
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-2 text-left">
                {[
                  { label: 'Company',    value: company.name || '—' },
                  { label: 'Deployment', value: company.deploymentType === 'cloud' ? '☁️ Cloud' : '🖥️ On-Premise' },
                  { label: 'Currency',   value: financial.currency },
                  { label: 'Fiscal Year',value: `Starts ${MONTHS[parseInt(financial.fiscalYearStart) - 1]}` },
                  { label: 'Apps',       value: `${selectedApps.length} active` },
                  { label: 'VAT',        value: financial.vatRegistered ? '✅ Registered' : 'Not registered' },
                  { label: 'DRRF',       value: erca.drrfEnabled ? '✅ Enabled' : 'Not enabled' },
                  { label: 'BIT Filing', value: erca.bitRegistered ? '✅ Reminder on' : 'Not set' },
                  { label: 'IFRS',       value: '✅ Full IFRS (AABE)' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{s.label}</p>
                    <p className="text-[12px] font-semibold text-gray-800 dark:text-slate-200 truncate">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Tax calendar preview */}
              {(financial.vatRegistered || erca.drrfEnabled || erca.bitRegistered) && (
                <div className="text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Your Tax Calendar</p>
                  {financial.vatRegistered && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-slate-400">Monthly VAT Return</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">30th of each month</span>
                    </div>
                  )}
                  {erca.withholdingAgent && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-slate-400">WHT Remittance</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">30th of each month</span>
                    </div>
                  )}
                  {erca.drrfEnabled && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-slate-400">DRRF Levy Remittance</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">10th of each month</span>
                    </div>
                  )}
                  {erca.bitRegistered && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-slate-400">Business Income Tax</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">November 7 annually</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-slate-500">
                Click <span className="font-bold text-gray-600 dark:text-slate-300">Finish Setup</span> to save everything and launch your dashboard.
              </p>
              <Link
                to="/settings/setup-wizard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
              >
                <Settings size={12} /> System Administration Setup
              </Link>
            </div>
          )}
        </div>

        {/* -- Footer -- */}
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-[12px] font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all disabled:opacity-50"
          >
            <ChevronLeft size={12} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {STEPS.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? '16px' : '6px',
                    height: '6px',
                    background: i <= step ? '#55bc7e' : '#e5e7eb',
                  }}/>
              ))}
            </div>

            {currentStep.optional && !isLast && (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={saving}
                className="px-3.5 py-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-xl text-[12px] font-semibold transition-all"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-[12px] font-semibold transition-all disabled:opacity-60 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
              style={{ background: saving ? '#7ec9a3' : '#55bc7e' }}
            >
              {saving
                ? <><RefreshCw size={12} className="animate-spin" /> Saving…</>
                : isLast
                ? <><Check size={12} /> Finish Setup</>
                : <>Continue <ChevronRight size={12} /></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySetupWizard;








