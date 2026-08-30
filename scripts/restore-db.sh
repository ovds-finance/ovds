#!/bin/bash
set -euo pipefail

# Database Restore Script
# Restores OVDS database from backup
# Cross-platform counterpart: scripts/restore-db.ps1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Load environment variables
source "$PROJECT_ROOT/.env" 2>/dev/null || true

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-ovds}
DB_PASS=${DB_PASS:-ovdspassword}
DB_NAME=${DB_NAME:-ovds}

echo "========================================"
echo "  OVDS Database Restore"
echo "========================================"
echo ""

# Get backup file from argument or list available backups
if [ -z "${1:-}" ]; then
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/ovds_backup_*.sql.gz 2>/dev/null || echo "No backups found"
  echo ""
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Verify checksum
CHECKSUM_FILE="$BACKUP_FILE.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  echo "Verifying backup integrity..."
  if sha256sum -c "$CHECKSUM_FILE" > /dev/null 2>&1; then
    echo "✅ Checksum verified"
  else
    echo "❌ Checksum verification failed!"
    exit 1
  fi
fi

# Confirm restore
echo ""
echo "WARNING: This will overwrite the current database!"
echo "Database: $DB_NAME"
echo "Backup: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Restore
echo "Restoring database..."
gunzip < "$BACKUP_FILE" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"

echo "✅ Database restored successfully"
echo ""
echo "Post-restore steps:"
echo "1. Verify application connectivity"
echo "2. Run database migrations if needed: npm run db:migrate:prod"
echo "3. Check audit logs for integrity"
