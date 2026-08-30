/**
 * Procurement Hub — index page for the procurement section.
 *
 * Acts as a landing dashboard for the /procurement route. Links out to the
 * four procurement sub-pages:
 *   - /procurement/vendor-ledger
 *   - /procurement/letter-of-credit
 *   - /procurement/landed-cost
 *   - /procurement/import-shipments
 *
 * Thin shell — all data logic lives in the sub-pages.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { AppPage, Btn } from '../components/ui';
import { Can } from '../components/can';

const PROCUREMENT_ITEMS = [
  {
    title: 'Vendor Ledger',
    description: 'View and manage vendor account balances and transaction history.',
    path: '/procurement/vendor-ledger',
    permission: 'bills:read',
    icon: '📒',
  },
  {
    title: 'Letter of Credit',
    description: 'Manage international trade LC instruments and approvals.',
    path: '/procurement/letter-of-credit',
    permission: 'bills:read',
    icon: '📄',
  },
  {
    title: 'Landed Cost',
    description: 'Allocate freight, duty, and other import costs to purchased items.',
    path: '/procurement/landed-cost',
    permission: 'bills:read',
    icon: '⚓',
  },
  {
    title: 'Import Shipments',
    description: 'Track incoming shipments through customs and delivery pipeline.',
    path: '/procurement/import-shipments',
    permission: 'bills:read',
    icon: '🚢',
  },
] as const;

export default function ProcurementPage() {
  usePageTitle('Procurement');
  const navigate = useNavigate();
  const { selectedCompanyId } = useBusiness();

  return (
    <AppPage title="Procurement" subtitle="Manage vendor ledgers, letters of credit, landed costs, and import shipments.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {PROCUREMENT_ITEMS.map((item) => (
          <Can key={item.path} permission={item.permission}>
            <button
              onClick={() => navigate(item.path)}
              disabled={!selectedCompanyId}
              className="group text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {item.description}
              </p>
            </button>
          </Can>
        ))}
      </div>

      {!selectedCompanyId && (
        <p className="mt-6 text-sm text-slate-500 text-center">
          Select a company to access procurement features.
        </p>
      )}
    </AppPage>
  );
}
