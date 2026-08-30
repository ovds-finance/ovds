import { useState, useCallback, useMemo } from 'react';

type SortDir = 'asc' | 'desc';

interface UseTableSortOptions<T> {
  /** Default sort field */
  defaultField?: keyof T | string;
  /** Default sort direction */
  defaultDir?: SortDir;
  /** Client-side sort comparator — if omitted, sorts by field value directly */
  comparator?: (a: T, b: T, field: string, dir: SortDir) => number;
}

interface UseTableSortResult<T> {
  sortField: string;
  sortDir: SortDir;
  /** Call this when a column header is clicked */
  toggleSort: (field: string) => void;
  /** Sort icon helper — returns 'asc' | 'desc' | null for a given field */
  getSortState: (field: string) => 'asc' | 'desc' | null;
  /** Client-side sorted copy of the data array */
  sorted: T[];
}

/**
 * Manages sort state for a table with optional client-side sorting.
 *
 * Usage:
 *   const { sortField, sortDir, toggleSort, getSortState, sorted } =
 *     useTableSort(employees, { defaultField: 'lastName', defaultDir: 'asc' });
 *
 *   // In the table header:
 *   <th onClick={() => toggleSort('lastName')}>
 *     Name {getSortState('lastName') === 'asc' ? '↑' : '↓'}
 *   </th>
 *
 *   // Render sorted rows:
 *   {sorted.map(emp => <tr key={emp.id}>...</tr>)}
 */
export function useTableSort<T extends Record<string, any>>(
  data: T[],
  options: UseTableSortOptions<T> = {},
): UseTableSortResult<T> {
  const {
    defaultField = '',
    defaultDir = 'asc',
    comparator,
  } = options;

  const [sortField, setSortField] = useState<string>(String(defaultField));
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const toggleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const getSortState = useCallback(
    (field: string): 'asc' | 'desc' | null => {
      if (sortField !== field) return null;
      return sortDir;
    },
    [sortField, sortDir],
  );

  const sorted = useMemo(() => {
    if (!sortField || !data.length) return data;

    // Resolve nested field paths like 'department.name'
    const getVal = (obj: any, path: string): any => {
      return path.split('.').reduce((acc, key) => acc?.[key], obj);
    };

    return [...data].sort((a, b) => {
      if (comparator) return comparator(a, b, sortField, sortDir);

      const av = getVal(a, sortField);
      const bv = getVal(b, sortField);

      // Handle null/undefined
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === 'asc' ? 1 : -1;
      if (bv == null) return sortDir === 'asc' ? -1 : 1;

      // Numeric comparison
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }

      // Date comparison
      if (av instanceof Date || (typeof av === 'string' && !isNaN(Date.parse(av)))) {
        const da = new Date(av).getTime();
        const db = new Date(bv).getTime();
        return sortDir === 'asc' ? da - db : db - da;
      }

      // String comparison
      const sa = String(av).toLowerCase();
      const sb = String(bv).toLowerCase();
      if (sa < sb) return sortDir === 'asc' ? -1 : 1;
      if (sa > sb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDir, comparator]);

  return { sortField, sortDir, toggleSort, getSortState, sorted };
}
