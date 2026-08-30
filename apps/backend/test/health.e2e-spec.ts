/**
 * Health & API smoke E2E tests.
 *
 * These tests verify the API is reachable and returns expected responses.
 * They do NOT require a logged-in user — they test public/health endpoints.
 *
 * Run with: npm run test:e2e
 * Requires: PLAYWRIGHT_BASE_URL pointing to a running OVDS instance
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('API Health @smoke', () => {
  test('GET /api/health returns healthy status', async ({ request }) => {
    // The health controller exposes /api/health/detailed for a full status check.
    // The response is wrapped: { data: { status, ... }, statusCode, success, ... }
    const response = await request.get(`${API_BASE}/api/health/detailed`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Handle both wrapped ({ data: { status } }) and unwrapped ({ status }) shapes
    const status = body?.data?.status ?? body?.status;
    expect(status).toEqual(expect.stringContaining('healthy'));
  });

  test('GET /api/health/live returns 200', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/live`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/health/ready returns 200', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health/ready`);
    // May return 200 or 503 depending on DB state — just ensure it responds
    expect([200, 503]).toContain(response.status());
  });
});

test.describe('Frontend @smoke', () => {
  test('root page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    // Wait for the app to render something meaningful
    await page.waitForLoadState('networkidle');

    // Should show login page or dashboard
    const title = await page.title();
    expect(title).toBeTruthy();

    // No critical JS errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('login page renders form elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should have either a login form or redirect to dashboard
    const hasLoginForm = await page
      .locator('[data-testid="login-username"], [data-testid="login-password"]')
      .count();
    const hasDashboard = await page
      .locator('[data-testid="dashboard"]')
      .or(page.locator('text=Dashboard'))
      .count();

    expect(hasLoginForm + hasDashboard).toBeGreaterThan(0);
  });
});
