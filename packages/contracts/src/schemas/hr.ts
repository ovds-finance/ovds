/**
 * @ovds/contracts — HR Schemas
 *
 * Zod schemas for Employee, Department, Leave, Attendance, Payroll.
 */
import { z } from 'zod';
import { PaginationQuerySchema } from './common';
import { CustomFieldWithValueSchema, CustomFieldValuesMapSchema } from './custom-fields';

// ── Employee ─────────────────────────────────────────────────────────────────

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
   department: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const CreateEmployeeSchema = EmployeeSchema.omit({ id: true, createdAt: true, updatedAt: true, department: true, customFields: true }).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;

export const ListEmployeesQuerySchema = PaginationQuerySchema.merge(
  z.object({
    companyId: z.string().optional(),
    departmentId: z.string().optional(),
  }),
);
export type ListEmployeesQuery = z.infer<typeof ListEmployeesQuerySchema>;

// ── Department ───────────────────────────────────────────────────────────────

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  companyId: z.string().nullable().optional(),
   parentId: z.string().nullable().optional(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;

export const CreateDepartmentSchema = DepartmentSchema.omit({ id: true, customFields: true }).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateDepartment = z.infer<typeof CreateDepartmentSchema>;

// ── Leave ────────────────────────────────────────────────────────────────────

export const LeaveTypeSchema = z.enum(['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'EMERGENCY', 'OTHER']);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

export const LeaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

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

export type Leave = z.infer<typeof LeaveSchema>;

export const CreateLeaveSchema = z.object({
  employeeId: z.string(),
  type: LeaveTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
});
export type CreateLeave = z.infer<typeof CreateLeaveSchema>;

// ── Payroll ───────────────────────────────────────────────────────────────────

export const PayrollStatusSchema = z.enum(['GENERATED', 'APPROVED', 'PAID', 'CANCELLED']);
export type PayrollStatus = z.infer<typeof PayrollStatusSchema>;

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

export type PayrollRecord = z.infer<typeof PayrollRecordSchema>;
