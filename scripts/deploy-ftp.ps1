# ============================================================
# OVDS — Plesk Deployment Script (Windows → Plesk via SFTP + SSH)
#
# What this does:
#   1. Builds all packages locally (libs → backend → frontend)
#   2. Uploads the full monorepo to Plesk via WinSCP SFTP
#   3. SSHes into Plesk and runs the server-side deploy script
#      (npm install, Prisma generate, db push, restart)
#
# Usage (run from project root as Administrator):
#   .\scripts\deploy-ftp.ps1
#
# Prerequisites:
#   - WinSCP installed (https://winscp.net/eng/download.php)
#   - .env.production exists with correct DB credentials
#   - Node.js installed locally
# ============================================================

Set-StrictMode -Off
$ErrorActionPreference = "Stop"

# ── Configuration ─────────────────────────────────────────────────────────────
$SFTP_HOST   = "ovds.com.et"
$SFTP_PORT   = 22
$REMOTE_ROOT = "/var/www/vhosts/ovds.com.et/httpdocs"
$LOCAL_ROOT  = Split-Path -Parent $PSScriptRoot
$WINSCP      = "C:\Program Files (x86)\WinSCP\WinSCP.com"

# ── Credentials (prompted — never hardcoded) ──────────────────────────────────
$SFTP_USER = Read-Host "Plesk SFTP/SSH username"
$securePwd = Read-Host "Plesk SFTP/SSH password" -AsSecureString
$SFTP_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     OVDS Plesk Deployment                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Verify prerequisites ──────────────────────────────────────────────────────
if (-not (Test-Path $WINSCP)) {
    Write-Host "ERROR: WinSCP not found at $WINSCP" -ForegroundColor Red
    Write-Host "Download from: https://winscp.net/eng/download.php" -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path "$LOCAL_ROOT\.env.production")) {
    Write-Host "ERROR: .env.production not found. Copy .env.production.example and fill in credentials." -ForegroundColor Red
    exit 1
}

Set-Location $LOCAL_ROOT

# ── Step 1: Build everything locally ─────────────────────────────────────────
Write-Host "[1/3] Building all packages locally..." -ForegroundColor Yellow
Write-Host "      (libs → backend → frontend)" -ForegroundColor Gray

try {
    & npm run build:all
    if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }
} catch {
    Write-Host "BUILD FAILED: $_" -ForegroundColor Red
    exit 1
}
Write-Host "  ✔ Build complete" -ForegroundColor Green

# ── Step 2: Upload via WinSCP SFTP ───────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Uploading to Plesk via SFTP..." -ForegroundColor Yellow
Write-Host "      Host: $SFTP_HOST → $REMOTE_ROOT" -ForegroundColor Gray

# Files/dirs to exclude from upload (local dev artifacts)
$excludes = @(
    "node_modules/",
    ".nx/",
    ".git/",
    "apps/backend/node_modules/",
    "apps/frontend/node_modules/",
    "packages/*/node_modules/",
    "*.log",
    ".env",          # never upload local .env — server uses .env.production
    "deploy-winscp.log"
)
$excludeStr = ($excludes | ForEach-Object { "-$_" }) -join "|"

$wscript = @"
option batch abort
option confirm off
open sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}:${SFTP_PORT}/ -hostkey=*

# Sync the full monorepo (excluding node_modules, .git, local .env)
synchronize remote -delete -filemask="$excludeStr" "$LOCAL_ROOT" $REMOTE_ROOT

# Upload .env.production as .env on the server
put "$LOCAL_ROOT\.env.production" $REMOTE_ROOT/.env

exit
"@

$tmpScript = "$env:TEMP\ovds_deploy_winscp.txt"
[System.IO.File]::WriteAllText($tmpScript, $wscript, [System.Text.Encoding]::ASCII)
$logFile = "$LOCAL_ROOT\deploy-winscp.log"

Write-Host "  Running WinSCP sync (may take several minutes on first deploy)..." -ForegroundColor Gray
& $WINSCP /script=$tmpScript /log=$logFile /loglevel=1
$uploadExit = $LASTEXITCODE

Remove-Item $tmpScript -Force -ErrorAction SilentlyContinue

