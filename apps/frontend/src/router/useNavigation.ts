/**
 * useNavigation
 *
 * React wrapper around NavigationLayoutService.
 *
 * Returns a stable service instance bound to the current router's navigate
 * function. All methods are stable across renders (the service instance is
 * memoized; only the underlying RR navigate reference is refreshed).
 *
 * Drop-in replacement for `useNavigate()` for any navigation that is aware
 * of the OVDS layout modes.
 *
 * @example
 * ```tsx
 * const nav = useNavigation();
 *
 * // Full-page inline view
 * nav.toInline('/sales/invoices');
 *
 * // Slide-out panel
 * nav.toSlider('/sales/invoices/:id', { id: invoice.id }, {
 *   title: 'Invoice Details',
 *   closeRoute: '/sales/invoices',
 *   icon: 'INVOICE',
 * });
 *
 * // Multi-step wizard
 * nav.toWizard('/banking/statement-import', {
 *   title: 'Import Bank Statement',
 *   steps: [
 *     { id: 'upload',  label: 'Upload File'  },
 *     { id: 'map',     label: 'Map Columns'  },
 *     { id: 'preview', label: 'Preview'      },
 *     { id: 'import',  label: 'Import'       },
 *   ],
 *   completionRoute: '/banking/reconciliation',
 * });
 *
 * // Ephemeral modal dialog
 * nav.toModal('/purchases/expenses/new', {
 *   title: 'New Expense',
 *   closeRoute: '/purchases/expenses',
 *   maxWidth: 'max-w-xl',
 * });
 *
 * // Generic typed action
 * nav.navigate({
 *   mode: 'modal',
 *   path: '/companies/new',
 *   modal: { title: 'Add Company', closeRoute: '/companies' },
 * });
 * ```
 */
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { NavigationLayoutService } from './NavigationLayoutService';
import type {
  NavAction,
  NavigationResult,
  SliderConfig,
  WizardConfig,
  ModalConfig,
  InlineConfig,
} from './routeHandle';

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

/**
 * Returns a `NavigationLayoutService` instance bound to the current React
 * Router `navigate` function.
 *
 * The returned object reference is stable — it does not change between
 * renders, making it safe to use in dependency arrays and event handlers.
 */
export function useNavigation(): NavigationLayoutService {
  const rrNavigate = useNavigate();

  // Keep a mutable ref to the latest navigate fn so the service instance
  // never needs to be recreated when React Router swaps the navigate ref
  // (which happens on every render in React Router v7).
  const navigateRef = useRef(rrNavigate);
  navigateRef.current = rrNavigate;

  // Build the service once and forward calls through the ref.
  const service = useMemo(() => {
    return new NavigationLayoutService((to, opts) => navigateRef.current(to, opts));
  }, []);  

  return service;
}

// ---------------------------------------------------------------------------
// Re-export types so consumers only need one import
// ---------------------------------------------------------------------------

export type {
  NavAction,
  NavigationResult,
  SliderConfig,
  WizardConfig,
  ModalConfig,
  InlineConfig,
};
