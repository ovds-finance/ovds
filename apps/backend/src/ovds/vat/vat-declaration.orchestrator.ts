/**
 * @file vat-declaration.orchestrator.ts
 * @module OvdsVatModule
 *
 * VatDeclarationOrchestrator
 * ──────────────────────────
 * The single NestJS service that orchestrates ALL VAT declaration operations
 * across every installed country module.
 *
 * Responsibilities:
 *  1. Bootstraps the VatModuleRegistry at application start (OnApplicationBootstrap).
 *  2. Routes calculate / validate / buildReturn calls to the correct country engine.
 *  3. Reads and writes VAT filings to the database via PrismaService.
 *  4. Manages per-tenant module activation (CRUD on TenantVatModule table).
 *  5. Delegates report rendering to VatReportEngine.
 *  6. Publishes domain events for downstream modules (audit-log, notifications).
 *
 * The orchestrator deliberately owns NO jurisdiction logic — that lives entirely
 * in the country module packages.  Adding a new country = install one package,
 * register it here.
 */

import {
  Injectable,
  OnApplicationBootstrap,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VatModuleRegistry }    from '@ovds/core/vat';
import type { VatContext, ReportFormat } from '@ovds/core/vat';
import { getVatReportEngine, VatReportEngine } from '@ovds/core/vat/report';
import type { VatRenderContext } from '@ovds/core/vat/report';
import { aeVatModule, etVatModule } from '@ovds/modules/tax';

import { PrismaService }        from '../../common/prisma.service';
import { ModuleActivationService } from '../../core/module-activation.service';
import { ModuleBootstrapService } from '../../core/module-bootstrap.service';

// Country module singletons — add one line per new country


import { VatFilingService }     from './vat-filing.service';

// DI token for the registry (allows injection in guards, other services)
export const VAT_MODULE_REGISTRY = 'VAT_MODULE_REGISTRY';
export const VAT_REPORT_ENGINE   = 'VAT_REPORT_ENGINE';

// ─── DTOs (internal — public DTOs live in ./dto/) ────────────────────────────

export interface CalculateVatDto {
  tenantId:        string;
  countryCode:     string;
  transactionDate: string;
  subtotal:        number;
  currency:        string;
  hsCode?:         string;
  isExport?:       boolean;
  isImport?:       boolean;
  reverseCharge?:  boolean;
  meta?:           Record<string, unknown>;
}

export interface BuildReturnDto {
  tenantId:    string;
  countryCode: string;
  periodKey:   string;
  currency:    string;
}

export interface RenderReportDto {
  tenantId:   string;
  templateId: string;
  format:     ReportFormat;
  periodKey:  string;
  meta: {
    companyName:   string;
    tin:           string;
    periodLabel:   string;
    preparedBy:    string;
    authorityName: string;
    currency:      string;
    [key: string]: unknown;
  };
}

export interface ActivateModuleDto {
  tenantId:     string;
  countryCodes: string[];
  activatedBy:  string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class VatDeclarationOrchestrator implements OnApplicationBootstrap {
  private readonly logger = new Logger(VatDeclarationOrchestrator.name);

  constructor(
    private readonly prisma:        PrismaService,
    private readonly eventEmitter:  EventEmitter2,
    @Inject(VAT_MODULE_REGISTRY)
    private readonly registry:      VatModuleRegistry,
    @Inject(VAT_REPORT_ENGINE)
    private readonly reportEngine:  VatReportEngine,
    private readonly moduleActivation: ModuleActivationService,
    private readonly moduleBootstrap: ModuleBootstrapService,
    @Optional()
    private readonly filingService?: VatFilingService,
  ) {}

  // ── Bootstrap ────────────────────────────────────────────────────────────

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('VatDeclarationOrchestrator: bootstrapping VAT module registry…');

    // 1. Register all installed country modules
    const modules = [etVatModule, aeVatModule];
    // Additional modules auto-discovered via dynamic import in enterprise builds

    for (const mod of modules) {
      this.registry.register(mod);
      this.logger.log(`  ✓ Registered VAT module: ${mod.info.displayName} (${mod.countryCode})`);
    }

    // 2. Register report templates from each module into the report engine
    for (const mod of modules) {
      this.reportEngine.registerTemplates(mod.reportTemplates());
    }

    // 3. Upsert VatModuleManifest rows so the DB catalogue stays current
    await this.upsertModuleManifests(modules);

    // 4. Restore per-tenant activation state from DB
    await this.syncAllTenantActivations();

    this.logger.log(
      `VatDeclarationOrchestrator: ready — ${this.registry.size} country module(s) loaded.`,
    );
  }

