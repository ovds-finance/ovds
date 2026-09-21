import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

import {
  AppPage, Btn, Icon, FormField, Input,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { downloadBlob } from '../utils/download';

interface PLLine {
  id?: string;
  code: string;
  name: string;
  amount: number;
  level?: number;
  isTotal?: boolean;
  category?: string;
}

interface ProfitAndLossData {
  income: { items: PLLine[]; total: number };
  expenses: { items: PLLine[]; total: number };
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  period: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const ProfitAndLoss: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitAndLossData | null>(null);
  const [comparative, setComparative] = useState(false);
  const [priorData, setPriorData] = useState<ProfitAndLossData | null>(null);

  const today = new Date();
  const yearStart = `${today.getFullYear()}-01-01`;
  const todayStr = today.toISOString().slice(0, 10);

  const startParam = searchParams.get('startDate') || yearStart;
  const endParam = searchParams.get('endDate') || todayStr;
  const [startDate, setStartDate] = useState(startParam);
  const [endDate, setEndDate] = useState(endParam);
  const companyId = searchParams.get('companyId') || selectedCompanyId || undefined;

  const fetchData = useCallback(async (sd: string, ed: string, cId?: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ startDate: sd, endDate: ed });
      if (cId) q.set('companyId', cId);

      const endpoint = comparative
        ? `/ovds/reports/income-statement`
        : `/ovds/reports/profit-loss`;

      const res = await api.get(`${endpoint}?${q}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data;

      const normalize = (r: Record<string, unknown>): ProfitAndLossData => ({
        income: (r.income as any) || { items: [], total: 0 },
        expenses: (r.expenses as any) || { items: [], total: 0 },
        grossProfit: ((r.income as any)?.total ?? 0) - ((r.expenses as any)?.total ?? 0),
        operatingProfit: (r.subtotals as any)?.operatingProfit ?? 0,
        netProfit: (r.subtotals as any)?.netProfit ?? (r as any).netProfit ?? 0,
        period: `${sd} to ${ed}`,
      });

      if (comparative && raw?.current) {
        setData(normalize(raw.current));
        setPriorData(raw.prior ? normalize(raw.prior) : null);
      } else {
        setData(normalize(raw));
        setPriorData(null);
      }
    } catch {
      toast.error('Failed to load profit & loss');
    } finally {
      setLoading(false);
    }
  }, [comparative]);

  useEffect(() => {
    fetchData(startDate, endDate, companyId);
  }, [startDate, endDate, comparative, companyId, fetchData]);

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('startDate', newDate);
      if (companyId) next.set('companyId', companyId);
      return next;
    });
  };

  const handleEndDateChange = (newDate: string) => {
    setEndDate(newDate);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('endDate', newDate);
      if (companyId) next.set('companyId', companyId);
      return next;
    });
  };

  const handleExportPdf = async () => {
    try {
      const q = new URLSearchParams({
        report: 'profit-loss',
        format: 'pdf',
        startDate,
        endDate,
        companyId: companyId || '',
      });
      const res = await api.get(`/ovds/reports/export-pdf?${q}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      downloadBlob(blob, `profit-loss-${endDate}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const renderCategory = (
    title: string,
    lines: PLLine[],
    total: number,
    accent: string,
    colorClass: string,
    priorLines?: PLLine[],
    priorTotal?: number,
  ) => (
    <div className="space-y-1">
      <div className={`px-4 py-2 rounded-lg ${accent}`}>
        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{title}</p>
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
                className={`tabular-nums ${l.isTotal ? 'text-sm font-bold text-slate-700 dark:text-slate-200' : 'text-[12px] font-medium text-slate-700 dark:text-slate-200'} min-w-[100px] text-right`}
              >
                {fmt(Math.abs(l.amount))}
              </span>
              {comparative && prior && (
                <span className="tabular-nums text-[11px] text-slate-400 min-w-[100px] text-right ml-3">
                  {fmt(Math.abs(prior.amount))}
                </span>
              )}
            </div>
          );
        })
      )}
      <div className={`flex justify-between px-4 py-2 rounded-lg mt-1 ${colorClass}`}>
        <span className="text-sm font-black text-white flex-1">TOTAL {title}</span>
        <span className="tabular-nums text-sm font-black text-white min-w-[100px] text-right">{fmt(total)}</span>
        {comparative && priorTotal !== undefined && (
          <span className="tabular-nums text-sm font-bold text-white/80 min-w-[100px] text-right ml-3">
            {fmt(priorTotal)}
          </span>
        )}
      </div>
    </div>
  );

  const netProfit = data?.netProfit ?? 0;
  const grossProfit = data?.grossProfit ?? 0;
  const totalRevenue = data?.income?.total ?? 0;
  const totalExpenses = data?.expenses?.total ?? 0;

  return (
    <AppPage
      title="Profit & Loss"
      subtitle={`Income Statement · ${startDate} to ${endDate}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <FormField label="Start">
            <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="w-36 text-xs mb-0" />
          </FormField>
          <FormField label="End">
            <Input type="date" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} className="w-36 text-xs mb-0" />
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
          <Btn variant="secondary" size="sm" onClick={() => fetchData(startDate, endDate, companyId)} icon={<Icon name="REFRESH_CW" size={11} />}>
            Refresh
          </Btn>
          <Btn variant="primary" size="sm" onClick={handleExportPdf} icon={<Icon name="DOWNLOAD" size={11} />}>
            Export PDF
          </Btn>
        </div>
      }
    >
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Revenue', value: totalRevenue, color: 'text-[var(--pro-azure)]', bg: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
            { label: 'Gross Profit', value: grossProfit, color: 'text-[var(--pro-azure)]', bg: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
            { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600', bg: netProfit >= 0 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-rose-50 border-rose-200' },
            { label: 'Margin', value: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0, suffix: '%', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
          ].map((k, i) => (
            <div key={i} className={`rounded-xl border p-4 ${k.bg}`}>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              {loading ? (
                <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                  {k.suffix ? `${k.value.toFixed(1)}${k.suffix}` : `ETB ${fmt(k.value)}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {renderCategory(
            'Revenue',
            data?.income?.items ?? [],
            totalRevenue,
            'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]',
            'bg-[var(--pro-azure)]',
            comparative ? priorData?.income?.items : undefined,
            comparative ? priorData?.income?.total : undefined,
          )}
        </div>
        <div>
          {renderCategory(
            'Expenses',
            data?.expenses?.items ?? [],
            totalExpenses,
            'bg-rose-50 border border-rose-100',
            'bg-rose-600',
            comparative ? priorData?.expenses?.items : undefined,
            comparative ? priorData?.expenses?.total : undefined,
          )}
        </div>
      </div>

      {data && (
        <div className="mt-6 p-4 rounded-xl border bg-slate-800 dark:bg-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-black text-white">NET PROFIT / (LOSS)</span>
            <span className={`text-2xl font-black tabular-nums ${netProfit >= 0 ? 'text-[var(--pro-azure-light)]' : 'text-rose-400'}`}>
              {fmt(netProfit)}
            </span>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-10 text-sm text-slate-400">
          No profit & loss data available for the selected period.
        </div>
      )}
    </AppPage>
  );
};

export default ProfitAndLoss;
