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
    period: string;
    employeeCount: number;
    totalGrossSalary: number;
    totalPit: number;
    totalEmpPension: number;
    totalEmpRPension: number;
    totalDrrf: number;
    netPayableErca: number;
    netPayablePfsa: number;
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
    period: string;
    employeeCount: number;
    totalInsurableEarnings: number;
    employeeContrib: number;
    employerContrib: number;
    totalContrib: number;
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
    dueDate: string;
}
/** MoR (Ministry of Revenues) late penalty for PAYE — 5% per month, max 25%
 *  (Federal Income Tax Proclamation No. 979/2016, Tax Administration Proc. No. 983/2016, s.26.2)
 *  Portal: etax.mor.gov.et — formerly remitted to ERCA */
export declare function calcPayeLessPenalty(amount: number, monthsLate: number): number;
/** PFSA late penalty — 5% per month */
export declare function calcPensionLatePenalty(amount: number, monthsLate: number): number;
/** Get PAYE due date — last day of the month following the payroll period */
export declare function getPayeDueDate(period: string): Date;
//# sourceMappingURL=paye-pension.types.d.ts.map