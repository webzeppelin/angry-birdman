#!/bin/bash

###############################################################################
# Keycloak Test User Creation Script
#
# This script creates test users in Keycloak and generates a mapping file
# that maps usernames to their Keycloak subject IDs (sub). This mapping file
# is used by the database seed script to create user records with the correct
# composite user IDs (keycloak:{sub}).
#
# Prerequisites:
#   - Keycloak container running with angrybirdman realm created
#   - Admin credentials in environment variables
#
# Usage:
#   ./scripts/create-keycloak-test-users.sh
#
# Environment Variables:
#   KEYCLOAK_URL         - Keycloak base URL (default: http://localhost:8080)
#   KEYCLOAK_ADMIN_USER  - Admin username (default: admin)
#   KEYCLOAK_ADMIN_PASSWORD - Admin password (required)
#
# Outputs:
#   - Creates test users in Keycloak
#   - Generates scripts/local-keycloak-test-users.json with username→sub mappings
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
OUTPUT_FILE="${SCRIPT_DIR}/local-keycloak-test-users.json"

# Load environment variables from .env file
if [ -f "${PROJECT_ROOT}/.env" ]; then
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | grep -v '^$' | xargs)
fi

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD}"
REALM_NAME="angrybirdman"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Angry Birdman - Keycloak Test User Creation            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Validate Prerequisites
###############################################################################

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
    echo "   Check your admin credentials and ensure Keycloak is running"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

###############################################################################
# Function to Create or Update User
###############################################################################

create_user() {
    local username=$1
    local email=$2
    local password=$3
    local description=$4
    
    # Output to stderr so it doesn't pollute the return value
    echo -e "${YELLOW}👤 Processing user: ${username}${NC}" >&2
    
    # Check if user already exists
    EXISTING_USER=$(curl -s -X GET \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${username}&exact=true" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    USER_ID=$(echo "$EXISTING_USER" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$USER_ID" ]; then
        echo -e "   ${YELLOW}⚠️  User already exists (ID: ${USER_ID})${NC}" >&2
        
        # Update password
        RESET_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/reset-password" \
          -H "Authorization: Bearer ${ACCESS_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "{\"type\":\"password\",\"value\":\"${password}\",\"temporary\":false}")
        
        if [ "$RESET_RESPONSE" = "204" ]; then
            echo -e "   ${GREEN}✅ Password updated${NC}" >&2
        else
            echo -e "   ${YELLOW}⚠️  Password update returned HTTP ${RESET_RESPONSE}${NC}" >&2
        fi
    else
        # Create new user
        CREATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
          -H "Authorization: Bearer ${ACCESS_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "{
            \"username\": \"${username}\",
            \"email\": \"${email}\",
            \"enabled\": true,
            \"emailVerified\": true,
            \"credentials\": [{
              \"type\": \"password\",
              \"value\": \"${password}\",
              \"temporary\": false
            }]
          }")
        
        if [ "$CREATE_RESPONSE" = "201" ]; then
            echo -e "   ${GREEN}✅ User created${NC}" >&2
            
            # Get the newly created user ID
            EXISTING_USER=$(curl -s -X GET \
              "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${username}&exact=true" \
              -H "Authorization: Bearer ${ACCESS_TOKEN}")
            
            USER_ID=$(echo "$EXISTING_USER" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        else
            echo -e "   ${RED}❌ Failed to create user (HTTP ${CREATE_RESPONSE})${NC}" >&2
            return 1
        fi
    fi
    
    # Assign 'user' role (all users get this base role)
    ROLE_RESPONSE=$(curl -s -X GET \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/user" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    ROLE_ID=$(echo "$ROLE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    ROLE_NAME=$(echo "$ROLE_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$ROLE_ID" ]; then
        ASSIGN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm" \
          -H "Authorization: Bearer ${ACCESS_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "[{\"id\":\"${ROLE_ID}\",\"name\":\"${ROLE_NAME}\"}]")
        
        if [ "$ASSIGN_RESPONSE" = "204" ]; then
            echo -e "   ${GREEN}✅ Role 'user' assigned${NC}" >&2
        fi
    fi
    
    echo -e "   ${BLUE}Description: ${description}${NC}" >&2
    echo "" >&2
    
    # Return user ID for mapping (stdout only)
    echo "$USER_ID"
}

###############################################################################
# Create Test Users
###############################################################################

echo -e "${YELLOW}📝 Creating test users...${NC}"
echo ""

# Initialize JSON mapping object
JSON_MAPPING="{"

# Test users definition
# Format: username|email|password|description
USERS=(
  "testsuperadmin|superadmin@angrybirdman.test|SuperAdmin123!|Superadmin user (no clan association)"
  "testowner|owner@angrybirdman.test|ClanOwner123!|Clan owner for clan 54 (Angry Avengers)"
  "testadmin|admin@angrybirdman.test|ClanAdmin123!|Clan admin for clan 54 (Angry Avengers)"
  "testuser|user@angrybirdman.test|TestUser123!|Basic user for clan 54 (Angry Avengers)"
  "testowner2|owner2@angrybirdman.test|ClanOwner2123!|Clan owner for clan 55 (Feather Fury)"
)

# Create each user and collect IDs
for user_spec in "${USERS[@]}"; do
    IFS='|' read -r username email password description <<< "$user_spec"
    
    USER_ID=$(create_user "$username" "$email" "$password" "$description")
    
    if [ -n "$USER_ID" ]; then
        # Add to JSON mapping (add comma if not first entry)
        if [ "$JSON_MAPPING" != "{" ]; then
            JSON_MAPPING="${JSON_MAPPING},"
        fi
        JSON_MAPPING="${JSON_MAPPING}\"${username}\":\"${USER_ID}\""
    fi
done

# Close JSON object
JSON_MAPPING="${JSON_MAPPING}}"

###############################################################################
# Write Mapping File
###############################################################################

echo -e "${YELLOW}💾 Writing user mapping file...${NC}"

echo "$JSON_MAPPING" | python3 -m json.tool > "$OUTPUT_FILE" 2>/dev/null || echo "$JSON_MAPPING" > "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}✅ Mapping file created: ${OUTPUT_FILE}${NC}"
    echo ""
    echo -e "${BLUE}File contents:${NC}"
    cat "$OUTPUT_FILE"
    echo ""
else
    echo -e "${RED}❌ Failed to create mapping file${NC}"
    exit 1
fi

###############################################################################
# Display Results
###############################################################################

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                Test Users Created Successfully! ✅            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Created Test Users:${NC}"
echo ""
echo "  Username         | Password          | Description"
echo "  -----------------|-------------------|----------------------------------"
echo "  testsuperadmin   | SuperAdmin123!    | Superadmin (no clan)"
echo "  testowner        | ClanOwner123!     | Clan owner for clan 54"
echo "  testadmin        | ClanAdmin123!     | Clan admin for clan 54"
echo "  testuser         | TestUser123!      | Basic user for clan 54"
echo "  testowner2       | ClanOwner2123!    | Clan owner for clan 55"
echo ""
echo -e "${YELLOW}⚠️  User ID Mapping File:${NC}"
echo "  ${OUTPUT_FILE}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Run database seed script to create user records in database"
echo "  2. The seed script will use the mapping file to set correct user IDs"
echo ""
echo "     cd database && npm run seed"
echo ""
