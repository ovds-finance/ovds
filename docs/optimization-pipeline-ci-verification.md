# CI Verification Guide — Dependency Optimization Pipeline

> **Context:** Branch `test/dep-optimization-smoke` has local commits ready.
> This guide covers what to verify manually once that branch is pushed to GitHub
> (SSH auth is required from the user before the push can complete).
>
> Workflow file: `.github/workflows/dep-optimization.yml`
> GitHub Actions URL: `https://github.com/ovds-finance/ovds/actions/workflows/dep-optimization.yml`

---

## Task 5.2 — Verify individual CI jobs run and produce artifacts

### How to confirm the workflow triggered

1. Push the branch (requires SSH key added to GitHub by the user).
2. Open the Actions tab:
   `https://github.com/ovds-finance/ovds/actions/workflows/dep-optimization.yml`
3. Confirm a new run appears for the `test/dep-optimization-smoke` push.
4. The run should show **5 jobs**: `dep-check`, `bundle-analyze`, `size-regression`, `prisma-audit`, `report`.

---

### Job-by-job checklist

#### `dep-check` — Dependency Health Check

- [ ] Job starts and runs `node scripts/dep-check.mjs`
- [ ] Knip is **skipped** on this push (regular push, not a PR — see Task 5.4 for why)
- [ ] `pnpm dedupe` check runs without error
- [ ] Version range audit runs without error
- [ ] Job exits **0** (green)
- [ ] Artifact `dep-check-report-<run-number>` is uploaded and downloadable from the run summary

#### `bundle-analyze` — Bundle Analysis

- [ ] Job runs `npx nx run-many --target=build --projects=contracts,shared,database,ui,core,design-system`
- [ ] Job runs `npx nx build frontend` (production mode)
- [ ] `node scripts/bundle-analyze.mjs --output .reports/bundle --threshold 500` executes
- [ ] Job exits **0** (green); no chunk exceeds 500 KB, or warnings are non-fatal on a feature branch
- [ ] Artifact `bundle-report-<run-number>` is uploaded (contains `bundle-stats.json` and `bundle-summary.md`)

> **Note:** This job typically takes 8–12 minutes due to the full frontend build.

#### `size-regression` — Bundle Size Regression

- [ ] Job downloads `bundle-report-<run-number>` from the `bundle-analyze` job
- [ ] Attempts to restore the `size-baseline-main` cache; on first run the cache may be missing — script should handle that gracefully (exits 0 with "no baseline" message)
- [ ] `node scripts/size-check.mjs --output .reports/bundle --delta 10` executes
- [ ] Job exits **0** — size delta within ±10 % of baseline (or no baseline yet)
- [ ] Artifact `size-check-report-<run-number>` is uploaded

#### `prisma-audit` — Prisma Configuration Audit

- [ ] `packages/database/package.json` has `"sideEffects": false` → ✅ line appears in job summary
- [ ] `packages/contracts/package.json` has `"sideEffects": false` → ✅ line appears in job summary
- [ ] `packages/database/prisma/schema.prisma` has **no** `binaryTargets` entry → ✅ line appears
- [ ] Job exits **0** (green)

#### `report` — Consolidated Optimization Report

- [ ] Job downloads `dep-check-report-*`, `bundle-report-*`, and `size-check-report-*` artifacts
- [ ] `node scripts/optimize-report.mjs --output .reports` runs and writes `optimize-summary.md`
- [ ] Job exits **0**
- [ ] Artifact `optimization-report-<run-number>` is uploaded (contains all sub-reports)
- [ ] If the run is from a **pull request**: a sticky PR comment titled "optimization-report" is posted or updated by the `marocchino/sticky-pull-request-comment` action

---

### Troubleshooting failing jobs

