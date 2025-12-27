# Final Initialization - Future Work

## Overview

This document captures the challenges and lessons learned from attempting to
automate final environment initialization (Keycloak user creation and database
seeding) as part of the CI/CD deployment pipeline.

## Goal

Create an automated initialization process for deployed environments that would:

1. Create the "superadmin" user in Keycloak with proper credentials
2. Seed the database with essential data (action codes, system settings,
   superadmin profile)
3. Run idempotently (check if already initialized to avoid errors on subsequent
   deployments)
4. Execute automatically as part of the GitHub Actions deployment pipeline

## Attempted Solution

### Initial Approach

Created two scripts:

- `scripts/finish-init.sh` - Bash orchestration script that:
  - Validates environment prerequisites
  - Authenticates with Keycloak Admin API
  - Checks if superadmin user exists (idempotent check)
  - Creates superadmin user via Keycloak API
  - Runs database initialization script via `docker compose run`

- `scripts/finish-init-database.ts` - TypeScript script that:
  - Connects to PostgreSQL via Prisma
  - Seeds action codes (HOLD, WARN, KICK, RESERVE, PASS)
  - Seeds system settings (nextBattleStartDate, schedulerEnabled)
  - Creates superadmin user profile linked to Keycloak sub

### Challenges Encountered

#### 1. Network Connectivity Issues

**Problem**: Initial attempts to reach Keycloak from the initialization script
failed with connection errors.

**Attempts**:

- Tried `localhost:8000` - failed (container isolation)
- Tried `host.docker.internal` - failed (not supported on Linux)
- Tried Docker bridge gateway `172.17.0.1:8000` - failed
- Finally used host machine IP `192.168.0.70:8000` - worked

**Resolution**: Used host machine IP address. Added network diagnostics step to
pipeline for debugging.

#### 2. Keycloak Health Endpoint

**Problem**: Health check endpoint `/health/ready` returned 404 errors.

**Resolution**: Switched to using `/realms/master` endpoint which always exists
in Keycloak.

#### 3. KEYCLOAK_HOSTNAME Configuration

**Problem**: Setting `KEYCLOAK_HOSTNAME=localhost` caused Keycloak to generate
redirect URLs pointing to `localhost` instead of the server's IP address,
breaking authentication flows.

**Resolution**: Removed the override and used the value from `.env.test` which
correctly specified the server's IP.

#### 4. Module Resolution with Mounted Volumes

**Problem**: When trying to run TypeScript scripts by mounting the `docker/`
directory as a volume, the container couldn't resolve npm packages like
`@prisma/adapter-pg` and `pg`.

**Attempts**:

- Dynamic imports with `await import()` - failed with top-level await error
- Moved dynamic imports into async function - still couldn't find modules

**Root Cause**: Mounted external directories don't have access to `node_modules`
in the container.

**Resolution**: Moved scripts from `docker/` to `scripts/` directory which is
included in the Docker image build.

#### 5. Docker Multi-Stage Build Issue

**Problem**: After moving scripts to `scripts/` directory, the script file
couldn't be found at runtime
(`ERR_MODULE_NOT_FOUND: Cannot find module '/app/scripts/finish-init-database.ts'`).

**Root Cause**: The `scripts/` directory was copied in the **builder stage** but
not in the **production stage** of the multi-stage Dockerfile. The final
production image didn't include the scripts.

**Attempted Fix**: Added scripts directory, database/generated directory, and
tsx package to production image.

**Result**: Initialization succeeded, but broke the API container startup with
error:

```
Error: Cannot find module '/app/api/dist/api/src/index.js'
```

#### 6. Production Image Contamination

**Problem**: Adding initialization-specific dependencies (tsx, TypeScript source
files) to the production API image broke the normal application startup and
violated the principle of keeping production images lean and focused.

**Decision**: Reverted all changes to Dockerfile.api and removed initialization
steps from the deployment pipeline.

## Lessons Learned

### Technical Insights

1. **Docker Networking on Linux**: `host.docker.internal` is not available on
   Linux. Must use host machine IP or Docker bridge IPs for inter-container
   communication from host runners.

2. **Multi-Stage Docker Builds**: Be careful about which artifacts are copied
   from builder to production stages. Files copied in builder stage are not
   automatically available in production stage.

3. **Production vs. Development Dependencies**: Initialization scripts and
   TypeScript tooling (tsx) are development-time concerns and don't belong in
   production images.

4. **Module Resolution**: Scripts with npm package dependencies can't be run
   from mounted volumes - they need to be part of the image or have their own
   node_modules.

5. **Idempotency**: Initialization scripts must check if work is already done to
   safely re-run on every deployment.

### Strategic Insights

1. **Separation of Concerns**: Application runtime and deployment initialization
   are separate concerns that should be handled separately.

2. **Image Purpose**: The API Docker image should contain only what's needed to
   run the API server, not deployment tooling.

3. **Init Container Pattern**: A proper solution would use a separate
   initialization container/job that:
   - Has its own Dockerfile with necessary dependencies
   - Runs once before main application deployment
   - Contains TypeScript/Node tooling without affecting production images
   - Can be cleanly separated from the API container

## Future Work

### Recommended Approach

Create a dedicated initialization container:

1. **New Dockerfile** (`docker/Dockerfile.init`):
   - Based on Node.js image
   - Contains initialization scripts
   - Includes tsx, Prisma client, and other needed dependencies
   - Separate from production API image

2. **Separate Image Build**:
   - Build and push init image alongside API and frontend images
   - Tag appropriately for versioning

3. **Pipeline Integration**:
   - Add step to pull/run init container before main deployment
   - Run as one-off job: `docker run --rm init-image`
   - No volume mounts needed - everything in image
   - Fail deployment if initialization fails

4. **Benefits**:
   - Clean separation of concerns
   - No contamination of production images
   - Proper dependency management
   - Can version initialization logic independently
   - Easy to test locally

### Alternative: Manual Initialization

For now, initialization remains a manual step:

1. SSH to test server
2. Run initialization scripts manually when needed
3. Scripts remain in repository for reference (`scripts/finish-init.sh`,
   `scripts/finish-init-database.ts`)

This is acceptable for a test environment but not ideal for production
deployments.

## Files Created

The following scripts were created and remain in the repository for future work:

- `scripts/finish-init.sh` - Bash orchestration script
- `scripts/finish-init-database.ts` - TypeScript database seeding script

These scripts are functional and tested, but are not currently part of the
automated deployment pipeline.

## Status

**Current State**: Initialization is manual, performed outside of the deployment
pipeline.

**Target State**: Automated initialization via dedicated init container (future
work).

**Priority**: Medium - test environment can function with manual initialization;
automation would improve reliability and reduce setup time.

## Related Issues

- Docker image tagging: Fixed to always tag as `latest` for test deployments
- Keycloak health endpoints: Use `/realms/master` instead of `/health/ready`
- Network accessibility: Use host IP `192.168.0.70` for Keycloak from runner
