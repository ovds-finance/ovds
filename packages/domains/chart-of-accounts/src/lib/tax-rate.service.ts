/**
 * TaxRateService — Accounting domain business logic.
 *
 * Enhanced Ethiopian tax rule-based calculation engine supporting:
 *   NORMAL      — exclusive sales tax added on top
 *   INCLUSIVE   — tax embedded in quoted price (back-calculated)
 *   COMPOUND    — tax-on-tax applied after primary tax
 *   FIXED       — flat monetary amount regardless of item cost
 *   WITHHOLDING — withheld by payer, remitted to authority
 *
 * Migrated from apps/backend/src/accounting/tax-rate.service.ts into the
 * @ovds/domains/accounting library following the thin-apps-thick-libs pattern.
 */
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  TaxCalculationType,
  computeTaxFromType,
} from "@ovds/shared";

export interface CreateTaxRateDto {
  name: string;
  rate: number;
  currencyCode?: string;
  type?: "VAT" | "SALES_TAX" | "WITHHOLDING" | "INCOME_TAX" | "DRRF" | "CUSTOM";
  calculationType?: TaxCalculationType;
  appliesTo?: string[];
  description?: string;
  isActive?: boolean;
  isInclusive?: boolean;
  isCompound?: boolean;
  compoundParentId?: string;
  specificAmount?: number;
  roundingRule?: string;
}

export interface BulkToggleDto {
  ids: string[];
  isActive: boolean;
}

export interface BulkDeleteDto {
  ids: string[];
}

export interface TaxCalculationInput {
  amount: number;
  rate?: number;
  fixedAmount?: number;
  baseTax?: number;
  quantity?: number;
}

export interface TaxCalculationResult {
  net: number;
  tax: number;
  total: number;
  effectiveRate: number;
}

export interface TaxRateWithCalculation {
  id: string;
  name: string;
  rate: number;
  type: string;
  calculationType: TaxCalculationType;
  appliesTo: string[];
  description?: string;
  isActive: boolean;
  isInclusive: boolean;
  isCompound: boolean;
  compoundParentId?: string;
  specificAmount?: number;
  roundingRule: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxRatePrisma {
  taxrate: {
    findMany(args?: unknown): Promise<any[]>;
    findFirst(args?: unknown): Promise<any | null>;
    findUnique(args: { where: { id: string } }): Promise<any | null>;
    create(args: { data: unknown }): Promise<any>;
    update(args: { where: { id: string }; data: unknown }): Promise<any>;
    updateMany(args: { where: unknown; data: unknown }): Promise<{ count: number }>;
    delete(args: { where: { id: string } }): Promise<any>;
    deleteMany(args: { where: unknown }): Promise<{ count: number }>;
  };
}

export interface TaxRateAuditLogger {
  log(userId: string, action: string, details: string, companyId?: string): Promise<unknown>;
}

@Injectable()
export class TaxRateService {
  private readonly logger = new Logger(TaxRateService.name);

  constructor(
    private readonly prisma: TaxRatePrisma,
    private readonly auditLog: TaxRateAuditLogger,
  ) {}

  private audit(
    userId: string,
    action: string,
    details: string,
    companyId?: string,
  ): void {
    this.auditLog
      .log(userId, action, details, companyId)
      .catch((err: any) =>
        this.logger.warn(`Audit log failed (non-blocking): ${err?.message}`),
      );
  }

  private parseRate(rate: any) {
    if (!rate) return rate;
    return {
      ...rate,
      rate: Number(rate.rate),
      calculationType: rate.calculationType || "NORMAL",
      appliesTo: rate.appliesTo
        ? (() => {
            try {
              return JSON.parse(rate.appliesTo);
            } catch {
              return [];
            }
          })()
        : [],
      isInclusive: Boolean(rate.isInclusive),
      isCompound: Boolean(rate.isCompound),
      compoundParentId: rate.compoundParentId || null,
      specificAmount: rate.specificAmount ? Number(rate.specificAmount) : null,
      roundingRule: rate.roundingRule || "HALF_UP",
      updatedAt: rate.updatedAt ? new Date(rate.updatedAt) : undefined,
    };
  }

