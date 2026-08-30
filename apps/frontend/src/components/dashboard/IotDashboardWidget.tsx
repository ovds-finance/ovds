/**
 * IotDashboardWidget — contextual IoT summary cards for the main dashboard.
 *
 * Renders alongside cash-flow graphs and financial KPIs so users can see
 * device health and telemetry at a glance without leaving the dashboard.
 *
 * Widgets:
 *   iot_overview  — device status ring + uptime % + offline count
 *   iot_alerts    — open alert list with severity badges
 *   iot_telemetry — latest energy/sensor readings per device
 *   iot_billing   — unbilled smart-billing trigger count + total amount
 *   etax_status   — recent e-Tax submission status from ERCA
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  useIotDashboard,
  useIotAlerts,
  useIotBillingTriggers,
  useETaxSubmissions,
} from '../../services/iotApi';
import { Icon } from '../ui';
import { fmtCurrency } from '../../utils/fmt';

// ── Shared primitives ─────────────────────────────────────────────────────────

const WidgetShell: React.FC<{
  title: string;
  icon: string;
  iconColor?: string;
  to?: string;
  children: React.ReactNode;
  loading?: boolean;
}> = ({ title, icon, iconColor = 'text-emerald-500', to, children, loading }) => (
  <div className="ovds-widget-card h-full flex flex-col overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <Icon name={icon as any} size={14} className={iconColor} />
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{title}</p>
      </div>
      {to && (
        <Link to={to} className="text-[10px] font-bold text-emerald-600 hover:underline">
          View all →
        </Link>
      )}
    </div>
    <div className="flex-1 p-4">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : children}
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: string | number; color?: string }> = ({
  label, value, color = 'text-slate-800 dark:text-slate-100',
}) => (
  <div className="text-center">
    <p className={`text-[22px] font-bold ${color}`}>{value}</p>
    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
  </div>
);

// ── iot_overview ──────────────────────────────────────────────────────────────

export const IotOverviewWidget: React.FC = () => {
  const { data, isLoading } = useIotDashboard();

  return (
    <WidgetShell title="IoT Device Status" icon="MONITOR" iconColor="text-sky-500" to="/iot" loading={isLoading}>
      {data && (
        <div className="space-y-3">
          {/* Uptime ring */}
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - data.uptimePct / 100)}`}
                  strokeLinecap="round"
                  className={data.uptimePct >= 95 ? 'text-emerald-500' : data.uptimePct >= 80 ? 'text-amber-500' : 'text-rose-500'}
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{data.uptimePct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total" value={data.totalDevices} />
              <Stat label="Online" value={data.activeDevices} color="text-emerald-600" />
              <Stat label="Offline" value={data.offlineDevices} color={data.offlineDevices > 0 ? 'text-rose-600' : 'text-slate-400'} />
              <Stat label="OTA Pending" value={data.pendingOta} color={data.pendingOta > 0 ? 'text-sky-600' : 'text-slate-400'} />
            </div>
          </div>

          {/* Alert + billing summary strip */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link to="/iot/alerts"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                data.openAlerts > 0
                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800/50 text-slate-500'
              }`}
            >
              <Icon name="BELL" size={12} />
              <div>
                <p className="text-[13px] font-bold leading-none">{data.openAlerts}</p>
                <p className="text-[9px] opacity-80">Open alerts</p>
              </div>
              {data.criticalAlerts > 0 && (
                <span className="ml-auto text-[8px] font-bold px-1 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {data.criticalAlerts} crit
                </span>
              )}
            </Link>
            <Link to="/iot/billing"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                data.unbilledTriggers > 0
                  ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800/50 text-slate-500'
              }`}
            >
              <Icon name="BANKNOTE" size={12} />
              <div>
                <p className="text-[13px] font-bold leading-none">{data.unbilledTriggers}</p>
                <p className="text-[9px] opacity-80">Unbilled events</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

// ── iot_alerts ────────────────────────────────────────────────────────────────

const SEVERITY_CLS: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  WARNING:  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  INFO:     'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
};

export const IotAlertsWidget: React.FC = () => {
  const { data: alerts = [], isLoading } = useIotAlerts({ status: 'OPEN' });
  const recent = alerts.slice(0, 5);

  return (
    <WidgetShell title="Live Device Alerts" icon="BELL" iconColor="text-amber-500" to="/iot/alerts" loading={isLoading}>
      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
          <Icon name="CHECK_CIRCLE" size={24} className="text-emerald-500" />
          <p className="text-[11px] font-semibold text-slate-500">All devices clear</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {recent.map(a => (
            <div key={a.id} className="flex items-center gap-2.5 py-1.5">
              <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${SEVERITY_CLS[a.severity] ?? SEVERITY_CLS.INFO}`}>
                {a.severity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                <p className="text-[9px] text-slate-400 truncate">{a.device?.name}</p>
              </div>
              <Link to="/iot/alerts"
                className="shrink-0 text-[9px] font-bold text-emerald-600 hover:underline">
                →
              </Link>
            </div>
          ))}
          {alerts.length > 5 && (
            <p className="text-[9px] text-slate-400 text-center pt-1">
              +{alerts.length - 5} more alerts
            </p>
          )}
        </div>
      )}
    </WidgetShell>
  );
};

