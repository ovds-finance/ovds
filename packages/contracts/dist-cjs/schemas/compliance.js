/**
 * @ovds/contracts — Compliance Schemas
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
    get ComplianceChecklistSchema () {
        return ComplianceChecklistSchema;
    },
    get EimsBulkJobSchema () {
        return EimsBulkJobSchema;
    },
    get EimsCertificateSchema () {
        return EimsCertificateSchema;
    },
    get EimsRegistrationSchema () {
        return EimsRegistrationSchema;
    },
    get EimsSourceSystemSchema () {
        return EimsSourceSystemSchema;
    },
    get TaxReportSchema () {
        return TaxReportSchema;
    }
});
const _zod = require("zod");
const ComplianceChecklistSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    name: _zod.z.string(),
    category: _zod.z.string(),
    status: _zod.z.enum([
        'pending',
        'in_progress',
        'completed',
        'failed'
    ]),
    dueDate: _zod.z.string().optional(),
    completedAt: _zod.z.string().optional(),
    assignee: _zod.z.string().optional(),
    notes: _zod.z.string().optional()
});
const EimsSourceSystemSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    systemNumber: _zod.z.string(),
    systemType: _zod.z.enum([
        'ERP',
        'POS',
        'MANUAL'
    ]),
    enterpriseId: _zod.z.string().optional(),
    establishmentId: _zod.z.string().optional(),
    clientId: _zod.z.string(),
    clientSecret: _zod.z.string().optional(),
    apiKey: _zod.z.string().optional(),
    callbackUrl: _zod.z.string().optional(),
    status: _zod.z.enum([
        'pending',
        'approved',
        'rejected',
        'active'
    ]),
    tin: _zod.z.string(),
    createdAt: _zod.z.string()
});
const EimsCertificateSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    sourceSystemId: _zod.z.string().uuid(),
    certificatePem: _zod.z.string().optional(),
    csrPem: _zod.z.string().optional(),
    status: _zod.z.enum([
        'pending',
        'generated',
        'submitted',
        'installed',
        'expired'
    ]),
    expiresAt: _zod.z.string().optional(),
    createdAt: _zod.z.string()
});
const EimsRegistrationSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    invoiceId: _zod.z.string().uuid(),
    irn: _zod.z.string().optional(),
    status: _zod.z.enum([
        'pending',
        'registered',
        'failed',
        'cancelled'
    ]),
    documentNumber: _zod.z.string(),
    registrationDate: _zod.z.string().optional(),
    errorMessage: _zod.z.string().optional(),
    createdAt: _zod.z.string()
});
const EimsBulkJobSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    conversationId: _zod.z.string(),
    type: _zod.z.enum([
        'register',
        'cancel'
    ]),
    status: _zod.z.enum([
        'pending',
        'processing',
        'completed',
        'failed'
    ]),
    totalItems: _zod.z.number().int(),
    processedItems: _zod.z.number().int(),
    successCount: _zod.z.number().int(),
    failureCount: _zod.z.number().int(),
    createdAt: _zod.z.string(),
    completedAt: _zod.z.string().optional()
});
const TaxReportSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    type: _zod.z.enum([
        'monthly_vat',
        'monthly_wht',
        'annual',
        'custom'
    ]),
    period: _zod.z.string(),
    status: _zod.z.enum([
        'draft',
        'submitted',
        'accepted',
        'rejected'
    ]),
    submittedAt: _zod.z.string().optional(),
    amount: _zod.z.number().optional(),
    createdAt: _zod.z.string()
});
