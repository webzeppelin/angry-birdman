#!/bin/bash

###############################################################################
# Angry Birdman - Automated Development Environment Setup
#
# This script automates the complete setup of a local development environment
# for the Angry Birdman project. It performs the following steps:
#
# 1. Configure environment variables (.env files)
# 2. Install dependencies (npm install)
# 3. Start Docker services (PostgreSQL, Keycloak, Valkey)
# 4. Create Keycloak test users
# 5. Generate Prisma Client
# 6. Run database migrations
# 7. Seed the database
#
# Prerequisites:
#   - Node.js 24.0.0+ and npm 11.0.0+
#   - Docker Desktop with Docker Compose
#   - Git (project already cloned)
#
# Usage:
#   ./scripts/install-dev.sh
#
# Options:
#   --skip-env    Skip environment file setup (use existing .env files)
#   --force       Force reinstall even if already installed
#   --help        Show this help message
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
SKIP_ENV=false
FORCE_INSTALL=false
MAX_HEALTH_CHECKS=60  # Maximum wait time (60 * 5 seconds = 5 minutes)

###############################################################################
# Parse Command Line Arguments
###############################################################################

show_help() {
    cat << EOF
Angry Birdman - Automated Development Environment Setup

Usage: $0 [OPTIONS]

Options:
    --skip-env      Skip environment file setup (use existing .env files)
    --force         Force reinstall even if already installed
    --help          Show this help message

This script automates the complete setup of a local development environment,
including Docker services, database setup, and Keycloak configuration.

Examples:
    $0                  # Full installation
    $0 --skip-env       # Skip .env file creation
    $0 --force          # Force complete reinstall

EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-env)
            SKIP_ENV=true
            shift
            ;;
        --force)
            FORCE_INSTALL=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "   Use --help for usage information"
            exit 1
            ;;
    esac
done

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       Angry Birdman - Development Environment Setup          ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    local step_num=$1
    local step_name=$2
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}Step ${step_num}: ${step_name}${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if a file exists
file_exists() {
    [ -f "$1" ]
}

# Check if Docker is running
docker_running() {
    docker info >/dev/null 2>&1
}

###############################################################################
# Prerequisite Checks
###############################################################################

check_prerequisites() {
    print_step "0" "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
        if [ "$NODE_MAJOR" -ge 24 ]; then
            print_success "Node.js ${NODE_VERSION} installed"
        else
            print_error "Node.js version ${NODE_VERSION} is too old (requires 24.0.0+)"
            all_ok=false
        fi
    else
        print_error "Node.js is not installed (requires 24.0.0+)"
        all_ok=false
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        NPM_MAJOR=$(echo "$NPM_VERSION" | cut -d. -f1)
        if [ "$NPM_MAJOR" -ge 11 ]; then
            print_success "npm ${NPM_VERSION} installed"
        else
            print_error "npm version ${NPM_VERSION} is too old (requires 11.0.0+)"
            all_ok=false
        fi
    else
        print_error "npm is not installed (requires 11.0.0+)"
        all_ok=false
    fi
    
    # Check Docker
    if command_exists docker; then
        print_success "Docker is installed"
        if docker_running; then
            print_success "Docker is running"
        else
            print_error "Docker is not running - please start Docker Desktop"
            all_ok=false
        fi
    else
        print_error "Docker is not installed"
        all_ok=false
    fi
    
    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version --short)
        print_success "Docker Compose ${COMPOSE_VERSION} is available"
    else
        print_error "Docker Compose is not available"
        all_ok=false
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        print_success "Git ${GIT_VERSION} installed"
    else
        print_warning "Git is not installed (recommended for version control)"
    fi
    
    if [ "$all_ok" = false ]; then
        echo ""
        print_error "Prerequisites check failed. Please install missing dependencies."
        echo ""
        echo "Installation guides:"
        echo "  - Node.js: https://nodejs.org/ (LTS version)"
        echo "  - Docker: https://www.docker.com/products/docker-desktop/"
        echo ""
        exit 1
    fi
    
    print_success "All prerequisites met"
}

###############################################################################
# Step 1: Configure Environment Variables
###############################################################################