| Symptom | Likely cause | Fix |
|---|---|---|
| `bundle-analyze` fails with "cannot find assets" or missing module | `pnpm install` step did not run, or Nx build cache is stale | Check that the `Install dependencies` step precedes the build steps in the workflow; clear Nx cache if needed |
| `prisma-audit` warns `sideEffects` missing | `packages/database/package.json` or `packages/contracts/package.json` does not have `"sideEffects": false` | Add `"sideEffects": false` to the respective `package.json` files and re-push |
| `prisma-audit` warns `binaryTargets` found | Old Prisma 5/6 config still present | Remove `binaryTargets` from the `generator client` block in `packages/database/prisma/schema.prisma` |
| `dep-check` fails on `main`/`develop` (strict mode) | A real dependency issue was detected — loose range, duplicate version, or unused export | Read `.reports/deps/dep-check.md` in the downloaded artifact; fix the flagged issue and re-push |
| `size-regression` fails with > 10 % increase | A new dependency or chunk was added without updating the baseline | Run `npm run optimize:size-baseline` locally after confirming the size increase is intentional, commit the updated `baseline.json`, and re-push |
| `report` job fails despite all other jobs passing | `continue-on-error: true` on artifact downloads means this is unlikely; if it does fail, check that all artifact names match the `<run-number>` pattern | Inspect the "Generate consolidated report" step log |

---

## Task 5.3 — Verify strict-mode gate on main/develop

`STRICT_MODE` is set in the workflow `env` block:

```yaml
STRICT_MODE: ${{ (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop' || github.event.inputs.fail_on_warn == 'true') && 'true' || 'false' }}
```

### Checklist

- [ ] Open a pull request from `test/dep-optimization-smoke` targeting `develop`
- [ ] In the workflow run triggered by the PR, expand the **env** section of any job and confirm `STRICT_MODE=true`
- [ ] All jobs that accept `--fail-on-warn` pass this flag when `STRICT_MODE=true` (visible in the step command logs)

### Testing the gate (intentional failure test)

> Perform this on a throwaway commit; revert before merging.

1. Add a loose version range to any `package.json`, for example:
   ```json
   "some-test-pkg": "*"
   ```
2. Push the change to the PR branch.
3. Confirm the `dep-check` job **fails** (exit 1) in the CI run.
4. Revert the change (`git revert HEAD` or manually remove the entry), push again.
5. Confirm the `dep-check` job **passes** (exit 0).

---

## Task 5.4 — Verify knip skipping behavior

The knip skip logic lives in the `dep-check` job shell script:

```bash
if [ "${{ github.event.inputs.skip_knip }}" = "true" ] || [ "${{ github.event_name }}" = "push" ]; then
  SKIP_KNIP="--skip-knip"
fi
```

### Expected behavior by trigger type

| Trigger | `SKIP_KNIP` value | Knip runs? |
|---|---|---|
| `push` to any branch (including `test/dep-optimization-smoke`) | `--skip-knip` | **No** — knip is skipped for speed |
| `pull_request` to `main` or `develop` | *(empty)* | **Yes** — full unused-dep scan |
| `schedule` (nightly at 02:00 UTC) | *(not set — uses `nightly-full-scan` job)* | **Yes** — dedicated nightly job always enables knip |
| `workflow_dispatch` with `skip_knip: true` | `--skip-knip` | **No** — user explicitly opted out |
| `workflow_dispatch` with `skip_knip: false` (default) | *(empty)* | **Yes** |

### Checklist

- [ ] For the push to `test/dep-optimization-smoke`: open the `dep-check` job log and confirm the command includes `--skip-knip`
- [ ] Open (or simulate) a PR to `develop`: confirm the `dep-check` job command does **not** include `--skip-knip`
- [ ] Confirm the `nightly-full-scan` job definition in the workflow has no `--skip-knip` flag in its `dep-check.mjs` call
- [ ] (Optional) Trigger via `workflow_dispatch` with `skip_knip: false` and verify knip executes

---

## Quick reference — where reports land

| Report | Path in artifact | Local path |
|---|---|---|
| Dependency health | `dep-check-report-N/dep-check.md` | `.reports/deps/dep-check.md` |
| Dependency JSON | `dep-check-report-N/dep-check.json` | `.reports/deps/dep-check.json` |
| Bundle stats | `bundle-report-N/bundle-stats.json` | `.reports/bundle/bundle-stats.json` |
| Bundle summary | `bundle-report-N/bundle-summary.md` | `.reports/bundle/bundle-summary.md` |
| Size check | `size-check-report-N/size-check.md` | `.reports/bundle/size-check.md` |
| Size baseline | cached as `size-baseline-main` | `.reports/bundle/baseline.json` |
| Full report | `optimization-report-N/optimize-summary.md` | `.reports/optimize-summary.md` |

---

*Spec: `.kiro/specs/dep-optimization-pipeline/tasks.md` — Tasks 5.2, 5.3, 5.4*
