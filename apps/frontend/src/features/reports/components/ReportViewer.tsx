import { AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr, Btn } from '@ovds/ui';
import { Download, RefreshCw, Calendar, BarChart3, FileText, Loader } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../../context/businessContext';
import { downloadBlob } from '../../../utils/download';
import { normalizeReport, fmtCell } from '../normalizers';
import type { RenderedReport } from '../normalizers';
import { fetchReport, downloadReportData, exportReportBlob } from '../services/reportsService';
import type { ReportTemplate, ReportConfig, AccountingBasis, ExportFormat, ReportPeriod } from '../types';

interface Props {
  template: ReportTemplate;
  config: ReportConfig;
  onBack: () => void;
  onSchedule: () => void;
}

export default function ReportViewer({ template, config, onBack, onSchedule }: Props) {
  const { selectedCompanyId: companyId } = useBusiness();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>(config.period);
  const [basis, setBasis] = useState<AccountingBasis>(config.basis);

  useEffect(() => {
    setPeriod(config.period);
    setBasis(config.basis);
  }, [config.period, config.basis]);

  const runFetch = useCallback(async () => {
    if (!companyId) {
      toast('Select a company to load this report.');
      return;
    }
    setLoading(true);
    try {
      const raw = await fetchReport({ companyId, config: { ...config, period, basis } });
      setData(raw);
    } catch {
      toast.error(`Could not load ${template.title}. The endpoint may not be available yet.`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, config, period, basis, template.title]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const rendered: RenderedReport = normalizeReport(template.id, data);
  const { kpis, columns, rows } = rendered;
  const showBasis = template.basisSupported.length > 1;

  const onExport = async (format: ExportFormat) => {
    if (!rows.length) return;
    const stamp = `${period.start}_to_${period.end}`;
    const baseName = template.title.replace(/\s+/g, '-');
    if (format === 'csv' || format === 'xlsx') {
      downloadReportData(template.id, period, format, rows as Array<Record<string, unknown>>, columns, baseName);
      toast.success(`${format.toUpperCase()} exported`);
      return;
    }
    try {
      const blob = await exportReportBlob(template.id, { ...config, period, basis }, companyId ?? '', format);
      downloadBlob(blob, `${baseName}-${stamp}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('PDF export is not yet available on this endpoint.');
    }
  };

  return (
    <AppPage
      title={template.title}
      subtitle={template.description}
      icon={<BarChart3 size={16} className="text-white" />}
      iconBg="bg-[var(--pro-azure)]"
      crumbs={[
        { label: 'Reports', to: '/reports-dashboard' },
        { label: template.category === 'standard' ? 'Standard' : 'Modular' },
        { label: template.title },
      ]}
      actions={
        <>
          {showBasis && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
              <Btn
                size="xs"
                variant={basis === 'accrual' ? 'primary' : 'ghost'}
                onClick={() => setBasis('accrual')}
              >
                Accrual
              </Btn>
              <Btn
                size="xs"
                variant={basis === 'cash' ? 'primary' : 'ghost'}
                onClick={() => setBasis('cash')}
              >
                Cash
              </Btn>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={period.start}
              onChange={(e) => setPeriod({ ...period, start: e.target.value })}
              className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 w-32"
            />
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <input
              type="date"
              value={period.end}
              onChange={(e) => setPeriod({ ...period, end: e.target.value })}
              className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 w-32"
            />
          </div>
          <Btn size="xs" variant="ghost" onClick={runFetch} loading={loading}>
            <RefreshCw size={13} className="mr-1" />
            Refresh
          </Btn>
          <Btn size="xs" variant="ghost" onClick={() => onExport('csv')} disabled={!rows.length && !loading}>
            <Download size={13} className="mr-1" />
            CSV
          </Btn>
          <Btn size="xs" variant="ghost" onClick={() => onExport('pdf')} disabled={!rows.length && !loading}>
            <Download size={13} className="mr-1" />
            PDF
          </Btn>
          <Btn size="xs" variant="ghost" onClick={onSchedule}>
            <FileText size={13} className="mr-1" />
            Schedule
          </Btn>
          <Btn size="xs" variant="secondary" onClick={onBack}>← Back</Btn>
        </>
      }
    >
      {!companyId ? (
        <div className="py-16 text-center text-slate-400">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No company selected</p>
          <p className="text-xs mt-1">Select a company to view this report.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loading && !data ? (
            <div className="py-12 text-center text-slate-400">
              <Loader size={24} className="mx-auto animate-spin" />
              <p className="mt-2 text-sm">Loading report…</p>
            </div>
          ) : (
            <>
              {kpis.length > 0 && <AppKpi cells={kpis} />}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <AppTable loading={loading} stickyFirst>
                  <thead>
                    <AppTr>
                      {columns.map((c) => (
                        <AppTh key={c.key} align={c.align ?? 'left'}>{c.label}</AppTh>
                      ))}
                    </AppTr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <AppTr>
                        <AppTd align="center" muted>No line items returned for this selection.</AppTd>
                      </AppTr>
                    ) : (
                      rows.map((row, i) => (
                        <AppTr key={String((row as Record<string, unknown>).id ?? i)}>
                          {columns.map((c) => (
                            <AppTd key={c.key} align={c.align ?? 'left'}>
                              {row[c.key] !== undefined
                                ? fmtCell(row[c.key])
                                : '-'}
                            </AppTd>
                          ))}
                        </AppTr>
                      ))
                    )}
                  </tbody>
                </AppTable>
              </div>
            </>
          )}
        </div>
      )}
    </AppPage>
  );
}
