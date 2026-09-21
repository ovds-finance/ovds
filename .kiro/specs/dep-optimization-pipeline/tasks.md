# Implementation Plan

<!-- ─────────────────────────────────────────────────────────────────────────
     Permanent Automated Dependency Optimization Pipeline
     All scripts/config/CI workflow are already on disk — these tasks drive
     validation, baseline setup, integration, documentation, and housekeeping.
     ───────────────────────────────────────────────────────────────────────── -->

- [x] 1. Validate each script runs without errors locally
  - **Property 1: Bug Condition** - Script Execution Health
  - **IMPORTANT**: Run each script BEFORE any fixes — failures reveal missing build artefacts, Node syntax issues, or bad paths (Bug Condition)
  - **GOAL**: Surface counterexamples where a script exits non-zero on a clean checkout
  - **Scoped PBT Approach**: Deterministic — run each script once with `--help`-equivalent flags; a crash/non-zero exit is the failing case
  - Run `node scripts/bundle-analyze.mjs --output .reports/bundle` (requires a prior `npx nx build frontend`; if build artefacts absent the script should print a clear error and exit 1 — **not** crash with an unhandled exception)
  - Run `node scripts/dep-check.mjs --output .reports/deps --skip-knip` (skip-knip for speed; still exercises pnpm-dedupe, range audit, circular-dep checks)
  - Run `node scripts/size-check.mjs --output .reports/bundle` (first run creates baseline — verify the file appears at `.reports/bundle/baseline.json`)
  - Run `node scripts/optimize-report.mjs --output .reports` (reads sub-reports; verify `.reports/optimize-report.json` is written)
  - Run `pwsh -File scripts/optimize.ps1 -SkipBuild -SkipKnip` (local pipeline entrypoint on Windows)
  - **EXPECTED OUTCOME**: Each script exits 0 and writes its output file(s). Document any counterexample (e.g., "bundle-analyze exits 1 because `apps/public/assets` is absent without a prior build")
  - Mark task complete when all five scripts have been run, exit codes recorded, and any errors documented
  - _Requirements: 1.1_

- [x] 2. Write preservation property tests for non-error paths (BEFORE any fixes)
  - **Property 2: Preservation** - Correct-Input Behaviour
  - **IMPORTANT**: Follow observation-first methodology — run each script with valid inputs on UNFIXED code, record actual outputs, then assert those outputs as properties
  - Observe: `dep-check.mjs --skip-knip` writes `dep-check.json` with a `warnCount` integer field — even when 0
  - Observe: `size-check.mjs` in first-run mode creates `baseline.json` and exits 0
  - Observe: `bundle-analyze.mjs` with a valid build dir writes `bundle-stats.json` containing `summary.totalSizeKb`
  - Observe: `optimize-report.mjs` merges all three sub-reports into `optimize-report.json` and `optimize-summary.md`
  - Write property-based tests: for any valid `--output` path, each script writes its expected output file(s) and does NOT modify files outside `--output`
  - Verify tests pass on unfixed code (i.e., they should pass now, before any changes)
  - **EXPECTED OUTCOME**: Tests PASS — confirms the baseline preservation contract before any further changes
  - _Requirements: 3.1, 3.2_

