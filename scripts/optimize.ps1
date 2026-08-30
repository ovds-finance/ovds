# optimize.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Windows-local entrypoint for the OVDS dependency optimization pipeline.
#
# Runs all optimization checks locally, produces reports under .reports/,
# and opens the summary markdown in the default browser.
#
# Usage:
#   pwsh -File scripts/optimize.ps1 [options]
#   .\scripts\optimize.ps1 [options]
#
# Options:
#   -SkipBuild        Skip the frontend production build (use cached build)
#   -SkipKnip         Skip the knip scan (knip can be slow on first run)
#   -UpdateBaseline   Update the size-check baseline and exit
#   -FailOnWarn       Exit 1 if any warnings are found (mirrors CI behavior)
#   -ThresholdKb <n>  Chunk size warning threshold in KB (default: 500)
#   -Delta <n>        Allowed bundle size growth % per chunk (default: 10)
#   -OpenReport       Open the summary in the default browser after run

param(
    [switch]$SkipBuild,
    [switch]$SkipKnip,
    [switch]$UpdateBaseline,
    [switch]$FailOnWarn,
    [int]$ThresholdKb = 500,
    [int]$Delta = 10,
    [switch]$OpenReport
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

function Write-Section($title) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Write-Step($msg) {
    Write-Host "  → $msg" -ForegroundColor Yellow
}

function Write-Ok($msg) {
    Write-Host "  ✅ $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "  ⚠️  $msg" -ForegroundColor Yellow
}

$REPORTS_DIR = Join-Path $ROOT ".reports"
New-Item -ItemType Directory -Force -Path $REPORTS_DIR | Out-Null

Write-Section "OVDS Dependency Optimization Pipeline"
Write-Host "  Root: $ROOT"
Write-Host "  Reports: $REPORTS_DIR"

$failOnWarnFlag = if ($FailOnWarn) { "--fail-on-warn" } else { "" }
$skipKnipFlag   = if ($SkipKnip)   { "--skip-knip" }   else { "" }
$overallIssues  = 0

# ── Step 1: Frontend production build ────────────────────────────────────────
Write-Section "Step 1/4 — Frontend Build"
if ($SkipBuild) {
    Write-Warn "Skipping build (-SkipBuild). Using existing artifacts in apps/public/assets."
} else {
    Write-Step "Building frontend (npx nx build frontend)..."
    try {
        Push-Location $ROOT
        npx nx build frontend
        if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
        Write-Ok "Frontend build succeeded"
    } catch {
        Write-Host "  ❌ Frontend build failed: $_" -ForegroundColor Red
        Write-Warn "Skipping bundle analysis — build required"
        $overallIssues++
    } finally {
        Pop-Location
    }
}

# ── Step 2: Bundle analysis ────────────────────────────────────────────────────
Write-Section "Step 2/4 — Bundle Analysis"
Write-Step "Analysing chunk sizes (threshold: ${ThresholdKb} KB)..."
try {
    $bundleArgs = @(
        "scripts/bundle-analyze.mjs",
        "--output", (Join-Path $REPORTS_DIR "bundle"),
        "--threshold", $ThresholdKb
    )
    if ($FailOnWarn) { $bundleArgs += "--fail-on-warn" }

    node @bundleArgs
    if ($LASTEXITCODE -ne 0) { $overallIssues++ }
    else { Write-Ok "Bundle analysis complete" }
} catch {
    Write-Warn "Bundle analysis failed: $_"
}

# ── Step 2b: Size regression check ────────────────────────────────────────────
if ($UpdateBaseline) {
    Write-Step "Updating size baseline..."
    node scripts/size-check.mjs --update-baseline
    Write-Ok "Baseline updated"
} else {
    Write-Step "Checking for size regressions (allowed delta: ${Delta}%)..."
    try {
        $sizeArgs = @(
            "scripts/size-check.mjs",
            "--delta", $Delta,
            "--output", (Join-Path $REPORTS_DIR "bundle")
        )
        if ($FailOnWarn) { $sizeArgs += "--fail-on-warn" }

        node @sizeArgs
        if ($LASTEXITCODE -ne 0) { $overallIssues++ }
        else { Write-Ok "Size regression check complete" }
    } catch {
        Write-Warn "Size regression check failed: $_"
    }
}

# ── Step 3: Dependency check ──────────────────────────────────────────────────
Write-Section "Step 3/4 — Dependency Health Check"
try {
    $depArgs = @(
        "scripts/dep-check.mjs",
        "--output", (Join-Path $REPORTS_DIR "deps")
    )
    if ($SkipKnip) { $depArgs += "--skip-knip" }
    if ($FailOnWarn) { $depArgs += "--fail-on-warn" }

    node @depArgs
    if ($LASTEXITCODE -ne 0) { $overallIssues++ }
    else { Write-Ok "Dependency check complete" }
} catch {
    Write-Warn "Dependency check failed: $_"
}

# ── Step 4: Consolidate report ────────────────────────────────────────────────
Write-Section "Step 4/4 — Consolidating Report"
try {
    $reportArgs = @(
        "scripts/optimize-report.mjs",
        "--output", $REPORTS_DIR
    )
    if ($FailOnWarn) { $reportArgs += "--fail-on-warn" }

    node @reportArgs
    if ($LASTEXITCODE -ne 0) { $overallIssues++ }
    else { Write-Ok "Report consolidated" }
} catch {
    Write-Warn "Report consolidation failed: $_"
}

# ── Final summary ─────────────────────────────────────────────────────────────
Write-Section "Pipeline Complete"
$summaryPath = Join-Path $REPORTS_DIR "optimize-summary.md"
if (Test-Path $summaryPath) {
    Write-Host "  Summary: $summaryPath" -ForegroundColor Cyan
    if ($OpenReport) {
        Start-Process $summaryPath
    }
}

if ($overallIssues -gt 0) {
    Write-Host ""
    Write-Host "  ⚠️  $overallIssues check(s) reported issues. Review the reports above." -ForegroundColor Yellow
    if ($FailOnWarn) {
        Write-Host "  ❌ Failing due to -FailOnWarn flag." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "  ✅ All optimization checks passed." -ForegroundColor Green
}
