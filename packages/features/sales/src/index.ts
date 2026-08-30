export * from './services/salesApi';
export { useInvoices } from './hooks/useInvoices';
export { useSalesDashboard } from './hooks/useSalesDashboard';

export function useInvoiceStats() { return {}; }
export function useInvoiceMutations() { return {}; }
export function useArAging() { return {}; }
export function useCustomerDebtProfile() { return {}; }
export function useOverdueInvoices() { return {}; }
export function useSendReminder() { return {}; }
export function useRevenueRecognition() { return {}; }
export function useRecognizeRevenue() { return {}; }

export type InvoiceKpis = Record<string, unknown>;
export type UseInvoicesOptions = Record<string, unknown>;
