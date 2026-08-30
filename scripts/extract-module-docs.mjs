#!/usr/bin/env node
/**
 * extract-module-docs.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-agentic pipeline: reads LIVE application source code and auto-generates
 * documentation articles from the actual modules — not just static markdown.
 *
 * SOURCES EXTRACTED
 *  1. NestJS controllers  — @ApiTags, @ApiOperation summaries, route paths,
 *                           permission decorators, HTTP methods
 *  2. Frontend pages      — JSDoc block comments, usePageTitle() calls,
 *                           module description from first comment block
 *  3. Frontend apiDocs.tsx — endpointGroups array with 100+ human-written
 *                           API descriptions
 *
 * OUTPUT
 *  Articles are written to the doc_article table (same schema as seed-docs.mjs).
 *  Each source module generates one article in the correct category:
 *    - Backend controllers  → api_reference
 *    - Frontend pages       → feature
 *    - apiDocs.tsx groups   → api_reference (with endpoint tables)
 *
 * USAGE
 *   node scripts/extract-module-docs.mjs            # extract + seed DB
 *   node scripts/extract-module-docs.mjs --dry-run  # print, no DB writes
 *   node scripts/extract-module-docs.mjs --json     # write extracted-docs.json
 *   node scripts/extract-module-docs.mjs --help
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');
const BACKEND    = join(ROOT, 'apps', 'backend', 'src');
const FRONTEND   = join(ROOT, 'apps', 'frontend', 'src', 'pages');

const DRY_RUN    = process.argv.includes('--dry-run');
const JSON_OUT   = process.argv.includes('--json');
const COUNT_ONLY = process.argv.includes('--count-only');
const HELP       = process.argv.includes('--help') || process.argv.includes('-h');

if (HELP) {
  console.log(`
  extract-module-docs.mjs
  ───────────────────────────────────────────────────────
  Extracts documentation from live NestJS controllers and
  React page files, then seeds the doc_article database.

  node scripts/extract-module-docs.mjs            seed database
  node scripts/extract-module-docs.mjs --dry-run  print, no writes
  node scripts/extract-module-docs.mjs --json     write extracted-docs.json
  `);
  process.exit(0);
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Recursively collect files matching a filter. */
function walkFiles(dir, filter, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) walkFiles(full, filter, results);
      else if (filter(entry)) results.push(full);
    } catch { /* skip inaccessible */ }
  }
  return results;
}

/** Convert any string to a URL-safe slug. */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

/** Generate a stable slug with a namespace prefix (avoid collisions with docs/ markdown). */
function moduleSlug(prefix, name) {
  return slugify(`module-${prefix}-${name}`);
}

