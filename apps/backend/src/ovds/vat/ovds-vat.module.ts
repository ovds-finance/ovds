/**
 * @file ovds-vat.module.ts
 * @module OvdsVatModule
 *
 * NestJS module that wires the entire VAT Declaration subsystem.
 *
 * Provides as injectable tokens:
 *  VAT_MODULE_REGISTRY  → VatModuleRegistry singleton
 *  VAT_REPORT_ENGINE    → VatReportEngine singleton (with built-in JSON + CSV renderers)
 *
 * Import this module into OvdsFacadeModule (or AppModule directly):
 *
 *   @Module({ imports: [ OvdsVatModule, … ] })
 *   export class OvdsFacadeModule {}
 */

import { Module }          from '@nestjs/common';
import { getVatModuleRegistry }  from '@ovds/core/vat';
import { getVatReportEngine }    from '@ovds/core/vat/report';

import { CommonModule }    from '../../common/common.module';
import { CoreModule }      from '../../core/core.module';

import { VatModuleGuard }           from './guards/vat-module.guard';
import { VatDeclarationController } from './vat-declaration.controller';
import {
  VatDeclarationOrchestrator,
  VAT_MODULE_REGISTRY,
  VAT_REPORT_ENGINE,
} from './vat-declaration.orchestrator';
import { VatFilingService }         from './vat-filing.service';


@Module({
  imports: [CommonModule, CoreModule],

  controllers: [VatDeclarationController],

  providers: [
    // ── Singleton registry — one per process ──────────────────────────────
    {
      provide:  VAT_MODULE_REGISTRY,
      useValue: getVatModuleRegistry(),
    },

    // ── Singleton report engine — one per process ─────────────────────────
    {
      provide:  VAT_REPORT_ENGINE,
      useValue: getVatReportEngine(),
    },

    // ── Orchestrator — the single NestJS service consumers inject ─────────
    VatDeclarationOrchestrator,

    // ── Filing persistence ────────────────────────────────────────────────
    VatFilingService,

    // ── Guards ────────────────────────────────────────────────────────────
    VatModuleGuard,
  ],

  exports: [
    VatDeclarationOrchestrator,
    VatFilingService,
    VatModuleGuard,
    VAT_MODULE_REGISTRY,
    VAT_REPORT_ENGINE,
  ],
})
export class OvdsVatModule {}
