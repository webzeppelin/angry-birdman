#!/usr/bin/env bash

################################################################################
# import-newdoodles.sh - Import Newdoodles clan battle data
#
# This script imports battle data from the custom CSV format for the Newdoodles
# clan into the Angry Birdman database.
#
# Usage: ./scripts/import-newdoodles.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Newdoodles Data Import${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if data file exists
DATA_FILE="$SCRIPT_DIR/data/newdoodles-battles.csv"
if [ ! -f "$DATA_FILE" ]; then
  echo -e "${RED}✗ Error: Data file not found at $DATA_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Data file found"

# Check if database is running
echo ""
echo -e "${YELLOW}Checking database connection...${NC}"
if ! docker ps | grep -q postgres; then
  echo -e "${RED}✗ Error: PostgreSQL container not running${NC}"
  echo -e "  Please start the database with: ${YELLOW}docker-compose up -d${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Database is running"

# Run the TypeScript import script
echo ""
echo -e "${YELLOW}Starting import...${NC}"
echo ""

cd "$PROJECT_ROOT"
npx tsx scripts/import-newdoodles-data.ts

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
  echo -e "${GREEN}✓ Import completed successfully!${NC}"
else
  echo -e "${RED}✗ Import failed with exit code $exit_code${NC}"
  exit $exit_code
fi

echo ""
