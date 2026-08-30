/**
 * Route chunk preloading for instant navigation.
 *
 * Call `prefetchRoute(path)` on `onMouseEnter` of navigation links to start
 * downloading the JS chunk for that page *before* the user clicks. Vite
 * handles the dynamic import natively — calling `import()` (even fire-and-forget)
 * triggers the browser to fetch and cache the chunk, so the click navigation
 * is effectively instant.
 */

const routeChunkMap: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/sales': () => import('../pages/Sales'),
  '/sales/invoices': () => import('../pages/Invoices'),
  '/sales/estimates': () => import('../pages/Estimates'),
  '/sales/proforma': () => import('../pages/ProformaInvoices'),
  '/sales/orders': () => import('../pages/SalesOrders'),
  '/sales/credit-notes': () => import('../pages/CreditNotes'),
  '/sales/debit-notes': () => import('../pages/SalesDebitNotes'),
  '/sales/receipts': () => import('../pages/Receipts'),
  '/customers/summary': () => import('../pages/CustomerSummary'),
  '/crm/pipeline': () => import('../pages/CRMPipeline'),
  '/crm/interactions': () => import('../pages/CustomerInteraction'),
  '/purchases/bills': () => import('../pages/Bills'),
  '/purchases/vendors': () => import('../pages/Vendors'),
  '/purchases/orders': () => import('../pages/PurchaseOrders'),
  '/purchases/grn': () => import('../pages/GoodsReceivedNotes'),
  '/purchases/debit-notes': () => import('../pages/DebitNotes'),
  '/purchases/scanned-bills': () => import('../pages/ScannedBills'),
  '/purchases/expenses': () => import('../pages/Expenses'),
  '/expense-claims': () => import('../pages/ExpenseClaims'),
  '/inventory': () => import('../pages/Inventory'),
  '/items': () => import('../pages/Items'),
  '/inventory/variants': () => import('../pages/ItemVariants'),
  '/inventory/adjustments': () => import('../pages/Adjustments'),
  '/inventory/valuation': () => import('../pages/InventoryValuation'),
  '/manufacturing': () => import('../pages/Manufacturing'),
  '/banking/accounts': () => import('../components/banking/bankList'),
  '/banking/transactions': () => import('../pages/Transactions'),
  '/banking/reconciliation': () => import('../pages/BankReconciliation'),
  '/banking/cash-flow': () => import('../pages/BankingCashFlow'),
  '/banking/petty-cash': () => import('../pages/PettyCash'),
  '/banking/transfers': () => import('../pages/FundTransfers'),
  '/banking/fx-rates': () => import('../pages/FxRates'),
  '/banking/digital-payments': () => import('../pages/DigitalPayments'),
  '/ovds/accounts': () => import('../pages/DoubleEntry'),
  '/double-entry/journals': () => import('../pages/JournalEntries'),
  '/ovds/reports/general-ledger': () => import('../pages/DoubleEntry'),
  '/ovds/reports/trial-balance': () => import('../pages/DoubleEntry'),
  '/accounting/categories': () => import('../pages/TransactionCategories'),
  '/accounting/cost-centers': () => import('../pages/CostCenters'),
  '/accounting/opening-balances': () => import('../pages/OpeningBalances'),
  '/accounting/period-close': () => import('../pages/PeriodClose'),
  '/accounting/accruals-prepayments': () => import('../pages/AccrualsPrepayments'),
  '/accounting/workflow': () => import('../pages/AccountingWorkflow'),
  '/ifrs': () => import('../pages/IfsDashboard'),
  '/tax/vat': () => import('../pages/VatAdministration'),
  '/tax/tot': () => import('../pages/TotFiling'),
  '/tax/excise-tax': () => import('../pages/ExciseTax'),
  '/tax/stamp-duty': () => import('../pages/StampDuty'),
  '/tax/wht-certificates': () => import('../pages/WhtCertificates'),
  '/tax/schedule-d': () => import('../pages/ScheduleDTax'),
  '/tax/dashboard': () => import('../pages/TaxDashboard'),
  '/tax/filing': () => import('../pages/TaxFiling'),
  '/tax/liability-estimator': () => import('../pages/TaxLiabilityEstimator'),
  '/tax/pension-submission': () => import('../pages/PensionSubmission'),
  '/tax/payment-reference': () => import('../pages/TaxPaymentReference'),
  '/compliance/vandv': () => import('../pages/VandvCompliance'),
  '/compliance/certificates': () => import('../pages/compliance/CertificatesPage'),
  '/compliance/security': () => import('../pages/SecurityEvaluator'),
  '/compliance/audit-outsourcing': () => import('../pages/AuditOutsourcing'),
  '/reports/financial-statements': () => import('../pages/FinancialStatements'),
  '/reports/balance-sheet': () => import('../pages/BalanceSheet'),
  '/reports/profit-loss': () => import('../pages/ProfitAndLoss'),
  '/reports/cash-flow': () => import('../pages/CashFlowStatement'),
  '/reports/trial-balance': () => import('../pages/TrialBalance'),
  '/reports?type=income-expense': () => import('../pages/Reports'),
  '/reports?type=expense-summary': () => import('../pages/Reports'),
  '/reports?type=tax': () => import('../pages/Reports'),
  '/reports/insights': () => import('../pages/BusinessInsights'),
  '/hr/employees': () => import('../pages/Employees'),
  '/hr/payroll': () => import('../pages/Payroll'),
  '/hr/attendance': () => import('../pages/Attendance'),
  '/hr/leaves': () => import('../pages/Leaves'),
  '/hr/shifts': () => import('../pages/Shifts'),
  '/hr/holidays': () => import('../pages/Holidays'),
  '/hr/calendar': () => import('../pages/Calendar'),
  '/hr/paye-declarations': () => import('../pages/PayeDeclarations'),
  '/hr/gratuity': () => import('../pages/GratuityCalculator'),
  '/settings/company-profile': () => import('../pages/ModularSettings'),
  '/settings/users': () => import('../pages/Users'),
  '/settings/roles': () => import('../pages/RolePermissions'),
  '/settings/advanced-access-controls': () => import('../pages/AdvancedAccessControls'),
  '/settings/app-store': () => import('../pages/AppStore'),
  '/control': () => import('../pages/UnifiedControlNode'),
  '/settings/api-docs': () => import('../pages/ApiDocs'),
  '/settings/developers': () => import('../pages/Developers'),
  '/control/iot': () => import('../pages/IotHub'),
  '/getting-started': () => import('../pages/Onboarding'),
  '/companies': () => import('../pages/Companies'),
  '/companies/new': () => import('../pages/CompanyNew'),
  '/iot/devices': () => import('../pages/IotHub'),
  '/iot/telemetry': () => import('../pages/IotHub'),
  '/iot/billing': () => import('../pages/IotHub'),
  '/iot/alerts': () => import('../pages/IotHub'),
  '/iot/ota': () => import('../pages/IotHub'),
  '/notifications': () => import('../pages/Notifications'),
};

const _prefetched = new Set<string>();

/**
 * Fire-and-forget chunk prefetch. Calling this on `onMouseEnter` of a nav
 * link starts downloading the page's JS chunk so the click navigation is
 * effectively instant.
 *
 * The path is normalized: query strings are stripped before lookup.
 */
export function prefetchRoute(rawPath: string): void {
  const path = rawPath.split('?')[0];
  if (_prefetched.has(path)) return;
  const loader = routeChunkMap[path];
  if (loader) {
    _prefetched.add(path);
    loader().catch(() => { /* chunk already loading or failed — nav will handle */ });
  }
}

/** Preload multiple routes at once (e.g. on app idle or sidebar mount). */
export function prefetchRoutes(paths: string[]): void {
  paths.forEach(p => prefetchRoute(p));
}