  // ── Tenant activation management ─────────────────────────────────────────

  async activateModules(dto: ActivateModuleDto): Promise<void> {
    await this.moduleActivation.activateVatModules({
      companyId: dto.tenantId,
      countryCodes: dto.countryCodes,
      activatedBy: dto.activatedBy,
    });
  }

  async deactivateModules(tenantId: string, countryCodes: string[], deactivatedBy: string): Promise<void> {
    await this.moduleActivation.deactivateVatModules({
      companyId: tenantId,
      countryCodes,
      deactivatedBy,
    });
  }

  /** Reload all tenant activations from DB into the in-memory registry */
  async syncAllTenantActivations(): Promise<void> {
    try {
      const rows: Array<{ tenantId: string; countryCode: string }> =
        await this.prisma.$queryRaw`
          SELECT tenantId, countryCode
          FROM tenant_vat_module
          WHERE isActive = 1
        `;

      // Group by tenant
      const map = new Map<string, string[]>();
      for (const row of rows) {
        const existing = map.get(row.tenantId) ?? [];
        existing.push(row.countryCode);
        map.set(row.tenantId, existing);
      }

      for (const [tenantId, codes] of map.entries()) {
        this.registry.syncTenantActivations(tenantId, codes);
      }

      this.logger.log(
        `VatDeclarationOrchestrator: synced activations for ${map.size} tenant(s)`,
      );
    } catch (err) {
      // Table may not exist yet during first-run before migration
      this.logger.warn(
        'VatDeclarationOrchestrator: could not sync tenant activations from DB ' +
        '(table may not exist yet). All tenants start with no active VAT modules.',
      );
    }
  }

  // ── VAT Calculation ───────────────────────────────────────────────────────

  calculate(dto: CalculateVatDto) {
    const engine = this.resolveEngine(dto.tenantId, dto.countryCode);
    const ctx: VatContext = {
      companyId:        dto.tenantId,
      countryCode:      dto.countryCode,
      transactionDate:  dto.transactionDate,
      subtotal:         dto.subtotal,
      currency:         dto.currency,
      hsCode:           dto.hsCode,
      isExport:         dto.isExport,
      isImport:         dto.isImport,
      reverseCharge:    dto.reverseCharge,
      meta:             dto.meta,
    };
    return engine.calculate(ctx);
  }

  async validate(dto: CalculateVatDto) {
    const engine = this.resolveEngine(dto.tenantId, dto.countryCode);
    const ctx: VatContext = {
      companyId:       dto.tenantId,
      countryCode:     dto.countryCode,
      transactionDate: dto.transactionDate,
      subtotal:        dto.subtotal,
      currency:        dto.currency,
      hsCode:          dto.hsCode,
      isExport:        dto.isExport,
      isImport:        dto.isImport,
      reverseCharge:   dto.reverseCharge,
      meta:            dto.meta,
    };
    return engine.validate(ctx);
  }

  // ── Period Management ─────────────────────────────────────────────────────

  getPeriods(tenantId: string, countryCode: string, year: number) {
    const engine = this.resolveEngine(tenantId, countryCode);
    return engine.periods(year);
  }

  // ── Return Builder ────────────────────────────────────────────────────────

  async buildReturn(dto: BuildReturnDto) {
    const engine = this.resolveEngine(dto.tenantId, dto.countryCode);

    // Aggregate VAT ledger totals from DB for the given period
    const { inputVat, outputVat } = await this.aggregateVatLedger(
      dto.tenantId,
      dto.countryCode,
      dto.periodKey,
    );

    return engine.buildReturn(dto.tenantId, dto.periodKey, inputVat, outputVat, dto.currency);
  }

