import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReimbursementClaimDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsString() @IsNotEmpty() destination: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsString() @IsNotEmpty() purpose: string;
  @IsNumber() @Min(1) @Max(3) @Type(() => Number) locationTier: number;
  @IsOptional() @IsNumber() @Type(() => Number) transportCost?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() companyId?: string;
  /** EMPLOYEE_EXPENSE | CANDIDATE_REIMBURSEMENT | AGENCY_INVOICE */
  @IsOptional() @IsString() workflowType?: string;
  /** External candidate name — required when workflowType = CANDIDATE_REIMBURSEMENT */
  @IsOptional() @IsString() candidateName?: string;
  /** True if a cost recovery clause exists in the offer letter (Workflow B) */
  @IsOptional() recoveryClause?: boolean;
  /** FK to LoanRequest.id — set when claim converts to a staff advance (Workflow B) */
  @IsOptional() @IsString() advanceLinkId?: string;
}

export class UpdateReimbursementStatusDto {
  @IsString() @IsNotEmpty() status: 'APPROVED' | 'REJECTED' | 'PAID';
  @IsOptional() @IsString() approvedBy?: string;
}

export class LoanRequestDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsNumber() @Min(1) @Type(() => Number) amount: number;
  @IsNumber() @Min(1) @Type(() => Number) installments: number;
  @IsDateString() startDate: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() companyId?: string;
  /** LOAN | ADVANCE | RECRUITMENT_ADVANCE */
  @IsOptional() @IsString() category?: string;
  /** External candidate name — required when category = RECRUITMENT_ADVANCE */
  @IsOptional() @IsString() candidateName?: string;
}

export class OtherPaymentDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsString() @IsNotEmpty() headId: string;
  @IsNumber() @Min(0) @Type(() => Number) amount: number;
  @IsDateString() date: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() companyId?: string;
}

export class OtherPaymentHeadDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() type: 'EARNING' | 'DEDUCTION';
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() companyId?: string;
}

export class PayrollSummaryDto {
  @IsString() @IsNotEmpty() companyId: string;
  @IsNumber() @Type(() => Number) month: number;
  @IsNumber() @Type(() => Number) year: number;
}

export class PayrollTransactionDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsNumber() @Type(() => Number) month: number;
  @IsNumber() @Type(() => Number) year: number;
  @IsOptional() @IsArray() @IsString({ each: true }) items?: string[];
}

export class PayrollBulkActionDto {
  @IsArray() @IsString({ each: true }) ids: string[];
  @IsString() @IsNotEmpty() action: 'APPROVE' | 'REJECT' | 'SUBMIT';
  @IsOptional() @IsString() remarks?: string;
}

export class CreatePayCalendarDto {
  @IsString() @IsNotEmpty() companyId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdatePayCalendarDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
}

export class PayCalendarDto {
  @IsString() id: string;
  @IsString() companyId: string;
  @IsString() name: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
}

export class CreatePayRunDto {
  @IsString() @IsNotEmpty() companyId: string;
  @IsString() @IsNotEmpty() payCalendarId: string;
  @IsNumber() @Type(() => Number) month: number;
  @IsNumber() @Type(() => Number) year: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePayRunDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() paidAt?: string;
}

export class PayRunDto {
  @IsString() id: string;
  @IsString() companyId: string;
  @IsString() payCalendarId: string;
  @IsNumber() month: number;
  @IsNumber() year: number;
  @IsString() status: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() paidAt?: string;
}

export class PayRunEmployeeDto {
  @IsString() @IsNotEmpty() payRunId: string;
  @IsString() @IsNotEmpty() employeeId: string;
  @IsNumber() @Type(() => Number) grossAmount: number;
  @IsNumber() @Type(() => Number) netAmount: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() paymentReference?: string;
}

export class CreateAssetAllocationDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsString() @IsNotEmpty() assetType: string;
  @IsString() @IsNotEmpty() assetName: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsDateString() allocatedAt: string;
  @IsOptional() @IsDateString() returnDueDate?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAssetAllocationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() returnedAt?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() notes?: string;
}

export class AssetAllocationDto {
  @IsString() id: string;
  @IsString() employeeId: string;
  @IsString() assetType: string;
  @IsString() assetName: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsDateString() allocatedAt: string;
  @IsOptional() @IsDateString() returnDueDate?: string;
  @IsOptional() @IsDateString() returnedAt?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() companyId?: string;
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
