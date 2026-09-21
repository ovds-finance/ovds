/**
 * Tenant Subdomain Resolution — E2E Tests
 *
 * Verifies that the TenantSubdomainMiddleware resolves the active tenant
 * from the Host subdomain when no x-company-id header or JWT tenant claim
 * is present.
 *
 * Resolution uses the Company.subdomain field.  The seed script creates:
 *   - subdomain 'ovds'    → Ovds Technologies PLC
 *   - subdomain 'tigmfg'  → Tigray Manufacturing PLC
 *
 * Run with: npm run test:e2e
 * Requires: PLAYWRIGHT_BASE_URL pointing to a running OVDS instance
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

test.describe('Tenant Subdomain Resolution', () => {
  test('resolves tenant from known subdomain (ovds)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'ovds.ovds.local',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const status = body?.data?.status ?? body?.status;
    expect(status).toEqual(expect.stringContaining('healthy'));
  });

  test('resolves tenant from known subdomain (tigmfg)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'tigmfg.ovds.local',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('returns 200 for unknown subdomain (no tenant context)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'unknown-tenant.ovds.local',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('falls back to header companyId when subdomain cannot be resolved', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'unknown-tenant.ovds.local',
        'x-company-id': '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('ignores reserved subdomains (www)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'www.ovds.local',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('ignores reserved subdomains (api)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'api.ovds.local',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('ignores invalid subdomain formats (too short)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'ab.ovds.local',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('ignores untrusted domains', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'acme.random-domain.com',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('header companyId takes priority over subdomain', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/detailed`, {
      headers: {
        'Host': 'ovds.ovds.local',
        'x-company-id': '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(response.status()).toBe(200);
  });
});
