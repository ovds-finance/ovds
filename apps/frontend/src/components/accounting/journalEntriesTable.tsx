import { Skeleton } from '@ovds/ui';
import { Button } from '@ovds/ui';
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  FileText,
  Eye,
  Repeat,
  Plus,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

import JournalEntryForm from './journalEntryForm';

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'VOID';
  linesCount: number;
  lines?: { accountId: string; description: string; debit: number; credit: number }[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  updatedAt: string;
  isRecurring: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const JournalEntriesTable: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    recurring: false,
  });
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const loadEntries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.status && { status: filters.status }),
      });

      const [entriesRes, accountsRes] = await Promise.all([
        api.get(`/ovds/journal-entries?${params}`),
        api.get('/ovds/accounts'),
      ]);

      const entriesRaw = entriesRes.data?.data || entriesRes.data;
      setEntries(Array.isArray(entriesRaw) ? entriesRaw : entriesRaw?.entries ?? entriesRaw?.data ?? []);
      setPagination({
        page,
        ...(entriesRaw?.pagination || { limit: 50, total: Array.isArray(entriesRaw) ? entriesRaw.length : 0, pages: 1 }),
      });
      const accsRaw = accountsRes.data?.data || accountsRes.data;
      setAccounts(Array.isArray(accsRaw) ? accsRaw : accsRaw?.data ?? []);
    } catch {
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const debouncedSearch = (query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setFilters({ ...filters, search: query });
    }, 300);
    setSearchTimeout(timeout);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this journal entry? This action cannot be undone.')) return;
    try {
      await api.delete(`/ovds/journal-entries/${id}`);
      toast.success('Journal entry deleted');
      loadEntries(pagination.page);
    } catch {
      toast.error('Failed to delete journal entry');
    }
  };

  useEffect(() => {
    loadEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (loading) {
    return <Skeleton.Table rows={10} cols={6} />;
  }

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <FileText size={28} />
            Journal Entries
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {pagination.total} total
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, description..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 w-64 text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="VOID">Void</option>
          </select>

          <Button size="sm" variant="outline">
            <Filter size={14} />
            More Filters
          </Button>

          {canWrite && (
            <Button size="sm">
              <Plus size={14} />
              New Entry
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ovds-widget-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ovds-table w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-8 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Debit</th>
                <th className="px-8 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Credit</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-700">
                    {fmtDate(entry.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-semibold text-slate-800 text-sm bg-slate-100 px-2 py-1 rounded-md inline-block">
                      {entry.reference || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate" title={entry.description}>
                      {entry.description || '—'}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right text-sm font-semibold text-[var(--pro-azure-dark)]">
                    {entry.totalDebit.toLocaleString()}
                  </td>
                  <td className="px-8 py-4 text-right text-sm font-semibold text-sky-700">
                    {entry.totalCredit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.status === 'POSTED' ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' :
                      entry.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {entry.status}
                    </span>
                    {entry.isRecurring && (
                      <Repeat size={12} className="ml-1 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] inline" aria-label="Recurring template" />
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <Eye size={14} />
                      </button>
                      {canWrite && entry.status === 'DRAFT' && (
                        <>
                          <button 
                            onClick={() => setEditingEntry(entry)}
                            className="p-1.5 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-100)] rounded-lg transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadEntries(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => loadEntries(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <JournalEntryForm
          entry={editingEntry as any}
          accounts={accounts}
          onSave={() => {
            setEditingEntry(null);
            loadEntries(pagination.page);
          }}
          onCancel={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
};

export default JournalEntriesTable;








