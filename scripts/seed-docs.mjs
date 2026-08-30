#!/usr/bin/env node
/**
 * seed-docs.mjs — AI-agentic documentation categorization pipeline
 *
 * Reads every .md file under docs/, classifies each into one of four
 * categories, then upserts the results into the doc_article database table.
 *
 * USAGE
 *   node scripts/seed-docs.mjs              # categorize + seed database
 *   node scripts/seed-docs.mjs --dry-run    # categorize + print, no DB writes
 *   node scripts/seed-docs.mjs --json       # write docs/categorized-docs.json
 *   node scripts/seed-docs.mjs --force-push # run db:push first, then seed
 *   node scripts/seed-docs.mjs --help       # show this message
 *
 * CATEGORIES
 *   feature        What the platform does (module overviews, capabilities)
 *   tutorial       Step-by-step how-to guides and installation walkthroughs
 *   faq            Questions & answers, quick-reference tables
 *   api_reference  REST endpoints, code samples, architecture, integrations
 */

import {
  readFileSync, readdirSync, statSync, writeFileSync, existsSync,
} from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ── Paths ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');
const DOCS_DIR   = join(ROOT, 'docs');

// ── CLI flags ────────────────────────────────────────────────────────────────

const DRY_RUN    = process.argv.includes('--dry-run');
const JSON_OUT   = process.argv.includes('--json');
const FORCE_PUSH = process.argv.includes('--force-push');
const SHOW_HELP  = process.argv.includes('--help') || process.argv.includes('-h');

if (SHOW_HELP) {
  console.log(`
  OVDS Docs Seed Pipeline
  ───────────────────────
  node scripts/seed-docs.mjs              Categorize + seed database
  node scripts/seed-docs.mjs --dry-run    Categorize + print (no DB writes)
  node scripts/seed-docs.mjs --json       Write docs/categorized-docs.json
  node scripts/seed-docs.mjs --force-push Run db:push then seed
  `);
  process.exit(0);
}

// ── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classify a markdown file into one of four doc categories.
 * Strategy: path rules first (highest confidence), then keyword scoring.
 *
 * @param {string} relPath   Path relative to docs/ e.g. "09-developers/API.md"
 * @param {string} content   Full file content
 * @returns {{ category: string, subcategory: string }}
 */
