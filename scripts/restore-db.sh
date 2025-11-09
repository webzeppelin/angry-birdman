#!/usr/bin/env bash

################################################################################
# restore-db.sh - Restore the Angry Birdman database from a backup
#
# This script restores the PostgreSQL database from a backup file created
# with backup-db.sh or pg_dump.
#
# Usage: ./scripts/restore-db.sh <backup-file> [options]
#
# Options:
#   -y, --yes           Skip confirmation prompt
#   -c, --clean         Drop database before restore
#   -d, --data-only     Restore data only (no schema)
#   -h, --help          Show this help message
#
# Examples:
#   ./scripts/restore-db.sh backups/angrybirdman_full_20241108_143022.sql
#   ./scripts/restore-db.sh backups/angrybirdman_full_20241108_143022.sql.gz
#   ./scripts/restore-db.sh backup.dump --clean --yes
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_CONFIRM=false
CLEAN=false
DATA_ONLY=false
BACKUP_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    -c|--clean)
      CLEAN=true
      shift
      ;;
    -d|--data-only)
      DATA_ONLY=true
      shift
      ;;
    -h|--help)
      head -n 24 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
      exit 0
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Angry Birdman Database Restore Utility          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check if backup file was provided
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: No backup file specified${NC}"
  echo "Usage: $0 <backup-file> [options]"
  echo "Use -h or --help for more information"
  exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

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

# Verify checksum if available
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  echo -e "${YELLOW}Verifying backup integrity...${NC}"
  if command -v sha256sum > /dev/null; then
    if sha256sum -c "$CHECKSUM_FILE" --quiet 2>/dev/null; then
      echo -e "${GREEN}✓ Checksum verified${NC}"
    else
      echo -e "${RED}✗ Checksum verification failed${NC}"
      read -p "Continue anyway? (yes/no): " CONTINUE
      if [ "$CONTINUE" != "yes" ]; then
        exit 1
      fi
    fi
  elif command -v shasum > /dev/null; then
    EXPECTED=$(cat "$CHECKSUM_FILE" | cut -d' ' -f1)
    ACTUAL=$(shasum -a 256 "$BACKUP_FILE" | cut -d' ' -f1)
    if [ "$EXPECTED" = "$ACTUAL" ]; then
      echo -e "${GREEN}✓ Checksum verified${NC}"
    else
      echo -e "${RED}✗ Checksum verification failed${NC}"
      read -p "Continue anyway? (yes/no): " CONTINUE
      if [ "$CONTINUE" != "yes" ]; then
        exit 1
      fi
    fi
  fi
  echo
fi

# Get file info
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
FILE_NAME=$(basename "$BACKUP_FILE")

# Detect file format
if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
  FORMAT="sql-compressed"
  RESTORE_CMD="gunzip -c '$BACKUP_FILE' | docker exec -i angrybirdman-postgres psql -U angrybirdman -d angrybirdman"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
  FORMAT="sql"
  RESTORE_CMD="docker exec -i angrybirdman-postgres psql -U angrybirdman -d angrybirdman < '$BACKUP_FILE'"
elif [[ "$BACKUP_FILE" == *.dump ]]; then
  FORMAT="custom"
  # For custom format, we need to use pg_restore
  echo -e "${YELLOW}Custom format requires copying file to container...${NC}"
  docker cp "$BACKUP_FILE" angrybirdman-postgres:/tmp/restore.dump
  RESTORE_CMD="docker exec angrybirdman-postgres pg_restore -U angrybirdman -d angrybirdman /tmp/restore.dump"
elif [[ "$BACKUP_FILE" == *.tar ]]; then
  FORMAT="tar"
  echo -e "${YELLOW}Tar format requires copying file to container...${NC}"
  docker cp "$BACKUP_FILE" angrybirdman-postgres:/tmp/restore.tar
  RESTORE_CMD="docker exec angrybirdman-postgres pg_restore -U angrybirdman -d angrybirdman /tmp/restore.tar"
