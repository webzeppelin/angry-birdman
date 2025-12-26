#!/bin/bash

###############################################################################
# Finish Initialization Script for Deployed Environments
#
# This script completes the initialization of a deployed Angry Birdman instance
# by creating essential Keycloak users and database records required for the
# application to function properly.
#
# Creates:
# - Keycloak "superadmin" user in the angrybirdman realm
# - Action codes in the database
# - System settings in the database
# - Superadmin user profile in the database
#
# Prerequisites:
# - Docker containers are running (postgres, keycloak)
# - Database migrations have been applied
# - docker/.env.test file exists with proper configuration
#
# Usage:
#   ./docker/finish-init.sh
#
# Environment Variables (from docker/.env.test):
#   KEYCLOAK_HOSTNAME        - Keycloak hostname/IP
#   KEYCLOAK_PORT            - Keycloak port
#   KEYCLOAK_ADMIN_USER      - Keycloak admin username
#   KEYCLOAK_ADMIN_PASSWORD  - Keycloak admin password
#   KEYCLOAK_REALM           - Realm name (angrybirdman)
#   DATABASE_URL             - PostgreSQL connection string
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Angry Birdman - Finish Initialization (Deployed Env)      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Load Environment Variables
###############################################################################

ENV_FILE="${SCRIPT_DIR}/.env.test"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: ${ENV_FILE} not found${NC}"
    echo ""
    echo "   Please create docker/.env.test with proper configuration."
    echo "   You can copy from docker/.env.test.example and customize."
    echo ""
    exit 1
fi

echo -e "${YELLOW}📄 Loading environment from ${ENV_FILE}${NC}"
export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

# Build Keycloak URL
KEYCLOAK_URL="http://${KEYCLOAK_HOSTNAME}:${KEYCLOAK_PORT}"

echo -e "${GREEN}✅ Environment loaded${NC}"
echo ""

###############################################################################
# Validate Prerequisites
###############################################################################

echo -e "${YELLOW}🔍 Validating prerequisites...${NC}"

# Check required environment variables
if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ Error: KEYCLOAK_ADMIN_PASSWORD not set in ${ENV_FILE}${NC}"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in ${ENV_FILE}${NC}"
    exit 1
fi

if [ -z "$KEYCLOAK_HOSTNAME" ]; then
    echo -e "${RED}❌ Error: KEYCLOAK_HOSTNAME not set in ${ENV_FILE}${NC}"
    exit 1
fi

# Default values if not set
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_PORT="${KEYCLOAK_PORT:-8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-angrybirdman}"

# Check if Keycloak is accessible
echo -e "${YELLOW}   Checking Keycloak at ${KEYCLOAK_URL}...${NC}"
if ! curl -sf "${KEYCLOAK_URL}/health/ready" > /dev/null; then
    echo -e "${RED}❌ Error: Cannot reach Keycloak at ${KEYCLOAK_URL}${NC}"
    echo "   Make sure Keycloak container is running and accessible."
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites validated${NC}"
echo ""

###############################################################################
# Get Keycloak Access Token
###############################################################################

echo -e "${YELLOW}🔑 Authenticating with Keycloak...${NC}"

TOKEN_RESPONSE=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN_USER}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Failed to authenticate with Keycloak${NC}"
    echo "   Check your admin credentials in ${ENV_FILE}"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

###############################################################################
# Create Superadmin User in Keycloak
###############################################################################

echo -e "${YELLOW}👤 Creating superadmin user in Keycloak...${NC}"

USERNAME="superadmin"
EMAIL="superadmin@angrybirdman.app"
PASSWORD="$KEYCLOAK_ADMIN_PASSWORD"  # Use same password as Keycloak admin

# Check if user already exists
EXISTING_USER=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${USERNAME}&exact=true" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

USER_ID=$(echo "$EXISTING_USER" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
    echo -e "   ${YELLOW}⚠️  User already exists (ID: ${USER_ID})${NC}"
    
    # Update password
    RESET_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
      "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${USER_ID}/reset-password" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"password\",\"value\":\"${PASSWORD}\",\"temporary\":false}")
    
    if [ "$RESET_RESPONSE" = "204" ]; then
        echo -e "   ${GREEN}✅ Password updated${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Password update returned HTTP ${RESET_RESPONSE}${NC}"
    fi
else
    # Create new user
    CREATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"${USERNAME}\",
        \"email\": \"${EMAIL}\",
        \"enabled\": true,
        \"emailVerified\": true,
        \"credentials\": [{
          \"type\": \"password\",
          \"value\": \"${PASSWORD}\",
          \"temporary\": false
        }]
      }")
    
    if [ "$CREATE_RESPONSE" = "201" ]; then
        echo -e "   ${GREEN}✅ User created${NC}"
        
        # Get the newly created user ID
        EXISTING_USER=$(curl -s -X GET \
          "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${USERNAME}&exact=true" \
          -H "Authorization: Bearer ${ACCESS_TOKEN}")
        
        USER_ID=$(echo "$EXISTING_USER" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    else
        echo -e "   ${RED}❌ Failed to create user (HTTP ${CREATE_RESPONSE})${NC}"
        exit 1
    fi
fi

if [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Error: Could not determine user ID${NC}"
    exit 1
fi

# Get the subject ID (sub) from the user details
USER_DETAILS=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

# The subject ID is the same as the user ID in Keycloak
SUPERADMIN_SUB="$USER_ID"

echo -e "${GREEN}✅ Superadmin user ready in Keycloak${NC}"
echo -e "   ${BLUE}User ID (sub): ${SUPERADMIN_SUB}${NC}"
echo ""

###############################################################################
# Initialize Database
###############################################################################

echo -e "${YELLOW}💾 Initializing database...${NC}"
echo ""

# Export environment variables for the TypeScript script
export SUPERADMIN_KEYCLOAK_SUB="$SUPERADMIN_SUB"
export DATABASE_URL="$DATABASE_URL"

# Run the TypeScript initialization script
cd "$PROJECT_ROOT"

if ! command -v tsx &> /dev/null; then
    echo -e "${YELLOW}   Installing tsx globally (required to run TypeScript)...${NC}"
    npm install -g tsx
fi

tsx docker/finish-init-database.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database initialization failed${NC}"
    exit 1
fi

###############################################################################
# Display Results
###############################################################################

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Initialization Completed Successfully! ✅             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Superadmin Credentials:${NC}"
echo "  Username: superadmin"
echo "  Password: (same as KEYCLOAK_ADMIN_PASSWORD in .env.test)"
echo "  Email: superadmin@angrybirdman.app"
echo ""
echo -e "${BLUE}Database:${NC}"
echo "  ✅ Action codes created"
echo "  ✅ System settings configured"
echo "  ✅ Superadmin profile created"
echo ""
echo -e "${GREEN}Your deployed environment is now ready to use!${NC}"
echo ""
