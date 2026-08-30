/**
 * @ovds/shared — single export point
 * Consumed by: frontend (React via Vite), backend (NestJS CommonJS), and build tools
 *
 * This package re-exports from @ovds/core (central Core System) plus
 * additional shared utilities that are not part of the core kernel.
 *
 * No extensions — tsc (moduleResolution: node) resolves bare specifiers.
 * Vite resolves via alias + resolve.extensions config in vite.config.ts.
 */
export * from '@ovds/core';
export * from './api-client';
export * from './audit-trail';
export * from './business-roles';
export * from './compliance';
export * from './config';
export * from './constants';
export * from './device-control';
export * from './efy';
export * from './eims';
export * from './fmt';
export * from './health';
export * from './icons';
export * from './integration';
export * from './license-crypto.native';
export * from './license-crypto.types';
export * from './license-crypto.web';
export * from './master-compliance-checklist';
export * from './accreditation-checklist';
export * from './monetization';
export * from './notifications';
export * from './offline';
export * from './onboarding';
export * from './ovds';
export * from './payment-gateway';
export * from './pipeline';
export * from './rbac';
export * from './release';
export * from './settings';
export * from './settings-types';
export * from './subscription-update';
export * from './tax-invoice-qr';
export * from './types';
export * from './utils';
export * from './version';
export * from './auth';
export * from './appstore';
export * from './audit';
export * from './dashboard';
export * from './hr';
export * from './ingestion';
export * from './fiscal/hardware-types';
export * from './fiscal/sector-kernel';
export * from './security';
