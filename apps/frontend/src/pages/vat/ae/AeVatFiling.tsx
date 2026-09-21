/**
 * @file AeVatFiling.tsx
 * UAE VAT — quarterly return builder.
 * Route: /tax/vat/ae/filing
 */
import React, { useEffect, useState } from 'react';

import { useVatModules } from '../../../context/VatModuleContext';
import type { VatReturnDraft, VatFilingPeriod } from '../../../context/VatModuleContext';
import { useRouteUITitle } from '../../../router';

const AeVatFiling: React.FC = () => {
  const { getPeriods, buildReturn } = useVatModules();
  const [periods,  setPeriods]  = useState<VatFilingPeriod[]>([]);
  const [selected, setSelected] = useState('');
  const [draft,    setDraft]    = useState<VatReturnDraft | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useRouteUITitle(draft ? `UAE VAT201 — ${draft.periodKey}` : 'UAE Quarterly VAT Return');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getPeriods('AE', new Date().getFullYear());
        setPeriods(data);
        if (data.length) setSelected(data[0].periodKey);
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuild = async () => {
    setLoading(true); setError(null);
    try {
      setDraft(await buildReturn({ countryCode: 'AE', periodKey: selected, currency: 'AED' }));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl" aria-hidden>📋</div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">UAE Quarterly VAT Return (VAT201)</h1>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="ae-period">Filing Period</label>
          <select
            id="ae-period"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2"
          >
            {periods.map((p) => (
              <option key={p.periodKey} value={p.periodKey}>{p.label} — Due {p.dueDate}</option>
            ))}
          </select>
        </div>
        <button onClick={handleBuild} disabled={loading || !selected}
          className="px-5 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-bold disabled:opacity-50">
          {loading ? 'Building…' : 'Build VAT201'}
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {draft && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-sm">FTA VAT201 Draft — {draft.periodKey}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-2 text-left">Box</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount (AED)</th>
                <th className="px-4 py-2 text-right">Tax (AED)</th>
              </tr>
            </thead>
            <tbody>
              {draft.lines.map((line) => (
                <tr key={line.boxCode} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{line.boxCode}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{line.label}</td>
                  <td className="px-4 py-2 text-right font-semibold">{(line.amount ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{line.taxAmount != null ? line.taxAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 }) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-300">
                <td colSpan={2} className="px-4 py-3">Net VAT Payable</td>
                <td colSpan={2} className={`px-4 py-3 text-right text-lg ${draft.netVatPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  AED {draft.netVatPayable.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default AeVatFiling;
