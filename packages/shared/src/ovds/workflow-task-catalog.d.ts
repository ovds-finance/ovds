/**
 * OVDS Workflow Task Catalog — single source of truth
 *
 * End-to-end accounting lifecycle (Ovds-inspired item GL inheritance):
 *   Core Operations → People → ovds → Compliance → Reporting → Admin → Developer
 *
 * Ethiopian IFRS context: Proc. 979/2016, 1341/2024, 1395/2025, AABE Directive 2/2012
 */
import type { BusinessProfile, BusinessSize } from './business-workflow.types';
import type { WorkflowModuleKey } from './workflow-engine.types';
export type WorkflowLifecycleModule = 'CORE_OPERATIONS' | 'PEOPLE' | 'ovds' | 'COMPLIANCE' | 'REPORTING' | 'ADMIN' | 'DEVELOPER';
export type WorkflowTaskPriority = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
export type WorkflowExecutionMode = 'VALIDATE' | 'EXECUTE' | 'HYBRID';
/** Per-task runtime settings — what the engine configures or validates */
export interface WorkflowTaskSettings {
    books: ('IFRS' | 'TAX' | 'BOTH')[];
    frameworks: string[];
    taxTypes?: string[];
    executionMode: WorkflowExecutionMode;
    actionRoute?: string;
    /** Maps to period-close-workflow.service.ts step id */
    periodCloseStepId?: string;
    /** Maps to PERIOD_END_TASKS checklist id (p01–p15) */
    checklistId?: string;
    /** GL posting trigger from GL_POSTING_TEMPLATES */
    glTrigger?: string;
    /** Dual-calendar: Gregorian period and optional EFY label */
    calendarSystems?: ('GREGORIAN' | 'ETHIOPIAN')[];
}
/** Declarative execution conditions — evaluated at runtime by evaluateWorkflowTaskConditions */
export interface WorkflowTaskConditionSpec {
    sizes?: BusinessSize[];
    requiresModules?: WorkflowModuleKey[];
    requiresTaxTypes?: string[];
    minEmployees?: number;
    /** Month numbers (1–12) when task is in scope */
    months?: number[];
    requiresEnv?: string[];
    whenDescription?: string;
}
export interface WorkflowTaskDefinition {
    id: string;
    module: WorkflowLifecycleModule;
    label: string;
    description: string;
    priority: WorkflowTaskPriority;
    dependsOn: string[];
    settings: WorkflowTaskSettings;
    conditions: WorkflowTaskConditionSpec;
}
export interface WorkflowPeriodContext {
    month: number;
    year: number;
    hasEtaxConfig?: boolean;
}
export declare const PERIOD_CLOSE_STEP_MAP: Record<string, string>;
export declare const WORKFLOW_TASK_CATALOG: WorkflowTaskDefinition[];
export declare function getWorkflowTaskDefinition(taskId: string): WorkflowTaskDefinition | undefined;
export declare function evaluateWorkflowTaskConditions(def: WorkflowTaskDefinition, profile: Pick<BusinessProfile, 'size' | 'enabledModules' | 'taxObligations' | 'employeeCount' | 'isVatRegistered' | 'ifrsStandard'>, period: WorkflowPeriodContext, envKeys?: Record<string, boolean>): {
    applicable: boolean;
    reason?: string;
};
/** Topological execution order derived from catalog dependencies */
export declare function getWorkflowTaskExecutionOrder(): string[];
//# sourceMappingURL=workflow-task-catalog.d.ts.map