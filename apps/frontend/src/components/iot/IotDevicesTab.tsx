import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { STATUS_COLOR } from '../../pages/IotHub';
import { useAuth } from '../../rbac/AuthContext';
import {
  useIotDevices, useCreateDevice, useUpdateDevice, useDeleteDevice,
  type IotDevice, type DeviceType, type DeviceStatus,
} from '../../services/iotApi';
import { fmtDate } from '../../utils/fmt';
import { AppTable, AppTh, AppTd, AppTr, Btn, Icon, Modal, FormField, Input } from '../ui';

const DEVICE_TYPES: DeviceType[] = [
  'SMART_METER', 'ROUTER', 'SENSOR', 'CONTROLLER', 'CAMERA', 'POS_TERMINAL', 'OTHER',
];
const PROTOCOLS = ['MQTT', 'HTTP', 'COAP', 'MODBUS', 'ZIGBEE', 'ZWAVE', 'BLE', 'OTHER'];

interface DeviceFormState {
  name: string;
  serialNumber: string;
  deviceType: DeviceType;
  location: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  protocol: string;
  connectionString: string;
  notes: string;
}

const EMPTY: DeviceFormState = {
  name: '', serialNumber: '', deviceType: 'SENSOR', location: '',
  manufacturer: '', model: '', firmwareVersion: '', protocol: 'MQTT',
  connectionString: '', notes: '',
};

