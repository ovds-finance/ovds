/**
 * useAsyncState — manages async operation state (loading, error, data).
 *
 * Wraps an async function call and tracks its lifecycle.
 * Prevents state updates on unmounted components.
 *
 * Usage:
 *   const { data, loading, error, execute } = useAsyncState(fetchInvoices);
 *
 *   useEffect(() => { execute(companyId); }, [companyId]);
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data:    T | null;
  status:  AsyncStatus;
  loading: boolean;
  error:   Error | null;
  /** Call to trigger the async operation */
  execute: (...args: any[]) => Promise<T | null>;
  /** Reset to idle state */
  reset:   () => void;
}

export function useAsyncState<T, A extends any[] = any[]>(
  asyncFn: (...args: A) => Promise<T>,
  options: {
    /** Initial data value */
    initialData?: T | null;
    /** Called when the operation succeeds */
    onSuccess?: (data: T) => void;
    /** Called when the operation fails */
    onError?: (error: Error) => void;
  } = {},
): AsyncState<T> {
  const { initialData = null, onSuccess, onError } = options;
  const mountedRef = useRef(true);

  const [state, setState] = useState<{
    data:   T | null;
    status: AsyncStatus;
    error:  Error | null;
  }>({ data: initialData, status: 'idle', error: null });

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      if (mountedRef.current) {
        setState(s => ({ ...s, status: 'loading', error: null }));
      }
      try {
        const result = await asyncFn(...args);
        if (mountedRef.current) {
          setState({ data: result, status: 'success', error: null });
          onSuccess?.(result);
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setState(s => ({ ...s, status: 'error', error }));
          onError?.(error);
        }
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asyncFn],
  );

  const reset = useCallback(() => {
    setState({ data: initialData, status: 'idle', error: null });
  }, [initialData]);

  return {
    data:    state.data,
    status:  state.status,
    loading: state.status === 'loading',
    error:   state.error,
    execute,
    reset,
  };
}
