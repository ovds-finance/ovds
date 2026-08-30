import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Plus, Edit2, Trash2, RefreshCw,
  Banknote, Layers, Tag, Shield, ToggleLeft, ToggleRight,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../rbac/AuthContext';

// -- Payroll Settings Panel ----------------------------------------------------
// Covers: Pay Commissions, Pay Band Categories, Grade Pay Scales, Levels,
//         Payroll Entry Types/Groups, PF Subscriptions, Feature Settings

type SettingsSection = 'pay_commission' | 'pay_bands' | 'entry_groups' | 'pf_subscriptions' | 'feature_settings';

const SECTIONS: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { key: 'pay_commission',   label: 'Pay Commissions',       icon: <Banknote size={14} /> },
  { key: 'pay_bands',        label: 'Pay Band Categories',   icon: <Layers size={14} /> },
  { key: 'entry_groups',     label: 'Payroll Entry Groups',  icon: <Tag size={14} /> },
  { key: 'pf_subscriptions', label: 'PF Subscriptions',      icon: <Shield size={14} /> },
  { key: 'feature_settings', label: 'Feature Settings',      icon: <Settings size={14} /> },
];

// -- Generic CRUD list ---------------------------------------------------------
const CrudList: React.FC<{
  title: string;
  endpoint: string;
  fields: { key: string; label: string; type?: string; options?: string[] }[];
  canWrite: boolean;
}> = ({ title, endpoint, fields, canWrite }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      setItems(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => {
    setEditItem(null);
    setForm(Object.fromEntries(fields.map(f => [f.key, ''])));
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm(Object.fromEntries(fields.map(f => [f.key, item[f.key] ?? ''])));
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editItem?.id) {
        await api.patch(`${endpoint}/${editItem.id}`, form);
        toast.success('Updated');
      } else {
        await api.post(endpoint, form);
        toast.success('Created');
      }
      setShowForm(false);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success('Deleted');
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</p>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={12} className="text-slate-400" />
          </button>
          {canWrite && (
            <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">
              <Plus size={12} /> Add
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{editItem ? 'Edit' : 'New'} {title}</p>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">{f.label}</label>
                {f.options ? (
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200">
                    <option value="">Select…</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type ?? 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
            <button onClick={handleSave} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">Save</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No {title.toLowerCase()} configured</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {fields.slice(0, 3).map(f => (
                  <th key={f.key} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{f.label}</th>
                ))}
                {canWrite && <th className="px-3 py-2 w-16" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id ?? i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  {fields.slice(0, 3).map(f => (
                    <td key={f.key} className="px-3 py-2 text-slate-700 dark:text-slate-300">{item[f.key] ?? '—'}</td>
                  ))}
                  {canWrite && (
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1 text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors"><Edit2 size={11} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// -- Feature Settings ----------------------------------------------------------
const FeatureSettings: React.FC<{ canWrite: boolean }> = ({ canWrite }) => {
  const [settings, setSettings] = useState({
    showPfEmployerOnSlip: false,
    showPayBandOnSlip: false,
    sendSlipByMail: false,
    autoTaxCalculation: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payroll/settings/features').then((res: any) => {
      setSettings(s => ({ ...s, ...(res.data?.data ?? {}) }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof typeof settings) => {
    if (!canWrite) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      await api.patch('/payroll/settings/features', next);
      toast.success('Setting updated');
    } catch { setSettings(settings); toast.error('Failed to update'); }
  };

  const features = [
    { key: 'showPfEmployerOnSlip' as const, label: 'Show Employer PF Contribution on Payslip', desc: 'Display 11% employer pension on employee payslips' },
    { key: 'showPayBandOnSlip' as const, label: 'Show Pay Band on Payslip', desc: 'Display pay band/grade information on payslips' },
    { key: 'sendSlipByMail' as const, label: 'Send Payslip by Email', desc: 'Automatically email payslips to employees on approval' },
    { key: 'autoTaxCalculation' as const, label: 'Automatic Income Tax Calculation', desc: 'Auto-calculate PIT using Ethiopian tax brackets' },
  ];

  if (loading) return <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-3">
      {features.map(f => (
        <div key={f.key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{f.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
          </div>
          <button onClick={() => toggle(f.key)} disabled={!canWrite}
            className={`shrink-0 transition-colors ${settings[f.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'} disabled:opacity-50`}>
            {settings[f.key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>
      ))}
    </div>
  );
};

// -- Main Panel ----------------------------------------------------------------
const PayrollSettingsPanel: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('payroll:admin');
  const [activeSection, setActiveSection] = useState<SettingsSection>('pay_commission');

  return (
    <div className="flex gap-5">
      {/* Sidebar nav */}
      <div className="w-48 shrink-0 space-y-1">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeSection === s.key ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === 'pay_commission' && (
          <CrudList title="Pay Commissions" endpoint="/payroll/pay-commissions" canWrite={canWrite}
            fields={[
              { key: 'name', label: 'Commission Name' },
              { key: 'type', label: 'Type', options: ['6TH_PAY', '7TH_PAY', 'NOT_APPLICABLE'] },
              { key: 'description', label: 'Description' },
              { key: 'isActive', label: 'Status', options: ['true', 'false'] },
            ]} />
        )}
        {activeSection === 'pay_bands' && (
          <CrudList title="Pay Band Categories" endpoint="/payroll/pay-bands" canWrite={canWrite}
            fields={[
              { key: 'name', label: 'Pay Band Name' },
              { key: 'minAmount', label: 'Min Amount (ETB)', type: 'number' },
              { key: 'maxAmount', label: 'Max Amount (ETB)', type: 'number' },
              { key: 'description', label: 'Description' },
            ]} />
        )}
        {activeSection === 'entry_groups' && (
          <CrudList title="Payroll Entry Groups" endpoint="/payroll/entry-groups" canWrite={canWrite}
            fields={[
              { key: 'name', label: 'Group Name' },
              { key: 'entryType', label: 'Entry Type', options: ['EARNING', 'DEDUCTION'] },
              { key: 'shortCode', label: 'Short Code' },
              { key: 'description', label: 'Description' },
            ]} />
        )}
        {activeSection === 'pf_subscriptions' && (
          <CrudList title="PF Subscriptions" endpoint="/payroll/pf-subscriptions" canWrite={canWrite}
            fields={[
              { key: 'name', label: 'Subscription Name' },
              { key: 'type', label: 'Type', options: ['GPF', 'CPF', 'NPS', 'EPF'] },
              { key: 'employeeRate', label: 'Employee Rate (%)', type: 'number' },
              { key: 'employerRate', label: 'Employer Rate (%)', type: 'number' },
            ]} />
        )}
        {activeSection === 'feature_settings' && <FeatureSettings canWrite={canWrite} />}
      </div>
    </div>
  );
};

export default PayrollSettingsPanel;





