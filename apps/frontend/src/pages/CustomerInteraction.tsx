/**
 * CustomerInteraction — Interaction timeline & activity log for CRM contacts
 *
 * Route: /crm/interactions
 *
 * Chronological feed of calls, emails, meetings, tasks, and notes
 * across all CRM contacts. Log new interactions and filter by type/status.
 */
import React, { useState } from 'react';
import {
  Phone, Mail, Users, MessageSquare, CheckSquare,
  StickyNote, RefreshCw, Clock, Calendar,
  Filter, Search, ChevronDown,
} from 'lucide-react';
import { AppPage, EmptyState, Skeleton, StatusBadge } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { fmtDate, fmtRelative } from '../utils/fmt';

type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'FOLLOW_UP';

interface Interaction {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  contactName: string;
  contactId: string;
  dueDate: string | null;
  completedAt: string | null;
  status: 'PENDING' | 'DONE' | 'CANCELLED';
  createdAt: string;
  createdBy: string;
}

const TYPE_ICONS: Record<ActivityType, React.ReactNode> = {
  CALL: <Phone size={14} />,
  EMAIL: <Mail size={14} />,
  MEETING: <Users size={14} />,
  TASK: <CheckSquare size={14} />,
  NOTE: <StickyNote size={14} />,
  FOLLOW_UP: <Clock size={14} />,
};

const TYPE_COLORS: Record<ActivityType, string> = {
  CALL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  EMAIL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  MEETING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  TASK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  NOTE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  FOLLOW_UP: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

const ACTIVITY_TYPES: { value: ActivityType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'CALL', label: 'Calls' },
  { value: 'EMAIL', label: 'Emails' },
  { value: 'MEETING', label: 'Meetings' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'NOTE', label: 'Notes' },
  { value: 'FOLLOW_UP', label: 'Follow-ups' },
];

const STATUS_MAP: Record<string, string> = {
  DONE: 'settled',
  PENDING: 'pending',
  CANCELLED: 'overdue',
};

const CustomerInteraction: React.FC = () => {
  usePageTitle('Customer Interactions');
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | ''>('');

  const { data, loading, error, refetch } = useApiQuery<Interaction[]>(
    `/crm/interactions?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId },
  );

  const filtered = (data ?? []).filter((item) => {
    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesSearch =
      !search ||
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.contactName.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <AppPage title="Customer Interactions">
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton.Line key={i} className="h-20 rounded-2xl" />)}
        </div>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage title="Customer Interactions">
        <EmptyState
          variant="error"
          message="Failed to load interactions"
          action={{ label: 'Retry', onClick: refetch }}
        />
      </AppPage>
    );
  }

  return (
    <AppPage title="Customer Interactions">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Customer Interactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Chronological activity log across all CRM contacts</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/20"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subject or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ActivityType | '')}
            className="pl-8 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30 appearance-none cursor-pointer"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={32} className="text-slate-300" />}
          message={search || typeFilter ? 'No interactions match your filters' : 'No interactions logged yet'}
          action={search || typeFilter ? { label: 'Clear filters', onClick: () => { setSearch(''); setTypeFilter(''); } } : undefined}
        />
      ) : (
        <div className="relative">
          {/* vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />

          <ul className="space-y-4 pl-14">
            {filtered.map((item) => (
              <li key={item.id} className="relative">
                {/* dot */}
                <span
                  className={`absolute -left-[2.35rem] top-3 w-7 h-7 rounded-full flex items-center justify-center ${TYPE_COLORS[item.type]}`}
                >
                  {TYPE_ICONS[item.type]}
                </span>

                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${TYPE_COLORS[item.type]}`}>
                          {TYPE_ICONS[item.type]}{item.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.subject}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          <span>{item.contactName}</span>
                        </span>
                        {item.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{fmtDate(item.dueDate)}</span>
                          </span>
                        )}
                        <span title={fmtDate(item.createdAt)}>
                          {fmtRelative(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={STATUS_MAP[item.status] ?? 'pending'} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppPage>
  );
};

export default CustomerInteraction;
