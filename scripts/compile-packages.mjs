import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { readFileSync, writeFileSync, existsSync, readdirSync, lstatSync, unlinkSync, rmSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const swcBin = resolve(root, 'node_modules', '@swc', 'cli', 'bin', 'swc.js');

function isDirectory(path) {
  try { return lstatSync(path).isDirectory(); } catch { return false; }
}

function compilePackage(pkgDir) {
  const srcDir = join(pkgDir, 'src');
  const distDir = join(pkgDir, 'dist');
  const pkgJsonPath = join(pkgDir, 'package.json');

  if (!existsSync(srcDir)) {
    console.log(`Skip ${pkgDir}: no src/`);
    return;
  }

  if (existsSync(distDir)) {
    try {
      rmSync(distDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to clean ${distDir}: ${e.message}`);
    }
  }

  const pkg = existsSync(pkgJsonPath) ? JSON.parse(readFileSync(pkgJsonPath, 'utf8')) : {};
  const moduleType = pkg.type === 'module' ? 'es6' : 'commonjs';

  try {
    execFileSync(process.execPath, [swcBin, '-d', distDir, srcDir, '--strip-leading-paths', '-C', `module.type=${moduleType}`], {
      cwd: pkgDir,
      stdio: 'pipe',
      env: process.env
    });
    console.log(`Compiled ${pkgDir} (${moduleType})`);
  } catch (e) {
    console.error(`Failed to compile ${pkgDir}: ${e.message}`);
  }
}

function updatePackageJson(pkgDir) {
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) return;

  const content = readFileSync(pkgJsonPath, 'utf8');
  const pkg = JSON.parse(content);

  let changed = false;

  if (pkg.main === './src/index.js' || pkg.main === './src/index.ts') {
    pkg.main = './dist/index.js';
    changed = true;
  }

  if (pkg.types === './src/index.ts' || pkg.types === './src/index.js') {
    pkg.types = './dist/index.d.ts';
    changed = true;
  }

  if (changed) {
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${pkg.name} -> main: ${pkg.main}, types: ${pkg.types}`);
  }
}

function cleanStaleJs(pkgDir) {
  const srcDir = join(pkgDir, 'src');
  if (!existsSync(srcDir)) return;

  function removeJs(dir) {
    if (!isDirectory(dir)) return;
    for (const file of readdirSync(dir)) {
      const fullPath = join(dir, file);
      if (isDirectory(fullPath)) {
        removeJs(fullPath);
      } else if (file.endsWith('.js')) {
        try {
          unlinkSync(fullPath);
          console.log(`Removed stale ${fullPath}`);
        } catch (e) {
          console.error(`Failed to remove ${fullPath}: ${e.message}`);
        }
      }
    }
  }

  removeJs(srcDir);
}

const packagesRoot = resolve(root, 'packages');

for (const type of readdirSync(packagesRoot)) {
  const typeDir = join(packagesRoot, type);
  if (!isDirectory(typeDir)) continue;

  for (const name of readdirSync(typeDir)) {
    const pkgDir = join(typeDir, name);
    const pkgJsonPath = join(pkgDir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    if (!pkg.name || !pkg.name.startsWith('@ovds/')) continue;

    cleanStaleJs(pkgDir);
    compilePackage(pkgDir);
    updatePackageJson(pkgDir);
  }
}

console.log('Done compiling packages.');
