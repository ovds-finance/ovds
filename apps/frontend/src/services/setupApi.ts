import type { SetupStepDefinition, SetupStepStatus, CompanySetupProgress, SetupWizardCompleteResponse } from '@ovds/shared';

import api from './api';

export type { SetupStepDefinition, SetupStepStatus, CompanySetupProgress, SetupWizardCompleteResponse };

export const setupApi = {
  listSteps: async (): Promise<SetupStepDefinition[]> => {
    const res = await api.get('/settings/setup/steps');
    return res.data?.data ?? res.data;
  },

  listStepsByCategory: async (): Promise<Record<string, SetupStepDefinition[]>> => {
    const res = await api.get('/settings/setup/steps-by-category');
    return res.data?.data ?? res.data;
  },

  getProgress: async (companyId: string): Promise<CompanySetupProgress> => {
    const res = await api.get(`/settings/setup/progress/${companyId}`);
    return res.data?.data ?? res.data;
  },

  startWizard: async (companyId: string): Promise<{ companyId: string; steps: SetupStepDefinition[]; progress: CompanySetupProgress }> => {
    const res = await api.post(`/settings/setup/start/${companyId}`);
    return res.data?.data ?? res.data;
  },

  completeStep: async (companyId: string, stepKey: string, data?: Record<string, string>): Promise<CompanySetupProgress> => {
    const res = await api.post(`/settings/setup/complete-step/${companyId}/${stepKey}`, { data });
    return res.data?.data ?? res.data;
  },

  skipStep: async (companyId: string, stepKey: string): Promise<CompanySetupProgress> => {
    const res = await api.post(`/settings/setup/skip-step/${companyId}/${stepKey}`);
    return res.data?.data ?? res.data;
  },

  getSummary: async (companyId: string): Promise<SetupWizardCompleteResponse> => {
    const res = await api.get(`/settings/setup/summary/${companyId}`);
    return res.data?.data ?? res.data;
  },

  resetProgress: async (companyId: string): Promise<{ success: boolean; progress: CompanySetupProgress }> => {
    const res = await api.delete(`/settings/setup/reset/${companyId}`);
    return res.data?.data ?? res.data;
  },

  undoStep: async (companyId: string, stepKey: string): Promise<CompanySetupProgress> => {
    const res = await api.patch(`/settings/setup/undo-step/${companyId}/${stepKey}`);
    return res.data?.data ?? res.data;
  },

  syncComplianceSteps: async (
    companyId: string,
    opts?: { eimsReady?: boolean; securityScore?: number },
  ): Promise<{ progress: CompanySetupProgress; synced: string[] }> => {
    const res = await api.post(`/settings/setup/sync-compliance/${companyId}`, opts ?? {});
    return res.data?.data ?? res.data;
  },

  seedRbac: async (companyId: string): Promise<{ roles: { created: number; skipped: number }; permissions: { created: number; skipped: number } }> => {
    const [rolesRes, permsRes] = await Promise.all([
      api.post('/settings/rbac/roles/seed', { companyId }),
      api.post('/settings/rbac/permissions/seed', { companyId }),
    ]);
    return {
      roles: rolesRes.data?.data ?? rolesRes.data,
      permissions: permsRes.data?.data ?? permsRes.data,
    };
  },
};

export default setupApi;
