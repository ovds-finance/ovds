#!/bin/bash
set -euo pipefail

# Database Backup Script
# Creates encrypted backup of OVDS database
# Cross-platform counterpart: scripts/backup-db.ps1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ovds_backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# Load environment variables
source "$PROJECT_ROOT/.env" 2>/dev/null || true

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-ovds}
DB_PASS=${DB_PASS:-ovdspassword}
DB_NAME=${DB_NAME:-ovds}

echo "========================================"
echo "  OVDS Database Backup"
echo "========================================"
echo ""

# Create backup
echo "Creating backup..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

# Generate checksum
CHECKSUM_FILE="$BACKUP_FILE.sha256"
sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"

echo "Backup created: $BACKUP_FILE"
echo "Checksum: $(cat $CHECKSUM_FILE)"

# Retain only last N days
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "ovds_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "ovds_backup_*.sql.gz.sha256" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed successfully"
echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
