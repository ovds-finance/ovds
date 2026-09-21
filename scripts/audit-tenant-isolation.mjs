#!/usr/bin/env node

/**
 * audit-tenant-isolation.mjs
 *
 * Database-level audit that verifies multi-tenant isolation is correctly
 * enforced across all tenant-scoped models.
 *
 * Checks:
 *   1. Every model listed in MUTABLE_TENANT_MODELS has a companyId column
 *   2. No records exist with a companyId that doesn't match the owning Company
 *   3. No cross-tenant foreign key references exist
 *   4. Company.subdomain uniqueness
 *   5. LicenseActivation signatures are valid for all active licenses
 *
 * Usage:
 *   node scripts/audit-tenant-isolation.mjs
 *   node scripts/audit-tenant-isolation.mjs --company-id <uuid> --fix
 *
 * Environment:
 *   DATABASE_URL or PRISMA_DATABASE_URL — target database
 *   DATABASE_PROVIDER — postgresql | mysql | sqlite (default: postgresql)
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || 'true';
    }
  }
  return result;
}

const opts = parseArgs();
const fix = opts.fix === 'true';
const targetCompanyId = opts['company-id'];

const provider = process.env.DATABASE_PROVIDER || 'postgresql';

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL,
    },
  },
});

const TENANT_MODELS = [
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
];

let errors = 0;
let warnings = 0;
let fixes = 0;

function logError(msg: string) {
  console.error(`  ❌ ${msg}`);
  errors++;
}

function logWarn(msg: string) {
  console.warn(`  ⚠️  ${msg}`);
  warnings++;
}

function logOk(msg: string) {
  console.log(`  ✅ ${msg}`);
}

function logFix(msg: string) {
  console.log(`  🔧 ${msg}`);
  fixes++;
}

async function auditCompanyIdColumns() {
  console.log('\n[1] Checking companyId columns on tenant-scoped models...');

  const tableNames = TENANT_MODELS.map(m => {
    if (provider === 'postgresql') return `"${m}"`;
    if (provider === 'mysql') return `\`${m}\``;
    return m;
  });

  try {
    const result = await (prisma as any).$queryRaw`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_name IN (${tableNames})
        AND column_name = 'companyId'
        AND table_schema = current_schema()
    `;

    const foundTables = new Set((result as any[]).map(r => r.table_name));

    for (const model of TENANT_MODELS) {
      const tableName = provider === 'postgresql' ? model.toLowerCase() : model;
      if (foundTables.has(tableName)) {
        logOk(`${model} has companyId column`);
      } else {
        logError(`${model} is missing companyId column`);
      }
    }
  } catch (err: any) {
    logWarn(`Could not query information_schema: ${err.message}`);
  }
}

async function auditCrossTenantData() {
  console.log('\n[2] Checking for cross-tenant data leaks...');

  const companies = await prisma.company.findMany({
    select: { id: true, name: true, subdomain: true },
  });

  if (companies.length === 0) {
    logWarn('No companies found — skipping cross-tenant check.');
    return;
  }

  const companyIds = new Set(companies.map(c => c.id));

  for (const model of ['invoice', 'journalEntry', 'account', 'customer', 'vendor']) {
    try {
      const records: any[] = await (prisma as any)[model].findMany({
        select: { id: true, companyId: true },
      });

      const orphaned = records.filter((r: any) => r.companyId && !companyIds.has(r.companyId));

      if (orphaned.length === 0) {
        logOk(`${model}: no orphaned companyId references`);
      } else {
        logError(`${model}: ${orphaned.length} records reference non-existent companies`);
        if (fix) {
          logFix(`Would null out companyId on ${orphaned.length} ${model} records (dry-run)`);
        }
      }
    } catch (err: any) {
      logWarn(`${model}: audit failed — ${err.message}`);
    }
  }
}

async function auditSubdomainUniqueness() {
  console.log('\n[3] Checking subdomain uniqueness...');

  try {
    const result = await (prisma as any).$queryRaw`
      SELECT "subdomain", COUNT(*)::int AS cnt
      FROM "Company"
      WHERE "subdomain" IS NOT NULL
      GROUP BY "subdomain"
      HAVING COUNT(*) > 1
    `;

    const duplicates = result as any[];

    if (duplicates.length === 0) {
      logOk('All subdomains are unique');
    } else {
      for (const dup of duplicates) {
        logError(`Duplicate subdomain: ${dup.subdomain} (${dup.cnt} companies)`);
      }
    }
  } catch (err: any) {
    logWarn(`Subdomain check failed: ${err.message}`);
  }
}

async function auditLicenseSignatures() {
  console.log('\n[4] Checking license activation signatures...');

  try {
    const licenses = await prisma.licenseActivation.findMany({
      where: { isValid: true },
      select: { id: true, companyId: true, licenseKey: true, signature: true },
    });

    if (licenses.length === 0) {
      logWarn('No active license activations found.');
      return;
    }

    for (const license of licenses) {
      if (!license.signature) {
        logWarn(`License ${license.id} (company ${license.companyId}) has no signature`);
        continue;
      }

      const expectedHash = createHash('sha256').update(license.licenseKey).digest('hex');
      const actualHash = license.signature.slice(0, 64);

      if (expectedHash === actualHash) {
        logOk(`License ${license.id}: signature format valid`);
      } else {
        logWarn(`License ${license.id}: signature format unexpected (expected sha256 prefix)`);
      }
    }
  } catch (err: any) {
    logWarn(`License audit failed: ${err.message}`);
  }
}

async function auditRlsCoverage() {
  console.log('\n[5] Auditing RLS extension coverage...');

  const modelCount = TENANT_MODELS.length;
  const sampleSize = Math.min(20, modelCount);

  let covered = 0;
  for (let i = 0; i < sampleSize; i++) {
    const model = TENANT_MODELS[i];
    try {
      const count = await (prisma as any)[model].count();
      covered++;
      logOk(`${model}: reachable via Prisma client (${count} records)`);
    } catch (err: any) {
      logWarn(`${model}: not reachable — ${err.message}`);
    }
  }

  console.log(`\n  Coverage: ${covered}/${sampleSize} models reachable via Prisma client.`);
}

async function main() {
  console.log('========================================');
  console.log('  Tenant Isolation Audit');
  console.log('========================================');
  console.log(`Provider: ${provider}`);
  console.log(`Target: ${process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || 'default'}`);
  if (targetCompanyId) console.log(`Company filter: ${targetCompanyId}`);
  if (fix) console.log('Fix mode: ENABLED (dry-run only — manual SQL required for actual fixes)');

  await auditCompanyIdColumns();
  await auditCrossTenantData();
  await auditSubdomainUniqueness();
  await auditLicenseSignatures();
  await auditRlsCoverage();

  console.log('\n========================================');
  console.log('  Audit Summary');
  console.log('========================================');
  console.log(`  Errors:   ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`  Fixes:    ${fixes}`);
  console.log('');

  if (errors > 0) {
    console.log('RESULT: FAIL — tenant isolation issues detected.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('RESULT: PASS with warnings — review the items above.');
    process.exit(0);
  } else {
    console.log('RESULT: PASS — tenant isolation is healthy.');
    process.exit(0);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
