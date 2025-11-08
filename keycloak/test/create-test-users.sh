#!/bin/bash

# Angry Birdman - Keycloak Test User Creation Script
# This script creates test users for each role in the angrybirdman realm

set -e

CONTAINER_NAME="angrybirdman-keycloak"
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
    echo "  echo 'your-admin-password' > $ADMIN_PWD_FILE"
    echo "  chmod 600 $ADMIN_PWD_FILE"
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

echo "✅ Admin password loaded from $ADMIN_PWD_FILE"
echo ""

# Function to create a user
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
    docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh create users \
        -r $REALM \
        -s username=$username \
        -s email=$email \
        -s firstName=$firstname \
        -s lastName=$lastname \
        -s enabled=true \
        -s emailVerified=true \
        --no-config --server http://localhost:8080 --realm master \
        --user admin --password "$ADMIN_PASSWORD" 2>/dev/null || true
    
    # Get user ID
    USER_ID=$(docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh get users \
        -r $REALM -q username=$username --fields id \
        --no-config --server http://localhost:8080 --realm master \
        --user admin --password "$ADMIN_PASSWORD" 2>/dev/null | grep -o '"id" : "[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$USER_ID" ]; then
        echo "  ⚠️  User may already exist or creation failed"
        # Try to get existing user ID
        USER_ID=$(docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh get users \
            -r $REALM -q username=$username --fields id \
            --no-config --server http://localhost:8080 --realm master \
            --user admin --password "$ADMIN_PASSWORD" 2>/dev/null | grep -o '"id" : "[^"]*"' | cut -d'"' -f4 | head -1)
    fi
    
    if [ -n "$USER_ID" ]; then
        echo "  User ID: $USER_ID"
        
        # Set password
        docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh set-password \
            -r $REALM --username $username --new-password $password \
            --no-config --server http://localhost:8080 --realm master \
            --user admin --password "$ADMIN_PASSWORD" 2>/dev/null
        echo "  ✅ Password set"
        
        # Assign role
        docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh add-roles \
            -r $REALM --uusername $username --rolename $role \
            --no-config --server http://localhost:8080 --realm master \
            --user admin --password "$ADMIN_PASSWORD" 2>/dev/null
        echo "  ✅ Role '$role' assigned"
        
        # Set clanId attribute if provided
        if [ -n "$clan_id" ]; then
            docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh update users/$USER_ID \
                -r $REALM -s "attributes.clanId=$clan_id" \
                --no-config --server http://localhost:8080 --realm master \
                --user admin --password "$ADMIN_PASSWORD" 2>/dev/null
            echo "  ✅ Clan ID '$clan_id' set"
        fi
    else
        echo "  ❌ Failed to create or find user"
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
echo "You can now test authentication with these credentials."
echo ""
