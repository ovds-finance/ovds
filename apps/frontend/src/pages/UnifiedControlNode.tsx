/**
 * UnifiedControlNode — single clean workspace that brings together:
 *
 *   Panel 1 · System & Local Settings
 *     Company registration documents, TIN, business license status, and
 *     granular User Access Controls (UAC) — all in one place.
 *
 *   Panel 2 · IoT, Apps & Device Control  (merged layer)
 *     IoT Smart Devices, external Apps & Extensions, OTA firmware, billing
 *     triggers, and the full IoT ↔ Ethiopian Tax Pipeline with TASS/SRM.
 */
import { AppPage, AppTabs, AppStat, Btn, Icon, StatusBadge, EmptyState } from '@ovds/ui';
import { fmtTin, fmtCurrency } from '@ovds/ui';
import {
  Building2, BadgeCheck, Fingerprint, ShieldCheck, Cpu, Warehouse,
  ScanLine, Scale, AppWindow, ArrowRight, Activity, Circle, CheckCircle2,
  CircleSlash, Link2, Users, Lock, Server, Globe, Bell, AlertTriangle,
  Wrench, ArrowUpRight, Monitor, RefreshCw, Settings, FileText, History,
  Zap, SlidersHorizontal, CreditCard, LayoutGrid, Receipt, Banknote,
  Download, ChevronRight, Radio, TrendingUp, Wifi, WifiOff,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useApiQuery } from '../hooks/useApiQuery';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { useDeviceControlPolicies } from '../services/deviceControlApi';
import {
  useIotDevices,
  useIotDashboard,
  useIotAlerts,
  useOtaJobs,
  useIotBillingTriggers,
  useIotFiscalEvents,
  useIotTaxSummary,
  useAcknowledgeAlert,
  useResolveAlert,
  type IotDevice,
} from '../services/iotApi';
import { setupApi, type CompanySetupProgress } from '../services/setupApi';
import { useUnifiedControlNode } from '../services/unifiedControlApi';
import { fmtDate, fmtRelativeTime } from '../utils/fmt';



// ── helpers ───────────────────────────────────────────────────────────────────

const DEVICE_STREAM: Record<string, { log: string; to: string }> = {
  SMART_METER:  { log: 'Payroll — Utility Metering',   to: '/hr/payroll' },
  SENSOR:       { log: 'Inventory — Env. Sensor',       to: '/inventory' },
  CONTROLLER:   { log: 'Inventory — Stock Controller',  to: '/inventory' },
  CAMERA:       { log: 'Inventory — Vision Count',      to: '/inventory' },
  POS_TERMINAL: { log: 'Inventory — POS Sales Sync',    to: '/inventory' },
  ROUTER:       { log: 'Payroll — Connectivity',        to: '/hr/payroll' },
  OTHER:        { log: 'Inventory — Automation',        to: '/inventory' },
};

const WAREHOUSE_TYPES = new Set(['SENSOR', 'CONTROLLER', 'CAMERA', 'POS_TERMINAL', 'OTHER']);

function streamFor(d: IotDevice) {
  if (WAREHOUSE_TYPES.has(d.deviceType) ||
      /warehouse|stock|scale|scan|inventory/i.test((d.location ?? '') + d.name)) {
    return { log: 'Inventory — Automated Stream', to: '/inventory' };
  }
  return DEVICE_STREAM[d.deviceType] ?? DEVICE_STREAM.OTHER;
}

function DeviceIcon({ d }: { d: IotDevice }) {
  if (d.deviceType === 'SMART_METER') return <Scale size={16} />;
  if (/scan|barcode/i.test(d.name)) return <ScanLine size={16} />;
  if (/warehouse|stock/i.test(d.name)) return <Warehouse size={16} />;
  if (d.deviceType === 'ROUTER') return <Radio size={16} />;
  return <Cpu size={16} />;
}

