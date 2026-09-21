/**
 * @ovds/domains-infrastructure
 *
 * Backend infrastructure primitives shared by all domain libraries.
 * Import from this package — never copy these into domain-specific code.
 *
 * Scope: backend (scope:backend, type:infrastructure)
 */
export * from './base.service';
export * from './where.builder';
export * from './pagination.helper';
export * from './transaction.helper';
export * from './exceptions';
