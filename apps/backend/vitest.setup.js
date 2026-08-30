"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.PRISMA_DATABASE_URL) {
    process.env.PRISMA_DATABASE_URL = 'mysql://root:@127.0.0.1:3306/ovds_test';
}
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
}
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
const vitest_1 = require("vitest");
let idCounter = 1;
function makeRecord(data) {
    return { id: String(idCounter++), ...data };
}
function createMockModel() {
    return {
        findMany: vitest_1.vi.fn().mockResolvedValue([]),
        findUnique: vitest_1.vi.fn().mockResolvedValue(null),
        findFirst: vitest_1.vi.fn().mockResolvedValue(null),
        create: vitest_1.vi.fn((args) => makeRecord(args.data)),
        createMany: vitest_1.vi.fn().mockResolvedValue({ count: 0 }),
        update: vitest_1.vi.fn((args) => makeRecord(args.data)),
        updateMany: vitest_1.vi.fn().mockResolvedValue({ count: 0 }),
        upsert: vitest_1.vi.fn((args) => makeRecord(args.create || args.update)),
        delete: vitest_1.vi.fn().mockResolvedValue(makeRecord({})),
        deleteMany: vitest_1.vi.fn().mockResolvedValue({ count: 0 }),
    };
}
vitest_1.vi.mock('@prisma/client', () => {
    class MockPrismaClient {
        $connect = vitest_1.vi.fn().mockResolvedValue(undefined);
        $disconnect = vitest_1.vi.fn().mockResolvedValue(undefined);
        $transaction = vitest_1.vi.fn((fn) => fn(this));
        user = createMockModel();
        company = createMockModel();
        lease = createMockModel();
        refreshToken = createMockModel();
        passwordResetToken = createMockModel();
        property = createMockModel();
        $queryRaw = vitest_1.vi.fn();
        $executeRaw = vitest_1.vi.fn();
    }
    return { PrismaClient: MockPrismaClient };
});
vitest_1.vi.mock('@prisma/adapter-mariadb', () => ({
    PrismaMariaDb: class MockAdapter {
        constructor(_opts) { }
    },
}));
require("reflect-metadata");
//# sourceMappingURL=vitest.setup.js.map