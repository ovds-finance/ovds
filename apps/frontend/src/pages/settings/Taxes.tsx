import React from 'react';
import TaxRatesTable from '../../components/accounting/taxRatesTable';
import { usePageTitle } from '../../hooks/usePageTitle';

const SettingsTaxesPage: React.FC = () => {
  usePageTitle('Tax Rates');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tax Rates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage VAT, TOT, WHT, and other Ethiopian tax rates. These rates are used across invoices, bills, and payroll.
          </p>
        </div>
      </div>
      <TaxRatesTable />
    </div>
  );
};

export default SettingsTaxesPage;
