/**
 * NavigateInjector — wires the React Router navigate function into the
 * api.ts interceptor singleton (navigateRef) after BrowserRouter initialises.
 *
 * Must be rendered as a direct child of <Router> so useNavigate() is available.
 * Enables the API interceptor to perform SPA redirects (replace-mode, no reload)
 * instead of hard window.location.href assignments that lose React state.
 *
 * Usage: render <NavigateInjector /> inside <Router> once, before any routes.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { navigateRef } from '../services/api';

export function NavigateInjector(): null {
  const navigate = useNavigate();

  useEffect(() => {
    navigateRef.current = navigate;
    return () => {
      // Clear on unmount so stale refs don't persist across hot-reloads
      navigateRef.current = null;
    };
  }, [navigate]);

  return null;
}
