#!/bin/bash

# Angry Birdman - Keycloak Test User Creation Script (REST API Version)
# This script creates test users for each role in the angrybirdman realm
# Uses Keycloak Admin REST API instead of kcadm.sh for better reliability

set -e

KEYCLOAK_URL="http://localhost:8080"
REALM="angrybirdman"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_PWD_FILE="${SCRIPT_DIR}/../config/.adminpwd"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Creating Test Users in Keycloak Realm: angrybirdman    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Read admin password from file
if [ ! -f "$ADMIN_PWD_FILE" ]; then
    echo "❌ Error: Admin password file not found at: $ADMIN_PWD_FILE"
    echo ""
    echo "Please create the file with your Keycloak admin password:"
    echo "  echo 'your-admin-password' > keycloak/config/.adminpwd"
    echo "  chmod 600 keycloak/config/.adminpwd"
    echo ""
    exit 1
fi

ADMIN_PASSWORD=$(cat "$ADMIN_PWD_FILE" | tr -d '\n\r')

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Error: Admin password file is empty"
    echo ""
    echo "Please add your Keycloak admin password to: $ADMIN_PWD_FILE"
    echo ""
    exit 1
fi

echo "✅ Admin password loaded from .adminpwd file"
echo ""

# Get admin access token
echo "🔑 Authenticating as admin..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo "❌ Error: Failed to obtain admin access token"
    echo "Response: $TOKEN_RESPONSE"
    echo ""
    echo "Please verify:"
    echo "  1. Keycloak is running (docker ps | grep keycloak)"
    echo "  2. Admin password in .adminpwd is correct"
    echo "  3. Keycloak is accessible at $KEYCLOAK_URL"
    echo ""
    exit 1
fi

echo "✅ Successfully authenticated as admin"
echo ""

# Function to create a user via REST API
create_user() {
    local username=$1
    local email=$2
    local firstname=$3
    local lastname=$4
    local password=$5
    local role=$6
    local clan_id=$7

    echo "Creating user: $username ($role role)"
    
    # Create user
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"$username\",
        \"email\": \"$email\",
        \"firstName\": \"$firstname\",
        \"lastName\": \"$lastname\",
        \"enabled\": true,
        \"emailVerified\": true
      }")
    
    HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "  ✅ User created successfully"
    elif [ "$HTTP_CODE" = "409" ]; then
        echo "  ⚠️  User already exists"
    else
        echo "  ❌ Failed to create user (HTTP $HTTP_CODE)"
        echo "  Response: $RESPONSE_BODY"
        echo ""
        return 1
    fi
    
    # Get user ID
    USER_DATA=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username&exact=true" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    USER_ID=$(echo "$USER_DATA" | jq -r '.[0].id // empty')
    
    if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
        echo "  ❌ Failed to retrieve user ID"
        echo ""
        return 1
    fi
    
    echo "  User ID: $USER_ID"
    
    # Set password
    PWD_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
      "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/reset-password" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"password\",
        \"value\": \"$password\",
        \"temporary\": false
      }")
    
    if [ "$PWD_RESPONSE" = "204" ]; then
        echo "  ✅ Password set"
    else
        echo "  ❌ Failed to set password (HTTP $PWD_RESPONSE)"
    fi
    
    # Get role ID
    ROLE_DATA=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/roles/$role" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    ROLE_ID=$(echo "$ROLE_DATA" | jq -r '.id // empty')
    ROLE_NAME=$(echo "$ROLE_DATA" | jq -r '.name // empty')
    
    if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "null" ]; then
        echo "  ❌ Failed to find role: $role"
    else
        # Assign role
        ROLE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
          "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "Content-Type: application/json" \
          -d "[{
            \"id\": \"$ROLE_ID\",
            \"name\": \"$ROLE_NAME\"
          }]")
        
        if [ "$ROLE_RESPONSE" = "204" ]; then
            echo "  ✅ Role '$role' assigned"
        else
            echo "  ❌ Failed to assign role (HTTP $ROLE_RESPONSE)"
        fi
    fi
    
    # Set clanId attribute if provided
    if [ -n "$clan_id" ]; then
        ATTR_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
          "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"attributes\": {
              \"clanId\": [\"$clan_id\"]
            }
          }")
        
        if [ "$ATTR_RESPONSE" = "204" ]; then
            echo "  ✅ Clan ID '$clan_id' set"
        else
            echo "  ❌ Failed to set clan ID (HTTP $ATTR_RESPONSE)"
        fi
    fi
    
    echo ""
}

# Create test users for each role type
echo "Creating test users..."
echo ""

# Superadmin user (no clan association)
create_user "testsuperadmin" "superadmin@angrybirdman.test" "Super" "Admin" "SuperAdmin123!" "superadmin" ""

# Clan Owner user (clan ID 1 - Angry Avengers from seed data)
create_user "testowner" "owner@angrybirdman.test" "Clan" "Owner" "ClanOwner123!" "clan-owner" "1"

# Clan Admin user (clan ID 1 - Angry Avengers)
create_user "testadmin" "admin@angrybirdman.test" "Clan" "Admin" "ClanAdmin123!" "clan-admin" "1"

# Basic user (clan ID 1 - Angry Avengers)
create_user "testuser" "user@angrybirdman.test" "Test" "User" "TestUser123!" "user" "1"

# Additional clan owner for different clan (clan ID 2 - Feather Fury from seed data)
create_user "testowner2" "owner2@angrybirdman.test" "Clan2" "Owner" "ClanOwner2123!" "clan-owner" "2"

echo "═══════════════════════════════════════════════════════════"
echo "Test user creation completed!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Created users:"
echo "  • testsuperadmin / SuperAdmin123!     (superadmin, no clan)"
echo "  • testowner      / ClanOwner123!      (clan-owner, clan 1)"
echo "  • testadmin      / ClanAdmin123!      (clan-admin, clan 1)"
echo "  • testuser       / TestUser123!       (user, clan 1)"
echo "  • testowner2     / ClanOwner2123!     (clan-owner, clan 2)"
echo ""
echo "You can now test authentication with these credentials using:"
echo "  cd /home/aford/projects/angrybirdman"
echo "  node keycloak/test/test-auth.js"
echo ""
