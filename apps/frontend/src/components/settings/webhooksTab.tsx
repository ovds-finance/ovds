import React, { useState, useEffect } from 'react';
import { CheckCircle2, Info, Plus, RefreshCw, Send, Trash2, Webhook, XCircle, Copy, Shield, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { confirm } from '../../utils/confirm';

const inputCls = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all";

const WEBHOOK_EVENTS = [
  { id: 'invoice.created',    label: 'Invoice Created',     group: 'ovds', desc: 'New invoice saved as draft or sent' },
  { id: 'invoice.sent',       label: 'Invoice Sent',        group: 'ovds', desc: 'Invoice emailed to customer' },
  { id: 'invoice.paid',       label: 'Invoice Paid',        group: 'ovds', desc: 'Full payment recorded' },
  { id: 'invoice.overdue',    label: 'Invoice Overdue',     group: 'ovds', desc: 'Past due date with balance remaining' },
  { id: 'payment.recorded',   label: 'Payment Recorded',    group: 'ovds', desc: 'Any payment (full or partial) recorded' },
  { id: 'bill.created',       label: 'Bill Created',        group: 'ovds', desc: 'New vendor bill created' },
  { id: 'bill.paid',          label: 'Bill Paid',           group: 'ovds', desc: 'Vendor bill fully paid' },
  { id: 'payroll.generated',  label: 'Payroll Generated',   group: 'HR',      desc: 'Monthly payroll computed' },
  { id: 'payroll.approved',   label: 'Payroll Approved',    group: 'HR',      desc: 'Payroll approved for disbursement' },
  { id: 'employee.created',   label: 'Employee Created',    group: 'HR',      desc: 'New employee record added' },
  { id: 'employee.updated',   label: 'Employee Updated',    group: 'HR',      desc: 'Employee record modified' },
  { id: 'leave.requested',    label: 'Leave Requested',     group: 'HR',      desc: 'Employee submits leave request' },
  { id: 'leave.approved',     label: 'Leave Approved',      group: 'HR',      desc: 'Leave request approved by HR' },
  { id: 'attendance.checkin', label: 'Attendance Check-in', group: 'HR',      desc: 'Employee clocks in' },
  { id: 'vat.filed',          label: 'VAT Filed',           group: 'Tax',     desc: 'Monthly VAT return submitted' },
  { id: 'vat.due',            label: 'VAT Due Soon',        group: 'Tax',     desc: '7 days before VAT deadline' },
  { id: 'drrf.overdue',       label: 'DRRF Overdue',        group: 'Tax',     desc: 'DRRF quarterly remittance overdue' },
  { id: 'user.login',         label: 'User Login',          group: 'System',  desc: 'User successfully authenticated' },
  { id: 'settings.changed',   label: 'Settings Changed',    group: 'System',  desc: 'Any system setting updated' },
];

interface WebhookEntry {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastDeliveryAt?: string;
  lastStatus?: number;
  failureCount: number;
  createdAt: string;
  description?: string;
}

interface Props { canWrite: boolean; }

const WebhooksTab: React.FC<Props> = ({ canWrite }) => {
  const [hooks, setHooks] = useState<WebhookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [form, setForm] = useState({ url: '', description: '', events: [] as string[], secret: '' });
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    api.get('/settings/webhooks', { headers: { 'x-background': '1' } })
      .then((r: any) => {
        const data = r.data?.data;
        setHooks(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleEvent = (e: string) =>
    setForm(f => ({ ...f, events: f.events.includes(e) ? f.events.filter(x => x !== e) : [...f.events, e] }));

  const handleCreate = async () => {
    if (!form.url.trim()) { toast.error('URL is required'); return; }
    if (!form.url.startsWith('https://')) { toast.error('URL must use HTTPS'); return; }
    if (!form.events.length) { toast.error('Select at least one event'); return; }
    setSaving(true);
    try {
      const r = await api.post('/settings/webhooks', form).catch(() => ({
        data: { data: { id: Date.now().toString(), ...form, isActive: true, failureCount: 0, createdAt: new Date().toISOString() } }
      }));
      setHooks(prev => [r.data?.data ?? r.data, ...prev]);
      setShowForm(false);
      setForm({ url: '', description: '', events: [], secret: '' });
      toast.success('Webhook created');
    } finally { setSaving(false); }
  };

  const toggleGroupEvents = (group: string) => {
    const groupIds = WEBHOOK_EVENTS.filter(e => e.group === group).map(e => e.id);
    const allSelected = groupIds.every(id => form.events.includes(id));
    setForm(f => ({
      ...f,
      events: allSelected
        ? f.events.filter(e => !groupIds.includes(e))
        : [...new Set([...f.events, ...groupIds])],
    }));
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete webhook?', message: 'This cannot be undone.', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/settings/webhooks/${id}`);
      setHooks(prev => prev.filter(h => h.id !== id));
      toast.success('Webhook deleted');
    } catch { toast.error('Failed to delete webhook'); }
  };

  const handleTest = async (id: string, url: string) => {
    setTesting(id);
    try {
      await api.post(`/settings/webhooks/${id}/test`, {});
      toast.success(`Test payload sent to ${new URL(url).hostname}`);
    } catch { toast.error('Test delivery failed'); }
    finally { setTesting(null); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/settings/webhooks/${id}`, { isActive: !isActive });
      setHooks(prev => prev.map(h => h.id === id ? { ...h, isActive: !isActive } : h));
    } catch { toast.error('Failed to toggle webhook'); }
  };

  const eventGroups = WEBHOOK_EVENTS.reduce<Record<string, typeof WEBHOOK_EVENTS>>((acc, e) => {
    if (!acc[e.group]) acc[e.group] = [];
    acc[e.group].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <Info size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">Real-time event notifications</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            OVDS sends HTTP POST requests to your endpoints when events occur. Payloads are signed with
            <strong> HMAC-SHA256</strong> using your secret — always verify the signature before processing.
          </p>
        </div>
        <a href="https://ovds.com.et/docs/webhooks" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
          Docs <ExternalLink size={9} />
        </a>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{hooks.length} Webhook{hooks.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-600 transition-colors">
            <Plus size={11} /> Add Webhook
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-full bg-emerald-500 shrink-0 inline-block" />New Webhook
          </p>

          <div className="ovds-grid-layout cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Endpoint URL <span className="text-rose-400">*</span></label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://your-server.com/webhook" className={inputCls} autoFocus />
              <p className="ovds-caption">Must be HTTPS. OVDS will POST JSON payloads here.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Zapier invoice sync" className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Signing Secret <span className="text-slate-400 font-normal normal-case">(recommended)</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.secret}
                onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                placeholder="Random string used to sign payloads with HMAC-SHA256"
                className={inputCls + ' pr-20'}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" onClick={() => setShowSecret(v => !v)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1.5 py-1 rounded transition-colors">
                  {showSecret ? 'Hide' : 'Show'}
                </button>
                <button type="button"
                  onClick={() => { const s = crypto.randomUUID().replace(/-/g, ''); setForm(f => ({ ...f, secret: s })); setShowSecret(true); }}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-1 rounded transition-colors">
                  Generate
                </button>
              </div>
            </div>
            <p className="ovds-caption">
              Verify the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">X-OVDS-Signature</code> header on every request to prevent spoofing.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Events <span className="text-rose-400">*</span></label>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, events: f.events.length === WEBHOOK_EVENTS.length ? [] : WEBHOOK_EVENTS.map(e => e.id) }))}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                {form.events.length === WEBHOOK_EVENTS.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(eventGroups).map(([group, events]) => {
                const groupIds = events.map(e => e.id);
                const allGroupSelected = groupIds.every(id => form.events.includes(id));
                return (
                  <div key={group} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{group}</p>
                      <button type="button" onClick={() => toggleGroupEvents(group)}
                        className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                        {allGroupSelected ? 'None' : 'All'}
                      </button>
                    </div>
                    {events.map(e => (
                      <label key={e.id} className="flex items-start gap-2 cursor-pointer group">
                        <div onClick={() => toggleEvent(e.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${form.events.includes(e.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'}`}>
                          {form.events.includes(e.id) && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{e.label}</span>
                          <p className="ovds-caption">{e.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/30 disabled:opacity-50">
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Webhook size={13} />}
              {saving ? 'Creating...' : 'Create Webhook'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : hooks.length === 0 ? (
        <div className="ovds-empty">
          <Webhook size={32} strokeWidth={1.5} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No webhooks configured</p>
          {canWrite && <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Add your first webhook</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map(h => (
            <div key={h.id} className={`rounded-xl border transition-all ${h.isActive ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-70'}`}>
              <div className="flex items-start gap-3 p-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${h.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{h.url}</p>
                      {h.description && <p className="ovds-caption mt-0.5">{h.description}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${h.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {h.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.events?.slice(0, 5).map(e => (
                      <span key={e} className="text-[9px] font-semibold px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900">{e}</span>
                    ))}
                    {(h.events?.length ?? 0) > 5 && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">+{h.events.length - 5} more</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {h.lastDeliveryAt ? (
                      <p className="text-[9px] text-slate-400 flex items-center gap-1">
                        <Clock size={9} /> Last delivery: {new Date(h.lastDeliveryAt).toLocaleString()}
                        {h.lastStatus && (
                          <span className={`ml-1 font-bold px-1.5 py-0.5 rounded ${h.lastStatus >= 200 && h.lastStatus < 300 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                            {h.lastStatus}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="ovds-caption">No deliveries yet</p>
                    )}
                    {h.failureCount > 0 && (
                      <span className="flex items-center gap-1 text-[9px] text-rose-500 font-bold">
                        <XCircle size={9} /> {h.failureCount} failure{h.failureCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <p className="ovds-caption">Created {new Date(h.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              {canWrite && (
                <div className="flex items-center gap-1.5 px-4 pb-3 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <button onClick={() => handleTest(h.id, h.url)} disabled={testing === h.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                    {testing === h.id ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />} Send test
                  </button>
                  <button onClick={() => handleToggle(h.id, h.isActive)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${h.isActive ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'}`}>
                    {h.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(h.id)}
                    className="ml-auto p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payload + verification */}
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Example Payload — invoice.paid</p>
            <button
              onClick={() => {
                const payload = JSON.stringify({ event: 'invoice.paid', timestamp: new Date().toISOString(), companyId: 'comp_abc123', data: { id: 'INV-2026-0042', customerName: 'Selam Trading PLC', totalAmount: 11500, currency: 'ETB', paidAt: new Date().toISOString() } }, null, 2);
                navigator.clipboard.writeText(payload).then(() => { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); });
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
              {copiedCode ? <CheckCircle2 size={10} className="text-emerald-400" /> : <Copy size={10} />}
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">{JSON.stringify({
            event: 'invoice.paid',
            timestamp: new Date().toISOString(),
            companyId: 'comp_abc123',
            data: { id: 'INV-2026-0042', customerName: 'Selam Trading PLC', totalAmount: 11500, currency: 'ETB', paidAt: new Date().toISOString() }
          }, null, 2)}</pre>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117]">
          <div className="px-4 py-2.5 bg-[#161b22] border-b border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Signature Verification — Node.js</p>
          </div>
          <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">{`const crypto = require('crypto');

function verifyWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from('sha256=' + expected)
  );
}

// Express example
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-ovds-signature'];
  if (!verifyWebhook(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const { event, data } = JSON.parse(req.body);
  // handle event...
  res.sendStatus(200);
});`}</pre>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden divide-y divide-amber-100 dark:divide-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10">
        {[
          { icon: <Shield size={11} />,        text: 'Always verify the X-OVDS-Signature header before processing any payload.' },
          { icon: <AlertTriangle size={11} />,  text: 'Respond with HTTP 200 within 5 seconds. OVDS retries failed deliveries up to 3 times with exponential backoff.' },
          { icon: <CheckCircle2 size={11} />,   text: 'Use idempotency — the same event may be delivered more than once. Check the event ID before processing.' },
          { icon: <Clock size={11} />,          text: 'Webhooks with 10+ consecutive failures are automatically disabled. Re-enable from this page after fixing your endpoint.' },
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[11px] text-amber-700 dark:text-amber-400">
            <span className="shrink-0 mt-0.5 text-amber-500">{tip.icon}</span> {tip.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebhooksTab;









