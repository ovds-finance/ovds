import {
  useEimsBspChecklist,
  useEimsBspReport,
  useEimsOnboardingChecklist,
  useEimsChecklist,
  useRecordBspResult,
} from '@ovds/features/eims';
import {
  ClipboardList, BookOpen, Shield, CheckCircle2, Circle, Download,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';


const STATUS_COLORS: Record<string, string> = {
  PASS: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  FAIL: 'text-rose-600 bg-rose-50',
  PENDING: 'text-amber-600 bg-amber-50',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  REGISTERED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const ChecklistsPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<'bsp' | 'report' | 'onboarding' | 'insa'>('bsp');
  const [bspRecord, setBspRecord] = useState<{ testCaseId: string; title: string; result: 'PASS' | 'FAIL'; notes: string } | null>(null);

  const { data: bspData, isLoading: loadingBsp, refetch: refetchBsp } = useEimsBspChecklist();
  const { data: bspReport, isLoading: loadingReport, refetch: refetchReport } = useEimsBspReport();
  const { data: onboardingData, isLoading: loadingOnboarding } = useEimsOnboardingChecklist();
  const { data: insaData, isLoading: loadingInsa } = useEimsChecklist();
  const recordBsp = useRecordBspResult();

  const handleRecordBsp = async () => {
    if (!bspRecord) return;
    try {
      await recordBsp.mutateAsync({
        testCaseId: bspRecord.testCaseId,
        result: bspRecord.result,
        notes: bspRecord.notes || undefined,
      });
      toast.success(`BSP result recorded for ${bspRecord.testCaseId}`);
      setBspRecord(null);
      refetchBsp();
      refetchReport();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const exportCsv = () => {
    const rows = (bspReport?.testExecutions ?? bspData?.checklist ?? []) as any[];
    if (!rows.length) {
      toast.error('No data to export');
      return;
    }
    const header = 'Test ID,Title,Status,Executions\n';
    const body = rows.map((tc) => [
      tc.id,
      `"${String(tc.title ?? '').replace(/"/g, '""')}"`,
      tc.passed ? 'PASS' : tc.automated ? 'PENDING' : 'MANUAL',
      tc.executionCount ?? 0,
    ].join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bsp-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <ClipboardList size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Checklists</h1>
          <p className="text-sm text-slate-500">BSP, INSA, and onboarding compliance tracking</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {[
          { key: 'bsp', label: 'BSP Checklist', icon: <ClipboardList size={14} /> },
          { key: 'report', label: 'BSP Report', icon: <Download size={14} /> },
          { key: 'onboarding', label: 'Onboarding', icon: <BookOpen size={14} /> },
          { key: 'insa', label: 'INSA Audit', icon: <Shield size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
              tab === t.key ? 'text-teal-600 border-b-2 border-teal-500' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'bsp' && (
        <div className="space-y-3">
          {loadingBsp ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            (bspData?.checklist ?? []).map((tc: any) => (
              <div key={tc.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-teal-600">{tc.id}</p>
                    <p className="text-sm font-medium">{tc.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{tc.description}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${tc.passed ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-slate-100 text-slate-500'}`}>
                    {tc.passed ? 'PASS' : tc.automated ? 'Pending' : 'Manual'}
                  </span>
                </div>
                {!tc.passed && (
                  <button
                    type="button"
                    onClick={() => setBspRecord({ testCaseId: tc.id, title: tc.title, result: 'PASS', notes: '' })}
                    className="mt-3 text-[10px] px-2 py-1 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    Record sandbox result
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'report' && (
        <div className="space-y-3">
          {loadingReport ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {bspReport?.summary ? `${bspReport.summary.passed}/${bspReport.summary.totalTests} passed (${bspReport.summary.readinessScore}%)` : ''}
                </p>
                <button type="button" onClick={exportCsv} className="text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-50 flex items-center gap-1">
                  <Download size={12} /> Export CSV
                </button>
              </div>
              {(bspReport?.testExecutions ?? []).map((tc: any) => (
                <div key={tc.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs font-mono text-teal-600">{tc.id}</p>
                  <p className="text-sm font-medium">{tc.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge status={tc.passed ? 'PASS' : 'PENDING'} />
                    <span className="text-[10px] text-slate-500">Executions: {tc.executionCount ?? 0}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'onboarding' && (
        <div className="space-y-3">
          {loadingOnboarding ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            onboardingData?.steps?.map((step: any) => (
              <div key={step.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{step.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{step.phase}</span>
                </div>
                <p className="text-xs text-slate-500">{step.description}</p>
                {step.templateFile && <p className="text-[10px] text-slate-400">Template: ovds insa/{step.templateFile}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'insa' && (
        <div className="space-y-3">
          {loadingInsa ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            insaData?.checklist?.map((item: any) => (
              <div key={item.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border flex items-start gap-3">
                {item.implemented
                  ? <CheckCircle2 size={16} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
                  : <Circle size={16} className="text-slate-300 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs font-mono text-slate-400">{item.id} · {item.area}</p>
                  <p className="text-sm font-medium">{item.metric}</p>
                  <p className="text-xs text-slate-500">{item.requirement}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {bspRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border shadow-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Record BSP Test Result</h3>
            <p className="text-xs text-slate-500">{bspRecord.testCaseId} — {bspRecord.title}</p>
            <select value={bspRecord.result}
              onChange={(e) => setBspRecord({ ...bspRecord, result: e.target.value as 'PASS' | 'FAIL' })}
              className="w-full px-3 py-2 text-sm border rounded-lg">
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
            <textarea placeholder="Notes (optional)" value={bspRecord.notes}
              onChange={(e) => setBspRecord({ ...bspRecord, notes: e.target.value })}
              rows={3} className="w-full px-3 py-2 text-sm border rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setBspRecord(null)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleRecordBsp} disabled={recordBsp.isPending}
                className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {recordBsp.isPending ? 'Saving…' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistsPage;
