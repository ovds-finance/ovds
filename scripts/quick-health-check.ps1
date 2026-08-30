# Quick Health Check for OVDS Local Development
# Tests backend, frontend, and counts Node.js processes in parallel
# Optimized: ~3s total instead of 160s

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OVDS Quick Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$sw = [System.Diagnostics.Stopwatch]::StartNew()

$backendJob = Start-Job -ScriptBlock {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health/live" -UseBasicParsing -TimeoutSec 5
        [PSCustomObject]@{ Ok = $true; Status = $r.StatusCode; Content = $r.Content }
    } catch {
        [PSCustomObject]@{ Ok = $false; Status = 0; Content = $_.Exception.Message }
    }
}

$frontendJob = Start-Job -ScriptBlock {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0
        [PSCustomObject]@{ Ok = $true; Status = $r.StatusCode }
    } catch {
        [PSCustomObject]@{ Ok = $false; Status = 0; Content = $_.Exception.Message }
    }
}

$nodeJob = Start-Job -ScriptBlock {
    $count = (Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'ovds|nest|vite|dev-all' }).Count
    $all = (Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'ovds|nest|vite|dev-all' } | ForEach-Object {
        $cmd = $_.CommandLine
        if ($cmd -match '([a-z-]+\.(m?js|ts))') { $Matches[1] } else { "node" }
    })
    [PSCustomObject]@{ Count = $count; Processes = $all }
}

$backend = $backendJob | Receive-Job -Wait -AutoRemoveJob
$frontend = $frontendJob | Receive-Job -Wait -AutoRemoveJob
$nodeInfo = $nodeJob | Receive-Job -Wait -AutoRemoveJob

Write-Host ""
if ($backend.Ok) {
    Write-Host "  BACKEND  OK  : HTTP $($backend.Status) - $($backend.Content)" -ForegroundColor Green
} else {
    Write-Host "  BACKEND  ERR : $($backend.Content)" -ForegroundColor Red
}

if ($frontend.Ok) {
    Write-Host "  FRONTEND OK  : HTTP $($frontend.Status)" -ForegroundColor Green
} else {
    Write-Host "  FRONTEND ERR : $($frontend.Content)" -ForegroundColor Red
}

Write-Host ""
Write-Host "  NODE PROCESSES : $($nodeInfo.Count) active" -ForegroundColor Cyan
if ($nodeInfo.Processes) {
    $nodeInfo.Processes | Group-Object | ForEach-Object {
        Write-Host "    - $($_.Name) ($($_.Count))" -ForegroundColor Gray
    }
}

$sw.Stop()
Write-Host ""
Write-Host "  Completed in $($sw.Elapsed.TotalSeconds.ToString('F1'))s" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
