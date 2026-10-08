import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@ovds/ui';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestRoute } from './components/GuestRoute';
import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/dashboard/page';
import { TaxpayersPage } from './pages/taxpayers/page';
import { LedgerAuditPage } from './pages/ledger-audit/page';
import { ComplianceReviewPage } from './pages/compliance-review/page';
import { useRoleRedirect } from './hooks/useRoleRedirect';

/**
 * Layout route for MoR protected pages — wraps content in the AppLayout,
 * applies the role-redirect guard (sends users to their correct app shell),
 * and renders lazy children with a simple suspense fallback.
 *
 * The `ErrorBoundary` is keyed on the pathname so a failing compliance widget
 * degrades to a recoverable card rather than a blank white MoR workspace, and
 * navigating to another view clears the error automatically.
 */
function ProtectedMorLayout() {
  useRoleRedirect();
  const { pathname } = useLocation();
  return (
    <ProtectedRoute>
      <AppLayout>
        <ErrorBoundary resetKey={pathname} title="MoR workspace temporarily unavailable">
          <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-slate-500">Loading…</div>}>
            <Outlet />
          </React.Suspense>
        </ErrorBoundary>
      </AppLayout>
    </ProtectedRoute>
  );
}

/**
 * Catches errors thrown by the router itself (loaders / actions) which never
 * reach a React error boundary because they happen above the element tree.
 */
function RouterErrorFallback() {
  return (
    <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-bold text-slate-800">This view could not be loaded</p>
      <p className="max-w-sm text-sm text-slate-500">
        The request failed before the page rendered. This has been logged for adjustment.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
      >
        Reload Page
      </button>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />,
  },
  {
    path: '/',
    element: <ProtectedMorLayout />,
    errorElement: <RouterErrorFallback />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'taxpayers', element: <TaxpayersPage /> },
      { path: 'compliance/verify', element: <ComplianceReviewPage /> },
      { path: 'ledger/:tenantId', element: <LedgerAuditPage /> },
      { path: 'ledger/:tenantId/transaction/:transactionId', element: <LedgerAuditPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
