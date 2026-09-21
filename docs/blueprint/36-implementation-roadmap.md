# 36 — Implementation Roadmap and Migration Strategy

## 1. Migration Overview

This roadmap translates the Laravel Akaunting architecture into the Nx/React/NestJS/Prisma stack. Each phase produces deployable, testable increments.

```
Phase 0: Foundation
Phase 1: Core Domain & Auth
Phase 2: VAT Engine & Tenancy
Phase 3: Integrations & Notifications
Phase 4: Frontend Shell
Phase 5: Advanced Features
Phase 6: Observability & Resilience
Phase 7: Compliance & Security Hardening
```

## 2. Phase 0: Foundation (Weeks 1-2)

**Goal**: Establish the monorepo, CI/CD, and development environment.

| Task | Deliverable | Dependencies |
|------|-------------|--------------|
| Initialize Nx workspace | `nx.json`, workspace layout | Node.js 20, pnpm |
| Create NestJS app | `apps/api` with Hello World | Nx preset |
| Create React app | `apps/web` with Vite | Nx preset |
| Create shared libs | `libs/shared/*`, `libs/ui` | None |
| Setup Docker compose | Postgres, Redis, API, Web | Docker |
| Setup CI pipeline | Lint, test, build on PR | GitHub Actions |
| Configure Prisma | Shared + tenant schemas | Postgres |
| Seed core data | Currencies, countries, VAT rates | Prisma seed |

**Key Decisions**:
- Use pnpm workspaces
- Postgres 16 + Redis 7
- Shared + tenant schema strategy
- Pre-seed EU jurisdictions with VAT rates

## 3. Phase 1: Core Domain & Auth (Weeks 3-5)

**Goal**: Implement authentication, multi-tenancy, and core CRUD.

| Week | Task | Deliverable |
|------|------|-------------|
| 3 | Auth module | JWT login, refresh, MFA, password reset |
| 3 | Tenant module | Organization resolution, middleware, Prisma scoping |
| 3 | RBAC module | Roles, permissions, guards |
| 4 | Organizations module | Create, update, switch, member management |
| 4 | Users module | User CRUD, invitations, profile |
| 5 | Jurisdictions module | Country/region config, VAT rate management |
| 5 | VAT registrations module | Registration CRUD, verification flow |

**Laravel Mapping**:
- `Auth/User` → `libs/feature/users`
- `Common/Company` → `libs/feature/organizations`
- `Setting/Tax` + `Setting/Currency` → `libs/feature/jurisdictions`
- `Laratrust` → NestJS RBAC guards

## 4. Phase 2: VAT Engine & Tenancy (Weeks 6-8)

**Goal**: Build the core VAT declaration engine.

| Week | Task | Deliverable |
|------|------|-------------|
| 6 | VAT calculation engine | Rate resolver, context builder, line/return calculator |
| 6 | Rounding service | Currency precision, discrepancy adjustment |
| 7 | VAT returns module | Return CRUD, validation, state machine |
| 7 | VAT return items | Line items, totals calculation |
| 8 | Transactions module | Transaction CRUD, categorization |
| 8 | Import pipeline | CSV/Excel import with Zod validation |

**Laravel Mapping**:
- `Document/Document` → `VatReturn`
- `Document/DocumentItem` → `VatReturnItem`
- `Document/DocumentTotal` → Calculated field in `VatReturn`
- `Banking/Transaction` → `Transaction`
- `Jobs/Document/*` → NestJS service methods + events

## 5. Phase 3: Integrations & Notifications (Weeks 9-11)

**Goal**: Connect to tax authorities and build notification system.

| Week | Task | Deliverable |
|------|------|-------------|
| 9 | Tax authority adapter interface | Provider registry, base provider |
| 9 | HMRC provider | OAuth2, submit return, check status |
| 10 | EuroVAT provider | VIES SOAP validation |
| 10 | Notification system | In-app, email, push channels |
| 11 | Webhook system | Outgoing + incoming webhooks |
| 11 | Queue infrastructure | BullMQ, processors, DLQ |

