/**
 * bin-run-high-mem.mjs — like bin-run.mjs but sets NODE_OPTIONS=--max-old-space-size=4096
 * before spawning the child. Used for memory-intensive builds (e.g. large tsc compilations).
 *
 * Usage:
 *   node scripts/bin-run-high-mem.mjs typescript/bin/tsc [args...]
 */
import { execFileSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binRunPath = resolve(__dirname, 'bin-run.mjs');
const [, , ...args] = process.argv;

const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=4096']
    .filter(Boolean)
    .join(' '),
};

try {
  execFileSync(process.execPath, [binRunPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env,
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
