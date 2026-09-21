/**
 * @file EtVatOutputLedger.tsx
 * Ethiopia VAT — output VAT ledger.
 * Route: /tax/vat/et/output
 */
import React from 'react';

import { useRouteUITitle } from '../../../router';

const EtVatOutputLedger: React.FC = () => {
  useRouteUITitle('Output VAT Ledger — Ethiopia');
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl"
          aria-hidden
        >
          📤
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Output VAT Ledger — Ethiopia
        </h1>
      </div>
      <p className="text-sm text-slate-500">
        Output VAT collected from customer invoices for the selected period.
        Data sourced from{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
          vat_output_ledger
        </code>{' '}
        filtered by{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
          country_code = 'ET'
        </code>
        .
      </p>
    </div>
  );
};

export default EtVatOutputLedger;
