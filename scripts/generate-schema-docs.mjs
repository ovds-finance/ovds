#!/usr/bin/env node
/**
 * generate-schema-docs.mjs — Prisma schema → Markdown data-model reference
 *
 * Parses packages/database/prisma/schema.prisma and emits a single, deterministic
 * Markdown reference at docs/09-developers/DATA-MODEL.md describing every model,
 * enum, relation and index — plus a multi-tenancy audit of `companyId` coverage.
 *
 * Why not `prisma-docs-generator`?
 *   • Zero new dependencies and no `prisma generate` run (no DB, no engine download).
 *   • Output is Markdown, so it flows through the existing docs pipeline
 *     (seed-docs.mjs → doc_article → /docs portal) instead of a separate site.
 *   • Deterministic output (fingerprint, not timestamp) so `--check` works in CI.
 *
 * USAGE
 *   node scripts/generate-schema-docs.mjs             # write the Markdown reference
 *   node scripts/generate-schema-docs.mjs --check     # CI gate: fail if out of date
 *   node scripts/generate-schema-docs.mjs --json      # emit machine-readable model graph
 *   node scripts/generate-schema-docs.mjs --stdout    # print Markdown, write nothing
 *   node scripts/generate-schema-docs.mjs --help
 *
 * EXIT CODES
 *   0  success (or --check passed)
 *   1  unexpected failure (schema missing / parse error)
 *   2  --check failed: DATA-MODEL.md is stale, re-run the generator
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const SCHEMA_PATH = join(ROOT, 'packages', 'database', 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = join(ROOT, 'packages', 'database', 'prisma', 'migrations');
const OUT_PATH = join(ROOT, 'docs', '09-developers', 'DATA-MODEL.md');
const JSON_OUT_PATH = join(ROOT, 'docs', 'schema-model-graph.json');

const CHECK = process.argv.includes('--check');
const JSON_OUT = process.argv.includes('--json');
const STDOUT = process.argv.includes('--stdout');
const HELP = process.argv.includes('--help') || process.argv.includes('-h');

if (HELP) {
  console.log(`
  OVDS Prisma Schema → Docs Generator
  ───────────────────────────────────
  node scripts/generate-schema-docs.mjs           Write docs/09-developers/DATA-MODEL.md
  node scripts/generate-schema-docs.mjs --check   CI gate: exit 2 if the doc is stale
  node scripts/generate-schema-docs.mjs --json    Also write docs/schema-model-graph.json
  node scripts/generate-schema-docs.mjs --stdout  Print Markdown to stdout only
  `);
  process.exit(0);
}

// ── Prisma scalar types ───────────────────────────────────────────────────────

const SCALARS = new Set([
  'String', 'Boolean', 'Int', 'BigInt', 'Float', 'Decimal',
  'DateTime', 'Json', 'Bytes', 'Unsupported',
]);

// ── Block extraction ──────────────────────────────────────────────────────────

/**
 * Split a Prisma schema into top-level blocks, preserving the `///` doc comments
 * that immediately precede each block.
 *
 * @param {string} source Raw schema.prisma contents
 * @returns {Array<{kind:string,name:string,body:string[],docs:string[]}>}
 */
function extractBlocks(source) {
  const lines = source.split(/\r?\n/);
  const blocks = [];
  let docs = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Doc comments attach to the next block.
    if (trimmed.startsWith('///')) {
      docs.push(trimmed.replace(/^\/\/\/\s?/, '').trim());
      i += 1;
      continue;
    }

    // Plain comments and blank lines reset the pending doc buffer.
    if (trimmed === '' || trimmed.startsWith('//')) {
      if (trimmed === '') docs = [];
      i += 1;
      continue;
    }

    const open = trimmed.match(/^(model|enum|type|view|datasource|generator)\s+([A-Za-z_][\w]*)\s*\{$/);
    if (!open) {
      docs = [];
      i += 1;
      continue;
    }

    const [, kind, name] = open;
    const body = [];
    i += 1;
    let depth = 1;

    while (i < lines.length && depth > 0) {
      const inner = lines[i];
      const innerTrimmed = inner.trim();
      if (innerTrimmed === '}') {
        depth -= 1;
        if (depth === 0) { i += 1; break; }
      }
      body.push(inner);
      i += 1;
    }

    blocks.push({ kind, name, body, docs });
    docs = [];
  }

  return blocks;
}

