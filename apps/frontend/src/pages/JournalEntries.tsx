import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, StatusBadge, Modal, Input, Select,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface JournalLine {
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: string;
  companyId?: string;
  journalLine: JournalLine[];
  totalDebit: number;
  totalCredit: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const JournalEntries: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const companyId = selectedCompanyId || undefined;
  const limit = 20;

  const fetchEntries = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        companyId,
      });
      if (search) params.set('search', search);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/double-entry/journals?${params}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setEntries(list);
      setTotal(raw?.total ?? raw?.totalRecords ?? list.length);
    } catch {
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, [companyId, page, search, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleView = async (entry: JournalEntry) => {
    try {
      const res = await api.get(`/double-entry/journals/${entry.id}`, {
        headers: { 'x-background': '1' },
      });
      const detail = res.data?.data ?? res.data;
      setSelectedEntry(detail);
      setModalOpen(true);
    } catch {
      toast.error('Failed to load journal entry detail');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry? This action cannot be undone.')) return;
    try {
      await api.delete(`/double-entry/journals/${id}`);
      toast.success('Journal entry deleted');
      fetchEntries();
    } catch {
      toast.error('Failed to delete journal entry');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <AppPage
      title="Journal Entries"
      subtitle="Manual journal entries · General ledger"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
            className="w-36 text-xs"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
            className="w-36 text-xs"
            placeholder="To"
          />
          <Input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-40 text-xs"
            placeholder="Search reference…"
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e); }}
            className="text-xs w-32"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Btn variant="secondary" size="sm" onClick={fetchEntries} icon={<Icon name="REFRESH_CW" size={11} />}>
            Refresh
          </Btn>
          <Link to="/double-entry">
            <Btn variant="primary" size="sm" icon={<Icon name="PLUS" size={11} />}>
              New Entry
            </Btn>
          </Link>
        </div>
      }
    >
      <div className="ovds-widget-card overflow-hidden">
        <AppTable>
          <thead>
            <tr>
              <AppTh>Date</AppTh>
              <AppTh>Reference</AppTh>
              <AppTh>Description</AppTh>
              <AppTh>Lines</AppTh>
              <AppTh align="right">Debit</AppTh>
              <AppTh align="right">Credit</AppTh>
              <AppTh>Status</AppTh>
              <AppTh align="right">Actions</AppTh>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                  No journal entries found. Create your first entry in Double-Entry.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const dr = entry.journalLine?.reduce((s, l) => s + Number(l.debit || 0), 0) ?? 0;
                const cr = entry.journalLine?.reduce((s, l) => s + Number(l.credit || 0), 0) ?? 0;
                const isBalanced = Math.abs(dr - cr) < 0.01;
                return (
                  <AppTr key={entry.id}>
                    <AppTd>
                      <span className="text-[11px] text-slate-500">
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-ET') : '—'}
                      </span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[12px] font-mono text-slate-600 dark:text-slate-300">{entry.reference || '—'}</span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[12px] text-slate-700 dark:text-slate-200">{entry.description || '—'}</span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[11px] text-slate-500">{entry.journalLine?.length ?? 0} lines</span>
                    </AppTd>
                    <AppTd align="right">
                      <span className="tabular-nums text-[12px] text-emerald-700">{fmt(dr)}</span>
                    </AppTd>
                    <AppTd align="right">
                      <span className="tabular-nums text-[12px] text-rose-700">{fmt(cr)}</span>
                    </AppTd>
                    <AppTd>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        entry.status === 'POSTED'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : entry.status === 'DRAFT'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}>
                        {isBalanced && entry.status === 'POSTED' ? '● ' : ''}
                        {entry.status}
                      </span>
                    </AppTd>
                    <AppTd align="right">
                      <div className="flex items-center gap-1 justify-end">
                        <Btn variant="ghost" size="sm" onClick={() => handleView(entry)} icon={<Icon name="EYE" size={11} />} />
                        {entry.status === 'DRAFT' && (
                          <Btn variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} icon={<Icon name="TRASH" size={11} />} />
                        )}
                      </div>
                    </AppTd>
                  </AppTr>
                );
              })
            )}
          </tbody>
        </AppTable>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <Btn variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Btn>
          <span className="text-[11px] text-slate-400">Page {page} of {totalPages} ({total} entries)</span>
          <Btn variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </Btn>
        </div>
      )}

      {/* Detail Modal */}
      {modalOpen && selectedEntry && (
        <Modal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedEntry(null); }}
          title={`Journal Entry ${selectedEntry.reference || selectedEntry.id}`}
          footer={
            <div className="flex items-center gap-2">
              <Btn variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Close</Btn>
              {selectedEntry.status === 'DRAFT' && (
                <Btn variant="danger" size="sm" onClick={() => { handleDelete(selectedEntry.id); setModalOpen(false); }}>
                  Delete
                </Btn>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString('en-ET') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reference</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedEntry.reference || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedEntry.description || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                <StatusBadge status={selectedEntry.status} />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Journal Lines</p>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Account</AppTh>
                    <AppTh>Description</AppTh>
                    <AppTh align="right">Debit</AppTh>
                    <AppTh align="right">Credit</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntry.journalLine?.map((line, i) => (
                    <AppTr key={i}>
                      <AppTd>
                        <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">
                          {line.accountCode ? `${line.accountCode} — ${line.accountName || '—'}` : line.accountId}
                        </span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-500">{line.description || '—'}</span>
                      </AppTd>
                      <AppTd align="right">
                        <span className="tabular-nums text-[12px] text-emerald-700">{fmt(Number(line.debit))}</span>
                      </AppTd>
                      <AppTd align="right">
                        <span className="tabular-nums text-[12px] text-rose-700">{fmt(Number(line.credit))}</span>
                      </AppTd>
                    </AppTr>
                  ))}
                </tbody>
              </AppTable>
            </div>
          </div>
        </Modal>
      )}
    </AppPage>
  );
};

export default JournalEntries;

