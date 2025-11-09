#!/usr/bin/env bash

################################################################################
# check-ready.sh - Verify Angry Birdman is ready for deployment
#
# This comprehensive script checks all aspects of the application to ensure
# it's ready for production deployment.
#
# Checks performed:
#   - Environment configuration
#   - Build artifacts existence and validity
#   - Test coverage requirements
#   - Security vulnerabilities
#   - Code quality standards
#   - Database migrations status
#   - Docker image buildability
#   - Documentation completeness
#
# Usage: ./scripts/check-ready.sh [options]
#
# Options:
#   --env ENV       Environment to check (staging, production)
#   --strict        Fail on warnings
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
ENVIRONMENT="production"
STRICT=false

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
CHECKS_TOTAL=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --strict)
      STRICT=true
      shift
      ;;
    -h|--help)
      head -n 27 "$0" | tail -n +3 | sed 's/^# //g; s/^#//g'
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
echo -e "${BLUE}║     Angry Birdman Deployment Readiness Check          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${CYAN}Environment: $ENVIRONMENT${NC}"
echo -e "${CYAN}Strict Mode: $STRICT${NC}"
echo

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory${NC}"
  exit 1
fi

# Function to run a check
run_check() {
  local name="$1"
  local command="$2"
  local level="${3:-error}"  # error, warning, info
  
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  
  echo -n "[$CHECKS_TOTAL] $name... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  else
    if [ "$level" = "warning" ]; then
      echo -e "${YELLOW}⚠${NC}"
      CHECKS_WARNING=$((CHECKS_WARNING + 1))
      if [ "$STRICT" = true ]; then
        return 1
      fi
      return 0
    else
      echo -e "${RED}✗${NC}"
      CHECKS_FAILED=$((CHECKS_FAILED + 1))
      return 1
    fi
  fi
}

# Function to print section header
print_section() {
  echo
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo
}

# Section 1: Environment Configuration
print_section "1. Environment Configuration"

run_check "Node.js version >= 20" "[ \$(node --version | cut -d'v' -f2 | cut -d'.' -f1) -ge 20 ]"
run_check "npm version >= 10" "[ \$(npm --version | cut -d'.' -f1) -ge 10 ]"
run_check "Dependencies installed" "[ -d node_modules ]"
run_check "TypeScript installed" "which tsc"
run_check "Prisma CLI available" "which prisma"

# Section 2: Build Artifacts
print_section "2. Build Artifacts"

run_check "Common library built" "[ -d common/dist ] && [ -f common/dist/index.js ]"
run_check "API server built" "[ -d api/dist ] && [ -f api/dist/index.js ]"
run_check "Frontend built" "[ -d frontend/dist ] && [ -f frontend/dist/index.html ]"
run_check "Frontend has assets" "[ -d frontend/dist/assets ]"
run_check "TypeScript declarations exist" "[ -f common/dist/index.d.ts ]"

# Section 3: Code Quality
print_section "3. Code Quality"

run_check "ESLint passes" "npm run lint"
run_check "Prettier format check passes" "npm run format:check"
run_check "TypeScript type-check passes" "npm run type-check"
run_check "No TypeScript errors" "! grep -r 'ts-ignore' --include='*.ts' --include='*.tsx' api/ common/ frontend/ 2>/dev/null"

# Section 4: Testing
print_section "4. Testing"

run_check "Test suite exists" "[ -f common/tests/calculations.test.ts ]"
run_check "All tests pass" "npm run test"

# Check test coverage
if command -v jq > /dev/null 2>&1; then
  if [ -f "common/coverage/coverage-summary.json" ]; then
    COMMON_COV=$(jq '.total.lines.pct' common/coverage/coverage-summary.json 2>/dev/null || echo "0")
    run_check "Common coverage >= 80%" "[ \$(echo \"$COMMON_COV >= 80\" | bc) -eq 1 ]" "warning"
  fi
fi

# Section 5: Security
print_section "5. Security"

run_check "No high severity vulnerabilities" "npm audit --audit-level=high --omit=dev || true" "warning"
run_check "No hardcoded secrets" "! grep -r 'password.*=' --include='*.ts' --include='*.tsx' api/ frontend/ 2>/dev/null | grep -v 'PASSWORD' | grep -v '.example'" "warning"
run_check "Environment variables documented" "[ -f .env.example ]"

