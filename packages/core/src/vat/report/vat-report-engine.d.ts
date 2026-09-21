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
export interface VatRenderContext {
    /** The draft return assembled by the rule engine */
    returnDraft: VatReturnDraft;
    /** Additional company / filing metadata */
    meta: {
        companyName: string;
        tin: string;
        periodLabel: string;
        preparedBy: string;
        preparedAt: string;
        authorityName: string;
        currency: string;
        [key: string]: unknown;
    };
    /** Locale-specific formatting hints */
    locale: {
        languageTag: string;
        dateFormat: string;
        decimalSeparator: string;
        thousandSeparator: string;
    };
}
export interface VatRenderResult {
    templateId: string;
    format: ReportFormat;
    /** MIME type for the HTTP response */
    mimeType: string;
    /** Suggested filename for Content-Disposition */
    filename: string;
    /** Raw buffer (binary formats) or undefined when using stream */
    buffer?: Buffer;
    /** Stringified content (text formats: XML, JSON, CSV) */
    content?: string;
    renderedAt: string;
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
    render(template: VatReportTemplate, context: VatRenderContext): Promise<VatRenderResult>;
}
export declare class VatReportEngine {
    /** format → renderer map */
    private readonly renderers;
    /** templateId → template descriptor map (populated from active modules) */
    private readonly templates;
    /**
     * Register a format renderer.  Called once at bootstrap by each adapter package.
     * Registering the same format twice overwrites the previous renderer
     * (allows adapter upgrades without restart in dev mode).
     */
    registerRenderer(renderer: IVatReportRenderer): this;
    hasRenderer(format: ReportFormat): boolean;
    availableFormats(): ReportFormat[];
    /**
     * Register templates from a VatModule's reportTemplates() list.
     * Called by the VatDeclarationOrchestrator after each module boots.
     */
    registerTemplates(templates: VatReportTemplate[]): this;
    allTemplates(): VatReportTemplate[];
    templatesForCountry(countryCode: string): VatReportTemplate[];
    getTemplate(templateId: string): VatReportTemplate | undefined;
    /**
     * Render a VAT report.
     *
     * @throws Error if template is not found
     * @throws Error if no renderer is registered for the requested format
     * @throws Error if the template does not support the requested format
     */
    render(templateId: string, format: ReportFormat, context: VatRenderContext): Promise<VatRenderResult>;
    /**
     * Render all available formats for a template (batch render).
     * Useful for generating PDF + XLSX simultaneously in a background job.
     */
    renderAll(templateId: string, context: VatRenderContext): Promise<VatRenderResult[]>;
    /**
     * Register the built-in JSON renderer (always available, no dependencies).
     * Produces a structured JSON document of the VAT return draft.
     */
    registerBuiltinJsonRenderer(): this;
    /**
     * Register the built-in CSV renderer (always available, no dependencies).
     * Produces a flat CSV of the return lines.
     */
    registerBuiltinCsvRenderer(): this;
}
export declare function getVatReportEngine(): VatReportEngine;
export declare function resetVatReportEngine(): void;
//# sourceMappingURL=vat-report-engine.d.ts.map