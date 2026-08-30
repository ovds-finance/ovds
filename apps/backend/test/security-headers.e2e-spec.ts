/**
 * Security Headers E2E tests.
 *
 * Verifies that OWASP-recommended security headers are present on all responses.
 *
 * Run with: npm run test:e2e
 * Requires: PLAYWRIGHT_BASE_URL pointing to a running OVDS instance
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Security Headers', () => {
  test('public endpoints include X-Frame-Options', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-frame-options']).toBeDefined();
  });

  test('public endpoints include X-Content-Type-Options: nosniff', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('public endpoints include Content-Security-Policy', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-security-policy']).toBeDefined();
  });

  test('public endpoints include Cross-Origin-Resource-Policy', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['cross-origin-resource-policy']).toBeDefined();
  });

  test('public endpoints include Permissions-Policy', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['permissions-policy']).toBeDefined();
  });

  test('public endpoints include Referrer-Policy', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['referrer-policy']).toBeDefined();
  });

  test('HSTS header is present in non-development mode', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    if (process.env.NODE_ENV !== 'development') {
      expect(response.headers()['strict-transport-security']).toBeDefined();
    }
  });

  test('CORS headers are present for allowed origins', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`).set('Origin', 'http://localhost:5173');
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('no sensitive headers leak server version', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-powered-by']).toBeUndefined();
  });
});
