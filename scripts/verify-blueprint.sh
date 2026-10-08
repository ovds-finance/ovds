#!/usr/bin/env bash
cd "$(dirname "$0")/.."
echo "=== Blueprint File Verification ==="
found=0
missing=0
check() {
  if [ -f "$1" ]; then found=$((found+1)); else echo "MISSING: $1"; missing=$((missing+1)); fi
}
check apps/frontend/src/main.tsx
check apps/frontend/src/hooks/useTenantFinancials.ts
check apps/frontend/src/components/accounting/ChartOfAccountsManager.tsx
check apps/frontend/src/components/accounting/BalanceSheetDashboard.tsx
check apps/frontend/src/components/accounting/ExtensionSlot.tsx
check apps/frontend/src/components/layout/WorkspaceLayout.tsx
check apps/portal/src/backup/sqlite-backup.engine.ts
check apps/frontend/src/cron/data-retention.engine.ts
check apps/frontend/src/provisioning/tenant-provisioning.service.ts
check apps/frontend/src/accounting/trial-balance.controller.ts
check apps/frontend/src/accounting/accounts.controller.ts
check apps/frontend/src/billing/stripe-webhook.controller.ts
check apps/frontend/src/tenant/users.controller.ts
check packages/shared-domains/infra/src/tenant-cache.service.ts
check packages/shared-domains/infra/src/lifecycle/connection-pool-manager.ts
check packages/shared-domains/infra/src/sharding/federated-shard-router.ts
check packages/shared-domains/infra/src/schema-router.ts
check packages/shared-domains/infra/src/locks/distributed-lock.manager.ts
check packages/shared-domains/infra/src/guards/feature-flag.guard.ts
check packages/shared-domains/infra/src/interceptors/sentry-tenant.interceptor.ts
check packages/shared-domains/infra/src/interceptors/audit-trail.interceptor.ts
check packages/shared-domains/infra/src/middleware/tenant-rate-limiter.middleware.ts
check packages/shared-domains/infra/src/middleware/tenant-whitelist-limiter.middleware.ts
check packages/shared-domains/infra/src/seed/identity-seeder.ts
check packages/shared-domains/infra/src/crypto/envelope-encryption.service.ts
check packages/shared-domains/infra/src/crypto/kms-preflight.validator.ts
check packages/shared-domains/infra/src/guards/air-gapped-license.guard.ts
check packages/shared-domains/accounting/src/balances-validator.listener.ts
check packages/shared-domains/accounting/src/currency-converter.service.ts
check packages/shared-domains/accounting/src/balance-sheet.service.ts
check packages/shared-domains/accounting/src/cash-flow.service.ts
check packages/shared-domains/accounting/src/income-statement.service.ts
check packages/shared-domains/accounting/src/ledger-sync.gateway.ts
check packages/shared-domains/accounting/src/events/event-store.service.ts
check packages/shared-domains/accounting/src/events/state-reconstructor.service.ts
check packages/shared-domains/accounting/src/events/kafka-producer.service.ts
check packages/shared-domains/accounting/src/events/kafka-consumer.service.ts
check packages/shared-domains/accounting/src/compliance/worm-vault.service.ts
check packages/shared-domains/accounting/src/utils/slack-notifier.ts
check packages/shared-domains/accounting/src/utils/deadlock-handler.ts
check packages/database/prisma/schema.base.prisma
check docker-compose.cloud.yml
check docker-compose.dev.yml
check docker-compose.kafka.yml
check docker-compose.shards.yml
check k8s/ingress-wildcard.yml
check k8s/db-statefulset.yml
check k8s/frontend-hpa.yml
check k8s/redis-cluster-statefulset.yml
check k8s/kafka-consumer-deployment.yml
check k8s/db-backup-cronjob.yml
check config/monitoring/prometheus.yml
check .github/workflows/deploy-pipelines.yml
check .env.example
check scripts/initialize-production-mesh.sh
check ARCHITECTURE-OVDS-VAT.md
echo "✅ Found: $found | ❌ Missing: $missing"
