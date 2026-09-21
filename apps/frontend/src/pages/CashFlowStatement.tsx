import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

import {
  AppPage, Btn, Icon, FormField, Input,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { downloadBlob } from '../utils/download';

interface CashFlowLine {
  id?: string;
  label: string;
  amount: number;
  section: 'OPERATING' | 'INVESTING' | 'FINANCING';
  basis?: string;
  date?: string;
  reference?: string;
}

interface CashFlowData {
  startDate: string;
  endDate: string;
  classificationMethod: string;
  keywordFallbackCount: number;
  operating: { inflows: CashFlowLine[]; outflows: CashFlowLine[]; net: number };
  investing: { inflows: CashFlowLine[]; outflows: CashFlowLine[]; net: number };
  financing: { inflows: CashFlowLine[]; outflows: CashFlowLine[]; net: number };
  netCashFlow: number;
  ifrsCompliant: boolean;
  iasReference: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const CashFlowStatement: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CashFlowData | null>(null);

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
      const res = await api.get(`/ovds/reports/cash-flow?${q}`, {
        headers: { 'x-background': '1' },
      });
      const raw = res.data?.data ?? res.data;
      setData(raw || null);
    } catch {
      toast.error('Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate, companyId);
  }, [startDate, endDate, companyId, fetchData]);

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
        report: 'cash-flow',
        format: 'pdf',
        startDate,
        endDate,
        companyId: companyId || '',
      });
      const res = await api.get(`/ovds/reports/export-pdf?${q}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      downloadBlob(blob, `cash-flow-${endDate}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const renderFlowSection = (
    title: string,
    section: { inflows: CashFlowLine[]; outflows: CashFlowLine[]; net: number },
    accent: string,
    bgClass: string,
  ) => (
    <div className="space-y-1">
      <div className={`px-4 py-2 rounded-lg ${accent}`}>
        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{title}</p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Net: ETB {fmt(section.net)}</p>
      </div>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between px-4 py-1.5">
            <div className="h-3 bg-slate-100 rounded animate-pulse w-48" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-24" />
          </div>
        ))
      ) : (
        <>
          {section.inflows.map((l, i) => (
            <div key={`in-${i}`} className="flex justify-between px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-300">
                {l.label}
                {l.basis === 'keyword' && <span className="text-[9px] text-amber-500 ml-1">(est.)</span>}
              </span>
              <span className="tabular-nums text-[12px] font-medium text-[var(--pro-azure-dark)] min-w-[100px] text-right">
                {fmt(l.amount)}
              </span>
            </div>
          ))}
          {section.outflows.map((l, i) => (
            <div key={`out-${i}`} className="flex justify-between px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-300">
                {l.label}
                {l.basis === 'keyword' && <span className="text-[9px] text-amber-500 ml-1">(est.)</span>}
              </span>
              <span className="tabular-nums text-[12px] font-medium text-rose-700 min-w-[100px] text-right">
                ({fmt(Math.abs(l.amount))})
              </span>
            </div>
          ))}
          <div className={`flex justify-between px-4 py-2 rounded-lg mt-1 ${bgClass}`}>
            <span className="text-sm font-black text-white flex-1">Net {title.split(' ')[0]}</span>
            <span className={`tabular-nums text-sm font-black text-white min-w-[100px] text-right`}>
              {section.net < 0 ? `(${fmt(Math.abs(section.net))})` : fmt(section.net)}
            </span>
          </div>
        </>
      )}
    </div>
  );

  const operatingNet = data?.operating?.net ?? 0;
  const investingNet = data?.investing?.net ?? 0;
  const financingNet = data?.financing?.net ?? 0;
  const netCashFlow = data?.netCashFlow ?? 0;

  return (
    <AppPage
      title="Cash Flow Statement"
      subtitle={`IAS 7 · ${startDate} to ${endDate}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <FormField label="Start" className="mb-0">
            <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="w-36 text-xs" />
          </FormField>
          <FormField label="End" className="mb-0">
            <Input type="date" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} className="w-36 text-xs" />
          </FormField>
          {data?.keywordFallbackCount ? (
            <span className="text-[10px] text-amber-600 font-medium">
              {data.keywordFallbackCount} items classified by keyword (review recommended)
            </span>
          ) : null}
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
            { label: 'Operating', value: operatingNet, color: 'text-[var(--pro-azure)]', bg: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
            { label: 'Investing', value: investingNet, color: 'text-[var(--pro-azure)]', bg: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
            { label: 'Financing', value: financingNet, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
            { label: 'Net Change', value: netCashFlow, color: netCashFlow >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600', bg: netCashFlow >= 0 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-rose-50 border-rose-200' },
          ].map((k, i) => (
            <div key={i} className={`rounded-xl border p-4 ${k.bg}`}>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              {loading ? (
                <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                  ETB {fmt(k.value)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          {renderFlowSection(
            'Operating Activities',
            data?.operating || { inflows: [], outflows: [], net: 0 },
            'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]',
            'bg-[var(--pro-azure)]',
          )}
        </div>
        <div>
          {renderFlowSection(
            'Investing Activities',
            data?.investing || { inflows: [], outflows: [], net: 0 },
            'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-50)]',
            'bg-[var(--pro-azure)]',
          )}
        </div>
        <div>
          {renderFlowSection(
            'Financing Activities',
            data?.financing || { inflows: [], outflows: [], net: 0 },
            'bg-violet-50 border border-violet-100',
            'bg-violet-600',
          )}
        </div>
      </div>

      {data && (
        <div className="mt-6 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Net Cash Flow</p>
            <p className={`text-2xl font-black tabular-nums ${netCashFlow >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
              ETB {fmt(netCashFlow)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">{data.iasReference}</p>
            <p className="text-[10px] text-slate-400">Classification: {data.classificationMethod}</p>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-10 text-sm text-slate-400">
          No cash flow data available for the selected period. Ensure bank transactions are recorded.
        </div>
      )}
    </AppPage>
  );
};

export default CashFlowStatement;