// ── Field parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a model body into fields and block-level attributes.
 *
 * @param {string[]} body Lines inside a `model { ... }` block
 */
function parseModelBody(body) {
  const fields = [];
  const blockAttrs = [];
  let docs = [];

  for (const raw of body) {
    const line = raw.trim();
    if (line === '') { docs = []; continue; }

    if (line.startsWith('///')) {
      docs.push(line.replace(/^\/\/\/\s?/, '').trim());
      continue;
    }
    if (line.startsWith('//')) continue;

    if (line.startsWith('@@')) {
      blockAttrs.push(line);
      docs = [];
      continue;
    }

    const m = line.match(/^([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*(?:\[\])?\??)\s*(.*)$/);
    if (!m) { docs = []; continue; }

    const [, name, rawType, attrText] = m;
    const isList = rawType.endsWith('[]');
    const optional = rawType.endsWith('?');
    const type = rawType.replace(/\[\]$/, '').replace(/\?$/, '');

    fields.push({
      name,
      type,
      isList,
      optional,
      attrs: (attrText || '').trim(),
      docs: docs.slice(),
    });
    docs = [];
  }

  return { fields, blockAttrs };
}

/** Pull the mapped table name out of `@@map("...")`. */
function tableNameOf(blockAttrs, fallback) {
  for (const attr of blockAttrs) {
    const m = attr.match(/^@@map\("([^"]+)"\)/);
    if (m) return m[1];
  }
  return fallback;
}

/** Collect `@@index`, `@@unique`, `@@id` field lists. */
function indexesOf(blockAttrs) {
  const out = { indexes: [], uniques: [], compositeId: null };
  for (const attr of blockAttrs) {
    const idx = attr.match(/^@@index\(\[([^\]]+)\]/);
    if (idx) { out.indexes.push(splitList(idx[1])); continue; }
    const uni = attr.match(/^@@unique\(\[([^\]]+)\]/);
    if (uni) { out.uniques.push(splitList(uni[1])); continue; }
    const id = attr.match(/^@@id\(\[([^\]]+)\]/);
    if (id) out.compositeId = splitList(id[1]);
  }
  return out;
}

function splitList(s) {
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

/** Extract the relation name / fields / references from an `@relation(...)` attribute. */
function relationInfoOf(attrs) {
  const m = attrs.match(/@relation\(([^)]*)\)/);
  if (!m) return null;
  const inner = m[1];
  const nameMatch = inner.match(/^\s*"([^"]+)"/);
  const fieldsMatch = inner.match(/fields:\s*\[([^\]]+)\]/);
  const refsMatch = inner.match(/references:\s*\[([^\]]+)\]/);
  const onDelete = inner.match(/onDelete:\s*(\w+)/);
  return {
    name: nameMatch ? nameMatch[1] : null,
    fields: fieldsMatch ? splitList(fieldsMatch[1]) : [],
    references: refsMatch ? splitList(refsMatch[1]) : [],
    onDelete: onDelete ? onDelete[1] : null,
  };
}

// ── Schema model ──────────────────────────────────────────────────────────────

