/**
 * Route-driven UI states — public API barrel.
 *
 * Single import point for the entire OVDS routing / layout system:
 *
 *   import {
 *     RouteLayoutDispatcher,
 *     useRouteUI,
 *     useNavigation,
 *     NavigationLayoutService,
 *     type RouteHandle,
 *     type NavAction,
 *   } from '../router';
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Unified Navigation Configuration Matrix
 * ─────────────────────────────────────────────────────────────────────────
 * Mode    Shell          Anchor            State scope
 * ──────  ─────────────  ────────────────  ──────────────────────
 * inline  FullPageShell  #main-content     Volatile / Reset
 * slider  SliderShell    #slider-root      Isolated / Retained
 * wizard  WizardShell    #wizard-viewport  Multi-step persistent
 * modal   ModalShell     #modal-root       Isolated ephemeral
 * ─────────────────────────────────────────────────────────────────────────
 * 'table' is a backward-compatible alias for 'inline'.
 */

// ---------------------------------------------------------------------------
// Types — route handle schema
// ---------------------------------------------------------------------------
export type {
  RouteLayoutMode,
  NormalizedRouteLayoutMode,
  RouteHandle,
  RouteRecord,
  InlineConfig,
  /** @deprecated Use InlineConfig */
  TableConfig,
  SliderConfig,
  WizardConfig,
  WizardStepConfig,
  ModalConfig,
  NavAction,
  NavigationResult,
} from './routeHandle';

// Utility function exported for consumers that need to normalise a raw mode.
export { normalizeMode } from './routeHandle';

// ---------------------------------------------------------------------------
// Context + hooks
// ---------------------------------------------------------------------------
export {
  RouteUIContext,
  RouteUIProvider,
  useRouteUI,
  useSliderConfig,
  useWizardConfig,
  useModalConfig,
} from './RouteUIContext';
export type { RouteUIContextValue } from './RouteUIContext';

// ---------------------------------------------------------------------------
// Programmatic navigation API
// ---------------------------------------------------------------------------
export { NavigationLayoutService } from './NavigationLayoutService';
export { useNavigation } from './useNavigation';

// ---------------------------------------------------------------------------
// Dynamic title override (used inside page components)
// ---------------------------------------------------------------------------
export { useRouteUITitle, ROUTE_TITLE_EVENT } from './useRouteUITitle';
export type { RouteTitleEventDetail } from './useRouteUITitle';

// ---------------------------------------------------------------------------
// Dispatcher — place inside AuthenticatedShell → Layout
// ---------------------------------------------------------------------------
export { RouteLayoutDispatcher } from './RouteLayoutDispatcher';

// ---------------------------------------------------------------------------
// Shells — exported for tests, Storybook, and direct embedding
// ---------------------------------------------------------------------------
export { FullPageShell } from './shells/FullPageShell';
export { WizardShell }   from './shells/WizardShell';
export { SliderShell }   from './shells/SliderShell';
export { ModalShell }    from './shells/ModalShell';