setup_env_files() {
    print_step "1" "Configure Environment Variables"
    
    if [ "$SKIP_ENV" = true ]; then
        print_info "Skipping environment file setup (--skip-env flag)"
        
        # Verify required files exist
        local missing_files=false
        for env_file in ".env" "api/.env" "frontend/.env"; do
            if ! file_exists "${PROJECT_ROOT}/${env_file}"; then
                print_error "Required file missing: ${env_file}"
                missing_files=true
            fi
        done
        
        if [ "$missing_files" = true ]; then
            print_error "Missing required .env files. Run without --skip-env or create them manually."
            exit 1
        fi
        
        print_success "All required .env files exist"
        return
    fi
    
    # Root .env file
    if file_exists "${PROJECT_ROOT}/.env" && [ "$FORCE_INSTALL" = false ]; then
        print_info "Root .env file already exists - skipping"
    else
        if file_exists "${PROJECT_ROOT}/.env.example"; then
            cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
            print_success "Created root .env file from template"
        else
            print_error ".env.example not found in project root"
            exit 1
        fi
    fi
    
    # API .env file
    if file_exists "${PROJECT_ROOT}/api/.env" && [ "$FORCE_INSTALL" = false ]; then
        print_info "API .env file already exists - skipping"
    else
        if file_exists "${PROJECT_ROOT}/api/.env.example"; then
            cp "${PROJECT_ROOT}/api/.env.example" "${PROJECT_ROOT}/api/.env"
            print_success "Created api/.env file from template"
        else
            print_error "api/.env.example not found"
            exit 1
        fi
    fi
    
    # Frontend .env file
    if file_exists "${PROJECT_ROOT}/frontend/.env" && [ "$FORCE_INSTALL" = false ]; then
        print_info "Frontend .env file already exists - skipping"
    else
        if file_exists "${PROJECT_ROOT}/frontend/.env.example"; then
            cp "${PROJECT_ROOT}/frontend/.env.example" "${PROJECT_ROOT}/frontend/.env"
            print_success "Created frontend/.env file from template"
        else
            print_error "frontend/.env.example not found"
            exit 1
        fi
    fi
    
    print_success "Environment files configured"
    print_info "Note: Using default passwords suitable for development only"
}

###############################################################################
# Step 2: Install Dependencies
###############################################################################

