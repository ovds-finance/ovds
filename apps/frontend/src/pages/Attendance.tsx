/**
 * Attendance — ovds-style attendance tracking
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian labour law · Biometric integration
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock, RefreshCw, Download, Calendar, CheckCircle2,
  XCircle, AlertTriangle, User, Fingerprint,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, SearchBar, EmptyState, Pagination,
} from '../components/ui';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  checkIn: string;
  checkOut?: string;
  method: string;
  status: string;
  overtimeHours?: number;
  verified?: boolean;
  createdAt: string;
}

type FilterTab = 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT';

const Attendance: React.FC = () => {
  usePageTitle('Attendance');
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const PAGE_SIZE = 25;

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['attendance', selectedCompanyId, page, dateFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), take: String(PAGE_SIZE) });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      if (dateFilter) params.set('date', dateFilter);
      return api.get(`/hr/attendance?${params}`).then((r: any) => r.data).catch(() => null);
    },
    staleTime: 30_000,
  });

  const rows: AttendanceRecord[] = useMemo(() => {
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? d : (d?.records ?? d?.data ?? []);
  }, [raw]);
  const total = raw?.total ?? rows.length;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(r => r.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => String(r.employeeName ?? r.employeeId ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                                    color: 'emerald' as const },
    { label: 'Present',  value: rows.filter(r => r.status === 'PRESENT').length,               color: 'sky' as const },
    { label: 'Late',     value: rows.filter(r => r.status === 'LATE').length,                  color: 'amber' as const },
    { label: 'Absent',   value: rows.filter(r => r.status === 'ABSENT').length,                color: 'rose' as const },
    { label: 'Overtime', value: `${rows.reduce((s, r) => s + (r.overtimeHours ?? 0), 0).toFixed(1)}h`, color: 'violet' as const },
  ], [rows]);

  const handleExport = () => {
    const headers = 'Employee,Check In,Check Out,Method,Status,Overtime\n';
    const csvRows = filtered.map(r =>
      `"${r.employeeName ?? r.employeeId}","${r.checkIn}","${r.checkOut ?? ''}","${r.method}","${r.status}",${r.overtimeHours ?? 0}`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `attendance-${dateFilter}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const METHOD_CLS: Record<string, string> = {
    BIOMETRIC: 'bg-violet-50 text-violet-700 border-violet-100',
    MANUAL:    'bg-white text-slate-600 border-slate-200',
    QR_CODE:   'bg-sky-50 text-sky-700 border-sky-100',
    MOBILE:    'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const formatTime = (dt: string) => {
    try { return new Date(dt).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' }); }
    catch { return dt; }
  };

  return (
    <AppPage
      title="Attendance"
      subtitle="Employee attendance tracking · Biometric integration · Manufacturing & Logistics · Healthcare & Pharmaceuticals · Retail & E-commerce · ERP · Consumer Insights"
      icon={<Clock size={18} />}
      crumbs={[{ label: 'Attendance' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',     label: 'All',     count: rows.length },
            { key: 'PRESENT', label: 'Present', count: rows.filter(r => r.status === 'PRESENT').length },
            { key: 'LATE',    label: 'Late',    count: rows.filter(r => r.status === 'LATE').length },
            { key: 'ABSENT',  label: 'Absent',  count: rows.filter(r => r.status === 'ABSENT').length },
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

      {/* Date filter + search */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
          />
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search employees…" className="w-48" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} records</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Employee</AppTh>
          <AppTh>Check In</AppTh>
          <AppTh>Check Out</AppTh>
          <AppTh>Method</AppTh>
          <AppTh align="right">Overtime</AppTh>
          <AppTh>Verified</AppTh>
          <AppTh>Status</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={7}><EmptyState icon={<Clock size={18} />} title="No attendance records" desc={`No records found for ${dateFilter}`} /></td></tr>
          ) : filtered.map(r => (
            <AppTr key={r.id}>
              <AppTd>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {String(r.employeeName ?? r.employeeId ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">{r.employeeName ?? r.employeeId}</span>
                </div>
              </AppTd>
              <AppTd><span className="font-mono text-[11px] text-slate-600">{formatTime(r.checkIn)}</span></AppTd>
              <AppTd>
                {r.checkOut
                  ? <span className="font-mono text-[11px] text-slate-600">{formatTime(r.checkOut)}</span>
                  : <span className="text-[10px] text-amber-500 font-semibold">Still in</span>
                }
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${METHOD_CLS[r.method] ?? METHOD_CLS.MANUAL}`}>
                  {r.method === 'BIOMETRIC' && <Fingerprint size={9} />}
                  {r.method}
                </span>
              </AppTd>
              <AppTd align="right">
                {(r.overtimeHours ?? 0) > 0
                  ? <span className="text-[11px] font-bold text-violet-600">{r.overtimeHours?.toFixed(1)}h</span>
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd>
                {r.verified
                  ? <CheckCircle2 size={13} className="text-emerald-500" />
                  : <XCircle size={13} className="text-slate-300" />
                }
              </AppTd>
              <AppTd><StatusBadge status={r.status} /></AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      {total > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}
    </AppPage>
  );
};

export default Attendance;

