# OVDS Module Migration Script
# Ovds SaaS canonical module structure

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot/../..

Write-Host "=== OVDS Module Migration ===" -ForegroundColor Cyan

# ── Helper Functions ──────────────────────────────────────────────────────────

function Copy-IfExists($src, $dst) {
    if (Test-Path $src) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would copy: $src -> $dst" -ForegroundColor DarkGray
            return
        }
        $destDir = Split-Path $dst -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        if ((Get-Item $src).PSIsContainer) {
            Copy-Item $src $dst -Recurse -Force
        } else {
            Copy-Item $src $dst -Force
        }
        Write-Host "  Copied: $src -> $dst" -ForegroundColor DarkGray
    }
}

function Create-Shim($oldPath, $newPath, $type) {
    $shimDir = Join-Path $oldPath "src"
    if (-not (Test-Path $shimDir)) {
        New-Item -ItemType Directory -Path $shimDir -Force | Out-Null
    }

    $newAlias = $newPath.Replace("packages/domains/", "@ovds/domains-").Replace("packages/features/", "@ovds/features/")

    $indexContent = @"
/**
 * Re-export shim — this module has moved to $newAlias.
 *
 * All existing imports continue to work.
 * New code should import from the canonical path directly.
 */
export * from '$newAlias';
"@

    $indexPath = Join-Path $shimDir "index.ts"
    if (-not (Test-Path $indexPath)) {
        Set-Content -Path $indexPath -Value $indexContent
        Write-Host "  Created shim: $indexPath -> $newAlias" -ForegroundColor DarkGray
    }
}

# ── Backend Domain Migrations ─────────────────────────────────────────────────

$backendMigrations = @{
    # Core Accounting Consolidation
    "packages/domains/accounting" = "packages/domains/chart-of-accounts"
    "packages/domains/double-entry" = "packages/domains/chart-of-accounts"
    "packages/domains/sub-ledger" = "packages/domains/journal"
    "packages/domains/general-ledger-compliance" = "packages/domains/compliance"
    "packages/domains/audit-outsourcing" = "packages/domains/compliance"
    "packages/domains/ifrs" = "packages/domains/compliance"
    "packages/domains/invoice" = "packages/domains/invoicing"
    "packages/domains/expenses" = "packages/domains/invoicing"
    "packages/domains/receipts" = "packages/domains/invoicing"
    "packages/domains/sales" = "packages/domains/invoicing"
    "packages/domains/purchases" = "packages/domains/invoicing"
    "packages/domains/procurement" = "packages/domains/invoicing"
    "packages/domains/items" = "packages/domains/inventory"
    "packages/domains/treasury" = "packages/domains/banking"
    "packages/domains/vat" = "packages/domains/tax"
    "packages/domains/payroll" = "packages/domains/hr"
    "packages/domains/trade" = "packages/domains/projects"
    "packages/domains/manufacturing" = "packages/domains/projects"
}

Write-Host "`nPhase 1: Migrating backend domains..." -ForegroundColor Yellow

foreach ($entry in $backendMigrations.GetEnumerator()) {
    $oldPath = $entry.Key
    $newPath = $entry.Value

    Write-Host "  $oldPath -> $newPath" -ForegroundColor Cyan

    if (-not (Test-Path $oldPath)) {
        Write-Host "    SKIP: source not found" -ForegroundColor DarkGray
        continue
    }

    # Copy src files
    $oldSrc = Join-Path $oldPath "src"
    $newSrc = Join-Path $newPath "src"
    if (Test-Path $oldSrc) {
        $files = Get-ChildItem -Path $oldSrc -Recurse -File
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($oldSrc.Length + 1)
            $destPath = Join-Path $newSrc $relativePath
            Copy-IfExists $file.FullName $destPath
        }
    }

    # Copy project.json
    Copy-IfExists (Join-Path $oldPath "project.json") (Join-Path $newPath "project.json")

    # Copy tsconfig files
    foreach ($tsconfig in @("tsconfig.json", "tsconfig.lib.json", "tsconfig.spec.json")) {
        Copy-IfExists (Join-Path $oldPath $tsconfig) (Join-Path $newPath $tsconfig)
    }

    # Create re-export shim
    Create-Shim $oldPath $newPath "domain"
}

# ── Frontend Feature Migrations ───────────────────────────────────────────────

$frontendMigrations = @{
    "packages/features/expenses" = "packages/features/invoicing"
    "packages/features/items" = "packages/features/inventory"
    "packages/features/sales" = "packages/features/invoicing"
    "packages/features/purchases" = "packages/features/invoicing"
    "packages/features/treasury" = "packages/features/banking"
    "packages/features/trade" = "packages/features/projects"
    "packages/features/double-entry" = "packages/features/chart-of-accounts"
    "packages/features/sub-ledger" = "packages/features/journal"
    "packages/features/general-ledger-compliance" = "packages/features/compliance"
    "packages/features/ifrs" = "packages/features/compliance"
    "packages/features/audit-outsourcing" = "packages/features/compliance"
    "packages/features/helpdesk" = "packages/features/platform"
    "packages/features/notifications" = "packages/features/platform"
    "packages/features/iot" = "packages/features/platform"
    "packages/features/workflow" = "packages/features/platform"
    "packages/features/release" = "packages/features/platform"
    "packages/features/appstore" = "packages/features/platform"
    "packages/features/offline-sync" = "packages/features/platform"
    "packages/features/manufacturing" = "packages/features/projects"
}

Write-Host "`nPhase 2: Migrating frontend features..." -ForegroundColor Yellow

foreach ($entry in $frontendMigrations.GetEnumerator()) {
    $oldPath = $entry.Key
    $newPath = $entry.Value

    Write-Host "  $oldPath -> $newPath" -ForegroundColor Cyan

    if (-not (Test-Path $oldPath)) {
        Write-Host "    SKIP: source not found" -ForegroundColor DarkGray
        continue
    }

    # Copy src files
    $oldSrc = Join-Path $oldPath "src"
    $newSrc = Join-Path $newPath "src"
    if (Test-Path $oldSrc) {
        $files = Get-ChildItem -Path $oldSrc -Recurse -File
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($oldSrc.Length + 1)
            $destPath = Join-Path $newSrc $relativePath
            Copy-IfExists $file.FullName $destPath
        }
    }

    # Copy project.json
    Copy-IfExists (Join-Path $oldPath "project.json") (Join-Path $newPath "project.json")

    # Copy tsconfig files
    foreach ($tsconfig in @("tsconfig.json", "tsconfig.lib.json", "tsconfig.spec.json")) {
        Copy-IfExists (Join-Path $oldPath $tsconfig) (Join-Path $newPath $tsconfig)
    }

    # Create re-export shim
    Create-Shim $oldPath $newPath "feature"
}

Write-Host "`n=== Migration Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review copied files in canonical directories" -ForegroundColor White
Write-Host "  2. Run: nx affected:libs" -ForegroundColor White
Write-Host "  3. Run: nx typecheck" -ForegroundColor White
Write-Host "  4. Update imports in frontend pages" -ForegroundColor White
Write-Host "  5. Remove old empty directories after validation" -ForegroundColor White
