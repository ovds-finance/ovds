/**
 * useFormDirty — tracks whether form values have changed from their saved state.
 *
 * Features:
 *  - Deep comparison via JSON serialization
 *  - Warns on browser close/refresh when dirty (beforeunload)
 *  - Returns helpers to mark as saved and reset
 *
 * Usage:
 *   const { isDirty, markSaved, reset } = useFormDirty(formValues, savedValues);
 *   const { isDirty, markSaved } = useFormDirty(settings, savedSettings, {
 *     warnOnLeave: true,
 *     warnMessage: 'You have unsaved settings changes.',
 *   });
 */
import { useEffect, useMemo, useCallback, useRef } from 'react';

interface UseFormDirtyOptions {
  /** Show browser beforeunload warning when dirty. Default: true */
  warnOnLeave?: boolean;
  /** Custom message for the beforeunload dialog (browsers may ignore it) */
  warnMessage?: string;
  /** Skip dirty check entirely (e.g. when user lacks write permission) */
  skip?: boolean;
}

interface UseFormDirtyResult {
  /** True when current values differ from saved values */
  isDirty: boolean;
  /** Call after a successful save to reset the dirty state */
  markSaved: (newSaved?: unknown) => void;
  /** Reset current tracking (e.g. on cancel) */
  reset: () => void;
}

export function useFormDirty(
  current: unknown,
  saved: unknown,
  options: UseFormDirtyOptions = {},
): UseFormDirtyResult {
  const { warnOnLeave = true, skip = false } = options;

  const isDirty = useMemo(() => {
    if (skip) return false;
    // Skip comparison until saved has been populated
    if (saved === null || saved === undefined) return false;
    if (typeof saved === 'object' && Object.keys(saved as object).length === 0) return false;
    try {
      return JSON.stringify(current) !== JSON.stringify(saved);
    } catch {
      return false;
    }
  }, [current, saved, skip]);

  // Warn on browser close/refresh
  useEffect(() => {
    if (!isDirty || !warnOnLeave) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, warnOnLeave]);

  const savedRef = useRef(saved);
  const markSaved = useCallback((newSaved?: unknown) => {
    savedRef.current = newSaved ?? current;
  }, [current]);

  const reset = useCallback(() => {
    savedRef.current = saved;
  }, [saved]);

  return { isDirty, markSaved, reset };
}

