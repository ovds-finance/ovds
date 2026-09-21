/**
 * BankFeeds — bank feed connection management
 *
 * Connect / disconnect / sync / re-authenticate bank feeds via:
 *   Plaid, GoCardless, or Manual (MT940/OFX upload).
 *
 * Sync failure troubleshooting flow:
 *   [Token Expired] → Re-authenticate → MFA OTP → Sync Resumed
 *
 * API endpoints:
 *   GET    /banking/feeds
 *   POST   /banking/feeds           { bankAccountId, provider }
 *   POST   /banking/feeds/:id/sync
 *   DELETE /banking/feeds/:id
 *   POST   /banking/feeds/:id/reauthenticate
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Rss, Plus, RefreshCw, Unlink, AlertTriangle,
  CheckCircle2, Clock, Upload, ShieldAlert,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Select,
  EmptyState, Card,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

interface BankFeed {
  id: string; bankAccountId: string; provider: string; status: string;
  lastSyncAt?: string; institutionName?: string; institutionId?: string;
  errorMessage?: string; createdAt: string; updatedAt: string;
}
interface BankAccount { id: string; name: string; bankName: string; }

const PROVIDER_INFO: Record<string, { label: string; desc: string; color: string }> = {
  PLAID:       { label: 'Plaid',         desc: 'Open banking — US/EU institutions',         color: 'bg-sky-500'    },
  GOCARDLESS:  { label: 'GoCardless',    desc: 'Open banking — UK/EU/AU institutions',      color: 'bg-violet-500' },
  MANUAL:      { label: 'Manual Upload', desc: 'MT940 / OFX / QBO statement upload',        color: 'bg-slate-500'  },
};

const STATUS_STYLE: Record<string, { icon: React.ReactNode; cls: string }> = {
  CONNECTED:    { icon: <CheckCircle2 size={11} />, cls: 'text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:text-[var(--pro-azure-light)] dark:bg-green-950/20 dark:border-green-800' },
  DISCONNECTED: { icon: <Unlink size={11} />,       cls: 'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700' },
  ERROR:        { icon: <AlertTriangle size={11} />,cls: 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-800' },
  PENDING_AUTH: { icon: <Clock size={11} />,        cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800' },
};

const BankFeeds: React.FC = () => {
  usePageTitle('Bank Feeds');
  const { can }               = useAuth();
  const { selectedCompanyId } = useBusiness();
  const _qc                    = useQueryClient();
  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  const [connectModal, setConnectModal] = useState(false);
  const [form, setForm] = useState({ bankAccountId: '', provider: 'MANUAL', institutionId: '' });
  const [saving, setSaving] = useState(false);

  const { data: feedsRaw = [], isLoading: feedsLoading, refetch } = useQuery({
    queryKey: ['bank-feeds', selectedCompanyId],
    queryFn: () => api.get(`/banking/feeds${cq}`).then(r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; }).catch(() => []),
    staleTime: 30_000,
  });
  const feeds: BankFeed[] = feedsRaw;

  const { data: accountsRaw = [] } = useQuery({
    queryKey: ['banking-accounts', selectedCompanyId],
    queryFn: () => api.get(`/banking/accounts${cq}`).then(r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; }).catch(() => []),
    staleTime: 60_000,
  });
  const accounts: BankAccount[] = accountsRaw;

  const kpi = [
    { label: 'Total Feeds',  value: feeds.length,                                              color: 'slate'   as const },
    { label: 'Connected',    value: feeds.filter(f => f.status === 'CONNECTED').length,        color: 'green' as const },
    { label: 'Errors',       value: feeds.filter(f => f.status === 'ERROR').length,            color: 'rose'    as const },
    { label: 'Pending Auth', value: feeds.filter(f => f.status === 'PENDING_AUTH').length,     color: 'amber'   as const },
  ];

  const handleConnect = useCallback(async () => {
    if (!form.bankAccountId) { toast.error('Select a bank account'); return; }
    setSaving(true);
    try {
      await api.post('/banking/feeds', { ...form, companyId: selectedCompanyId });
      toast.success('Feed connected');
      setConnectModal(false);
      setForm({ bankAccountId: '', provider: 'MANUAL', institutionId: '' });
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to connect feed');
    } finally {
      setSaving(false);
    }
  }, [form, selectedCompanyId, refetch]);

  const handleSync = useCallback(async (id: string) => {
    try {
      const r = await api.post(`/banking/feeds/${id}/sync`);
      const d = r.data?.data ?? r.data;
      toast.success(`Sync complete — ${d?.synced ?? 0} new transactions`);
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Sync failed');
    }
  }, [refetch]);

  const handleDisconnect = useCallback(async (id: string) => {
    if (!confirm('Disconnect this bank feed? Existing transactions will not be removed.')) return;
    try {
      await api.delete(`/banking/feeds/${id}`);
      toast.success('Feed disconnected');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    }
  }, [refetch]);

  const handleReauth = useCallback(async (id: string) => {
    try {
      const r = await api.post(`/banking/feeds/${id}/reauthenticate`);
      const d = r.data?.data ?? r.data;
      if (d?.authUrl) {
        window.open(d.authUrl, '_blank', 'noopener');
      } else {
        toast.success('Re-authentication initiated — follow your bank\'s instructions');
      }
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to initiate re-authentication');
    }
  }, [refetch]);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id.slice(0, 12) + '…';

  return (
    <AppPage
      title="Bank Feeds"
      subtitle="Automated bank connections via Plaid · GoCardless · Manual MT940/OFX upload"
      icon={<Rss size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'Banking', to: '/banking' }, { label: 'Bank Feeds' }]}
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          {can('banking:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setConnectModal(true)}>
              Connect Feed
            </Btn>
          )}
        </div>
      }
    >
      <AppKpi cells={kpi} loading={feedsLoading} />

      {/* Troubleshooting guide */}
      {feeds.some(f => f.status === 'ERROR' || f.status === 'PENDING_AUTH') && (
        <Card className="p-4 border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10">
          <div className="flex items-start gap-3">
            <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-amber-800 dark:text-amber-300 mb-1">Sync Issues Detected</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
                Bank connection tokens expire every ~90 days due to open banking security standards.
              </p>
              <p className="text-[11px] font-mono text-amber-600 dark:text-amber-500">
                [Token Expired] → Click "Re-authenticate" → Complete MFA → Sync Resumed
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Feed cards */}
      {feedsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : feeds.length === 0 ? (
        <EmptyState
          icon={<Rss size={20} className="text-[var(--pro-azure-light)]" />}
          title="No bank feeds connected"
          desc="Connect Plaid or GoCardless for automated syncing, or use the MT940/OFX importer for manual uploads."
          action={can('banking:write') ? { label: 'Connect Feed', onClick: () => setConnectModal(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {feeds.map(feed => {
            const prov    = PROVIDER_INFO[feed.provider] ?? PROVIDER_INFO.MANUAL;
            const st      = STATUS_STYLE[feed.status]   ?? STATUS_STYLE.DISCONNECTED;
            const hasError = feed.status === 'ERROR' || feed.status === 'PENDING_AUTH';
            return (
              <div key={feed.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${prov.color} text-white flex items-center justify-center text-[10px] font-bold`}>
                      <Rss size={13} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{getAccountName(feed.bankAccountId)}</p>
                      <p className="text-[10px] text-slate-400">{prov.label}{feed.institutionName ? ` · ${feed.institutionName}` : ''}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>
                    {st.icon}{feed.status}
                  </span>
                </div>

                {feed.lastSyncAt && (
                  <p className="text-[10px] text-slate-400">
                    Last sync: {new Date(feed.lastSyncAt).toLocaleString()}
                  </p>
                )}
                {feed.errorMessage && (
                  <p className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg">{feed.errorMessage}</p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  <Btn variant="secondary" size="sm" icon={<RefreshCw size={10} />} onClick={() => handleSync(feed.id)}>Sync</Btn>
                  {hasError ? (
                    <Btn variant="primary" size="sm" onClick={() => handleReauth(feed.id)}>Re-authenticate</Btn>
                  ) : (
                    <Btn variant="ghost" size="sm" icon={<Unlink size={10} />} onClick={() => handleDisconnect(feed.id)}>Disconnect</Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feeds table (secondary) */}
      {feeds.length > 0 && (
        <AppTable>
          <thead><tr>
            <AppTh>Account</AppTh><AppTh>Provider</AppTh><AppTh>Status</AppTh>
            <AppTh>Last Sync</AppTh><AppTh align="right" width="160px">Actions</AppTh>
          </tr></thead>
          <tbody>
            {feeds.map(feed => {
              const st = STATUS_STYLE[feed.status] ?? STATUS_STYLE.DISCONNECTED;
              const hasError = feed.status === 'ERROR' || feed.status === 'PENDING_AUTH';
              return (
                <AppTr key={feed.id}>
                  <AppTd><span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{getAccountName(feed.bankAccountId)}</span></AppTd>
                  <AppTd><span className="text-[11px] text-slate-500">{PROVIDER_INFO[feed.provider]?.label ?? feed.provider}</span></AppTd>
                  <AppTd>
                    <span className={`flex items-center gap-1 w-fit text-[9px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>
                      {st.icon}{feed.status}
                    </span>
                  </AppTd>
                  <AppTd>
                    <span className="text-[11px] text-slate-400">
                      {feed.lastSyncAt ? new Date(feed.lastSyncAt).toLocaleString() : '—'}
                    </span>
                  </AppTd>
                  <AppTd align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Btn variant="ghost" size="sm" icon={<RefreshCw size={9} />} onClick={() => handleSync(feed.id)}>Sync</Btn>
                      {hasError
                        ? <Btn variant="secondary" size="sm" onClick={() => handleReauth(feed.id)}>Re-auth</Btn>
                        : <Btn variant="ghost" size="sm" onClick={() => handleDisconnect(feed.id)}>Disconnect</Btn>}
                    </div>
                  </AppTd>
                </AppTr>
              );
            })}
          </tbody>
        </AppTable>
      )}

      {/* Manual import shortcut */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <Upload size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">MT940 / OFX Manual Import</p>
          <p className="text-[10px] text-slate-400">Upload .OFX, .QBO, or .XML exported from your bank — no connection required.</p>
        </div>
        <Btn variant="secondary" size="sm" icon={<Upload size={11} />} onClick={() => window.location.href = '/banking/statement-import'}>
          Import Statement
        </Btn>
      </div>

      {/* Connect modal */}
      <Modal open={connectModal} onClose={() => setConnectModal(false)}
        title="Connect Bank Feed"
        subtitle="Automated sync via open banking or manual statement upload"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setConnectModal(false)}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleConnect}>Connect</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Bank Account" required>
            <Select value={form.bankAccountId} onChange={e => setForm(f => ({ ...f, bankAccountId: e }))}>
              <option value="">Select account…</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>)}
            </Select>
          </FormField>
          <FormField label="Provider" required>
            <Select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e }))}>
              <option value="MANUAL">Manual / MT940 / OFX Upload</option>
              <option value="PLAID">Plaid (Open Banking)</option>
              <option value="GOCARDLESS">GoCardless (Open Banking)</option>
            </Select>
          </FormField>
          {form.provider !== 'MANUAL' && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 text-[11px] text-sky-700 dark:text-sky-400">
              After connecting, you will be redirected to your bank's authentication page.
              Tokens expire every ~90 days — use "Re-authenticate" to renew.
            </div>
          )}
        </div>
      </Modal>
    </AppPage>
  );
};

export default BankFeeds;