  /**
   * buildAndSave — builds the VAT return draft AND auto-persists it as a
   * DRAFT VatFilingRecord.  Used by the filing wizard's "Build Return" step.
   * Falls back to in-memory only if VatFilingService is not available.
   */
  async buildAndSave(
    dto:     BuildReturnDto,
    actorId: string,
  ) {
    const draft = await this.buildReturn(dto);

    if (this.filingService) {
      await this.filingService.saveDraft(
        dto.tenantId,
        {
          countryCode:   dto.countryCode,
          periodKey:     dto.periodKey,
          currency:      dto.currency,
          returnDraft:   draft as unknown as Record<string, unknown>,
          outputVat:     draft.lines
            .filter(l => l.boxCode?.startsWith('A') || l.boxCode === 'OUTPUT_VAT' || l.boxCode === '8')
            .reduce((s, l) => s + (l.taxAmount ?? 0), 0),
          inputVat:      draft.lines
            .filter(l => l.boxCode?.startsWith('B') || l.boxCode === 'INPUT_VAT' || l.boxCode === '14')
            .reduce((s, l) => s + (l.taxAmount ?? 0), 0),
          netVatPayable: draft.netVatPayable,
        },
        actorId,
      );
    }

    return draft;
  }

  // ── Report Rendering ──────────────────────────────────────────────────────

  async renderReport(dto: RenderReportDto) {
    const returnDraft = await this.buildReturn({
      tenantId:    dto.tenantId,
      countryCode: dto.meta['countryCode'] as string ?? dto.templateId.slice(0, 2).toUpperCase(),
      periodKey:   dto.periodKey,
      currency:    dto.meta.currency,
    });

    const ctx: VatRenderContext = {
      returnDraft,
      meta: {
        ...dto.meta,
        preparedAt: new Date().toISOString(),
      },
      locale: {
        languageTag:       'en',
        dateFormat:        'DD/MM/YYYY',
        decimalSeparator:  '.',
        thousandSeparator: ',',
      },
    };

    return this.reportEngine.render(dto.templateId, dto.format, ctx);
  }

  // ── Catalogue helpers ─────────────────────────────────────────────────────

  getCatalogue() {
    return this.registry.catalogue();
  }

  getCatalogueForTenant(tenantId: string) {
    return this.registry.catalogueForTenant(tenantId);
  }

