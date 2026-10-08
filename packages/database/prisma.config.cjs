const { defineConfig } = require('prisma/config');

// Env is normally injected by scripts/prisma-run.mjs, which also writes a
// temporary packages/database/.env that Prisma 7 auto-loads. Load dotenv only
// when it happens to be resolvable, so this config never hard-fails.
try {
  require('dotenv').config({ path: '.env' });
} catch {
  // dotenv is not a dependency of @ovds/database; prisma-run.mjs covers this.
}

// The connection string is configuration, never a default. Scripts that shell
// out to Prisma (generate/push/migrate/studio) all go through prisma-run.mjs,
// which injects PRISMA_DATABASE_URL from the requested env file first. Bare
// `prisma` invocations are the only path where this matters, and they must
// fail loudly rather than silently target a developer's local database.
const datasourceUrl = process.env.PRISMA_DATABASE_URL;

if (!datasourceUrl) {
  throw new Error(
    'PRISMA_DATABASE_URL is not set. Run Prisma through the workspace scripts ' +
      '(`pnpm run db:generate`, `db:push`, `db:migrate`, `db:studio`) or export ' +
      'PRISMA_DATABASE_URL from your .env before invoking the Prisma CLI directly.',
  );
}

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
  },
});
