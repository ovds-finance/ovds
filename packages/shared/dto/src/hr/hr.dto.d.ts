import { AttendanceMethod, AttendanceStatus, BiometricType, LeaveType, LeaveStatus } from '@ovds/shared/types';
import { PaginationQueryDto } from '../common/pagination.dto';
export declare class EmployeeQueryDto extends PaginationQueryDto {
    businessType?: string;
    employmentNature?: string;
}
export declare enum PayrollStatus {
    GENERATED = "GENERATED",
    VERIFIED = "VERIFIED",
    FINALIZED = "FINALIZED",
    APPROVED = "APPROVED",
    PAID = "PAID"
}
export declare class GenerateSalaryDto {
    employeeId: string;
    month: number;
    year: number;
}
export declare class ApprovePayrollDto {
    payrollIds: string[];
    notes?: string;
}
export declare class PayrollFilterDto {
    employeeId?: string;
    month?: number;
    year?: number;
    status?: PayrollStatus;
    page?: number;
    take?: number;
    departmentId?: string;
    subsidiary?: string;
    search?: string;
    companyId?: string;
}
export declare class BulkUploadDto {
    salaries: GenerateSalaryDto[];
    notes?: string;
}
export declare class BulkWorkflowDto {
    employeeIds: string[];
    status: string;
    year: number;
    month: number;
    type?: string;
}
export declare class UpdateRecordStatusDto {
    status: string;
    year: number;
    month: number;
    notes?: string;
}
export declare class CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    departmentId: string;
    businessType?: string;
    companyId?: string;
    shiftId?: string | null;
    baseSalary?: number;
    hourlyRate?: number;
    pensionRate?: number;
    employerPensionRate?: number;
    incomeTaxRate?: number;
    employeeContribution?: number;
    employerContribution?: number;
    loanBalance?: number;
    loanMonthlyDeduction?: number;
    monthlyDeductions?: number;
    leaveEntitlement?: number;
    employmentNature?: string;
    cadre?: string;
    designation?: string;
    dateOfNextIncrement?: string;
    payrollStatus?: string;
    subsidiary?: string;
    transferReason?: string;
    lastTransferDate?: string;
}
export declare class UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
    departmentId?: string;
    businessType?: string;
    companyId?: string;
    payrollStatus?: string;
    shiftId?: string | null;
    baseSalary?: number;
    hourlyRate?: number;
    pensionRate?: number;
    employerPensionRate?: number;
    incomeTaxRate?: number;
    employeeContribution?: number;
    employerContribution?: number;
    loanBalance?: number;
    loanMonthlyDeduction?: number;
    monthlyDeductions?: number;
    leaveEntitlement?: number;
    employmentNature?: string;
    cadre?: string;
    designation?: string;
    dateOfNextIncrement?: string;
    subsidiary?: string;
    transferReason?: string;
    lastTransferDate?: string;
}
export declare class CreateAttendanceDto {
    employeeId: string;
    method?: AttendanceMethod;
    checkIn?: string;
    checkOut?: string;
    status?: AttendanceStatus;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
    verified?: boolean;
}
export declare class UpdateAttendanceDto {
    method?: AttendanceMethod;
    checkIn?: string;
    checkOut?: string;
    status?: AttendanceStatus;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
    verified?: boolean;
    verifiedBy?: string;
}
export declare class CheckInDto {
    template: string;
    type: BiometricType;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
}
export declare class CheckOutDto {
    template: string;
    type: BiometricType;
    latitude?: number;
    longitude?: number;
}
export declare class ApplyLeaveDto {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
}
export declare class UpdateLeaveDto {
    type?: LeaveType;
    startDate?: string;
    endDate?: string;
    reason?: string;
    status?: LeaveStatus;
}
export declare class BulkLeaveActionDto {
    ids: string[];
    action: 'approve' | 'reject';
}
//# sourceMappingURL=hr.dto.d.ts.map