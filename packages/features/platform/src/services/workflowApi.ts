/**
 * Workflow domain API client — @ovds/features/workflow
 *
 * Covers: Period-close workflow, workflow catalog, approval chains,
 * automated task runner.
 */

import { createApiClient } from '@ovds/shared';

const api = createApiClient();

export const workflowApi = {
  catalog:    (companyId: string, period?: string) =>
    api.get<any>(`/ovds/workflow/catalog${api.qs({ companyId, period })}`),
  getRun:     (companyId: string, period: string) =>
    api.get<any>(`/ovds/workflow/${period}${api.qs({ companyId })}`),
  runAll:     (companyId: string, period: string) =>
    api.post<any>(`/ovds/workflow/${period}/run?companyId=${companyId}`),
  runTask:    (companyId: string, period: string, taskId: string) =>
    api.post<any>(`/ovds/workflow/${period}/run/${taskId}?companyId=${companyId}`),
  resetRun:   (companyId: string, period: string) =>
    api.post<any>(`/ovds/workflow/${period}/reset?companyId=${companyId}`),
  summary:    (companyId: string, period: string) =>
    api.get<any>(`/ovds/workflow/${period}/summary${api.qs({ companyId })}`),
  runUnified: (companyId: string, year: number, month: number) =>
    api.post<any>(`/ovds/workflow/${year}-${String(month).padStart(2, '0')}/run-unified`, { companyId }),
  profile:    (companyId?: string | null) =>
    api.get<any>(`/ovds/workflow-profile${api.qs({ companyId })}`),
};