if ($uploadExit -ne 0) {
    Write-Host ""
    Write-Host "UPLOAD FAILED (exit code $uploadExit)" -ForegroundColor Red
    Write-Host "Check log: $logFile" -ForegroundColor Yellow
    if (Test-Path $logFile) {
        Write-Host ""
        Write-Host "Last 20 lines:" -ForegroundColor Yellow
        Get-Content $logFile | Select-Object -Last 20
    }
    $SFTP_PASS = $null; [GC]::Collect()
    exit 1
}
Write-Host "  ✔ Upload complete" -ForegroundColor Green

# ── Step 3: SSH into Plesk and run server-side deploy ────────────────────────
Write-Host ""
Write-Host "[3/3] Running server-side deploy via SSH..." -ForegroundColor Yellow
Write-Host "      (npm install → Prisma generate → db push → restart)" -ForegroundColor Gray

# Check if plink (PuTTY) is available for SSH
$plink = $null
foreach ($candidate in @(
    "C:\Program Files\PuTTY\plink.exe",
    "C:\Program Files (x86)\PuTTY\plink.exe",
    (Get-Command plink -ErrorAction SilentlyContinue)?.Source
)) {
    if ($candidate -and (Test-Path $candidate)) { $plink = $candidate; break }
}

if ($plink) {
    Write-Host "  Using plink for SSH..." -ForegroundColor Gray
    $sshCmd = "chmod -R +x $REMOTE_ROOT/node_modules/.bin/ 2>/dev/null; chmod +x $REMOTE_ROOT/scripts/*.sh 2>/dev/null; cd $REMOTE_ROOT && bash scripts/deploy-plesk.sh"
    & $plink -ssh -pw $SFTP_PASS "${SFTP_USER}@${SFTP_HOST}" $sshCmd
    $sshExit = $LASTEXITCODE
} else {
    # Try OpenSSH (built into Windows 10+)
    $sshExe = (Get-Command ssh -ErrorAction SilentlyContinue)?.Source
    if ($sshExe) {
        Write-Host "  Using OpenSSH..." -ForegroundColor Gray
        Write-Host "  You will be prompted for your password." -ForegroundColor Gray
        $sshCmd = "chmod -R +x $REMOTE_ROOT/node_modules/.bin/ 2>/dev/null; chmod +x $REMOTE_ROOT/scripts/*.sh 2>/dev/null; cd $REMOTE_ROOT && bash scripts/deploy-plesk.sh"
        & $sshExe "${SFTP_USER}@${SFTP_HOST}" $sshCmd
        $sshExit = $LASTEXITCODE
    } else {
        Write-Host ""
        Write-Host "  ⚠  No SSH client found (plink or OpenSSH)." -ForegroundColor Yellow
        Write-Host "  Upload succeeded. Complete the deploy manually:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  SSH into your Plesk server and run:" -ForegroundColor White
        Write-Host "    chmod -R +x $REMOTE_ROOT/node_modules/.bin/" -ForegroundColor Cyan
        Write-Host "    chmod +x $REMOTE_ROOT/scripts/*.sh" -ForegroundColor Cyan
        Write-Host "    cd $REMOTE_ROOT" -ForegroundColor Cyan
        Write-Host "    bash scripts/deploy-plesk.sh" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Then in Plesk → Node.js → Restart" -ForegroundColor White
        $SFTP_PASS = $null; [GC]::Collect()
        exit 0
    }
}

$SFTP_PASS = $null; [GC]::Collect()

if ($sshExit -ne 0) {
    Write-Host ""
    Write-Host "SSH deploy script failed (exit code $sshExit)" -ForegroundColor Red
    Write-Host "SSH into the server and run manually:" -ForegroundColor Yellow
    Write-Host "  cd $REMOTE_ROOT && bash scripts/deploy-plesk.sh" -ForegroundColor Cyan
    exit 1
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     Deployment Complete!                 ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Site:    https://ovds.com.et" -ForegroundColor White
Write-Host "  Health:  https://ovds.com.et/api/health/ready" -ForegroundColor White
Write-Host ""
Write-Host "If the app doesn't respond, go to Plesk → Node.js → Restart" -ForegroundColor Yellow
