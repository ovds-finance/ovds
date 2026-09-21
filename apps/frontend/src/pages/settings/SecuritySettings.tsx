import {
  useSecurityChecklist,
  useSecurityReadiness,
  useSecurityHealth,
} from '@ovds/features/security';
import {
  Shield, CheckCircle2, AlertTriangle, Download, RefreshCw,
  ClipboardList, Lock, ExternalLink,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';
import { useSetupComplianceSync } from '../../hooks/useSetupComplianceSync';
import { downloadCSV } from '../../utils/download';


const PHASE_COLORS: Record<string, string> = {
  Headers: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  Authentication: 'bg-purple-50 text-purple-700',
  Authorization: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  Session: 'bg-violet-50 text-violet-700',
  'API Security': 'bg-teal-50 text-teal-700',
  'Input Validation': 'bg-amber-50 text-amber-700',
  'Error Handling': 'bg-orange-50 text-orange-700',
  Cryptography: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  Logging: 'bg-slate-100 text-slate-700',
  'Passive Scan': 'bg-sky-50 text-sky-700',
};

const SecuritySettings: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: checklistData, refetch: refetchChecklist, isLoading } = useSecurityChecklist();
  const { data: readiness } = useSecurityReadiness();
  const { data: health } = useSecurityHealth();
  const [tab, setTab] = useState<'checklist' | 'readiness' | 'health'>('checklist');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');

  const items = checklistData?.checklist ?? [];
  const summary = checklistData?.summary ?? readiness?.summary;

  useSetupComplianceSync(selectedCompanyId, {
    securityScore: summary?.readinessScore,
  });
  const phases = [...new Set(items.map((i: any) => i.phase))] as string[];

  const filtered = phaseFilter === 'ALL'
    ? items
    : items.filter((i: any) => i.phase === phaseFilter);

  const exportCsv = () => {
    if (!items.length) {
      toast.error('No checklist data');
      return;
    }
    const header = 'ID,Phase,Title,Status,ZAP Alert,ASVS,OVDS Control\n';
    const body = items.map((i: any) => [
      i.id,
      i.phase,
      `"${String(i.title).replace(/"/g, '""')}"`,
      i.implemented ? 'IMPLEMENTED' : 'PENDING',
      i.zapAlert ?? '',
      i.asvsRef ?? '',
      `"${String(i.ovdsControl).replace(/"/g, '""')}"`,
    ].join(',')).join('\n');
    downloadCSV(header + body, `security_checklist_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Checklist exported');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--pro-azure-50)] text-[var(--pro-azure)]">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Security Assessment</h1>
            <p className="text-sm text-slate-500">OWASP ZAP / ASVS control mapping — Internal Web Application Security Assessment Guide</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => refetchChecklist()} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50">
            <RefreshCw size={12} /> Refresh
          </button>
          <button type="button" onClick={exportCsv} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50">
            <Download size={12} /> Export CSV
          </button>
          <a href="/docs/security/OWASP-ZAP-ASSESSMENT.md" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--pro-azure)] text-white rounded-lg hover:bg-[var(--pro-azure-dark)]">
            <ExternalLink size={12} /> ZAP Guide
          </a>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className="text-2xl font-bold text-[var(--pro-azure)]">{summary.readinessScore ?? 0}%</p>
            <p className="text-[10px] uppercase text-slate-500 mt-1">Readiness</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className="text-2xl font-bold text-[var(--pro-azure)]">{summary.implemented ?? 0}</p>
            <p className="text-[10px] uppercase text-slate-500 mt-1">Implemented</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.pending ?? 0}</p>
            <p className="text-[10px] uppercase text-slate-500 mt-1">Pending</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className="text-2xl font-bold text-slate-700">{summary.total ?? items.length}</p>
            <p className="text-[10px] uppercase text-slate-500 mt-1">Total Controls</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b pb-2">
        {(['checklist', 'readiness', 'health'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPhaseFilter('ALL')} className={`text-[10px] px-2 py-1 rounded-full ${phaseFilter === 'ALL' ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100'}`}>All</button>
            {phases.map((p) => (
              <button key={p} type="button" onClick={() => setPhaseFilter(p)} className={`text-[10px] px-2 py-1 rounded-full ${phaseFilter === p ? 'bg-[var(--pro-azure)] text-white' : PHASE_COLORS[p] ?? 'bg-slate-100'}`}>{p}</button>
            ))}
          </div>
          {isLoading ? (
            <p className="text-center py-8 text-slate-400"><RefreshCw size={16} className="animate-spin inline" /></p>
          ) : filtered.map((item: any) => (
            <div key={item.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-[var(--pro-azure)]">{item.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${PHASE_COLORS[item.phase] ?? 'bg-slate-100'}`}>{item.phase}</span>
                    {item.asvsRef && <span className="text-[9px] text-slate-400">{item.asvsRef}</span>}
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.requirement}</p>
                  <p className="text-[10px] text-slate-400 mt-2"><Shield size={10} className="inline mr-1" />{item.ovdsControl}</p>
                  {item.zapAlert && (
                    <p className="text-[10px] text-amber-600 mt-1">ZAP: {item.zapAlert}</p>
                  )}
                </div>
                {item.implemented ? (
                  <CheckCircle2 size={18} className="text-[var(--pro-azure)] shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'readiness' && readiness?.byPhase && (
        <div className="space-y-3">
          {Object.entries(readiness.byPhase).map(([phase, stats]: [string, any]) => (
            <div key={phase} className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{phase}</span>
                <span className="text-xs text-[var(--pro-azure)]">{stats.implemented}/{stats.total}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--pro-azure-50)]0 rounded-full"
                  style={{ width: `${Math.round((stats.implemented / stats.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {readiness.zapBaselineCommand && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">ZAP Baseline Scan</p>
              <code className="text-[10px] break-all text-slate-600">{readiness.zapBaselineCommand}</code>
            </div>
          )}
        </div>
      )}

      {tab === 'health' && health && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--pro-azure)]" />
            <span className="text-sm font-medium">Status: {health.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {health.security && Object.entries(health.security).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                {v ? <CheckCircle2 size={12} className="text-[var(--pro-azure)]" /> : <AlertTriangle size={12} className="text-amber-500" />}
                <span className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