function classify(relPath, content) {
  const lower   = content.toLowerCase();
  const pathLow = relPath.toLowerCase().replace(/\\/g, '/');

  // 1. Explicit path-based rules — ordered by specificity
  const PATH_RULES = [
    { re: /09-developers\/api/,       cat: 'api_reference',  sub: 'REST API' },
    { re: /09-developers\/webhooks/,  cat: 'api_reference',  sub: 'Webhooks & Integrations' },
    { re: /09-developers\/agents/,    cat: 'api_reference',  sub: 'Developer Guide' },
    { re: /09-developers\/structure/, cat: 'api_reference',  sub: 'Developer Guide' },
    { re: /09-developers\/ui-enhance/,cat: 'api_reference',  sub: 'Developer Guide' },
    { re: /09-developers\/sidebar/,   cat: 'api_reference',  sub: 'Developer Guide' },
    { re: /09-developers/,            cat: 'api_reference',  sub: 'Developer Guide' },
    { re: /architecture/,             cat: 'api_reference',  sub: 'Architecture' },
    { re: /01-getting-started/,       cat: 'tutorial',       sub: 'Getting Started' },
    { re: /install/,                  cat: 'tutorial',       sub: 'Installation' },
    { re: /plesk-deploy/,             cat: 'tutorial',       sub: 'Deployment' },
    { re: /plesk-full/,               cat: 'tutorial',       sub: 'Deployment' },
    { re: /setup-cloud/,              cat: 'tutorial',       sub: 'Cloud Setup' },
    { re: /setup-on-premise/,         cat: 'tutorial',       sub: 'On-Premise Setup' },
    { re: /05-banking/,               cat: 'feature',        sub: 'Banking & Treasury' },
    { re: /06-tax/,                   cat: 'feature',        sub: 'Tax & Compliance' },
    { re: /07-reports/,               cat: 'feature',        sub: 'Reports & IFRS' },
    { re: /08-advanced/,              cat: 'feature',        sub: 'Advanced Features' },
    { re: /security/,                 cat: 'feature',        sub: 'Security' },
    { re: /10-frameworks/,            cat: 'feature',        sub: 'Compliance Frameworks' },
    { re: /02-users-roles/,           cat: 'feature',        sub: 'Users & Roles' },
    { re: /03-settings/,              cat: 'feature',        sub: 'Settings' },
    { re: /04-financial/,             cat: 'feature',        sub: 'Financial Operations' },
    { re: /readme/,                   cat: 'feature',        sub: 'Overview' },
    { re: /review/,                   cat: 'feature',        sub: 'Platform Overview' },
  ];

  for (const { re, cat, sub } of PATH_RULES) {
    if (re.test(pathLow)) return { category: cat, subcategory: sub };
  }

  // 2. Content keyword scoring
  const scores = { feature: 0, tutorial: 0, faq: 0, api_reference: 0 };

  // API reference signals
  const hasCodeBlock  = /```[\w]*/i.test(content);
  const hasHttpMethod = /`(GET|POST|PATCH|DELETE|PUT)\s+\/api\//i.test(content);
  if (hasHttpMethod) scores.api_reference += 10;
  if (hasCodeBlock)  scores.api_reference += 4;
  if (/(endpoint|request body|response schema|bearer token|swagger|openapi|webhook|sdk)/i.test(lower)) scores.api_reference += 3;
  if (/(status code|rate limit|pagination|curl|axios|fetch\()/i.test(lower)) scores.api_reference += 2;

  // Tutorial signals
  if (/(step \d|step-by-step|how to |getting started|setup guide|walkthrough|navigate to )/i.test(lower)) scores.tutorial += 6;
  if (/^#+\s*(step \d|install|configure|setup|deploy)/im.test(content)) scores.tutorial += 5;
  if (/(first invoice|first time|onboarding|wizard|click|select )/i.test(lower)) scores.tutorial += 3;

  // FAQ signals
  if (/^#+\s*(faq|frequently asked|q:|a:|common questions)/im.test(content)) scores.faq += 8;
  if (/\b(what is|how does|why is|when should|can i|do i need)\b/i.test(lower)) scores.faq += 4;
  if (/(quick reference|cheat sheet|summary table|key differences)/i.test(lower)) scores.faq += 3;

  // Feature signals
  if (/(module overview|feature overview|platform|capability|dashboard|navigation flow)/i.test(lower)) scores.feature += 3;
  if (/(permission|rbac|role|access level)/i.test(lower)) scores.feature += 2;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const category = sorted[0][1] > 0 ? sorted[0][0] : 'feature';

  // Derive subcategory from first H1 or H2 heading
  const headingMatch = content.match(/^#{1,2}\s+(.+)/m);
  const subcategory = headingMatch
    ? headingMatch[1].replace(/[*_`[\]]/g, '').trim().slice(0, 100)
    : 'General';

  return { category, subcategory };
}

// ── Text helpers ──────────────────────────────────────────────────────────────

/** Extract first ~250 chars of body text as a plain-text summary. */
function extractSummary(content) {
  const bodyLines = content
    .split('\n')
    .filter(l => !l.startsWith('#') && !l.startsWith('```') && l.trim().length > 25);
  const plain = bodyLines.slice(0, 4).join(' ')
    .replace(/[*_`[\]()>|!]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 250) || null;
}

/** Extract tags from headings and known domain keywords. */
function extractTags(content, category, subcategory) {
  const tags = new Set([category]);
  if (subcategory) tags.add(subcategory.toLowerCase().replace(/[^a-z0-9 &-]/g, '').trim());

  const KEYWORDS = [
    'vat','tax','payroll','invoice','employee','auth','api','rbac','ifrs',
    'audit','bank','reconciliation','report','dashboard','crm','inventory',
    'purchase order','expense','webhook','jwt','prisma','nestjs','react',
    'typescript','budget','iot','etax','erca','pension','compliance',
    'setup','installation','deployment','plesk','docker',
  ];
  const lower = content.toLowerCase();
  KEYWORDS.forEach(kw => { if (lower.includes(kw)) tags.add(kw); });

  return JSON.stringify([...tags].slice(0, 15));
}

/** Convert a relative file path into a URL-safe slug. */
function makeSlug(relPath) {
  return relPath
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\//g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

// ── File exclusions ───────────────────────────────────────────────────────────
// Files and patterns to skip during seeding.
// Add filenames (basename only) or regex patterns to exclude scratch notes,
// generated artifacts, or work-in-progress files from the docs portal.

const EXCLUDED_BASENAMES = new Set([
  'categorized-docs.json',
  'extracted-module-docs.json',
  'organize the content into the three cate.md', // scratch note
  // Generated by scripts/generate-schema-docs.mjs. It is a ~470 KB machine-generated
  // reference for 300+ Prisma models — valuable as a git-diffable file (schema changes
  // show up in PR review) but far too large to serve as a single portal article.
  'DATA-MODEL.md',
  'schema-model-graph.json',
]);

const EXCLUDED_PATTERNS = [
  /^categorized-docs/i,
  /^extracted-module-docs/i,
  /organize.+three.+cate/i,   // scratch note pattern
  /^data-model\.md$/i,        // generated Prisma reference (see note above)
  /^schema-model-graph/i,     // generated Prisma model graph
];

function isExcluded(relPath) {
  const base = basename(relPath);
  if (EXCLUDED_BASENAMES.has(base)) return true;
  if (EXCLUDED_PATTERNS.some(re => re.test(base))) return true;
  return false;
}

// ── File discovery ────────────────────────────────────────────────────────────

function collectMarkdown(dir, base = '') {
  const results = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return results; }

  for (const entry of entries.sort()) {
    const full = join(dir, entry);
    const rel  = base ? `${base}/${entry}` : entry;
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectMarkdown(full, rel));
    } else if (extname(entry).toLowerCase() === '.md') {
      results.push({ full, rel });
    }
  }
  return results;
}

// ── Article builder ───────────────────────────────────────────────────────────

function buildArticles() {
  if (!existsSync(DOCS_DIR)) {
    console.error(`❌  docs/ directory not found at: ${DOCS_DIR}`);
    process.exit(1);
  }

  const files    = collectMarkdown(DOCS_DIR);
  const articles = [];
  let   order    = 0;

  for (const { full, rel } of files) {
    // Skip excluded files (scratch notes, generated artifacts)
    if (isExcluded(rel)) {
      if (DRY_RUN) console.log(`  ⊘  Excluded: ${rel}`);
      continue;
    }

    let content;
    try { content = readFileSync(full, 'utf-8'); }
    catch { console.warn(`  ⚠  Cannot read ${rel} — skipped`); continue; }

    if (content.trim().length < 60) continue; // skip near-empty stubs

    const { category, subcategory } = classify(rel, content);

    const h1 = content.match(/^#\s+(.+)/m);
    const title = h1
      ? h1[1].replace(/[*_`[\]]/g, '').trim().slice(0, 299)
      : basename(rel, '.md').replace(/[-_]/g, ' ');

    articles.push({
      slug:        makeSlug(rel),
      title,
      category,
      subcategory: subcategory?.slice(0, 99) ?? null,
      summary:     extractSummary(content),
      content,
      tags:        extractTags(content, category, subcategory),
      sortOrder:   order++,
      isPublished: true,
    });
  }

  return articles;
}

// ── Progress bar helper ───────────────────────────────────────────────────────

function progress(current, total, label = '') {
  const pct   = Math.round((current / total) * 100);
  const filled = Math.round(pct / 5);
  const bar   = '█'.repeat(filled) + '░'.repeat(20 - filled);
  process.stdout.write(`\r  [${bar}] ${pct}%  ${label.slice(0, 40).padEnd(40)}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📚  OVDS Documentation Categorization Pipeline\n');

  // Optional: push schema first
  if (FORCE_PUSH) {
    console.log('  ⏳  Running db:push …');
    try {
      execSync('npm run db:push', { cwd: ROOT, stdio: 'inherit' });
      console.log('  ✅  db:push complete\n');
    } catch {
      console.error('  ❌  db:push failed — aborting');
      process.exit(1);
    }
  }

  const articles = buildArticles();

  if (articles.length === 0) {
    console.error('  ❌  No markdown articles found in docs/');
    process.exit(1);
  }

  // Category breakdown
  const byCategory = articles.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`  Found ${articles.length} articles:\n`);
  const ICONS = { feature: '⭐', tutorial: '📖', faq: '❓', api_reference: '🔌' };
  Object.entries(byCategory).sort().forEach(([cat, n]) =>
    console.log(`    ${(ICONS[cat] || '•')}  ${cat.padEnd(14)} ${n}`)
  );
  console.log();

  // ── JSON output ─────────────────────────────────────────────────────────────
  if (JSON_OUT) {
    const out = join(DOCS_DIR, 'categorized-docs.json');
    writeFileSync(out, JSON.stringify(articles, null, 2), 'utf-8');
    console.log(`  ✅  Written to ${out}\n`);
    return;
  }

  // ── Dry-run ──────────────────────────────────────────────────────────────────
  if (DRY_RUN) {
    articles.forEach(a =>
      console.log(`  [${a.category.padEnd(13)}] (${(a.subcategory || '').padEnd(30)}) ${a.title}`)
    );
    console.log('\n  ✅  Dry-run complete — no database writes.\n');
    return;
  }

  // ── Database seed ─────────────────────────────────────────────────────────────
  let PrismaClient;
  try {
    // Try workspace-hoisted client first, then scoped package
    const mod = await import('@prisma/client').catch(() => import('@ovds/database'));
    PrismaClient = mod.PrismaClient;
  } catch {
    console.error(
      '\n  ❌  Cannot import PrismaClient.\n' +
      '      Run `npm run db:generate` to generate the Prisma client, then retry.\n' +
      '      Or use --json to export without a DB connection.\n'
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
      progress(i + 1, articles.length, a.title);
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
        // Print error below the progress bar
        process.stdout.write('\n');
        console.warn(`  ⚠  Failed to upsert "${a.slug}": ${err.message}`);
      }
    }

    process.stdout.write('\n\n');
    console.log(`  ✅  Done — ${created} created, ${updated} updated${failed ? `, ${failed} failed` : ''}.\n`);

  } catch (err) {
    process.stdout.write('\n');
    if (err.message?.includes('does not exist') || err.code === 'P2021') {
      console.error(
        '\n  ❌  Table `doc_article` not found in database.\n' +
        '      Run `npm run docs:setup` (db:push + seed) or `npm run db:push` first.\n'
      );
    } else {
      console.error(`\n  ❌  Database error: ${err.message}\n`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch(err => {
  console.error(`\n  ❌  Unexpected error: ${err.message}\n`);
  process.exit(1);
});
