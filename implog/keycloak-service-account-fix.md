# Keycloak Service Account Configuration Fix

**Date**: November 16, 2025  
**Issue**: User registration failing with "unauthorized_client" error because
the Keycloak service account couldn't create users.

## Problem

The API server's service account (`angrybirdman-api-service`) was failing to
create users in Keycloak with "unauthorized_client" and 403 Forbidden errors.

### Root Causes

There were **two separate issues** that both needed to be fixed:

#### 1. Missing Client Roles Protocol Mapper

The service account's access token was missing the `resource_access` claim
containing client roles from the `realm-management` client. Without these roles
in the token, Keycloak's authorization checks failed even though:

1. The service account user had the roles assigned in the "Service Account
   Roles" tab
2. The service account user had the roles in the "Role Mappings" tab
3. "Full Scope Allowed" was enabled

The problem: The client only had a "realm roles" mapper which adds
`realm_access` to tokens, but NOT a "client roles" mapper to add
`resource_access`.

#### 2. Missing Environment Variables

The API server's `.env` file (`/api/.env`) was missing the Keycloak admin client
credentials:

- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`

Without these, the KeycloakService was falling back to the default client ID
`'angrybirdman-api'` (which doesn't exist), causing authentication failures.

## Solution

### Part 1: Create Service Account Client in Keycloak

1. **Create the Client**:
   - Go to **Clients** → **Create client**
   - **Client ID**: `angrybirdman-api-service`
   - **Client type**: OpenID Connect
   - Click **Next**
   - Enable **Client authentication**: ON
   - Enable **Service accounts roles**: ON
   - Click **Save**

2. **Get Client Secret**:
   - Go to **Credentials** tab
   - Copy the **Client secret** (you'll need this for the API's `.env` file)

3. **Assign Realm-Management Roles**:
   - Go to **Service Account Roles** tab
   - Click **Assign role**
   - Filter by clients → Select **realm-management**
   - Select the following roles:
     - `manage-users` (required to create/update users)
     - `query-users` (required to search for users)
     - `view-users` (required to view user details)
     - `view-realm` (optional but recommended)
     - `manage-realm` (optional but recommended)
     - `query-groups` (optional but recommended)
   - Click **Assign**

4. **Verify Service Account User Has Roles**:
   - Go to **Users** in the left menu
   - Search for `service-account-angrybirdman-api-service`
   - Click on that user
   - Go to **Role Mappings** tab
   - Filter by clients → Select **realm-management**
   - Verify the roles appear here (they should match what you assigned in
     step 3)

5. **Add Client Roles Protocol Mapper**:
   - Go to **Clients** → **angrybirdman-api-service**
   - Go to **Client Scopes** tab
   - Click on **angrybirdman-api-service-dedicated** (the dedicated client
     scope)
   - Go to **Mappers** tab
   - Click **"Add mapper"** → **"By configuration"** → **"User Client Role"**
   - Configure the mapper:
     - **Name**: `client roles`
     - **Client ID**: (leave empty - includes ALL client roles)
     - **Token Claim Name**: `resource_access.${client_id}.roles`
     - **Claim JSON Type**: `String`
     - **Add to ID token**: OFF
     - **Add to access token**: ON
     - **Add to userinfo**: OFF
     - **Multivalued**: ON
   - Click **Save**

### Part 2: Configure API Environment Variables

Add the service account credentials to `/api/.env`:

```properties
# Keycloak service account for API user management
KEYCLOAK_ADMIN_CLIENT_ID=angrybirdman-api-service
KEYCLOAK_ADMIN_CLIENT_SECRET=<your-client-secret-from-step-2>
```

**Important**: The API has its own `.env` file separate from the root `.env`
file. Both should have these credentials.

## Result

After adding the client roles mapper, the access token now correctly includes:

```json
{
  "resource_access": {
    "realm-management": {
      "roles": [
        "manage-users",
        "query-users",
        "view-users",
        "view-realm",
        "manage-realm",
        "query-groups"
      ]
    }
  }
}
```

### Test Results

✅ Service account authentication successful  
✅ Access token contains required roles  
✅ User management API calls succeed (GET /admin/realms/angrybirdman/users)  
✅ Service account can now create users via POST /api/users/register

## Key Lessons

1. **Service accounts use client_credentials grant** - no user password needed,
   authenticate with client ID + secret
2. **Service accounts create a user automatically** - a user named
   `service-account-<client-id>` is created when service account is enabled
3. **Client roles require a protocol mapper** - the "realm roles" mapper only
   adds `realm_access`, not `resource_access`
4. **Role assignment ≠ token inclusion** - roles must be both:
   - Assigned to the service account (via "Service Account Roles" tab)
   - Mapped to tokens via a protocol mapper (via "Mappers" in the dedicated
     client scope)
5. **Dedicated client scopes** - in Keycloak 23+, each client has a dedicated
   scope (`<client-id>-dedicated`) for client-specific mappers
6. **Keycloak admin permissions are client roles** - specifically roles of the
   `realm-management` client, not realm roles
7. **Multiple .env files** - the root `.env` and `/api/.env` are separate; API
   uses its own
8. **Token claim structure**:
   - Realm roles → `realm_access.roles` (added by "realm roles" mapper)
   - Client roles → `resource_access.<client>.roles` (added by "client roles"
     mapper)
   - Both mappers are needed for full role coverage

## Related Files

- `/api/src/services/keycloak.service.ts` - Service that uses the admin client
- `/api/test-keycloak-auth.ts` - Diagnostic test script
- `/.env` - Contains service account credentials (KEYCLOAK_ADMIN_CLIENT_ID,
  KEYCLOAK_ADMIN_CLIENT_SECRET)

## Testing & Verification

### Test Script

Created `/api/test-keycloak-auth.ts` to verify service account configuration:

- Authenticates with client_credentials grant
- Decodes and displays JWT token payload
- Verifies `resource_access` claim contains realm-management roles
- Tests user query API call (GET /admin/realms/angrybirdman/users)

Run with: `npx tsx test-keycloak-auth.ts`

### Expected Token Structure

A correctly configured service account token should include:

```json
{
  "resource_access": {
    "realm-management": {
      "roles": [
        "manage-users",
        "query-users",
        "view-users",
        "view-realm",
        "manage-realm",
        "query-groups"
      ]
    }
  },
  "realm_access": {
    "roles": [
      "default-roles-angrybirdman",
      "offline_access",
      "uma_authorization"
    ]
  }
}
```

## Automation TODO

For future automation of this setup (e.g., via Terraform, Keycloak CLI, or Admin
REST API):

1. **Create service account client** with:
   - Client authentication enabled
   - Service accounts roles enabled
   - Client credentials flow

2. **Assign realm-management roles** to the service account user:
   - manage-users, query-users, view-users (minimum required)
   - view-realm, manage-realm, query-groups (recommended)

3. **Add client roles protocol mapper** to the dedicated client scope:
   - Mapper type: `User Client Role`
   - Token claim name: `resource_access.${client_id}.roles`
   - Add to access token: ON
   - Multivalued: ON

4. **Extract and store client secret** in environment variables

5. **Verify token structure** by requesting a token and inspecting claims

## Status

✅ **RESOLVED** - User registration is now working correctly. Service account
successfully creates users in Keycloak and the registration flow completes
end-to-end.

## Next Steps

- Keep test script for troubleshooting (can delete later once fully stable)
- Continue with Epic 2.1 remaining stories (2.9-2.15)
- Add service account automation to infrastructure setup scripts
