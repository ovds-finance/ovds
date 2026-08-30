/**
 * Vendors domain API client — @ovds/features/vendors
 */

import { createApiClient } from '@ovds/shared';

const api = createApiClient();

export const vendorsApi = {
  list:      (params: { companyId?: string | null; search?: string; page?: number; limit?: number } = {}) =>
    api.get<any>(`/ovds/vendors${api.qs(params)}`),
  get:       (id: string) => api.get<any>(`/ovds/vendors/${id}`),
  create:    (data: any) => api.post<any>('/ovds/vendors', data),
  update:    (id: string, data: any) => api.patch<any>(`/ovds/vendors/${id}`, data),
  remove:    (id: string) => api.del<void>(`/ovds/vendors/${id}`),
  bills:     (id: string, companyId?: string | null) =>
    api.get<any>(`/ovds/vendors/${id}/bills${api.qs({ companyId })}`),
  ledger:    (id: string, params: { dateFrom?: string; dateTo?: string; companyId?: string } = {}) =>
    api.get<any>(`/ovds/vendors/${id}/ledger${api.qs(params)}`),
  statement: (id: string) => api.get<any>(`/ovds/vendors/${id}/statement`),
};

export const vendorCategoriesApi = {
  list:   (companyId?: string | null) => api.get<any[]>(`/ovds/vendor-categories${api.qs({ companyId })}`),
  create: (data: any) => api.post<any>('/ovds/vendor-categories', data),
  remove: (id: string) => api.del<void>(`/ovds/vendor-categories/${id}`),
};
