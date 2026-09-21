/** EIMS registration status badge classes and labels for invoice UI */
export const EIMS_STATUS_CLS: Record<string, string> = {
  REGISTERED: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function eimsBadgeLabel(inv: { eimsIrn?: string | null; eimsStatus?: string | null }): string | null {
  if (!inv.eimsIrn && (!inv.eimsStatus || inv.eimsStatus === 'NOT_REGISTERED')) return null;
  return inv.eimsStatus ?? (inv.eimsIrn ? 'REGISTERED' : null);
}

export function eimsBadgeClass(status: string): string {
  return EIMS_STATUS_CLS[status] ?? 'bg-teal-50 text-teal-700 border-teal-200';
}

export type EimsFilter =
  | 'ALL'
  | 'REGISTERED'
  | 'PENDING'
  | 'FAILED'
  | 'NOT_REGISTERED'
  | 'NEEDS_REGISTRATION';

export function matchesEimsFilter(
  inv: { eimsIrn?: string | null; eimsStatus?: string | null; status?: string },
  filter: EimsFilter,
): boolean {
  if (filter === 'ALL') return true;
  const status = inv.eimsStatus ?? (inv.eimsIrn ? 'REGISTERED' : 'NOT_REGISTERED');
  if (filter === 'NOT_REGISTERED') {
    return !inv.eimsIrn && (!inv.eimsStatus || inv.eimsStatus === 'NOT_REGISTERED');
  }
  if (filter === 'NEEDS_REGISTRATION') {
    return (
      !inv.eimsIrn &&
      inv.status !== 'DRAFT' &&
      inv.status !== 'CANCELLED' &&
      inv.status !== 'ARCHIVED'
    );
  }
  return status === filter;
}
