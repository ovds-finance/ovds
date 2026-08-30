/**
 * PAYE Declaration & Pension Remittance Types — @ovds/shared
 * Ethiopian payroll tax compliance:
 *   - PAYE (PIT + DRRF) → Ministry of Revenues (MoR), due last day of following month
 *     Submit via: etax.mor.gov.et (formerly remitted to ERCA)
 *   - Pension (7% employee + 11% employer) → PFSA, due 30th of following month
 * Based on Federal Income Tax Proclamation No. 979/2016 and PFSA regulations.
 *
 * NOTE: "ERCA" (Ethiopian Revenues and Customs Authority) was officially
 * restructured as the Ministry of Revenues (MoR) under Proclamation No. 1097/2018.
 * Field names prefixed with `erca` are kept for DB backward-compatibility.
 */

export type PayeStatus = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'OVERDUE';
export type PensionStatus = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'OVERDUE';

export interface PayeDeclaration {
  id: string;
  companyId?: string | null;
  period: string;             // YYYY-MM
  employeeCount: number;
  totalGrossSalary: number;
  totalPit: number;           // Personal Income Tax
  totalEmpPension: number;    // Employee pension 7%
  totalEmpRPension: number;   // Employer pension 11%
  totalDrrf: number;          // DRRF 1%
  netPayableErca: number;     // PIT + DRRF → Ministry of Revenues (MoR) via etax.mor.gov.et
  netPayablePfsa: number;     // Employee + Employer pension → PFSA
  status: PayeStatus;
  dueDate?: string | null;
  submittedAt?: string | null;
  /** MoR reference number for submitted PAYE (formerly ercaReference — kept for DB compat) */
  ercaReference?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PensionRemittance {
  id: string;
  companyId?: string | null;
  period: string;             // YYYY-MM
  employeeCount: number;
  totalInsurableEarnings: number;
  employeeContrib: number;    // 7%
  employerContrib: number;    // 11%
  totalContrib: number;       // 18%
  status: PensionStatus;
  dueDate?: string | null;
  submittedAt?: string | null;
  pfsaReference?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  bankName?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Aggregate from payroll records to build a PAYE declaration */
export interface PayeDeclarationSummary {
  period: string;
  employeeCount: number;
  totalGrossSalary: number;
  totalPit: number;
  totalEmpPension: number;
  totalEmpRPension: number;
  totalDrrf: number;
  netPayableErca: number;
  netPayablePfsa: number;
  dueDate: string;            // Last day of following month
}

/** MoR (Ministry of Revenues) late penalty for PAYE — 5% per month, max 25%
 *  (Federal Income Tax Proclamation No. 979/2016, Tax Administration Proc. No. 983/2016, s.26.2)
 *  Portal: etax.mor.gov.et — formerly remitted to ERCA */
export function calcPayeLessPenalty(amount: number, monthsLate: number): number {
  return Math.round(amount * 0.05 * monthsLate * 100) / 100;
}

/** PFSA late penalty — 5% per month */
export function calcPensionLatePenalty(amount: number, monthsLate: number): number {
  return Math.round(amount * 0.05 * monthsLate * 100) / 100;
}

/** Get PAYE due date — last day of the month following the payroll period */
export function getPayeDueDate(period: string): Date {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m, 0); // day 0 of month m+1 = last day of month m
}
