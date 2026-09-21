/**
 * @ovds/domains-accounting
 *
 * Backend domain library for the Accounting domain.
 * Exports services and types needed by the thin NestJS app module/controllers.
 *
 * Scope: backend (scope:backend, type:domain)
 *
 * What belongs here:
 *  - All business logic services (AccountingService and sub-services)
 *  - Domain events
 *  - Domain-specific guards
 *
 * What does NOT belong here:
 *  - NestJS modules (@Module decorators) — those stay in apps/backend
 *  - Controllers — those stay in apps/backend
 *  - Prisma schema — lives in packages/database/prisma/schema.prisma
 */

// Primary service
export { AccountingService } from './lib/accounting.service';
export * from './lib';
export * from './dto';
export * from './events';
export * from './entities';
