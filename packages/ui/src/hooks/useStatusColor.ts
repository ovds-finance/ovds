/**
 * @ovds/ui/hooks/useStatusColor — reactive access to status token colors
 *
 * Provides a React hook that reads status color values from CSS custom properties
 * and returns them as reactive state. This ensures components always use the
 * current status colors, even if they change at runtime (e.g., theme switching).
 *
 * Usage:
 *   import { useStatusColor } from '@ovds/ui';
 *
 *   function StatusBadge({ status }: { status: string }) {
 *     const colors = useStatusColor(status);
 *     return (
 *       <span style={{
 *         backgroundColor: colors.bg,
 *         color: colors.text,
 *         borderColor: colors.border,
 *       }}>
 *         {status}
 *       </span>
 *     );
 *   }
 *
 *   // Or get all status colors at once
 *   const allColors = useStatusColor.all();
 *   const paidColors = allColors.paid; // { bg, text, border, dot }
 */

import { useMemo } from 'react';

export interface StatusColors {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_KEYS = [
  'draft',
  'pending',
  'sent',
  'paid',
  'overdue',
  'approved',
  'rejected',
  'cancelled',
  'active',
  'open',
  'closed',
  'success',
  'warning',
  'danger',
  'info',
];

function getCssVar(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function useStatusColor(status: string): StatusColors {
  return useMemo(() => {
    const key = status.toLowerCase();
    return {
      bg: getCssVar(`--status-${key}-bg`) || '#F8FAFC',
      text: getCssVar(`--status-${key}-text`) || '#64748B',
      border: getCssVar(`--status-${key}-border`) || '#E2E8F0',
      dot: getCssVar(`--status-${key}-dot`) || '#94A3B8',
    };
  }, [status]);
}

export function useAllStatusColors(): Record<string, StatusColors> {
  return useMemo(() => {
    const colors: Record<string, StatusColors> = {};
    for (const key of STATUS_KEYS) {
      colors[key] = {
        bg: getCssVar(`--status-${key}-bg`) || '#F8FAFC',
        text: getCssVar(`--status-${key}-text`) || '#64748B',
        border: getCssVar(`--status-${key}-border`) || '#E2E8F0',
        dot: getCssVar(`--status-${key}-dot`) || '#94A3B8',
      };
    }
    return colors;
  }, []);
}
