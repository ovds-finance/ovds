import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface VatFormSummary {
  period: string;
  companyId: string;
  companyName: string;
  tin: string;
  vatRegNumber: string;
  part1OutputTax: {
    localStandardSales: number;
    zeroRatedExports: number;
    otherExemptSupplies: number;
    totalOutputVat: number;
  };
  part2InputTax: {
    localPurchases: number;
    importedGoods: number;
    capitalGoods: number;
    totalInputVat: number;
    claimableInputVat: number;
    nonClaimableInputVat: number;
  };
  part3NetTax: {
    outputVatMinusInputVat: number;
    whtCreditAvailable: number;
    finalPayable: number;
  };
  generatedAt: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(n);

export function AabeVatFormSummary({ companyId, period }: { companyId: string; period: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vat-form-summary', companyId, period],
    queryFn: () => api.get(`/ovds/pipeline/vat-form-summary?period=${period}`).then((r) => r.data),
    enabled: !!companyId && !!period,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading VAT form summary...</div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Failed to load VAT form summary</div>;
  }

  const summary = data as VatFormSummary | null;

  if (!summary) {
    return <div className="text-slate-400 p-4">No VAT form summary available for this period.</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Monthly VAT Return</h3>
          <p className="text-sm text-slate-500">Tax Period: {summary.period} | {summary.companyName}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>TIN: {summary.tin}</p>
          <p>VAT Reg: {summary.vatRegNumber}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Part 1: Output Tax (Sales & Revenues)</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Local Standard Sales:</span>
              <span className="font-medium">{fmt(summary.part1OutputTax.localStandardSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Zero-Rated Exports:</span>
              <span className="font-medium">{fmt(summary.part1OutputTax.zeroRatedExports)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Other Exempt Supplies:</span>
              <span className="font-medium">{fmt(summary.part1OutputTax.otherExemptSupplies)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 mt-2">
              <span>Total Output VAT:</span>
              <span>{fmt(summary.part1OutputTax.totalOutputVat)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Part 2: Input Tax (Purchases & Expenses Deductions)</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Local Purchases:</span>
              <span className="font-medium">{fmt(summary.part2InputTax.localPurchases)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Imported Goods:</span>
              <span className="font-medium">{fmt(summary.part2InputTax.importedGoods)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Capital Goods:</span>
              <span className="font-medium">{fmt(summary.part2InputTax.capitalGoods)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Input VAT:</span>
              <span className="font-medium">{fmt(summary.part2InputTax.totalInputVat)}</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Claimable Input VAT:</span>
              <span>{fmt(summary.part2InputTax.claimableInputVat)}</span>
            </div>
            <div className="flex justify-between text-red-700">
              <span>Non-Claimable Input VAT:</span>
              <span>{fmt(summary.part2InputTax.nonClaimableInputVat)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">Part 3: Net Tax Calculation</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-600">Output VAT - Input VAT (Box 04 - Box 08):</span>
              <span className="font-medium">{fmt(summary.part3NetTax.outputVatMinusInputVat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Withholding Tax Credit Available (Box 14):</span>
              <span className="font-medium">{fmt(summary.part3NetTax.whtCreditAvailable)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-blue-200 pt-2 mt-2">
              <span>Final Payable Bank Settlement:</span>
              <span className="text-blue-900">{fmt(summary.part3NetTax.finalPayable)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-right">
        Generated: {new Date(summary.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
