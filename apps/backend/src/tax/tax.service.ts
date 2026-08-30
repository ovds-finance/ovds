import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';
import { PAGINATION_DEFAULT_LIMIT, TOT_GOODS_RATE, TOT_SERVICES_RATE, BIT_RATE, WHT_GOODS_RATE, WHT_SERVICES_RATE, DEFAULT_PENALTY_RATE, TOT_PAGINATION_LIMIT, WHT_PAGINATION_LIMIT, VAT_FILINGS_LIMIT, VAT_INPUT_LEDGER_LIMIT, VAT_OUTPUT_LEDGER_LIMIT, ACK_VAULT_LIMIT } from '@ovds/shared';

export interface TaxRateView {
  id: string;
  code: string;
  name: string;
  label: string;
  rate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

export interface TotFilingView {
  id: string;
  companyId: string;
  period: string;
  goodsAmount: string;
  servicesAmount: string;
  totGoods: string;
  totServices: string;
  totalTot: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxFilingView {
  id: string;
  companyId: string;
  type: string;
  period: string;
  status: string;
  submittedAt: string | null;
  reference: string | null;
  createdAt: string;
}

export interface TaxpayerProfileView {
  companyId: string;
  tin: string;
  legalName: string;
  taxpayerType: string;
  registrationDate: string;
  status: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface WhtCertificateView {
  id: string;
  companyId: string;
  certNo: string;
  vendorId: string;
  vendorName: string;
  whtType: string;
  amount: string;
  issueDate: string;
  status: string;
}

export interface TaxLedgerEntryView {
  id: string;
  companyId: string;
  type: 'INPUT' | 'OUTPUT';
  category: string;
  reference: string;
  amount: string;
  taxAmount: string;
  date: string;
  period: string;
}

export interface TaxSummaryView {
  companyId: string;
  period: string;
  totalOutputVat: string;
  totalInputVat: string;
  netVatPayable: string;
  totGoods: string;
  totServices: string;
  totalWht: string;
  totalBit: string;
}

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tax Rates ──────────────────────────────────────────────────────────────

  async getTaxRates(): Promise<TaxRateView[]> {
    const rules = await this.prisma.taxRule.findMany({
      orderBy: { code: 'asc' },
    });
    return rules.map((r) => this.toTaxRateView(r));
  }

  async seedEthiopianTaxRates(): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.taxRule.count();
    if (existing > 0) {
      return { success: true, message: 'Tax rates already seeded' };
    }

    const rates = [
      { code: 'VAT_STANDARD', name: 'Value Added Tax', label: 'VAT', rate: '15.00', effectiveFrom: '2024-01-01' },
      { code: 'VAT_ZERO', name: 'Zero-rated VAT', label: 'VAT 0%', rate: '0.00', effectiveFrom: '2024-01-01' },
      { code: 'VAT_EXEMPT', name: 'VAT Exempt', label: 'Exempt', rate: '0.00', effectiveFrom: '2024-01-01' },
      { code: 'TOT_GOODS', name: 'Turnover Tax - Goods', label: 'TOT Goods', rate: String(TOT_GOODS_RATE), effectiveFrom: '2024-01-01' },
      { code: 'TOT_SERVICES', name: 'Turnover Tax - Services', label: 'TOT Services', rate: String(TOT_SERVICES_RATE), effectiveFrom: '2024-01-01' },
      { code: 'WHT_GOODS', name: 'WHT - Goods', label: 'WHT Goods', rate: String(WHT_GOODS_RATE * 100), effectiveFrom: '2024-01-01' },
      { code: 'WHT_SERVICES', name: 'WHT - Services', label: 'WHT Services', rate: String(WHT_SERVICES_RATE * 100), effectiveFrom: '2024-01-01' },
      { code: 'BIT_CORPORATE', name: 'Business Income Tax', label: 'BIT', rate: String(BIT_RATE), effectiveFrom: '2024-01-01' },
      { code: 'DRRF', name: 'Digital Services Tax', label: 'DRRF', rate: '0.00', effectiveFrom: '2024-01-01' },
    ];

