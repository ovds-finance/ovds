#!/bin/bash
# fix-env-server.sh — Run this on the Plesk server to fix a missing/broken .env
# Usage: bash scripts/fix-env-server.sh
# ─────────────────────────────────────────────────────────────────────────────

ROOT="/data/var/www/vhosts/ovds.com.et/httpdocs"
cd "$ROOT" || { echo "ERROR: Cannot cd to $ROOT"; exit 1; }

echo "=== OVDS Server .env Fix ==="

# Check current .env state
if [ -f ".env" ]; then
  echo "Current .env:"
  grep -v "PASSWORD\|SECRET\|KEY\|_URL" .env | head -10
  echo ""
  if grep -q "PRISMA_DATABASE_URL" .env; then
    echo "✔ PRISMA_DATABASE_URL already present in .env"
  else
    echo "✗ PRISMA_DATABASE_URL MISSING from .env — fixing..."
  fi
fi

# Always copy .env.production → .env to ensure it's fresh
if [ -f ".env.production" ]; then
  cp .env.production .env
  echo "✔ Copied .env.production → .env"
  echo "✔ PRISMA_DATABASE_URL: $(grep PRISMA_DATABASE_URL .env | sed 's|:[^:@]*@|:***@|')"
else
  echo ""
  echo "ERROR: .env.production not found!"
  echo "You need to upload .env.production to $ROOT first."
  echo ""
  echo "Create it with this content (use your real password):"
  echo "  PRISMA_DATABASE_URL=mysql://uscis:YOUR_PASSWORD@mysql-db02.remote:32636/usc"
  echo "  JWT_SECRET=your_jwt_secret"
  echo "  NODE_ENV=production"
  echo "  PORT=3001"
  echo "  CORS_ORIGIN=https://ovds.com.et"
  echo "  FRONTEND_URL=https://ovds.com.et"
  echo "  API_URL=https://ovds.com.et/api"
  echo "  AUTH0_ENFORCED=false"
  echo "  SHOW_ERROR_DETAILS=false"
  exit 1
fi

echo ""
echo "Now retry: npm run db:generate"
echo ""