- [x] 3. Fix: establish baseline and resolve first-run issues

  - [x] 3.1 Build frontend and establish bundle-size baseline on main branch
    - Run `npx nx build frontend` to produce `apps/public/assets/`
    - Run `node scripts/bundle-analyze.mjs --output .reports/bundle` — verify `bundle-stats.json` is written
    - Run `node scripts/size-check.mjs --update-baseline` — verify `baseline.json` is written to `.reports/bundle/`
    - Commit baseline: `git add .reports/bundle/baseline.json && git commit -m "chore: establish bundle size baseline"`
    - _Bug_Condition: bundle-analyze or size-check exits 1 because `apps/public/assets` did not exist_
    - _Expected_Behavior: both scripts exit 0, baseline.json present at `.reports/bundle/baseline.json`_
    - _Preservation: dep-check, optimize-report and knip.config.ts are not modified_
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 Run dep-check with knip enabled and triage findings
    - Run `node scripts/dep-check.mjs --output .reports/deps` (knip enabled; allow up to 2 min)
    - Open `.reports/deps/dep-check.md` and categorise each finding:
      - **Loose version ranges** — fix with `node scripts/dep-check.mjs --fix-ranges` (local only), then review diff
      - **Duplicate package versions** — add/extend `overrides` block in root `package.json`
      - **pnpm dedupe opportunities** — run `pnpm dedupe` and commit updated `pnpm-lock.yaml`
      - **Circular workspace deps** — raise as a separate ticket; do not fix in this task
      - **Knip unused exports/files** — review each; suppress false positives in `knip.config.ts → ignoreDependencies`
    - Re-run dep-check to confirm `warnCount` is at or below an agreed threshold
    - _Bug_Condition: isBugCondition(dep-check output) where warnCount > 0 for actionable items_
    - _Expected_Behavior: all loose-range and dedupe warnings resolved; knip false-positives suppressed_
    - _Preservation: no workspace package source files modified; only package.json range strings and pnpm-lock.yaml_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 3.3 Verify Property 1 exploration test now passes (all scripts exit 0)
    - **Property 1: Expected Behavior** - Script Execution Health
    - **IMPORTANT**: Re-run the SAME checks from task 1 — do NOT write new tests
    - Run `node scripts/dep-check.mjs --output .reports/deps --skip-knip` → must exit 0
    - Run `node scripts/bundle-analyze.mjs --output .reports/bundle` → must exit 0
    - Run `node scripts/size-check.mjs --output .reports/bundle` → must exit 0 (no regression vs baseline)
    - Run `node scripts/optimize-report.mjs --output .reports` → must exit 0
    - Run `pwsh -File scripts/optimize.ps1 -SkipBuild -SkipKnip` → must exit 0
    - **EXPECTED OUTCOME**: All five scripts exit 0 (confirms bug is fixed)
    - _Requirements: 1.1_

  - [x] 3.4 Verify Property 2 preservation tests still pass
    - **Property 2: Preservation** - Correct-Input Behaviour
    - **IMPORTANT**: Re-run the SAME checks from task 2 — do NOT write new tests
    - Re-run the property assertions from task 2 against post-fix output files
    - Confirm `dep-check.json`, `bundle-stats.json`, `size-check.json`, and `optimize-report.json` all retain their expected structure
    - **EXPECTED OUTCOME**: Tests PASS — no regressions introduced by the dep-check triage fixes
    - _Requirements: 3.1, 3.2_

- [x] 4. Verify `npx nx run-many --target=optimize` works across all projects

  - [x] 4.1 Confirm nx.json targets are reachable
    - Run `npx nx show target optimize` and verify it resolves to the `nx:run-commands` executor defined in `nx.json`
    - Run `npx nx optimize frontend` (single project) — confirm reports are written to `.reports/`
    - _Requirements: 4.1_

  - [x] 4.2 Run workspace-wide optimize target
    - Run `npx nx run-many --target=optimize --all` — verify no executor crash
    - Confirm `.reports/bundle/bundle-stats.json`, `.reports/deps/dep-check.json`, `.reports/optimize-report.json` are all present after the run
    - Note: `bundle-analyze` and `dep-check` are marked `cache: false` in nx.json — confirm they re-run each time
    - _Requirements: 4.1, 4.2_

  - [x] 4.3 Confirm individual alias scripts work
    - Run `npm run optimize:bundle` → `bundle-stats.json` written
    - Run `npm run optimize:deps` → `dep-check.json` written
    - Run `npm run optimize:report` → `optimize-summary.md` written
    - Run `npm run optimize:size-check` → `size-check.json` written (compared against baseline)
    - _Requirements: 4.1_

