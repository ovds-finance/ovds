/**
 * useFormValidation — lightweight form state + validation integrated with
 * useMutation field errors from the backend (NestJS ValidationPipe).
 *
 * Features:
 * - Tracks field values with type safety
 * - Merges client-side rules with server-side field errors
 * - Marks fields as touched on blur (only show errors after interaction)
 * - Dirty tracking (unsaved changes warning)
 * - Reset to initial values
 *
 * Usage:
 *   const form = useFormValidation({
 *     initialValues: { email: '', amount: 0 },
 *     rules: {
 *       email: (v) => !v ? 'Required' : !/\S+@\S+/.test(v) ? 'Invalid email' : null,
 *       amount: (v) => v <= 0 ? 'Must be positive' : null,
 *     },
 *   });
 *
 *   // Merge server errors after mutation
 *   const { mutate, error } = useMutation({ suppressToast: true });
 *   useEffect(() => { if (error?.fields) form.setServerErrors(error.fields); }, [error]);
 *
 *   // In JSX:
 *   <input
 *     value={form.values.email}
 *     onChange={e => form.set('email', e.target.value)}
 *     onBlur={() => form.touch('email')}
 *     className={form.fieldError('email') ? 'border-red-500' : ''}
 *   />
 *   {form.fieldError('email') && <p className="text-red-500 text-xs">{form.fieldError('email')}</p>}
 *
 *   <button disabled={!form.isValid || form.isSubmitting} onClick={form.handleSubmit(onSubmit)}>
 *     Save
 *   </button>
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';

type ValidationRule<T> = (value: T) => string | null;
type Rules<TValues extends Record<string, any>> = {
  [K in keyof TValues]?: ValidationRule<TValues[K]>;
};

interface UseFormValidationOptions<TValues extends Record<string, any>> {
  initialValues: TValues;
  rules?: Rules<TValues>;
}

interface UseFormValidationResult<TValues extends Record<string, any>> {
  values: TValues;
  /** Set a single field value */
  set: <K extends keyof TValues>(field: K, value: TValues[K]) => void;
  /** Set multiple fields at once */
  setMany: (partial: Partial<TValues>) => void;
  /** Mark a field as touched (show its error) */
  touch: (field: keyof TValues) => void;
  /** Mark all fields as touched */
  touchAll: () => void;
  /** Inject server-side field errors (from useMutation error.fields) */
  setServerErrors: (fields: Record<string, string>) => void;
  /** Clear all server errors */
  clearServerErrors: () => void;
  /** Get the error message for a field (client or server), only when touched */
  fieldError: (field: keyof TValues) => string | undefined;
  /** Get error regardless of touched state — for submit validation */
  fieldErrorRaw: (field: keyof TValues) => string | undefined;
  /** true when all fields pass client-side rules */
  isValid: boolean;
  /** true when any value differs from initialValues */
  isDirty: boolean;
  /** true when a submit is in progress */
  isSubmitting: boolean;
  /** Wraps an async submit handler — sets isSubmitting, clears server errors */
  handleSubmit: (fn: (values: TValues) => Promise<void>) => (e?: FormEvent) => Promise<void>;
  /** Reset to initial values and clear all errors */
  reset: () => void;
  /** Reset to new initial values */
  resetTo: (values: TValues) => void;
  /** Set of touched field keys */
  touched: Set<keyof TValues>;
}

export function useFormValidation<TValues extends Record<string, any>>(
  options: UseFormValidationOptions<TValues>,
): UseFormValidationResult<TValues> {
  const { initialValues, rules = {} } = options;
  const initialRef = useRef(initialValues);

  const [values, setValues] = useState<TValues>({ ...initialValues });
  const [touched, setTouched] = useState<Set<keyof TValues>>(new Set());
  const [serverErrors, setServerErrorsState] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = useCallback(<K extends keyof TValues>(field: K, value: TValues[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear server error for this field when user edits it
    setServerErrorsState(prev => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const setMany = useCallback((partial: Partial<TValues>) => {
    setValues(prev => ({ ...prev, ...partial }));
  }, []);

  const touch = useCallback((field: keyof TValues) => {
    setTouched(prev => new Set([...prev, field]));
  }, []);

  const touchAll = useCallback(() => {
    setTouched(new Set(Object.keys(initialRef.current) as (keyof TValues)[]));
  }, []);

  const setServerErrors = useCallback((fields: Record<string, string>) => {
    setServerErrorsState(fields);
    // Auto-touch fields that have server errors so they show immediately
    setTouched(prev => new Set([...prev, ...Object.keys(fields) as (keyof TValues)[]]));
  }, []);

  const clearServerErrors = useCallback(() => {
    setServerErrorsState({});
  }, []);

  // Client-side validation errors (all fields, regardless of touched)
  const clientErrors = useMemo<Partial<Record<keyof TValues, string>>>(() => {
    const errs: Partial<Record<keyof TValues, string>> = {};
    for (const key of Object.keys(rules) as (keyof TValues)[]) {
      const rule = (rules as Rules<TValues>)[key];
      if (!rule) continue;
      const result = rule(values[key]);
      if (result) errs[key] = result;
    }
    return errs;
  }, [values, rules]);

  const fieldErrorRaw = useCallback(
    (field: keyof TValues): string | undefined =>
      clientErrors[field] ?? (serverErrors as Record<string, string>)[field as string],
    [clientErrors, serverErrors],
  );

  const fieldError = useCallback(
    (field: keyof TValues): string | undefined =>
      touched.has(field) ? fieldErrorRaw(field) : undefined,
    [touched, fieldErrorRaw],
  );

  const isValid = useMemo(
    () => Object.keys(clientErrors).length === 0,
    [clientErrors],
  );

  const isDirty = useMemo(() => {
    const init = initialRef.current;
    return Object.keys(values).some(k => values[k] !== init[k]);
  }, [values]);

  const handleSubmit = useCallback(
    (fn: (values: TValues) => Promise<void>) =>
      async (e?: FormEvent) => {
        e?.preventDefault();
        touchAll();
        if (!isValid) return;
        setIsSubmitting(true);
        clearServerErrors();
        try {
          await fn(values);
        } finally {
          setIsSubmitting(false);
        }
      },
    [values, isValid, touchAll, clearServerErrors],
  );

  const reset = useCallback(() => {
    setValues({ ...initialRef.current });
    setTouched(new Set());
    setServerErrorsState({});
    setIsSubmitting(false);
  }, []);

  const resetTo = useCallback((newValues: TValues) => {
    initialRef.current = newValues;
    setValues({ ...newValues });
    setTouched(new Set());
    setServerErrorsState({});
    setIsSubmitting(false);
  }, []);

  return {
    values,
    set,
    setMany,
    touch,
    touchAll,
    setServerErrors,
    clearServerErrors,
    fieldError,
    fieldErrorRaw,
    isValid,
    isDirty,
    isSubmitting,
    handleSubmit,
    reset,
    resetTo,
    touched,
  };
}
