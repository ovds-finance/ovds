/**
 * GettingStartedPublic — ovds-style cloud setup
 * Route: /start
 *
 * Flow mirrors ovds Cloud onboarding:
 *   1. Hero landing  — "Get Started" CTA
 *   2. Start screen  — Cloud vs On-Premise choice
 *   3. Create Account — name, email, password, company
 *   4. Email confirm  — check inbox notice
 *   5. Company Wizard — logo, tax no., fiscal year, address, industry, team size, role
 *   6. App selection  — 2FA + Address Finder (pre-installed), Calendar + Live Currency (optional)
 *                       + featured recommended apps
 */
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Cloud, Server,
  Building2, Landmark, Sparkles, Moon, Sun,
  Shield, MapPin, Calendar, Globe, Lock, Zap,
  Mail, Eye, EyeOff, AlertCircle, Package,
  X, Upload, Hash, HardDrive,
  ShieldCheck, Banknote, Fingerprint,
  RefreshCw, Loader2, Download, Crown,
} from 'lucide-react';
import React, { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
type ScreenId = 'hero' | 'start' | 'create' | 'confirm' | 'wizard' | 'apps';
type DeployId = 'cloud' | 'onpremise' | 'enterprise';

interface AccountForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}
interface WizardForm {
  companyName: string;
  logoFile: File | null;
  logoPreview: string;
  taxNumber: string;
  fiscalYearStart: string;
  address: string;
  industry: string;
  teamSize: string;
  role: string;
  currency: string;
  language: string;
}
interface OvdsApp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  preInstalled: boolean;
  recommended: boolean;
  category: string;
  badge?: string;
}

// -----------------------------------------------------------------------------
// Static data
// -----------------------------------------------------------------------------
const INDUSTRIES = [
  'Retail & Trade', 'Manufacturing', 'Services', 'Construction',
  'Agriculture', 'Transport & Logistics', 'Healthcare', 'Education',
  'Hospitality & Tourism', 'Technology & ICT', 'ovds & Insurance',
  'Government & NGO', 'Other',
];

