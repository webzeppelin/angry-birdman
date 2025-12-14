#!/usr/bin/env bash

################################################################################
# create-test-db.sh - Create the test database for automated tests
#
# This script creates the angrybirdman_test database and runs migrations.
# The test database is separate from the development database to ensure
# tests can safely wipe data without affecting your dev environment.
#
# Usage: ./scripts/create-test-db.sh [options]
#
# Options:
#   -h, --help        Show this help message
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      head -n 15 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
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
echo -e "${BLUE}║      Test Database Creation Utility                    ║${NC}"
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
  echo -e "${YELLOW}Start services with: npm run docker:up${NC}"
  exit 1
fi
echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
echo

# Load environment variables from .env
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Default database credentials
DB_USER="${POSTGRES_USER:-angrybirdman}"
DB_PASSWORD="${POSTGRES_PASSWORD:-angrybirdman_dev_password}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
TEST_DB_NAME="angrybirdman_test"

# Step 1: Check if test database already exists
echo -e "${YELLOW}[1/3] Checking if test database exists...${NC}"
DB_EXISTS=$(docker exec angrybirdman-postgres psql -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$TEST_DB_NAME'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
  echo -e "${GREEN}✓ Test database '$TEST_DB_NAME' already exists${NC}"
else
  echo -e "${YELLOW}Creating test database '$TEST_DB_NAME'...${NC}"
  docker exec angrybirdman-postgres psql -U "$DB_USER" -c "CREATE DATABASE $TEST_DB_NAME" 2>/dev/null || {
    echo -e "${RED}✗ Failed to create test database${NC}"
    exit 1
  }
  echo -e "${GREEN}✓ Test database '$TEST_DB_NAME' created successfully${NC}"
fi
echo

# Step 2: Run migrations on the test database
echo -e "${YELLOW}[2/3] Running migrations on test database...${NC}"

# Construct the test database URL
TEST_DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME?schema=public"

# Run Prisma migrations using the test database URL
cd database
DATABASE_URL="$TEST_DB_URL" npx prisma migrate deploy
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Migrations applied successfully${NC}"
else
  echo -e "${RED}✗ Migration failed${NC}"
  cd ..
  exit 1
fi
cd ..
echo

# Step 3: Verify the test database
echo -e "${YELLOW}[3/3] Verifying test database...${NC}"
TABLE_COUNT=$(docker exec angrybirdman-postgres psql -U "$DB_USER" -d "$TEST_DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Test database contains $TABLE_COUNT tables${NC}"
  
  # Show some key tables
  echo -e "\n${BLUE}Key tables in test database:${NC}"
  docker exec angrybirdman-postgres psql -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 10" 2>/dev/null || true
else
  echo -e "${RED}✗ No tables found in test database${NC}"
  exit 1
fi
echo

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Test Database Setup Complete! ✓                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  • Run tests: npm test"
echo -e "  • Run tests with coverage: npm run test:coverage"
echo -e "  • Run tests in watch mode: npm run test:watch"
echo
echo -e "${YELLOW}Note: Tests will wipe the test database before each test run.${NC}"
echo -e "${YELLOW}This is why we use a separate database from your dev environment.${NC}"
echo

