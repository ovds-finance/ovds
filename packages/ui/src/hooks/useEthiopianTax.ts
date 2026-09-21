/**
 * useEthiopianTax — React hook wrapping Ethiopian tax calculations
 * Memoized, reactive, zero-dependency on external state
 */
import { useMemo } from 'react';
import {
  calculatePIT,
  calcWHT,
  calculateBIT,
  fmtETB,
  ETH_TAX,
  getEthFiscalYear,
  getVatPeriod,
  isVatRegistered,
  type PitResult,
  type WhtType,
} from '@ovds/shared';
import { calcVAT, type VatResult } from '@ovds/shared/ovds/tax-calc';

export interface TaxLineItem {
  amount: number;
  vatApplicable?: boolean;
  whtType?: WhtType;
  whtApplicable?: boolean;
}

export interface TaxSummary {
  subtotal: number;
  vatAmount: number;
  whtAmount: number;
  grossTotal: number;
  netPayable: number;
  vatRate: number;
  fiscalYear: string;
  vatPeriod: string;
}

export function useEthiopianTax() {
  const fiscalYear = useMemo(() => getEthFiscalYear(), []);
  const vatPeriod  = useMemo(() => getVatPeriod(), []);

  /** Calculate VAT on a single amount */
  const vat = useMemo(() => (amount: number, inclusive = false): VatResult =>
    calcVAT(amount, inclusive), []);

  /** Calculate PIT for a gross salary */
  const pit = useMemo(() => (grossSalary: number): PitResult =>
    calculatePIT(grossSalary), []);

  /** Calculate WHT for a payment */
  const wht = useMemo(() => (amount: number, type: WhtType = 'GOODS') =>
    calcWHT(amount, type), []);

  /** Calculate BIT for annual profit */
  const bit = useMemo(() => (annualProfit: number) =>
    calculateBIT(annualProfit), []);

  /** Summarise tax across multiple line items */
  const summarise = useMemo(() => (items: TaxLineItem[]): TaxSummary => {
    let subtotal   = 0;
    let vatAmount  = 0;
    let whtAmount  = 0;

    for (const item of items) {
      subtotal += item.amount;
      if (item.vatApplicable !== false) {
        vatAmount += item.amount * ETH_TAX.VAT_RATE;
      }
      if (item.whtApplicable && item.whtType) {
        const { whtAmount: w } = calcWHT(item.amount, item.whtType);
        whtAmount += w;
      }
    }

    const grossTotal = subtotal + vatAmount;
    const netPayable = grossTotal - whtAmount;

    return {
      subtotal,
      vatAmount,
      whtAmount,
      grossTotal,
      netPayable,
      vatRate: ETH_TAX.VAT_RATE,
      fiscalYear,
      vatPeriod,
    };
  }, [fiscalYear, vatPeriod]);

  return {
    vat,
    pit,
    wht,
    bit,
    summarise,
    fmtETB,
    ETH_TAX,
    fiscalYear,
    vatPeriod,
    isVatRegistered,
    VAT_RATE:         ETH_TAX.VAT_RATE,
    WHT_GOODS:        ETH_TAX.WHT_GOODS_RATE,
    WHT_SERVICES:     ETH_TAX.WHT_SERVICE_RATE,
    PENSION_EMP:      ETH_TAX.PENSION_EMPLOYEE,
    PENSION_EMP_RATE: ETH_TAX.PENSION_EMPLOYER,
    DRRF_RATE:        ETH_TAX.DRRF_RATE,
  };
}
