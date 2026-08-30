import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientPortalLayout from './components/ClientPortalLayout';
import PageLoader from './components/PageLoader';

const Invoices = lazy(() => import('./pages/Invoices'));
const Payments = lazy(() => import('./pages/Payments'));
const Profile = lazy(() => import('./pages/Profile'));

const AppRoutes: React.FC = () => {
  return (
    <ClientPortalLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/invoices" replace />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/invoices" replace />} />
        </Routes>
      </Suspense>
    </ClientPortalLayout>
  );
};

export default AppRoutes;
