import { Copy, Eye, EyeOff, Key, Plus, RefreshCw, Trash2, CheckCircle2, Info, AlertTriangle, Shield, ExternalLink, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { confirm } from '../../utils/confirm';

const inputCls = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all";

const SCOPES = [
  { id: 'invoices:read',        label: 'Invoices — Read',        group: 'ovds',  desc: 'List and view invoices' },
  { id: 'invoices:write',       label: 'Invoices — Write',       group: 'ovds',  desc: 'Create and update invoices' },
  { id: 'bills:read',           label: 'Bills — Read',           group: 'ovds',  desc: 'List and view bills' },
  { id: 'expenses:read',        label: 'Expenses — Read',        group: 'ovds',  desc: 'View expense claims' },
  { id: 'payroll:read',         label: 'Payroll — Read',         group: 'HR',       desc: 'View payroll records' },
  { id: 'employees:read',       label: 'Employees — Read',       group: 'HR',       desc: 'List and view employees' },
  { id: 'attendance:read',      label: 'Attendance — Read',      group: 'HR',       desc: 'View attendance records' },
  { id: 'reports:read',         label: 'Reports — Read',         group: 'Reports',  desc: 'Access financial reports' },
  { id: 'vat:read',             label: 'VAT — Read',             group: 'Tax',      desc: 'View VAT filings and data' },
  { id: 'settings:read',        label: 'Settings — Read',        group: 'System',   desc: 'Read system settings' },
  { id: 'audit_logs:read',      label: 'Audit Logs — Read',      group: 'System',   desc: 'View audit trail' },
];

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
  description?: string;
}

interface Props { canWrite: boolean; }

