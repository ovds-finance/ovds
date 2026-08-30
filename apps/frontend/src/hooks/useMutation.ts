import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { apiPost, apiPut, apiPatch, apiDelete } from '../services/api';
import { invalidateQueryPrefix, buildApiQueryError } from './useApiQuery';

export type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MutationError {
  message: string;
  statusCode?: number;
  /** Field-level validation errors from NestJS ValidationPipe / ValidationExceptionFilter */
  fields?: Record<string, string>;
  /** X-Request-ID for support correlation */
  requestId?: string;
}

interface UseMutationOptions<TData, TVariables> {
  method?: MutationMethod;
  /** Called on success with the response data */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called on error */
  onError?: (error: MutationError, variables: TVariables) => void;
  /** Called after success or error — useful for cleanup (e.g. setLoading(false)) */
  onSettled?: (data: TData | null, error: MutationError | null) => void;
  /** Show a success toast automatically */
  successMessage?: string | ((data: TData) => string);
  /**
   * Suppress the automatic error toast.
   * Use when the component renders its own inline error UI.
   * Default: false
   */
  suppressToast?: boolean;
  /** Cache prefixes to invalidate on success */
  invalidates?: string[];
  /** Optimistic update — applied immediately, rolled back on error */
  optimisticUpdate?: (variables: TVariables) => void;
  /** Rollback function called when optimistic update needs to be reversed */
  rollback?: () => void;
  /**
   * Debounce the mutate call by N ms — prevents double-submit on rapid clicks.
   * Default: 0 (no debounce)
   */
  debounceMs?: number;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (url: string, variables?: TVariables) => Promise<TData | null>;
  loading: boolean;
  error: MutationError | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook for write operations (POST/PUT/PATCH/DELETE) with:
 * - Automatic loading state
 * - Structured error with field-level validation errors and requestId
 * - Optimistic updates with rollback
 * - Cache invalidation on success
 * - Optional success/error toasts (suppressToast to disable)
 * - onSettled callback for cleanup
 * - Abort on unmount
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation<Invoice, CreateInvoiceDto>({
 *     method: 'POST',
 *     successMessage: 'Invoice created',
 *     invalidates: ['/invoices'],
 *     suppressToast: true,   // show inline error instead
 *   });
 *   const result = await mutate('/invoices', payload);
 *   if (error?.fields?.customerName) { ... }
 */
export function useMutation<TData = any, TVariables = any>(
  options: UseMutationOptions<TData, TVariables> = {},
): UseMutationResult<TData, TVariables> {
  const {
    method = 'POST',
    onSuccess,
    onError,
    onSettled,
    successMessage,
    suppressToast = false,
    invalidates = [],
    optimisticUpdate,
    rollback,
    debounceMs = 0,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MutationError | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallRef = useRef<number>(0);

  const mutate = useCallback(
    async (url: string, variables?: TVariables): Promise<TData | null> => {
      // Debounce: ignore calls within debounceMs of the last call
      if (debounceMs > 0) {
        const now = Date.now();
        if (now - lastCallRef.current < debounceMs) return null;
        lastCallRef.current = now;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      optimisticUpdate?.(variables as TVariables);

      try {
        let result: TData;
        const config: any = { signal: abortRef.current.signal };
        // Suppress global axios toast when caller handles errors inline
        if (suppressToast) config.headers = { 'x-background': '1' };

        switch (method) {
          case 'POST':   result = await apiPost<TData>(url, variables, config); break;
          case 'PUT':    result = await apiPut<TData>(url, variables, config);  break;
          case 'PATCH':  result = await apiPatch<TData>(url, variables, config); break;
          case 'DELETE': result = await apiDelete<TData>(url, config);           break;
          default:       result = await apiPost<TData>(url, variables, config);
        }

        setData(result);

        for (const prefix of invalidates) {
          invalidateQueryPrefix(prefix);
        }

        if (successMessage) {
          const msg = typeof successMessage === 'function' ? successMessage(result) : successMessage;
          toast.success(msg);
        }

        onSuccess?.(result, variables as TVariables);
        onSettled?.(result, null);
        return result;

      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return null;

        rollback?.();

        // Use shared error builder for consistency with useApiQuery
        const structured = buildApiQueryError(err);
        const mutErr: MutationError = {
          message: structured.message,
          statusCode: structured.statusCode,
          fields: structured.fields,
          requestId: structured.requestId,
        };

        setError(mutErr);

        if (!suppressToast) {
          toast.error(mutErr.message, {
            id: `mutation-error-${mutErr.statusCode ?? 'unknown'}`,
          });
        }

        onError?.(mutErr, variables as TVariables);
        onSettled?.(null, mutErr);
        return null;

      } finally {
        setLoading(false);
      }
    },
    [method, onSuccess, onError, onSettled, successMessage, suppressToast, invalidates, optimisticUpdate, rollback, debounceMs],
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { mutate, loading, error, data, reset };
}

