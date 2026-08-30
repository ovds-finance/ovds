import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '../../lib/orpc';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useBusiness } from '../../context/businessContext';
import {
  DollarSign, ArrowRight, Settings, RefreshCw, Save,
} from 'lucide-react';

const CurrencySettings: React.FC = () => {
  usePageTitle('Currency Settings');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { selectedCompanyId: companyId } = useBusiness();

  const [baseCurrency, setBaseCurrency] = useState('ETB');
  const [rateProvider, setRateProvider] = useState('manual');
  const [autoUpdate, setAutoUpdate] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['settings', 'profile', companyId],
    queryFn: () => orpc.settings.profile.get({ companyId: companyId! }),
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ section, data }: { section: string; data: Record<string, string> }) =>
      orpc.settings.profile.update({ companyId: companyId!, section, data }),
    onSuccess: () => {
      toast.success('Currency settings saved');
      qc.invalidateQueries({ queryKey: ['settings', 'profile', companyId] });
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to save settings'),
  });

  React.useEffect(() => {
    if (profileQuery.data) {
      const fin = (profileQuery.data as any)?.financial ?? {};
      if (fin.defaultCurrency) setBaseCurrency(fin.defaultCurrency);
      if (fin.currencyRateProvider) setRateProvider(fin.currencyRateProvider);
      if (fin.currencyAutoUpdate) setAutoUpdate(fin.currencyAutoUpdate === 'true');
    }
  }, [profileQuery.data]);

  const handleSave = useCallback(async () => {
    if (!companyId) return;
    await updateMutation.mutateAsync({
      section: 'financial',
      data: {
        defaultCurrency: baseCurrency,
        currencyRateProvider: rateProvider,
        currencyAutoUpdate: autoUpdate ? 'true' : 'false',
      },
    });
  }, [companyId, baseCurrency, rateProvider, autoUpdate, updateMutation]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Currency Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your base currency, exchange rate provider, and auto-update preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/banking/fx-rates')}
            className="ovds-btn-secondary flex items-center gap-1.5 text-xs"
          >
            <DollarSign size={13} />
            Manage Rates
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={13} />
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="ovds-widget-card p-6 space-y-4">
        <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Currency</p>
            <p className="text-xs text-slate-400 mt-0.5">Primary currency for all ledger math</p>
          </div>
          <select
            className="ovds-input max-w-xs"
            value={baseCurrency}
            onChange={e => setBaseCurrency(e.target.value)}
          >
            {[
              { label: 'ETB — Ethiopian Birr', value: 'ETB' },
              { label: 'USD — US Dollar', value: 'USD' },
              { label: 'EUR — Euro', value: 'EUR' },
              { label: 'GBP — British Pound', value: 'GBP' },
              { label: 'SAR — Saudi Riyal', value: 'SAR' },
              { label: 'AED — UAE Dirham', value: 'AED' },
              { label: 'KES — Kenyan Shilling', value: 'KES' },
            ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Exchange Rate Provider</p>
            <p className="text-xs text-slate-400 mt-0.5">Source for automatic rate updates</p>
          </div>
          <select
            className="ovds-input max-w-xs"
            value={rateProvider}
            onChange={e => setRateProvider(e.target.value)}
          >
            <option value="manual">Manual entry</option>
            <option value="nbe">National Bank of Ethiopia (NBE)</option>
            <option value="openexchangerates">Open Exchange Rates</option>
            <option value="fixer">Fixer.io</option>
          </select>
        </div>

        <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-update Exchange Rates</p>
            <p className="text-xs text-slate-400 mt-0.5">Fetch rates automatically each day</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={autoUpdate}
              onClick={() => setAutoUpdate(!autoUpdate)}
              className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${autoUpdate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoUpdate ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {autoUpdate ? 'Enabled — rates update daily' : 'Disabled — manual entry only'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency Position</p>
            <p className="text-xs text-slate-400 mt-0.5">Where the currency symbol appears</p>
          </div>
          <select
            className="ovds-input max-w-xs"
            defaultValue="before"
          >
            <option value="before">Before amount — ETB 1,000</option>
            <option value="after">After amount — 1,000 ETB</option>
          </select>
        </div>
      </div>

      <div className="ovds-widget-card p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/banking/fx-rates')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <DollarSign size={16} />
            Manage Exchange Rates
          </button>
          <button
            onClick={() => toast('Live rate fetch requires NBE API configuration', { icon: 'ℹ️' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={16} />
            Fetch Live Rates
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings;