const RECOMMENDED_APPS_BY_INDUSTRY: Record<string, string[]> = {
  'Retail & Trade':        ['telebirr', 'payroll', 'vat-erca', 'calendar'],
  'Manufacturing':         ['payroll', 'vat-erca', 'live-currency', 'calendar'],
  'Services':              ['telebirr', 'payroll', 'calendar', 'live-currency'],
  'Construction':          ['payroll', 'vat-erca', 'calendar', 'live-currency'],
  'Agriculture':           ['telebirr', 'vat-erca', 'live-currency', 'calendar'],
  'Transport & Logistics': ['telebirr', 'vat-erca', 'payroll', 'calendar'],
  'Healthcare':            ['telebirr', 'payroll', 'vat-erca', 'calendar'],
  'Education':             ['telebirr', 'payroll', 'vat-erca', 'calendar'],
  'Hospitality & Tourism': ['telebirr', 'payroll', 'vat-erca', 'calendar'],
  'Technology & ICT':      ['telebirr', 'live-currency', 'calendar'],
  'ovds & Insurance':      ['telebirr', 'vat-erca', 'payroll', 'calendar'],
  'Government & NGO':      ['vat-erca', 'payroll', 'calendar', 'live-currency'],
  'Other':                 ['telebirr', 'vat-erca', 'calendar'],
};
const TEAM_SIZES = [
  'Just me', '2–5', '6–20', '21–50', '51–200', '200+',
];
const CURRENCIES = [
  { code: 'ETB', label: 'Ethiopian Birr (ETB)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic (አማርኛ)' },
  { code: 'ti', label: 'Tigrinya (ትግርኛ)' },
];
const FISCAL_MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' },   { value: '4', label: 'April' },
  { value: '5', label: 'May' },     { value: '6', label: 'June' },
  { value: '7', label: 'July (Ethiopian FY)' },
  { value: '8', label: 'August' },  { value: '9', label: 'September' },
  { value: '10', label: 'October' },{ value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// The 4 ovds-style apps + featured extras
const OVDS_APPS: OvdsApp[] = [
  {
    id: '2fa',
    name: '2FA',
    description: 'Two-factor authentication protects your financial data from unauthorized access.',
    icon: <Shield size={20} />,
    iconBg: 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    preInstalled: true,
    recommended: true,
    category: 'Security',
    badge: 'Pre-Installed',
  },
  {
    id: 'address-finder',
    name: 'Address Finder',
    description: 'Auto-complete addresses on invoices and bills, saving time on data entry.',
    icon: <MapPin size={20} />,
    iconBg: 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    preInstalled: true,
    recommended: true,
    category: 'Utility',
    badge: 'Pre-Installed',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'See dates for invoices, bills, payroll, and business activities in one view.',
    icon: <Calendar size={20} />,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    preInstalled: false,
    recommended: false,
    category: 'Productivity',
  },
  {
    id: 'live-currency',
    name: 'Live Currency',
    description: 'Retrieve live exchange rates when sending invoices in foreign currencies.',
    icon: <Globe size={20} />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    preInstalled: false,
    recommended: false,
    category: 'ovds',
  },
  {
    id: 'telebirr',
    name: 'Telebirr Payments',
    description: 'Accept Ethio Telecom telebirr payments with QR code generation on invoices.',
    icon: <Zap size={20} />,
    iconBg: 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-green-400',
    preInstalled: false,
    recommended: true,
    category: 'Payments',
    badge: 'Trending',
  },
  {
    id: 'payroll',
    name: 'Payroll Engine',
    description: 'Ethiopian PIT-compliant payroll with pension, DRRF, and payslip generation.',
    icon: <Banknote size={20} />,
    iconBg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    preInstalled: false,
    recommended: true,
    category: 'HR & Payroll',
    badge: 'Popular',
  },
  {
    id: 'vat-erca',
    name: 'VAT / ERCA',
    description: 'Proclamation 1341/2024 compliant VAT filing with eTax portal integration.',
    icon: <ShieldCheck size={20} />,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    preInstalled: false,
    recommended: true,
    category: 'Tax & Compliance',
    badge: 'Required',
  },
  {
    id: 'biometric',
    name: 'Biometric Attendance',
    description: 'Fingerprint and face recognition for workforce attendance verification.',
    icon: <Fingerprint size={20} />,
    iconBg: 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    preInstalled: false,
    recommended: false,
    category: 'HR & Payroll',
  },
];

const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const inp = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
    err
      ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-900/10 focus:ring-rose-400/30 focus:border-rose-400'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-teal-400/20 focus:border-teal-400'
  }`;

const sel = `w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all appearance-none cursor-pointer`;

const Err: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
      <AlertCircle size={11} className="shrink-0" /> {msg}
    </p>
  ) : null;

function pwStrength(pw: string) {
  const score = PW_RULES.filter(r => r.test(pw)).length;
  const bars  = ['bg-slate-200 dark:bg-slate-700', 'bg-rose-500', 'bg-amber-500', 'bg-[var(--pro-azure-50)]0', 'bg-[var(--pro-azure-50)]0'];
  const texts = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const cols  = ['text-slate-400', 'text-rose-500', 'text-amber-500', 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', 'text-[var(--pro-azure)]'];
  return { score, bar: bars[score], label: texts[score], col: cols[score] };
}

// -----------------------------------------------------------------------------
// Progress bar (top of card)
// -----------------------------------------------------------------------------
const SCREENS: ScreenId[] = ['hero', 'start', 'create', 'confirm', 'wizard', 'apps'];
const SCREEN_LABELS: Record<ScreenId, string> = {
  hero: 'Welcome', start: 'Start', create: 'Account',
  confirm: 'Confirm', wizard: 'Company', apps: 'Apps',
};

const ProgressBar: React.FC<{ screen: ScreenId }> = ({ screen }) => {
  const idx = SCREENS.indexOf(screen);
  const pct = Math.round((idx / (SCREENS.length - 1)) * 100);
  return (
    <div className="px-6 pt-4 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {SCREEN_LABELS[screen]}
        </span>
        <span className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Step dots */}
      <div className="flex items-center justify-between mt-2">
        {SCREENS.map((s, i) => (
          <div
            key={s}
            title={SCREEN_LABELS[s]}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i < idx ? 'bg-[var(--pro-azure-50)]0' : i === idx ? 'bg-[var(--pro-azure-50)]0 scale-125' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};


// -----------------------------------------------------------------------------
// Screen 1: Hero
// -----------------------------------------------------------------------------
const ScreenHero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="p-5 space-y-5">
    {/* Logo */}
    <div className="text-center">
      <div className="w-16 h-16 bg-[var(--pro-azure-50)]0 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30">
        <Landmark size={28} className="text-white" />
      </div>
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
        Setting Up Ovds Cloud
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
        Ovds Cloud is perfect for small businesses focused on productivity with little time to manage IT tasks. SaaS-Based · Cloud Deployment for Banking & ovds, Retail & E-commerce, IT & Software, Manufacturing & Logistics, and Healthcare & Pharmaceuticals.
      </p>
    </div>

    {/* Feature highlights */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { icon: <Zap size={14} />, label: 'Up in 60 seconds', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
        { icon: <RefreshCw size={14} />, label: 'Auto updates', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20' },
        { icon: <Shield size={14} />, label: 'Managed backups', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20' },
        { icon: <Lock size={14} />, label: 'SSL included', color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
      ].map(f => (
        <div key={f.label} className={`flex items-center gap-2 p-3 rounded-xl ${f.color}`}>
          {f.icon}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{f.label}</span>
        </div>
      ))}
    </div>

    {/* What you will do */}
    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 space-y-2.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Setup takes about 3 minutes</p>
      {[
        'Sign up to Ovds',
        'Create your company',
        'Add default and recommended apps',
        'Send your first invoice',
      ].map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{i + 1}</span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">{step}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onStart}
      className="w-full py-4 bg-[var(--pro-azure)] text-white font-semibold rounded-xl text-sm hover:bg-[var(--pro-azure-dark)] transition-all shadow-lg shadow-green-500/20 dark:shadow-green-500/10/25 flex items-center justify-center gap-2"
    >
      <Sparkles size={16} /> Get Started
    </button>

    <p className="text-center text-xs text-slate-400">
      Already have an account?{' '}
      <Link to="/login" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">Sign in</Link>
    </p>
  </div>
);

// -----------------------------------------------------------------------------
// Screen 2: Start — Cloud vs On-Premise
// -----------------------------------------------------------------------------
const ScreenStart: React.FC<{
  deploy: DeployId;
  onSelect: (d: DeployId) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ deploy, onSelect, onNext, onBack }) => (
  <div className="p-5 space-y-5">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Start</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Choose how you want to run Ovds.
      </p>
    </div>

    <div className="grid gap-3">
      {([
        {
          id: 'cloud' as DeployId,
          icon: <Cloud size={22} />,
          title: 'Ovds Cloud',
          desc: 'Hosted by Ovds. Maintenance, updates, and backups handled for you. Ideal SaaS-Based Cloud Deployment for Banking & ovds, Retail & E-commerce, IT & Software.',
          badge: 'Recommended',
          badgeCls: 'bg-[var(--pro-azure)] text-white',
          pros: ['Up in 60 seconds', 'Automatic updates', 'Managed backups', 'SSL included'],
        },
        {
          id: 'onpremise' as DeployId,
          icon: <Server size={22} />,
          title: 'Ovds On-Premise',
          desc: 'Self-hosted on your own server. Full control over data and infrastructure. On-Premise & Hybrid Deployment for Healthcare & Pharmaceuticals, Manufacturing & Logistics, IT & Software.',
          badge: 'Self-hosted',
          badgeCls: 'bg-slate-600 text-white',
          pros: ['Full data ownership', 'No cloud fees', 'Works offline', 'Custom domain'],
        },
        {
          id: 'enterprise' as DeployId,
          icon: <Download size={22} />,
          title: 'Client (Hybrid)',
          desc: 'Download the local Client installer that connects to your cloud account. Processes invoices offline and syncs automatically — hybrid cloud + on-premise for large enterprises.',
          badge: 'Enterprise',
          badgeCls: 'bg-amber-500 text-white',
          pros: ['Offline invoice queue', 'Auto cloud sync', 'Subscription linked', 'Air-gapped ready'],
        },
      ] as const).map(opt => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
            deploy === opt.id
              ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-[var(--pro-azure-50)] dark:bg-green-950/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)]/40 dark:border-green-700 bg-white dark:bg-slate-800'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              deploy === opt.id ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]0' : 'border-slate-300 dark:border-slate-600'
            }`}>
              {deploy === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              deploy === opt.id ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{opt.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${opt.badgeCls}`}>
                  {opt.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{opt.desc}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {opt.pros.map(p => (
                  <span key={p} className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Check size={9} className="text-[var(--pro-azure)]" /> {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>

    {deploy === 'onpremise' && (
      <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <HardDrive size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          On-premise requires Docker, Node.js 18+, and MySQL 8+. After registering, follow the{' '}
          <Link to="/getting-started/on-premise" className="underline font-bold">setup guide</Link>.
        </p>
      </div>
    )}

    {deploy === 'enterprise' && (
      <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <Crown size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5">
          <p>
            <strong>Invoice Module</strong> (all plans) — standalone invoice for offline use. No Enterprise plan needed.{' '}
            <Link to="/getting-started/invoice-module" className="inline-flex items-center gap-1 font-bold underline hover:no-underline">
              <Download size={10} /> Invoice Module →
            </Link>
          </p>
          <p>
            <strong>Enterprise Client</strong> (Enterprise plan required) — full accounting suite with hybrid deployment.{' '}
            <Link to="/getting-started/client" className="inline-flex items-center gap-1 font-bold underline hover:no-underline">
              <Download size={10} /> Enterprise Client →
            </Link>
          </p>
        </div>
      </div>
    )}

    <div className="flex gap-3 pt-1">
      <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
        <ArrowLeft size={14} /> Back
      </button>
      <button
        onClick={onNext}
        className="flex-1 py-3 bg-[var(--pro-azure)] text-white font-semibold rounded-xl text-sm hover:bg-[var(--pro-azure-dark)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30"
      >
        Continue <ArrowRight size={15} />
      </button>
    </div>
  </div>
);


// -----------------------------------------------------------------------------
// Screen 3: Create Account
// -----------------------------------------------------------------------------
const ScreenCreate: React.FC<{
  form: AccountForm;
  onChange: (patch: Partial<AccountForm>) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  errors: Partial<Record<keyof AccountForm | 'general', string>>;
}> = ({ form, onChange, onNext, onBack, loading, errors }) => {
  const [showPw, setShowPw] = React.useState(false);
  const pw = pwStrength(form.password);

  return (
    <div className="p-5 space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create New Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Sign up to Ovds — it only takes a minute.
        </p>
      </div>

      {errors.general && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold">
          <AlertCircle size={13} className="shrink-0" /> {errors.general}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">First Name</label>
          <input
            value={form.firstName}
            onChange={e => onChange({ firstName: e.target.value })}
            placeholder="Selam"
            className={inp(errors.firstName)}
            autoFocus
          />
          <Err msg={errors.firstName} />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Last Name</label>
          <input
            value={form.lastName}
            onChange={e => onChange({ lastName: e.target.value })}
            placeholder="Tesfaye"
            className={inp(errors.lastName)}
          />
          <Err msg={errors.lastName} />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="email"
            value={form.email}
            onChange={e => onChange({ email: e.target.value })}
            placeholder="you@company.com"
            className={`${inp(errors.email)} pl-9`}
          />
        </div>
        <Err msg={errors.email} />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Password</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={e => onChange({ password: e.target.value })}
            placeholder="Min. 8 characters"
            className={`${inp(errors.password)} pl-9 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {form.password && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pw.score ? pw.bar : 'bg-slate-100 dark:bg-slate-800'}`} />
              ))}
              <span className={`text-[10px] font-semibold ml-1 ${pw.col}`}>{pw.label}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {PW_RULES.map(r => (
                <span key={r.label} className={`flex items-center gap-1 text-[10px] ${r.test(form.password) ? 'text-[var(--pro-azure)]' : 'text-slate-400'}`}>
                  {r.test(form.password) ? <Check size={9} /> : <X size={9} />} {r.label}
                </span>
              ))}
            </div>
          </div>
        )}
        <Err msg={errors.password} />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Company / Organisation Name</label>
        <div className="relative">
          <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={form.companyName}
            onChange={e => onChange({ companyName: e.target.value })}
            placeholder="Tigray Trading PLC"
            className={`${inp(errors.companyName)} pl-9`}
          />
        </div>
        <Err msg={errors.companyName} />
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="flex-1 py-3 bg-[var(--pro-azure)] text-white font-semibold rounded-xl text-sm hover:bg-[var(--pro-azure-dark)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <><Sparkles size={15} /> Create Account</>}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">Sign in instead</Link>
      </p>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Screen 4: Account Ready (no email verification gate)
// -----------------------------------------------------------------------------
const ScreenConfirm: React.FC<{
  email: string;
  companyName: string;
  onNext: () => void;
  onResend: () => void;
}> = ({ email, companyName, onNext }) => (
  <div className="p-5 space-y-5 text-center">
    <div className="w-20 h-20 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-2xl flex items-center justify-center mx-auto border border-[var(--pro-azure-100)] dark:border-green-800">
      <CheckCircle2 size={36} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Account Created!</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
        You're signed in as{' '}
        <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span>.
        {companyName && (
          <> Company <span className="font-bold text-slate-700 dark:text-slate-200">{companyName}</span> is ready to configure.</>
        )}
      </p>
    </div>

    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 text-left space-y-2.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">What happens next</p>
      {[
        'Set up your company profile — logo, TIN, fiscal year',
        'Choose which modules to activate',
        'Send your first invoice',
      ].map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{i + 1}</span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">{s}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onNext}
      className="w-full py-3.5 bg-[var(--pro-azure)] text-white font-semibold rounded-xl text-sm hover:bg-[var(--pro-azure-dark)] transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
    >
      Continue to Company Setup <ArrowRight size={15} />
    </button>
  </div>
);


// -----------------------------------------------------------------------------
// Screen 5: Company Setup Wizard
// -----------------------------------------------------------------------------
const ScreenWizard: React.FC<{
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ form, onChange, onNext, onBack }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ logoFile: file, logoPreview: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-5 space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Creating Your Company</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          You need four essential pieces of information to set up your company.
        </p>
      </div>

      {/* Logo upload */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Company Logo</label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-[var(--pro-azure)] transition-colors overflow-hidden bg-white dark:bg-slate-800 shrink-0"
          >
            {form.logoPreview
              ? <img src={form.logoPreview} alt="Logo" className="w-full h-full object-cover" />
              : <Upload size={18} className="text-slate-400" />}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
            >
              Upload your company logo
            </button>
            <p className="ovds-caption mt-0.5">PNG, JPG or SVG. Max 2 MB.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>
      </div>

      {/* Company name */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Company Name *</label>
        <div className="relative">
          <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={form.companyName}
            placeholder="Set during account creation"
            disabled
            className={`${inp()} pl-9 opacity-60 cursor-not-allowed`}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Set during account creation. Edit in Settings.</p>
      </div>

      {/* Tax number */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Tax Number (TIN)</label>
        <div className="relative">
          <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={form.taxNumber}
            onChange={e => onChange({ taxNumber: e.target.value })}
            placeholder="0000000000000 (15 digits)"
            maxLength={15}
            className={`${inp()} pl-9`}
          />
        </div>
      </div>

      {/* Financial year start */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Financial Year Start *</label>
        <div className="relative">
          <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <select
            value={form.fiscalYearStart}
            onChange={e => onChange({ fiscalYearStart: e.target.value })}
            className={`${sel} pl-9`}
          >
            {FISCAL_MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Company Address</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            value={form.address}
            onChange={e => onChange({ address: e.target.value })}
            placeholder="Addis Ababa, Ethiopia"
            className={`${inp()} pl-9`}
          />
        </div>
      </div>

      {/* Industry + Team size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Industry</label>
          <select value={form.industry} onChange={e => onChange({ industry: e.target.value })} className={sel}>
            <option value="">Select…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Team Size</label>
          <select value={form.teamSize} onChange={e => onChange({ teamSize: e.target.value })} className={sel}>
            <option value="">Select…</option>
            {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Currency + Language */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Currency *</label>
          <select value={form.currency} onChange={e => onChange({ currency: e.target.value })} className={sel}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Language *</label>
          <select value={form.language} onChange={e => onChange({ language: e.target.value })} className={sel}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-[var(--pro-azure)] text-white font-semibold rounded-xl text-sm hover:bg-[var(--pro-azure-dark)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30"
        >
          Continue <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};


// -----------------------------------------------------------------------------
// Screen 6: App Selection (ovds-style)
// -----------------------------------------------------------------------------
const ScreenApps: React.FC<{
  selected: string[];
  onToggle: (id: string) => void;
  onFinish: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  industry?: string;
  recommendedIds?: string[];
}> = ({ selected, onToggle, onFinish, onBack, loading, industry, recommendedIds = [] }) => {
  const preInstalled = OVDS_APPS.filter(a => a.preInstalled);
  const optional     = OVDS_APPS.filter(a => !a.preInstalled);
  const recommended  = optional.filter(a => recommendedIds.includes(a.id));
  const other        = optional.filter(a => !recommendedIds.includes(a.id));

  return (
    <div className="p-5 space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Adding Default and Recommended Apps</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          At set-up, Ovds provides you with free apps. You can add more from the App Store later.
        </p>
      </div>

      {/* Pre-installed section */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Pre-Installed
        </p>
        <div className="space-y-2">
          {preInstalled.map(app => (
            <div
              key={app.id}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-800 bg-[var(--pro-azure-50)]/50 dark:bg-green-900/10"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
                {app.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{app.name}</span>
                  <span className="px-1.5 py-0.5 bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] text-[10px] font-medium rounded uppercase tracking-wider">
                    Installed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{app.description}</p>
              </div>
              <CheckCircle2 size={18} className="text-[var(--pro-azure)] shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Recommended for industry section */}
      {industry && recommended.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] uppercase tracking-wider mb-2.5">
            Recommended for {industry}
          </p>
          <div className="space-y-2">
            {recommended.map(app => {
              const active = selected.includes(app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => onToggle(app.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    active
                      ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)]/40 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{app.name}</span>
                      {app.badge && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase tracking-wider ${
                          app.badge === 'Required'
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                            : app.badge === 'Trending'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                        }`}>
                          {app.badge}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 ml-auto">{app.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{app.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    active ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]0' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {active && <Check size={10} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional section */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Optional — Select to Install
        </p>
        <div className="space-y-2">
          {other.map(app => {
            const active = selected.includes(app.id);
            return (
              <button
                key={app.id}
                onClick={() => onToggle(app.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-[var(--pro-azure-50)] dark:bg-green-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)]/40 dark:border-green-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{app.name}</span>
                    {app.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase tracking-wider ${
                        app.badge === 'Required'
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                          : app.badge === 'Trending'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                      }`}>
                        {app.badge}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 ml-auto">{app.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{app.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  active ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]0' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {active && <Check size={10} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* App Store note */}
      <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <Package size={16} className="text-slate-400 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You can also add <strong className="text-slate-700 dark:text-slate-200">featured apps</strong> from the{' '}
          <Link to="/settings/app-store" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">App Store</Link> at any time.
          Recommended apps are based on user installation data.
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="flex-1 py-3 bg-[var(--pro-azure)] text-white font-semibold rounded-xl text-sm hover:bg-[var(--pro-azure-dark)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Setting up…</>
            : <><Sparkles size={15} /> Finish Setup</>}
        </button>
      </div>
    </div>
  );
};


// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const GettingStartedPublic: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [screen, setScreen] = React.useState<ScreenId>('hero');
  const [deploy, setDeploy] = React.useState<DeployId>('cloud');
  const [loading, setLoading] = React.useState(false);
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'));

  const [account, setAccount] = React.useState<AccountForm>({
    firstName: '', lastName: '', email: '', password: '', companyName: '',
  });
  const [accountErrors, setAccountErrors] = React.useState<Partial<Record<keyof AccountForm | 'general', string>>>({});

  const [wizard, setWizard] = React.useState<WizardForm>({
    companyName: '', logoFile: null, logoPreview: '',
    taxNumber: '', fiscalYearStart: '7',
    address: '', industry: '', teamSize: '',
    role: 'ADMIN', currency: 'ETB', language: 'en',
  });

  const recommendedIds = React.useMemo(
    () => wizard.industry ? (RECOMMENDED_APPS_BY_INDUSTRY[wizard.industry] ?? []) : [],
    [wizard.industry],
  );

  const [selectedApps, setSelectedApps] = React.useState<string[]>(recommendedIds);

  React.useEffect(() => {
    setSelectedApps(prev => {
      const merged = new Set(prev);
      for (const id of recommendedIds) merged.add(id);
      return [...merged];
    });
  }, [recommendedIds]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const toggleApp = useCallback((id: string) => {
    setSelectedApps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // -- Validate account form --------------------------------------------------
  const validateAccount = (): boolean => {
    const e: typeof accountErrors = {};
    if (!account.firstName.trim()) e.firstName = 'First name is required';
    if (!account.lastName.trim())  e.lastName  = 'Last name is required';
    if (!account.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email))
      e.email = 'Valid email is required';
    if (pwStrength(account.password).score < 2) e.password = 'Password is too weak';
    if (!account.companyName.trim()) e.companyName = 'Company name is required';
    setAccountErrors(e);
    return Object.keys(e).length === 0;
  };

  // -- Submit account ---------------------------------------------------------
  const handleCreateAccount = async () => {
    if (!validateAccount()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        firstName:   account.firstName.trim(),
        lastName:    account.lastName.trim(),
        email:       account.email.toLowerCase().trim(),
        password:    account.password,
        companyName: account.companyName.trim(),
        // role omitted — backend auto-assigns ADMIN when companyName is present
      });
      // Backend returns { access_token, user } — store it so the wizard
      // steps that call authenticated endpoints (PATCH /settings) work.
      const data = res.data?.data ?? res.data;
      if (data?.access_token) {
        login(data.access_token, data.user);
      }
      setScreen('confirm');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Registration failed. Please try again.';
      setAccountErrors({ general: Array.isArray(msg) ? msg[0] : msg });
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  // -- Finish setup -----------------------------------------------------------
  const handleFinish = async () => {
    setLoading(true);
    try {
      const companyId = user?.companyId;

      // 1. Update the company record with wizard details (TIN, address, etc.)
      if (companyId) {
        await api.patch(`/ovds/companies/${companyId}`, {
          settings: {
            tin:             wizard.taxNumber || undefined,
            address:         wizard.address || undefined,
            industry:        wizard.industry || undefined,
            teamSize:        wizard.teamSize || undefined,
            currency:        wizard.currency,
            fiscalYearStart: wizard.fiscalYearStart,
            language:        wizard.language,
            deploymentType:  deploy,
            enabledApps:     ['2fa', 'address-finder', ...selectedApps],
          },
        }).catch(() => { /* non-fatal — user can update in Settings */ });
      }

      // 2. Persist flat system settings (used by reports, payroll, etc.)
      await api.patch('/settings', {
        company_name:            wizard.companyName || account.companyName || undefined,
        company_tin:             wizard.taxNumber || undefined,
        fiscal_year_start_month: wizard.fiscalYearStart,
        company_address:         wizard.address || undefined,
        company_industry:        wizard.industry || undefined,
        company_team_size:       wizard.teamSize || undefined,
        ovds_base_currency:   wizard.currency,
        language:                wizard.language,
        deployment_type:         deploy,
        enabled_apps:            ['2fa', 'address-finder', ...selectedApps].join(','),
      }).catch(() => { /* non-fatal */ });

      toast.success(`${account.companyName} is ready! Welcome to Ovds.`);
      navigate('/dashboard');
    } catch {
      toast.error('Setup failed — you can configure settings in the dashboard.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // -- Layout shell -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* Background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-[var(--pro-azure-50)]/50 dark:bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-[var(--pro-azure-50)]0/5 dark:bg-[var(--pro-azure-50)]0/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          {screen === 'hero' ? (
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Ovds
            </Link>
          ) : screen === 'start' || screen === 'create' ? (
            /* Pre-registration: free back navigation */
            <button
              onClick={() => {
                const idx = SCREENS.indexOf(screen);
                if (idx > 0) setScreen(SCREENS[idx - 1]);
              }}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          ) : (
            /* Post-registration (confirm / wizard / apps): no back to create */
            <div className="w-10" />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:border-[var(--pro-azure)]/40 dark:border-green-700 transition-all"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <Link
              to="/login"
              className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Progress bar — hidden on hero */}
          {screen !== 'hero' && <ProgressBar screen={screen} />}

          {screen === 'hero' && (
            <ScreenHero onStart={() => setScreen('start')} />
          )}
          {screen === 'start' && (
            <ScreenStart
              deploy={deploy}
              onSelect={setDeploy}
              onNext={() => setScreen('create')}
              onBack={() => setScreen('hero')}
            />
          )}
          {screen === 'create' && (
            <ScreenCreate
              form={account}
              onChange={patch => setAccount(p => ({ ...p, ...patch }))}
              onNext={handleCreateAccount}
              onBack={() => setScreen('start')}
              loading={loading}
              errors={accountErrors}
            />
          )}
          {screen === 'confirm' && (
            <ScreenConfirm
              email={account.email}
              companyName={account.companyName}
              onNext={() => {
                // Sync company name from account form into wizard
                setWizard(w => ({ ...w, companyName: account.companyName }));
                setScreen('wizard');
              }}
              onResend={() => {}}
            />
          )}
          {screen === 'wizard' && (
            <ScreenWizard
              form={wizard}
              onChange={patch => setWizard(p => ({ ...p, ...patch }))}
              onNext={() => setScreen('apps')}
              onBack={() => setScreen('confirm')}
            />
          )}
          {screen === 'apps' && (
            <ScreenApps
              selected={selectedApps}
              onToggle={toggleApp}
              onFinish={handleFinish}
              onBack={() => setScreen('wizard')}
              loading={loading}
              industry={wizard.industry}
              recommendedIds={recommendedIds}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-5">
          🇪�� Built for Ethiopian businesses · ERCA compliant · Proclamation 1395/2025
        </p>
      </div>
    </div>
  );
};

export default GettingStartedPublic;









