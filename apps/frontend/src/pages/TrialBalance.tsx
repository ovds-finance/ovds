import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AppPage, Btn, Icon, FormField, Input, AppTable, AppTr, AppTd, AppTh,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { downloadBlob } from '../utils/download';
import toast from 'react-hot-toast';

interface TrialBalanceLine {
  id: string;
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

interface TrialBalanceData {
  date: string;
  accounts: TrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const TrialBalance: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrialBalanceData | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateParam = searchParams.get('date') || todayStr;
  const [date, setDate] = useState(dateParam);
  const companyId = searchParams.get('companyId') || selectedCompanyId || undefined;

  const fetchData = useCallback(async (d: string, cId?: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ date: d });
      if (cId) q.set('companyId', cId);
      const res = await api.get(`/ovds/reports/trial-balance?${q}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data;
      setData({
        date: raw.date || d,
        accounts: raw.accounts || [],
        totalDebits: raw.totals?.debit ?? 0,
        totalCredits: raw.totals?.credit ?? 0,
        isBalanced: raw.isBalanced ?? Math.abs((raw.totals?.debit ?? 0) - (raw.totals?.credit ?? 0)) < 0.01,
      });
    } catch {
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(date, companyId);
  }, [date, companyId, fetchData]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('date', newDate);
      if (companyId) next.set('companyId', companyId);
      return next;
    });
  };

  const handleExportPdf = async () => {
    try {
      const q = new URLSearchParams({
        report: 'trial-balance',
        format: 'pdf',
        date,
        companyId: companyId || '',
      });
      const res = await api.get(`/ovds/reports/export-pdf?${q}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      downloadBlob(blob, `trial-balance-${date}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const totalDebits = data?.totalDebits ?? 0;
  const totalCredits = data?.totalCredits ?? 0;
  const isBalanced = data?.isBalanced ?? Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <AppPage
      title="Trial Balance"
      subtitle={`As at ${data?.date ? new Date(data.date).toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <FormField label="As of">
            <Input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} className="w-36 text-xs mb-0" />
          </FormField>
          <Btn variant="secondary" size="sm" onClick={() => fetchData(date, companyId)} icon={<Icon name="REFRESH_CW" size={11} />}>
            Refresh
          </Btn>
          <Btn variant="primary" size="sm" onClick={handleExportPdf} icon={<Icon name="DOWNLOAD" size={11} />}>
            Export PDF
          </Btn>
        </div>
      }
    >
      {data && (
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border text-xs mb-6 ${
            isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <Icon name={isBalanced ? 'SUCCESS' : 'WARNING'} size={13} />
          <span className="font-semibold">
            {isBalanced
              ? 'Trial Balance is balanced — Total Debits = Total Credits'
              : 'IMBALANCE DETECTED: Total Debits ≠ Total Credits'}
          </span>
          {!isBalanced && (
            <span className="ml-auto font-mono text-[11px]">
              Diff: ETB {fmt(Math.abs(totalDebits - totalCredits))}
            </span>
          )}
        </div>
      )}

      <div className="ovds-grid-layout cols-4 gap-sm mb-6">
        {[
          { label: 'Total Debits', value: totalDebits, color: 'text-emerald-600' },
          { label: 'Total Credits', value: totalCredits, color: 'text-rose-600' },
          { label: 'Accounts', value: data?.accounts?.length ?? 0, color: 'text-blue-600' },
          { label: 'Balanced', value: isBalanced ? 100 : 0, suffix: '%', color: isBalanced ? 'text-emerald-600' : 'text-rose-600' },
        ].map((k, i) => (
          <div key={i} className="ovds-widget-card p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            {loading ? (
              <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                {k.suffix ? `${k.value}${k.suffix}` : k.label === 'Accounts' ? k.value : `ETB ${fmt(k.value)}`}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="ovds-widget-card overflow-hidden">
        <AppTable>
          <thead>
            <tr>
              <AppTh>Code</AppTh>
              <AppTh>Account Name</AppTh>
              <AppTh>Type</AppTh>
              <AppTh align="right">Debit (ETB)</AppTh>
              <AppTh align="right">Credit (ETB)</AppTh>
              <AppTh align="right">Net Balance</AppTh>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                  No trial balance data available.
                </td>
              </tr>
            ) : (
              data.accounts.map((a, i) => {
                const balance = Number(a.netBalance ?? 0);
                const isDebit = balance > 0;
                return (
                  <AppTr key={a.id || i}>
                    <AppTd>
                      <span className="font-mono text-[11px] text-slate-500">{a.code || '—'}</span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{a.name || '—'}</span>
                    </AppTd>
                    <AppTd>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
                        {a.type || '—'}
                      </span>
                    </AppTd>
                    <AppTd align="right">
                      <span className={`tabular-nums text-[12px] ${isDebit ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                        {isDebit ? fmt(balance) : '—'}
                      </span>
                    </AppTd>
                    <AppTd align="right">
                      <span className={`tabular-nums text-[12px] ${!isDebit ? 'text-rose-700 font-semibold' : 'text-slate-400'}`}>
                        {!isDebit ? fmt(Math.abs(balance)) : '—'}
                      </span>
                    </AppTd>
                    <AppTd align="right">
                      <span className={`tabular-nums text-[12px] font-bold ${balance >= 0 ? 'text-slate-700 dark:text-slate-200' : 'text-rose-600'}`}>
                        {fmt(Math.abs(balance))}
                      </span>
                    </AppTd>
                  </AppTr>
                );
              })
            )}
            {data && data.accounts.length > 0 && (
              <tr className="bg-slate-800 dark:bg-slate-700 text-white">
                <td colSpan={3} className="px-4 py-3 font-black text-sm">TOTALS</td>
                <td align="right" className="px-4 py-3 tabular-nums text-sm font-bold text-emerald-400">
                  {fmt(totalDebits)}
                </td>
                <td align="right" className="px-4 py-3 tabular-nums text-sm font-bold text-rose-400">
                  {fmt(totalCredits)}
                </td>
                <td align="right" className="px-4 py-3 tabular-nums text-sm font-bold text-slate-300">
                  {fmt(Math.abs(totalDebits - totalCredits))}
                </td>
              </tr>
            )}
          </tbody>
        </AppTable>
      </div>

      {!data && !loading && (
        <div className="text-center py-10 text-sm text-slate-400">
          No trial balance data available. Ensure journal entries are posted.
        </div>
      )}
    </AppPage>
  );
};

export default TrialBalance;
