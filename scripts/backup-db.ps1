# Database Backup Script (PowerShell)
# Creates encrypted backup of OVDS database
# Cross-platform counterpart: scripts/backup-db.sh

param(
    [string]$BackupDir = "$PSScriptRoot\..\backups",
    [int]$RetentionDays = 30
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "ovds_backup_$Timestamp.sql.gz"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

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
Write-Host "  OVDS Database Backup"
Write-Host "========================================"
Write-Host ""

# Create backup
Write-Host "Creating backup..."
$dumpArgs = @(
    "-h", $DbHost,
    "-P", $DbPort,
    "-u", $DbUser,
    "-p$DbPass",
    "--single-transaction",
    "--routines",
    "--triggers",
    "--events",
    $DbName
)

$dumpProcess = Start-Process -FilePath "mysqldump" -ArgumentList $dumpArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $BackupFile
if ($dumpProcess.ExitCode -ne 0) {
    Write-Host "❌ Backup failed"
    exit 1
}

# Compress
Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.gz" -Force
Remove-Item $BackupFile

Write-Host "✅ Backup created: $BackupFile.gz"
Write-Host "Backup size: $((Get-Item "$BackupFile.gz").Length / 1MB) MB"

# Clean old backups
Write-Host "Cleaning old backups (older than $RetentionDays days)..."
Get-ChildItem -Path $BackupDir -Filter "ovds_backup_*.sql.gz*" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } | 
    Remove-Item -Force

Write-Host "✅ Backup completed successfully"
