/**
 * usePageError — converts any caught API error into a structured object
 * that ApiErrorState can render directly.
 *
 * Usage in any page:
 *
 *   const { pageError, setPageError, clearPageError, wrapAsync } = usePageError();
 *
 *   // In a catch block:
 *   } catch (err) { setPageError(err); }
 *
 *   // In JSX — full-page error:
 *   if (pageError) return <ApiErrorState error={pageError} onRetry={clearPageError} />;
 *
 *   // In JSX — widget-level:
 *   if (pageError) return <ApiErrorState error={pageError} onRetry={clearPageError} compact />;
 *
 *   // wrapAsync — no try/catch needed:
 *   const fetchData = wrapAsync(async () => {
 *     const data = await apiGet('/invoices');
 *     setInvoices(data);
 *   });
 *
 *   // Field-level validation errors (for forms):
 *   const emailError = fieldError('email');  // → "must be an email" | undefined
 */
import { useState, useCallback } from 'react';
import { buildApiQueryError, type ApiQueryError } from './useApiQuery';

export type PageError = ApiQueryError;

interface UsePageErrorResult {
  /** Structured error — pass directly to <ApiErrorState error={pageError} /> */
  pageError: PageError | null;
  /** Call in a catch block: setPageError(err) */
  setPageError: (err: unknown) => void;
  /** Reset the error state (e.g. on retry) */
  clearPageError: () => void;
  /**
   * Get the validation error message for a specific field.
   * Returns undefined when there is no error for that field.
   *
   * @example
   *   const emailErr = fieldError('email');
   *   <input className={emailErr ? 'border-rose-500' : ''} />
   *   {emailErr && <p className="text-rose-500 text-xs">{emailErr}</p>}
   */
  fieldError: (field: string) => string | undefined;
  /**
   * Wraps an async function so any thrown error is automatically captured.
   * Returns a stable callback reference (memoised with useCallback).
   *
   * @example
   *   const fetchData = wrapAsync(async () => {
   *     const data = await apiGet('/invoices');
   *     setInvoices(data);
   *   });
   */
  wrapAsync: <T extends (...args: any[]) => Promise<any>>(fn: T) => (...args: Parameters<T>) => Promise<void>;
  /** true when there is an active error */
  hasError: boolean;
  /** true when the error has field-level validation details */
  hasFieldErrors: boolean;
}

export function usePageError(): UsePageErrorResult {
  const [pageError, setRawError] = useState<PageError | null>(null);

  const setPageError = useCallback((err: unknown) => {
    setRawError(buildApiQueryError(err));
  }, []);

  const clearPageError = useCallback(() => {
    setRawError(null);
  }, []);

  const fieldError = useCallback(
    (field: string): string | undefined => pageError?.fields?.[field],
    [pageError],
  );

  const wrapAsync = useCallback(
    <T extends (...args: any[]) => Promise<any>>(fn: T) =>
      async (...args: Parameters<T>): Promise<void> => {
        try {
          setRawError(null);
          await fn(...args);
        } catch (err) {
          setRawError(buildApiQueryError(err));
        }
      },
    [],
  );

  return {
    pageError,
    setPageError,
    clearPageError,
    fieldError,
    wrapAsync,
    hasError: pageError !== null,
    hasFieldErrors: !!(pageError?.fields && Object.keys(pageError.fields).length > 0),
  };
}

