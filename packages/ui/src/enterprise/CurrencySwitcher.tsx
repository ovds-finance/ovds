/**
 * @ovds/ui — CurrencySwitcher
 *
 * Multi-currency switcher for enterprise applications.
 * Displays available currencies with:
 *   - Live FX rate indicators
 *   - Base currency highlight
 *   - Quick conversion preview
 *   - Entity-linked currency context
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DollarSign, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';
import type { CurrencyRate, CurrencyDisplayOptions } from './types';

export interface CurrencySwitcherProps {
  currentCurrency: string;
  availableCurrencies: string[];
  rates: CurrencyRate[];
  displayOptions: CurrencyDisplayOptions;
  onSwitch: (currency: string) => void;
  baseCurrency?: string;
  disabled?: boolean;
  className?: string;
  showRate?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ETB: 'Br', USD: '$', EUR: '€', GBP: '£', SAR: '﷼', AED: 'د.إ',
  KES: 'KSh', UGX: 'USh', TZS: 'TSh', CNY: '¥', JPY: '¥',
  CHF: 'Fr', CAD: 'C$', AUD: 'A$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  INR: '₹', ZAR: 'R', EGP: 'E£', RWF: 'RWF', XOF: 'CFA',
};

export function CurrencySwitcher({
  currentCurrency,
  availableCurrencies,
  rates,
  displayOptions,
  onSwitch,
  baseCurrency = 'ETB',
  disabled = false,
  className,
  showRate = true,
}: CurrencySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const currentRate = useMemo(() => {
    if (currentCurrency === baseCurrency || !showRate) return null;
    const rate = rates.find((r) => r.fromCurrency === baseCurrency && r.toCurrency === currentCurrency);
    if (rate) return rate.rate;
    const inverse = rates.find((r) => r.fromCurrency === currentCurrency && r.toCurrency === baseCurrency);
    if (inverse && inverse.rate !== 0) return 1 / inverse.rate;
    return null;
  }, [currentCurrency, baseCurrency, rates, showRate]);

  const symbol = CURRENCY_SYMBOLS[currentCurrency] ?? currentCurrency;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all',
          currentCurrency === baseCurrency
            ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[var(--pro-azure)] dark:hover:border-[var(--pro-azure)]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <DollarSign size={14} className={currentCurrency === baseCurrency ? 'text-[var(--pro-azure)]' : 'text-slate-400'} />
        <span>{symbol}</span>
        <span className="text-[10px] font-mono text-slate-400">{currentCurrency}</span>
        {currentRate !== null && showRate && (
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
            <TrendingUp size={8} />
            {currentRate.toFixed(4)}
          </span>
        )}
        <ChevronDown size={12} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Display Currency</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Base: {baseCurrency}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/30 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
              <DollarSign size={14} />
            </div>
          </div>

          <div className="p-2 max-h-[300px] overflow-y-auto">
            {availableCurrencies.map((currency) => {
              const isSelected = currency === currentCurrency;
              const rate = currency === baseCurrency ? 1 : (() => {
                const r = rates.find((rt) => rt.fromCurrency === baseCurrency && rt.toCurrency === currency);
                if (r) return r.rate;
                const inv = rates.find((rt) => rt.fromCurrency === currency && rt.toCurrency === baseCurrency);
                if (inv && inv.rate !== 0) return 1 / inv.rate;
                return null;
              })();
              const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

              return (
                <button
                  key={currency}
                  onClick={() => {
                    onSwitch(currency);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                    isSelected
                      ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-mono text-[11px] font-bold',
                    isSelected
                      ? 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure)]-900/50 text-[var(--pro-azure)] dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                  )}>
                    {currency.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{currency}</span>
                      {currency === baseCurrency && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[var(--pro-azure-100)] dark:bg-green-900/50 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
                          Base
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{symbol}</span>
                  </div>
                  {rate !== null && currency !== baseCurrency && showRate && (
                    <div className="text-right">
                      <p className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">{rate.toFixed(4)}</p>
                      <p className="text-[9px] text-slate-400">per {baseCurrency}</p>
                    </div>
                  )}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--pro-azure)] dark:bg-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
