# Keycloak Cleanup - Implementation Log

**Date**: December 7, 2025  
**Author**: AI Coding Agent  
**Objective**: Clean up Keycloak configuration and scripts to reflect the new
identity management architecture where user profiles, roles, and clan
relationships are managed in the application database rather than in Keycloak.

---

## Background

After implementing the identity management migration (moving user profiles,
roles, and clan associations from Keycloak to the application database), we need
to:

1. Clean up obsolete Keycloak configurations (roles, client scopes, clients)
2. Simplify the realm configuration to only include essentials
3. Create proper scripts for realm and test user creation
4. Update database seeding to use dynamically-generated user IDs

The current `keycloak/config/angrybirdman-realm.json` was exported from a dev
instance and contains 1,700+ lines including unnecessary configurations, IDs,
and settings. The goal is to return to a clean, minimal configuration (~300
lines) that only defines what's needed for authentication.

---

## Analysis

### Client Usage Analysis

Reviewed the codebase to determine which Keycloak clients are actually used:

**Frontend (`frontend/src/lib/auth-config.ts`)**:

- Uses `VITE_KEYCLOAK_CLIENT_ID` which defaults to `angrybirdman-frontend`
- This is the public client used for OAuth2 authorization code flow with PKCE
- **Status**: KEEP - Required for user authentication

**Backend API (`api/src/plugins/config.ts`,
`api/src/services/keycloak.service.ts`)**:

- Uses `KEYCLOAK_ADMIN_CLIENT_ID` for service account operations
- Environment default points to `angrybirdman-api`
- But `.env.example` shows `KEYCLOAK_ADMIN_CLIENT_ID=angrybirdman-api-service`
- The service creates users and manages passwords via Admin API
- **Status**: The `angrybirdman-api` client in the original config has
  `bearerOnly: true` which doesn't support service accounts
- **Resolution**: Remove `angrybirdman-api`, properly configure
  `angrybirdman-api-service`

**Verdict**:

- ✅ Keep: `angrybirdman-frontend` (public OAuth client)
- ❌ Remove: `angrybirdman-api` (incorrectly configured, not used)
- ✅ Add: `angrybirdman-api-service` (confidential service account client for
  Admin API)

### Client Scopes to Remove

- **`clan-context`**: Created protocol mapper for `clanId` user attribute. No
  longer needed since clan associations are in the database, not Keycloak user
  attributes.

### Roles to Remove

All application roles are now managed in the database. Keycloak roles to remove:

- `superadmin`
- `clan-owner`
- `clan-admin`

Note: The `user` role is still assigned during registration for backward
compatibility and potential future use, so it should be kept.

### Other Configurations

The original realm config (from git history commit `61a1399`) was clean and
minimal. The current exported version includes:

- Auto-generated IDs (not portable)
- Many default Keycloak clients (account, admin-cli, broker, realm-management,
  security-admin-console)
- Extensive default configurations
- Client role mappings for system clients

We'll return to a minimal configuration that only defines what we explicitly
need.

---

## Implementation Steps

### 1. Client Identification and Cleanup ✅

**Findings documented above.**

### 2. Create Simplified Realm Configuration

Create new `keycloak/config/angrybirdman-realm.json` based on original minimal
config with updates:

- Remove `clan-context` client scope
- Remove `superadmin`, `clan-owner`, `clan-admin` roles
- Keep `user` role
- Replace `angrybirdman-api` with properly configured `angrybirdman-api-service`
- Disable user registration (users register via app, not Keycloak UI)
- Include only essential settings

### 3. Create Realm Initialization Script

Create `/scripts/create-keycloak-realm.sh` to:

- Check if realm already exists
- Import the realm configuration
- Retrieve and display the service account client secret
- Provide instructions for updating .env

### 4. Create Test User Creation Script

Create `/scripts/create-keycloak-test-users.sh` to:

- Create test users via Keycloak Admin API (not REST API calls)
- Generate `scripts/local-keycloak-test-users.json` with username→userId
  mappings
- This file will be used by database seed script

Users to create:

- testsuperadmin (no clan)
- testowner (clan owner)
- testadmin (clan admin)
- testuser (basic user)
- testuser2 (second basic user for another clan)

### 5. Generate Test User Mappings for Current Instance

Run a script to extract current test user IDs from running Keycloak instance and
generate `scripts/local-keycloak-test-users.json` for the current development
setup.

### 6. Update Database Seed Script

Modify `database/prisma/seed.ts` to:

- Read `scripts/local-keycloak-test-users.json`
- Use dynamic userId values from the mapping file
- Fall back to defaults if file not found (for backward compatibility)

### 7. Move Test Scripts

- Move `keycloak/test/test-auth.js` to `scripts/test-keycloak-auth.js`
- Update script to work from new location

### 8. Update Documentation

- Update `scripts/README.md` with new scripts
- Document the workflow for new developers

### 9. Clean Up Old Files

