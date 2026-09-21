/**
 * Plans & Pricing page
 * Wired to the real backend: reads entitlement status, starts trials,
 * and shows the correct CTA based on the company's current plan.
 */
import type { MonetizationProduct } from '@ovds/ui';
import {
  Check, Zap, ArrowRight, ChevronDown,
  Lock, Sparkles, HelpCircle, Crown, Minus, Clock,
  CheckCircle2, Rocket, Loader2, Store, Layers, Download, FileText,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { useEntitlement } from '../context/entitlementContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { startTrial, listProducts } from '../services/monetizationApi';

interface PlanFeature {
  label: string;
  starter: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
}

const FEATURE_GROUPS: { group: string; features: PlanFeature[] }[] = [
  {
    group: 'Core Accounting — invoice, Expenses & Banking',
    features: [
      { label: 'Professional invoice with custom templates', starter: true, business: true, enterprise: true },
      { label: 'Estimates, quotes & proforma invoices', starter: true, business: true, enterprise: true },
      { label: 'Recurring invoices & automatic payment reminders', starter: true, business: true, enterprise: true },
      { label: 'Expense tracking by project/client, billable/non-billable', starter: true, business: true, enterprise: true },
      { label: 'Accounts payable & receivable automation', starter: 'Basic', business: true, enterprise: true },
      { label: 'Multi-currency support (auto FX conversion to ETB)', starter: '3 currencies', business: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Bulk actions — enable, disable, export, delete', starter: true, business: true, enterprise: true },
      { label: 'Client portal — invoice access & bulk payments online', starter: false, business: true, enterprise: true },
    ],
  },
  {
    group: 'Advanced ovds — GL, Banking & IFRS',
    features: [
      { label: 'Double-entry accounting (GL)', starter: false, business: true, enterprise: true },
      { label: 'Chart of accounts (Ethiopian defaults)', starter: 'Basic', business: 'Full Ethiopian', enterprise: 'Custom' },
      { label: 'Bank reconciliation & statement import (OCR)', starter: false, business: true, enterprise: true },
      { label: 'Petty cash imprest fund management', starter: true, business: true, enterprise: true },
      { label: 'Financial reports (BS, P&L, CF, Equity, Notes)', starter: 'Basic', business: 'Full IFRS', enterprise: 'Full IFRS + custom' },
      { label: 'Budgeting, forecasting & variance analysis', starter: false, business: true, enterprise: true },
      { label: 'Fixed assets, depreciation & IFRS 16 leases', starter: false, business: true, enterprise: true },
      { label: 'Period close, accruals & prepayments', starter: false, business: true, enterprise: true },
    ],
  },
  {
    group: 'HR & Payroll — Manufacturing & Logistics · Healthcare & Pharmaceuticals',
    features: [
      { label: 'Employee management', starter: '5 employees', business: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Payroll with Ethiopian PIT (progressive 0–35%)', starter: '5 employees', business: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Pension PFSA (7% employee + 11% employer)', starter: true, business: true, enterprise: true },
      { label: 'Biometric attendance & shift scheduling', starter: false, business: true, enterprise: true },
      { label: 'Leave management & HR calendar', starter: true, business: true, enterprise: true },
      { label: 'Gratuity & severance (Labour Proc. 1156/2019)', starter: false, business: true, enterprise: true },
    ],
  },
  {
    group: 'Tax Compliance & Immediate MoR Submission — All Tax Types',
    features: [
      { label: 'VAT return filing (15%) — Proc. 1341/2024', starter: true, business: true, enterprise: true },
      { label: 'TOT filing (2% goods / 10% services) — Proc. 1395/2025', starter: true, business: true, enterprise: true },
      { label: 'WHT certificates (goods, services, dividends, rent)', starter: true, business: true, enterprise: true },
      { label: 'PAYE monthly declaration (PIT + DRRF) to MoR', starter: '5 emp.', business: true, enterprise: true },
      { label: 'BIT (Business Income Tax, 30%) — Proc. 1395/2025', starter: false, business: true, enterprise: true },
      { label: 'Excise tax — Proc. 1186/2020 (5–500%)', starter: false, business: true, enterprise: true },
      { label: 'Stamp duty — Proc. 110/1998', starter: false, business: true, enterprise: true },
      { label: 'Schedule D (dividends, capital gains, royalties)', starter: false, business: true, enterprise: true },
      { label: 'Graduate tax / cost-sharing deductions — Reg. 154/2008', starter: false, business: true, enterprise: true },
      { label: 'DRRF levy (Reg. 570/2025)', starter: false, business: true, enterprise: true },
      { label: 'Property tax — Proc. 1161/2019', starter: false, business: true, enterprise: true },
      { label: 'Net Tax Payable Report — consolidates ALL taxes to MoR', starter: false, business: true, enterprise: true },
      { label: 'e-Tax & TASS portal integration (immediate MoR submission)', starter: false, business: true, enterprise: true },
      { label: 'International tax (thin cap, TP, foreign credit, loss C/F)', starter: false, business: false, enterprise: true },
      { label: 'Audit outsourcing & external audit module', starter: false, business: false, enterprise: true },
    ],
  },
  {
    group: 'Inventory, CRM & ERP',
    features: [
      { label: 'Items, products & inventory management', starter: true, business: true, enterprise: true },
      { label: 'Stock movements, warehouses & IAS 2 valuation', starter: false, business: true, enterprise: true },
      { label: 'CRM pipeline & customer relationship management', starter: false, business: true, enterprise: true },
      { label: 'Customer segmentation & consumer insights', starter: false, business: true, enterprise: true },
      { label: 'Project management software', starter: false, business: true, enterprise: true },
      { label: 'Supply chain, procurement & GRN', starter: false, business: true, enterprise: true },
    ],
  },
  {
    group: 'Business Intelligence & Analytics — Market Forecast · Strategic Insights',
    features: [
      { label: 'Market segmentation & growth analytics', starter: false, business: true, enterprise: true },
      { label: 'Revenue & investment trends dashboard', starter: false, business: true, enterprise: true },
      { label: 'Custom reports & personalised dashboards', starter: false, business: true, enterprise: true },
      { label: 'AI forecasting & business insights', starter: false, business: true, enterprise: true },
      { label: 'Market share & competitive landscape', starter: false, business: false, enterprise: true },
      { label: 'Challenges analysis & strategic insights', starter: false, business: false, enterprise: true },
    ],
  },
  {
    group: 'App Store, Integrations & Third-Party',
    features: [
      { label: 'App Store — payroll, inventory, CRM plugins', starter: '5 apps', business: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Payment gateways (Telebirr, M-Pesa, CBE)', starter: true, business: true, enterprise: true },
      { label: 'API access (ZohoBooks, Amazon Business, HubSpot)', starter: 'Read only', business: 'Full API', enterprise: 'Full API + webhooks' },
      { label: 'IoT & smart device management', starter: false, business: false, enterprise: true },
      { label: 'White-labeling & custom branding', starter: false, business: false, enterprise: true },
    ],
  },
  {
    group: 'Access, Language & Customisation',
    features: [
      { label: 'Desktop & mobile responsive access', starter: true, business: true, enterprise: true },
      { label: 'Languages (English, Amharic, Tigrinya)', starter: 'English', business: '3 languages', enterprise: '3 languages + custom' },
      { label: 'Customisable dashboards, reports & email templates', starter: 'Basic', business: true, enterprise: true },
      { label: 'Role-based permissions & two-factor authentication', starter: true, business: true, enterprise: true },
      { label: 'Multi-company admin', starter: false, business: false, enterprise: true },
    ],
  },
  {
    group: 'Deployment Model — Cloud-Based · On-Premise · SaaS · AI & Automation · Hybrid',
    features: [
      { label: 'Cloud-Based (SaaS) — accessible from browser/mobile', starter: true, business: true, enterprise: true },
      { label: 'On-Premise self-hosting (XAMPP, Docker, VPS)', starter: false, business: false, enterprise: true },
      { label: 'Hybrid deployment (cloud + on-premise)', starter: false, business: false, enterprise: true },
      { label: 'Offline invoice queue (air-gapped environments)', starter: false, business: false, enterprise: true },
      { label: 'AI & automation workflows', starter: false, business: true, enterprise: true },
    ],
  },
];

const FAQS = [
  { q: 'Can I switch plans later?', a: 'Yes. Upgrades take effect immediately; downgrades apply at the next billing cycle.' },
  { q: 'Is there a free trial?', a: 'Yes — all plans include a 14-day free trial. No credit card required to start.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data is retained for 90 days after cancellation. Export everything as CSV or PDF before your account closes.' },
  { q: 'Does OVDS support on-premise deployment?', a: 'Yes. The Enterprise plan includes a self-hosted option via Docker or XAMPP. You own the server and all data stays within your infrastructure. It also supports air-gapped and offline environments with the offline invoice queue (MoR Regulation No. 570/2025).' },
  { q: 'How does MoR submission work?', a: 'Ovds consolidates all your tax obligations — VAT, TOT, WHT, PAYE, BIT, Excise, Stamp Duty, Schedule D, Graduate Tax, DRRF, and more — into a single Net Tax Payable Report, then submits the final result immediately to MoR/ERCA via the e-Tax portal integration. You can also use the TASS portal for SRM device management and the ECC Customs portal for import declarations.' },
  { q: 'Which business types and sizes does OVDS serve?', a: 'Ovds serves freelancers, small businesses, medium enterprises and large enterprises. Each plan is calibrated to the accounting complexity, payroll size, and tax obligations of the business type. All plans support desktop and mobile access.' },
  { q: 'How does the lifetime purchase work?', a: 'A one-time payment grants permanent access to the selected plan with no recurring fees. Future major version upgrades may require a separate purchase.' },
  { q: 'What third-party integrations are available?', a: 'Ovds integrates with ZohoBooks, M-Pesa, Telebirr, CBE Birr, Amazon Business, HubSpot, and many more via the App Store and REST API. Custom webhook integrations are available on Business and Enterprise plans.' },
  { q: 'What software types does OVDS cover?', a: 'OVDS is a unified platform covering Enterprise Resource Planning (ERP), Customer Relationship Management (CRM), Business Intelligence & Analytics, Project Management Software, and Accounting & ovds Software — all in one subscription.' },
  { q: 'Which industries is OVDS built for?', a: 'Banking & ovds, Retail & E-commerce, IT & Software, Manufacturing & Logistics, and Healthcare & Pharmaceuticals — with sector-specific compliance, tax, and reporting built in.' },
];

// -- Plan slug → product slug mapping -----------------------------------------
const PLAN_SLUGS = {
  starter: 'plan:starter',
  business: 'plan:business',
  enterprise: 'plan:enterprise',
} as const;

const Plans: React.FC = () => {
  usePageTitle('Plans & Pricing');
  const navigate = useNavigate();
  const location = useLocation();
  const {
    status,
    isEntitled,
    isOnTrial,
    trialDaysRemaining,
    hasActiveSubscription,
    planSlug,
    refresh,
  } = useEntitlement();

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [products, _setProducts] = useState<MonetizationProduct[]>([]);
  const [trialLoading, setTrialLoading] = useState<string | null>(null);

  // Highlight the required feature if navigated here from a gate
  const requiredFeature = (location.state as any)?.requiredFeature as string | undefined;
  const autoStartTrial = (location.state as any)?.startTrial as boolean | undefined;

  // Load products from backend
  useEffect(() => {
    listProducts().catch(() => {/* products are optional — fall back to static data */});
  }, []);

  // Auto-scroll to pricing if navigated with a required feature
  useEffect(() => {
    if (requiredFeature || autoStartTrial) {
      setTimeout(() => {
        document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [requiredFeature, autoStartTrial]);

  const handleStartTrial = async (productSlug: string) => {
    // Find the product by slug
    const product = products.find((p) => p.slug === productSlug);
    if (!product) {
      // No product in DB yet — navigate to contact/setup
      navigate('/helpdesk');
      return;
    }
    setTrialLoading(productSlug);
    try {
      await startTrial({ productId: product.id });
      await refresh();
      toast.success('Free trial started! Enjoy 14 days of full access.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not start trial';
      toast.error(msg);
    } finally {
      setTrialLoading(null);
    }
  };

  const getPlanCta = (planName: string): { label: string; action: () => void; disabled: boolean } => {
    const slug = PLAN_SLUGS[planName.toLowerCase() as keyof typeof PLAN_SLUGS];
    const alreadyOnPlan = planSlug === slug;
    const alreadySubscribed = hasActiveSubscription && alreadyOnPlan;

    if (planName === 'Enterprise') {
      return { label: 'Contact Sales', action: () => navigate('/helpdesk'), disabled: false };
    }
    if (alreadySubscribed) {
      return { label: 'Current Plan', action: () => {}, disabled: true };
    }
    if (isOnTrial && alreadyOnPlan) {
      return {
        label: `${trialDaysRemaining}d Trial Active`,
        action: () => navigate('/settings'),
        disabled: false,
      };
    }
    if (hasActiveSubscription) {
      return { label: 'Switch Plan', action: () => navigate('/settings'), disabled: false };
    }
    return {
      label: 'Start Free Trial',
      action: () => handleStartTrial(slug),
      disabled: trialLoading !== null,
    };
  };

  const plans = [
    {
      name: 'Starter',
      slug: PLAN_SLUGS.starter,
      tagline: 'Freelancers · Small businesses · Retail · IT & Software',
      icon: <Rocket size={20} />,
      price: billing === 'monthly' ? 2500 : 25000,
      period: billing === 'monthly' ? '/month' : '/year',
      saving: billing === 'annual' ? 'Save ETB 5,000' : null,
      color: 'border-slate-200 dark:border-slate-800',
      headerBg: '',
      badge: null,
      highlights: [
        '5 users included',
        'invoice, estimates & receipts',
        'Recurring invoices & payment reminders',
        'Multi-currency (3 currencies)',
        'Expense tracking & petty cash',
        'VAT & TOT filing to MoR',
        'WHT certificates',
        'Basic payroll (5 employees)',
        'Email support',
      ],
      ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600',
    },
    {
      name: 'Business',
      slug: PLAN_SLUGS.business,
      tagline: 'Medium enterprises — Banking · Manufacturing · Healthcare',
      icon: <Zap size={20} />,
      price: billing === 'monthly' ? 7500 : 75000,
      period: billing === 'monthly' ? '/month' : '/year',
      saving: billing === 'annual' ? 'Save ETB 15,000' : null,
      color: 'border-[var(--pro-azure)] shadow-2xl shadow-green-500/10 scale-105 z-10',
      headerBg: 'bg-[var(--pro-azure-50)]0',
      badge: 'Best Value',
      highlights: [
        '25 users included',
        'Full accounting GL & IFRS reports',
        'Unlimited payroll + PAYE to MoR',
        'ALL tax types → immediate MoR submission',
        'Net Tax Payable Report (consolidated)',
        'Bank feeds, OCR & reconciliation',
        'Inventory & supply chain',
        'CRM, projects & BI analytics',
        'Priority support',
      ],
      ctaStyle: 'bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] shadow-lg shadow-green-500/20',
    },
    {
      name: 'Enterprise',
      slug: PLAN_SLUGS.enterprise,
      tagline: 'Large enterprises — ERP · CRM · BI · On-Premise · Hybrid',
      icon: <Crown size={20} />,
      price: null,
      period: '',
      saving: null,
      color: 'border-slate-200 dark:border-slate-800',
      headerBg: '',
      badge: null,
      highlights: [
        'Unlimited users',
        'Multi-company & consolidation',
        'On-premise & hybrid deployment',
        'International tax (TP, thin cap, foreign credit)',
        'Audit outsourcing & external audit',
        'White-labeling & custom branding',
        'IoT & smart device management',
        'Market forecast & competitive intelligence',
        'Dedicated SLA & support',
      ],
      ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600',
    },
  ];

  const renderCell = (val: boolean | string) => {
    if (val === true) return <CheckCircle2 size={16} className="text-[var(--pro-azure)] mx-auto" />;
    if (val === false) return <Minus size={14} className="text-slate-200 dark:text-slate-800 mx-auto" />;
    return <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{val}</span>;
  };

  return (
    <div className="pb-20">
      {/* Trial status banner */}
      {isOnTrial && (
        <div className="mx-4 mt-4 flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <Clock size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            Free trial active — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining.
            {' '}<button onClick={() => navigate('/settings')} className="underline hover:no-underline">Manage billing →</button>
          </p>
        </div>
      )}

      {/* Required feature callout */}
      {requiredFeature && (
        <div className="mx-4 mt-4 flex items-center gap-3 px-5 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <Lock size={15} className="text-slate-400 shrink-0" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            <span className="font-black text-[var(--pro-azure)]">{requiredFeature}</span> requires an upgrade.
            Choose a plan below to unlock it.
          </p>
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl mb-20 mt-4 mx-4">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--pro-azure-100)] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 rounded-full mb-6">
            <Sparkles size={14} className="text-[var(--pro-azure-light)]" />
            <span className="text-[10px] font-black text-[var(--pro-azure-light)] uppercase tracking-widest">Smart Pricing</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tighter">
            Accounting that submits{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--pro-azure-light)] to-teal-300">itself to MoR.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Online or on-premise. For freelancers, small, medium and large businesses. All tax types consolidated and submitted immediately to MoR/ERCA — VAT, TOT, WHT, PAYE, BIT, Excise, Stamp Duty, Schedule D, DRRF and more. Start your 14-day free trial — no credit card required.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={() => navigate('/settings/app-store')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all"
            >
              <Store size={13} /> Ovds App Market
            </button>
            <button
              onClick={() => navigate('/settings/app-store?category=UI+Themes')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all"
            >
              <Layers size={13} /> UI &amp; Theme Modules
            </button>
            <Link
              to="/sample-invoice"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pro-azure-50)]0/20 border border-[var(--pro-azure)]/30 text-green-300 text-xs font-bold hover:bg-[var(--pro-azure-dark)]/30 transition-all"
            >
              <FileText size={13} /> Sample Invoice
            </Link>
            <Link
              to="/getting-started/invoice-module"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all"
            >
              <Download size={13} /> Invoice Module
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-10">
            <span className={`text-xs font-bold uppercase tracking-widest ${billing === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-slate-800 rounded-full border border-slate-700 transition-all p-1"
            >
              <div className={`w-5 h-5 bg-[var(--pro-azure-50)]0 rounded-full shadow-lg transition-transform duration-300 ${billing === 'annual' ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-widest ${billing === 'annual' ? 'text-white' : 'text-slate-500'}`}>Yearly</span>
              <span className="px-2 py-0.5 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 text-[var(--pro-azure-light)] text-[10px] font-black rounded-lg">SAVE 17%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Pricing Cards */}
        <div id="pricing-cards" className="ovds-grid-layout cols-3 gap-lg mb-20">
          {plans.map((plan) => {
            const cta = getPlanCta(plan.name);
            const isCurrent = planSlug === plan.slug && (hasActiveSubscription || isOnTrial);
            const isLoading = trialLoading === plan.slug;

            return (
              <div key={plan.name} className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border ${plan.color} overflow-hidden`}>
                {plan.badge && (
                  <div className="absolute top-4 right-6 px-3 py-1 bg-white text-[var(--pro-azure)] text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl">
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-4 left-6 flex items-center gap-1.5 px-3 py-1 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 rounded-full">
                    <CheckCircle2 size={10} className="text-[var(--pro-azure)]" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {isOnTrial ? 'Trial' : 'Active'}
                    </span>
                  </div>
                )}

                <div className={`p-8 ${plan.headerBg}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
                    plan.name === 'Business' ? 'bg-white/20 text-white' : 'bg-[var(--pro-azure-50)] dark:bg-slate-800 text-[var(--pro-azure)] dark:text-white'
                  }`}>
                    {plan.icon}
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${plan.name === 'Business' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.name}
                  </h2>
                  <p className={`text-sm mt-1 font-medium ${plan.name === 'Business' ? 'text-blue-100' : 'text-slate-500'}`}>
                    {plan.tagline}
                  </p>
                  <div className="mt-8 flex items-baseline gap-1">
                    {plan.price !== null ? (
                      <>
                        <span className={`text-3xl font-black tabular-nums ${plan.name === 'Business' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {plan.price.toLocaleString()}
                        </span>
                        <span className={`text-sm font-bold uppercase tracking-widest ${plan.name === 'Business' ? 'text-blue-200' : 'text-slate-400'}`}>
                          ETB {plan.period}
                        </span>
                      </>
                    ) : (
                      <span className={`text-3xl font-black ${plan.name === 'Business' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Custom</span>
                    )}
                  </div>
                  {plan.saving && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                      <Zap size={10} /> {plan.saving}
                    </div>
                  )}
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">Includes:</p>
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.name === 'Business' ? 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          <Check size={12} strokeWidth={4} />
                        </div>
                        {h}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={cta.action}
                    disabled={cta.disabled || isLoading}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${plan.ctaStyle}`}
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {cta.label}
                    {!isLoading && !cta.disabled && <ArrowRight size={14} />}
                  </button>
                  {/* Enterprise subscribers get a direct download link */}
                  {plan.name === 'Enterprise' && (hasActiveSubscription || isOnTrial) && planSlug === plan.slug && (
                    <Link
                      to="/getting-started/client"
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-all"
                    >
                      <Download size={10} /> Download Client
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Matrix */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Compare all features</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Deep dive into every capability.</p>
          </div>
          <div className="ovds-panel overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <div className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Feature</div>
              <div className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Starter</div>
              <div className="p-6 text-[10px] font-black text-[var(--pro-azure)] uppercase tracking-widest text-center bg-[var(--pro-azure-50)]0/5">Business</div>
              <div className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Enterprise</div>
            </div>
            {FEATURE_GROUPS.map(group => (
              <React.Fragment key={group.group}>
                <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-800/20 ovds-label border-b border-slate-100 dark:border-slate-800">
                  {group.group}
                </div>
                {group.features.map(f => (
                  <div key={f.label} className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="p-6 text-sm font-bold text-slate-700 dark:text-slate-300">{f.label}</div>
                    <div className="p-6 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center">{renderCell(f.starter)}</div>
                    <div className="p-6 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center bg-[var(--pro-azure-50)]0/[0.02]">{renderCell(f.business)}</div>
                    <div className="p-6 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center">{renderCell(f.enterprise)}</div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* §4.3 Tier 2 — Perpetual Licensing (One-Time Lifetime Purchase) */}
        <div className="mb-20">
          <div className="flex items-start gap-6 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Crown size={22} className="text-amber-400" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-xl font-black text-white tracking-tight">Perpetual License</h2>
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                  One-Time · Lifetime
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                Pay once — own it forever. A lump-sum flat-fee payment activates a permanent cryptographic key on
                the local database, unlocking all core compliance modules for the life of the device or branch.
                No recurring software fees. Cloud backup add-ons remain subscription-based.
              </p>

              {/* Three highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {[
                  {
                    icon: <Check size={13} className="text-amber-400" />,
                    title: 'Permanent cryptographic key',
                    desc: 'Stored locally — entitlement source set to LIFETIME, never expires',
                  },
                  {
                    icon: <Check size={13} className="text-amber-400" />,
                    title: 'All core compliance modules',
                    desc: 'VAT, TOT, WHT, BIT, SRM printing, MoR live API — unlocked on activation',
                  },
                  {
                    icon: <Check size={13} className="text-amber-400" />,
                    title: 'Instant unlock, no restart',
                    desc: 'Pay via Telebirr or CBE Birr → entitlement cache rebuilt immediately',
                  },
                ].map((h) => (
                  <div key={h.title} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      {h.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{h.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 flex flex-col items-end gap-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Starting from</p>
              <p className="text-3xl font-black text-white tabular-nums">
                ETB 85,000
              </p>
              <p className="text-[11px] text-slate-500">per device / branch · one-time</p>
              <button
                onClick={() => navigate('/helpdesk')}
                className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
              >
                Contact Sales <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              <HelpCircle size={12} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FAQ</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Frequently Asked<br />Questions</h2>
            <p className="mt-4 text-slate-500 font-medium leading-relaxed max-w-sm">
              Everything you need to know about plans, trials, and billing.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="ovds-panel p-5 cursor-pointer hover:border-[var(--pro-azure-100)] dark:hover:border-green-900 transition-all"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{faq.q}</h3>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-300 shrink-0 ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </div>
                {expandedFaq === i && (
                  <p className="mt-3 text-[12px] text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Open Source & App Store CTA */}
        <div className="ovds-panel mb-20 overflow-hidden">
          <div className="ovds-panel-header">
            <div className="flex items-center gap-2">
              <Rocket size={15} className="text-[var(--pro-azure)]" />
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Open Source & Customization</span>
            </div>
            <button
              onClick={() => navigate('/settings/app-store')}
              className="ovds-btn-secondary"
            >
              <Store size={12} /> Open App Market
            </button>
          </div>
          <div className="ovds-panel-body">
            <div className="ovds-grid-layout cols-3">
              {[
                {
                  icon: <Sparkles size={16} className="text-[var(--pro-azure)]" />,
                  title: 'Open Source Core',
                  desc: 'Every component in @ovds/ui and @ovds/shared is open source. Fork, extend, or replace anything to match your brand.',
                },
                {
                  icon: <Layers size={16} className="text-violet-600" />,
                  title: 'UI Theme Modules',
                  desc: 'Install alternative themes from the Ovds App Market — dark mode, compact grid, print-ready, and custom brand kits.',
                },
                {
                  icon: <Zap size={16} className="text-amber-500" />,
                  title: 'NX Monorepo Ready',
                  desc: 'Built on NX with @ovds/ui, @ovds/shared, @ovds/database, and @ovds/design-system — clean build graph, zero duplication.',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;



