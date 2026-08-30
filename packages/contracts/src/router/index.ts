/**
 * @ovds/contracts — Root oRPC Router Contract
 *
 * This is the single source of truth for the entire API surface.
 *
 * Architecture:
 *   schema.prisma
 *     └─ zod-prisma-types → packages/contracts/src/prisma-zod/  (auto-generated)
 *                              └─ composed into schemas/ (hand-crafted request/response shapes)
 *                                   └─ used by router/ (oRPC contract definitions)
 *                                        ├─ Backend: implements via oc.implementer(appContract)
 *                                        └─ Frontend: calls via createORPCClient(appContract)
 *
 * Usage — Backend (NestJS):
 *   import { appContract } from '@ovds/contracts/router';
 *   const router = os.contract(appContract).router({ ... });
 *
 * Usage — Frontend (React):
 *   import { appContract } from '@ovds/contracts/router';
 *   const orpc = createORPCClient(appContract, { baseURL: '/api/rpc' });
 */
import { oc } from '@orpc/contract';
import { authContract, type AuthContract } from './auth';
import { ovdsContract, type OvdsContract } from './ovds';
import { bankingContract, type BankingContract } from './banking';
import { hrContract, type HrContract } from './hr';
import { inventoryContract, type InventoryContract } from './inventory';
import { navContract, type NavContract } from './nav';
import { taxContract, type TaxContract } from './tax';
import { settingsContract, type SettingsContract } from './settings';
import { monetizationContract, type MonetizationContract } from './monetization';
import { syncContract, type SyncContract } from './sync';
import { customFieldsContract, type CustomFieldsContract } from './custom-fields';
import { accountingContract, type AccountingContract } from './accounting';
import { consolidationContract, type ConsolidationContract } from './consolidation';
import { complianceContract, type ComplianceContract } from './compliance';
import { crmContract, type CrmContract } from './crm';
import { salesContract, type SalesContract } from './sales';
import { purchasesContract, type PurchasesContract } from './purchases';
import { eimsContract, type EimsContract } from './eims';
import { invoiceContract, type InvoiceContract } from './invoice';
import { ifrsContract, type IfrsContract } from './ifrs';
import { subLedgerContract, type SubLedgerContract } from './sub-ledger';
import { cyberAuditContract, type CyberAuditContract } from './cyber-audit';
import { masterComplianceContract, type MasterComplianceContract } from './master-compliance';

export type AppContract = {
  auth:          AuthContract;
  ovds:          OvdsContract;
  banking:       BankingContract;
  hr:            HrContract;
  inventory:     InventoryContract;
  nav:           NavContract;
  tax:           TaxContract;
  settings:      SettingsContract;
  monetization:  MonetizationContract;
  sync:          SyncContract;
  customFields:  CustomFieldsContract;
  accounting:    AccountingContract;
  consolidation: ConsolidationContract;
  compliance:    ComplianceContract;
  crm:           CrmContract;
  sales:         SalesContract;
  purchases:     PurchasesContract;
  eims:          EimsContract;
  invoice:       InvoiceContract;
  ifrs:          IfrsContract;
  subLedger:     SubLedgerContract;
  cyberAudit:    CyberAuditContract;
  masterCompliance: MasterComplianceContract;
};

export const appContract = oc.router({
  auth:          authContract,
  ovds:          ovdsContract,
  banking:       bankingContract,
  hr:            hrContract,
  inventory:     inventoryContract,
  nav:           navContract,
  tax:           taxContract,
  settings:      settingsContract,
  monetization:  monetizationContract,
  sync:          syncContract,
  customFields:  customFieldsContract,
  accounting:    accountingContract,
  consolidation: consolidationContract,
  compliance:    complianceContract,
  crm:           crmContract,
  sales:         salesContract,
  purchases:     purchasesContract,
  eims:          eimsContract,
  invoice:       invoiceContract,
  ifrs:          ifrsContract,
  subLedger:     subLedgerContract,
  cyberAudit:    cyberAuditContract,
  masterCompliance: masterComplianceContract,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as unknown as AppContract;

export {
  authContract, ovdsContract, bankingContract, hrContract,
  navContract, taxContract,
  settingsContract, monetizationContract, syncContract, customFieldsContract,
  accountingContract, consolidationContract,
  complianceContract, crmContract, salesContract, purchasesContract, eimsContract,
  invoiceContract, ifrsContract, subLedgerContract, cyberAuditContract, masterComplianceContract,
};
export type { ComplianceContract } from './compliance';
export type { ConsolidationContract } from './consolidation';
export type { OvdsContract } from './ovds';
export type { BankingContract } from './banking';
export type { HrContract } from './hr';
export type { InventoryContract } from './inventory';
export type { NavContract } from './nav';
export type { TaxContract } from './tax';
export type { SettingsContract } from './settings';
export type { MonetizationContract } from './monetization';
export type { SyncContract } from './sync';
export type { CustomFieldsContract } from './custom-fields';
export type { AccountingContract } from './accounting';
export type { CrmContract } from './crm';
export type { SalesContract } from './sales';
export type { PurchasesContract } from './purchases';
export type { EimsContract } from './eims';
export type { InvoiceContract } from './invoice';
export type { IfrsContract } from './ifrs';
export type { SubLedgerContract } from './sub-ledger';
export type { CyberAuditContract } from './cyber-audit';
export type { MasterComplianceContract } from './master-compliance';
