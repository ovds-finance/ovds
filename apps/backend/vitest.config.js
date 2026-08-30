"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function buildWorkspaceAliases() {
    const alias = {
        '@common': path_1.default.resolve(__dirname, 'src/common'),
        '@ovds/shared': path_1.default.resolve(__dirname, '../../packages/shared/src/index.ts'),
        '@ovds/design-system': path_1.default.resolve(__dirname, '../../packages/design-system/src/index.ts'),
        '@ovds/database': path_1.default.resolve(__dirname, '../../packages/database/src/index.ts'),
        '@ovds/core': path_1.default.resolve(__dirname, '../../packages/core/src/index.ts'),
        '@ovds/contracts': path_1.default.resolve(__dirname, '../../packages/contracts/src/index.ts'),
        'class-validator': path_1.default.resolve(__dirname, '../../node_modules/class-validator'),
    };
    const packagesDir = path_1.default.resolve(__dirname, '../../packages');
    for (const type of ['domains', 'features']) {
        const typeDir = path_1.default.join(packagesDir, type);
        if (!fs_1.default.existsSync(typeDir))
            continue;
        for (const name of fs_1.default.readdirSync(typeDir)) {
            const indexPath = path_1.default.join(typeDir, name, 'src', 'index.ts');
            if (fs_1.default.existsSync(indexPath)) {
                alias[`@ovds/${type}/${name}`] = path_1.default.resolve(indexPath);
            }
        }
    }
    return alias;
}
exports.default = (0, config_1.defineConfig)({
    resolve: {
        alias: buildWorkspaceAliases(),
        extensions: ['.ts', '.js', '.json'],
        conditions: ['node', 'import'],
    },
    test: {
        name: 'backend:unit',
        environment: 'node',
        globals: true,
        globalSetup: [path_1.default.resolve(__dirname, './test/global-setup.ts')],
        setupFiles: [
            path_1.default.resolve(__dirname, './vitest.setup.ts'),
            path_1.default.resolve(__dirname, './test/jest-compat.setup.ts'),
        ],
        include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
        exclude: ['src/**/*.integration-spec.ts', 'test/**/*.playwright-spec.ts', 'test/health.e2e-spec.ts', 'test/navigation-structure.e2e-spec.ts', 'test/ovds-crud.e2e-spec.ts', 'test/security-headers.e2e-spec.ts'],
        pool: 'threads',
        poolOptions: {
            threads: { singleThread: false },
        },
        deps: {
            inline: ['supertest'],
        },
        transform: {
            '^.+\\.(t|j)sx?$': [
                '@swc/core',
                {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                            tsx: false,
                            decorators: true,
                        },
                        transform: {
                            decoratorMetadata: true,
                            legacyDecorator: true,
                        },
                        target: 'es2021',
                    },
                    module: {
                        type: 'commonjs',
                    },
                },
            ],
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/**',
                'dist/**',
                'test/**',
                '**/*.d.ts',
                '**/*.module.ts',
                '**/main.ts',
                '**/*.controller.ts',
                '**/*.dto.ts',
                '**/*.entity.ts',
                '**/*.guard.ts',
                '**/*.decorator.ts',
                '**/*.strategy.ts',
                '**/*.scheduler.ts',
            ],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 50,
                statements: 60,
            },
        },
    },
});
//# sourceMappingURL=vitest.config.js.map