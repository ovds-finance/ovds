import { IconType } from './icons';

// Inlined hex values from @ovds/design-system tokens — packages/shared must NOT import design-system
const COLORS = {
  draft:       '#64748b',
  muted:       '#f8fafc',
  mutedDark:   '#1e293b',
  info:        '#0284c7',
  secondary:   '#7c3aed',
  warning:     '#d97706',
  success:     '#00C96E',
  danger:      '#dc2626',
} as const;

export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";

export type StatusVariant = 'settled' | 'pending' | 'draft' | 'overdue' | 'sent' | 'pipeline' | 'info';

export interface StatusMetadata {
  label: string;
  icon: IconType;
  variant: StatusVariant;
  dotColor?: string; // Tailwind bg color class for the status dot
}

export interface PipelineStageMeta {
  key: string;
  label: string;
  color: string; // Hex color from tokens
  headerBg: string;
  cardBg: string;
  border: string;
  dot: string;
  prob: number;
}

export const CRM_STAGES: Record<DealStage, PipelineStageMeta> = {
  LEAD: {
    key: "LEAD",
    label: "Lead",
    color: COLORS.draft,
    headerBg: COLORS.muted,
    cardBg: COLORS.muted + '99', // adding transparency
    border: COLORS.mutedDark + '20',
    dot: COLORS.draft,
    prob: 10
  },
  QUALIFIED: {
    key: "QUALIFIED",
    label: "Qualified",
    color: COLORS.info,
    headerBg: COLORS.info + '1a',
    cardBg: COLORS.info + '0d',
    border: COLORS.info + '33',
    dot: COLORS.info,
    prob: 25
  },
  PROPOSAL: {
    key: "PROPOSAL",
    label: "Proposal",
    color: COLORS.secondary,
    headerBg: COLORS.secondary + '1a',
    cardBg: COLORS.secondary + '0d',
    border: COLORS.secondary + '33',
    dot: COLORS.secondary,
    prob: 50
  },
  NEGOTIATION: {
    key: "NEGOTIATION",
    label: "Negotiation",
    color: COLORS.warning,
    headerBg: COLORS.warning + '1a',
    cardBg: COLORS.warning + '0d',
    border: COLORS.warning + '33',
    dot: COLORS.warning,
    prob: 75
  },
  CLOSED_WON: {
    key: "CLOSED_WON",
    label: "Closed Won",
    color: COLORS.success,
    headerBg: COLORS.success + '1a',
    cardBg: COLORS.success + '0d',
    border: COLORS.success + '33',
    dot: COLORS.success,
    prob: 100
  },
  CLOSED_LOST: {
    key: "CLOSED_LOST",
    label: "Closed Lost",
    color: COLORS.danger,
    headerBg: COLORS.danger + '1a',
    cardBg: COLORS.danger + '0d',
    border: COLORS.danger + '33',
    dot: COLORS.danger,
    prob: 0
  },
};

/**
 * Global Status Configuration Mapping
 * Used by StatusBadge and other components for consistent metadata.
 */
