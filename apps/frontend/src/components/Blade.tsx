import { useBladeState, type BladeState, type ApiError as BladeApiError } from '../hooks/useBladeState';

// ── Compound component types ─────────────────────────────────────────────────

export interface BladeProps<T> {
  /** Async operation to run when the blade mounts or deps change */
  run: () => Promise<T>;
  /** Optional deps array — re-runs the operation when changed */
  deps?: unknown[];
  /** Initial data (useful for edit forms) */
  initialData?: T | null;
  /** Render props for each state */
  children: (render: {
    state: BladeState<T>;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    isIdle: boolean;
    reset: () => void;
    retry: () => Promise<T | null>;
  }) => React.ReactNode;
}

// ── Blade component ──────────────────────────────────────────────────────────

/**
 * Blade — Akaunting-style compound component for predictable async UI states.
 *
 * Usage:
 *   <Blade run={fetchInvoices} deps={[companyId]}>
 *     {({ isLoading, isError, isSuccess, state, retry }) => (
 *       <>
 *         {isLoading && <Spinner />}
 *         {isError && <ErrorState error={state.error} onRetry={retry} />}
 *         {isSuccess && <Table data={state.data} />}
 *       </>
 *     )}
 *   </Blade>
 */
export function Blade<T>({
  run,
  deps = [],
  initialData = null,
  children,
}: BladeProps<T>) {
  const { state, run: bladeRun, isLoading, isError, isSuccess, isIdle, reset } =
    useBladeState<T>(initialData);

  const retry = () => bladeRun(run());

  return <>{children({ state, isLoading, isSuccess, isError, isIdle, reset, retry })}</>;
}

// ── Sub-components for declarative usage ─────────────────────────────────────

interface BladeLoadingProps {
  children?: React.ReactNode;
}

export function BladeLoading({ children }: BladeLoadingProps) {
  return <>{children}</>;
}

interface BladeErrorProps<T> {
  error: BladeApiError | null;
  onRetry?: () => void;
  render?: (error: BladeApiError) => React.ReactNode;
}

export function BladeError<T>({ error, onRetry, render }: BladeErrorProps<T>) {
  if (!error) return null;
  if (render) return <>{render(error)}</>;
  return (
    <div className="blade-error">
      <p>{error.message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}

interface BladeSuccessProps<T> {
  data: T | null;
  render: (data: T) => React.ReactNode;
}

export function BladeSuccess<T>({ data, render }: BladeSuccessProps<T>) {
  if (!data) return null;
  return <>{render(data)}</>;
}

interface BladeEmptyProps {
  message?: string;
}

export function BladeEmpty({ message = "No data available." }: BladeEmptyProps) {
  return (
    <div className="blade-empty">
      <p>{message}</p>
    </div>
  );
}