else
  echo -e "${RED}Error: Unknown backup format${NC}"
  echo "Supported formats: .sql, .sql.gz, .dump, .tar"
  exit 1
fi

echo -e "${BLUE}Restore Configuration:${NC}"
echo -e "  File:        ${FILE_NAME}"
echo -e "  Size:        ${FILE_SIZE}"
echo -e "  Format:      ${FORMAT}"
echo -e "  Clean:       ${CLEAN}"
echo -e "  Data Only:   ${DATA_ONLY}"
echo

# Confirmation prompt
if [ "$SKIP_CONFIRM" = false ]; then
  echo -e "${YELLOW}⚠️  WARNING: This will overwrite the current database!${NC}"
  if [ "$CLEAN" = true ]; then
    echo -e "${RED}   The --clean flag will DROP and recreate the database!${NC}"
  fi
  echo
  read -p "Are you sure you want to restore from this backup? (type 'yes' to confirm): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}Database restore cancelled${NC}"
    exit 0
  fi
  echo
fi

# Get current database stats before restore
echo -e "${YELLOW}Current database state:${NC}"
docker exec angrybirdman-postgres psql -U angrybirdman -d angrybirdman -t <<EOF 2>/dev/null || echo "Unable to query database"
SELECT 
  'Clans: ' || COUNT(*) FROM clans
UNION ALL
SELECT 
  'Battles: ' || COUNT(*) FROM clan_battles;
EOF
echo

# Clean database if requested
if [ "$CLEAN" = true ]; then
  echo -e "${YELLOW}Dropping and recreating database...${NC}"
  docker exec angrybirdman-postgres psql -U angrybirdman -d postgres <<EOF
DROP DATABASE IF EXISTS angrybirdman;
CREATE DATABASE angrybirdman OWNER angrybirdman;
EOF
  echo -e "${GREEN}✓ Database recreated${NC}"
  echo
fi

# Perform restore
echo -e "${YELLOW}Restoring database from backup...${NC}"
echo -e "${BLUE}This may take a few minutes for large backups...${NC}"
echo

START_TIME=$(date +%s)

if eval "$RESTORE_CMD" 2>/dev/null; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  echo
  echo -e "${GREEN}✓ Database restored successfully (${DURATION}s)${NC}"
else
  echo
  echo -e "${RED}✗ Database restore failed${NC}"
  exit 1
fi
echo

# Clean up temporary files in container
if [ "$FORMAT" = "custom" ] || [ "$FORMAT" = "tar" ]; then
  docker exec angrybirdman-postgres rm -f /tmp/restore.dump /tmp/restore.tar 2>/dev/null || true
fi

# Verify restored database
echo -e "${YELLOW}Verifying restored database...${NC}"
docker exec angrybirdman-postgres psql -U angrybirdman -d angrybirdman -t <<EOF
SELECT 
  'Clans: ' || COUNT(*) FROM clans
UNION ALL
SELECT 
  'Users: ' || COUNT(*) FROM users
UNION ALL
SELECT 
  'Roster Members: ' || COUNT(*) FROM roster_members
UNION ALL
SELECT 
  'Battles: ' || COUNT(*) FROM clan_battles
UNION ALL
SELECT 
  'Player Stats: ' || COUNT(*) FROM clan_battle_player_stats;
EOF
echo

# Run Prisma validation
echo -e "${YELLOW}Running schema validation...${NC}"
cd database
if npm run validate > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database schema is valid${NC}"
else
  echo -e "${YELLOW}⚠ Schema validation failed (may need to regenerate Prisma client)${NC}"
  echo -e "${BLUE}Run: npm run db:generate${NC}"
fi
cd ..
echo

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Database Restore Completed! ✓               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  • Regenerate Prisma Client: npm run db:generate"
echo -e "  • Restart API server: npm run dev:api"
echo -e "  • View database: npm run db:studio"
echo
