import { X } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useEscapeKey } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import CustomFieldRenderer, { type CustomFieldValuesMap } from '../CustomFieldRenderer';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

// Full IFRS — IAS 1 (Statement of Financial Position) aligned categories
// Covers all business types: Manufacturing, Large Enterprise, SMB, Freelancer, Government
const ACCOUNT_CATEGORIES = [
  // -- Current Assets (IAS 1.54) ------------------------------------------
  'CASH',                    // Cash & Cash Equivalents (IAS 7)
  'BANK',                    // Bank Accounts
  'ACCOUNTS_RECEIVABLE',     // Trade & Other Receivables (IFRS 9)
  'CONTRACT_ASSET',          // Contract Assets (IFRS 15)
  'INVENTORY',               // Inventories (IAS 2)
  'BIOLOGICAL_ASSET',        // Biological Assets — current (IAS 41)
  'CURRENT_TAX_ASSET',       // Current Tax Asset (IAS 12)
  'CURRENT_ASSET',           // Other Current Assets
  // -- Non-current Assets (IAS 1.54) -------------------------------------
  'FIXED_ASSET',             // Property, Plant & Equipment (IAS 16)
  'RIGHT_OF_USE_ASSET',      // Right-of-Use Assets (IFRS 16)
  'INVESTMENT_PROPERTY',     // Investment Property (IAS 40)
  'INTANGIBLE_ASSET',        // Intangible Assets (IAS 38)
  'GOODWILL',                // Goodwill (IFRS 3)
  'LONG_TERM_INVESTMENT',    // Investments in Associates/JVs (IAS 28)
  'FINANCIAL_ASSET',         // Financial Assets at FVTPL/FVOCI (IFRS 9)
  'DEFERRED_TAX_ASSET',      // Deferred Tax Asset (IAS 12)
  'BIOLOGICAL_ASSET_NC',     // Biological Assets — non-current (IAS 41)
  // -- Current Liabilities (IAS 1.54) ------------------------------------
  'ACCOUNTS_PAYABLE',        // Trade & Other Payables (IFRS 9)
  'CONTRACT_LIABILITY',      // Contract Liabilities (IFRS 15)
  'CURRENT_LIABILITY',       // Other Current Liabilities
  'TAX_PAYABLE',             // Current Tax Payable (IAS 12)
  'SHORT_TERM_BORROWING',    // Short-term Borrowings (IFRS 9)
  'LEASE_LIABILITY_CURRENT', // Lease Liabilities — current (IFRS 16)
  'PROVISION_CURRENT',       // Provisions — current (IAS 37)
  // -- Non-current Liabilities (IAS 1.54) --------------------------------
  'LONG_TERM_LIABILITY',     // Long-term Borrowings (IFRS 9)
  'LEASE_LIABILITY_NC',      // Lease Liabilities — non-current (IFRS 16)
  'DEFERRED_TAX',            // Deferred Tax Liability (IAS 12)
  'EMPLOYEE_BENEFIT_OBL',    // Employee Benefit Obligations (IAS 19)
  'PROVISION_NC',            // Provisions — non-current (IAS 37)
  // -- Equity (IAS 1.54) -------------------------------------------------
  'SHARE_CAPITAL',           // Share Capital / Paid-in Capital
  'SHARE_PREMIUM',           // Share Premium
  'RETAINED_EARNINGS',       // Retained Earnings
  'OTHER_RESERVES',          // Other Reserves (revaluation, translation, etc.)
  'NON_CONTROLLING_INTEREST',// Non-controlling Interest (IFRS 10)
  'EQUITY',                  // Other Equity
  // -- Income (IAS 1 / IFRS 15 / IFRS 9) --------------------------------
  'REVENUE',                 // Revenue from Contracts with Customers (IFRS 15)
  'OTHER_INCOME',            // Other Income
  'ovds_INCOME',          // ovds Income (IFRS 9)
  'GAIN_ON_DISPOSAL',        // Gain on Disposal of Assets
  // -- Expenses (IAS 1) --------------------------------------------------
  'COST_OF_GOODS_SOLD',      // Cost of Sales (IAS 2)
  'OPERATING_EXPENSE',       // Operating Expenses
  'DEPRECIATION',            // Depreciation & Amortisation (IAS 16/38)
  'IMPAIRMENT',              // Impairment Losses (IAS 36)
  'ovds_COST',            // ovds Costs (IAS 23)
  'TAX_EXPENSE',             // Income Tax Expense (IAS 12)
  'OTHER_EXPENSE',           // Other Expenses
];

