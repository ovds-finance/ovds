import api from './api';
import type {
  ProjectionJournalRow,
  IfrsReportingBalanceRow,
} from '@ovds/features/reporting';

export type { ProjectionJournalRow, IfrsReportingBalanceRow } from '@ovds/features/reporting';

export type ProjectionEngine = 'PEACHTREE' | 'SIGTAX' | 'IFRS';
export type ReconciliationAdjustmentCode =
  | 'NON_DEDUCTIBLE_EXPENSE'
  | 'LEASE_ROU'
  | 'IFRS15_ADJ'
  | 'IFRS16_ADJ'
  | 'IAS38_ADJ'
  | 'INTERCO_ELIMINATION'
  | 'TAX_TIMING_DIFF'
  | 'DEFERRED_TAX'
  | 'NCI_ALLOCATION'
  | 'DEFAULT';

export const projectJournalEntry = async (
  journalEntryId: string,
  companyId: string,
  engine: ProjectionEngine = 'PEACHTREE',
) => {
  const { data } = await api.post(
    `/ovds/reconciliation/project/${journalEntryId}?companyId=${companyId}&engine=${engine}`,
  );
  return data;
};

export const getPeachtreeProjections = async (
  companyId: string,
  startDate?: string,
  endDate?: string,
) => {
  const { data } = await api.get('/ovds/reconciliation/peachtree', {
    params: { companyId, startDate, endDate },
  });
  return data as ProjectionJournalRow[];
};

export const getSigtaxProjections = async (
  companyId: string,
  startDate?: string,
  endDate?: string,
) => {
  const { data } = await api.get('/ovds/reconciliation/sigtax', {
    params: { companyId, startDate, endDate },
  });
  return data as ProjectionJournalRow[];
};

export const getIfrsReportingBalances = async (
  companyId: string,
  period?: string,
) => {
  const { data } = await api.get('/ovds/reconciliation/ifrs-balances', {
    params: { companyId, period },
  });
  return data as IfrsReportingBalanceRow[];
};

export const updateIfrsReportingBalance = async (
  companyId: string,
  balance: Omit<IfrsReportingBalanceRow, 'id' | 'companyId' | 'projectionEngine' | 'reconciledAt'>,
) => {
  const { data } = await api.post(`/ovds/reconciliation/ifrs-balances?companyId=${companyId}`, balance);
  return data;
};
