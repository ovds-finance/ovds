/**
 * run-generate.mjs — crash-safe wrapper around `prisma generate`.
 *
 * WHY THIS EXISTS
 * ───────────────
 * zod-prisma-types@3.3.11 clears its own output directory using the legacy
 * `fs.rmdir(path, { recursive: true })` signature. Node.js removed support for
 * `options.recursive` on `rmdir`, so on Node >= 22 the generator aborts with:
 *
 *   Error while deleting old data in path <output>:
 *   The property 'options.recursive' is no longer supported. Received true
 *
 * `prisma generate` then exits non-zero, which silently leaves the committed Zod
 * contracts stale relative to schema.prisma. 3.3.11 is the latest release, so
 * there is no version to upgrade to; the output directory has to be cleared for
 * the generator so it finds nothing to remove and skips its broken cleanup path.
 *
 * WHY IT STASHES INSTEAD OF DELETING
 * ──────────────────────────────────
 * The generated output is committed source that `@ovds/contracts` compiles
 * against. Deleting it outright before a fallible step makes every generate
 * failure destructive: the old-but-working file is gone, the contracts build
 * breaks, and recovery needs a manual `git restore`. That is unacceptable on the
 * Plesk deploy path.
 *
 * So instead: rename the directory aside, run generate, then
 *   • on success -> drop the stash
 *   • on failure -> restore the stash and surface the original exit code
 *
 * Net effect: generate is atomic. A failure leaves the working tree byte-for-byte
 * as it was.
 *
 * Remove this shim once zod-prisma-types uses fs.rm().
 *
 * Usage:
 *   node scripts/run-generate.mjs ../../.env
 *   node scripts/run-generate.mjs ../../.env.production
 */
import { existsSync, renameSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPkg = resolve(__dirname, '..'); // packages/database/

const [, , envFile] = process.argv;

if (!envFile) {
  console.error('Usage: node scripts/run-generate.mjs <envFile>');
  process.exit(1);
}

// Keep in sync with the `output` of the `zod` generator in prisma/schema.prisma.
const GENERATED_DIRS = ['../contracts/src/prisma-zod'];

// ── Stash existing generated output ──────────────────────────────────────────
const stashed = [];
for (const rel of GENERATED_DIRS) {
  const target = resolve(dbPkg, rel);
  const backup = `${target}.stash`;

  // Clear any stash left behind by a hard kill on a previous run.
  rmSync(backup, { recursive: true, force: true });

  if (existsSync(target)) {
    renameSync(target, backup);
    stashed.push({ target, backup });
    console.log(`✔ Stashed generated output: ${target}`);
  } else {
    stashed.push({ target, backup: null });
  }
}

// ── Run the real generate ────────────────────────────────────────────────────
const result = spawnSync(
  process.execPath,
  [resolve(__dirname, 'prisma-run.mjs'), envFile, 'generate', '--config=./prisma.config.js'],
  { stdio: 'inherit', cwd: dbPkg },
);

const exitCode = result.status ?? 1;

// ── Commit or roll back ──────────────────────────────────────────────────────
for (const { target, backup } of stashed) {
  if (!backup) continue;

  if (exitCode === 0) {
    rmSync(backup, { recursive: true, force: true });
  } else {
    // Discard whatever partial output the failed generate left behind, then
    // put the previous known-good directory back.
    rmSync(target, { recursive: true, force: true });
    renameSync(backup, target);
    console.error(`✖ generate failed (exit ${exitCode}) — restored ${target}`);
  }
}

process.exit(exitCode);
