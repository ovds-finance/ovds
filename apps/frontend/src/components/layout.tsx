import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './sidebar';
import Header from './header';
import Footer from './footer';
import SessionExpiryBanner from './sessionExpiryBanner';
import TrialBanner from './trialBanner';
import KeyboardShortcutsModal from './keyboardShortcutsModal';
import ActivityFeedDrawer from './activityFeedDrawer';
import DashboardManager from './dashboard/dashboardManager';
import { TabBar, TabManagerProvider } from './tabManager/TabManager';
import CompanySetupWizard from './companySetupWizard';
import MandatoryReleaseBarrier from './mandatoryReleaseBarrier';
import OfflineSyncBanner from './offlineSyncBanner';
import SetupWizardBanner from './setupWizardBanner';
import { Icon } from './ui';
import { zIndex } from '@ovds/ui';
import { CommandPalette, useCommandPalette } from '@ovds/ui';
import type { CommandPaletteAction } from '@ovds/ui';
import { useAuth } from '../rbac/AuthContext';
import { useSessionRefresh } from '../hooks/useSessionRefresh';
import { useBusiness } from '../context/businessContext';
import { useHealth } from '../services/health.service';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import MobileBottomNav from './mobileBottomNav';
import ComplianceStatusBar from './complianceStatusBar';
import { useFocusTrap } from '../hooks';
import { useLangSync } from '../hooks/useLangSync';
import { useOfflineResilience } from '../hooks/useOfflineResilience';
import { useNavTree } from '../hooks/useNavTree';
import api from '../services/api';


// Expose navigate globally for G-chord keyboard shortcuts
declare global {
  interface Window { __ovds_navigate?: (path: string) => void; }
}

interface LayoutProps {
  children: React.ReactNode;
}

