import { ThemeProvider, useTheme } from '@ovds/ui/context';
import { Refine } from '@refinedev/core';
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, lazy, Component, type ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  createBrowserRouter,
  RouterProvider,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import Layout from './components/layout';
import { ModuleGuard } from './components/ModuleGuard';
import { NavigateInjector } from './components/NavigateInjector';
import { PushNotificationInit } from './components/PushNotificationInit';
import { SecurityWrapper } from './components/securityWrapper';
import { StepUpProvider } from './components/stepUpAuthModal';
import { Icon } from './components/ui';
import { VatNavBridgeMount } from './components/VatNavBridgeMount';
import { AppModuleRegistry } from './context/AppModuleRegistry';
import { BusinessProvider, useBusiness } from './context/businessContext';
import { EntitlementProvider } from './context/entitlementContext';
import { ModuleRegistryProvider } from './context/ExtensionSlotRegistry';
import { ModuleProvider } from './context/ModuleContext';
import { VatModuleProvider } from './context/VatModuleContext';
import { ModuleRouter } from './lib/module-router';
import { refineAuthProvider } from './lib/refineAuthProvider';
import { refineDataProvider } from './lib/refineDataProvider';
import { Auth0ProviderWrapper } from './rbac/Auth0ProviderWrapper';
import { AuthProvider, useAuth } from './rbac/AuthContext';
import { rbac } from './rbac/rbac';
import { RouteLayoutDispatcher } from './router';
import type { RouteRecord } from './router';
import { HealthProvider } from './services/health.service';
import {
  QUERY_GC_TIME_MS,
  CHUNK_RETRY_KEY,
  CHUNK_RELOAD_TIMEOUT_MS,
  generateErrorId,
} from './utils/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 5 * 60_000,
      gcTime: QUERY_GC_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

// -- Error Boundary ------------------------------------------------------------
interface EBState {
  hasError: boolean;
  error?: Error;
  /** true when the error is a chunk-load failure (lazy import 404) */
  isChunkError: boolean;
  errorId: string;
}
interface EBProps {
  children: ReactNode;
  resetKey?: string | number;
  inline?: boolean;
}

