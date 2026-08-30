/**
 * apps/frontend — Tailwind CSS configuration
 *
 * Extends the canonical config from packages/ui.
 * DO NOT add theme values here — edit packages/ui/tailwind.config.js instead.
 *
 * Content strategy:
 *   - Explicit paths replace the baseConfig spread to avoid scanning
 *     ./src/**\/* twice (once from this file, once inherited from the ui base).
 *   - Feature and domain packages are included so classes used in their JSX
 *     are never purged from the production bundle.
 */
import baseConfig from '../../packages/ui/tailwind.config.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: [
    // ── This app ────────────────────────────────────────────────────────────
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // ── Shared UI library (tokens, components, styles) ──────────────────────
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/styles/**/*.css',
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx}',
    // ── Feature packages (React UI slices — contain Tailwind classes) ────────
    '../../packages/features/*/src/**/*.{js,ts,jsx,tsx}',
    // ── Domain packages (may contain UI helpers with Tailwind classes) ────────
    '../../packages/domains/*/src/**/*.{js,ts,jsx,tsx}',
  ],
};
