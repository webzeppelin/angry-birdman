#!/usr/bin/env bash

################################################################################
# delete-newdoodles.sh - Delete Newdoodles battle data
#
# This script deletes all battle data and roster information for the Newdoodles
# clan, but preserves the clan record itself. This allows for clean re-imports
# of battle data.
#
# Usage: ./scripts/delete-newdoodles.sh [options]
#
# Options:
#   -y, --yes         Skip confirmation prompt
#   -h, --help        Show this help message
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

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -y|--yes)
      SKIP_CONFIRM=true
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

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Delete Newdoodles Battle Data${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if database is running
echo -e "${YELLOW}Checking database connection...${NC}"
if ! docker ps | grep -q postgres; then
  echo -e "${RED}✗ Error: PostgreSQL container not running${NC}"
  echo -e "  Please start the database with: ${YELLOW}docker-compose up -d${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Database is running"
echo ""

# Confirmation prompt
if [ "$SKIP_CONFIRM" = false ]; then
  echo -e "${YELLOW}⚠ WARNING: This will delete all battle data and roster members for Newdoodles clan${NC}"
  echo -e "${YELLOW}           The clan record itself will be preserved.${NC}"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${BLUE}Operation cancelled${NC}"
    exit 0
  fi
fi

echo -e "${YELLOW}Deleting battle data and roster...${NC}"
echo ""

# Get database connection details from environment
source "$PROJECT_ROOT/.env" 2>/dev/null || true

# Default values if not in .env
DB_NAME="${DATABASE_NAME:-angrybirdman}"
DB_USER="${DATABASE_USER:-angrybirdman}"
DB_PASSWORD="${DATABASE_PASSWORD:-angrybirdman}"

# Execute SQL to delete data using docker exec
docker exec -i angrybirdman-postgres psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
DO $$
DECLARE
    v_clan_id INTEGER;
BEGIN
    -- Get the Newdoodles clan ID
    SELECT clan_id INTO v_clan_id
    FROM clans
    WHERE rovio_id = 551148;

    IF v_clan_id IS NULL THEN
        RAISE NOTICE 'Newdoodles clan not found';
    ELSE
        RAISE NOTICE 'Found Newdoodles clan with ID: %', v_clan_id;

        -- Delete player stats (CASCADE will handle this, but being explicit)
        DELETE FROM clan_battle_player_stats
        WHERE clan_id = v_clan_id;
        RAISE NOTICE '✓ Deleted player stats';

        -- Delete nonplayer stats
        DELETE FROM clan_battle_nonplayer_stats
        WHERE clan_id = v_clan_id;
        RAISE NOTICE '✓ Deleted nonplayer stats';

        -- Delete battles
        DELETE FROM clan_battles
        WHERE clan_id = v_clan_id;
        RAISE NOTICE '✓ Deleted battles';

        -- Delete monthly summaries
        DELETE FROM monthly_individual_performance
        WHERE clan_id = v_clan_id;
        
        DELETE FROM monthly_clan_performance
        WHERE clan_id = v_clan_id;
        RAISE NOTICE '✓ Deleted monthly summaries';

        -- Delete yearly summaries
        DELETE FROM yearly_individual_performance
        WHERE clan_id = v_clan_id;
        
        DELETE FROM yearly_clan_performance
        WHERE clan_id = v_clan_id;
        RAISE NOTICE '✓ Deleted yearly summaries';

        -- Delete roster members
        DELETE FROM roster_members
        WHERE clan_id = v_clan_id;
        RAISE NOTICE '✓ Deleted roster members';

        RAISE NOTICE '';
        RAISE NOTICE '✓ Successfully deleted all battle data and roster for Newdoodles clan';
    END IF;
END $$;
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deletion completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
