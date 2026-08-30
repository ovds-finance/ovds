/**
 * ActivityFeedDrawer — global slide-over showing recent audit/activity events.
 * Enhanced with real-time polling, action type filters, and live indicator.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  X, Activity, RefreshCw, ShieldCheck, User, FileText,
  Banknote, Settings, Trash2, Edit3, Plus, LogIn, LogOut,
  AlertTriangle, Clock, ChevronRight, Filter, Circle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../rbac/AuthContext';
import { useInterval } from '../hooks';
import api from '../services/api';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  username?: string;
  details?: string;
  createdAt: string;
  ipAddress?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// Map action verbs to icons + colors
function actionMeta(action: string): { icon: React.ReactNode; color: string } {
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('signin'))
    return { icon: <LogIn size={13} />, color: 'text-slate-800 bg-emerald-200/10' };
  if (a.includes('logout') || a.includes('signout'))
    return { icon: <LogOut size={13} />, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
  if (a.includes('delete') || a.includes('remove'))
    return { icon: <Trash2 size={13} />, color: 'text-rose-600 bg-rose-50' };
  if (a.includes('create') || a.includes('add') || a.includes('register'))
    return { icon: <Plus size={13} />, color: 'text-slate-800 bg-emerald-200/10' };
  if (a.includes('update') || a.includes('edit') || a.includes('patch'))
    return { icon: <Edit3 size={13} />, color: 'text-amber-600 bg-amber-50' };
  if (a.includes('payroll') || a.includes('salary'))
    return { icon: <Banknote size={13} />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' };
  if (a.includes('invoice') || a.includes('bill'))
    return { icon: <FileText size={13} />, color: 'text-sky-600 bg-sky-50' };
  if (a.includes('setting') || a.includes('config'))
    return { icon: <Settings size={13} />, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
  if (a.includes('role') || a.includes('permission') || a.includes('access'))
    return { icon: <ShieldCheck size={13} />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' };
  if (a.includes('fail') || a.includes('error') || a.includes('denied'))
    return { icon: <AlertTriangle size={13} />, color: 'text-rose-600 bg-rose-50' };
  return { icon: <Activity size={13} />, color: 'text-slate-400 bg-slate-100 dark:bg-slate-800' };
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function groupByDay(entries: AuditEntry[]): { label: string; items: AuditEntry[] }[] {
  const groups: Record<string, AuditEntry[]> = {};
  for (const e of entries) {
    const d = new Date(e.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// Map entity names to routes for click-through navigation
function entityRoute(entity: string, entityId?: string): string | null {
  const e = entity.toLowerCase();
  if (e.includes('invoice')) return '/sales/invoices';
  if (e.includes('bill')) return '/purchases/bills';
  if (e.includes('payroll') || e.includes('salary')) return '/hr/payroll';
  if (e.includes('employee')) return entityId ? `/employees` : '/hr/employees';
  if (e.includes('leave')) return '/hr/leaves';
  if (e.includes('attendance')) return '/hr/attendance';
  if (e.includes('user')) return '/settings/users';
  if (e.includes('vendor')) return '/purchases/vendors';
  if (e.includes('expense')) return '/purchases/expenses';
  if (e.includes('vat') || e.includes('tax')) return '/tax/vat';
  if (e.includes('company')) return '/companies';
  if (e.includes('setting')) return '/settings';
  if (e.includes('report')) return '/reports';
  if (e.includes('journal') || e.includes('ledger')) return '/accounting';
  if (e.includes('bank')) return '/banking/accounts';
  if (e.includes('asset')) return '/accounting/fixed-assets';
  if (e.includes('disaster') || e.includes('drrf')) return '/disaster-fund';
  return null;
}

const ACTION_FILTERS = [
  { key: '', label: 'All' },
  { key: 'create', label: 'Created' },
  { key: 'update', label: 'Updated' },
  { key: 'delete', label: 'Deleted' },
  { key: 'login', label: 'Auth' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'invoice', label: 'ovds' },
] as const;

const ActivityFeedDrawer: React.FC<Props> = ({ open, onClose }) => {
  const { can } = useAuth();
  const navigate = useNavigate();
  const canRead = can('audit_logs:read');

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevCountRef = useRef(0);

  const fetchFeed = useCallback(async (silent = false) => {
    if (!canRead || !open) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/audit-logs?limit=30&page=1');
      const data = res.data?.data?.data ?? res.data?.data ?? [];
      const arr = Array.isArray(data) ? data : [];
      // Detect new entries since last fetch
      if (prevCountRef.current > 0 && arr.length > prevCountRef.current) {
        setNewCount(arr.length - prevCountRef.current);
        setTimeout(() => setNewCount(0), 3000);
      }
      prevCountRef.current = arr.length;
      setEntries(arr);
    } catch {
      if (!silent) setError('Failed to load activity feed.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [canRead, open]);

  useEffect(() => {
    if (open) { fetchFeed(); prevCountRef.current = 0; }
  }, [open, fetchFeed]);

  // Live polling every 15s when drawer is open and live mode is on
  useInterval(() => { if (isLive && open) fetchFeed(true); }, isLive && open ? 15_000 : null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const filtered = entries.filter(e => {
    const matchesFilter = !actionFilter || e.action.toLowerCase().includes(actionFilter);
    const matchesSearch = !searchQuery || [e.action, e.entity, e.username, e.details]
      .some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const groups = groupByDay(filtered);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[150] transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-[160]',
          'flex flex-col border-l border-slate-200 dark:border-slate-800',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Activity Feed"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-200/10 rounded-lg relative">
              <Activity size={15} className="text-slate-800" />
              {isLive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
              )}
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Activity Feed</span>
            {entries.length > 0 && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {filtered.length}
              </span>
            )}
            {newCount > 0 && (
              <span className="text-[10px] font-medium text-slate-800 bg-emerald-200/10 px-1.5 py-0.5 rounded-full animate-bounce">
                +{newCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Live toggle */}
            <button
              onClick={() => setIsLive(v => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${isLive ? 'bg-emerald-200/10 text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              title={isLive ? 'Live updates on — click to pause' : 'Live updates paused'}
            >
              <Circle size={7} className={isLive ? 'fill-emerald-500 text-emerald-600' : 'text-slate-400'} />
              {isLive ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={() => fetchFeed()}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Refresh"
              aria-label="Refresh activity feed"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close activity feed"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Action filter chips */}
        {canRead && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-1 overflow-x-auto scrollbar-none shrink-0">
            {ACTION_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActionFilter(f.key)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${actionFilter === f.key ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Search within feed */}
        {canRead && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search activity..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-7 py-1.5 text-[11px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-teal-400/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!canRead ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <ShieldCheck size={28} className="text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Access Restricted</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  You need the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px]">audit_logs:read</code> permission to view the activity feed.
                </p>
              </div>
            </div>
          ) : loading && entries.length === 0 ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
              <AlertTriangle size={24} className="text-rose-600" />
              <p className="text-sm text-slate-500">{error}</p>
              <button onClick={() => fetchFeed()} className="text-xs font-bold text-slate-800 hover:underline">
                Try again
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
              <Clock size={24} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400">No recent activity</p>
            </div>
          ) : (
            <div className="py-2">
              {groups.map(({ label, items }) => (
                <div key={label}>
                  <div className="px-5 py-2 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                  </div>
                  <div className="px-3 space-y-0.5">
                    {items.map((entry) => {
                      const meta = actionMeta(entry.action);
                      return (
                        <div
                          key={entry.id}
                          onClick={() => {
                            const route = entityRoute(entry.entity, entry.entityId);
                            if (route) { navigate(route); onClose(); }
                          }}
                          className={`flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${entityRoute(entry.entity) ? 'cursor-pointer' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                              {entry.action}
                              {entry.entity && (
                                <span className="ml-1 text-slate-400 font-normal">· {entry.entity}</span>
                              )}
                            </p>
                            {entry.username && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                <User size={9} />
                                {entry.username}
                                {entry.ipAddress && (
                                  <span className="text-slate-300 dark:text-slate-600">· {entry.ipAddress}</span>
                                )}
                              </p>
                            )}
                            {entry.details && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 italic">
                                {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 pt-0.5 font-medium">
                            {relativeTime(entry.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {canRead && entries.length > 0 && (
          <div className="shrink-0 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => { navigate('/settings/audit-logs'); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              View full audit log <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ActivityFeedDrawer;





