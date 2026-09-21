import {
  useEimsSourceSystems,
  useEimsEnterprises,
  useEimsEstablishments,
  useRegisterSourceSystem,
  useUpdateSourceSystemStep,
} from '@ovds/features/eims';
import {
  Server, Plus, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2, Circle, Building2, MapPin,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';


const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  ACTIVE: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  APPROVED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  REJECTED: 'text-rose-600 bg-rose-50',
  INACTIVE: 'text-slate-600 bg-slate-100',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const SourceSystemsPage: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [step, setStep] = useState(0);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState('');
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState('');
  const [form, setForm] = useState({
    systemNumber: '',
    systemType: 'ERP' as const,
    clientId: '',
    clientSecret: '',
    apiKey: '',
  });

  const { data: sources = [], refetch: refetchSources } = useEimsSourceSystems();
  const { data: enterprises = [] } = useEimsEnterprises();
  const { data: establishments = [] } = useEimsEstablishments(selectedEnterpriseId);
  const registerSource = useRegisterSourceSystem();
  const _updateStep = useUpdateSourceSystemStep();

  const handleRegister = async () => {
    if (!form.systemNumber) {
      toast.error('System number is required');
      return;
    }
    try {
      await registerSource.mutateAsync({
        systemNumber: form.systemNumber,
        systemType: form.systemType,
        enterpriseId: selectedEnterpriseId || undefined,
        establishmentId: selectedEstablishmentId || undefined,
        clientId: form.clientId || undefined,
        clientSecret: form.clientSecret || undefined,
        apiKey: form.apiKey || undefined,
      });
      toast.success('Source system registered');
      setStep(4);
      refetchSources();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { eimsApi } = await import('@ovds/features/eims');
      await eimsApi.sourceSystems.approve(id);
      toast.success('Source marked as MoR-approved');
      refetchSources();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Server size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Source Systems</h1>
          <p className="text-sm text-slate-500">MoR source system registrations and credentials</p>
        </div>
      </div>

      {step > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {['Enterprise', 'Establishment', 'Details', 'Approval'].map((label, i) => (
              <React.Fragment key={label}>
                <span className={`px-2 py-1 rounded-lg ${i < step ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : i === step ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                  {i + 1}. {label}
                </span>
                {i < 3 && <ChevronRight size={12} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Select an enterprise to associate with this source system.</p>
              <div className="grid grid-cols-1 gap-2">
                {enterprises.map((ent: any) => (
                  <button
                    key={ent.id}
                    onClick={() => { setSelectedEnterpriseId(ent.id); setStep(2); }}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-left hover:border-teal-300 transition-colors"
                  >
                    <p className="text-sm font-medium">{ent.name}</p>
                    <p className="text-xs text-slate-500">TIN: {ent.tin}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Select an establishment.</p>
              <div className="grid grid-cols-1 gap-2">
                {establishments.map((est: any) => (
                  <button
                    key={est.id}
                    onClick={() => { setSelectedEstablishmentId(est.id); setStep(3); }}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-left hover:border-teal-300 transition-colors"
                  >
                    <p className="text-sm font-medium">{est.name}</p>
                    <p className="text-xs text-slate-500">{est.address}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <ChevronLeft size={12} /> Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Enter source system details from the MoR portal.</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="System Number" value={form.systemNumber}
                  onChange={(e) => setForm({ ...form, systemNumber: e.target.value })}
                  className="px-3 py-2 text-sm border rounded-lg" />
                <select value={form.systemType}
                  onChange={(e) => setForm({ ...form, systemType: e.target.value as any })}
                  className="px-3 py-2 text-sm border rounded-lg">
                  <option value="ERP">ERP</option>
                  <option value="POS">POS</option>
                  <option value="MANUAL">MANUAL</option>
                </select>
                <input placeholder="Client ID" value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="px-3 py-2 text-sm border rounded-lg" />
                <input placeholder="Client Secret" type="password" value={form.clientSecret}
                  onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
                  className="px-3 py-2 text-sm border rounded-lg" />
                <input placeholder="API Key" value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="px-3 py-2 text-sm border rounded-lg col-span-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 flex items-center gap-1">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={handleRegister} disabled={registerSource.isPending}
                  className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                  {registerSource.isPending ? 'Registering…' : 'Register Source'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Pending MoR Officer Approval</p>
                  <p className="text-xs text-amber-700 mt-1">The source system will go to back office for approval by a MoR officer.</p>
                </div>
              </div>
              <button
                onClick={() => { setStep(0); setForm({ systemNumber: '', systemType: 'ERP', clientId: '', clientSecret: '', apiKey: '' }); setSelectedEnterpriseId(''); setSelectedEstablishmentId(''); }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Register another source
              </button>
            </div>
          )}
        </div>
      )}

      {sources.length === 0 && step === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No source systems registered yet.</p>
          <button
            onClick={() => setStep(1)}
            className="mt-3 inline-flex items-center gap-1 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={14} /> Start Source Registration
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">System Number</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Enterprise</th>
                <th className="text-left px-4 py-2 font-medium">Establishment</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sources.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium">{s.systemNumber}</td>
                  <td className="px-4 py-3">{s.systemType}</td>
                  <td className="px-4 py-3">{s.enterpriseId ?? '—'}</td>
                  <td className="px-4 py-3">{s.establishmentId ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {s.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(s.id)}
                        className="text-xs px-2 py-1 bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] rounded-lg hover:bg-[var(--pro-azure-100)]"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SourceSystemsPage;
