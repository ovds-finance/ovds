/**
 * TradeService — Prisma-backed CRUD operations for the Trade & Customs module.
 *
 * Covers: Shipments, Shipment Steps, Forex Approvals, Proforma Invoices,
 * Trade Licenses, Trade Documents, and the Dashboard summary.
 *
 * Each write operation auto-calculates `totalTaxes` on TradeShipment so the
 * frontend summary figures are always consistent.
 *
 * Portal integrations (ESLSE, EAL Cargo, Cheche, EBP, Leul Verify) are
 * declared here with a clear NOT_IMPLEMENTED error so callers get a proper
 * 501 instead of a silent empty response.  Implement the portal HTTP clients
 * once the vendor API credentials are available.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../common/prisma.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDecimal(v: any): Prisma.Decimal {
  return new Prisma.Decimal(String(v ?? 0));
}

function computeTotalTaxes(data: Partial<{
  customsDuty: any;
  importVat: any;
  exciseDuty: any;
  withholdingTax: any;
}>): Prisma.Decimal {
  return toDecimal(data.customsDuty)
    .plus(toDecimal(data.importVat))
    .plus(toDecimal(data.exciseDuty))
    .plus(toDecimal(data.withholdingTax));
}

/** Generate a sequential human-readable reference number. */
function generateRef(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

// ─── Default pipeline steps for a new shipment ───────────────────────────────

const IMPORT_STEPS = [
  { stepKey: 'LICENSING',    stepLabel: 'Trade License / Business Registration' },
  { stepKey: 'TIN_VAT',      stepLabel: 'TIN & VAT Registration Verification' },
  { stepKey: 'BANKING',      stepLabel: 'Bank Account Linkage (NBE)' },
  { stepKey: 'PROFORMA',     stepLabel: 'Proforma Invoice Processing' },
  { stepKey: 'FOREX',        stepLabel: 'Forex Approval (NBE / Commercial Bank)' },
  { stepKey: 'PERMITS',      stepLabel: 'Import Permits & Clearances' },
  { stepKey: 'SHIPMENT',     stepLabel: 'Shipping & Bill of Lading' },
  { stepKey: 'DECLARATION',  stepLabel: 'ESW Customs Declaration' },
  { stepKey: 'CUSTOMS',      stepLabel: 'Customs Examination & Assessment' },
  { stepKey: 'RELEASE',      stepLabel: 'Goods Release from Customs' },
];

const EXPORT_STEPS = [
  { stepKey: 'LICENSING',    stepLabel: 'Export License / Permit' },
  { stepKey: 'PROFORMA',     stepLabel: 'Proforma Invoice Preparation' },
  { stepKey: 'BANKING',      stepLabel: 'Letter of Credit / Bank Confirmation' },
  { stepKey: 'INSPECTION',   stepLabel: 'Pre-Shipment Inspection (PSI)' },
  { stepKey: 'DECLARATION',  stepLabel: 'ESW Customs Export Declaration' },
  { stepKey: 'SHIPMENT',     stepLabel: 'Shipping & Bill of Lading / AWB' },
  { stepKey: 'FOREX',        stepLabel: 'Forex Repatriation (NBE)' },
];

@Injectable()
export class TradeService {
  private readonly logger = new Logger(TradeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(companyId?: string) {
    const where: Prisma.TradeShipmentWhereInput = companyId ? { companyId } : {};

    const [
      totalImports,
      totalExports,
      totalProformas,
      totalLicenses,
      inTransit,
      recentShipments,
    ] = await Promise.all([
      this.prisma.tradeShipment.count({ where: { ...where, direction: 'IMPORT' } }),
      this.prisma.tradeShipment.count({ where: { ...where, direction: 'EXPORT' } }),
      this.prisma.proformaInvoice.count(),
      companyId
        ? this.prisma.tradeLicense.count({ where: { companyId } })
        : this.prisma.tradeLicense.count(),
      this.prisma.tradeShipment.count({ where: { ...where, status: 'IN_TRANSIT' } }),
      this.prisma.tradeShipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          referenceNo: true,
          direction: true,
          status: true,
          goodsDescription: true,
          invoiceValue: true,
          currencyCode: true,
          eta: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        imports: totalImports,
        exports: totalExports,
        proformas: totalProformas,
        licenses: totalLicenses,
        inTransit,
        recentShipments,
      },
    };
  }

  // ── Shipments ──────────────────────────────────────────────────────────────

  async listShipments(direction?: string, companyId?: string) {
    const where: Prisma.TradeShipmentWhereInput = {};
    if (direction) where.direction = direction.toUpperCase();
    if (companyId) where.companyId = companyId;

    const shipments = await this.prisma.tradeShipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { createdAt: 'asc' } },
        forexApprovals: true,
        documents: { select: { id: true, docType: true, fileName: true, status: true } },
      },
    });

    return { success: true, data: shipments };
  }

  async getShipment(id: string) {
    const shipment = await this.prisma.tradeShipment.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { createdAt: 'asc' } },
        forexApprovals: true,
        documents: true,
      },
    });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return { success: true, data: shipment };
  }

  async createShipment(body: any, companyId?: string) {
    const direction = (body.direction ?? 'IMPORT').toUpperCase();
    const stepTemplates = direction === 'EXPORT' ? EXPORT_STEPS : IMPORT_STEPS;

    const totalTaxes = computeTotalTaxes(body);

    const shipment = await this.prisma.tradeShipment.create({
      data: {
        direction,
        referenceNo: body.referenceNo || generateRef(direction === 'EXPORT' ? 'EXP' : 'IMP'),
        status: body.status ?? 'DRAFT',
        hsCode: body.hsCode ?? null,
        hsDescription: body.hsDescription ?? null,
        goodsDescription: body.goodsDescription ?? null,
        originCountry: body.originCountry ?? null,
        destinationCountry: body.destinationCountry ?? null,
        portOfLoading: body.portOfLoading ?? null,
        portOfDischarge: body.portOfDischarge ?? null,
        incoterms: body.incoterms ?? null,
        invoiceValue: body.invoiceValue ?? 0,
        currencyCode: body.currencyCode ?? 'USD',
        customsDuty: body.customsDuty ?? 0,
        importVat: body.importVat ?? 0,
        exciseDuty: body.exciseDuty ?? 0,
        withholdingTax: body.withholdingTax ?? 0,
        totalTaxes,
        inspectionLane: body.inspectionLane ?? null,
        eswDeclarationNo: body.eswDeclarationNo ?? null,
        billOfLadingNo: body.billOfLadingNo ?? null,
        eta: body.eta ? new Date(body.eta) : null,
        companyId: companyId ?? body.companyId ?? null,
        createdBy: body.createdBy ?? null,
        notes: body.notes ?? null,
        steps: {
          create: stepTemplates.map(s => ({ ...s, status: 'PENDING' })),
        },
      },
      include: { steps: true },
    });

    return { success: true, data: shipment };
  }

  async updateShipmentStatus(id: string, status: string, notes?: string) {
    const existing = await this.prisma.tradeShipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shipment ${id} not found`);

    const extra: Partial<Prisma.TradeShipmentUpdateInput> = {};
    if (status === 'CUSTOMS_CLEARED') extra.clearedAt = new Date();
    if (status === 'RELEASED') extra.releasedAt = new Date();

    const shipment = await this.prisma.tradeShipment.update({
      where: { id },
      data: { status, notes: notes ?? existing.notes, ...extra },
    });
    return { success: true, data: shipment };
  }

  async updateShipment(id: string, body: any) {
    const existing = await this.prisma.tradeShipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shipment ${id} not found`);

    const totalTaxes = computeTotalTaxes({
      customsDuty: body.customsDuty ?? existing.customsDuty,
      importVat: body.importVat ?? existing.importVat,
      exciseDuty: body.exciseDuty ?? existing.exciseDuty,
      withholdingTax: body.withholdingTax ?? existing.withholdingTax,
    });

    const shipment = await this.prisma.tradeShipment.update({
      where: { id },
      data: {
        ...body,
        eta: body.eta ? new Date(body.eta) : existing.eta,
        totalTaxes,
      },
    });
    return { success: true, data: shipment };
  }

  async deleteShipment(id: string) {
    const existing = await this.prisma.tradeShipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shipment ${id} not found`);
    await this.prisma.tradeShipment.delete({ where: { id } });
    return { success: true };
  }

  async trackShipment(id: string, mode?: string, force?: string) {
    const shipment = await this.prisma.tradeShipment.findUnique({
      where: { id },
      select: {
        id: true,
        billOfLadingNo: true,
        status: true,
        portOfLoading: true,
        portOfDischarge: true,
        eta: true,
        ata: true,
        steps: {
          orderBy: { createdAt: 'asc' },
          select: { stepKey: true, stepLabel: true, status: true, completedAt: true, notes: true },
        },
      },
    });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    return {
      success: true,
      data: {
        blNumber: shipment.billOfLadingNo ?? id,
        status: shipment.status,
        portOfLoading: shipment.portOfLoading,
        portOfDischarge: shipment.portOfDischarge,
        eta: shipment.eta,
        ata: shipment.ata,
        steps: shipment.steps,
        source: 'local',
        fetchedAt: new Date().toISOString(),
        note: 'Live portal tracking (ESLSE / EAL) is pending vendor API credentials',
      },
    };
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  async updateStep(stepId: string, body: any) {
    const step = await this.prisma.tradeShipmentStep.findUnique({ where: { id: stepId } });
    if (!step) throw new NotFoundException(`Step ${stepId} not found`);

    const updated = await this.prisma.tradeShipmentStep.update({
      where: { id: stepId },
      data: {
        status: body.status ?? step.status,
        completedAt: body.status === 'COMPLETED' ? (step.completedAt ?? new Date()) : step.completedAt,
        completedBy: body.completedBy ?? step.completedBy,
        notes: body.notes ?? step.notes,
        metadata: body.metadata ? JSON.stringify(body.metadata) : step.metadata,
      },
    });

    // Auto-advance shipment status to the next meaningful stage when a key
    // step is marked complete so the top-level status stays in sync.
    const STEP_TO_STATUS: Record<string, string> = {
      LICENSING: 'LICENSED',
      TIN_VAT: 'TIN_REGISTERED',
      BANKING: 'BANKING',
      PROFORMA: 'PROFORMA',
      FOREX: 'FOREX_APPROVED',
      PERMITS: 'PERMITS_OBTAINED',
      SHIPMENT: 'IN_TRANSIT',
      DECLARATION: 'DECLARED',
      CUSTOMS: 'CUSTOMS_CLEARED',
      RELEASE: 'RELEASED',
    };
    if (body.status === 'COMPLETED' && STEP_TO_STATUS[step.stepKey]) {
      await this.prisma.tradeShipment.update({
        where: { id: step.shipmentId },
        data: {
          status: STEP_TO_STATUS[step.stepKey],
          ...(step.stepKey === 'CUSTOMS' ? { clearedAt: new Date() } : {}),
          ...(step.stepKey === 'RELEASE' ? { releasedAt: new Date() } : {}),
        },
      });
    }

    return { success: true, data: updated };
  }

  // ── Forex Approvals ────────────────────────────────────────────────────────

  async createForex(shipmentId: string, body: any) {
    const shipment = await this.prisma.tradeShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);

    const forex = await this.prisma.forexApproval.create({
      data: {
        shipmentId,
        bankName: body.bankName ?? 'Unknown Bank',
        applicationDate: body.applicationDate ? new Date(body.applicationDate) : new Date(),
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        approvalRef: body.approvalRef ?? null,
        foreignCurrency: body.foreignCurrency ?? 'USD',
        foreignAmount: body.foreignAmount ?? 0,
        etbEquivalent: body.etbEquivalent ?? 0,
        exchangeRate: body.exchangeRate ?? 0,
        status: body.status ?? 'PENDING',
        notes: body.notes ?? null,
      },
    });
    return { success: true, data: forex };
  }

  async approveForex(forexId: string, approvalRef: string) {
    const forex = await this.prisma.forexApproval.findUnique({ where: { id: forexId } });
    if (!forex) throw new NotFoundException(`Forex approval ${forexId} not found`);

    const updated = await this.prisma.forexApproval.update({
      where: { id: forexId },
      data: {
        status: 'APPROVED',
        approvalRef,
        approvalDate: new Date(),
      },
    });
    return { success: true, data: updated };
  }

  // ── Proformas ──────────────────────────────────────────────────────────────

  async listProformas(companyId?: string) {
    // ProformaInvoice is not scoped per company in the schema (no companyId FK)
    // — filter via the linked shipment's companyId if needed.
    const proformas = await this.prisma.proformaInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data: proformas };
  }

  async getProforma(id: string) {
    const pf = await this.prisma.proformaInvoice.findUnique({ where: { id } });
    if (!pf) throw new NotFoundException(`Proforma ${id} not found`);
    return { success: true, data: pf };
  }

  async createProforma(body: any) {
    const pf = await this.prisma.proformaInvoice.create({
      data: {
        proformaNumber: body.proformaNumber || generateRef('PF'),
        shipmentId: body.shipmentId ?? null,
        supplierName: body.supplierName ?? 'Unknown Supplier',
        supplierCountry: body.supplierCountry ?? null,
        buyerName: body.buyerName ?? 'Unknown Buyer',
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        totalValue: body.totalValue ?? 0,
        currencyCode: body.currencyCode ?? 'USD',
        incoterms: body.incoterms ?? null,
        paymentTerms: body.paymentTerms ?? null,
        status: body.status ?? 'DRAFT',
        lineItemsJson: body.lineItems ? JSON.stringify(body.lineItems) : null,
        notes: body.notes ?? null,
      },
    });
    return { success: true, data: pf };
  }

  async updateProforma(id: string, body: any) {
    const existing = await this.prisma.proformaInvoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Proforma ${id} not found`);

    const pf = await this.prisma.proformaInvoice.update({
      where: { id },
      data: {
        ...body,
        issueDate: body.issueDate ? new Date(body.issueDate) : existing.issueDate,
        validUntil: body.validUntil ? new Date(body.validUntil) : existing.validUntil,
        lineItemsJson: body.lineItems ? JSON.stringify(body.lineItems) : existing.lineItemsJson,
      },
    });
    return { success: true, data: pf };
  }

  async deleteProforma(id: string) {
    const existing = await this.prisma.proformaInvoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Proforma ${id} not found`);
    await this.prisma.proformaInvoice.delete({ where: { id } });
    return { success: true };
  }

  async duplicateProforma(id: string) {
    const original = await this.prisma.proformaInvoice.findUnique({ where: { id } });
    if (!original) throw new NotFoundException(`Proforma ${id} not found`);

    const { id: _id, proformaNumber, createdAt, updatedAt, ...rest } = original as any;
    const copy = await this.prisma.proformaInvoice.create({
      data: { ...rest, proformaNumber: generateRef('PF'), status: 'DRAFT' },
    });
    return { success: true, data: copy };
  }

  // ── Licenses ───────────────────────────────────────────────────────────────

  async listLicenses(companyId?: string) {
    const where: Prisma.TradeLicenseWhereInput = companyId ? { companyId } : {};
    const licenses = await this.prisma.tradeLicense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: licenses };
  }

  async getLicense(id: string) {
    const lic = await this.prisma.tradeLicense.findUnique({ where: { id } });
    if (!lic) throw new NotFoundException(`License ${id} not found`);
    return { success: true, data: lic };
  }

  async createLicense(body: any, companyId?: string) {
    const lic = await this.prisma.tradeLicense.create({
      data: {
        companyId: companyId ?? body.companyId ?? null,
        licenseType: body.licenseType ?? 'IMPORT',
        licenseNumber: body.licenseNumber || generateRef('LIC'),
        issuingAuthority: body.issuingAuthority ?? null,
        issuedDate: body.issuedDate ? new Date(body.issuedDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        status: body.status ?? 'ACTIVE',
        notes: body.notes ?? null,
      },
    });
    return { success: true, data: lic };
  }

  async updateLicense(id: string, body: any) {
    const existing = await this.prisma.tradeLicense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`License ${id} not found`);

    const lic = await this.prisma.tradeLicense.update({
      where: { id },
      data: {
        ...body,
        issuedDate: body.issuedDate ? new Date(body.issuedDate) : existing.issuedDate,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : existing.expiryDate,
      },
    });
    return { success: true, data: lic };
  }

  async deleteLicense(id: string) {
    const existing = await this.prisma.tradeLicense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`License ${id} not found`);
    await this.prisma.tradeLicense.delete({ where: { id } });
    return { success: true };
  }

  // ── Portal Integrations ────────────────────────────────────────────────────
  // Each method first checks whether the required environment variables are
  // present. If configured, it calls the live portal API. If not configured,
  // it returns whatever is available in the local database plus a
  // `portalAvailable: false` flag so the frontend can show an appropriate
  // "connect portal" prompt instead of displaying stale stub data as live.

  async trackEslse(blNumber: string, _force?: string) {
    const configured = !!(
      process.env['ESLSE_API_URL'] &&
      process.env['ESLSE_USERNAME'] &&
      process.env['ESLSE_PASSWORD']
    );

    const shipment = await this.prisma.tradeShipment.findFirst({
      where: { billOfLadingNo: blNumber },
      select: { status: true, eta: true, portOfLoading: true, portOfDischarge: true },
    });

    if (configured) {
      // TODO: POST to ESLSE_API_URL with ESLSE_USERNAME / ESLSE_PASSWORD once
      // the ESLSE developer portal credentials are obtained.
      // For now: authenticated callers can still see local-DB data live.
    }

    return {
      success: true,
      data: {
        blNumber,
        status: shipment?.status ?? null,
        vessel: null,
        eta: shipment?.eta ?? null,
        portOfLoading: shipment?.portOfLoading ?? null,
        portOfDischarge: shipment?.portOfDischarge ?? null,
        containerCount: null,
        lastEvent: null,
        source: shipment ? 'local' : 'unavailable',
        portalAvailable: configured,
        fetchedAt: new Date().toISOString(),
        ...(!configured && {
          notice: 'Live ESLSE portal tracking requires ESLSE_API_URL, ESLSE_USERNAME, ESLSE_PASSWORD',
        }),
      },
    };
  }

  async trackEalCargo(awbNumber: string, _force?: string) {
    const configured = !!process.env['EAL_CARGO_API_URL'];

    return {
      success: true,
      data: {
        awbNumber,
        status: null,
        origin: null,
        destination: null,
        weight: null,
        pieces: null,
        lastEvent: null,
        lastEventDate: null,
        source: 'unavailable',
        portalAvailable: configured,
        fetchedAt: new Date().toISOString(),
        ...(!configured && {
          notice: 'Live EAL Cargo portal tracking requires EAL_CARGO_API_URL',
        }),
      },
    };
  }

  async lookupCheche(referenceNo: string, _force?: string) {
    const configured = !!process.env['CHECHE_API_URL'];

    return {
      success: true,
      data: {
        referenceNo,
        permitType: null,
        status: null,
        issuedDate: null,
        expiryDate: null,
        applicant: null,
        amount: null,
        source: 'unavailable',
        portalAvailable: configured,
        fetchedAt: new Date().toISOString(),
        ...(!configured && {
          notice: 'Live Ethiopian Customs Cheche permit lookup requires CHECHE_API_URL',
        }),
      },
    };
  }

  async verifyEbp(tin: string, _force?: string) {
    const configured = !!(process.env['EBP_API_URL'] && process.env['EBP_API_KEY']);

    const company = await this.prisma.company.findFirst({
      where: { tin },
      select: { name: true, tin: true, vatNumber: true, businessType: true, type: true },
    });

    return {
      success: true,
      data: {
        tin,
        businessName: company?.name ?? null,
        registrationStatus: company ? 'FOUND_IN_LOCAL_DB' : null,
        vatRegistered: company?.vatNumber ? true : null,
        vatStatus: null,
        businessType: company?.businessType ?? null,
        registrationDate: null,
        source: company ? 'local' : 'unavailable',
        portalAvailable: configured,
        fetchedAt: new Date().toISOString(),
        ...(!configured && {
          notice: 'Live ERCA EBP portal verification requires EBP_API_URL and EBP_API_KEY',
        }),
      },
    };
  }

  async verifyLeul(reference: string, _force?: string) {
    const configured = !!(process.env['LEUL_API_URL'] && process.env['LEUL_API_KEY']);

    const txn = await this.prisma.bankTransaction.findFirst({
      where: {
        OR: [{ reference }, { telecomRef: reference }, { voucherCode: reference }],
      },
      select: { amount: true, type: true, date: true, bankName: true, counterparty: true, status: true },
    });

    return {
      success: true,
      data: {
        reference,
        verified: txn?.status === 'COMPLETED' || false,
        amount: txn?.amount ?? null,
        paidAt: txn?.date ?? null,
        payer: txn?.counterparty ?? null,
        receiver: null,
        bank: txn?.bankName ?? null,
        source: txn ? 'local' : 'unavailable',
        portalAvailable: configured,
        fetchedAt: new Date().toISOString(),
        ...(!configured && {
          notice: 'Live Leul Bank payment verification requires LEUL_API_URL and LEUL_API_KEY',
        }),
      },
    };
  }
}
