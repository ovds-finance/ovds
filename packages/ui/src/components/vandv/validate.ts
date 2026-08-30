/**
 * Verification & Validation helpers — shared types, validators, and diff logic
 * for the OVDS Ovds-style V&V process screen.
 *
 * The V&V screen guides a user through: Intake → Validate → Confirm, with the
 * goal of absolute data clarity and error prevention before a regulated record
 * (tax invoice, journal entry, reconciliation) is submitted to the ledger / e-Tax.
 */
import React from 'react';

export type VVValue = string | number | null | undefined;

export type VVStepId = 'details' | 'validate' | 'confirm';

export interface VVField {
  key: string;
  label: string;
  value: VVValue;
  type?: 'text' | 'number' | 'currency' | 'date' | 'tin' | 'email' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Hidden behind the "Advanced Options" progressive-disclosure toggle */
  advanced?: boolean;
  /** Double-entry cue: tints the field green (inflow) or red/gray (outflow) */
  side?: 'debit' | 'credit';
  placeholder?: string;
  hint?: string;
  /** Returns an error message (or null when valid). Runs against all values. */
  validate?: (value: VVValue, all: Record<string, VVValue>) => string | null;
}

export type VVValues = Record<string, VVValue>;

// -- Built-in validators ------------------------------------------------------

export const vvIsEmpty = (v: VVValue): boolean =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

export const vvRequired = (v: VVValue): string | null =>
  vvIsEmpty(v) ? 'This field is required' : null;

export const vvIsValidTin = (v: VVValue): string | null => {
  if (vvIsEmpty(v)) return null;
  const s = String(v).replace(/\s/g, '');
  // Must match the MoR e-Tax rule enforced by the backend (VandvComplianceService).
  return /^\d{15}$/.test(s) ? null : 'Invalid TIN (expect 15 digits)';
};

export const vvIsPositiveNumber = (v: VVValue): string | null => {
  if (vvIsEmpty(v)) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return 'Must be a number';
  return n >= 0 ? null : 'Value cannot be negative';
};

export const vvMaxLength = (max: number) => (v: VVValue): string | null => {
  if (vvIsEmpty(v)) return null;
  return String(v).length > max ? `Exceeds ${max} characters` : null;
};

/** Run every field's built-in + custom validation. Returns keyed error map. */
export function validateVV(
  fields: VVField[],
  values: VVValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    let err: string | null = null;
    if (f.required) err = vvRequired(values[f.key]);
    if (!err) {
      switch (f.type) {
        case 'tin':
          err = vvIsValidTin(values[f.key]);
          break;
        case 'email':
          if (!vvIsEmpty(values[f.key]) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(values[f.key])))
            err = 'Invalid email format';
          break;
        case 'number':
        case 'currency':
          err = vvIsPositiveNumber(values[f.key]);
          break;
        default:
          break;
      }
    }
    if (!err && f.validate) err = f.validate(values[f.key], values);
    if (err) errors[f.key] = err;
  }
  return errors;
}

export type DiffStatus = 'added' | 'edited' | 'removed' | 'unchanged';

export interface FieldDiff {
  key: string;
  label: string;
  original: VVValue;
  validated: VVValue;
  status: DiffStatus;
}

const norm = (v: VVValue): string =>
  v === null || v === undefined ? '' : String(v).trim();

/** Build the Original-vs-Validated diff used by the Final Review split view. */
export function diffVV(
  fields: VVField[],
  original: VVValues | undefined,
  validated: VVValues,
): FieldDiff[] {
  const base = original ?? {};
  return fields.map((f) => {
    const o = base[f.key];
    const v = validated[f.key];
    let status: DiffStatus;
    if (vvIsEmpty(o) && !vvIsEmpty(v)) status = 'added';
    else if (!vvIsEmpty(o) && vvIsEmpty(v)) status = 'removed';
    else if (norm(o) !== norm(v)) status = 'edited';
    else status = 'unchanged';
    return { key: f.key, label: f.label, original: o, validated: v, status };
  });
}

/** Sum of debit/credit sides when fields carry a double-entry `side`. */
export function doubleEntryTotals(fields: VVField[], values: VVValues) {
  let debit = 0;
  let credit = 0;
  for (const f of fields) {
    if (!f.side) continue;
    const n = typeof values[f.key] === 'number'
      ? (values[f.key] as number)
      : parseFloat(String(values[f.key] ?? ''));
    if (Number.isNaN(n)) continue;
    if (f.side === 'debit') debit += n;
    else credit += n;
  }
  return { debit, credit, balance: debit - credit, balanced: Math.abs(debit - credit) < 0.005 };
}

export const fmtVV = (v: VVValue, currency = 'ETB'): string => {
  if (vvIsEmpty(v)) return '—';
  if (typeof v === 'number') {
    return `${currency} ${v.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return String(v);
};

// -- Guided validation checklist ---------------------------------------------

export interface VVCheck {
  key: string;
  label: string;
  pass: boolean;
  detail?: string;
}

/**
 * Build a short, human-readable list of logical validation checks from the
 * current field state + double-entry totals. Drives the VVChecklist shown on
 * the Verification step so users can see exactly what blocks submission.
 */
export function vvBuildChecks(
  fields: VVField[],
  values: VVValues,
  errors: Record<string, string>,
  totals: { debit: number; credit: number; balance: number; balanced: boolean },
): VVCheck[] {
  const checks: VVCheck[] = [];

  const requiredMissing = fields.filter((f) => f.required && vvIsEmpty(values[f.key]));
  checks.push({
    key: 'required',
    label: 'All required fields completed',
    pass: requiredMissing.length === 0,
    detail: requiredMissing.length ? `${requiredMissing.length} missing` : undefined,
  });

  const tinFields = fields.filter((f) => f.type === 'tin');
  for (const f of tinFields) {
    const ok = !errors[f.key];
    checks.push({
      key: `tin-${f.key}`,
      label: `${f.label} is valid`,
      pass: ok,
      detail: ok ? undefined : errors[f.key],
    });
  }

  const hasSide = fields.some((f) => f.side);
  if (hasSide && (totals.debit > 0 || totals.credit > 0)) {
    checks.push({
      key: 'balanced',
      label: 'Double-entry is balanced (debits = credits)',
      pass: totals.balanced,
      detail: totals.balanced ? undefined : `Diff ${fmtVV(totals.balance)}`,
    });
  }

  if (hasSide) {
    checks.push({
      key: 'debit-captured',
      label: 'Debit (inflow) amount captured',
      pass: totals.debit > 0,
    });
    checks.push({
      key: 'credit-captured',
      label: 'Credit (outflow) amount captured',
      pass: totals.credit > 0,
    });
  }

  return checks;
}