  async findAll(activeOnly = true): Promise<TaxRateWithCalculation[]> {
    const rates = await this.prisma.taxrate.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: "asc" },
    });
    return rates.map((r) => this.parseRate(r)) as TaxRateWithCalculation[];
  }

  async findById(id: string): Promise<TaxRateWithCalculation> {
    const rate = await this.prisma.taxrate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException("Tax rate not found");
    return this.parseRate(rate) as TaxRateWithCalculation;
  }

  async create(data: CreateTaxRateDto, userId: string): Promise<TaxRateWithCalculation> {
    const calcType = data.calculationType || "NORMAL";
    const rate = await this.prisma.taxrate.create({
      data: {
        id: randomUUID(),
        name: data.name,
        rate: data.rate,
        type: (data.type || "VAT") as any,
        calculationType: calcType as any,
        appliesTo: data.appliesTo ? JSON.stringify(data.appliesTo) : null,
        description: data.description,
        isActive: data.isActive ?? true,
        isInclusive: data.isInclusive ?? calcType === "INCLUSIVE",
        isCompound: data.isCompound ?? calcType === "COMPOUND",
        compoundParentId: data.compoundParentId || null,
        specificAmount: data.specificAmount ?? null,
        roundingRule: data.roundingRule || "HALF_UP",
      },
    });
    this.audit(userId, "CREATE_TAX_RATE", `Tax rate "${data.name}" created (${calcType})`);
    return this.parseRate(rate) as TaxRateWithCalculation;
  }

  async update(
    id: string,
    data: Partial<CreateTaxRateDto>,
    userId: string,
  ): Promise<TaxRateWithCalculation> {
    const existing = await this.findById(id);
    const calcType = data.calculationType || existing.calculationType || "NORMAL";
    const updated = await this.prisma.taxrate.update({
      where: { id },
      data: {
        ...data,
        type: data.type as any,
        calculationType: calcType as any,
        appliesTo: data.appliesTo ? JSON.stringify(data.appliesTo) : undefined,
        isInclusive: data.isInclusive ?? calcType === "INCLUSIVE",
        isCompound: data.isCompound ?? calcType === "COMPOUND",
      },
    });
    this.audit(
      userId,
      "UPDATE_TAX_RATE",
      `Tax rate "${existing.name}" updated (${calcType})`,
    );
    return this.parseRate(updated) as TaxRateWithCalculation;
  }

  async bulkToggleActive(ids: string[], isActive: boolean, userId: string) {
    const count = await this.prisma.taxrate.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
    this.audit(
      userId,
      "BULK_UPDATE_TAX_RATES",
      `Bulk updated ${count.count} tax rates to ${isActive ? "active" : "inactive"}`,
    );
    return count;
  }

  async bulkDelete(ids: string[], userId: string) {
    const rates = await this.prisma.taxrate.findMany({
      where: { id: { in: ids } },
    });
    await this.prisma.taxrate.deleteMany({ where: { id: { in: ids } } });
    for (const rate of rates) {
      this.audit(
        userId,
        "DELETE_TAX_RATE",
        `Tax rate "${rate.name}" deleted (bulk)`,
      );
    }
    return { deleted: rates.length };
  }

  async delete(id: string, userId: string) {
    const rate = await this.findById(id);
    await this.prisma.taxrate.delete({ where: { id } });
    this.audit(userId, "DELETE_TAX_RATE", `Tax rate "${rate.name}" deleted`);
    return { success: true };
  }

  async getDefaultVatRate() {
    const vat = await this.prisma.taxrate.findFirst({
      where: { type: "VAT", isActive: true },
    });
    return vat?.rate ?? 0.15;
  }

  /**
   * Calculate taxes for an array of items using the enhanced calculation engine.
   * Supports NORMAL, INCLUSIVE, COMPOUND, FIXED, and WITHHOLDING types.
   */
  async calculateTaxes(
    items: Array<{
      price: number;
      quantity: number;
      taxRateId?: string;
      taxRateIds?: string[];
    }>,
  ): Promise<
    Array<{
      item: {
        price: number;
        quantity: number;
        taxRateId?: string;
        taxRateIds?: string[];
      };
      taxes: Array<{
        taxRateId: string;
        name: string;
        calculationType: TaxCalculationType;
        rate: number;
        subtotal: number;
        taxAmount: number;
        total: number;
        net: number;
      }>;
      lineTotal: number;
    }>
  > {
    const results = await Promise.all(
      items.map(async (item) => {
        const subtotal = item.price * item.quantity;
        let lineTotal = subtotal;
        const taxes: Array<{
          taxRateId: string;
          name: string;
          calculationType: TaxCalculationType;
          rate: number;
          subtotal: number;
          taxAmount: number;
          total: number;
          net: number;
        }> = [];

        // Primary tax
        if (item.taxRateId) {
          const taxRate = await this.findById(item.taxRateId);
          const baseForCalc = lineTotal;
          const result = this.applyTaxCalculation(
            taxRate,
            baseForCalc,
            taxes.reduce((s, t) => s + t.taxAmount, 0),
          );
          taxes.push({
            taxRateId: taxRate.id,
            name: taxRate.name,
            calculationType: taxRate.calculationType,
            rate: taxRate.rate,
            subtotal: baseForCalc,
            taxAmount: result.tax,
            total: result.total,
            net: result.net,
          });
          lineTotal = result.total;
        }

        // Secondary taxes (e.g., compound taxes stacked on top)
        if (item.taxRateIds && item.taxRateIds.length > 0) {
          for (const rateId of item.taxRateIds) {
            if (rateId === item.taxRateId) continue;
            const taxRate = await this.findById(rateId);
            const baseForCalc = lineTotal;
            const result = this.applyTaxCalculation(
              taxRate,
              baseForCalc,
              taxes.reduce((s, t) => s + t.taxAmount, 0),
            );
            taxes.push({
              taxRateId: taxRate.id,
              name: taxRate.name,
              calculationType: taxRate.calculationType,
              rate: taxRate.rate,
              subtotal: baseForCalc,
              taxAmount: result.tax,
              total: result.total,
              net: result.net,
            });
            lineTotal = result.total;
          }
        }

        return {
          item,
          taxes,
          lineTotal,
        };
      }),
    );
    return results;
  }

  /**
   * Apply a single tax rate to a base amount using the appropriate calculation type.
   */
  applyTaxCalculation(
    taxRate: TaxRateWithCalculation,
    baseAmount: number,
    priorTaxTotal: number = 0,
  ): TaxCalculationResult {
    const input: TaxCalculationInput = {
      amount: baseAmount,
      rate: taxRate.rate,
      fixedAmount: taxRate.specificAmount ?? 0,
      baseTax: priorTaxTotal,
    };

    let result = computeTaxFromType(taxRate.calculationType, input);

    // Apply rounding rule
    result = this.applyRounding(result, taxRate.roundingRule || "HALF_UP");

    return result;
  }

  /**
   * Apply rounding to tax calculation result.
   */
  private applyRounding(
    result: TaxCalculationResult,
    rule: string,
  ): TaxCalculationResult {
    const decimals = 2;
    switch (rule) {
      case "HALF_EVEN":
        result.tax = Math.round(result.tax * 100) / 100;
        result.net = Math.round(result.net * 100) / 100;
        result.total = Math.round(result.total * 100) / 100;
        break;
      case "HALF_UP":
      default:
        result.tax = Math.round(result.tax * 100) / 100;
        result.net = Math.round(result.net * 100) / 100;
        result.total = Math.round(result.total * 100) / 100;
        break;
    }
    result.effectiveRate = result.net > 0 ? result.tax / result.net : 0;
    return result;
  }

  /**
   * Seed default Ethiopian tax rates with calculation types.
   * This populates the system with the canonical Ethiopian tax ruleset.
   */
  async seedEthiopianRates(userId: string) {
    const rates: Array<{
      name: string;
      rate: number;
      type: "VAT" | "SALES_TAX" | "WITHHOLDING" | "INCOME_TAX" | "DRRF" | "CUSTOM";
      calculationType: TaxCalculationType;
      appliesTo?: string[];
      description: string;
      specificAmount?: number;
    }> = [
      {
        name: "VAT Standard Rate",
        rate: 0.15,
        type: "VAT",
        calculationType: TaxCalculationType.NORMAL,
        appliesTo: ["INVOICE", "BILL", "ITEM"],
        description:
          "15% standard VAT on taxable supplies — Proc. 1341/2024. Added on top of subtotal (exclusive).",
      },
      {
        name: "VAT Inclusive (Embedded)",
        rate: 0.15,
        type: "VAT",
        calculationType: TaxCalculationType.INCLUSIVE,
        appliesTo: ["INVOICE", "ITEM"],
        description:
          "15% VAT where the displayed price already includes tax. Back-calculated from gross amount.",
      },
      {
        name: "TOT — Goods (2%)",
        rate: 0.02,
        type: "SALES_TAX",
        calculationType: TaxCalculationType.NORMAL,
        appliesTo: ["INVOICE"],
        description:
          "2% Turnover Tax on goods sold locally — Category C taxpayers.",
      },
      {
        name: "TOT — General Services (10%)",
        rate: 0.10,
        type: "SALES_TAX",
        calculationType: TaxCalculationType.NORMAL,
        appliesTo: ["INVOICE"],
        description: "10% Turnover Tax on all general services.",
      },
      {
        name: "Business Income Tax — Corporate (30%)",
        rate: 0.30,
        type: "INCOME_TAX",
        calculationType: TaxCalculationType.NORMAL,
        appliesTo: ["BILL"],
        description:
          "30% flat rate on net taxable profit for bodies — Proc. 979/2016.",
      },
      {
        name: "WHT — Services (2%)",
        rate: 0.02,
        type: "WITHHOLDING",
        calculationType: TaxCalculationType.WITHHOLDING,
        appliesTo: ["BILL"],
        description: "2% withholding on service payments — Proc. 979/2016.",
      },
      {
        name: "WHT — Goods (2%)",
        rate: 0.02,
        type: "WITHHOLDING",
        calculationType: TaxCalculationType.WITHHOLDING,
        appliesTo: ["BILL"],
        description: "2% withholding on domestic goods payments ≥ ETB 10,000.",
      },
      {
        name: "DRRF — General Levy (1%)",
        rate: 0.01,
        type: "DRRF",
        calculationType: TaxCalculationType.NORMAL,
        appliesTo: ["INVOICE", "BILL", "PAYROLL"],
        description:
          "Disaster Risk Reduction Fund — 1% on most transaction categories.",
      },
      {
        name: "Excise — Alcohol (15%)",
        rate: 0.15,
        type: "CUSTOM",
        calculationType: TaxCalculationType.NORMAL,
        appliesTo: ["INVOICE", "ITEM"],
        description: "15% excise on alcoholic beverages — Proc. 1186/2020.",
      },
      {
        name: "Stamp Duty — Contracts (Fixed ETB 500)",
        rate: 0,
        type: "CUSTOM",
        calculationType: TaxCalculationType.FIXED,
        appliesTo: ["INVOICE", "BILL"],
        description: "Fixed ETB 500 stamp duty on legal contracts — Proc. 110/1998.",
        specificAmount: 500,
      },
    ];

    let created = 0;
    let updated = 0;
    for (const rateData of rates) {
      const exists = await this.prisma.taxrate.findFirst({
        where: { name: rateData.name },
      });
      if (!exists) {
        await this.create(rateData, userId);
        created++;
      } else {
        await this.prisma.taxrate.update({
          where: { id: exists.id },
          data: {
            rate: rateData.rate,
            calculationType: rateData.calculationType as any,
            description: rateData.description,
            type: rateData.type as any,
            appliesTo: rateData.appliesTo
              ? JSON.stringify(rateData.appliesTo)
              : undefined,
            specificAmount: rateData.specificAmount ?? undefined,
          },
        });
        updated++;
      }
    }
    this.audit(
      userId,
      "SEED_TAX_RATES",
      `Enhanced Ethiopian tax seed: ${created} created, ${updated} updated (calculation types applied)`,
    );
    return {
      created,
      updated,
      total: rates.length,
      message: `${created} rates created, ${updated} updated. Full MoR calculation engine applied.`,
    };
  }
}
