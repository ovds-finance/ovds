# Deployment Configuration Matrix

## Overview

Ovds supports two deployment topologies from a single unified TypeScript codebase:

| Dimension | Cloud SaaS | On-Premise |
|-----------|-----------|------------|
| `DEPLOYMENT_MODE` | `CLOUD_SAAS` | `ON_PREMISE_SINGLE` or `ON_PREMISE_MULTI` |
| Database | PostgreSQL (distributed) | SQLite (embedded) or MySQL/MariaDB |
| Tenant model | Multi-tenant (shared DB, row-level isolation) | Single-tenant (dedicated DB) or Multi-tenant |
| Host routing | Wildcard subdomain per company (`acme.ovds.com`) | Localhost or LAN IP |
| Auth | OAuth2 / Cloud JWT | Device-local token / LDAP |
| License | Cloud telemetry validation | Air-gapped PKI offline verification |
| Scaling | Horizontal (multiple API instances) | Vertical (single instance per deployment) |

## Environment Variables

### Common

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API listen port | `3001` |
| `API_PREFIX` | Global API prefix | `api` |
| `DATABASE_URL` | Connection string | Required |
| `PRISMA_DATABASE_URL` | Prisma connection string | Falls back to `DATABASE_URL` |
| `DEPLOYMENT_MODE` | Deployment topology | `CLOUD_SAAS` |

### Cloud SaaS

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `OFFLINE_PUBLIC_KEY` | N/A (cloud validation uses online telemetry) | No |

### On-Premise Single-Tenant

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite file path (`file:/data/local-ledger.db`) | Yes |
| `DEPLOYMENT_MODE` | Must be `ON_PREMISE_SINGLE` | Yes |
| `OFFLINE_PUBLIC_KEY` | RSA public key PEM for air-gapped license verification | Yes (for premium modules) |
| `OFFLINE_LICENSE_SECRET` | Vendor secret for license generation | Yes (for premium modules) |

### On-Premise Multi-Tenant

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL/MariaDB connection string | Yes |
| `DEPLOYMENT_MODE` | Must be `ON_PREMISE_MULTI` | Yes |
| `OFFLINE_PUBLIC_KEY` | RSA public key PEM for air-gapped license verification | Yes (for premium modules) |

## Docker Deployment

### Cloud SaaS — `apps/backend/Dockerfile`

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/*/package.json packages/*/
COPY packages/shared/*/package.json packages/shared/*/
COPY packages/modules/*/package.json packages/modules/*/
COPY packages/domains/*/package.json packages/domains/*/
COPY packages/features/*/package.json packages/features/*/
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build:backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DEPLOYMENT_MODE=CLOUD_SAAS
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
EXPOSE 3001
CMD ["node", "dist/apps/backend/main.js"]
```

### On-Premise Single-Tenant — `docker-compose.onpremise.yml`

```yaml
version: '3.8'
services:
  accounting-app:
    image: enterprise-accounting-local:latest
    container_name: local_accounting_engine
    environment:
      - NODE_ENV=production
      - DEPLOYMENT_MODE=ON_PREMISE_SINGLE
      - DATABASE_URL=file:/var/data/local_ledger.db
      - PRISMA_DATABASE_URL=file:/var/data/local_ledger.db
      - OFFLINE_PUBLIC_KEY=${OFFLINE_PUBLIC_KEY}
      - PORT=3001
    volumes:
      - onpremise_data:/var/data
    ports:
      - "8080:3001"
    restart: always

volumes:
  onpremise_data:
    driver: local
```

## Database Provider Matrix

| Provider | Cloud SaaS | On-Premise Single | On-Premise Multi |
|----------|-----------|-------------------|------------------|
| PostgreSQL | Primary | Supported | Supported |
| MySQL / MariaDB | Supported | Supported | Primary |
| SQLite | Not recommended | Primary | Not recommended |

### Migration Script

Use `scripts/migrate-compat.mjs` to run Prisma migrations against different providers:

```bash
# SQLite (local development)
node scripts/migrate-compat.mjs --provider sqlite --direction deploy

# PostgreSQL (cloud)
node scripts/migrate-compat.mjs --provider postgresql --direction deploy

# MySQL/MariaDB (on-premise multi-tenant)
node scripts/migrate-compat.mjs --provider mysql --direction deploy

# With validation and backup
node scripts/migrate-compat.mjs --provider sqlite --direction deploy --validate --backup

# Dry run (preview commands without executing)
node scripts/migrate-compat.mjs --provider postgresql --direction deploy --dry-run
```

## Subdomain Routing (Cloud Only)

In `CLOUD_SAAS` mode, the `TenantSubdomainMiddleware` resolves the active company from the request `Host` header:

| Host | Resolved Tenant |
|------|-----------------|
| `acme.ovds.com` | Company with `name = 'acme'` |
| `acme.ovds.local` | Company with `name = 'acme'` (case-insensitive fallback) |
| `www.ovds.com` | No tenant (infrastructure host) |
| `api.ovds.com` | No tenant (infrastructure host) |

Override with `x-company-id` header when needed (super-admin impersonation).

## License Verification Modes

| Mode | Validation Method | Offline Support |
|------|------------------|-----------------|
| `CLOUD_SAAS` | Online telemetry validation | No |
| `ON_PREMISE_SINGLE` | PKI RSA/SHA256 signature verification | Yes |
| `ON_PREMISE_MULTI` | PKI RSA/SHA256 signature verification | Yes |

The `ModuleSubscriptionGuard` enforces license verification for premium modules in all modes. In `ON_PREMISE_SINGLE` mode, module subscription checks are bypassed entirely because all modules are locally available.
