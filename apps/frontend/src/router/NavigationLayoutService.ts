/**
 * NavigationLayoutService
 *
 * The single programmatic navigation API for the OVDS route-driven UI system.
 *
 * Instead of calling `useNavigate()` with a raw string, every component
 * passes a typed `NavAction` that declares its intent — which mode, which
 * path, and which shell config — and this service handles:
 *
 *   1. Path interpolation  — replaces :param placeholders from action.params
 *   2. Search params       — appends ?key=value pairs; auto-injects wizard
 *                            step=<first step id> for wizard mode
 *   3. Navigation state    — writes the transient handle into React Router
 *                            location.state so the dispatcher can activate
 *                            the correct shell even for routes not in ROUTES
 *   4. History strategy    — push vs. replace based on action.replace
 *   5. Static factory      — toInline / toSlider / toWizard / toModal helpers
 *                            for concise call-sites
 *
 * Unified Navigation Configuration Matrix (from the design spec):
 *
 * | mode    | Strategy                 | Anchor            | State scope          |
 * |---------|--------------------------|-------------------|----------------------|
 * | inline  | Direct replacement       | #main-content     | Volatile / Reset     |
 * | slider  | Sliding panel overlay    | #slider-root      | Isolated / Retained  |
 * | wizard  | Stepped sequential index | #wizard-viewport  | Multi-step persistent|
 * | modal   | Centered modal screen    | #modal-root       | Isolated ephemeral   |
 *
 * Usage — inside a React component:
 * ```ts
 * const nav = useNavigation();
 *
 * // Full-page table (inline)
 * nav.toInline('/sales/invoices');
 *
 * // Slide-out panel
 * nav.toSlider('/sales/invoices/:id', { id: invoice.id }, {
 *   title: 'Invoice Details',
 *   closeRoute: '/sales/invoices',
 * });
 *
 * // Multi-step wizard
 * nav.toWizard('/settings/enroll', {
 *   title: 'Company Enrollment',
 *   steps: [{ id: 'details', label: 'Details' }, ...],
 * });
 *
 * // Ephemeral modal
 * nav.toModal('/purchases/expenses/new', {
 *   title: 'New Expense',
 *   closeRoute: '/purchases/expenses',
 * });
 *
 * // Generic low-level call
 * nav.navigate({ mode: 'slider', path: '/crm/pipeline', slider: { title: 'Pipeline' } });
 * ```
 */
import type {
  NavAction,
  NavigationResult,
  NormalizedRouteLayoutMode,
  SliderConfig,
  WizardConfig,
  ModalConfig,
  InlineConfig,
  RouteHandle,
} from './routeHandle';
import { normalizeMode } from './routeHandle';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** The React Router navigate function signature (subset we use). */
type RRNavigate = (
  to: string,
  options?: { replace?: boolean; state?: unknown },
) => void;

// ---------------------------------------------------------------------------
// Path interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolates Express-style `:param` placeholders in a path string.
 *
 * @example
 * interpolatePath('/sales/invoices/:id', { id: '42' })
 * // → '/sales/invoices/42'
 */
function interpolatePath(
  path: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return path;
  return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
    const val = params[key];
    if (val === undefined || val === null) {
      console.warn(`[NavigationLayoutService] Missing param ":${key}" for path "${path}"`);
      return `:${key}`;
    }
    return String(val);
  });
}

// ---------------------------------------------------------------------------
// Search params builder
// ---------------------------------------------------------------------------