// Full IFRS category → display label mapping
const CATEGORY_LABELS: Record<string, string> = {
  // Current Assets
  CASH:                    'Cash & Cash Equivalents (IAS 7)',
  BANK:                    'Bank Accounts',
  ACCOUNTS_RECEIVABLE:     'Trade & Other Receivables (IFRS 9)',
  CONTRACT_ASSET:          'Contract Assets (IFRS 15)',
  INVENTORY:               'Inventories (IAS 2)',
  BIOLOGICAL_ASSET:        'Biological Assets — Current (IAS 41)',
  CURRENT_TAX_ASSET:       'Current Tax Asset (IAS 12)',
  CURRENT_ASSET:           'Other Current Assets',
  // Non-current Assets
  FIXED_ASSET:             'Property, Plant & Equipment (IAS 16)',
  RIGHT_OF_USE_ASSET:      'Right-of-Use Assets (IFRS 16)',
  INVESTMENT_PROPERTY:     'Investment Property (IAS 40)',
  INTANGIBLE_ASSET:        'Intangible Assets (IAS 38)',
  GOODWILL:                'Goodwill (IFRS 3)',
  LONG_TERM_INVESTMENT:    'Investments in Associates / JVs (IAS 28)',
  FINANCIAL_ASSET:         'Financial Assets at FVTPL / FVOCI (IFRS 9)',
  DEFERRED_TAX_ASSET:      'Deferred Tax Asset (IAS 12)',
  BIOLOGICAL_ASSET_NC:     'Biological Assets — Non-current (IAS 41)',
  // Current Liabilities
  ACCOUNTS_PAYABLE:        'Trade & Other Payables',
  CONTRACT_LIABILITY:      'Contract Liabilities (IFRS 15)',
  CURRENT_LIABILITY:       'Other Current Liabilities',
  TAX_PAYABLE:             'Current Tax Payable (IAS 12)',
  SHORT_TERM_BORROWING:    'Short-term Borrowings',
  LEASE_LIABILITY_CURRENT: 'Lease Liabilities — Current (IFRS 16)',
  PROVISION_CURRENT:       'Provisions — Current (IAS 37)',
  // Non-current Liabilities
  LONG_TERM_LIABILITY:     'Long-term Borrowings',
  LEASE_LIABILITY_NC:      'Lease Liabilities — Non-current (IFRS 16)',
  DEFERRED_TAX:            'Deferred Tax Liability (IAS 12)',
  EMPLOYEE_BENEFIT_OBL:    'Employee Benefit Obligations (IAS 19)',
  PROVISION_NC:            'Provisions — Non-current (IAS 37)',
  // Equity
  SHARE_CAPITAL:           'Share Capital / Paid-in Capital',
  SHARE_PREMIUM:           'Share Premium',
  RETAINED_EARNINGS:       'Retained Earnings',
  OTHER_RESERVES:          'Other Reserves (Revaluation / Translation)',
  NON_CONTROLLING_INTEREST:'Non-controlling Interest (IFRS 10)',
  EQUITY:                  'Other Equity',
  // Income
  REVENUE:                 'Revenue from Contracts with Customers (IFRS 15)',
  OTHER_INCOME:            'Other Income',
  ovds_INCOME:          'ovds Income (IFRS 9)',
  GAIN_ON_DISPOSAL:        'Gain on Disposal of Assets',
  // Expenses
  COST_OF_GOODS_SOLD:      'Cost of Sales (IAS 2)',
  OPERATING_EXPENSE:       'Operating Expenses',
  DEPRECIATION:            'Depreciation & Amortisation (IAS 16/38)',
  IMPAIRMENT:              'Impairment Losses (IAS 36)',
  ovds_COST:            'ovds Costs (IAS 23)',
  TAX_EXPENSE:             'Income Tax Expense (IAS 12)',
  OTHER_EXPENSE:           'Other Expenses',
};

interface AccountModalProps {
  account?: any;
  companyId?: string;
  onClose: () => void;
  onSave: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({
  account,
  companyId,
  onClose,
  onSave,
}) => {
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  useEscapeKey(onClose);
  const [form, setForm] = useState({
    code: account?.code || '',
    name: account?.name || '',
    type: account?.type || 'ASSET',
    category: account?.category || 'CASH',
    description: account?.description || '',
    isActive: account?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValuesMap>({});
  const handleCustomFieldChange = useCallback((values: CustomFieldValuesMap) => {
    setCustomFieldValues(values);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!canWrite) {
      setSaving(false);
      toast.error('Insufficient permissions');
      return;
    }
    try {
      const payload = { ...form, customFields: customFieldValues };
      if (account) {
        await api.patch(`/ovds/accounts/${account.id}`, payload);
        toast.success('Account updated');
      } else {
        await api.post('/ovds/accounts', payload);
        toast.success('Account created');
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label={account ? 'Edit Account' : 'New Account'}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {account ? 'Edit Account' : 'New Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full IFRS reference banner */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900/40 rounded-xl">
            <span className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] uppercase tracking-wider shrink-0 mt-0.5">Full IFRS</span>
            <p className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
              Categories follow <strong>IAS 1</strong> (Statement of Financial Position) &amp; <strong>IFRS 15/9</strong> (Income/Financial Instruments). Current/Non-current per IAS 1.54–1.60. Covers all business types.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Code *</label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. 1010"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Account name"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200">
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Category * <span className="text-[8px] text-[var(--pro-azure)] font-bold">(IAS 1)</span>
              </label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200">
                {ACCOUNT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>
            {account && (
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? 'bg-[var(--pro-azure)]' : 'bg-slate-300'}`}
                    onClick={() =>
                      setForm({ ...form, isActive: !form.isActive })
                    }
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            )}
            {companyId && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Custom Fields</p>
                <CustomFieldRenderer feature="account" entityId={account?.id} companyId={companyId}
                  onChange={handleCustomFieldChange} showTitle={false} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
<button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;









