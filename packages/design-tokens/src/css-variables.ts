/**
 * @ovds/design-tokens/css-variables — CSS custom property name mapping
 *
 * Maps each token path to its corresponding CSS variable name.
 * Used to generate CSS declarations from token values and to look up
 * the variable name for a given token in TypeScript.
 *
 * Usage:
 *   import { TOKEN_CSS_VAR } from '@ovds/design-tokens/css-variables';
 *   const cssVar = TOKEN_CSS_VAR['brand.primary']; // '--brand-primary'
 */

export type CssVarName =
  | '--canvas'
  | '--surface-light'
  | '--surface-active'
  | '--surface-elevated'
  | '--surface-overlay'
  | '--surface-subtle'
  | '--text-primary'
  | '--text-secondary'
  | '--text-muted'
  | '--text-subtle'
  | '--text-inverse'
  | '--border-default'
  | '--border-subtle'
  | '--border-strong'
  | '--brand-primary'
  | '--brand-primary-dark'
  | '--brand-primary-light'
  | '--brand-primary-50'
  | '--brand-primary-100'
  | '--success-badge'
  | '--success-text'
  | '--success-border'
  | '--success-solid'
  | '--alert-bg'
  | '--alert-text'
  | '--alert-border'
  | '--alert-dot'
  | '--critical-bg'
  | '--critical-text'
  | '--critical-border'
  | '--critical-dot'
  | '--info-bg'
  | '--info-text'
  | '--info-border'
  | '--info-dot'
  | `--status-${string}`
  | '--font-sans'
  | '--font-mono'
  | '--sidebar-w'
  | '--header-h'
  | '--page-pad'
  | '--page-max'
  | '--card-pad'
  | '--card-radius'
  | '--card-radius-sm'
  | '--card-radius-lg';

export const TOKEN_CSS_VAR: Record<string, string> = {
  'canvas':                '--canvas',

  'surface.light':         '--surface-light',
  'surface.active':        '--surface-active',
  'surface.elevated':      '--surface-elevated',
  'surface.overlay':       '--surface-overlay',
  'surface.subtle':        '--surface-subtle',

  'text.primary':          '--text-primary',
  'text.secondary':        '--text-secondary',
  'text.muted':            '--text-muted',
  'text.subtle':           '--text-subtle',
  'text.inverse':          '--text-inverse',

  'border.default':        '--border-default',
  'border.subtle':         '--border-subtle',
  'border.strong':         '--border-strong',

  'brand.primary':         '--brand-primary',
  'brand.primaryDark':     '--brand-primary-dark',
  'brand.primaryLight':    '--brand-primary-light',
  'brand.primary50':       '--brand-primary-50',
  'brand.primary100':      '--brand-primary-100',

  'success.badge':         '--success-badge',
  'success.text':          '--success-text',
  'success.border':        '--success-border',
  'success.solid':         '--success-solid',

  'alert.bg':              '--alert-bg',
  'alert.text':            '--alert-text',
  'alert.border':          '--alert-border',
  'alert.dot':             '--alert-dot',

  'critical.bg':           '--critical-bg',
  'critical.text':         '--critical-text',
  'critical.border':       '--critical-border',
  'critical.dot':          '--critical-dot',

  'info.bg':               '--info-bg',
  'info.text':             '--info-text',
  'info.border':           '--info-border',
  'info.dot':              '--info-dot',

  'typography.fontFamily.sans':   '--font-sans',
  'typography.fontFamily.mono':   '--font-mono',

  'layout.sidebarWidth':    '--sidebar-w',
  'layout.headerHeight':    '--header-h',
  'layout.pagePadding':     '--page-pad',
  'layout.pageMaxWidth':    '--page-max',
  'layout.cardPadding':     '--card-pad',
  'layout.cardRadius':      '--card-radius',
  'layout.cardRadiusSm':    '--card-radius-sm',
  'layout.cardRadiusLg':    '--card-radius-lg',
};

export const STATUS_TOKEN_PREFIX = 'status.';

export function statusTokenPath(key: string): string {
  return `status.${key}`;
}

export function statusCssVar(key: string): string {
  return `--status-${key}`;
}

export function chartColorCssVar(index: number): string {
  return `--chart-color-${index + 1}`;
}
