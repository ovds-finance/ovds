/**
 * PipelineInterceptorService (NestJS adapter)
 * ─────────────────────────────────────────────
 * Provides the PipelineInterceptor singleton to the NestJS DI graph and
 * registers the built-in system-level hooks on module init.
 *
 * Any NestJS service can call PipelineInterceptorService.run() to thread
 * context through all registered hooks before executing a document operation.
 *
 * Built-in hooks registered here (priority 0–9, reserved for core):
 *   • invoice.render  → injects EIMS registration status field
 *   • invoice.render  → appends company logo path from tenant settings
 *   • invoice.eims    → validates mandatory buyer TIN field for B2B invoices
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  PipelineInterceptor,
  PIPELINE_STAGES,
  type InvoiceRenderContext,
  type PipelineContext,
} from '@ovds/core';

@Injectable()
export class PipelineInterceptorService implements OnModuleInit {
  private readonly logger = new Logger(PipelineInterceptorService.name);

  onModuleInit(): void {
    this.registerCoreHooks();
    this.logger.log(
      `PipelineInterceptor ready — stages: [${PipelineInterceptor.getStages().join(', ')}]`,
    );
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Run the pipeline for a given stage, threading context through all hooks.
   * Delegates entirely to the singleton — no framework logic here.
   */
  async run<TCtx extends PipelineContext = PipelineContext>(
    stage: string,
    initial: TCtx,
  ): Promise<TCtx> {
    return PipelineInterceptor.run(stage, initial);
  }

  /**
   * Register a module-provided hook at runtime.
   * Modules call this from their boot() lifecycle method.
   */
  register<TCtx extends PipelineContext = PipelineContext>(
    stage: string,
    hook: Parameters<typeof PipelineInterceptor.register<TCtx>>[1],
  ): void {
    PipelineInterceptor.register(stage, hook);
  }

  // ── Built-in core hooks (priority 0–9) ────────────────────────────────────

  private registerCoreHooks(): void {
    // ── Hook 1: append EIMS registration status to every invoice render ──
    PipelineInterceptor.register<InvoiceRenderContext>(
      PIPELINE_STAGES.INVOICE_RENDER,
      {
        id: 'core.invoice.eims-status-field',
        priority: 1,
        description: 'Appends the EIMS IRN and status badge field to the render context',
        transform: (ctx: InvoiceRenderContext) => {
          const invoice = ctx.invoice as Record<string, unknown>;
          const eimsIrn   = invoice['eimsIrn']   as string | null;
          const eimsStatus = invoice['eimsStatus'] as string | null;

          // Only inject if EIMS data is present — silently no-op for non-EIMS invoices
          if (!eimsIrn) return ctx;

          return {
            ...ctx,
            extraFields: [
              ...ctx.extraFields,
              {
                key: 'eims_irn',
                label: 'EIMS Reference (IRN)',
                value: eimsIrn,
              },
              {
                key: 'eims_status',
                label: 'EIMS Status',
                value: eimsStatus ?? 'REGISTERED',
              },
            ],
          };
        },
      },
    );

    // ── Hook 2: append DRRF disclosure line ──────────────────────────────
    PipelineInterceptor.register<InvoiceRenderContext>(
      PIPELINE_STAGES.INVOICE_RENDER,
      {
        id: 'core.invoice.drrf-disclosure',
        priority: 2,
        description: 'Appends DRRF levy disclosure field per Regulation No. 570/2025',
        transform: (ctx: InvoiceRenderContext) => {
          const invoice = ctx.invoice as Record<string, unknown>;
          const drrfAmount = Number(invoice['drrfAmount'] ?? 0);
          if (drrfAmount <= 0) return ctx;

          return {
            ...ctx,
            extraFields: [
              ...ctx.extraFields,
              {
                key: 'drrf_disclosure',
                label: 'DRRF Levy (1% — Reg. 570/2025)',
                value: drrfAmount,
              },
            ],
          };
        },
      },
    );

    // ── Hook 3: EIMS stage — validate B2B buyer TIN before submission ─────
    PipelineInterceptor.register<PipelineContext>(
      PIPELINE_STAGES.INVOICE_EIMS,
      {
        id: 'core.invoice.eims-buyer-tin-guard',
        priority: 1,
        description: 'Blocks EIMS submission if buyer TIN is missing on B2B invoices',
        transform: (ctx: PipelineContext) => {
          const invoice = ctx['invoice'] as Record<string, unknown> | undefined;
          if (!invoice) return ctx;

          const buyerDetails = invoice['buyerDetails'];
          if (!buyerDetails) return ctx;       // B2C invoice — no TIN required

          let tin: string | undefined;
          if (typeof buyerDetails === 'string') {
            try {
              tin = JSON.parse(buyerDetails)?.tin;
            } catch {
              tin = undefined;
            }
          } else if (typeof buyerDetails === 'object') {
            tin = (buyerDetails as Record<string, unknown>)['tin'] as string;
          }

          if (!tin) {
            // Signal the pipeline that submission should stop — the caller
            // reads __stop and returns a validation error to the client.
            return {
              ...ctx,
              __stop: true,
              validationError: 'EIMS B2B submission requires buyer TIN in buyerDetails.tin',
            };
          }

          return ctx;
        },
      },
    );
  }
}