  getTemplatesForCountry(countryCode: string) {
    return this.reportEngine.templatesForCountry(countryCode);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private resolveEngine(tenantId: string, countryCode: string) {
    const code   = countryCode.toUpperCase();
    const engine = this.registry.ruleEngine(code, tenantId);

    if (!engine) {
      // Distinguish "module not installed" from "module installed but not activated"
      const exists = this.registry.allCodes().includes(code);
      if (!exists) {
        throw new NotFoundException(
          `VAT module for country "${code}" is not installed. ` +
          `Installed modules: ${this.registry.allCodes().join(', ')}`,
        );
      }
      throw new BadRequestException(
        `VAT module "${code}" is installed but not activated for this tenant. ` +
        `Activate it via POST /vat/modules/activate`,
      );
    }

    return engine;
  }

  private async aggregateVatLedger(
    tenantId:    string,
    countryCode: string,
    periodKey:   string,
  ): Promise<{ inputVat: number; outputVat: number }> {
    try {
      // Derive date range from period key (YYYY-MM or YYYY-Qn or YYYY)
      const { startDate, endDate } = this.periodKeyToDateRange(periodKey);

      const inputRows: Array<{ total: bigint | string }> =
        await this.prisma.$queryRaw`
          SELECT COALESCE(SUM(vat_amount), 0) AS total
          FROM vat_input_ledger
          WHERE company_id = ${tenantId}
            AND country_code = ${countryCode}
            AND transaction_date BETWEEN ${startDate} AND ${endDate}
        `;

      const outputRows: Array<{ total: bigint | string }> =
        await this.prisma.$queryRaw`
          SELECT COALESCE(SUM(vat_amount), 0) AS total
          FROM vat_output_ledger
          WHERE company_id = ${tenantId}
            AND country_code = ${countryCode}
            AND transaction_date BETWEEN ${startDate} AND ${endDate}
        `;

      const inputVat  = Number(inputRows[0]?.total  ?? 0);
      const outputVat = Number(outputRows[0]?.total ?? 0);
      return { inputVat, outputVat };
    } catch {
      // Graceful fallback when tables don't exist yet in dev
      this.logger.warn(`aggregateVatLedger: could not query DB for ${tenantId}/${countryCode}/${periodKey} — returning zeros`);
      return { inputVat: 0, outputVat: 0 };
    }
  }

  private periodKeyToDateRange(periodKey: string): { startDate: string; endDate: string } {
    // YYYY-MM
    if (/^\d{4}-\d{2}$/.test(periodKey)) {
      const [y, m] = periodKey.split('-').map(Number);
      const end = new Date(y, m, 0); // last day of month
      return {
        startDate: `${y}-${pad2(m)}-01`,
        endDate:   `${y}-${pad2(m)}-${pad2(end.getDate())}`,
      };
    }
    // YYYY-Qn
    if (/^\d{4}-Q[1-4]$/.test(periodKey)) {
      const year = Number(periodKey.slice(0, 4));
      const q    = Number(periodKey.slice(6));
      const firstMonth = (q - 1) * 3 + 1;
      const lastMonth  = q * 3;
      const end = new Date(year, lastMonth, 0);
      return {
        startDate: `${year}-${pad2(firstMonth)}-01`,
        endDate:   `${year}-${pad2(lastMonth)}-${pad2(end.getDate())}`,
      };
    }
    // YYYY (annual)
    if (/^\d{4}$/.test(periodKey)) {
      return { startDate: `${periodKey}-01-01`, endDate: `${periodKey}-12-31` };
    }
    // YYYY-Hn (semi-annual)
    if (/^\d{4}-H[12]$/.test(periodKey)) {
      const year = Number(periodKey.slice(0, 4));
      const h    = Number(periodKey.slice(6));
      const firstMonth = h === 1 ? 1 : 7;
      const lastMonth  = h === 1 ? 6 : 12;
      const end = new Date(year, lastMonth, 0);
      return {
        startDate: `${year}-${pad2(firstMonth)}-01`,
        endDate:   `${year}-${pad2(lastMonth)}-${pad2(end.getDate())}`,
      };
    }

    throw new BadRequestException(`Invalid periodKey format: "${periodKey}". Expected YYYY-MM, YYYY-Qn, YYYY-Hn, or YYYY.`);
  }

  // ── VatModuleManifest DB sync ─────────────────────────────────────────────

  /**
   * Upsert one VatModuleManifest row per registered country module.
   * Keeps the DB catalogue in sync with the installed code on every boot.
   * Failures are non-fatal — the registry still works from in-memory state.
   */
  private async upsertModuleManifests(modules: any[]): Promise<void> {
    for (const mod of modules) {
      try {
        const ji = mod.jurisdictionInfo();
        await this.prisma.vatModuleManifest.upsert({
          where: { countryCode: mod.countryCode },
          update: {
            moduleVersion: mod.version,
            displayName: mod.info.displayName,
            authorityName: ji.authorityName,
            ruleSetVersion: mod.ruleEngine().ruleSetVersion,
            filingFrequencies: JSON.stringify(mod.filingFrequencies),
            authoritySpec: JSON.stringify(mod.authority),
            reportTemplates: JSON.stringify(mod.reportTemplates()),
            filingForms: JSON.stringify(mod.filingForms()),
            isActive: true,
          },
          create: {
            countryCode: mod.countryCode,
            countryName: mod.countryName,
            modulePackageName: mod.info.name,
            moduleVersion: mod.version,
            displayName: mod.info.displayName,
            authorityName: ji.authorityName,
            authorityAbbrev: ji.authorityAbbrev,
            currency: ji.currency,
            ruleSetVersion: mod.ruleEngine().ruleSetVersion,
            filingFrequencies: JSON.stringify(mod.filingFrequencies),
            authoritySpec: JSON.stringify(mod.authority),
            reportTemplates: JSON.stringify(mod.reportTemplates()),
            filingForms: JSON.stringify(mod.filingForms()),
            isActive: true,
          },
        });

        this.logger.log(`  ✓ Manifest upserted: ${mod.countryCode}`);
      } catch (err) {
        this.logger.warn(
          `  ⚠ Could not upsert VatModuleManifest for ${mod.countryCode}: ` +
          `${(err as Error).message}`,
        );
      }
    }
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}
