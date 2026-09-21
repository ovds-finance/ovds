/**
 * @ovds/design-tokens/scripts/sync-css-variables — keeps tokens.ts and tokens.css in sync
 *
 * Run this script after editing token values in src/tokens.ts to regenerate
 * the CSS custom properties section in packages/ui/src/styles/tokens.css.
 *
 * Usage:
 *   npm run tokens:sync --workspace @ovds/design-tokens
 *
 * Or directly:
 *   node packages/design-tokens/scripts/sync-css-variables.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../../..');
const tokensFile = join(root, 'packages/design-tokens/src/tokens.ts');
const cssFile = join(root, 'packages/ui/src/styles/tokens.css');

const tokensSource = readFileSync(tokensFile, 'utf8');

function extractValue(source, regex) {
  const match = regex.exec(source);
  return match ? match[1].trim() : null;
}

function generateCssVariablesSection() {
  const lines = [];
  lines.push('/* ══════════════════════════════════════════════════════════════════════════════');
  lines.push('   AUTO-GENERATED FROM @ovds/design-tokens/src/tokens.ts');
  lines.push('   Run: node packages/design-tokens/scripts/sync-css-variables.mjs');
  lines.push('   ══════════════════════════════════════════════════════════════════════════════ */');
  lines.push(':root {');

  // Brand colors
  lines.push('  /* Brand */');
  const brandPrimary = extractValue(tokensSource, /brand:\s*\{[^}]*primary:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const brandPrimaryDark = extractValue(tokensSource, /brand:\s*\{[^}]*primaryDark:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const brandPrimaryLight = extractValue(tokensSource, /brand:\s*\{[^}]*primaryLight:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const brandPrimary50 = extractValue(tokensSource, /brand:\s*\{[^}]*primary50:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const brandPrimary100 = extractValue(tokensSource, /brand:\s*\{[^}]*primary100:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (brandPrimary) lines.push(`  --brand-primary:       ${brandPrimary};`);
  if (brandPrimaryDark) lines.push(`  --brand-primary-dark:  ${brandPrimaryDark};`);
  if (brandPrimaryLight) lines.push(`  --brand-primary-light: ${brandPrimaryLight};`);
  if (brandPrimary50) lines.push(`  --brand-primary-50:    ${brandPrimary50};`);
  if (brandPrimary100) lines.push(`  --brand-primary-100:   ${brandPrimary100};`);
  lines.push('');

  // Surface colors
  lines.push('  /* Surfaces */');
  const canvas = extractValue(tokensSource, /canvas\s*=\s*['"](#[A-Fa-f0-9]{6})['"]/);
  const surfaceLight = extractValue(tokensSource, /surface:\s*\{[^}]*light:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const surfaceActive = extractValue(tokensSource, /surface:\s*\{[^}]*active:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (canvas) lines.push(`  --canvas:       ${canvas};`);
  if (surfaceLight) lines.push(`  --surface-light: ${surfaceLight};`);
  if (surfaceActive) lines.push(`  --surface-active: ${surfaceActive};`);
  lines.push('');

  // Text colors
  lines.push('  /* Text */');
  const textPrimary = extractValue(tokensSource, /text:\s*\{[^}]*primary:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const textSecondary = extractValue(tokensSource, /text:\s*\{[^}]*secondary:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const textMuted = extractValue(tokensSource, /text:\s*\{[^}]*muted:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const textSubtle = extractValue(tokensSource, /text:\s*\{[^}]*subtle:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const textInverse = extractValue(tokensSource, /text:\s*\{[^}]*inverse:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (textPrimary) lines.push(`  --text-primary:   ${textPrimary};`);
  if (textSecondary) lines.push(`  --text-secondary: ${textSecondary};`);
  if (textMuted) lines.push(`  --text-muted:     ${textMuted};`);
  if (textSubtle) lines.push(`  --text-subtle:    ${textSubtle};`);
  if (textInverse) lines.push(`  --text-inverse:   ${textInverse};`);
  lines.push('');

  // Border colors
  lines.push('  /* Borders */');
  const borderDefault = extractValue(tokensSource, /border:\s*\{[^}]*DEFAULT:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const borderSubtle = extractValue(tokensSource, /border:\s*\{[^}]*subtle:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const borderStrong = extractValue(tokensSource, /border:\s*\{[^}]*strong:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (borderDefault) lines.push(`  --border-default: ${borderDefault};`);
  if (borderSubtle) lines.push(`  --border-subtle:  ${borderSubtle};`);
  if (borderStrong) lines.push(`  --border-strong:  ${borderStrong};`);
  lines.push('');

  // Status colors (parsed from status object)
  lines.push('  /* Status badges */');
  const statusRegex = /(\w+):\s*\{[^}]*bg:\s*['"](#[A-Fa-f0-9]{6})['"]/g;
  let statusMatch;
  while ((statusMatch = statusRegex.exec(tokensSource)) !== null) {
    const key = statusMatch[1];
    const bg = statusMatch[2];
    const textMatch = new RegExp(key + ':\\s*\\{[^}]*text:\\s*[\'"](#[A-Fa-f0-9]{6})[\'"]', 's').exec(tokensSource);
    const text = textMatch ? textMatch[1] : 'inherit';
    const borderMatch = new RegExp(key + ':\\s*\\{[^}]*border:\\s*[\'"](#[A-Fa-f0-9]{6})[\'"]', 's').exec(tokensSource);
    const border = borderMatch ? borderMatch[1] : bg;
    const dotMatch = new RegExp(key + ':\\s*\\{[^}]*dot:\\s*[\'"](#[A-Fa-f0-9]{6})[\'"]', 's').exec(tokensSource);
    const dot = dotMatch ? dotMatch[1] : bg;
    lines.push(`  --status-${key.toLowerCase()}-bg:     ${bg};`);
    lines.push(`  --status-${key.toLowerCase()}-text:     ${text};`);
    lines.push(`  --status-${key.toLowerCase()}-border:     ${border};`);
    lines.push(`  --status-${key.toLowerCase()}-dot:     ${dot};`);
  }
  lines.push('');

  // Typography
  lines.push('  /* Typography */');
  const fontSans = extractValue(tokensSource, /fontFamily:\s*\{[^}]*sans:\s*\[([^\]]+)\]/s);
  const fontMono = extractValue(tokensSource, /fontFamily:\s*\{[^}]*mono:\s*\[([^\]]+)\]/s);

  if (fontSans) lines.push(`  --font-sans: ${fontSans};`);
  if (fontMono) lines.push(`  --font-mono: ${fontMono};`);
  lines.push('');

  // Layout
  lines.push('  /* Layout */');
  const sidebarWidth = extractValue(tokensSource, /sidebarWidth:\s*['"]([^'"]+)['"]/);
  const sidebarCollapsed = extractValue(tokensSource, /sidebarCollapsed:\s*['"]([^'"]+)['"]/);
  const headerHeight = extractValue(tokensSource, /headerHeight:\s*['"]([^'"]+)['"]/);
  const pagePadding = extractValue(tokensSource, /pagePadding:\s*['"]([^'"]+)['"]/);
  const pageMaxWidth = extractValue(tokensSource, /pageMaxWidth:\s*['"]([^'"]+)['"]/);
  const cardPadding = extractValue(tokensSource, /cardPadding:\s*['"]([^'"]+)['"]/);
  const cardRadius = extractValue(tokensSource, /cardRadius:\s*['"]([^'"]+)['"]/);
  const cardRadiusSm = extractValue(tokensSource, /cardRadiusSm:\s*['"]([^'"]+)['"]/);
  const cardRadiusLg = extractValue(tokensSource, /cardRadiusLg:\s*['"]([^'"]+)['"]/);

  if (sidebarWidth) lines.push(`  --sidebar-w:     ${sidebarWidth};`);
  if (sidebarCollapsed) lines.push(`  --sidebar-collapsed: ${sidebarCollapsed};`);
  if (headerHeight) lines.push(`  --header-h:     ${headerHeight};`);
  if (pagePadding) lines.push(`  --page-pad:     ${pagePadding};`);
  if (pageMaxWidth) lines.push(`  --page-max:     ${pageMaxWidth};`);
  if (cardPadding) lines.push(`  --card-pad:     ${cardPadding};`);
  if (cardRadius) lines.push(`  --card-radius:  ${cardRadius};`);
  if (cardRadiusSm) lines.push(`  --card-radius-sm: ${cardRadiusSm};`);
  if (cardRadiusLg) lines.push(`  --card-radius-lg: ${cardRadiusLg};`);
  lines.push('');
  lines.push('}');
  lines.push('');

  // ── Dark mode overrides ────────────────────────────────────────────────────
  lines.push('.dark {');

  // Dark surfaces
  lines.push('  /* Surfaces */');
  const darkCanvas = extractValue(tokensSource, /dark:\s*\{[^}]*canvas:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const darkSurfaceLight = extractValue(tokensSource, /dark:\s*\{[^}]*surface:\s*\{[^}]*light:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const darkSurfaceActive = extractValue(tokensSource, /dark:\s*\{[^}]*surface:\s*\{[^}]*active:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (darkCanvas) lines.push(`  --canvas:       ${darkCanvas};`);
  if (darkSurfaceLight) lines.push(`  --surface-light: ${darkSurfaceLight};`);
  if (darkSurfaceActive) lines.push(`  --surface-active: ${darkSurfaceActive};`);
  lines.push('');

  // Dark text
  lines.push('  /* Text */');
  const darkTextPrimary = extractValue(tokensSource, /dark:\s*\{[^}]*text:\s*\{[^}]*primary:\s*['"](#[A-Fa-f0-9]{6})['"]/s);
  const darkTextSecondary = extractValue(tokensSource, /dark:\s*\{[^}]*text:\s*\{[^}]*secondary:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (darkTextPrimary) lines.push(`  --text-primary:   ${darkTextPrimary};`);
  if (darkTextSecondary) lines.push(`  --text-secondary: ${darkTextSecondary};`);
  lines.push('');

  // Dark borders
  lines.push('  /* Borders */');
  const darkBorderDefault = extractValue(tokensSource, /dark:\s*\{[^}]*border:\s*\{[^}]*DEFAULT:\s*['"](#[A-Fa-f0-9]{6})['"]/s);

  if (darkBorderDefault) lines.push(`  --border-default: ${darkBorderDefault};`);
  lines.push('');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

const newCssSection = generateCssVariablesSection();

// Read existing CSS file
let cssContent = '';
try {
  cssContent = readFileSync(cssFile, 'utf8');
} catch (e) {
  console.warn('CSS file not found, creating new one:', cssFile);
}

// Replace or append the :root and .dark sections
const rootStart = cssContent.indexOf(':root {');
const rootEnd = cssContent.indexOf('}', rootStart);

if (rootStart !== -1 && rootEnd !== -1) {
  const beforeRoot = cssContent.substring(0, rootStart);
  const afterRoot = cssContent.substring(rootEnd + 1);
  // Remove any existing .dark section that might be after :root
  const darkStart = afterRoot.indexOf('.dark {');
  const cleanedAfterRoot = darkStart !== -1 ? afterRoot.substring(0, darkStart) : afterRoot;
  cssContent = beforeRoot + newCssSection + cleanedAfterRoot;
} else {
  cssContent = cssContent + '\n' + newCssSection;
}

writeFileSync(cssFile, cssContent, 'utf8');
console.log('✅ CSS variables synced from tokens.ts → tokens.css');
console.log('   Source: ' + tokensFile);
console.log('   Target: ' + cssFile);
console.log('   Updated ' + newCssSection.split('\n').length + ' lines');
