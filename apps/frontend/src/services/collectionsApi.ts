import api from '../services/api';

export const collectionsApi = {
  // Collections Cases
  getCases: (params: {
    stage?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) => api.get('/ovds/collections/cases', { params }),

  createCase: (data: any) => api.post('/ovds/collections/cases', data),

  updateCase: (id: string, data: any) => api.patch(`/ovds/collections/cases/${id}`, data),

  bulkAssign: (ids: string[], assignedTo: string) =>
    api.post('/ovds/collections/bulk-assign', { ids, assignedTo }),

  bulkUpdateStage: (ids: string[], stage: string) =>
    api.post('/ovds/collections/bulk-stage', { ids, stage }),

  setPromiseToPay: (id: string, promiseDate: string, amount?: number) =>
    api.patch(`/ovds/collections/cases/${id}`, {
      stage: 'PROMISE_TO_PAY',
      promiseDate,
      promiseAmount: amount,
    }),

  escalateCase: (id: string, reason: string) =>
    api.patch(`/ovds/collections/cases/${id}`, { stage: 'ESCALATED', escalationReason: reason }),

  closeCase: (id: string, resolution: string) =>
    api.patch(`/ovds/collections/cases/${id}`, { stage: 'CLOSED', resolution }),

  // Deductions
  getDeductions: (params: any) => api.get('/ovds/collections/deductions', { params }),

  createDeduction: (data: any) => api.post('/ovds/collections/deductions', data),

  updateDeduction: (id: string, data: any) =>
    api.patch(`/ovds/collections/deductions/${id}`, data),

  // Payment Disputes (NBE/MoR compliance)
  getDisputes: (params?: { status?: string; invoiceId?: string }) =>
    api.get('/ovds/payments/disputes', { params }),

  createDispute: (data: {
    invoiceId: string;
    reason: string;
    evidence?: string;
    amount?: number;
    paymentId?: string;
    interactionType?: string;
    archType?: string;
    processType?: string;
  }) => api.post('/ovds/payments/disputes', data),

  updateDispute: (id: string, data: { status: string; resolution?: string }) =>
    api.patch(`/ovds/payments/disputes/${id}`, data),

  // Transaction Archive (audit trail)
  getTransactionArchive: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    method?: string;
    invoiceId?: string;
    interactionType?: string;
    archType?: string;
    processType?: string;
  }) => api.get('/ovds/payments/archive', { params }),

  // Duplicate check
  checkDuplicate: (ref: string, amount?: number) =>
    api.get('/ovds/payments/check-duplicate', { params: { ref, amount } }),

  // Integration analytics — breakdown by type tags
  getIntegrationStats: () =>
    api.get('/ovds/payments/integration-stats', { headers: { 'x-background': '1' } }),

  // NBE compliance summary — for audit/MoR reporting
  getNBEComplianceSummary: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/ovds/payments/nbe-compliance', { params }),

  // Payment plan — schedule installments for overdue invoices
  createPaymentPlan: (invoiceId: string, installments: Array<{ dueDate: string; amount: number }>) =>
    api.post(`/ovds/invoices/${invoiceId}/payment-plan`, { installments }),

  getPaymentPlan: (invoiceId: string) =>
    api.get(`/ovds/invoices/${invoiceId}/payment-plan`),

  // Dashboard
  dashboard: () => api.get('/ovds/collections/dashboard', { headers: { 'x-background': '1' } }),

  // Export
  exportCases: () => api.get('/ovds/collections/export', { responseType: 'blob' }),

  exportNBECompliance: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/ovds/payments/nbe-compliance/export', { params, responseType: 'blob' }),
};

export const useCases = () => ({
  getCases: collectionsApi.getCases,
  createCase: collectionsApi.createCase,
  updateCase: collectionsApi.updateCase,
});

export const useDeductions = () => ({
  getDeductions: collectionsApi.getDeductions,
  createDeduction: collectionsApi.createDeduction,
});

export const useDashboard = () => ({
  dashboard: collectionsApi.dashboard,
});

export const useDisputes = () => ({
  getDisputes: collectionsApi.getDisputes,
  createDispute: collectionsApi.createDispute,
  updateDispute: collectionsApi.updateDispute,
});

