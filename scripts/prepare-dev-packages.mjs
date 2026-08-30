import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

for (const type of ['domains', 'features']) {
  const typeDir = path.join(root, 'packages', type);
  if (!fs.existsSync(typeDir)) continue;

  for (const name of fs.readdirSync(typeDir)) {
    const pkgDir = path.join(typeDir, name);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    if (pkg.main === './src/index.ts') {
      pkg.main = './src/index.js';
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`Updated ${pkg.name} -> main: ${pkg.main}`);
    }

    const importPath = `@ovds/${type}/${name}`;
    const symlinkDir = path.join(root, 'node_modules', ...importPath.split('/'));
    const symlinkParent = path.dirname(symlinkDir);

    if (!fs.existsSync(symlinkParent)) {
      fs.mkdirSync(symlinkParent, { recursive: true });
    }

    if (!fs.existsSync(symlinkDir)) {
      fs.symlinkSync(path.resolve(pkgDir), symlinkDir, 'junction');
      console.log(`Created symlink ${importPath} -> ${path.resolve(pkgDir)}`);
    }
  }
}
