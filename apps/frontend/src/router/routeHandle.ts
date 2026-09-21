/**
 * Route Handle — structural metadata attached to every React Router route.
 *
 * The UI layer reads these handles via useMatches() to decide *how* to render
 * the matched page. Four modes are supported:
 *
 *   INLINE  — Direct full-page replacement. Standard table/content views.
 *             Target anchor: #main-content. State: volatile/reset on nav.
 *
 *   SLIDER  — Sliding panel overlay anchored to the viewport edge.
 *             Target anchor: #slider-root. State: isolated/retained.
 *
 *   WIZARD  — Stepped sequential flow with persistent step state.
 *             Target anchor: #wizard-viewport. State: multi-step persistent.
 *
 *   MODAL   — Centered modal overlay, ephemeral.
 *             Target anchor: #modal-root. State: isolated ephemeral.
 *
 * The legacy 'table' string is kept as a backward-compatible alias for
 * 'inline' — both map to FullPageShell with no behavior difference.
 *
 * Inspired by Ovds SaaS's route-driven UI state pattern.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Layout mode discriminant
// ---------------------------------------------------------------------------

/**
 * Canonical 4-mode layout union.
 *
 * | Value    | Shell       | Anchor            | State scope          |
 * |----------|-------------|-------------------|----------------------|
 * | inline   | FullPage    | #main-content     | Volatile / Reset     |
 * | slider   | Slider      | #slider-root      | Isolated / Retained  |
 * | wizard   | Wizard      | #wizard-viewport  | Multi-step persist   |
 * | modal    | Modal       | #modal-root       | Isolated ephemeral   |
 *
 * 'table' is a backward-compatible alias for 'inline'.
 */
export type RouteLayoutMode = 'inline' | 'slider' | 'wizard' | 'modal' | 'table';

/** Normalized mode — collapses 'table' → 'inline' for internal use. */
export type NormalizedRouteLayoutMode = 'inline' | 'slider' | 'wizard' | 'modal';

/** Collapse the legacy 'table' alias to 'inline'. */
export function normalizeMode(mode: RouteLayoutMode | undefined): NormalizedRouteLayoutMode {
  if (!mode || mode === 'table') return 'inline';
  return mode;
}

// ---------------------------------------------------------------------------
// INLINE (table) config
// ---------------------------------------------------------------------------

export interface InlineConfig {
  /**
   * Optional breadcrumb / header title override.
   * When omitted the Layout's routeTitleMap is used.
   */
  title?: string;
}

/** @deprecated Use InlineConfig */
export type TableConfig = InlineConfig;

// ---------------------------------------------------------------------------
// SLIDER config
// ---------------------------------------------------------------------------

export interface SliderConfig {
  /** Panel title shown in the header row. */
  title: string;
  /** Optional subtitle / description line. */
  description?: string;
  /** Which edge the panel slides in from. Defaults to 'right'. */
  side?: 'left' | 'right';
  /**
   * Tailwind width class for the panel.
   * Defaults to 'w-[520px]'.
   */
  width?: string;
  /** Whether clicking the backdrop dismisses the panel. Defaults to true. */
  closeOnOverlay?: boolean;
  /**
   * Route to navigate to when the panel is closed.
   * When omitted the router goes back one step (history.back()).
   */
  closeRoute?: string;
  /** Icon name (from the OVDS Icon set) shown alongside the title. */
  icon?: string;
}

// ---------------------------------------------------------------------------
// WIZARD config
// ---------------------------------------------------------------------------

export interface WizardStepConfig {
  /** Unique stable key (used as React key and URL search-param value). */
  id: string;
  /** Human-readable label in the stepper. */
  label: string;
  /** Optional subtitle shown below the label on the current step. */
  description?: string;
}

export interface WizardConfig {
  /** Ordered list of steps. */
  steps: WizardStepConfig[];
  /**
   * URL search-param name that carries the current step id.
   * Defaults to 'step'.
   */
  stepParam?: string;
  /** Stepper orientation. Defaults to 'vertical'. */
  variant?: 'vertical' | 'horizontal';
  /** Whether the back-button on step 0 exits the wizard entirely. */
  exitOnFirstBack?: boolean;
  /**
   * Route to navigate to after the final step completes or the wizard
   * is explicitly closed. When omitted the router goes back one step.
   */
  completionRoute?: string;
  /** Title shown in the wizard chrome header. */
  title?: string;
  /** Optional subtitle. */
  description?: string;
}

// ---------------------------------------------------------------------------
// MODAL config
// ---------------------------------------------------------------------------

