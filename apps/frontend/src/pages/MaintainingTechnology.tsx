import { SettingsCard } from '@ovds/features/settings';
import { Shield, HardDrive, Clock, Users, Database, Server, AlertTriangle, Play } from 'lucide-react';
import React, { useState } from 'react';

type Tab = 'overview' | 'backups' | 'patches' | 'access' | 'database' | 'hardware';

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'overview', label: 'Overview', icon: <Server size={16} />, description: 'System health and maintenance status' },
  { id: 'backups', label: 'Backups', icon: <HardDrive size={16} />, description: 'Data preservation and disaster recovery' },
  { id: 'patches', label: 'Patches & Upgrades', icon: <Clock size={16} />, description: 'Software and hardware updates' },
  { id: 'access', label: 'Access Control', icon: <Users size={16} />, description: 'User permissions and audit trails' },
  { id: 'database', label: 'Database Health', icon: <Database size={16} />, description: 'Indexing, logs, and archiving' },
  { id: 'hardware', label: 'Hardware Safety', icon: <Shield size={16} />, description: 'Storage capacity and UPS testing' },
];

const RISK_ITEMS = [
  { risk: 'Hardware Failure', impact: 'Local drive crashes can permanently erase accounting history', severity: 'high' },
  { risk: 'Ransomware Targets', impact: 'On-premise servers are primary targets for malicious data encryption', severity: 'high' },
  { risk: 'Performance Decay', impact: 'Unmaintained local databases slow down significantly over time', severity: 'medium' },
];

const MAINTENANCE_MATRIX = [
  { layer: 'Data Preservation', action: 'Automated Backup Verification', frequency: 'Daily', target: 'Check logs for zero-byte or failed backup runs' },
  { layer: 'Data Preservation', action: 'Offsite/Cloud Sync', frequency: 'Daily', target: 'Push an encrypted copy out of the physical building' },
  { layer: 'Data Preservation', action: 'Disaster Recovery Drill', frequency: 'Quarterly', target: 'Test restoring data onto a blank backup machine' },
  { layer: 'System Lifecycle', action: 'OS & Server Security Patches', frequency: 'Monthly', target: 'Apply critical updates outside of business hours' },
  { layer: 'System Lifecycle', action: 'Software Hotfixes', frequency: 'As Released', target: 'Always test vendor updates in a sandbox first' },
  { layer: 'Database Health', action: 'Index Rebuilding & Defrag', frequency: 'Weekly', target: 'Optimize SQL queries to keep reports running fast' },
  { layer: 'Database Health', action: 'Transaction Log Pruning', frequency: 'Weekly', target: 'Prevent logs from consuming all local hard drive space' },
  { layer: 'Database Health', action: 'Historical Data Archiving', frequency: 'Annually', target: 'Move closed fiscal years to cold storage' },
  { layer: 'Hardware Safety', action: 'Storage Capacity Check', frequency: 'Monthly', target: 'Maintain at least 30% free space on local drives' },
  { layer: 'Hardware Safety', action: 'UPS Power Test', frequency: 'Bi-Annually', target: 'Ensure battery backups handle local power failures' },
  { layer: 'Access Control', action: 'User Permission Review', frequency: 'Quarterly', target: 'Instantly revoke access for terminated employees' },
  { layer: 'Access Control', action: 'Audit Trail Export', frequency: 'Monthly', target: 'Lock down immutable logs for compliance tracking' },
];

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input className="ovds-input w-full max-w-xs" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select className="ovds-input max-w-xs" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ToggleInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const checked = value === 'true';
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(checked ? 'false' : 'true')} className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    </label>
  );
}

