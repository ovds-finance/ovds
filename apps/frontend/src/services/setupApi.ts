import api from './api';
import type { SetupStepDefinition, SetupStepStatus, CompanySetupProgress, SetupWizardCompleteResponse } from '@ovds/shared';

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
};

export default setupApi;
