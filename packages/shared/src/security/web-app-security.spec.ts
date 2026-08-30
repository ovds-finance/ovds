import { describe, it, expect } from 'vitest';
import {
  WEB_APP_SECURITY_CHECKLIST,
  getWebAppSecuritySummary,
} from './web-app-security-checklist';
import { buildSignedPayload, requiresSignedRequestPath } from './request-signing';
import { PASSWORD_COMPLEXITY_REGEX } from './password-policy';

describe('web-app-security-checklist', () => {
  it('has checklist items mapped to OVDS controls', () => {
    expect(WEB_APP_SECURITY_CHECKLIST.length).toBeGreaterThan(15);
    expect(WEB_APP_SECURITY_CHECKLIST.every((i) => i.id && i.title && i.ovdsControl)).toBe(true);
  });

  it('reports readiness summary', () => {
    const summary = getWebAppSecuritySummary();
    expect(summary.total).toBe(WEB_APP_SECURITY_CHECKLIST.length);
    expect(summary.readinessScore).toBeGreaterThanOrEqual(90);
  });
});

describe('request-signing paths', () => {
  it('matches banking transfer endpoints', () => {
    expect(requiresSignedRequestPath('/banking/transfers', 'POST')).toBe(true);
    expect(requiresSignedRequestPath('/banking/transfers/abc/approve', 'PATCH')).toBe(true);
    expect(requiresSignedRequestPath('/ovds/invoices', 'POST')).toBe(false);
  });

  it('builds signed payload for POST body', () => {
    const payload = buildSignedPayload('POST', { amount: 100 });
    expect(payload).toEqual({ amount: 100 });
  });
});

describe('password policy', () => {
  it('requires complexity', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Weakpass1!')).toBe(true);
    expect(PASSWORD_COMPLEXITY_REGEX.test('weakpassword')).toBe(false);
  });
});
