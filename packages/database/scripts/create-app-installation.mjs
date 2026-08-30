/**
 * Safe, idempotent migration — creates app_installation table if it doesn't exist.
 * Run once: node packages/database/scripts/create-app-installation.mjs
 *
 * Uses the dev DB from .env (PRISMA_DATABASE_URL).
 */
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, '../../../.env');

// Parse .env manually (no dotenv dep needed)
const envText = readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envText.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const dbUrl = envVars['PRISMA_DATABASE_URL'] || envVars['DATABASE_URL'];
if (!dbUrl) { console.error('No PRISMA_DATABASE_URL found in .env'); process.exit(1); }

// Parse mysql://user:pass@host:port/db
const m = dbUrl.match(/mysql:\/\/([^:]*):([^@]*)@([^:]+):(\d+)\/(.+)/);
if (!m) { console.error('Cannot parse DB URL:', dbUrl); process.exit(1); }
const [, user, password, host, port, database] = m;

const conn = await createConnection({ host, port: Number(port), user, password, database });

await conn.execute(`
  CREATE TABLE IF NOT EXISTS app_installation (
    id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    companyId    VARCHAR(36)  NOT NULL,
    appId        VARCHAR(36)  NOT NULL,
    version      VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    config       LONGTEXT     NULL,
    installedBy  VARCHAR(100) NULL,
    installedAt  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt    DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY app_installation_companyId_appId_key (companyId, appId),
    KEY app_installation_companyId_idx (companyId),
    KEY app_installation_appId_idx (appId),
    KEY app_installation_status_idx (status),
    CONSTRAINT app_installation_companyId_fkey
      FOREIGN KEY (companyId) REFERENCES company (id) ON DELETE CASCADE,
    CONSTRAINT app_installation_appId_fkey
      FOREIGN KEY (appId)     REFERENCES app (id)     ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

console.log('✅ app_installation table ready');
await conn.end();
