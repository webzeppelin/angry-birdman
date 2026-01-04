#!/usr/bin/env bash

################################################################################
# restore-test-server-db.sh - Restore Angry Birdman test server databases
#
# This script restores the application database and/or Keycloak database
# from backup files on the test server.
#
# Usage: ./scripts/restore-test-server-db.sh [options]
#
# Options:
#   -a, --app FILE      Application database backup file
#   -k, --keycloak FILE Keycloak database backup file
#   -y, --yes           Skip confirmation prompts
#   -h, --help          Show this help message
#
# Examples:
#   # Restore both databases
#   ./scripts/restore-test-server-db.sh \
#     --app /opt/angrybirdman/backups/angrybirdman_20260103_120000.sql.gz \
#     --keycloak /opt/angrybirdman/backups/keycloak_20260103_120000.sql.gz
#
#   # Restore only application database
#   ./scripts/restore-test-server-db.sh \
#     --app /opt/angrybirdman/backups/angrybirdman_20260103_120000.sql.gz
#
# Exit codes:
#   0 - Success
#   1 - General error
#   2 - Docker services not running
#   3 - Backup file not found or invalid
#   4 - Restore failed
################################################################################

set -e  # Exit on any error
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
APP_BACKUP=""
KC_BACKUP=""
SKIP_CONFIRM=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--app)
      APP_BACKUP="$2"
      shift 2
      ;;
    -k|--keycloak)
      KC_BACKUP="$2"
      shift 2
      ;;
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    -h|--help)
      head -n 33 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}" >&2
      echo "Use -h or --help for usage information" >&2
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Angry Birdman Test Server Database Restore         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check if at least one backup file was specified
if [ -z "$APP_BACKUP" ] && [ -z "$KC_BACKUP" ]; then
  echo -e "${RED}Error: No backup files specified${NC}"
  echo "Use -h or --help for usage information"
  exit 1
fi

# Change to project directory
cd "$PROJECT_ROOT" || {
  echo -e "${RED}Error: Failed to change to project directory: $PROJECT_ROOT${NC}"
  exit 1
}

# Check if Docker services are running
echo -e "${YELLOW}Checking Docker services...${NC}"
if ! docker compose -f docker/docker-compose.test.yml ps postgres 2>/dev/null | grep -q "Up"; then
  echo -e "${RED}Error: PostgreSQL container is not running${NC}"
  exit 2
fi
echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
echo

# Load environment variables
if [ -f "docker/.env.test" ]; then
  set -a
  # shellcheck disable=SC1091
  source docker/.env.test
  set +a
else
  echo -e "${RED}Error: Environment file not found: docker/.env.test${NC}"
  exit 1
fi

# Function to verify and restore a database backup
restore_database() {
  local backup_file="$1"
  local db_name="$2"
  local label="$3"
  
  # Check if backup file exists
  if [ ! -f "$backup_file" ]; then
    echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
    return 3
  fi
  
  # Verify checksum if available
  if [ -f "${backup_file}.sha256" ]; then
    echo -e "${YELLOW}Verifying backup integrity for $label...${NC}"
    if sha256sum -c "${backup_file}.sha256" --quiet 2>/dev/null; then
      echo -e "${GREEN}✓ Checksum verified${NC}"
    else
      echo -e "${RED}✗ Checksum verification failed${NC}"
      if [ "$SKIP_CONFIRM" = false ]; then
        read -rp "Continue anyway? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
          return 3
        fi
      fi
    fi
  fi
  
  # Get file info
  local file_size
  file_size=$(du -h "$backup_file" | cut -f1)
  local file_name
  file_name=$(basename "$backup_file")
  
  echo -e "${BLUE}$label Restore Configuration:${NC}"
  echo -e "  File:     $file_name"
  echo -e "  Size:     $file_size"
  echo -e "  Database: $db_name"
  echo
  
  # Confirmation prompt
  if [ "$SKIP_CONFIRM" = false ]; then
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite the $label database!${NC}"
    echo
    read -rp "Are you sure? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
      echo -e "${BLUE}Restore cancelled${NC}"
      return 0
    fi
    echo
  fi
  
  # Perform restore
  echo -e "${YELLOW}Restoring $label database...${NC}"
  local start_time
  start_time=$(date +%s)
  
  if gunzip -c "$backup_file" | \
    docker compose -f docker/docker-compose.test.yml exec -T postgres \
    psql -U "${POSTGRES_USER}" -d "$db_name" > /dev/null 2>&1; then
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${GREEN}✓ $label database restored successfully (${duration}s)${NC}"
    return 0
  else
    echo -e "${RED}✗ $label database restore failed${NC}"
    return 4
  fi
}

# Restore application database if specified
if [ -n "$APP_BACKUP" ]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Restoring Application Database${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo
  
  restore_database "$APP_BACKUP" "${POSTGRES_DB:-angrybirdman_test}" "Application"
  APP_RESULT=$?
  
  if [ $APP_RESULT -ne 0 ]; then
    exit $APP_RESULT
  fi
  echo
fi

# Restore Keycloak database if specified
if [ -n "$KC_BACKUP" ]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Restoring Keycloak Database${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo
  
  restore_database "$KC_BACKUP" "${KEYCLOAK_DB:-keycloak_test}" "Keycloak"
  KC_RESULT=$?
  
  if [ $KC_RESULT -ne 0 ]; then
    exit $KC_RESULT
  fi
  echo
fi

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Database Restore Completed! ✓                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
if [ -n "$APP_BACKUP" ]; then
  echo -e "  • Application database has been restored"
fi
if [ -n "$KC_BACKUP" ]; then
  echo -e "  • Keycloak database has been restored"
  echo -e "  • You may need to restart Keycloak: docker compose -f docker/docker-compose.test.yml restart keycloak"
fi
echo -e "  • Verify application functionality: https://192.168.0.70"
echo

exit 0
