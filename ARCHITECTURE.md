# OVDS Full-Stack Architecture

This document describes the complete full-stack architecture of the OVDS platform, including design tokens, shared validation, serialization, and architecture boundaries.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         apps/frontend (React)                       │
│  Uses: @ovds/ui, @ovds/design-system, @ovds/design-tokens,         │
│        @ovds/contracts, @ovds/dto, @ovds/shared                    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ imports
┌─────────────────────▼───────────────────────────────────────────────┐
│  packages/ui (Tailwind + Radix + Lucide)                             │
│  Uses: @ovds/design-system, @ovds/design-tokens, @ovds/shared       │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ imports
┌─────────────────────▼───────────────────────────────────────────────┐
│  packages/design-system (token objects, status colors)              │
│  Uses: @ovds/design-tokens, @ovds/shared                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ imports
┌─────────────────────▼───────────────────────────────────────────────┐
│              packages/design-tokens (CANONICAL VALUES)               │
│  tokens.ts → css-variables.ts → backend.ts                          │
│  Single source of truth for ALL design tokens                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         apps/backend (NestJS)                       │
│  Uses: @ovds/contracts, @ovds/dto, @ovds/database, @ovds/shared    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ imports
┌─────────────────────▼───────────────────────────────────────────────┐
│  packages/contracts (Zod schemas, pipes, filters, interceptors)     │
│  Uses: @ovds/dto, @ovds/design-tokens (optional), zod              │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ imports
┌─────────────────────▼───────────────────────────────────────────────┐
│  packages/shared/dto (Zod schemas, serializers, resolvers)          │
│  Uses: @ovds/shared, zod, class-validator                           │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ imports
┌─────────────────────▼───────────────────────────────────────────────┐
│  packages/shared (types, utils, constants)                          │
│  Uses: @ovds/core                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  packages/database (Prisma client)                                  │
│  Uses: @ovds/shared                                                 │
│  ⚠️  ONLY backend may import this package                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Design Token Flow

```
packages/design-tokens/src/tokens.ts
    ↓ (canonical values)
packages/ui/src/styles/tokens.css (CSS custom properties)
    ↓
packages/ui/tailwind.config.js (Tailwind utilities)
    ↓
React components: className="bg-surface-light text-primary"
    ↓
@ovds/design-tokens/backend.ts (NestJS services)
```

## Validation Flow

### Frontend (React)
```
User Input
    │
    ▼
useZodForm(LoginSchema)          ← schema from @ovds/dto
    │
    ▼
createZodResolver(schema)        ← validates on submit
    │
    ▼
api.post('/login', values)       ← clean validated data
```

### Backend (NestJS)
```
HTTP Request
    │
    ▼
ZodValidationPipe(LoginSchema)   ← same schema from @ovds/dto
    │
    ▼
Controller method receives typed DTO
    │
    ▼
Service layer (business logic)
    │
    ▼
SerializeResponseInterceptor     ← strips sensitive fields, formats dates
    │
    ▼
HttpExceptionFilter              ← standard ApiResponse envelope
    │
    ▼
JSON Response → Frontend
```

## Serialization Flow

```
Prisma Entity
    ↓
SerializeResponseInterceptor
    ↓
serializeEntity()
    ├── stripSensitive() → removes password, apiKey, etc.
    ├── serializeDate() → ISO-8601 strings
    └── serializeDecimal() → string precision
    ↓
HttpExceptionFilter
    ↓
Standard ApiResponse envelope
    ↓
Frontend receives predictable JSON
```

## Package Boundaries

| Package | Can Import | Cannot Import |
|---------|-----------|---------------|
| `apps/frontend` | `@ovds/ui`, `@ovds/design-system`, `@ovds/design-tokens`, `@ovds/contracts`, `@ovds/dto`, `@ovds/shared` | `packages/database`, `apps/backend`, `packages/modules` |
| `apps/backend` | `@ovds/contracts`, `@ovds/dto`, `@ovds/database`, `@ovds/shared` | `packages/ui`, `apps/frontend`, `apps/portal` |
| `packages/shared` | `@ovds/core` | `@ovds/design-system`, `@ovds/ui` |
| `packages/database` | `@ovds/shared` | `@ovds/design-system`, `@ovds/ui`, `apps/*` |

## Domain Coverage

| Domain | Zod Bridge | Status |
|--------|-----------|--------|
| auth | ✅ | Login, Register, User, Role |
| hr | ✅ | Employee, Department, Leave, Payroll |
| ovds | ✅ | Invoice, Bill, Customer, Vendor |
| trade | ✅ | Shipment, Forex, Proforma |
| loyalty | ✅ | Transaction, Tier, Reward |
| settings | ✅ | Categories, RBAC, Wizard |
| banking | ✅ | Accounts, Transactions, Reconciliation |
| crm | ✅ | Leads, Opportunities, Activities |
| inventory | ✅ | Items, Warehouses, Stock |
| purchases | ✅ | PO, GRN, Debit Note, Payment |
| tax | ✅ | VAT, WHT, TOT, BIT, Compliance |
| accounting | ✅ | Journal, Accounts, Fiscal Year |
| compliance | ✅ | Frameworks, Controls, Risks |
| projects | ✅ | Projects, Tasks, Timers |

## Commands

```bash
# Validate architecture
node scripts/check-arch.mjs

# Audit for hardcoded colors/tokens
node scripts/audit-tokens.mjs

# Validate Zod bridge coverage
node scripts/validate-zod-coverage.mjs

# Sync CSS variables from tokens (includes dark mode)
node packages/design-tokens/scripts/sync-css-variables.mjs

# Generate Tailwind config from tokens
node packages/design-tokens/scripts/generate-tailwind-config.mjs

# Scaffold new domain zod-bridge
node scripts/scaffold-domain.mjs <domain-name>

# Pre-commit hooks (after pnpm install)
pnpm run prepare
```
