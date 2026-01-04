#!/usr/bin/env bash

################################################################################
# backup-test-server-db.sh - Backup Angry Birdman test server databases
#
# This script creates backups of both the application database and Keycloak
# database from the running test server deployment. Designed for cron scheduling.
#
# Usage: ./scripts/backup-test-server-db.sh [options]
#
# Options:
#   -v, --verbose       Show detailed output (default: quiet for cron)
#   -k, --keep DAYS     Keep backups for N days (default: 30)
#   -o, --output DIR    Output directory (default: /opt/angrybirdman/backups)
#   -h, --help          Show this help message
#
# Exit codes:
#   0 - Success
#   1 - General error
#   2 - Docker services not running
#   3 - Backup failed
################################################################################

set -e  # Exit on any error
set -o pipefail  # Catch errors in pipes

# Default options
VERBOSE=false
KEEP_DAYS=30
BACKUP_DIR="/opt/angrybirdman/backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -k|--keep)
      KEEP_DAYS="$2"
      shift 2
      ;;
    -o|--output)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -h|--help)
      head -n 18 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
      exit 0
      ;;
    *)
      echo "Error: Unknown option: $1" >&2
      echo "Use -h or --help for usage information" >&2
      exit 1
      ;;
  esac
done

# Logging functions
log() {
  if [ "$VERBOSE" = true ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
  fi
}

log_error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

log_always() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Change to project directory
cd "$PROJECT_ROOT" || {
  log_error "Failed to change to project directory: $PROJECT_ROOT"
  exit 1
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR" || {
  log_error "Failed to create backup directory: $BACKUP_DIR"
  exit 1
}

# Check if Docker services are running
log "Checking Docker services..."
if ! docker compose -f docker/docker-compose.test.yml ps postgres 2>/dev/null | grep -q "Up"; then
  log_error "PostgreSQL container is not running"
  exit 2
fi
log "PostgreSQL container is running"

# Load environment variables
if [ -f "docker/.env.test" ]; then
  set -a
  # shellcheck disable=SC1091
  source docker/.env.test
  set +a
  log "Loaded environment variables from docker/.env.test"
else
  log_error "Environment file not found: docker/.env.test"
  exit 1
fi

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup both databases
BACKUP_SUCCESS=true

log "Starting database backups..."

# Backup application database
APP_DB="${POSTGRES_DB:-angrybirdman_test}"
APP_BACKUP="angrybirdman_${TIMESTAMP}.sql.gz"
APP_BACKUP_PATH="${BACKUP_DIR}/${APP_BACKUP}"

log "Backing up application database: $APP_DB"
if docker compose -f docker/docker-compose.test.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "$APP_DB" --clean --if-exists \
  2>/dev/null | gzip > "$APP_BACKUP_PATH"; then
  
  # Calculate checksum
  sha256sum "$APP_BACKUP_PATH" | awk '{print $1 "  " $2}' > "${APP_BACKUP_PATH}.sha256"
  APP_SIZE=$(du -h "$APP_BACKUP_PATH" | cut -f1)
  log "✓ Application database backed up: $APP_BACKUP ($APP_SIZE)"
else
  log_error "Failed to backup application database"
  BACKUP_SUCCESS=false
fi

# Backup Keycloak database
KC_DB="${KEYCLOAK_DB:-keycloak_test}"
KC_BACKUP="keycloak_${TIMESTAMP}.sql.gz"
KC_BACKUP_PATH="${BACKUP_DIR}/${KC_BACKUP}"

log "Backing up Keycloak database: $KC_DB"
if docker compose -f docker/docker-compose.test.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "$KC_DB" --clean --if-exists \
  2>/dev/null | gzip > "$KC_BACKUP_PATH"; then
  
  # Calculate checksum
  sha256sum "$KC_BACKUP_PATH" | awk '{print $1 "  " $2}' > "${KC_BACKUP_PATH}.sha256"
  KC_SIZE=$(du -h "$KC_BACKUP_PATH" | cut -f1)
  log "✓ Keycloak database backed up: $KC_BACKUP ($KC_SIZE)"
else
  log_error "Failed to backup Keycloak database"
  BACKUP_SUCCESS=false
fi

# Check if backups were successful
if [ "$BACKUP_SUCCESS" = false ]; then
  log_error "One or more backups failed"
  exit 3
fi

# Clean up old backups
log "Cleaning up backups older than $KEEP_DAYS days..."
DELETED_COUNT=0
while IFS= read -r file; do
  rm -f "$file" "${file}.sha256"
  DELETED_COUNT=$((DELETED_COUNT + 1))
  log "Deleted old backup: $(basename "$file")"
done < <(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +"$KEEP_DAYS")

if [ "$DELETED_COUNT" -gt 0 ]; then
  log "Removed $DELETED_COUNT old backup(s)"
fi

# Summary
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)

if [ "$VERBOSE" = true ]; then
  log_always "Backup completed successfully"
  log_always "  Application: $APP_BACKUP ($APP_SIZE)"
  log_always "  Keycloak:    $KC_BACKUP ($KC_SIZE)"
  log_always "  Total backups in directory: $BACKUP_COUNT"
  log_always "  Directory size: $TOTAL_SIZE"
else
  # For cron: only log on success with minimal output
  log_always "Backup completed: $APP_BACKUP ($APP_SIZE), $KC_BACKUP ($KC_SIZE)"
fi

exit 0
