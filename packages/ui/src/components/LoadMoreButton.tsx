/**
 * LoadMoreButton — "load more" button for infinite-scroll / paginated lists.
 * Shows progress (e.g. "Showing 25 of 100") and hides when all items are loaded.
 *
 * Usage:
 *   <LoadMoreButton onClick={loadMore} loading={loadingMore} hasMore={hasMore} loaded={items.length} total={total} />
 */
import React from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';

export interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
  hasMore: boolean;
  /** Items loaded so far */
  loaded: number;
  /** Total items available */
  total: number;
  className?: string;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  loading,
  hasMore,
  loaded,
  total,
  className = '',
}) => {
  if (!hasMore && loaded >= total && total > 0) {
    return (
      <p className={`text-center text-xs text-slate-400 dark:text-slate-500 py-4 ${className}`}>
        All {total.toLocaleString()} records loaded
      </p>
    );
  }
  if (!hasMore) return null;

  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
      {total > 0 && (
        <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
        Showing {loaded.toLocaleString()} of {total.toLocaleString()}
      </p>
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
      >
        {loading ? <RefreshCw size={13} className="animate-spin" /> : <ChevronDown size={13} />}
        {loading ? 'Loading…' : 'Load More'}
      </button>
    </div>
  );
};

export default LoadMoreButton;
