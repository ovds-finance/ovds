/**
 * Event-Driven Ledger Integration — E2E Tests
 *
 * Verifies that the asynchronous event bus correctly bridges the Invoicing
 * module and the Double-Entry Ledger module.  When an invoice is created,
 * the InvoiceDomainEventService emits an INVOICE_EVENTS.CREATED event.
 * The InvoiceLedgerListener catches this event and posts a balanced GAAP
 * journal entry (DR Accounts Receivable / CR Revenue).
 *
 * Run with: npm run test:e2e
 * Requires: PLAYWRIGHT_BASE_URL pointing to a running OVDS instance
 *            OVDS_TEST_USER / OVDS_TEST_PASS env vars for authentication
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';
const USERNAME = process.env.OVDS_TEST_USER ?? 'admin@ovds.com';
const PASSWORD = process.env.OVDS_TEST_PASS ?? '';

if (!PASSWORD || PASSWORD.length < 6) {
  throw new Error(
    `[e2e] OVDS_TEST_PASS is missing or too short. Set env var OVDS_TEST_PASS (min length: 6).`,
  );
}

async function getAuthToken(request: any): Promise<string> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: USERNAME, password: PASSWORD },
  });

  if (!res.ok()) {
    throw new Error(`Login failed with status ${res.status()}`);
  }

  const body = await res.json();
  const wrapped = body?.data ?? body;
  const token = wrapped?.access_token ?? wrapped?.token;

  if (!token) {
    throw new Error('Login response missing access_token');
  }

  return token as string;
}

async function getCompanyId(request: any, token: string): Promise<string> {
  const res = await request.get(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.ok()).toBe(true);
  const body = await res.json();
  const wrapped = body?.data ?? body;
  const companyId = wrapped?.companyId ?? wrapped?.user?.companyId;

  if (!companyId) {
    throw new Error('Authenticated user has no companyId');
  }

  return companyId as string;
}

async function ensureModuleEnabled(
  request: any,
  token: string,
  companyId: string,
  moduleKey: string,
): Promise<void> {
  const res = await request.get(`${API_BASE}/api/platform/modules`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok()) {
    return;
  }

  const body = await res.json();
  const wrapped = body?.data ?? body;
  const modules = Array.isArray(wrapped) ? wrapped : wrapped?.modules ?? [];

  const existing = modules.find((m: any) => m.moduleKey === moduleKey || m.key === moduleKey);

  if (existing && existing.isEnabled) {
    return;
  }

  await request.post(
    `${API_BASE}/api/platform/modules/${moduleKey}/enable`,
    { headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId } },
  );
}

async function createAccountsIfMissing(
  request: any,
  token: string,
  companyId: string,
): Promise<void> {
  const res = await request.get(`${API_BASE}/api/accounting/accounts`, {
    headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId },
  });

  if (!res.ok()) {
    return;
  }

  const body = await res.json();
  const wrapped = body?.data ?? body;
  const existing = Array.isArray(wrapped) ? wrapped : wrapped?.data ?? [];

  const hasAR = existing.some(
    (a: any) => a.category === 'ACCOUNTS_RECEIVABLE' || a.code === '1130',
  );
  const hasRevenue = existing.some(
    (a: any) => a.category === 'REVENUE' || a.code === '4100',
  );

  if (hasAR && hasRevenue) {
    return;
  }

  const accountsToCreate: any[] = [];
  if (!hasAR) {
    accountsToCreate.push({
      code: '1130',
      name: 'Accounts Receivable',
      type: 'ASSET',
      category: 'ACCOUNTS_RECEIVABLE',
      isActive: true,
      isLeaf: true,
      allowPosting: true,
    });
  }
  if (!hasRevenue) {
    accountsToCreate.push({
      code: '4100',
      name: 'Sales Revenue',
      type: 'INCOME',
      category: 'REVENUE',
      isActive: true,
      isLeaf: true,
      allowPosting: true,
    });
  }

  for (const account of accountsToCreate) {
    await request.post(
      `${API_BASE}/api/accounting/accounts`,
      {
        headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId },
        data: account,
      },
    );
  }
}

test.describe('Event-Driven Ledger @accounting', () => {
  let authToken: string;
  let companyId: string;

  test.beforeAll(async ({ request }) => {
    authToken = await getAuthToken(request);
    companyId = await getCompanyId(request, authToken);
  });

  test.beforeEach(async ({ request }) => {
    await ensureModuleEnabled(request, authToken, companyId, 'double-entry');
    await createAccountsIfMissing(request, authToken, companyId);
  });

  test('creates balanced journal entry when invoice is created', async ({ request }) => {
    const invoiceRes = await request.post(
      `${API_BASE}/api/sales/invoices`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-company-id': companyId,
        },
        data: {
          customerName: 'Event Test Customer',
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          currencyCode: 'ETB',
          currencyRate: 1,
          items: [
            {
              description: 'Event-driven test item',
              quantity: 1,
              price: 1000,
              discountValue: 0,
              discountType: 'FIXED',
              showDiscount: false,
              showTax: true,
            },
          ],
        },
      },
    );

    expect(invoiceRes.ok()).toBe(true);
    const invoiceBody = await invoiceRes.json();
    const invoice = invoiceBody?.data ?? invoiceBody;
    expect(invoice?.id).toBeTruthy();

    const invoiceId = invoice.id;
    const expectedAmount = 1000;

    const maxAttempts = 20;
    const pollIntervalMs = 500;
    let journalEntries: any[] = [];
    let found = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const jeRes = await request.get(
        `${API_BASE}/api/accounting/journal-entries`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'x-company-id': companyId,
          },
        },
      );

      if (!jeRes.ok()) continue;

      const jeBody = await jeRes.json();
      const wrapped = jeBody?.data ?? jeBody;
      journalEntries = Array.isArray(wrapped?.data) ? wrapped.data : [];

      const match = journalEntries.find(
        (je: any) => je.reference === invoiceId || je.description?.includes(invoiceId),
      );

      if (match) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);

    const matchedEntry = journalEntries.find(
      (je: any) => je.reference === invoiceId || je.description?.includes(invoiceId),
    );

    expect(matchedEntry).toBeTruthy();
    expect(matchedEntry.status).toBe('POSTED');

    const lines = matchedEntry.journalLine ?? matchedEntry.journalLines ?? [];
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const totalDebit = lines.reduce(
      (sum: number, line: any) => sum + (Number(line.debit) || 0),
      0,
    );
    const totalCredit = lines.reduce(
      (sum: number, line: any) => sum + (Number(line.credit) || 0),
      0,
    );

    expect(totalDebit).toBeCloseTo(expectedAmount, 1);
    expect(totalCredit).toBeCloseTo(expectedAmount, 1);
    expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.01);

    const hasDebitLine = lines.some((line: any) => Number(line.debit) > 0);
    const hasCreditLine = lines.some((line: any) => Number(line.credit) > 0);
    expect(hasDebitLine).toBe(true);
    expect(hasCreditLine).toBe(true);
  });

  test('trial balance remains balanced after event-driven posting', async ({ request }) => {
    const invoiceRes = await request.post(
      `${API_BASE}/api/sales/invoices`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-company-id': companyId,
        },
        data: {
          customerName: 'Trial Balance Test Customer',
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          currencyCode: 'ETB',
          currencyRate: 1,
          items: [
            {
              description: 'Trial balance test item',
              quantity: 2,
              price: 500,
              discountValue: 0,
              discountType: 'FIXED',
              showDiscount: false,
              showTax: true,
            },
          ],
        },
      },
    );

    expect(invoiceRes.ok()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const tbRes = await request.get(
      `${API_BASE}/api/accounting/trial-balance`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-company-id': companyId,
        },
      },
    );

    expect(tbRes.ok()).toBe(true);
    const tbBody = await tbRes.json();
    const tbData = tbBody?.data ?? tbBody;

    expect(tbData?.summary).toBeTruthy();
    expect(tbData.summary.isBalanced).toBe(true);
    expect(tbData.summary.totalDebit).toBeCloseTo(tbData.summary.totalCredit, 1);
  });

  test('rejects unbalanced invoice journal entries at the API layer', async ({ request }) => {
    const res = await request.post(
      `${API_BASE}/api/accounting/journal-entries`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-company-id': companyId,
        },
        data: {
          date: new Date().toISOString().split('T')[0],
          description: 'Unbalanced test entry',
          lines: [
            { accountId: 'invalid-uuid', debit: 100, credit: 0 },
            { accountId: 'invalid-uuid', debit: 50, credit: 0 },
          ],
        },
      },
    );

    expect([400, 422]).toContain(res.status());
  });
});
