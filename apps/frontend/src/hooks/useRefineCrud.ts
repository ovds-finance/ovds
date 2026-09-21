/**
 * useRefineCrud — unified CRUD + table hook for all Refine-backed pages.
 *
 * Wraps useTable + useCreate + useUpdate + useDelete into a single ergonomic
 * API. Every Refine page should use this instead of calling the four hooks
 * individually.
 *
 * Features:
 *  - Full pagination control (currentPage / setCurrentPage / pageSize / setPageSize)
 *  - Reactive filter control (setFilters / filters)
 *  - Reactive sorter control (setSorters / sorters)
 *  - Mutation helpers (createMutate / updateMutate / deleteMutate)
 *  - Loading state per operation
 */
import {
  useTable,
  useCreate,
  useUpdate,
  useDelete,
  type useTableProps,
  type BaseRecord,
  type CrudFilters,
  type CrudSorting,
  type CrudSort,
} from "@refinedev/core";

// Extend useTableProps — do not re-declare 'resource' as it already exists there
type RefineCrudOptions<T extends BaseRecord> = useTableProps<T, any, T>;

interface RefineCrudResult<T extends BaseRecord> {
  /** Raw query result — contains { data, total } */
  result: { data: T[]; total: number | undefined; [k: string]: any };
  /** Spreading on a plain <table> is a no-op in v5 (pagination/sorting are driven imperatively). Kept for API compatibility with existing pages. */
  tableProps: Record<string, never>;
  loading: boolean;
  /** Current active filters (reactive) */
  filters: CrudFilters;
  /** Replace active filters */
  setFilters: ReturnType<typeof useTable<T>>["setFilters"];
  /** Current active sorters (reactive) */
  sorters: CrudSorting;
  /** Replace active sorters */
  setSorters: ReturnType<typeof useTable<T>>["setSorters"];
  currentPage: number;
  setCurrentPage: ReturnType<typeof useTable<T>>["setCurrentPage"];
  pageSize: number;
  setPageSize: ReturnType<typeof useTable<T>>["setPageSize"];
  pageCount: number;
  createMutate: ReturnType<typeof useCreate<T>>["mutate"];
  updateMutate: ReturnType<typeof useUpdate<T>>["mutate"];
  deleteMutate: ReturnType<typeof useDelete<T>>["mutate"];
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  /** Total number of records (from pagination meta) */
  total: number;
  /** Total number of pages */
  pageCountFallback: number;
  /** True when any mutation is in flight */
  mutating: boolean;
}

function useRefineCrud<T extends BaseRecord = BaseRecord>(
  options: RefineCrudOptions<T>,
): RefineCrudResult<T> {
  const {
    result,
    tableQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageCount,
    filters,
    setFilters,
    sorters,
    setSorters,
  } = useTable<T>(options);

  const { mutate: createMutate, mutation: createMutation } = useCreate<T>();
  const { mutate: updateMutate, mutation: updateMutation } = useUpdate<T>();
  const { mutate: deleteMutate, mutation: deleteMutation } = useDelete<T>();

  const creating = createMutation.isPending;
  const updating = updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const total = result.total ?? 0;
  const fallbackPageCount = Math.max(1, Math.ceil(total / (pageSize || 10)));

  return {
    result,
    tableProps: {},
    loading: tableQuery.isFetching,
    filters,
    setFilters,
    sorters,
    setSorters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageCount,
    createMutate,
    updateMutate,
    deleteMutate,
    creating,
    updating,
    deleting,
    total,
    pageCountFallback: fallbackPageCount,
    mutating: creating || updating || deleting,
  };
}

export { useRefineCrud };
export type { RefineCrudResult, RefineCrudOptions };
