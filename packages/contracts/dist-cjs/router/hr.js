/**
 * @ovds/contracts — HR oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "hrContract", {
    enumerable: true,
    get: function() {
        return hrContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _hr = require("../schemas/hr");
const _common = require("../schemas/common");
// ── Employee procedures ───────────────────────────────────────────────────────
const employeeProcedures = {
    list: _contract.oc.input(_hr.ListEmployeesQuerySchema).output((0, _common.PaginatedResultSchema)(_hr.EmployeeSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_hr.EmployeeSchema),
    create: _contract.oc.input(_hr.CreateEmployeeSchema).output(_hr.EmployeeSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _hr.UpdateEmployeeSchema
    }))).output(_hr.EmployeeSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Department procedures ─────────────────────────────────────────────────────
const departmentProcedures = {
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_hr.DepartmentSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_hr.DepartmentSchema),
    create: _contract.oc.input(_hr.CreateDepartmentSchema).output(_hr.DepartmentSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            name: _zod.z.string().optional(),
            code: _zod.z.string().nullable().optional(),
            description: _zod.z.string().nullable().optional(),
            isActive: _zod.z.boolean().optional(),
            companyId: _zod.z.string().optional(),
            parentId: _zod.z.string().nullable().optional(),
            customFields: _zod.z.record(_zod.z.string(), _zod.z.string().nullable()).optional()
        })
    }))).output(_hr.DepartmentSchema)
};
// ── Leave procedures ──────────────────────────────────────────────────────────
const leaveProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        employeeId: _zod.z.string().optional(),
        companyId: _zod.z.string().optional(),
        status: _hr.LeaveStatusSchema.optional()
    }))).output((0, _common.PaginatedResultSchema)(_hr.LeaveSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_hr.LeaveSchema),
    create: _contract.oc.input(_hr.CreateLeaveSchema).output(_hr.LeaveSchema),
    approve: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        approvedBy: _zod.z.string()
    }))).output(_hr.LeaveSchema),
    reject: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        reason: _zod.z.string().optional()
    }))).output(_hr.LeaveSchema)
};
// ── Payroll procedures ────────────────────────────────────────────────────────
const payrollProcedures = {
    list: _contract.oc.input(_zod.z.object({
        year: _zod.z.number().int(),
        month: _zod.z.number().int().min(1).max(12),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_hr.PayrollRecordSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_hr.PayrollRecordSchema),
    generate: _contract.oc.input(_zod.z.object({
        year: _zod.z.number().int(),
        month: _zod.z.number().int().min(1).max(12),
        companyId: _zod.z.string()
    })).output(_zod.z.object({
        count: _zod.z.number(),
        records: _zod.z.array(_hr.PayrollRecordSchema)
    })),
    approve: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        approvedBy: _zod.z.string()
    }))).output(_hr.PayrollRecordSchema)
};
const hrContract = _contract.oc.router({
    employees: _contract.oc.router(employeeProcedures),
    departments: _contract.oc.router(departmentProcedures),
    leaves: _contract.oc.router(leaveProcedures),
    payroll: _contract.oc.router(payrollProcedures)
});