    await this.prisma.taxRule.createMany({
      data: rates.map((r) => ({
        code: r.code,
        name: r.name,
        label: r.label,
        rate: new Prisma.Decimal(r.rate),
        isActive: true,
        // Required ledger / classification fields introduced by the canonical TaxRule model.
        ias12Treatment: 'NOT_INCOME_TAX',
        glDebitCode: '2000',
        glCreditCode: '1000',
        glDebitName: 'Tax Expense',
        glCreditName: 'Tax Payable',
        frequency: 'MONTHLY',
        deadline: '30th of the following month',
        proclamation: 'Proc. 1395/2025',
      })),
    });

    return { success: true, message: `Seeded ${rates.length} Ethiopian tax rates` };
  }

  // ── TOT Settings ───────────────────────────────────────────────────────────

  async getTotSettings(companyId: string): Promise<any> {
    const latest = await this.prisma.totFiling.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) {
      return {
        goodsRate: String(TOT_GOODS_RATE),
        servicesRate: String(TOT_SERVICES_RATE),
        filingFrequency: 'MONTHLY',
        dueDate: 30,
      };
    }
    return {
      goodsRate: latest.totGoods.toString(),
      servicesRate: latest.totServices.toString(),
      filingFrequency: 'MONTHLY',
      dueDate: 30,
    };
  }

  async getTotFilings(companyId: string, period?: string): Promise<TotFilingView[]> {
    const where: any = { companyId };
    if (period) where.period = period;

    const filings = await this.prisma.totFiling.findMany({
      where,
      orderBy: { period: 'desc' },
      take: TOT_PAGINATION_LIMIT,
    });
    return filings.map((f) => this.toTotFilingView(f));
  }

  async createTotFiling(companyId: string, data: {
    period: string;
    goodsAmount: string;
    servicesAmount: string;
  }): Promise<TotFilingView> {
    const goods = new Prisma.Decimal(data.goodsAmount || '0');
    const services = new Prisma.Decimal(data.servicesAmount || '0');
    const totGoods = goods.mul(TOT_GOODS_RATE).div(100);
    const totServices = services.mul(TOT_SERVICES_RATE).div(100);

    const filing = await this.prisma.totFiling.create({
      data: {
        companyId,
        period: data.period,
        goodsAmount: goods,
        servicesAmount: services,
        totGoods,
        totServices,
        netPayable: totGoods.plus(totServices),
        status: 'DRAFT',
      },
    });

    return this.toTotFilingView(filing);
  }

  async submitTotFiling(companyId: string, filingId: string): Promise<TotFilingView> {
    const filing = await this.prisma.totFiling.findFirst({
      where: { id: filingId, companyId },
    });
    if (!filing) throw new NotFoundException('TOT filing not found');

    const updated = await this.prisma.totFiling.update({
      where: { id: filingId },
      data: {
        status: 'SUBMITTED',
        filedAt: new Date(),
      },
    });

    return this.toTotFilingView(updated);
  }

  // ── BIT Settings ───────────────────────────────────────────────────────────

  async getBitSettings(companyId: string): Promise<any> {
    return {
      rate: String(BIT_RATE),
      filingFrequency: 'ANNUAL',
      dueDate: '2025-07-30',
      lossCarryForwardYears: 5,
    };
  }

  // ── WHT Management ─────────────────────────────────────────────────────────

  async getWhtSummary(companyId: string, period?: string): Promise<any> {
    const where: any = { companyId };
    if (period) {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.invoiceDate = { gte: startDate, lte: endDate };
    }

    const [withholdings, certificates] = await Promise.all([
      this.prisma.whtWithholding.findMany({ where }),
      this.prisma.whtCertificate.findMany({ where }),
    ]);

    const totalWithheld = withholdings.reduce((sum, w) => sum + Number(w.amount), 0);
    const byType: Record<string, number> = {};
    for (const w of withholdings) {
      byType[w.type] = (byType[w.type] || 0) + Number(w.amount);
    }

    return {
      totalWithheld,
      byType,
      count: withholdings.length,
      certificatesIssued: certificates.length,
    };
  }

  async getWhtCertificates(companyId: string): Promise<WhtCertificateView[]> {
    const certs = await this.prisma.whtCertificate.findMany({
      where: { companyId },
      orderBy: { issueDate: 'desc' },
      take: WHT_PAGINATION_LIMIT,
    });
    return certs.map((c) => this.toWhtCertificateView(c));
  }

