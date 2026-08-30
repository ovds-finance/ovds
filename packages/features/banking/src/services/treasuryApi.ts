/**
 * Treasury domain API client — @ovds/features/treasury
 *
 * Covers: Cash management, inter-company transfers, FX hedging,
 * investment portfolio, cash flow forecasting.
 */

import { createApiClient } from '@ovds/shared';

const api = createApiClient();

export const cashManagementApi = {
  summary:   (companyId?: string | null) =>
    api.get<any>(`/banking/treasury/summary${api.qs({ companyId })}`),
  cashflow:  (companyId?: string | null, period?: string) =>
    api.get<any>(`/banking/treasury/cashflow${api.qs({ companyId, period })}`),
  forecast:  (companyId?: string | null, days?: number) =>
    api.get<any>(`/banking/treasury/forecast${api.qs({ companyId, days })}`),
  positions: (companyId?: string | null) =>
    api.get<any[]>(`/banking/treasury/positions${api.qs({ companyId })}`),
};

export const transfersApi = {
  list:     (params: { companyId?: string | null; page?: number; limit?: number; status?: string } = {}) =>
    api.get<any>(`/banking/transfers${api.qs(params)}`),
  get:      (id: string) => api.get<any>(`/banking/transfers/${id}`),
  create:   (data: any) => api.post<any>('/banking/transfers', data),
  update:   (id: string, data: any) => api.patch<any>(`/banking/transfers/${id}`, data),
  cancel:   (id: string) => api.post<any>(`/banking/transfers/${id}/cancel`),
  approve:  (id: string) => api.post<any>(`/banking/transfers/${id}/approve`),
};

export const fxHedgingApi = {
  list:   (companyId?: string | null) => api.get<any[]>(`/banking/treasury/fx-hedging${api.qs({ companyId })}`),
  create: (data: any) => api.post<any>('/banking/treasury/fx-hedging', data),
  update: (id: string, data: any) => api.patch<any>(`/banking/treasury/fx-hedging/${id}`, data),
  remove: (id: string) => api.del<void>(`/banking/treasury/fx-hedging/${id}`),
};
