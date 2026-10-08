#!/usr/bin/env bash
set -e
echo "🚀 Bootstrapping Ovds Workspace..."
npm ci
pnpm exec nx run-many --target=lint --all
docker compose -f docker-compose.cloud.yml up -d cloud-db
sleep 5
pnpm exec prisma generate --schema=./packages/database/prisma/schema.base.prisma
export DATABASE_PROVIDER="postgresql"
export DATABASE_URL="postgresql://cloud_user:secure_pwd@localhost:5432/ovds_production"
node apps/frontend/src/migration-runner.js
npx playwright install --with-deps
pnpm exec nx run-many --target=test --projects=backend --configuration=e2e
echo "✅ Ovds initialized!"
