import React from 'react';

// -- Attendance Weekly Heatmap -------------------------------------------------
interface WeeklyHeatmapProps {
  data: { date: string; present: number; late: number; absent: number }[];
  loading?: boolean;
}

export const AttendanceHeatmap: React.FC<WeeklyHeatmapProps> = ({ data, loading }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Group last 28 days into 4 weeks × 7 days
  const weeks = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-28);
    const result: { date: string; present: number; late: number; absent: number }[][] = [];
    for (let i = 0; i < sorted.length; i += 7) result.push(sorted.slice(i, i + 7));
    return result;
  }, [data]);

  const getColor = (row: { date: string; present: number; late: number; absent: number } | undefined) => {
    if (!row) return 'bg-slate-100 dark:bg-slate-800';
    const total = row.present + row.late + row.absent || 1;
    const rate = (row.present + row.late) / total;
    if (rate >= 0.9) return 'bg-[var(--pro-azure)]';
    if (rate >= 0.7) return 'bg-[var(--pro-azure-light)]';
    if (rate >= 0.5) return 'bg-amber-400';
    if (rate > 0) return 'bg-rose-400';
    return 'bg-slate-100 dark:bg-slate-800';
  };

  return (
    <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider">Attendance Heatmap</p>
          <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mt-0.5">Last 4 Weeks</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[var(--pro-azure)] inline-block" />High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />Mid</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block" />Low</span>
        </div>
      </div>
      {loading ? (
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {days.map(d => (
              <span key={d} className="text-center text-[10px] font-medium text-slate-400 uppercase">{d}</span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }, (_, di) => {
                const row = week[di];
                const total = row ? row.present + row.late + row.absent : 0;
                return (
                  <div
                    key={di}
                    title={row ? `${new Date(row.date).toLocaleDateString()} — P:${row.present} L:${row.late} A:${row.absent}` : ''}
                    className={`h-7 rounded-md ${getColor(row)} transition-all cursor-default`}
                  >
                    {row && total > 0 && (
                      <span className="sr-only">{row.date}: {total} records</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
