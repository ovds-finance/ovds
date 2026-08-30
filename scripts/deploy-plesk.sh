#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-plesk.sh — Build & deploy OVDS on Plesk (MySQL 8.4.0 + Node.js)
#
# Target server:
#   DB   : mysql-db02.remote:32636 · MySQL 8.4.0 · user: uscis · db: usc
#   Web  : nginx/1.30.2 · PHP 8.4.19 · Plesk
#   App  : Node.js (managed by Plesk Node.js extension)
#
# Run from project root:
#   bash scripts/deploy-plesk.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

ROOT="/data/var/www/vhosts/ovds.com.et/httpdocs"
DB_PKG="$ROOT/packages/database"

# ── Self-heal: fix execute permissions immediately ────────────────────────────
# FTP/SFTP uploads strip +x from all files. Fix node_modules/.bin and all
# shell scripts before anything else runs, so tsc/vite/prisma etc. can execute.
echo "[pre] Fixing execute permissions on node_modules/.bin..."
chmod -R +x "$ROOT/node_modules/.bin/" 2>/dev/null || true
chmod +x "$ROOT/scripts/"*.sh 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     OVDS Plesk Deployment Script         ║"
echo "║  DB: mysql-db02.remote:32636 (MySQL 8.4) ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$ROOT"

# ── Verify .env exists and has PRISMA_DATABASE_URL ───────────────────────────
# Always copy .env.production → .env to ensure it's up to date.
# A stale .env without PRISMA_DATABASE_URL would cause db:generate to fail.
if [ -f ".env.production" ]; then
  cp .env.production .env
  echo "✔ Copied .env.production → .env"
elif [ ! -f ".env" ]; then
  echo "ERROR: Neither .env nor .env.production found!"
  exit 1
fi

# ── Verify PRISMA_DATABASE_URL is set ─────────────────────────────────────────
if ! grep -q "PRISMA_DATABASE_URL" .env; then
  echo "ERROR: PRISMA_DATABASE_URL not found in .env"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

echo "✔ DB: $PRISMA_DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|'

# ─────────────────────────────────────────────────────────────────────────────
# STEP 0 — Write correct prisma.config.js on the server
# ─────────────────────────────────────────────────────────────────────────────
echo "[0/8] Writing prisma.config.js..."

cat > "$DB_PKG/prisma.config.js" << 'PRISMACONFIG'
// @ts-check
// Prisma 7 CLI config — MySQL 8.4.0 · mysql-db02.remote:32636
// IMPORTANT: prisma-run.mjs writes a temporary .env before running Prisma,
// so PRISMA_DATABASE_URL is always available here.
// The adapter (PrismaMariaDb) belongs only in prisma.service.ts at runtime.

const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.PRISMA_DATABASE_URL || 'mysql://root:@127.0.0.1:3306/usc',
  },
});
PRISMACONFIG

echo "  Written $DB_PKG/prisma.config.js"

# Patch packages/database/package.json to use .js config (not .ts)
node -e "
  const fs = require('fs');
  const path = '$DB_PKG/package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  Object.keys(pkg.scripts).forEach(k => {
    pkg.scripts[k] = pkg.scripts[k].replace(/prisma\.config\.ts/g, 'prisma.config.js');
  });
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  Patched packages/database/package.json');
"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Wipe node_modules and reinstall natively on Linux
# ─────────────────────────────────────────────────────────────────────────────
# CRITICAL: node_modules from Windows contains platform-specific binaries
# (esbuild-win32, rolldown-win32) that will NOT work on Linux.
echo "[1/8] Wiping node_modules and reinstalling for Linux..."
rm -f package-lock.json
rm -rf node_modules

npm install --legacy-peer-deps

# Fix execute permissions immediately after install
echo "  Fixing .bin permissions..."
chmod -R +x node_modules/.bin/ 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Pin Prisma to v7 (compatible with MySQL 8.4.0)
# ─────────────────────────────────────────────────────────────────────────────
echo "[2/8] Pinning Prisma 7.8.0 for MySQL 8.4.0..."
npm install \
  prisma@7.8.0 \
  @prisma/client@7.8.0 \
  @prisma/adapter-mariadb@7.8.0 \
  --save-exact \
  --legacy-peer-deps

# Re-fix permissions after second install pass
chmod -R +x node_modules/.bin/ 2>/dev/null || true

echo "  Prisma: $(node_modules/.bin/prisma --version 2>/dev/null | head -1 || echo 'unknown')"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Generate Prisma client (targets MySQL 8.4.0 WASM engine)
# ─────────────────────────────────────────────────────────────────────────────
echo "[3/8] Generating Prisma client..."
PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npm run generate:plesk -w @ovds/database

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Sync schema to production DB
# Strategy: try migrate:prod first (safe, no data loss), fall back to
# db:push:prod with --accept-data-loss for new unique constraints.
# ─────────────────────────────────────────────────────────────────────────────
echo "[4/8] Syncing schema to MySQL 8.4.0 (mysql-db02.remote:32636)..."
if npm run migrate:prod -w @ovds/database; then
  echo "  ✔ migrate:prod succeeded"
else
  echo "  migrate:prod failed or has pending migrations — running db:push:prod..."
  npm run db:push:prod -w @ovds/database
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Build shared libraries
# ─────────────────────────────────────────────────────────────────────────────
echo "[5/8] Building shared libraries (design-system → shared → ui → database)..."
npm run build:libs

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Build backend
# ─────────────────────────────────────────────────────────────────────────────
echo "[6/8] Building NestJS backend..."
npm run build -w @ovds/backend

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Build frontend
# ─────────────────────────────────────────────────────────────────────────────
echo "[7/8] Building React frontend..."
npm run build -w ovds-frontend

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 — Verify
# ─────────────────────────────────────────────────────────────────────────────
echo "[8/8] Verifying output..."

BACKEND_MAIN="$ROOT/apps/backend/dist/main.js"
FRONTEND_INDEX="$ROOT/apps/public/index.html"

if [ -f "$BACKEND_MAIN" ]; then
  echo "  ✔ Backend dist: $BACKEND_MAIN"
else
  echo "  ✗ Backend dist NOT found — build may have failed"
  exit 1
fi

if [ -f "$FRONTEND_INDEX" ]; then
  echo "  ✔ Frontend dist: $FRONTEND_INDEX"
else
  echo "  ✗ Frontend dist NOT found — build may have failed"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Build complete! Restart the app.     ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  1. In Plesk → Node.js → click Restart"
echo "  2. Health check: https://ovds.com.et/api/health/ready"
echo "  3. App: https://ovds.com.et"
echo ""
