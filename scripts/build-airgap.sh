#!/usr/bin/env bash
set -euo pipefail

npm run build:backend -- --configuration=production
npm run build:frontend -- --configuration=production
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

mkdir -p dist/airgap/{bin,db,static,certs}
cp dist/apps/backend/main.js dist/airgap/bin/ovds-backend
cp -r dist/apps/frontend/browser dist/airgap/static
cp -r packages/database/prisma/migrations dist/airgap/db/migrations
cp scripts/certs/* dist/airgap/certs/ 2>/dev/null || true

tar czf ovds-airgap-$(date +%Y%m%d).tar.gz -C dist/airgap .
