# Database Restore Script (PowerShell)
# Restores OVDS database from backup
# Cross-platform counterpart: scripts/restore-db.sh

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$BackupDir = "$PSScriptRoot\..\backups"

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}

$DbHost = $env:DB_HOST ?? "localhost"
$DbPort = $env:DB_PORT ?? "3306"
$DbUser = $env:DB_USER ?? "ovds"
$DbPass = $env:DB_PASS ?? "ovdspassword"
$DbName = $env:DB_NAME ?? "ovds"

Write-Host ""
Write-Host "========================================"
Write-Host "  OVDS Database Restore"
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile"
    exit 1
}

# Confirm restore
Write-Host "WARNING: This will overwrite the current database!"
Write-Host "Database: $DbName"
Write-Host "Backup: $BackupFile"
$Confirm = Read-Host "Are you sure? (yes/no)"
if ($Confirm -ne "yes") {
    Write-Host "Restore cancelled"
    exit 0
}

# Restore
Write-Host "Restoring database..."
$restoreArgs = @(
    "-h", $DbHost,
    "-P", $DbPort,
    "-u", $DbUser,
    "-p$DbPass",
    $DbName
)

$content = Get-Content $BackupFile -Raw
$content | mysql -h $DbHost -P $DbPort -u $DbUser -p$DbPass $DbName

Write-Host "✅ Database restored successfully"
Write-Host ""
Write-Host "Post-restore steps:"
Write-Host "1. Verify application connectivity"
Write-Host "2. Run database migrations if needed: npm run db:migrate:prod"
Write-Host "3. Check audit logs for integrity"
