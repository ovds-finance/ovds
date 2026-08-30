/**
 * useTableState — composite hook for common data table state management.
 *
 * Combines pagination, sorting, and search into a single hook.
 * Designed to work with the DataTable component.
 *
 * Usage:
 *   const table = useTableState({ defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
 *
 *   // Use table.query to fetch data
 *   const { data } = useApiQuery('/invoices', table.query);
 *
 *   <DataTable
 *     sortBy={table.sortBy}
 *     sortOrder={table.sortOrder}
 *     onSort={table.setSort}
 *     ...
 *   />
 *   <Pagination
 *     page={table.page}
 *     total={total}
 *     limit={table.limit}
 *     onChange={table.setPage}
 *   />
 */
import { useState, useCallback, useMemo } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface TableStateOptions {
  defaultPage?:      number;
  defaultLimit?:     number;
  defaultSortBy?:    string;
  defaultSortOrder?: SortOrder;
  defaultSearch?:    string;
}

export interface TableQuery {
  page:      number;
  limit:     number;
  sortBy:    string;
  sortOrder: SortOrder;
  search:    string;
}

export interface TableState {
  page:      number;
  limit:     number;
  sortBy:    string;
  sortOrder: SortOrder;
  search:    string;
  /** Serialized query params for API calls */
  query:     TableQuery;
  setPage:   (page: number) => void;
  setLimit:  (limit: number) => void;
  setSort:   (key: string, order: SortOrder) => void;
  setSearch: (search: string) => void;
  reset:     () => void;
}

export function useTableState(opts: TableStateOptions = {}): TableState {
  const {
    defaultPage      = 1,
    defaultLimit     = 20,
    defaultSortBy    = 'createdAt',
    defaultSortOrder = 'desc',
    defaultSearch    = '',
  } = opts;

  const [page,      setPage]      = useState(defaultPage);
  const [limit,     setLimit]     = useState(defaultLimit);
  const [sortBy,    setSortBy]    = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const [search,    setSearch]    = useState(defaultSearch);

  const setSort = useCallback((key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1); // reset to page 1 on sort change
  }, []);

  const setPageCb = useCallback((p: number) => {
    setPage(p);
  }, []);

  const setLimitCb = useCallback((l: number) => {
    setLimit(l);
    setPage(1);
  }, []);

  const setSearchCb = useCallback((s: string) => {
    setSearch(s);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setPage(defaultPage);
    setLimit(defaultLimit);
    setSortBy(defaultSortBy);
    setSortOrder(defaultSortOrder);
    setSearch(defaultSearch);
  }, [defaultPage, defaultLimit, defaultSortBy, defaultSortOrder, defaultSearch]);

  const query = useMemo<TableQuery>(() => ({
    page, limit, sortBy, sortOrder, search,
  }), [page, limit, sortBy, sortOrder, search]);

  return {
    page, limit, sortBy, sortOrder, search, query,
    setPage: setPageCb,
    setLimit: setLimitCb,
    setSort,
    setSearch: setSearchCb,
    reset,
  };
}
