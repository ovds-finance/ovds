/**
 * @ovds/domains-vat
 *
 * Backend domain library for the VAT domain.
 * Holds VAT declaration filing logic (data-access) previously duplicated in
 * apps/backend/src/vat. The NestJS app injects PrismaService + AuditLogService
 * via DI and consumes this library through its public API.
 *
 * Scope: backend (scope:backend, type:domain, domain:vat)
 */
export * from './dto';
export { VatService } from './lib/vat.service';
