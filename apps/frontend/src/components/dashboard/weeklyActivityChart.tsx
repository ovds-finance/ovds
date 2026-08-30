import React, { useRef, useEffect } from 'react';
import { BarChart3, AlertCircle, Users, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WeeklyActivityChartProps {
  reports: any;
  loading: boolean;
  error?: string | null;
}

/** Single stacked bar column that animates height on mount */
const StackedBar: React.FC<{
  presentH: number;
  lateH: number;
  absentH: number;
  attendanceRate: number;
  stat: any;
  label: string;
}> = ({ presentH, lateH, absentH, attendanceRate, stat, label }) => {
  const presentRef = useRef<HTMLDivElement>(null);
  const lateRef = useRef<HTMLDivElement>(null);
  const absentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animate = (el: HTMLDivElement | null, h: number, delay: number) => {
      if (!el) return;
      el.style.height = '0%';
      setTimeout(() => {
        el.style.transition = 'height 0.6s cubic-bezier(0.16,1,0.3,1)';
        el.style.height = `${h}%`;
      }, delay);
    };
    animate(absentRef.current, absentH, 80);
    animate(lateRef.current, lateH, 120);
    animate(presentRef.current, presentH, 160);
  }, [presentH, lateH, absentH]);

  const rateColor = attendanceRate > 90
    ? 'bg-emerald-400 dark:bg-emerald-500'
    : attendanceRate > 70
      ? 'bg-emerald-500'
      : 'bg-amber-400 dark:bg-amber-500';

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 group">
      <div className="w-full relative h-28 flex flex-col justify-end rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
        {absentH > 0 && (
          <div ref={absentRef} className="w-full bg-rose-300 dark:bg-rose-700" style={{ height: 0 }} />
        )}
        {lateH > 0 && (
          <div ref={lateRef} className="w-full bg-amber-400 dark:bg-amber-500" style={{ height: 0 }} />
        )}
        {presentH > 0 && (
          <div ref={presentRef} className={`w-full ${rateColor}`} style={{ height: 0 }} />
        )}
        {/* Hover tooltip */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-800/80 dark:bg-slate-900/80 rounded-lg">
          <div className="text-center px-1">
            <p className="text-white text-[10px] font-semibold">{Math.round(attendanceRate)}%</p>
            <p className="text-slate-300 text-[8px] mt-0.5">
              {stat.present}P · {stat.late}L · {stat.absent}A
            </p>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
        {label}
      </span>
    </div>
  );
};

const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ reports, error }) => {
  const { t } = useTranslation();
  const stats: any[] = reports?.attendanceStats || [];

  const totals = stats.reduce(
    (acc, s) => ({
      present: acc.present + (s.present || 0),
      late: acc.late + (s.late || 0),
      absent: acc.absent + (s.absent || 0),
    }),
    { present: 0, late: 0, absent: 0 },
  );
  const grandTotal = totals.present + totals.late + totals.absent || 1;
  const avgRate = stats.length
    ? Math.round(stats.reduce((s, d) => {
        const t = d.present + d.late + d.absent || 1;
        return s + ((d.present + d.late) / t) * 100;
      }, 0) / stats.length)
    : 0;

  return (
    <div className="lg:col-span-3 ovds-widget-card shadow-sm p-6 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center">
            <BarChart3 size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">{t('admin.weekly_rate')}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Daily attendance breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {stats.length > 0 && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
              avgRate >= 90
                ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
                : avgRate >= 70
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800'
                  : 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:border-amber-800'
            }`}>
              {avgRate}% avg
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {t('admin.live_metrics')}
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center h-40 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
          <AlertCircle size={22} className="text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('admin.error_loading')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-1.5 px-1 mt-2">
            {!stats.length ? (
              <div className="w-full flex items-center justify-center h-28 text-slate-300 dark:text-slate-600 text-sm font-medium italic">
                No attendance data yet
              </div>
            ) : (
              stats.map((stat: any, i: number) => {
                const total = stat.present + stat.late + stat.absent || 1;
                const presentH = (stat.present / total) * 100;
                const lateH = (stat.late / total) * 100;
                const absentH = (stat.absent / total) * 100;
                const attendanceRate = ((stat.present + stat.late) / total) * 100;
                const label = stat.date?.length === 10
                  ? new Date(stat.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                  : stat.date;
                return (
                  <StackedBar
                    key={i}
                    presentH={presentH}
                    lateH={lateH}
                    absentH={absentH}
                    attendanceRate={attendanceRate}
                    stat={stat}
                    label={label}
                  />
                );
              })
            )}
          </div>

          {stats.length > 0 && (
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
              {[
                { label: 'Present', count: totals.present, pct: Math.round((totals.present / grandTotal) * 100), color: 'bg-emerald-400', icon: <Users size={9} /> },
                { label: 'Late', count: totals.late, pct: Math.round((totals.late / grandTotal) * 100), color: 'bg-amber-400', icon: <Clock size={9} /> },
                { label: 'Absent', count: totals.absent, pct: Math.round((totals.absent / grandTotal) * 100), color: 'bg-rose-300', icon: <XCircle size={9} /> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{item.count}</span>
                  <span className="ovds-caption">({item.pct}%)</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyActivityChart;






