import React from 'react';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import { useEimsReadiness, useEimsCertificateExpiry, useEimsRegistrations, useEimsDashboard } from '@ovds/features/eims';
import {
  Shield, AlertTriangle, CheckCircle2, FileText, Key, Server, Layers,
  ArrowRight, ClipboardList, BarChart2,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  REGISTERED: 'text-emerald-600 bg-emerald-50',
  FAILED: 'text-rose-600 bg-rose-50',
  COMPLETED: 'text-emerald-600 bg-emerald-50',
  ACTIVE: 'text-emerald-600 bg-emerald-50',
  EXPIRED: 'text-rose-600 bg-rose-50',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const ComplianceDashboardPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: readiness, isLoading: loadingReadiness, refetch: refetchReadiness } = useEimsReadiness();
  const { data: expiringCerts = [] } = useEimsCertificateExpiry();
  const { data: registrations = [] } = useEimsRegistrations();
  const { data: dashboard } = useEimsDashboard();

  const registered = registrations.filter((r: any) => r.status === 'REGISTERED').length;
  const failed = registrations.filter((r: any) => r.status === 'FAILED').length;
  const pending = registrations.filter((r: any) => r.status === 'PENDING').length;

  const links = [
    { href: '/compliance/eims', label: 'EIMS Dashboard', icon: <Server size={16} />, desc: 'MoR integration overview' },
    { href: '/compliance/invoices', label: 'E-Invoices', icon: <FileText size={16} />, desc: 'Invoice registration & verification' },
    { href: '/compliance/receipts', label: 'E-Receipts', icon: <FileText size={16} />, desc: 'Sales and withholding receipts' },
    { href: '/compliance/bulk', label: 'Bulk Operations', icon: <Layers size={16} />, desc: 'Bulk registration and cancellation' },
    { href: '/compliance/source-systems', label: 'Source Systems', icon: <Server size={16} />, desc: 'MoR source system management' },
    { href: '/compliance/certificates', label: 'Certificates', icon: <Key size={16} />, desc: 'INSA certificate management' },
    { href: '/compliance/checklists', label: 'Checklists', icon: <ClipboardList size={16} />, desc: 'BSP, INSA, and onboarding' },
    { href: '/compliance/tax-reports', label: 'Tax Reports', icon: <BarChart2 size={16} />, desc: 'Tax compliance reports' },
    { href: '/compliance/withholding', label: 'Withholding Tax', icon: <FileText size={16} />, desc: 'WHT certificates and receipts' },
  ];

  const copyLink = (href: string) => {
    navigator.clipboard.writeText(window.location.origin + href);
    toast.success('Link copied');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Dashboard</h1>
          <p className="text-sm text-slate-500">E-Invoice Management System and tax compliance monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Registered', value: dashboard?.summary?.registered ?? registered, color: 'text-emerald-600' },
          { label: 'Pending', value: dashboard?.summary?.pending ?? pending, color: 'text-amber-600' },
          { label: 'Failed', value: dashboard?.summary?.failed ?? failed, color: 'text-rose-600' },
          { label: 'Receipts', value: dashboard?.summary?.receipts ?? 0, color: 'text-teal-600' },
        ].map((s) => (
          <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {expiringCerts.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Certificate renewal required</p>
            <p className="text-xs mt-1">
              {expiringCerts.length} INSA certificate(s) expiring within 30 days. Renew via INSA to avoid registration failures.
            </p>
          </div>
        </div>
      )}

      {loadingReadiness ? (
        <div className="animate-pulse h-24 bg-slate-100 rounded-xl" />
      ) : readiness && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">EIMS Readiness</p>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${readiness.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {readiness.ready ? 'Ready' : 'Not Ready'}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">{readiness.progress}% complete</p>
          <div className="mt-3 space-y-2">
            {readiness.steps?.map((step: any) => (
              <div key={step.step} className="flex items-center gap-2 text-xs">
                {step.complete
                  ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  : <Circle size={14} className="text-slate-300 shrink-0" />}
                <span className={step.complete ? 'text-slate-700' : 'text-slate-400'}>{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold">Quick Links</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => copyLink(link.href)}
              className="flex items-center gap-3 p-3 border rounded-xl hover:border-teal-300 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 shrink-0">
                {link.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{link.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{link.desc}</p>
              </div>
              <ArrowRight size={14} className="shrink-0 text-slate-400 ml-auto" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} /> Recent Activity
          </h3>
        </div>
        {registrations.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No submissions yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">Document</th>
                <th className="text-left px-4 py-2 font-medium">IRN</th>
                <th className="text-left px-4 py-2 font-medium">Mode</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {registrations.slice(0, 8).map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-mono">{r.documentNumber ?? '—'}</td>
                  <td className="px-4 py-2 font-mono text-[10px]">{r.irn ? r.irn.slice(0, 16) + '…' : '—'}</td>
                  <td className="px-4 py-2">{r.submissionMode}</td>
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

export default ComplianceDashboardPage;
