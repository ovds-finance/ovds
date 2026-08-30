/**
 * usePagination — full-featured pagination state with URL sync.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UsePaginationProps {
  initialPage?: number;
  initialTake?: number;
  /** Sync page/take to URL search params (default: false) */
  syncUrl?: boolean;
  /** URL param names (default: 'page' / 'take') */
  pageParam?: string;
  takeParam?: string;
}

interface PaginationProps {
  page: number;
  take: number;
  total: number;
  pages: number;
  onPageChange: (p: number) => void;
  onTakeChange: (t: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsePaginationResult {
  page: number;
  take: number;
  total: number;
  pages: number;
  setPage: (p: number) => void;
  setTake: (t: number) => void;
  /** Call with the total count from the API response */
  setTotal: (t: number) => void;
  reset: () => void;
  next: () => void;
  prev: () => void;
  goTo: (p: number) => void;
  first: () => void;
  last: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  /** Spread directly onto <Pagination> — includes all required props */
  paginationProps: PaginationProps;
}

export function usePagination({
  initialPage = 1,
  initialTake = 10,
  syncUrl = false,
  pageParam = 'page',
  takeParam = 'take',
}: UsePaginationProps = {}): UsePaginationResult {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL if syncUrl is enabled
  const getInitialPage = () => {
    if (syncUrl) {
      const p = parseInt(searchParams.get(pageParam) ?? '', 10);
      if (!isNaN(p) && p > 0) return p;
    }
    return initialPage;
  };
  const getInitialTake = () => {
    if (syncUrl) {
      const t = parseInt(searchParams.get(takeParam) ?? '', 10);
      if (!isNaN(t) && t > 0) return t;
    }
    return initialTake;
  };

  const [page, setPageState] = useState<number>(getInitialPage);
  const [take, setTakeState] = useState<number>(getInitialTake);
  const [total, setTotal] = useState(0);

  const pages = useMemo(
    () => (total > 0 ? Math.ceil(total / take) : 1),
    [total, take],
  );

  // Auto-clamp page when total/take changes
  useEffect(() => {
    if (pages > 0 && page > pages) {
      setPageState(pages);
    }
  }, [pages, page]);

  // Sync to URL
  useEffect(() => {
    if (!syncUrl) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(pageParam, String(page));
        next.set(takeParam, String(take));
        return next;
      },
      { replace: true },
    );
  }, [page, take, syncUrl, pageParam, takeParam, setSearchParams]);

  const setPage = useCallback(
    (p: number) => setPageState(Math.max(1, Math.min(p, pages || 1))),
    [pages],
  );

  const setTake = useCallback((t: number) => {
    setTakeState(t);
    setPageState(1); // reset to page 1 when page size changes
  }, []);

  const reset = useCallback(() => setPageState(initialPage), [initialPage]);
  const next  = useCallback(() => setPage(page + 1), [page, setPage]);
  const prev  = useCallback(() => setPage(page - 1), [page, setPage]);
  const goTo  = useCallback((p: number) => setPage(p), [setPage]);
  const first = useCallback(() => setPageState(1), []);
  const last  = useCallback(() => { if (pages > 0) setPageState(pages); }, [pages]);

  const hasNext = page < pages;
  const hasPrev = page > 1;

  const paginationProps: PaginationProps = useMemo(
    () => ({
      page,
      take,
      total,
      pages,
      onPageChange: setPage,
      onTakeChange: setTake,
      hasNext,
      hasPrev,
    }),
    [page, take, total, pages, setPage, setTake, hasNext, hasPrev],
  );

  return {
    page,
    take,
    total,
    pages,
    setPage,
    setTake,
    setTotal,
    reset,
    next,
    prev,
    goTo,
    first,
    last,
    hasNext,
    hasPrev,
    paginationProps,
  };
}