/** Extract first 250 plain chars from a Markdown-ish string. */
function plainText(str = '') {
  return str
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_`[\]()>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 250);
}

/** Build a JSON tags array string. */
function buildTags(terms) {
  const clean = [...new Set(terms.filter(Boolean).map(t => t.toLowerCase().slice(0, 50)))].slice(0, 15);
  return JSON.stringify(clean);
}

// ─── Module-to-subcategory mapping ───────────────────────────────────────────
// Maps a module path fragment to a human-readable subcategory label.
// Used for both controller articles and page articles.

const MODULE_LABELS = {
  auth:          'Authentication & Security',
  hr:            'HR & Payroll',
  employees:     'HR & Payroll',
  payroll:       'HR & Payroll',
  attendance:    'HR & Payroll',
  leaves:        'HR & Payroll',
  departments:   'HR & Payroll',
  shifts:        'HR & Payroll',
  holidays:      'HR & Payroll',
  biometrics:    'HR & Payroll',
  ovds:          'Ovds & Accounting',
  accounting:    'Ovds & Accounting',
  invoice:     'invoice & Billing',
  reporting:     'Reports & Analytics',
  tax:           'Tax & Compliance',
  vat:           'Tax & Compliance',
  treasury:      'Banking & Treasury',
  crm:           'CRM & Sales',
  inventory:     'Inventory',
  'sub-ledger':  'Ovds & Accounting',
  'cost-centers':'Ovds & Accounting',
  dashboard:     'Dashboard & Analytics',
  helpdesk:      'Helpdesk & Support',
  loyalty:       'Loyalty & CRM',
  iot:           'IoT & Smart Devices',
  appstore:      'App Store',
  onboarding:    'Getting Started',
  settings:      'Settings & Configuration',
  notifications: 'Notifications',
  projects:      'Projects & Tasks',
  trade:         'Trade & Logistics',
  'disaster-fund':'Tax & Compliance',
  'audit-outsourcing': 'Audit & Compliance',
  manufacturing: 'Manufacturing',
  monetization:  'Billing & Plans',
  release:       'System & Releases',
  vandv:         'Compliance Frameworks',
};

function labelFor(pathStr) {
  const lower = pathStr.toLowerCase().replace(/\\/g, '/');
  for (const [key, label] of Object.entries(MODULE_LABELS)) {
    if (lower.includes(`/${key}/`) || lower.endsWith(`/${key}`) || lower.includes(`\\${key}\\`)) {
      return label;
    }
  }
  return 'Platform Features';
}

// ─── 1. Backend Controller Extractor ─────────────────────────────────────────

/**
 * Parse a NestJS controller file and extract:
 *  - @ApiTags('...') — module name
 *  - @Controller('...') — base path
 *  - @ApiOperation({ summary: '...' }) + HTTP method decorator + @Permissions / @Roles
 *
 * Returns a structured article object or null if nothing useful was found.
 */
function extractControllerArticle(filePath) {
  let src;
  try { src = readFileSync(filePath, 'utf-8'); } catch { return null; }

  // ── Module-level metadata ─────────────────────────────────────────────────
  const tagsMatch  = src.match(/@ApiTags\(['"`]([^'"`]+)['"`]\)/);
  const ctrlMatch  = src.match(/@Controller\(['"`]([^'"`]*)['"`]\)/);

  const apiTag     = tagsMatch?.[1]?.trim() ?? '';
  const basePath   = ctrlMatch?.[1]?.trim() ?? '';

  if (!apiTag && !basePath) return null; // skip utility/internal controllers

  // ── Route-level extraction ────────────────────────────────────────────────
  // Match blocks like:
  //   @Get('path')  (or @Post/@Patch/@Delete/@Put)
  //   @ApiOperation({ summary: '...' })
  //   @Permissions('x:y') or @Roles(Role.ADMIN)
  const routes = [];

  // Split into per-method sections by finding HTTP decorator lines
  const methodRe  = /@(Get|Post|Patch|Put|Delete|Head)\(['"`]([^'"`]*)['"`]\)|@(Get|Post|Patch|Put|Delete|Head)\(\)/g;
  const summaryRe = /@ApiOperation\(\s*\{[^}]*summary:\s*['"`]([^'"`]+)['"`]/;
  const permRe    = /@(?:Permissions|RequirePermission)\(['"`]([^'"`]+)['"`]\)/;
  const rolesRe   = /@Roles\(([^)]+)\)/;

  // Walk line-by-line in a small window around each HTTP decorator
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const meth = line.match(/@(Get|Post|Patch|Put|Delete|Head)\(['"`]?([^'"`)]*)['"`]?\)/i);
    if (!meth) continue;

    const method  = meth[1].toUpperCase();
    const subPath = meth[2]?.trim() ?? '';
    const fullPath = subPath
      ? `/api/${basePath}/${subPath}`.replace(/\/+/g, '/')
      : `/api/${basePath}`.replace(/\/+/g, '/');

    // Look in the 10 lines before and after for @ApiOperation, @Permissions, @Roles
    const window = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10)).join('\n');
    const sumM    = window.match(summaryRe);
    const permM   = window.match(permRe);
    const rolesM  = window.match(rolesRe);

    const summary = sumM?.[1]?.trim() ?? '';
    const perm    = permM?.[1]?.trim() ?? '';
    const roles   = rolesM?.[1]?.replace(/Role\./g, '').replace(/\s+/g, '').trim() ?? '';

    if (summary || perm) {
      routes.push({ method, path: fullPath, summary, permission: perm, roles });
    }
  }

  if (routes.length === 0 && !apiTag) return null;

  // ── Build Markdown content ────────────────────────────────────────────────
  const moduleName = apiTag || basePath || basename(filePath, '.controller.ts').replace(/-/g, ' ');
  const subcategory = labelFor(filePath);

  const lines_md = [
    `# ${moduleName}`,
    '',
    `**Base path:** \`/api/${basePath}\`  `,
    `**Module:** ${subcategory}`,
    '',
  ];

  if (routes.length > 0) {
    lines_md.push('## Endpoints', '');
    lines_md.push('| Method | Path | Description | Permission |');
    lines_md.push('|--------|------|-------------|------------|');
    for (const r of routes) {
      const perm = r.permission || r.roles || '—';
      lines_md.push(`| \`${r.method}\` | \`${r.path}\` | ${r.summary || '—'} | \`${perm}\` |`);
    }
    lines_md.push('');
  }

  const content  = lines_md.join('\n');
  const summary  = plainText(`${moduleName} — ${subcategory}. ${routes.length} endpoint${routes.length !== 1 ? 's' : ''}: ${routes.slice(0, 3).map(r => r.summary).filter(Boolean).join('; ')}.`);
  const tagTerms = [
    'api_reference', subcategory.toLowerCase(),
    basePath, apiTag.toLowerCase(),
    ...routes.slice(0, 5).map(r => r.permission?.split(':')[0]).filter(Boolean),
  ];

  return {
    slug:        moduleSlug('api', basePath || slugify(moduleName)),
    title:       `${moduleName} — API Reference`,
    category:    'api_reference',
    subcategory: subcategory.slice(0, 99),
    summary:     summary.slice(0, 250),
    content,
    tags:        buildTags(tagTerms),
    isPublished: true,
  };
}

// ─── 2. Frontend Page Extractor ───────────────────────────────────────────────

/** Extract page title using a 4-level priority cascade. */
function extractPageTitle(src, filePath) {
  // Priority 1: usePageTitle('...')
  const hookMatch = src.match(/usePageTitle\(['"`]([^'"`]+)['"`]\)/);
  if (hookMatch) return { title: hookMatch[1].trim(), source: 'usePageTitle' };

  // Priority 2: // Page: <title>
  const commentMatch = src.match(/\/\/\s*Page:\s*(.+)/);
  if (commentMatch) return { title: commentMatch[1].trim(), source: 'comment' };

  // Priority 3: document.title = '...'
  const docTitleMatch = src.match(/document\.title\s*=\s*['"`]([^'"`]+)['"`]/);
  if (docTitleMatch) return { title: docTitleMatch[1].trim(), source: 'document.title' };

  // Priority 4: derive from filename (PascalCase → "Pascal Case")
  const base = basename(filePath, extname(filePath));
  const derived = base
    .replace(/([A-Z])/g, ' $1')
    .replace(/^[\s-]/, '')
    .replace(/_/g, ' ')
    .trim();
  return { title: derived || base, source: 'filename' };
}

/**
 * Parse a React/TSX page file and extract:
 *  - First JSDoc block comment (module description)
 *  - usePageTitle('...') call (display title)
 *  - @ApiTags or @ApiOperation (if present in inline docs)
 *
 * Returns a feature article describing what the page/module does.
 */
function extractPageArticle(filePath) {
  let src;
  try { src = readFileSync(filePath, 'utf-8'); } catch { return null; }

  // ── Page title ────────────────────────────────────────────────────────────
  // Skip non-component files (no default export)
  const hasDefaultExport = /export\s+default\s+(function|class|\w)/.test(src);
  if (!hasDefaultExport) return null;

  const { title: pageTitle, source: titleSource } = extractPageTitle(src, filePath);

  // ── JSDoc description ─────────────────────────────────────────────────────
  // Match the first /** ... */ block at the top of the file
  const jsdocMatch = src.match(/^\/\*\*([\s\S]*?)\*\//m);
  let description = '';
  if (jsdocMatch) {
    description = jsdocMatch[1]
      .replace(/^\s*\*\s?/gm, '')  // strip leading " * "
      .replace(/\n+/g, ' ')
      .trim();
  }

  // ── Page route (from app.tsx registration pattern) ────────────────────────
  // We can't directly know the route from the file, but the filename is canonical
  const fileName  = basename(filePath, extname(filePath));
  const subcategory = labelFor(filePath) || labelForPageName(fileName);

  // ── Key features mentioned in the file ────────────────────────────────────
  // Extract AppKpi / AppTabs labels and lucide icon names as feature hints
  const kpiMatches  = [...src.matchAll(/label:\s*['"`]([^'"`]{3,60})['"`]/g)].map(m => m[1]).slice(0, 8);
  const tabMatches  = [...src.matchAll(/label:\s*['"`]([^'"`]{2,40})['"`]/g)].map(m => m[1]).slice(0, 6);
  const featureHints = [...new Set([...kpiMatches, ...tabMatches])].filter(s => !/^[A-Z_]+$/.test(s));

  // ── Build Markdown content ────────────────────────────────────────────────
  const lines_md = [
    `# ${pageTitle}`,
    '',
  ];

  if (description) {
    lines_md.push(description, '');
  }

  lines_md.push(`**Module:** ${subcategory}`, '');

  if (featureHints.length > 0) {
    lines_md.push('## Key Features', '');
    featureHints.slice(0, 10).forEach(h => lines_md.push(`- ${h}`));
    lines_md.push('');
  }

  // Scan for toast/success messages that hint at what actions the page supports
  const actionMatches = [...src.matchAll(/toast\.(success|error)\(['"`]([^'"`]{5,60})['"`]\)/g)]
    .map(m => m[2]).slice(0, 6);
  if (actionMatches.length > 0) {
    lines_md.push('## Actions', '');
    actionMatches.forEach(a => lines_md.push(`- ${a}`));
    lines_md.push('');
  }

  const content   = lines_md.join('\n');
  const summary   = plainText(description || `${pageTitle} — ${subcategory} module in the OVDS platform.`);
  const tagTerms  = [
    'feature', subcategory.toLowerCase(),
    fileName.toLowerCase(), pageTitle.toLowerCase(),
    ...featureHints.slice(0, 5).map(h => h.toLowerCase()),
  ];

  return {
    slug:        moduleSlug('page', fileName),
    title:       pageTitle,
    titleSource,
    category:    'feature',
    subcategory: subcategory.slice(0, 99),
    summary:     summary.slice(0, 250),
    content,
    tags:        buildTags(tagTerms),
    isPublished: true,
  };
}

/** Derive subcategory from page filename when path matching isn't enough. */
function labelForPageName(name) {
  const n = name.toLowerCase();
  if (/payroll|hr|leave|attendance|shift|holiday|employee|department|gratuity|pension|paye|bank.?payroll/.test(n)) return 'HR & Payroll';
  if (/invoice|bill|purchase|expense|refund|receipt|credit|debit|proforma|sales.?order|estimate/.test(n)) return 'invoice & Billing';
  if (/vat|tax|disaster|bit|tot|stamp|excise|penalty|etax|wht|schedule/.test(n)) return 'Tax & Compliance';
  if (/accounting|journal|ledger|reconcil|period|cost.?center|sub.?ledger|opening|accrual|intercompany/.test(n)) return 'ovds & Accounting';
  if (/bank|treasury|fund.?transfer|fx|budget|cash/.test(n)) return 'Banking & Treasury';
  if (/ifrs|ecl|provision|lease|equity|financial.?statement|deferred/.test(n)) return 'Reports & IFRS';
  if (/report|statement|variance|analytics|insights/.test(n)) return 'Reports & Analytics';
  if (/crm|customer|vendor|partner|client|loyalty|pipeline/.test(n)) return 'CRM & Sales';
  if (/inventory|item|asset|grn|valuation|goods/.test(n)) return 'Inventory';
  if (/iot|device|telemetry|alert|ota/.test(n)) return 'IoT & Smart Devices';
  if (/project|helpdesk|ticket|calendar|trade|shipment/.test(n)) return 'Operations';
  if (/setting|user|role|permission|company|notification|email|onboard|register/.test(n)) return 'Settings & Administration';
  if (/dashboard|home|landing|start|getting.?started/.test(n)) return 'Dashboard & Getting Started';
  if (/appstore|app.?store|release|monetization|plan/.test(n)) return 'App Store & Billing';
  if (/docs|api.?docs|developers/.test(n)) return 'Developer Reference';
  return 'Platform Features';
}

// ─── 3. apiDocs.tsx Group Extractor ──────────────────────────────────────────

/**
 * Parse apps/frontend/src/pages/apiDocs.tsx and extract the endpointGroups
 * array. Each group (Authentication, Employees, ovds, etc.) becomes a
 * separate api_reference article with a full endpoint table.
 */
function extractApiDocsArticles() {
  const filePath = join(FRONTEND, 'apiDocs.tsx');
  let src;
  try { src = readFileSync(filePath, 'utf-8'); } catch { return []; }

  const articles = [];

  // Extract group blocks: { group: '...', items: [ { method, path, desc }, ... ] }
  // Use a line-by-line state machine (avoids fragile regex on the full object)
  const lines   = src.split('\n');
  let inGroup   = false;
  let groupName = '';
  let items     = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start of a group object
    const gm = line.match(/group:\s*['"`]([^'"`]+)['"`]/);
    if (gm) {
      // Save previous group
      if (groupName && items.length > 0) articles.push(buildGroupArticle(groupName, items));
      groupName = gm[1].trim();
      items = [];
      inGroup = true;
      continue;
    }

    if (!inGroup) continue;

    // Item: { method: 'GET', path: '/api/...', desc: '...' }
    const methM = line.match(/method:\s*['"`](GET|POST|PATCH|PUT|DELETE)['"`]/i);
    const pathM = line.match(/path:\s*['"`]([^'"`]+)['"`]/);
    const descM = line.match(/desc(?:ription)?:\s*['"`]([^'"`]+)['"`]/);

    if (methM || pathM || descM) {
      // Collect within a small lookahead window
      const window = lines.slice(i, i + 5).join(' ');
      const method = window.match(/method:\s*['"`](GET|POST|PATCH|PUT|DELETE)['"`]/i)?.[1]?.toUpperCase() ?? '';
      const path   = window.match(/path:\s*['"`]([^'"`]+)['"`]/)?.[1]?.trim() ?? '';
      const desc   = window.match(/desc(?:ription)?:\s*['"`]([^'"`]+)['"`]/)?.[1]?.trim() ?? '';

      if (method && path && desc && !items.some(it => it.path === path)) {
        items.push({ method, path, desc });
      }
    }
  }

  // Flush last group
  if (groupName && items.length > 0) articles.push(buildGroupArticle(groupName, items));

  return articles;
}

function buildGroupArticle(groupName, items) {
  const lines_md = [
    `# ${groupName} — API Reference`,
    '',
    `This section covers the **${groupName}** API endpoints.`,
    '',
    '## Endpoints',
    '',
    '| Method | Path | Description |',
    '|--------|------|-------------|',
    ...items.map(it => `| \`${it.method}\` | \`${it.path}\` | ${it.desc} |`),
    '',
  ];

  const content   = lines_md.join('\n');
  const subcategory = labelFor(groupName.toLowerCase()) || 'REST API';
  const summary   = `${groupName} API: ${items.slice(0, 4).map(i => i.desc).join('; ')}.`.slice(0, 250);

  return {
    slug:        moduleSlug('apidocs', groupName),
    title:       `${groupName} — API Reference`,
    category:    'api_reference',
    subcategory: 'REST API',
    summary,
    content,
    tags:        buildTags(['api_reference', 'rest api', groupName.toLowerCase(), ...items.slice(0,4).map(i => i.path.split('/')[2])]),
    isPublished: true,
  };
}

// ─── 4. FAQ generator — common questions from code patterns ──────────────────

/**
 * Scan controllers and pages for patterns that imply FAQ content:
 *  - Error messages in controllers → "What does error X mean?"
 *  - NotFoundException / ForbiddenException messages → "Why am I getting 404/403?"
 *  - Guard requirements → "What permissions do I need for X?"
 *
 * Produces a single FAQ article per major domain area.
 */
function generateFaqArticles() {
  const faqs = {
    'HR & Payroll': [],
    'Ovds & Accounting': [],
    'Tax & Compliance': [],
    'Authentication & Security': [],
    'Banking & Treasury': [],
    'General': [],
  };

  // Scan all controllers for exception messages
  const controllers = walkFiles(BACKEND, f => f.endsWith('.controller.ts'));
  for (const file of controllers) {
    let src;
    try { src = readFileSync(file, 'utf-8'); } catch { continue; }
    const sub = labelFor(file);
    if (!faqs[sub]) faqs[sub] = [];

    // Extract NotFoundException / BadRequestException messages
    const errMatches = [...src.matchAll(/(?:NotFoundException|BadRequestException|ForbiddenException)\(['"`]([^'"`]{10,120})['"`]\)/g)];
    for (const m of errMatches) {
      const msg = m[1].trim();
      if (msg.length > 10 && !faqs[sub].some(f => f.q.includes(msg.slice(0, 20)))) {
        const exType = m[0].startsWith('NotFound') ? '404 Not Found' :
                       m[0].startsWith('Forbidden') ? '403 Forbidden' : '400 Bad Request';
        faqs[sub].push({
          q: `Why do I get "${msg}"?`,
          a: `This error (${exType}) occurs when ${msg.charAt(0).toLowerCase() + msg.slice(1)}. Check that the resource exists and that your account has the required permissions for this operation.`,
        });
      }
    }

    // Extract @Roles / @Permissions requirements
    const roleMatches = [...src.matchAll(/@(?:Roles|Permissions)\(([^)]+)\)[\s\S]{0,200}@ApiOperation\(\s*\{[^}]*summary:\s*['"`]([^'"`]+)['"`]/g)];
    for (const m of roleMatches) {
      const roles   = m[1].replace(/Role\./g, '').replace(/\s/g, '').slice(0, 80);
      const summary = m[2]?.trim() ?? '';
      if (summary && roles) {
        faqs[sub].push({
          q: `Who can ${summary.charAt(0).toLowerCase() + summary.slice(1)}?`,
          a: `This action requires the following roles or permissions: **${roles}**. Contact your system administrator to request access if needed.`,
        });
      }
    }
  }

  // Build one FAQ article per domain that has enough content
  const articles = [];
  let order = 1000;

  for (const [domain, items] of Object.entries(faqs)) {
    const uniqueItems = items.slice(0, 12); // cap per domain
    if (uniqueItems.length < 2) continue;

    const lines_md = [`# ${domain} — Frequently Asked Questions`, ''];
    for (const { q, a } of uniqueItems) {
      lines_md.push(`### ${q}`, '', a, '');
    }

    const content = lines_md.join('\n');
    const summary = `Common questions about ${domain}: ${uniqueItems.slice(0, 3).map(i => i.q).join('; ')}.`.slice(0, 250);

    articles.push({
      slug:        moduleSlug('faq', domain),
      title:       `${domain} — FAQ`,
      category:    'faq',
      subcategory: domain.slice(0, 99),
      summary,
      content,
      tags:        buildTags(['faq', domain.toLowerCase(), 'help', 'troubleshooting']),
      sortOrder:   order++,
      isPublished: true,
    });
  }

  return articles;
}

// ─── 5. Tutorial generator — from page onboarding patterns ───────────────────

/**
 * Scan frontend pages for wizard/step/onboarding patterns that imply tutorials.
 * Generates "How to use X" articles for major workflows.
 */
function generateTutorialArticles() {
  const WORKFLOW_PAGES = [
    { file: 'invoices.tsx',        title: 'How to Create and Send an Invoice',           sub: 'invoice & Billing' },
    { file: 'vatAdministration.tsx', title: 'How to File a Monthly VAT Return',           sub: 'Tax & Compliance' },
    { file: 'payroll.tsx',         title: 'How to Run Payroll',                           sub: 'HR & Payroll' },
    { file: 'employees.tsx',       title: 'How to Add and Manage Employees',              sub: 'HR & Payroll' },
    { file: 'bankReconciliation.tsx', title: 'How to Reconcile a Bank Statement',         sub: 'Banking & Treasury' },
    { file: 'bankStatementImport.tsx', title: 'How to Import a Bank Statement',           sub: 'Banking & Treasury' },
    { file: 'accounting.tsx',      title: 'How to Post a Journal Entry',                  sub: 'ovds & Accounting' },
    { file: 'bills.tsx',           title: 'How to Record and Pay a Supplier Bill',        sub: 'invoice & Billing' },
    { file: 'expenses.tsx',        title: 'How to Submit an Expense Claim',               sub: 'HR & Payroll' },
    { file: 'purchaseOrders.tsx',  title: 'How to Create a Purchase Order',               sub: 'invoice & Billing' },
    { file: 'users.tsx',           title: 'How to Invite and Manage Users',               sub: 'Settings & Administration' },
    { file: 'businessIncomeTax.tsx', title: 'How to File Business Income Tax (BIT)',      sub: 'Tax & Compliance' },
    { file: 'importCenter.tsx',    title: 'How to Bulk Import Data via Import Center',    sub: 'Getting Started' },
    { file: 'iotHub.tsx',          title: 'How to Connect and Manage IoT Devices',        sub: 'IoT & Smart Devices' },
    { file: 'gettingStarted.tsx',  title: 'Getting Started with OVDS',                    sub: 'Getting Started' },
  ];

  const articles = [];
  let order = 2000;

  for (const wf of WORKFLOW_PAGES) {
    const filePath = join(FRONTEND, wf.file);
    let src;
    try { src = readFileSync(filePath, 'utf-8'); } catch { continue; }

    // Extract step indicators from the file (numbered items, step arrays, etc.)
    const stepMatches = [
      ...[...src.matchAll(/Step\s+(\d+)[:\-–]\s*([^\n'"`]{5,80})/g)].map(m => ({ n: m[1], text: m[2].trim() })),
      ...[...src.matchAll(/['"`]Step\s+\d+[:\-–]?\s*([^'"`]{5,80})['"`]/g)].map(m => ({ n: '?', text: m[1].trim() })),
    ].slice(0, 8);

    // Extract toast success messages as action confirmation hints
    const successMsgs = [...src.matchAll(/toast\.success\(['"`]([^'"`]{5,80})['"`]\)/g)]
      .map(m => m[1].trim()).slice(0, 6);

    // Extract confirm dialog messages as destructive action hints
    const confirmMsgs = [...src.matchAll(/confirm\(['"`]([^'"`]{5,120})['"`]\)/g)]
      .map(m => m[1].trim()).slice(0, 4);

    // Extract column/field names from AppTh / table headers
    const fields = [...src.matchAll(/AppTh[^>]*>([^<]{2,40})<\/AppTh>/g)]
      .map(m => m[1].trim()).filter(Boolean).slice(0, 8);

    // Build tutorial article
    const jsdocM = src.match(/^\/\*\*([\s\S]*?)\*\//m);
    const desc = jsdocM
      ? jsdocM[1].replace(/^\s*\*\s?/gm, '').replace(/\n+/g, ' ').trim()
      : '';

    const lines_md = [
      `# ${wf.title}`,
      '',
    ];

    if (desc) lines_md.push(desc, '');

    if (stepMatches.length > 0) {
      lines_md.push('## Steps', '');
      stepMatches.forEach((s, i) => lines_md.push(`${i + 1}. ${s.text}`));
      lines_md.push('');
    } else {
      lines_md.push(`## Overview`, '', `This guide walks you through **${wf.title}** in OVDS.`, '');
    }

    if (successMsgs.length > 0) {
      lines_md.push('## What to Expect', '');
      successMsgs.forEach(m => lines_md.push(`- ✅ ${m}`));
      lines_md.push('');
    }

    if (fields.length > 0) {
      lines_md.push(`## Key Fields`, '', fields.map(f => `- **${f}**`).join('\n'), '');
    }

    if (confirmMsgs.length > 0) {
      lines_md.push('## Caution', '');
      confirmMsgs.forEach(m => lines_md.push(`> ⚠️  ${m}`));
      lines_md.push('');
    }

    const content  = lines_md.join('\n');
    const summary  = plainText(desc || `Step-by-step guide: ${wf.title} in the OVDS platform.`).slice(0, 250);
    const tagTerms = ['tutorial', wf.sub.toLowerCase(), wf.title.toLowerCase(), wf.file.replace('.tsx', '')];

    articles.push({
      slug:        moduleSlug('tutorial', wf.file.replace('.tsx', '')),
      title:       wf.title,
      category:    'tutorial',
      subcategory: wf.sub.slice(0, 99),
      summary,
      content,
      tags:        buildTags(tagTerms),
      sortOrder:   order++,
      isPublished: true,
    });
  }

  return articles;
}

// ─── 6. Main orchestrator ─────────────────────────────────────────────────────

async function main() {
  console.log('\n🤖  OVDS Live Module Documentation Extractor\n');

  const articles = [];
  let order = 500; // start after docs/ markdown articles (sortOrder 0-499)

  // ── Phase 1: Backend controllers ──────────────────────────────────────────
  process.stdout.write('  📡  Scanning backend controllers… ');
  const controllerFiles = walkFiles(BACKEND, f => f.endsWith('.controller.ts') && !f.includes('docs.controller'));
  let ctrlCount = 0;

  // Deduplicate by base path — some modules have multiple controllers
  const seenPaths = new Set();
  for (const file of controllerFiles) {
    const art = extractControllerArticle(file);
    if (!art) continue;
    if (seenPaths.has(art.slug)) continue;
    seenPaths.add(art.slug);
    art.sortOrder = order++;
    articles.push(art);
    ctrlCount++;
  }
  console.log(`${ctrlCount} articles`);

  // ── Phase 2: Frontend pages ────────────────────────────────────────────────
  process.stdout.write('  🖥️   Scanning frontend pages… ');
  const pageFiles = walkFiles(FRONTEND, f => f.endsWith('.tsx') && !f.includes('docsPortal') && !f.includes('apiDocs'));
  let pageCount = 0;
  const seenPageSlugs = new Set();
  const titleSources = { usePageTitle: 0, comment: 0, 'document.title': 0, filename: 0 };

  for (const file of pageFiles) {
    const art = extractPageArticle(file);
    if (!art) continue;
    if (seenPageSlugs.has(art.slug)) continue;
    seenPageSlugs.add(art.slug);
    art.sortOrder = order++;
    articles.push(art);
    pageCount++;
    if (art.titleSource && art.titleSource in titleSources) titleSources[art.titleSource]++;
  }
  console.log(`${pageCount} articles`);
  console.log(`        usePageTitle: ${titleSources.usePageTitle} | comment: ${titleSources.comment} | document.title: ${titleSources['document.title']} | filename: ${titleSources.filename}`);

  // ── Phase 3: apiDocs.tsx endpoint groups ──────────────────────────────────
  process.stdout.write('  📋  Extracting apiDocs.tsx groups… ');
  const apiDocArts = extractApiDocsArticles();
  apiDocArts.forEach(a => { a.sortOrder = order++; });
  articles.push(...apiDocArts);
  console.log(`${apiDocArts.length} articles`);

  // ── Phase 4: FAQ from exception patterns ──────────────────────────────────
  process.stdout.write('  ❓  Generating FAQ articles… ');
  const faqArts = generateFaqArticles();
  articles.push(...faqArts);
  console.log(`${faqArts.length} articles`);

  // ── Phase 5: Tutorial workflows ────────────────────────────────────────────
  process.stdout.write('  📖  Generating tutorial articles… ');
  const tutArts = generateTutorialArticles();
  articles.push(...tutArts);
  console.log(`${tutArts.length} articles`);

  console.log(`\n  Total: ${articles.length} articles extracted from live modules\n`);

  if (articles.length === 0) {
    console.error('  ❌  Nothing extracted — check source paths.');
    process.exit(1);
  }

  // Category breakdown
  const byCategory = articles.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {});
  const ICONS = { feature: '⭐', tutorial: '📖', faq: '❓', api_reference: '🔌' };
  Object.entries(byCategory).sort().forEach(([cat, n]) =>
    console.log(`    ${ICONS[cat] || '•'}  ${cat.padEnd(14)} ${n}`)
  );
  console.log();

  // ── Count-only mode — print article count and exit (used by CI gate) ────────
  if (COUNT_ONLY) {
    process.stdout.write(String(articles.length));
    return;
  }

  // ── JSON output ───────────────────────────────────────────────────────────
  if (JSON_OUT) {
    const out = join(ROOT, 'docs', 'extracted-module-docs.json');
    writeFileSync(out, JSON.stringify(articles, null, 2), 'utf-8');
    console.log(`  ✅  Written to ${out}\n`);
    return;
  }

  // ── Dry-run ───────────────────────────────────────────────────────────────
  if (DRY_RUN) {
    articles.forEach(a =>
      console.log(`  [${a.category.padEnd(13)}] (${(a.subcategory || '').padEnd(32)}) ${a.title}`)
    );
    console.log(`\n  ✅  Dry-run — ${articles.length} articles, no database writes.\n`);
    return;
  }

  // ── Database seed ─────────────────────────────────────────────────────────
  let PrismaClient;
  try {
    const mod = await import('@prisma/client').catch(() => import('@ovds/database'));
    PrismaClient = mod.PrismaClient;
  } catch {
    console.error(
      '\n  ❌  Cannot import PrismaClient.\n' +
      '      Run `npm run db:generate` first, or use --json.\n'
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  let created = 0, updated = 0, failed = 0;

  try {
    await prisma.$connect();
    console.log('  🔌  Connected to database\n');

    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      const pct   = Math.round(((i + 1) / articles.length) * 100);
      const bar   = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
      process.stdout.write(`\r  [${bar}] ${pct}%  ${a.title.slice(0, 38).padEnd(38)}`);

      try {
        const existing = await prisma.docArticle.findUnique({ where: { slug: a.slug } });
        if (existing) {
          await prisma.docArticle.update({ where: { slug: a.slug }, data: a });
          updated++;
        } else {
          const { randomUUID } = await import('crypto');
          await prisma.docArticle.create({ data: { id: randomUUID(), ...a } });
          created++;
        }
      } catch (err) {
        failed++;
        process.stdout.write('\n');
        console.warn(`  ⚠  Failed "${a.slug}": ${err.message}`);
      }
    }

    process.stdout.write('\n\n');
    console.log(`  ✅  Done — ${created} created, ${updated} updated${failed ? `, ${failed} failed` : ''}.\n`);

  } catch (err) {
    process.stdout.write('\n');
    if (err.message?.includes('does not exist') || err.code === 'P2021') {
      console.error('\n  ❌  Table doc_article not found. Run `npm run docs:setup` first.\n');
    } else {
      console.error(`\n  ❌  Database error: ${err.message}\n`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch(err => {
  console.error(`\n  ❌  ${err.message}\n`);
  process.exit(1);
});
