var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsNotEmpty, IsIn, Min, Max, ArrayNotEmpty, ValidateNested, IsUUID, ArrayMinSize, ArrayMaxSize, MaxLength, IsEmail, IsInt, IsDateString, IsBoolean, } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceMethod, AttendanceStatus, BiometricType, LeaveType, LeaveStatus, } from '@ovds/shared/types';
import { PaginationQueryDto } from '../common/pagination.dto';
export class EmployeeQueryDto extends PaginationQueryDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], EmployeeQueryDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], EmployeeQueryDto.prototype, "employmentNature", void 0);
// -- Payroll Enums ------------------------------------------------------------
export var PayrollStatus;
(function (PayrollStatus) {
    PayrollStatus["GENERATED"] = "GENERATED";
    PayrollStatus["VERIFIED"] = "VERIFIED";
    PayrollStatus["FINALIZED"] = "FINALIZED";
    PayrollStatus["APPROVED"] = "APPROVED";
    PayrollStatus["PAID"] = "PAID";
})(PayrollStatus || (PayrollStatus = {}));
// -- Payroll DTOs -------------------------------------------------------------
export class GenerateSalaryDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], GenerateSalaryDto.prototype, "employeeId", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(1),
    Max(12),
    __metadata("design:type", Number)
], GenerateSalaryDto.prototype, "month", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(2000),
    Max(2100),
    __metadata("design:type", Number)
], GenerateSalaryDto.prototype, "year", void 0);
export class ApprovePayrollDto {
}
__decorate([
    IsArray(),
    ArrayNotEmpty(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], ApprovePayrollDto.prototype, "payrollIds", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ApprovePayrollDto.prototype, "notes", void 0);
export class PayrollFilterDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayrollFilterDto.prototype, "employeeId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Max(12),
    __metadata("design:type", Number)
], PayrollFilterDto.prototype, "month", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(2000),
    Max(2100),
    __metadata("design:type", Number)
], PayrollFilterDto.prototype, "year", void 0);
__decorate([
    IsOptional(),
    IsEnum(PayrollStatus),
    __metadata("design:type", String)
], PayrollFilterDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], PayrollFilterDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Max(500),
    __metadata("design:type", Number)
], PayrollFilterDto.prototype, "take", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayrollFilterDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayrollFilterDto.prototype, "subsidiary", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayrollFilterDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PayrollFilterDto.prototype, "companyId", void 0);
export class BulkUploadDto {
}
__decorate([
    IsArray(),
    ArrayNotEmpty(),
    ValidateNested({ each: true }),
    Type(() => GenerateSalaryDto),
    __metadata("design:type", Array)
], BulkUploadDto.prototype, "salaries", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], BulkUploadDto.prototype, "notes", void 0);
export class BulkWorkflowDto {
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(1000),
    IsString({ each: true }),
    __metadata("design:type", Array)
], BulkWorkflowDto.prototype, "employeeIds", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], BulkWorkflowDto.prototype, "status", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(2000),
    Max(2100),
    __metadata("design:type", Number)
], BulkWorkflowDto.prototype, "year", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(12),
    __metadata("design:type", Number)
], BulkWorkflowDto.prototype, "month", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['salary', 'increment', 'arrear']),
    __metadata("design:type", String)
], BulkWorkflowDto.prototype, "type", void 0);
export class UpdateRecordStatusDto {
}
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateRecordStatusDto.prototype, "status", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(2000),
    Max(2100),
    __metadata("design:type", Number)
], UpdateRecordStatusDto.prototype, "year", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(12),
    __metadata("design:type", Number)
], UpdateRecordStatusDto.prototype, "month", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateRecordStatusDto.prototype, "notes", void 0);
// -- Employee DTOs -------------------------------------------------------------
export class CreateEmployeeDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "firstName", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "lastName", void 0);
__decorate([
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "employeeId", void 0);
__decorate([
    IsUUID(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", Object)
], CreateEmployeeDto.prototype, "shiftId", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "baseSalary", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "hourlyRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "pensionRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "employerPensionRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "incomeTaxRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "employeeContribution", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "employerContribution", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "loanBalance", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "loanMonthlyDeduction", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "monthlyDeductions", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "leaveEntitlement", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "employmentNature", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "cadre", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "designation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "dateOfNextIncrement", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "payrollStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "subsidiary", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "transferReason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "lastTransferDate", void 0);
export class UpdateEmployeeDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "firstName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "lastName", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "employeeId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "payrollStatus", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", Object)
], UpdateEmployeeDto.prototype, "shiftId", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "baseSalary", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "hourlyRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "pensionRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "employerPensionRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "incomeTaxRate", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "employeeContribution", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "employerContribution", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "loanBalance", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "loanMonthlyDeduction", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "monthlyDeductions", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "leaveEntitlement", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "employmentNature", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "cadre", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "designation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "dateOfNextIncrement", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "subsidiary", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "transferReason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "lastTransferDate", void 0);
// -- Attendance DTOs ----------------------------------------------------------
export class CreateAttendanceDto {
}
__decorate([
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "employeeId", void 0);
__decorate([
    IsOptional(),
    IsEnum(AttendanceMethod),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "method", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "checkIn", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "checkOut", void 0);
__decorate([
    IsOptional(),
    IsEnum(AttendanceStatus),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateAttendanceDto.prototype, "latitude", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateAttendanceDto.prototype, "longitude", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAttendanceDto.prototype, "deviceInfo", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateAttendanceDto.prototype, "verified", void 0);
export class UpdateAttendanceDto {
}
__decorate([
    IsOptional(),
    IsEnum(AttendanceMethod),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "method", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "checkIn", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "checkOut", void 0);
__decorate([
    IsOptional(),
    IsEnum(AttendanceStatus),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateAttendanceDto.prototype, "latitude", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateAttendanceDto.prototype, "longitude", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "deviceInfo", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateAttendanceDto.prototype, "verified", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAttendanceDto.prototype, "verifiedBy", void 0);
export class CheckInDto {
}
__decorate([
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CheckInDto.prototype, "template", void 0);
__decorate([
    IsEnum(BiometricType),
    __metadata("design:type", String)
], CheckInDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CheckInDto.prototype, "latitude", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CheckInDto.prototype, "longitude", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CheckInDto.prototype, "deviceInfo", void 0);
export class CheckOutDto {
}
__decorate([
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CheckOutDto.prototype, "template", void 0);
__decorate([
    IsEnum(BiometricType),
    __metadata("design:type", String)
], CheckOutDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CheckOutDto.prototype, "latitude", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CheckOutDto.prototype, "longitude", void 0);
// -- Leaves DTOs --------------------------------------------------------------
export class ApplyLeaveDto {
}
__decorate([
    IsEnum(LeaveType),
    IsNotEmpty(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "type", void 0);
__decorate([
    IsDateString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "startDate", void 0);
__decorate([
    IsDateString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "endDate", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "reason", void 0);
export class UpdateLeaveDto {
}
__decorate([
    IsEnum(LeaveType),
    IsOptional(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "type", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "startDate", void 0);
__decorate([
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "endDate", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "reason", void 0);
__decorate([
    IsEnum(LeaveStatus),
    IsOptional(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "status", void 0);
export class BulkLeaveActionDto {
}
__decorate([
    IsArray(),
    ArrayNotEmpty(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], BulkLeaveActionDto.prototype, "ids", void 0);
__decorate([
    IsEnum(['approve', 'reject']),
    __metadata("design:type", String)
], BulkLeaveActionDto.prototype, "action", void 0);
