import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Download,
  XCircle,
} from 'lucide-react';
import { Badge } from '@ovds/ui';

interface OfflineQueueItem {
  id: string;
  companyId: string;
  invoiceData: any;
  status: string;
  deviceId: string;
  fiscalYear: string;
  sequenceNumber: number;
  createdAt: string;
  syncedAt?: string;
  syncError?: string;
}

interface OfflineCapabilities {
  canWorkOffline: boolean;
  requiresResilience: boolean;
  offlineStorageLimit: number;
  syncStrategy: string;
  lastSyncTimestamp?: string;
  pendingSyncCount: number;
  regulatedSectors?: string[];
  companySectors?: string[];
  regulatedSector?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(n);

export default function OfflineResilience() {
  const { t } = useTranslation();
  const { selectedCompanyId } = useBusiness();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [capabilities, setCapabilities] = useState<OfflineCapabilities | null>(null);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [sectors, setSectors] = useState<{ sectors: string[]; regulation: string; legalNotice: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const [caps, q, s] = await Promise.all([
        api.get(`/offline/capabilities?companyId=${selectedCompanyId}`).then(r => r.data),
        api.get(`/offline/queued-invoices?companyId=${selectedCompanyId}`).then(r => r.data),
        api.get('/offline/regulated-sectors').then(r => r.data),
      ]);
      setCapabilities(caps);
      setQueue(Array.isArray(q) ? q : []);
      setSectors(s);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load offline resilience data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  const handleSync = async () => {
    if (!selectedCompanyId) return;
    setSyncing(true);
    try {
      const res = await api.post('/offline/sync', { deviceId: undefined, strategy: 'SKIP' });
      const results = res.data || [];
      const synced = results.filter((r: any) => r.status === 'SYNCED').length;
      const failed = results.filter((r: any) => r.status === 'FAILED').length;
      if (synced > 0) toast.success(`Synced ${synced} invoice(s)`);
      if (failed > 0) toast.error(`${failed} invoice(s) failed to sync`);
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (queueId: string) => {
    if (!confirm('Delete this queued invoice? This cannot be undone.')) return;
    try {
      await api.delete(`/offline/queued-invoices/${queueId}`);
      toast.success('Queued invoice deleted');
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  const pending = queue.filter(q => q.status === 'PENDING');
  const failed = queue.filter(q => q.status === 'FAILED');
  const conflicts = queue.filter(q => q.status === 'CONFLICT');
  const syncedCount = queue.filter(q => q.status === 'SYNCED').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <WifiOff size={28} className="text-rose-500" />
            Offline Resilience
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            MoR Regulation No. 570/2025 — Mandatory offline capability for regulated sectors
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || pending.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading offline resilience status…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regulated Sector</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                {capabilities?.requiresResilience ? 'YES' : 'No'}
              </p>
              {capabilities?.regulatedSector && (
                <p className="text-xs text-slate-500 mt-1">{capabilities.regulatedSector}</p>
              )}
              {capabilities?.companySectors && capabilities.companySectors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {capabilities.companySectors.map((s: string) => (
                    <Badge key={s} variant="emerald" size="sm">{s}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Sync</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {capabilities?.pendingSyncCount ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {capabilities?.syncStrategy === 'IMMEDIATE' ? 'Auto-sync enabled' : 'Batch sync'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Limit</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {(capabilities?.offlineStorageLimit ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Max offline invoices</p>
            </div>
          </div>

          {capabilities?.requiresResilience && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    Regulated Sector — Offline Mode Required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Businesses in regulated sectors are legally required to have offline functionality.
                    All sales must continue during internet interruptions and sync within 72 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Offline Invoice Queue
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" size="sm">{pending.length} pending</Badge>
                <Badge variant="emerald" size="sm">{syncedCount} synced</Badge>
                {failed.length > 0 && <Badge variant="destructive" size="sm">{failed.length} failed</Badge>}
                {conflicts.length > 0 && <Badge variant="amber" size="sm">{conflicts.length} conflicts</Badge>}
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                No offline invoices in queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {queue.map(item => {
                  const data = typeof item.invoiceData === 'string' ? JSON.parse(item.invoiceData) : item.invoiceData;
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
                    SYNCING: 'bg-sky-100 text-sky-700 border-sky-200',
                    SYNCED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
                    CONFLICT: 'bg-orange-100 text-orange-700 border-orange-200',
                  };
                  return (
                    <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {data?.invoiceNumber || item.invoiceNumber || 'DRAFT'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {data?.customerName || 'Unknown'} · {fmt(data?.totalAmount || 0)} · {item.fiscalYear}
                        </p>
                        {item.syncError && (
                          <p className="text-xs text-rose-600 mt-1">{item.syncError}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${statusColors[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {item.status}
                        </span>
                        {item.status !== 'SYNCED' && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete queued invoice"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
