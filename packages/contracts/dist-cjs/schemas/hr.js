/**
 * @ovds/contracts — HR Schemas
 *
 * Zod schemas for Employee, Department, Leave, Attendance, Payroll.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateDepartmentSchema () {
        return CreateDepartmentSchema;
    },
    get CreateEmployeeSchema () {
        return CreateEmployeeSchema;
    },
    get CreateLeaveSchema () {
        return CreateLeaveSchema;
    },
    get DepartmentSchema () {
        return DepartmentSchema;
    },
    get EmployeeSchema () {
        return EmployeeSchema;
    },
    get LeaveSchema () {
        return LeaveSchema;
    },
    get LeaveStatusSchema () {
        return LeaveStatusSchema;
    },
    get LeaveTypeSchema () {
        return LeaveTypeSchema;
    },
    get ListEmployeesQuerySchema () {
        return ListEmployeesQuerySchema;
    },
    get PayrollRecordSchema () {
        return PayrollRecordSchema;
    },
    get PayrollStatusSchema () {
        return PayrollStatusSchema;
    },
    get UpdateEmployeeSchema () {
        return UpdateEmployeeSchema;
    }
});
const _zod = require("zod");
const _common = require("./common");
const _customfields = require("./custom-fields");
const EmployeeSchema = _zod.z.object({
    id: _zod.z.string(),
    firstName: _zod.z.string(),
    lastName: _zod.z.string(),
    email: _zod.z.string().email(),
    employeeId: _zod.z.string(),
    departmentId: _zod.z.string().nullable().optional(),
    designation: _zod.z.string().nullable().optional(),
    baseSalary: _zod.z.number().nonnegative(),
    hourlyRate: _zod.z.number().nonnegative().default(0),
    pensionRate: _zod.z.number().nonnegative().default(7),
    employerPensionRate: _zod.z.number().nonnegative().default(11),
    incomeTaxRate: _zod.z.number().nonnegative().default(0),
    payrollStatus: _zod.z.string().default('NOT_CONFIGURED'),
    employmentNature: _zod.z.string().default('Permanent'),
    bankName: _zod.z.string().nullable().optional(),
    accountNumber: _zod.z.string().nullable().optional(),
    phone: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    department: _zod.z.object({
        id: _zod.z.string(),
        name: _zod.z.string()
    }).nullable().optional(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateEmployeeSchema = EmployeeSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    department: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const UpdateEmployeeSchema = CreateEmployeeSchema.partial();
const ListEmployeesQuerySchema = _common.PaginationQuerySchema.merge(_zod.z.object({
    companyId: _zod.z.string().optional(),
    departmentId: _zod.z.string().optional()
}));
const DepartmentSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    code: _zod.z.string().nullable().optional(),
    description: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    companyId: _zod.z.string().nullable().optional(),
    parentId: _zod.z.string().nullable().optional(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateDepartmentSchema = DepartmentSchema.omit({
    id: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const LeaveTypeSchema = _zod.z.enum([
    'ANNUAL',
    'SICK',
    'MATERNITY',
    'PATERNITY',
    'UNPAID',
    'EMERGENCY',
    'OTHER'
]);
const LeaveStatusSchema = _zod.z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
]);
const LeaveSchema = _zod.z.object({
    id: _zod.z.string(),
    employeeId: _zod.z.string(),
    type: LeaveTypeSchema,
    startDate: _zod.z.coerce.date(),
    endDate: _zod.z.coerce.date(),
    status: LeaveStatusSchema,
    reason: _zod.z.string().nullable().optional(),
    approvedBy: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date()
});
const CreateLeaveSchema = _zod.z.object({
    employeeId: _zod.z.string(),
    type: LeaveTypeSchema,
    startDate: _zod.z.coerce.date(),
    endDate: _zod.z.coerce.date(),
    reason: _zod.z.string().optional()
});
const PayrollStatusSchema = _zod.z.enum([
    'GENERATED',
    'APPROVED',
    'PAID',
    'CANCELLED'
]);
const PayrollRecordSchema = _zod.z.object({
    id: _zod.z.string(),
    employeeId: _zod.z.string(),
    year: _zod.z.number().int(),
    month: _zod.z.number().int().min(1).max(12),
    type: _zod.z.string().default('SALARY'),
    status: _zod.z.string(),
    basicSalary: _zod.z.number().nonnegative(),
    grossPay: _zod.z.number().nonnegative(),
    netPay: _zod.z.number().nonnegative(),
    incomeTax: _zod.z.number().nonnegative(),
    employeePension: _zod.z.number().nonnegative(),
    employerPension: _zod.z.number().nonnegative(),
    totalDeductions: _zod.z.number().nonnegative(),
    approvedBy: _zod.z.string().nullable().optional(),
    approvedAt: _zod.z.coerce.date().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
