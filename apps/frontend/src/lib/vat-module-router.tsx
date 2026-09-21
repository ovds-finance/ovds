/**
 * @file vat-module-router.tsx
 *
 * VatModuleRouter
 * ───────────────
 * Dynamically dispatches VAT-related routes to the correct country-specific
 * page component based on the :countryCode URL segment and the tenant's
 * active VAT modules.
 *
 * Route pattern:   /tax/vat/:countryCode/*
 *
 * How it works:
 *  1. Reads the :countryCode param from the URL.
 *  2. Checks the tenant's active VAT modules via useVatModules().
 *  3. Lazy-loads the country-specific page set from the module's page registry.
 *  4. Renders the correct page or a friendly "module not activated" wall.
 *
 * Adding a new country UI:
 *  1. Create  src/pages/vat/<countryCode>/index.tsx  exporting VatDashboard
 *     and any sub-pages (VatFiling, VatInput, VatOutput, etc.).
 *  2. Add one entry to VAT_PAGE_REGISTRY below.
 *  That's it — no changes needed anywhere else in the router.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

import { useVatModules } from '../context/VatModuleContext';

// ─── Page loader fallback ─────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <div
    className="flex items-center justify-center min-h-[60vh]"
    role="status"
    aria-label="Loading VAT module"
  >
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Loading VAT Module…
      </span>
    </div>
  </div>
);

// ─── Module-not-activated wall ────────────────────────────────────────────────

interface NotActivatedProps {
  countryCode: string;
  countryName?: string;
}

const ModuleNotActivated: React.FC<NotActivatedProps> = ({ countryCode, countryName }) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-3xl">
      🔒
    </div>
    <div className="space-y-2 max-w-md">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {countryName ?? countryCode} VAT module not activated
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        This VAT jurisdiction is not activated for your organisation.
        Visit the <strong>VAT Module Store</strong> to install and activate it.
      </p>
    </div>
    <a
      href="/tax/vat/store"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
    >
      Open VAT Module Store
    </a>
  </div>
);

// ─── Page registry ────────────────────────────────────────────────────────────
// Maps ISO-3166-1 alpha-2 country code → lazy-loaded page set.
// Each country page set must export these named components:
//   VatDashboard, VatFiling, VatInputLedger, VatOutputLedger

type CountryPageSet = {
  VatDashboard:     React.LazyExoticComponent<React.FC>;
  VatFiling:        React.LazyExoticComponent<React.FC>;
  VatInputLedger:   React.LazyExoticComponent<React.FC>;
  VatOutputLedger:  React.LazyExoticComponent<React.FC>;
};

// ET pages — Ethiopia
const etPages: CountryPageSet = {
  VatDashboard:    lazy(() => import('../pages/vat/et/EtVatDashboard')),
  VatFiling:       lazy(() => import('../pages/vat/et/EtVatFiling')),
  VatInputLedger:  lazy(() => import('../pages/vat/et/EtVatInputLedger')),
  VatOutputLedger: lazy(() => import('../pages/vat/et/EtVatOutputLedger')),
};

// AE pages — United Arab Emirates
const aePages: CountryPageSet = {
  VatDashboard:    lazy(() => import('../pages/vat/ae/AeVatDashboard')),
  VatFiling:       lazy(() => import('../pages/vat/ae/AeVatFiling')),
  VatInputLedger:  lazy(() => import('../pages/vat/ae/AeVatInputLedger')),
  VatOutputLedger: lazy(() => import('../pages/vat/ae/AeVatOutputLedger')),
};

const VAT_PAGE_REGISTRY: Record<string, CountryPageSet> = {
  ET: etPages,
  AE: aePages,
  // Add new countries here — one line each:
  // GB: gbPages,
  // KE: kePages,
};

// ─── Country VAT router ───────────────────────────────────────────────────────

/**
 * CountryVatRouter
 * Renders the correct page for /tax/vat/:countryCode/:page
 */
export const CountryVatRouter: React.FC = () => {
  const { countryCode = '' } = useParams<{ countryCode: string }>();
  const { isActive, getModule } = useVatModules();

  const code  = countryCode.toUpperCase();
  const pages = VAT_PAGE_REGISTRY[code];

  // Module not in registry at all (not installed on platform)
  if (!pages) {
    return (
      <div role="alert" className="flex items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="space-y-2 max-w-md">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Unknown VAT jurisdiction: {countryCode}
          </p>
          <p className="text-sm text-slate-500">
            This country has no registered VAT module on this platform.
          </p>
        </div>
      </div>
    );
  }

  // Module installed but not activated for this tenant
  if (!isActive(code)) {
    const mod = getModule(code);
    return <ModuleNotActivated countryCode={code} countryName={mod?.countryName} />;
  }

  const {
    VatDashboard,
    VatFiling,
    VatInputLedger,
    VatOutputLedger,
  } = pages;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index                element={<VatDashboard />} />
        <Route path="filing"        element={<VatFiling />} />
        <Route path="input"         element={<VatInputLedger />} />
        <Route path="output"        element={<VatOutputLedger />} />
        {/* Catch-all within the country namespace */}
        <Route path="*"             element={<Navigate to="" replace />} />
      </Routes>
    </Suspense>
  );
};

// ─── Top-level VAT router ─────────────────────────────────────────────────────

/**
 * VatModuleRouter
 * Mount at: /tax/vat/*
 *
 * Routes:
 *   /tax/vat/store          — VatModuleInstaller (App Store)
 *   /tax/vat/:countryCode/* — CountryVatRouter (country-specific pages)
 *   /tax/vat                — redirect to first active module or store
 */
export const VatModuleRouter: React.FC = () => {
  const { tenantModules } = useVatModules();
  const VatModuleInstaller = lazy(() => import('../pages/vat/VatModuleStore'));

  // Default VAT landing: first active country or store
  const defaultCountry = tenantModules[0]?.countryCode?.toLowerCase();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* App Store / installer */}
        <Route path="store" element={<VatModuleInstaller />} />

        {/* Country-specific sub-router */}
        <Route path=":countryCode/*" element={<CountryVatRouter />} />

        {/* Default redirect */}
        <Route
          index
          element={
            defaultCountry
              ? <Navigate to={defaultCountry} replace />
              : <Navigate to="store" replace />
          }
        />
      </Routes>
    </Suspense>
  );
};
