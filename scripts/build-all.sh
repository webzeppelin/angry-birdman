#!/usr/bin/env bash

################################################################################
# build-all.sh - Build all Angry Birdman workspaces for production deployment
#
# This script performs a complete production build of all workspaces in the
# correct order, ensuring all dependencies are built before dependent packages.
#
# Build Order:
#   1. Common library (dependency for api and frontend)
#   2. API server
#   3. Frontend application
#
# Usage: ./scripts/build-all.sh [options]
#
# Options:
#   --clean         Clean before building
#   --skip-tests    Skip running tests before build
#   --skip-lint     Skip linting before build
#   --skip-typecheck Skip type checking before build
#   --skip-prisma   Skip Prisma client generation (assumes already generated)
#   --skip-validation Skip all validation steps (lint, typecheck, tests, prisma)
#   -h, --help      Show this help message
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default options
CLEAN=false
SKIP_TESTS=false
SKIP_LINT=false
SKIP_TYPECHECK=false
SKIP_PRISMA=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-lint)
      SKIP_LINT=true
      shift
      ;;
    --skip-typecheck)
      SKIP_TYPECHECK=true
      shift
      ;;
    --skip-prisma)
      SKIP_PRISMA=true
      shift
      ;;
    --skip-validation)
      SKIP_TESTS=true
      SKIP_LINT=true
      SKIP_TYPECHECK=true
      SKIP_PRISMA=true
      shift
      ;;
    -h|--help)
      head -n 26 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
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
echo -e "${BLUE}║      Angry Birdman Production Build System            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory${NC}"
  exit 1
fi

START_TIME=$(date +%s)

# Function to print step header
print_step() {
  echo
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo
}

# Function to print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Clean if requested
if [ "$CLEAN" = true ]; then
  print_step "Step 0: Cleaning Previous Builds"
  
  echo -e "${YELLOW}Removing dist directories...${NC}"
  rm -rf common/dist api/dist frontend/dist
  print_success "Cleaned build artifacts"
fi

# Pre-build checks
print_step "Step 1: Pre-Build Validation"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  print_error "Node.js 20+ is required (found: $(node --version))"
  exit 1
fi
print_success "Node.js version: $(node --version)"

# Check npm version
NPM_VERSION=$(npm --version | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
  print_error "npm 10+ is required (found: $(npm --version))"
  exit 1
fi
print_success "npm version: $(npm --version)"

# Verify dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm ci
fi
print_success "Dependencies installed"

# Generate Prisma Client
if [ "$SKIP_PRISMA" = false ]; then
  print_step "Step 2: Generate Prisma Client"
  echo -e "${YELLOW}Generating Prisma Client...${NC}"
  npm run db:generate
  print_success "Prisma Client generated"
else
  echo -e "${YELLOW}⚠ Skipping Prisma generation (--skip-prisma flag used)${NC}"
fi

# Run linting
if [ "$SKIP_LINT" = false ]; then
  print_step "Step 3: Linting Code"
  echo -e "${YELLOW}Running ESLint...${NC}"
  if npm run lint; then
    print_success "Linting passed"
  else
    print_error "Linting failed"
    echo -e "${YELLOW}Fix linting errors or use --skip-lint to bypass${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ Skipping linting (--skip-lint flag used)${NC}"
fi

# Run type checking
if [ "$SKIP_TYPECHECK" = false ]; then
  print_step "Step 4: Type Checking"
  echo -e "${YELLOW}Running TypeScript type checking...${NC}"
  if npm run type-check; then
    print_success "Type checking passed"
  else
    print_error "Type checking failed"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ Skipping type checking (--skip-typecheck flag used)${NC}"
fi

# Run tests
if [ "$SKIP_TESTS" = false ]; then
  print_step "Step 5: Running Tests"
  echo -e "${YELLOW}Running test suites...${NC}"
  if npm run test; then
    print_success "All tests passed"
  else
    print_error "Tests failed"
    echo -e "${YELLOW}Fix test failures or use --skip-tests to bypass${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ Skipping tests (--skip-tests flag used)${NC}"
fi

# Build common library
print_step "Step 6: Building Common Library"
echo -e "${YELLOW}Building @angrybirdman/common...${NC}"
if npm run build:common; then
  print_success "Common library built"
else
  print_error "Common library build failed"
  exit 1
fi

# Verify common library output
if [ ! -d "common/dist" ]; then
  print_error "Common library dist directory not found"
  exit 1
fi
COMMON_SIZE=$(du -sh common/dist | cut -f1)
print_success "Common library size: $COMMON_SIZE"

# Build API
print_step "Step 7: Building API Server"
echo -e "${YELLOW}Building @angrybirdman/api...${NC}"
if npm run build:api; then
  print_success "API server built"
else
  print_error "API build failed"
  exit 1
fi

# Verify API output
if [ ! -d "api/dist" ]; then
  print_error "API dist directory not found"
  exit 1
fi
API_SIZE=$(du -sh api/dist | cut -f1)
print_success "API build size: $API_SIZE"

# Build frontend
print_step "Step 8: Building Frontend Application"
echo -e "${YELLOW}Building @angrybirdman/frontend...${NC}"
if npm run build:frontend; then
  print_success "Frontend application built"
else
  print_error "Frontend build failed"
  exit 1
fi

# Verify frontend output
if [ ! -d "frontend/dist" ]; then
  print_error "Frontend dist directory not found"
  exit 1
fi
FRONTEND_SIZE=$(du -sh frontend/dist | cut -f1)
print_success "Frontend build size: $FRONTEND_SIZE"

# Calculate build time
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
MINUTES=$((BUILD_TIME / 60))
SECONDS=$((BUILD_TIME % 60))

# Build summary
print_step "Build Summary"

echo -e "${BLUE}Build Artifacts:${NC}"
echo -e "  Common:   common/dist/    ($COMMON_SIZE)"
echo -e "  API:      api/dist/       ($API_SIZE)"
echo -e "  Frontend: frontend/dist/  ($FRONTEND_SIZE)"
echo

TOTAL_SIZE=$(du -sh common/dist api/dist frontend/dist | awk '{sum+=$1} END {print sum}')
echo -e "${BLUE}Total Build Size:${NC} ~$TOTAL_SIZE"
echo -e "${BLUE}Build Time:${NC} ${MINUTES}m ${SECONDS}s"
echo

# List frontend assets
echo -e "${BLUE}Frontend Assets:${NC}"
ls -lh frontend/dist/assets/*.{js,css} 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'  || echo "  No assets found"
echo

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Production Build Completed! ✓                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  • Run deployment readiness check: ./scripts/check-ready.sh"
echo -e "  • Test production build locally: npm run preview --workspace=frontend"
echo -e "  • Deploy to staging environment"
echo
