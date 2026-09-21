/**
 * IoT Hub — command centre for all connected devices.
 * Tabs: Overview · Devices · Telemetry · Alerts · OTA Updates · Smart Billing
 */
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

import IotAlertsTab from '../components/iot/IotAlertsTab';
import IotBillingTab from '../components/iot/IotBillingTab';
import IotDevicesTab from '../components/iot/IotDevicesTab';
import IotOtaTab from '../components/iot/IotOtaTab';
import IotTaxPipelineTab from '../components/iot/IotTaxPipelineTab';
import IotTelemetryTab from '../components/iot/IotTelemetryTab';
import { AppPage, AppStat, AppTabs, Btn, Icon, Amount } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import {
  useIotDashboard,
  useIotDevices,
  useIotAlerts,
  useOtaJobs,
  useIotBillingTriggers,
  useAcknowledgeAlert,
  useResolveAlert,
  type IotDevice,
  type IotAlert,
  type OtaUpdateJob,
  type IotBillingTrigger,
} from '../services/iotApi';
import { fmtDate } from '../utils/fmt';

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  WARNING:  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  INFO:     'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:          'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  OFFLINE:         'bg-rose-100 text-rose-700',
  MAINTENANCE:     'bg-amber-100 text-amber-700',
  INACTIVE:        'bg-slate-100 text-slate-500',
  DECOMMISSIONED:  'bg-slate-100 text-slate-400 line-through',
};

export { STATUS_COLOR, SEVERITY_COLOR };

