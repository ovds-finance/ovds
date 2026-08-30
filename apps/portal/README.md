# OVDS Client Portal

**Status: Experimental / Work-in-Progress**

This is a standalone client-facing portal for customers and vendors to view invoices and payments.

## Current State
- Minimal viable implementation with 3 routes: invoices, payments, profile
- Registered in Nx monorepo (`apps/portal`)
- Depends on `@ovds/ui` and `@ovds/shared`
- Has NOT been built or deployed yet (`dist/` does not exist)
- No test coverage

## Intended Features
- Client invoice viewing and payment tracking
- Vendor bill viewing and payment history
- Profile management (placeholder - "coming soon")

## Usage
```bash
npm run dev --workspace ovds-portal
npm run build --workspace ovds-portal
```

## Decision Needed
This portal needs either:
1. Full implementation and integration into the deployment pipeline
2. Documentation as an experimental/optional component
3. Removal if superseded by another solution

See `docs/ovds.md` and `docs/Modern UI/UX.md` for architectural context.
