import { register } from 'tsconfig-paths';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const tsconfigPath = resolve(root, 'apps/backend/tsconfig.json');

try {
  register({ tsconfig: tsconfigPath, cwd: root, allowJs: true });
} catch (e) {
  console.error('[tsconfig-paths] Failed to register:', e.message);
  process.exit(1);
}
