# Keycloak Testing

This directory contains test scripts and utilities for validating the Keycloak configuration for Angry Birdman.

## Files

- **test-auth.js** - Node.js script to test authentication flows programmatically
- **create-test-users.sh** - Bash script to automatically create test users
- **README.md** - This file

## Creating Test Users

An automated script is provided to create all test users with proper roles, passwords, and attributes.

**Prerequisites**:
1. Create a file `keycloak/config/.adminpwd` containing your Keycloak admin password:
   ```bash
   echo 'your-admin-password-here' > keycloak/config/.adminpwd
   chmod 600 keycloak/config/.adminpwd
   ```
   
   Note: This file is excluded from version control via `.gitignore`

2. Ensure Keycloak is running:
   ```bash
   docker ps | grep keycloak
   ```

**Run the script**:
```bash
cd /path/to/angrybirdman
./keycloak/test/create-test-users.sh
```

The script will automatically create these test users:

| Username | Email | First Name | Last Name | Password | Role | Clan ID |
|----------|-------|------------|-----------|----------|------|---------|
| testsuperadmin | superadmin@angrybirdman.test | Super | Admin | SuperAdmin123! | superadmin | (none) |
| testowner | owner@angrybirdman.test | Clan | Owner | ClanOwner123! | clan-owner | 1 |
| testadmin | admin@angrybirdman.test | Clan | Admin | ClanAdmin123! | clan-admin | 1 |
| testuser | user@angrybirdman.test | Test | User | TestUser123! | user | 1 |
| testowner2 | owner2@angrybirdman.test | Clan2 | Owner | ClanOwner2123! | clan-owner | 2 |

**Note**: Clan IDs 1 and 2 correspond to the "Angry Avengers" and "Feather Fury" clans from the database seed data.

The script will:
- Authenticate using the admin password from `.adminpwd`
- Create each user with all required attributes
- Set passwords (non-temporary)
- Assign roles
- Set clan IDs where applicable
- Report success/failure for each operation

## Testing Authentication

Once test users are created, you can test authentication flows:

### Using the Test Script

```bash
# Test with specific user
TEST_USERNAME=testuser TEST_PASSWORD=TestUser123! node test-auth.js

# Test with environment variables
export TEST_USERNAME=testsuperadmin
export TEST_PASSWORD=SuperAdmin123!
node test-auth.js
```

### Manual Testing with cURL

Get an access token:

```bash
curl -X POST http://localhost:8080/realms/angrybirdman/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=angrybirdman-frontend" \
  -d "username=testuser" \
  -d "password=TestUser123!"
```

Decode the JWT token at https://jwt.io to inspect claims.

## Expected JWT Claims

When testing authentication, verify these claims are present in the access token:

- **sub** - User ID (UUID from Keycloak)
- **preferred_username** - Username
- **email** - User's email address
- **realm_access.roles** - Array of assigned roles
- **clanId** - Integer clan ID (for clan-associated users only)

### Example Token Claims

```json
{
  "sub": "12345678-1234-1234-1234-123456789012",
  "preferred_username": "testowner",
  "email": "owner@angrybirdman.test",
  "realm_access": {
    "roles": ["clan-owner", "default-roles-angrybirdman"]
  },
  "clanId": 1,
  "iat": 1699401600,
  "exp": 1699402500
}
```

## Testing User Registration

To test the self-registration flow:

1. Navigate to http://localhost:8080/realms/angrybirdman/protocol/openid-connect/auth?client_id=angrybirdman-frontend&redirect_uri=http://localhost:3000&response_type=code&scope=openid
2. Click "Register" at the bottom of the login form
3. Fill in registration details
4. Complete registration
5. Verify the user was created in the Admin Console
6. Assign appropriate role and clan ID as needed

## Troubleshooting

### "Client not allowed for direct access grants"

If you see this error, ensure the `angrybirdman-frontend` client has "Direct access grants" enabled:

1. Go to **Clients** → **angrybirdman-frontend** → **Settings** tab
2. Enable **Direct access grants**
3. Click **Save**

### "Invalid user credentials"

- Verify username and password are correct
- Check user is enabled in Keycloak
- Ensure password is not set as temporary

### Missing clanId in JWT

- Verify the user has the `clanId` attribute set
- Check that `clan-context` client scope is assigned to the client
- Verify the client scope includes the `clanId` protocol mapper

## Integration with Application

Once testing is complete, the frontend and API applications will:

1. **Frontend**: Use Authorization Code flow with PKCE for user authentication
2. **API**: Validate JWT tokens in the Authorization header
3. **Both**: Extract user ID, roles, and clanId from token claims for authorization

The direct access grants flow used in testing is **for development/testing only** and should not be used in production.
