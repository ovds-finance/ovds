/**
 * Pagination — Ovds SaaS pagination nav.
 *
 * Two usage patterns:
 *  1. Modern — spread from usePagination():
 *       const pg = usePagination({ initialTake: 20 });
 *       pg.setTotal(data.pagination.total);
 *       <Pagination {...pg.paginationProps} />
 *
 *  2. Legacy:
 *       <Pagination page={page} total={total} pageSize={25} onChange={setPage} />
 *
 * Design:
 *  - Active page: var(--pro-azure) bg, white text
 *  - Idle pages: white border button, hover: green tint bg + green border
 *  - Prev/Next/First/Last: same idle style
 *  - Focus ring: 2px var(--pro-azure) ring
 *  - Summary: "X – Y of Z records" at left
 */
import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  total: number;
  pages?: number;
  take?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPageChange?: (page: number) => void;
  onTakeChange?: (take: number) => void;
  takeOptions?: number[];
  jumpThreshold?: number;
  /** @deprecated Use take */
  pageSize?: number;
  /** @deprecated Use onPageChange */
  onChange?: (page: number) => void;
  className?: string;
}

/* ── Shared base styles ─────────────────────────────────────────── */
const BTN_BASE = [
  'inline-flex items-center justify-center rounded-lg border transition-all duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1',
  'disabled:opacity-35 disabled:cursor-not-allowed',
  'active:scale-[0.95]',
].join(' ');

const BTN_IDLE = [
  'border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)]',
  'hover:bg-[var(--pro-azure-50)] hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)]',
].join(' ');

const BTN_ACTIVE = [
  'border-[var(--pro-azure)] bg-[var(--pro-azure)] text-white',
  'shadow-sm shadow-[var(--pro-azure)]/25',
].join(' ');

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
  const take    = takeProp ?? pageSize ?? 25;
  const pages   = pagesProp ?? (total > 0 ? Math.ceil(total / take) : 1);
  const hasPrev = hasPrevProp ?? page > 1;
  const hasNext = hasNextProp ?? page < pages;
  const go      = onPageChange ?? onChange ?? (() => {});

  const from = total === 0 ? 0 : Math.min((page - 1) * take + 1, total);
  const to   = Math.min(page * take, total);
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const p = parseInt(jumpValue, 10);
      if (!isNaN(p) && p >= 1 && p <= pages) { go(p); setJumpValue(''); }
    },
    [jumpValue, pages, go],
  );

  if (total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 ${className}`}
      style={{
        borderTop: '1px solid var(--border-alt)',
        background: 'var(--surface-alt)',
      }}
    >
      {/* Summary */}
      <p className="text-[11px] font-medium tabular-nums select-none" style={{ color: 'var(--text-4)' }}>
        <span className="font-bold" style={{ color: 'var(--text-2)' }}>{from.toLocaleString()}</span>
        {' – '}
        <span className="font-bold" style={{ color: 'var(--text-2)' }}>{to.toLocaleString()}</span>
        {' of '}
        <span className="font-bold" style={{ color: 'var(--text-2)' }}>{total.toLocaleString()}</span>
        {' records'}
      </p>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => go(1)}
          disabled={!hasPrev}
          title="First page"
          aria-label="First page"
          className={`${BTN_BASE} ${BTN_IDLE} w-7 h-7`}
        >
          <ChevronsLeft size={13} />
        </button>

        {/* Prev */}
        <button
          onClick={() => go(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
          className={`${BTN_BASE} ${BTN_IDLE} gap-1 px-2.5 h-7 text-[11px] font-bold`}
        >
          <ChevronLeft size={13} /> Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5" role="group" aria-label="Page numbers">
          {buildPageNums(page, pages).map((p, i) =>
            p === '...' ? (
              <span
                key={`e-${i}`}
                className="w-7 text-center text-[11px] select-none"
                style={{ color: 'var(--text-4)' }}
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => go(p as number)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all duration-150 ${BTN_BASE} ${
                  p === page ? BTN_ACTIVE : BTN_IDLE
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => go(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className={`${BTN_BASE} ${BTN_IDLE} gap-1 px-2.5 h-7 text-[11px] font-bold`}
        >
          Next <ChevronRight size={13} />
        </button>

        {/* Last */}
        <button
          onClick={() => go(pages)}
          disabled={!hasNext}
          title="Last page"
          aria-label="Last page"
          className={`${BTN_BASE} ${BTN_IDLE} w-7 h-7`}
        >
          <ChevronsRight size={13} />
        </button>

        {/* Rows per page */}
        {onTakeChange && (
          <select
            value={take}
            onChange={e => onTakeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="ml-1.5 h-7 px-2 rounded-lg text-[11px] font-bold outline-none transition-all duration-150"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-2)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--pro-azure)';
              e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,186,111,0.18)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow   = 'none';
            }}
          >
            {takeOptions.map(n => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}

        {/* Jump to page */}
        {pages > jumpThreshold && (
          <form onSubmit={handleJump} className="ml-1.5 flex items-center gap-1">
            <span
              className="text-[10px] font-medium hidden sm:inline"
              style={{ color: 'var(--text-4)' }}
            >
              Go
            </span>
            <input
              type="number"
              min={1}
              max={pages}
              value={jumpValue}
              onChange={e => setJumpValue(e.target.value)}
              placeholder={String(page)}
              aria-label="Jump to page"
              className="w-12 h-7 px-2 rounded-lg text-[11px] font-bold text-center outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-2)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--pro-azure)';
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,186,111,0.18)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow   = 'none';
              }}
            />
          </form>
        )}
      </div>
    </nav>
  );
};
