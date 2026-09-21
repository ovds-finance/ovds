/**
 * @file EtVatInputLedger.tsx
 * Ethiopia VAT — input VAT ledger.
 * Route: /tax/vat/et/input
 */
import React from 'react';

import { useRouteUITitle } from '../../../router';

const EtVatInputLedger: React.FC = () => {
  useRouteUITitle('Input VAT Ledger — Ethiopia');
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl"
          aria-hidden
        >
          📥
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Input VAT Ledger — Ethiopia
        </h1>
      </div>
      <p className="text-sm text-slate-500">
        Creditable input VAT from supplier invoices for the selected period.
        Data sourced from{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
          vat_input_ledger
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

export default EtVatInputLedger;