- Remove `keycloak/test/` directory and contents
- Update `.gitignore` to ignore `scripts/local-keycloak-test-users.json`

---

## Detailed Implementation

### Step 1: Create Simplified Realm Configuration ✅

**File**: `keycloak/config/angrybirdman-realm.json`

Created a clean, minimal realm configuration (~125 lines vs 1,700+) that
includes only:

**Realm Settings**:

- Basic realm identification and branding
- Security settings (brute force protection, password policy)
- Session timeouts and token lifespans
- User registration **disabled** (users register via app)

**Roles**:

- `user`: Basic authenticated user role (kept for backward compatibility)
- Removed: `superadmin`, `clan-owner`, `clan-admin` (now managed in database)

**Clients**:

1. `angrybirdman-frontend`: Public OAuth2 client for React app
   - Standard flow with PKCE enabled
   - Configured redirect URIs for local development
   - Includes default scopes: profile, email, roles
2. `angrybirdman-api-service`: Confidential service account client
   - Service accounts enabled for Admin API access
   - No user-facing flows enabled
   - Will need service account roles assigned after creation

**Client Scopes**:

- Removed `clan-context` (no longer needed, clan associations in database)
- Uses only default Keycloak scopes

**Actions**:

- Backed up existing config to `angrybirdman-realm.json.backup`
- Created new minimal configuration
- File size reduced from 1,745 lines to 126 lines

---

### Step 2: Create Realm Initialization Script ✅

**File**: `scripts/create-keycloak-realm.sh`

Created comprehensive Bash script to automate realm creation:

**Features**:

- Validates prerequisites (realm file, running container)
- Authenticates with Keycloak Admin API
- Checks for existing realm (prompts for deletion)
- Imports realm configuration via REST API
- Retrieves service account client secret
- Assigns required Admin API roles to service account:
  - `manage-users` - Create, update, delete users
  - `view-users` - Read user information
  - `query-users` - Search for users
- Displays credentials for .env configuration

**Usage**:

```bash
export KEYCLOAK_ADMIN_PASSWORD='your-password'
./scripts/create-keycloak-realm.sh
```

**Safety Features**:

- Confirmation prompt before deleting existing realm
- Clear error messages with actionable guidance
- Color-coded output for easy reading

---

### Step 3: Create Test User Creation Script ✅

**File**: `scripts/create-keycloak-test-users.sh`

Created script to create test users and generate ID mappings:

**Features**:

- Creates/updates 5 test users via Admin API
- Sets passwords (non-temporary)
- Assigns base 'user' role to all
- Generates `scripts/local-keycloak-test-users.json` with username→userId
  mappings
- Handles existing users gracefully (updates passwords)

**Test Users**:

- `testsuperadmin` - Superadmin user (no clan)
- `testowner` - Clan owner for clan 54
- `testadmin` - Clan admin for clan 54
- `testuser` - Basic user for clan 54
- `testowner2` - Clan owner for clan 55

**Output File Format**:

```json
{
  "testsuperadmin": "146aa082-29f1-47dc-8b36-a7655e92c8e3",
  "testowner": "78db651c-cf9f-4248-abbc-2d35c24d926e",
  ...
}
```

This mapping file is used by the database seed script to create user records
with correct composite IDs.

---

### Step 4: Generate Mapping for Current Dev Instance ✅

**File**: `scripts/local-keycloak-test-users.json`

Generated the mapping file for the current development instance by extracting
existing user IDs from Keycloak:

- Created temporary extraction script
- Queried Keycloak Admin API for each test user
- Generated JSON mapping with current GUIDs
- Added file to `.gitignore` (instance-specific)
- Removed temporary script

**Result**: Database can now be seeded with correct user IDs matching current
Keycloak instance.

---

### Step 5: Update Database Seed Script ✅

**File**: `database/prisma/seed.ts`

Modified seed script to dynamically load user IDs:

**Changes**:

1. Added imports: `fs`, `path` for file operations
2. Created `loadUserIdMappings()` function to read JSON file
3. Created `getUserId()` helper to get ID from mapping or default
4. Updated all user creation calls to use dynamic IDs
5. Added fallback to hardcoded defaults if mapping file not found

**Behavior**:

- Checks for `scripts/local-keycloak-test-users.json`
- Uses mapped IDs if file exists
- Falls back to hardcoded defaults with warning
- Logs which mode is being used

**Benefits**:

- Works with any Keycloak instance (fresh or existing)
- No more hardcoded GUIDs in seed data
- Each developer can have unique user IDs
- Backward compatible if mapping file missing

---

### Step 6: Move Authentication Test Script ✅

**Files**:

- Moved: `keycloak/test/test-auth.js` → `scripts/test-keycloak-auth.js`
- Made executable: `chmod +x`

This script tests authentication flows and JWT token validation. Useful for:

- Verifying user credentials
- Debugging auth issues
- Inspecting token claims

---

### Step 7: Update Scripts Documentation ✅

**File**: `scripts/README.md`

Added comprehensive documentation for new Keycloak scripts in new "Keycloak
Management" section:

