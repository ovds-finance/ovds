// Backend Vitest global setup — runs in every test worker before each test file.

// ── reflect-metadata (required by NestJS + class-transformer decorators) ──────
import 'reflect-metadata';

// ── Environment variables ─────────────────────────────────────────────────────
// PrismaService constructor requires PRISMA_DATABASE_URL.
// Set a fallback so the constructor doesn't throw during test module compilation.
// The actual DB is never connected in unit tests — all Prisma calls are mocked.
if (!process.env.PRISMA_DATABASE_URL) {
  process.env.PRISMA_DATABASE_URL = 'mysql://root:@127.0.0.1:3306/ovds_test';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
}
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

// ── Mock @prisma/client so no real DB connection is made ─────────────────────
import { vi } from 'vitest';

let idCounter = 1;

function makeRecord(data: any): any {
  return { id: String(idCounter++), ...data };
}

function createMockModel() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn((args: any) => makeRecord(args.data)),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn((args: any) => makeRecord(args.data)),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn((args: any) => makeRecord(args.create || args.update)),
    delete: vi.fn().mockResolvedValue(makeRecord({})),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
}

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = vi.fn().mockResolvedValue(undefined);
    $disconnect = vi.fn().mockResolvedValue(undefined);
    $transaction = vi.fn((fn: (client: any) => Promise<any>) => fn(this));
    user = createMockModel();
    company = createMockModel();
    lease = createMockModel();
    refreshToken = createMockModel();
    passwordResetToken = createMockModel();
    property = createMockModel();
    $queryRaw = vi.fn();
    $executeRaw = vi.fn();
  }

  return { PrismaClient: MockPrismaClient };
});

// ── Mock @prisma/adapter-mariadb to avoid real driver loading ─────────────────
vi.mock('@prisma/adapter-mariadb', () => ({
  PrismaMariaDb: class MockAdapter {
constructor() {}
  },
}));

// ── Reflect metadata (required by NestJS decorators) ─────────────────────────
import 'reflect-metadata';

