/**
 * @ovds/contracts — root barrel
 *
 * Re-exports the complete oRPC contract, all Zod schemas, and prisma-zod types.
 * Both the NestJS backend and React frontend import from this single entry point.
 *
 * Usage:
 *   import { appContract, InvoiceSchema, type Invoice } from '@ovds/contracts';
 *
 * NOTE: prisma-zod is NOT re-exported here in source — it is injected into the
 * compiled dist/index.js by the build script (build-cjs.ts) to keep tsc fast.
 * Import prisma-zod directly via: import { ... } from '@ovds/contracts/prisma-zod'
 */

// ── Router contract (oRPC) ────────────────────────────────────────────────────
export * from './router/index';

// ── Hand-crafted Zod schemas ──────────────────────────────────────────────────
export * from './schemas/index';

// ── NestJS Zod validation pipe ────────────────────────────────────────────────
export * from './pipes/zod-validation.pipe';

// ── Global HTTP exception filter (standard ApiResponse envelope) ─────────────
export * from './filters/http-exception.filter';
