# OVDS Complete Cleanup Script
# Run as Administrator for best results

$ErrorActionPreference = "SilentlyContinue"
$removed = 0
$errors = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Complete Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Remove node_modules
Write-Host "`n[1/8] Removing node_modules..." -ForegroundColor Yellow
Get-ChildItem -Path $PSScriptRoot -Recurse -Filter "node_modules" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction Stop
        $removed++
        Write-Host "  Removed: $($_.FullName)" -ForegroundColor Gray
    } catch {
        $errors++
        Write-Host "  Failed: $($_.FullName)" -ForegroundColor Red
    }
}
Write-Host "  Removed $removed node_modules folders" -ForegroundColor Green

# 2. Remove temp/tmp files
Write-Host "`n[2/8] Removing temp files..." -ForegroundColor Yellow
$tempPatterns = @("*.tmp","*.temp","*.bak","*.swp","*.orig","*.rej","*~","*.log","*.cache")
$tempRemoved = 0
foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path $PSScriptRoot -Recurse -Filter $pattern -File -ErrorAction SilentlyContinue | Where-Object {
        $_.DirectoryName -notmatch 'node_modules'
    } | ForEach-Object {
        try {
            Remove-Item -Path $_.FullName -Force -ErrorAction Stop
            $tempRemoved++
        } catch { }
    }
}
Write-Host "  Removed $tempRemoved temp files" -ForegroundColor Green

# 3. Remove empty files
Write-Host "`n[3/8] Removing empty files..." -ForegroundColor Yellow
$emptyRemoved = 0
Get-ChildItem -Path $PSScriptRoot -Recurse -Include "*.ts","*.tsx","*.js","*.mjs","*.json" -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Length -eq 0 -and $_.DirectoryName -notmatch 'node_modules|\.git'
} | ForEach-Object {
    try {
        Remove-Item -Path $_.FullName -Force -ErrorAction Stop
        $emptyRemoved++
        Write-Host "  Removed: $($_.FullName)" -ForegroundColor Gray
    } catch { }
}
Write-Host "  Removed $emptyRemoved empty files" -ForegroundColor Green

# 4. Remove duplicate files (keep first occurrence)
Write-Host "`n[4/8] Checking for duplicate files..." -ForegroundColor Yellow
$dupes = Get-ChildItem -Path "$PSScriptRoot\apps","$PSScriptRoot\packages" -Recurse -Include "*.ts","*.tsx" -File -ErrorAction SilentlyContinue | Where-Object {
    $_.DirectoryName -notmatch 'node_modules|\.next|dist|build'
} | Group-Object Name | Where-Object { $_.Count -gt 1 }

$dupeRemoved = 0
foreach ($dup in $dupes) {
    $first = $true
    foreach ($file in $dup.Group) {
        if ($first) {
            $first = false
            continue
        }
        # Check if file in pages/ AND components/ (both are valid)
        if ($file.DirectoryName -match 'pages$' -and ($dup.Group | Where-Object { $_.DirectoryName -match 'components' })) {
            continue  # Keep both - they serve different purposes
        }
        # Check if file in domains/ AND modules/ (both are valid)
        if ($file.DirectoryName -match 'domains\\' -and ($dup.Group | Where-Object { $_.DirectoryName -match 'modules' })) {
            continue  # Keep both - different packages
        }
        try {
            Remove-Item -Path $file.FullName -Force -ErrorAction Stop
            $dupeRemoved++
            Write-Host "  Removed duplicate: $($file.FullName)" -ForegroundColor Gray
        } catch { }
    }
}
Write-Host "  Removed $dupeRemoved true duplicates" -ForegroundColor Green

# 5. Clean NX cache
Write-Host "`n[5/8] Cleaning NX cache..." -ForegroundColor Yellow
$nxCache = "$PSScriptRoot\.nx\cache"
if (Test-Path $nxCache) {
    Remove-Item -Path $nxCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  NX cache cleared" -ForegroundColor Green
} else {
    Write-Host "  No NX cache found" -ForegroundColor Gray
}

# 6. Clean old report files
Write-Host "`n[6/8] Cleaning old reports..." -ForegroundColor Yellow
$reportRemoved = 0
Get-ChildItem -Path "$PSScriptRoot\.nx\workspace-data" -Filter "report.*" -File -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Remove-Item -Path $_.FullName -Force -ErrorAction Stop
        $reportRemoved++
    } catch { }
}
Get-ChildItem -Path "$PSScriptRoot\security-reports" -File -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Remove-Item -Path $_.FullName -Force -ErrorAction Stop
        $reportRemoved++
    } catch { }
}
Write-Host "  Removed $reportRemoved old reports" -ForegroundColor Green

# 7. Fix line endings (CRLF -> LF for source files)
Write-Host "`n[7/8] Fixing line endings..." -ForegroundColor Yellow
$fixed = 0
Get-ChildItem -Path "$PSScriptRoot\apps","$PSScriptRoot\packages","$PSScriptRoot\scripts" -Recurse -Include "*.ts","*.tsx","*.js","*.mjs" -File -ErrorAction SilentlyContinue | Where-Object {
    $_.DirectoryName -notmatch 'node_modules'
} | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    if ($content -match '\r\n') {
        $content = $content -replace '\r\n', "`n"
        [System.IO.File]::WriteAllText($_.FullName, $content)
        $fixed++
    }
}
Write-Host "  Fixed line endings in $fixed files" -ForegroundColor Green

# 8. Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  node_modules removed: $removed" -ForegroundColor White
Write-Host "  Temp files removed: $tempRemoved" -ForegroundColor White
Write-Host "  Empty files removed: $emptyRemoved" -ForegroundColor White
Write-Host "  Duplicates removed: $dupeRemoved" -ForegroundColor White
Write-Host "  Reports removed: $reportRemoved" -ForegroundColor White
Write-Host "  Line endings fixed: $fixed" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

if ($errors -gt 0) {
    Write-Host "`n  $errors items could not be removed (may need admin rights)" -ForegroundColor Yellow
}

Write-Host "`n  Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm install" -ForegroundColor White
Write-Host "  2. Run: npm run dev:all" -ForegroundColor White
Write-Host "  3. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host ""
