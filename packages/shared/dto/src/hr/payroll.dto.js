var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, IsNotEmpty, IsArray, } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateReimbursementClaimDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "employeeId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "destination", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "startDate", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "endDate", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "purpose", void 0);
__decorate([
    IsNumber(),
    Min(1),
    Max(3),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateReimbursementClaimDto.prototype, "locationTier", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateReimbursementClaimDto.prototype, "transportCost", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "workflowType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "candidateName", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateReimbursementClaimDto.prototype, "recoveryClause", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReimbursementClaimDto.prototype, "advanceLinkId", void 0);
export class UpdateReimbursementStatusDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], UpdateReimbursementStatusDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateReimbursementStatusDto.prototype, "approvedBy", void 0);
export class LoanRequestDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], LoanRequestDto.prototype, "employeeId", void 0);
__decorate([
    IsNumber(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], LoanRequestDto.prototype, "amount", void 0);
__decorate([
    IsNumber(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], LoanRequestDto.prototype, "installments", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], LoanRequestDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoanRequestDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoanRequestDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoanRequestDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoanRequestDto.prototype, "candidateName", void 0);
export class OtherPaymentDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], OtherPaymentDto.prototype, "employeeId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], OtherPaymentDto.prototype, "headId", void 0);
__decorate([
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], OtherPaymentDto.prototype, "amount", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], OtherPaymentDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OtherPaymentDto.prototype, "remarks", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OtherPaymentDto.prototype, "companyId", void 0);
export class OtherPaymentHeadDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], OtherPaymentHeadDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], OtherPaymentHeadDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OtherPaymentHeadDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OtherPaymentHeadDto.prototype, "companyId", void 0);
export class PayrollSummaryDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], PayrollSummaryDto.prototype, "companyId", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], PayrollSummaryDto.prototype, "month", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], PayrollSummaryDto.prototype, "year", void 0);
export class PayrollTransactionDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], PayrollTransactionDto.prototype, "employeeId", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], PayrollTransactionDto.prototype, "month", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], PayrollTransactionDto.prototype, "year", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], PayrollTransactionDto.prototype, "items", void 0);
export class PayrollBulkActionDto {
}
__decorate([
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], PayrollBulkActionDto.prototype, "ids", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], PayrollBulkActionDto.prototype, "action", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayrollBulkActionDto.prototype, "remarks", void 0);
export class CreatePayCalendarDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePayCalendarDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePayCalendarDto.prototype, "name", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreatePayCalendarDto.prototype, "startDate", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreatePayCalendarDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePayCalendarDto.prototype, "description", void 0);
export class UpdatePayCalendarDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePayCalendarDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdatePayCalendarDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdatePayCalendarDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePayCalendarDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePayCalendarDto.prototype, "status", void 0);
export class PayCalendarDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "id", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "name", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "startDate", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayCalendarDto.prototype, "status", void 0);
export class CreatePayRunDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePayRunDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePayRunDto.prototype, "payCalendarId", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], CreatePayRunDto.prototype, "month", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], CreatePayRunDto.prototype, "year", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePayRunDto.prototype, "notes", void 0);
export class UpdatePayRunDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePayRunDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePayRunDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdatePayRunDto.prototype, "paidAt", void 0);
export class PayRunDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayRunDto.prototype, "id", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayRunDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayRunDto.prototype, "payCalendarId", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], PayRunDto.prototype, "month", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], PayRunDto.prototype, "year", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], PayRunDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayRunDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], PayRunDto.prototype, "paidAt", void 0);
export class PayRunEmployeeDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], PayRunEmployeeDto.prototype, "payRunId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], PayRunEmployeeDto.prototype, "employeeId", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], PayRunEmployeeDto.prototype, "grossAmount", void 0);
__decorate([
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], PayRunEmployeeDto.prototype, "netAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayRunEmployeeDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayRunEmployeeDto.prototype, "paymentReference", void 0);
export class CreateAssetAllocationDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "employeeId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "assetType", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "assetName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "serialNumber", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "allocatedAt", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "returnDueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAssetAllocationDto.prototype, "notes", void 0);
export class UpdateAssetAllocationDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAssetAllocationDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateAssetAllocationDto.prototype, "returnedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAssetAllocationDto.prototype, "condition", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAssetAllocationDto.prototype, "notes", void 0);
export class AssetAllocationDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "id", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "employeeId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "assetType", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "assetName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "serialNumber", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "allocatedAt", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "returnDueDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "returnedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "condition", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AssetAllocationDto.prototype, "companyId", void 0);
