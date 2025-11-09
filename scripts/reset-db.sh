#!/usr/bin/env bash

################################################################################
# reset-db.sh - Reset and reinitialize the Angry Birdman database
#
# This script performs a complete database reset:
# 1. Drops and recreates the database
# 2. Runs Prisma migrations
# 3. Seeds the database with sample data
#
# Usage: ./scripts/reset-db.sh [options]
#
# Options:
#   -y, --yes         Skip confirmation prompt
#   -n, --no-seed     Skip seeding after reset
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
SKIP_SEED=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    -n|--no-seed)
      SKIP_SEED=true
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
echo -e "${BLUE}║      Angry Birdman Database Reset Utility             ║${NC}"
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

# Confirmation prompt
if [ "$SKIP_CONFIRM" = false ]; then
  echo -e "${YELLOW}⚠️  WARNING: This will completely erase all data in the database!${NC}"
  echo -e "${YELLOW}   This action cannot be undone.${NC}"
  echo
  read -p "Are you sure you want to reset the database? (type 'yes' to confirm): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}Database reset cancelled${NC}"
    exit 0
  fi
  echo
fi

# Start reset process
echo -e "${BLUE}Starting database reset process...${NC}"
echo

# Step 1: Reset using Prisma migrate reset
echo -e "${YELLOW}[1/3] Running Prisma migrate reset...${NC}"
if [ "$SKIP_SEED" = true ]; then
  # Skip seeding during reset
  npm run db:reset -- --skip-seed
else
  # Normal reset (will seed automatically via prisma.seed config)
  npm run db:reset
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database reset completed successfully${NC}"
else
  echo -e "${RED}✗ Database reset failed${NC}"
  exit 1
fi
echo

# Step 2: Verify database state
echo -e "${YELLOW}[2/3] Verifying database state...${NC}"
cd database
if npm run validate > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database schema is valid${NC}"
else
  echo -e "${RED}✗ Database schema validation failed${NC}"
  cd ..
  exit 1
fi
cd ..
echo

# Step 3: Check seed data (if seeded)
if [ "$SKIP_SEED" = false ]; then
  echo -e "${YELLOW}[3/3] Verifying seed data...${NC}"
  CLAN_COUNT=$(docker exec angrybirdman-postgres psql -U angrybirdman -d angrybirdman -t -c "SELECT COUNT(*) FROM clans;" 2>/dev/null | xargs)
  
  if [ -n "$CLAN_COUNT" ] && [ "$CLAN_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Database contains $CLAN_COUNT clan(s)${NC}"
    
    # Show summary of seeded data
    echo -e "\n${BLUE}Seed Data Summary:${NC}"
    docker exec angrybirdman-postgres psql -U angrybirdman -d angrybirdman -t <<EOF
SELECT 
  (SELECT COUNT(*) FROM clans) as clans,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM roster_members) as roster_members,
  (SELECT COUNT(*) FROM clan_battles) as battles,
  (SELECT COUNT(*) FROM action_codes) as action_codes;
EOF
  else
    echo -e "${YELLOW}⚠ No seed data found (this may be intentional with --no-seed)${NC}"
  fi
else
  echo -e "${YELLOW}[3/3] Skipping seed verification (--no-seed flag used)${NC}"
fi
echo

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Database Reset Completed! ✓                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  • Restart API server: npm run dev:api"
echo -e "  • View database: npm run db:studio"
echo -e "  • Run validation tests: cd database && tsx validate-database.ts"
echo
