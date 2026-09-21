/**
 * RouteLayoutDispatcher
 *
 * The single decision point between the router and the UI layer.
 *
 * Resolution order (first match wins):
 *  1. Deepest Route.handle in the useMatches() stack          (static handle)
 *  2. location.state._routeHandle written by NavigationLayoutService
 *                                                              (transient handle)
 *  3. Hard-coded fallback → { layout: 'inline' }
 *
 * The two-source strategy means:
 *  - Routes with a static handle in ROUTES[] get their shell automatically.
 *  - Routes reached via nav.toSlider() / nav.toModal() etc. get the correct
 *    shell even if they have no static handle entry.
 *
 * Unified Navigation Configuration Matrix:
 *
 *   mode    Shell          Anchor             State scope
 *   ──────  ─────────────  ─────────────────  ──────────────────
 *   inline  FullPageShell  #main-content      Volatile / Reset
 *   slider  SliderShell    #slider-root       Isolated / Retained
 *   wizard  WizardShell    #wizard-viewport   Multi-step persistent
 *   modal   ModalShell     #modal-root        Isolated ephemeral
 *
 * 'table' is kept as a backward-compatible alias for 'inline'.
 *
 *   AuthenticatedShell
 *     └── Layout                     (sidebar + header, mounts once)
 *           └── RouteLayoutDispatcher      ← HERE
 *                 ├── FullPageShell        (inline / table)
 *                 ├── SliderShell          (slider)
 *                 ├── WizardShell          (wizard)
 *                 └── ModalShell           (modal)
 *                       └── <Outlet />     (the actual page component)
 */
import React, { useCallback } from 'react';
import { useMatches, useNavigate, useLocation } from 'react-router-dom';

import type { RouteHandle, NormalizedRouteLayoutMode } from './routeHandle';
import { normalizeMode } from './routeHandle';
import { RouteUIProvider } from './RouteUIContext';
import { FullPageShell } from './shells/FullPageShell';
import { ModalShell } from './shells/ModalShell';
import { SliderShell } from './shells/SliderShell';
import { WizardShell } from './shells/WizardShell';

interface RouteLayoutDispatcherProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/** Returns true when value looks like a RouteHandle object. */
function isRouteHandle(value: unknown): value is RouteHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    (
      'layout'  in value ||
      'inline'  in value ||
      'table'   in value ||
      'slider'  in value ||
      'wizard'  in value ||
      'modal'   in value ||
      'meta'    in value
    )
  );
}

// ---------------------------------------------------------------------------
// Handle resolution
// ---------------------------------------------------------------------------

/**
 * SOURCE 1 — static handle.
 * Walk useMatches() deepest-to-shallowest; return the first valid handle.
 * Deepest wins so child routes can override parent handles.
 */
function resolveStaticHandle(
  matches: ReturnType<typeof useMatches>,
): RouteHandle | null {
  for (let i = matches.length - 1; i >= 0; i--) {
    const h = (matches[i] as { handle?: unknown }).handle;
    if (isRouteHandle(h)) return h;
  }
  return null;
}

/**
 * SOURCE 2 — transient handle.
 * NavigationLayoutService writes `_routeHandle` into location.state when
 * navigating programmatically.  Used as fallback when no static handle exists.
 */
function resolveTransientHandle(location: ReturnType<typeof useLocation>): RouteHandle | null {
  const state = location.state as Record<string, unknown> | null;
  if (!state) return null;
  const h = state._routeHandle;
  return isRouteHandle(h) ? h : null;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export const RouteLayoutDispatcher: React.FC<RouteLayoutDispatcherProps> = ({
  children,
}) => {
  const matches  = useMatches();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve handle: static first, transient fallback, hard default last.
  const handle: RouteHandle =
    resolveStaticHandle(matches) ??
    resolveTransientHandle(location) ??
    { layout: 'inline' };

  const mode: NormalizedRouteLayoutMode = normalizeMode(handle.layout);

  // --- close handler forwarded through context ----------------------------
  // Both SliderShell and ModalShell call this when the user dismisses them.
  const handleClose = useCallback(() => {
    const closeRoute =
      mode === 'slider' ? handle.slider?.closeRoute :
      mode === 'modal'  ? handle.modal?.closeRoute  : undefined;

    if (closeRoute) {
      navigate(closeRoute, { replace: true });
    } else {
      navigate(-1);
    }
  }, [mode, handle.slider?.closeRoute, handle.modal?.closeRoute, navigate]);

  return (
    <RouteUIProvider
      handle={handle}
      onSliderClose={mode === 'slider' || mode === 'modal' ? handleClose : undefined}
    >
      {mode === 'wizard' ? (
        <WizardShell>{children}</WizardShell>
      ) : mode === 'slider' ? (
        <SliderShell>{children}</SliderShell>
      ) : mode === 'modal' ? (
        <ModalShell>{children}</ModalShell>
      ) : (
        /* inline (+ legacy 'table' alias) */
        <FullPageShell>{children}</FullPageShell>
      )}
    </RouteUIProvider>
  );
};
