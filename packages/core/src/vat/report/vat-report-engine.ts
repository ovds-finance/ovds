/**
 * @file vat-report-engine.ts
 * @package @ovds/core/vat/report
 *
 * VatReportEngine — pluggable report-template system for VAT declarations.
 *
 * Architecture
 * ────────────
 * Each VatModule registers its own VatReportTemplate descriptors.
 * The VatReportEngine:
 *   1. Collects templates from all active modules via VatModuleRegistry.
 *   2. Routes a render request to the registered IVatReportRenderer for
 *      the requested template + format.
 *   3. Produces a VatRenderResult that the NestJS controller streams back
 *      to the client (PDF / XLSX / XML / CSV / JSON).
 *
 * Renderers are registered by format adapters (separate packages) so the
 * core stays free of PDF / Excel library dependencies.
 *
 * This file defines:
 *   • IVatReportRenderer  — interface a format adapter must implement
 *   • VatRenderContext    — data bag passed to every renderer
 *   • VatRenderResult     — streamed output descriptor
 *   • VatReportEngine     — registry + dispatcher
 */

import type { VatReportTemplate, ReportFormat, VatReturnDraft } from '../vat-types';

// ─── Renderer contract ────────────────────────────────────────────────────────

export interface VatRenderContext {
  /** The draft return assembled by the rule engine */
  returnDraft: VatReturnDraft;
  /** Additional company / filing metadata */
  meta: {
    companyName:   string;
    tin:           string;
    periodLabel:   string;
    preparedBy:    string;
    preparedAt:    string;
    authorityName: string;
    currency:      string;
    [key: string]: unknown;
  };
  /** Locale-specific formatting hints */
  locale: {
    languageTag:      string;
    dateFormat:       string;
    decimalSeparator: string;
    thousandSeparator: string;
  };
}

export interface VatRenderResult {
  templateId:   string;
  format:       ReportFormat;
  /** MIME type for the HTTP response */
  mimeType:     string;
  /** Suggested filename for Content-Disposition */
  filename:     string;
  /** Raw buffer (binary formats) or undefined when using stream */
  buffer?:      Buffer;
  /** Stringified content (text formats: XML, JSON, CSV) */
  content?:     string;
  renderedAt:   string;
}

/**
 * A format adapter that knows how to render a specific ReportFormat.
 *
 * Example adapters (implemented in separate packages):
 *   PdfVatRenderer   — uses Puppeteer or pdfmake
 *   XlsxVatRenderer  — uses ExcelJS
 *   XmlVatRenderer   — uses xmlbuilder2
 *   CsvVatRenderer   — uses csv-stringify
 */
export interface IVatReportRenderer {
  readonly format: ReportFormat;
  render(
    template: VatReportTemplate,
    context: VatRenderContext,
  ): Promise<VatRenderResult>;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class VatReportEngine {
  /** format → renderer map */
  private readonly renderers = new Map<ReportFormat, IVatReportRenderer>();

  /** templateId → template descriptor map (populated from active modules) */
  private readonly templates = new Map<string, VatReportTemplate>();

  // ── Renderer registration ────────────────────────────────────────────────

  /**
   * Register a format renderer.  Called once at bootstrap by each adapter package.
   * Registering the same format twice overwrites the previous renderer
   * (allows adapter upgrades without restart in dev mode).
   */
  registerRenderer(renderer: IVatReportRenderer): this {
    this.renderers.set(renderer.format, renderer);
    return this;
  }

  hasRenderer(format: ReportFormat): boolean {
    return this.renderers.has(format);
  }

  availableFormats(): ReportFormat[] {
    return [...this.renderers.keys()];
  }

  // ── Template registration ────────────────────────────────────────────────

  /**
   * Register templates from a VatModule's reportTemplates() list.
   * Called by the VatDeclarationOrchestrator after each module boots.
   */
  registerTemplates(templates: VatReportTemplate[]): this {
    for (const tpl of templates) {
      this.templates.set(tpl.id, tpl);
    }
    return this;
  }

  allTemplates(): VatReportTemplate[] {
    return [...this.templates.values()];
  }

  templatesForCountry(countryCode: string): VatReportTemplate[] {
    const code = countryCode.toUpperCase();
    return [...this.templates.values()].filter(
      (t) => t.countryCode.toUpperCase() === code,
    );
  }

  getTemplate(templateId: string): VatReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  /**
   * Render a VAT report.
   *
   * @throws Error if template is not found
   * @throws Error if no renderer is registered for the requested format
   * @throws Error if the template does not support the requested format
   */
  async render(
    templateId: string,
    format: ReportFormat,
    context: VatRenderContext,
  ): Promise<VatRenderResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(
        `VatReportEngine: template "${templateId}" not found. ` +
        `Available: ${[...this.templates.keys()].join(', ')}`,
      );
    }

