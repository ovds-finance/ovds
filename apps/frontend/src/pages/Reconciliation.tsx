/**
 * Reconciliation — Projection Layer (Peachtree / SIGTAX / IFRS)
 *
 * Consumes:
 *   GET  /ovds/reconciliation/peachtree
 *   GET  /ovds/reconciliation/sigtax
 *   GET  /ovds/reconciliation/ifrs-balances
 *   POST /ovds/reconciliation/project/:journalEntryId
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Card, Amount, EmptyState, SearchBar, Modal, Input,
} from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import toast from 'react-hot-toast';
import {
  getPeachtreeProjections,
  getSigtaxProjections,
  getIfrsReportingBalances,
  projectJournalEntry,
} from '../services/reconciliationApi';
import {
  type ProjectionJournalRow,
  type IfrsReportingBalanceRow,
} from '@ovds/features/reporting';

type TabKey = 'peachtree' | 'sigtax' | 'ifrs';

const TABS = [
  { key: 'peachtree' as TabKey, label: 'Peachtree' },
  { key: 'sigtax' as TabKey, label: 'SIGTAX' },
  { key: 'ifrs' as TabKey, label: 'IFRS Balances' },
];

const Reconciliation: React.FC = () => {
  usePageTitle('Reconciliation — Projection Layer');
  const { user } = useAuth();
  const { selectedCompanyId: companyId } = useBusiness();

  const [tab, setTab] = useState<TabKey>('peachtree');
  const [peachtreeData, setPeachtreeData] = useState<ProjectionJournalRow[]>([]);
  const [sigtaxData, setSigtaxData] = useState<ProjectionJournalRow[]>([]);
  const [ifrsData, setIfrsData] = useState<IfrsReportingBalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [pt, st, ifrs] = await Promise.all([
        getPeachtreeProjections(companyId),
        getSigtaxProjections(companyId),
        getIfrsReportingBalances(companyId),
      ]);
      setPeachtreeData(pt);
      setSigtaxData(st);
      setIfrsData(ifrs);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const [journalEntryId, setJournalEntryId] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);

  const handleProject = async () => {
    if (!companyId) return;
    setShowProjectModal(true);
  };

  const confirmProject = async () => {
    if (!companyId || !journalEntryId.trim()) return;
    const engine = tab === 'ifrs' ? 'IFRS' : tab.toUpperCase();
    try {
      await projectJournalEntry(journalEntryId.trim(), companyId, engine as any);
      toast.success(`Projected ${journalEntryId.trim()} to ${engine}`);
      setShowProjectModal(false);
      setJournalEntryId('');
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Projection failed');
    }
  };

  const peachtreeFiltered = peachtreeData.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return row.canonicalJournalEntryId.toLowerCase().includes(q) || row.reconciliationAdjustmentCode.toLowerCase().includes(q);
  });

  const sigtaxFiltered = sigtaxData.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return row.canonicalJournalEntryId.toLowerCase().includes(q) || row.reconciliationAdjustmentCode.toLowerCase().includes(q);
  });

  const ifrsFiltered = ifrsData.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return row.accountCode.toLowerCase().includes(q) || row.accountName.toLowerCase().includes(q) || row.period.toLowerCase().includes(q);
  });

  return (
    <AppPage title="Reconciliation — Projection Layer" subtitle="Peachtree / SIGTAX / IFRS read models">
      <AppTabs tabs={TABS} active={tab} onChange={(key) => setTab(key as TabKey)} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search..." />
        <Btn onClick={handleProject} variant="primary">
          Project Journal Entry
        </Btn>
      </div>

      <Modal
        open={showProjectModal}
        onClose={() => { setShowProjectModal(false); setJournalEntryId(''); }}
        title="Project Journal Entry"
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setShowProjectModal(false); setJournalEntryId(''); }}>Cancel</Btn>
            <Btn onClick={confirmProject} variant="primary">Project</Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Journal Entry ID</label>
          <Input
            value={journalEntryId}
            onChange={(e: any) => setJournalEntryId(e.target.value)}
            placeholder="Enter journal entry ID..."
            autoFocus
          />
        </div>
      </Modal>

      {tab === 'peachtree' && (
        <Card>
          <AppTable>
            <AppTh>Journal Entry</AppTh>
            <AppTh>Engine</AppTh>
            <AppTh>Adjustment</AppTh>
            <AppTh>Debit</AppTh>
            <AppTh>Credit</AppTh>
            <AppTh>Reconciled At</AppTh>
          </AppTable>
          {peachtreeFiltered.length === 0 ? (
            <EmptyState title="No Peachtree projections" desc="Project a journal entry to populate this view." />
          ) : (
            peachtreeFiltered.map((row) => (
              <AppTr key={row.id}>
                <AppTd>{row.canonicalJournalEntryId}</AppTd>
                <AppTd>{row.projectionEngine}</AppTd>
                <AppTd>{row.reconciliationAdjustmentCode}</AppTd>
                <AppTd><Amount value={row.adjustedDebit} /></AppTd>
                <AppTd><Amount value={row.adjustedCredit} /></AppTd>
                <AppTd>{new Date(row.reconciledAt).toLocaleString()}</AppTd>
              </AppTr>
            ))
          )}
        </Card>
      )}

      {tab === 'sigtax' && (
        <Card>
          <AppTable>
            <AppTh>Journal Entry</AppTh>
            <AppTh>Engine</AppTh>
            <AppTh>Adjustment</AppTh>
            <AppTh>Debit</AppTh>
            <AppTh>Credit</AppTh>
            <AppTh>Reconciled At</AppTh>
          </AppTable>
          {sigtaxFiltered.length === 0 ? (
            <EmptyState title="No SIGTAX projections" desc="Project a journal entry to populate this view." />
          ) : (
            sigtaxFiltered.map((row) => (
              <AppTr key={row.id}>
                <AppTd>{row.canonicalJournalEntryId}</AppTd>
                <AppTd>{row.projectionEngine}</AppTd>
                <AppTd>{row.reconciliationAdjustmentCode}</AppTd>
                <AppTd><Amount value={row.adjustedDebit} /></AppTd>
                <AppTd><Amount value={row.adjustedCredit} /></AppTd>
                <AppTd>{new Date(row.reconciledAt).toLocaleString()}</AppTd>
              </AppTr>
            ))
          )}
        </Card>
      )}

      {tab === 'ifrs' && (
        <Card>
          <AppTable>
            <AppTh>Period</AppTh>
            <AppTh>Account</AppTh>
            <AppTh>Name</AppTh>
            <AppTh>Type</AppTh>
            <AppTh>Opening</AppTh>
            <AppTh>Debit</AppTh>
            <AppTh>Credit</AppTh>
            <AppTh>Closing</AppTh>
          </AppTable>
          {ifrsFiltered.length === 0 ? (
            <EmptyState title="No IFRS balances" desc="IFRS reporting balances will appear here." />
          ) : (
            ifrsFiltered.map((row) => (
              <AppTr key={row.id}>
                <AppTd>{row.period}</AppTd>
                <AppTd>{row.accountCode}</AppTd>
                <AppTd>{row.accountName}</AppTd>
                <AppTd>{row.accountType}</AppTd>
                <AppTd><Amount value={row.openingBalance} /></AppTd>
                <AppTd><Amount value={row.periodDebit} /></AppTd>
                <AppTd><Amount value={row.periodCredit} /></AppTd>
                <AppTd><Amount value={row.closingBalance} /></AppTd>
              </AppTr>
            ))
          )}
        </Card>
      )}
    </AppPage>
  );
};

export default Reconciliation;
