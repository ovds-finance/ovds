/**
 * @ovds/dto/hr/zod-bridge — Zod schemas for the HR domain
 *
 * Provides Zod versions of the class-validator DTOs in @ovds/dto/hr.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 *
 * Usage in React:
 *   import { CreateEmployeeSchema, LeaveSchema } from '@ovds/dto';
 *   const { register, handleSubmit } = useForm({
 *     resolver: createZodResolver(CreateEmployeeSchema)
 *   });
 *
 * Usage in NestJS:
 *   import { CreateEmployeeSchema } from '@ovds/dto';
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateEmployeeSchema)) dto: z.infer<typeof CreateEmployeeSchema>) { ... }
 */

import { z } from 'zod';

// ── Employee Schemas ─────────────────────────────────────────────────────────

export const EmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  employeeId: z.string(),
  departmentId: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  baseSalary: z.number().nonnegative(),
  hourlyRate: z.number().nonnegative().default(0),
  pensionRate: z.number().nonnegative().default(7),
  employerPensionRate: z.number().nonnegative().default(11),
  incomeTaxRate: z.number().nonnegative().default(0),
  payrollStatus: z.string().default('NOT_CONFIGURED'),
  employmentNature: z.string().default('Permanent'),
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const ListEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  companyId: z.string().optional(),
  departmentId: z.string().optional(),
});

// ── Department Schemas ───────────────────────────────────────────────────────

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  companyId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export const CreateDepartmentSchema = DepartmentSchema.omit({
  id: true,
}).extend({
  companyId: z.string().optional(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// ── Leave Schemas ────────────────────────────────────────────────────────────

export const LeaveTypeSchema = z.enum(['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'EMERGENCY', 'OTHER']);
export const LeaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

export const LeaveSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  type: LeaveTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: LeaveStatusSchema,
  reason: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const CreateLeaveSchema = z.object({
  employeeId: z.string(),
  type: LeaveTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
});

export const UpdateLeaveSchema = CreateLeaveSchema.partial();

// ── Payroll Schemas ──────────────────────────────────────────────────────────

export const PayrollStatusSchema = z.enum(['GENERATED', 'APPROVED', 'PAID', 'CANCELLED']);

export const PayrollRecordSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  type: z.string().default('SALARY'),
  status: z.string(),
  basicSalary: z.number().nonnegative(),
  grossPay: z.number().nonnegative(),
  netPay: z.number().nonnegative(),
  incomeTax: z.number().nonnegative(),
  employeePension: z.number().nonnegative(),
  employerPension: z.number().nonnegative(),
  totalDeductions: z.number().nonnegative(),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreatePayrollRecordSchema = PayrollRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

// ── Attendance Schemas ───────────────────────────────────────────────────────

export const AttendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE']);

export const AttendanceSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: z.coerce.date(),
  checkIn: z.coerce.date().nullable().optional(),
  checkOut: z.coerce.date().nullable().optional(),
  status: AttendanceStatusSchema,
  method: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  deviceInfo: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  verifiedBy: z.string().nullable().optional(),
  overtimeHours: z.number().nonnegative().default(0),
});

export const CreateAttendanceSchema = z.object({
  employeeId: z.string(),
  date: z.coerce.date(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  status: AttendanceStatusSchema.optional(),
  method: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional(),
});

// ── Type exports ─────────────────────────────────────────────────────────────

export type Employee = z.infer<typeof EmployeeSchema>;
export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof ListEmployeesQuerySchema>;

export type Department = z.infer<typeof DepartmentSchema>;
export type CreateDepartment = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartment = z.infer<typeof UpdateDepartmentSchema>;

export type LeaveType = z.infer<typeof LeaveTypeSchema>;
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;
export type Leave = z.infer<typeof LeaveSchema>;
export type CreateLeave = z.infer<typeof CreateLeaveSchema>;
export type UpdateLeave = z.infer<typeof UpdateLeaveSchema>;

export type PayrollStatus = z.infer<typeof PayrollStatusSchema>;
export type PayrollRecord = z.infer<typeof PayrollRecordSchema>;
export type CreatePayrollRecord = z.infer<typeof CreatePayrollRecordSchema>;

export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type Attendance = z.infer<typeof AttendanceSchema>;
export type CreateAttendance = z.infer<typeof CreateAttendanceSchema>;
