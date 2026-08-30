/**
 * @ovds/contracts — CRM Schemas
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
    get ActivitySchema () {
        return ActivitySchema;
    },
    get LeadSchema () {
        return LeadSchema;
    },
    get OpportunitySchema () {
        return OpportunitySchema;
    },
    get PipelineStageSchema () {
        return PipelineStageSchema;
    }
});
const _zod = require("zod");
const LeadSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    firstName: _zod.z.string(),
    lastName: _zod.z.string(),
    email: _zod.z.string().email().optional(),
    phone: _zod.z.string().optional(),
    company: _zod.z.string().optional(),
    source: _zod.z.string().optional(),
    status: _zod.z.enum([
        'new',
        'contacted',
        'qualified',
        'unqualified',
        'converted'
    ]),
    assignedTo: _zod.z.string().optional(),
    notes: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const OpportunitySchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    title: _zod.z.string(),
    description: _zod.z.string().optional(),
    value: _zod.z.number().nonnegative(),
    currencyCode: _zod.z.string().default('ETB'),
    stage: _zod.z.string(),
    probability: _zod.z.number().int().min(0).max(100).default(0),
    expectedCloseDate: _zod.z.string().optional(),
    customerId: _zod.z.string().uuid().optional(),
    assignedTo: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const ActivitySchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    type: _zod.z.enum([
        'call',
        'email',
        'meeting',
        'task',
        'note'
    ]),
    subject: _zod.z.string(),
    description: _zod.z.string().optional(),
    dueDate: _zod.z.string().optional(),
    completedAt: _zod.z.string().optional(),
    assignedTo: _zod.z.string().optional(),
    relatedId: _zod.z.string().uuid().optional(),
    createdAt: _zod.z.string()
});
const PipelineStageSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    order: _zod.z.number().int(),
    color: _zod.z.string().optional()
});
