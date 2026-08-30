export interface AppSkeletonProps {
  rows?: number;
  cols?: number;
  type?: 'table' | 'card' | 'kpi' | 'list';
  className?: string;
}

export const AppSkeleton: React.FC<AppSkeletonProps> = ({ rows = 5, cols = 4, type = 'table', className }) => {
  if (type === 'kpi') {
    return (
      <div className={`grid gap-3 mb-4 ${className ?? ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-28 mb-1.5" />
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className ?? ''}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-1.5" />
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded mb-1.5" />
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden ${className ?? ''}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-900/50 last:border-0 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3 mb-1.5" />
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-900/50 last:border-0 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3 bg-slate-100 dark:bg-slate-800 rounded flex-1" style={{ maxWidth: `${80 + (j % 4) * 30}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
};