function buildSearch(
  base: Record<string, string> | undefined,
  extras: Record<string, string>,
): string {
  const merged = { ...base, ...extras };
  const entries = Object.entries(merged).filter(([, v]) => v !== '' && v !== undefined);
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

// ---------------------------------------------------------------------------
// NavigationLayoutService
// ---------------------------------------------------------------------------

export class NavigationLayoutService {
  private readonly _navigate: RRNavigate;

  constructor(rrNavigate: RRNavigate) {
    this._navigate = rrNavigate;
  }

  // -------------------------------------------------------------------------
  // Primary API
  // -------------------------------------------------------------------------

  /**
   * Execute a typed navigation action.
   *
   * The service resolves the final URL, builds the React Router state bag
   * containing a transient RouteHandle, and calls navigate().
   */
  navigate(action: NavAction): NavigationResult {
    const mode = action.mode;

    // 1. Interpolate path params.
    const resolvedPath = interpolatePath(action.path, action.params);

    // 2. Build search string.
    const extraSearch: Record<string, string> = {};

    // For wizard mode, auto-seed the step param to the first step so the
    // WizardShell renders the correct first step without the page having to
    // know about the stepParam convention.
    if (mode === 'wizard' && action.wizard?.steps?.length) {
      const stepParam = action.wizard.stepParam ?? 'step';
      if (!action.searchParams?.[stepParam]) {
        extraSearch[stepParam] = action.wizard.steps[0].id;
      }
    }

    const search = buildSearch(action.searchParams, extraSearch);
    const url = resolvedPath + search;

    // 3. Build the transient RouteHandle written into navigation state.
    //    The RouteLayoutDispatcher reads this from location.state._routeHandle
    //    as a fallback when no static handle is declared on the Route.
    const transientHandle = this._buildTransientHandle(action);

    // 4. Build the merged state bag.
    const state: Record<string, unknown> = {
      ...(action.state ?? {}),
      // Reserved key — do not collide with page-level state keys.
      _routeHandle: transientHandle,
      _navMode: mode,
      _navTimestamp: Date.now(),
    };

    // 5. Navigate.
    this._navigate(url, {
      replace: action.replace ?? false,
      state,
    });

    return { success: true, url, mode };
  }

  // -------------------------------------------------------------------------
  // Per-mode factory helpers
  // -------------------------------------------------------------------------

  /**
   * Navigate to a full-page inline (table) view.
   *
   * @example
   * nav.toInline('/sales/invoices');
   * nav.toInline('/sales/invoices', undefined, { replace: true });
   */
  toInline(
    path: string,
    params?: Record<string, string | number>,
    options?: { replace?: boolean; inline?: Partial<InlineConfig>; state?: Record<string, unknown> },
  ): NavigationResult {
    return this.navigate({
      mode: 'inline',
      path,
      params,
      replace: options?.replace,
      inline: options?.inline,
      state: options?.state,
    });
  }

  /**
   * Navigate to a slide-out panel over the current page.
   *
   * @example
   * nav.toSlider('/sales/invoices/:id', { id: invoice.id }, {
   *   title: 'Invoice Details',
   *   closeRoute: '/sales/invoices',
   *   width: 'w-[640px]',
   * });
   */
  toSlider(
    path: string,
    params: Record<string, string | number> | undefined,
    sliderConfig: Partial<SliderConfig>,
    options?: { replace?: boolean; state?: Record<string, unknown> },
  ): NavigationResult {
    return this.navigate({
      mode: 'slider',
      path,
      params,
      slider: sliderConfig,
      replace: options?.replace,
      state: options?.state,
    });
  }

  /**
   * Navigate to a multi-step wizard flow.
   *
   * @example
   * nav.toWizard('/settings/enroll', {
   *   title: 'Company Enrollment',
   *   steps: [
   *     { id: 'details', label: 'Company Details' },
   *     { id: 'fiscal',  label: 'Fiscal Settings' },
   *   ],
   *   completionRoute: '/dashboard',
   * });
   */
  toWizard(
    path: string,
    wizardConfig: Partial<WizardConfig>,
    options?: {
      params?: Record<string, string | number>;
      replace?: boolean;
      state?: Record<string, unknown>;
    },
  ): NavigationResult {
    return this.navigate({
      mode: 'wizard',
      path,
      params: options?.params,
      wizard: wizardConfig,
      replace: options?.replace,
      state: options?.state,
    });
  }

  /**
   * Navigate to an ephemeral modal dialog.
   *
   * @example
   * nav.toModal('/purchases/expenses/new', {
   *   title: 'New Expense',
   *   description: 'Log an out-of-pocket expense',
   *   closeRoute: '/purchases/expenses',
   *   maxWidth: 'max-w-xl',
   * });
   */
  toModal(
    path: string,
    modalConfig: Partial<ModalConfig>,
    options?: {
      params?: Record<string, string | number>;
      replace?: boolean;
      state?: Record<string, unknown>;
    },
  ): NavigationResult {
    return this.navigate({
      mode: 'modal',
      path,
      params: options?.params,
      modal: modalConfig,
      replace: options?.replace,
      state: options?.state,
    });
  }

  // -------------------------------------------------------------------------
  // Back-navigation guard
  // -------------------------------------------------------------------------

  /**
   * Mode-aware back navigation.
   *
   * Instead of blindly calling `history.back()`, this method consults the
   * current resolved handle and takes the appropriate exit strategy:
   *
   *   modal / slider — navigate to `closeRoute` (if declared) or `fallback`,
   *                    otherwise history.back().
   *   wizard         — go to previous step (via setWizardStep) or navigate
   *                    to `completionRoute` / `fallback` when already on step 0.
   *   inline         — plain history.back(), or navigate to `fallback` if
   *                    supplied.
   *
   * @param handle   The RouteHandle from useRouteUI().handle — tells us the
   *                 current mode and close/completion routes.
   * @param fallback Optional fallback route if no close/completion is declared.
   *
   * @example
   * ```tsx
   * const { handle } = useRouteUI();
   * const nav = useNavigation();
   * <button onClick={() => nav.navigateBack(handle, '/dashboard')}>Back</button>
   * ```
   */
  navigateBack(
    handle: RouteHandle,
    fallback?: string,
  ): void {
    const mode = normalizeMode(handle.layout);

    switch (mode) {
      case 'modal': {
        const dest = handle.modal?.closeRoute ?? fallback;
        if (dest) { this._navigate(dest, { replace: true }); }
        else       { this._navigate(-1 as any); }
        return;
      }

      case 'slider': {
        const dest = handle.slider?.closeRoute ?? fallback;
        if (dest) { this._navigate(dest, { replace: true }); }
        else       { this._navigate(-1 as any); }
        return;
      }

      case 'wizard': {
        // Determine the current step from the URL so we can go backwards.
        const stepParam = handle.wizard?.stepParam ?? 'step';
        const steps = handle.wizard?.steps ?? [];
        const currentId = new URLSearchParams(window.location.search).get(stepParam);
        const currentIndex = steps.findIndex((s) => s.id === currentId);

        if (currentIndex > 0) {
          // Still inside the wizard — go to the previous step.
          const prevStep = steps[currentIndex - 1];
          if (prevStep) {
            this.setWizardStep(prevStep.id, stepParam, { replace: true });
            return;
          }
        }
        // At step 0 (or no step found) — exit the wizard.
        const dest = handle.wizard?.completionRoute ?? fallback;
        if (dest) { this._navigate(dest, { replace: true }); }
        else       { this._navigate(-1 as any); }
        return;
      }

      case 'inline':
      default: {
        if (fallback) { this._navigate(fallback); }
        else          { this._navigate(-1 as any); }
        return;
      }
    }
  }

  /**
   * Returns true if there is a deterministic back destination available for
   * the given handle — i.e. a `closeRoute` / `completionRoute` is declared,
   * or the wizard has a previous step to go back to.
   *
   * Use this to conditionally render a Back button.
   *
   * @example
   * ```tsx
   * const { handle } = useRouteUI();
   * if (nav.canGoBack(handle)) <BackButton />;
   * ```
   */
  canGoBack(handle: RouteHandle): boolean {
    const mode = normalizeMode(handle.layout);
    switch (mode) {
      case 'modal':   return !!handle.modal?.closeRoute;
      case 'slider':  return !!handle.slider?.closeRoute;
      case 'wizard': {
        if (handle.wizard?.completionRoute) return true;
        const stepParam = handle.wizard?.stepParam ?? 'step';
        const steps = handle.wizard?.steps ?? [];
        const currentId = new URLSearchParams(window.location.search).get(stepParam);
        const currentIndex = steps.findIndex((s) => s.id === currentId);
        return currentIndex > 0;
      }
      default:        return false;
    }
  }

  // -------------------------------------------------------------------------
  // Wizard step helpers
  // -------------------------------------------------------------------------

  /**
   * Advance the wizard to a specific step by updating the URL search param.
   * Must be called with the navigate function from the same router scope.
   *
   * @example
   * nav.setWizardStep('fiscal', 'step', { replace: true });
   */
  setWizardStep(
    stepId: string,
    stepParam = 'step',
    options?: { replace?: boolean },
  ): void {
    // Build a relative URL update — only change the search param.
    const current = new URLSearchParams(window.location.search);
    current.set(stepParam, stepId);
    this._navigate(`${window.location.pathname}?${current.toString()}`, {
      replace: options?.replace ?? true,
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _buildTransientHandle(action: NavAction): RouteHandle {
    const handle: RouteHandle = {
      layout: action.mode,
      meta: { _transient: true },
    };

    switch (action.mode) {
      case 'inline':
        if (action.inline) handle.inline = action.inline as InlineConfig;
        break;
      case 'slider':
        if (action.slider) {
          handle.slider = {
            title: action.slider.title ?? '',
            ...action.slider,
          } as SliderConfig;
        }
        break;
      case 'wizard':
        if (action.wizard) {
          handle.wizard = {
            steps: [],
            ...action.wizard,
          } as WizardConfig;
        }
        break;
      case 'modal':
        if (action.modal) {
          handle.modal = {
            title: action.modal.title ?? '',
            ...action.modal,
          } as ModalConfig;
        }
        break;
    }

    return handle;
  }
}
