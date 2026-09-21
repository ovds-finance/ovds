# 01 — Nx Monorepo Structure

## 1. Workspace Root Layout

```
vat-declaration-saas/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-api.yml
│       └── deploy-web.yml
├── .husky/
│   └── pre-commit
├── apps/
│   ├── api/                        # NestJS backend application
│   │   ├── src/
│   │   ├── test/
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   ├── web/                        # React web application
│   │   ├── src/
│   │   ├── test/
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   └── docs/                       # Docusaurus documentation site
│       ├── docs/
│       ├── src/
│       ├── docusaurus.config.ts
│       └── project.json
├── libs/
│   ├── shared/
│   │   ├── types/                   # Shared TypeScript types
│   │   ├── utils/                   # Shared utility functions
│   │   ├── constants/               # Shared constants (VAT rates, EU country codes)
│   │   ├── validators/              # Shared Zod schemas
│   │   └── config/
│   │       ├── eslint/
│   │       ├── jest/
│   │       └── typescript/
│   ├── ui/                          # Shared React component library
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── button/
│   │   │   │   ├── input/
│   │   │   │   ├── modal/
│   │   │   │   ├── data-table/
│   │   │   │   ├── date-picker/
│   │   │   │   ├── currency-input/
│   │   │   │   ├── vat-rate-input/
│   │   │   │   ├── jurisdiction-select/
│   │   │   │   └── ...
│   │   │   └── index.ts
│   │   ├── test/
│   │   └── project.json
│   ├── api-core/                    # NestJS core libraries
│   │   ├── auth/                    # Auth module (JWT, guards, strategies)
│   │   ├── common/                  # Common decorators, pipes, filters, interceptors
│   │   ├── prisma/                  # Prisma service, base repository, helpers
│   │   ├── tenant/                  # Multi-tenancy module
│   │   ├── events/                  # Event emitter, event bus
│   │   ├── queue/                   # Queue module (BullMQ integration)
│   │   ├── health/                  # Health checks
│   │   └── config/
│   │       └── validation/          # Shared validation schemas
│   └── feature/                     # Feature libraries
│       ├── organizations/           # Organization bounded context
│       ├── users/                   # User bounded context
│       ├── vat-registrations/       # VAT registration bounded context
│       ├── vat-returns/             # VAT return bounded context
│       ├── transactions/            # Transaction bounded context
│       ├── jurisdictions/           # Jurisdiction bounded context
│       ├── integrations/            # Tax authority integration bounded context
│       ├── billing/                 # Subscription/billing bounded context
│       ├── reporting/               # Reporting bounded context
│       └── notifications/           # Notification bounded context
├── tools/
│   ├── generators/                  # Custom Nx generators
│   │   ├── feature/
│   │   ├── library/
│   │   └── docker/
│   ├── scripts/                     # Build and migration scripts
│   └── seeders/                     # Database seeders (dev/test)
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── docker-compose.yml
│   └── nginx/
│       └── default.conf
├── k8s/
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── deployment.api.yaml
│   │   ├── service.api.yaml
│   │   ├── deployment.web.yaml
│   │   ├── service.web.yaml
│   │   ├── ingress.yaml
│   │   └── hpa.yaml
│   ├── overlays/
│   │   ├── staging/
│   │   └── production/
│   └── helm/
│       └── vat-declaration-saas/
├── scripts/
│   ├── db-migrate.sh
│   ├── db-seed.sh
│   └── generate-openapi.sh
├── .env.example
├── .env.development
├── .env.staging
├── .env.production
├── nx.json
├── tsconfig.base.json
├── package.json
├── pnpm-workspace.yaml
├── docker-compose.yml
├── docker-compose.override.yml
├── README.md
└── ARCHITECTURE.md
```

## 2. Nx Configuration

### nx.json

