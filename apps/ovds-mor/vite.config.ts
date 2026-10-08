import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const workspaceAliases: Record<string, string> = {
  '@': path.resolve(__dirname, './src'),
  '@ovds/shared': path.resolve(__dirname, '../../packages/shared/src'),
  '@ovds/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
  '@ovds/database': path.resolve(__dirname, '../../packages/database/src'),
  '@ovds/ledger': path.resolve(__dirname, '../../packages/ledger/src'),
  '@ovds/banking': path.resolve(__dirname, '../../packages/banking/src'),
  '@ovds/core': path.resolve(__dirname, '../../packages/core/src'),
  '@ovds/design-system': path.resolve(__dirname, '../../packages/design-system/src'),
  '@ovds/ui': path.resolve(__dirname, '../../packages/ui/src'),
};

export default {
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: workspaceAliases,
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../ovds-mor-public'),
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild',
    reportCompressedSize: false,
    sourcemap: true,
  },
};
