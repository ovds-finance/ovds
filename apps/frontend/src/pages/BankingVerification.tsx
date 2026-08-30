/**
 * Banking Verification & Validation (V&V) — Ovds-style process screen
 *
 * A guided, minimalistic V&V flow for bank transactions:
 *   Step 1 · Details   — intake & entry with inline error highlighting + double-entry cues
 *   Step 2 · Validate  — summary data cards (parsed totals, running balance)
 *   Step 3 · Confirm   — split-view comparison (Original vs Validated) + sticky action footer
 *
 * Best practices implemented: progressive disclosure (Advanced Options), auto-save
 * indicator, and credit/debit contrast tints.
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Landmark, ShieldCheck, FileCheck2, ClipboardCheck, ArrowRightLeft,
  ArrowDownRight, ArrowUpRight, AlertCircle, CheckCircle2, Check,
  ChevronRight, ChevronLeft, X, Save, RefreshCw, SlidersHorizontal,
  Eye, Info, Hash, CalendarDays, Building2,
  Banknote, CircleDollarSign, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useBusiness } from '../context/businessContext';
import { fmtETB } from '../utils/ethiopianTax';
import {
  AppPage, Btn, Card, Modal, Select, Textarea, AppKpi,
} from '../components/ui';

// ── Types ────────────────────────────────────────────────────────────────────

interface BankAccount {
  id: string; name: string; accountNumber: string; bankName: string;
  currencyCode: string; openingBalance: number; computedBalance: number;
  isActive: boolean;
}

type EntryType = 'CREDIT' | 'DEBIT';

interface VandvForm {
  reference: string;
  date: string;
  valueDate: string;
  counterparty: string;
  bankAccountId: string;
  type: EntryType;
  amount: number | '';
  currencyCode: string;
  description: string;
  // Advanced options (progressive disclosure)
  bankCharges: number;
  vatRate: number;
  fxRate: number;
  notes: string;
}

interface ValidationIssue {
  id: string;
  field?: keyof VandvForm;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'ovds_bank_vandv_draft';
const AMOUNT_LIMIT = 10_000_000;

const STEPS = [
  { id: 'details',  title: 'Details',  desc: 'Intake & entry',   icon: <ClipboardCheck size={16} /> },
  { id: 'validate', title: 'Validate', desc: 'Verify totals',    icon: <ShieldCheck size={16} /> },
  { id: 'confirm',  title: 'Confirm',  desc: 'Final review',     icon: <FileCheck2 size={16} /> },
] as const;

const AKA_GREEN = '#55bc7e';
const AKA_GREEN_DK = '#3db77a';

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all';
const labelCls = 'block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';
const errorCls = 'text-[11px] text-rose-500 dark:text-rose-400 mt-1.5 flex items-center gap-1.5 font-semibold';
const hintCls = 'text-[10px] text-slate-400 dark:text-slate-500 mt-1';

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Validation engine ──────────────────────────────────────────────────────────

function validateForm(f: VandvForm): { errors: Record<string, string>; issues: ValidationIssue[] } {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!f.reference.trim()) {
    errors.reference = 'Reference is required';
    issues.push({ id: 'reference', field: 'reference', severity: 'error', message: 'Reference is required' });
  } else if (!/^[A-Za-z0-9-/.]+$/.test(f.reference.trim())) {
    errors.reference = 'Only letters, numbers, - . / are allowed';
    issues.push({ id: 'reference', field: 'reference', severity: 'error', message: 'Invalid reference format' });
  }

  if (!f.date) {
    errors.date = 'Transaction date is required';
    issues.push({ id: 'date', field: 'date', severity: 'error', message: 'Transaction date is required' });
  } else if (new Date(f.date) > new Date()) {
    errors.date = 'Date cannot be in the future';
    issues.push({ id: 'date', field: 'date', severity: 'error', message: 'Transaction date is in the future' });
  }

  if (!f.counterparty.trim()) {
    errors.counterparty = 'Counterparty is required';
    issues.push({ id: 'counterparty', field: 'counterparty', severity: 'error', message: 'Counterparty is required' });
  }

  if (!f.bankAccountId) {
    errors.bankAccountId = 'Select a bank account';
    issues.push({ id: 'bankAccountId', field: 'bankAccountId', severity: 'error', message: 'Bank account is required' });
  }

  if (f.amount === '' || isNaN(Number(f.amount))) {
    errors.amount = 'Enter a valid amount';
    issues.push({ id: 'amount', field: 'amount', severity: 'error', message: 'Amount is required' });
  } else if (Number(f.amount) <= 0) {
    errors.amount = 'Amount must be greater than zero';
    issues.push({ id: 'amount', field: 'amount', severity: 'error', message: 'Amount must be greater than zero' });
  } else if (Number(f.amount) > AMOUNT_LIMIT) {
    errors.amount = `Amount exceeds the ${fmtETB(AMOUNT_LIMIT)} limit`;
    issues.push({ id: 'amount', field: 'amount', severity: 'error', message: `Amount exceeds the ${AMOUNT_LIMIT.toLocaleString()} limit` });
  }

  if (f.bankCharges && (isNaN(f.bankCharges) || f.bankCharges < 0)) {
    errors.bankCharges = 'Charges cannot be negative';
    issues.push({ id: 'bankCharges', field: 'bankCharges', severity: 'error', message: 'Bank charges cannot be negative' });
  }
  if (f.vatRate && (isNaN(f.vatRate) || f.vatRate < 0 || f.vatRate > 100)) {
    errors.vatRate = 'VAT rate must be 0–100%';
    issues.push({ id: 'vatRate', field: 'vatRate', severity: 'error', message: 'VAT rate out of range' });
  }
  if (f.fxRate && (isNaN(f.fxRate) || f.fxRate <= 0)) {
    errors.fxRate = 'FX rate must be positive';
    issues.push({ id: 'fxRate', field: 'fxRate', severity: 'error', message: 'FX rate must be positive' });
  }

  if (!f.description.trim()) {
    issues.push({ id: 'desc', field: 'description', severity: 'warning', message: 'Description is empty — add context for the audit trail' });
  }

  return { errors, issues };
}

// ── Smart Wizard Header (numbered horizontal tracker) ──────────────────────────

const WizardHeader: React.FC<{ step: number; onJump: (i: number) => void; lastSaved: Date | null }> = ({ step, onJump, lastSaved }) => {
  const progress = Math.round((step / (STEPS.length - 1)) * 100);
  return (
    <div className="relative bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)] overflow-hidden">
      {/* Ovds green top stripe */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg,${AKA_GREEN_DK},${AKA_GREEN},#7dd8a0)` }} />

      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: AKA_GREEN }}>
              <ArrowRightLeft size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 dark:text-slate-50 text-[14px] leading-none tracking-tight">Verification &amp; Validation</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                Step {step + 1} of {STEPS.length} · {STEPS[step].desc}
                {/* Auto-save indicator */}
                {lastSaved && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Save size={9} /> Saved {fmtTime(lastSaved)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Auto-save status pill (top-right) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${lastSaved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'} ${lastSaved ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {lastSaved ? `Auto-saved ${fmtTime(lastSaved)}` : 'Draft not saved yet'}
            </span>
          </div>
        </div>

        {/* Tracker */}
        <div className="flex items-center mt-4">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo';
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => i <= step && onJump(i)}
                  disabled={i > step}
                  className="flex items-center gap-2.5 group shrink-0"
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-200 ${
                      state === 'done' ? 'text-white shadow-sm' : state === 'active' ? 'text-white ring-4 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                    style={state !== 'todo' ? { background: AKA_GREEN, '--tw-ring-color': 'rgba(85,188,126,0.3)' } as React.CSSProperties : {}}
                  >
                    {state === 'done' ? <Check size={14} /> : i + 1}
                  </span>
                  <div className="text-left hidden sm:block">
                    <p className={`text-[11px] font-bold leading-none ${state === 'todo' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>{s.title}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3 rounded-full transition-all" style={{ background: i < step ? AKA_GREEN : '#e2e8f0' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full rounded-r-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: AKA_GREEN }} />
        </div>
      </div>
    </div>
  );
};

// ── Step 1 · Details (Intake & Entry + Inline Error Highlighting) ───────────────

const DetailsStep: React.FC<{
  form: VandvForm; errors: Record<string, string>; accounts: BankAccount[];
  onChange: (patch: Partial<VandvForm>) => void;
}> = ({ form, errors, accounts, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isCredit = form.type === 'CREDIT';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Primary entry */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
              <ClipboardCheck size={13} className="text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Transaction Entry</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Reference *</label>
              <div className="relative">
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={form.reference} onChange={e => onChange({ reference: e.target.value.toUpperCase() })}
                  placeholder="e.g. TXN-2026-0001" className={`${inputCls} pl-8 ${errors.reference ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20' : ''}`} />
              </div>
              {errors.reference ? <p className={errorCls}><AlertCircle size={10} />{errors.reference}</p> : <p className={hintCls}>Unique transaction identifier from your bank statement.</p>}
            </div>

            <div>
              <label className={labelCls}>Transaction Date *</label>
              <div className="relative">
                <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="date" value={form.date} onChange={e => onChange({ date: e.target.value })}
                  className={`${inputCls} pl-8 ${errors.date ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20' : ''}`} />
              </div>
              {errors.date && <p className={errorCls}><AlertCircle size={10} />{errors.date}</p>}
            </div>

            <div>
              <label className={labelCls}>Counterparty *</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={form.counterparty} onChange={e => onChange({ counterparty: e.target.value })}
                  placeholder="e.g. Awash Bank" className={`${inputCls} pl-8 ${errors.counterparty ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20' : ''}`} />
              </div>
              {errors.counterparty && <p className={errorCls}><AlertCircle size={10} />{errors.counterparty}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Bank Account *</label>
              <Select value={form.bankAccountId} onChange={e => onChange({ bankAccountId: e })}
                className={`${inputCls} ${errors.bankAccountId ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20' : ''}`}>
                <option value="">Select account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.bankName} ({fmtETB(a.computedBalance ?? 0)})</option>
                ))}
              </Select>
              {errors.bankAccountId && <p className={errorCls}><AlertCircle size={10} />{errors.bankAccountId}</p>}
            </div>

            {/* Double-entry cue: credit vs debit */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Entry Type — Double-Entry Cue</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onChange({ type: 'CREDIT' })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    isCredit ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                  }`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-500 text-white' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'}`}>
                    <ArrowDownRight size={13} />
                  </span>
                  <div>
                    <p className={`text-[12px] font-bold ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>Credit (Inflow)</p>
                    <p className="text-[10px] text-slate-400">Money received</p>
                  </div>
                </button>
                <button type="button" onClick={() => onChange({ type: 'DEBIT' })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    !isCredit ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300'
                  }`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${!isCredit ? 'bg-rose-500 text-white' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'}`}>
                    <ArrowUpRight size={13} />
                  </span>
                  <div>
                    <p className={`text-[12px] font-bold ${!isCredit ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>Debit (Outflow)</p>
                    <p className="text-[10px] text-slate-400">Money paid out</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Amount ({form.currencyCode}) *</label>
              <div className="relative">
                <Banknote size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => onChange({ amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  placeholder="0.00" className={`${inputCls} pl-8 ${errors.amount ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20' : ''}`} />
              </div>
              {errors.amount ? <p className={errorCls}><AlertCircle size={10} />{errors.amount}</p> : <p className={hintCls}>Max {fmtETB(AMOUNT_LIMIT)} per entry.</p>}
            </div>

            <div>
              <label className={labelCls}>Currency</label>
              <Select value={form.currencyCode} onChange={e => onChange({ currencyCode: e })} className={inputCls}>
                <option value="ETB">ETB — Ethiopian Birr</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <Textarea value={form.description} onChange={e => onChange({ description: e.target.value })} rows={2}
                placeholder="Purpose of the transaction…" className={inputCls} />
            </div>
          </div>
        </Card>

        {/* Progressive disclosure: Advanced Options */}
        <button type="button" onClick={() => setShowAdvanced(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <span className="flex items-center gap-2 text-[12px] font-bold text-slate-600 dark:text-slate-300">
            <SlidersHorizontal size={13} /> Advanced Options
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
            {showAdvanced ? 'Hide' : 'Show'} <ChevronRight size={12} className="rotate-90" />
          </span>
        </button>

        {showAdvanced && (
          <Card className="p-4 border-emerald-100 dark:border-emerald-900/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Value Date</label>
                <input type="date" value={form.valueDate} onChange={e => onChange({ valueDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bank Charges</label>
                <input type="number" step="0.01" min="0" value={form.bankCharges} onChange={e => onChange({ bankCharges: parseFloat(e.target.value) || 0 })} className={`${inputCls} ${errors.bankCharges ? 'border-rose-400' : ''}`} />
                {errors.bankCharges && <p className={errorCls}><AlertCircle size={10} />{errors.bankCharges}</p>}
              </div>
              <div>
                <label className={labelCls}>VAT Rate (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.vatRate} onChange={e => onChange({ vatRate: parseFloat(e.target.value) || 0 })} className={`${inputCls} ${errors.vatRate ? 'border-rose-400' : ''}`} />
                {errors.vatRate && <p className={errorCls}><AlertCircle size={10} />{errors.vatRate}</p>}
              </div>
              <div>
                <label className={labelCls}>FX Rate (to account ccy)</label>
                <input type="number" step="0.0001" min="0" value={form.fxRate} onChange={e => onChange({ fxRate: parseFloat(e.target.value) || 0 })} className={`${inputCls} ${errors.fxRate ? 'border-rose-400' : ''}`} />
                {errors.fxRate && <p className={errorCls}><AlertCircle size={10} />{errors.fxRate}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Notes / Memo</label>
                <Textarea value={form.notes} onChange={e => onChange({ notes: e.target.value })} rows={2} placeholder="Internal note for the audit trail…" className={inputCls} />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Live double-entry side panel */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Entry Preview</p>
        <div className={`rounded-2xl border p-4 ${isCredit ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {isCredit ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            </span>
            <span className={`text-[12px] font-bold ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {isCredit ? 'Inflow' : 'Outflow'} · {form.currencyCode}
            </span>
          </div>
          <p className={`text-[22px] font-bold tabular-nums ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {isCredit ? '+' : '-'}{form.amount === '' ? fmtETB(0) : fmtETB(Number(form.amount))}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{form.counterparty || 'No counterparty'}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Selected Account</p>
          {form.bankAccountId ? (
            (() => {
              const acc = accounts.find(a => a.id === form.bankAccountId);
              if (!acc) return <p className="text-[12px] text-slate-400">—</p>;
              return (
                <>
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{acc.name}</p>
                  <p className="text-[10px] text-slate-400 mb-2">{acc.bankName}</p>
                  <p className="text-[11px] text-slate-500">Current balance</p>
                  <p className="text-[15px] font-bold text-slate-900 dark:text-slate-50 tabular-nums">{fmtETB(acc.computedBalance ?? 0)}</p>
                </>
              );
            })()
          ) : <p className="text-[12px] text-slate-400">No account selected</p>}
        </div>
      </div>
    </div>
  );
};

// ── Totals / running balance computation ───────────────────────────────────────

function computeTotals(form: VandvForm, account: BankAccount | undefined) {
  const gross = Number(form.amount) || 0;
  const vat = gross * (Number(form.vatRate) || 0) / 100;
  const charges = Number(form.bankCharges) || 0;
  const isCredit = form.type === 'CREDIT';
  // Net booked amount (enters the ledger)
  const net = isCredit ? gross - vat - charges : gross + vat + charges;
  // Convert to account currency when needed (uses FX rate advanced option)
  const fx = Number(form.fxRate) || 1;
  const sameCcy = account ? form.currencyCode === account.currencyCode : true;
  const netInAccCcy = sameCcy ? net : net * fx;
  const running = (account?.computedBalance ?? 0) + (isCredit ? netInAccCcy : -netInAccCcy);
  return { gross, vat, charges, net, netInAccCcy, running, isCredit, sameCcy };
}

// ── Step 2 · Validate (Summary Data Cards) ─────────────────────────────────────

const ValidateStep: React.FC<{
  form: VandvForm; accounts: BankAccount[]; issues: ValidationIssue[];
  onJumpIssue: (issue: ValidationIssue) => void;
}> = ({ form, accounts, issues, onJumpIssue }) => {
  const account = accounts.find(a => a.id === form.bankAccountId);
  const t = computeTotals(form, account);
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warnCount = issues.filter(i => i.severity === 'warning').length;
  const ccy = account?.currencyCode ?? form.currencyCode;

  const cards = [
    { label: 'Gross Amount', value: fmtETB(form.amount === '' ? 0 : Number(form.amount)), color: t.isCredit ? 'emerald' : 'rose',
      icon: <CircleDollarSign size={12} />, sub: form.currencyCode },
    { label: 'VAT', value: fmtETB(t.vat), color: 'amber' as const, icon: <Layers size={12} />,
      sub: `${Number(form.vatRate) || 0}% applied` },
    { label: 'Bank Charges', value: fmtETB(t.charges), color: 'slate' as const, icon: <SlidersHorizontal size={12} />,
      sub: 'Deducted' },
    { label: 'Net Booked', value: fmtETB(t.net), color: t.isCredit ? 'emerald' : 'rose', icon: <Banknote size={12} />,
      sub: 'After VAT & charges' },
    { label: 'Running Balance', value: fmtETB(t.running), color: t.running >= 0 ? 'sky' : 'rose', icon: <Landmark size={12} />,
      sub: account ? account.name : 'No account' },
    { label: 'V&V Status', value: errorCount ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : warnCount ? `${warnCount} review` : 'Passed',
      color: errorCount ? 'rose' : warnCount ? 'amber' : 'emerald', icon: errorCount ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />,
      sub: errorCount ? 'Fix before submit' : 'Ready' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary data cards — Ovds-style large bold metrics */}
      <AppKpi cells={cards} cols={3} />

      {/* Double-entry view */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-1.5 mb-2"><ArrowDownRight size={12} className="text-emerald-600" /><span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Credits (Inflow)</span></div>
          <p className="text-[18px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{t.isCredit ? fmtETB(t.net) : fmtETB(0)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-1.5 mb-2"><ArrowUpRight size={12} className="text-rose-600" /><span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest">Debits (Outflow)</span></div>
          <p className="text-[18px] font-bold text-rose-700 dark:text-rose-400 tabular-nums">{!t.isCredit ? fmtETB(t.net) : fmtETB(0)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-1.5 mb-2"><ArrowRightLeft size={12} className="text-slate-500" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Net Change</span></div>
          <p className={`text-[18px] font-bold tabular-nums ${t.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{t.net >= 0 ? '+' : ''}{fmtETB(t.net)}</p>
          {!t.sameCcy && <p className="text-[10px] text-slate-400 mt-1">FX @ {Number(form.fxRate) || 1} → {ccy}</p>}
        </div>
      </div>

      {/* Validation issues */}
      <Card className="p-4">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Validation Checks</p>
        {issues.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <p className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">All checks passed — data is clear and ready to confirm.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {issues.map(iss => {
              const color = iss.severity === 'error'
                ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20'
                : iss.severity === 'warning'
                ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20'
                : 'border-sky-200 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20';
              const ic = iss.severity === 'error'
                ? <AlertCircle size={13} className="text-rose-500 shrink-0" />
                : iss.severity === 'warning'
                ? <AlertCircle size={13} className="text-amber-500 shrink-0" />
                : <Info size={13} className="text-sky-500 shrink-0" />;
              return (
                <button key={iss.id} onClick={() => iss.field && onJumpIssue()}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${color} ${iss.field ? 'hover:shadow-sm cursor-pointer' : 'cursor-default'}`}>
                  {ic}
                  <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200 flex-1">{iss.message}</span>
                  {iss.field && <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">edit</span>}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Step 3 · Confirm — Split-View Comparison (Original vs Validated) ───────────

type DiffKind = 'same' | 'edit' | 'add';

function DiffRow({ label, before, after, kind }: { label: string; before: string; after: string; kind: DiffKind }) {
  const bg = kind === 'add' ? 'bg-emerald-50 dark:bg-emerald-950/20'
    : kind === 'edit' ? 'bg-amber-50 dark:bg-amber-950/20'
    : 'bg-white dark:bg-slate-950';
  const tag = kind === 'add' ? <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold uppercase">+ Added</span>
    : kind === 'edit' ? <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[8px] font-bold uppercase">~ Edited</span>
    : null;
  return (
    <div className={`grid grid-cols-[120px_1fr_1fr] gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 ${bg}`}>
      <div className="flex flex-col justify-center gap-0.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-none">{label}</span>
        {tag}
      </div>
      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono break-words">{before || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
      <div className="text-[11px] text-slate-800 dark:text-slate-100 font-mono break-words">{after || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
    </div>
  );
}

const SplitViewCompare: React.FC<{
  form: VandvForm; account: BankAccount | undefined; onClose: () => void;
}> = ({ form, account, onClose }) => {
  const t = computeTotals(form, account);
  const refValidated = form.reference.trim().toUpperCase();
  const descValidated = form.description.trim().replace(/\s+/g, ' ');
  const typeValidated = form.type === 'CREDIT' ? 'Credit (Inflow)' : 'Debit (Outflow)';

  return (
    <Modal open onClose={onClose} title="Original vs Validated Data" subtitle="Color-coded diff — green = additions, yellow = edits"
      footer={<Btn variant="primary" onClick={onClose}>Looks correct</Btn>} width="max-w-3xl">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_1fr] gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Field</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Original (as entered)</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Validated (normalised)</span>
        </div>
        <DiffRow label="Reference" before={form.reference} after={refValidated} kind={form.reference !== refValidated ? 'edit' : 'same'} />
        <DiffRow label="Date" before={form.date} after={form.date} kind="same" />
        <DiffRow label="Value Date" before={form.valueDate || '—'} after={form.valueDate || form.date} kind={!form.valueDate && form.date ? 'add' : 'same'} />
        <DiffRow label="Counterparty" before={form.counterparty} after={form.counterparty.trim()} kind={form.counterparty !== form.counterparty.trim() ? 'edit' : 'same'} />
        <DiffRow label="Account" before={form.bankAccountId ? (account?.name ?? form.bankAccountId) : '—'} after={account ? `${account.name} · ${account.bankName}` : '—'} kind={account && form.bankAccountId ? 'edit' : 'same'} />
        <DiffRow label="Entry Type" before={form.type} after={typeValidated} kind="edit" />
        <DiffRow label="Amount" before={String(form.amount)} after={fmtETB(Number(form.amount) || 0)} kind="edit" />
        <DiffRow label="Currency" before={form.currencyCode} after={form.currencyCode} kind="same" />
        <DiffRow label="Description" before={form.description} after={descValidated} kind={form.description !== descValidated ? 'edit' : 'same'} />
        <DiffRow label="Gross" before="—" after={fmtETB(t.gross)} kind="add" />
        <DiffRow label="VAT" before="—" after={`${fmtETB(t.vat)} (${Number(form.vatRate) || 0}%)`} kind={t.vat ? 'add' : 'same'} />
        <DiffRow label="Charges" before="—" after={fmtETB(t.charges)} kind={t.charges ? 'add' : 'same'} />
        <DiffRow label="Net Booked" before="—" after={fmtETB(t.net)} kind="add" />
        <DiffRow label="Running Bal." before={account ? fmtETB(account.computedBalance ?? 0) : '—'} after={fmtETB(t.running)} kind="add" />
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
        <ShieldCheck size={11} className="text-emerald-500" /> Validated values are auto-derived for audit accuracy. Review before submission.
      </p>
    </Modal>
  );
};

// ── Default form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: VandvForm = {
  reference: '', date: new Date().toISOString().slice(0, 10), valueDate: '',
  counterparty: '', bankAccountId: '', type: 'CREDIT', amount: '',
  currencyCode: 'ETB', description: '', bankCharges: 0, vatRate: 0, fxRate: 1, notes: '',
};

// ── Main page ────────────────────────────────────────────────────────────────

const BankingVerification: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCompanyId } = useBusiness();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<VandvForm>(EMPTY_FORM);
  const [showDiff, setShowDiff] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
  const { data: accountsRaw = [] } = useQuery({
    queryKey: ['banking-accounts', selectedCompanyId],
    queryFn: () => api.get(`/banking/accounts${cq}`).then(r => {
      const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 60_000,
  });
  const accounts: BankAccount[] = accountsRaw;

  const { errors, issues } = useMemo(() => validateForm(form), [form]);
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const account = accounts.find(a => a.id === form.bankAccountId);

  // ── Auto-save (debounced) ──────────────────────────────────────────────────
  const persist = useCallback((f: VandvForm, s: number) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form: f, step: s }));
      setLastSaved(new Date());
    } catch { /* storage full — ignore */ }
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(form, step), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [form, step, persist]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.form) setForm({ ...EMPTY_FORM, ...d.form });
      if (typeof d.step === 'number') setStep(d.step);
      setLastSaved(new Date());
    } catch { /* corrupt draft — ignore */ }
  }, []);

  const setField = useCallback((patch: Partial<VandvForm>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 0 && errorCount > 0) {
      toast.error('Fix highlighted errors before validating');
      return;
    }
    if (step === 1 && errorCount > 0) {
      toast.error('Resolve validation errors before confirming');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const goBack = () => step > 0 && setStep(step - 1);
  const jumpTo = (i: number) => i <= step && setStep(i);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setStep(0);
    setSubmitted(false);
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
    toast('Draft cleared');
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const submit = async () => {
    if (errorCount > 0) { toast.error('Cannot submit — validation failed'); return; }
    setSubmitting(true);
    try {
      const t = computeTotals(form, account);
      await api.post('/banking/transactions', {
        reference: form.reference.trim().toUpperCase(),
        date: form.date,
        valueDate: form.valueDate || form.date,
        counterparty: form.counterparty.trim(),
        bankAccountId: form.bankAccountId,
        type: form.type,
        amount: Number(form.amount),
        currencyCode: form.currencyCode,
        description: form.description.trim(),
        vatRate: Number(form.vatRate) || 0,
        bankCharges: Number(form.bankCharges) || 0,
        fxRate: Number(form.fxRate) || 1,
        notes: form.notes,
        validatedNet: t.net,
        status: 'PENDING',
        companyId: selectedCompanyId,
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
      setLastSaved(null);
      toast.success('Transaction validated & submitted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    const t = computeTotals(form, account);
    return (
      <AppPage title="Verification & Validation" icon={<ShieldCheck size={18} />} iconBg="bg-emerald-500"
        crumbs={[{ label: 'Banking', to: '/banking' }, { label: 'V&V' }]}>
        <div className="max-w-xl mx-auto py-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-500 mx-auto mb-5 shadow-sm">
            <CheckCircle2 size={30} />
          </div>
          <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Verified &amp; Submitted</h2>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1.5">
            {form.reference.trim().toUpperCase()} — {form.counterparty.trim()} · {fmtETB(t.net)} {form.currencyCode}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Btn variant="secondary" icon={<RefreshCw size={12} />} onClick={resetForm}>New Validation</Btn>
            <Btn variant="ghost" onClick={() => navigate('/banking/transactions')}>View Transactions</Btn>
          </div>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Banking V&V"
      subtitle="Guided Verification & Validation of bank transactions"
      icon={<ArrowRightLeft size={18} />}
      iconBg="bg-emerald-500"
      crumbs={[{ label: 'Banking', to: '/banking' }, { label: 'Verify & Validate' }]}
      actions={<Btn variant="ghost" size="sm" icon={<X size={12} />} onClick={() => navigate('/banking')}>Close</Btn>}
    >
      <div className="space-y-4 pb-24">
        <WizardHeader step={step} onJump={jumpTo} lastSaved={lastSaved} />

        {step === 0 && <DetailsStep form={form} errors={errors} accounts={accounts} onChange={setField} />}
        {step === 1 && <ValidateStep form={form} accounts={accounts} issues={issues} onJumpIssue={() => jumpTo(0)} />}
        {step === 2 && (
          <ConfirmStep form={form} account={account} issues={issues} onOpenDiff={() => setShowDiff(true)} />
        )}
      </div>

      {/* Split-view comparison modal */}
      {showDiff && <SplitViewCompare form={form} account={account} onClose={() => setShowDiff(false)} />}

      {/* Sticky action footer */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              errorCount
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                : step === 2
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
            }`}>
              {errorCount ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : step === 2 ? 'Ready to submit' : 'Draft'}
            </span>
          </div>
          <div className="flex-1" />
          {/* Ghosted cancel / reset — prevents accidental clicks */}
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={resetForm}>Reset</Btn>
          <Btn variant="ghost" size="sm" icon={<ChevronLeft size={12} />} disabled={step === 0} onClick={goBack}>Back</Btn>
          {step < STEPS.length - 1 ? (
            <Btn variant="primary" size="sm" icon={<ChevronRight size={12} />} onClick={goNext}>
              {step === 0 ? 'Validate' : 'Confirm'}
            </Btn>
          ) : (
            <Btn variant="primary" size="sm" icon={<ShieldCheck size={13} />} loading={submitting} onClick={submit}>
              Validate &amp; Submit
            </Btn>
          )}
        </div>
      </div>
    </AppPage>
  );
};

// ── Step 3 · Confirm (Final Review) ───────────────────────────────────────────

const ConfirmStep: React.FC<{
  form: VandvForm; account: BankAccount | undefined; issues: ValidationIssue[];
  onOpenDiff: () => void;
}> = ({ form, account, issues, onOpenDiff }) => {
  const t = computeTotals(form, account);
  const errorCount = issues.filter(i => i.severity === 'error').length;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Final Review</p>
          <Btn variant="secondary" size="sm" icon={<Eye size={12} />} onClick={onOpenDiff}>Compare Original vs Validated</Btn>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
          {[
            { l: 'Reference', v: form.reference.trim().toUpperCase() || '—' },
            { l: 'Counterparty', v: form.counterparty.trim() || '—' },
            { l: 'Account', v: account?.name ?? '—' },
            { l: 'Type', v: form.type === 'CREDIT' ? 'Credit' : 'Debit' },
            { l: 'Amount', v: fmtETB(Number(form.amount) || 0) },
            { l: 'Currency', v: form.currencyCode },
            { l: 'Net Booked', v: fmtETB(t.net) },
            { l: 'Running Bal.', v: fmtETB(t.running) },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 p-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{c.l}</p>
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{c.v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Readiness banner */}
      {errorCount > 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <p className="text-[12px] font-semibold text-rose-700 dark:text-rose-400">
            {errorCount} error{errorCount > 1 ? 's' : ''} must be resolved before submission.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
            Data is clear and validated. Submit to post this entry to the ledger.
          </p>
        </div>
      )}
    </div>
  );
};

export default BankingVerification;