function BackupsForm({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const f = (key: string) => ({ value: data[key] ?? '', onChange: (v: string) => onChange(key, v) });
  return (
    <div>
      <FieldRow label="Backup Frequency"><SelectInput {...f('backupFrequency')} options={[
        { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' },
      ]} /></FieldRow>
      <FieldRow label="Backup Retention (days)" hint="How long to keep backup copies"><TextInput {...f('backupRetentionDays')} placeholder="30" /></FieldRow>
      <FieldRow label="Automated Backups"><ToggleInput {...f('autoBackupEnabled')} label="Run backups on schedule without manual intervention" /></FieldRow>
      <FieldRow label="Cloud Sync"><ToggleInput {...f('cloudSyncEnabled')} label="Push encrypted copies to offsite cloud storage" /></FieldRow>
      <FieldRow label="DR Drill Frequency"><SelectInput {...f('drillFrequency')} options={[
        { label: 'Quarterly', value: 'quarterly' }, { label: 'Semi-Annually', value: 'semi_annually' }, { label: 'Annually', value: 'annually' },
      ]} /></FieldRow>
    </div>
  );
}

function PatchesForm({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const f = (key: string) => ({ value: data[key] ?? '', onChange: (v: string) => onChange(key, v) });
  return (
    <div>
      <FieldRow label="Patch Window Start" hint="Start time for maintenance window"><TextInput {...f('patchWindowStart')} placeholder="22:00" /></FieldRow>
      <FieldRow label="Patch Window End" hint="End time for maintenance window"><TextInput {...f('patchWindowEnd')} placeholder="23:59" /></FieldRow>
      <p className="text-xs text-slate-500 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5">
        Always test vendor updates in a sandbox environment before applying to production.
      </p>
    </div>
  );
}

function AccessForm({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const f = (key: string) => ({ value: data[key] ?? '', onChange: (v: string) => onChange(key, v) });
  return (
    <div>
      <FieldRow label="Permission Review Frequency"><SelectInput {...f('permissionReviewFrequency')} options={[
        { label: 'Monthly', value: 'monthly' }, { label: 'Quarterly', value: 'quarterly' }, { label: 'Annually', value: 'annually' },
      ]} /></FieldRow>
      <FieldRow label="Audit Log Retention (days)" hint="How long to keep immutable audit logs"><TextInput {...f('auditLogRetentionDays')} placeholder="365" /></FieldRow>
    </div>
  );
}

function DatabaseForm({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const f = (key: string) => ({ value: data[key] ?? '', onChange: (v: string) => onChange(key, v) });
  return (
    <div>
      <FieldRow label="Index Defrag Frequency"><SelectInput {...f('indexDefragFrequency')} options={[
        { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' },
      ]} /></FieldRow>
      <FieldRow label="Transaction Log Pruning"><ToggleInput {...f('logPruningEnabled')} label="Automatically prune old transaction logs" /></FieldRow>
      <FieldRow label="Historical Data Archiving"><SelectInput {...f('archivingFrequency')} options={[
        { label: 'Annually', value: 'annually' }, { label: 'Semi-Annually', value: 'semi_annually' },
      ]} /></FieldRow>
    </div>
  );
}

function HardwareForm({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const f = (key: string) => ({ value: data[key] ?? '', onChange: (v: string) => onChange(key, v) });
  return (
    <div>
      <FieldRow label="Minimum Free Storage %" hint="Alert when free space drops below this threshold"><TextInput {...f('minFreeStoragePct')} placeholder="30" /></FieldRow>
      <FieldRow label="UPS Test Frequency"><SelectInput {...f('upsTestFrequency')} options={[
        { label: 'Monthly', value: 'monthly' }, { label: 'Bi-Annually', value: 'bi_annually' }, { label: 'Annually', value: 'annually' },
      ]} /></FieldRow>
    </div>
  );
}

const FORM_MAP: Record<Tab, React.FC<{ data: Record<string, string>; onChange: (k: string, v: string) => void }>> = {
  overview: () => null,
  backups: BackupsForm,
  patches: PatchesForm,
  access: AccessForm,
  database: DatabaseForm,
  hardware: HardwareForm,
};

export const MaintainingTechnologyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setMsg(null);
  };

  const handleSave = async () => {
    if (Object.keys(draft).length === 0) return;
    setSaving(true); setMsg(null);
    setTimeout(() => {
      setDraft({});
      setSaving(false);
      setMsg('Maintenance settings saved');
      setTimeout(() => setMsg(null), 3000);
    }, 800);
  };

  const currentData = { ...draft };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Maintaining Technology</h1>
          <p className="text-sm text-slate-500 mt-1">IT maintenance schedules, backup verification, access controls, and infrastructure health monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="ovds-btn-secondary flex items-center gap-1.5 text-xs">
            <Play size={12} /> Run Diagnostics
          </button>
          {Object.keys(draft).length > 0 && (
            <>
              <button onClick={() => { setDraft({}); setMsg(null); }} className="ovds-btn-secondary text-xs">Discard</button>
              <button onClick={handleSave} disabled={saving} className="ovds-btn-primary text-xs disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
            </>
          )}
        </div>
      </div>

      {msg && <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-lg px-4 py-2.5 text-sm text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">{msg}</div>}

      <div className="grid gap-5" style={{ gridTemplateColumns: '220px 1fr' }}>
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sections</p>
          </div>
          <nav className="py-2" aria-label="Maintenance navigation">
            {TABS.map(tab => (
              <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); setDraft({}); setMsg(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-xs">
                  {tab.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{tab.label}</p>
                  <p className="text-[9px] text-slate-400 leading-tight truncate">{tab.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="ovds-widget-card p-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Critical On-Premise Risks</h2>
                <p className="text-sm text-slate-500 mt-1">Key risks that this module helps mitigate through scheduled maintenance.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {RISK_ITEMS.map(item => (
                  <div key={item.risk} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.risk}</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.impact}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Infrastructure Maintenance Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">Layer</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">Action</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">Frequency</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MAINTENANCE_MATRIX.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{row.layer}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{row.action}</td>
                          <td className="py-2 px-3 text-slate-500">{row.frequency}</td>
                          <td className="py-2 px-3 text-slate-500">{row.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <SettingsCard title="Execution Strategy" description="Best practices for implementing maintenance schedules">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Step 1: Isolate the Environment</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Never apply updates directly to your live production system. Create a duplicate staging environment to catch database corruption issues before moving changes live.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Step 2: Enforce the 3-2-1 Backup Rule</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Keep three total copies of your financial data. Store them on two different media types (e.g., local server and network attached storage). Keep one copy entirely offsite or in a secure cloud repository.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Step 3: Schedule Database Downtime</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Coordinate index defragmentation and transaction log clear-outs at night. Running these heavy maintenance tasks during the day can freeze user screens mid-transaction.</p>
                  </div>
                </div>
              </SettingsCard>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</h2>
                <p className="text-sm text-slate-500 mt-1">Configure {activeTab.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} parameters and schedules.</p>
              </div>
              <SettingsCard title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Configuration`}>
                {(() => { const C = FORM_MAP[activeTab]; return C ? <C data={currentData} onChange={handleChange} /> : null; })()}
              </SettingsCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintainingTechnologyPage;
