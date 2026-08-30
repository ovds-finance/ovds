import React, { useState } from 'react';
import { useOtaJobs, useCreateOtaJob, useIotDevices, type OtaStatus } from '../../services/iotApi';
import { AppTable, AppTh, AppTd, AppTr, Btn, Icon, Modal, FormField, Input } from '../ui';
import { useAuth } from '../../rbac/AuthContext';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../../utils/fmt';

const STATUS_STYLES: Record<OtaStatus, string> = {
  PENDING:     'bg-sky-100 text-sky-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUCCESS:     'bg-emerald-100 text-emerald-700',
  FAILED:      'bg-rose-100 text-rose-700',
  ROLLED_BACK: 'bg-orange-100 text-orange-700',
  CANCELLED:   'bg-slate-100 text-slate-500',
};

interface JobForm {
  deviceId: string;
  targetVersion: string;
  fromVersion: string;
  packageUrl: string;
  releaseNotes: string;
  scheduledAt: string;
}

const EMPTY: JobForm = {
  deviceId: '', targetVersion: '', fromVersion: '',
  packageUrl: '', releaseNotes: '', scheduledAt: '',
};

const IotOtaTab: React.FC = () => {
  const { can } = useAuth();
  const [deviceFilter, setDeviceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<JobForm>(EMPTY);

  const { data: jobs = [], isLoading, refetch } = useOtaJobs(deviceFilter || undefined);
  const { data: devicesData } = useIotDevices({ limit: 100 } as any);
  const createJob = useCreateOtaJob();

  const filtered = statusFilter ? jobs.filter(j => j.status === statusFilter) : jobs;
  const set = (k: keyof JobForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Guard — ovds:write as proxy until @ovds/shared rebuilds with iot:*
  const canWrite = can('ovds:write' as any);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceId || !form.targetVersion) {
      return toast.error('Device and target version are required');
    }
    try {
      await createJob.mutateAsync({
        deviceId: form.deviceId,
        targetVersion: form.targetVersion,
        fromVersion: form.fromVersion || undefined,
        packageUrl: form.packageUrl || undefined,
        releaseNotes: form.releaseNotes || undefined,
        scheduledAt: form.scheduledAt || undefined,
      } as any);
      toast.success('OTA job queued');
      setShowForm(false);
      setForm(EMPTY);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create OTA job');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={deviceFilter}
          onChange={e => setDeviceFilter(e.target.value)}
          className="ovds-select text-[12px] h-8 px-2 rounded-lg min-w-[180px]"
        >
          <option value="">All devices</option>
          {devicesData?.devices?.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="ovds-select text-[12px] h-8 px-2 rounded-lg"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_STYLES) as OtaStatus[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Btn variant="ghost" size="sm" icon="REFRESH" onClick={() => refetch()}>Refresh</Btn>
        {canWrite && (
          <Btn variant="primary" size="sm" icon="PLUS" onClick={() => setShowForm(true)}>
            Schedule OTA
          </Btn>
        )}
      </div>

      {/* Status summary chips */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {(Object.keys(STATUS_STYLES) as OtaStatus[]).map(s => {
          const count = jobs.filter(j => j.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`px-3 py-2 rounded-xl text-left transition-all border ${
                statusFilter === s
                  ? 'border-emerald-500 ring-1 ring-emerald-300'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <p className="text-[18px] font-bold text-slate-800 dark:text-slate-100">{count}</p>
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${STATUS_STYLES[s]}`}>
                {s}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center">
          <Icon name="UPLOAD" size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-[13px] font-semibold text-slate-500">No OTA jobs found</p>
        </div>
      )}

      {/* Table */}
      {(isLoading || filtered.length > 0) && (
        <AppTable loading={isLoading}>
          <thead>
            <tr>
              <AppTh>Device</AppTh>
              <AppTh>Version Change</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Progress</AppTh>
              <AppTh>Scheduled</AppTh>
              <AppTh>Started</AppTh>
              <AppTh>Completed</AppTh>
              <AppTh>Initiated By</AppTh>
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => (
              <AppTr key={j.id}>
                <AppTd>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                      {j.device?.name ?? j.deviceId}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">{j.deviceId.slice(0, 8)}…</p>
                  </div>
                </AppTd>
                <AppTd>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-mono text-slate-500">{j.fromVersion ?? '?'}</span>
                    <Icon name="ARROW_RIGHT" size={11} className="text-slate-400" />
                    <span className="font-mono font-bold text-emerald-600">{j.targetVersion}</span>
                  </div>
                </AppTd>
                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[j.status]}`}>
                    {j.status}
                  </span>
                </AppTd>
                <AppTd>
                  {j.status === 'IN_PROGRESS' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${j.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold">{j.progress}%</span>
                    </div>
                  ) : j.status === 'SUCCESS' ? (
                    <Icon name="CHECK_CIRCLE" size={14} className="text-emerald-500" />
                  ) : j.status === 'FAILED' ? (
                    <span title={j.errorMessage ?? ''}>
                      <Icon name="ALERT_TRIANGLE" size={14} className="text-rose-500" />
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500">
                    {j.scheduledAt ? fmtDateTime(j.scheduledAt) : 'Immediate'}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500">
                    {j.startedAt ? fmtDateTime(j.startedAt) : '—'}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500">
                    {j.completedAt ? fmtDateTime(j.completedAt) : '—'}
                  </span>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500">{j.initiatedBy ?? '—'}</span>
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {/* OTA schedule modal */}
      {showForm && (
        <Modal
          open
          title="Schedule OTA Firmware Update"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn
                variant="primary"
                loading={createJob.isPending}
                onClick={handleCreate}
                icon="UPLOAD"
              >
                Schedule Update
              </Btn>
            </>
          }
        >
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Span-2 wrapper since FormField has no className prop */}
            <div className="sm:col-span-2">
              <FormField label="Device *" required>
                <select
                  className="ovds-select w-full"
                  value={form.deviceId}
                  onChange={e => set('deviceId', e.target.value)}
                  required
                >
                  <option value="">— Select device —</option>
                  {devicesData?.devices?.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (v{d.firmwareVersion ?? '?'})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Target Version *" required>
              <Input
                value={form.targetVersion}
                onChange={e => set('targetVersion', e.target.value)}
                placeholder="v3.0.0"
              />
            </FormField>
            <FormField label="Current Version (optional)">
              <Input
                value={form.fromVersion}
                onChange={e => set('fromVersion', e.target.value)}
                placeholder="v2.1.4"
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Package URL">
                <Input
                  value={form.packageUrl}
                  onChange={e => set('packageUrl', e.target.value)}
                  placeholder="https://firmware.example.com/v3.0.0.bin"
                />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Scheduled At (leave blank = immediate)">
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => set('scheduledAt', e.target.value)}
                />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Release Notes">
                <textarea
                  className="ovds-input w-full text-[12px] resize-none"
                  rows={3}
                  value={form.releaseNotes}
                  onChange={e => set('releaseNotes', e.target.value)}
                  placeholder="What changed in this firmware release…"
                />
              </FormField>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default IotOtaTab;