const EFY_MONTHS = ['07','08','09','10','11','12','01','02','03','04','05','06'];
function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Panel 1 · System & Local Settings ────────────────────────────────────────
const SystemLocalPanel: React.FC = () => {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: unified, isLoading: unifiedLoading } = useUnifiedControlNode(user?.companyId || '');
  const { data: usersRaw, loading: usersLoading } = useApiQuery<any>('/auth/users?take=50', { staleTime: 30_000 });
  const users: any[] = Array.isArray(usersRaw) ? usersRaw
    : Array.isArray(usersRaw?.data) ? usersRaw.data
    : Array.isArray(usersRaw?.users) ? usersRaw.users : [];

  const { data: activitiesRaw = [] } = useApiQuery<any[]>('/dashboard/audit-logs?take=5', {
    staleTime: 15_000,
    select: (d: any) => d?.data ?? d ?? [],
  });
  const activities: any[] = Array.isArray(activitiesRaw) ? activitiesRaw : [];

  const [wizardProgress, setWizardProgress] = useState<CompanySetupProgress | null>(null);
  const [_wizardLoading, setWizardLoading] = useState(false);

  useEffect(() => {
    if (!user?.companyId) return;
    let cancelled = false;
    (async () => {
      setWizardLoading(true);
      try {
        const p = await setupApi.getProgress(user.companyId ?? '');
        if (!cancelled) setWizardProgress(p);
      } catch { /* ignore */ }
      finally { if (!cancelled) setWizardLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.companyId]);

  const wizardOverall = wizardProgress?.overallProgress ?? 0;
  const wizardCompleted = wizardProgress?.steps?.filter(s => s.status === 'completed').length ?? 0;
  const wizardTotal = wizardProgress?.steps?.length ?? 0;
  const isWizardComplete = wizardOverall === 100;

  const wizardStepStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    if (wizardProgress) for (const s of wizardProgress.steps) map.set(s.stepKey, s.status);
    return map;
  }, [wizardProgress]);

  const licenseStatus = unified?.license?.status ?? 'UNKNOWN';
  const tin = unified?.company?.tin ?? unified?.tinMor?.tin ?? '—';
  const regNo = unified?.license?.registrationNumber ?? '—';
  const legalName = unified?.company?.name ?? 'Your Company';
  const totalUsers = unified?.users?.total ?? users.length;
  const activeUsers = unified?.users?.active ?? users.filter((u: any) => u.status === 'ACTIVE' || u.isActive).length;
  const roleCount = unified?.users?.roles?.length ?? 0;

  const licenseBadge = useMemo(() => {
    const map: Record<string, { label: string; status: string }> = {
      ACTIVE:  { label: 'Active',        status: 'ACTIVE' },
      ISSUED:  { label: 'Issued',        status: 'ACTIVE' },
      PENDING: { label: 'Pending',       status: 'PENDING' },
      EXPIRED: { label: 'Expired',       status: 'OVERDUE' },
      REVOKED: { label: 'Revoked',       status: 'OVERDUE' },
      UNKNOWN: { label: 'Not registered',status: 'DRAFT' },
    };
    return map[licenseStatus] ?? map.UNKNOWN;
  }, [licenseStatus]);

  const cards = [
    {
      key: 'registration', title: 'Company Registration', icon: <Building2 size={18} />,
      hint: 'Commercial registration & legal documents', loading: unifiedLoading,
      rows: [
        { label: 'Legal name', value: legalName },
        { label: 'Registration No.', value: regNo },
        { label: 'Business structure', value: unified?.license?.businessStructure ?? '—' },
      ],
      to: '/settings/business-registration', cta: 'Manage registration', perm: 'settings:write',
    },
    {
      key: 'tin', title: 'TIN & MoR Credentials', icon: <BadgeCheck size={18} />,
      hint: 'Taxpayer identification & e-Tax linkage', loading: unifiedLoading,
      rows: [
        { label: 'TIN', value: tin !== '—' ? fmtTin(String(tin)) : '—' },
        { label: 'MoR status', value: unified?.tinMor?.morStatus ?? '—' },
        { label: 'VAT registered', value: unified?.tinMor?.vatRegistered ? 'Yes' : 'No' },
      ],
      to: '/settings/company-profile', cta: 'Edit credentials', perm: 'settings:write',
    },
    {
      key: 'license', title: 'Business License Status', icon: <ShieldCheck size={18} />,
      hint: 'Operating license validity', loading: unifiedLoading,
      rows: [
        { label: 'Status', value: <StatusBadge status={licenseBadge.status} label={licenseBadge.label} /> },
        { label: 'Issued',  value: unified?.license?.issuedAt  ? fmtDate(unified.license.issuedAt)  : '—' },
        { label: 'Expires', value: unified?.license?.expiresAt ? fmtDate(unified.license.expiresAt) : '—' },
      ],
      to: '/settings/business-registration', cta: 'Renew / view', perm: 'settings:write',
    },
  ];

  const PIPELINE_STEPS = [
    { step: 1,  label: 'Setup Wizard',           to: '/getting-started',          icon: <Zap size={14} />,             key: 'setup_wizard' },
    { step: 2,  label: 'Company Profile',         to: '/settings/company-profile', icon: <Building2 size={14} />,       key: 'tin_mor_credentials' },
    { step: 3,  label: 'Tax & Legal',             to: '/settings/company-profile', icon: <BadgeCheck size={14} />,      key: 'business_registration' },
    { step: 4,  label: 'Payment Gateways',        to: '/ovds/payment-gateways',   icon: <CreditCard size={14} />,      key: 'payment_gateways' },
    { step: 5,  label: 'Tax Configuration',       to: '/tax/universal-config',     icon: <ShieldCheck size={14} />,     key: 'universal_tax_config' },
    { step: 6,  label: 'Modules',                 to: '/settings/app-store',       icon: <LayoutGrid size={14} />,      key: 'module_selection' },
    { step: 7,  label: 'Users & Roles',           to: '/settings/users',           icon: <Users size={14} />,           key: 'users' },
    { step: 8,  label: 'System Controls',         to: '/control',                  icon: <SlidersHorizontal size={14} />,key: 'control_node' },
    { step: 9,  label: 'Notifications',           to: '/admin/notifications-settings',icon: <Bell size={14} />,         key: 'notifications' },
    { step: 10, label: 'IoT & Devices',           to: '/control/iot',              icon: <Cpu size={14} />,             key: 'iot_devices' },
    { step: 11, label: 'Developer Guide',         to: '/settings/developers',      icon: <FileText size={14} />,        key: 'developer_guide' },
    { step: 12, label: 'API Docs',                to: '/settings/api-docs',        icon: <Globe size={14} />,           key: 'api_docs' },
    { step: 13, label: 'System Updates',          to: '/settings/releases',        icon: <RefreshCw size={14} />,       key: 'system_updates' },
    { step: 14, label: 'Production Validation',   to: '/settings/setup-wizard',    icon: <CheckCircle2 size={14} />,    key: 'setup_wizard' },
  ];

  return (
    <div className="px-4 py-4 space-y-5">

      {/* KPI strips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AppStat label="Users"        value={unifiedLoading || usersLoading ? '—' : totalUsers}  icon={<Icon name="USERS"   size={16} />} color="blue" />
        <AppStat label="Active users" value={unifiedLoading || usersLoading ? '—' : activeUsers} icon={<Icon name="SUCCESS" size={16} />} color="indigo" />
        <AppStat label="Roles"        value={unifiedLoading || usersLoading ? '—' : roleCount}   icon={<Icon name="LOCK"    size={16} />} color="violet" />
        <AppStat label="Access policies" value={unifiedLoading || usersLoading ? '—' : totalUsers} icon={<Icon name="SHIELD" size={16} />} color="sky" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AppStat label="Version"     value={String(unified?.system?.version     ?? '—')} icon={<Icon name="ITEM"     size={16} />} color="slate" />
        <AppStat label="Uptime"      value={String(unified?.system?.uptime      ?? '—')} icon={<Icon name="ACTIVITY" size={16} />} color="indigo" />
        <AppStat label="Environment" value={String(unified?.system?.environment ?? '—')} icon={<Monitor size={16} />}              color="blue" />
        <AppStat label="Node"        value={String(unified?.system?.nodeName    ?? '—')} icon={<Server size={16} />}               color="violet" />
      </div>

      {/* Setup wizard progress banner */}
      {!isWizardComplete && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Administration Setup</p>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {wizardOverall}% complete
              </span>
            </div>
            <button onClick={() => navigate('/settings/setup-wizard')}
              className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              Continue Setup <ArrowRight size={13} />
            </button>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${wizardOverall}%`, background: wizardOverall >= 60 ? '#f59e0b' : '#ef4444' }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {wizardCompleted} / {wizardTotal} steps completed — finish setup to enable full system functionality.
          </p>
        </div>
      )}
      {isWizardComplete && (
        <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            <p className="text-sm font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">Setup complete — system fully configured</p>
          </div>
          <button onClick={() => navigate('/settings/setup-wizard')}
            className="text-[12px] font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] hover:underline">Review</button>
        </div>
      )}

      {/* Fiscal & Currency */}
      {unified?.company && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fiscal & Currency</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Currency',         value: String(unified.settings?.currency         ?? '—') },
              { label: 'Fiscal Year Start',value: `Month ${unified.settings?.fiscalYearStart ?? '—'}` },
              { label: 'Language',         value: String(unified.settings?.language          ?? '—') },
              { label: 'Timezone',         value: String(unified.settings?.timezone          ?? '—').replace(/_/g,' ') },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Pipeline */}
      {can('settings:read') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-600 dark:text-slate-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Configuration Pipeline</p>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                14 Steps
              </span>
            </div>
            <button onClick={() => navigate('/settings/setup-wizard')}
              className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              Open Setup Wizard <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {PIPELINE_STEPS.map((item) => {
              const stepStatus = wizardStepStatusMap.get(item.key);
              const clr = stepStatus === 'completed' ? 'text-[var(--pro-azure)]' : stepStatus === 'in_progress' ? 'text-amber-500' : 'text-slate-300';
              const icon = stepStatus === 'completed' ? <CheckCircle2 size={14} className={clr} />
                : stepStatus === 'in_progress' ? <RefreshCw size={12} className={clr} />
                : <Circle size={12} className={clr} />;
              return (
                <button key={item.step} onClick={() => navigate(item.to)}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl px-3 py-2 transition-colors text-left group">
                  <span className="text-slate-500 dark:text-slate-400 group-hover:text-[var(--pro-azure)] transition-colors shrink-0">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 block leading-none mb-0.5">Step {item.step}</span>
                    <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate block">{item.label}</span>
                  </div>
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Document / registry cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--pro-azure-50)] text-[var(--pro-azure)] flex items-center justify-center">
                {c.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{c.hint}</p>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {c.loading
                ? <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                : c.rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-slate-400">{r.label}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-right truncate">{r.value}</span>
                  </div>
                ))
              }
            </div>
            {can(c.perm as any) && (
              <button onClick={() => navigate(c.to)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--pro-azure)] hover:underline">
                {c.cta} <ArrowRight size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* UAC detail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Fingerprint size={16} className="text-violet-600 dark:text-violet-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">User Access Controls (UAC)</p>
          </div>
          {can('users:read') && (
            <Btn variant="ghost" size="sm" onClick={() => navigate('/settings/users')} icon={<Icon name="USERS" size={14} />}>
              Manage users
            </Btn>
          )}
        </div>
        {usersLoading
          ? <div className="p-6"><div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></div>
          : users.length === 0
          ? <EmptyState icon={<Icon name="USERS" size={18} />} title="No users yet" description="Add team members and assign roles to control access." />
          : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {users.slice(0, 12).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                      {(u.name ?? u.email ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{u.name ?? u.email}</p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 font-medium">
                      {u.role ?? u.roles?.[0] ?? 'Member'}
                    </span>
                    {u.status === 'ACTIVE' || u.isActive
                      ? <CheckCircle2 size={14} className="text-[var(--pro-azure)]" />
                      : <CircleSlash size={14} className="text-slate-300" />}
                  </div>
                </div>
              ))}
            </div>
          )
        }
        {can('role_permissions:read') && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={() => navigate('/settings/roles')}
              className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              Roles & Permissions <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Deployment & Environment */}
      {unified?.deployment && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-sky-600 dark:text-sky-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Deployment & Environment</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Mode',        value: unified.deployment.mode ?? '—' },
              { label: 'Environment', value: unified.system?.environment ?? '—' },
              { label: 'Offline Mode',value: unified.deployment.offlineMode ? 'Enabled' : 'Disabled' },
              { label: 'Edge Nodes',  value: String(unified.deployment.edgeNodeCount ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Configuration */}
      {unified?.modules && unified.modules.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Module Configuration</p>
            </div>
            {can('apps:read') && (
              <button onClick={() => navigate('/settings/app-store')}
                className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                App Store <ArrowUpRight size={12} />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {unified.modules.slice(0, 8).map((m: any) => (
              <div key={m.name} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{m.displayName}</p>
                  <p className="text-[11px] text-slate-400">{m.name} · v{m.version}</p>
                </div>
                <StatusBadge status={m.isEnabled ? 'ACTIVE' : 'DRAFT'} label={m.isEnabled ? 'Enabled' : 'Disabled'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Configuration */}
      {unified?.tax && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tax Configuration</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'VAT',     enabled: unified.tax.vatEnabled },
              { label: 'WHT',     enabled: unified.tax.whtEnabled },
              { label: 'TOT',     enabled: unified.tax.totEnabled },
              { label: 'BIT',     enabled: unified.tax.bitEnabled },
              { label: 'Pension', enabled: unified.tax.pensionEnabled },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                {t.enabled ? <CheckCircle2 size={14} className="text-[var(--pro-azure)]" /> : <CircleSlash size={14} className="text-slate-300" />}
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{t.label}</span>
              </div>
            ))}
          </div>
          {can('tax:read' as any) && (
            <button onClick={() => navigate('/ovds/tax')}
              className="mt-3 text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              Tax Settings <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* Security Posture */}
      {unified?.security && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={16} className="text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Security Posture</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'MFA',              value: unified.security.mfaEnforced ? 'Enforced' : 'Optional' },
              { label: 'MFA Enrollment',   value: `${unified.security.mfaEnrollmentPct}%` },
              { label: 'Min Password',     value: `${unified.security.passwordPolicyMinLength} chars` },
              { label: 'Session Timeout',  value: `${unified.security.sessionTimeoutMinutes}m` },
              { label: 'Brute Force Lock', value: `${unified.security.bruteForceLockMinutes}m` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance & Regulatory */}
      {unified?.compliance && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Compliance & Regulatory</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'ERCA',          ok: unified.compliance.ercaRegistered },
              { label: 'MoR',           ok: unified.compliance.morRegistered },
              { label: 'VAT',           ok: unified.compliance.vatRegistered },
              { label: 'SME Profile',   ok: unified.compliance.smeProfileEnabled },
              { label: 'Multi-Company', ok: unified.compliance.multiCompanyEnabled },
              { label: 'IFRS',          ok: unified.compliance.ifrsEnabled },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                {item.ok ? <CheckCircle2 size={14} className="text-[var(--pro-azure)]" /> : <CircleSlash size={14} className="text-slate-300" />}
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Validation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Setup Validation</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: 'Company registration complete',  ok: !!legalName && legalName !== 'Your Company' },
            { label: 'TIN & MoR credentials bound',    ok: tin !== '—' },
            { label: 'Business license registered',    ok: licenseStatus !== 'UNKNOWN' },
            { label: 'Users provisioned',              ok: totalUsers > 0 },
            { label: 'Roles & permissions defined',    ok: roleCount > 0 },
            { label: 'Deployment mode configured',     ok: !!unified?.deployment?.mode },
            { label: 'Modules activated',              ok: unified?.modules?.some((m: any) => m.isEnabled) ?? false },
            { label: 'Notification channels configured', ok: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[12px]">
              {item.ok
                ? <CheckCircle2 size={14} className="text-[var(--pro-azure)] shrink-0" />
                : <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
              <span className={`font-medium ${item.ok ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      {activities.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-600 dark:text-slate-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Activities</p>
            </div>
            {can('audit_logs:read') && (
              <button onClick={() => navigate('/settings/audit-logs')}
                className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                Audit Trail <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{a.action}</p>
                  {a.details && <p className="text-[11px] text-slate-400 truncate">{a.details}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.user && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                      {a.user.username}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">{fmtRelativeTime(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Panel 2 · IoT, Apps & Device Control (merged layer) ──────────────────────
const IotAppsPanel: React.FC = () => {
  const { can } = useAuth();
  const navigate = useNavigate();

  const [taxPeriod, setTaxPeriod] = useState(currentPeriod());

  const { data: devicesData, isLoading: devicesLoading } = useIotDevices({ limit: 50 } as any);
  const { data: summary } = useIotDashboard();
  const { data: alertsRaw = [] }  = useIotAlerts({ status: 'OPEN' });
  const alerts: any[] = Array.isArray(alertsRaw) ? alertsRaw : [];
  const { data: policiesRaw = [] } = useDeviceControlPolicies();
  const policies: any[] = Array.isArray(policiesRaw) ? policiesRaw : [];
  // only show policies that have been actually enforced (version > 0)
  const activePolicies = policies.filter((p: any) => p.version > 0);

  const { data: otaJobsRaw = [] } = useOtaJobs();
  const otaJobs: any[] = Array.isArray(otaJobsRaw) ? otaJobsRaw : [];
  const pendingOtaJobs = otaJobs.filter((j: any) => j.status === 'PENDING' || j.status === 'IN_PROGRESS');

  const { data: billingTriggersRaw = [] } = useIotBillingTriggers(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const billingTriggers: any[] = Array.isArray(billingTriggersRaw) ? billingTriggersRaw : [];

  const { data: fiscalEventsRaw = [] } = useIotFiscalEvents();
  const fiscalEvents: any[] = Array.isArray(fiscalEventsRaw) ? fiscalEventsRaw : [];

  const { data: taxSummaryRaw = [] } = useIotTaxSummary(taxPeriod);
  const taxSummary: any[] = Array.isArray(taxSummaryRaw) ? taxSummaryRaw : [];

  const { data: appsRaw = [] } = useApiQuery<any>(
    '/apps?take=50',
    { staleTime: 30_000, select: (d: any) => d?.apps ?? d ?? [] },
  );
  const apps: any[] = Array.isArray(appsRaw) ? appsRaw : [];

  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const devices: IotDevice[] = devicesData?.devices ?? [];
  const liveStreams = useMemo(
    () => devices.filter((d) => d.status === 'ACTIVE' || d.status === 'OFFLINE'),
    [devices],
  );

  const totalUnbilledETB = useMemo(
    () => billingTriggers.reduce((s: number, t: any) => s + (t.billableAmount ?? 0), 0),
    [billingTriggers],
  );

  const toggleApp = async (id: string, active: boolean) => {
    try {
      const mod = await import('../services/api');
      await mod.default.post(`/apps/${id}/${active ? 'disable' : 'download'}`, {});
      toast.success(active ? 'App disabled' : 'App enabled');
    } catch {
      toast.error('Could not update app');
    }
  };

  return (
    <div className="px-4 py-4 space-y-5">

      {/* KPI strip — now with criticalAlerts + unbilled */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AppStat label="Devices"       value={summary?.totalDevices  ?? (devicesLoading ? '—' : devices.length)} icon={<Icon name="MONITOR"      size={16} />} color="sky" />
        <AppStat label="Online"        value={summary?.activeDevices ?? 0}   icon={<Icon name="ACTIVITY"     size={16} />} color="indigo" />
        <AppStat label="Critical ⚡"   value={summary?.criticalAlerts ?? 0}  icon={<Icon name="BELL"         size={16} />} color={(summary?.criticalAlerts ?? 0) > 0 ? 'amber' : 'slate'} />
        <AppStat label="Apps linked"   value={apps.filter((a) => a.isActive).length} icon={<Icon name="ITEM" size={16} />} color="violet" />
        <AppStat label="Unbilled"      value={billingTriggers.length}         icon={<Banknote size={16} />}                color={billingTriggers.length > 0 ? 'amber' : 'slate'} />
        <AppStat label="Governance"    value={activePolicies.length}         icon={<Icon name="SHIELD_CHECK" size={16} />} color="blue" />
      </div>

      {/* IoT Smart Devices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IoT Smart Devices — configuration modules</p>
          {can('iot:write') && (
            <button onClick={() => navigate('/iot/devices')}
              className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              Device registry <ArrowRight size={13} />
            </button>
          )}
        </div>
        {devicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0,1,2,3].map((i) => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : devices.length === 0 ? (
          <EmptyState icon={<Icon name="MONITOR" size={18} />} title="No IoT devices connected"
            description="Register warehouse scales, scanners, or sensors to start automated streams." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.slice(0, 8).map((d) => {
              const stream = streamFor(d);
              const live = d.status === 'ACTIVE';
              const alertCount = d._count?.alerts ?? 0;
              return (
                <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${live ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <DeviceIcon d={d} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{d.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{d.location || d.deviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {alertCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300">
                          {alertCount}⚠
                        </span>
                      )}
                      <StatusBadge status={live ? 'ACTIVE' : d.status === 'OFFLINE' ? 'DRAFT' : d.status} label={live ? 'Live' : d.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      {live
                        ? <Circle size={8} className="fill-indigo-500 text-[var(--pro-azure)] animate-pulse" />
                        : <Circle size={8} className="fill-slate-300 text-slate-300" />}
                      <span>→</span>
                      <button onClick={() => navigate(stream.to)}
                        className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:underline">
                        <Link2 size={11} /> {stream.log}
                      </button>
                    </div>
                    {d.firmwareVersion && (
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        fw {d.firmwareVersion}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OTA Firmware Jobs — detailed list, not just a count badge */}
      {pendingOtaJobs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Download size={16} className="text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">OTA Firmware Updates</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold">
                {pendingOtaJobs.length} pending
              </span>
            </div>
            {can('iot:write') && (
              <button onClick={() => navigate('/iot/devices')}
                className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                Manage OTA <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingOtaJobs.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Download size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
                    {job.device?.name ?? job.deviceId}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {job.fromVersion ? `${job.fromVersion} → ` : ''}{job.targetVersion}
                    {job.releaseNotes ? ` · ${job.releaseNotes.slice(0, 40)}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge
                    status={job.status === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING'}
                    label={job.status}
                  />
                  {job.progress > 0 && (
                    <div className="mt-1 w-24 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Alerts — with acknowledge/resolve actions */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Open Alerts</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold">
                {alerts.length}
              </span>
            </div>
            {can('iot:read') && (
              <button onClick={() => navigate('/iot/alerts')}
                className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {alerts.slice(0, 8).map((alert: any) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning  = alert.severity === 'WARNING';
              const clr = isCritical ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400';
              const bg  = isCritical ? 'bg-rose-50 dark:bg-rose-950/30' : isWarning ? 'bg-amber-50 dark:bg-amber-950/30' : '';
              return (
                <div key={alert.id} className={`flex items-center gap-3 px-4 py-2.5 ${bg}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{alert.title ?? alert.message ?? 'Alert'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{alert.device?.name ?? ''} · {alert.createdAt ? fmtRelativeTime(alert.createdAt) : ''}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${clr}`}>{alert.severity ?? 'INFO'}</span>
                  {can('iot:write') && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => acknowledgeAlert.mutate(alert.id)}
                        className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        ACK
                      </button>
                      <button onClick={() => resolveAlert.mutate(alert.id)}
                        className="text-[11px] px-2 py-0.5 rounded-lg border border-[var(--pro-azure-100)] dark:border-green-800 hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unbilled Billing Triggers */}
      {billingTriggers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Unbilled IoT Triggers</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold">
                {fmtCurrency(totalUnbilledETB, 'ETB')}
              </span>
            </div>
            {can('invoices:write') && (
              <button onClick={() => navigate('/sales/invoices')}
                className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                Create invoice <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
            {billingTriggers.slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
                    {t.lineItemDescription ?? t.triggerType}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {t.device?.name ?? t.deviceId} · {t.createdAt ? fmtDate(t.createdAt) : ''}
                  </p>
                </div>
                <p className="text-[13px] font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-3">
                  {fmtCurrency(t.billableAmount ?? 0, t.currencyCode ?? 'ETB')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IoT Tax Pipeline — Fiscal Events */}
      {can('iot:read') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-violet-600 dark:text-violet-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">IoT → Tax Pipeline</p>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                MoR / ERCA
              </span>
            </div>
            <button onClick={() => navigate('/tax/vat')}
              className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              VAT filings <ArrowRight size={13} />
            </button>
          </div>

          {/* Period selector + Tax Summary */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Tax period</p>
            <select
              value={taxPeriod}
              onChange={(e) => setTaxPeriod(e.target.value)}
              className="text-[12px] font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
            >
              {EFY_MONTHS.map((m) => {
                const yr = new Date().getFullYear();
                const period = `${yr}-${m}`;
                return <option key={period} value={period}>{period}</option>;
              })}
            </select>
          </div>

          {taxSummary.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {taxSummary.map((row: any) => (
                <div key={row.taxType} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {row.taxType?.replace('_', ' ')}
                    </p>
                    <p className="text-[11px] text-slate-400">{row.eventCount} events · gross {fmtCurrency(row.totalGross, 'ETB')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-rose-600 dark:text-rose-400">{fmtCurrency(row.totalTax, 'ETB')}</p>
                    <p className="text-[11px] text-slate-400">net {fmtCurrency(row.totalNet, 'ETB')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-[12px] text-slate-400">No IoT fiscal events for {taxPeriod}.</div>
          )}

          {/* Fiscal event log (last 5) */}
          {fiscalEvents.length > 0 && (
            <>
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent fiscal events (SHA-256 signed)</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {fiscalEvents.slice(0, 5).map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between px-4 py-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">
                        {ev.taxType} · {ev.industryContext?.replace(/_/g,' ')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{ev.fiscalSignature?.slice(0, 16)}…</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{fmtCurrency(ev.taxAmount, 'ETB')}</p>
                      <p className="text-[10px] text-slate-400">{ev.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Apps & Extensions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Apps & Extensions — configuration modules</p>
          {can('apps:read') && (
            <button onClick={() => navigate('/settings/app-store')}
              className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              App Store <ArrowRight size={13} />
            </button>
          )}
        </div>
        {apps.length === 0 ? (
          <EmptyState icon={<Icon name="ITEM" size={18} />} title="No extensions linked"
            description="Install apps that feed automated streams into your logs." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apps.slice(0, 8).map((a: any) => (
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <AppWindow size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{a.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{a.category ?? 'Extension'}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleApp(a.id, a.isActive)}
                  disabled={!can('apps:write' as any)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${a.isActive ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-200 dark:bg-slate-700'} disabled:opacity-50`}
                  aria-label={a.isActive ? 'Disable app' : 'Enable app'}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${a.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device Control Policies — only show enforced ones */}
      {activePolicies.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-sky-600 dark:text-sky-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Device Control Policies</p>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {activePolicies.length} enforced
              </span>
            </div>
            {can('device_control:read') && (
              <button onClick={() => navigate('/device-control')}
                className="text-[12px] font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                Governance <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activePolicies.slice(0, 5).map((policy: any) => (
              <div key={policy.id ?? policy.category} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
                    {String(policy.category ?? '').replace(/_/g,' ')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    v{policy.version}
                    {policy.enforcedAt ? ` · enforced ${fmtDate(policy.enforcedAt)}` : ''}
                  </p>
                </div>
                <StatusBadge status="ACTIVE" label="Enforced" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automated stream monitor */}
      {liveStreams.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} className="text-[var(--pro-azure)]" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Automated stream monitor</p>
            <span className="text-[11px] text-slate-400">raw events → Inventory / Payroll logs</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {liveStreams.slice(0, 10).map((d) => {
              const stream = streamFor(d);
              const live = d.status === 'ACTIVE';
              return (
                <div key={d.id} className="flex items-center justify-between text-[12px] px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2 min-w-0">
                    {live
                      ? <Wifi size={12} className="text-[var(--pro-azure)] shrink-0" />
                      : <WifiOff size={12} className="text-slate-300 shrink-0" />}
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{d.name}</span>
                    <span className="text-slate-400 truncate">→ {stream.log}</span>
                  </div>
                  <span className="text-slate-400 shrink-0">{d.lastSeenAt ? fmtRelativeTime(d.lastSeenAt) : 'streaming'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

// ── Page shell ────────────────────────────────────────────────────────────────
const UnifiedControlNode: React.FC = () => {
  usePageTitle('Unified Control Node');
  const { can } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'system' | 'iot'>('system');

  const tabs = [
    { key: 'system', label: 'System & Local Settings',      icon: <Icon name="SETTINGS" size={15} /> },
    { key: 'iot',    label: 'IoT, Apps & Device Control',   icon: <Icon name="SERVER"   size={15} /> },
  ];

  return (
    <AppPage
      title="Unified Control Node"
      subtitle="System configuration, local registry, and merged IoT / app device control in one workspace"
      icon={<Server size={18} />}
      iconBg="bg-slate-800"
      crumbs={[{ label: 'System Administration' }, { label: 'Unified Control Node' }]}
      actions={
        can('device_control:read') ? (
          <Btn variant="ghost" size="sm" onClick={() => navigate('/device-control')} icon={<Icon name="SHIELD_CHECK" size={14} />}>
            Governance
          </Btn>
        ) : undefined
      }
    >
      <AppTabs
        tabs={tabs}
        active={tab}
        onChange={(k) => setTab(k as 'system' | 'iot')}
      />
      {tab === 'system' ? <SystemLocalPanel /> : <IotAppsPanel />}
    </AppPage>
  );
};

export default UnifiedControlNode;