```json
{
  "extends": "nx/presets/npm.json",
  "affected": {
    "defaultBase": "main"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    },
    "e2e": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/src/test-setup.[jt]s"
    ],
    "sharedGlobals": [
      "{workspaceRoot}/.github/workflows/ci.yml",
      "{workspaceRoot}/tsconfig.base.json",
      "{workspaceRoot}/package.json"
    ]
  },
  "plugins": [
    {
      "plugin": "@nx/js",
      "options": {
        "analyzeSourceFiles": true
      }
    },
    {
      "plugin": "@nx/nest",
      "options": {
        "buildTargetName": "build",
        "serveTargetName": "serve",
        "testTargetName": "test",
        "lintTargetName": "lint"
      }
    },
    {
      "plugin": "@nx/react",
      "options": {
        "buildTargetName": "build",
        "serveTargetName": "serve",
        "testTargetName": "test",
        "lintTargetName": "lint"
      }
    }
  ]
}
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "lint": "nx run-many --target=lint --all",
    "affected:build": "nx affected --target=build",
    "affected:test": "nx affected --target=test",
    "affected:lint": "nx affected --target=lint",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "db:migrate": "nx run api:prisma migrate deploy",
    "db:seed": "nx run api:prisma db seed",
    "db:studio": "nx run api:prisma studio",
    "generate:openapi": "nx run api:openapi",
    "format": "nx format:write",
    "format:check": "nx format:check"
  }
}
```

## 3. Workspace Libraries Detail

### 3.1 apps/api (NestJS)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.config.ts
│   ├── infrastructure/
│   │   ├── exceptions/           # Global exception filters
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── prisma-exception.filter.ts
│   │   │   └── validation-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── permissions.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── pipes/
│   │   │   ├── zod-validation.pipe.ts
│   │   │   ├── parse-int.pipe.ts
│   │   │   └── trim.pipe.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       ├── current-organization.decorator.ts
│   │       ├── permissions.decorator.ts
│   │       └── public.decorator.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── users/
│   │   ├── vat-registrations/
│   │   ├── vat-returns/
│   │   ├── transactions/
│   │   ├── jurisdictions/
│   │   ├── integrations/
│   │   ├── billing/
│   │   ├── reporting/
│   │   └── notifications/
│   └── common/
│       ├── constants/
│       ├── enums/
│       ├── interfaces/
│       └── dto/
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── project.json
├── tsconfig.app.json
├── tsconfig.json
└── .env.example
```

### 3.2 apps/web (React + Vite)

```
apps/web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── reset-password.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── organizations/
│   │   │   ├── index.tsx
│   │   │   ├── settings.tsx
│   │   │   └── members.tsx
│   │   ├── vat-registrations/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── [id].tsx
│   │   ├── vat-returns/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   ├── [id].tsx
│   │   │   └── [id]/review.tsx
│   │   ├── transactions/
│   │   │   ├── index.tsx
│   │   │   ├── import.tsx
│   │   │   └── [id].tsx
│   │   ├── reports/
│   │   │   ├── index.tsx
│   │   │   ├── vat-summary.tsx
│   │   │   └── export.tsx
│   │   ├── settings/
│   │   │   ├── profile.tsx
│   │   │   ├── organization.tsx
│   │   │   ├── integrations.tsx
│   │   │   └── billing.tsx
│   │   └── admin/
│   │       ├── users.tsx
│   │       ├── organizations.tsx
│   │       └── system.tsx
│   ├── features/                   # Feature modules (co-located logic)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── vat-returns/
│   │   ├── transactions/
│   │   └── ...
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── OrganizationSwitcher.tsx
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── charts/
│   │   └── common/
│   ├── hooks/
│   ├── stores/                     # Zustand stores
│   ├── services/                   # API client (React Query)
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── utils/
│   │   └── constants/
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── themes/
│   └── types/
├── test/
│   ├── setup.ts
│   └── components/
├── project.json
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## 4. Shared Libraries

### 4.1 libs/ui (React Component Library)

