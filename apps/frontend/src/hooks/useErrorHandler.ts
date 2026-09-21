import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { buildApiQueryError, type ApiQueryError } from './useApiQuery';

export type { ApiQueryError as ApiError };

/**
 * Extracts a clean ApiQueryError from any thrown value.
 * Re-exported for use outside React components.
 */
export function parseApiError(err: unknown): ApiQueryError {
  return buildApiQueryError(err);
}

/**
 * useErrorHandler — stable `handle` function that:
 * - Parses any thrown value into a structured ApiQueryError
 * - Shows a status-code-aware toast (unless silent: true)
 * - Navigates to /forbidden on 403, /login on 401
 * - Returns the parsed error so callers can inspect fields / requestId
 *
 * Usage:
 *   const { handle } = useErrorHandler();
 *   try { await apiPost(...) } catch (e) { handle(e); }
 *
 * Silent (no toast — caller shows inline UI):
 *   handle(e, { silent: true });
 *
 * Override message:
 *   handle(e, { message: 'Failed to save invoice' });
 */
export function useErrorHandler() {
  const navigate = useNavigate();

  const handle = useCallback(
    (
      err: unknown,
      options: {
        /** Suppress the toast — use when showing inline ApiErrorState */
        silent?: boolean;
        /** Override the displayed message */
        message?: string;
        /** Called after handling */
        onHandled?: (parsed: ApiQueryError) => void;
      } = {},
    ): ApiQueryError => {
      const parsed = parseApiError(err);
      const { silent = false, message: overrideMsg, onHandled } = options;

      const displayMsg =
        overrideMsg ??
        (Array.isArray(parsed.message) ? parsed.message[0] : parsed.message) ??
        'An unexpected error occurred.';

      if (!silent) {
        const id = `err-${parsed.statusCode ?? 'unknown'}`;

        switch (parsed.statusCode) {
          case 401:
            toast.error('Session expired. Redirecting to login…', { id });
            navigate('/login');
            break;
          case 402:
            toast.error('This feature requires an active subscription.', { id });
            navigate('/payment-required');
            break;
          case 403:
            toast.error("Access denied — you don't have permission for this action.", { id });
            break;
          case 404:
            toast.error(displayMsg, { id });
            break;
          case 405:
            toast.error('This action is not supported here.', { id });
            break;
          case 406:
            toast.error('The requested format is not supported.', { id });
            break;
          case 407:
            toast.error('Proxy authentication required.', { id });
            break;
          case 408:
            toast.error('Request timed out — please try again.', { id });
            break;
          case 409:
            toast.error(displayMsg || 'A conflict occurred — this record may already exist.', { id });
            break;
          case 410:
            toast.error('This resource is no longer available.', { id });
            break;
          case 411:
            toast.error('Content-Length header is required.', { id });
            break;
          case 412:
            toast.error('Precondition failed — the resource has been modified.', { id });
            break;
          case 413:
            toast.error('The file or payload is too large.', { id });
            break;
          case 414:
            toast.error('The request URI is too long.', { id });
            break;
          case 415:
            toast.error('Unsupported file type.', { id });
            break;
          case 416:
            toast.error('The requested range cannot be satisfied.', { id });
            break;
          case 417:
            toast.error('Expectation failed — server cannot meet request headers.', { id });
            break;
          case 421:
            toast.error('Request was directed to a server that cannot respond.', { id });
            break;
          case 422:
            toast.error(displayMsg || 'The data provided could not be processed.', { id });
            break;
          case 423:
            toast.error('The resource is locked.', { id });
            break;
          case 424:
            toast.error('A dependent request failed.', { id });
            break;
          case 428:
            toast.error('Precondition required — If-Match or If-None-Match header needed.', { id });
            break;
          case 429:
            toast.error('Too many requests — please wait a moment.', { id, duration: 6000 });
            break;
          case 431:
            toast.error('Request header fields are too large.', { id });
            break;
          case 451:
            toast.error('This resource is unavailable for legal reasons.', { id });
            break;
          case 500:
            toast.error('A server error occurred. Our team has been notified.', { id });
            break;
          case 501:
            toast.error('This feature is not yet implemented.', { id });
            break;
          case 502:
          case 503:
          case 504:
            toast.error('Service temporarily unavailable. Please try again shortly.', {
              id,
              duration: 6000,
            });
            break;
          case 505:
            toast.error('HTTP version not supported.', { id });
            break;
          case 507:
            toast.error('Insufficient storage to complete the request.', { id });
            break;
          case 508:
            toast.error('Loop detected while processing the request.', { id });
            break;
          case 510:
            toast.error('Further extensions required to fulfill the request.', { id });
            break;
          case 511:
            toast.error('Network authentication required.', { id });
            break;
          default:
            if (parsed.isNetworkError) {
              toast.error('No connection to server — check your network.', {
                id: 'network-error',
                duration: 6000,
              });
            } else {
              toast.error(displayMsg, { id });
            }
        }
      }

      // Append requestId to console for debugging (dev only)
      if (parsed.requestId && import.meta.env.DEV) {
         
        console.debug(`[OVDS] Request ID: ${parsed.requestId}`);
      }

      onHandled?.(parsed);
      return parsed;
    },
    [navigate],
  );

  return { handle, parseApiError };
}