**Laravel Mapping**:
- `Jobs/Banking/*` → Queue processors
- `Notifications/*` → Notification service + channels
- `Listeners/*` → Event bus listeners

## 6. Phase 4: Frontend Shell (Weeks 12-14)

**Goal**: Build the React frontend with full navigation and state management.

| Week | Task | Deliverable |
|------|------|-------------|
| 12 | Auth pages | Login, MFA, forgot password, reset |
| 12 | Dashboard shell | Sidebar, header, org switcher |
| 13 | VAT return pages | List, create, edit, review, submit |
| 13 | Transaction pages | List, import, detail |
| 14 | Settings pages | Profile, organization, integrations |
| 14 | Admin pages | User management, system settings |

**Laravel Mapping**:
- `resources/views/*` → React pages in `apps/web/src/routes`
- `app/View/Components/*` → `libs/ui/src/lib/components`
- Livewire components → React + TanStack Query

## 7. Phase 5: Advanced Features (Weeks 15-17)

**Goal**: Reporting, reconciliation, search, multi-currency.

| Week | Task | Deliverable |
|------|------|-------------|
| 15 | Reporting engine | VAT summary, export (CSV/Excel/PDF/JSON) |
| 15 | Multi-currency | Exchange rates, conversion, base currency reporting |
| 16 | Reconciliation | Bank statement import, matching engine |
| 16 | Search | PostgreSQL FTS + Meilisearch integration |
| 17 | Advanced VAT | Reverse charge, MOSS, OSS schemes |

**Laravel Mapping**:
- `app/Reports/*` → Reporting module
- `app/Jobs/Common/CreateMediableFor*` → Export processors
- `Banking/Reconciliation` → Reconciliation module

## 8. Phase 6: Observability & Resilience (Weeks 18-19)

**Goal**: Production-ready monitoring and fault tolerance.

| Week | Task | Deliverable |
|------|------|-------------|
| 18 | Metrics & tracing | Prometheus, OpenTelemetry, Grafana |
| 18 | Health checks | Liveness, readiness, dependency checks |
| 19 | Resilience patterns | Circuit breaker, retry, timeout, bulkhead |
| 19 | Alerting | Alertmanager rules, PagerDuty integration |

## 9. Phase 7: Compliance & Security (Weeks 20-21)

**Goal**: GDPR, security hardening, audit trails.

| Week | Task | Deliverable |
|------|------|-------------|
| 20 | Security audit | OWASP Top 10, penetration testing |
| 20 | GDPR compliance | Data subject requests, consent management |
| 21 | Audit trails | Immutable logs, change tracking |
| 21 | Backup & DR | Automated backups, restore procedures |

## 10. Parallel Work Streams

Some tracks can run in parallel:

```
Frontend Track:            Backend Track:               Infra Track:
Phase 0: Setup             Phase 0: Setup                Phase 0: Setup
Phase 1: Auth pages        Phase 1: Core Domain          Phase 1: CI/CD
Phase 2: Dashboard         Phase 2: VAT Engine           Phase 2: K8s
Phase 3: VAT pages         Phase 3: Integrations         Phase 3: Monitoring
Phase 4: Transactions      Phase 4: Notifications        Phase 4: Security
Phase 5: Reports           Phase 5: Advanced             Phase 5: Compliance
Phase 6: Polish            Phase 6: Resilience           Phase 6: Backup/DR
```

## 11. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Tax authority API changes | Abstract provider interface, versioned adapters |
| Performance at scale | Early load testing, read replicas, caching |
| Compliance gaps | Legal review at each phase, audit trail from day 1 |
| Frontend complexity | Shared component library, design system |
| Team skill gaps | Training on NestJS, Prisma, Nx |

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| API P95 latency | < 300ms |
| Frontend LCP | < 2s |
| Test coverage | > 80% unit, > 70% integration |
| Build time | < 5 min for affected |
| Deployment frequency | Weekly |
| Lead time | < 2 weeks |
| MTTR | < 1 hour |
