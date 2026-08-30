import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cache = new Map();

function cached<T>(key: string, fn: () => T): T {
  if (cache.has(key)) return cache.get(key) as T;
  const value = fn();
  cache.set(key, value);
  return value;
}

/**
 * Strip a trailing `/api` suffix from a URL string.
 * This normalises the proxy target regardless of whether VITE_API_BASE_URL
 * was set with or without the `/api` path component.
 *
 * @example
 * deriveProxyTarget('http://127.0.0.1:3000/api') // → 'http://127.0.0.1:3000'
 * deriveProxyTarget('http://127.0.0.1:3000')     // → 'http://127.0.0.1:3000'
 * deriveProxyTarget(undefined)                    // → 'http://127.0.0.1:3000'
 */
export function deriveProxyTarget(url: string | undefined): string {
  return (url ?? 'http://127.0.0.1:3000').replace(/\/api$/, '');
}

export { buildWorkspaceAliases };

function buildWorkspaceAliases() {
  return cached('workspace-aliases', () => {
    const alias: Record<string, string> = {
      '@': path.resolve(__dirname, './src'),

        '@ovds/shared':          path.resolve(__dirname, '../../packages/shared/src'),
        '@ovds/dto':             path.resolve(__dirname, '../../packages/shared/dto/dist/index.js'),
        '@ovds/dto/hr':          path.resolve(__dirname, '../../packages/shared/dto/dist/hr/index.js'),
        '@ovds/dto/ovds':     path.resolve(__dirname, '../../packages/shared/dto/dist/ovds/index.js'),
        '@ovds/dto/auth':        path.resolve(__dirname, '../../packages/shared/dto/dist/auth/index.js'),
        '@ovds/contracts':            path.resolve(__dirname, '../../packages/contracts/dist/index.js'),
        '@ovds/contracts/router':     path.resolve(__dirname, '../../packages/contracts/dist/router/index.js'),
        '@ovds/contracts/schemas':    path.resolve(__dirname, '../../packages/contracts/dist/schemas/index.js'),
        '@ovds/contracts/prisma-zod': path.resolve(__dirname, '../../packages/contracts/dist/prisma-zod/index.js'),
        '@ovds/core':            path.resolve(__dirname, '../../packages/core/src/index.ts'),
        '@ovds/design-system':   path.resolve(__dirname, '../../packages/design-system/src/index.ts'),
        '@ovds/ui/context':      path.resolve(__dirname, '../../packages/ui/src/context/index.ts'),
        '@ovds/ui':              path.resolve(__dirname, '../../packages/ui/src/index.ts'),
        '@ovds-styles':          path.resolve(__dirname, '../../packages/ui/src/styles'),
        '@ovds/contracts/schemas/custom-fields': path.resolve(__dirname, '../../packages/contracts/src/schemas/custom-fields.ts'),
        '@ovds/shared/compliance/business-registration.types': path.resolve(__dirname, '../../packages/shared/src/compliance/business-registration.types.ts'),
      };

      const packagesDir = path.resolve(__dirname, '../../packages');
      for (const type of ['domains', 'features']) {
        const typeDir = path.join(packagesDir, type);
        if (!fs.existsSync(typeDir)) continue;
        for (const name of fs.readdirSync(typeDir)) {
          const indexPath = path.join(typeDir, name, 'src', 'index.ts');
          if (fs.existsSync(indexPath)) {
            alias[`@ovds/${type}/${name}`] = path.resolve(indexPath);
          }
        }
      }

      return alias;
    });
  }

const workspaceAliases = buildWorkspaceAliases();

function buildFsAllow() {
  return cached('fs-allow', () => {
    const allow: string[] = [
      '..',
      path.resolve(__dirname, '../../packages/shared'),
      path.resolve(__dirname, '../../packages/shared/dto'),
      path.resolve(__dirname, '../../packages/contracts'),
      path.resolve(__dirname, '../../packages/design-system'),
      path.resolve(__dirname, '../../packages/ui'),
      path.resolve(__dirname, '../../packages/database'),
    ];
    const packagesDir = path.resolve(__dirname, '../../packages');
    for (const type of ['domains', 'features']) {
      const typeDir = path.join(packagesDir, type);
      if (!fs.existsSync(typeDir)) continue;
      for (const name of fs.readdirSync(typeDir)) {
        allow.push(path.join(typeDir, name));
      }
    }
    return allow;
  });
}

function buildOptimizeDeps() {
  return cached('optimize-deps', () => {
    const deps = [
      'react',
      'react-dom',
      'react-router-dom',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'dompurify',
      'lucide-react',
      'axios',
      'react-hot-toast',
      '@tanstack/react-query',
      '@auth0/auth0-react',
      'i18next',
      'react-i18next',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'recharts',
      'socket.io-client',
    ];
    const packagesDir = path.resolve(__dirname, '../../packages');
    for (const type of ['domains', 'features']) {
      const typeDir = path.join(packagesDir, type);
      if (!fs.existsSync(typeDir)) continue;
      for (const name of fs.readdirSync(typeDir)) {
        const pkgDir = path.join(typeDir, name);
        if (!fs.existsSync(path.join(pkgDir, 'package.json'))) continue;
      }
    }
    return deps;
  });
}

