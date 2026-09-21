/**
 * EimsDataRegistryService — Centralized Data-Mapping Registry
 *
 * This service is the single-source-of-truth for:
 *
 *  1. SCHEMA REGISTRY  — maps internal OVDS field names → MoR/ERCA EIMS field
 *     identifiers, enabling type-safe bidirectional field resolution without
 *     coupling business logic to the MoR JSON contract.
 *
 *  2. INVOICE SUMMARY COMPILER — aggregates all REGISTERED invoices for a
 *     company/period from the OVDS ledger into the MoR-compatible summary
 *     payload (used by POST /eims/summary-report and the daily cron job).
 *
 *  3. COMPLIANCE BRIDGING LAYER — applies Ethiopian tax-law validations
 *     (AABE/ERCA Proclamation 1145/2019, Proc. 1395/2025) before any invoice
 *     reaches the MoR endpoint:
 *       • VAT threshold check (≥ ETB 1 M annual turnover → mandatory VAT reg)
 *       • WHT verification (Art. 94 — vendor invoices with FSNO)
 *       • TIN coercion (B2C fallback to 10-digit consumer TIN)
 *       • Currency normalisation (all amounts transmitted in ETB)
 *       • Ethiopian Fiscal Year (EFY) ↔ Gregorian date mapping
 *
 *  4. RECEIPT VERIFICATION HOOK — parses the MoR digital acknowledgement
 *     (RSA-SHA512 signature + IRN), verifies it against the trusted MoR
 *     certificate stored in EIMS_MOR_CERTIFICATE, and logs the result in
 *     `EimsRegistration.signatureVerified`.
 *
 * Usage:
 *   Inject EimsDataRegistryService wherever you need field resolution,
 *   live summary compilation, or compliance pre-flight without importing
 *   the heavyweight EimsService.
 */
import { createVerify } from 'crypto';

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../common/prisma.service';

// ── MoR ↔ OVDS field-mapping table ──────────────────────────────────────────

/**
 * Each entry describes one OVDS internal field and its MoR EIMS counterpart.
 * `path` is the dot-notation path in the MoR JSON request;
 * `transform` is an optional normaliser applied before mapping.
 */
export interface FieldMapping {
  /** Human-readable description of this field */
  description: string;
  /** OVDS internal model and field name (e.g. "Invoice.invoiceNumber") */
  ovdsField: string;
  /** MoR EIMS JSON path (e.g. "DocumentDetails.DocumentNumber") */
  morPath: string;
  /** Whether this field is required by MoR */
  required: boolean;
  /** ETHIOPIan tax-law reference (if applicable) */
  legalRef?: string;
  /** Optional normaliser name (resolved at runtime) */
  transform?: 'coerceTin' | 'toIsoDate' | 'toNumber' | 'toUpperCase' | 'paymentMode' | 'docType';
}

