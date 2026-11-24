# Keycloak Upgrade Implementation Plan

> **For agentic workers:** This document is an operational runbook, not
> permission to deploy. Follow the phases in order and stop at every gate. Do
> not merge either Dependabot PR, deploy to production, or remove persistent
> volumes without explicit authorization.

**Goal:** Upgrade Angry Birdman's local Docker Desktop, home-LAN test, and AWS
EC2 production Keycloak deployments to one verified Keycloak 26.8 patch release
without losing realm data or leaving authentication unusable.

**Architecture:** Prepare application and configuration compatibility first,
then upgrade the actual environments in this order: local development, the LAN
test server, and production EC2. Each environment uses its existing
PostgreSQL-backed Keycloak database; validate the migration and recovery
procedure in lower environments before applying the same version and
configuration to production.

**Tech Stack:** Keycloak 26.8.x, Docker Compose, PostgreSQL, Nginx, GitHub
Actions, React/TypeScript frontend, Fastify/TypeScript API.

**Spec:**
[Keycloak Upgrading Guide](https://www.keycloak.org/docs/latest/upgrading/index.html),
the version-specific migration notes for
[23.0](https://www.keycloak.org/docs/23.0.7/upgrading/index.html),
[24.0](https://www.keycloak.org/docs/24.0.5/upgrading/index.html),
[25.0](https://www.keycloak.org/docs/25.0.6/upgrading/index.html), and
[26.0](https://www.keycloak.org/docs/26.0.8/upgrading/index.html), plus this
repository's Docker Compose and realm configuration.

## Global Constraints

- Upgrade runtime environments only in this order: local development, home-LAN
  test, production EC2.
- The reviewed Dependabot PRs change image tags only: #15 changes local from
  23.0 to 26.8; #23 changes test and production from 25.0 to 26.8. Do not merge
  either PR unchanged.
- The currently reviewed upgrade guide documents 26.8.2. Before implementation,
  re-check the official guide and select a supported, explicit patch version; do
  not deploy the floating `26.8` tag. Record the image digest used in each
  environment.
- Back up and verify the Keycloak PostgreSQL database before each environment's
  first startup on the new version. Preserve the previous image and restore
  point until that environment passes its gate.
- Keycloak schema migration is not a downgrade path. Rollback means restoring
  the pre-upgrade Keycloak database and running the matching previous Keycloak
  image/configuration.
- Never run `docker compose down -v` or otherwise remove PostgreSQL or Keycloak
  named volumes during this upgrade.
- Do not trigger a production release or production `workflow_dispatch` until
  the production phase. The production workflow recreates the Compose stack and
  can start the Keycloak image named in the deployed Compose file.
- Do not commit populated environment files, database dumps, generated rendered
  Compose configurations, or credentials.

## Review Focus

- **Logout protocol compatibility:** Keycloak 26 removes legacy `redirect_uri`
  logout support and the related SPI settings. Test both normal logout and the
  disabled-account logout redirect using the OIDC RP-Initiated Logout parameters
  and a redirect URI registered for the client.
- **Admin REST API audience:** Keycloak 26.8.2 requires the `kc-admin-api`
  scope/audience for Admin REST API access. Verify service-account user
  creation, role assignment/removal, and password operations in both the
  imported realm and an already-existing realm.
- **Canonical URL and proxy headers:** Verify the issuer, discovery document,
  redirects, callback, cookies, and logout URLs use the correct local, LAN, or
  production URL and port; test production through Nginx/TLS.
- **Docker Desktop engine selection:** From the VS Code WSL terminal, confirm
  Docker commands target the Windows Docker Desktop engine, not another Docker
  daemon inside the VS Code WSL distribution. Confirm the expected containers
  and named volumes before running upgrade commands.
- **Database migration and recovery:** Verify backup checksums and rehearse a
  restore against an isolated database or disposable environment. Confirm
  rollback restores the old Keycloak database and old image together.

---

## 1. Current State and Upgrade Impacts

At the time this plan was written (2026-11-23), the repository has these runtime
versions and topologies:

| Environment       | Compose file                                            | Current image | Database / public endpoint                                                         |
| ----------------- | ------------------------------------------------------- | ------------: | ---------------------------------------------------------------------------------- |
| Local development | `docker-compose.yml` plus `docker-compose.override.yml` |          23.0 | PostgreSQL named volume; `http://localhost:8080`                                   |
| Home-LAN test     | `docker/docker-compose.test.yml`                        |          25.0 | `keycloak_test` database; `http://192.168.0.70:8000`                               |
| Production EC2    | `docker/docker-compose.prod.yml`                        |          25.0 | `keycloak` database; `https://www.angrybirdman.org:8443` via Nginx TLS termination |

Review the migration notes for every crossed release, not just the final patch.
Specific project impacts found:

1. **Logout must be updated before the server upgrade.**
   [The frontend logout helper](../frontend/src/lib/auth-config.ts) and
   [the disabled-account callback](../frontend/src/pages/CallbackPage.tsx)
   currently construct logout URLs with `redirect_uri`. Keycloak 26 removes that
   legacy parameter and removes the related `legacy-logout-redirect-uri` and
   `suppress-logout-confirmation-screen` SPI options. Update both flows to the
   supported RP-Initiated Logout form (use `post_logout_redirect_uri` and the
   appropriate client identification/token hint) and configure allowed
   post-logout redirect URIs for the frontend client in both realm
   configurations. Test that users are logged out and returned only to an
   allowed application URL.
2. **Hostname and reverse-proxy settings must be migrated.** `KC_PROXY=edge` is
   removed in Keycloak 26. The local Compose files also use old hostname flags;
   the production/test Compose files set the legacy proxy option. Use hostname
   v2. Production is served behind Nginx, which terminates TLS and supplies
   `X-Forwarded-*` headers: configure the appropriate
   `KC_PROXY_HEADERS=xforwarded` and fixed public URL for production. The test
   service is directly exposed on LAN port 8000, so configure its actual public
   URL and only trust proxy headers if the request path is in fact proxied.
   Local development is direct on port 8080 and should not trust proxy headers.
3. **Admin API service-account access needs the new scope.** The
   `angrybirdman-api-service` client has no default or optional client scopes in
   the [development realm](../keycloak/config/angrybirdman-realm.json) or
   [production realm](../keycloak/config-prod/angrybirdman-realm.json). Keycloak
   26.8.2 requires an Admin REST API audience and the built-in `kc-admin-api`
   scope for custom clients accessing that API. Assign `kc-admin-api` to the
   service client as a default scope in the declarative realm exports and in any
   already-provisioned realm; do not assume `--import-realm` reapplies changes
   to an existing realm in the persistent database. Check that the service
   account retains the required realm-management roles.
4. **Sessions and database load change.** Keycloak 25 introduced persistent
   sessions as an opt-in feature; Keycloak 26 persists user sessions by default.
   Review the 25.0 session-migration instructions for the local 23.0 deployment
   and rehearse the expected migration. Expect more PostgreSQL activity on
   login, refresh, and logout. Decide from rehearsal whether sessions survive;
   if not proven, schedule user reauthentication rather than risking the realm
   database.
5. **OIDC claim changes need regression tests.** Keycloak 25 adds the `basic`
   client scope and removes the `session_state` token claim. The application
   uses `sub` for its `keycloak:<sub>` user ID and has no discovered
   `session_state` dependency. Confirm the `sub` claim remains present and
   stable through login and refresh. The application's registration schema
   already requires usernames of at least three characters, consistent with the
   newer default Keycloak validation.
6. **Bootstrap-admin variables are deprecated.** Replace `KEYCLOAK_ADMIN` and
   `KEYCLOAK_ADMIN_PASSWORD` with `KC_BOOTSTRAP_ADMIN_USERNAME` and
   `KC_BOOTSTRAP_ADMIN_PASSWORD` in the Compose configuration and verify the
   intended bootstrap/recovery behavior. Existing realm administrators are not a
   substitute for a documented recovery path.
7. **Existing CI is not sufficient runtime validation.** The current CI checks
   do not start Keycloak or exercise the API against a real Keycloak instance. A
   passing PR check is necessary but not a replacement for the
   environment-specific smoke tests below.

## 2. Shared Preparation: Application Compatibility

Prepare and review a compatibility change before upgrading any shared remote
environment.

### Changes to make

- Update both application-initiated logout call sites to the supported Keycloak
  logout parameters. Add or update frontend tests for standard logout and
  disabled-account logout. Ensure the registered redirect URI is exact and
  environment-appropriate.
- Keep this shared application change compatible with the currently running
  Keycloak 23 and 25 versions. Do not change any environment's Keycloak image,
  hostname/proxy options, bootstrap-admin variables, or existing realm until
  that environment's own phase.
- Keep this application-compatibility change deployable independently.
  Production must be able to receive the frontend/API update while its Keycloak
  image and its existing Keycloak-specific Compose configuration are still on
  version 25.
- Re-read the 23.0, 24.0, 25.0, and 26.0 migration notes and the selected 26.8
  patch notes at implementation time. If any intervening release has an
  applicable migration step, add it to this runbook before deployment.

### Code/configuration acceptance gate

- Run the repository's lint, type-check, build, and frontend/API tests,
  including the new logout regression cases.
- In the local realm, allow the exact local post-logout redirect URI and
  exercise both logout paths against the currently supported Keycloak version
  before merging the application-compatibility change. Apply the corresponding
  realm change to test and production only in their respective phases.
- Confirm production remains on its current Keycloak image and that no `prod-*`
  release tag or production manual deployment is triggered during the local and
  test phases.

## 3. Phase One: Local Development on Docker Desktop

**Operator context:** The repository is open in Visual Studio Code using WSL on
Windows 11. Docker Desktop runs its engine in a separate WSL instance. Run the
following work from the repository's VS Code WSL terminal with Docker Desktop
WSL integration enabled for this WSL distribution. Docker commands must reach
the Docker Desktop engine; do not start or use a second Linux Docker daemon in
the development distribution.

### Before changing the local instance

1. Start Docker Desktop in Windows and confirm its WSL integration is enabled
   for the distribution running VS Code.
2. From the VS Code WSL terminal, inspect `docker context show`, `docker info`,
   and `docker ps`. Verify Docker Desktop's engine and the existing Angry
   Birdman containers are present. Do not switch contexts or proceed if the
   expected Postgres/Keycloak containers are not the ones shown.
3. From the repository root, inspect the merged local Compose configuration and
   `docker compose ... ps`. Confirm the Keycloak database name, image, port
   mapping, and existing named Postgres volume before touching the service.
4. Create a full Keycloak PostgreSQL backup with `scripts/backup-keycloak-db.sh`
   to a protected location outside the repository. Record the filename and
   SHA-256 checksum. Confirm the dump is non-empty and can be listed or restored
   into a separate disposable database. Do not add backups to Git.
5. Record the current image ID, container logs, realm/client/user counts, and
   whether local users can currently log in. Preserve the existing
   `postgres_data` and `keycloak_data` named volumes; never use `down -v`.

### Upgrade and validate

1. Update only the local Compose service to the pinned target image and migrate
   local hostname/proxy/bootstrap settings for Keycloak 26. Validate the merged
   local Compose model before starting the service; do not change the test or
   production image/configuration yet. After verifying the new settings, update
   the Keycloak configuration README.
2. Pull the pinned target Keycloak image through the verified Docker Desktop
   context.
3. Recreate only the local Keycloak service while keeping PostgreSQL and all
   volumes in place. Allow Keycloak to perform its supported database migration.
   Do not proceed if startup reports migration errors, missing configuration
   options, or an unhealthy readiness endpoint.
4. Verify the `angrybirdman` realm and clients are available. Confirm the
   frontend client permits the application's post-logout redirect URI. Confirm
   the service-account default scope includes `kc-admin-api` and that the
   service account still has the required realm-management roles. If the realm
   already existed and the import did not apply those changes, update the realm
   through the Keycloak Admin Console/Admin API and export the reviewed
   configuration afterward. Review and sanitize any export before committing it.
5. Run the local smoke tests:
   - Open
     `http://localhost:8080/realms/angrybirdman/.well-known/openid-configuration`;
     verify the issuer and endpoints use the expected local URL.
   - Complete browser login and authorization-code/PKCE callback; verify the API
     accepts the JWT and maps its `sub` to the existing `keycloak:<sub>` user.
   - Exercise registration and the API service account's Admin REST API
     operations, including role assignment and password change; confirm no 401
     from a missing audience/scope.
   - Refresh an authenticated session and perform normal logout. Exercise the
     disabled-account logout redirect if a safe test account is available.
     Verify the browser returns only to the registered application URL.
   - Restart only Keycloak and verify the expected session behavior. Record
     whether existing sessions survive; do not make persistence guarantees based
     solely on a successful new login.
   - Check Keycloak and PostgreSQL logs, health/readiness, and basic resource
     use for errors or unexpected database growth.
6. Keep the pre-upgrade database dump and old Keycloak image until the local
   environment passes all tests. If the test fails, stop and restore the old
   image and matching database before further work.

**Local exit gate:** The local upgrade is reproducible from the VS Code WSL
terminal against the Docker Desktop engine; realm and service-account checks
pass; all auth flows pass; backup/restore has been proven; no required local
data or volumes were lost. Only then change the test Compose image/configuration
to the same pinned target.

## 4. Phase Two: Home-LAN Test Server

The test deployment is the lab server at `192.168.0.70`, using
`docker/docker-compose.test.yml`, `.env.test`, PostgreSQL database
`keycloak_test`, and external Keycloak URL `http://192.168.0.70:8000`.

### Before changing the test instance

1. Confirm the local exit gate is recorded and the exact same Keycloak
   version/digest is selected for test.
2. Deploy and verify the application compatibility code against the existing
   test Keycloak 25 instance before upgrading it. Add the exact test application
   URL as an allowed post-logout redirect URI on the persisted frontend client
   first. Use the existing test release workflow only after reviewing its commit
   and expected image tag. The workflow pulls the repository's `main` branch on
   the server; verify that the server will receive the intended application and
   realm configuration.
3. Announce a short test maintenance window, prevent concurrent deployments, and
   confirm SSH access and the current rollback image/configuration.
4. Run `scripts/backup-test-server-db.sh` with an agreed retention setting. It
   backs up both the application database and `keycloak_test`. Verify both dump
   files and checksums, then copy them to protected storage separate from the
   server's Docker/Postgres volume. Rehearse the full rollback on an isolated
   clone: restore the Keycloak dump, start the previous Keycloak
   image/configuration against that restored database, and verify login and API
   checks. The generic `scripts/restore-keycloak-db.sh` hard-codes a
   container/database name; do not use it against test until its targets are
   verified and explicitly corrected for this environment.
5. Record running container/image IDs, database names, realm/client/user counts,
   service status, and a known-good login/API check. Pull, but do not delete,
   the old image. Do not remove any named volumes.

### Upgrade and validate

1. Update the test Compose Keycloak image and migrate its
   hostname/proxy/bootstrap settings. Validate the test Compose model with the
   test example environment file before deployment. Keycloak is directly
   published on port 8000 in the current Compose file; it must advertise the
   externally reachable LAN URL and must not trust forwarded headers unless a
   trusted proxy is actually in the path.
2. Deploy the test Compose change to the pinned Keycloak version and
   start/recreate only the Keycloak service. Keep PostgreSQL, Valkey,
   application containers, and volumes running unless a tested instruction
   explicitly requires otherwise.
3. Wait for the Keycloak readiness check. Inspect startup logs for
   database-migration errors and configuration warnings before re-enabling
   normal test use.
4. Verify the issuer and discovery endpoint use
   `http://192.168.0.70:8000/realms/angrybirdman`. Confirm the frontend client's
   persisted post-logout redirect URI and the service-account `kc-admin-api`
   scope in the persisted realm, not only in the JSON file.
5. Run the full test checklist: browser login/callback, password login if
   enabled, API token verification and user lookup, service-account
   registration/user lookup/role changes/password operations, token refresh,
   standard logout, disabled-account logout, and frontend redirect/cookie
   behavior. Verify users retain the same Keycloak subject IDs and local
   `keycloak:<sub>` associations.
6. Restart Keycloak once and verify the observed session behavior. Check health,
   logs, database connectivity/load, Nginx/app health checks, and representative
   application routes.
7. Keep the test environment under observation for an agreed soak period (at
   least one normal use cycle). Capture issues and fixes before proceeding.

### Test rollback

If any exit check fails, stop the test API from issuing new Keycloak requests,
stop the new Keycloak process, restore the pre-upgrade `keycloak_test` database
using a command verified for the test Compose service and database names,
restore the old Keycloak image/configuration, and restart Keycloak. Do not
attempt to run Keycloak 25 against a database already migrated by Keycloak 26.
Validate recovery with login and API checks before closing the incident.

**Test exit gate:** All migration and smoke tests pass, the service-account
Admin API check passes from the running API, the backup restore has been
rehearsed, and the agreed soak period completes without unresolved auth or data
issues. Production must remain untouched until this gate is explicitly approved.

## 5. Phase Three: Production EC2 in AWS

Production uses `docker/docker-compose.prod.yml`, `.env.prod`, PostgreSQL
database `keycloak`, and `https://www.angrybirdman.org:8443` via Nginx. This is
a planned maintenance-window deployment, not an unattended rolling change. The
normal production deployment workflow also deploys API/frontend images, runs
Prisma migrations, and recreates the Compose stack; it must not be used as an
unexamined Keycloak-only upgrade.

### Production readiness and preparation

1. Require written confirmation that the test exit gate passed, the rollback was
   rehearsed, the target version/digest is identical to test, and the migration
   notes were rechecked. Schedule a production maintenance window and notify
   users.
2. Add the exact production application URL as an allowed post-logout redirect
   URI on the persisted frontend client. Then deploy and verify the application
   compatibility changes while production Keycloak is still on its previous
   image and existing Keycloak-specific Compose configuration. Use the
   production deployment workflow only after reviewing its changes: it pulls
   `main`, runs application database migrations, and recreates services. Confirm
   the production Compose file still references the old Keycloak image for this
   deployment. Complete login, token refresh, Admin API, and logout checks
   against the old Keycloak version.
3. Only after that compatibility deployment is healthy, prepare a separate
   reviewed production cutover change for the Keycloak version,
   hostname/proxy/bootstrap configuration, and production realm scope. Do not
   create a `prod-*` release tag or dispatch the production workflow with the
   target Keycloak image.
4. In the maintenance window, stop or gate application traffic and pause
   scheduled/automated deployments. Connect to the EC2 host through the normal
   approved access path; do not place secrets in terminal logs or the upgrade
   record.
5. Verify the expected production Docker context/host, working directory
   `/opt/angrybirdman`, Compose file, `.env.prod` permissions, running Keycloak
   container, image ID, PostgreSQL service, and `keycloak` database.
6. Run `scripts/backup-prod-db.sh --verbose` before stopping Keycloak. Verify
   successful dumps and SHA-256 checksums for both the application and Keycloak
   databases. Copy the protected backups off the EC2 host to approved durable
   storage and verify their checksums there. Record the current production
   Compose commit and old Keycloak image digest. Retain the old image; do not
   prune it.
7. Confirm a tested restore procedure uses the correct production Compose
   PostgreSQL service, `keycloak` database, and credentials. Do not assume the
   generic `restore-keycloak-db.sh` targets are correct for production.

### Upgrade production Keycloak

1. Pause user traffic or put the application into its planned maintenance mode.
   Update the EC2 checkout to the reviewed production cutover commit without
   invoking the full production deployment workflow. Validate the rendered
   production Compose configuration and confirm it targets the intended Keycloak
   image, URL, proxy headers, bootstrap-admin variables, database, and realm
   file. Stop the old Keycloak service cleanly while leaving PostgreSQL running.
   Do not upgrade PostgreSQL or change its volume as part of this task.
2. Pull the exact target image by its pinned version/digest and update only the
   production Keycloak service. Use a Keycloak-only Compose action (not the
   whole production deploy workflow) so API/frontend images and unrelated
   services are not changed during the identity-provider migration.
3. Start Keycloak 26 with hostname v2 configured for
   `https://www.angrybirdman.org:8443`, HTTP enabled only on the private Docker
   network, `KC_PROXY_HEADERS=xforwarded` for Nginx's trusted forwarded headers,
   and the new bootstrap-admin environment variables. Ensure Nginx continues to
   send the correct forwarded host, protocol, and port. Keep Keycloak's internal
   API URL and the public issuer URL consistent with the API's configured issuer
   validation.
4. Watch Keycloak logs and health until the PostgreSQL schema migration
   completes. Stop immediately on migration errors, repeated restarts, invalid
   proxy/hostname warnings, or abnormal resource use; do not start application
   traffic while Keycloak is unhealthy.
5. Verify the public discovery document, issuer, HTTPS certificate and redirects
   through Nginx. Confirm the persisted production realm has `kc-admin-api` as a
   default scope on `angrybirdman-api-service` and that the service account
   retains the required permissions. Apply the scope through the Admin
   Console/Admin API if the realm import did not modify the existing realm;
   export/review the updated realm afterward without committing secrets.
6. With traffic still gated, run production smoke tests using an approved test
   account: browser login/callback, API token validation, registration or other
   safe user-management operation proving Admin API audience/scope, refresh,
   normal logout, disabled-account logout, and redirect/cookie handling. Verify
   existing user IDs still map to their application records and inspect the
   Keycloak/PostgreSQL logs.
7. Re-enable application traffic only after all checks pass. Monitor service
   health, authentication errors, database load, and backup/storage alerts
   through the agreed observation period. Do not remove the previous image,
   pre-upgrade backup, or rollback materials during the observation period.

### Production rollback

If the database migration fails or a critical smoke test fails:

1. Keep user traffic gated and stop the new Keycloak service.
2. Restore the pre-upgrade `keycloak` PostgreSQL database from the verified
   backup using the rehearsed production-specific procedure. Confirm the
   restored database is the pre-upgrade copy before starting Keycloak.
3. Restore the previous production Compose image/configuration and start the
   matching old Keycloak version. Do not run the old image against the upgraded
   schema and do not restore only the application database.
4. Verify Keycloak readiness, the expected issuer, user login, API JWT
   validation, and service-account operations. Re-enable traffic only when the
   old version and restored database are working together.
5. Preserve failed-upgrade logs and the target database/backup for diagnosis. Do
   not retry until the cause is understood and the plan/gate is updated.

**Production completion gate:** The target image digest, migration logs, backup
identifiers/checksums, test evidence, operator, and completion time are recorded
in the deployment record. Authentication and Admin API checks pass, the
monitoring period completes without unresolved issues, and the rollback assets
remain available under the agreed retention policy.

## 6. Upgrade Record

Complete this record separately for each environment. Do not include passwords,
client secrets, tokens, or database dumps.

| Field                                                          | Local Docker Desktop | LAN test | Production EC2 |
| -------------------------------------------------------------- | -------------------- | -------- | -------------- |
| Upgrade date/operator                                          |                      |          |                |
| Previous Keycloak version and image digest                     |                      |          |                |
| Target Keycloak version and image digest                       |                      |          |                |
| Compose/code commit                                            |                      |          |                |
| Keycloak DB backup filename and checksum                       |                      |          |                |
| Application DB backup filename and checksum (where applicable) | N/A                  |          |                |
| Restore rehearsal / rollback evidence                          |                      |          |                |
| Startup/schema migration result                                |                      |          |                |
| Admin REST API scope/audience result                           |                      |          |                |
| Login, refresh, logout, and user-ID checks                     |                      |          |                |
| Session behavior and database/resource observations            |                      |          |                |
| Exit gate approved by/date                                     |                      |          |                |
