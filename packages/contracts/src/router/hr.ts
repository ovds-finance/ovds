/**
 * @ovds/contracts — HR oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  EmployeeSchema,
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  ListEmployeesQuerySchema,
  DepartmentSchema,
  CreateDepartmentSchema,
  LeaveSchema,
  CreateLeaveSchema,
  LeaveStatusSchema,
  PayrollRecordSchema,
} from '../schemas/hr';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

// ── Employee procedures ───────────────────────────────────────────────────────

const employeeProcedures = {
  list: oc
    .input(ListEmployeesQuerySchema)
    .output(PaginatedResultSchema(EmployeeSchema)),

  get: oc
    .input(IdParamSchema)
    .output(EmployeeSchema),

  create: oc
    .input(CreateEmployeeSchema)
    .output(EmployeeSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateEmployeeSchema })))
    .output(EmployeeSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Department procedures ─────────────────────────────────────────────────────

const departmentProcedures = {
  list: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.array(DepartmentSchema)),

  get: oc
    .input(IdParamSchema)
    .output(DepartmentSchema),

  create: oc
    .input(CreateDepartmentSchema)
    .output(DepartmentSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({
      data: z.object({
        name: z.string().optional(),
        code: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        companyId: z.string().optional(),
        parentId: z.string().nullable().optional(),
        customFields: z.record(z.string(), z.string().nullable()).optional(),
      }),
    })))
    .output(DepartmentSchema),
};

// ── Leave procedures ──────────────────────────────────────────────────────────

const leaveProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({
      employeeId: z.string().optional(),
      companyId: z.string().optional(),
      status: LeaveStatusSchema.optional(),
    })))
    .output(PaginatedResultSchema(LeaveSchema)),

  get: oc
    .input(IdParamSchema)
    .output(LeaveSchema),

  create: oc
    .input(CreateLeaveSchema)
    .output(LeaveSchema),

  approve: oc
    .input(IdParamSchema.merge(z.object({ approvedBy: z.string() })))
    .output(LeaveSchema),

  reject: oc
    .input(IdParamSchema.merge(z.object({ reason: z.string().optional() })))
    .output(LeaveSchema),
};

// ── Payroll procedures ────────────────────────────────────────────────────────

const payrollProcedures = {
  list: oc
    .input(z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      companyId: z.string().optional(),
    }))
    .output(z.array(PayrollRecordSchema)),

  get: oc
    .input(IdParamSchema)
    .output(PayrollRecordSchema),

  generate: oc
    .input(z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      companyId: z.string(),
    }))
    .output(z.object({ count: z.number(), records: z.array(PayrollRecordSchema) })),

  approve: oc
    .input(IdParamSchema.merge(z.object({ approvedBy: z.string() })))
    .output(PayrollRecordSchema),
};

// ── HR router contract ────────────────────────────────────────────────────────

export const hrContract = oc.router({
  employees:   oc.router(employeeProcedures),
  departments: oc.router(departmentProcedures),
  leaves:      oc.router(leaveProcedures),
  payroll:     oc.router(payrollProcedures),
});

export type HrContract = typeof hrContract;
