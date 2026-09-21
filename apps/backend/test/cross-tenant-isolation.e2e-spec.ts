/**
 * Cross-Tenant Data Isolation — E2E Security Tests
 *
 * Verifies that the Prisma `$extends` tenant interceptor + NestJS guards
 * prevent Tenant A from reading, writing, or detecting Tenant B's data.
 *
 * These tests provision real accounts and journal entries for both tenants,
 * then simulate the 6 attack vectors from the architecture blueprint.
 *
 * Run with: npx playwright test --config apps/backend/playwright.config.ts
 * Requires: PLAYWRIGHT_BASE_URL pointing to a running OVDS instance
 *            OVDS_TEST_USER_A / OVDS_TEST_PASS_A — Tenant A credentials
 *            OVDS_TEST_USER_B / OVDS_TEST_PASS_B — Tenant B credentials
 *            OVDS_COMPANY_A / OVDS_COMPANY_B — Company IDs for each tenant
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

const TEST_USER_A = process.env.OVDS_TEST_USER_A ?? 'admin@ovds.com';
const TEST_PASS_A = process.env.OVDS_TEST_PASS_A ?? '';
const TEST_USER_B = process.env.OVDS_TEST_USER_B ?? 'admin@tenantb.com';
const TEST_PASS_B = process.env.OVDS_TEST_PASS_B ?? '';

const COMPANY_A = process.env.OVDS_COMPANY_A ?? '';
const COMPANY_B = process.env.OVDS_COMPANY_B ?? '';

if (!TEST_PASS_A || TEST_PASS_A.length < 6) {
  throw new Error(
    `[e2e] OVDS_TEST_PASS_A is missing or too short. Set env var OVDS_TEST_PASS_A (min length: 6).`,
  );
}
if (!TEST_PASS_B || TEST_PASS_B.length < 6) {
  throw new Error(
    `[e2e] OVDS_TEST_PASS_B is missing or too short. Set env var OVDS_TEST_PASS_B (min length: 6).`,
  );
}
if (!COMPANY_A || !COMPANY_B) {
  throw new Error(
    `[e2e] OVDS_COMPANY_A and OVDS_COMPANY_B must be set to valid company IDs for cross-tenant tests.`,
  );
}

async function getAuthToken(request: any, email: string, password: string): Promise<string> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(`Login failed for ${email} with status ${res.status()}: ${await res.text()}`);
  }

  const body = await res.json();
  const wrapped = body?.data ?? body;
  const token = wrapped?.access_token ?? wrapped?.token;

  if (!token) {
    throw new Error(`Login response missing access_token for ${email}`);
  }

  return token as string;
}

async function getCompanyId(request: any, token: string, fallbackCompanyId: string): Promise<string> {
  const res = await request.get(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok()) {
    return fallbackCompanyId;
  }

  const body = await res.json();
  const wrapped = body?.data ?? body;
  const companyId = wrapped?.companyId ?? wrapped?.user?.companyId ?? fallbackCompanyId;

  return companyId as string;
}

async function createTestAccount(
  request: any,
  token: string,
  companyId: string,
  code: string,
  name: string,
  type: string,
  category: string,
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/accounting/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId,
    },
    data: {
      code,
      name,
      type,
      category,
      isActive: true,
      isLeaf: true,
      allowPosting: true,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create test account ${code}: ${res.status()}`);
  }

  const body = await res.json();
  const account = body?.data ?? body;
  return account.id as string;
}

async function createTestJournalEntry(
  request: any,
  token: string,
  companyId: string,
  description: string,
  lines: Array<{ accountId: string; debit: number; credit: number }>,
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/accounting/journal-entries`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId,
    },
    data: {
      description,
      date: new Date().toISOString().split('T')[0],
      lines,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create journal entry: ${res.status()} ${await res.text()}`);
  }

  const body = await res.json();
  const entry = body?.data ?? body;
  return entry.id as string;
}

test.describe('Cross-Tenant Data Isolation @security', () => {
  let tenantAToken: string;
  let tenantBToken: string;
  let companyAId: string;
  let companyBId: string;

  // Test data created per-run
  let tenantBEntryId: string;
  let tenantBAccountId: string;
  let tenantAAccountId: string;

  test.beforeAll(async ({ request }) => {
    tenantAToken = await getAuthToken(request, TEST_USER_A, TEST_PASS_A);
    companyAId = await getCompanyId(request, tenantAToken, COMPANY_A);

    tenantBToken = await getAuthToken(request, TEST_USER_B, TEST_PASS_B);
    companyBId = await getCompanyId(request, tenantBToken, COMPANY_B);

    // Provision test accounts for both tenants
    tenantAAccountId = await createTestAccount(
      request, tenantAToken, companyAId,
      '1010', 'Tenant A Cash', 'ASSET', 'CASH',
    );

    tenantBAccountId = await createTestAccount(
      request, tenantBToken, companyBId,
      '1020', 'Tenant B Cash', 'ASSET', 'CASH',
    );

    // Create a real journal entry for Tenant B (target for attack vectors)
    tenantBEntryId = await createTestJournalEntry(
      request, tenantBToken, companyBId,
      'Tenant B secret transaction for isolation test',
      [
        { accountId: tenantBAccountId, debit: 5000, credit: 0 },
        { accountId: tenantBAccountId, debit: 0, credit: 5000 },
      ],
    );
  });

  // ─── ATTACK VECTOR 1: Direct ID Enumeration ─────────────────────────────────
  test('Tenant A cannot read a journal entry belonging to Tenant B via direct ID', async ({
    request,
  }) => {
    const breachRes = await request.get(
      `${API_BASE}/api/accounting/journal-entries/${tenantBEntryId}`,
      {
        headers: {
          Authorization: `Bearer ${tenantAToken}`,
          'x-company-id': companyAId,
        },
      },
    );

    expect(breachRes.status()).toBe(404);
  });

  // ─── ATTACK VECTOR 2: Header Spoofing ──────────────────────────────────────
  test('Tenant A cannot spoof x-company-id header to access Tenant B data', async ({
    request,
  }) => {
    const spoofRes = await request.get(`${API_BASE}/api/accounting/journal-entries`, {
      headers: {
        Authorization: `Bearer ${tenantAToken}`,
        'x-company-id': companyBId,
      },
    });

    expect([401, 403]).toContain(spoofRes.status());
  });

  // ─── ATTACK VECTOR 3: Mass Assignment via Explicit companyId in Body ─────────
  test('Tenant A cannot inject Tenant B companyId into a create payload', async ({
    request,
  }) => {
    const injectRes = await request.post(`${API_BASE}/api/accounting/journal-entries`, {
      headers: {
        Authorization: `Bearer ${tenantAToken}`,
        'x-company-id': companyAId,
      },
      data: {
        companyId: companyBId,
        description: 'Cross-tenant mass assignment attempt',
        date: new Date().toISOString().split('T')[0],
        lines: [
          { accountId: tenantAAccountId, debit: 100, credit: 0 },
          { accountId: tenantAAccountId, debit: 0, credit: 100 },
        ],
      },
    });

    if (injectRes.ok()) {
      const created = (await injectRes.json())?.data ?? (await injectRes.json());
      expect(created.companyId).toBe(companyAId);
      expect(created.companyId).not.toBe(companyBId);
    } else {
      expect([400, 403, 404]).toContain(injectRes.status());
    }
  });

  // ─── ATTACK VECTOR 4: List Endpoint Enumeration ─────────────────────────────
  test('Tenant A list endpoints never return Tenant B records', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/accounting/journal-entries`, {
      headers: {
        Authorization: `Bearer ${tenantAToken}`,
        'x-company-id': companyAId,
      },
    });

    if (!listRes.ok()) return;

    const body = await listRes.json();
    const entries: any[] = body?.data?.data ?? body?.data ?? body ?? [];

    const leak = entries.some(
      (entry: { companyId: string }) => entry.companyId === companyBId,
    );

    expect(leak).toBe(false);
  });

  // ─── ATTACK VECTOR 5: Cross-Tenant Write via Known Account ID ────────────────
  test('Tenant A cannot post a journal line referencing a Tenant B account ID', async ({
    request,
  }) => {
    const writeRes = await request.post(`${API_BASE}/api/accounting/journal-entries`, {
      headers: {
        Authorization: `Bearer ${tenantAToken}`,
        'x-company-id': companyAId,
      },
      data: {
        description: 'Cross-tenant account reference attempt',
        date: new Date().toISOString().split('T')[0],
        lines: [
          { accountId: tenantBAccountId, debit: 100, credit: 0 },
          { accountId: tenantAAccountId, debit: 0, credit: 100 },
        ],
      },
    });

    expect(writeRes.ok()).toBe(false);
    expect([400, 403, 404, 422]).toContain(writeRes.status());
  });

  // ─── ATTACK VECTOR 6: JWT Cross-Tenant Token Usage ──────────────────────────
  test('Tenant B token cannot access Tenant A data via x-company-id header', async ({
    request,
  }) => {
    const crossAccessRes = await request.get(`${API_BASE}/api/sales/invoices`, {
      headers: {
        Authorization: `Bearer ${tenantBToken}`,
        'x-company-id': companyAId,
      },
    });

    expect([401, 403]).toContain(crossAccessRes.status());
  });
});
