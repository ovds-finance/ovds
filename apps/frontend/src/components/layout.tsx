import { zIndex } from '@ovds/ui';
import { CommandPalette, useCommandPalette } from '@ovds/ui';
import type { CommandPaletteAction } from '@ovds/ui';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { useFocusTrap } from '../hooks';
import { useLangSync } from '../hooks/useLangSync';
import { useNavTree } from '../hooks/useNavTree';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineResilience } from '../hooks/useOfflineResilience';
import { useSessionRefresh } from '../hooks/useSessionRefresh';
import { useAuth } from '../rbac/AuthContext';
import { useRouteUI } from '../router';
import api from '../services/api';
import { useHealth } from '../services/health.service';

import ActivityFeedDrawer from './activityFeedDrawer';
import CompanySetupWizard from './companySetupWizard';
import ComplianceStatusBar from './complianceStatusBar';
import DashboardManager from './dashboard/dashboardManager';
import Footer from './footer';
import Header from './header';
import KeyboardShortcutsModal from './keyboardShortcutsModal';
import MandatoryReleaseBarrier from './mandatoryReleaseBarrier';
import MobileBottomNav from './mobileBottomNav';
import OfflineSyncBanner from './offlineSyncBanner';
import SessionExpiryBanner from './sessionExpiryBanner';
import SetupWizardBanner from './setupWizardBanner';
import Sidebar from './sidebar';
import { TabBar, TabManagerProvider } from './tabManager/TabManager';
import TrialBanner from './trialBanner';
import { Icon } from './ui';


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
  const [_showGlobalSearch, setShowGlobalSearch] = useState(false);
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
      { id: 'qa-transfer', label: 'New Transfer', category: 'Quick Actions', icon: <Icon name="REFRESH" size={14} className="text-[var(--pro-azure)]" />, action: () => navigate('/banking/transfers?action=new') },
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
      // collapsed = rail only (56px); expanded = full sidebar (276px)
      document.documentElement.style.setProperty('--sidebar-w', next ? '56px' : '276px');
      return next;
    });
  }, []);

  // Stamp on mount so it's available immediately when any modal opens
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-sidebar',
      collapsed ? 'collapsed' : 'expanded',
    );
    // collapsed = rail only (56px); expanded = full sidebar (276px)
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '56px' : '276px');
  }, [collapsed]);

  const titleKey = routeTitleMap[location.pathname + location.search]
    ?? routeTitleMap[location.pathname]
    ?? 'admin.title';
  const pageTitle = t(titleKey) || 'Dashboard';

  // -- Route-driven UI state ------------------------------------------------
  // useRouteUI() reads the RouteHandle resolved by RouteLayoutDispatcher.
  // We use it here to:
  //   1. Override the header title with the handle's declared title.
  //   2. Suppress the tab bar and footer for wizard / slider / modal routes
  //      (they own their own chrome).
  //   3. Prevent the page-content key-remount animation for sliders and
  //      modals (background page must stay mounted and stable while the
  //      overlay is open).
  const routeUI = useRouteUI();
  const handleTitle =
    routeUI.handle.wizard?.title ??
    routeUI.handle.slider?.title ??
    routeUI.handle.modal?.title ??
    routeUI.handle.inline?.title ??
    routeUI.handle.table?.title ??      // backward-compat: 'table' alias routes
    null;
  const activePageTitle = handleTitle ? t(handleTitle, { defaultValue: handleTitle }) : pageTitle;
  // Wizard, slider, and modal supply their own headers/chrome — suppress Layout chrome.
  const suppressTabBar = routeUI.isWizard || routeUI.isSlider || routeUI.isModal;
  const suppressFooter  = routeUI.isWizard || routeUI.isSlider || routeUI.isModal;
  // Sliders and modals both overlay the background page — keep it mounted &
  // visually stable so no CSS remount animation fires underneath the overlay.
  const pageContentKey  = (routeUI.isSlider || routeUI.isModal) ? 'overlay-stable' : location.pathname;

  // -- useRouteUITitle override -------------------------------------------
  // Page components may broadcast an 'ovds:route-title' event to override the
  // header title dynamically (e.g. "Invoice #INV-1042" after data loads).
  // We reset the override on every route change so stale titles never bleed.
  const [imperativeTitle, setImperativeTitle] = useState<string | null>(null);
  useEffect(() => { setImperativeTitle(null); }, [location.pathname]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ title: string }>).detail;
      if (detail?.title) setImperativeTitle(detail.title);
    };
    window.addEventListener('ovds:route-title', handler);
    return () => window.removeEventListener('ovds:route-title', handler);
  }, []);
  // imperativeTitle (from page component) > handleTitle (from route handle) > routeTitleMap
  const resolvedPageTitle = imperativeTitle ?? activePageTitle;

  // Update document title
  useEffect(() => {
    document.title = `${resolvedPageTitle} · ${t('brand.name', 'OVDS')}`;
  }, [resolvedPageTitle, t]);

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
    {/* ── Ovds SaaS GUI Shell ──────────────────────────────────── */}
    <div
      className="flex min-h-screen w-full overflow-x-hidden relative"
      style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        background: 'var(--bg-main)',
        color: 'var(--text)',
      }}
    >
      <MandatoryReleaseBarrier />

      {/* Skip to main content */}
      <a
        href="#main-scroll"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
        style={{ background: 'var(--pro-azure)', color: '#fff' }}
      >
        Skip to main content
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-[90] animate-aki-fade-in"
          style={{ background: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(3px)' }}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {/*
          The sidebar is always `fixed` so it stays anchored to the viewport.
          On desktop (lg+) it's always visible (translate-x-0).
          On mobile (<lg) it slides off-screen and is toggled by the hamburger.
          The <main> column compensates with a left margin equal to --sidebar-w
          on desktop, so content is never hidden behind the fixed panel.
      */}
      <div
        ref={sidebarRef}
        data-sidebar-nav
        className={[
          'fixed top-0 z-[110] h-screen shrink-0',
          collapsed ? 'w-[56px]' : 'w-[276px]',
          sidebarOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{
          transition: 'transform 240ms cubic-bezier(0.4,0,0.2,1), width 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <nav aria-label={t('a11y.main_nav')} className="h-full focus:outline-none">
          <Sidebar
            collapsed={collapsed}
            onToggle={handleToggleCollapse}
            onNavClick={() => setSidebarOpen(false)}
            onOpenSearch={() => commandPalette.open()}
            onAction={(action) => {
              if (action === '#create-dashboard') {
                setShowDashboardManager(true);
                setSidebarOpen(false);
              }
            }}
          />
        </nav>
      </div>

      {/* ── Main column ─────────────────────────────────────────────────── */}
      {/*
          The sidebar is `fixed`, so this main element would normally sit at x=0
          and be hidden behind it on desktop. We compensate by applying
          `padding-left` equal to the sidebar width — but ONLY on large screens.
          On mobile the sidebar is an overlay so no offset is needed.
          We use a Tailwind responsive class to keep this in CSS (no JS).
      */}
      <main
        id="main-scroll"
        tabIndex={-1}
        className={`flex-1 min-h-screen overflow-y-auto flex flex-col focus:outline-none ${
          collapsed ? 'lg:pl-[56px]' : 'lg:pl-[276px]'
        }`}
        style={{
          background: 'var(--bg-main)',
          minWidth: 0,
          transition: 'padding-left 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >

        {/* Route progress bar — thin green line at the very top (Ovds SaaS style).
            zIndex.dropdown (100) keeps it below modals/overlays so it never
            bleeds over full-screen panels. pointer-events: none means it never
            intercepts clicks regardless of stacking position. */}
        {showProgress && (
          <div
            className="fixed top-0 left-0 right-0 pointer-events-none"
            style={{ zIndex: zIndex.dropdown, height: 2 }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--pro-azure)',
                boxShadow: '0 0 8px rgba(79,186,111,0.55)',
                width: `${progress}%`,
                opacity: progress === 100 ? 0 : 1,
                transition: progress === 100
                  ? 'opacity 0.25s ease 0.08s, width 0.25s ease'
                  : 'width 0.25s ease',
                borderRadius: '0 2px 2px 0',
              }}
            />
          </div>
        )}

        {/* ── Status banners ────────────────────────────────────────────── */}

        {/* Offline */}
        {!isOnline && !offlineDismissed && (
          <div
            className="sticky top-0 flex items-center justify-between gap-2 px-4 py-2 animate-aki-drop-in"
            style={{ zIndex: zIndex.sticky, background: '#BE123C', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <Icon name="WARNING" size={12} className="shrink-0 opacity-90" />
              <span className="text-[11px] font-semibold tracking-wide">{t('layout.offline')}</span>
            </div>
            <button
              onClick={() => setOfflineDismissed(true)}
              className="shrink-0 text-white/70 hover:text-white text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              aria-label={t('a11y.dismiss')}
            >
              {t('a11y.dismiss')}
            </button>
          </div>
        )}

        {/* Slow connection */}
        {isOnline && quality === 'slow' && !slowDismissed && (
          <div
            className="sticky top-0 flex items-center justify-between gap-2 px-4 py-1.5 animate-aki-drop-in"
            style={{ zIndex: zIndex.sticky - 1, background: '#B45309', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2">
              <Icon name="CLOCK" size={11} className="shrink-0 opacity-90" />
              <span className="text-[10px] font-semibold">{t('layout.slow_connection')}</span>
            </div>
            <button
              onClick={() => setSlowDismissed(true)}
              className="shrink-0 text-white/70 hover:text-white text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ background: 'rgba(255,255,255,0.10)' }}
              aria-label={t('a11y.dismiss')}
            >
              {t('a11y.dismiss')}
            </button>
          </div>
        )}

        {/* Offline resilience (MoR regulated) */}
        {offlineCaps?.requiresResilience && (
          <div
            className="sticky top-0 flex items-center justify-between gap-2 px-4 py-1.5 animate-aki-drop-in"
            role="alert"
            aria-live="assertive"
            style={{ zIndex: zIndex.sticky - 1, background: 'var(--pro-azure-dark)', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2">
              <Icon name="WARNING" size={12} className="shrink-0 opacity-90" />
              <span className="text-[10px] font-semibold">
                Offline mode REQUIRED — MoR Regulated Sector (Directive 1142/2026)
              </span>
            </div>
            <span className="text-[9px] text-green-200 hidden sm:inline font-medium">
              {offlineCaps.pendingSyncCount > 0
                ? `${offlineCaps.pendingSyncCount} pending sync`
                : 'All sales must continue offline during internet interruptions'}
            </span>
          </div>
        )}

        <SetupWizardBanner />
        <OfflineSyncBanner zIndex={zIndex.sticky - 2} />
        {['SPURADMIN', 'ADMIN', 'ovds', 'ACCOUNTING'].includes(user?.role ?? '') && (
          <ComplianceStatusBar onlyWhenUrgent />
        )}

        {/* ── Header + content ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col">
          <TrialBanner />

          {/* Professional sticky header */}
          <Header
            title={resolvedPageTitle}
            onMobileMenuToggle={() => setSidebarOpen((o) => !o)}
            sidebarOpen={sidebarOpen}
            onOpenSearch={() => commandPalette.open()}
          />

          {/* Tab bar — hidden for wizard and slider routes */}
          {!suppressTabBar && <TabBar />}

          {/* Page content area */}
          <div
            className="flex-1 pb-16 lg:pb-6"
            style={{ background: 'var(--bg-main)' }}
          >
            <div
              key={pageContentKey}
              className="page-transition min-h-[calc(100vh-120px)]"
            >
              {children}
            </div>
          </div>

          {/* Footer — hidden for wizard and slider routes */}
          {!suppressFooter && (
            <div
              className="px-4 sm:px-6"
              style={{
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div className="max-w-[1440px] mx-auto">
                <Footer />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Scroll-to-top FAB with progress ring ──────────────────────── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{ zIndex: zIndex.docked + 40 }}
          className="fixed bottom-16 lg:bottom-5 right-5 w-9 h-9 flex items-center justify-center hover:scale-105 transition-transform animate-aki-fade-in group"
          title={t('a11y.scroll_to_top')}
          aria-label={t('a11y.scroll_to_top')}
        >
          <svg className="absolute inset-0 w-9 h-9 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: 'var(--border)' }} />
            <circle
              cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 15}`}
              strokeDashoffset={`${2 * Math.PI * 15 * (1 - scrollPct)}`}
              strokeLinecap="round"
              className="transition-all duration-150"
              style={{ color: 'var(--pro-azure)' }}
            />
          </svg>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all"
            style={{
              background: 'var(--pro-azure)',
              color: '#fff',
            }}
          >
            <Icon name="CHEVRON_UP" size={12} className="group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>
      )}

      {/* Activity feed FAB */}
      <button
        onClick={() => setShowActivityFeed(v => !v)}
        className={`fixed bottom-28 lg:bottom-5 ${showScrollTop ? 'right-16' : 'right-5'} w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 animate-aki-fade-in`}
        style={{
          zIndex: zIndex.docked + 40,
          background: showActivityFeed ? 'var(--pro-azure)' : 'var(--surface)',
          color: showActivityFeed ? '#fff' : 'var(--text-4)',
          border: '1px solid var(--border)',
          boxShadow: showActivityFeed
            ? '0 4px 16px rgba(79,186,111,0.35)'
            : '0 2px 8px rgba(0,0,0,0.06)',
        }}
        title={t('a11y.activity_feed')}
        aria-label={t('a11y.activity_feed')}
      >
        <Icon name="ACTIVITY" size={14} />
      </button>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Session expiry warning */}
      <SessionExpiryBanner />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Dashboard Manager */}
      {showDashboardManager && (
        <DashboardManager onClose={() => setShowDashboardManager(false)} />
      )}

      {/* Command Palette */}
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

      {/* Service-down overlay */}
      {isServiceDown && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Service unavailable"
          style={{ zIndex: zIndex.modal + 10, background: 'rgba(5,10,20,0.72)', backdropFilter: 'blur(6px)' }}
          className="fixed inset-0 flex items-center justify-center p-6 animate-aki-fade-in"
        >
          <div
            className="max-w-xs w-full rounded-2xl p-7 text-center space-y-5 animate-aki-scale-in"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex justify-center">
              <div
                className="p-3.5 rounded-2xl"
                style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C' }}
              >
                <Icon name="SERVER_CRASH" size={26} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {t('layout.service_unavailable')}
              </p>
              <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>
                {t('layout.service_unavailable_desc')}
              </p>
            </div>
            <button
              onClick={() => checkHealth()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--pro-azure)', color: '#fff', boxShadow: '0 2px 12px rgba(79,186,111,0.30)' }}
            >
              <Icon name="REFRESH" size={13} /> {t('layout.check_again')}
            </button>
          </div>
        </div>
      )}
    </div>
    </TabManagerProvider>
  );
};

export default Layout;



