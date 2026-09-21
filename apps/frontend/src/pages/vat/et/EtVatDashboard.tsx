/**
 * @file EtVatDashboard.tsx
 * Ethiopia VAT — dashboard page.
 * Route: /tax/vat/et
 */
import React from 'react';
import { Link } from 'react-router-dom';

import { useVatModules } from '../../../context/VatModuleContext';
import { useRouteUITitle } from '../../../router';

const EtVatDashboard: React.FC = () => {
  const { getModule } = useVatModules();
  const mod = getModule('ET');

  useRouteUITitle(mod ? `${mod.countryName} VAT — Dashboard` : 'Ethiopia VAT');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl"
          aria-hidden
        >
          🇪🇹
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Ethiopia VAT Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            {mod?.authorityName} · {mod?.currency} · Rule set v{mod?.ruleSetVersion}
          </p>
        </div>

        {/* Store link */}
        <Link
          to="/tax/vat/store"
          className="ml-auto text-xs font-semibold text-[var(--pro-azure)] hover:underline flex items-center gap-1"
        >
          <span aria-hidden>🏪</span> VAT Module Store
        </Link>
      </div>

      {/* Quick-links grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Return',       path: 'filing',           emoji: '📋' },
          { label: 'Input VAT Ledger',     path: 'input',            emoji: '📥' },
          { label: 'Output VAT Ledger',    path: 'output',           emoji: '📤' },
          { label: 'WHT Certificates',     path: '/tax/vat/et/wht',  emoji: '🧾' },
          { label: 'EIMS Reconciliation',  path: '/tax/vat/et/eims', emoji: '🔗' },
          { label: 'Ack Vault',            path: '/tax/vat/et/ack-vault', emoji: '🔒' },
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

      {/* Info banner */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-200">
        <strong>ERCA filing deadline:</strong> Monthly VAT returns are due by the 30th of the
        following month. Proc. 285/2002 — standard rate <strong>15%</strong>.
      </div>
    </div>
  );
};

export default EtVatDashboard;