export interface ModalConfig {
  /** Modal dialog title. */
  title: string;
  /** Optional subtitle / description. */
  description?: string;
  /**
   * Tailwind max-width class for the modal card.
   * Defaults to 'max-w-lg'.
   */
  maxWidth?: string;
  /** Whether clicking the backdrop dismisses the modal. Defaults to true. */
  closeOnOverlay?: boolean;
  /**
   * Route to navigate to when the modal is closed.
   * When omitted the router goes back one step (history.back()).
   */
  closeRoute?: string;
  /** Icon name shown alongside the title. */
  icon?: string;
  /**
   * When true the modal renders without the built-in header chrome,
   * giving the page component full control over the card contents.
   */
  headless?: boolean;
}

// ---------------------------------------------------------------------------
// The handle object attached to a route definition
// ---------------------------------------------------------------------------

export interface RouteHandle {
  /**
   * Structural layout mode for this route.
   * Defaults to 'inline' ('table' is a backward-compatible alias).
   */
  layout?: RouteLayoutMode;

  /** Populated when layout === 'inline' | 'table' (optional overrides). */
  inline?: InlineConfig;

  /** @deprecated Use `inline`. Kept for backward compatibility. */
  table?: InlineConfig;

  /** Populated when layout === 'slider'. */
  slider?: SliderConfig;

  /** Populated when layout === 'wizard'. */
  wizard?: WizardConfig;

  /** Populated when layout === 'modal'. */
  modal?: ModalConfig;

  /**
   * Arbitrary key-value bag for future extensibility.
   * Page components can read this via useRouteUI().handle.meta.
   */
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Route record tuple — used in the ROUTES array in app.tsx
// ---------------------------------------------------------------------------

export type RouteRecord = [
  path: string,
  Component: React.ComponentType<any>,
  handle?: RouteHandle,
  moduleKey?: string,
];

// ---------------------------------------------------------------------------
// NavAction — the unified navigation schema
//
// Every programmatic navigation call passes a NavAction instead of a raw
// string. The NavigationLayoutService reads the mode to decide how to
// construct the URL and which state to pass to React Router.
//
// Unified Navigation Configuration Matrix:
//
// | mode    | Navigation strategy      | Target anchor     | State scope          |
// |---------|--------------------------|-------------------|----------------------|
// | inline  | Direct replacement       | #main-content     | Volatile / Reset     |
// | slider  | Sliding panel overlay    | #slider-root      | Isolated / Retained  |
// | wizard  | Stepped sequential index | #wizard-viewport  | Multi-step persistent|
// | modal   | Centered modal screen    | #modal-root       | Isolated ephemeral   |
// ---------------------------------------------------------------------------

/**
 * Standardized navigation action.  Pass one of these to
 * `NavigationLayoutService.navigate()` or `useNavigation().navigate()`.
 *
 * @example
 * ```ts
 * navigate({
 *   mode: 'slider',
 *   path: '/sales/invoices/:id',
 *   params: { id: invoice.id },
 *   slider: { title: 'Invoice', closeRoute: '/sales/invoices' },
 * });
 * ```
 */
export interface NavAction {
  /**
   * Target layout mode. Drives both the URL navigation and the shell
   * the RouteLayoutDispatcher will activate.
   */
  mode: NormalizedRouteLayoutMode;

  /**
   * Target route path. May contain Express-style `:param` placeholders
   * that are interpolated from `params`.
   */
  path: string;

  /**
   * Path parameter values used to expand `:param` placeholders in `path`.
   *
   * @example { id: '123', tab: 'details' }
   */
  params?: Record<string, string | number>;

  /**
   * URL search params to append to the final URL.
   * For `wizard` mode, the service auto-appends the first step id under
   * `wizardConfig.stepParam` unless overridden here.
   */
  searchParams?: Record<string, string>;

  /**
   * Arbitrary state passed to React Router's navigation state bag.
   * Accessible via `useLocation().state` on the target page.
   */
  state?: Record<string, unknown>;

  /**
   * When true the navigation replaces the current history entry instead of
   * pushing a new one. Useful for wizard step transitions.
   * Defaults to false.
   */
  replace?: boolean;

  // -- Per-mode config overrides -------------------------------------------
  // These are used by the NavigationLayoutService to write a transient
  // handle into navigation state so the dispatcher can render the correct
  // shell even for routes that don't have a static handle declared in ROUTES.

  /** Inline/table shell overrides (mode: 'inline'). */
  inline?: Partial<InlineConfig>;

  /** Slider shell config (mode: 'slider'). Required when mode is 'slider'. */
  slider?: Partial<SliderConfig>;

  /** Wizard shell config (mode: 'wizard'). Required when mode is 'wizard'. */
  wizard?: Partial<WizardConfig>;

  /** Modal shell config (mode: 'modal'). Required when mode is 'modal'. */
  modal?: Partial<ModalConfig>;
}

/**
 * Result returned by NavigationLayoutService.navigate().
 * Callers can use `success` to detect navigation guards that aborted the nav.
 */
export interface NavigationResult {
  success: boolean;
  /** Final resolved URL that was navigated to. */
  url: string;
  mode: NormalizedRouteLayoutMode;
}
