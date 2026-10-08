import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite';

export interface MigrationConfig {
  provider: DatabaseProvider;
  schemaPath: string;
  migrationsPath: string;
}

const PROVIDER_SCHEMAS: Record<DatabaseProvider, string> = {
  postgresql: 'schema.postgresql.prisma',
  mysql: 'schema.mysql.prisma',
  sqlite: 'schema.sqlite.prisma',
};

export function getProviderFromEnv(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER?.toLowerCase() as DatabaseProvider;
  if (!provider || !Object.keys(PROVIDER_SCHEMAS).includes(provider)) {
    throw new Error(
      `Invalid DATABASE_PROVIDER: ${provider}. Must be one of: ${Object.keys(PROVIDER_SCHEMAS).join(', ')}`
    );
  }
  return provider;
}

export function getSchemaPath(provider: DatabaseProvider): string {
  const prismaDir = path.resolve(process.cwd(), 'prisma');
  return path.join(prismaDir, PROVIDER_SCHEMAS[provider]);
}

export function getMigrationsPath(provider: DatabaseProvider): string {
  const prismaDir = path.resolve(process.cwd(), 'prisma');
  return path.join(prismaDir, 'migrations', provider);
}

export function runMigration(config: MigrationConfig): void {
  const { provider, schemaPath, migrationsPath } = config;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath, { recursive: true });
  }

  const env = {
    ...process.env,
    DATABASE_PROVIDER: provider,
  };

  try {
    execSync('pnpm exec prisma migrate deploy', {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    });
    console.log(`✓ Migrations applied for ${provider}`);
  } catch (error) {
    console.error(`✗ Migration failed for ${provider}:`, error);
    throw error;
  }
}

export function generateMigration(name: string, provider?: DatabaseProvider): void {
  const targetProvider = provider || getProviderFromEnv();
  const schemaPath = getSchemaPath(targetProvider);
  const migrationsPath = getMigrationsPath(targetProvider);

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath, { recursive: true });
  }

  const env = {
    ...process.env,
    DATABASE_PROVIDER: targetProvider,
  };

  try {
    execSync(`pnpm exec prisma migrate dev --name ${name} --schema=${schemaPath}`, {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    });
    console.log(`✓ Migration "${name}" generated for ${targetProvider}`);
  } catch (error) {
    console.error(`✗ Migration generation failed for ${targetProvider}:`, error);
    throw error;
  }
}

export function runMigrationForAllProviders(): void {
  const providers: DatabaseProvider[] = ['postgresql', 'mysql', 'sqlite'];

  for (const provider of providers) {
    console.log(`\n=== Running migrations for ${provider} ===`);
    const schemaPath = getSchemaPath(provider);
    const migrationsPath = getMigrationsPath(provider);

    if (!fs.existsSync(schemaPath)) {
      console.warn(`⚠ Schema not found for ${provider}, skipping`);
      continue;
    }

    try {
      runMigration({ provider, schemaPath, migrationsPath });
    } catch (error) {
      console.error(`Failed to run migrations for ${provider}`);
      throw error;
    }
  }
}