// ── iot_billing ───────────────────────────────────────────────────────────────

export const IotBillingWidget: React.FC = () => {
  const { data: triggers = [], isLoading } = useIotBillingTriggers(false);
  const total = triggers.reduce((s, t) => s + Number(t.billableAmount), 0);
  const recent = triggers.slice(0, 4);

  return (
    <WidgetShell title="Smart Billing Queue" icon="BANKNOTE" iconColor="text-violet-500" to="/iot/billing" loading={isLoading}>
      <div className="space-y-3">
        {/* Total */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/20">
          <div>
            <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider">Total Unbilled</p>
            <p className="text-[18px] font-bold text-violet-700 dark:text-violet-300 leading-none mt-0.5">
              {fmtCurrency(total, 'ETB')}
            </p>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
            {triggers.length} event{triggers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Recent triggers */}
        {recent.length > 0 && (
          <div className="space-y-1">
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-[11px]">
                <Icon name="ZAP" size={10} className="text-violet-400 shrink-0" />
                <span className="flex-1 text-slate-600 dark:text-slate-300 truncate">{t.lineItemDescription}</span>
                <span className="font-bold text-violet-600 shrink-0">{fmtCurrency(t.billableAmount, t.currencyCode)}</span>
              </div>
            ))}
          </div>
        )}

        {triggers.length === 0 && (
          <p className="text-[11px] text-slate-400 text-center py-2">No pending billing events</p>
        )}
      </div>
    </WidgetShell>
  );
};

// ── etax_status ───────────────────────────────────────────────────────────────

const ETAX_STATUS_CLS: Record<string, string> = {
  ACCEPTED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  REJECTED:  'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
  PENDING:   'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
  FAILED:    'bg-rose-100 text-rose-700',
  DRAFT:     'bg-slate-100 text-slate-500',
};

export const ETaxStatusWidget: React.FC = () => {
  const { data: submissions = [], isLoading } = useETaxSubmissions();
  const recent = submissions.slice(0, 4);
  const accepted = submissions.filter(s => s.status === 'ACCEPTED').length;

  return (
    <WidgetShell title="e-Tax Submissions" icon="SHIELD_CHECK" iconColor="text-emerald-500" to="/tax/etax-declaration" loading={isLoading}>
      <div className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="px-2 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
            <p className="text-[16px] font-bold text-emerald-600">{accepted}</p>
            <p className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider">Accepted</p>
          </div>
          <div className="px-2 py-2 rounded-lg bg-white dark:bg-slate-800/50 text-center">
            <p className="text-[16px] font-bold text-slate-700 dark:text-slate-300">{submissions.length}</p>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Total</p>
          </div>
        </div>

        {/* Recent list */}
        {recent.length > 0 ? (
          <div className="space-y-1.5">
            {recent.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400 w-14 shrink-0">{s.period}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${ETAX_STATUS_CLS[s.status] ?? ETAX_STATUS_CLS.DRAFT}`}>
                  {s.status}
                </span>
                {s.ercaReferenceNo && (
                  <span className="font-mono text-[9px] text-emerald-600 truncate">{s.ercaReferenceNo}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-[11px] text-slate-400">No submissions yet</p>
            <Link to="/tax/etax-declaration"
              className="text-[10px] font-bold text-emerald-600 hover:underline mt-1 inline-block">
              Submit VAT Return →
            </Link>
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

// ── Widget router — maps type string → component ──────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function renderIotWidget(type: string): React.ReactNode | null {
  switch (type) {
    case 'iot_overview':  return <IotOverviewWidget />;
    case 'iot_alerts':    return <IotAlertsWidget />;
    case 'iot_billing':   return <IotBillingWidget />;
    case 'etax_status':   return <ETaxStatusWidget />;
    default:              return null;
  }
}
