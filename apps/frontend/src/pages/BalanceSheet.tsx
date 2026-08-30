import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AppPage, Btn, Icon, FormField, Input,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { downloadBlob } from '../utils/download';
import toast from 'react-hot-toast';

interface BalanceSheetLine {
  id?: string;
  code: string;
  name: string;
  balance: number;
  level?: number;
  isTotal?: boolean;
}

interface BalanceSheetData {
  date: string;
  assets: { items: BalanceSheetLine[]; total: number };
  liabilities: { items: BalanceSheetLine[]; total: number };
  equity: { items: BalanceSheetLine[]; total: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const BalanceSheet: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [comparative, setComparative] = useState(false);
  const [priorData, setPriorData] = useState<BalanceSheetData | null>(null);

  const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(dateParam);
  const companyId = searchParams.get('companyId') || selectedCompanyId || undefined;

  const fetchData = useCallback(async (d: string, cId?: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ date: d });
      if (cId) q.set('companyId', cId);
      if (comparative) q.set('comparePriorYear', 'true');

      const endpoint = comparative
        ? `/ovds/reports/balance-sheet-comparative`
        : `/ovds/reports/balance-sheet`;

      const res = await api.get(`${endpoint}?${q}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data;

      if (comparative && raw?.current) {
        setData({
          date: raw.currentDate || d,
          assets: raw.current.assets || { items: [], total: 0 },
          liabilities: raw.current.liabilities || { items: [], total: 0 },
          equity: raw.current.equity || { items: [], total: 0 },
        });
        setPriorData(
          raw.prior
            ? {
                date: raw.priorDate || d,
                assets: raw.prior.assets || { items: [], total: 0 },
                liabilities: raw.prior.liabilities || { items: [], total: 0 },
                equity: raw.prior.equity || { items: [], total: 0 },
              }
            : null,
        );
      } else {
        setData({
          date: raw.date || d,
          assets: raw.assets || { items: [], total: 0 },
          liabilities: raw.liabilities || { items: [], total: 0 },
          equity: raw.equity || { items: [], total: 0 },
        });
        setPriorData(null);
      }
    } catch {
      toast.error('Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  }, [comparative]);

  useEffect(() => {
    fetchData(date, companyId);
  }, [date, comparative, companyId, fetchData]);

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
        report: 'balance-sheet',
        format: 'pdf',
        date,
        companyId: companyId || '',
      });
      const res = await api.get(`/ovds/reports/export-pdf?${q}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      downloadBlob(blob, `balance-sheet-${date}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const renderSection = (
    title: string,
    lines: BalanceSheetLine[],
    total: number,
    accent: string,
    priorLines?: BalanceSheetLine[],
    priorTotal?: number,
  ) => (
    <div className="space-y-1">
      <div className={`px-4 py-2 rounded-lg ${accent}`}>
        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          {title}
        </p>
      </div>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between px-4 py-1.5">
            <div className="h-3 bg-slate-100 rounded animate-pulse w-48" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-24" />
          </div>
        ))
      ) : (
        lines.map((l, i) => {
          const prior = priorLines?.find((p) => p.code === l.code);
          return (
            <div
              key={i}
              className={`flex justify-between px-4 py-1.5 ${
                l.isTotal
                  ? 'border-t border-slate-200 font-bold bg-slate-50/80 dark:bg-slate-800/50'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
              } transition-colors`}
              style={{ paddingLeft: `${1 + (l.level || 0) * 1.5}rem` }}
            >
              <span
                className={`flex-1 ${l.isTotal ? 'text-sm font-bold text-slate-800 dark:text-slate-100' : 'text-[12px] text-slate-600 dark:text-slate-300'}`}
              >
                {l.code && !l.isTotal && (
                  <span className="font-mono text-[10px] text-slate-300 mr-2">{l.code}</span>
                )}
                {l.name}
              </span>
              <span
                className={`tabular-nums ${l.isTotal ? 'text-sm font-bold text-slate-700 dark:text-slate-200' : 'text-[12px] font-medium text-slate-700 dark:text-slate-200'} min-w-[90px] text-right`}
              >
                {l.balance < 0 ? `(${fmt(Math.abs(l.balance))})` : fmt(l.balance)}
              </span>
              {comparative && prior && (
                <span className="tabular-nums text-[11px] text-slate-400 min-w-[90px] text-right ml-3">
                  {prior.balance < 0 ? `(${fmt(Math.abs(prior.balance))})` : fmt(prior.balance)}
                </span>
              )}
            </div>
          );
        })
      )}
      <div className="flex justify-between px-4 py-2 bg-slate-800 dark:bg-slate-700 rounded-lg mt-1">
        <span className="text-sm font-black text-white flex-1">TOTAL {title}</span>
        <span className="tabular-nums text-sm font-black text-emerald-400 min-w-[90px] text-right">
          {fmt(total)}
        </span>
        {comparative && priorTotal !== undefined && (
          <span className="tabular-nums text-sm font-bold text-slate-300 min-w-[90px] text-right ml-3">
            {fmt(priorTotal)}
          </span>
        )}
      </div>
    </div>
  );

  const totalAssets = data?.assets?.total ?? 0;
  const totalLiabilities = data?.liabilities?.total ?? 0;
  const totalEquity = data?.equity?.total ?? 0;
  const totalLiabEquity = totalLiabilities + totalEquity;
  const balanced = data ? Math.abs(totalAssets - totalLiabEquity) < 0.01 : false;

  return (
    <AppPage
      title="Balance Sheet"
      subtitle={`Statement of Financial Position · ${data?.date ? new Date(data.date).toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <FormField label="As of" className="mb-0">
            <Input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-36 text-xs"
            />
          </FormField>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={comparative}
              onChange={(e) => setComparative(e.target.checked)}
              className="rounded border-slate-300"
            />
            Prior year
          </label>
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
            balanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <Icon name={balanced ? 'SUCCESS' : 'WARNING'} size={13} />
          <span className="font-semibold">
            {balanced
              ? 'Balance Sheet is balanced — Assets = Liabilities + Equity'
              : 'IMBALANCE DETECTED: Assets ≠ Liabilities + Equity'}
          </span>
          {!balanced && (
            <span className="ml-auto font-mono text-[11px]">
              Diff: ETB {fmt(Math.abs(totalAssets - totalLiabEquity))}
            </span>
          )}
        </div>
      )}

      <div className="ovds-grid-layout cols-4 gap-sm mb-6">
        {[
          { label: 'Total Assets', value: totalAssets, color: 'text-emerald-600' },
          { label: 'Total Liabilities', value: totalLiabilities, color: 'text-rose-600' },
          { label: 'Total Equity', value: totalEquity, color: 'text-violet-600' },
          { label: 'Balanced', value: balanced ? 100 : 0, suffix: '%', color: balanced ? 'text-emerald-600' : 'text-rose-600' },
        ].map((k, i) => (
          <div key={i} className="ovds-widget-card p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            {loading ? (
              <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                {k.suffix ? `${k.value}${k.suffix}` : `ETB ${fmt(k.value)}`}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {renderSection(
            'Assets',
            data?.assets?.items ?? [],
            totalAssets,
            'bg-emerald-50 border border-emerald-100',
            comparative ? priorData?.assets?.items : undefined,
            comparative ? priorData?.assets?.total : undefined,
          )}
        </div>
        <div className="lg:col-span-1">
          {renderSection(
            'Liabilities',
            data?.liabilities?.items ?? [],
            totalLiabilities,
            'bg-rose-50 border border-rose-100',
            comparative ? priorData?.liabilities?.items : undefined,
            comparative ? priorData?.liabilities?.total : undefined,
          )}
        </div>
        <div className="lg:col-span-1">
          {renderSection(
            'Equity',
            data?.equity?.items ?? [],
            totalEquity,
            'bg-violet-50 border border-violet-100',
            comparative ? priorData?.equity?.items : undefined,
            comparative ? priorData?.equity?.total : undefined,
          )}
        </div>
      </div>

      {!data && !loading && (
        <div className="text-center py-10 text-sm text-slate-400">
          No balance sheet data available. Ensure your chart of accounts and journal entries are set up.
        </div>
      )}
    </AppPage>
  );
};

export default BalanceSheet;