    if (!template.formats.includes(format)) {
      throw new Error(
        `VatReportEngine: template "${templateId}" does not support format "${format}". ` +
        `Supported: ${template.formats.join(', ')}`,
      );
    }

    const renderer = this.renderers.get(format);
    if (!renderer) {
      throw new Error(
        `VatReportEngine: no renderer registered for format "${format}". ` +
        `Available renderers: ${[...this.renderers.keys()].join(', ')}`,
      );
    }

    return renderer.render(template, context);
  }

  /**
   * Render all available formats for a template (batch render).
   * Useful for generating PDF + XLSX simultaneously in a background job.
   */
  async renderAll(
    templateId: string,
    context: VatRenderContext,
  ): Promise<VatRenderResult[]> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`VatReportEngine: template "${templateId}" not found.`);

    const results: VatRenderResult[] = [];
    for (const fmt of template.formats) {
      if (this.renderers.has(fmt)) {
        results.push(await this.render(templateId, fmt, context));
      }
    }
    return results;
  }

  // ── Built-in fallback renderers ──────────────────────────────────────────
  // These produce safe, human-readable output when no external adapter is
  // registered — useful in development and for the JSON/CSV formats.

  /**
   * Register the built-in JSON renderer (always available, no dependencies).
   * Produces a structured JSON document of the VAT return draft.
   */
  registerBuiltinJsonRenderer(): this {
    this.registerRenderer({
      format: 'JSON',
      async render(template, context): Promise<VatRenderResult> {
        const payload = {
          template:    { id: template.id, label: template.label, version: template.formVersion },
          returnDraft: context.returnDraft,
          meta:        context.meta,
          generatedAt: new Date().toISOString(),
        };
        return {
          templateId: template.id,
          format:     'JSON',
          mimeType:   'application/json',
          filename:   `vat-return-${context.returnDraft.periodKey}-${context.returnDraft.countryCode}.json`,
          content:    JSON.stringify(payload, null, 2),
          renderedAt: new Date().toISOString(),
        };
      },
    });
    return this;
  }

  /**
   * Register the built-in CSV renderer (always available, no dependencies).
   * Produces a flat CSV of the return lines.
   */
  registerBuiltinCsvRenderer(): this {
    this.registerRenderer({
      format: 'CSV',
      async render(template, context): Promise<VatRenderResult> {
        const { returnDraft, meta } = context;
        const rows = [
          ['Box Code', 'Description', 'Amount', 'Tax Amount'],
          ...returnDraft.lines.map((l) => [
            l.boxCode,
            l.label,
            String(l.amount ?? 0),
            String(l.taxAmount ?? ''),
          ]),
        ];
        const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
        return {
          templateId: template.id,
          format:     'CSV',
          mimeType:   'text/csv',
          filename:   `vat-return-${returnDraft.periodKey}-${returnDraft.countryCode}.csv`,
          content:    `# ${template.label} — ${meta.companyName} — ${meta.periodLabel}\n${csv}`,
          renderedAt: new Date().toISOString(),
        };
      },
    });
    return this;
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _instance: VatReportEngine | null = null;

export function getVatReportEngine(): VatReportEngine {
  if (!_instance) {
    _instance = new VatReportEngine();
    _instance.registerBuiltinJsonRenderer();
    _instance.registerBuiltinCsvRenderer();
  }
  return _instance;
}

export function resetVatReportEngine(): void {
  _instance = null;
}