function buildNoBundle() {
  return cached('no-bundle', () => {
    const pkgs = [
      '@ovds/shared',
      '@ovds/dto',
      '@ovds/contracts',
      '@ovds/core',
      '@ovds/design-system',
      '@ovds/ui',
      '@ovds-styles',
    ];
    const packagesDir = path.resolve(__dirname, '../../packages');
    for (const type of ['domains', 'features']) {
      const typeDir = path.join(packagesDir, type);
      if (!fs.existsSync(typeDir)) continue;
      for (const name of fs.readdirSync(typeDir)) {
        const pkgDir = path.join(typeDir, name);
        if (!fs.existsSync(path.join(pkgDir, 'package.json'))) continue;
        pkgs.push(`@ovds/${type}/${name}`);
      }
    }
    return pkgs;
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = deriveProxyTarget(env['VITE_API_BASE_URL']);
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        devOptions: { enabled: false },
        includeAssets: ['favicon.ico', 'assets/logo.jpg'],
        manifest: {
          name: 'OVDS — Business ERP',
          short_name: 'OVDS',
          description:
            'Multi-company ERP platform — Market Segmentation, Investment Trends, Growth, Revenue, Strategic Insights, Supply Chain, Consumer Insights, Market Forecast. Software: ERP, CRM, Business Intelligence & Analytics, Project Management, Accounting & ovds. Deployment: Cloud-Based, On-Premise, SaaS-Based, AI & Automation, Hybrid. End Users: Banking & ovds, Retail & E-commerce, IT & Software, Manufacturing & Logistics, Healthcare & Pharmaceuticals. Competitive Landscape.',
          theme_color: '#00E784',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'en',
          orientation: 'portrait-primary',
          categories: ['business', 'productivity', 'ovds'],
          shortcuts: [
            { name: 'Dashboard', url: '/dashboard', description: 'Go to Dashboard' },
            { name: 'Invoices', url: '/sales/invoices', description: 'Go to Invoices' },
            { name: 'Payroll', url: '/payroll', description: 'Go to Payroll' },
          ],
          icons: [
            { src: 'favicon.ico', sizes: '64x64', type: 'image/x-icon' },
            { src: 'assets/logo.jpg', sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
            { src: 'assets/logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ url }: { url: URL }) =>
                url.pathname.match(/^((?!\/api|\/socket\.io).)*$/) !== null,
              handler: 'NetworkFirst',
              options: { cacheName: 'navRoutesCache' },
            },
          ],
        },
      }),
    ],

    resolve: {
      extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'],
      alias: {
        ...workspaceAliases,
      },
    },

    optimizeDeps: {
      // Pin the scan entry so Vite doesn't walk the entire workspace looking for imports.
      entries: ['index.html'],
      include: buildOptimizeDeps(),
      noBundle: buildNoBundle(),
    },

    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      fs: {
        allow: buildFsAllow(),
      },
      // Pre-transform the shell and the most-visited pages so the first
      // browser request doesn't block on cold transformation.
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/App.tsx',
          './src/pages/dashboard/**/*.tsx',
          './src/pages/auth/**/*.tsx',
        ],
      },
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true, ws: true },
        '/socket.io': { target: apiProxyTarget, changeOrigin: true, ws: true },
      },
    },

    preview: {
      port: 3002,
      host: '0.0.0.0',
      strictPort: true,
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true, ws: true },
        '/socket.io': { target: apiProxyTarget, changeOrigin: true, ws: true },
      },
    },

    build: {
      outDir: path.resolve(__dirname, '../public'),
      emptyOutDir: true,
      // Target modern browsers — no unnecessary down-transpilation.
      target: 'es2020',
      // esbuild is 10-20× faster than Terser for minification.
      minify: 'esbuild',
      // Skip gzip reporting (saves ~1-2s per build, CI can measure separately).
      reportCompressedSize: false,
      // Module preload polyfill is unnecessary for ES2020+ targets.
      modulePreload: { polyfill: false },
      // Sourcemaps off in production by default; enable via env var if needed.
      sourcemap: isProd ? (env['VITE_SOURCEMAP'] === 'true') : true,
      rollupOptions: {
        output: {
          // Keep chunk filenames stable for long-term browser caching.
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks(id: string) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/'))
              return 'vendor-react';
            if (id.includes('node_modules/lucide-react/')) return 'vendor-icons';
            if (id.includes('node_modules/@radix-ui/')) return 'vendor-radix';
            if (id.includes('node_modules/@dnd-kit/')) return 'vendor-dnd';
            if (id.includes('node_modules/i18next/') || id.includes('node_modules/react-i18next/') || id.includes('node_modules/i18next-browser-languagedetector/') || id.includes('node_modules/i18next-http-backend/'))
              return 'vendor-i18n';
            if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3') || id.includes('node_modules/victory-') || id.includes('node_modules/internmap/') || id.includes('node_modules/robust-predicates/'))
              return 'vendor-charts';
            if (id.includes('node_modules/axios/') || id.includes('node_modules/socket.io-client/') || id.includes('node_modules/engine.io-client/'))
              return 'vendor-http';
            if (id.includes('node_modules/@tanstack/')) return 'vendor-query';
            if (id.includes('node_modules/@auth0/') || id.includes('node_modules/auth0-spa-js/'))
              return 'vendor-auth';
            if (id.includes('node_modules/react-hot-toast/') || id.includes('node_modules/react-helmet-async/') || id.includes('node_modules/react-window/'))
              return 'vendor-ui-utils';
            if (id.includes('node_modules/date-fns/')) return 'vendor-dates';
            if (id.includes('node_modules/papaparse/') || id.includes('node_modules/dompurify/'))
              return 'vendor-parsers';
            if (id.includes('node_modules/firebase/')) return 'vendor-firebase';
            if (id.includes('node_modules/@refinedev/')) return 'vendor-refine';
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },

    // Use esbuild for TS/JSX transformation — consistent with the SWC build plugin target.
    esbuild: {
      target: 'es2020',
    },
  };
});
