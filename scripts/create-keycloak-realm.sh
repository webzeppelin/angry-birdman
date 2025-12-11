#!/bin/bash

###############################################################################
# Keycloak Realm Creation Script
#
# This script creates and configures the Angry Birdman realm in Keycloak.
#
# Prerequisites:
#   - Keycloak container running (angrybirdman-keycloak)
#   - Admin credentials in environment variables or defaults
#
# Usage:
#   ./scripts/create-keycloak-realm.sh
#
# Environment Variables:
#   KEYCLOAK_URL         - Keycloak base URL (default: http://localhost:8080)
#   KEYCLOAK_ADMIN_USER  - Admin username (default: admin)
#   KEYCLOAK_ADMIN_PASSWORD - Admin password (required)
#
# Outputs:
#   - Creates angrybirdman realm
#   - Displays service account client secret
#   - Configures service account with required Admin API permissions
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
REALM_FILE="${PROJECT_ROOT}/keycloak/config/angrybirdman-realm.json"

# Load environment variables from .env file
if [ -f "${PROJECT_ROOT}/.env" ]; then
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | grep -v '^$' | xargs)
fi

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD}"
REALM_NAME="angrybirdman"
SERVICE_ACCOUNT_CLIENT="angrybirdman-api-service"
CONTAINER_NAME="angrybirdman-keycloak"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Angry Birdman - Keycloak Realm Creation Script         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Validate Prerequisites
###############################################################################

# Check if realm file exists
if [ ! -f "$REALM_FILE" ]; then
    echo -e "${RED}❌ Error: Realm configuration file not found${NC}"
    echo "   Expected: $REALM_FILE"
    exit 1
fi

# Check if Keycloak container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Error: Keycloak container not running${NC}"
    echo "   Expected container: $CONTAINER_NAME"
    echo ""
    echo "   Start Keycloak with: docker compose up -d keycloak"
    exit 1
fi

# Check if admin password is provided
if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ Error: KEYCLOAK_ADMIN_PASSWORD not set${NC}"
    echo ""
    echo "   Add KEYCLOAK_ADMIN_PASSWORD to your .env file:"
    echo "   KEYCLOAK_ADMIN_PASSWORD=your-admin-password"
    echo ""
    echo "   Or set it temporarily:"
    echo "   export KEYCLOAK_ADMIN_PASSWORD='your-admin-password'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites validated${NC}"
echo ""

###############################################################################
# Get Access Token
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
    echo "   Check your admin credentials"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

###############################################################################
# Check if Realm Already Exists
###############################################################################

echo -e "${YELLOW}🔍 Checking if realm already exists...${NC}"

REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if [ "$REALM_EXISTS" = "200" ]; then
    echo -e "${YELLOW}⚠️  Realm '${REALM_NAME}' already exists${NC}"
    echo ""
    read -p "   Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Deleting existing realm...${NC}"
        
        DELETE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
          -H "Authorization: Bearer ${ACCESS_TOKEN}")
        
        if [ "$DELETE_RESPONSE" = "204" ]; then
            echo -e "${GREEN}✅ Realm deleted${NC}"
            echo ""
        else
            echo -e "${RED}❌ Failed to delete realm (HTTP ${DELETE_RESPONSE})${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Keeping existing realm. Exiting.${NC}"
        exit 0
    fi
fi

###############################################################################
# Import Realm Configuration
###############################################################################

echo -e "${YELLOW}📦 Importing realm configuration...${NC}"

IMPORT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @"${REALM_FILE}")

if [ "$IMPORT_RESPONSE" = "201" ]; then
    echo -e "${GREEN}✅ Realm created successfully${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to create realm (HTTP ${IMPORT_RESPONSE})${NC}"
    exit 1
fi

###############################################################################
# Get Service Account Client ID
###############################################################################

echo -e "${YELLOW}🔍 Retrieving service account client...${NC}"

CLIENTS_RESPONSE=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${SERVICE_ACCOUNT_CLIENT}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

CLIENT_UUID=$(echo "$CLIENTS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_UUID" ]; then
    echo -e "${RED}❌ Failed to retrieve service account client${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service account client found${NC}"
echo ""

###############################################################################
# Get Service Account Client Secret
###############################################################################