function buildSchemaModel(source) {
  const blocks = extractBlocks(source);

  const datasource = blocks.find(b => b.kind === 'datasource') || null;
  const generators = blocks.filter(b => b.kind === 'generator');
  const enumBlocks = blocks.filter(b => b.kind === 'enum');
  const modelBlocks = blocks.filter(b => b.kind === 'model');

  const enumNames = new Set(enumBlocks.map(b => b.name));
  const modelNames = new Set(modelBlocks.map(b => b.name));

  const enums = enumBlocks.map(b => ({
    name: b.name,
    docs: b.docs,
    values: b.body
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//') && !l.startsWith('@@'))
      .map(l => l.split(/\s+/)[0]),
  })).sort((a, b) => a.name.localeCompare(b.name));

  const models = modelBlocks.map(b => {
    const { fields, blockAttrs } = parseModelBody(b.body);
    const { indexes, uniques, compositeId } = indexesOf(blockAttrs);

    const enriched = fields.map(f => {
      let kind = 'scalar';
      if (modelNames.has(f.type)) kind = 'relation';
      else if (enumNames.has(f.type)) kind = 'enum';
      else if (!SCALARS.has(f.type)) kind = 'unknown';

      return { ...f, kind, relation: kind === 'relation' ? relationInfoOf(f.attrs) : null };
    });

    const scalarFields = enriched.filter(f => f.kind !== 'relation');
    const relationFields = enriched.filter(f => f.kind === 'relation');
    const fieldNames = new Set(enriched.map(f => f.name));

    const hasCompanyId = fieldNames.has('companyId');
    const companyIdIndexed =
      indexes.some(ix => ix[0] === 'companyId') ||
      uniques.some(ix => ix[0] === 'companyId');

    return {
      name: b.name,
      docs: b.docs,
      table: tableNameOf(blockAttrs, b.name),
      fields: enriched,
      scalarFields,
      relationFields,
      indexes,
      uniques,
      compositeId,
      hasCompanyId,
      companyIdIndexed,
      hasTimestamps: fieldNames.has('createdAt') && fieldNames.has('updatedAt'),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Inbound relation map: which models point at me.
  const inbound = new Map(models.map(m => [m.name, []]));
  for (const m of models) {
    for (const rf of m.relationFields) {
      if (!inbound.has(rf.type)) continue;
      inbound.get(rf.type).push({ from: m.name, field: rf.name, isList: rf.isList });
    }
  }

  return {
    provider: datasource
      ? (datasource.body.join('\n').match(/provider\s*=\s*"([^"]+)"/) || [, 'unknown'])[1]
      : 'unknown',
    datasourceName: datasource ? datasource.name : null,
    generators: generators.map(g => ({
      name: g.name,
      provider: (g.body.join('\n').match(/provider\s*=\s*"([^"]+)"/) || [, 'unknown'])[1],
      output: (g.body.join('\n').match(/output\s*=\s*"([^"]+)"/) || [, null])[1],
      docs: g.docs,
    })),
    enums,
    models,
    inbound,
  };
}

// ── Markdown rendering ────────────────────────────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s).replace(/\|/g, '\\|');
}

/** Compact, human-readable type label e.g. `String?`, `Invoice[]`. */
function typeLabel(f) {
  return `${f.type}${f.isList ? '[]' : ''}${f.optional ? '?' : ''}`;
}

/** Strip `@relation(...)` down to the noise-free attribute list. */
function attrLabel(f) {
  if (!f.attrs) return '';
  return f.attrs
    .replace(/@relation\([^)]*\)/g, '@relation')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) return 0;
  try {
    return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory()).length;
  } catch {
    return 0;
  }
}