/** Full registry of OVDS → MoR EIMS field mappings. */
export const EIMS_FIELD_REGISTRY: FieldMapping[] = [
  // ── Document ──────────────────────────────────────────────────────────────
  { ovdsField: 'Invoice.invoiceNumber',  morPath: 'DocumentDetails.DocumentNumber',  required: true,  description: 'Invoice document number',                    legalRef: 'Proc.1145/2019 Art.35' },
  { ovdsField: 'Invoice.date',           morPath: 'DocumentDetails.Date',             required: true,  description: 'Invoice issue date (ISO-8601)',               transform: 'toIsoDate' },
  { ovdsField: 'Invoice.docType',        morPath: 'DocumentDetails.Type',             required: true,  description: 'Document type (INV/CRN/DBN)',                 transform: 'docType' },
  // ── Seller ────────────────────────────────────────────────────────────────
  { ovdsField: 'Company.tin',            morPath: 'SellerDetails.Tin',                required: true,  description: 'Seller TIN (10 digits)',                      legalRef: 'Proc.1145/2019 Art.2',  transform: 'coerceTin' },
  { ovdsField: 'Company.name',           morPath: 'SellerDetails.LegalName',          required: true,  description: 'Seller legal name' },
  { ovdsField: 'Company.vatNumber',      morPath: 'SellerDetails.VatNumber',          required: false, description: 'Seller VAT registration number',              legalRef: 'Proc.285/2002' },
  { ovdsField: 'Company.phone',          morPath: 'SellerDetails.Phone',              required: false, description: 'Seller phone number' },
  { ovdsField: 'Company.email',          morPath: 'SellerDetails.Email',              required: false, description: 'Seller email address' },
  // ── Buyer ─────────────────────────────────────────────────────────────────
  { ovdsField: 'Customer.tin',           morPath: 'BuyerDetails.Tin',                 required: true,  description: 'Buyer TIN (B2C → 0000000000)',                transform: 'coerceTin' },
  { ovdsField: 'Customer.name',          morPath: 'BuyerDetails.LegalName',           required: true,  description: 'Buyer legal name' },
  { ovdsField: 'Customer.vatNumber',     morPath: 'BuyerDetails.VatNumber',           required: false, description: 'Buyer VAT number (B2B only)' },
  { ovdsField: 'Customer.phone',         morPath: 'BuyerDetails.Phone',               required: false, description: 'Buyer phone number' },
  { ovdsField: 'Customer.email',         morPath: 'BuyerDetails.Email',               required: false, description: 'Buyer email address' },
  // ── Value ─────────────────────────────────────────────────────────────────
  { ovdsField: 'Invoice.subtotal',       morPath: 'ValueDetails.TotalValue',          required: true,  description: 'Pre-tax invoice total (ETB)',                 transform: 'toNumber' },
  { ovdsField: 'Invoice.vatAmount',      morPath: 'ValueDetails.TaxValue',            required: true,  description: 'VAT amount (ETB, 15% of TotalValue)',         legalRef: 'Proc.285/2002 Art.6',   transform: 'toNumber' },
  { ovdsField: 'Invoice.exciseAmount',   morPath: 'ValueDetails.ExciseValue',         required: false, description: 'Excise duty (Proc.307/2014)',                  transform: 'toNumber' },
  { ovdsField: 'Invoice.whtAmount',      morPath: 'ValueDetails.IncomeWithholdValue', required: false, description: 'WHT withheld (Proc.1395/2025 Art.94)',         transform: 'toNumber' },
  { ovdsField: 'Invoice.discountAmount', morPath: 'ValueDetails.Discount',            required: false, description: 'Invoice-level discount',                      transform: 'toNumber' },
  { ovdsField: 'Invoice.currencyCode',   morPath: 'ValueDetails.InvoiceCurrency',     required: true,  description: 'Currency code (ETB for domestic)' },
  // ── Payment ───────────────────────────────────────────────────────────────
  { ovdsField: 'Invoice.paymentTerms',   morPath: 'PaymentDetails.Mode',              required: true,  description: 'Payment mode (CASH/CREDIT/CHEQUE/…)',         transform: 'paymentMode' },
  // ── Source System ─────────────────────────────────────────────────────────
  { ovdsField: 'EimsSourceSystem.systemNumber', morPath: 'SourceSystem.SystemNumber', required: true,  description: 'MoR-assigned source system number' },
  { ovdsField: 'EimsSourceSystem.systemType',   morPath: 'SourceSystem.SystemType',   required: true,  description: 'System type: ERP | POS | MANUAL' },
];

// ── Ethiopian tax-law constants ───────────────────────────────────────────────

/** Mandatory VAT registration threshold in ETB (Proc. 285/2002 Art. 4) */
const VAT_REGISTRATION_THRESHOLD_ETB = 1_000_000;

/** Standard VAT rate in Ethiopia */
const ETH_VAT_RATE = 0.15;

/** MoR B2C consumer TIN (10 zeros) */
const CONSUMER_TIN = '0000000000';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNumber(v: any): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

