import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { execSync } from 'child_process';
import * as path from 'path';

export type MigrationMode = 'SHARED_SCHEMA' | 'SCHEMA_PER_TENANT';

export interface TenantMigrationResult {
  tenantId?: string;
  schema?: string;
  success: boolean;
  error?: string;
}

export interface MigrationRunnerSummary {
  total: number;
  success: number;
  failed: number;
  results: TenantMigrationResult[];
}

export interface TenantMigrationRunnerOptions {
  controlPlaneUrl?: string;
  tenantBaseUrl?: string;
}

/**
 * TenantMigrationRunner
 *
 * Executes Prisma migrations across tenants.
 *
 * Modes:
 *   SHARED_SCHEMA — single database URL, one `prisma migrate deploy` run.
 *   SCHEMA_PER_TENANT — iterates each tenant and runs migrations against
 *                       their individual schema (requires a control-plane DB
 *                       that stores the Company registry with `databaseSchema`).
 *
 * Usage (programmatic):
 *   const runner = new TenantMigrationRunner('SHARED_SCHEMA');
 *   await runner.run();
 *
 *   // or schema-per-tenant:
 *   const runner = new TenantMigrationRunner('SCHEMA_PER_TENANT', {
 *     controlPlaneUrl: process.env.CONTROL_PLANE_DATABASE_URL,
 *     tenantBaseUrl: process.env.TENANT_DATABASE_BASE_URL,
 *   });
 *   await runner.run();
 *
 * CLI:
 *   npx ts-node packages/core/src/tenant-migration-runner.ts --mode=SCHEMA_PER_TENANT \
 *     --control-plane-url=$CONTROL_PLANE_DATABASE_URL \
 *     --tenant-base-url=$TENANT_DATABASE_BASE_URL
 */
export class TenantMigrationRunner {
  private readonly mode: MigrationMode;
  private readonly controlPlaneUrl?: string;
  private readonly tenantBaseUrl?: string;
  private readonly schemaPath: string;

  constructor(
    mode: MigrationMode = 'SHARED_SCHEMA',
    opts: TenantMigrationRunnerOptions = {},
  ) {
    this.mode = mode;
    this.controlPlaneUrl = opts.controlPlaneUrl;
    this.tenantBaseUrl = opts.tenantBaseUrl;
    this.schemaPath = path.resolve(
      __dirname,
      '../../../../packages/database/prisma/schema.prisma',
    );
  }

  async run(): Promise<MigrationRunnerSummary> {
    if (this.mode === 'SHARED_SCHEMA') {
      return this.runSharedSchema();
    }

    if (!this.controlPlaneUrl || !this.tenantBaseUrl) {
      throw new Error(
        'SCHEMA_PER_TENANT mode requires controlPlaneUrl and tenantBaseUrl. ' +
          'Pass them via --control-plane-url and --tenant-base-url CLI flags, ' +
          'or set CONTROL_PLANE_DATABASE_URL and TENANT_DATABASE_BASE_URL env vars.',
      );
    }

    return this.runSchemaPerTenant();
  }

  /**
   * SHARED_SCHEMA — single deploy against the current DATABASE_URL.
   * This is the path used by the standard `db:migrate:prod` / `db:migrate:cloud`
   * scripts where all tenants share one PostgreSQL database scoped by companyId.
   */
  private async runSharedSchema(): Promise<MigrationRunnerSummary> {
    console.log('[MigrationRunner] SHARED_SCHEMA mode — running single migration deploy.');
    try {
      this.applyMigration(process.env.DATABASE_URL ?? '', 'shared-schema');
      return { total: 1, success: 1, failed: 0, results: [{ success: true }] };
    } catch (err: any) {
      console.error('[MigrationRunner] SHARED_SCHEMA migration failed:', err.message);
      return {
        total: 1,
        success: 0,
        failed: 1,
        results: [{ success: false, error: err.message }],
      };
    }
  }

  /**
   * SCHEMA_PER_TENANT — iterates every active production tenant and applies
   * pending migrations to each tenant's schema independently.
   */
  private async runSchemaPerTenant(): Promise<MigrationRunnerSummary> {
    const adapter = new PrismaMariaDb(this.controlPlaneUrl!);
    const controlPlane = new PrismaClient({
      adapter,
    } as any);

    const tenants: Array<{ id: string; subdomain: string; databaseSchema: string }> =
      await controlPlane.$queryRaw`
        SELECT id, subdomain, "databaseSchema"
        FROM "Company"
        WHERE "environment" = 'PRODUCTION'
        ORDER BY "createdAt" ASC
      `;

    await controlPlane.$disconnect();

    console.log(
      `[MigrationRunner] SCHEMA_PER_TENANT mode — migrating ${tenants.length} tenants.`,
    );

    const results: TenantMigrationResult[] = [];
    let success = 0;
    let failed = 0;

    for (const tenant of tenants) {
      try {
        const tenantUrl = `${this.tenantBaseUrl}?schema=${tenant.databaseSchema}`;
        this.applyMigration(tenantUrl, tenant.subdomain);
        results.push({ tenantId: tenant.id, schema: tenant.databaseSchema, success: true });
        success++;
      } catch (err: any) {
        results.push({
          tenantId: tenant.id,
          schema: tenant.databaseSchema,
          success: false,
          error: err.message,
        });
        failed++;
        console.error(
          `[MigrationRunner] FAILED for tenant ${tenant.subdomain} (${tenant.databaseSchema}):`,
          err.message,
        );
      }
    }

    console.log(
      `[MigrationRunner] Complete. Success: ${success}, Failed: ${failed}`,
    );

    if (failed > 0) {
      console.error(
        '[MigrationRunner] Failed tenants:\n' +
          results.filter((r) => !r.success).map((r) => `  ${r.schema}: ${r.error}`).join('\n'),
      );
    }

    return { total: tenants.length, success, failed, results };
  }

  private applyMigration(databaseUrl: string, label: string): void {
    console.log(`[MigrationRunner] Migrating: ${label}`);
    execSync(`npx prisma migrate deploy --schema="${this.schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
  }
}

// ── CLI entry point ────────────────────────────────────────────────────────────
// Usage examples:
//   npx ts-node packages/core/src/tenant-migration-runner.ts
//   npx ts-node packages/core/src/tenant-migration-runner.ts --mode=SCHEMA_PER_TENANT \
//     --control-plane-url=$CONTROL_PLANE_DATABASE_URL \
//     --tenant-base-url=$TENANT_DATABASE_BASE_URL
if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));

  const mode = (args['mode'] as MigrationMode) ?? 'SHARED_SCHEMA';
  const controlPlaneUrl =
    args['control-plane-url'] ?? args['controlPlaneUrl'] ?? process.env.CONTROL_PLANE_DATABASE_URL;
  const tenantBaseUrl =
    args['tenant-base-url'] ?? args['tenantBaseUrl'] ?? process.env.TENANT_DATABASE_BASE_URL;

  const runner = new TenantMigrationRunner(mode, {
    controlPlaneUrl,
    tenantBaseUrl,
  });

  runner.run().then((summary) => {
    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  }).catch((err) => {
    console.error('[MigrationRunner] Fatal:', err);
    process.exit(1);
  });
}

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = 'true';
      }
    }
  }
  return parsed;
}