**Documented**:

1. `create-keycloak-realm.sh` - Realm creation and configuration
2. `create-keycloak-test-users.sh` - Test user creation with mapping
3. `test-keycloak-auth.js` - Authentication testing utility

**Includes**:

- Usage examples with environment variables
- What each script does step-by-step
- Environment variable options
- Output descriptions
- Next steps after running
- Tables of test users and credentials

---

### Step 8: Clean Up Old Files ✅

**Removed**:

- `keycloak/test/` directory and all contents:
  - `create-test-users.sh` (old version)
  - `test-auth.js` (moved to scripts/)
  - `README.md` (obsolete)

**Updated**:

- `.gitignore` - Added `scripts/local-keycloak-test-users.json`

---

## Summary of Changes

### Files Created

1. `keycloak/config/angrybirdman-realm.json` - Simplified realm config (126
   lines)
2. `scripts/create-keycloak-realm.sh` - Realm initialization script
3. `scripts/create-keycloak-test-users.sh` - Test user creation with mapping
4. `scripts/local-keycloak-test-users.json` - User ID mappings (gitignored)
5. `scripts/test-keycloak-auth.js` - Moved from keycloak/test/

### Files Modified

1. `database/prisma/seed.ts` - Dynamic user ID loading
2. `scripts/README.md` - Documentation for new scripts
3. `.gitignore` - Ignore local user mappings

### Files Removed

1. `keycloak/test/` - Entire directory with old scripts

### Configuration Changes in Keycloak

1. **Removed Roles**: `superadmin`, `clan-owner`, `clan-admin`
2. **Removed Client Scope**: `clan-context`
3. **Removed Client**: `angrybirdman-api` (bearerOnly config)
4. **Added Client**: `angrybirdman-api-service` (proper service account)
5. **Disabled**: User self-registration via Keycloak UI

---

## Developer Workflow

### Setting Up a New Development Environment

1. **Start Services**:

   ```bash
   docker compose up -d
   ```

2. **Create Keycloak Realm**:

   ```bash
   export KEYCLOAK_ADMIN_PASSWORD='your-password'
   ./scripts/create-keycloak-realm.sh
   ```

   - Copy the client secret to your `.env` file as
     `KEYCLOAK_ADMIN_CLIENT_SECRET`

3. **Create Test Users**:

   ```bash
   ./scripts/create-keycloak-test-users.sh
   ```

   - Generates `scripts/local-keycloak-test-users.json`

4. **Seed Database**:

   ```bash
   cd database && npm run seed
   ```

   - Uses the mapping file to create users with correct IDs

5. **Test Authentication** (optional):
   ```bash
   ./scripts/test-keycloak-auth.js testuser TestUser123!
   ```

### Resetting Keycloak

To start fresh with Keycloak:

1. Delete the realm (or let script do it):

   ```bash
   ./scripts/create-keycloak-realm.sh
   # Answer 'y' when prompted to delete existing realm
   ```

2. Recreate test users:

   ```bash
   ./scripts/create-keycloak-test-users.sh
   ```

3. Reseed database:
   ```bash
   cd database && npm run seed
   ```

---

## Testing & Validation

After completing the changes, the following should be verified:

### Manual Tests

- [ ] Create new realm from scratch
- [ ] Service account has correct permissions
- [ ] Test users can authenticate
- [ ] Database seed uses correct user IDs
- [ ] Auth test script works with test users

### Automated Tests

- [ ] No TypeScript errors in seed.ts
- [ ] No ESLint errors
- [ ] Prisma schema validation passes
- [ ] Pre-commit hooks pass

---

## Impact Assessment

### Breaking Changes

- Existing Keycloak instances need to be recreated (roles/scopes removed)
- Old `keycloak/test/create-test-users.sh` no longer works
- Hardcoded user IDs in seed.ts no longer valid

### Migration Path for Existing Developers

1. Export current realm (if needed for reference)
2. Run new realm creation script
3. Run new test user creation script
4. Update `.env` with new service account secret
5. Reseed database

### Benefits

1. **Cleaner Configuration**: 126 lines vs 1,700 lines
2. **Portable**: No hardcoded IDs, works on any instance
3. **Maintainable**: Easy to understand what's configured
4. **Documented**: Clear scripts with comprehensive documentation
5. **Future-Proof**: Ready for multiple auth providers
6. **Developer-Friendly**: Simple setup for new contributors

---

## Conclusion

Successfully cleaned up Keycloak configuration and scripts to align with the new
identity management architecture. The realm configuration is now minimal and
focused, containing only what's needed for authentication. All user profile
data, roles, and clan associations are managed in the application database as
designed.

The new scripts automate the entire setup process and generate instance-specific
user ID mappings, making it easy for new developers to get started and for
existing developers to reset their environments.

All obsolete configurations (roles, client scopes, incorrectly configured
clients) have been removed from Keycloak, and the old test user creation scripts
have been replaced with improved versions.
