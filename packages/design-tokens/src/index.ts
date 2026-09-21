/**
 * @ovds/design-tokens — single export point
 *
 * Import token values for use in CSS generation, Tailwind config, React components,
 * and NestJS backend utilities.
 *
 * Usage:
 *   import { canvas, brand, status, typography } from '@ovds/design-tokens';
 *   import { TOKEN_CSS_VAR, statusCssVar } from '@ovds/design-tokens/css-variables';
 *   import { getStatusColor, hexToRgba } from '@ovds/design-tokens/backend';
 */

export * from './tokens';
export * from './css-variables';
export * from './backend';
