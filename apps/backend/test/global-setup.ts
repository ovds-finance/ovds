/**
 * Vitest global setup — runs once before all test files.
 * Sets environment variables required by NestJS services before any module is imported.
 */
export function setup() {
  // PrismaService constructor requires PRISMA_DATABASE_URL.
  // Set a dummy value so the constructor doesn't throw during test module compilation.
  // The actual DB is never connected in unit tests — all Prisma calls are mocked.
  if (!process.env.PRISMA_DATABASE_URL) {
    process.env.PRISMA_DATABASE_URL = 'mysql://root:@127.0.0.1:3306/ovds_test';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
  }
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
}
