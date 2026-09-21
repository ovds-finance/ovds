#!/usr/bin/env node

/**
 * Deployment validator for Ovds multi-provider deployments.
 *
 * Usage:
 *   node scripts/validate-deployment.mjs
 *   node scripts/validate-deployment.mjs --provider sqlite
 *   node scripts/validate-deployment.mjs --strict
 *
 * Validates:
 *   - Required environment variables for the current deployment mode
 *   - Database connectivity
 *   - Prisma schema compatibility with the target provider
 *   - License key format (if premium modules are enabled)
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const SCHEMA_PATH = path.resolve(__dirname, '..', 'packages', 'database', 'prisma', 'schema.prisma');

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
const provider = opts.provider || process.env.DATABASE_PROVIDER || 'mysql';
const strict = opts.strict === 'true';

const deploymentMode = process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS';
const errors: string[] = [];
const warnings: string[] = [];

console.log(`[validate-deployment] Mode: ${deploymentMode}, Provider: ${provider}, Strict: ${strict}`);

function check(condition: boolean, message: string, isError = true) {
  if (!condition) {
    if (isError) {
      errors.push(message);
      console.error(`[FAIL] ${message}`);
    } else {
      warnings.push(message);
      console.warn(`[WARN] ${message}`);
    }
  } else {
    console.log(`[OK]   ${message}`);
  }
}

// ── Environment Variables ─────────────────────────────────────────────────────

const requiredVars = ['DATABASE_URL', 'PRISMA_DATABASE_URL', 'DEPLOYMENT_MODE'];
for (const varName of requiredVars) {
  check(!!process.env[varName], `Environment variable ${varName} is set`);
}

if (deploymentMode === 'ON_PREMISE_SINGLE' || deploymentMode === 'ON_PREMISE_MULTI') {
  check(!!process.env.OFFLINE_PUBLIC_KEY, 'OFFLINE_PUBLIC_KEY is set (required for on-premise license verification)');
  check(!!process.env.OFFLINE_LICENSE_SECRET, 'OFFLINE_LICENSE_SECRET is set (required for on-premise license generation)');
}

if (deploymentMode === 'CLOUD_SAAS') {
  check(!!process.env.JWT_SECRET, 'JWT_SECRET is set (required for cloud auth)');
}

// ── Schema Provider Match ─────────────────────────────────────────────────────

try {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  const providerMatch = schema.match(/datasource db\s*\{[^}]*provider\s*=\s*"([^"]+)"/);
  const schemaProvider = providerMatch?.[1];

  check(schemaProvider === provider, `Schema provider (${schemaProvider}) matches target provider (${provider})`, strict);
} catch (e) {
  errors.push(`Failed to read schema.prisma: ${e}`);
}

// ── Database Connectivity ─────────────────────────────────────────────────────

try {
  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL;
  if (dbUrl) {
    console.log(`[INFO] Database URL: ${dbUrl.replace(/\/\/.*@/, '//***@')}`);
    
    // Try to run a simple query via prisma
    try {
      execSync(`npx prisma db execute --stdin --schema=${SCHEMA_PATH}`, {
        input: 'SELECT 1',
        cwd: path.resolve(__dirname, '..', 'packages', 'database'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      check(true, 'Database connectivity check passed');
    } catch (dbError) {
      warnings.push('Database connectivity check failed (this is expected if the database is not running)');
    }
  }
} catch (e) {
  warnings.push(`Database connectivity check skipped: ${e}`);
}

// ── License Key Format ────────────────────────────────────────────────────────

if (process.env.OFFLINE_PUBLIC_KEY) {
  const publicKey = process.env.OFFLINE_PUBLIC_KEY;
  check(publicKey.includes('-----BEGIN PUBLIC KEY-----'), 'OFFLINE_PUBLIC_KEY looks like a valid PEM public key');
  check(publicKey.includes('-----END PUBLIC KEY-----'), 'OFFLINE_PUBLIC_KEY has proper PEM footer');
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors.length === 0) {
  console.log('✓ All critical checks passed');
} else {
  console.log(`✗ ${errors.length} critical error(s):`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠ ${warnings.length} warning(s):`);
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

console.log('='.repeat(60));

if (errors.length > 0 && strict) {
  console.log('\nValidation failed in strict mode. Fix the errors above before deploying.');
  process.exit(1);
} else if (errors.length > 0) {
  console.log('\nValidation completed with errors. Review the warnings above.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\nValidation passed with warnings.');
  process.exit(0);
} else {
  console.log('\nValidation passed. Deployment configuration looks good.');
  process.exit(0);
}
