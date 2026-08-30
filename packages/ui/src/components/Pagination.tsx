/**
 * Pagination — full-featured pagination nav.
 *
 * Supports two usage patterns:
 *
 * 1. Modern — spread from usePagination():
 *      const pg = usePagination({ initialTake: 20 });
 *      pg.setTotal(data.pagination.total);
 *      <Pagination {...pg.paginationProps} />
 *
 * 2. Legacy — simple page/total/pageSize/onChange (backward compat):
 *      <Pagination page={page} total={total} pageSize={25} onChange={setPage} />
 */
import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  total: number;
  // -- Modern API --------------------------------------------------------------
  pages?: number;
  take?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  /** Called when user clicks a page number or jumps */
  onPageChange?: (page: number) => void;
  /** Called when user changes rows-per-page */
  onTakeChange?: (take: number) => void;
  /** Available page-size options (default: [10, 25, 50, 100]) */
  takeOptions?: number[];
  /** Show jump-to-page input when pages > threshold (default: 10) */
  jumpThreshold?: number;
  // -- Legacy API (backward compat) --------------------------------------------
  /** @deprecated Use `take` instead */
  pageSize?: number;
  /** @deprecated Use `onPageChange` instead */
  onChange?: (page: number) => void;
  className?: string;
}

const BTN =
  'flex items-center justify-center rounded-lg border transition-all duration-150 ' +
  'disabled:opacity-35 disabled:cursor-not-allowed ' +
  'focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none';
const BTN_IDLE =
  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 ' +
  'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 ' +
  'hover:border-slate-300 dark:hover:border-slate-600 active:scale-95';

function buildPageNums(page: number, pages: number): (number | '...')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set<number>(
    [1, pages, page - 1, page, page + 1].filter(p => p >= 1 && p <= pages),
  );
  const sorted = [...set].sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && (sorted[i] as number) - (sorted[i - 1] as number) > 1) {
      result.push('...');
    }
    result.push(sorted[i]);
  }
  return result;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  total,
  pages: pagesProp,
  take: takeProp,
  hasPrev: hasPrevProp,
  hasNext: hasNextProp,
  onPageChange,
  onTakeChange,
  takeOptions = [10, 25, 50, 100],
  jumpThreshold = 10,
  className = '',
  pageSize,
  onChange,
}) => {
  // Resolve legacy props → modern values
  const take   = takeProp ?? pageSize ?? 25;
  const pages  = pagesProp ?? (total > 0 ? Math.ceil(total / take) : 1);
  const hasPrev = hasPrevProp ?? page > 1;
  const hasNext = hasNextProp ?? page < pages;
  const handlePageChange = onPageChange ?? onChange ?? (() => {});

  const from = total === 0 ? 0 : Math.min((page - 1) * take + 1, total);
  const to   = Math.min(page * take, total);
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const p = parseInt(jumpValue, 10);
      if (!isNaN(p) && p >= 1 && p <= pages) {
        handlePageChange(p);
        setJumpValue('');
      }
    },
    [jumpValue, pages, handlePageChange],
  );

  if (total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 transition-colors ${className}`}
    >
      {/* Result summary */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tabular-nums select-none">
        <span className="font-bold text-slate-600 dark:text-slate-300">{from.toLocaleString()}</span>
        {' – '}
        <span className="font-bold text-slate-600 dark:text-slate-300">{to.toLocaleString()}</span>
        {' of '}
        <span className="font-bold text-slate-600 dark:text-slate-300">{total.toLocaleString()}</span>
        {' records'}
      </p>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={!hasPrev}
          title="First page"
          aria-label="First page"
          className={`${BTN} ${BTN_IDLE} w-7 h-7`}
        >
          <ChevronsLeft size={13} />
        </button>

        {/* Prev */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
          className={`${BTN} ${BTN_IDLE} gap-1 px-2.5 h-7 text-[11px] font-bold`}
        >
          <ChevronLeft size={13} /> Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5" role="group" aria-label="Page numbers">
          {buildPageNums(page, pages).map((p, i) =>
            p === '...' ? (
              <span
                key={`e-${i}`}
                className="w-7 text-center text-slate-400 text-[11px] select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p as number)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none ${
                  p === page
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : BTN_IDLE
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className={`${BTN} ${BTN_IDLE} gap-1 px-2.5 h-7 text-[11px] font-bold`}
        >
          Next <ChevronRight size={13} />
        </button>

        {/* Last */}
        <button
          onClick={() => handlePageChange(pages)}
          disabled={!hasNext}
          title="Last page"
          aria-label="Last page"
          className={`${BTN} ${BTN_IDLE} w-7 h-7`}
        >
          <ChevronsRight size={13} />
        </button>

        {/* Rows per page — only shown in modern mode */}
        {onTakeChange && (
          <select
            value={take}
            onChange={e => onTakeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="ml-1.5 h-7 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none cursor-pointer"
          >
            {takeOptions.map(n => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}

        {/* Jump to page */}
        {pages > jumpThreshold && (
          <form onSubmit={handleJump} className="ml-1.5 flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Go</span>
            <input
              type="number"
              min={1}
              max={pages}
              value={jumpValue}
              onChange={e => setJumpValue(e.target.value)}
              placeholder={String(page)}
              aria-label="Jump to page"
              className="w-12 h-7 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center focus:ring-2 focus:ring-emerald-500/20 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </form>
        )}
      </div>
    </nav>
  );
};
