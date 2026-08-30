/**
 * EimsService — backend orchestration for MoR EIMS invoice/receipt submission.
 *
 * Responsibilities:
 *   1. Transform OVDS request shapes into the MoR EIMS JSON schema.
 *   2. Call the MoR core API via MorEimsClient (handling the envelope,
 *      auth/token lifecycle, bulk conversationId, and error categories).
 *   3. Persist every attempt in the EimsRegistration / EimsReceipt /
 *      EimsBulkJob tables so submissions are auditable AND idempotent:
 *        - invoiceId is unique per EimsRegistration → a second register for
 *          the same invoice updates the existing row instead of creating a
 *          duplicate IRN.
 *        - bulk jobs are keyed by the MoR conversationId.
 *
 * Submission endpoints are RBAC-guarded at the controller (ADMIN/FINANCE to
 * submit, ADMIN to cancel) so a low-privilege user can never file to the MoR.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { MorEimsClient, MorEimsError } from './mor-eims.client';
import { EimsCertificateService } from './eims-certificate.service';
import {
  RegisterInvoiceDto,
  CancelInvoiceDto,
  VerifyInvoiceDto,
  BulkRegisterDto,
  BulkCancelDto,
  SalesReceiptDto,
  WithholdingReceiptDto,
  RegisterSourceSystemDto,
  RegisterInvoiceInputDto,
  SubmitInvoiceSummaryReportDto,
  normalizePaymentMode,
} from './eims.dto';
import {
  EimsInvoiceRegistrationRequest,
  EimsSalesReceiptRequest,
  EimsWithholdingReceiptRequest,
  EimsCancellationRequest,
  EimsBulkCancellationItem,
  EimsIntegrationConfig,
  MOR_BSP_CHECKLIST,
  MOR_ONBOARDING_CHECKLIST,
  verifyMoRInvoiceSignature,
  EIMS_BULK_JOBS_LIMIT,
  EIMS_REGISTRATIONS_LIMIT,
  EIMS_BSP_REPORT_LIMIT,
  EIMS_RECEIPTS_LIMIT,
  EIMS_TOKEN_REFRESH_BUFFER_MS,
  EIMS_TIMEOUT_MS,
} from '@ovds/shared';
import {
  mapInvoiceToMorRequest,
  MorMappingDefaults,
  OVDSInvoiceLike,
} from './eims-invoice.mapper';

@Injectable()
export class EimsService {
  private readonly logger = new Logger(EimsService.name);
  /**
   * One MoR client per company. The client caches the Bearer token and the
   * per-company signing material (INSA certificate + private key), so a single
   * tenant can never accidentally sign with another tenant's certificate.
   */
  private readonly clients = new Map<string, MorEimsClient>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly certificates: EimsCertificateService,
  ) {}

  /** Resolve (or lazily build) the MoR client bound to a company. */
  private getClient(companyId: string): MorEimsClient {
    const existing = this.clients.get(companyId);
    if (existing) return existing;
    const client = this.buildClient(companyId);
    this.clients.set(companyId, client);
    return client;
  }

  /** Build the MoR client from environment / config, scoped to a company. */
  private buildClient(companyId: string): MorEimsClient {
    const cfg = this.config;
    const apiUrl = cfg?.get<string>('EIMS_API_URL');
    const sandboxExplicit = cfg?.get<string>('EIMS_SANDBOX');
    const sandbox = sandboxExplicit === 'true' || sandboxExplicit === '1';

    if (!apiUrl && !sandbox) {
      this.logger.warn(`EIMS_API_URL is not configured for company ${companyId}. Set EIMS_API_URL or EIMS_SANDBOX=true to enable EIMS integration.`);
    }

    const integrationConfig: EimsIntegrationConfig = {
      apiUrl: apiUrl ?? cfg?.get<string>('EIMS_API_FALLBACK_URL') ?? '',
      sandbox,
      clientId: cfg?.get<string>('EIMS_CLIENT_ID') ?? '',
      clientSecret: cfg?.get<string>('EIMS_CLIENT_SECRET') ?? '',
      apiKey: cfg?.get<string>('EIMS_API_KEY') ?? '',
      tin: cfg?.get<string>('EIMS_TIN') ?? '',
      systemNumber: cfg?.get<string>('EIMS_SYSTEM_NUMBER') ?? '',
      systemType: (cfg?.get<string>('EIMS_DEFAULT_SYSTEM_TYPE') || 'ERP') as 'ERP' | 'POS' | 'MANUAL',
      timeout: cfg?.get<number>('EIMS_TIMEOUT_MS', EIMS_TIMEOUT_MS),
    };

    const getSigningMaterial = async () => {
      if (sandbox) return null;
      // Resolve THIS company's INSA certificate + private key, never a default.
      const privateKeyPem = await this.certificates.getDecryptedPrivateKey(companyId);
      const certificateB64 = await this.certificates.getCertificateB64(companyId);
      if (!privateKeyPem || !certificateB64) return null;
      return { privateKeyPem, certificateB64 };
    };

    return new MorEimsClient(integrationConfig, getSigningMaterial);
  }

  /**
   * Build the MoR mapping defaults for a company: seller identity from the
   * `Company` row + the per-company source system, with environment fallbacks
   * for any sparse address field.
   */
  private async buildMappingDefaults(
    companyId: string,
    opts?: { systemNumber?: string; salesPersonName?: string; cashierName?: string },
  ): Promise<{ defaults: MorMappingDefaults; source: { id: string; systemNumber: string } }> {
    const cfg = this.config;
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    const source = opts?.systemNumber
      ? await this.prisma.eimsSourceSystem.findFirst({
          where: { companyId, systemNumber: opts.systemNumber },
        })
      : await this.prisma.eimsSourceSystem.findFirst({
          where: { companyId, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        });

    if (!source) {
      throw new BadRequestException(
        `No approved EIMS source system registered for company ${companyId}. ` +
          'Register and approve a source system before submitting invoices to the MoR.',
      );
    }

    const defaults: MorMappingDefaults = {
      country: cfg?.get<string>('EIMS_DEFAULT_COUNTRY') || 'ETHIOPIA',
      sellerCity: cfg?.get<string>('EIMS_DEFAULT_CITY') || 'Addis Ababa',
      sellerRegion: cfg?.get<string>('EIMS_DEFAULT_REGION') || 'Addis Ababa',
      sellerWereda: cfg?.get<string>('EIMS_DEFAULT_WEREDA') || '01',
      sellerSubCity: cfg?.get<string>('EIMS_DEFAULT_SUBCITY') || null,
      sellerLocality: cfg?.get<string>('EIMS_DEFAULT_LOCALITY') || null,
      sellerZone: cfg?.get<string>('EIMS_DEFAULT_ZONE') || null,
      sellerKebele: cfg?.get<string>('EIMS_DEFAULT_KEBELE') || null,
      sellerHouseNumber: cfg?.get<string>('EIMS_DEFAULT_HOUSE_NUMBER') || null,
      sellerPhone: cfg?.get<string>('EIMS_DEFAULT_PHONE') || '',
      sellerEmail: cfg?.get<string>('EIMS_DEFAULT_EMAIL') || '',
      paymentMode: cfg?.get<string>('EIMS_DEFAULT_PAYMENT_MODE') || 'CASH',
      paymentTerm: cfg?.get<string>('EIMS_DEFAULT_PAYMENT_TERM') || 'IMMEDIATE',
      systemType: (source.systemType as 'ERP' | 'POS' | 'MANUAL') ?? (cfg?.get<string>('EIMS_DEFAULT_SYSTEM_TYPE') || 'ERP') as 'ERP' | 'POS' | 'MANUAL',
      systemNumber: source.systemNumber,
      version: cfg?.get<string>('EIMS_DEFAULT_VERSION') || '1.0.0',
      currency: company?.currencyCode || cfg?.get<string>('DEFAULT_CURRENCY') || 'ETB',
      salesPersonName: opts?.salesPersonName,
      cashierName: opts?.cashierName,
    };

    // Prefer the company's own seller profile (e.g. a Government Institution's
    // TIN/legal-name/address stored on the tenant) over the deployment-level
    // env defaults, so each company files invoices to the MoR under its own
    // identity rather than a shared default.
    try {
      const settings = company?.settings ? JSON.parse(company.settings) : null;
      const seller = settings?.sellerDetails;
      if (seller && typeof seller === 'object') {
        if (seller.phone) defaults.sellerPhone = seller.phone;
        if (seller.email) defaults.sellerEmail = seller.email;
        if (seller.region) defaults.sellerRegion = seller.region;
        if (seller.city) defaults.sellerCity = seller.city;
        if (seller.wereda) defaults.sellerWereda = seller.wereda;
        if (seller.zone) defaults.sellerZone = seller.zone;
        if (seller.kebele) defaults.sellerKebele = seller.kebele;
        if (seller.houseNumber) defaults.sellerHouseNumber = seller.houseNumber;
        if (seller.subCity) defaults.sellerSubCity = seller.subCity;
        if (seller.locality) defaults.sellerLocality = seller.locality;
        if (seller.country) defaults.country = seller.country;
        if (seller.legalName) defaults.sellerLegalName = seller.legalName;
        if (seller.tin) defaults.sellerTin = seller.tin;
        if (seller.vatNumber) defaults.sellerVatNumber = seller.vatNumber;
      }
    } catch {
      // ignore malformed company settings JSON; env defaults remain in effect
    }

    return {
      defaults,
      source: { id: source.id, systemNumber: source.systemNumber },
    };
  }

  // ── Source systems (company-level MoR onboarding record) ─────────────────────

  async registerSourceSystem(companyId: string, dto: RegisterSourceSystemDto) {
    const upserted = await this.prisma.eimsSourceSystem.upsert({
      where: { companyId_systemNumber: { companyId, systemNumber: dto.systemNumber } },
      create: {
        companyId,
        systemNumber: dto.systemNumber,
        systemType: dto.systemType,
        enterpriseId: dto.enterpriseId,
        establishmentId: dto.establishmentId,
        clientId: dto.clientId,
        clientSecret: dto.clientSecret,
        apiKey: dto.apiKey,
        callbackUrl: dto.callbackUrl,
        status: 'PENDING',
      },
      update: {
        systemType: dto.systemType,
        enterpriseId: dto.enterpriseId,
        establishmentId: dto.establishmentId,
        clientId: dto.clientId,
        clientSecret: dto.clientSecret,
        apiKey: dto.apiKey,
        callbackUrl: dto.callbackUrl,
      },
    });
    return { success: true, data: upserted };
  }

  async listSourceSystems(companyId: string) {
    const rows = await this.prisma.eimsSourceSystem.findMany({
      where: { companyId },
    });
    return { success: true, data: rows };
  }

  // ── Invoice registration ─────────────────────────────────────────────────────

  private toMorRequest(companyId: string, dto: RegisterInvoiceDto): EimsInvoiceRegistrationRequest {
    const cfg = this.config;
    return {
      SellerDetails: {
        Tin: dto.seller.tin,
        LegalName: dto.seller.legalName,
        VatNumber: dto.seller.vatNumber,
        Phone: dto.seller.phone,
        Email: dto.seller.email,
        City: dto.seller.city,
        Region: dto.seller.region,
        Wereda: dto.seller.wereda,
        HouseNumber: dto.seller.houseNumber ?? null,
        SubCity: dto.seller.subCity ?? null,
        Locality: dto.seller.locality ?? null,
        IdNumber: dto.seller.idNumber,
        IdType: dto.seller.idType,
        Country: dto.seller.country || cfg.get<string>('EIMS_DEFAULT_COUNTRY') || 'ETHIOPIA',
        Zone: dto.seller.zone,
        Kebele: dto.seller.kebele,
      },
      BuyerDetails: {
        Tin: dto.buyer.tin,
        LegalName: dto.buyer.legalName,
        VatNumber: dto.buyer.vatNumber,
        Phone: dto.buyer.phone,
        Email: dto.buyer.email,
        City: dto.buyer.city,
        Region: dto.buyer.region,
        Wereda: dto.buyer.wereda,
        HouseNumber: dto.buyer.houseNumber ?? null,
        SubCity: dto.buyer.subCity ?? null,
        Locality: dto.buyer.locality ?? null,
        IdNumber: dto.buyer.idNumber,
        IdType: dto.buyer.idType,
        Country: dto.buyer.country || cfg.get<string>('EIMS_DEFAULT_COUNTRY') || 'ETHIOPIA',
        Zone: dto.buyer.zone,
        Kebele: dto.buyer.kebele,
      },
      DocumentDetails: {
        DocumentNumber: dto.documentNumber,
        Date: dto.date,
        Type: dto.documentType,
      },
      ItemList: dto.lines.map((l) => ({
        LineNumber: l.lineNumber,
        ItemCode: l.itemCode,
        ProductDescription: l.productDescription,
        NatureOfSupplies: l.natureOfSupplies,
        Unit: l.unit,
        Quantity: l.quantity,
        UnitPrice: Number(l.unitPrice),
        PreTaxValue: Number(l.preTaxValue),
        Discount: Number(l.discount),
        TaxCode: l.taxCode,
        TaxAmount: Number(l.taxAmount),
        ExciseTaxValue: Number(l.exciseTaxValue),
        HarmonizationCode: l.harmonizationCode ?? null,
        TotalLineAmount: Number(l.totalLineAmount),
      })),
      PaymentDetails: {
        Mode: dto.paymentMode || cfg.get<string>('EIMS_DEFAULT_PAYMENT_MODE') || 'CASH',
        PaymentTerm: dto.paymentTerm || cfg.get<string>('EIMS_DEFAULT_PAYMENT_TERM') || 'IMMEDIATE',
      },
      ReferenceDetails: {
        PreviousIrn: dto.previousIrn ?? '',
        RelatedDocument: dto.relatedDocument ?? null,
      },
      SourceSystem: {
        SystemNumber: dto.systemNumber,
        SystemType: dto.systemType,
        SalesPersonName: dto.salesPersonName ?? '',
        CashierName: dto.cashierName ?? '',
        InvoiceCounter: 0,
      },
      TransactionType: dto.transactionType,
      ValueDetails: {
        TotalValue: Number(dto.totalValue),
        TaxValue: Number(dto.taxValue),
        ExciseValue: Number(dto.exciseValue),
        IncomeWithholdValue: Number(dto.incomeWithholdValue),
        TransactionWithholdValue: Number(dto.transactionWithholdValue),
        Discount: Number(dto.discount),
        InvoiceCurrency: dto.invoiceCurrency,
      },
      Version: dto.version || cfg.get<string>('EIMS_DEFAULT_VERSION') || '1.0.0',
    };
  }

  async registerInvoice(companyId: string, dto: RegisterInvoiceDto) {
    const morRequest = this.toMorRequest(companyId, dto);
    let res;
    try {
      res = await this.getClient(companyId).registerInvoice(morRequest);
    } catch (err) {
      await this.persistFailure(companyId, dto.invoiceId, morRequest, err);
      throw err;
    }

    const verified = await this.verifyMorReceipt(res.body);
    this.enforceSignaturePolicy(verified);

    const saved = await this.prisma.$transaction(async (tx) => {
      const source = await tx.eimsSourceSystem.findFirst({
        where: { companyId, systemNumber: dto.systemNumber },
      });
      const existing = await tx.eimsRegistration.findFirst({
        where: { companyId, invoiceId: dto.invoiceId },
      });
      if (existing) {
        return tx.eimsRegistration.update({
          where: { id: existing.id },
          data: {
            sourceSystemId: source?.id ?? null,
            irn: res.body.irn,
            documentNumber: res.body.documentNumber,
            status: this.mapStatus(res.body.status),
            signedQr: res.body.signedQR,
            signedInvoice: res.body.signedInvoice,
            invoiceSignature: res.body.invoiceSignature,
            signatureVerified: verified,
            signatureVerifiedAt: verified === null ? null : new Date(),
            ackDate: new Date(res.body.ackDate),
            requestPayload: JSON.stringify(morRequest),
            responsePayload: JSON.stringify(res.body),
            submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
            registeredAt: new Date(),
          },
        });
      }
      return tx.eimsRegistration.create({
        data: {
          companyId,
          invoiceId: dto.invoiceId,
          sourceSystemId: source?.id ?? null,
          irn: res.body.irn,
          documentNumber: res.body.documentNumber,
          status: this.mapStatus(res.body.status),
          signedQr: res.body.signedQR,
          signedInvoice: res.body.signedInvoice,
          invoiceSignature: res.body.invoiceSignature,
          signatureVerified: verified,
          signatureVerifiedAt: verified === null ? null : new Date(),
          ackDate: new Date(res.body.ackDate),
          requestPayload: JSON.stringify(morRequest),
          responsePayload: JSON.stringify(res.body),
          submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
          registeredAt: new Date(),
        },
      });
    });

    return { success: true, data: saved, mor: res.body };
  }

  /**
   * Validate that an OVDS invoice has all MoR-required fields populated.
   *
   * MoR rejects submissions missing seller TIN, buyer identity, item lines,
   * or currency. We fail fast with a clear BadRequestException rather than
   * wasting a round-trip on a request the MoR would reject with SCHEMA ERROR.
   *
   * IRN is generated by the MoR on registration — we do NOT generate it
   * client-side. We only validate that, if the invoice was already registered,
   * the existing IRN is still present.
   */
  private validateInvoiceForMor(companyId: string, invoice: {
    invoiceNumber: string;
    company?: { tin?: string | null; name?: string | null } | null;
    customer?: { name?: string | null; tin?: string | null } | null;
    customerName?: string | null;
    invoiceItem?: unknown[];
    currencyCode?: string | null;
    status?: string | null;
  }): void {
    const errors: string[] = [];

    if (!invoice.company?.tin) {
      errors.push('Seller/company TIN is required for MoR submission');
    } else if (!/^\d{10}$/.test(invoice.company.tin.replace(/\D/g, ''))) {
      errors.push(`Seller TIN "${invoice.company.tin}" is not a valid 10-digit Ethiopian TIN`);
    }

    if (!invoice.company?.name) {
      errors.push('Seller/company legal name is required for MoR submission');
    }

    const buyerName = invoice.customer?.name ?? invoice.customerName;
    if (!buyerName) {
      errors.push('Buyer/customer name is required for MoR submission');
    }

    if (!invoice.invoiceItem || invoice.invoiceItem.length === 0) {
      errors.push('At least one invoice line item is required for MoR submission');
    }

    if (!invoice.currencyCode) {
      errors.push('Invoice currency is required for MoR submission');
    }

    if (invoice.status === 'DRAFT') {
      errors.push('Draft invoices cannot be submitted to the MoR. Finalize the invoice first.');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: `Invoice ${invoice.invoiceNumber} is not ready for MoR submission`,
        errors,
      });
    }
  }

  /**
   * Create an `InvoiceActivity` record for an EIMS registration attempt.
   *
   * This gives the audit trail / activity-log view the same visibility into
   * MoR filings that it has for payments, edits, etc. — every submit, cancel,
   * verify, and filing is recorded as a discrete action.
   */
  private async recordEimsActivity(
    tx: Prisma.TransactionClient,
    companyId: string,
    invoiceId: string,
    action: string,
    detail: string,
    performedBy?: string | null,
  ): Promise<void> {
    await tx.invoiceActivity.create({
      data: {
        invoiceId,
        companyId,
        action,
        detail: detail.slice(0, 500),
        performedBy: performedBy ?? 'system',
      },
    });
  }

  /**
   * Submit an OVDS `Invoice` to MoR EIMS end-to-end:
   *
   *   Data flow (OVDS invoice creation → EIMS registration → MoR confirmation → OVDS status update):
   *     1. Load the OVDS `Invoice` aggregate (header + lines + company + customer).
   *     2. Validate the invoice for MoR submission (required fields, status checks).
   *        IRN is generated BY THE MoR on registration — we do not create it.
   *     3. Map the OVDS invoice → MoR EIMS payload via the data-mapping registry
   *        (`mapInvoiceToMorRequest`), which resolves seller/buyer party details,
   *        item lines, tax breakdown, and QR/signature fields.
   *     4. Sign (INSA certificate) and POST to the MoR core API via the per-company
   *        `MorEimsClient`. Retries on 502/503/504; sandbox mode short-circuits to a
   *        deterministic mock acknowledgement.
   *     5. Verify the MoR receipt signature (RSA-SHA512 against EIMS_MOR_CERTIFICATE)
   *        when a trusted cert is configured.
   *     6. Persist the MoR acknowledgement (`EimsRegistration`) and reflect the IRN +
   *        status back onto the OVDS `Invoice` row (single source of truth for
   *        `eimsIrn` / `eimsStatus` / `eimsSignedQr`).
   *     7. Create an `InvoiceActivity` row so the filing is visible in the invoice's
   *        audit trail.
   *
   * This is the canonical "input → process → output → submit → MoR confirm" path;
   * the frontend only needs to pass the OVDS invoice id.
   */
  async registerSalesInvoice(
    companyId: string,
    invoiceId: string,
    opts?: RegisterInvoiceInputDto,
    performedBy?: string | null,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { invoiceItem: true, company: true, customer: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found for company ${companyId}`);
    }

    this.validateInvoiceForMor(companyId, invoice);

    const { defaults, source } = await this.buildMappingDefaults(companyId, {
      systemNumber: opts?.systemNumber ?? (invoice as { fsNo?: string | null }).fsNo ?? undefined,
      salesPersonName: opts?.salesPersonName,
      cashierName: opts?.cashierName,
    });

    const morRequest = mapInvoiceToMorRequest(
      invoice as unknown as OVDSInvoiceLike,
      defaults,
    );

    let res;
    try {
      res = await this.getClient(companyId).registerInvoice(morRequest);
    } catch (err) {
      await this.persistFailure(companyId, invoiceId, morRequest, err);
      throw err;
    }

    const verified = await this.verifyMorReceipt(res.body);
    this.enforceSignaturePolicy(verified);

    const sandbox = this.getClient(companyId).sandbox;
    const status = this.mapStatus(res.body.status);
    const saved = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.eimsRegistration.findFirst({
        where: { companyId, invoiceId },
      });
      const regData = {
        companyId,
        invoiceId,
        sourceSystemId: source?.id ?? null,
        irn: res.body.irn,
        documentNumber: res.body.documentNumber,
        status,
        signedQr: res.body.signedQR,
        signedInvoice: res.body.signedInvoice,
        invoiceSignature: res.body.invoiceSignature,
        signatureVerified: verified,
        signatureVerifiedAt: verified === null ? null : new Date(),
        ackDate: new Date(res.body.ackDate),
        requestPayload: JSON.stringify(morRequest),
        responsePayload: JSON.stringify(res.body),
        submissionMode: sandbox ? 'sandbox' : 'live',
        registeredAt: new Date(),
      };
      const reg = existing
        ? await tx.eimsRegistration.update({ where: { id: existing.id }, data: regData })
        : await tx.eimsRegistration.create({ data: regData });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          eimsIrn: res.body.irn,
          eimsStatus: status,
          eimsSignedQr: res.body.signedQR,
          eimsRegisteredAt: new Date(),
        },
      });

      // Audit trail: record the registration filing.
      await this.recordEimsActivity(
        tx,
        companyId,
        invoiceId,
        'EIMS_REGISTER',
        `Invoice filed to MoR EIMS (status=${status}, irn=${res.body.irn ?? 'n/a'}, mode=${sandbox ? 'sandbox' : 'live'})`,
        performedBy,
      );

      return reg;
    });

    return { success: true, data: saved, mor: res.body };
  }

  private async persistFailure(
    companyId: string,
    invoiceId: string,
    request: unknown,
    err: unknown,
  ) {
    const message = err instanceof MorEimsError ? err.message : String(err);
    const systemNumber = (request as { SourceSystem?: { SystemNumber?: string } })?.SourceSystem?.SystemNumber;
    await this.prisma.$transaction(async (tx) => {
      const source = systemNumber
        ? await tx.eimsSourceSystem.findFirst({ where: { companyId, systemNumber } })
        : null;
      const existing = await tx.eimsRegistration.findFirst({
        where: { companyId, invoiceId },
      });
      if (existing) {
        await tx.eimsRegistration.update({
          where: { id: existing.id },
          data: {
            sourceSystemId: source?.id ?? null,
            status: 'FAILED',
            errorMessage: message.slice(0, 1000),
            requestPayload: JSON.stringify(request),
            attemptCount: { increment: 1 },
          },
        });
      } else {
        await tx.eimsRegistration.create({
          data: {
            companyId,
            invoiceId,
            sourceSystemId: source?.id ?? null,
            status: 'FAILED',
            errorMessage: message.slice(0, 1000),
            requestPayload: JSON.stringify(request),
            attemptCount: 1,
          },
        });
      }
    });
  }

  /**
   * Verify the MoR's cryptographic receipt on a registration response.
   *
   * The MoR returns a base64 `signedInvoice` plus an RSA-SHA512 `invoiceSignature`
   * over it. We verify that against the trusted MoR public certificate
   * (EIMS_MOR_CERTIFICATE). The certificate is *not* taken from the response —
   * a network MITM could swap it — so, without the trusted cert, verification is
   * simply skipped and the acknowledgement is recorded as unverified rather than
   * silently trusted.
   *
   * @returns null when not attempted (sandbox / no cert / no signature), else the
   *          verification outcome. Never throws for a *bad* signature; the caller
   *          decides how strict to be.
   */
  private async verifyMorReceipt(body: {
    signedInvoice?: string | null;
    invoiceSignature?: string | null;
  }): Promise<boolean | null> {
    const cert = this.config?.get<string>('EIMS_MOR_CERTIFICATE');
    if (!cert || cert.trim() === '') {
      this.logger.warn(
        'EIMS_MOR_CERTIFICATE is not configured; MoR response signatures will not be cryptographically verified.',
      );
      return null;
    }
    if (!body.signedInvoice || !body.invoiceSignature) {
      this.logger.warn('MoR response is missing signedInvoice/invoiceSignature; cannot verify receipt.');
      return null;
    }
    try {
      return await verifyMoRInvoiceSignature(body.signedInvoice, body.invoiceSignature, cert);
    } catch (err) {
      this.logger.error(`MoR receipt verification threw: ${String(err)}`);
      return false;
    }
  }

  /**
   * Enforce the configured policy for an unverifiable receipt. When strict mode
   * is on, a receipt that failed (or was not attempted because of a missing
   * certificate) is rejected so an unverified acknowledgement never reaches the
   * compliance ledger as if it were confirmed.
   */
  private enforceSignaturePolicy(verified: boolean | null): void {
    const strict = this.config?.get<string>('EIMS_REQUIRE_SIGNATURE_VERIFICATION') === 'true';
    if (strict && verified !== true) {
      throw new UnprocessableEntityException(
        verified === false
          ? 'MoR response signature did not verify against the trusted MoR certificate.'
          : 'MoR response signature could not be verified (certificate or signature missing).',
      );
    }
  }

  private mapStatus(s: string | undefined): string {
    switch ((s ?? '').toUpperCase()) {
      case 'REGISTERED':
      case 'ACTIVE':
        return 'REGISTERED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'PENDING':
        return 'PENDING';
      default:
        return 'FAILED';
    }
  }

  /**
   * Cancel a MoR-registered invoice.
   *
   * Data flow:
   *   1. Resolve the existing MoR IRN from the `EimsRegistration` row.
   *   2. POST to the MoR /v1/cancel endpoint with reason code + remark.
   *   3. Persist cancellation on the `EimsRegistration` row and reflect
   *      `eimsStatus = CANCELLED` back onto the OVDS `Invoice`.
   *   4. Record an `EIMS_CANCEL` activity for the audit trail.
   */
  async cancelInvoice(companyId: string, invoiceId: string, dto: CancelInvoiceDto, performedBy?: string | null) {
    const morResponse = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.eimsRegistration.findFirst({
        where: { companyId, invoiceId },
      });
      if (!reg || !reg.irn) {
        throw new NotFoundException(`No registered IRN found for invoice ${invoiceId}`);
      }
      const request: EimsCancellationRequest = {
        irn: reg.irn,
        reasonCode: dto.reasonCode,
        remark: dto.remark,
      };
      const res = await this.getClient(companyId).cancelInvoice(request);
      await tx.eimsRegistration.update({
        where: { id: reg.id },
        data: {
          status: 'CANCELLED',
          reason: dto.remark ?? dto.reasonCode,
          cancelledAt: new Date(res.body.cancellationDate),
          responsePayload: JSON.stringify(res.body),
        },
      });
      await tx.invoice.updateMany({
        where: { id: invoiceId, companyId },
        data: { eimsStatus: 'CANCELLED' },
      });
      await this.recordEimsActivity(
        tx,
        companyId,
        invoiceId,
        'EIMS_CANCEL',
        `Invoice cancelled with MoR EIMS (reason=${dto.reasonCode}, irn=${reg.irn})`,
        performedBy,
      );
      return res.body;
    });

    return { success: true, data: { irn: '', ...morResponse } };
  }

  async verifyInvoice(companyId: string, dto: VerifyInvoiceDto) {
    const res = await this.getClient(companyId).verify(dto.irn);
    return { success: true, data: res.body };
  }

  /**
   * Verify an OVDS invoice's MoR IRN. Resolves the IRN from the registration
   * row (so the frontend only needs the OVDS invoice id) and reflects the
   * verified status back onto the OVDS `Invoice` row.
   */
  async verifyInvoiceById(companyId: string, invoiceId: string) {
    const reg = await this.prisma.eimsRegistration.findFirst({
      where: { companyId, invoiceId },
    });
    if (!reg || !reg.irn) {
      throw new NotFoundException(`No registered IRN found for invoice ${invoiceId}`);
    }
    const res = await this.getClient(companyId).verify(reg.irn);
    await this.prisma.invoice.updateMany({
      where: { id: invoiceId, companyId },
      data: { eimsStatus: this.mapStatus(res.body.status) },
    });
    return { success: true, data: res.body };
  }

  // ── Bulk ─────────────────────────────────────────────────────────────────────

  async bulkRegister(companyId: string, dto: BulkRegisterDto) {
    // Resolve the per-invoice MoR requests server-side from the OVDS invoices
    // so the frontend only submits a list of invoice ids (the canonical flow).
    const invoices = await this.prisma.invoice.findMany({
      where: { id: { in: dto.invoiceIds }, companyId },
      include: { invoiceItem: true, company: true, customer: true },
    });
    const { defaults } = await this.buildMappingDefaults(companyId);
    const morRequests = invoices.map((inv) =>
      mapInvoiceToMorRequest(inv as unknown as OVDSInvoiceLike, defaults),
    );

    const { response, status } = await this.getClient(companyId).bulkRegister(morRequests);
    const job = await this.prisma.$transaction(async (tx) => {
      return tx.eimsBulkJob.create({
        data: {
          companyId,
          jobType: 'BULK_REGISTER',
          conversationId: response.conversationId,
          status: 'PENDING',
          requestCount: invoices.length,
          submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
          invoiceIds: JSON.stringify(dto.invoiceIds),
        },
      });
    });
    return {
      success: true,
      data: { conversationId: response.conversationId, status, jobId: job.id },
    };
  }

  async bulkCancel(companyId: string, dto: BulkCancelDto) {
    // Resolve the MoR IRN for each OVDS invoiceId from the eimsRegistration table
    // so the MoR does not receive an invoiceId where it expects an IRN.
    const invoiceIds = dto.items.map((i) => i.invoiceId);
    const registrations = await this.prisma.eimsRegistration.findMany({
      where: { companyId, invoiceId: { in: invoiceIds } },
      select: { invoiceId: true, irn: true },
    });
    const irnByInvoice = new Map(registrations.map((r) => [r.invoiceId, r.irn]));

    const items: EimsBulkCancellationItem[] = dto.items.map((i) => ({
      Irn: irnByInvoice.get(i.invoiceId) ?? i.invoiceId,
      ReasonCode: i.reasonCode,
      Remark: i.remark,
    }));

    const { response, status } = await this.getClient(companyId).bulkCancel(items);
    const job = await this.prisma.$transaction(async (tx) => {
      const created = await tx.eimsBulkJob.create({
        data: {
          companyId,
          jobType: 'BULK_CANCEL',
          conversationId: response.conversationId,
          status: 'PENDING',
          requestCount: dto.items.length,
          submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
        },
      });
      // Mark each registration as CANCELLED in sync with MoR
      for (const item of dto.items) {
        const irn = irnByInvoice.get(item.invoiceId);
        if (irn) {
          await tx.eimsRegistration.updateMany({
            where: { companyId, invoiceId: item.invoiceId, irn },
            data: { status: 'CANCELLED', reason: item.remark ?? item.reasonCode, cancelledAt: new Date() },
          });
          await tx.invoice.updateMany({
            where: { id: item.invoiceId, companyId },
            data: { eimsStatus: 'CANCELLED' },
          });
        }
      }
      return created;
    });
    return {
      success: true,
      data: { conversationId: response.conversationId, status, jobId: job.id },
    };
  }

  async listBulkJobs(companyId?: string) {
    const jobs = await this.prisma.eimsBulkJob.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: EIMS_BULK_JOBS_LIMIT,
    });
    return { success: true, data: jobs };
  }

  // ── Receipts ─────────────────────────────────────────────────────────────────

  async registerSalesReceipt(companyId: string, dto: SalesReceiptDto) {
    const cfg = this.config;
    const request: EimsSalesReceiptRequest = {
      ReceiptNumber: dto.receiptNumber,
      ReceiptType: 'Sales Receipts',
      Reason: dto.reason ?? 'Payment received',
      ReceiptDate: new Date().toISOString(),
      ReceiptCounter: dto.receiptNumber,
      SourceSystemType: cfg.get<string>('EIMS_DEFAULT_SYSTEM_TYPE') || 'ERP',
      SourceSystemNumber: '', // resolved inside transaction
      ReceiptCurrency: cfg.get<string>('DEFAULT_CURRENCY') || 'ETB',
      CollectedAmount: Number(dto.collectedAmount),
      SellerTIN: this.getClient(companyId).tin,
      Invoices: [
        {
          InvoiceIRN: '', // resolved inside transaction
          PaymentCoverage: dto.paymentCoverage,
          InvoicePaidAmount: Number(dto.collectedAmount),
          TotalAmount: Number(dto.collectedAmount),
        },
      ],
      TransactionDetails: {
        ModeOfPayment: normalizePaymentMode(dto.paymentMode, cfg.get<string>('EIMS_DEFAULT_PAYMENT_MODE') || 'CASH'),
        ChequeNumber: dto.chequeNumber ?? null,
        CPONumber: dto.cpoNumber ?? null,
        CollectorName: dto.collectorName ?? undefined,
      },
    };

    const saved = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.eimsRegistration.findFirst({
        where: { companyId, invoiceId: dto.invoiceId },
      });
      const source = reg?.sourceSystemId
        ? await tx.eimsSourceSystem.findFirst({ where: { id: reg.sourceSystemId } })
        : null;
      request.SourceSystemNumber = source?.systemNumber ?? '';
      request.Invoices[0].InvoiceIRN = reg?.irn ?? '';
      const res = await this.getClient(companyId).registerSalesReceipt(request);
      return tx.eimsReceipt.create({
        data: {
          companyId,
          invoiceId: dto.invoiceId,
          receiptNumber: dto.receiptNumber,
          receiptType: 'SALES',
          receiptIrn: res.body?.receiptIrn,
          collectedAmount: Number(dto.collectedAmount),
          status: this.mapStatus(res.body?.status),
          requestPayload: JSON.stringify(request),
          responsePayload: JSON.stringify(res.body),
          submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
          registeredAt: new Date(),
        },
      });
    });

    // Re-fetch MoR response for the return payload
    const responsePayload = saved.responsePayload ? JSON.parse(saved.responsePayload) : {};
    return { success: true, data: saved, mor: responsePayload };
  }

  async registerWithholdingReceipt(companyId: string, dto: WithholdingReceiptDto) {
    const cfg = this.config;
    const request: EimsWithholdingReceiptRequest = {
      ReceiptNumber: dto.receiptNumber,
      Reason: dto.reason ?? 'Withholding remitted',
      ReceiptCounter: dto.receiptNumber,
      SourceSystemType: cfg.get<string>('EIMS_DEFAULT_SYSTEM_TYPE') || 'ERP',
      SourceSystemNumber: '', // resolved inside transaction
      InvoiceDetail: { InvoiceIRN: '', Currency: cfg.get<string>('DEFAULT_CURRENCY') || 'ETB' },
      WithholdDetail: {
        Type: dto.withholdType,
        PreTaxAmount: Number(dto.preTaxAmount),
        WithholdingAmount: Number(dto.withholdingAmount),
      },
    };

    const saved = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.eimsRegistration.findFirst({
        where: { companyId, invoiceId: dto.invoiceId },
      });
      const source = reg?.sourceSystemId
        ? await tx.eimsSourceSystem.findFirst({ where: { id: reg.sourceSystemId } })
        : null;
      request.SourceSystemNumber = source?.systemNumber ?? '';
      request.InvoiceDetail.InvoiceIRN = reg?.irn ?? '';
      const res = await this.getClient(companyId).registerWithholdingReceipt(request);
      return tx.eimsReceipt.create({
        data: {
          companyId,
          invoiceId: dto.invoiceId,
          receiptNumber: dto.receiptNumber,
          receiptType: 'WITHHOLDING',
          receiptIrn: res.body?.receiptIrn,
          collectedAmount: Number(dto.withholdingAmount),
          status: this.mapStatus(res.body?.status),
          requestPayload: JSON.stringify(request),
          responsePayload: JSON.stringify(res.body),
          submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
          registeredAt: new Date(),
        },
      });
    });

    const responsePayload = saved.responsePayload ? JSON.parse(saved.responsePayload) : {};
    return { success: true, data: saved, mor: responsePayload };
  }

  async handleBulkCallback(conversationId: string, status: string, results?: unknown[]) {
    await this.prisma.$transaction(async (tx) => {
      const job = await tx.eimsBulkJob.findFirst({
        where: { conversationId },
      });
      if (!job) {
        throw new NotFoundException(`Bulk job ${conversationId} not found`);
      }
      const mappedStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'PROCESSING';
      await tx.eimsBulkJob.update({
        where: { id: job.id },
        data: {
          status: mappedStatus,
          responsePayload: results ? JSON.stringify(results) : null,
        },
      });
    });
    return { success: true };
  }

  // ── Read models for dashboard / registrations ─────────────────────────────────

  async listRegistrations(companyId: string, status?: string) {
    const rows = await this.prisma.eimsRegistration.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: EIMS_REGISTRATIONS_LIMIT,
    });
    return { success: true, data: rows };
  }

  async complianceReadiness(companyId: string) {
    const [source, registrations, receipts] = await Promise.all([
      this.prisma.eimsSourceSystem.findFirst({ where: { companyId } }),
      this.prisma.eimsRegistration.count({ where: { companyId } }),
      this.prisma.eimsReceipt.count({ where: { companyId } }),
    ]);
    return {
      success: true,
      data: {
        onboarded: !!source,
        sourceSystemStatus: source?.status ?? null,
        registrationsCount: registrations,
        receiptsCount: receipts,
        submissionMode: this.getClient(companyId).sandbox ? 'sandbox' : 'live',
      },
    };
  }

  // ── BSP checklist / onboarding / report ──────────────────────────────────────

  async bspChecklist() {
    return { success: true, data: MOR_BSP_CHECKLIST };
  }

  async onboardingChecklist() {
    return { success: true, data: MOR_ONBOARDING_CHECKLIST };
  }

  async bspReport(companyId: string) {
    const rows = await this.prisma.eimsRegistration.findMany({
      where: { companyId },
      select: { id: true, invoiceId: true, status: true, irn: true, documentNumber: true, registeredAt: true },
      orderBy: { registeredAt: 'desc' },
      take: EIMS_BSP_REPORT_LIMIT,
    });
    return { success: true, data: rows };
  }

  async recordBspResult(companyId: string, dto: { testCaseId: string; documentNumber?: string; irn?: string; result: 'PASS' | 'FAIL'; notes?: string }) {
    const record = await this.prisma.eimsBspResult.create({
      data: {
        companyId,
        testCaseId: dto.testCaseId,
        documentNumber: dto.documentNumber,
        irn: dto.irn,
        result: dto.result,
        notes: dto.notes,
      },
    });
    this.logger.log(`BSP result recorded: ${dto.testCaseId} = ${dto.result}`);
    return { success: true, data: record };
  }

  // ── Source system sub-resources ──────────────────────────────────────────────

  async updateSourceSystemStatus(companyId: string, id: string, status: string) {
    const record = await this.prisma.eimsSourceSystem.findFirst({ where: { id, companyId } });
    if (!record) throw new NotFoundException(`Source system ${id} not found`);
    const updated = await this.prisma.eimsSourceSystem.update({ where: { id }, data: { status } });
    return { success: true, data: updated };
  }

  async updateSourceSystemCredentials(companyId: string, id: string, dto: Record<string, string>) {
    const record = await this.prisma.eimsSourceSystem.findFirst({ where: { id, companyId } });
    if (!record) throw new NotFoundException(`Source system ${id} not found`);
    const updated = await this.prisma.eimsSourceSystem.update({ where: { id }, data: dto });
    return { success: true, data: updated };
  }

  async updateSourceSystemStep(companyId: string, id: string, step: string) {
    const record = await this.prisma.eimsSourceSystem.findFirst({ where: { id, companyId } });
    if (!record) throw new NotFoundException(`Source system ${id} not found`);
    const updated = await this.prisma.eimsSourceSystem.update({ where: { id }, data: { status: step } });
    return { success: true, data: updated };
  }

  async listEnterprises(companyId: string) {
    const sources = await this.prisma.eimsSourceSystem.findMany({
      where: { companyId },
      select: { enterpriseId: true, enterpriseName: true },
    });
    const seen = new Map<string, string>();
    for (const s of sources) {
      if (s.enterpriseId) {
        seen.set(s.enterpriseId, s.enterpriseName || s.enterpriseId);
      }
    }
    return { success: true, data: [...seen.entries()].map(([id, name]) => ({ id, name })) };
  }

  async listEstablishments(companyId: string, enterpriseId: string) {
    const sources = await this.prisma.eimsSourceSystem.findMany({
      where: { companyId, enterpriseId },
      select: { establishmentId: true, establishmentName: true },
    });
    const seen = new Map<string, string>();
    for (const s of sources) {
      if (s.establishmentId) {
        seen.set(s.establishmentId, s.establishmentName || s.establishmentId);
      }
    }
    return { success: true, data: [...seen.entries()].map(([id, name]) => ({ id, name })) };
  }

  // ── Certificates ─────────────────────────────────────────────────────────────

  async listCertificates(companyId: string) {
    return this.certificates.listCertificates(companyId);
  }

  async generateCsr(companyId: string, dto: { tin: string; systemNumber: string; organizationName: string; email: string; organizationalUnitName?: string; sourceSystemId?: string }) {
    return this.certificates.generateCsr(companyId, dto);
  }

  async installCertificate(companyId: string, id: string, certificatePem: string) {
    return this.certificates.installCertificate(companyId, id, certificatePem);
  }

  async submitCsr(companyId: string, id: string, csrPem: string) {
    return this.certificates.submitCsr(companyId, id, csrPem);
  }

  async certificateExpiryCheck(companyId: string) {
    return this.certificates.certificateExpiryCheck(companyId);
  }

  // ── Invoice retry & registrations ────────────────────────────────────────────

  async retryInvoice(companyId: string, invoiceId: string) {
    const existing = await this.prisma.eimsRegistration.findFirst({
      where: { companyId, invoiceId },
    });
    if (!existing) throw new NotFoundException(`No registration found for invoice ${invoiceId}`);
    if (existing.status === 'REGISTERED') {
      throw new BadRequestException(`Invoice ${invoiceId} is already successfully registered with the MoR (IRN: ${existing.irn})`);
    }
    // Re-run the full registration flow — this is a real retry, not a status flip.
    return this.registerSalesInvoice(companyId, invoiceId, undefined, 'system:retry');
  }

  async listInvoiceRegistrations(companyId: string, invoiceId: string) {
    const rows = await this.prisma.eimsRegistration.findMany({
      where: { companyId, invoiceId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rows };
  }

  // ── Receipts list ────────────────────────────────────────────────────────────

  async listReceipts(companyId: string, invoiceId?: string) {
    const rows = await this.prisma.eimsReceipt.findMany({
      where: { companyId, ...(invoiceId ? { invoiceId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: EIMS_RECEIPTS_LIMIT,
    });
    return { success: true, data: rows };
  }

  /**
   * Resolve a reporting window from the request.
   *
   * A date-only upper bound such as "2026-08-31" parses to midnight, which would
   * silently drop every invoice issued later that day and under-report the
   * period. Date-only bounds are therefore extended to the end of the day.
   */
  private resolveReportPeriod(startInput: string, endInput: string): { periodStart: Date; periodEnd: Date } {
    const periodStart = new Date(startInput);
    const periodEnd = new Date(endInput);

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw new BadRequestException('periodStart and periodEnd must be valid ISO-8601 dates');
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(endInput.trim())) {
      periodEnd.setUTCHours(23, 59, 59, 999);
    }

    if (periodStart.getTime() > periodEnd.getTime()) {
      throw new BadRequestException('periodStart must be on or before periodEnd');
    }

    return { periodStart, periodEnd };
  }

  /**
   * Aggregate the MoR-registered invoices that belong in a summary report.
   *
   * Only invoices the MoR has already acknowledged (REGISTERED + IRN present)
   * are reportable, and cancelled/void/draft documents must never inflate the
   * filing.
   */
  private async compileInvoiceSummary(companyId: string, periodStart: Date, periodEnd: Date) {
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId,
        date: { gte: periodStart, lte: periodEnd },
        eimsStatus: 'REGISTERED',
        eimsIrn: { not: null },
        status: { notIn: ['CANCELLED', 'VOID', 'DRAFT'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        eimsIrn: true,
        subtotal: true,
        vatAmount: true,
        totalAmount: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    // Sum with Decimal arithmetic, never floats: these figures are filed as the
    // company's declared tax position.
    const zero = new Prisma.Decimal(0);
    const totals = rows.reduce(
      (acc, r) => ({
        invoiceValue: acc.invoiceValue.plus(r.subtotal),
        taxValue: acc.taxValue.plus(r.vatAmount),
        valueWithTax: acc.valueWithTax.plus(r.totalAmount),
      }),
      { invoiceValue: zero, taxValue: zero, valueWithTax: zero },
    );

    return { rows, totals };
  }

  /**
   * When the caller supplies its own totals, treat them strictly as a checksum
   * against the server-side aggregation. A mismatch means the client's view of
   * the ledger has drifted, so the filing is refused rather than silently
   * corrected — the discrepancy is a reconciliation bug worth surfacing.
   */
  private assertSummaryChecksum(
    dto: SubmitInvoiceSummaryReportDto,
    serverCount: number,
    totals: { invoiceValue: Prisma.Decimal; taxValue: Prisma.Decimal; valueWithTax: Prisma.Decimal },
  ): void {
    const mismatches: string[] = [];

    const compare = (label: string, claimed: string | undefined | null, actual: Prisma.Decimal): void => {
      if (claimed === undefined || claimed === null || `${claimed}`.trim() === '') return;
      let claimedDec: Prisma.Decimal;
      try {
        claimedDec = new Prisma.Decimal(claimed);
      } catch {
        mismatches.push(`${label}: "${claimed}" is not a valid decimal`);
        return;
      }
      if (!claimedDec.equals(actual)) {
        mismatches.push(`${label}: client sent ${claimedDec.toFixed(2)}, ledger holds ${actual.toFixed(2)}`);
      }
    };

    if (dto.totalInvoiceCount !== undefined && dto.totalInvoiceCount !== null && dto.totalInvoiceCount !== serverCount) {
      mismatches.push(`totalInvoiceCount: client sent ${dto.totalInvoiceCount}, ledger holds ${serverCount}`);
    }
    compare('totalInvoiceValue', dto.totalInvoiceValue, totals.invoiceValue);
    compare('totalTaxValue', dto.totalTaxValue, totals.taxValue);
    compare('totalValueWithTax', dto.totalValueWithTax, totals.valueWithTax);

    if (mismatches.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Invoice summary totals do not match the OVDS ledger; refusing to file with the MoR.',
        mismatches,
      });
    }
  }

  /**
   * Compile and file an invoice summary report with the MoR.
   *
   * Both the totals and the per-invoice list are aggregated server-side from the
   * OVDS ledger, and the seller identity is read from the tenant's own record
   * plus its approved source system. Nothing that determines the declared tax
   * position is taken from the request body, so a tampered or stale client
   * cannot under-report VAT or file under another taxpayer's TIN.
   */
  async submitInvoiceSummaryReport(companyId: string, dto: SubmitInvoiceSummaryReportDto) {
    const { periodStart, periodEnd } = this.resolveReportPeriod(dto.periodStart, dto.periodEnd);

    const { defaults } = await this.buildMappingDefaults(companyId);
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { name: true, tin: true },
    });

    const sellerTin = (company?.tin ?? defaults.sellerTin ?? '').replace(/\D/g, '');
    const sellerLegalName = company?.name || defaults.sellerLegalName || '';

    if (!sellerTin) {
      throw new BadRequestException(
        `Company ${companyId} has no TIN on record. Set the company TIN before filing a summary report.`,
      );
    }

    const { rows, totals } = await this.compileInvoiceSummary(companyId, periodStart, periodEnd);

    this.assertSummaryChecksum(dto, rows.length, totals);

    this.logger.log(
      `Compiled invoice summary for company ${companyId}: ${dto.reportType} ` +
        `${periodStart.toISOString()} → ${periodEnd.toISOString()} — ` +
        `${rows.length} invoice(s), tax ${totals.taxValue.toFixed(2)}`,
    );

    const morRequest = {
      ReportType: dto.reportType,
      PeriodStart: periodStart.toISOString(),
      PeriodEnd: periodEnd.toISOString(),
      SellerDetails: {
        Tin: sellerTin,
        LegalName: sellerLegalName,
      },
      Summary: {
        TotalInvoiceCount: rows.length,
        TotalInvoiceValue: totals.invoiceValue.toNumber(),
        TotalTaxValue: totals.taxValue.toNumber(),
        TotalValueWithTax: totals.valueWithTax.toNumber(),
      },
      Invoices: rows.map((inv) => ({
        Irn: inv.eimsIrn as string,
        DocumentNumber: inv.invoiceNumber,
        InvoiceValue: inv.subtotal.toNumber(),
        TaxValue: inv.vatAmount.toNumber(),
        InvoiceDate: inv.date.toISOString(),
      })),
    };

    const summaryContext = {
      reportType: dto.reportType,
      periodStart,
      periodEnd,
      sellerTin,
      sellerLegalName,
      totalInvoiceCount: rows.length,
      totalInvoiceValue: totals.invoiceValue,
      totalTaxValue: totals.taxValue,
      totalValueWithTax: totals.valueWithTax,
    };

    let res;
    try {
      res = await this.getClient(companyId).submitInvoiceSummaryReport(morRequest);
    } catch (err) {
      await this.persistSummaryFailure(companyId, summaryContext, morRequest, err);
      throw err;
    }

    const sandbox = this.getClient(companyId).sandbox;
    const saved = await this.prisma.eimsSummaryReport.create({
      data: {
        companyId,
        reportType: summaryContext.reportType,
        periodStart,
        periodEnd,
        sellerTin,
        sellerLegalName,
        totalInvoiceCount: rows.length,
        totalInvoiceValue: totals.invoiceValue,
        totalTaxValue: totals.taxValue,
        totalValueWithTax: totals.valueWithTax,
        requestPayload: JSON.stringify(morRequest),
        responsePayload: JSON.stringify(res.body),
        reportReference: res.body.reportReference,
        status: res.body.status === 'REGISTERED' ? 'REGISTERED' : 'PENDING',
        submissionMode: sandbox ? 'sandbox' : 'live',
        submittedAt: new Date(res.body.ackDate),
      },
    });

    this.logger.log(`Invoice summary report submitted successfully: ${saved.reportReference} (${saved.submissionMode})`);
    return { success: true, data: saved, mor: res.body };
  }

  /**
   * Record a failed filing against the real compiled figures.
   *
   * Writing zeros and an "UNKNOWN" seller here would corrupt the compliance
   * ledger, because a failed MONTHLY filing would be indistinguishable from a
   * genuinely empty period during an audit.
   */
  private async persistSummaryFailure(
    companyId: string,
    context: {
      reportType: string;
      periodStart: Date;
      periodEnd: Date;
      sellerTin: string;
      sellerLegalName: string;
      totalInvoiceCount: number;
      totalInvoiceValue: Prisma.Decimal;
      totalTaxValue: Prisma.Decimal;
      totalValueWithTax: Prisma.Decimal;
    },
    request: unknown,
    err: unknown,
  ) {
    const message = err instanceof MorEimsError ? err.message : String(err);
    await this.prisma.eimsSummaryReport.create({
      data: {
        companyId,
        reportType: context.reportType,
        periodStart: context.periodStart,
        periodEnd: context.periodEnd,
        sellerTin: context.sellerTin,
        sellerLegalName: context.sellerLegalName,
        totalInvoiceCount: context.totalInvoiceCount,
        totalInvoiceValue: context.totalInvoiceValue,
        totalTaxValue: context.totalTaxValue,
        totalValueWithTax: context.totalValueWithTax,
        status: 'FAILED',
        errorMessage: message.slice(0, 1000),
        requestPayload: JSON.stringify(request),
      },
    });
  }
}
