export const salesApi = {};

export const invoicesApi = {};
export const estimatesApi = {};
export const customersApi = {};
export const paymentsApi = {};
export const creditNotesApi = {};
export const debitNotesApi = {};
export const salesOrdersApi = {};
export const proformaApi = {};
export const exchangeRatesApi = {};
export const auditTrailApi = {};
export const salesDashboardApi = {};

export type InvoiceListParams = Record<string, unknown>;
export type CustomerListParams = Record<string, unknown>;
export type PaymentData = Record<string, unknown>;
export type VoidData = Record<string, unknown>;
export type WhtResult = Record<string, unknown>;
export type VatResult = Record<string, unknown>;
export type SalesDashboardData = Record<string, unknown>;
export type ArAgingData = Record<string, unknown>;
export type CustomerDebtProfileData = Record<string, unknown>;
export type OverdueInvoicesData = Record<string, unknown>;
export type ReminderResult = Record<string, unknown>;
export type RevenueRecognitionData = Record<string, unknown>;
