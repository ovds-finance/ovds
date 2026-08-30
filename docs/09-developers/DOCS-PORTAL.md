<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Documentation Portal — Developer Guide

The OVDS documentation portal is a **public, unauthenticated** knowledge base at `/docs` (alias `/kb`).  
It is powered by a three-layer pipeline: two extraction scripts, a NestJS API, and a React SPA page.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SOURCE CONTENT                               │
│                                                                      │
│  docs/*.md (29 files) ──────────────────────────────┐               │
│                                                      │               │
│  apps/backend/src/**/*.controller.ts (63 files) ─┐  │               │
│  apps/frontend/src/pages/*.tsx       (119 files) ─┤  ▼              │
│  apps/frontend/src/pages/apiDocs.tsx  (16 groups)─┤                 │
│  Controller exception patterns        (16 FAQs)  ─┤─▶  doc_article  │
│  Page workflow patterns               (15 tutorials)┘   (MySQL)     │
└──────────────────────────────────────────────────────────────────────┘
         │  258 articles total
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  scripts/docs-ci.mjs  (CI orchestrator)                 │
  │    Phase 1 → seed-docs.mjs          (static markdown)   │
  │    Phase 2 → extract-module-docs.mjs (live code)        │
  │    Phase 3 → POST /api/docs/admin/flush-cache           │
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  GET /api/docs/*  (NestJS, @Public(), @UseGuards(DocsGuard), rate-limited, cached)
         │
         ▼
  /docs  (React SPA, Fuse.js, dark mode, module browser, no auth)
```

---

## 1. Quick Start

```bash
# First-time setup: push DB schema + seed everything
npm run docs:full

# Already set up — re-extract after code changes
npm run docs:update

# Preview what will be extracted (no DB writes)
npm run seed:docs:dry
npm run docs:extract:dry
```

---

## 2. NPM Scripts Reference

| Script | What it does |
|--------|-------------|
| `npm run docs:full` | `db:push` + seed static docs + extract live modules |
| `npm run docs:update` | Re-seed static docs + re-extract live modules (no db:push) |
| `npm run docs:setup` | `db:push` + seed static markdown docs only |
| `npm run seed:docs` | Seed `docs/*.md` into `doc_article` table |
| `npm run seed:docs:dry` | Print classifications, no DB writes |
| `npm run seed:docs:json` | Write `docs/categorized-docs.json` |
| `npm run docs:extract` | Extract from live controllers + pages → DB |
| `npm run docs:extract:dry` | Print what would be extracted, no DB writes |
| `npm run docs:extract:json` | Write `docs/extracted-module-docs.json` |
| `npm run docs:ci` | Full CI pipeline (seed + extract, structured output) |
| `npm run docs:ci:dry` | Dry-run: classify + print, no DB writes |
| `npm run docs:ci:json` | JSON export only |
| `npm run docs:ci:flush` | Full pipeline + POST cache flush |

---

## 3. Pipeline 1 — Static Markdown (`scripts/seed-docs.mjs`)

Reads every `.md` file under `docs/` and classifies each into one of four categories.

### Categories

| Category | Signals |
|---|---|
| `feature` | Module overviews, navigation flows, capability descriptions |
| `tutorial` | Step-by-step guides, installation, deployment walkthroughs |
| `faq` | Q&A headings, "What is…" patterns, quick-reference tables |
| `api_reference` | REST endpoint tables, code blocks, architecture diagrams |

### Classification order
1. **Path rules** — `09-developers/API.md` → `api_reference`, `01-getting-started/` → `tutorial`, etc.
2. **Keyword scoring** — weighted signals per category (HTTP methods, step indicators, Q&A patterns)
3. **Fallback** — `feature`

### Adding new static docs
1. Create a `.md` file anywhere under `docs/`
2. Run `npm run docs:update` to upsert it

---

## 4. Pipeline 2 — Live Module Extractor (`scripts/extract-module-docs.mjs`)

Reads live application source code and auto-generates documentation from actual modules.

### What it extracts

**Phase 1 — Backend controllers (62 articles)**  
Parses every `*.controller.ts` under `apps/backend/src/`. Extracts:
- `@ApiTags('...')` → module name
- `@Controller('...')` → base API path  
- `@ApiOperation({ summary: '...' })` → endpoint description
- `@Permissions('x:y')` / `@Roles(...)` → access requirements
- HTTP method decorators → `GET /api/...`

Each controller becomes one `api_reference` article with a full endpoint table.

**Phase 2 — Frontend pages (114 articles)**  
Parses every `*.tsx` under `apps/frontend/src/pages/`. Extracts:
- JSDoc block comment → module description
- `usePageTitle('...')` → article title
- `AppKpi` / `AppTabs` label strings → feature list
- `toast.success('...')` → action confirmation hints
- `confirm('...')` → destructive action warnings

Each page becomes one `feature` article describing what the module does.

**Phase 3 — `apiDocs.tsx` groups (16 articles)**  
Parses the hardcoded `endpointGroups` array in `apps/frontend/src/pages/apiDocs.tsx`.  
Each group (Authentication, Employees, ovds, etc.) → one `api_reference` article.

**Phase 4 — FAQ from exception patterns (16 articles)**  
Scans controllers for `NotFoundException`, `BadRequestException`, `ForbiddenException` messages and `@Roles`/`@Permissions` requirements. Generates one FAQ article per domain area:
- HR & Payroll, ovds & Accounting, Tax & Compliance, Authentication & Security, Banking & Treasury

**Phase 5 — Tutorial workflows (15 articles)**  
Generates step-by-step tutorial articles for 15 key workflows by scanning corresponding page files:
- How to Create an Invoice, File VAT Return, Run Payroll, Reconcile Bank Statement, etc.

### Slug namespacing

All extracted articles use prefixed slugs to avoid collisions with static markdown:

| Prefix | Source |
|---|---|
| `module-api-*` | Backend controllers |
| `module-page-*` | Frontend pages |
| `module-apidocs-*` | apiDocs.tsx groups |
| `module-faq-*` | FAQ articles |
| `module-tutorial-*` | Tutorial articles |

---

## 5. Backend API (`/api/docs`)

All endpoints are:
- **`@Public()`** — no JWT required, no session cookies checked
- **GET only** — zero mutation endpoints (except the CI admin flush)
- **`@UseGuards(DocsGuard)`** — method gate + UA screening on every route
- **Rate-limited** — 30–60 req/min per IP via `@Throttle()`
- **60 s in-memory TTL cache** + `Cache-Control: public, max-age=60` header

### Endpoint reference

| Method | Path | Rate limit | Description |
|--------|------|-----------|-------------|
| `GET` | `/api/docs` | 60/min | List articles (paginated, filterable) |
| `GET` | `/api/docs/nav` | 60/min | Category/subcategory navigation tree |
| `GET` | `/api/docs/tags` | 60/min | All distinct tags for faceted search |
| `GET` | `/api/docs/search?q=vat` | 30/min | Full-text search across title/summary/tags |
| `GET` | `/api/docs/modules` | 60/min | Article counts grouped by subcategory |
| `GET` | `/api/docs/category/:name` | 60/min | Shortcut: list by category name |
| `GET` | `/api/docs/:slug` | 60/min | Single article with full Markdown content |
| `POST` | `/api/docs/admin/flush-cache` | 5/min | CI/CD cache invalidation (token-gated) |

### Query params for `GET /api/docs`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | `feature\|tutorial\|faq\|api_reference` | — | Filter by category |
| `subcategory` | string | — | Partial match on subcategory name |
| `search` | string | — | Full-text across title/summary/subcategory/tags |
| `page` | number | 1 | 1-based page number |
| `take` | number | 20 | Page size (max 100) |

### Security guarantees

- `DocsService.db` only accesses the `doc_article` table — no joins to `user`, `company`, or any financial table
- Search input sanitised: strips `%`, `_`, `\`, `'`, `"`, `;`, `<`, `>` — caps at 100 chars
- Slug validated with `/^[a-z0-9][a-z0-9-]{0,198}[a-z0-9]$/` before any DB lookup
- Full `content` (Markdown) is **never included** in list responses — only in `GET /api/docs/:slug`

### `docs.guard.ts` — DocsGuard

Applied via `@UseGuards(DocsGuard)` on `DocsController`. Runs after the global `ThrottlerGuard`.

| Check | Behaviour |
|---|---|
| Non-allowed HTTP method | `405 Method Not Allowed` |
| POST to any path except `admin/flush-cache` | `405 Method Not Allowed` |
| Query string > 1 KB | `413 Payload Too Large` |
| Known scanner User-Agent (zgrab, nikto, sqlmap, masscan…) | `403 Forbidden` |

The guard does **not** enforce authentication (that is `@Public()` + `AnyAuthGuard`'s responsibility). It only adds method-gating and request-shape validation scoped to the `/docs` route tree.

---

## 6. Frontend Portal (`/docs`)

**File:** `apps/frontend/src/pages/docsPortal.tsx`  
**Routes:** `/docs`, `/docs#slug` (hash deep-link), `/kb` → redirects to `/docs`

### Features

| Feature | Detail |
|---------|--------|
| Dark mode toggle | Persists to `document.documentElement.classList` |
| Sticky navbar | Matches Landing page brand (OVDS logo, Sign In, Get Started) |
| Hero banner | Emerald gradient with embedded search |
| Module browser | Grid of subcategory cards from `/api/docs/modules` — homepage only |
| Category tabs | All / Features / Tutorials / FAQ / API Reference |
| Sidebar nav tree | From `/api/docs/nav` — grouped by category |
| Tag cloud | From `/api/docs/tags` — click to filter |
| Filter chips | Category + subcategory + tag chips, each with × dismiss |
| Clear all | Resets category + subcategory in one click |
| Article grid | 12/page, debounced search (350 ms) |
| Pagination | Prev/Next with page counter |
| Article viewer | Lightweight Markdown → HTML renderer (no external library) |
| URL hash sync | `/docs#slug` deep-links to any article on load |
| Zero auth | `credentials: 'omit'` — no cookies/tokens ever sent |
| Accessibility | ARIA labels, `aria-live`, `aria-pressed`, `role="status"` |
| Fuzzy search | Fuse.js re-ranks backend results client-side (threshold 0.35, handles typos) |

### Search architecture (two-layer)

```
User types query
      │
      ▼ (350 ms debounce)
GET /api/docs?search=q     ← Layer 1: DB full-text search
      │ returns up to 12 results (one page)
      ▼
useFuzzySearch(results, q) ← Layer 2: Fuse.js client-side re-rank
      │ re-orders by fuzzy score (handles typos, short queries)
      ▼
displayArticles            ← rendered in the grid
```

Layer 1 handles corpus-wide search across all articles in the database. Layer 2 improves ordering within the returned page — particularly useful for short queries (≤5 chars) and minor typos that SQL `LIKE` still matched but in a suboptimal order.

### Module Browser behaviour

The `<ModuleBrowser>` grid is shown only on the **homepage** (no active filters, no search).  
Clicking a module card calls `selectModule(cat, sub)` which sets both `category` and  
`activeSubcategory`, loading only articles from that specific module.

---

## 7. Database Schema

```prisma
model DocArticle {
  id          String   @id @default(uuid())
  slug        String   @unique         // URL-safe, max 180 chars
  title       String   @db.VarChar(300)
  category    String   @db.VarChar(50) // feature | tutorial | faq | api_reference
  subcategory String?  @db.VarChar(100)
  summary     String?  @db.Text        // ~250 char plain-text (not in list responses)
  content     String   @db.LongText    // Full Markdown (not in list responses)
  tags        String?  @db.Text        // JSON array: ["vat","tax","api_reference",...]
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([category])
  @@index([subcategory])
  @@index([isPublished])
  @@map("doc_article")
}
```

After any schema change: `npm run db:generate` then `npm run db:push`.

---

## 8. Adding a New Module to the Pipeline

### New NestJS controller

The extractor picks it up automatically on the next `npm run docs:extract`.  
Add `@ApiTags('My Module')` and `@ApiOperation({ summary: '...' })` to every route — that's all.

### New frontend page

Add `usePageTitle('Page Name')` and a JSDoc comment block at the top of the file.  
The extractor picks it up automatically.

### New tutorial workflow

Edit `scripts/extract-module-docs.mjs` → `WORKFLOW_PAGES` array:

```js
{ file: 'myPage.tsx', title: 'How to Use My Feature', sub: 'My Module Area' },
```

### Customising classification of a static doc

Edit `scripts/seed-docs.mjs` → `classify()` → `PATH_RULES` array:

```js
{ re: /my-new-section/, cat: 'tutorial', sub: 'My Section' },
```

---

## 9. Cache Management

`DocsService` uses a 60 s in-memory TTL cache keyed by query params.  
Cache auto-expires. To flush immediately (e.g. after a content update):

```typescript
// Inject DocsService and call:
this.docsService.flushCache();
```

Or call the CI/CD admin endpoint (token-gated):

```bash
curl -X POST https://ovds.com.et/api/docs/admin/flush-cache \
  -H "Authorization: Bearer $DOCS_CACHE_FLUSH_TOKEN"
```

Or restart the NestJS process — cache is in-process memory only.

---

## 10. CI/CD Pipeline

The documentation pipeline is fully automated via **GitHub Actions** (`.github/workflows/docs-pipeline.yml`).

### Triggers

| Event | Runs lint? | Runs docs-extract? | Runs deploy? |
|---|---|---|---|
| Push to `main` touching `docs/`, controllers, or pages | ✅ | ✅ | ✅ |
| Push to `main` touching other files | ✅ | ✅ (path-filtered) | ✅ |
| Nightly schedule (`0 2 * * *` UTC) | ✗ | ✅ | ✗ |
| Manual dispatch — `dry_run: true` | ✅ | dry-run only | ✗ |
| Manual dispatch — `skip_deploy: true` | ✅ | ✅ | ✗ |
| Manual dispatch — `phase: seed-only` | ✅ | static docs only | ✅ |
| Manual dispatch — `phase: extract-only` | ✅ | live modules only | ✅ |

### Jobs

```
push to main (docs/ or src changes)
    │
    ▼
lint-and-type-check  ──────────── fast gate (10 min, skipped on schedule)
    │ passes (or skipped on schedule)
    ▼
docs-extract  ─────────────────── always() — runs if lint passed OR was skipped
    │   1. npm run db:generate
    │   2. node scripts/docs-ci.mjs --json   (export artifacts)
    │   3. node scripts/seed-docs.mjs        (29 static md → DB)
    │   4. node scripts/extract-module-docs.mjs (229 live → DB)
    │   5. POST /api/docs/admin/flush-cache  (evict 60 s cache)
    │   6. Upload JSON artifacts (14-day retention)
    │
    ▼  (skipped on schedule, dry_run, skip_deploy)
build-and-deploy
        1. npm run build:backend + build:frontend
        2. SSH → git pull + npm run docs:update + Plesk restart
        3. Local health check (localhost:3000/api/health/ready)
        4. Remote health check (ovds.com.et/api/health/ready)
        5. Smoke-test /api/docs?take=1
```

### GitHub Secrets Required

Add in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `PRISMA_DATABASE_URL` | Production DB connection string |
| `DOCS_CACHE_FLUSH_TOKEN` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PLESK_HOST` | `ovds.com.et` |
| `PLESK_SSH_USER` | Plesk SSH username |
| `PLESK_SSH_KEY` | Private SSH key (add matching public key to Plesk authorized_keys) |
| `PLESK_SSH_PORT` | `22` (optional) |

### GitHub Variables Required

| Variable | Value |
|---|---|
| `API_BASE_URL` | `https://ovds.com.et` |

### Local CI Orchestration

```bash
# Full pipeline (both phases + DB writes)
npm run docs:ci

# Dry-run — classify + print, no DB writes
npm run docs:ci:dry

# JSON export only (no DB)
npm run docs:ci:json

# Full pipeline + flush backend cache
npm run docs:ci:flush

# Seed static markdown only
node scripts/docs-ci.mjs --skip-extract

# Extract live modules only
node scripts/docs-ci.mjs --skip-seed

# Full pipeline + flush, with debug output
node scripts/docs-ci.mjs --flush-cache
```

### Nightly Schedule

The `schedule: cron: "0 2 * * *"` trigger runs `docs-extract` daily at 02:00 UTC without needing a code push. This keeps documentation fresh after:
- Database migrations that add new data patterns
- Markdown edits committed directly on the server
- New controllers or pages added without pushing to `main`

The scheduled run skips `lint-and-type-check` and `build-and-deploy` — it only refreshes the `doc_article` table and flushes the cache.

### Manual Pipeline Dispatch

From **GitHub → Actions → OVDS Docs Pipeline → Run workflow**:

| Input | Options | Effect |
|---|---|---|
| `dry_run` | `true` / `false` | Preview classifications without DB writes |
| `skip_deploy` | `true` / `false` | Run extraction but skip build & SSH deploy |
| `phase` | `all` / `seed-only` / `extract-only` | Run only the specified pipeline phase |




