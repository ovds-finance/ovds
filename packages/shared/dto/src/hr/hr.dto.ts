import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsIn,
  Min,
  Max,
  ArrayNotEmpty,
  ValidateNested,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsEmail,
  IsInt,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AttendanceMethod,
  AttendanceStatus,
  BiometricType,
  LeaveType,
  LeaveStatus,
} from '@ovds/shared/types';
import { PaginationQueryDto } from '../common/pagination.dto';

export class EmployeeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  businessType?: string;

  // search, departmentId, companyId, status are inherited from PaginationQueryDto

  @IsOptional()
  @IsString()
  employmentNature?: string;
}

// -- Payroll Enums ------------------------------------------------------------

export enum PayrollStatus {
  GENERATED = 'GENERATED',
  VERIFIED = 'VERIFIED',
  FINALIZED = 'FINALIZED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

// -- Payroll DTOs -------------------------------------------------------------

export class GenerateSalaryDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year!: number;
}

export class ApprovePayrollDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  payrollIds!: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayrollFilterDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  take?: number;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  subsidiary?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class BulkUploadDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GenerateSalaryDto)
  salaries!: GenerateSalaryDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkWorkflowDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  employeeIds: string[];

  @IsString()
  @MaxLength(50)
  status: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsString()
  @IsIn(['salary', 'increment', 'arrear'])
  type?: string;
}

export class UpdateRecordStatusDto {
  @IsString()
  @MaxLength(50)
  status: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// -- Employee DTOs -------------------------------------------------------------

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pensionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  employerPensionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  incomeTaxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeContribution?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  employerContribution?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loanBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loanMonthlyDeduction?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyDeductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  leaveEntitlement?: number;

  @IsOptional()
  @IsString()
  employmentNature?: string;

  @IsOptional()
  @IsString()
  cadre?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  dateOfNextIncrement?: string;

  @IsOptional()
  @IsString()
  payrollStatus?: string;

  @IsOptional()
  @IsString()
  subsidiary?: string;

  @IsOptional()
  @IsString()
  transferReason?: string;

  @IsOptional()
  @IsString()
  lastTransferDate?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() businessType?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() payrollStatus?: string;
  @IsOptional() @IsUUID() shiftId?: string | null;
  @IsOptional() @IsNumber() baseSalary?: number;
  @IsOptional() @IsNumber() hourlyRate?: number;
  @IsOptional() @IsNumber() pensionRate?: number;
  @IsOptional() @IsNumber() employerPensionRate?: number;
  @IsOptional() @IsNumber() incomeTaxRate?: number;
  @IsOptional() @IsNumber() employeeContribution?: number;
  @IsOptional() @IsNumber() employerContribution?: number;
  @IsOptional() @IsNumber() loanBalance?: number;
  @IsOptional() @IsNumber() loanMonthlyDeduction?: number;
  @IsOptional() @IsNumber() monthlyDeductions?: number;
  @IsOptional() @IsNumber() leaveEntitlement?: number;
  @IsOptional() @IsString() employmentNature?: string;
  @IsOptional() @IsString() cadre?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() dateOfNextIncrement?: string;
  @IsOptional() @IsString() subsidiary?: string;
  @IsOptional() @IsString() transferReason?: string;
  @IsOptional() @IsString() lastTransferDate?: string;
}

// -- Attendance DTOs ----------------------------------------------------------

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsEnum(AttendanceMethod)
  method?: AttendanceMethod;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceMethod)
  method?: AttendanceMethod;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  verifiedBy?: string;
}

export class CheckInDto {
  @IsNotEmpty()
  @IsString()
  template: string;

  @IsEnum(BiometricType)
  type: BiometricType;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

export class CheckOutDto {
  @IsNotEmpty()
  @IsString()
  template: string;

  @IsEnum(BiometricType)
  type: BiometricType;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

// -- Leaves DTOs --------------------------------------------------------------

export class ApplyLeaveDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateLeaveDto {
  @IsEnum(LeaveType)
  @IsOptional()
  type?: LeaveType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus;
}

export class BulkLeaveActionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';
}
