#!/usr/bin/env node

/**
 * seed-e2e-tenants.mjs
 *
 * Provisions two isolated tenant companies (Tenant A and Tenant B) for
 * Playwright cross-tenant isolation E2E tests.
 *
 * Creates:
 *   - Company A + Company B
 *   - Admin users for each company
 *   - Chart of Accounts (AR, Revenue, Cash) for each tenant
 *
 * Outputs environment variables needed by the test suite.
 *
 * Usage:
 *   node scripts/seed-e2e-tenants.mjs --api-url http://localhost:3001/api --admin-token <superadmin-jwt>
 *
 * Prerequisites:
 *   - OVDS backend running
 *   - Superadmin JWT token (OVDS_TEST_USER / OVDS_TEST_PASS or explicit --admin-token)
 */

import https from 'https';
import http from 'http';

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || 'true';
    }
  }
  return result;
}

const opts = parseArgs();
const apiUrl = opts['api-url'] || process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001';
const adminToken = opts['admin-token'] || process.env.OVDS_TEST_TOKEN;

if (!adminToken) {
  console.error('Usage: node scripts/seed-e2e-tenants.mjs --api-url <url> --admin-token <jwt>');
  console.error('   Or: set OVDS_TEST_TOKEN env var to a superadmin JWT');
  process.exit(1);
}

function makeRequest(url, method, body, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createCompany(request, name, subdomain, type) {
  const res = await makeRequest(`${apiUrl}/api/platform/companies`, 'POST', {
    name,
    subdomain,
    type,
    currencyCode: 'ETB',
    environment: 'DEVELOPMENT',
  }, request.token);

  if (!res.ok() && res.status !== 409) {
    throw new Error(`Failed to create company ${name}: ${res.status} ${JSON.stringify(res.data)}`);
  }

  const body = res.data;
  const wrapped = body?.data ?? body;
  return wrapped?.id || wrapped?.company?.id;
}

async function createUser(request, email, password, role, companyId) {
  const res = await makeRequest(`${apiUrl}/api/auth/register`, 'POST', {
    email,
    password,
    role,
    companyId,
  }, request.token);

  if (!res.ok() && res.status !== 409) {
    throw new Error(`Failed to create user ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
}

async function createAccount(request, companyId, code, name, type, category) {
  const res = await makeRequest(`${apiUrl}/api/accounting/accounts`, 'POST', {
    code,
    name,
    type,
    category,
    isActive: true,
    isLeaf: true,
    allowPosting: true,
  }, request.token);

  if (!res.ok()) {
    throw new Error(`Failed to create account ${code}: ${res.status} ${JSON.stringify(res.data)}`);
  }

  const body = res.data;
  const wrapped = body?.data ?? body;
  return wrapped.id;
}

async function seedTenants() {
  console.log('========================================');
  console.log('  Seeding E2E Test Tenants');
  console.log('========================================\n');
  console.log(`API URL: ${apiUrl}`);

  const request = { token: adminToken };

  // 1. Create Tenant A
  console.log('\n--- Tenant A ---');
  const companyAId = await createCompany(request, 'E2E Test Tenant A', 'e2e-tenant-a', 'MEDIUM_ENTERPRISE');
  console.log(`Company A ID: ${companyAId}`);

  await createUser(request, 'e2e-user-a@ovds.test', 'E2eTest#2026!A', 'ADMIN', companyAId);
  console.log('Created user: e2e-user-a@ovds.test');

  const arAccountA = await createAccount(request, companyAId, '1200', 'Accounts Receivable A', 'ASSET', 'ACCOUNTS_RECEIVABLE');
  const revenueAccountA = await createAccount(request, companyAId, '4000', 'Revenue A', 'INCOME', 'REVENUE');
  const cashAccountA = await createAccount(request, companyAId, '1100', 'Cash A', 'ASSET', 'CASH');
  console.log(`Created accounts for Tenant A: ${arAccountA}, ${revenueAccountA}, ${cashAccountA}`);

  // 2. Create Tenant B
  console.log('\n--- Tenant B ---');
  const companyBId = await createCompany(request, 'E2E Test Tenant B', 'e2e-tenant-b', 'MEDIUM_ENTERPRISE');
  console.log(`Company B ID: ${companyBId}`);

  await createUser(request, 'e2e-user-b@ovds.test', 'E2eTest#2026!B', 'ADMIN', companyBId);
  console.log('Created user: e2e-user-b@ovds.test');

  const arAccountB = await createAccount(request, companyBId, '1200', 'Accounts Receivable B', 'ASSET', 'ACCOUNTS_RECEIVABLE');
  const revenueAccountB = await createAccount(request, companyBId, '4000', 'Revenue B', 'INCOME', 'REVENUE');
  const cashAccountB = await createAccount(request, companyBId, '1100', 'Cash B', 'ASSET', 'CASH');
  console.log(`Created accounts for Tenant B: ${arAccountB}, ${revenueAccountB}, ${cashAccountB}`);

  // 3. Output env vars for Playwright
  console.log('\n========================================');
  console.log('  Environment Variables');
  console.log('========================================\n');
  console.log(`export OVDS_COMPANY_A="${companyAId}"`);
  console.log(`export OVDS_COMPANY_B="${companyBId}"`);
  console.log(`export OVDS_TEST_USER_A="e2e-user-a@ovds.test"`);
  console.log(`export OVDS_TEST_PASS_A="E2eTest#2026!A"`);
  console.log(`export OVDS_TEST_USER_B="e2e-user-b@ovds.test"`);
  console.log(`export OVDS_TEST_PASS_B="E2eTest#2026!B"`);
  console.log('');
  console.log('Run tests:');
  console.log('  npx playwright test --config apps/backend/playwright.config.ts --grep "Cross-Tenant"');
}

seedTenants()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
