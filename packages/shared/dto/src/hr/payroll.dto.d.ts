export declare class CreateReimbursementClaimDto {
    employeeId: string;
    destination: string;
    startDate: string;
    endDate: string;
    purpose: string;
    locationTier: number;
    transportCost?: number;
    notes?: string;
    companyId?: string;
    /** EMPLOYEE_EXPENSE | CANDIDATE_REIMBURSEMENT | AGENCY_INVOICE */
    workflowType?: string;
    /** External candidate name — required when workflowType = CANDIDATE_REIMBURSEMENT */
    candidateName?: string;
    /** True if a cost recovery clause exists in the offer letter (Workflow B) */
    recoveryClause?: boolean;
    /** FK to LoanRequest.id — set when claim converts to a staff advance (Workflow B) */
    advanceLinkId?: string;
}
export declare class UpdateReimbursementStatusDto {
    status: 'APPROVED' | 'REJECTED' | 'PAID';
    approvedBy?: string;
}
export declare class LoanRequestDto {
    employeeId: string;
    amount: number;
    installments: number;
    startDate: string;
    reason?: string;
    companyId?: string;
    /** LOAN | ADVANCE | RECRUITMENT_ADVANCE */
    category?: string;
    /** External candidate name — required when category = RECRUITMENT_ADVANCE */
    candidateName?: string;
}
export declare class OtherPaymentDto {
    employeeId: string;
    headId: string;
    amount: number;
    date: string;
    remarks?: string;
    companyId?: string;
}
export declare class OtherPaymentHeadDto {
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    description?: string;
    companyId?: string;
}
export declare class PayrollSummaryDto {
    companyId: string;
    month: number;
    year: number;
}
export declare class PayrollTransactionDto {
    employeeId: string;
    month: number;
    year: number;
    items?: string[];
}
export declare class PayrollBulkActionDto {
    ids: string[];
    action: 'APPROVE' | 'REJECT' | 'SUBMIT';
    remarks?: string;
}
export declare class CreatePayCalendarDto {
    companyId: string;
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
}
export declare class UpdatePayCalendarDto {
    name?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    status?: string;
}
export declare class PayCalendarDto {
    id: string;
    companyId: string;
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
    status?: string;
}
export declare class CreatePayRunDto {
    companyId: string;
    payCalendarId: string;
    month: number;
    year: number;
    notes?: string;
}
export declare class UpdatePayRunDto {
    status?: string;
    notes?: string;
    paidAt?: string;
}
export declare class PayRunDto {
    id: string;
    companyId: string;
    payCalendarId: string;
    month: number;
    year: number;
    status: string;
    notes?: string;
    paidAt?: string;
}
export declare class PayRunEmployeeDto {
    payRunId: string;
    employeeId: string;
    grossAmount: number;
    netAmount: number;
    status?: string;
    paymentReference?: string;
}
export declare class CreateAssetAllocationDto {
    employeeId: string;
    assetType: string;
    assetName: string;
    serialNumber?: string;
    allocatedAt: string;
    returnDueDate?: string;
    companyId?: string;
    notes?: string;
}
export declare class UpdateAssetAllocationDto {
    status?: string;
    returnedAt?: string;
    condition?: string;
    notes?: string;
}
export declare class AssetAllocationDto {
    id: string;
    employeeId: string;
    assetType: string;
    assetName: string;
    serialNumber?: string;
    allocatedAt: string;
    returnDueDate?: string;
    returnedAt?: string;
    status?: string;
    condition?: string;
    notes?: string;
    companyId?: string;
}
export interface PayrollFilters {
    arrearTypeId?: string;
    status?: string;
    employeeId?: string;
    year?: number;
    month?: number;
    category?: string;
}
export interface LoanStats {
    total: number;
    pending: number;
    approved: number;
    closed: number;
    totalOutstanding: number;
}
export interface ReimbursementStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalApprovedAmount: number;
}
//# sourceMappingURL=payroll.dto.d.ts.map