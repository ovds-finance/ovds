import {
  X, ShieldCheck, Eye, EyeOff, Landmark, ChevronDown, ChevronUp,
  Building2, CreditCard, PiggyBank, Globe, Hash, GitBranch, FileText,
  DollarSign, Lock, CheckCircle2,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useEscapeKey } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

// -- Ethiopian banks with colour accents --------------------------------------
const ET_BANKS: { name: string; short: string; color: string }[] = [
  { name: 'Commercial Bank of Ethiopia (CBE)', short: 'CBE',   color: 'bg-[#0057a8]' },
  { name: 'Awash Bank',                        short: 'AWB',   color: 'bg-[#e04e1e]' },
  { name: 'Dashen Bank',                       short: 'DSH',   color: 'bg-[#004f9f]' },
  { name: 'Abyssinia Bank',                    short: 'ABB',   color: 'bg-[#007a40]' },
  { name: 'Wegagen Bank',                      short: 'WGB',   color: 'bg-[#c8102e]' },
  { name: 'United Bank',                       short: 'UNB',   color: 'bg-[#6b21a8]' },
  { name: 'Nib International Bank',            short: 'NIB',   color: 'bg-[#1d4ed8]' },
  { name: 'Cooperative Bank of Oromia',        short: 'CBO',   color: 'bg-[#15803d]' },
  { name: 'Berhan Bank',                       short: 'BRH',   color: 'bg-[#7c3aed]' },
  { name: 'Bunna International Bank',          short: 'BNB',   color: 'bg-[#b45309]' },
  { name: 'Zemen Bank',                        short: 'ZMN',   color: 'bg-[#0e7490]' },
  { name: 'Oromia International Bank',         short: 'OIB',   color: 'bg-[#166534]' },
  { name: 'Addis International Bank',          short: 'AIB',   color: 'bg-[#9f1239]' },
  { name: 'Enat Bank',                         short: 'ENT',   color: 'bg-[#be185d]' },
  { name: 'Amhara Bank',                       short: 'AMB',   color: 'bg-[#1e40af]' },
  { name: 'Tsedey Bank',                       short: 'TSD',   color: 'bg-[#065f46]' },
  { name: 'Telebirr (Ethio Telecom)',           short: 'TLB',   color: 'bg-[#2563eb]' },
  { name: 'Other',                             short: '···',   color: 'bg-slate-400' },
];

