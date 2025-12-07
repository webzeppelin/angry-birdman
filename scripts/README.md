# Angry Birdman - Development Scripts

This directory contains shell scripts for common development and deployment
workflows.

## Available Scripts

### Database Management

#### reset-db.sh

Completely reset and reinitialize the database with fresh migrations and seed
data.

```bash
# Interactive mode (asks for confirmation)
./scripts/reset-db.sh

# Skip confirmation
./scripts/reset-db.sh --yes

# Reset without seeding
./scripts/reset-db.sh --no-seed

# Combination
./scripts/reset-db.sh -y -n
```

**Use Cases:**

- Starting fresh after schema changes
- Resetting to a known state for testing
- Clearing corrupted data during development

**What it does:**

1. Runs Prisma migrate reset (drops DB, recreates, runs migrations)
2. Seeds database with sample data (unless --no-seed)
3. Validates database schema
4. Shows summary of seeded data

#### backup-db.sh

Create a timestamped backup of the PostgreSQL database.

```bash
# Create SQL backup
./scripts/backup-db.sh

# Create compressed SQL backup
./scripts/backup-db.sh --compress

# Custom format (pg_restore compatible)
./scripts/backup-db.sh --format custom

# Data only (no schema)
./scripts/backup-db.sh --data-only

# Schema only (no data)
./scripts/backup-db.sh --schema-only

# Custom output directory
./scripts/backup-db.sh --output /path/to/backups
```

**Backup Formats:**

- `sql` (default) - Plain SQL file, human-readable
- `custom` - PostgreSQL custom format, compressed, pg_restore compatible
- `tar` - Tar archive format

**Features:**

- Automatic timestamp in filename
- SHA-256 checksum generation
- Backup statistics and file size reporting
- Lists recent backups

**Default Output:** `./backups/angrybirdman_full_YYYYMMDD_HHMMSS.sql`

#### restore-db.sh

Restore the database from a backup file.

```bash
# Restore from backup (asks for confirmation)
./scripts/restore-db.sh backups/angrybirdman_full_20241108_143022.sql

# Skip confirmation
./scripts/restore-db.sh backup.sql --yes

# Drop database before restore
./scripts/restore-db.sh backup.sql --clean

# Restore data only
./scripts/restore-db.sh backup.sql --data-only
```

**Supported Formats:**

- `.sql` - Plain SQL files
- `.sql.gz` - Compressed SQL files (auto-detected)
- `.dump` - PostgreSQL custom format
- `.tar` - PostgreSQL tar format

**Features:**

- Checksum verification (if .sha256 file exists)
- Shows before/after database statistics
- Validates restored schema
- Automatic format detection

**Safety:**

- Requires confirmation unless --yes flag
- Shows current database state before overwriting
- Validates backup file exists before starting

### Keycloak Management

#### create-keycloak-realm.sh

Create and configure the Angry Birdman realm in Keycloak with all necessary
clients and service account permissions.

```bash
# Create realm (requires admin password)
export KEYCLOAK_ADMIN_PASSWORD='your-admin-password'
./scripts/create-keycloak-realm.sh

# Or pass via environment inline
KEYCLOAK_ADMIN_PASSWORD='your-password' ./scripts/create-keycloak-realm.sh
```

**Environment Variables:**