const IotDevicesTab: React.FC = () => {
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IotDevice | null>(null);
  const [deleting, setDeleting] = useState<IotDevice | null>(null);
  const [form, setForm] = useState<DeviceFormState>(EMPTY);

  const { data, isLoading } = useIotDevices({
    page,
    search: search || undefined,
    status: statusFilter || undefined,
    deviceType: typeFilter as DeviceType | undefined,
  } as any);
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const devices = data?.devices ?? [];
  const totalPages = data?.totalPages ?? 1;

  const set = (k: keyof DeviceFormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (d: IotDevice) => {
    setEditing(d);
    setForm({
      name: d.name, serialNumber: d.serialNumber, deviceType: d.deviceType,
      location: d.location ?? '', manufacturer: d.manufacturer ?? '',
      model: d.model ?? '', firmwareVersion: d.firmwareVersion ?? '',
      protocol: d.protocol ?? 'MQTT', connectionString: d.connectionString ?? '',
      notes: d.notes ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.serialNumber) return toast.error('Name and Serial Number are required');
    try {
      if (editing) {
        await updateDevice.mutateAsync({ id: editing.id, ...form });
        toast.success('Device updated');
      } else {
        await createDevice.mutateAsync(form);
        toast.success('Device registered');
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save device');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDevice.mutateAsync(deleting.id);
      toast.success('Device deleted');
      setDeleting(null);
    } catch {
      toast.error('Failed to delete device');
    }
  };

  // Guard helpers — use ovds:write as proxy until @ovds/shared rebuilds with iot:*
  const canWrite  = can('ovds:write' as any);
  const canDelete = can('ovds:delete' as any);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search devices…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="ovds-select text-[12px] h-8 px-2 rounded-lg"
        >
          <option value="">All statuses</option>
          {(['ACTIVE', 'OFFLINE', 'MAINTENANCE', 'INACTIVE', 'DECOMMISSIONED'] as DeviceStatus[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="ovds-select text-[12px] h-8 px-2 rounded-lg"
        >
          <option value="">All types</option>
          {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        {canWrite && (
          <Btn variant="primary" icon="PLUS" size="sm" onClick={openCreate}>Register Device</Btn>
        )}
      </div>

      {/* Empty state outside AppTable */}
      {!isLoading && devices.length === 0 && (
        <div className="py-16 text-center">
          <Icon name="MONITOR" size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">No devices registered</p>
          <p className="text-[11px] text-slate-400 mt-1">Register your first IoT device to start monitoring</p>
        </div>
      )}

      {/* Table */}
      {(isLoading || devices.length > 0) && (
        <AppTable loading={isLoading}>
          <thead>
            <tr>
              <AppTh>Device</AppTh>
              <AppTh>Type</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Location</AppTh>
              <AppTh>Firmware</AppTh>
              <AppTh>Battery</AppTh>
              <AppTh>Last Seen</AppTh>
              <AppTh>Alerts</AppTh>
              {canWrite && <AppTh>Actions</AppTh>}
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <AppTr key={d.id}>
                <AppTd>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{d.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{d.serialNumber}</p>
                  </div>
                </AppTd>
                <AppTd>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    {d.deviceType.replace(/_/g, ' ')}
                  </span>
                </AppTd>
                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[d.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {d.status}
                  </span>
                </AppTd>
                <AppTd>{d.location ?? '—'}</AppTd>
                <AppTd>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    {d.firmwareVersion ?? '—'}
                  </span>
                </AppTd>
                <AppTd>
                  {d.batteryLevel != null ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            d.batteryLevel < 20 ? 'bg-rose-500' :
                            d.batteryLevel < 50 ? 'bg-amber-500' :
                            'bg-[var(--pro-azure-50)]0'
                          }`}
                          style={{ width: `${d.batteryLevel}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold">{d.batteryLevel}%</span>
                    </div>
                  ) : <span className="text-slate-300">—</span>}
                </AppTd>
                <AppTd>
                  <span className="text-[11px] text-slate-500">
                    {d.lastSeenAt ? fmtDate(d.lastSeenAt) : 'Never'}
                  </span>
                </AppTd>
                <AppTd>
                  {(d._count?.alerts ?? 0) > 0 ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {d._count?.alerts}
                    </span>
                  ) : <Icon name="CHECK" size={13} className="text-[var(--pro-azure)]" />}
                </AppTd>
                {canWrite && (
                  <AppTd>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-slate-400 hover:text-[var(--pro-azure)] transition-colors"
                        title="Edit device"
                      >
                        <Icon name="EDIT" size={13} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleting(d)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete device"
                        >
                          <Icon name="TRASH_2" size={13} />
                        </button>
                      )}
                    </div>
                  </AppTd>
                )}
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
          <span className="text-[12px] text-slate-500 self-center">Page {page} of {totalPages}</span>
          <Btn variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
        </div>
      )}

      {/* Device form modal */}
      {showForm && (
        <Modal
          open
          title={editing ? `Edit: ${editing.name}` : 'Register New Device'}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn
                variant="primary"
                loading={createDevice.isPending || updateDevice.isPending}
                onClick={handleSave}
              >
                {editing ? 'Save Changes' : 'Register Device'}
              </Btn>
            </>
          }
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Device Name *" required>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Smart Meter #14" />
            </FormField>
            <FormField label="Serial Number *" required>
              <Input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-00001" />
            </FormField>
            <FormField label="Device Type">
              <select
                className="ovds-select w-full"
                value={form.deviceType}
                onChange={e => set('deviceType', e.target.value as DeviceType)}
              >
                {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Protocol">
              <select
                className="ovds-select w-full"
                value={form.protocol}
                onChange={e => set('protocol', e.target.value)}
              >
                {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Location">
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Warehouse B – Shelf 3" />
            </FormField>
            <FormField label="Manufacturer">
              <Input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="Siemens, ABB…" />
            </FormField>
            <FormField label="Model">
              <Input value={form.model} onChange={e => set('model', e.target.value)} />
            </FormField>
            <FormField label="Firmware Version">
              <Input value={form.firmwareVersion} onChange={e => set('firmwareVersion', e.target.value)} placeholder="v2.1.4" />
            </FormField>
            {/* Span-2 fields wrapped in a div since FormField has no className prop */}
            <div className="sm:col-span-2">
              <FormField label="Connection String">
                <Input
                  value={form.connectionString}
                  onChange={e => set('connectionString', e.target.value)}
                  placeholder="mqtt://broker.local/devices/..."
                />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Notes">
                <textarea
                  className="ovds-input w-full text-[12px] resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Additional notes…"
                />
              </FormField>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm — inline modal (Confirm is not exported from @ovds/ui) */}
      {deleting && (
        <Modal
          open
          title="Delete Device"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setDeleting(null)}>Cancel</Btn>
              <Btn
                variant="danger"
                loading={deleteDevice.isPending}
                onClick={handleDelete}
                icon="TRASH_2"
              >
                Delete Device
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
              <Icon name="WARNING" size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-rose-700 dark:text-rose-300">
                <p className="font-semibold mb-1">This action cannot be undone.</p>
                <p>
                  Deleting <strong>{deleting.name}</strong> will permanently remove all
                  telemetry, alerts, OTA history, and billing triggers associated with this device.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IotDevicesTab;