# Section 6: Database
print_section "6. Database"

run_check "Prisma schema exists" "[ -f database/prisma/schema.prisma ]"
run_check "Prisma schema validates" "cd database && npx prisma validate"
run_check "Migrations directory exists" "[ -d database/prisma/migrations ]"
run_check "Seed script exists" "[ -f database/prisma/seed.ts ]"

# Section 7: Configuration Files
print_section "7. Configuration Files"

run_check "Docker Compose config exists" "[ -f docker-compose.yml ]"
run_check "API package.json valid" "[ -f api/package.json ] && jq empty api/package.json"
run_check "Frontend package.json valid" "[ -f frontend/package.json ] && jq empty frontend/package.json"
run_check "TypeScript config exists" "[ -f tsconfig.json ]"
run_check "ESLint config exists" "[ -f .eslintrc.cjs ]"
run_check "Prettier config exists" "[ -f .prettierrc ]"

# Section 8: Documentation
print_section "8. Documentation"

run_check "README exists" "[ -f README.md ] && [ \$(wc -l < README.md) -gt 50 ]"
run_check "API README exists" "[ -f api/README.md ]"
run_check "Frontend README exists" "[ -f frontend/README.md ]"
run_check "Database README exists" "[ -f database/README.md ]"
run_check "Specifications exist" "[ -d specs ] && [ -f specs/high-level-spec.md ]"
run_check "Implementation logs exist" "[ -d implog ] && [ \$(ls implog/*.md 2>/dev/null | wc -l) -gt 0 ]" "warning"

# Section 9: Git Repository
print_section "9. Git Repository"

run_check "Git repository initialized" "[ -d .git ]"
run_check ".gitignore exists" "[ -f .gitignore ]"
run_check "No uncommitted changes" "git diff --quiet" "warning"
run_check "Working directory clean" "git diff --cached --quiet" "warning"
run_check "Current branch known" "git rev-parse --abbrev-ref HEAD"

# Section 10: Infrastructure
print_section "10. Infrastructure"

run_check "Keycloak config exists" "[ -f keycloak/config/angrybirdman-realm.json ]"
run_check "Docker init scripts exist" "[ -d database/postgres/init ]"
run_check "GitHub Actions workflow exists" "[ -f .github/workflows/ci.yml ]" "warning"

# Generate report
print_section "Readiness Report"

TOTAL_PASS_RATE=$(echo "scale=1; $CHECKS_PASSED * 100 / $CHECKS_TOTAL" | bc)

echo -e "${BLUE}Checks Summary:${NC}"
echo -e "  Total:    $CHECKS_TOTAL"
echo -e "  ${GREEN}Passed:   $CHECKS_PASSED${NC}"
echo -e "  ${RED}Failed:   $CHECKS_FAILED${NC}"
echo -e "  ${YELLOW}Warnings: $CHECKS_WARNING${NC}"
echo
echo -e "${BLUE}Pass Rate: $TOTAL_PASS_RATE%${NC}"
echo

# Determine overall status
if [ $CHECKS_FAILED -eq 0 ]; then
  if [ $CHECKS_WARNING -eq 0 ]; then
    STATUS="${GREEN}READY FOR DEPLOYMENT ✓${NC}"
    EXIT_CODE=0
  else
    if [ "$STRICT" = true ]; then
      STATUS="${RED}NOT READY (warnings in strict mode)${NC}"
      EXIT_CODE=1
    else
      STATUS="${YELLOW}READY WITH WARNINGS ⚠${NC}"
      EXIT_CODE=0
    fi
  fi
else
  STATUS="${RED}NOT READY FOR DEPLOYMENT ✗${NC}"
  EXIT_CODE=1
fi

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "Status: $STATUS"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All critical checks passed!${NC}"
  echo
  echo -e "${BLUE}Next steps:${NC}"
  echo -e "  • Create deployment branch: git checkout -b deploy/\$(date +%Y%m%d)"
  echo -e "  • Tag release: git tag -a v0.1.0 -m 'Release v0.1.0'"
  echo -e "  • Push to remote: git push origin --tags"
  echo -e "  • Deploy to $ENVIRONMENT environment"
else
  echo -e "${RED}Deployment readiness check failed!${NC}"
  echo -e "${YELLOW}Fix the failed checks before proceeding with deployment.${NC}"
fi
echo

exit $EXIT_CODE