const IotHub: React.FC = () => {
  usePageTitle('IoT & Smart Management');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const location = useLocation();

  const pathToTab: Record<string, string> = {
    '/iot/devices':  'devices',
    '/iot/telemetry':'telemetry',
    '/iot/alerts':   'alerts',
    '/iot/ota':      'ota',
    '/iot/billing':  'billing',
    '/iot/pipeline': 'pipeline',
  };

  const [activeTab, setActiveTab] = useState(() => pathToTab[location.pathname] ?? 'overview');

  useEffect(() => {
    const tab = pathToTab[location.pathname] ?? 'overview';
    setActiveTab(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const { data: summary, isLoading: loadingSummary } = useIotDashboard({ enabled: !!selectedCompanyId } as any);
  const { data: devicesData, isLoading: loadingDevices } = useIotDevices({ limit: 5, enabled: !!selectedCompanyId } as any);
  const { data: alerts = [], isLoading: loadingAlerts } = useIotAlerts({ status: 'OPEN', enabled: !!selectedCompanyId } as any);
  const { data: otaJobs = [] } = useOtaJobs({ enabled: !!selectedCompanyId } as any);
  const { data: triggers = [] } = useIotBillingTriggers(false);

  const ackAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const criticalAlerts = useMemo(() => alerts.filter(a => a.severity === 'CRITICAL'), [alerts]);
  const pendingOta = useMemo(() => otaJobs.filter(j => j.status === 'PENDING'), [otaJobs]);
  const recentDevices = devicesData?.devices?.slice(0, 5) ?? [];

  const tabs = [
    { key: 'overview',  label: 'Overview',      icon: 'DASHBOARD' as const },
    { key: 'devices',   label: 'Devices',        icon: 'MONITOR' as const },
    { key: 'telemetry', label: 'Telemetry',      icon: 'ACTIVITY' as const },
    { key: 'alerts',    label: `Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`, icon: 'BELL' as const },
    { key: 'ota',       label: 'OTA Updates',    icon: 'UPLOAD' as const },
    { key: 'billing',   label: `Smart Billing ${triggers.length > 0 ? `(${triggers.length})` : ''}`, icon: 'BANKNOTE' as const },
    { key: 'pipeline',  label: 'Tax Pipeline',   icon: 'SHIELD' as const },
  ];

  return (
    <AppPage
      title="IoT & Smart Management"
      subtitle="Real-time device telemetry, remote management, and smart billing"
      icon="MONITOR"
      actions={
        can('iot:write') ? (
          <Btn variant="primary" icon="PLUS" onClick={() => setActiveTab('devices')}>
            Register Device
          </Btn>
        ) : null
      }
    >
      {/* Critical alert banner */}
      {criticalAlerts.length > 0 && (
        <div className="mx-4 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 animate-in slide-in-from-top duration-200">
          <Icon name="WARNING" size={16} className="text-rose-500 shrink-0" />
          <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-300 flex-1">
            {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require attention
          </p>
          <Btn variant="ghost" size="sm" onClick={() => setActiveTab('alerts')}>
            View Alerts
          </Btn>
        </div>
      )}

      {/* KPI strip */}
      <div className="px-4 pt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <AppStat
          label="Total Devices"
          value={loadingSummary ? '—' : (summary?.totalDevices ?? 0)}
          icon={<Icon name="MONITOR" size={16} />}
        />
        <AppStat
          label="Online"
          value={loadingSummary ? '—' : (summary?.activeDevices ?? 0)}
          icon={<Icon name="ACTIVITY" size={16} />}
          color="indigo"
        />
        <AppStat
          label="Offline"
          value={loadingSummary ? '—' : (summary?.offlineDevices ?? 0)}
          icon={<Icon name="WIFI_OFF" size={16} />}
          color={summary?.offlineDevices ? 'rose' : 'slate'}
        />
        <AppStat
          label="Uptime %"
          value={loadingSummary ? '—' : `${summary?.uptimePct ?? 0}%`}
          icon={<Icon name="GAUGE" size={16} />}
          color={Number(summary?.uptimePct ?? 0) >= 95 ? 'indigo' : 'amber'}
        />
        <AppStat
          label="Open Alerts"
          value={loadingSummary ? '—' : (summary?.openAlerts ?? 0)}
          icon={<Icon name="BELL" size={16} />}
          color={summary?.openAlerts ? 'amber' : 'slate'}
        />
        <AppStat
          label="Pending OTA"
          value={loadingSummary ? '—' : (summary?.pendingOta ?? 0)}
          icon={<Icon name="UPLOAD" size={16} />}
          color={summary?.pendingOta ? 'sky' : 'slate'}
        />
        <AppStat
          label="Unbilled Events"
          value={loadingSummary ? '—' : (summary?.unbilledTriggers ?? 0)}
          icon={<Icon name="BANKNOTE" size={16} />}
          color={summary?.unbilledTriggers ? 'violet' : 'slate'}
        />
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <AppTabs
          tabs={tabs}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab content */}
      <div className="px-4 pb-8 pt-4">
        {activeTab === 'overview' && (
          <IotOverviewTab
            devices={recentDevices}
            alerts={alerts.slice(0, 8)}
            otaJobs={pendingOta.slice(0, 5)}
            triggers={triggers.slice(0, 5)}
            onAck={id => ackAlert.mutate(id, { onSuccess: () => toast.success('Alert acknowledged') })}
            onResolve={id => resolveAlert.mutate(id, { onSuccess: () => toast.success('Alert resolved') })}
            onTabSwitch={setActiveTab}
            loading={loadingSummary || loadingDevices || loadingAlerts}
          />
        )}
        {activeTab === 'devices'   && <IotDevicesTab />}
        {activeTab === 'telemetry' && <IotTelemetryTab />}
        {activeTab === 'alerts'    && <IotAlertsTab />}
        {activeTab === 'ota'       && <IotOtaTab />}
        {activeTab === 'billing'   && <IotBillingTab />}
        {activeTab === 'pipeline'  && <IotTaxPipelineTab />}
      </div>
    </AppPage>
  );
};

// ── Overview tab ──────────────────────────────────────────────────────────────

interface OverviewProps {
  devices: IotDevice[];
  alerts: IotAlert[];
  otaJobs: OtaUpdateJob[];
  triggers: IotBillingTrigger[];
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
  onTabSwitch: (tab: string) => void;
  loading?: boolean;
}

const IotOverviewTab: React.FC<OverviewProps> = ({
  devices, alerts, otaJobs, triggers, onAck, onResolve, onTabSwitch, loading,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/* Device tree */}
    <section className="ovds-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="ovds-card-title flex items-center gap-2">
          <Icon name="MONITOR" size={15} className="text-[var(--pro-azure)]" /> Device Status
        </h3>
        <Btn variant="ghost" size="sm" onClick={() => onTabSwitch('devices')}>View all →</Btn>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : devices.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">No devices registered yet.</div>
      ) : (
        <div className="space-y-2">
          {devices.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'ACTIVE' ? 'bg-[var(--pro-azure-50)]0' : d.status === 'OFFLINE' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{d.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{d.deviceType} · {d.location ?? '—'}</p>
              </div>
              {d.batteryLevel != null && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className={d.batteryLevel < 20 ? 'text-rose-500' : 'text-[var(--pro-azure)]'}>⚡</span>
                  <span className="text-[10px] font-bold">{d.batteryLevel}%</span>
                </div>
              )}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[d.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {d.status}
              </span>
              {(d._count?.alerts ?? 0) > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {d._count?.alerts} alert{d._count!.alerts > 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>

    {/* Active alerts */}
    <section className="ovds-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="ovds-card-title flex items-center gap-2">
          <Icon name="BELL" size={15} className="text-amber-500" /> Active Alerts
        </h3>
        <Btn variant="ghost" size="sm" onClick={() => onTabSwitch('alerts')}>View all →</Btn>
      </div>
      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <Icon name="CHECK_CIRCLE" size={24} className="mx-auto text-[var(--pro-azure)] mb-2" />
          <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">All clear</p>
          <p className="text-[11px] text-slate-400 mt-0.5">No open alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50">
              <span className={`shrink-0 text-[9px] font-bold px-1.5 py-1 rounded-full mt-0.5 ${SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.INFO}`}>
                {a.severity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{a.device?.name} · {fmtDate(a.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onAck(a.id)}
                  className="text-[10px] font-bold text-amber-600 hover:underline"
                  title="Acknowledge"
                >
                  Ack
                </button>
                <button
                  onClick={() => onResolve(a.id)}
                  className="text-[10px] font-bold text-[var(--pro-azure)] hover:underline"
                  title="Resolve"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {/* Pending OTA */}
    <section className="ovds-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="ovds-card-title flex items-center gap-2">
          <Icon name="UPLOAD" size={15} className="text-sky-500" /> OTA Queue
        </h3>
        <Btn variant="ghost" size="sm" onClick={() => onTabSwitch('ota')}>View all →</Btn>
      </div>
      {otaJobs.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-[12px]">No pending firmware updates.</div>
      ) : (
        <div className="space-y-2">
          {otaJobs.map(j => (
            <div key={j.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50">
              <Icon name="UPLOAD" size={13} className="text-sky-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {j.device?.name ?? j.deviceId}
                </p>
                <p className="text-[10px] text-slate-400">
                  {j.device?.firmwareVersion ?? '?'} → {j.targetVersion}
                </p>
              </div>
              {j.status === 'IN_PROGRESS' && (
                <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${j.progress}%` }} />
                </div>
              )}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                {j.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>

    {/* Smart billing triggers */}
    <section className="ovds-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="ovds-card-title flex items-center gap-2">
          <Icon name="BANKNOTE" size={15} className="text-violet-500" /> Smart Billing Triggers
        </h3>
        <Btn variant="ghost" size="sm" onClick={() => onTabSwitch('billing')}>View all →</Btn>
      </div>
      {triggers.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-[12px]">No pending billable events.</div>
      ) : (
        <div className="space-y-2">
          {triggers.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50">
              <Icon name="ZAP" size={13} className="text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{t.lineItemDescription}</p>
                <p className="text-[10px] text-slate-400 truncate">{t.device?.name} · {t.metricKey}</p>
              </div>
                <Amount value={t.billableAmount} currency={t.currencyCode} />
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
);

export default IotHub;