```
libs/ui/src/
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── input/
│   │   │   ├── label/
│   │   │   ├── card/
│   │   │   ├── badge/
│   │   │   ├── alert/
│   │   │   ├── skeleton/
│   │   │   ├── dropdown-menu/
│   │   │   ├── dialog/
│   │   │   ├── toast/
│   │   │   ├── tabs/
│   │   │   ├── accordion/
│   │   │   ├── avatar/
│   │   │   └── ...
│   │   ├── vat/
│   │   │   ├── vat-rate-input/
│   │   │   ├── jurisdiction-select/
│   │   │   ├── vat-period-picker/
│   │   │   ├── return-summary-card/
│   │   │   └── transaction-line-item/
│   │   ├── forms/
│   │   │   ├── form-field/
│   │   │   ├── currency-input/
│   │   │   ├── date-range-picker/
│   │   │   ├── file-upload/
│   │   │   └── autocomplete/
│   │   └── layout/
│   │       ├── page-header/
│   │       ├── data-table/
│   │       ├── stat-card/
│   │       └── empty-state/
│   ├── hooks/
│   │   ├── use-media-query.ts
│   │   ├── use-local-storage.ts
│   │   └── use-clipboard.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   └── currency.ts
│   └── index.ts
```

### 4.2 libs/api-core (NestJS Core)

```
libs/api-core/
├── auth/
│   ├── src/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── refresh-token.strategy.ts
│   │   ├── mfa.service.ts
│   │   ├── password.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── forgot-password.dto.ts
│   │   └── interfaces/
│   │       ├── jwt-payload.interface.ts
│   │       └── refresh-token.interface.ts
├── common/
│   ├── src/
│   │   ├── decorators/
│   │   │   ├── permissions.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   ├── prisma-exception.filter.ts
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   ├── zod-validation.pipe.ts
│   │   │   └── parse-object-id.pipe.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   └── ...
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   ├── sort.dto.ts
│   │   │   └── filter.dto.ts
│   │   └── constants/
│   │       ├── http-status.ts
│   │       └── messages.ts
├── prisma/
│   ├── src/
│   │   ├── prisma.service.ts
│   │   ├── base.repository.ts
│   │   ├── transactions.ts
│   │   └── index.ts
├── tenant/
│   ├── src/
│   │   ├── tenant.module.ts
│   │   ├── tenant.service.ts
│   │   ├── tenant.guard.ts
│   │   ├── tenant.interceptor.ts
│   │   └── tenant-context.middleware.ts
├── events/
│   ├── src/
│   │   ├── event-bus.module.ts
│   │   ├── event-bus.service.ts
│   │   ├── decorators/
│   │   │   ├── subscribe.decorator.ts
│   │   │   └── emit.decorator.ts
│   │   └── interfaces/
│   │       └── event-handler.interface.ts
├── queue/
│   ├── src/
│   │   ├── queue.module.ts
│   │   ├── queue.service.ts
│   │   ├── processors/
│   │   │   ├── vat-return-submission.processor.ts
│   │   │   ├── integration-call.processor.ts
│   │   │   └── report-generation.processor.ts
│   │   └── jobs/
│   │       ├── vat-return-submission.job.ts
│   │       ├── integration-call.job.ts
│   │       └── report-generation.job.ts
└── health/
    ├── src/
    │   ├── health.module.ts
    │   ├── health.controller.ts
    │   └── health.service.ts
    └── checks/
        ├── database.check.ts
        ├── redis.check.ts
        └── queue.check.ts
```

## 5. Task Graph and Dependency Rules

### 5.1 Library Dependency Rules

```
apps/api            → libs/api-core/*, libs/feature/*, libs/shared/*
apps/web            → libs/ui, libs/shared/*, libs/feature/* (via API)
libs/feature/*      → libs/api-core/*, libs/shared/*
libs/api-core/*     → libs/shared/types, libs/shared/utils
libs/ui             → libs/shared/types, libs/shared/utils, libs/shared/validators
libs/shared/*       → (no internal dependencies)
```

### 5.2 Feature Library Internal Structure

Each feature library follows this pattern:

```
libs/feature/vat-returns/
├── src/
│   ├── lib/
│   │   ├── vat-return.module.ts
│   │   ├── vat-return.controller.ts
│   │   ├── vat-return.service.ts
│   │   ├── vat-return.repository.ts
│   │   ├── dto/
│   │   │   ├── create-vat-return.dto.ts
│   │   │   ├── update-vat-return.dto.ts
│   │   │   ├── submit-vat-return.dto.ts
│   │   │   └── query-vat-return.dto.ts
│   │   ├── entities/
│   │   │   └── vat-return.entity.ts
│   │   ├── interfaces/
│   │   │   ├── vat-return.interface.ts
│   │   │   └── vat-return-item.interface.ts
│   │   └── mappers/
│   │       └── vat-return.mapper.ts
│   └── index.ts
├── test/
│   ├── vat-return.service.spec.ts
│   └── vat-return.controller.spec.ts
├── project.json
└── tsconfig.lib.json
```