- [x] 5. CI smoke test — confirm GitHub Actions workflow triggers correctly

  - [x] 5.1 Push a test branch that touches a watched path
    - Create branch: `git checkout -b test/dep-optimization-smoke`
    - Make a trivial change to `package.json` (e.g., add a comment to `scripts`) and push
    - Verify the `dep-optimization.yml` workflow is triggered in GitHub Actions
    - _Requirements: 5.1_

  - [x] 5.2 Verify individual CI jobs run and produce artifacts
    - Monitor the `dep-check` job — confirm it completes and uploads `dep-check-report-*` artifact
    - Monitor the `bundle-analyze` job — confirm it completes (build step may be slow; ~10 min)
    - Monitor the `size-regression` job — confirm it downloads the bundle report and runs size-check.mjs
    - Monitor the `prisma-audit` job — confirm it passes the schema.prisma checks
    - Monitor the `report` job — confirm `optimize-summary.md` is written and a PR comment is posted (if on a PR)
    - _Requirements: 5.1, 5.2_

  - [x] 5.3 Verify strict-mode gate on main/develop
    - Open a PR targeting `develop` and confirm `STRICT_MODE=true` is set in the workflow env
    - Intentionally introduce a loose version range in a test branch → confirm the `dep-check` job fails in strict mode
    - Revert the change and confirm the job passes
    - _Requirements: 5.2_

  - [x] 5.4 Verify knip is skipped on regular pushes and included on nightly / PRs
    - Push directly to a feature branch — confirm `SKIP_KNIP="--skip-knip"` path is taken in the `dep-check` job shell script
    - Open a PR → confirm knip runs (no `--skip-knip` flag for PRs)
    - _Requirements: 5.1_

- [x] 6. Documentation — add usage notes to scripts/README.md

  - [x] 6.1 Append optimization pipeline section to scripts/README.md
    - Add a new section `## Dependency Optimization Pipeline` after the existing deployment content
    - Document the five entry points:
      - `npm run optimize` — full local run (build + analyze + dep-check + report)
      - `npm run optimize:local` — PowerShell entrypoint (`scripts/optimize.ps1`)
      - `npm run optimize:bundle` / `npm run optimize:deps` / `npm run optimize:report` — individual checks
      - `npx nx optimize frontend` — single-project optimization via Nx
      - `node scripts/size-check.mjs --update-baseline` — update the baseline after intentional size increases
    - Document the `--fail-on-warn` flag and when it is activated (main/develop CI)
    - Document where reports land: `.reports/bundle/`, `.reports/deps/`, `.reports/optimize-summary.md`
    - Add a "Fixing common issues" table covering: loose ranges (`--fix-ranges`), dedupe (`pnpm dedupe`), knip false-positives (`ignoreDependencies` in knip.config.ts)
    - _Requirements: 6.1_

  - [x] 6.2 Add optimization pipeline quick-reference to root README (or create one)
    - If no root `README.md` exists, create one with a minimal monorepo overview
    - Add a `### Optimization & Bundle Health` section with a 1-paragraph description and a link to `scripts/README.md#dependency-optimization-pipeline`
    - Include a badge or table row for the `dep-optimization.yml` workflow status
    - _Requirements: 6.1_

- [x] 7. (Optional) Set up Kiro PostFileSave hook for vite.config.ts changes

  - [x] 7.1 Create PostFileSave hook for bundle analysis on vite.config.ts save
    - Create `.kiro/hooks/bundle-analyze-on-vite-save.json` with trigger `PostFileSave`, matcher `vite\\.config\\.ts$`, and action `node scripts/bundle-analyze.mjs --output .reports/bundle`
    - Verify the hook file is valid JSON and the matcher fires only on `vite.config.ts` paths
    - Note: this requires a prior frontend build; add a guard comment in the hook description
    - _Requirements: 7.1_

  - [x] 7.2 Test the hook fires after saving vite.config.ts
    - Open `apps/frontend/vite.config.ts` in the editor and make a whitespace-only change
    - Save the file and confirm the hook executes `bundle-analyze.mjs`
    - Verify `.reports/bundle/bundle-stats.json` is updated with a fresh timestamp
    - Undo the whitespace change
    - _Requirements: 7.1_

- [x] 8. Checkpoint — ensure all checks pass end-to-end
  - Run the full local pipeline: `npm run optimize:local` (or `pwsh -File scripts/optimize.ps1`)
  - Confirm exit code 0 and no warnings in the summary at `.reports/optimize-summary.md`
  - Run `npm run optimize:ci` (the CI-equivalent strict run without a build step) and confirm exit 0
  - Confirm the GitHub Actions workflow on `main`/`develop` is green
  - Ensure all tests pass; ask the user if questions arise.
