/**
 * useToast — thin wrapper around react-hot-toast.
 *
 * - Deduplicates toasts by ID (prevents stacking on rapid clicks)
 * - Provides semantic helpers: success, error, warning, info, loading, promise
 * - Supports both call signatures:
 *     success('message')
 *     toast({ title: 'Title', description: 'Detail', variant: 'success' })
 * - Standardises duration and styling
 *
 * Usage:
 *   const { success, error, toast, promise } = useToast();
 *   success('Invoice created');
 *   toast({ title: 'Done', description: '3 items updated', variant: 'success' });
 *   error('Failed to save', { id: 'save-error' });
 *   await promise(apiPost('/invoices', data), {
 *     loading: 'Creating invoice…',
 *     success: 'Invoice created',
 *     error: 'Failed to create invoice',
 *   });
 */
import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast as hotToast } from 'react-hot-toast';

// -- Structured toast options --------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface StructuredToastOptions {
  title:        string;
  description?: string;
  variant?:     ToastVariant;
  id?:          string;
  duration?:    number;
}

function buildStructuredMessage(title: string, description?: string): string {
  return description ? `${title}\n${description}` : title;
}

export function useToast() {
  const success = useCallback(
    (message: string, options?: { id?: string; duration?: number }) => {
      hotToast.success(message, {
        id: options?.id ?? `success-${message.slice(0, 20)}`,
        duration: options?.duration ?? 3000,
      });
    },
    [],
  );

  const error = useCallback(
    (message: string, options?: { id?: string; duration?: number }) => {
      hotToast.error(message, {
        id: options?.id ?? `error-${message.slice(0, 20)}`,
        duration: options?.duration ?? 5000,
      });
    },
    [],
  );

  const warning = useCallback(
    (message: string, options?: { id?: string; duration?: number }) => {
      hotToast(message, {
        id: options?.id ?? `warn-${message.slice(0, 20)}`,
        duration: options?.duration ?? 4000,
        icon: '⚠️',
        style: {
          background: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fde68a',
        },
      });
    },
    [],
  );

  const info = useCallback(
    (message: string, options?: { id?: string; duration?: number }) => {
      hotToast(message, {
        id: options?.id ?? `info-${message.slice(0, 20)}`,
        duration: options?.duration ?? 3500,
        icon: 'ℹ️',
      });
    },
    [],
  );

  const loading = useCallback(
    (message: string, id?: string): string => {
      return hotToast.loading(message, { id: id ?? `loading-${Date.now()}` });
    },
    [],
  );

  const dismiss = useCallback((id?: string) => {
    hotToast.dismiss(id);
  }, []);

  const custom = useCallback(
    (content: ReactNode, options?: { id?: string; duration?: number }) => {
      hotToast.custom(() => content as React.ReactElement, {
        id: options?.id ?? `custom-${Date.now()}`,
        duration: options?.duration ?? 4000,
      });
    },
    [],
  );

  /**
   * Structured toast — supports { title, description, variant } shape.
   * Dispatches to the appropriate semantic method based on variant.
   */
  const toast = useCallback((opts: StructuredToastOptions) => {
    const msg    = buildStructuredMessage(opts.title, opts.description);
    const shared = { id: opts.id, duration: opts.duration };
    switch (opts.variant) {
      case 'success': return success(msg, shared);
      case 'error':   return error(msg, shared);
      case 'warning': return warning(msg, shared);
      case 'info':    return info(msg, shared);
      default:
        hotToast(msg, { id: opts.id ?? `toast-${Date.now()}`, duration: opts.duration ?? 3500 });
    }
  }, [success, error, warning, info]);

  /**
   * Wraps a promise with loading/success/error toasts.
   * Returns the resolved value so you can chain it.
   */
  const promise = useCallback(
    <T>(
      p: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error:   string | ((err: unknown) => string);
      },
      id?: string,
    ): Promise<T> => {
      return hotToast.promise(
        p,
        {
          loading: messages.loading,
          success: messages.success as Parameters<typeof hotToast.promise>[1]['success'],
          error:   messages.error   as Parameters<typeof hotToast.promise>[1]['error'],
        },
        { id: id ?? `promise-${Date.now()}` },
      ) as Promise<T>;
    },
    [],
  );

  return { success, error, warning, info, loading, dismiss, custom, toast, promise };
}

// Re-export ReactNode for the custom method signature
export type { ReactNode as ToastContent };
