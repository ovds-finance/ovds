import {
  useEimsReadiness,
  useEimsDashboard,
  useEimsRegistrations,
} from '@ovds/features/eims';
import {
  Shield, CheckCircle2, Circle, FileText, Layers, ArrowRight, RefreshCw, AlertTriangle,
} from 'lucide-react';
import React, {  } from 'react';

import { useBusiness } from '../../context/businessContext';


const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  PENDING: 'text-amber-600 bg-amber-50',
  ISSUED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  EXPIRING: 'text-orange-600 bg-orange-50',
  FAILED: 'text-rose-600 bg-rose-50',
  REGISTERED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  EXPIRED: 'text-rose-600 bg-rose-50',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const EimsDashboardPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: readiness, isLoading: loadingReadiness } = useEimsReadiness();
  const { data: dashboard } = useEimsDashboard();
  const { data: registrations = [], refetch: _refetchRegs } = useEimsRegistrations();

  const recentRegs = registrations.slice(0, 8);

  const quickActions = [
    { label: 'Register Invoice', href: '/compliance/invoices', icon: <FileText size={16} /> },
    { label: 'Bulk Register', href: '/compliance/bulk', icon: <Layers size={16} /> },
    { label: 'Receipts', href: '/compliance/receipts', icon: <FileText size={16} /> },
    { label: 'Certificates', href: '/compliance/certificates', icon: <Shield size={16} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">EIMS Dashboard</h1>
          <p className="text-sm text-slate-500">MoR Electronic Invoice Management System overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Registered', value: dashboard?.summary?.registered ?? 0, color: 'text-[var(--pro-azure)]' },
          { label: 'Pending', value: dashboard?.summary?.pending ?? 0, color: 'text-amber-600' },
          { label: 'Failed', value: dashboard?.summary?.failed ?? 0, color: 'text-rose-600' },
          { label: 'Receipts', value: dashboard?.summary?.receipts ?? 0, color: 'text-teal-600' },
        ].map((s) => (
          <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border hover:border-teal-300 transition-colors"
          >
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 shrink-0">{action.icon}</div>
            <span className="text-sm font-medium">{action.label}</span>
            <ArrowRight size={14} className="shrink-0 text-slate-400 ml-auto" />
          </a>
        ))}
      </div>

      {loadingReadiness ? (
        <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
      ) : readiness && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Integration Readiness</p>
              <p className="text-xs text-slate-500">{readiness.progress}% complete</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${readiness.ready ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-amber-100 text-amber-700'}`}>
              {readiness.ready ? 'Ready' : 'Not Ready'}
            </div>
          </div>
          <div className="space-y-2 mt-3">
            {readiness.steps?.map((step: any) => (
              <div key={step.step} className="flex items-start gap-3 p-2 rounded-lg">
                {step.complete
                  ? <CheckCircle2 size={16} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
                  : <Circle size={16} className="text-slate-300 mt-0.5 shrink-0" />}
                <div>
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-[10px] text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} /> Recent Registrations
          </h2>
        </div>
        {recentRegs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No registrations yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">Document</th>
                <th className="text-left px-4 py-2 font-medium">IRN</th>
                <th className="text-left px-4 py-2 font-medium">Mode</th>
                <th className="text-left px-4 py-2 font-medium">Attempts</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRegs.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-mono">{r.documentNumber ?? '—'}</td>
                  <td className="px-4 py-2 font-mono text-[10px]">{r.irn ? r.irn.slice(0, 16) + '…' : '—'}</td>
                  <td className="px-4 py-2">{r.submissionMode}</td>
                  <td className="px-4 py-2">{r.attemptCount}</td>
                  <td className="px-4 py-2"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EimsDashboardPage;
