/**
 * bin-run.mjs — cross-platform binary runner
 *
 * Resolves a package's CLI entry point via its package.json "bin" field and
 * executes it directly with Node — bypassing the shell wrapper in
 * node_modules/.bin/ which lacks execute permission after FTP uploads on Linux.
 *
 * Usage (from any workspace package directory):
 *   node <rootRelativePath>/scripts/bin-run.mjs <packageName> [args...]
 *
 * Examples (run from packages/design-system):
 *   node ../../scripts/bin-run.mjs typescript/bin/tsc
 *   node ../../scripts/bin-run.mjs typescript/bin/tsc --noEmit
 *   node ../../scripts/bin-run.mjs @nestjs/cli/bin/nest build
 *   node ../../scripts/bin-run.mjs vite/bin/vite build
 */
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync, statSync, lstatSync } from 'fs';

function isDirectory(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Collect any leading V8/Node memory flags before the bin path, e.g.:
//   node bin-run.mjs --max-old-space-size=4096 typescript/bin/tsc --noEmit
const V8_FLAG_RE = /^--(max-old-space-size|max-semi-space-size|expose-gc|gc-interval)(?:=\d+)?$/;
const rawArgv = process.argv.slice(2);
const leadingNodeFlags = [];
while (rawArgv.length > 0 && V8_FLAG_RE.test(rawArgv[0])) {
  leadingNodeFlags.push(rawArgv.shift());
}

// The first remaining arg is the bin entry relative to node_modules, e.g. "typescript/bin/tsc"
const [binPath, ...args] = rawArgv;

if (!binPath) {
  console.error('Usage: node scripts/bin-run.mjs [--node-flags] <pkg/bin/entry> [args...]');
  process.exit(1);
}

// Resolve from root node_modules — also try with .js extension
const fullPath = resolve(root, 'node_modules', binPath);
const fullPathJs = fullPath + '.js';

let resolvedPath = null;

if (existsSync(fullPath) && !isDirectory(fullPath)) {
  resolvedPath = fullPath;
} else if (existsSync(fullPathJs)) {
  resolvedPath = fullPathJs;
} else if (existsSync(fullPath) && isDirectory(fullPath)) {
  // If the path is a directory, look for package.json bin entry or common CLI entrypoints
  const pkgJsonPath = resolve(fullPath, 'package.json');
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      const binEntry = pkg.bin?.[binPath] || pkg.bin;
      if (typeof binEntry === 'string') {
        const binFull = resolve(fullPath, binEntry);
        if (existsSync(binFull) && !isDirectory(binFull)) {
          resolvedPath = binFull;
        } else if (existsSync(binFull + '.js')) {
          resolvedPath = binFull + '.js';
        }
      }
    } catch {
      // ignore package.json parse errors, fall through to require fallback
    }
  }
  // Also try common entrypoints for ESM-first packages like tsx
  if (!resolvedPath) {
    const candidates = [
      resolve(fullPath, 'dist', 'cli.mjs'),
      resolve(fullPath, 'dist', 'cli.js'),
      resolve(fullPath, 'dist', 'index.mjs'),
      resolve(fullPath, 'dist', 'index.js'),
      resolve(fullPath, 'bin', binPath),
      resolve(fullPath, 'bin', binPath + '.js'),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate) && !isDirectory(candidate)) {
        resolvedPath = candidate;
        break;
      }
    }
  }
}

if (!resolvedPath) {
  // Fallback 1: try resolving from CWD's node_modules (for workspace-local packages)
  const cwdPath = resolve(process.cwd(), 'node_modules', binPath);
  const cwdPathJs = cwdPath + '.js';
  if (existsSync(cwdPath) && !isDirectory(cwdPath)) {
    resolvedPath = cwdPath;
  } else if (existsSync(cwdPathJs)) {
    resolvedPath = cwdPathJs;
  }
}

if (!resolvedPath) {
  // Fallback 2: try resolving via require
  try {
    const req = createRequire(import.meta.url);
    const resolved = req.resolve(binPath);
    execFileSync(process.execPath, [...leadingNodeFlags, resolved, ...args], { stdio: 'inherit', env: process.env });
    process.exit(0);
  } catch {
    // Also try resolving from CWD via require
    try {
      const cwdReq = createRequire(resolve(process.cwd(), '__placeholder__.js'));
      const resolved = cwdReq.resolve(binPath);
      execFileSync(process.execPath, [...leadingNodeFlags, resolved, ...args], { stdio: 'inherit', env: process.env });
      process.exit(0);
    } catch {
      console.error(`ERROR: Cannot find binary: ${fullPath}`);
      process.exit(1);
    }
  }
}

// Use resolvedPath below instead of fullPath

// Also forward NODE_OPTIONS from the environment (e.g. CI or shell may set this).
const nodeOptionsEnv = process.env.NODE_OPTIONS ?? '';
const envNodeFlags = nodeOptionsEnv
  .split(/\s+/)
  .map(f => f.trim())
  .filter(Boolean);

// Merge env flags + leading argv flags; argv wins on duplicate flag names.
const flagMap = new Map();
for (const f of [...envNodeFlags, ...leadingNodeFlags]) {
  const key = f.replace(/=.*$/, '');
  flagMap.set(key, f);
}
const nodeFlags = [...flagMap.values()];

try {
  execFileSync(process.execPath, [...nodeFlags, resolvedPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
