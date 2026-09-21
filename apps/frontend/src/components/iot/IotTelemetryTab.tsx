/**
 * IoT Telemetry Tab — real-time time-series charts for selected device + metric.
 * Uses Recharts (already in @ovds/ui) for live sparklines and area charts.
 */
import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

import { useIotDevices, useDeviceTelemetry, useLatestTelemetry } from '../../services/iotApi';
import { fmtDateTime } from '../../utils/fmt';
import { Icon, FormField } from '../ui';

const METRIC_COLORS: Record<string, string> = {
  ENERGY_KWH:     '#10b981',
  TEMPERATURE:    '#f59e0b',
  HUMIDITY:       '#3b82f6',
  PRESSURE:       '#8b5cf6',
  FLOW_RATE:      '#06b6d4',
  CURRENT_A:      '#ef4444',
  VOLTAGE_V:      '#f97316',
  BANDWIDTH_MBPS: '#4FBA6F',
  PACKET_LOSS_PCT:'#e11d48',
};

const METRIC_UNITS: Record<string, string> = {
  ENERGY_KWH:     'kWh',
  TEMPERATURE:    '°C',
  HUMIDITY:       '%',
  PRESSURE:       'hPa',
  FLOW_RATE:      'L/min',
  CURRENT_A:      'A',
  VOLTAGE_V:      'V',
  BANDWIDTH_MBPS: 'Mbps',
  PACKET_LOSS_PCT:'%',
};

const QUALITY_DOT: Record<string, string> = {
  NORMAL:   'bg-[var(--pro-azure-50)]0',
  WARNING:  'bg-amber-500',
  CRITICAL: 'bg-rose-500',
  FAULT:    'bg-slate-400',
};

const IotTelemetryTab: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedMetric, setSelectedMetric]     = useState('');
  const [range, setRange]                       = useState('1h');

  const { data: devicesData } = useIotDevices({ limit: 100 } as any);
  const devices = devicesData?.devices ?? [];

  const fromDate = useMemo(() => {
    const now = Date.now();
    const map: Record<string, number> = { '1h': 3600, '6h': 21600, '24h': 86400, '7d': 604800 };
    return new Date(now - (map[range] ?? 3600) * 1000).toISOString();
  }, [range]);

  const { data: latest = [] }    = useLatestTelemetry(selectedDeviceId);
  const { data: history = [], isLoading } = useDeviceTelemetry(selectedDeviceId, {
    metricKey: selectedMetric || undefined,
    from: fromDate,
    limit: 500,
  });

  // Available metrics from latest readings
  const availableMetrics = useMemo(() => [...new Set(latest.map(t => t.metricKey))], [latest]);

  // Chart data: sorted ascending by time
  const chartData = useMemo(() =>
    [...history]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map(t => ({
        time: new Date(t.recordedAt).getTime(),
        value: Number(t.value),
        quality: t.quality,
      })),
    [history],
  );

  const color = METRIC_COLORS[selectedMetric] ?? '#10b981';
  const unit  = METRIC_UNITS[selectedMetric] ?? '';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <FormField label="Device">
          <select
            className="ovds-select w-full"
            value={selectedDeviceId}
            onChange={e => { setSelectedDeviceId(e.target.value); setSelectedMetric(''); }}
          >
            <option value="">— Select device —</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
            ))}
          </select>
        </FormField>

        {selectedDeviceId && (
          <FormField label="Metric">
            <select
              className="ovds-select w-full"
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value)}
            >
              <option value="">All metrics</option>
              {availableMetrics.map(m => (
                <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Time Range">
          <select
            className="ovds-select w-full"
            value={range}
            onChange={e => setRange(e.target.value)}
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </FormField>
      </div>

      {/* Live readings strip */}
      {latest.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {latest.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedMetric(t.metricKey === selectedMetric ? '' : t.metricKey)}
              className={[
                'flex flex-col items-start p-3 rounded-xl border transition-all text-left',
                selectedMetric === t.metricKey
                  ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[var(--pro-azure-light)]',
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${QUALITY_DOT[t.quality] ?? 'bg-slate-400'}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {t.metricKey.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[18px] font-bold text-slate-800 dark:text-slate-100 leading-none">
                {Number(t.value).toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{METRIC_UNITS[t.metricKey] ?? t.unit ?? ''}</p>
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      {!selectedDeviceId ? (
        <div className="ovds-card py-16 text-center">
          <Icon name="ACTIVITY" size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-[13px] font-semibold text-slate-500">Select a device to view telemetry</p>
        </div>
      ) : isLoading ? (
        <div className="ovds-card py-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="ovds-card py-12 text-center text-slate-400 text-[13px]">
          No telemetry data for this period.
        </div>
      ) : (
        <div className="ovds-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="ovds-card-title">
              {selectedMetric ? selectedMetric.replace(/_/g, ' ') : 'All Metrics'} — Trend
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">{chartData.length} readings</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(t: number) => {
                    const d = new Date(t);
                    return range === '7d'
                      ? d.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })
                      : d.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' });
                  }}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}${unit}`}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                  labelFormatter={((t: number) => fmtDateTime(new Date(t).toISOString())) as any}
                  formatter={((v: number) => [`${v.toFixed(2)} ${unit}`, 'Value']) as any}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  fill="url(#telemetryGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Raw readings table */}
      {history.length > 0 && (
        <div className="ovds-card overflow-x-auto">
          <h3 className="ovds-card-title mb-3">Recent Readings</h3>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Time', 'Metric', 'Value', 'Unit', 'Quality'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 20).map(t => (
                <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-1.5 px-3 font-mono text-slate-500">{fmtDateTime(t.recordedAt)}</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{t.metricKey.replace(/_/g, ' ')}</td>
                  <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-100">{Number(t.value).toFixed(4)}</td>
                  <td className="py-1.5 px-3 text-slate-400">{t.unit ?? METRIC_UNITS[t.metricKey] ?? '—'}</td>
                  <td className="py-1.5 px-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${QUALITY_DOT[t.quality] ? 'bg-opacity-10' : ''}`}
                      style={{ background: `${QUALITY_DOT[t.quality]?.replace('bg-', '#') ?? '#94a3b8'}20`, color: QUALITY_DOT[t.quality]?.replace('bg-', '') ?? '#94a3b8' }}>
                      {t.quality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IotTelemetryTab;
