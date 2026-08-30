import { test, expect, type Page } from '@playwright/test';

// Credentials are read from environment variables — never hardcode in tests.
// Set OVDS_TEST_USER and OVDS_TEST_PASS before running e2e tests.
const USERNAME = process.env.OVDS_TEST_USER ?? 'admin@ovds.com';
const PASSWORD = process.env.OVDS_TEST_PASS ?? '';

if (!PASSWORD || PASSWORD.length < 6) {
  throw new Error(
    `[e2e] OVDS_TEST_PASS is missing or too short. Set env var OVDS_TEST_PASS (min length: 6). Got length=${PASSWORD.length}`,
  );
}

/** Shared login helper — reused across tests */
async function login(page: Page): Promise<void> {
  // Deterministic login for E2E:
  // 1) Call backend login directly (bypasses UI proxy/UX issues)
  // 2) Store token + user in localStorage using frontend keys
  // 3) Navigate/verify we are authenticated (not stuck on /login)

  const apiBase = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  const loginUrl = `${apiBase}/api/auth/login`;

  const res = await page.request.post(loginUrl, {
    data: { username: USERNAME, password: PASSWORD },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.message ?? body?.data?.message ?? body?.error ?? res.statusText;
    throw new Error(
      `Backend login failed (${res.status}). ${msg ?? ''}`.trim(),
    );
  }

  // The backend login response is wrapped; extract using a few common shapes.
  // We keep it flexible because runtime schema can differ between builds.
  const wrapped = body?.data ?? body;

  const token =
    wrapped?.access_token ??
    wrapped?.token ??
    wrapped?.data?.access_token ??
    wrapped?.data?.token;

  const user =
    wrapped?.user ??
    wrapped?.data?.user ??
    wrapped?.user_data ??
    wrapped?.data?.user_data;

  if (!token || !user) {
    throw new Error(
      `Backend login response missing token/user. Got keys=${JSON.stringify(Object.keys(wrapped ?? {}))} body=${JSON.stringify(body).slice(0, 500)}`,
    );
  }

  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('ovds_token', token);
      localStorage.setItem('ovds_user', JSON.stringify(user));
    },
    { token, user },
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  if (/\/login/i.test(currentUrl)) {
    const errorText = (
      await page
        .locator('[role="alert"], .error, text=/invalid|failed|unauthorized/i')
        .first()
        .textContent()
        .catch(() => '')
    )?.trim();
    throw new Error(
      `Login did not persist. Still on /login. ${errorText ? `Reason: ${errorText}` : ''}`.trim(),
    );
  }

  await expect(page).toHaveURL(/dashboard|home|app/i, { timeout: 15_000 });
}

test.describe('OVDS CRUD E2E', () => {
  test('Login and VAT CRUD @smoke', async ({ page }) => {
    await page.goto('/login');
    await login(page);

    // Navigate to VAT Administration via sidebar
    await page
      .getByRole('link', { name: /vat|tax administration/i })
      .first()
      .click();
    await page.waitForURL(/vat|tax/i);
    await expect(
      page.locator('text=Input VAT').or(page.locator('text=Input Ledger')),
    ).toBeVisible();

    // Create Input VAT entry
    await page.fill('input[placeholder*="supplier" i]', 'E2E Test Supplier');
    await page.fill(
      'input[placeholder*="amount" i], input[type="number"]',
      '1500',
    );
    await page.click(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("Save")',
    );
    await expect(
      page.locator('table tbody tr:has-text("E2E Test Supplier")'),
    ).toBeVisible();

    // Delete
    await page.locator('button:has-text("Delete")').first().click();
    await page.click('button:has-text("Confirm"), button:has-text("Yes")');
    await expect(page.locator('table')).not.toContainText('E2E Test Supplier');
  });

  test('Employee CRUD', async ({ page }) => {
    await page.goto('/login');
    await login(page);

    await page.getByRole('link', { name: /employee|hr|staff/i }).click();
    await page.waitForURL(/employee|hr/i);

    const empName = 'E2E Employee ' + Date.now();
    await page.fill('input[placeholder*="name" i]', empName);
    await page.fill(
      'input[placeholder*="email" i]',
      `e2e${Date.now()}@test.com`,
    );
    await page.click(
      'button:has-text("Create"), button:has-text("Add Employee")',
    );
    await expect(page.locator(`table >> text=${empName}`)).toBeVisible({
      timeout: 5000,
    });

    // Delete
    await page
      .locator(`table tr:has-text("${empName}") button[aria-label*="delete"]`)
      .click();
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('table')).not.toContainText(empName);
  });

  test('Invoices CRUD & DTO Validation', async ({ page }) => {
    await page.goto('/login');
    await login(page);

    await page.getByRole('link', { name: /invoice|billing/i }).click();

    // Invalid DTO — negative amount should be rejected
    await page.fill('input[placeholder*="amount" i]', '-100');
    await page.click('button:has-text("Create")');
    await expect(
      page.locator('[role="alert"]').filter({ hasText: /invalid|error|400/i }),
    ).toBeVisible();

    // Valid CRUD
    const invRef = 'E2E-INV-' + Date.now();
    await page.fill('input[placeholder*="reference" i]', invRef);
    await page.fill('input[placeholder*="amount" i]', '2000');
    await page.click('button:has-text("Create")');
    await expect(page.locator(`table >> text=${invRef}`)).toBeVisible();

    // Delete
    await page.locator('button[aria-label*="delete"]').first().click();
    await expect(page.locator('table')).not.toContainText(invRef);
  });

  test('Attendance Check-in/Check-out', async ({ page }) => {
    await page.goto('/login');
    await login(page);

    await page
      .getByRole('link', { name: /attendance|clock/i })
      .first()
      .click();

    await page.click(
      'button:has-text("Check In"), button:has-text("Clock In")',
    );
    await expect(page.locator('text=Checked In')).toBeVisible({
      timeout: 3000,
    });

    await page.click(
      'button:has-text("Check Out"), button:has-text("Clock Out")',
    );
    await expect(
      page.locator('text=Checked Out').or(page.locator('text=Time Out')),
    ).toBeVisible();
  });
});
