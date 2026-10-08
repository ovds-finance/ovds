#!/usr/bin/env bash
set -e

echo "📐 Scaffolding Blueprint Directory Structures..."

mkdir -p apps/frontend/src/{components/accounting,components/layout,components/admin,components/onboarding,hooks,styles}
mkdir -p packages/shared-domains/infra/src/{interceptors,guards,middleware,filters,crypto,seed,sharding,locks,lifecycle,monitoring}
mkdir -p packages/shared-domains/accounting/src/{compliance,events,workers,utils,__tests__,reports}
mkdir -p apps/frontend/src/{provisioning,cron,billing,commands,infra,tenant}
mkdir -p apps/portal/src/{backup}
mkdir -p k8s
mkdir -p config/{monitoring,logging,testing}
mkdir -p scripts/{tests}

echo "✅ Blueprint directory scaffold complete."
