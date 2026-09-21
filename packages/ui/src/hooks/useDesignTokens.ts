/**
 * @ovds/ui/hooks/useDesignTokens — reactive access to design token values
 *
 * Provides a React hook that reads design token values from CSS custom properties
 * and returns them as reactive state. This ensures components always use the
 * current token values, even if they change at runtime (e.g., theme switching).
 *
 * Usage:
 *   import { useDesignTokens } from '@ovds/ui';
 *
 *   function MyComponent() {
 *     const tokens = useDesignTokens();
 *     return (
 *       <div style={{ backgroundColor: tokens.surface.light, color: tokens.text.primary }}>
 *         Hello World
 *       </div>
 *     );
 *   }
 *
 *   // Or get individual tokens
 *   const { getToken } = useDesignTokens();
 *   const primaryColor = getToken('brand.primary');
 */

import { useState, useEffect, useCallback } from 'react';

export interface DesignTokens {
  canvas: string;
  surface: {
    light: string;
    active: string;
    elevated: string;
    overlay: string;
    subtle: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    subtle: string;
    inverse: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
  };
  brand: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primary50: string;
    primary100: string;
  };
  status: Record<string, {
    bg: string;
    text: string;
    border: string;
    dot: string;
  }>;
}

const TOKEN_KEYS: (keyof DesignTokens)[] = [
  'canvas',
  'surface',
  'text',
  'border',
  'brand',
  'status',
];

const SURFACE_KEYS: (keyof DesignTokens['surface'])[] = [
  'light',
  'active',
  'elevated',
  'overlay',
  'subtle',
];

const TEXT_KEYS: (keyof DesignTokens['text'])[] = [
  'primary',
  'secondary',
  'muted',
  'subtle',
  'inverse',
];

const BORDER_KEYS: (keyof DesignTokens['border'])[] = [
  'default',
  'subtle',
  'strong',
];

const BRAND_KEYS: (keyof DesignTokens['brand'])[] = [
  'primary',
  'primaryDark',
  'primaryLight',
  'primary50',
  'primary100',
];

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
];

function getCssVar(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function useDesignTokens(): DesignTokens & { getToken: (path: string) => string | undefined } {
  const [tokens, setTokens] = useState<DesignTokens>(() => getTokensFromCss());

  useEffect(() => {
    const handleChange = () => {
      setTokens(getTokensFromCss());
    };

    // Listen for CSS custom property changes
    const observer = new MutationObserver(handleChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Also listen for class changes (theme switching)
    document.addEventListener('classChange', handleChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('classChange', handleChange);
    };
  }, []);

  const getToken = useCallback((path: string): string | undefined => {
    const parts = path.split('.');
    let current: any = tokens;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }, [tokens]);

  return {
    ...tokens,
    getToken,
  };
}

function getTokensFromCss(): DesignTokens {
  const surface: DesignTokens['surface'] = {
    light: getCssVar('--surface-light') || '#F9FAFB',
    active: getCssVar('--surface-active') || '#EFF6FF',
    elevated: getCssVar('--surface-elevated') || '#FFFFFF',
    overlay: getCssVar('--surface-overlay') || '#FFFFFF',
    subtle: getCssVar('--surface-subtle') || '#F8FAFC',
  };

  const text: DesignTokens['text'] = {
    primary: getCssVar('--text-primary') || '#111827',
    secondary: getCssVar('--text-secondary') || '#6B7280',
    muted: getCssVar('--text-muted') || '#94A3B8',
    subtle: getCssVar('--text-subtle') || '#CBD5E1',
    inverse: getCssVar('--text-inverse') || '#FFFFFF',
  };

  const border: DesignTokens['border'] = {
    default: getCssVar('--border-default') || '#E2E8F0',
    subtle: getCssVar('--border-subtle') || '#F1F5F9',
    strong: getCssVar('--border-strong') || '#CBD5E1',
  };

  const brand: DesignTokens['brand'] = {
    primary: getCssVar('--brand-primary') || '#4FBA6F',
    primaryDark: getCssVar('--brand-primary-dark') || '#3B9957',
    primaryLight: getCssVar('--brand-primary-light') || '#2ED47A',
    primary50: getCssVar('--brand-primary-50') || '#F0FDF4',
    primary100: getCssVar('--brand-primary-100') || '#DCFCE7',
  };

  const status: Record<string, { bg: string; text: string; border: string; dot: string }> = {};
  for (const key of STATUS_KEYS) {
    status[key] = {
      bg: getCssVar(`--status-${key}-bg`) || '#F8FAFC',
      text: getCssVar(`--status-${key}-text`) || '#64748B',
      border: getCssVar(`--status-${key}-border`) || '#E2E8F0',
      dot: getCssVar(`--status-${key}-dot`) || '#94A3B8',
    };
  }

  return {
    canvas: getCssVar('--canvas') || '#FFFFFF',
    surface,
    text,
    border,
    brand,
    status,
  };
}
