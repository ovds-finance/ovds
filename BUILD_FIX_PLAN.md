# Build Fix Plan for OVDS Monorepo

## Problem Summary
The `pnpm run build:all` command fails with numerous TypeScript errors across 129 projects. Root causes:

1. **Prisma Schema Mismatch** - Main `schema.prisma` (350 models, VAT-focused) missing models from `schema.base.prisma` (10 models, accounting core) that the code expects
2. **TypeScript rootDir Conflicts** - Shared-domains packages compiled inline with cloud-api instead of as separate libraries
3. **Missing Dependencies** - `@aws-sdk/client-kms` not installed
4. **Various TypeScript Errors** - In auditor package and other feature packages

## Critical Schema Differences

| Base Schema (Expected) | Main Schema (Actual) | Impact |
|------------------------|---------------------|--------|
| `Tenant` model | `Company` model (different fields) | Code uses `prisma.tenant` - doesn't exist |
| `CurrencyRate` (PascalCase) | `currencyrate` (lowercase) | Code uses `prisma.currencyRate` - wrong case |
| `TenantModule` | `TenantVatModule` | Code uses `prisma.tenantModule` - doesn't exist |
| `JournalEntryStatus` enum | String status field | Code imports enum - doesn't exist |
| `AccountType.REVENUE` | `AccountType.INCOME` | Code uses REVENUE - doesn't exist |
| JournalEntry: entryNumber, postedAt, reversedAt, lines | Missing these fields | Multiple TS errors |
| Account: currency field | Missing | TS errors in financial reports |
| JournalLine: tenantId, sortOrder, account relation | Missing | TS errors in validators |

## Fix Strategy

### Phase 1: Fix Prisma Schema (Highest Priority)
**File: `packages/database/prisma/schema.prisma`**

Add missing models from base schema:
1. Add `Tenant` model (can reference Company or be standalone)
2. Add `CurrencyRate` model (PascalCase)
3. Add `TenantModule` model
4. Add `JournalEntryStatus` enum
5. Add `GlobalSetting` model
6. Add `TenantRegistry` model
7. Add `AuditLog` model
8. Add `BankAccount` model (if not present with correct fields)

Add missing fields to existing models:
1. `JournalEntry`: entryNumber, postedAt, reversedAt, reversedBy, lines relation
2. `Account`: currency field
3. `JournalLine`: tenantId, sortOrder, account relation

Add `REVENUE` to `AccountType` enum (or alias INCOME)

### Phase 2: Fix TypeScript Configuration
**Files: Multiple tsconfig files**

The rootDir conflict occurs because:
- Cloud-api tsconfig has paths pointing to shared-domains source
- Shared-domains packages have their own tsconfig.lib.json with different rootDir
- Nx builds shared-domains as dependencies first (`dependsOn: ["^build"]`)

**Fix Options:**
A. Build shared-domains as separate libraries first, then reference built outputs in cloud-api
B. Remove path mappings from cloud-api tsconfig, use package.json exports
C. Use project references in tsconfig

**Recommended:** Option A - Ensure Nx builds libraries before apps, and apps reference built outputs via package.json exports

### Phase 3: Install Missing Dependencies
**File: `packages/shared-domains/infra/package.json`**
- Add `@aws-sdk/client-kms` dependency

### Phase 4: Fix Auditor Package
**Files in `packages/Auditor/src/`**
- Fix `SUSPECTED` -> `SUSPECT` enum value
- Fix duplicate exports (ROLES_KEY, Roles)
- Fix decorator issues in overview.controller.ts
- Fix Prisma service type issues

### Phase 5: Regenerate and Rebuild
1. Run `pnpm generate` in database package
2. Run `pnpm run build:all` again

## Files to Modify

### Prisma Schema
- `packages/database/prisma/schema.prisma` - Add missing models/fields

### TypeScript Config
- `apps/cloud-api/tsconfig.json` - Remove shared-domains path mappings
- `packages/shared-domains/*/tsconfig.lib.json` - Ensure proper library build config
- `tsconfig.base.json` - Verify path mappings point to built outputs

### Dependencies
- `packages/shared-domains/infra/package.json` - Add @aws-sdk/client-kms

### Auditor Package
- `packages/Auditor/src/fraud-detection/fraud-detection.service.ts`
- `packages/Auditor/src/index.ts`
- `packages/Auditor/src/overview/overview.controller.ts`
- `packages/Auditor/src/prisma/prisma.service.ts`

## Verification Steps
1. Run `pnpm --filter @ovds/database generate` to regenerate Prisma client
2. Run `pnpm run build:all` - should complete without errors
3. Run `pnpm run typecheck` if available
4. Run tests for affected packages

## Risk Assessment
- **High**: Schema changes affect database migrations - need to verify with db:push/migrate
- **Medium**: TypeScript config changes may affect IDE support
- **Low**: Dependency additions are safe

## Rollback Plan
- Git commit before changes
- If migrations fail, revert schema.prisma and regenerate client