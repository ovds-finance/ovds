/**
 * AuditLogs — ovds-style audit trail viewer
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import { useQuery } from '@tanstack/react-query';
import { History, RefreshCw, Download, Clock } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, SearchBar, EmptyState, Pagination,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  companyId?: string;
  details?: string;
  createdAt: string;
  user?: { username: string };
}

type FilterTab = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH';

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  UPDATE: 'bg-sky-50 text-sky-700 border-sky-100',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-100',
  LOGIN:  'bg-violet-50 text-violet-700 border-violet-100',
  LOGOUT: 'bg-white text-slate-600 border-slate-200',
};

const getActionGroup = (action: string): FilterTab => {
  const a = action.toUpperCase();
  if (a.includes('CREATE') || a.includes('ADD') || a.includes('SEED')) return 'CREATE';
  if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('PATCH')) return 'UPDATE';
  if (a.includes('DELETE') || a.includes('REMOVE')) return 'DELETE';
  if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('AUTH')) return 'AUTH';
  return 'ALL';
};

const AuditLogs: React.FC = () => {
  usePageTitle('Audit Logs');
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', selectedCompanyId, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), take: String(PAGE_SIZE) });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      return api.get(`/dashboard/audit-logs?${params}`).then((r: any) => r.data).catch(() => null);
    },
    staleTime: 30_000,
  });

  const rows: AuditLog[] = useMemo(() => {
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? d : (d?.logs ?? d?.data ?? []);
  }, [raw]);
  const total = raw?.total ?? rows.length;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(l => getActionGroup(l.action) === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => [l.action, l.details, l.user?.username].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',   value: rows.length,                                                    color: 'green' as const },
    { label: 'Creates', value: rows.filter(l => getActionGroup(l.action) === 'CREATE').length, color: 'sky' as const },
    { label: 'Updates', value: rows.filter(l => getActionGroup(l.action) === 'UPDATE').length, color: 'amber' as const },
    { label: 'Deletes', value: rows.filter(l => getActionGroup(l.action) === 'DELETE').length, color: 'rose' as const },
  ], [rows]);

  const handleExport = () => {
    const headers = 'Action,User,Details,Date\n';
    const csvRows = filtered.map(l =>
      `"${l.action}","${l.user?.username ?? l.userId}","${l.details ?? ''}","${l.createdAt}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Audit Logs"
      subtitle="Complete system activity trail · IFRS audit readiness · Banking & ovds · IT & Software · Healthcare & Pharmaceuticals · Challenges Analysis · Strategic Insights"
      icon={<History size={18} />}
      crumbs={[{ label: 'System Administration' }, { label: 'Audit Trail & IoT Logs' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',    label: 'All',     count: rows.length },
            { key: 'CREATE', label: 'Creates', count: rows.filter(l => getActionGroup(l.action) === 'CREATE').length },
            { key: 'UPDATE', label: 'Updates', count: rows.filter(l => getActionGroup(l.action) === 'UPDATE').length },
            { key: 'DELETE', label: 'Deletes', count: rows.filter(l => getActionGroup(l.action) === 'DELETE').length },
            { key: 'AUTH',   label: 'Auth',    count: rows.filter(l => getActionGroup(l.action) === 'AUTH').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search actions, users…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} entries</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Action</AppTh>
          <AppTh>User</AppTh>
          <AppTh>Details</AppTh>
          <AppTh>Timestamp</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={4}><EmptyState icon={<History size={18} />} title="No audit logs" desc="System activity will appear here" /></td></tr>
          ) : filtered.map(log => {
            const group = getActionGroup(log.action);
            const colorCls = ACTION_COLOR[group] ?? ACTION_COLOR.LOGIN;
            return (
              <AppTr key={log.id}>
                <AppTd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${colorCls}`}>
                    {log.action}
                  </span>
                </AppTd>
                <AppTd>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {(log.user?.username ?? log.userId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] text-slate-700">{log.user?.username ?? log.userId.slice(0, 8) + '…'}</span>
                  </div>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500 truncate block max-w-[300px]">{log.details ?? '—'}</span>
                </AppTd>
                <AppTd>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={9} className="text-slate-300" />
                    {new Date(log.createdAt).toLocaleString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>
      {total > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}
    </AppPage>
  );
};

export default AuditLogs;