- `KEYCLOAK_URL` - Keycloak base URL (default: http://localhost:8080)
- `KEYCLOAK_ADMIN_USER` - Admin username (default: admin)
- `KEYCLOAK_ADMIN_PASSWORD` - Admin password (required)

**What it does:**

1. Validates prerequisites (realm file exists, Keycloak running)
2. Authenticates with Keycloak admin
3. Checks if realm already exists (prompts to delete if found)
4. Imports realm configuration from `keycloak/config/angrybirdman-realm.json`
5. Retrieves service account client secret
6. Assigns required Admin API permissions to service account:
   - manage-users
   - view-users
   - query-users
7. Displays client credentials for .env configuration

**Created Clients:**

- `angrybirdman-frontend` - Public OAuth2 client for React frontend
- `angrybirdman-api-service` - Confidential service account for user management

**Output:**

- Service account client ID and secret
- Instructions for updating .env file

**Next Steps:** Run `create-keycloak-test-users.sh` to create test users

#### create-keycloak-test-users.sh

Create test users in Keycloak and generate a mapping file for database seeding.

```bash
# Create test users (requires admin password)
export KEYCLOAK_ADMIN_PASSWORD='your-admin-password'
./scripts/create-keycloak-test-users.sh
```

**Environment Variables:**

- `KEYCLOAK_URL` - Keycloak base URL (default: http://localhost:8080)
- `KEYCLOAK_ADMIN_USER` - Admin username (default: admin)
- `KEYCLOAK_ADMIN_PASSWORD` - Admin password (required)

**What it does:**

1. Authenticates with Keycloak
2. Creates or updates test users with passwords
3. Assigns 'user' role to all test users
4. Generates `scripts/local-keycloak-test-users.json` mapping file

**Test Users Created:**

| Username       | Password       | Description            |
| -------------- | -------------- | ---------------------- |
| testsuperadmin | SuperAdmin123! | Superadmin (no clan)   |
| testowner      | ClanOwner123!  | Clan owner for clan 54 |
| testadmin      | ClanAdmin123!  | Clan admin for clan 54 |
| testuser       | TestUser123!   | Basic user for clan 54 |
| testowner2     | ClanOwner2123! | Clan owner for clan 55 |

**Output File:**

- `scripts/local-keycloak-test-users.json` - Username to Keycloak subject ID
  mapping
- This file is used by `database/prisma/seed.ts` to create user records with
  correct IDs
- File is gitignored (each dev instance has unique IDs)

**Next Steps:** Run database seed to create user records in database

#### test-keycloak-auth.js

Test authentication flows and JWT token validation for Keycloak users.

```bash
# Test authentication for a user
./scripts/test-keycloak-auth.js testuser TestUser123!

# Use with different Keycloak instance
KEYCLOAK_URL=https://keycloak.example.com ./scripts/test-keycloak-auth.js testuser password

# Test with custom client
CLIENT_ID=my-client ./scripts/test-keycloak-auth.js testuser password
```

**Environment Variables:**

- `KEYCLOAK_URL` - Keycloak base URL (default: http://localhost:8080)
- `KEYCLOAK_REALM` - Realm name (default: angrybirdman)
- `CLIENT_ID` - Client ID to use (default: angrybirdman-frontend)

**What it does:**

1. Authenticates user with password grant
2. Retrieves access token and refresh token
3. Parses JWT claims
4. Tests token refresh
5. Displays decoded token information

**Use Cases:**

- Verifying user credentials work
- Debugging authentication issues
- Inspecting JWT token claims
- Testing token refresh flow

**Output:**

- Authentication success/failure
- Decoded JWT payload (iss, sub, preferred_username, email, roles)
- Token expiration times
- Refresh token test results

### Deployment Preparation

#### build-all.sh

Build all workspaces for production deployment in the correct dependency order.

```bash
# Standard production build
./scripts/build-all.sh

# Clean build (remove old artifacts)
./scripts/build-all.sh --clean

# Skip tests (faster, not recommended)
./scripts/build-all.sh --skip-tests

# Skip linting
./scripts/build-all.sh --skip-lint

# Full options
./scripts/build-all.sh --clean --skip-tests --skip-lint
```

**Build Order:**

1. Common library (dependency for api and frontend)
2. API server
3. Frontend application

**What it does:**

- Validates Node.js and npm versions
- Generates Prisma Client
- Runs linting (unless --skip-lint)
- Runs type checking
- Runs tests (unless --skip-tests)
- Builds all workspaces in dependency order
- Reports build sizes and timing
- Lists generated assets

**Output:**

- `common/dist/` - Compiled common library with TypeScript declarations
- `api/dist/` - Compiled API server
- `frontend/dist/` - Production-optimized frontend bundle

#### check-ready.sh

Comprehensive deployment readiness verification.

```bash
# Standard check
./scripts/check-ready.sh

# Check for specific environment
./scripts/check-ready.sh --env staging

# Strict mode (fail on warnings)
./scripts/check-ready.sh --strict
```

**Checks Performed:**

1. **Environment Configuration**
   - Node.js version >= 20
   - npm version >= 10
   - Dependencies installed
   - TypeScript and Prisma available

2. **Build Artifacts**
   - All workspaces built
   - TypeScript declarations generated
   - Frontend assets exist

3. **Code Quality**
   - ESLint passes
   - Prettier formatting passes
   - TypeScript type-check passes
   - No ignored TypeScript errors

4. **Testing**
   - Test suites exist
   - All tests pass
   - Coverage requirements met

5. **Security**
   - No high severity vulnerabilities
   - No hardcoded secrets
   - Environment variables documented

6. **Database**
   - Prisma schema valid
   - Migrations exist
   - Seed scripts present

7. **Configuration Files**
   - Docker Compose config
   - Package.json files valid
   - TypeScript/ESLint/Prettier configs

8. **Documentation**
   - README files present
   - Specifications exist
   - Implementation logs present

9. **Git Repository**
   - Repository initialized
   - Working directory clean
   - No uncommitted changes

10. **Infrastructure**
    - Keycloak configuration
    - Docker initialization scripts
    - CI/CD workflows

**Exit Codes:**

- `0` - Ready for deployment
- `1` - Not ready (failed checks)

**Output:**

- Detailed pass/fail for each check
- Summary statistics
- Pass rate percentage
- Actionable next steps

## Using with npm Scripts

All these scripts are also available via npm:

```bash
# Database operations
npm run db:reset-dev      # ./scripts/reset-db.sh
npm run db:backup         # ./scripts/backup-db.sh
npm run db:restore        # ./scripts/restore-db.sh <file>
npm run db:validate       # Run database validation tests

# Build and deployment
npm run build:all         # ./scripts/build-all.sh
npm run check:ready       # ./scripts/check-ready.sh

# Docker operations
npm run docker:up         # Start all Docker services
npm run docker:down       # Stop all Docker services
npm run docker:logs       # View Docker logs
npm run docker:ps         # List Docker containers
npm run docker:restart    # Restart Docker services
npm run docker:clean      # Remove all volumes and containers
```

## Prerequisites

All scripts require:

- **Docker Desktop** running with angrybirdman services
- **bash** shell (Linux, macOS, WSL2 on Windows)
- **Project root** as working directory
- **Node.js 20+** and **npm 10+** installed

## Script Conventions

### Exit Codes

- `0` - Success
- `1` - Error or failure

### Colors

- 🔵 Blue - Informational messages
- 🟡 Yellow - Warnings
- 🟢 Green - Success
- 🔴 Red - Errors

### Options

All scripts support:

- `-h, --help` - Show usage information
- Long-form options (e.g., `--clean`, `--yes`)
- Short-form aliases where applicable (e.g., `-y`, `-c`)

### Error Handling

Scripts use `set -e` to exit immediately on errors. This ensures:

- Failures don't cascade
- Exit codes are meaningful
- Automation pipelines fail fast

## Development Workflow Examples

### Starting a Development Session

```bash
# Start Docker services
npm run docker:up

# Reset database to known state
npm run db:reset-dev -- --yes

# Start development servers
npm run dev
```

### Before Committing Code

```bash
# Format code
npm run format

# Run linting
npm run lint:fix

# Run tests
npm run test

# Type check
npm run type-check
```

### Preparing for Deployment

```bash
# Create backup of production database
npm run db:backup -- --compress

# Clean build
npm run build:all -- --clean

# Run readiness check
npm run check:ready

# If all passes, proceed with deployment
```

### Database Maintenance

```bash
# Weekly backup (with compression)
npm run db:backup -- --compress --output ./backups/weekly

# Monthly full backup
npm run db:backup -- --format custom --output ./backups/monthly

# Test restore (to verify backups work)
npm run db:restore -- ./backups/test.sql --yes --clean
```

### Troubleshooting

```bash
# Reset everything
npm run docker:clean
npm run docker:up
npm run db:reset-dev -- --yes

# View logs
npm run docker:logs

# Check service status
npm run docker:ps
```

## CI/CD Integration

These scripts are designed to work in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Build application
  run: npm run build:all -- --skip-tests

- name: Run readiness check
  run: npm run check:ready --strict

- name: Create backup before deploy
  run: npm run db:backup -- --format custom
```

## Adding New Scripts

When creating new scripts:

1. Add shebang: `#!/usr/bin/env bash`
2. Set exit on error: `set -e`
3. Include header comment with usage
4. Support `--help` flag
5. Use consistent color codes
6. Make executable: `chmod +x scripts/your-script.sh`
7. Add npm script alias in root package.json
8. Document in this README

## Troubleshooting

### Permission Denied

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### PostgreSQL Not Running

```bash
# Check Docker status
npm run docker:ps

# Start services
npm run docker:up
```

### Script Not Found

```bash
# Ensure you're in project root
cd /path/to/angrybirdman

# Verify script exists
ls -la scripts/
```

### WSL2 Line Ending Issues

If scripts fail on Windows WSL2:

```bash
# Convert line endings
dos2unix scripts/*.sh

# Or use git to handle line endings
git config core.autocrlf input
git rm --cached -r .
git reset --hard
```

## Related Documentation

- [Database README](../database/README.md) - Database schema documentation
- [Implementation Plan](../specs/implementation-plan.md) - Step 4.3 Development
  Scripts
- [Docker README](../docker/README.md) - Docker infrastructure guide
- [Root README](../README.md) - Project overview

## Support

For issues or questions about these scripts:

1. Check script's `--help` output
2. Review this README
3. Check implementation logs in `/implog/`
4. Open an issue in the project repository