install_dependencies() {
    print_step "2" "Install Dependencies"
    
    cd "${PROJECT_ROOT}"
    
    print_info "Running npm install (this may take a few minutes)..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

###############################################################################
# Step 3: Start Docker Services
###############################################################################

start_docker_services() {
    print_step "3" "Start Docker Services"
    
    cd "${PROJECT_ROOT}"
    
    # Check if containers are already running
    if docker compose ps --services --filter "status=running" | grep -q .; then
        print_info "Docker containers are already running"
        
        if [ "$FORCE_INSTALL" = false ]; then
            print_info "Skipping Docker startup (use --force to restart)"
            return
        else
            print_info "Restarting Docker services..."
            docker compose down
        fi
    fi
    
    print_info "Starting Docker containers (PostgreSQL, Keycloak, Valkey)..."
    if docker compose up -d; then
        print_success "Docker containers started"
    else
        print_error "Failed to start Docker containers"
        exit 1
    fi
    
    # Wait for all services to be healthy
    print_info "Waiting for services to become healthy..."
    
    local checks=0
    local all_healthy=false
    
    while [ $checks -lt $MAX_HEALTH_CHECKS ]; do
        checks=$((checks + 1))
        
        # Get container status
        local unhealthy_count=0
        local container_status=""
        
        # Check each expected service
        for service in postgres keycloak valkey; do
            local status=$(docker compose ps --format json | grep "\"Service\":\"$service\"" | grep -o '"Health":"[^"]*"' | cut -d'"' -f4)
            
            if [ -z "$status" ]; then
                # No health status means container might not have healthcheck
                local state=$(docker compose ps --format json | grep "\"Service\":\"$service\"" | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
                if [ "$state" = "running" ]; then
                    status="running"
                else
                    status="unknown"
                fi
            fi
            
            if [ "$status" != "healthy" ] && [ "$status" != "running" ]; then
                unhealthy_count=$((unhealthy_count + 1))
            fi
            
            container_status="${container_status}${service}:${status} "
        done
        
        echo -ne "   ${CYAN}Check ${checks}/${MAX_HEALTH_CHECKS}: ${container_status}${NC}\r"
        
        if [ $unhealthy_count -eq 0 ]; then
            all_healthy=true
            break
        fi
        
        sleep 5
    done
    
    echo "" # New line after status updates
    
    if [ "$all_healthy" = true ]; then
        print_success "All Docker services are healthy"
    else
        print_error "Timeout waiting for Docker services to become healthy"
        echo ""
        print_info "Container status:"
        docker compose ps
        echo ""
        print_info "Check logs with: docker compose logs"
        exit 1
    fi
}

###############################################################################
# Step 4: Create Keycloak Test Users
###############################################################################

create_test_users() {
    print_step "4" "Create Keycloak Test Users"
    
    cd "${PROJECT_ROOT}"
    
    # Check if users already exist by checking for the output file
    if file_exists "${SCRIPT_DIR}/local-keycloak-test-users.json" && [ "$FORCE_INSTALL" = false ]; then
        print_info "Test users appear to already exist"
        
        # Verify the file is valid JSON and not empty
        if jq empty "${SCRIPT_DIR}/local-keycloak-test-users.json" 2>/dev/null; then
            print_success "Test users already configured - skipping"
            return
        else
            print_warning "User mapping file is invalid - recreating users"
        fi
    fi
    
    print_info "Creating Keycloak test users..."
    if "${SCRIPT_DIR}/create-keycloak-test-users.sh"; then
        print_success "Test users created successfully"
        
        # Validate the output file
        if file_exists "${SCRIPT_DIR}/local-keycloak-test-users.json"; then
            if jq empty "${SCRIPT_DIR}/local-keycloak-test-users.json" 2>/dev/null; then
                print_success "User mapping file is valid"
            else
                print_warning "User mapping file may contain formatting issues"
                print_info "You may need to manually clean ${SCRIPT_DIR}/local-keycloak-test-users.json"
            fi
        else
            print_error "User mapping file was not created"
            exit 1
        fi
    else
        print_error "Failed to create test users"
        exit 1
    fi
}

###############################################################################
# Step 5: Generate Prisma Client
###############################################################################

generate_prisma_client() {
    print_step "5" "Generate Prisma Client"
    
    cd "${PROJECT_ROOT}"
    
    print_info "Generating Prisma Client..."
    if npm run db:generate; then
        print_success "Prisma Client generated successfully"
    else
        print_error "Failed to generate Prisma Client"
        exit 1
    fi
}

###############################################################################
# Step 6: Run Database Migrations
###############################################################################

run_migrations() {
    print_step "6" "Run Database Migrations"
    
    cd "${PROJECT_ROOT}"
    
    # Check if migrations have already been applied
    if [ "$FORCE_INSTALL" = false ]; then
        # Try to check migration status
        if npm run db:migrate:status 2>&1 | grep -q "Database schema is up to date"; then
            print_info "Database migrations are already up to date - skipping"
            return
        fi
    fi
    
    print_info "Running database migrations..."
    if npm run db:migrate:deploy; then
        print_success "Database migrations completed successfully"
    else
        print_error "Failed to run database migrations"
        print_info "You may need to reset the database with: npm run db:reset-dev"
        exit 1
    fi
}

###############################################################################
# Step 7: Seed the Database
###############################################################################

seed_database() {
    print_step "7" "Seed the Database"
    
    cd "${PROJECT_ROOT}"
    
    # Check if database has already been seeded
    if [ "$FORCE_INSTALL" = false ]; then
        # Load DATABASE_URL from .env
        if [ -f "${PROJECT_ROOT}/.env" ]; then
            export $(grep "^DATABASE_URL=" "${PROJECT_ROOT}/.env" | xargs)
        fi
        
        # Check if any data exists in the database (check for clans)
        if [ -n "$DATABASE_URL" ]; then
            CLAN_COUNT=$(docker compose exec -T postgres psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM clan;" 2>/dev/null | tr -d ' ' || echo "0")
            
            if [ "$CLAN_COUNT" -gt 0 ] 2>/dev/null; then
                print_info "Database appears to be already seeded (${CLAN_COUNT} clans found) - skipping"
                return
            fi
        fi
    fi
    
    print_info "Seeding database with test data..."
    if npm run db:seed; then
        print_success "Database seeded successfully"
    else
        print_error "Failed to seed database"
        exit 1
    fi
}

###############################################################################
# Installation Summary
###############################################################################

print_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   Installation Complete! 🎉                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "  1. Start the development servers:"
    echo -e "     ${YELLOW}npm run dev${NC}"
    echo ""
    echo -e "  2. Open your browser:"
    echo -e "     ${YELLOW}http://localhost:3000${NC} (Frontend)"
    echo -e "     ${YELLOW}http://localhost:3001${NC} (API)"
    echo ""
    echo -e "${CYAN}Test User Credentials:${NC}"
    echo ""
    echo -e "  Superadmin:   ${YELLOW}testsuperadmin${NC} / ${YELLOW}SuperAdmin123!${NC}"
    echo -e "  Clan Owner:   ${YELLOW}testowner${NC}      / ${YELLOW}ClanOwner123!${NC}"
    echo -e "  Clan Admin:   ${YELLOW}testadmin${NC}      / ${YELLOW}ClanAdmin123!${NC}"
    echo -e "  User:         ${YELLOW}testuser${NC}       / ${YELLOW}TestUser123!${NC}"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo ""
    echo -e "  npm run dev           - Start development servers"
    echo -e "  npm test              - Run test suite"
    echo -e "  npm run db:studio     - Open Prisma Studio"
    echo -e "  npm run docker:ps     - View Docker container status"
    echo -e "  npm run docker:logs   - View Docker logs"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo ""
    echo -e "  docs/new-developer-guide.md  - Complete developer guide"
    echo -e "  specs/high-level-spec.md     - System specification"
    echo ""
}

###############################################################################
# Main Installation Flow
###############################################################################

main() {
    print_header
    
    # Run all installation steps
    check_prerequisites
    setup_env_files
    install_dependencies
    start_docker_services
    create_test_users
    generate_prisma_client
    run_migrations
    seed_database
    
    print_summary
}

# Run main installation
main
