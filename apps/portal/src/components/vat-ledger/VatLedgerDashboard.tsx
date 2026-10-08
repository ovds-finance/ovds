import React, { useState, useEffect } from 'react';

interface AccountSummary {
  tinNumber: string;
  legalName: string;
  connectionMode: 'DIRECT_ONLINE' | 'OFFLINE_HYBRID';
  outstandingVatDue: number;
}

export const VatLedgerDashboard: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/taxpayers/${tenantId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading OVDS Engine State Matrix...</div>;
  if (!summary) return <div className="p-8 text-rose-500 font-medium">Failed to initialize taxpayer state context.</div>;

  return (
    <div className="p-8 bg-slate-50 min-screen-y-100 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{summary.legalName}</h1>
          <p className="text-sm text-slate-500 mt-1">TIN Identification Number: <span className="font-mono font-bold text-slate-700">{summary.tinNumber}</span></p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`h-2.5 w-2.5 rounded-full ${summary.connectionMode === 'DIRECT_ONLINE' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
            {summary.connectionMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Outstanding VAT Balance</h3>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(summary.outstandingVatDue)}
          </p>
          <div className="mt-4">
            <button 
              disabled={summary.outstandingVatDue <= 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm disabled:bg-slate-100 disabled:text-slate-400"
            >
              Settle Balance via Telebirr / CBE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};