  async createWhtCertificate(companyId: string, data: {
    vendorId: string;
    whtType: string;
    amount: string;
    period: string;
  }): Promise<WhtCertificateView> {
    const vendor = await this.prisma.vendor.findFirst({ where: { id: data.vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { name: true, tin: true },
    });

    const gross = new Prisma.Decimal(data.amount || '0');
    const whtRate = new Prisma.Decimal(this.whtRateFor(data.whtType));
    const whtAmount = gross.mul(whtRate);
    const netPayable = gross.minus(whtAmount);

    const certNo = `WHT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const cert = await this.prisma.whtCertificate.create({
      data: {
        companyId,
        certNo,
        whtType: data.whtType,
        period: data.period,
        issueDate: new Date(),
        status: 'ISSUED',
        agentName: company?.name || 'Withholding Agent',
        agentTin: company?.tin ?? null,
        supplierName: vendor.name,
        supplierTin: vendor.tin ?? null,
        grossAmount: gross,
        whtRate,
        whtAmount,
        netPayable,
      },
    });

    return this.toWhtCertificateView(cert);
  }

  /** Map a WHT type to its statutory withholding rate (Proc. 1395/2025). */
  private whtRateFor(whtType: string): number {
    switch (whtType) {
      case 'SERVICES':
      case 'SERVICES_NR':
      case 'RENT':
      case 'DIVIDEND':
      case 'INTEREST':
        return WHT_SERVICES_RATE;
      case 'GOODS':
      default:
        return WHT_GOODS_RATE;
    }
  }

  // ── Tax Filings ────────────────────────────────────────────────────────────

  async getTaxFilings(companyId: string, type?: string): Promise<TaxFilingView[]> {
    const where: any = { companyId };
    if (type) where.type = type;

    const filings = await this.prisma.vatFiling.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: TOT_PAGINATION_LIMIT,
    });
    return filings.map((f) => this.toTaxFilingView(f));
  }

  // ── Taxpayer Profile ───────────────────────────────────────────────────────

  async getTaxpayerProfile(companyId: string): Promise<TaxpayerProfileView> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        tin: true,
        type: true,
        settings: true,
        createdAt: true,
      },
    });

    if (!company) throw new NotFoundException('Company not found');

    const settings = company.settings ? JSON.parse(company.settings) : {};
    const taxpayerType = this.mapCompanyTypeToTaxpayerType(company.type);

    return {
      companyId: company.id,
      tin: company.tin || '',
      legalName: company.name,
      taxpayerType,
      registrationDate: company.createdAt.toISOString(),
      status: 'ACTIVE',
      address: settings.address || null,
      phone: settings.phone || null,
      email: settings.email || null,
    };
  }

  // ── Tax Input/Output Ledger ────────────────────────────────────────────────

  async getVatInputLedger(companyId: string, period?: string): Promise<TaxLedgerEntryView[]> {
    const where: any = { companyId };
    if (period) where.period = period;

    const entries = await this.prisma.vatInputLedger.findMany({
      where,
      orderBy: { date: 'desc' },
      take: WHT_PAGINATION_LIMIT,
    });
    return entries.map((e) => this.toLedgerEntryView(e, 'INPUT'));
  }

  async getVatOutputLedger(companyId: string, period?: string): Promise<TaxLedgerEntryView[]> {
    const where: any = { companyId };
    if (period) where.period = period;

    const entries = await this.prisma.vatOutputLedger.findMany({
      where,
      orderBy: { date: 'desc' },
      take: WHT_PAGINATION_LIMIT,
    });
    return entries.map((e) => this.toLedgerEntryView(e, 'OUTPUT'));
  }

  // ── Tax Summary ────────────────────────────────────────────────────────────

  async getTaxSummary(companyId: string, period: string): Promise<TaxSummaryView> {
    const [vatFilings, totFilings, whtWithholdings] = await Promise.all([
      this.prisma.vatFiling.findMany({ where: { companyId, period } }),
      this.prisma.totFiling.findMany({ where: { companyId, period } }),
      this.prisma.whtWithholding.findMany({ where: { companyId } }),
    ]);

    const totalOutputVat = vatFilings.reduce((sum, f) => sum + Number(f.outputVat), 0);
    const totalInputVat = vatFilings.reduce((sum, f) => sum + Number(f.inputVat), 0);
    const netVatPayable = vatFilings.reduce((sum, f) => sum + Number(f.netPayable), 0);
    const totGoods = totFilings.reduce((sum, f) => sum + Number(f.totGoods), 0);
    const totServices = totFilings.reduce((sum, f) => sum + Number(f.totServices), 0);
    const totalWht = whtWithholdings.reduce((sum, w) => sum + Number(w.amount), 0);

    return {
      companyId,
      period,
      totalOutputVat: totalOutputVat.toFixed(2),
      totalInputVat: totalInputVat.toFixed(2),
      netVatPayable: netVatPayable.toFixed(2),
      totGoods: totGoods.toFixed(2),
      totServices: totServices.toFixed(2),
      totalWht: totalWht.toFixed(2),
      totalBit: '0.00',
    };
  }

  // ── ACK Vault ──────────────────────────────────────────────────────────────

  async getAckVault(companyId: string): Promise<any[]> {
    const submissions = await this.prisma.vatETaxSubmission.findMany({
      where: { companyId },
      orderBy: { submittedAt: 'desc' },
      take: TOT_PAGINATION_LIMIT,
    });
    return submissions.map((s) => ({
      id: s.id,
      type: s.type,
      period: s.period,
      status: s.status,
      submittedAt: s.submittedAt,
      reference: s.id,
    }));
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private toTaxRateView(rule: any): TaxRateView {
    return {
      id: rule.id,
      code: rule.code,
      name: rule.name,
      label: rule.label,
      rate: rule.rate.toString(),
      effectiveFrom: rule.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: rule.effectiveTo?.toISOString().split('T')[0] || null,
      isActive: rule.isActive,
    };
  }

  private toTotFilingView(filing: any): TotFilingView {
    return {
      id: filing.id,
      companyId: filing.companyId,
      period: filing.period,
      goodsAmount: filing.goodsAmount.toString(),
      servicesAmount: filing.servicesAmount.toString(),
      totGoods: filing.totGoods.toString(),
      totServices: filing.totServices.toString(),
      totalTot: filing.netPayable.toString(),
      status: filing.status,
      submittedAt: filing.filedAt?.toISOString() || null,
      createdAt: filing.createdAt.toISOString(),
      updatedAt: filing.updatedAt.toISOString(),
    };
  }

  private toTaxFilingView(filing: any): TaxFilingView {
    return {
      id: filing.id,
      companyId: filing.companyId,
      type: filing.type,
      period: filing.period,
      status: filing.status,
      submittedAt: filing.submittedAt?.toISOString() || null,
      reference: filing.id,
      createdAt: filing.createdAt.toISOString(),
    };
  }

  private toWhtCertificateView(cert: any): WhtCertificateView {
    return {
      id: cert.id,
      companyId: cert.companyId,
      certNo: cert.certNo,
      vendorId: cert.supplierTin ?? '',
      vendorName: cert.supplierName,
      whtType: cert.whtType,
      amount: cert.whtAmount.toString(),
      issueDate: cert.issueDate.toISOString().split('T')[0],
      status: cert.status,
    };
  }

  private toLedgerEntryView(entry: any, type: 'INPUT' | 'OUTPUT'): TaxLedgerEntryView {
    return {
      id: entry.id,
      companyId: entry.companyId,
      type,
      category: entry.category,
      reference: entry.invoiceNo || entry.reference || '',
      amount: entry.amount?.toString() || '0',
      taxAmount: entry.vatAmount?.toString() || '0',
      date: entry.date.toISOString().split('T')[0],
      period: entry.period,
    };
  }

  private mapCompanyTypeToTaxpayerType(companyType: string): string {
    const mapping: Record<string, string> = {
      'LARGE_ENTERPRISE': 'LARGE_TAXPAYER',
      'MEDIUM_ENTERPRISE': 'MEDIUM_TAXPAYER',
      'SMALL_BUSINESS': 'SMALL_TAXPAYER',
      'MICRO_ENTERPRISE': 'MICRO_TAXPAYER',
      'FREELANCER': 'INDIVIDUAL',
      'NGO': 'NGO',
      'GOVERNMENT': 'GOVERNMENT',
    };
    return mapping[companyType] || 'MEDIUM_TAXPAYER';
  }
}
