/**
 * PipelineInterceptor — Ovds SaaS Runtime Hook System
 * ─────────────────────────────────────────────────────
 * Runtime lifecycle hook system that lets modules tap into document
 * formatting and field rendering right before execution — without
 * modifying core engine code.
 *
 * Ovds SaaS architecture principle:
 *   "Custom invoice layout designs are injected using global runtime
 *    lifecycle events. Third-party modules tap into the formatting engine
 *    right before execution to overwrite template paths or append fields
 *    safely."
 *
 * Design:
 *   - An interceptor is a named hook with a priority and a transform function.
 *   - The pipeline runs interceptors in priority order, passing context through.
 *   - Any interceptor can mutate the context object (immutably via spread) or
 *     terminate early by returning { ...ctx, __stop: true }.
 *   - Framework-agnostic: no NestJS / React imports.
 *
 * Usage (module registration):
 *   PipelineInterceptor.register('invoice.render', {
 *     id: 'my-module.custom-template',
 *     priority: 10,
 *     transform: async (ctx) => ({
 *       ...ctx,
 *       templatePath: '/templates/my-custom-invoice.hbs',
 *     }),
 *   });
 *
 * Usage (core engine, before render):
 *   const ctx = await PipelineInterceptor.run('invoice.render', {
 *     templatePath: '/templates/default.hbs',
 *     invoice,
 *     extraFields: [],
 *   });
 *   // ctx now carries whatever any registered module injected.
 */
/** Base context flowing through any pipeline stage. */
export interface PipelineContext {
    [key: string]: unknown;
    /**
     * When an interceptor sets __stop = true the pipeline halts immediately
     * after that interceptor — no further transforms run.
     */
    __stop?: boolean;
}
/** A single interceptor registered for a named pipeline stage. */
export interface PipelineHook<TCtx extends PipelineContext = PipelineContext> {
    /** Unique identifier — prevents duplicate registration. */
    id: string;
    /**
     * Execution order: lower number runs first (highest priority).
     * Core hooks typically claim 0–9; module hooks should use 10+.
     */
    priority: number;
    /**
     * The transform function. Must return the (potentially mutated) context.
     * Async transforms are supported.
     */
    transform: (ctx: TCtx) => TCtx | Promise<TCtx>;
    /**
     * Human-readable description — shown in debug output.
     */
    description?: string;
}
/** Diagnostic record produced by each run. */
export interface PipelineRunRecord {
    stage: string;
    hooksRan: string[];
    stoppedBy?: string;
    durationMs: number;
}
export declare const PIPELINE_STAGES: {
    /** Just before an invoice document is rendered to HTML/PDF. */
    readonly INVOICE_RENDER: "invoice.render";
    /** Just before invoice data is sent to the EIMS API. */
    readonly INVOICE_EIMS: "invoice.eims";
    /** Just before a bill document is rendered. */
    readonly BILL_RENDER: "bill.render";
    /** Just before a payslip document is rendered. */
    readonly PAYSLIP_RENDER: "payslip.render";
    /** Just before an email notification is dispatched. */
    readonly NOTIFICATION_SEND: "notification.send";
    /** Just before a report dataset is built. */
    readonly REPORT_BUILD: "report.build";
    /** Just before a tax declaration payload is serialised. */
    readonly TAX_DECLARE: "tax.declare";
};
export type PipelineStage = typeof PIPELINE_STAGES[keyof typeof PIPELINE_STAGES];
export interface InvoiceRenderContext extends PipelineContext {
    /** Path to the Handlebars/HTML template file */
    templatePath: string;
    /** The invoice data object */
    invoice: Record<string, unknown>;
    /** Extra fields appended by modules (e.g. custom watermark text) */
    extraFields: Array<{
        key: string;
        label: string;
        value: unknown;
    }>;
    /** Override the output filename */
    outputFilename?: string;
    /** Locale for number/date formatting */
    locale?: string;
}
export interface NotificationSendContext extends PipelineContext {
    to: string[];
    subject: string;
    body: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
    }>;
    channel: 'email' | 'sms' | 'whatsapp' | 'push';
    /** Allow a module to swap the template entirely */
    templateId?: string;
}
export interface ReportBuildContext extends PipelineContext {
    reportType: string;
    companyId: string;
    from: string;
    to: string;
    /** Modules append extra data sections here */
    sections: Array<{
        id: string;
        label: string;
        data: unknown;
    }>;
}
export declare class PipelineInterceptor {
    private static registry;
    private static history;
    private static maxHistory;
    /**
     * Register a hook for a named pipeline stage.
     * Silently replaces an existing hook with the same id.
     */
    static register<TCtx extends PipelineContext = PipelineContext>(stage: string, hook: PipelineHook<TCtx>): void;
    /**
     * Remove a previously registered hook by id.
     * Safe to call even if the hook was never registered.
     */
    static unregister(stage: string, hookId: string): void;
    /** Remove every hook registered for a given stage. */
    static clearStage(stage: string): void;
    /** Remove all hooks across every stage. Mainly used in tests. */
    static clearAll(): void;
    /**
     * Run the pipeline for a given stage, threading the context through every
     * registered hook in priority order.
     *
     * @param stage     Named pipeline stage (use PIPELINE_STAGES constants)
     * @param initial   The initial context object
     * @returns         The final (potentially transformed) context
     */
    static run<TCtx extends PipelineContext = PipelineContext>(stage: string, initial: TCtx): Promise<TCtx>;
    /** List all hooks registered for a stage (in execution order). */
    static getHooks(stage: string): ReadonlyArray<PipelineHook>;
    /** List all registered stage names. */
    static getStages(): string[];
    /** Recent run records — useful for diagnostics and audit logs. */
    static getHistory(): ReadonlyArray<PipelineRunRecord>;
    private static recordHistory;
}
//# sourceMappingURL=pipeline-interceptor.d.ts.map