import { useEimsRegistrations, useEimsCertificateExpiry } from '@ovds/features/eims';
import {
  BarChart2, ExternalLink, FileText, Shield, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  REGISTERED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  FAILED: 'text-rose-600 bg-rose-50',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  CANCELLED: 'text-slate-600 bg-slate-100',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const TaxReportsPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: registrations = [], refetch: _refetchRegs } = useEimsRegistrations();
  const { data: expiringCerts = [] } = useEimsCertificateExpiry();

  const registered = registrations.filter((r: any) => r.status === 'REGISTERED').length;
  const failed = registrations.filter((r: any) => r.status === 'FAILED').length;
  const pending = registrations.filter((r: any) => r.status === 'PENDING').length;

  const reportLinks = [
    { label: 'VAT Returns', href: '/tax/vat', desc: 'Monthly/quarterly VAT declarations' },
    { label: 'BIT Reports', href: '/tax/bit', desc: 'Business income tax filings' },
    { label: 'DRRF Reports', href: '/tax/drrf', desc: 'Deduction at source reports' },
    { label: 'Withholding Tax', href: '/compliance/withholding', desc: 'WHT certificates and submissions' },
    { label: 'General Ledger Compliance', href: '/general-ledger-compliance', desc: 'GL audit readiness and tax compliance' },
    { label: 'Cash Flow Statement', href: '/reports/cash-flow', desc: 'Cash flow analysis for tax purposes' },
  ];

  const copyReportLink = (href: string) => {
    navigator.clipboard.writeText(window.location.origin + href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <BarChart2 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tax Reports</h1>
          <p className="text-sm text-slate-500">Tax compliance reports and MoR submission status</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Registered', value: registered, color: 'text-[var(--pro-azure)]' },
          { label: 'Pending', value: pending, color: 'text-amber-600' },
          { label: 'Failed', value: failed, color: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-teal-600" />
          <p className="text-sm font-medium text-teal-800">EIMS Compliance</p>
        </div>
        <p className="text-xs text-teal-700 mt-1">
          {registered > 0 ? `${registered} invoice(s) successfully registered with MoR.` : 'No invoices registered yet.'}
          {failed > 0 ? ` ${failed} registration(s) failed and need attention.` : ''}
          {pending > 0 ? ` ${pending} registration(s) are pending.` : ''}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText size={16} /> Report Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {reportLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => copyReportLink(link.href)}
              className="p-3 border rounded-xl text-left hover:border-teal-300 transition-colors"
            >
              <p className="text-sm font-medium">{link.label}</p>
              <p className="text-xs text-slate-500">{link.desc}</p>
              <p className="text-[10px] text-teal-600 mt-1 flex items-center gap-1">
                <ExternalLink size={10} /> {link.href}
              </p>
            </button>
          ))}
        </div>
      </div>

      {expiringCerts.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Certificate Renewal Alert</p>
              <p className="text-xs mt-1">
                {expiringCerts.length} certificate(s) expiring within 30 days. MoR registration may fail.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield size={16} /> Recent Submissions
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
              {registrations.slice(0, 10).map((r: any) => (
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

export default TaxReportsPage;