function renderMarkdown(schema, fingerprint) {
  const L = [];
  const p = (s = '') => L.push(s);

  const tenantModels = schema.models.filter(m => m.hasCompanyId);
  const globalModels = schema.models.filter(m => !m.hasCompanyId);
  const unindexedTenant = tenantModels.filter(m => !m.companyIdIndexed);
  const migrationCount = countMigrations();
  const schemaRel = relative(ROOT, SCHEMA_PATH).replace(/\\/g, '/');

  // Reference block — matches the convention used across docs/.
  p('<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)');
  p('     📌 ARCHITECTURE: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)');
  p('     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)');
  p('     ⚙️ GENERATED FILE — do not edit by hand. -->');
  p();
  p('# Data Model Reference');
  p();
  p('> **Generated file — do not edit.**');
  p('> Source of truth: [`' + schemaRel + '`](../../' + schemaRel + ')');
  p('> Regenerate with `npm run docs:schema`. CI verifies freshness with `npm run docs:schema:check`.');
  p();
  p(`**Schema fingerprint:** \`${fingerprint}\``);
  p();
  p('---');
  p();

  // ── Overview ───────────────────────────────────────────────────────────────
  p('## 1. Overview');
  p();
  p('| Property | Value |');
  p('|----------|-------|');
  p(`| Datasource provider | \`${schema.provider}\` |`);
  p(`| Models | ${schema.models.length} |`);
  p(`| Enums | ${schema.enums.length} |`);
  p(`| Migrations applied to history | ${migrationCount} |`);
  p(`| Tenant-scoped models (\`companyId\`) | ${tenantModels.length} |`);
  p(`| Global / shared models | ${globalModels.length} |`);
  p();
  p('The datasource URL is supplied at runtime through `PRISMA_DATABASE_URL` and the');
  p('`@prisma/adapter-mariadb` driver adapter — it is deliberately absent from the schema.');
  p();
  p('### Generators');
  p();
  p('| Generator | Provider | Output |');
  p('|-----------|----------|--------|');
  for (const g of schema.generators) {
    p(`| \`${g.name}\` | \`${g.provider}\` | ${g.output ? '`' + g.output + '`' : 'default'} |`);
  }
  p();
  p('---');
  p();

  // ── Multi-tenancy audit ────────────────────────────────────────────────────
  p('## 2. Multi-tenancy audit');
  p();
  p('OVDS isolates tenants with `companyId` + `CompanyGuard`. Every query against a');
  p('tenant-scoped model **must** filter on `companyId`. This section is generated');
  p('directly from the schema so drift is visible in review.');
  p();
  if (unindexedTenant.length === 0) {
    p('✅ Every model carrying `companyId` also declares an index whose first column is `companyId`.');
  } else {
    p(`⚠️ **${unindexedTenant.length} model(s) carry \`companyId\` without a leading \`companyId\` index.**`);
    p('Tenant-filtered reads on these tables cannot use an index prefix and will degrade as data grows.');
    p();
    p('| Model | Table | Existing indexes |');
    p('|-------|-------|------------------|');
    for (const m of unindexedTenant) {
      const ix = m.indexes.length
        ? m.indexes.map(i => '`[' + i.join(', ') + ']`').join(', ')
        : '_none_';
      p(`| \`${m.name}\` | \`${m.table}\` | ${ix} |`);
    }
  }
  p();
  p('### Global (non-tenant) models');
  p();
  p('These models have no `companyId`. Confirm each is genuinely cross-tenant');
  p('(reference data, platform config, or audit) before querying it in tenant code.');
  p();
  p(globalModels.length ? globalModels.map(m => '`' + m.name + '`').join(' · ') : '_none_');
  p();
  p('---');
  p();

  // ── Model index ────────────────────────────────────────────────────────────
  p('## 3. Model index');
  p();
  p('| Model | Table | Tenant | Fields | Relations | Indexes | Timestamps |');
  p('|-------|-------|--------|-------:|----------:|--------:|------------|');
  for (const m of schema.models) {
    p([
      '',
      `[\`${m.name}\`](#${anchor(m.name)})`,
      '`' + m.table + '`',
      m.hasCompanyId ? '✅' : '—',
      String(m.scalarFields.length),
      String(m.relationFields.length),
      String(m.indexes.length + m.uniques.length),
      m.hasTimestamps ? '✅' : '—',
      '',
    ].join(' | ').trim());
  }
  p();
  p('---');
  p();

  // ── Enums ──────────────────────────────────────────────────────────────────
  p('## 4. Enum reference');
  p();
  if (schema.enums.length === 0) {
    p('_No enums declared._');
  } else {
    p('| Enum | Values |');
    p('|------|--------|');
    for (const e of schema.enums) {
      p(`| \`${e.name}\` | ${e.values.map(v => '`' + v + '`').join(' · ')} |`);
    }
  }
  p();
  p('---');
  p();

  // ── Model detail ───────────────────────────────────────────────────────────
  p('## 5. Models');
  p();
  for (const m of schema.models) {
    p(`### ${m.name}`);
    p();
    if (m.docs.length) { p(m.docs.join(' ')); p(); }

    const meta = [`Table \`${m.table}\``];
    meta.push(m.hasCompanyId ? 'tenant-scoped' : 'global');
    if (m.compositeId) meta.push(`composite id \`[${m.compositeId.join(', ')}]\``);
    p('_' + meta.join(' · ') + '_');
    p();

    // Scalar + enum fields
    p('| Field | Type | Attributes | Notes |');
    p('|-------|------|------------|-------|');
    for (const f of m.scalarFields) {
      p(`| \`${f.name}\` | \`${typeLabel(f)}\` | ${esc(attrLabel(f)) || '—'} | ${esc(f.docs.join(' ')) || '—'} |`);
    }
    p();

    // Relations out
    if (m.relationFields.length) {
      p('**Relations**');
      p();
      p('| Field | Target | Cardinality | Foreign key | On delete |');
      p('|-------|--------|-------------|-------------|-----------|');
      for (const f of m.relationFields) {
        const rel = f.relation || {};
        const card = f.isList ? 'many' : (f.optional ? 'optional one' : 'one');
        const fk = rel.fields && rel.fields.length
          ? '`' + rel.fields.join(', ') + '` → `' + (rel.references || []).join(', ') + '`'
          : '_back-reference_';
        p(`| \`${f.name}\` | [\`${f.type}\`](#${anchor(f.type)}) | ${card} | ${fk} | ${rel.onDelete || '—'} |`);
      }
      p();
    }

    // Referenced by
    const refs = schema.inbound.get(m.name) || [];
    if (refs.length) {
      p('**Referenced by:** ' + refs
        .map(r => `[\`${r.from}\`](#${anchor(r.from)}).\`${r.field}\``)
        .join(' · '));
      p();
    }

    // Indexes
    if (m.indexes.length || m.uniques.length) {
      p('**Indexes**');
      p();
      for (const u of m.uniques) p(`- unique \`[${u.join(', ')}]\``);
      for (const i of m.indexes) p(`- index \`[${i.join(', ')}]\``);
      p();
    }
  }

  p('---');
  p();
  p('## 6. How to change the data model');
  p();
  p('1. Edit `' + schemaRel + '`.');
  p('2. `npm run db:migrate:dev` — creates a migration in `packages/database/prisma/migrations/`.');
  p('3. `npm run db:generate` — regenerates the Prisma client.');
  p('4. `npm run db:generate:zod` — regenerates `@ovds/contracts` Zod schemas.');
  p('5. `npm run docs:schema` — regenerates this file.');
  p();
  p('The full checklist, including production rollout and rollback, lives in');
  p('[UPGRADING.md](./UPGRADING.md#3-prisma-database-migrations).');
  p();

  return L.join('\n') + '\n';
}