const ApiKeysTab: React.FC<Props> = ({ canWrite }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', scopes: [] as string[], expiresIn: '90' });
  const [creating, setCreating] = useState(false);
  const [_revealedKeys, _setRevealedKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/auth/api-keys', { headers: { 'x-background': '1' } })
      .then((r: any) => {
        const data = r.data?.data;
        setKeys(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, []);

  const toggleScope = (s: string) =>
    setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }));

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.scopes.length) { toast.error('Select at least one scope'); return; }
    setCreating(true);
    try {
      const r = await api.post('/auth/api-keys', form);
      const data = r.data?.data ?? r.data;
      setNewKey(data.key ?? data.token ?? null);
      setShowKey(true);
      setKeys(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ name: '', description: '', scopes: [], expiresIn: '90' });
      toast.success('API key created — copy it now, it won\'t be shown again');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to create API key. Check your permissions.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    const ok = await confirm({ title: 'Revoke API key?', message: 'This cannot be undone.', variant: 'danger', confirmLabel: 'Revoke' });
    if (!ok) return;
    try {
      await api.delete(`/auth/api-keys/${id}`);
      setKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false } : k));
      toast.success('API key revoked');
    } catch { toast.error('Failed to revoke API key'); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const daysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
    return diff;
  };

  const expiryBadge = (expiresAt?: string) => {
    const days = daysUntilExpiry(expiresAt);
    if (days === null) return null;
    if (days < 0)  return { label: 'Expired',        cls: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800' };
    if (days <= 7) return { label: `${days}d left`,  cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' };
    if (days <= 30) return { label: `${days}d left`, cls: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' };
    return null;
  };

  const toggleGroupScopes = (group: string) => {
    const groupIds = SCOPES.filter(s => s.group === group).map(s => s.id);
    const allSelected = groupIds.every(id => form.scopes.includes(id));
    setForm(f => ({
      ...f,
      scopes: allSelected
        ? f.scopes.filter(s => !groupIds.includes(s))
        : [...new Set([...f.scopes, ...groupIds])],
    }));
  };

  const scopeGroups = SCOPES.reduce<Record<string, typeof SCOPES>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
        <Info size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--pro-azure-dark)] dark:text-green-300 mb-0.5">API Keys for external integrations</p>
          <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
            Each key is scoped to specific permissions and shown <strong>only once</strong> at creation.
            Store keys in a secrets manager — never in source code or plain text files.
          </p>
        </div>
        <a href="https://ovds.com.et/docs/api" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0">
          Docs <ExternalLink size={9} />
        </a>
      </div>

      {/* New key revealed */}
      {newKey && (
        <div className="p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border-2 border-[var(--pro-azure)] dark:border-[var(--pro-azure-light)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
              <p className="text-sm font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">Your new API key — copy it now</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800">
              Won't be shown again
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className={`flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-[var(--pro-azure-light)] dark:border-green-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto transition-all ${showKey ? '' : 'blur-sm select-none'}`}>
              {newKey}
            </code>
            <button onClick={() => setShowKey(v => !v)}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors shrink-0"
              title={showKey ? 'Hide key' : 'Reveal key'}>
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={() => copyToClipboard(newKey)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--pro-azure)] text-white text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shrink-0">
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="ovds-caption">Paste this key into your integration or secrets manager immediately.</p>
            <button onClick={() => { setNewKey(null); setShowKey(false); }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              I've saved it — dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 rounded-full bg-[var(--pro-azure-50)]0 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{keys.length} API Key{keys.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure)] text-white rounded-lg text-[10px] font-semibold hover:bg-[var(--pro-azure-dark)] transition-colors">
            <Plus size={11} /> New API Key
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="p-5 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-full bg-[var(--pro-azure-50)]0 shrink-0 inline-block" />New API Key
          </p>
          <div className="ovds-grid-layout cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Name <span className="text-rose-400">*</span></label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Zapier Integration" className={inputCls} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Expires In</label>
              <select value={form.expiresIn} onChange={e => setForm(f => ({ ...f, expiresIn: e.target.value }))}
                className={inputCls + " appearance-none cursor-pointer"}>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="0">Never</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Scopes <span className="text-rose-400">*</span></label>
              <button type="button" onClick={() => setForm(f => ({ ...f, scopes: f.scopes.length === SCOPES.length ? [] : SCOPES.map(s => s.id) }))}
                className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
                {form.scopes.length === SCOPES.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(scopeGroups).map(([group, scopes]) => {
                const groupIds = scopes.map(s => s.id);
                const allGroupSelected = groupIds.every(id => form.scopes.includes(id));
                return (
                  <div key={group} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{group}</p>
                      <button type="button" onClick={() => toggleGroupScopes(group)}
                        className="text-[9px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
                        {allGroupSelected ? 'None' : 'All'}
                      </button>
                    </div>
                    {scopes.map(s => (
                      <label key={s.id} className="flex items-start gap-2 cursor-pointer group">
                        <div onClick={() => toggleScope(s.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${form.scopes.includes(s.id) ? 'bg-[var(--pro-azure-50)]0 border-[var(--pro-azure)]' : 'border-slate-300 dark:border-slate-600 group-hover:border-[var(--pro-azure)]'}`}>
                          {form.scopes.includes(s.id) && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.label}</span>
                          <p className="ovds-caption">{s.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-lg text-xs font-medium hover:bg-[var(--pro-azure-dark)] transition-colors shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30 disabled:opacity-50">
              {creating ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
              {creating ? 'Creating...' : 'Create Key'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : keys.length === 0 ? (
        <div className="ovds-empty">
          <Key size={32} strokeWidth={1.5} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No API keys yet</p>
          {canWrite && <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">Create your first key</button>}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {keys.map(k => {
            const expiry = expiryBadge(k.expiresAt);
            return (
              <div key={k.id} className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!k.isActive ? 'opacity-50' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.isActive ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Key size={15} className={k.isActive ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{k.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${k.isActive ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)]' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {k.isActive ? 'Active' : 'Revoked'}
                    </span>
                    {expiry && (
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${expiry.cls}`}>
                        <Clock size={9} /> {expiry.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{k.prefix}••••••••</code>
                    {k.scopes?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {k.scopes.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] rounded-full border border-[var(--pro-azure-100)] dark:border-green-900">{s}</span>
                        ))}
                        {k.scopes.length > 3 && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">+{k.scopes.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · Never used'}
                    {k.expiresAt && ` · Expires ${new Date(k.expiresAt).toLocaleDateString()}`}
                    {!k.expiresAt && ' · No expiry'}
                  </p>
                </div>
                {canWrite && k.isActive && (
                  <button onClick={() => handleRevoke(k.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                    title="Revoke key">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Usage example */}
      <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117]">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Usage Example</p>
          <button onClick={() => copyToClipboard(`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  https://ovds.com.et/api/invoices?companyId=YOUR_COMPANY_ID`)}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
            <Copy size={10} /> Copy
          </button>
        </div>
        <pre className="p-4 text-[11px] font-mono text-[var(--pro-azure-light)] overflow-x-auto leading-relaxed">{`# List invoices
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://ovds.com.et/api/invoices?companyId=YOUR_COMPANY_ID

# Get a specific invoice
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://ovds.com.et/api/invoices/INVOICE_ID

# Create an invoice
curl -X POST -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"customerId":"...","items":[...]}' \\
  https://ovds.com.et/api/invoices`}</pre>
      </div>

      {/* Security tips */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden divide-y divide-amber-100 dark:divide-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10">
        {[
          { icon: <Shield size={11} />, text: 'Store API keys in environment variables or a secrets manager — never in source code.' },
          { icon: <AlertTriangle size={11} />, text: 'Rotate keys every 90 days. Set an expiry when creating keys for time-limited integrations.' },
          { icon: <Key size={11} />, text: 'Use the minimum scopes needed. A read-only integration should never have write permissions.' },
          { icon: <Clock size={11} />, text: 'Revoke keys immediately if a service is decommissioned or credentials are suspected compromised.' },
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[11px] text-amber-700 dark:text-amber-400">
            <span className="shrink-0 mt-0.5 text-amber-500">{tip.icon}</span> {tip.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeysTab;









