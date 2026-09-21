/** UAE VAT Output Ledger — Route: /tax/vat/ae/output */
import React from 'react';

import { useRouteUITitle } from '../../../router';
const AeVatOutputLedger: React.FC = () => {
  useRouteUITitle('Output VAT Ledger — UAE');
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl" aria-hidden>📤</span>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Output VAT Ledger — UAE</h1>
      </div>
      <p className="text-sm text-slate-500">
        Output VAT collected on UAE customer invoices, filtered by{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">country_code = 'AE'</code>.
      </p>
    </div>
  );
};
export default AeVatOutputLedger;
