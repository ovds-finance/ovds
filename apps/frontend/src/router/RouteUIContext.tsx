/**
 * RouteUIContext
 *
 * Provides the resolved RouteHandle for the currently active route to any
 * component in the tree — without having to call useMatches() directly.
 *
 * The RouteLayoutDispatcher writes into this context after it resolves the
 * deepest matching handle. Page components, header slots, breadcrumbs, wizard
 * step controls, and modal footers all read from it via useRouteUI().
 */
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { RouteHandle, NormalizedRouteLayoutMode } from './routeHandle';
import { normalizeMode } from './routeHandle';

// ---------------------------------------------------------------------------
// Context value shape
// ---------------------------------------------------------------------------

export interface RouteUIContextValue {
  /** The resolved handle for the current route (never undefined after mount). */
  handle: RouteHandle;
  /**
   * Normalized layout mode — always one of 'inline' | 'slider' | 'wizard' | 'modal'.
   * The legacy 'table' value is collapsed to 'inline' here.
   */
  mode: NormalizedRouteLayoutMode;
  /** True when the current route renders as a standard full-page content view. */
  isInline: boolean;
  /**
   * True when the current route renders as a standard full-page content view.
   * @alias isInline  (kept for backward compatibility)
   */
  isTable: boolean;
  /** True when the current route renders inside a sequential wizard shell. */
  isWizard: boolean;
  /** True when the current route renders as a slide-out panel. */
  isSlider: boolean;
  /** True when the current route renders as a centered modal overlay. */
  isModal: boolean;
  /**
   * Imperative close signal forwarded from the active shell (slider or modal).
   * Call this to programmatically dismiss the panel/modal from within the page.
   */
  onSliderClose?: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_HANDLE: RouteHandle = { layout: 'inline' };

const DEFAULT_VALUE: RouteUIContextValue = {
  handle: DEFAULT_HANDLE,
  mode:     'inline',
  isInline: true,
  isTable:  true,   // backward-compat alias
  isWizard: false,
  isSlider: false,
  isModal:  false,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const RouteUIContext = createContext<RouteUIContextValue>(DEFAULT_VALUE);
RouteUIContext.displayName = 'RouteUIContext';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RouteUIProviderProps {
  handle: RouteHandle;
  onSliderClose?: () => void;
  children: ReactNode;
}

export const RouteUIProvider: React.FC<RouteUIProviderProps> = ({
  handle,
  onSliderClose,
  children,
}) => {
  const mode = normalizeMode(handle.layout);

  const value = useMemo<RouteUIContextValue>(
    () => ({
      handle,
      mode,
      isInline: mode === 'inline',
      isTable:  mode === 'inline',   // backward-compat alias
      isWizard: mode === 'wizard',
      isSlider: mode === 'slider',
      isModal:  mode === 'modal',
      onSliderClose,
    }),
    [handle, mode, onSliderClose],
  );

  return (
    <RouteUIContext.Provider value={value}>{children}</RouteUIContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Primary consumer hook
// ---------------------------------------------------------------------------

/**
 * Returns the resolved route UI state for the current route.
 *
 * @example
 * ```tsx
 * const { isSlider, isModal, handle } = useRouteUI();
 * if (isModal) return <ModalFooter onClose={handle.modal?.closeRoute} />;
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRouteUI(): RouteUIContextValue {
  return useContext(RouteUIContext);
}

// ---------------------------------------------------------------------------
// Convenience hooks
// ---------------------------------------------------------------------------

/** Returns the slider config for the current route (undefined if not a slider). */
// eslint-disable-next-line react-refresh/only-export-components
export function useSliderConfig() {
  const { handle, isSlider } = useRouteUI();
  return isSlider ? handle.slider : undefined;
}

/** Returns the wizard config for the current route (undefined if not a wizard). */
// eslint-disable-next-line react-refresh/only-export-components
export function useWizardConfig() {
  const { handle, isWizard } = useRouteUI();
  return isWizard ? handle.wizard : undefined;
}

/** Returns the modal config for the current route (undefined if not a modal). */
// eslint-disable-next-line react-refresh/only-export-components
export function useModalConfig() {
  const { handle, isModal } = useRouteUI();
  return isModal ? handle.modal : undefined;
}
