import React, { useState } from 'react';
import { useIotAlerts, useAcknowledgeAlert, useResolveAlert } from '../../services/iotApi';
import { AppTable, AppTh, AppTd, AppTr, Btn, Icon, Input } from '../ui';
import { useAuth } from '../../rbac/AuthContext';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../../utils/fmt';
import { SEVERITY_COLOR } from '../../pages/IotHub';

const STATUS_TABS = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED', ''] as const;

const IotAlertsTab: React.FC = () => {
  const { can } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: allAlerts = [], isLoading, refetch } = useIotAlerts({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  });

  const ackMutation     = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();

  const filtered = allAlerts.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.device?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAck = (id: string) =>
    ackMutation.mutate(id, { onSuccess: () => { toast.success('Alert acknowledged'); refetch(); } });

  const handleResolve = (id: string) =>
    resolveMutation.mutate(id, { onSuccess: () => { toast.success('Alert resolved'); refetch(); } });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          {STATUS_TABS.map(s => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={[
                'px-3 py-1.5 text-[11px] font-semibold transition-colors',
                statusFilter === s
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="ovds-select text-[12px] h-8 px-2 rounded-lg"
        >
          <option value="">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>
        <div className="flex-1 min-w-[200px]">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts…" />
        </div>
        <Btn variant="ghost" size="sm" icon="REFRESH" onClick={() => refetch()}>Refresh</Btn>
      </div>

      {/* Table */}
      <AppTable loading={isLoading}>
        <thead>
          <tr>
            <AppTh>Severity</AppTh>
            <AppTh>Alert</AppTh>
            <AppTh>Device</AppTh>
            <AppTh>Metric</AppTh>
            <AppTh>Value / Threshold</AppTh>
            <AppTh>Status</AppTh>
            <AppTh>Time</AppTh>
            {can('ovds:write') && <AppTh>Actions</AppTh>}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={can('ovds:write') ? 8 : 7} className="py-12 text-center">
                <Icon name="BELL" size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-[13px] font-semibold text-slate-400">No alerts found</p>
              </td>
            </tr>
          ) : (
            filtered.map(a => (
              <AppTr key={a.id}>
                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-1 rounded-full ${SEVERITY_COLOR[a.severity] ?? ''}`}>
                    {a.severity}
                  </span>
                </AppTd>
                <AppTd>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                    <p className="text-[10px] text-slate-400 max-w-[280px] truncate">{a.message}</p>
                  </div>
                </AppTd>
                <AppTd>
                  <div>
                    <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{a.device?.name ?? '—'}</p>
                    <p className="text-[10px] text-slate-400">{a.device?.deviceType}</p>
                  </div>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] font-mono text-slate-500">{a.metricKey ?? '—'}</span>
                </AppTd>
                <AppTd>
                  {a.actualValue != null ? (
                    <span className="text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{Number(a.actualValue).toFixed(2)}</span>
                      {a.thresholdValue != null && (
                        <span className="text-slate-400"> / {Number(a.thresholdValue).toFixed(2)}</span>
                      )}
                    </span>
                  ) : '—'}
                </AppTd>
                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    a.status === 'OPEN' ? 'bg-rose-100 text-rose-700' :
                    a.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-700' :
                    a.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {a.status}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500">{fmtDateTime(a.createdAt)}</span>
                </AppTd>
                {can('ovds:write') && (
                  <AppTd>
                    <div className="flex gap-2">
                      {a.status === 'OPEN' && (
                        <button
                          onClick={() => handleAck(a.id)}
                          disabled={ackMutation.isPending}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 disabled:opacity-50"
                          title="Acknowledge alert"
                        >
                          Ack
                        </button>
                      )}
                      {(a.status === 'OPEN' || a.status === 'ACKNOWLEDGED') && (
                        <button
                          onClick={() => handleResolve(a.id)}
                          disabled={resolveMutation.isPending}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                          title="Resolve alert"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </AppTd>
                )}
              </AppTr>
            ))
          )}
        </tbody>
      </AppTable>
    </div>
  );
};

export default IotAlertsTab;
