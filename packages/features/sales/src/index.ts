export * from './services/salesApi';
export { useInvoices } from './hooks/useInvoices';
export { useSalesDashboard } from './hooks/useSalesDashboard';

export function useInvoiceStats() { return {}; }
export function useInvoiceMutations() { return {}; }
export function useArAging() { return {}; }
export function useCustomerDebtProfile() { return {}; }
export function useOverdueInvoices(_companyId?: string | null) {
  return { data: null as { invoices: any[] } | null, loading: false, refetch: () => Promise.resolve() };
}
export function useSendReminder() {
  return { sendReminder: async (_id: any, _escalate?: boolean): Promise<{ message: string }> => ({ message: '' }), sending: false };
}
export function useRevenueRecognition(_companyId?: string | null) {
  return { data: null as any, loading: false, refetch: (_: any) => Promise.resolve() };
}
export function useRecognizeRevenue() { return {}; }

export type InvoiceKpis = Record<string, unknown>;
export type UseInvoicesOptions = Record<string, unknown>;
