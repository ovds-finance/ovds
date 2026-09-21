import { IconType } from './icons';
export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
export type StatusVariant = 'settled' | 'pending' | 'draft' | 'overdue' | 'sent' | 'pipeline' | 'info';
export interface StatusMetadata {
    label: string;
    icon: IconType;
    variant: StatusVariant;
    dotColor?: string;
}
export interface PipelineStageMeta {
    key: string;
    label: string;
    color: string;
    headerBg: string;
    cardBg: string;
    border: string;
    dot: string;
    prob: number;
}
export declare const CRM_STAGES: Record<DealStage, PipelineStageMeta>;
/**
 * Global Status Configuration Mapping
 * Used by StatusBadge and other components for consistent metadata.
 */
export declare const STATUS_CONFIG: Record<string, StatusMetadata>;
/**
 * Mapping of status keys to CSS classes for PipelineBadge.
 */
export declare const STATUS_BADGE_VARIANTS: Record<string, string>;
/**
 * Helper to get status metadata with fallback.
 * Can be used on both frontend and backend.
 */
export declare function getStatusMetadata(status: string): StatusMetadata;
/**
 * Returns the CSS classes for a status badge.
 * Pure function — no framework dependencies.
 */
export declare function statusColor(status: string | undefined | null): string;
/**
 * Returns the translated label for a given status string.
 * Falls back to the raw status value if no translation key is found.
 *
 * The `t` parameter accepts any i18next-compatible translate function.
 * Pure function — no React or browser dependencies.
 */
export declare function statusLabel(status: string | undefined | null, t: (key: string) => string): string;
//# sourceMappingURL=pipeline.d.ts.map