const routeTitleMap: Record<string, string> = {
  '/dashboard':              'admin.title',
  '/hr/employees':              'employees.title',
  '/hr/departments':            'nav.items.departments',
  '/hr/attendance':             'nav.items.attendance',
  '/hr/leaves':                 'leaves.title',
  '/hr/shifts':                 'nav.items.shifts',
  '/hr/holidays':               'nav.items.holidays',
  '/hr/payroll':                'payroll.title',
  '/hr/payroll-administration': 'nav.items.payroll_administration',
  '/hr/payroll-bank-export':    'nav.items_ext.payroll_bank_export',
  '/hr/paye-declarations':      'nav.items_ext.paye_pension',
  '/hr/gratuity':               'nav.items_ext.gratuity_severance',
  '/hr/calendar':               'nav.items.team_calendar',
  '/reports?type=income-expense':    'nav.items.report_income_expense',
  '/reports?type=pl':                'nav.items.report_pl',
  '/reports?type=bs':                'nav.items.report_bs',
  '/reports?type=cf':                'nav.items.report_cf',
  '/reports?type=equity':            'nav.items.report_equity',
  '/reports?type=notes':             'nav.items.report_notes',
  '/reports?type=gl':                'nav.items.report_gl',
  '/reports?type=trial-balance':     'nav.items.report_trial_balance',
  '/reports?type=ar-aging':          'nav.items.report_ar_aging',
  '/reports?type=ap-aging':          'nav.items.report_ap_aging',
  '/reports?type=expense-summary':   'nav.items.report_expense_summary',
  '/reports?type=tax':               'nav.items.report_tax',
  '/reports?type=tax-clearance':     'nav.items.report_tax_clearance',
  '/reports?type=payroll-summary':   'nav.items.report_payroll_summary',
  '/reports?type=pit-certificate':   'nav.items.report_pit_cert',
  '/reports?type=attendance-summary':'nav.items.report_attendance_summary',
  '/reports?type=builder':           'nav.items.reports_builder',
  '/reports?type=my':                'nav.items.reports_saved',
  '/reports?action=schedule':        'nav.items.reports_scheduled',
  '/notifications':          'nav.items.notifications',
  '/settings/enroll':                 'nav.items.enrollment',
  '/settings/users':                  'nav.items.users',
  '/settings/audit-logs':             'nav.items.audit_logs_admin',
  '/settings':               'nav.items.settings',
   '/settings/currencies':             'nav.items_ext.currencies',
   '/settings/email':                  'nav.items_ext.email_smtp',
   '/settings/catalog':                'nav.items_ext.settings_catalog',
  '/settings/api-docs':               'nav.items.api_docs',
   '/reports-dashboard':        'nav.items.reports_dashboard',
   '/reports/insights':      'nav.items.business_insights',
  '/items':                  'Items & Inventory',
  '/sales/invoices':               'nav.items.invoices',
  '/purchases/bills':                  'nav.items.bills',
  '/purchases/payments':               'nav.items_ext.payments',
  '/purchases/aged-payables':          'nav.items_ext.aged_payables',
  '/purchases':                        'nav.items_ext.purchases',
  '/tax/vat':                    'nav.items.vat_administration',
  '/vat-administration':     'nav.items.vat_administration',
  '/tax-dashboard':          'nav.items.tax_dashboard',
  '/tax-filing':             'nav.items.tax_filing',
  '/accounting':             'nav.items.accounting',
  '/settings/master-data':            'Master Data',
  '/companies':              'nav.items.companies',
  '/settings/multi-company':    'nav.items.multi_company_admin',
  '/inventory':              'nav.items.items',
  '/crm':                    'nav.items.crm',
  '/crm/contacts':           'nav.items.crm_contacts',
  '/crm/companies':          'nav.items.crm_companies',
  '/crm/deals':              'nav.items.crm_deals',
  '/crm/activities':         'nav.items.crm_activities',
  '/crm/settings':           'nav.items.crm_settings',
  '/disaster-fund':          'nav.items.disaster_fund',
  '/ovds/partnerships':           'nav.items.partnerships',
  '/ovds/loans':         'nav.items.business_loans',
  '/ovds/investments':            'nav.items.investments',
  '/ovds':                'nav.items.ovds_hub',
  '/accounting/categories': 'nav.items.transaction_categories',
  '/customers/portal':          'nav.items.client_portal',
  '/customers/payment-tracker':        'nav.items.payment_tracker',
  '/settings/email-templates':        'nav.items.email_templates',
  '/customers/summary':       'nav.items.customer_summary',
  '/onboarding':             'nav.items.onboarding_admin',
  '/settings/onboarding':       'nav.items.onboarding_admin',
  '/accounting/collections': 'nav.items.accounting_collections',
  '/banking/treasury':      'nav.items.treasury_forecast',
  '/banking/accounts':       'nav.items.bank_accounts',
  '/settings/app-store':              'nav.items.app_store',
  '/purchases/vendors':                'nav.items.vendors',
  '/accounting/hub':                     'Accounting Hub',
  '/purchases/expenses':               'nav.items.expenses',
  '/purchases/orders':        'nav.items.purchase_orders',
  '/accounting/fixed-assets':           'nav.items.fixed_assets',
  '/banking/transfers':         'nav.items.fund_transfers',
  '/settings/roles':       'nav.items.role_permissions',
  '/settings/advanced-access-controls': 'nav.items.advanced_access',
  '/banking/statement-import':  'nav.items.bank_statement_import',
  '/accounting/period-close':           'nav.items.period_close',
  '/compliance/audit-outsourcing':      'nav.items.audit_outsourcing',
  '/tax/business-income':    'nav.items.business_income_tax',
  '/admin/notifications-settings': 'nav.items.notification_settings',
  '/entry':                  'common.portal_title',
  '/tax/dashboard':          'nav.items.tax_dashboard',
  '/tax/filing':             'nav.items.tax_filing',
  '/compliance/auditor':     'nav.items.compliance_auditor',
  '/compliance/security':     'Security Evaluator',
  '/ifrs':                   'nav.items.ref_ifrs',
  '/general-ledger-compliance':        'GL & Compliance Dashboard',
  '/general-ledger-compliance/dashboard': 'GL & Compliance Dashboard',
  '/accounting/aabe-audit':            'AABE Audit Readiness',
  '/accounting/consolidation':         'Group Consolidation',
  '/companies/new':               'nav.items.companies',
  '/payment-required':       'common.layout.service_unavailable',
  '/service-unavailable':    'common.layout.service_unavailable',
  '/sales/receipts':               'nav.items_ext.receipts',
  '/sales/refunds':                'nav.items_ext.refunds',
  '/forbidden':              'forbidden.title',
  '/crm/pipeline':           'nav.items.crm_pipeline',
  '/settings/import':          'nav.items.import_center',
  '/plans':                  'nav.items_ext.plans',
  '/settings/developers':             'Developer Guide',
  '/ovds/loyalty':                'nav.items_ext.loyalty_dashboard',
  '/purchases/scanned-bills':          'nav.items_ext.scanned_bills',
  '/accounting/leases':                 'nav.items_ext.leases_ifrs16',
  '/customers/growth':        'nav.items_ext.growth_trends',
  '/customers/statement':     'nav.items_ext.customer_statements',
  '/helpdesk':               'nav.items_ext.helpdesk',
  '/settings/releases':               'nav.items_ext.system_updates',
  // hr/calendar defined above — removed duplicate
  '/banking/transactions':           'nav.items.transactions',
  '/sales/estimates':              'nav.items_ext.estimates_quotes',
  '/sales/credit-notes':           'nav.items_ext.credit_notes',
  '/sales/debit-notes':            'nav.items_ext.sales_debit_notes',
  '/purchases/debit-notes':            'nav.items_ext.debit_notes',
  '/purchases/receipts':      'nav.items_ext.purchase_receipts',
  '/getting-started':        'nav.items_ext.setup_wizard',
  '/banking/petty-cash':             'nav.items_ext.petty_cash',
  '/banking/fx-rates':               'nav.items_ext.fx_rates_multicurrency',
  '/accounting/budgets':                'nav.items_ext.budgets',
  '/accounting/budgets/variance':       'nav.items_ext.budget_variance',
  '/banking/reconciliation':    'nav.items_ext.auto_reconciliation',
  '/tax/etax-declaration':   'e-Tax Online VAT Declaration',
  // Setup
  '/settings/business-registration':  'Business Registration',
  '/tax/penalty-calculator':  'Penalty Calculator',
  '/getting-started/cloud':   'Cloud Deployment',
  '/getting-started/on-premise': 'On-Premise Deployment',
  '/getting-started/client': 'Enterprise Client',
  '/sample-invoice':         'Sample Invoice',
  '/getting-started/invoice-module': 'Invoice Module Download',
  '/ovds/payment-gateways': 'Payment Gateways',
  // Sales
  '/sales/orders':            'Sales Orders',
  '/sales':                    'Sales',
  '/sales/proforma':          'Proforma Invoices',
  // Purchases
  '/purchases/grn':                     'Goods Received Notes',
  '/tax/wht-certificates':    'WHT Certificates',
  // HR
  // HR — entries below are kept as canonical single entries above; do not re-add here
  // Compliance Tasks
  '/tax/tot':                 'TOT Filing',
  '/tax/excise-tax':          'Excise Tax',
  '/tax/stamp-duty':          'Stamp Duty',
  '/tax/property-tax':        'Property Tax',
  '/tax/schedule-d':          'Schedule D (Other Income)',
  // Analysis
  '/accounting/accruals-prepayments': 'Accruals & Prepayments',
  '/accounting/workflow':     'Period Workflow',
  // Phase 4 MoR portals
  '/trade':                   'ECC Customs Portal',
   '/compliance/vandv':                   'TASS — SRM Devices',
   '/compliance/certificates':             'E-Invoice Digital Certificate',
  // Admin
  '/smes':                    'SME Profiles',
  // Unified Control Node
  '/control':                'Unified Control Node',
  '/control/iot':            'IoT, Apps & Device Control',
  // IoT & POS Devices
  '/iot/devices':            'IoT Device Registry',
  '/iot/telemetry':          'Sensor / Telematics Sync',
  '/iot/billing':            'Smart Billing (POS)',
  '/iot/alerts':             'Device Alerts',
  '/iot/ota':                'OTA Updates',
  // Phase 3 – Analysis additions
  '/tax/liability-estimator':'Tax Liability Estimator',
  // Phase 4 – MoR additions
  '/tax/pension-submission':  'Pension Submissions',
  '/tax/payment-reference':   'Payment Reference / Voucher',
  // Financial Statements — AABE/IFRS primary statements
  '/reports/financial-statements':              'Financial Statements',
  '/reports/financial-statements?tab=bs':       'Statement of Financial Position (Balance Sheet)',
  '/reports/financial-statements?tab=pl':       'Statement of Profit or Loss and Other Comprehensive Income',
  '/reports/financial-statements?tab=cf':       'Statement of Cash Flows',
  '/reports/financial-statements?tab=notes':    'Notes to the Financial Statements (including Accounting Policies)',
  '/reports/equity':                            'Statement of Changes in Equity',
  // Management & Compliance Reports — AABE narrative reports
  '/reports/mor-report?section=directors':      "Directors' / Management Report",
  '/compliance/auditor?view=audit-opinion':     "Auditor's Report",
  '/reports?type=ifrs18':                       'Management Performance Measures (IFRS 18)',
  '/compliance/auditor?view=sustainability&pillar=governance': 'Corporate Governance Report',
  '/settings/digital-wallets': 'Digital Wallets (Telebirr)',
  '/settings/payment-gateways/chapa': 'Chapa Payment Gateway',
  '/banking/digital-payments':        'Telebirr & Chapa',
  '/inventory/valuation':             'IAS 2 Stock Valuation',
  '/expense-claims':          'Expense Claims',
  '/banking/feeds':           'Bank Feeds',
  '/banking/cash-flow':       'Cash Flow',
   // Inventory group titles
   '/inventory/adjustments':     'Stock Adjustments',
   '/inventory/variants':        'Variants & Bundles',
   // Banking additions
   '/banking/rules':           'Matching Rules',
   '/banking/year-end':        'Year-End Close',
   '/banking/workflow':        'Banking Workflow',
   '/ovds/accounts':            'Chart of Accounts',
   '/ovds/reports/trial-balance':  'Trial Balance',
   '/ovds/reports/general-ledger': 'General Ledger',
   '/ovds/reports/balance-sheet':  'Balance Sheet',
   '/ovds/reports/profit-loss':  'Profit & Loss',
   '/double-entry/journals':       'Journal Entries',
   '/accounting/opening-balances': 'Opening Balances',
   '/accounting/cost-centers': 'Cost Centers',
   '/ovds/workflow':           'Financial Cycle',
   '/tax/acknowledgement-vault': 'Acknowledgement Vault',
   '/settings/company-profile': 'TIN & MoR Credentials',
   '/settings/license': 'License & Subscription',
   '/settings/eims': 'EIMS Integration',
   '/ovds/projects':        'Projects',
   '/tax/universal-config':    'Universal Tax Configuration',
   '/device-control':          'Device Control Center',
   '/refine/companies/:id':    'Refine Company Detail',
   '/refine/invoices':        'Refine Invoices',
   '/refine/dashboard':   'Refine Dashboard',
   '/refine/users':       'Refine Users',
   '/refine/companies':   'Refine Companies',
   '/refine-demo':        'Refine Demo',
   '/device-control/requests': 'Device Change Requests',
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true',
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [slowDismissed, setSlowDismissed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [showDashboardManager, setShowDashboardManager] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, can, canAccessRoute } = useAuth();
  useSessionRefresh();
  useLangSync();
  const { companies, loading: companiesLoading, selectedCompanyId } = useBusiness();
  const { isServiceDown, checkHealth } = useHealth();
  const { isOnline, quality } = useNetworkStatus();
  const { capabilities: offlineCaps } = useOfflineResilience(selectedCompanyId ?? undefined);
  const { allItems: dynamicNavItems } = useNavTree();
  // Focus trap only on mobile when sidebar overlay is open — never on desktop
  useFocusTrap(sidebarRef, sidebarOpen);

  // -- Enterprise Command Palette -----------------------------------------------
  const quickActions: CommandPaletteAction[] = useMemo(() => {
    const actions: CommandPaletteAction[] = [
      { id: 'qa-invoice', label: 'New Invoice', category: 'Quick Actions', icon: <Icon name="INVOICE" size={14} className="text-teal-500" />, action: () => navigate('/sales/invoices?action=new'), shortcut: '⌘N' },
      { id: 'qa-bill', label: 'New Bill', category: 'Quick Actions', icon: <Icon name="VENDOR" size={14} className="text-rose-500" />, action: () => navigate('/purchases/bills?action=new'), shortcut: '⌘B' },
      { id: 'qa-expense', label: 'New Expense', category: 'Quick Actions', icon: <Icon name="RECEIPT" size={14} className="text-amber-500" />, action: () => navigate('/purchases/expenses?action=new') },
      { id: 'qa-customer', label: 'New Customer', category: 'Quick Actions', icon: <Icon name="CUSTOMER" size={14} className="text-sky-500" />, action: () => navigate('/accounting/hub?tab=CUSTOMERS') },
      { id: 'qa-vendor', label: 'New Vendor', category: 'Quick Actions', icon: <Icon name="COMPANY" size={14} className="text-slate-500" />, action: () => navigate('/accounting/hub?tab=VENDORS') },
      { id: 'qa-transfer', label: 'New Transfer', category: 'Quick Actions', icon: <Icon name="REFRESH" size={14} className="text-indigo-500" />, action: () => navigate('/banking/transfers?action=new') },
    ];
    const routes = ['/sales/invoices', '/purchases/bills', '/purchases/expenses', '/accounting/hub', '/banking/transfers'];
    return actions.filter((_, i) => canAccessRoute(routes[i] ?? '/'));
  }, [canAccessRoute, navigate]);

  const navActions: CommandPaletteAction[] = useMemo(() => {
    return dynamicNavItems
      .filter(item => canAccessRoute(item.to))
      .map(item => ({
        id: `nav-${item.to}`,
        label: item.i18nKey ? t(item.i18nKey, { defaultValue: item.label }) : item.label,
        category: item.permission ? 'Pages' : 'Pages',
        icon: typeof item.icon === 'string' ? <Icon name={item.icon as any} size={14} /> : item.icon,
        action: () => navigate(item.to),
        keywords: item.keywords,
        shortcut: item.end ? 'Enter' : undefined,
      }))
      .slice(0, 50);
  }, [canAccessRoute, navigate, t, dynamicNavItems]);

  // -- Document search for command palette -------------------------------------
  const [docActions, setDocActions] = useState<CommandPaletteAction[]>([]);

  const baseActions = useMemo(() => [...quickActions, ...navActions], [quickActions, navActions]);
  const allActions = useMemo(() => [...baseActions, ...docActions], [baseActions, docActions]);

  const commandPalette = useCommandPalette({
    actions: allActions,
    shortcut: 'cmd+k',
  });

  useEffect(() => {
    if (!commandPalette.query.trim() || commandPalette.query.length < 2) {
      setDocActions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [invRes, billRes, empRes] = await Promise.allSettled([
          can('invoices:read') ? api.get(`/ovds/invoices?search=${encodeURIComponent(commandPalette.query)}&limit=4`, { headers: { 'x-background': '1' } } as any) : Promise.reject(),
          can('bills:read') ? api.get(`/ovds/bills?search=${encodeURIComponent(commandPalette.query)}&limit=3`, { headers: { 'x-background': '1' } } as any) : Promise.reject(),
          can('employees:read') ? api.get(`/hr/employees?search=${encodeURIComponent(commandPalette.query)}&take=3`, { headers: { 'x-background': '1' } } as any) : Promise.reject(),
        ]);
        const results: CommandPaletteAction[] = [];
        if (invRes.status === 'fulfilled') {
          const invs = invRes.value.data?.data?.invoices ?? invRes.value.data?.data ?? [];
          (Array.isArray(invs) ? invs : []).slice(0, 4).forEach((inv: any) => {
            results.push({
              id: `inv-${inv.id}`,
              label: inv.invoiceNumber,
              category: 'Invoices',
              action: () => navigate('/sales/invoices'),
              badge: inv.status,
            });
          });
        }
        if (billRes.status === 'fulfilled') {
          const bills = billRes.value.data?.data?.bills ?? billRes.value.data?.data ?? [];
          (Array.isArray(bills) ? bills : []).slice(0, 3).forEach((bill: any) => {
            results.push({
              id: `bill-${bill.id}`,
              label: bill.billNumber ?? bill.reference ?? `Bill #${bill.id.slice(0, 8)}`,
              category: 'Bills',
              action: () => navigate('/purchases/bills'),
              badge: bill.status,
            });
          });
        }
        if (empRes.status === 'fulfilled') {
          const emps = empRes.value.data?.data?.data ?? empRes.value.data?.data ?? [];
          (Array.isArray(emps) ? emps : []).slice(0, 3).forEach((emp: any) => {
            results.push({
              id: `emp-${emp.id}`,
              label: `${emp.firstName} ${emp.lastName}`,
              category: 'Employees',
              action: () => navigate('/hr/employees'),
            });
          });
        }
        setDocActions(results);
      } catch {
        // silent
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [commandPalette.query, can, navigate]);

  // Expose navigate for G-chord keyboard shortcuts
  useEffect(() => {
    window.__ovds_navigate = navigate;
    return () => { delete window.__ovds_navigate; };
  }, [navigate]);

  // Listen for sidebar-dispatched wizard open event
  useEffect(() => {
    const handler = () => setShowSetupWizard(true);
    window.addEventListener('ovds:open-setup-wizard', handler);
    return () => window.removeEventListener('ovds:open-setup-wizard', handler);
  }, []);

  // Listen for header-dispatched activity feed toggle
  useEffect(() => {
    const handler = () => setShowActivityFeed(v => !v);
    window.addEventListener('ovds:toggle-activity', handler);
    return () => window.removeEventListener('ovds:toggle-activity', handler);
  }, []);

  // Listen for dashboard manager open event (e.g. from Dashboard page Widgets button)
  useEffect(() => {
    const handler = () => setShowDashboardManager(true);
    window.addEventListener('ovds:open-dashboard-manager', handler);
    return () => window.removeEventListener('ovds:open-dashboard-manager', handler);
  }, []);

  // Auto-open wizard for ADMIN with no companies (once per session)
  useEffect(() => {
    const dismissed = sessionStorage.getItem('wizard_auto_dismissed');
    if (!dismissed && user?.role === 'ADMIN' && !companiesLoading && companies.length === 0) {
      setShowSetupWizard(true);
    }
  }, [user, companies, companiesLoading]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      document.documentElement.setAttribute('data-sidebar', next ? 'collapsed' : 'expanded');
      // collapsed = rail only (56px); expanded = rail (56px) + nav panel (240px) = 296px
      document.documentElement.style.setProperty('--sidebar-w', next ? '56px' : '296px');
      return next;
    });
  }, []);

  // Stamp on mount so it's available immediately when any modal opens
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-sidebar',
      collapsed ? 'collapsed' : 'expanded',
    );
    // collapsed = rail only (56px); expanded = rail (56px) + nav panel (240px) = 296px
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '56px' : '296px');
  }, [collapsed]);

  const titleKey = routeTitleMap[location.pathname + location.search]
    ?? routeTitleMap[location.pathname]
    ?? 'admin.title';
  const pageTitle = t(titleKey) || 'Dashboard';

  // Update document title
  useEffect(() => {
    document.title = `${pageTitle} · ${t('brand.name', 'OVDS')}`;
  }, [pageTitle, t]);

  // Route-change progress bar — fast, minimal fake-load illusion
  useEffect(() => {
    setProgress(0);
    setShowProgress(true);
    const t1 = setTimeout(() => setProgress(35), 10);
    const t2 = setTimeout(() => setProgress(65), 50);
    const t3 = setTimeout(() => setProgress(90), 120);
    const t4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setShowProgress(false), 100);
    }, 250);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, [location.pathname]);

  // Scroll-to-top visibility + scroll progress
  useEffect(() => {
    const main = document.getElementById('main-scroll');
    if (!main) return;
    const handler = () => {
      setShowScrollTop(main.scrollTop > 300);
      const pct = main.scrollTop / (main.scrollHeight - main.clientHeight || 1);
      setScrollPct(Math.min(1, pct));
    };
    main.addEventListener('scroll', handler);
    return () => main.removeEventListener('scroll', handler);
  }, []);

  // Reset dismissed state when going back online
  useEffect(() => {
    if (isOnline) {
      setOfflineDismissed(false);
      setSlowDismissed(false);
    }
  }, [isOnline]);

  const scrollToTop = useCallback(() => {
    document
      .getElementById('main-scroll')
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    document
      .getElementById('main-scroll')
      ?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut: Home key scrolls to top, ? opens shortcuts
  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        scrollToTop();
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
      // ⌘B / Ctrl+B toggles sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleToggleCollapse();
      }
      // ⌘K / Ctrl+K opens global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(v => !v);
      }
      // A opens activity feed
      if (e.key === 'a' || e.key === 'A') {
        if (!gPressed) {
          e.preventDefault();
          setShowActivityFeed((v) => !v);
        }
      }
      // D opens dashboard manager
      if (e.key === 'd' || e.key === 'D') {
        if (!gPressed) {
          e.preventDefault();
          setShowDashboardManager(v => !v);
        }
      }
      // W opens setup wizard (admin only)
      if (e.key === 'w' || e.key === 'W') {
        if (!gPressed) {
          e.preventDefault();
          setShowSetupWizard(v => !v);
        }
      }
      // R refreshes the page data
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        if (!gPressed) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('kiro:refresh'));
        }
      }
      // G-chord navigation: G then D/I/P/L/N/S
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 1000);
        return;
      }
      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        const nav = window.__ovds_navigate;
        if (!nav) return;
        const chordMap: Record<string, string> = {
          d: '/dashboard',            D: '/dashboard',
          i: '/sales/invoices',       I: '/sales/invoices',
          p: '/hr/payroll',              P: '/hr/payroll',
          l: '/accounting',           L: '/accounting',
          n: '/notifications',        N: '/notifications',
          s: '/settings',             S: '/settings',
          h: '/reports',              H: '/reports',
          v: '/tax/vat',                  V: '/tax/vat',
          e: '/hr/employees',            E: '/hr/employees',
          c: '/crm/contacts',         C: '/crm/contacts',
          t: '/tax/dashboard',        T: '/tax/dashboard',
          b: '/banking/accounts',     B: '/banking/accounts',
          f: '/disaster-fund',        F: '/disaster-fund',
          r: '/reports?type=builder', R: '/reports?type=builder',
          // Digits — new routes
          '4': '/banking/digital-payments',
          '5': '/iot/devices',
          '6': '/iot/telemetry',
          '7': '/iot/billing',
          '8': '/tax/tot',
          '9': '/tax/liability-estimator',
          '0': '/inventory/valuation',
          '1': '/tax/pension-submission',
        };
        const dest = chordMap[e.key];
        if (dest) { e.preventDefault(); nav(dest); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(gTimer); };
  }, [scrollToTop, handleToggleCollapse]);

  return (
    <TabManagerProvider>
    <div className="flex bg-white text-slate-800 min-h-screen w-full relative font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      <MandatoryReleaseBarrier />
      {/* Skip to main content — keyboard / screen reader shortcut */}
      <a
        href="#main-scroll"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-xl focus:text-sm focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[90] animate-aki-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        data-sidebar-nav
        className={`fixed lg:sticky top-0 z-[110] h-screen shrink-0 ${
          collapsed ? 'lg:w-[56px]' : 'lg:w-[296px]'
        } ${
          sidebarOpen
            ? 'translate-x-0 shadow-xl shadow-slate-900/20'
            : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ transition: 'transform 240ms cubic-bezier(0.4, 0, 0.2, 1), width 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <nav aria-label={t('a11y.main_nav')} className="h-full focus:outline-none">
          <Sidebar
            collapsed={collapsed}
            onToggle={handleToggleCollapse}
            onNavClick={() => setSidebarOpen(false)}
            onOpenSearch={() => setShowGlobalSearch(true)}
            onAction={(action) => {
              if (action === '#create-dashboard') {
                setShowDashboardManager(true);
                setSidebarOpen(false);
              }
            }}
          />
        </nav>
      </div>

      {/* Main */}
      <main
        id="main-scroll"
        tabIndex={-1}
        className="flex-1 min-h-screen overflow-y-auto flex flex-col focus:outline-none bg-white dark:bg-slate-950"
      >
        {/* Route progress bar */}
        {showProgress && (
          <div 
            style={{ zIndex: zIndex.tooltip }}
            className="fixed top-0 left-0 right-0 h-0.5 bg-transparent pointer-events-none"
          >
            <div
              className="h-full bg-[#0056D2] shadow-[0_0_10px_rgba(0,86,210,0.5)]"
              style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1, transition: progress === 100 ? 'opacity 0.3s ease 0.1s, width 0.3s ease' : 'width 0.3s ease' }}
            />
          </div>
        )}

        {/* Offline banner */}
        {!isOnline && !offlineDismissed && (
          <div 
            style={{ zIndex: zIndex.sticky }}
            className="sticky top-0 bg-rose-500 text-white px-3 py-1.5 flex items-center justify-between gap-2 shadow-md animate-aki-drop-in"
          >
            <div className="flex items-center gap-2">
              <Icon name="WARNING" size={12} className="shrink-0" />
              <span className="text-[10px] font-bold">{t('layout.offline')}</span>
            </div>
            <button
              onClick={() => setOfflineDismissed(true)}
              className="shrink-0 text-white/70 hover:text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              aria-label={t('a11y.dismiss')}
            >
              {t('a11y.dismiss')}
            </button>
          </div>
        )}

        {/* Slow connection banner */}
        {isOnline && quality === 'slow' && !slowDismissed && (
          <div 
            style={{ zIndex: zIndex.sticky - 1 }}
            className="sticky top-0 bg-amber-500 text-white px-3 py-1 flex items-center justify-between gap-2 shadow-sm animate-aki-drop-in"
          >
            <div className="flex items-center gap-2">
              <Icon name="CLOCK" size={11} className="shrink-0" />
              <span className="text-[10px] font-bold">{t('layout.slow_connection')}</span>
            </div>
            <button
              onClick={() => setSlowDismissed(true)}
              className="shrink-0 text-white/70 hover:text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              aria-label={t('a11y.dismiss')}
            >
              {t('a11y.dismiss')}
            </button>
          </div>
        )}

        {/* Mandatory offline resilience banner for regulated sectors (MoR Regulation No. 570/2025) */}
        {offlineCaps?.requiresResilience && (
          <div
            style={{ zIndex: zIndex.sticky - 1 }}
            className="sticky top-0 bg-indigo-600 text-white px-3 py-1.5 flex items-center justify-between gap-2 shadow-md animate-aki-drop-in"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2">
              <Icon name="WARNING" size={12} className="shrink-0" />
              <span className="text-[10px] font-bold">
                Offline mode REQUIRED — MoR Regulated Sector (Directive 1142/2026)
              </span>
            </div>
            <span className="text-[9px] text-indigo-100 hidden sm:inline">
              {offlineCaps.pendingSyncCount > 0
                ? `${offlineCaps.pendingSyncCount} pending sync`
                : 'All sales must continue offline during internet interruptions'}
            </span>
          </div>
        )}

        {/* Setup wizard banner — shown when System Administration setup is incomplete */}
        <SetupWizardBanner />

        {/* Offline sync queue banner — shows when queued offline actions await sync */}
        <OfflineSyncBanner zIndex={zIndex.sticky - 2} />

        {/* Compliance status bar — shown to ovds/admin roles near deadlines */}
        {['SPURADMIN', 'ADMIN', 'ovds', 'ACCOUNTING'].includes(user?.role ?? '') && (
          <ComplianceStatusBar onlyWhenUrgent />
        )}

        <div className="flex-1 flex flex-col">
          {/* Trial / upgrade banner — shown above header when on free trial */}
          <TrialBanner />

          {/* Header — full width, sticky */}
          <Header
            title={pageTitle}
            onMobileMenuToggle={() => setSidebarOpen((o) => !o)}
            sidebarOpen={sidebarOpen}
            onOpenSearch={() => commandPalette.open()}
          />

          {/* Multi-tab bar — browser-like persistent tabs */}
          <TabBar />

          {/* Page content */}
          <div className="flex-1 pb-16 lg:pb-4 bg-white dark:bg-slate-950">
            <div key={location.pathname} className="page-transition min-h-[calc(100vh-120px)] ovds-content">
              {children}
            </div>
          </div>
          <div className="px-3 sm:px-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-[1440px] mx-auto">
              <Footer />
            </div>
          </div>
        </div>
      </main>

      {/* Scroll to top — with scroll progress ring */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{ zIndex: zIndex.docked + 40 }}
          className="fixed bottom-16 lg:bottom-4 right-4 w-8 h-8 flex items-center justify-center hover:scale-110 transition-all animate-aki-fade-in group"
          title={t('a11y.scroll_to_top')}
          aria-label={t('a11y.scroll_to_top')}
        >
          {/* SVG progress ring */}
          <svg className="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-slate-700" />
            <circle
              cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - scrollPct)}`}
              strokeLinecap="round"
              className="text-emerald-600 transition-all duration-150"
            />
          </svg>
          <div className="w-5 h-5 bg-slate-700 dark:bg-slate-800 text-white rounded-full flex items-center justify-center group-hover:bg-[#0056D2] transition-colors">
            <Icon name="CHEVRON_UP" size={11} className="group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>
      )}

      {/* Activity feed button */}
      <button
        onClick={() => setShowActivityFeed(v => !v)}
        style={{ zIndex: zIndex.docked + 40 }}
        className={`fixed bottom-28 lg:bottom-4 ${showScrollTop ? 'right-14' : 'right-4'} w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 animate-aki-fade-in ${showActivityFeed ? 'bg-[#0056D2] text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        title={t('a11y.activity_feed')}
        aria-label={t('a11y.activity_feed')}
      >
        <Icon name="ACTIVITY" size={14} />
      </button>

      {/* Mobile bottom nav — only on small screens */}
      <MobileBottomNav />

      {/* Session expiry warning */}
      <SessionExpiryBanner />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Dashboard Manager modal */}
      {showDashboardManager && (
        <DashboardManager onClose={() => setShowDashboardManager(false)} />
      )}

      {/* Command Palette (Enterprise) */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        query={commandPalette.query}
        selectedIndex={commandPalette.selectedIndex}
        actions={commandPalette.filteredActions}
        recentActions={commandPalette.recentActions}
        onQueryChange={commandPalette.setQuery}
        onSelect={commandPalette.select}
        onExecute={commandPalette.execute}
        onClose={commandPalette.close}
      />

      {/* Company Setup Wizard */}
      {showSetupWizard && (
        <CompanySetupWizard
          onClose={() => {
            setShowSetupWizard(false);
            sessionStorage.setItem('wizard_auto_dismissed', '1');
          }}
          onComplete={() => {
            setShowSetupWizard(false);
            sessionStorage.setItem('wizard_auto_dismissed', '1');
          }}
        />
      )}

      {/* Activity feed drawer */}
      <ActivityFeedDrawer
        open={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
      />

      {/* -- Global service-down overlay -------------------------------------
           Shown when the health check reports the API is unreachable (502/503/504).
           Blocks interaction so users don't see broken data. -- */}
      {isServiceDown && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Service unavailable"
          style={{ zIndex: zIndex.modal + 10 }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6 animate-aki-fade-in"
        >
          <div className="max-w-xs w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 text-center space-y-4 animate-aki-scale-in">
            <div className="flex justify-center">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <Icon name="SERVER_CRASH" size={24} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('layout.service_unavailable')}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('layout.service_unavailable_desc')}
              </p>
            </div>
            <button
              onClick={() => checkHealth()}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#0056D2] text-white rounded-lg text-[12px] font-bold hover:bg-[#0044A8] transition-all"
            >
              <Icon name="REFRESH" size={12} /> {t('layout.check_again')}
            </button>
          </div>
        </div>
      )}
    </div>
    </TabManagerProvider>
  );
};

export default Layout;



