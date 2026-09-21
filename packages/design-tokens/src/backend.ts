/**
 * @ovds/design-tokens/backend — programmatic token access for NestJS
 *
 * Provides utilities for backend consumers (NestJS services, email renderers,
 * PDF generators, report builders) to read design token values without
 * importing CSS or relying on the DOM.
 *
 * Usage:
 *   import { getToken, getStatusColor, BRAND_COLORS } from '@ovds/design-tokens/backend';
 *   const primary = getToken('brand.primary');
 *   const paidColors = getStatusColor('paid');
 */

import {
  brand,
  status,
  chartColors,
  success,
  alert,
  critical,
  info,
  text,
  surface,
  border,
  typography,
  layout,
  shadow,
  motion,
} from './tokens';

export type StatusKey = keyof typeof status;
export type TokenPath = keyof typeof brand | `status.${string}` | `chartColors.${number}`;

export function getToken(path: string): string | undefined {
  if (path in brand) return (brand as Record<string, string>)[path];
  if (path.startsWith('status.')) {
    const key = path.slice(7) as StatusKey;
    return status[key]?.bg;
  }
  if (path.startsWith('chartColors.')) {
    const idx = parseInt(path.slice(13), 10);
    return chartColors[idx];
  }
  return undefined;
}

export function getStatusColor(key: StatusKey) {
  return status[key];
}

export const BRAND_COLORS = brand;
export const STATUS_COLORS = status;
export const CHART_COLORS = chartColors;
export const SUCCESS_COLORS = success;
export const ALERT_COLORS = alert;
export const CRITICAL_COLORS = critical;
export const INFO_COLORS = info;
export const TEXT_COLORS = text;
export const SURFACE_COLORS = surface;
export const BORDER_COLORS = border;
export const TYPOGRAPHY_TOKENS = typography;
export const LAYOUT_TOKENS = layout;
export const SHADOW_TOKENS = shadow;
export const MOTION_TOKENS = motion;

export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function statusColorForBackend(key: StatusKey) {
  const s = status[key];
  return {
    background: s.bg,
    text: s.text,
    border: s.border,
    dot: s.dot,
    backgroundRgba: hexToRgba(s.bg, 0.15),
    borderRgba: hexToRgba(s.border, 0.5),
  };
}