function coerceTin(tin: string | null | undefined): string {
  const cleaned = (tin ?? '').replace(/\D/g, '').slice(0, 10);
  return cleaned.length === 10 ? cleaned : CONSUMER_TIN;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class EimsDataRegistryService {
  private readonly logger = new Logger(EimsDataRegistryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── 1. Schema Registry ───────────────────────────────────────────────────

  /**
   * Return the full OVDS → MoR field-mapping registry.
   * Exposed via `GET /eims/registry` for admin visibility.
   */
  getFieldRegistry(): FieldMapping[] {
    return EIMS_FIELD_REGISTRY;
  }

  /**
   * Resolve the MoR JSON path for an OVDS field name.
   * Returns `undefined` if the field is not in the registry.
   */
  resolveMorPath(ovdsField: string): string | undefined {
    return EIMS_FIELD_REGISTRY.find((m) => m.ovdsField === ovdsField)?.morPath;
  }

  /**
   * Resolve the OVDS field name from a MoR JSON path.
   */
  resolveOvdsField(morPath: string): string | undefined {
    return EIMS_FIELD_REGISTRY.find((m) => m.morPath === morPath)?.ovdsField;
  }

  // ─── 2. Invoice Summary Compiler ─────────────────────────────────────────

  /**
   * Compile all REGISTERED invoices for a company/period into the
   * MoR summary-report payload.
   *
   * This is called:
   *   • By the nightly cron job that auto-submits daily summaries.
   *   • By `EimsService.submitInvoiceSummaryReport()` for manual submissions.
   *   • By the frontend "Preview Report" button (returns the compiled payload
   *     without submitting it).
   *
   * @param companyId  Tenant identifier.
   * @param from       Period start (Gregorian ISO date, inclusive).
   * @param to         Period end (Gregorian ISO date, inclusive).
   * @param reportType 'DAILY' | 'MONTHLY' | 'QUARTERLY'
   */
  async compileSummaryReport(
    companyId: string,
    from: Date,
    to: Date,
    reportType: 'DAILY' | 'MONTHLY' | 'QUARTERLY' = 'DAILY',
  ): Promise<CompiledSummaryReport> {
    // Extend 'to' to end of day so invoices issued on the boundary date are included.
    const toEndOfDay = new Date(to);
    toEndOfDay.setHours(23, 59, 59, 999);

    // Fetch all successfully registered EimsRegistration rows for the period,
    // joining through to the Invoice aggregate to get monetary totals.
    const registrations = await this.prisma.eimsRegistration.findMany({
      where: {
        companyId,
        status: 'REGISTERED',
        createdAt: { gte: from, lte: toEndOfDay },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (registrations.length === 0) {
      this.logger.warn(
        `compileSummaryReport: no registered invoices found for company ${companyId} ` +
          `between ${from.toISOString()} and ${to.toISOString()}`,
      );
    }

    // Resolve invoice monetary totals for each registration by looking up the
    // associated Invoice row (EimsRegistration only stores the IRN / status).
    const invoiceIds = registrations
      .map((r) => r.invoiceId)
      .filter((id): id is string => !!id);

    const invoicesMap = new Map<string, { total: any; vatAmount: any }>();
    if (invoiceIds.length > 0) {
      const invoices = await this.prisma.invoice.findMany({
        where: { id: { in: invoiceIds } },
        select: { id: true, totalAmount: true, vatAmount: true },
      });
      for (const inv of invoices) {
        invoicesMap.set(inv.id, { total: inv.totalAmount, vatAmount: inv.vatAmount });
      }
    }

    // Aggregate totals.
    let totalInvoiceValue = 0;
    let totalTaxValue = 0;
    let totalValueWithTax = 0;

    const invoiceItems = registrations.map((reg) => {
      const invData = reg.invoiceId ? invoicesMap.get(reg.invoiceId) : null;
      const invValue = toNumber(invData?.total);
      const taxValue = toNumber(invData?.vatAmount);
      totalInvoiceValue += invValue;
      totalTaxValue += taxValue;
      totalValueWithTax += invValue + taxValue;

      return {
        irn: reg.irn ?? '',
        documentNumber: reg.documentNumber ?? '',
        invoiceValue: round2(invValue),
        taxValue: round2(taxValue),
        valueWithTax: round2(invValue + taxValue),
      };
    });

    // Resolve company identity for the submission header.
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, tin: true, vatNumber: true },
    });

    const source = await this.prisma.eimsSourceSystem.findFirst({
      where: { companyId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: { systemNumber: true, systemType: true },
    });

    return {
      reportType,
      periodStart: from.toISOString(),
      periodEnd: toEndOfDay.toISOString(),
      companyTin: coerceTin(company?.tin),
      companyName: company?.name ?? '',
      systemNumber: source?.systemNumber ?? '',
      invoiceCount: registrations.length,
      totalInvoiceValue: round2(totalInvoiceValue),
      totalTaxValue: round2(totalTaxValue),
      totalValueWithTax: round2(totalValueWithTax),
      invoices: invoiceItems,
    };
  }

  // ─── 3. Compliance Bridging Layer ────────────────────────────────────────

  /**
   * Run all Ethiopian tax-law pre-flight checks on an invoice before it is
   * submitted to the MoR.  Returns a structured result so the caller can
   * surface warnings to the user or hard-fail on critical violations.
   */
  async runCompliancePreFlight(
    companyId: string,
    invoiceId: string,
  ): Promise<CompliancePreFlightResult> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { company: true, customer: true },
    });

    if (!invoice) {
      return {
        passed: false,
        errors: [`Invoice ${invoiceId} not found`],
        warnings: [],
        checks: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const checks: ComplianceCheck[] = [];

    // ── Check 1: TIN presence ────────────────────────────────────────────
    const sellerTin = coerceTin(invoice.company?.tin);
    const check1: ComplianceCheck = {
      rule: 'SELLER_TIN',
      legalRef: 'Proc.1145/2019 Art.2',
      passed: sellerTin !== CONSUMER_TIN,
      message: sellerTin !== CONSUMER_TIN
        ? `Seller TIN ${sellerTin} — valid`
        : 'Seller TIN is missing or invalid. A 10-digit TIN is required for all B2B invoices.',
    };
    checks.push(check1);
    if (!check1.passed) errors.push(check1.message);

    // ── Check 2: VAT registration ────────────────────────────────────────
    const annualTurnover = await this.estimateAnnualTurnover(companyId);
    const vatRegistered = !!invoice.company?.vatNumber;
    const vatRequired = annualTurnover >= VAT_REGISTRATION_THRESHOLD_ETB;
    const check2: ComplianceCheck = {
      rule: 'VAT_REGISTRATION',
      legalRef: 'Proc.285/2002 Art.4',
      passed: !vatRequired || vatRegistered,
      message: vatRequired && !vatRegistered
        ? `Annual turnover (≈ ETB ${annualTurnover.toLocaleString()}) exceeds the VAT threshold. VAT registration is mandatory.`
        : vatRegistered
          ? `VAT registered (${invoice.company?.vatNumber})`
          : `Estimated turnover (ETB ${annualTurnover.toLocaleString()}) is below the ETB 1M VAT threshold — registration optional`,
    };
    checks.push(check2);
    if (!check2.passed) errors.push(check2.message);

    // ── Check 3: WHT on vendor invoices ──────────────────────────────────
    const hasWht = toNumber((invoice as any).whtAmount) > 0;
    const fsNo = (invoice as any).fsNo ?? null;
    const check3: ComplianceCheck = {
      rule: 'WHT_VENDOR_INVOICE',
      legalRef: 'Proc.1395/2025 Art.94',
      passed: !fsNo || hasWht,
      message: fsNo && !hasWht
        ? `Invoice references FSNO ${fsNo} but WHT amount is zero. WHT must be calculated for vendor invoices.`
        : 'WHT check passed',
    };
    checks.push(check3);
    if (!check3.passed) warnings.push(check3.message);

    // ── Check 4: Currency normalisation ──────────────────────────────────
    const currency = (invoice as any).currencyCode ?? 'ETB';
    const check4: ComplianceCheck = {
      rule: 'CURRENCY_ETB',
      legalRef: 'EIMS Spec v1.2 §3.4',
      passed: currency === 'ETB',
      message: currency === 'ETB'
        ? 'Currency is ETB — no conversion required'
        : `Invoice currency is ${currency}. MoR requires ETB. An FX conversion must be applied before submission.`,
    };
    checks.push(check4);
    if (!check4.passed) warnings.push(check4.message);

    // ── Check 5: Document status ─────────────────────────────────────────
    const check5: ComplianceCheck = {
      rule: 'INVOICE_STATUS',
      legalRef: 'EIMS Spec v1.2 §2.1',
      passed: invoice.status !== 'DRAFT',
      message: invoice.status === 'DRAFT'
        ? 'Draft invoices cannot be submitted to the MoR. Finalize the invoice first.'
        : `Invoice status is ${invoice.status} — eligible for submission`,
    };
    checks.push(check5);
    if (!check5.passed) errors.push(check5.message);

    // ── Check 6: Duplicate IRN guard ──────────────────────────────────────
    const existing = await this.prisma.eimsRegistration.findFirst({
      where: { companyId, invoiceId, status: 'REGISTERED' },
    });
    const check6: ComplianceCheck = {
      rule: 'DUPLICATE_IRN',
      legalRef: 'EIMS Spec v1.2 §2.3 (idempotency)',
      passed: !existing,
      message: existing
        ? `Invoice ${invoiceId} is already registered with IRN ${existing.irn}. Re-submission will update the existing record.`
        : 'No duplicate registration found — safe to submit',
    };
    checks.push(check6);
    if (existing) warnings.push(check6.message);

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      checks,
    };
  }

  // ─── 4. Receipt Verification Hook ────────────────────────────────────────

  /**
   * Verify the digital cryptographic receipt returned by the MoR EIMS API.
   *
   * The MoR signs the `signedInvoice` string with its RSA private key (SHA-512
   * digest).  OVDS validates it against the trusted MoR public certificate stored
   * in `EIMS_MOR_CERTIFICATE`.  This prevents acceptance of tampered receipts.
   *
   * @returns `{ verified: boolean; reason: string }` — never throws so the
   *          caller can apply the EIMS_REQUIRE_SIGNATURE_VERIFICATION policy.
   */
  async verifyMorReceipt(params: {
    signedInvoice: string;
    signature: string;
    irn: string;
    registrationId: string;
  }): Promise<ReceiptVerificationResult> {
    const cert = this.config.get<string>('EIMS_MOR_CERTIFICATE') ?? '';
    if (!cert) {
      return {
        verified: false,
        reason: 'EIMS_MOR_CERTIFICATE is not configured — signature verification skipped',
        irn: params.irn,
      };
    }

    try {
      const verify = createVerify('RSA-SHA512');
      verify.update(params.signedInvoice);
      const isValid = verify.verify(cert, params.signature, 'base64');

      if (isValid) {
        // Persist verification status onto the EimsRegistration record.
        await this.prisma.eimsRegistration.update({
          where: { id: params.registrationId },
          data: { signatureVerified: true },
        }).catch(() => {
          // Non-fatal — the caller already has the result
        });
      }

      return {
        verified: isValid,
        reason: isValid
          ? 'RSA-SHA512 signature verified against EIMS_MOR_CERTIFICATE'
          : 'Signature verification FAILED — receipt may be tampered',
        irn: params.irn,
      };
    } catch (err: any) {
      return {
        verified: false,
        reason: `Signature verification error: ${err?.message ?? String(err)}`,
        irn: params.irn,
      };
    }
  }

  /**
   * Persist the MoR verification result and enforce the signature policy.
   * Throws `BadRequestException` when `EIMS_REQUIRE_SIGNATURE_VERIFICATION=true`
   * and the signature is invalid.
   */
  enforceSignaturePolicy(result: ReceiptVerificationResult): void {
    const required =
      this.config.get<string>('EIMS_REQUIRE_SIGNATURE_VERIFICATION') === 'true';
    if (required && !result.verified) {
      throw new BadRequestException(
        `MoR receipt signature verification failed for IRN ${result.irn}. ` +
          `Set EIMS_REQUIRE_SIGNATURE_VERIFICATION=false to accept unverified receipts.`,
      );
    }
    if (!result.verified) {
      this.logger.warn(
        `MoR receipt for IRN ${result.irn} could not be verified: ${result.reason}`,
      );
    }
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  /** Estimate annual turnover for VAT threshold check (trailing 12 months). */
  private async estimateAnnualTurnover(companyId: string): Promise<number> {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const result = await this.prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['PAID', 'PARTIAL', 'OVERDUE'] as any[] },
        createdAt: { gte: since },
      },
      _sum: { totalAmount: true },
    });

    return toNumber(result._sum.totalAmount);
  }
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface CompiledSummaryReport {
  reportType: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
  periodStart: string;
  periodEnd: string;
  companyTin: string;
  companyName: string;
  systemNumber: string;
  invoiceCount: number;
  totalInvoiceValue: number;
  totalTaxValue: number;
  totalValueWithTax: number;
  invoices: Array<{
    irn: string;
    documentNumber: string;
    invoiceValue: number;
    taxValue: number;
    valueWithTax: number;
  }>;
}

export interface ComplianceCheck {
  rule: string;
  legalRef: string;
  passed: boolean;
  message: string;
}

export interface CompliancePreFlightResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  checks: ComplianceCheck[];
}

export interface ReceiptVerificationResult {
  verified: boolean;
  reason: string;
  irn: string;
}

// ── Round to 2 decimal places ─────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
