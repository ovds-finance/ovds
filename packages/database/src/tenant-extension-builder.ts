import type { RequestContext } from './tenant-context.middleware';

export type DeploymentMode = 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI';

const READ_OPERATIONS = new Set([
  'findMany', 'findFirst', 'findUnique',
]);

const MUTABLE_TENANT_MODELS = new Set([
  'employee', 'user', 'department', 'shift',
  'invoice', 'invoiceItem', 'invoicePayment', 'invoiceActivity',
  'estimate', 'customer', 'creditNote', 'revenue',
  'salesOrderCreditNoteItem', 'collectionCase',
  'bill', 'billItem', 'billPayment', 'vendor', 'vendorPayment',
  'purchaseOrder', 'purchaseReceipt', 'debitNote', 'scannedBill',
  'expenseClaim', 'reimbursementClaim',
  'bankAccount', 'bankTransaction', 'bankFeed', 'bankMatchingRule',
  'bankFxRate', 'bankTransactionFx', 'bankStatementLine',
  'reconciliationPeriod', 'reconciliationReport',
  'fundTransfer', 'cashForecast', 'payment', 'paymentBatch',
  'paymentBatchItem', 'otherPayment', 'otherPaymentHead',
  'account', 'journalEntry', 'journalLine', 'ledgerEntry',
  'ledgerMappingRule', 'fiscalYear', 'periodClose', 'budget',
  'accrualPosting', 'costCenter',
  'item', 'category', 'stockMovement', 'warehouse',
  'bomHeader', 'workOrder',
  'leave', 'attendance', 'payrollRecord', 'payrollLine',
  'payrollDeductionCalculation', 'batchPayout', 'gratuityRecord',
  'deal', 'activity', 'pipeline', 'project', 'task',
  'ticket', 'notification',
  'vatFiling', 'vatInputLedger', 'vatOutputLedger',
  'vatWithholding', 'vatRefundClaim', 'vatReverseCharge',
  'vatNote', 'vatExportEvidence', 'vatETaxSubmission',
  'vatDeclaration', 'whtWithholding', 'totFiling',
  'incomeTaxFiling', 'disasterFundContribution',
  'lease', 'fixedAssetDisposal', 'eclProvision',
  'ifrs15Schedule', 'fxRate',
  'eimsSourceSystem', 'eimsRegistration', 'eimsReceipt',
  'eimsBulkJob', 'eimsCertificate', 'eimsSummaryReport',
  'businessLoan', 'loanRepayment', 'investment', 'partnership',
  'settingValue', 'moduleSettings', 'companyModule',
  'customField', 'customFieldValue', 'webhookEndpoint',
  'auditLog', 'taxReport', 'transfer', 'reconciliation',
  'expense', 'review',
  'monetizationSubscription', 'monetizationTrial',
  'monetizationPurchase', 'monetizationEntitlement',
  'licenseActivation',
  'permission', 'roleDefinition',
  'company',
]);

/**
 * Build a PrismaClient `$extends` query interceptor that enforces tenant
 * scoping for every model operation.
 *
 * This factory is shared between:
 *   - `PrismaService` in apps/backend/src/common/prisma.service.ts
 *   - `TenantPrismaClient` in packages/database/src/tenant-prisma.client.ts
 *
 * Using a single source of truth for the extension logic guarantees that
 * multi-tenant isolation behavior stays consistent across the entire
 * codebase and prevents one implementation from drifting.
 */
export function buildTenantScopedExtension(
  getContext: () => RequestContext | undefined,
  deploymentMode: DeploymentMode,
) {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const context = getContext();
          const companyId = context?.companyId || null;
          const role = context?.role?.toUpperCase() ?? '';
          const isSuper = role === 'SPURADMIN' || role === 'SUPERADMIN';

          const isSingleTenant = deploymentMode === 'ON_PREMISE_SINGLE';

          if (isSingleTenant || !companyId || isSuper) {
            return query(args);
          }

          if (READ_OPERATIONS.has(operation)) {
            const where = args?.where ?? {};
            if (operation === 'findUnique' && where.companyId && where.companyId !== companyId) {
              return null;
            }
            if (MUTABLE_TENANT_MODELS.has(model)) {
              args = { ...args, where: { ...where, companyId } };
            }
          }

          if (operation === 'create' || operation === 'createMany') {
            if (MUTABLE_TENANT_MODELS.has(model)) {
              if (operation === 'create') {
                args = { ...args, data: { ...args.data, companyId } };
              } else {
                args = {
                  ...args,
                  data: Array.isArray(args.data)
                    ? args.data.map((d: any) => ({ ...d, companyId }))
                    : { ...args.data, companyId },
                };
              }
            }
          }

          if (
            operation === 'update'   || operation === 'updateMany' ||
            operation === 'delete'   || operation === 'deleteMany'
          ) {
            if (MUTABLE_TENANT_MODELS.has(model)) {
              const where = args?.where ?? {};
              args = { ...args, where: { ...where, companyId } };
            }
          }

          return query(args);
        },
      },
    },
  };
}