// -- Account type definitions --------------------------------------------------
const ACCOUNT_TYPES = [
  { value: 'CURRENT',      label: 'Current',       sub: 'Day-to-day ops',     icon: <Building2 size={14} />,  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
  { value: 'SAVINGS',      label: 'Savings',        sub: 'Interest-bearing',   icon: <PiggyBank size={14} />,  color: 'text-sky-600 dark:text-sky-400' },
  { value: 'FIXED_DEPOSIT',label: 'Fixed Deposit',  sub: 'Term deposit',       icon: <Lock size={14} />,       color: 'text-violet-600 dark:text-violet-400' },
  { value: 'FOREIGN',      label: 'Foreign FCY',    sub: 'Multi-currency',     icon: <Globe size={14} />,      color: 'text-amber-600 dark:text-amber-400' },
];

const CURRENCIES = [
  { code: 'ETB', label: 'Ethiopian Birr',  flag: '🇪🇹' },
  { code: 'USD', label: 'US Dollar',       flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',            flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound',   flag: '🇬🇧' },
  { code: 'AED', label: 'UAE Dirham',      flag: '🇦🇪' },
  { code: 'SAR', label: 'Saudi Riyal',     flag: '🇸🇦' },
  { code: 'CNY', label: 'Chinese Yuan',    flag: '🇨🇳' },
];

interface BankModalProps {
  onClose: () => void;
  onSave: () => void;
  editAccount?: any;
}

const BankModal: React.FC<BankModalProps> = ({ onClose, onSave, editAccount }) => {
  const isEdit = !!editAccount;
  const [form, setForm] = useState({
    name:           editAccount?.name           ?? '',
    accountNumber:  editAccount?.accountNumber  ?? '',
    bankName:       editAccount?.bankName       ?? '',
    currencyCode:   editAccount?.currencyCode   ?? editAccount?.currency ?? 'ETB',
    openingBalance: editAccount?.openingBalance ?? 0,
    routingNumber:  editAccount?.routingNumber  ?? '',
    swiftCode:      editAccount?.swiftCode      ?? '',
    branchName:     editAccount?.branchName     ?? '',
    branchCode:     editAccount?.branchCode     ?? '',
    accountType:    editAccount?.accountType    ?? 'CURRENT',
    description:    editAccount?.description    ?? '',
  });
  const [saving, setSaving]             = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customBank, setCustomBank]     = useState('');
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  useEscapeKey(onClose);

  const selectedBank = ET_BANKS.find(b => b.name === form.bankName);
  const selectedCurrency = CURRENCIES.find(c => c.code === form.currencyCode) ?? CURRENCIES[0];

  const handleBankSelect = (bankName: string) => {
    setForm(f => ({ ...f, bankName }));
    if (bankName !== 'Other') setCustomBank('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) { toast.error('Insufficient permissions'); return; }
    const resolvedBank = form.bankName === 'Other' ? customBank.trim() : form.bankName;
    if (!resolvedBank) { toast.error('Please select or enter a bank name'); return; }
    setSaving(true);
    try {
      const FRONTEND_TO_BACKEND_TYPE: Record<string, string> = {
        CURRENT: 'BANK',
        SAVINGS: 'SAVINGS',
        FIXED_DEPOSIT: 'LOAN',
        FOREIGN: 'BANK',
        CREDIT_CARD: 'CREDIT_CARD',
        PETTY_CASH: 'CASH',
      };
      const payload = {
        name:          form.name,
        bankName:      resolvedBank,
        currencyCode:  form.currencyCode,
        accountType:   FRONTEND_TO_BACKEND_TYPE[form.accountType] ?? form.accountType,
        routingNumber: form.routingNumber  || undefined,
        swiftCode:     form.swiftCode      || undefined,
        branchName:    form.branchName     || undefined,
        branchCode:    form.branchCode     || undefined,
        description:   form.description    || undefined,
        ...(!isEdit && {
          accountNumber:  form.accountNumber,
          openingBalance: form.openingBalance,
        }),
      };
      if (isEdit) {
        await api.patch(`/banking/accounts/${editAccount.id}`, payload);
      } else {
        await api.post('/banking/accounts', payload);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col">

        {/* -- Header -- */}
        <div className="relative overflow-hidden shrink-0">
          {/* Accent stripe */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-indigo-500" />
          <div className="flex items-center gap-3 px-6 py-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${selectedBank?.color ?? 'bg-[var(--pro-azure-50)]0'}`}>
              {selectedBank ? selectedBank.short : <Landmark size={18} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white">
                {isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {form.bankName && form.bankName !== 'Other' ? form.bankName : 'Select a bank to get started'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 space-y-5 pb-6">

            {/* -- Bank selector -- */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={10} /> Bank *
              </label>
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                {ET_BANKS.map((b) => {
                  const isSelected = form.bankName === b.name;
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleBankSelect(b.name)}
                      title={b.name}
                      className={`flex flex-col items-center gap-1 px-1 py-2 rounded-xl text-[9px] font-bold transition-all border ${
                        isSelected
                          ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[9px] ${b.color}`}>
                        {b.short.slice(0, 3)}
                      </span>
                      <span className="truncate w-full text-center leading-tight">
                        {b.short === '···' ? 'Other' : b.short}
                      </span>
                      {isSelected && <CheckCircle2 size={8} className="text-[var(--pro-azure)]" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom bank name input when "Other" is selected */}
              {form.bankName === 'Other' && (
                <input
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  placeholder="Enter bank name…"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 dark:text-white transition-colors"
                />
              )}
            </div>

            {/* -- Account name -- */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={10} /> Account Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. CBE Main Account"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 dark:text-white transition-colors"
              />
            </div>

            {/* -- Account number (only on create) -- */}
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash size={10} /> Account Number *
                </label>
                <div className="relative">
                  <input
                    required
                    type={showAccountNumber ? 'text' : 'password'}
                    value={form.accountNumber}
                    onChange={(e) => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="1000XXXXXXXXX"
                    className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 dark:text-white transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showAccountNumber ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck size={10} className="text-[var(--pro-azure)]" />
                  Stored securely — only last 4 digits shown in the UI
                </div>
              </div>
            )}

            {/* -- Account type + Currency -- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={10} /> Account Type
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACCOUNT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, accountType: t.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all ${
                        form.accountType === t.value
                          ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={form.accountType === t.value ? t.color : 'text-slate-400 dark:text-slate-500'}>
                        {t.icon}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-tight ${form.accountType === t.value ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-slate-700 dark:text-slate-300'}`}>
                          {t.label}
                        </p>
                        <p className="text-[9px] text-slate-400 leading-tight">{t.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={10} /> Currency
                  </label>
                  <div className="space-y-1">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, currencyCode: c.code }))}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all ${
                          form.currencyCode === c.code
                            ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="text-base leading-none">{c.flag}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold leading-tight ${form.currencyCode === c.code ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-slate-700 dark:text-slate-300'}`}>
                            {c.code}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">{c.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* -- Opening balance (only on create) -- */}
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={10} /> Opening Balance ({form.currencyCode})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
                    {selectedCurrency.flag}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.openingBalance}
                    onChange={(e) => setForm(f => ({ ...f, openingBalance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 dark:text-white transition-colors tabular-nums"
                  />
                </div>
              </div>
            )}

            {/* -- Advanced / routing details -- */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <GitBranch size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Routing, Branch & SWIFT Details
                  </span>
                  <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-medium">Optional</span>
                </div>
                {showAdvanced ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {showAdvanced && (
                <div className="p-4 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {[
                    { label: 'Routing Number', field: 'routingNumber', placeholder: '9-digit routing no.', mono: false },
                    { label: 'SWIFT / BIC Code', field: 'swiftCode',    placeholder: 'e.g. CBETETAA',       mono: true  },
                    { label: 'Branch Name',     field: 'branchName',   placeholder: 'e.g. Mekelle Main',   mono: false },
                    { label: 'Branch Code',     field: 'branchCode',   placeholder: 'e.g. 001',            mono: true  },
                  ].map(({ label, field, placeholder, mono }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                      <input
                        value={(form as any)[field]}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          [field]: field === 'swiftCode' ? e.target.value.toUpperCase() : e.target.value,
                        }))}
                        placeholder={placeholder}
                        maxLength={field === 'swiftCode' ? 11 : undefined}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white transition-colors ${mono ? 'font-mono' : ''}`}
                      />
                    </div>
                  ))}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Notes / Description</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Optional notes about this account"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* -- Summary preview + footer -- */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 space-y-3">
            {/* Preview strip */}
            {(form.name || form.bankName) && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${selectedBank?.color ?? 'bg-[var(--pro-azure-50)]0'}`}>
                  {selectedBank?.short ?? '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-white truncate">
                    {form.name || 'Account name…'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {form.bankName && form.bankName !== 'Other' ? form.bankName : customBank || 'Select bank…'}
                    {form.currencyCode !== 'ETB' && ` · ${form.currencyCode}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border border-[var(--pro-azure-100)] dark:border-green-800 shrink-0">
                  {ACCOUNT_TYPES.find(t => t.value === form.accountType)?.label ?? form.accountType}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.bankName || (form.bankName === 'Other' && !customBank.trim()) || !form.name || (!isEdit && !form.accountNumber)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm shadow-teal-200 dark:shadow-none"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  isEdit ? 'Update Account' : 'Add Bank Account'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankModal;