echo -e "${YELLOW}🔑 Retrieving client secret...${NC}"

SECRET_RESPONSE=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/client-secret" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

CLIENT_SECRET=$(echo "$SECRET_RESPONSE" | grep -o '"value":"[^"]*' | cut -d'"' -f4)

if [ -z "$CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Failed to retrieve client secret${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Client secret retrieved${NC}"
echo ""

###############################################################################
# Assign Service Account Roles
###############################################################################

echo -e "${YELLOW}🔐 Configuring service account permissions...${NC}"

# Get the service account user
SERVICE_ACCOUNT_USER_RESPONSE=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/service-account-user" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

SERVICE_ACCOUNT_USER_ID=$(echo "$SERVICE_ACCOUNT_USER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ACCOUNT_USER_ID" ]; then
    echo -e "${RED}❌ Failed to retrieve service account user${NC}"
    exit 1
fi

# Get realm-management client ID
REALM_MGMT_CLIENTS=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=realm-management" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

REALM_MGMT_CLIENT_UUID=$(echo "$REALM_MGMT_CLIENTS" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$REALM_MGMT_CLIENT_UUID" ]; then
    echo -e "${RED}❌ Failed to retrieve realm-management client${NC}"
    exit 1
fi

# Get available roles for realm-management client
AVAILABLE_ROLES=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${SERVICE_ACCOUNT_USER_ID}/role-mappings/clients/${REALM_MGMT_CLIENT_UUID}/available" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

# Extract role IDs for required permissions
MANAGE_USERS_ROLE=$(echo "$AVAILABLE_ROLES" | grep -o '"id":"[^"]*","name":"manage-users"' | cut -d'"' -f4)
VIEW_USERS_ROLE=$(echo "$AVAILABLE_ROLES" | grep -o '"id":"[^"]*","name":"view-users"' | cut -d'"' -f4)
QUERY_USERS_ROLE=$(echo "$AVAILABLE_ROLES" | grep -o '"id":"[^"]*","name":"query-users"' | cut -d'"' -f4)

# Build roles JSON array
ROLES_JSON="["
if [ -n "$MANAGE_USERS_ROLE" ]; then
    ROLES_JSON="${ROLES_JSON}{\"id\":\"${MANAGE_USERS_ROLE}\",\"name\":\"manage-users\"},"
fi
if [ -n "$VIEW_USERS_ROLE" ]; then
    ROLES_JSON="${ROLES_JSON}{\"id\":\"${VIEW_USERS_ROLE}\",\"name\":\"view-users\"},"
fi
if [ -n "$QUERY_USERS_ROLE" ]; then
    ROLES_JSON="${ROLES_JSON}{\"id\":\"${QUERY_USERS_ROLE}\",\"name\":\"query-users\"},"
fi
ROLES_JSON="${ROLES_JSON%,}]"

# Assign roles
ASSIGN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${SERVICE_ACCOUNT_USER_ID}/role-mappings/clients/${REALM_MGMT_CLIENT_UUID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${ROLES_JSON}")

if [ "$ASSIGN_RESPONSE" = "204" ]; then
    echo -e "${GREEN}✅ Service account roles assigned${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Role assignment returned HTTP ${ASSIGN_RESPONSE}${NC}"
    echo ""
fi

###############################################################################
# Display Results
###############################################################################

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete! ✅                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Realm Configuration:${NC}"
echo "  Realm Name:    ${REALM_NAME}"
echo "  Keycloak URL:  ${KEYCLOAK_URL}"
echo ""
echo -e "${BLUE}Service Account Credentials:${NC}"
echo "  Client ID:     ${SERVICE_ACCOUNT_CLIENT}"
echo "  Client Secret: ${CLIENT_SECRET}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update your .env file with these values:${NC}"
echo ""
echo "KEYCLOAK_ADMIN_CLIENT_ID=${SERVICE_ACCOUNT_CLIENT}"
echo "KEYCLOAK_ADMIN_CLIENT_SECRET=${CLIENT_SECRET}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Update your .env file with the service account credentials above"
echo "  2. Create test users: ./scripts/create-keycloak-test-users.sh"
echo "  3. Seed the database: npm run seed (in database directory)"
echo ""
