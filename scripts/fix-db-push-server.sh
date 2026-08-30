#!/bin/bash
# fix-db-push-server.sh — Run on Plesk server to fix db:push:prod and push schema
# Usage: bash scripts/fix-db-push-server.sh
# ─────────────────────────────────────────────────────────────────────────────

ROOT="/data/var/www/vhosts/ovds.com.et/httpdocs"
DB_PKG="$ROOT/packages/database"

cd "$ROOT" || { echo "ERROR: Cannot cd to $ROOT"; exit 1; }

echo "=== OVDS Server db:push Fix ==="
echo ""

# Step 1 — Patch packages/database/package.json to add --accept-data-loss
echo "[1/2] Patching packages/database/package.json..."
node -e "
  const fs = require('fs');
  const path = '$DB_PKG/package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  // Fix db:push:prod to include --accept-data-loss
  pkg.scripts['db:push:prod'] = 'node scripts/prisma-run.mjs ../../.env.production db push --accept-data-loss --config=./prisma.config.js';
  pkg.scripts['db:push']      = 'node scripts/prisma-run.mjs ../../.env db push --accept-data-loss --config=./prisma.config.js';
  // Fix generate to use .env.production (avoids missing PRISMA_DATABASE_URL in .env)
  pkg.scripts['generate']     = 'node scripts/prisma-run.mjs ../../.env.production generate --config=./prisma.config.js';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  ✔ Patched db:push, db:push:prod, generate scripts');
"

echo ""

# Step 2 — Run db:push:prod now
echo "[2/2] Running db:push:prod..."
npm run db:push:prod -w @ovds/database

echo ""
echo "✅ Done. Now run: npm run db:generate (or continue with deploy-plesk.sh)"
