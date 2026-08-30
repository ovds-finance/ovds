import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function deriveProxyTarget(url: string | undefined): string {
  return (url ?? 'http://127.0.0.1:3000').replace(/\/api$/, '');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = deriveProxyTarget(env['VITE_API_BASE_URL']);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ovds/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
        '@ovds/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
        '@ovds/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
        '@ovds/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/'))
              return 'react-vendor';
            if (id.includes('node_modules/@ovds/ui') || id.includes('node_modules/@ovds/shared'))
              return 'ui-vendor';
          },
        },
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true, ws: true },
        '/socket.io': { target: apiProxyTarget, changeOrigin: true, ws: true },
      },
    },
    preview: {
      port: 3003,
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true, ws: true },
        '/socket.io': { target: apiProxyTarget, changeOrigin: true, ws: true },
      },
    },
    optimizeDeps: {
      exclude: ['@ovds/shared', '@ovds/ui', '@ovds/database', '@ovds/core'],
    },
  };
});