/** GitHub-style heading anchor. */
function anchor(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`✖ schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const source = readFileSync(SCHEMA_PATH, 'utf8');
  const fingerprint = createHash('sha256').update(source).digest('hex').slice(0, 12);

  let schema;
  try {
    schema = buildSchemaModel(source);
  } catch (err) {
    console.error('✖ failed to parse schema:', err.message);
    process.exit(1);
  }

  if (schema.models.length === 0) {
    console.error('✖ parsed 0 models — refusing to write an empty reference');
    process.exit(1);
  }

  const markdown = renderMarkdown(schema, fingerprint);

  if (STDOUT) {
    process.stdout.write(markdown);
    return;
  }

  if (CHECK) {
    if (!existsSync(OUT_PATH)) {
      console.error('✖ DATA-MODEL.md is missing. Run: npm run docs:schema');
      process.exit(2);
    }
    const current = readFileSync(OUT_PATH, 'utf8');
    if (normalize(current) !== normalize(markdown)) {
      console.error('✖ DATA-MODEL.md is out of date with schema.prisma.');
      console.error('  Run: npm run docs:schema   (then commit the result)');
      process.exit(2);
    }
    console.log(`✔ DATA-MODEL.md is in sync (${schema.models.length} models, fingerprint ${fingerprint})`);
    return;
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, markdown, 'utf8');

  const tenant = schema.models.filter(m => m.hasCompanyId);
  const unindexed = tenant.filter(m => !m.companyIdIndexed);

  console.log(`✔ wrote ${relative(ROOT, OUT_PATH).replace(/\\/g, '/')}`);
  console.log(`  models=${schema.models.length} enums=${schema.enums.length} fingerprint=${fingerprint}`);
  console.log(`  tenant-scoped=${tenant.length} missing companyId index=${unindexed.length}`);

  if (JSON_OUT) {
    const graph = {
      fingerprint,
      provider: schema.provider,
      generators: schema.generators,
      enums: schema.enums,
      models: schema.models.map(m => ({
        name: m.name,
        table: m.table,
        hasCompanyId: m.hasCompanyId,
        companyIdIndexed: m.companyIdIndexed,
        hasTimestamps: m.hasTimestamps,
        indexes: m.indexes,
        uniques: m.uniques,
        fields: m.fields.map(f => ({
          name: f.name, type: f.type, kind: f.kind,
          isList: f.isList, optional: f.optional,
        })),
      })),
    };
    writeFileSync(JSON_OUT_PATH, JSON.stringify(graph, null, 2), 'utf8');
    console.log(`✔ wrote ${relative(ROOT, JSON_OUT_PATH).replace(/\\/g, '/')}`);
  }
}

/** Ignore trailing-whitespace / EOL differences when diffing generated output. */
function normalize(s) {
  return s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();
}

main();
