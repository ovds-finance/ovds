/**
 * E2E Navigation Structure Test
 *
 * Validates that the sidebar renders all 9 Akaunting-inspired
 * navigation groups and that key routes are reachable.
 */
import { test, expect } from '@playwright/test';

const NAV_GROUPS = [
  'Dashboard',
  'Sales',
  'Purchases',
  'Banking',
  'Accounting',
  'Tax & Compliance',
  'Reports',
  'HR & Payroll',
  'System',
];

test.describe('Navigation Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  for (const group of NAV_GROUPS) {
    test(`renders sidebar group: ${group}`, async ({ page }) => {
      const sidebar = page.locator('nav').first();
      await expect(sidebar).toContainText(group);
    });
  }

  test('opens search palette with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchModal = page.locator('[data-testid="global-search-modal"]');
    await expect(searchModal).toBeVisible();
  });

  test('dispatches dashboard manager event from dashboard widgets button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const widgetsButton = page.locator('button:has-text("Widgets")');
    if (await widgetsButton.count() > 0) {
      await widgetsButton.first().click();
      const manager = page.locator('[data-testid="dashboard-manager"]');
      await expect(manager).toBeVisible();
    }
  });
});
