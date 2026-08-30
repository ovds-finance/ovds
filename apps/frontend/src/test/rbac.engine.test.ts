import { describe, it, expect } from 'vitest';
import { rbac, ROLE_HIERARCHY } from '../rbac/rbac';
import type { AppRole } from '../rbac/rbac';

const r = (s: string) => s as AppRole;

// -- Role hierarchy ------------------------------------------------------------
describe('ROLE_HIERARCHY', () => {
  it('SPURADMIN has the highest weight', () => {
    const max = Math.max(...Object.values(ROLE_HIERARCHY));
    expect(ROLE_HIERARCHY.SPURADMIN).toBe(max);
  });

  it('EMPLOYEE has a lower weight than HR', () => {
    expect(ROLE_HIERARCHY.EMPLOYEE).toBeLessThan(ROLE_HIERARCHY.HR);
  });

  it('OVDS has a higher weight than ACCOUNTING', () => {
    expect(ROLE_HIERARCHY.OVDS).toBeGreaterThan(ROLE_HIERARCHY.ACCOUNTING);
  });

  it('CLIENT has the lowest weight', () => {
    const min = Math.min(...Object.values(ROLE_HIERARCHY));
    expect(ROLE_HIERARCHY.CLIENT).toBe(min);
  });
});

// -- rbac.can() with Business Type Gating --------------------------------------
describe('rbac.can()', () => {
  it('SPURADMIN can do everything regardless of business type', () => {
    expect(rbac.can(r('SPURADMIN'), 'invoices:write')).toBe(true);
    expect(rbac.can(r('SPURADMIN'), 'payroll:approve', undefined, 'SMALL_BUSINESS')).toBe(true);
  });

  it('EMPLOYEE cannot write invoices', () => {
    expect(rbac.can(r('EMPLOYEE'), 'invoices:write')).toBe(false);
  });

  it('ovds can approve payroll if payroll module is enabled for business type', () => {
    // Assuming 'LARGE_ENTERPRISE' has payroll enabled
    expect(rbac.can(r('ovds'), 'payroll:approve', undefined, 'LARGE_ENTERPRISE')).toBe(true);
  });

  it('ovds cannot approve payroll if business type gates the payroll module', () => {
    // Assuming 'SMALL_BUSINESS' has payroll disabled/hidden
    expect(rbac.can(r('ovds'), 'payroll:approve', undefined, 'SMALL_BUSINESS')).toBe(false);
  });

  it('HR can generate payroll but not approve it', () => {
    expect(rbac.can(r('HR'), 'payroll:generate', undefined, 'LARGE_ENTERPRISE')).toBe(true);
    expect(rbac.can(r('HR'), 'payroll:approve', undefined, 'LARGE_ENTERPRISE')).toBe(false);
  });
});

// -- rbac.canAccessRoute() -----------------------------------------------------
describe('rbac.canAccessRoute()', () => {
  it('EMPLOYEE cannot access /payroll-administration', () => {
    expect(rbac.canAccessRoute(r('EMPLOYEE'), '/hr/payroll-administration')).toBe(false);
  });

  it('HR can access /payroll-administration in LARGE_ENTERPRISE', () => {
    expect(rbac.canAccessRoute(r('HR'), '/hr/payroll-administration', 'LARGE_ENTERPRISE')).toBe(true);
  });

  it('HR cannot access /payroll-administration in SMALL_BUSINESS (gated module)', () => {
    expect(rbac.canAccessRoute(r('HR'), '/hr/payroll-administration', 'SMALL_BUSINESS')).toBe(false);
  });

  it('returns true for unknown routes (no policy = open)', () => {
    expect(rbac.canAccessRoute(r('EMPLOYEE'), '/some-unknown-route')).toBe(true);
  });
});

// -- rbac.vatLevel() -----------------------------------------------------------
describe('rbac.vatLevel()', () => {
  it('ovds has admin VAT level in LARGE_ENTERPRISE', () => {
    expect(rbac.vatLevel(r('ovds'), 'LARGE_ENTERPRISE')).toBe('admin');
  });

  it('ovds has none VAT level if tax module is gated', () => {
    // If we ever gate tax module for a specific business type
    expect(rbac.vatLevel(r('ovds'), 'NON_PROFIT')).toBe('none');
  });
});

// -- rbac.groupOf() ------------------------------------------------------------
describe('rbac.groupOf()', () => {
  it('ovds is in the ovds group', () => {
    expect(rbac.groupOf(r('ovds'))).toBe('ovds');
  });

  it('SPURADMIN is in the system group', () => {
    expect(rbac.groupOf(r('SPURADMIN'))).toBe('system');
  });
});
