/**
 * MoR BSP Master Compliance Checklist — test cases IRC-P01 through IRC-P07
 * Source: MoR_BSP_Master.docx (EIRMS rollout readiness)
 */

export interface MorBspTestCase {
  id: string;
  category: 'Invoice Registration' | 'Receipt Registration' | 'Cancellation' | 'Negative Test' | 'Security' | 'Offline Mode';
  title: string;
  description: string;
  /** OVDS capability that satisfies this test */
  ovdsCapability: string;
  /** Whether OVDS implements automated support for this scenario */
  automated: boolean;
  /** API endpoint or UI path to execute */
  executePath?: string;
  docRef: string;
}

export const MOR_BSP_CHECKLIST: MorBspTestCase[] = [
  {
    id: 'IRC-P01',
    category: 'Invoice Registration',
    title: 'B2C Sales Invoice Without Buyer TIN (VAT)',
    description: 'Register and print VAT-inclusive B2C invoice without buyer TIN; IRN + scannable QR required.',
    ovdsCapability: 'EimsInvoiceMapper B2C mode; auto TransactionType B2C when no buyer TIN',
    automated: true,
    executePath: 'POST /api/eims/invoices/:id/register',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-P02',
    category: 'Invoice Registration',
    title: 'B2B Sales Invoice With Buyer TIN and Legal Name',
    description: 'Register B2B invoice with mandatory buyer TIN/legal name; reject invalid TIN format.',
    ovdsCapability: 'EimsValidationService.validateBuyerForB2B + validateTin()',
    automated: true,
    executePath: 'POST /api/eims/invoices/:id/register',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-P03',
    category: 'Receipt Registration',
    title: 'Sales Receipt From Registered Invoice',
    description: 'Register sales receipt linked to IRN; receive RRN and printable QR.',
    ovdsCapability: 'EimsReceiptService.registerSalesReceipt',
    automated: true,
    executePath: 'POST /api/eims/receipts/sales',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-P04',
    category: 'Receipt Registration',
    title: 'Withholding Receipt From Registered Invoice',
    description: 'Register TWHT/IWHT receipt against registered invoice IRN.',
    ovdsCapability: 'EimsReceiptService.registerWithholdingReceipt',
    automated: true,
    executePath: 'POST /api/eims/receipts/withholding',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-P05',
    category: 'Cancellation',
    title: 'Cancel Registered Invoice',
    description: 'Cancel previously registered invoice; status updated to CANCELLED.',
    ovdsCapability: 'EimsRegistrationService.cancelInvoice + bulk cancel',
    automated: true,
    executePath: 'POST /api/eims/invoices/:id/cancel',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-P06',
    category: 'Invoice Registration',
    title: 'Credit Memo From Registered Invoice',
    description: 'Register CRN against original IRN; amount must not exceed original invoice.',
    ovdsCapability: 'EimsInvoiceMapper CRN type + adjustment validation',
    automated: true,
    executePath: 'POST /api/eims/invoices/:id/register (credit note)',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-P07',
    category: 'Invoice Registration',
    title: 'Debit Memo From Registered Invoice',
    description: 'Register DBN against original registered invoice IRN.',
    ovdsCapability: 'EimsInvoiceMapper DBN type + adjustment validation',
    automated: true,
    executePath: 'POST /api/eims/invoices/:id/register (debit note)',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-N01',
    category: 'Negative Test',
    title: 'Receipt From Non-existent or Cancelled Invoice',
    description: 'System rejects receipt registration for cancelled or unregistered IRN.',
    ovdsCapability: 'EimsValidationService.validateReceiptEligibility',
    automated: true,
    executePath: 'POST /api/eims/receipts/sales (rejected)',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-N02',
    category: 'Negative Test',
    title: 'Cancel Non-existent or Already Cancelled Invoice',
    description: 'System rejects duplicate or invalid cancellation requests.',
    ovdsCapability: 'EimsRegistrationService.cancelInvoice guards',
    automated: true,
    executePath: 'POST /api/eims/invoices/:id/cancel (rejected)',
    docRef: 'MoR_BSP_Master.docx',
  },
  {
    id: 'IRC-S01',
    category: 'Security',
    title: 'HTTPS/TLS Enforced',
    description: 'All EIMS API traffic over TLS 1.3+; SHA512withRSA signed requests.',
    ovdsCapability: 'EimsApiService TLS + EimsSigningService',
    automated: true,
    docRef: 'MoR_BSP_Master.docx · Cybersecurity Audit minimum Requirements2.pdf',
  },
  {
    id: 'IRC-O01',
    category: 'Offline Mode',
    title: 'Offline Storage and Resend',
    description: 'Offline invoices encrypted, synced within SLA, auto-registered after sync.',
    ovdsCapability: 'OfflineInvoiceService + EimsInvoiceListener offline.invoice.synced',
    automated: true,
    executePath: '/sales/offline-resilience',
    docRef: 'MoR_BSP_Master.docx',
  },
];

export function getMorBspSummary() {
  const total = MOR_BSP_CHECKLIST.length;
  const automated = MOR_BSP_CHECKLIST.filter((t) => t.automated).length;
  return {
    total,
    automated,
    manual: total - automated,
    readinessScore: Math.round((automated / total) * 100),
  };
}