export const STATUS_CONFIG: Record<string, StatusMetadata> = {
  // --- Settled / Success ---
  PAID:         { label: 'Paid',         icon: 'MONEY',    variant: 'settled', dotColor: 'bg-ovds-primary' },
  SETTLED:      { label: 'Settled',      icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  CLOSED_WON:   { label: 'Closed Won',   icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  RECONCILED:   { label: 'Reconciled',   icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  APPROVED:     { label: 'Approved',     icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  ACTIVE:       { label: 'Active',       icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  COMPLETED:    { label: 'Completed',    icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  VERIFIED:     { label: 'Verified',     icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  REMITTED:     { label: 'Remitted',     icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  DISBURSED:    { label: 'Disbursed',    icon: 'MONEY',    variant: 'settled', dotColor: 'bg-ovds-primary' },
  RESOLVED:     { label: 'Resolved',     icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  ACKNOWLEDGED: { label: 'Acknowledged', icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  PRESENT:      { label: 'Present',      icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  SUBMITTED:    { label: 'Submitted',    icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  FINALIZED:    { label: 'Finalized',    icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  COMMITTED:    { label: 'Committed',    icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  ACCEPTED:     { label: 'Accepted',     icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },
  FILED:        { label: 'Filed',        icon: 'SUCCESS',  variant: 'settled', dotColor: 'bg-ovds-primary' },

  // --- Pending / Progress ---
  PENDING:      { label: 'Pending',      icon: 'CLOCK',    variant: 'pending', dotColor: 'bg-ovds-warning' },
  IN_PROGRESS:  { label: 'In Progress',  icon: 'CLOCK',    variant: 'pending', dotColor: 'bg-ovds-warning' },
  PROCESSING:   { label: 'Processing',   icon: 'REFRESH',  variant: 'pending', dotColor: 'bg-ovds-warning' },
  UNDER_REVIEW: { label: 'Under Review', icon: 'CLOCK',    variant: 'pending', dotColor: 'bg-ovds-warning' },
  CONSULTATION: { label: 'Consultation', icon: 'CLOCK',    variant: 'pending', dotColor: 'bg-ovds-warning' },
  PLANNING:     { label: 'Planning',     icon: 'CLOCK',    variant: 'pending', dotColor: 'bg-ovds-warning' },
  
  // --- Pipeline Stages ---
  IN_PIPELINE:  { label: 'In Pipeline',  icon: 'TREND_UP', variant: 'pipeline', dotColor: 'bg-ovds-warning' },
  QUALIFIED:    { label: 'Qualified',    icon: 'TREND_UP', variant: 'pipeline', dotColor: 'bg-ovds-info' },
  PROPOSAL:     { label: 'Proposal',     icon: 'TREND_UP', variant: 'pipeline', dotColor: 'bg-ovds-pipeline' },
  NEGOTIATION:  { label: 'Negotiation',  icon: 'TREND_UP', variant: 'pipeline', dotColor: 'bg-ovds-warning' },

  // --- Draft / Muted ---
  DRAFT:        { label: 'Draft',        icon: 'INVOICE',  variant: 'draft', dotColor: 'bg-ovds-text-subtle' },
  GENERATED:    { label: 'Generated',    icon: 'REFRESH',  variant: 'draft', dotColor: 'bg-ovds-text-subtle' },
  LEAD:         { label: 'Lead',         icon: 'LEAD',     variant: 'draft', dotColor: 'bg-ovds-text-subtle' },
  INACTIVE:     { label: 'Inactive',     icon: 'CLOCK',    variant: 'draft', dotColor: 'bg-ovds-text-subtle' },
  ARCHIVED:     { label: 'Archived',     icon: 'CLOCK',    variant: 'draft', dotColor: 'bg-ovds-text-subtle' },
  DEFERRED:     { label: 'Deferred',     icon: 'CLOCK',    variant: 'draft', dotColor: 'bg-ovds-text-subtle' },
  OPEN:         { label: 'Open',         icon: 'INVOICE',  variant: 'draft', dotColor: 'bg-ovds-text-subtle' },

  // --- Overdue / Danger ---
  OVERDUE:      { label: 'Overdue',      icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  REJECTED:     { label: 'Rejected',     icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  CANCELLED:    { label: 'Cancelled',    icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  FAILED:       { label: 'Failed',       icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  CLOSED_LOST:  { label: 'Closed Lost',  icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  DECLINED:     { label: 'Declined',     icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  ABSENT:       { label: 'Absent',       icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },
  SICK:         { label: 'Sick',         icon: 'DANGER',   variant: 'overdue', dotColor: 'bg-ovds-danger' },

  // --- Sent / Info ---
  SENT:         { label: 'Sent',         icon: 'INFO',     variant: 'sent', dotColor: 'bg-ovds-primary' },
  CONVERTED:    { label: 'Converted',    icon: 'INFO',     variant: 'sent', dotColor: 'bg-ovds-primary' },
  INFO:         { label: 'Info',         icon: 'INFO',     variant: 'sent', dotColor: 'bg-ovds-info' },
};

/**
 * Mapping of status keys to CSS classes for PipelineBadge.
 */
export const STATUS_BADGE_VARIANTS: Record<string, string> = Object.entries(STATUS_CONFIG).reduce(
  (acc, [key, meta]) => {
    acc[key] = `pipeline-badge pipeline-badge-${meta.variant}`;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Helper to get status metadata with fallback.
 * Can be used on both frontend and backend.
 */
export function getStatusMetadata(status: string): StatusMetadata {
  const key = (status ?? '').toUpperCase();
  return STATUS_CONFIG[key] ?? {
    label: status ?? '—',
    icon: 'CLOCK',
    variant: 'draft',
  };
}

/**
 * Returns the CSS classes for a status badge.
 * Pure function — no framework dependencies.
 */
export function statusColor(status: string | undefined | null): string {
  const s = (status ?? '').toUpperCase();
  return STATUS_BADGE_VARIANTS[s] || 'pipeline-badge pipeline-badge-draft';
}

/**
 * Returns the translated label for a given status string.
 * Falls back to the raw status value if no translation key is found.
 *
 * The `t` parameter accepts any i18next-compatible translate function.
 * Pure function — no React or browser dependencies.
 */
export function statusLabel(
  status: string | undefined | null,
  t: (key: string) => string,
): string {
  if (!status) return '—';
  const key = `status.${status.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? status : translated;
}