## 6. CI Boundaries

### 6.1 Affected Detection

- `main` is the base branch.
- Every PR triggers affected build, lint, and test.
- Only changed apps and dependent libs are rebuilt.

### 6.2 Cache Strategy

- Nx computes a content hash for each source file.
- Task results are cached in GitHub Actions using `nxcache`.
- Restored from cache on subsequent runs when inputs are unchanged.

### 6.3 Parallelism

- `nx run-many` uses `--parallel` with a limit matching CI runner cores.
- E2E tests run in a separate job after unit/integration tests pass.

## 7. Environment Configuration

### 7.1 Application Environments

| Environment | API URL               | Web URL                | Database                 | Redis               |
|-------------|-----------------------|------------------------|--------------------------|---------------------|
| Development | http://localhost:3001 | http://localhost:4200  | postgres://localhost:5432/vat_dev | redis://localhost:6379 |
| Staging     | https://api-staging.vat-saas.com | https://staging.vat-saas.com | postgres://... | redis://... |
| Production  | https://api.vat-saas.com | https://app.vat-saas.com | postgres://... | redis://... |

### 7.2 Secrets Management

- Development: `.env` files committed to repo (secrets redacted).
- Staging/Production: Kubernetes Secrets + HashiCorp Vault or AWS Secrets Manager.
- CI: GitHub Encrypted Secrets.
- Never commit real secrets.

## 8. Development Workflow

1. **Create feature library**: `nx g @nx/nest:library feature/vat-returns --directory=libs/feature`
2. **Create React route/page**: `nx g @nx/react:page dashboard/vat-returns --project=web --directory=apps/web/src/routes`
3. **Create shared component**: `nx g @nx/react:component vat-rate-input --project=ui --directory=libs/ui/src/lib/components/vat`
4. **Run affected tests**: `npm run affected:test`
5. **Run e2e**: `npm run e2e web-e2e`
6. **Deploy**: PR merge to `main` triggers deployment pipeline.

## 9. Technology Choices Rationale

| Concern               | Choice               | Rationale                                                                 |
|-----------------------|----------------------|--------------------------------------------------------------------------|
| Monorepo              | Nx                   | Incremental builds, affected detection, task caching, unified CI         |
| Backend Framework     | NestJS               | Enterprise patterns, DI, decorators, guards, interceptors, Prisma-ready  |
| Frontend Framework    | React + Vite         | Fast HMR, large ecosystem, React Query for server state                 |
| ORM                   | Prisma               | Type-safe, migrations, multi-tenant schema strategies, introspection     |
| UI Components         | Radix UI + Tailwind   | Accessible primitives, utility-first styling                             |
| State Management       | Zustand (client)     | Minimal boilerplate, works with React Query for server state            |
| API Client            | Axios + React Query  | Caching, deduplication, background refetch                              |
| Forms                 | React Hook Form + Zod | Schema validation, performance, type safety                              |
| Queue                 | BullMQ               | Redis-based, reliable, supports delayed jobs, rate limiting             |
| Testing               | Jest + Playwright    | Unit/integration with Jest, E2E with Playwright                         |
| Containerization       | Docker               | Consistent dev/prod environments, multi-stage builds                    |
| Orchestration         | Kubernetes           | Scalable, self-healing, standard for SaaS                               |

## 10. Constraints and Non-Functional Requirements

- **Multi-tenancy**: All data must be tenant-isolated at the database level.
- **Compliance**: VAT calculations must be auditable; every mutation logged.
- **Availability**: 99.9% uptime SLA for production API.
- **Scalability**: Horizontal scaling of API pods; database read replicas for reporting.
- **Security**: OWASP Top 10 compliance; all API routes behind auth guards; secrets in vault.
- **Performance**: P95 API latency < 200ms for simple queries, < 800ms for complex reports.
- **Data Residency**: Support EU-only data hosting for GDPR compliance.