function isChunkLoadError(err: Error): boolean {
  return (
    err.name === 'ChunkLoadError' ||
    /loading chunk \d+ failed/i.test(err.message) ||
    /failed to fetch dynamically imported module/i.test(err.message)
  );
}

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false, isChunkError: false, errorId: '' };

  static getDerivedStateFromError(error: Error): EBState {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console with context — in production wire to Sentry/Datadog
     
    console.error('[OVDS ErrorBoundary]', error, import.meta.env.DEV ? info.componentStack : '(stack hidden in production)');
  }

  componentDidUpdate(prev: EBProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined, isChunkError: false, errorId: '' });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, isChunkError, errorId } = this.state;

    // -- Inline (widget-level) ----------------------------------------------
    if (this.props.inline) {
      return (
        <div
          role="alert"
          className="flex items-center gap-2.5 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-xs"
        >
          <Icon name="ALERT_TRIANGLE" size={13} className="text-rose-500 shrink-0" />
          <span className="text-rose-700 dark:text-rose-300 font-semibold flex-1 min-w-0 truncate">
            {isChunkError ? 'Failed to load — check your connection.' : (error?.message ?? 'Failed to load section.')}
          </span>
          <button
            onClick={() => isChunkError ? (sessionStorage.removeItem(CHUNK_RETRY_KEY), window.location.reload()) : this.setState({ hasError: false })}
            className="shrink-0 font-bold text-rose-600 dark:text-rose-400 underline hover:no-underline"
          >
            {isChunkError ? 'Reload' : 'Retry'}
          </button>
        </div>
      );
    }

    // -- Full-page ----------------------------------------------------------
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8 text-center animate-in fade-in duration-300"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 flex items-center justify-center">
          <Icon name="SERVER_CRASH" size={28} className="text-rose-500" />
        </div>
        <div className="space-y-1.5">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {isChunkError ? 'Failed to load page' : 'Something went wrong'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            {isChunkError
              ? 'A new version may have been deployed. Reload to get the latest.'
              : (error?.message ?? 'An unexpected error occurred.')}
          </p>
          {errorId && (
            <p className="text-[10px] font-mono text-slate-300 dark:text-slate-600 mt-1">
              Error ID: {errorId}
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          {!isChunkError && (
            <button
              onClick={() => this.setState({ hasError: false, error: undefined, isChunkError: false, errorId: '' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Icon name="REFRESH_CW" size={14} /> Try Again
            </button>
          )}
          <button
            onClick={() => {
              sessionStorage.removeItem(CHUNK_RETRY_KEY);
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all shadow-lg shadow-green-500/20 dark:shadow-green-500/10"
          >
            <Icon name="REFRESH_CW" size={14} /> Reload Page
          </button>
        </div>
      </div>
    );
  }
}
export { ErrorBoundary };

// -- Lazy pages ----------------------------------------------------------------
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const Departments = lazyWithRetry(() => import('./pages/Departments'));
const Leaves = lazyWithRetry(() => import('./pages/Leaves'));
const Shifts = lazyWithRetry(() => import('./pages/Shifts'));
const Holidays = lazyWithRetry(() => import('./pages/Holidays'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const SettingsTaxes = lazyWithRetry(() => import('./pages/settings/Taxes'));
const AuditLogs = lazyWithRetry(() => import('./pages/AuditLogs'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const Payroll = lazyWithRetry(() => import('./pages/Payroll'));
const PayrollAdministration = lazyWithRetry(() => import('./pages/PayrollAdministration'));
const AccountingPage = lazyWithRetry(() => import('./pages/Accounting'));
const SinglePageAccounting = lazyWithRetry(() => import('./pages/SinglePageAccounting'));
const MasterData = lazyWithRetry(() => import('./pages/MasterData'));
const CustomerSummary = lazyWithRetry(() => import('./pages/CustomerSummary'));
const Notifications = lazyWithRetry(() => import('./pages/Notifications'));
const Enrollment = lazyWithRetry(() => import('./pages/Enrollment'));
const ApiDocs = lazyWithRetry(() => import('./pages/ApiDocs'));
const EntryPortal = lazyWithRetry(() => import('./pages/EntryPortal'));
const Attendance = lazyWithRetry(() => import('./pages/Attendance'));
const Users = lazyWithRetry(() => import('./pages/Users'));
const BusinessInsights = lazyWithRetry(() => import('./pages/BusinessInsights'));
const Items = lazyWithRetry(() => import('./pages/Items'));
const Invoices = lazyWithRetry(() => import('./pages/Invoices'));
const Bills = lazyWithRetry(() => import('./pages/Bills'));
const BillDetail = lazyWithRetry(() => import('./pages/BillDetail'));
const PurchasesDashboard = lazyWithRetry(() => import('./pages/PurchasesDashboard'));
const Payments = lazyWithRetry(() => import('./pages/Payments'));
const AgedPayables = lazyWithRetry(() => import('./pages/AgedPayables'));
const Companies = lazyWithRetry(() => import('./pages/Companies'));
const Inventory = lazyWithRetry(() => import('./pages/Inventory'));
const InventoryDashboard = lazyWithRetry(() => import('./pages/InventoryDashboard'));
const CRM = lazyWithRetry(() => import('./pages/CRM'));
const VatAdministration = lazyWithRetry(() => import('./pages/VatAdministration'));
// Modular VAT sub-router — mounts the full /tax/vat/* country-module tree
const VatModuleRouterPage = lazyWithRetry(() => import('./lib/vat-module-router').then(m => ({ default: m.VatModuleRouter })));
const VatModuleStorePage   = lazyWithRetry(() => import('./pages/vat/VatModuleStore'));
const DisasterFund = lazyWithRetry(() => import('./pages/DisasterFund'));
const AccountingCollections = lazyWithRetry(() => import('./pages/AccountingCollections'));
const IfsDashboard = lazyWithRetry(() => import('./pages/IfsDashboard'));
const Reconciliation = lazyWithRetry(() => import('./pages/Reconciliation'));
const TreasuryForecast = lazyWithRetry(() => import('./pages/TreasuryForecast'));
const Partnerships = lazyWithRetry(() => import('./pages/Partnerships'));
const BusinessLoans = lazyWithRetry(() => import('./pages/BusinessLoans'));
const Investments = lazyWithRetry(() => import('./pages/Investments'));
const OvdsHub = lazyWithRetry(() => import('./pages/OvdsHub'));
const OvdsPipelineConsole = lazyWithRetry(() => import('./components/ovds/OvdsPipelineConsole'));

const TransactionCategories = lazyWithRetry(() => import('./pages/TransactionCategories'));
const ClientPortal = lazyWithRetry(() => import('./pages/ClientPortal'));
const PaymentTracker = lazyWithRetry(() => import('./pages/PaymentTracker'));
const MultiCompanyAdmin = lazyWithRetry(() => import('./pages/MultiCompanyAdmin'));
const ComplianceDashboard = lazyWithRetry(() => import('./pages/compliance/ComplianceDashboardPage'));
const EimsDashboard = lazyWithRetry(() => import('./pages/compliance/EimsDashboardPage'));
const SourceSystems = lazyWithRetry(() => import('./pages/compliance/SourceSystemsPage'));
const ComplianceCertificates = lazyWithRetry(() => import('./pages/compliance/CertificatesPage'));
const EimsInvoices = lazyWithRetry(() => import('./pages/compliance/EimsInvoicesPage'));
const EimsReceipts = lazyWithRetry(() => import('./pages/compliance/EimsReceiptsPage'));
const BulkOperations = lazyWithRetry(() => import('./pages/compliance/BulkOperationsPage'));
const ComplianceChecklists = lazyWithRetry(() => import('./pages/compliance/ChecklistsPage'));
const CyberAuditChecklist = lazyWithRetry(() => import('./pages/compliance/CyberAuditChecklistPage'));
const MasterComplianceChecklist = lazyWithRetry(() => import('./pages/compliance/MasterComplianceChecklistPage'));
const AccreditationChecklist = lazyWithRetry(() => import('./pages/compliance/AccreditationChecklistPage'));
const TaxReports = lazyWithRetry(() => import('./pages/compliance/TaxReportsPage'));
const WithholdingTax = lazyWithRetry(() => import('./pages/compliance/WithholdingPage'));
const CrmDashboard = lazyWithRetry(() => import('./pages/crm/CrmDashboardPage'));
const CrmDeals = lazyWithRetry(() => import('./pages/crm/DealsPage'));
const CrmContacts = lazyWithRetry(() => import('./pages/crm/CrmContactsPage'));
const CrmActivities = lazyWithRetry(() => import('./pages/crm/CrmActivitiesPage'));
const WhiteLabelSettings = lazyWithRetry(() => import('./pages/whitelabel/WhiteLabelPage'));
const ImportPro = lazyWithRetry(() => import('./pages/import-pro/ImportProPage'));
const EmployeesModule = lazyWithRetry(() => import('./pages/employees/EmployeesPage'));
const PayrollModule = lazyWithRetry(() => import('./pages/payroll/PayrollPage'));
const AssetsModule = lazyWithRetry(() => import('./pages/assets/AssetsPage'));

const Landing = lazyWithRetry(() => import('./pages/Landing'));
const EmailTemplates = lazyWithRetry(() => import('./pages/EmailTemplates'));
const BankList = lazyWithRetry(() => import('./components/banking/bankList'));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding'));
const OnboardingAdmin = lazyWithRetry(() => import('./pages/OnboardingAdmin'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Releases = lazyWithRetry(() => import('./pages/Releases'));
const AppStore = lazyWithRetry(() => import('./pages/AppStore'));

const AuditOutsourcing = lazyWithRetry(() => import('./pages/AuditOutsourcing'));
const Vendors = lazyWithRetry(() => import('./pages/Vendors'));
const Expenses = lazyWithRetry(() => import('./pages/Expenses'));
const ScannedBills = lazyWithRetry(() => import('./pages/ScannedBills'));
const PurchaseOrders = lazyWithRetry(() => import('./pages/PurchaseOrders'));
const FixedAssets = lazyWithRetry(() => import('./pages/FixedAssets'));
const Leases = lazyWithRetry(() => import('./pages/Leases'));
const FundTransfers = lazyWithRetry(() => import('./pages/FundTransfers'));
const Transactions = lazyWithRetry(() => import('./pages/Transactions'));
const RolePermissions = lazyWithRetry(() => import('./pages/RolePermissions'));
const BankStatementImport = lazyWithRetry(() => import('./pages/BankStatementImport'));
const BankReconciliation = lazyWithRetry(() => import('./pages/BankReconciliation'));
const Budgets = lazyWithRetry(() => import('./pages/Budgets'));
const FxRates = lazyWithRetry(() => import('./pages/FxRates'));
const PeriodClose = lazyWithRetry(() => import('./pages/PeriodClose'));
const TaxDashboard = lazyWithRetry(() => import('./pages/TaxDashboard'));
const TaxFiling = lazyWithRetry(() => import('./pages/TaxFiling'));
const TaxSummary = lazyWithRetry(() => import('./pages/TaxSummary'));
const BusinessIncomeTax = lazyWithRetry(() => import('./pages/BusinessIncomeTax'));
const TotFiling = lazyWithRetry(() => import('./pages/TotFiling'));
const DeferredTax = lazyWithRetry(() => import('./pages/DeferredTax'));
const GoodsReceivedNotes = lazyWithRetry(() => import('./pages/GoodsReceivedNotes'));
const ItemVariants = lazyWithRetry(() => import('./pages/ItemVariants'));
const EquityStatement = lazyWithRetry(() => import('./pages/EquityStatement'));
const EmployeeBenefits = lazyWithRetry(() => import('./pages/EmployeeBenefits'));
const Provisions = lazyWithRetry(() => import('./pages/Provisions'));
const ProformaInvoices = lazyWithRetry(() => import('./pages/ProformaInvoices'));
const Sales = lazyWithRetry(() => import('./pages/Sales'));
const SalesOrders = lazyWithRetry(() => import('./pages/SalesOrders'));
const SalesCollections = lazyWithRetry(() => import('./pages/SalesCollections'));
const SalesRevenueRecognition = lazyWithRetry(() => import('./pages/SalesRevenueRecognition'));
const EclProvision = lazyWithRetry(() => import('./pages/EclProvision'));
const PettyCash = lazyWithRetry(() => import('./pages/PettyCash'));
const PropertyTax = lazyWithRetry(() => import('./pages/PropertyTax'));
const ExciseTax = lazyWithRetry(() => import('./pages/ExciseTax'));
const StampDuty = lazyWithRetry(() => import('./pages/StampDuty'));
const FinancialStatements = lazyWithRetry(() => import('./pages/FinancialStatements'));
const BalanceSheet = lazyWithRetry(() => import('./pages/BalanceSheet'));
const ProfitAndLoss = lazyWithRetry(() => import('./pages/ProfitAndLoss'));
const ReportsDashboard = lazyWithRetry(() => import('./pages/ReportsDashboard'));
const CashFlowStatement = lazyWithRetry(() => import('./pages/CashFlowStatement'));
const TrialBalance = lazyWithRetry(() => import('./pages/TrialBalance'));
const AccountingDashboard = lazyWithRetry(() => import('./pages/AccountingDashboard'));
const GeneralLedgerCompliance = lazyWithRetry(() => import('./pages/GeneralLedgerCompliance'));
const AabeAuditReadiness = lazyWithRetry(() => import('./pages/AabeAuditReadiness'));
const Consolidation = lazyWithRetry(() => import('./pages/Consolidation'));
const ConnectedNodes = lazyWithRetry(() => import('./pages/ConnectedNodes'));
const Manufacturing = lazyWithRetry(() => import('./pages/Manufacturing'));
const JournalEntries = lazyWithRetry(() => import('./pages/JournalEntries'));
const NotesToFinancials = lazyWithRetry(() => import('./pages/NotesToFinancials'));
const PaymentGateway = lazyWithRetry(() => import('./pages/PaymentGateway'));
const SubLedger = lazyWithRetry(() => import('./pages/SubLedger'));
const AccountingEstimatesPage = lazyWithRetry(() => import('./pages/accounting/AccountingEstimatesPage'));
const AGMPage = lazyWithRetry(() => import('./pages/compliance/AGMPage'));
const GovernancePage = lazyWithRetry(() => import('./pages/compliance/GovernancePage'));
const CostCenters = lazyWithRetry(() => import('./pages/CostCenters'));
const GratuityCalculator = lazyWithRetry(() => import('./pages/GratuityCalculator'));
const Procurement = lazyWithRetry(() => import('./pages/Procurement'));
const BudgetVariance = lazyWithRetry(() => import('./pages/BudgetVariance'));
const ErcaPenaltyCalculator = lazyWithRetry(() => import('./pages/ErcaPenaltyCalculator'));
const CostAccountingPage = lazyWithRetry(() => import('./pages/CostAccounting'));
const OpeningBalancesPage = lazyWithRetry(() => import('./pages/OpeningBalances'));
const WhtCertificates     = lazyWithRetry(() => import('./pages/WhtCertificates'));
const PayeDeclarations    = lazyWithRetry(() => import('./pages/PayeDeclarations'));
const ScheduleDTax        = lazyWithRetry(() => import('./pages/ScheduleDTax'));
const AccrualsPrepayments = lazyWithRetry(() => import('./pages/AccrualsPrepayments'));
const InventoryValuation  = lazyWithRetry(() => import('./pages/InventoryValuation'));
const BankPayrollExport   = lazyWithRetry(() => import('./pages/BankPayrollExport'));
const IntercompanyEliminations = lazyWithRetry(() => import('./pages/IntercompanyEliminations'));
const ConsolidatedStatements  = lazyWithRetry(() => import('./pages/ConsolidatedStatements'));
const EntityGroups             = lazyWithRetry(() => import('./pages/EntityGroups'));
const TranslationReserves      = lazyWithRetry(() => import('./pages/TranslationReserves'));
const ReportDefinitions        = lazyWithRetry(() => import('./pages/ReportDefinitions'));
const ReportLines              = lazyWithRetry(() => import('./pages/ReportLines'));
const BusinessRegistration = lazyWithRetry(() => import('./pages/BusinessRegistration'));
const AccountingWorkflow  = lazyWithRetry(() => import('./pages/AccountingWorkflow'));
const Estimates           = lazyWithRetry(() => import('./pages/Estimates'));
const CreditNotes         = lazyWithRetry(() => import('./pages/CreditNotes'));
const SalesDebitNotes     = lazyWithRetry(() => import('./pages/SalesDebitNotes'));
const DebitNotes          = lazyWithRetry(() => import('./pages/DebitNotes'));
const PurchaseReceipts    = lazyWithRetry(() => import('./pages/PurchaseReceipts'));
// IoT & Smart Management
const IotHub = lazyWithRetry(() => import('./pages/IotHub'));
const DeviceControl = lazyWithRetry(() => import('./pages/DeviceControl'));
// Unified Control Node — merged System & Local + IoT/Apps/Device control workspace
const UnifiedControlNode = lazyWithRetry(() => import('./pages/UnifiedControlNode'));
// e-Tax Online Declaration
const ETaxDeclaration = lazyWithRetry(() => import('./pages/ETaxDeclaration'));
// MoR Acknowledgement Vault — legal proof of timely eTax filings
const TaxAcknowledgementVault = lazyWithRetry(() => import('./pages/TaxAcknowledgementVault'));
// New MoR submission & banking modules
const DigitalPayments         = lazyWithRetry(() => import('./pages/DigitalPayments'));
const TaxLiabilityEstimator   = lazyWithRetry(() => import('./pages/TaxLiabilityEstimator'));
const PensionSubmission       = lazyWithRetry(() => import('./pages/PensionSubmission'));
const TaxPaymentReference     = lazyWithRetry(() => import('./pages/TaxPaymentReference'));
const MoRReport               = lazyWithRetry(() => import('./pages/MoRReport'));
const UniversalTaxConfig      = lazyWithRetry(() => import('./pages/UniversalTaxConfig'));

const NotificationSettings = lazyWithRetry(() => import('./pages/admin/NotificationSettings'));
const ComplianceAuditor = lazyWithRetry(() => import('./pages/ComplianceAuditor'));
const SecurityEvaluator = lazyWithRetry(() => import('./pages/SecurityEvaluator'));
const VandvCompliance = lazyWithRetry(() => import('./pages/VandvCompliance'));
const LoyaltyDashboard = lazyWithRetry(() => import('./pages/LoyaltyDashboard'));
const Projects = lazyWithRetry(() => import('./pages/Projects'));
const Helpdesk = lazyWithRetry(() => import('./pages/Helpdesk'));
const Refunds = lazyWithRetry(() => import('./pages/Refunds'));
const Receipts = lazyWithRetry(() => import('./pages/Receipts'));
const CRMPipeline = lazyWithRetry(() => import('./pages/CRMPipeline'));
const ImportCenter = lazyWithRetry(() => import('./pages/ImportCenter'));
const Trade = lazyWithRetry(() => import('./pages/Trade'));
const DocsPortal = lazyWithRetry(() => import('./pages/DocsPortal'));
const ExpenseClaims = lazyWithRetry(() => import('./pages/ExpenseClaims'));
const DoubleEntry = lazyWithRetry(() => import('./pages/DoubleEntry'));
const VendorLedger = lazyWithRetry(() => import('./pages/VendorLedger'));
const LetterOfCredit = lazyWithRetry(() => import('./pages/LetterOfCredit'));
const LandedCost = lazyWithRetry(() => import('./pages/LandedCost'));
const ImportShipments = lazyWithRetry(() => import('./pages/ImportShipments'));
const SupplierPaymentRun = lazyWithRetry(() => import('./pages/SupplierPaymentRun'));
const Banking     = lazyWithRetry(() => import('./pages/Banking'));
const BankFeeds   = lazyWithRetry(() => import('./pages/BankFeeds'));
const BankingRules     = lazyWithRetry(() => import('./pages/BankingRules'));
const BankingCashFlow  = lazyWithRetry(() => import('./pages/BankingCashFlow'));
const BankingYearEnd   = lazyWithRetry(() => import('./pages/BankingYearEnd'));
const BankingWorkflow  = lazyWithRetry(() => import('./pages/BankingWorkflow'));
const BankingVerification = lazyWithRetry(() => import('./pages/BankingVerification'));

const Calendar = lazyWithRetry(() => import('./pages/Calendar'));
const Customers = lazyWithRetry(() => import('./pages/Customers'));
const CustomerStatement = lazyWithRetry(() => import('./pages/CustomerStatement'));
const CustomerGrowth = lazyWithRetry(() => import('./pages/CustomerGrowth'));
const SMEs = lazyWithRetry(() => import('./pages/SMEs'));
const Developers = lazyWithRetry(() => import('./pages/Developers'));
const GettingStarted = lazyWithRetry(() => import('./pages/GettingStarted'));
const GettingStartedPublic = lazyWithRetry(() => import('./pages/GettingStartedPublic'));
const Plans = lazyWithRetry(() => import('./pages/Plans'));
const SetupCloud = lazyWithRetry(() => import('./pages/SetupCloud'));
const SetupOnPremise = lazyWithRetry(() => import('./pages/SetupOnPremise'));
const ClientDownload = lazyWithRetry(() => import('./pages/ClientDownload'));
const SampleInvoice  = lazyWithRetry(() => import('./pages/SampleInvoice'));
const InvoiceModuleDownload = lazyWithRetry(() => import('./pages/InvoiceModuleDownload'));
const CompanyNew = lazyWithRetry(() => import('./pages/CompanyNew'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Auth0Callback = lazyWithRetry(() => import('./pages/Auth0Callback'));
const GoogleCallback = lazyWithRetry(() => import('./pages/GoogleCallback'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const Forbidden = lazyWithRetry(() => import('./pages/Forbidden'));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ModularSettings = lazyWithRetry(() => import('./pages/ModularSettings'));
const CompanyProfile = lazyWithRetry(() => import('./pages/CompanyProfile'));
const SettingsCatalog = lazyWithRetry(() => import('./pages/admin/SettingsCatalog'));
const SystemAdministrationSetup = lazyWithRetry(() => import('./pages/SystemAdministrationSetup'));
const LicenseManager = lazyWithRetry(() => import('./components/settings/LicenseManager'));
const ServiceUnavailable = lazyWithRetry(() => import('./pages/ServiceUnavailable'));
const PaymentRequired = lazyWithRetry(() => import('./pages/PaymentRequired'));
const OfflineResilience = lazyWithRetry(() => import('./pages/OfflineResilience'));
const CustomerInteraction = lazyWithRetry(() => import('./pages/CustomerInteraction'));
const Adjustments = lazyWithRetry(() => import('./pages/Adjustments'));
const EimsSettings = lazyWithRetry(() => import('./pages/settings/EimsSettings'));
const SecuritySettings = lazyWithRetry(() => import('./pages/settings/SecuritySettings'));
const CurrencySettings = lazyWithRetry(() => import('./pages/settings/CurrencySettings'));
const EmailSettings = lazyWithRetry(() => import('./pages/settings/EmailSettings'));
const MaintainingTechnology = lazyWithRetry(() => import('./pages/MaintainingTechnology'));
const CompanyProfilePage = lazyWithRetry(() => import('./pages/settings/CompanyProfilePage'));
const UsersAccessPage = lazyWithRetry(() => import('./pages/settings/UsersAccessPage'));
const ModulesPage = lazyWithRetry(() => import('./pages/settings/ModulesPage'));



const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]" aria-label="Loading page" aria-live="polite">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin shadow-lg shadow-green-500/20" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Loading...
      </span>
    </div>
  </div>
);

/**
 * Wraps a lazy import so chunk-load failures auto-retry once with a hard reload.
 * Prevents the blank screen users see when a new deploy invalidates old chunks.
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
): React.LazyExoticComponent<T> {
  return lazy<T>(() =>
    (factory() as Promise<{ default: T }>).then((module) => {
      if (module && typeof module === 'object' && !('default' in module)) {
        const fnExport = Object.values(module).find(
          (v) => typeof v === 'function',
        );
        if (fnExport) {
          (module as any).default = fnExport;
        }
      }
      sessionStorage.removeItem(CHUNK_RETRY_KEY);
      return module;
    }).catch((err: Error) => {
      if (isChunkLoadError(err) && !sessionStorage.getItem(CHUNK_RETRY_KEY)) {
        sessionStorage.setItem(CHUNK_RETRY_KEY, '1');
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const timeout = setTimeout(() => {
            sessionStorage.removeItem(CHUNK_RETRY_KEY);
            reject(new Error('Chunk reload timed out'));
          }, CHUNK_RELOAD_TIMEOUT_MS);
          window.location.reload();
        }) as any;
      }
      sessionStorage.removeItem('chunk_retry');
      throw err;
    }),
  );
}

// -- Smart root route — Landing for guests, Dashboard for authenticated --------
// Authenticated users get redirected to /dashboard so the AuthenticatedShell
// (with persistent sidebar) handles it. Guests see the public landing page.
const LandingOrDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <Landing />
    </Suspense>
  );
};

// -- Guest route — redirects authenticated users to their dashboard ------------
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={rbac.defaultRoute(user.role)} replace />;
  }
  return <>{children}</>;
};

// -- Persistent layout shell — ONE instance for the entire authenticated session
// All protected pages render via <Outlet /> inside this single Layout mount.
// This keeps the sidebar, header, and all layout state alive across navigations.
// RouteLayoutDispatcher sits between Layout and Outlet so it can read route
// handles via useMatches() and wrap the page in the appropriate shell
// (FullPageShell, WizardShell, or SliderShell) on every navigation.
const AuthenticatedShell: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <VatNavBridgeMount />
      <PushNotificationInit />
      <RouteLayoutDispatcher>
        <Outlet />
      </RouteLayoutDispatcher>
    </Layout>
  );
};

// -- Per-route RBAC guard — wraps each page inside the shared shell ------------
const ProtectedRoute = ({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) => {
  const { isAuthenticated, user } = useAuth();
  const { selectedBusinessType } = useBusiness();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const role = user.role;
  const businessType = selectedBusinessType || undefined;

  if (!rbac.canAccessRoute(role, path, businessType)) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <ErrorBoundary resetKey={path}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
};

// -- Route table ---------------------------------------------------------------
// Each entry is a RouteRecord tuple: [path, Component, handle?]
// The optional third element is a RouteHandle — structural metadata that tells
// the RouteLayoutDispatcher which shell to render around the page:
//   • omitted / layout:'inline'  → FullPageShell  (standard full-page view, default)
//   • layout:'wizard'            → WizardShell    (sequential multi-step flow)
//   • layout:'slider'            → SliderShell    (slide-out panel over current page)
//   • layout:'modal'             → ModalShell     (centered modal overlay, ephemeral)
// 'table' is a backward-compatible alias for 'inline'.
const ROUTES: RouteRecord[] = [
  ['/dashboard', Dashboard],
  ['/hr/employees', Employees],
  ['/hr/departments', Departments],
  ['/hr/attendance', Attendance],
  ['/hr/leaves', Leaves],
  ['/hr/shifts', Shifts],
  ['/hr/holidays', Holidays],
  ['/hr/payroll', Payroll],
  ['/hr/payroll-administration', PayrollAdministration],
  ['/customer-summary/:id', CustomerSummary],
  ['/customers/summary', CustomerSummary],
  ['/reports', Reports],
  ['/notifications', Notifications],
  ['/settings/enroll', Enrollment, {
    layout: 'wizard',
    wizard: {
      title: 'Company Enrollment',
      description: 'Set up your company profile, fiscal config, and team access',
      stepParam: 'step',
      variant: 'vertical',
      exitOnFirstBack: true,
      completionRoute: '/dashboard',
      steps: [
        { id: 'company',    label: 'Company Details',   description: 'TIN, legal name, and address' },
        { id: 'fiscal',     label: 'Fiscal Settings',   description: 'Tax year, base currency, VAT type' },
        { id: 'users',      label: 'Invite Team',       description: 'Add team members and assign roles' },
        { id: 'erca',       label: 'ERCA / EIMS',       description: 'Connect to the Ethiopian Revenue Authority' },
        { id: 'confirm',    label: 'Review & Confirm',  description: 'Review all settings before going live' },
      ],
    },
  }],
  ['/settings/users', Users],
  ['/settings/audit-logs', AuditLogs],
  ['/settings', Settings],
  ['/settings/taxes', SettingsTaxes],
  ['/settings/api-docs', ApiDocs],
  ['/reports/insights', BusinessInsights],
  ['/items', Items],
  ['/sales/invoices', Invoices, {
    layout: 'inline',
    inline: { title: 'Invoices' },
    meta: { module: 'sales', entity: 'invoice' },
  }],
  ['/companies', Companies],
  ['/inventory', Inventory],
  ['/inventory/dashboard', InventoryDashboard],
  ['/customers', Customers],
  ['/crm/contacts', CrmContacts],
  ['/crm/companies', CRM],
  ['/crm/deals', CrmDeals],
  ['/crm/activities', CrmActivities],
  ['/crm/settings', CRM],
  ['/crm', CRM],
  ['/purchases/bills', Bills, {
    layout: 'inline',
    inline: { title: 'Bills' },
    meta: { module: 'purchases', entity: 'bill' },
  }],
  ['/purchases/bills/:id', BillDetail],
  ['/purchases/payments', Payments],
  ['/purchases/aged-payables', AgedPayables],
  ['/purchases', PurchasesDashboard],
  ['/tax/vat', VatAdministration, {
    layout: 'inline',
    inline: { title: 'VAT Administration' },
    meta: { module: 'tax', entity: 'vat' },
  }],
  // ── Modular VAT Declaration sub-routes ──────────────────────────────────
  // /tax/vat/store — App-Store-style installer for country VAT modules
  ['/tax/vat/store', VatModuleStorePage, {
    layout: 'inline',
    inline: { title: 'VAT Module Store' },
    meta: { module: 'tax', entity: 'vat-store' },
  }],
  // /tax/vat/:countryCode/* — delegated to VatModuleRouter which lazy-loads
  //   per-country page sets and enforces activation via VatModuleGuard.
  //   The wildcard is handled by VatModuleRouter's internal <Routes>.
  ['/tax/vat/:countryCode/*', VatModuleRouterPage, {
    layout: 'inline',
    inline: { title: 'VAT Module' },
    meta: { module: 'tax', entity: 'vat-module' },
  }],  ['/disaster-fund', DisasterFund],
  ['/disaster-fund/contributions', DisasterFund],
  ['/disaster-fund/remittance', DisasterFund],
  ['/disaster-fund/erca', DisasterFund],
  ['/disaster-fund/analytics', DisasterFund],
  ['/disaster-fund/config', DisasterFund],
  ['/accounting', AccountingPage],
  ['/accounting/hub', SinglePageAccounting],
  ['/settings/master-data', MasterData],
  ['/accounting/collections', AccountingCollections],
  ['/banking/treasury', TreasuryForecast],
  ['/ovds/partnerships', Partnerships],
  ['/ovds/loans', BusinessLoans],
  ['/business-loans/new', BusinessLoans],
  ['/ovds/investments', Investments],
  ['/ovds', OvdsHub],
  ['/ovds/pipeline', OvdsPipelineConsole],
  ['/accounting/workflow', AccountingWorkflow],
  ['/accounting/categories', TransactionCategories],
  ['/customers/portal', ClientPortal, {
    layout: 'modal',
    modal: {
      title: 'Client Portal',
      description: 'Send portal invite and manage client access',
      maxWidth: 'max-w-lg',
      closeRoute: '/customers',
      icon: 'CUSTOMER',
    },
  }],

  ['/customers/payment-tracker', PaymentTracker],
  ['/settings/multi-company', MultiCompanyAdmin],
  ['/settings/email-templates', EmailTemplates],
  ['/banking/accounts', BankList],
  ['/onboarding', Onboarding],
  ['/settings/onboarding', OnboardingAdmin],
  ['/settings/app-store', AppStore],

  ['/compliance/audit-outsourcing', AuditOutsourcing],
  ['/settings/releases', Releases],
  ['/purchases/vendors', Vendors],
  ['/purchases/expenses', Expenses],
  ['/purchases/scanned-bills', ScannedBills],
  ['/purchases/orders', PurchaseOrders],
  ['/procurement', Procurement],
  ['/procurement/vendor-ledger', VendorLedger],
  ['/procurement/letter-of-credit', LetterOfCredit],
  ['/procurement/landed-cost', LandedCost],
  ['/procurement/import-shipments', ImportShipments],
  ['/treasury/payment-run', SupplierPaymentRun],
  ['/accounting/fixed-assets', FixedAssets],
  ['/accounting/leases', Leases],
  ['/banking/transfers', FundTransfers, {
    layout: 'modal',
    modal: {
      title: 'New Fund Transfer',
      description: 'Move funds between bank accounts',
      maxWidth: 'max-w-lg',
      closeRoute: '/banking/accounts',
      icon: 'TRANSFER',
    },
  }],
  ['/banking/transactions', Transactions],
   ['/settings/roles', RolePermissions],
  ['/banking/statement-import', BankStatementImport, {
    layout: 'wizard',
    wizard: {
      title: 'Import Bank Statement',
      description: 'Upload, map columns, and reconcile your bank transactions',
      stepParam: 'step',
      variant: 'horizontal',
      completionRoute: '/banking/reconciliation',
      steps: [
        { id: 'upload',   label: 'Upload File',    description: 'Select your CSV, OFX, or MT940 file' },
        { id: 'map',      label: 'Map Columns',    description: 'Match file columns to OVDS fields' },
        { id: 'preview',  label: 'Preview',        description: 'Review parsed transactions before import' },
        { id: 'import',   label: 'Import',         description: 'Confirm and write transactions to the ledger' },
      ],
    },
  }],
  ['/banking/reconciliation', BankReconciliation],
  ['/accounting/budgets', Budgets],
  ['/banking/fx-rates', FxRates],
  ['/accounting/period-close', PeriodClose],
  ['/tax/business-income', BusinessIncomeTax],
  ['/tax/tot', TotFiling],
  ['/ifrs/deferred-tax', DeferredTax],
  ['/purchases/grn', GoodsReceivedNotes],
  ['/inventory/variants', ItemVariants],
  ['/reports/equity', EquityStatement],
  ['/ifrs/employee-benefits', EmployeeBenefits],
  ['/ifrs/provisions', Provisions],
  ['/ifrs/ecl-provision', EclProvision],
  ['/sales/proforma', ProformaInvoices],
  ['/sales', Sales],
  ['/sales/orders', SalesOrders],
  ['/sales/collections', SalesCollections],
  ['/sales/revenue-recognition', SalesRevenueRecognition],
  ['/sales/estimates', Estimates],
  ['/sales/credit-notes', CreditNotes],
  ['/sales/debit-notes', SalesDebitNotes],
  ['/purchases/debit-notes', DebitNotes],
  ['/purchases/receipts', PurchaseReceipts],
  ['/banking/petty-cash', PettyCash],
  ['/admin/notifications-settings', NotificationSettings],
  ['/compliance/auditor', ComplianceAuditor],
  ['/compliance/security', SecurityEvaluator],
  ['/compliance/vandv', VandvCompliance],
  ['/settings/developers', Developers],
  ['/ovds/loyalty', LoyaltyDashboard],
  ['/ovds/projects', Projects],
  ['/hr/calendar', Calendar],
  ['/helpdesk', Helpdesk],
  ['/getting-started', GettingStarted],
  ['/settings/setup-wizard', SystemAdministrationSetup],
  ['/companies/new', CompanyNew, {
    layout: 'modal',
    modal: {
      title: 'Add New Company',
      description: 'Register a new subsidiary or branch entity',
      maxWidth: 'max-w-xl',
      closeRoute: '/companies',
      icon: 'COMPANY',
    },
  }],
  ['/ifrs', IfsDashboard],
  ['/reconciliation', Reconciliation],
  // Tax sub-routes — direct access (not just via redirect)
  ['/tax/dashboard', TaxDashboard],
  ['/tax/filing', TaxFiling],
  ['/tax/summary', TaxSummary],
  // New structural pages
  ['/sales/refunds', Refunds],
  ['/sales/receipts', Receipts],
  ['/crm/pipeline', CRMPipeline, {
    layout: 'slider',
    slider: {
      title: 'CRM Pipeline',
      description: 'Drag deals across stages to update their status',
      side: 'right',
      width: 'w-[680px]',
      closeRoute: '/crm',
      icon: 'PIPELINE',
    },
  }],
  ['/settings/import', ImportCenter],
  ['/trade', Trade],
  ['/trade/shipments', Trade],
  ['/trade/portals', Trade],
  ['/customers/statement', CustomerStatement],
  ['/customers/growth', CustomerGrowth],
  ['/smes', SMEs],
  ['/compliance', ComplianceDashboard],
  ['/compliance/dashboard', ComplianceDashboard],
  ['/compliance/eims', EimsDashboard],
  ['/compliance/source-systems', SourceSystems],
  ['/compliance/certificates', ComplianceCertificates],
  ['/compliance/invoices', EimsInvoices],
  ['/compliance/receipts', EimsReceipts],
  ['/compliance/bulk', BulkOperations],
  ['/compliance/checklists', ComplianceChecklists],
  ['/compliance/cyber-audit', CyberAuditChecklist],
  ['/compliance/master-checklist', MasterComplianceChecklist],
  ['/compliance/accreditation', AccreditationChecklist],
  ['/compliance/tax-reports', TaxReports],
  ['/compliance/withholding', WithholdingTax],
  ['/crm/dashboard', CrmDashboard],
  ['/settings/white-label', WhiteLabelSettings],
  ['/settings/import-pro', ImportPro],
  ['/employees/dashboard', EmployeesModule],
  ['/payroll/dashboard', PayrollModule],
  ['/accounting/assets', AssetsModule],
  // -- New modules --------------------------------------------------------------
  ['/tax/property-tax', PropertyTax],
  ['/tax/excise-tax', ExciseTax],
  ['/tax/stamp-duty', StampDuty],
  ['/reports/financial-statements', FinancialStatements],
  ['/reports/balance-sheet', BalanceSheet],
  ['/reports/profit-loss', ProfitAndLoss],
  ['/reports/cash-flow', CashFlowStatement],
  ['/reports/trial-balance', TrialBalance],
  ['/accounting-dashboard', AccountingDashboard],
  ['/accounting/sub-ledger', SubLedger],
  ['/general-ledger-compliance', GeneralLedgerCompliance],
  ['/accounting/aabe-audit', AabeAuditReadiness],
  ['/accounting/consolidation', Consolidation],
  ['/nodes', ConnectedNodes],
  ['/manufacturing', Manufacturing],
  ['/ovds/accounts',                     DoubleEntry, undefined, 'double-entry'],
  ['/ovds/reports/trial-balance',        DoubleEntry, undefined, 'double-entry'],
  ['/ovds/reports/general-ledger',       DoubleEntry, undefined, 'double-entry'],
  ['/ovds/reports/balance-sheet',        DoubleEntry, undefined, 'double-entry'],
  ['/ovds/reports/profit-loss',          DoubleEntry, undefined, 'double-entry'],
  ['/ovds/workflow',                     AccountingWorkflow],
  ['/double-entry/journals',                JournalEntries, undefined, 'double-entry'],
  ['/reports/notes', NotesToFinancials],
  ['/accounting/cost-centers', CostCenters],
  ['/accounting/estimates', AccountingEstimatesPage],
  ['/hr/gratuity', GratuityCalculator],
  ['/compliance/agm', AGMPage],
  ['/compliance/governance', GovernancePage],
  ['/accounting/budgets/variance', BudgetVariance],
  ['/tax/penalty-calculator', ErcaPenaltyCalculator],
  ['/ovds/payment-gateways', PaymentGateway],
  ['/ovds/cost-accounting', CostAccountingPage],
  ['/accounting/opening-balances', OpeningBalancesPage],
  // -- Gap-fix modules ----------------------------------------------------------
  ['/tax/wht-certificates',              WhtCertificates],
  ['/hr/paye-declarations',              PayeDeclarations],
  ['/accounting/accruals-prepayments',   AccrualsPrepayments],
  ['/inventory/valuation',               InventoryValuation],
  ['/hr/payroll-bank-export',            BankPayrollExport],
  ['/ifrs/intercompany-eliminations',    IntercompanyEliminations],
  ['/ifrs/consolidated-statements',      ConsolidatedStatements],
  ['/accounting/entity-groups',          EntityGroups],
  ['/accounting/translation-reserves',   TranslationReserves],
  ['/reports/definitions',               ReportDefinitions],
  ['/reports/lines',                     ReportLines],
  ['/settings/business-registration',             BusinessRegistration],
  ['/tax/schedule-d',                    ScheduleDTax],
  // IoT & Smart Management — all sub-routes handled inside IotHub via internal tabs
  ['/iot',             IotHub],
  ['/iot/devices',     IotHub],
  ['/iot/telemetry',   IotHub],
  ['/iot/alerts',      IotHub],
  ['/iot/ota',         IotHub],
  // Device Control Governance — org-wide maker-checker controls
  ['/device-control',          DeviceControl],
  ['/device-control/requests',  DeviceControl],
  ['/iot/billing',     IotHub],
  // Unified Control Node — single workspace for System & Local + IoT/Apps/Device control
  ['/control',          UnifiedControlNode],
  ['/control/iot',      UnifiedControlNode],
  // e-Tax Online Declaration
  ['/tax/etax-declaration', ETaxDeclaration],
  ['/tax/acknowledgement-vault', TaxAcknowledgementVault],
  // -- New MoR submission modules -----------------------------------------------
  ['/banking/digital-payments',   DigitalPayments],
  ['/tax/liability-estimator',    TaxLiabilityEstimator],
  ['/tax/pension-submission',     PensionSubmission],
  ['/tax/payment-reference',      TaxPaymentReference],
  // -- Universal Tax Configuration (ADMIN / ovds) ----------------------------
  ['/tax/universal-config',       UniversalTaxConfig],
  ['/reports/mor-report',         MoRReport],
  ['/reports-dashboard',          ReportsDashboard],
  ['/sales/offline-resilience',   OfflineResilience],
  // -- CRM Interactions ---------------------------------------------------------
  ['/crm/interactions',            CustomerInteraction],
  // -- Inventory Adjustments ----------------------------------------------------
  ['/inventory/adjustments',       Adjustments],
  // -- Settings sub-routes ------------------------------------------------------
  ['/settings/company-profile',   CompanyProfilePage],
  ['/settings/catalog',           SettingsCatalog],
  ['/settings/digital-wallets',   Settings],
  ['/settings/payment-gateways/chapa', Settings],
  ['/settings/license',           LicenseManager],
  ['/settings/users-access',      UsersAccessPage],
  ['/settings/modules',           ModulesPage],
  ['/settings/eims',              EimsSettings, {
    layout: 'slider',
    slider: {
      title: 'EIMS Integration',
      description: 'Configure the Ethiopian Invoice Management System connection',
      side: 'right',
      width: 'w-[560px]',
      closeRoute: '/settings',
      icon: 'COMPLIANCE',
    },
  }],
  ['/settings/security',          SecuritySettings, {
    layout: 'slider',
    slider: {
      title: 'Security Settings',
      description: 'MFA, session policy, and password requirements',
      side: 'right',
      width: 'w-[560px]',
      closeRoute: '/settings',
      icon: 'SHIELD',
    },
  }],
  ['/settings/currencies',        CurrencySettings],
  ['/settings/email',             EmailSettings],
  ['/settings/maintaining-technology', MaintainingTechnology],
  // -- Expense Claims -----------------------------------------------------------
  ['/expense-claims', ExpenseClaims, {
    layout: 'modal',
    modal: {
      title: 'Expense Claims',
      description: 'Submit and review out-of-pocket expense reimbursements',
      maxWidth: 'max-w-2xl',
      closeRoute: '/purchases/expenses',
      icon: 'RECEIPT',
    },
  }],
  // -- ovds Reports ----------------------------------------------------------
  // ── Banking Hub (full flow: Accounts · Transactions · Transfers · Feeds · Reconciliation) ──
  ['/banking',                             Banking],
  ['/banking/feeds',                       BankFeeds],
  ['/banking/rules',                       BankingRules],
  ['/banking/cash-flow',                   BankingCashFlow],
  ['/banking/year-end',                    BankingYearEnd],
  ['/banking/workflow',                    BankingWorkflow],
  ['/banking/verify',                      BankingVerification],

];

// -- EntitlementProvider wrapper — reads auth state ----------------------------
const EntitlementWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return (
    <EntitlementProvider isAuthenticated={isAuthenticated}>
      {children}
    </EntitlementProvider>
  );
};

// -- App -----------------------------------------------------------------------
const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  // Clear stale chunk-retry flag on every successful app mount.
  // This ensures that if the previous session failed on a now-fixed chunk,
  // the next visit gets a clean retry slot instead of showing the error boundary.
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RETRY_KEY);
  }, []);

  // Global unhandled promise rejection → navigate to appropriate error page
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const status: number | undefined =
        reason && typeof reason === "object" && "response" in reason
          ? (reason as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 401) {
        navigate('/login', { replace: true });
      } else if (status === 403) {
        navigate('/forbidden', { replace: true });
      } else if (status === 402) {
        navigate('/payment-required', { replace: true });
      } else if (status === 503 || status === 502 || status === 504) {
        navigate(`/service-unavailable?status=${status}`, { replace: true });
      }
      // 405 / 501 are handled inline by the api.ts interceptor (toast)
      // Other errors bubble to ErrorBoundary or console
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, [navigate]);

  return (
    <Routes>
    <Route
      path="/login"
      element={
        <GuestRoute>
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        </GuestRoute>
      }
    />
    {/* Public landing — unauthenticated only */}
    <Route
      path="/"
      element={
        <Suspense fallback={<PageLoader />}>
          <LandingOrDashboard />
        </Suspense>
      }
    />
    <Route
      path="/auth/callback"
      element={
        <Suspense fallback={<PageLoader />}>
          <Auth0Callback />
        </Suspense>
      }
    />
    <Route
      path="/auth/google/callback"
      element={
        <Suspense fallback={<PageLoader />}>
          <GoogleCallback />
        </Suspense>
      }
    />
    <Route
      path="/register"
      element={
        <GuestRoute>
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        </GuestRoute>
      }
    />
    <Route
      path="/start"
      element={
        <GuestRoute>
          <Suspense fallback={<PageLoader />}>
            <GettingStartedPublic />
          </Suspense>
        </GuestRoute>
      }
    />
    <Route
      path="/getting-started/cloud"
      element={
        <Suspense fallback={<PageLoader />}>
          <SetupCloud />
        </Suspense>
      }
    />
    <Route
      path="/getting-started/on-premise"
      element={
        <Suspense fallback={<PageLoader />}>
          <SetupOnPremise />
        </Suspense>
      }
    />
    <Route
      path="/getting-started/client"
      element={
        <Suspense fallback={<PageLoader />}>
          <ClientDownload />
        </Suspense>
      }
    />
    <Route
      path="/sample-invoice"
      element={
        <Suspense fallback={<PageLoader />}>
          <SampleInvoice />
        </Suspense>
      }
    />
    <Route
      path="/getting-started/invoice-module"
      element={
        <Suspense fallback={<PageLoader />}>
          <InvoiceModuleDownload />
        </Suspense>
      }
    />
    <Route
      path="/plans"
      element={
        <Suspense fallback={<PageLoader />}>
          <Plans />
        </Suspense>
      }
    />
    {/* ── Public Documentation Portal — no auth required ── */}
    <Route
      path="/docs"
      element={
        <Suspense fallback={<PageLoader />}>
          <DocsPortal />
        </Suspense>
      }
    />
    <Route
      path="/docs/:slug"
      element={
        <Suspense fallback={<PageLoader />}>
          <DocsPortal />
        </Suspense>
      }
    />
    {/* ── Persistent authenticated shell — Layout mounts ONCE here ──────────
         The sidebar, header, and all layout state stay alive across every
         navigation. Only the <Outlet /> (page content) swaps on route change. */}
    <Route element={<AuthenticatedShell />}>
      <Route
        path="/entry"
        element={
          <ProtectedRoute path="/entry">
            <EntryPortal />
          </ProtectedRoute>
        }
      />
      {ROUTES.map(([path, Page, handle, moduleKey]) => (
        <Route
          key={path}
          path={path}
          handle={handle}
          element={
            <ProtectedRoute path={path}>
              <ModuleGuard moduleKey={moduleKey as string | undefined}>
                <Page />
              </ModuleGuard>
            </ProtectedRoute>
          }
        />
      ))}
    </Route>
    {/* ── End of authenticated shell ── */}

    {/* ── Public / error routes — no layout shell, no auth requirement ── */}
    <Route
      path="/forbidden"
      element={
        <Suspense fallback={<PageLoader />}>
          <Forbidden />
        </Suspense>
      }
    />
    <Route
      path="/service-unavailable"
      element={
        <Suspense fallback={<PageLoader />}>
          <ServiceUnavailable />
        </Suspense>
      }
    />
    <Route
      path="/payment-required"
      element={
        <Suspense fallback={<PageLoader />}>
          <PaymentRequired />
        </Suspense>
      }
    />
    <Route
      path="/client-portal/:token"
      element={
        <Suspense fallback={<PageLoader />}>
          <ClientPortal />
        </Suspense>
      }
    />

    <Route path="/tax" element={<Navigate to="/tax/dashboard" replace />} />
    {/* NOTE: /banking/digital-payments and specific /banking/* routes are handled above via ROUTES */}
    <Route path="/accounts/*" element={<Navigate to="/banking/accounts" replace />} />
    <Route path="/accounts" element={<Navigate to="/banking/accounts" replace />} />
    
    {/* Friendly URL Redirects */}
    <Route path="/invoices" element={<Navigate to="/sales/invoices" replace />} />
    <Route path="/estimates" element={<Navigate to="/sales/estimates" replace />} />
    <Route path="/credit-notes" element={<Navigate to="/sales/credit-notes" replace />} />
    <Route path="/sales-orders" element={<Navigate to="/sales/orders" replace />} />
    <Route path="/receipts" element={<Navigate to="/sales/receipts" replace />} />
    <Route path="/refunds" element={<Navigate to="/sales/refunds" replace />} />
    {/* Purchases URL Redirects */}
    <Route path="/bills" element={<Navigate to="/purchases/bills" replace />} />
    <Route path="/expenses" element={<Navigate to="/purchases/expenses" replace />} />
    <Route path="/purchase-orders" element={<Navigate to="/purchases/orders" replace />} />
    <Route path="/vendors" element={<Navigate to="/purchases/vendors" replace />} />
    <Route path="/grn" element={<Navigate to="/purchases/grn" replace />} />
    <Route path="/debit-notes" element={<Navigate to="/purchases/debit-notes" replace />} />
    <Route path="/scanned-bills" element={<Navigate to="/purchases/scanned-bills" replace />} />
    <Route path="/purchase-receipts" element={<Navigate to="/purchases/receipts" replace />} />
    {/* Procurement URL Redirects */}
    <Route path="/vendor-ledger" element={<Navigate to="/procurement/vendor-ledger" replace />} />
    <Route path="/letter-of-credit" element={<Navigate to="/procurement/letter-of-credit" replace />} />
    <Route path="/landed-cost" element={<Navigate to="/procurement/landed-cost" replace />} />
    <Route path="/import-shipments" element={<Navigate to="/procurement/import-shipments" replace />} />
    <Route path="/supplier-payment-run" element={<Navigate to="/treasury/payment-run" replace />} />
    {/* HR URL Redirects */}
    <Route path="/employees" element={<Navigate to="/hr/employees" replace />} />
    <Route path="/departments" element={<Navigate to="/hr/departments" replace />} />
    <Route path="/attendance" element={<Navigate to="/hr/attendance" replace />} />
    <Route path="/leaves" element={<Navigate to="/hr/leaves" replace />} />
    <Route path="/shifts" element={<Navigate to="/hr/shifts" replace />} />
    <Route path="/holidays" element={<Navigate to="/hr/holidays" replace />} />
    <Route path="/payroll" element={<Navigate to="/hr/payroll" replace />} />
    <Route path="/payroll-administration" element={<Navigate to="/hr/payroll-administration" replace />} />
    <Route path="/calendar" element={<Navigate to="/hr/calendar" replace />} />
    <Route path="/enrollment" element={<Navigate to="/settings/enroll" replace />} />
    <Route path="/vat-administration" element={<Navigate to="/tax/vat" replace />} />
    <Route path="/purchase-orders-list" element={<Navigate to="/purchases/orders" replace />} />
    {/* /expense-claims is now a real page — old redirect removed */}
    <Route path="/leave-management" element={<Navigate to="/hr/leaves" replace />} />
    <Route path="/fixed-assets-list" element={<Navigate to="/accounting/fixed-assets" replace />} />
    <Route path="/Attendance" element={<Navigate to="/hr/attendance" replace />} />
    <Route path="/Enrollment" element={<Navigate to="/settings/enroll" replace />} />
    <Route path="/Purchase-Orders" element={<Navigate to="/purchases/orders" replace />} />
    <Route path="/Fixed-Assets" element={<Navigate to="/accounting/fixed-assets" replace />} />
    <Route path="/Period-Close" element={<Navigate to="/accounting/period-close" replace />} />
    <Route path="/Leave-Management" element={<Navigate to="/hr/leaves" replace />} />
    <Route path="/Expense-Claims" element={<Navigate to="/expense-claims" replace />} />
    
    {/* Additional Friendly Redirects */}
    {/* Customers */}
    <Route path="/customer-summary" element={<Navigate to="/customers/summary" replace />} />
    <Route path="/customer-summary/:id" element={<Navigate to="/customers/summary/:id" replace />} />
    <Route path="/customer-statement" element={<Navigate to="/customers/statement" replace />} />
    <Route path="/customer-growth" element={<Navigate to="/customers/growth" replace />} />
    <Route path="/client-portal" element={<Navigate to="/customers/portal" replace />} />
    <Route path="/payment-tracker" element={<Navigate to="/customers/payment-tracker" replace />} />
    {/* Banking */}
    <Route path="/bank-reconciliation" element={<Navigate to="/banking/reconciliation" replace />} />
    <Route path="/bank-statement-import" element={<Navigate to="/banking/statement-import" replace />} />
    <Route path="/fund-transfers" element={<Navigate to="/banking/transfers" replace />} />
    <Route path="/transactions" element={<Navigate to="/banking/transactions" replace />} />
    <Route path="/petty-cash" element={<Navigate to="/banking/petty-cash" replace />} />
    <Route path="/fx-rates" element={<Navigate to="/banking/fx-rates" replace />} />
    {/* Inventory */}
    <Route path="/inventory/items" element={<Navigate to="/items" replace />} />
    {/* Accounting */}
    <Route path="/accounting-hub" element={<Navigate to="/accounting/hub" replace />} />
    <Route path="/accounting-collections" element={<Navigate to="/accounting/collections" replace />} />
    <Route path="/accounting-workflow" element={<Navigate to="/accounting/workflow" replace />} />
    <Route path="/fixed-assets" element={<Navigate to="/accounting/fixed-assets" replace />} />
    <Route path="/leases" element={<Navigate to="/accounting/leases" replace />} />
    <Route path="/budgets" element={<Navigate to="/accounting/budgets" replace />} />
    <Route path="/period-close" element={<Navigate to="/accounting/period-close" replace />} />
    <Route path="/transaction-categories" element={<Navigate to="/accounting/categories" replace />} />
    {/* Reports */}
    <Route path="/business-insights" element={<Navigate to="/reports/insights" replace />} />
    {/* Settings */}
    <Route path="/users" element={<Navigate to="/settings/users" replace />} />
    <Route path="/role-permissions" element={<Navigate to="/settings/roles" replace />} />
    <Route path="/audit-logs" element={<Navigate to="/settings/audit-logs" replace />} />
    <Route path="/import-center" element={<Navigate to="/settings/import" replace />} />
    <Route path="/email-templates" element={<Navigate to="/settings/email-templates" replace />} />
    <Route path="/settings/currencies" element={<Navigate to="/banking/fx-rates" replace />} />
    {/* Legacy aliases */}
    <Route path="/payroll-admin" element={<Navigate to="/hr/payroll-administration" replace />} />
    <Route path="/chart-of-accounts" element={<Navigate to="/ovds/accounts" replace />} />
    <Route path="/journal-entries" element={<Navigate to="/double-entry/journals" replace />} />
    <Route path="/bank-accounts" element={<Navigate to="/banking/accounts" replace />} />
    <Route path="/bank-statement" element={<Navigate to="/banking/statement-import" replace />} />
    <Route path="/ovds-hub" element={<Navigate to="/ovds" replace />} />
    <Route path="/collections" element={<Navigate to="/accounting/collections" replace />} />
    <Route path="/customer-profiles" element={<Navigate to="/customers/summary" replace />} />
    <Route path="/user-management" element={<Navigate to="/settings/users" replace />} />
    <Route path="/system-settings" element={<Navigate to="/settings" replace />} />
    <Route path="/api-documentation" element={<Navigate to="/settings/api-docs" replace />} />
    <Route path="/multi-company" element={<Navigate to="/settings/multi-company" replace />} />
    <Route path="/tax-dashboard" element={<Navigate to="/tax/dashboard" replace />} />
    <Route path="/tax-filing" element={<Navigate to="/tax/filing" replace />} />
    <Route path="/kb" element={<Navigate to="/docs" replace />} />
    <Route path="/kb/:slug" element={<Navigate to="/docs" replace />} />
    <Route path="/customer-statements" element={<Navigate to="/customers/statement" replace />} />
    <Route path="/growth-trends" element={<Navigate to="/customers/growth" replace />} />
    <Route path="/sme" element={<Navigate to="/smes" replace />} />
    <Route path="/sme-dashboard" element={<Navigate to="/smes" replace />} />
    {/* Compliance redirects */}
    <Route path="/audit-outsourcing" element={<Navigate to="/compliance/audit-outsourcing" replace />} />
    <Route path="/compliance-auditor" element={<Navigate to="/compliance/auditor" replace />} />
    <Route path="/security-evaluator" element={<Navigate to="/compliance/security" replace />} />
    <Route path="/vandv" element={<Navigate to="/compliance/vandv" replace />} />
    <Route path="/vandv-compliance" element={<Navigate to="/compliance/vandv" replace />} />
    {/* Tax redirects */}
    <Route path="/business-income-tax" element={<Navigate to="/tax/business-income" replace />} />
    {/* Settings redirects */}
    <Route path="/business-registration" element={<Navigate to="/settings/business-registration" replace />} />
    <Route path="/multi-company-admin" element={<Navigate to="/settings/multi-company" replace />} />
    <Route path="/onboarding-admin" element={<Navigate to="/settings/onboarding" replace />} />
    <Route path="/master-data" element={<Navigate to="/settings/master-data" replace />} />
    {/* ovds redirects */}
    <Route path="/partnerships" element={<Navigate to="/ovds/partnerships" replace />} />
    <Route path="/investments" element={<Navigate to="/ovds/investments" replace />} />
    <Route path="/business-loans" element={<Navigate to="/ovds/loans" replace />} />
    <Route path="/banking-workflow" element={<Navigate to="/banking/workflow" replace />} />
    {/* Banking redirects */}
    <Route path="/treasury-forecast" element={<Navigate to="/banking/treasury" replace />} />
    {/* Accounting redirects */}
    <Route path="/budgets/variance" element={<Navigate to="/accounting/budgets/variance" replace />} />
    {/* Settings extra redirects */}
    <Route path="/api-docs" element={<Navigate to="/settings/api-docs" replace />} />
    <Route path="/app-store" element={<Navigate to="/settings/app-store" replace />} />
    <Route path="/releases" element={<Navigate to="/settings/releases" replace />} />
    <Route path="/developers" element={<Navigate to="/settings/developers" replace />} />
    <Route path="/enroll" element={<Navigate to="/settings/enroll" replace />} />
    {/* Tax extra redirects */}
    <Route path="/vat" element={<Navigate to="/tax/vat" replace />} />
    <Route path="/vat-administration" element={<Navigate to="/tax/vat" replace />} />
    {/* ovds extra redirects */}
    <Route path="/loyalty" element={<Navigate to="/ovds/loyalty" replace />} />
    <Route path="/projects" element={<Navigate to="/ovds/projects" replace />} />
    <Route
      path="*"
      element={
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      }
    />
  </Routes>
  );
};

// -- Dark-mode aware Toaster ---------------------------------------------------
const ThemedToaster: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: isDark
          ? {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
            }
          : {
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
            },
        success: {
          iconTheme: {
            primary: '#00E784',
            secondary: isDark ? '#1e293b' : '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#f43f5e',
            secondary: isDark ? '#1e293b' : '#fff',
          },
        },
      }}
    />
  );
};
/**
 * RootShell — rendered as the element of the single splat route inside
 * createBrowserRouter.  Because it lives inside a data-router context,
 * useMatches() (and every other data-router hook) works correctly here
 * and in every descendant component (e.g. RouteLayoutDispatcher).
 */
const RootShell: React.FC = () => (
  <>
    <NavigateInjector />
    <ThemedToaster />
    <Refine
      dataProvider={refineDataProvider}
      authProvider={refineAuthProvider}
      routerProvider={routerProvider}
      resources={[]}
      options={{
        syncWithLocation: false,
        disableTelemetry: true,
        warnWhenUnsavedChanges: true,
        reactQuery: { clientConfig: queryClient },
      }}
    >
      <AppRoutes />
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
    <ModuleProvider>
      <ModuleRouter />
    </ModuleProvider>
  </>
);

// createBrowserRouter gives every descendant access to the data-router
// context that useMatches() (used by RouteLayoutDispatcher) requires.
const browserRouter = createBrowserRouter([
  { path: '*', element: <RootShell /> },
]);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <BusinessProvider>
      <Auth0ProviderWrapper>
        <AuthProvider>
          <HealthProvider>
            <StepUpProvider>
              <EntitlementWrapper>
              <SecurityWrapper>
                <AppModuleRegistry>
                  <VatModuleProvider>
                    <RouterProvider router={browserRouter} />
                  </VatModuleProvider>
                </AppModuleRegistry>
              </SecurityWrapper>
              </EntitlementWrapper>
            </StepUpProvider>
          </HealthProvider>
        </AuthProvider>
      </Auth0ProviderWrapper>
    </BusinessProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;


