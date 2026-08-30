"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = __importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
    resolve: {
        alias: {
            '@common': path_1.default.resolve(__dirname, 'src/common'),
            '@ovds/shared': path_1.default.resolve(__dirname, '../../packages/shared/src/index.ts'),
            '@ovds/design-system': path_1.default.resolve(__dirname, '../../packages/design-system/src/index.ts'),
            '@ovds/database': path_1.default.resolve(__dirname, '../../packages/database/src/index.ts'),
            '@ovds/core': path_1.default.resolve(__dirname, '../../packages/core/src/index.ts'),
            '@ovds/contracts': path_1.default.resolve(__dirname, '../../packages/contracts/src/index.ts'),
            'class-validator': path_1.default.resolve(__dirname, '../../node_modules/class-validator'),
        },
    },
    test: {
        name: 'backend:e2e',
        environment: 'node',
        globals: true,
        setupFiles: [
            path_1.default.resolve(__dirname, './vitest.setup.ts'),
            path_1.default.resolve(__dirname, './test/jest-compat.setup.ts'),
        ],
        include: ['test/**/*.e2e-spec.ts', 'test/**/*.spec.ts'],
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
//# sourceMappingURL=vitest.config.e2e.js.map