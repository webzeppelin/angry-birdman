#!/usr/bin/env bash

################################################################################
# backup-keycloak-db.sh - Create a backup of the Keycloak database
#
# This script creates a timestamped backup of the Keycloak PostgreSQL database
# using pg_dump. Backups are stored in the backups/ directory with both SQL
# and compressed formats.
#
# Usage: ./scripts/backup-keycloak-db.sh [options]
#
# Options:
#   -f, --format FORMAT   Backup format: sql, custom, tar (default: sql)
#   -c, --compress        Compress SQL backup with gzip
#   -o, --output DIR      Output directory (default: ./backups)
#   -d, --data-only       Backup data only (no schema)
#   -s, --schema-only     Backup schema only (no data)
#   -h, --help            Show this help message
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
FORMAT="sql"
COMPRESS=false
OUTPUT_DIR="./backups"
DATA_ONLY=false
SCHEMA_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--format)
      FORMAT="$2"
      shift 2
      ;;
    -c|--compress)
      COMPRESS=true
      shift
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -d|--data-only)
      DATA_ONLY=true
      shift
      ;;
    -s|--schema-only)
      SCHEMA_ONLY=true
      shift
      ;;
    -h|--help)
      head -n 20 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Keycloak Database Backup Utility                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory${NC}"
  exit 1
fi

# Check if Docker services are running
echo -e "${YELLOW}Checking Docker services...${NC}"
if ! docker ps | grep -q angrybirdman-postgres; then
  echo -e "${RED}Error: PostgreSQL container is not running${NC}"
  echo -e "${YELLOW}Start services with: docker-compose up -d${NC}"
  exit 1
fi
echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
echo

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="keycloak"

# Determine backup filename and options
DUMP_OPTIONS=""

if [ "$DATA_ONLY" = true ]; then
  DUMP_OPTIONS="$DUMP_OPTIONS --data-only"
  BACKUP_TYPE="data"
elif [ "$SCHEMA_ONLY" = true ]; then
  DUMP_OPTIONS="$DUMP_OPTIONS --schema-only"
  BACKUP_TYPE="schema"
else
  BACKUP_TYPE="full"
fi

case $FORMAT in
  sql)
    FILENAME="${DB_NAME}_${BACKUP_TYPE}_${TIMESTAMP}.sql"
    DUMP_OPTIONS="$DUMP_OPTIONS --format=plain"
    ;;
  custom)
    FILENAME="${DB_NAME}_${BACKUP_TYPE}_${TIMESTAMP}.dump"
    DUMP_OPTIONS="$DUMP_OPTIONS --format=custom"
    COMPRESS=false  # Custom format is already compressed
    ;;
  tar)
    FILENAME="${DB_NAME}_${BACKUP_TYPE}_${TIMESTAMP}.tar"
    DUMP_OPTIONS="$DUMP_OPTIONS --format=tar"
    ;;
  *)
    echo -e "${RED}Error: Invalid format '$FORMAT'. Use: sql, custom, or tar${NC}"
    exit 1
    ;;
esac

BACKUP_PATH="${OUTPUT_DIR}/${FILENAME}"

# Start backup
echo -e "${BLUE}Backup Configuration:${NC}"
echo -e "  Database:    ${DB_NAME}"
echo -e "  Type:        ${BACKUP_TYPE}"
echo -e "  Format:      ${FORMAT}"
echo -e "  Compress:    ${COMPRESS}"
echo -e "  Output:      ${BACKUP_PATH}"
if [ "$COMPRESS" = true ]; then
  echo -e "  Final file:  ${BACKUP_PATH}.gz"
fi
echo

echo -e "${YELLOW}Creating backup...${NC}"

# Run pg_dump (using angrybirdman user which has access to keycloak database)
if docker exec angrybirdman-postgres pg_dump -U angrybirdman $DUMP_OPTIONS $DB_NAME > "$BACKUP_PATH" 2>/dev/null; then
  echo -e "${GREEN}✓ Database dump created successfully${NC}"
else
  echo -e "${RED}✗ Database dump failed${NC}"
  exit 1
fi

# Get file size
FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

# Compress if requested
if [ "$COMPRESS" = true ]; then
  echo -e "${YELLOW}Compressing backup...${NC}"
  gzip "$BACKUP_PATH"
  BACKUP_PATH="${BACKUP_PATH}.gz"
  COMPRESSED_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
  echo -e "${GREEN}✓ Backup compressed (${FILE_SIZE} → ${COMPRESSED_SIZE})${NC}"
  FILE_SIZE=$COMPRESSED_SIZE
fi

echo

# Calculate checksum
echo -e "${YELLOW}Calculating checksum...${NC}"
if command -v sha256sum > /dev/null; then
  CHECKSUM=$(sha256sum "$BACKUP_PATH" | cut -d' ' -f1)
  echo "$CHECKSUM  $(basename "$BACKUP_PATH")" > "${BACKUP_PATH}.sha256"
  echo -e "${GREEN}✓ SHA-256: ${CHECKSUM}${NC}"
elif command -v shasum > /dev/null; then
  CHECKSUM=$(shasum -a 256 "$BACKUP_PATH" | cut -d' ' -f1)
  echo "$CHECKSUM  $(basename "$BACKUP_PATH")" > "${BACKUP_PATH}.sha256"
  echo -e "${GREEN}✓ SHA-256: ${CHECKSUM}${NC}"
else
  echo -e "${YELLOW}⚠ Checksum utility not found, skipping${NC}"
fi
echo

# Get backup statistics
echo -e "${BLUE}Backup Statistics:${NC}"
docker exec angrybirdman-postgres psql -U angrybirdman -d keycloak -t <<EOF
SELECT 
  'Realms: ' || COUNT(*) FROM realm
UNION ALL
SELECT 
  'Users: ' || COUNT(*) FROM user_entity
UNION ALL
SELECT 
  'Clients: ' || COUNT(*) FROM client
UNION ALL
SELECT 
  'Roles: ' || COUNT(*) FROM keycloak_role
UNION ALL
SELECT 
  'Groups: ' || COUNT(*) FROM keycloak_group;
EOF
echo

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Backup Completed! ✓                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Backup Details:${NC}"
echo -e "  File:     ${BACKUP_PATH}"
echo -e "  Size:     ${FILE_SIZE}"
if [ -f "${BACKUP_PATH}.sha256" ]; then
  echo -e "  Checksum: ${BACKUP_PATH}.sha256"
fi
echo
echo -e "${BLUE}To restore this backup:${NC}"
echo -e "  ./scripts/restore-keycloak-db.sh ${BACKUP_PATH}"
echo

# List recent backups
BACKUP_COUNT=$(find "$OUTPUT_DIR" -name "${DB_NAME}_*.sql*" -o -name "${DB_NAME}_*.dump" -o -name "${DB_NAME}_*.tar" | wc -l)
if [ "$BACKUP_COUNT" -gt 1 ]; then
  echo -e "${BLUE}Recent backups (latest 5):${NC}"
  find "$OUTPUT_DIR" -name "${DB_NAME}_*" \( -name "*.sql" -o -name "*.sql.gz" -o -name "*.dump" -o -name "*.tar" \) -type f | 
    sort -r | head -5 | while read -r file; do
      SIZE=$(du -h "$file" | cut -f1)
      echo -e "  $(basename "$file") (${SIZE})"
    done
  echo
fi

echo -e "${YELLOW}Note: This backup includes Keycloak configuration, users, and realms.${NC}"
echo -e "${YELLOW}For complete disaster recovery, also backup the application database.${NC}"
echo -e "${YELLOW}Use: ./scripts/backup-db.sh${NC}"
echo
