import { useCallback, useReducer, useRef } from 'react';

// ── State machine ────────────────────────────────────────────────────────────

export type BladeState<T> =
  | { status: 'idle'; data: T | null; error: null }
  | { status: 'loading'; data: T | null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: T | null; error: ApiError };

export interface ApiError {
  message: string;
  statusCode?: number;
  fields?: Record<string, string>;
  requestId?: string;
}

type BladeAction<T> =
  | { type: 'LOAD' }
  | { type: 'SUCCESS'; data: T }
  | { type: 'ERROR'; error: ApiError }
  | { type: 'RESET' }
  | { type: 'SET_DATA'; data: T };

function bladeReducer<T>(
  state: BladeState<T>,
  action: BladeAction<T>,
): BladeState<T> {
  switch (action.type) {
    case 'LOAD':
      return { status: 'loading', data: state.data ?? null, error: null };
    case 'SUCCESS':
      return { status: 'success', data: action.data, error: null };
    case 'ERROR':
      return { status: 'error', data: state.data ?? null, error: action.error };
    case 'RESET':
      return { status: 'idle', data: null, error: null };
    case 'SET_DATA':
      if (state.status === 'idle') {
        return { status: 'idle', data: action.data, error: null };
      }
      return { ...state, data: action.data };
    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseBladeStateResult<T> {
  state: BladeState<T>;
  /** Trigger async operation with automatic state transitions */
  run: (promise: Promise<T>) => Promise<T | null>;
  /** Manual state setters */
  setLoading: () => void;
  setSuccess: (data: T) => void;
  setError: (error: ApiError) => void;
  reset: () => void;
  /** Convenience booleans for conditional rendering */
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

/**
 * useBladeState — predictable async state machine for UI blades.
 *
 * Ovds SaaS design principle: every blade has a deterministic state that
 * the UI can render without ambiguity. No "sometimes loading, sometimes not"
 * edge cases.
 *
 * Usage:
 *   const { state, run, isLoading, isError, reset } = useBladeState<Invoice[]>(null);
 *
 *   // In a useEffect:
 *   useEffect(() => { run(fetchInvoices()); }, []);
 *
 *   // In JSX:
 *   if (isLoading) return <Spinner />;
 *   if (isError) return <ErrorState error={state.error} onRetry={run(fetchInvoices())} />;
 *   if (isSuccess) return <Table data={state.data} />;
 */
export function useBladeState<T>(initialData: T | null = null): UseBladeStateResult<T> {
  const [state, dispatch] = useReducer(bladeReducer<T>, {
    status: 'idle',
    data: initialData,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const run = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    // Cancel any in-flight operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'LOAD' });
    try {
      const data = await promise;
      dispatch({ type: 'SUCCESS', data });
      return data;
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
        statusCode: (err as any)?.statusCode ?? (err as any)?.status ?? 500,
        fields: (err as any)?.fields,
        requestId: (err as any)?.requestId,
      };
      dispatch({ type: 'ERROR', error: apiError });
      return null;
    }
  }, []);

  const setLoading = useCallback(() => dispatch({ type: 'LOAD' }), []);
  const setSuccess = useCallback((data: T) => dispatch({ type: 'SUCCESS', data }), []);
  const setError = useCallback((error: ApiError) => dispatch({ type: 'ERROR', error }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state,
    run,
    setLoading,
    setSuccess,
    setError,
    reset,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isIdle: state.status === 'idle',
  };
}
