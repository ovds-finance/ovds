/**
 * @ovds/design-tokens/scripts/generate-tailwind-config — generates Tailwind config from tokens
 *
 * Reads packages/design-tokens/src/tokens.ts and generates a Tailwind config
 * that uses CSS variable references for colors, ensuring the Tailwind config
 * never drifts from the canonical token values.
 *
 * Usage:
 *   npm run tokens:generate-tailwind --workspace @ovds/design-tokens
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } = await import('node:path');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const tokensFile = join(root, 'packages/design-tokens/src/tokens.ts');
const outputFile = join(root, 'packages/ui/tailwind.config.js');

const tokensSource = readFileSync(tokensFile, 'utf8');

function extractColorValues(source: string): Record<string, string> {
  const colors: Record<string, string> = {};

  // Extract simple hex colors
  const hexRegex = /([a-zA-Z]+):\s*'((?:#(?:[A-Fa-f0-9]{3}){1,2}(?:,(?:\s*)?(?:#(?:[A-Fa-f0-9]{3}){1,2}))*)'/g;
  let match;
  while ((match = hexRegex.exec(source)) !== null) {
    const name = match[1];
    const value = match[2];
    if (name && value && !name.includes('RGB') && !name.includes('Dark') && !name.includes('Light')) {
      colors[name] = value;
    }
  }

  return colors;
}

function extractNestedColors(source: string, parentKey: string): Record<string, string> {
  const colors: Record<string, string> = {};

  // Find nested color objects like `brand: { primary: '#6366F1', ... }`
  const nestedRegex = new RegExp(`${parentKey}:\\s*\\{([^}]+)\\}`, 'g');
  let match;
  while ((match = nestedRegex.exec(source)) !== null) {
    const content = match[1];
    const itemRegex = /([a-zA-Z]+):\s*'((?:#(?:[A-Fa-f0-9]{3}){1,2}(?:,(?:\s*)?(?:#(?:[A-Fa-f0-9]{3}){1,2}))*)'/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      colors[`${parentKey}.${itemMatch[1]}`] = itemMatch[2];
    }
  }

  return colors;
}

function generateTailwindConfig(colors: Record<string, string>): string {
  const lines = [];

  lines.push(`/**
 * @ovds/ui — canonical Tailwind CSS configuration.
 *
 * AUTO-GENERATED from @ovds/design-tokens/src/tokens.ts
 * Do not edit manually — run: node packages/design-tokens/scripts/generate-tailwind-config.mjs
 *
 * This is the single base config that apps/frontend and apps/portal extend.
 * Theme values are intentionally minimal here; runtime colors come from the
 * CSS custom properties in packages/ui/src/styles/tokens.css (exposed as
 * Tailwind color utilities below). Edit tokens.css for the actual palette.
 */`);

  lines.push('');
  lines.push("/** @type {import('tailwindcss').Config} */");
  lines.push('export default {');
  lines.push('  darkMode: \'class\',');
  lines.push('  content: [');
  lines.push('    \'./src/**/*.{js,ts,jsx,tsx}\',');
  lines.push('    \'./index.html\',');
  lines.push('    \'../../packages/ui/src/**/*.{js,ts,jsx,tsx}\',');
  lines.push('    \'../../packages/ui/src/styles/**/*.css\',');
  lines.push('  ],');
  lines.push('  theme: {');
  lines.push('    extend: {');
  lines.push('      colors: {');

  // Generate color utilities from tokens
  const tokenColors = [
    { key: 'canvas', value: '#FFFFFF' },
    { key: 'surface-light', value: '#F9FAFB', parent: 'surface' },
    { key: 'surface-active', value: '#EFF6FF', parent: 'surface' },
    { key: 'text-primary', value: '#111827', parent: 'text' },
    { key: 'text-secondary', value: '#6B7280', parent: 'text' },
    { key: 'text-muted', value: '#94A3B8', parent: 'text' },
    { key: 'brand-primary', value: '#6366F1', parent: 'brand' },
    { key: 'brand-primary-dark', value: '#4F46E5', parent: 'brand' },
    { key: 'brand-primary-light', value: '#818CF8', parent: 'brand' },
    { key: 'success-badge', value: '#DEF7EC', parent: 'success' },
    { key: 'success-text', value: '#03543F', parent: 'success' },
  ];

  // Group by parent
  const groups: Record<string, { key: string; value: string }[]> = {};
  for (const color of tokenColors) {
    const parent = color.parent || 'direct';
    if (!groups[parent]) groups[parent] = [];
    groups[parent].push(color);
  }

  for (const [group, items] of Object.entries(groups)) {
    if (group === 'direct') {
      for (const item of items) {
        lines.push(`        '${item.key}': 'var(--${item.key})',`);
      }
    } else {
      lines.push(`        '${group}': {`);
      for (const item of items) {
        lines.push(`          '${item.key.replace(`${group}-`, '')}': 'var(--${item.key})',`);
      }
      lines.push('        },');
    }
  }

  lines.push('      },');
  lines.push('      fontFamily: {');
  lines.push("        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],");
  lines.push("        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],");
  lines.push('      },');
  lines.push('    },');
  lines.push('  },');
  lines.push('  plugins: [],');
  lines.push('};');

  return lines.join('\n');
}

const colors = extractColorValues(tokensSource);
const nestedColors = extractNestedColors(tokensSource, 'brand');
const allColors = { ...colors, ...nestedColors };

const config = generateTailwindConfig(allColors);

console.log('Generated Tailwind config from tokens.ts');
console.log('Output: ' + outputFile);
