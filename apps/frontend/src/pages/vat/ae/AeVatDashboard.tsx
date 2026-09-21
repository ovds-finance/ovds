/**
 * @file AeVatDashboard.tsx
 * UAE VAT — dashboard page.
 * Route: /tax/vat/ae
 */
import React from 'react';
import { Link } from 'react-router-dom';

import { useVatModules } from '../../../context/VatModuleContext';
import { useRouteUITitle } from '../../../router';

const AeVatDashboard: React.FC = () => {
  const { getModule } = useVatModules();
  const mod = getModule('AE');

  useRouteUITitle(mod ? `${mod.countryName} VAT — Dashboard` : 'UAE VAT');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl"
          aria-hidden
        >
          🇦🇪
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            UAE VAT Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            {mod?.authorityName} · {mod?.currency} · Rule set v{mod?.ruleSetVersion}
          </p>
        </div>

        <Link
          to="/tax/vat/store"
          className="ml-auto text-xs font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1"
        >
          <span aria-hidden>🏪</span> VAT Module Store
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Quarterly Return',   path: 'filing',      emoji: '📋' },
          { label: 'Input VAT Ledger',   path: 'input',       emoji: '📥' },
          { label: 'Output VAT Ledger',  path: 'output',      emoji: '📤' },
          { label: 'Reverse Charge Log', path: 'rcm',         emoji: '🔄' },
          { label: 'Designated Zones',   path: 'designated',  emoji: '🏙️' },
          { label: 'VAT Audit File',     path: 'audit-file',  emoji: '🗂️' },
        ].map(({ label, path, emoji }) => (
          <Link
            key={path}
            to={path}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)] transition-all hover:shadow-sm group"
          >
            <span
              className="text-2xl group-hover:scale-110 transition-transform"
              aria-hidden
            >
              {emoji}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">
              {label}
            </span>
          </Link>
        ))}
      </div>

      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 p-4 text-sm text-red-800 dark:text-red-200">
        <strong>FTA filing deadline:</strong> Quarterly returns due within 28 days after
        quarter-end. FDL 8/2017 — standard rate <strong>5%</strong>.
      </div>
    </div>
  );
};

export default AeVatDashboard;
