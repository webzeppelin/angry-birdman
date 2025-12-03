# Dependency Upgrade Plan

## Overview

This document outlines the strategy and step-by-step plan for upgrading project
dependencies across all five package.json files in the Angry Birdman monorepo.
The upgrade plan prioritizes safety and stability by:

1. **Batching minor upgrades** - All minor version upgrades will be performed
   together in initial steps to reduce iteration cycles
2. **Isolating major upgrades** - Major version upgrades are performed
   individually to allow for focused testing and debugging
3. **Ordering by dependency hierarchy** - Major upgrades are sequenced based on
   cross-package dependencies and risk level
4. **Testing between steps** - Each step should be validated with test suites
   before proceeding to the next

### Upgrade Strategy

- **Minor Upgrades (v1.x.x → v1.y.x)**: Lower risk, typically backward
  compatible within the same major version. These will be batched by workspace.
- **Major Upgrades (v1.x.x → v2.x.x+)**: Higher risk, may introduce breaking
  changes. These require individual attention, migration guides review, and
  thorough testing.
- **Risk Assessment**: Major upgrades are ordered from lowest to highest risk:
  - Infrastructure/tooling changes (ESLint, Vitest, testing libraries) first
  - Framework dependencies (React, React Router, Tailwind) next
  - Core validation libraries (Zod) last due to cross-package impact

---

## Dependency Inventory

### Root Package (`/package.json`) - devDependencies Only

| Dependency                        | Current  | Target   | Type       |
| --------------------------------- | -------- | -------- | ---------- |
| @types/node                       | ^20.10.0 | ^24.10.1 | **MAJOR**  |
| @typescript-eslint/eslint-plugin  | ^7.0.0   | ^8.48.0  | **MAJOR**  |
| @typescript-eslint/parser         | ^7.0.0   | ^8.48.0  | **MAJOR**  |
| eslint                            | ^8.56.0  | ^9.39.1  | **MAJOR**  |
| eslint-config-prettier            | ^9.1.0   | ^10.1.8  | **MAJOR**  |
| eslint-import-resolver-typescript | ^3.10.1  | ^4.4.4   | **MAJOR**  |
| eslint-plugin-import              | ^2.29.1  | ^2.32.0  | MINOR      |
| eslint-plugin-react               | ^7.33.2  | ^7.37.5  | MINOR      |
| eslint-plugin-react-hooks         | ^4.6.0   | ^7.0.1   | **MAJOR**  |
| husky                             | ^9.0.0   | ^9.1.7   | MINOR      |
| lint-staged                       | ^15.2.0  | ^16.2.7  | **MAJOR**  |
| npm-run-all                       | ^4.1.5   | N/A      | No upgrade |
| prettier                          | ^3.2.0   | ^3.7.3   | MINOR      |
| prettier-plugin-tailwindcss       | ^0.5.11  | ^0.7.2   | MINOR      |
| typescript                        | ^5.3.0   | ^5.9.3   | MINOR      |

### API Workspace (`/api/package.json`)

#### Dependencies

| Dependency                      | Current | Target  | Type       |
| ------------------------------- | ------- | ------- | ---------- |
| @fastify/cookie                 | ^10.0.0 | ^11.0.2 | **MAJOR**  |
| @fastify/cors                   | ^10.0.0 | ^11.1.0 | **MAJOR**  |
| @fastify/helmet                 | ^12.0.0 | ^13.0.2 | **MAJOR**  |
| @fastify/jwt                    | ^9.0.0  | ^10.0.0 | **MAJOR**  |
| @fastify/rate-limit             | ^10.0.0 | ^10.3.0 | MINOR      |
| @fastify/swagger                | ^9.0.0  | ^9.6.1  | MINOR      |
| @fastify/swagger-ui             | ^5.0.0  | ^5.2.3  | MINOR      |
| @keycloak/keycloak-admin-client | ^26.4.4 | ^26.4.7 | PATCH      |
| @prisma/client                  | ^6.19.0 | ^7.0.1  | **MAJOR**  |
| axios                           | ^1.13.2 | N/A     | No upgrade |
| dotenv                          | ^17.2.3 | N/A     | No upgrade |
| fastify                         | ^5.0.0  | ^5.6.2  | MINOR      |
| fastify-plugin                  | ^5.1.0  | N/A     | No upgrade |
| fastify-type-provider-zod       | ^4.0.0  | ^6.1.0  | **MAJOR**  |
| jsonwebtoken                    | ^9.0.2  | N/A     | No upgrade |
| jwks-rsa                        | ^3.2.0  | N/A     | No upgrade |
| pino                            | ^10.1.0 | N/A     | No upgrade |
| pino-pretty                     | ^13.1.2 | ^13.1.3 | PATCH      |
| zod                             | ^3.22.4 | ^4.1.13 | **MAJOR**  |

#### devDependencies

| Dependency          | Current  | Target   | Type       |
| ------------------- | -------- | -------- | ---------- |
| @types/jsonwebtoken | ^9.0.10  | N/A      | No upgrade |
| @types/node         | ^20.10.0 | ^24.10.1 | **MAJOR**  |
| @vitest/coverage-v8 | ^1.6.1   | ^4.0.14  | **MAJOR**  |
| prisma              | ^6.19.0  | ^7.0.1   | **MAJOR**  |
| tsx                 | ^4.7.0   | ^4.21.0  | MINOR      |
| typescript          | ^5.3.0   | ^5.9.3   | MINOR      |
| vitest              | ^1.1.0   | ^4.0.14  | **MAJOR**  |

### Common Workspace (`/common/package.json`)

#### Dependencies

| Dependency | Current | Target  | Type      |
| ---------- | ------- | ------- | --------- |
| zod        | ^3.22.4 | ^4.1.13 | **MAJOR** |

#### devDependencies

| Dependency          | Current  | Target   | Type      |
| ------------------- | -------- | -------- | --------- |
| @types/node         | ^20.10.0 | ^24.10.1 | **MAJOR** |
| @vitest/coverage-v8 | ^1.6.1   | ^4.0.14  | **MAJOR** |
| typescript          | ^5.3.0   | ^5.9.3   | MINOR     |
| vitest              | ^1.1.0   | ^4.0.14  | **MAJOR** |

### Database Workspace (`/database/package.json`)

#### Dependencies

| Dependency     | Current | Target | Type      |
| -------------- | ------- | ------ | --------- |
| @prisma/client | ^6.19.0 | ^7.0.1 | **MAJOR** |

#### devDependencies

| Dependency  | Current  | Target   | Type      |
| ----------- | -------- | -------- | --------- |
| @types/node | ^20.10.0 | ^24.10.1 | **MAJOR** |
| prisma      | ^6.19.0  | ^7.0.1   | **MAJOR** |
| tsx         | ^4.7.0   | ^4.21.0  | MINOR     |
| typescript  | ^5.3.0   | ^5.9.3   | MINOR     |

### Frontend Workspace (`/frontend/package.json`)

#### Dependencies

| Dependency            | Current | Target   | Type       |
| --------------------- | ------- | -------- | ---------- |
| @heroicons/react      | ^2.2.0  | N/A      | No upgrade |
| @tanstack/react-query | ^5.17.0 | ^5.90.11 | MINOR      |
| axios                 | ^1.13.2 | N/A      | No upgrade |
| oidc-client-ts        | ^3.3.0  | ^3.4.1   | MINOR      |
| react                 | ^18.2.0 | ^19.2.0  | **MAJOR**  |
| react-dom             | ^18.2.0 | ^19.2.0  | **MAJOR**  |
| react-router-dom      | ^6.21.0 | ^7.10.0  | **MAJOR**  |
| recharts              | ^2.15.4 | ^3.5.1   | **MAJOR**  |
| zod                   | ^3.22.4 | ^4.1.13  | **MAJOR**  |

#### devDependencies

| Dependency                  | Current  | Target   | Type       |
| --------------------------- | -------- | -------- | ---------- |
| @testing-library/dom        | ^10.4.1  | N/A      | No upgrade |
| @testing-library/jest-dom   | ^6.1.5   | ^6.9.1   | MINOR      |
| @testing-library/react      | ^14.1.2  | ^16.3.0  | **MAJOR**  |
| @testing-library/user-event | ^14.5.1  | ^14.6.1  | MINOR      |
| @types/react                | ^18.2.45 | ^19.2.7  | **MAJOR**  |
| @types/react-dom            | ^18.2.18 | ^19.2.3  | **MAJOR**  |
| @vitejs/plugin-react        | ^4.2.1   | ^5.1.1   | **MAJOR**  |
| @vitest/coverage-v8         | ^1.6.1   | ^4.0.14  | **MAJOR**  |
| @vitest/ui                  | ^1.1.0   | ^4.0.15  | **MAJOR**  |
| autoprefixer                | ^10.4.16 | ^10.4.22 | MINOR      |
| jsdom                       | ^23.0.1  | ^27.2.0  | **MAJOR**  |
| msw                         | ^2.12.0  | ^2.12.3  | PATCH      |
| postcss                     | ^8.4.32  | ^8.5.6   | MINOR      |
| tailwindcss                 | ^3.4.0   | ^4.1.17  | **MAJOR**  |
| typescript                  | ^5.3.0   | ^5.9.3   | MINOR      |
| vite                        | ^5.0.10  | ^7.2.6   | **MAJOR**  |
| vitest                      | ^1.1.0   | ^4.0.14  | **MAJOR**  |

---

## Step-by-Step Migration Plan

### Phase 1: Minor Version Upgrades

These steps batch all minor version upgrades by workspace to minimize iteration
cycles. Test suites should pass after each step.

#### Step 1.1: Root Package Minor Upgrades

**Packages affected:** `/package.json`

**Changes:**

```
eslint-plugin-import: ^2.29.1 → ^2.32.0
eslint-plugin-react: ^7.33.2 → ^7.37.5
husky: ^9.0.0 → ^9.1.7
prettier: ^3.2.0 → ^3.7.3
prettier-plugin-tailwindcss: ^0.5.11 → ^0.7.2
typescript: ^5.3.0 → ^5.9.3
```

**Testing:** Run `npm run lint` and `npm run format:check`

#### Step 1.2: API Workspace Minor Upgrades

**Packages affected:** `/api/package.json`

**Changes:**

```
Dependencies:
  @fastify/rate-limit: ^10.0.0 → ^10.3.0
  @fastify/swagger: ^9.0.0 → ^9.6.1
  @fastify/swagger-ui: ^5.0.0 → ^5.2.3
  @keycloak/keycloak-admin-client: ^26.4.4 → ^26.4.7 (patch)
  fastify: ^5.0.0 → ^5.6.2
  pino-pretty: ^13.1.2 → ^13.1.3 (patch)

devDependencies:
  tsx: ^4.7.0 → ^4.21.0
  typescript: ^5.3.0 → ^5.9.3
```

**Testing:** Run `npm run test --workspace=api` and
`npm run type-check --workspace=api`

#### Step 1.3: Common Workspace Minor Upgrades

**Packages affected:** `/common/package.json`

**Changes:**

```
devDependencies:
  typescript: ^5.3.0 → ^5.9.3
```

**Testing:** Run `npm run test --workspace=common` and
`npm run build --workspace=common`

#### Step 1.4: Database Workspace Minor Upgrades

**Packages affected:** `/database/package.json`

**Changes:**

```
devDependencies:
  tsx: ^4.7.0 → ^4.21.0
  typescript: ^5.3.0 → ^5.9.3
```

**Testing:** Run `npm run generate --workspace=database` and
`npm run validate --workspace=database`

#### Step 1.5: Frontend Workspace Minor Upgrades

**Packages affected:** `/frontend/package.json`

**Changes:**

```
Dependencies:
  @tanstack/react-query: ^5.17.0 → ^5.90.11
  oidc-client-ts: ^3.3.0 → ^3.4.1

devDependencies:
  @testing-library/jest-dom: ^6.1.5 → ^6.9.1
  @testing-library/user-event: ^14.5.1 → ^14.6.1
  autoprefixer: ^10.4.16 → ^10.4.22
  msw: ^2.12.0 → ^2.12.3 (patch)
  postcss: ^8.4.32 → ^8.5.6
  typescript: ^5.3.0 → ^5.9.3
```

**Testing:** Run `npm run test --workspace=frontend` and
`npm run build --workspace=frontend`

---

### Phase 2: Major Version Upgrades - Testing Infrastructure

Upgrade testing and tooling infrastructure first, as these have the least impact
on application code.

#### Step 2.1: Vitest v1 → v4 (All Workspaces)

**Packages affected:** `/api/package.json`, `/common/package.json`,
`/frontend/package.json`

**Breaking changes to review:**

- Vitest 4.x requires Node.js 24+
- New test runner architecture
- Configuration changes for coverage

**Changes:**

```
api/devDependencies:
  @vitest/coverage-v8: ^1.6.1 → ^4.0.14
  vitest: ^1.1.0 → ^4.0.14

common/devDependencies:
  @vitest/coverage-v8: ^1.6.1 → ^4.0.14
  vitest: ^1.1.0 → ^4.0.14

frontend/devDependencies:
  @vitest/coverage-v8: ^1.6.1 → ^4.0.14
  @vitest/ui: ^1.1.0 → ^4.0.15
  vitest: ^1.1.0 → ^4.0.14
```

**Migration notes:**

- Review vitest.config.ts files in each workspace
- Check for deprecated test APIs
- Update coverage configuration if needed
- Verify all test scripts work with new version

**Testing:** Run `npm run test` in all workspaces

#### Step 2.2: Node.js Types v20 → v24 (All Packages)

**Packages affected:** Root + all 4 workspaces

**Changes:**

```
root/devDependencies:
  @types/node: ^20.10.0 → ^24.10.1

api/devDependencies:
  @types/node: ^20.10.0 → ^24.10.1

common/devDependencies:
  @types/node: ^20.10.0 → ^24.10.1

database/devDependencies:
  @types/node: ^20.10.0 → ^24.10.1
```

**Migration notes:**

- This aligns with Node.js 24 LTS
- Review TypeScript compilation for new Node.js API types
- No runtime changes, only type definitions

**Testing:** Run `npm run type-check` in all workspaces

#### Step 2.3: ESLint v8 → v9 + TypeScript ESLint v7 → v8

**Packages affected:** `/package.json`

**Breaking changes to review:**

- ESLint 9 uses flat config format by default
- New rule defaults and deprecations
- TypeScript ESLint 8 requires ESLint 9

**Changes:**

```
root/devDependencies:
  @typescript-eslint/eslint-plugin: ^7.0.0 → ^8.48.0
  @typescript-eslint/parser: ^7.0.0 → ^8.48.0
  eslint: ^8.56.0 → ^9.39.1
  eslint-config-prettier: ^9.1.0 → ^10.1.8
  eslint-import-resolver-typescript: ^3.10.1 → ^4.4.4
  eslint-plugin-react-hooks: ^4.6.0 → ^7.0.1
  lint-staged: ^15.2.0 → ^16.2.7
```

**Migration notes:**

- Consider migrating to flat config (eslint.config.js)
- Review and update .eslintrc configuration files
- Check for deprecated rules
- Update lint-staged configuration if needed
- Test React hooks rules with new plugin version

**Testing:** Run `npm run lint` and fix any new warnings/errors

---

### Phase 3: Major Version Upgrades - Database Layer

Upgrade Prisma and database tooling before application layers.

#### Step 3.1: Prisma v6 → v7

**Packages affected:** `/api/package.json`, `/database/package.json`

**Breaking changes to review:**

- Prisma 7 schema changes
- Client generation updates
- Migration format changes

**Changes:**

```
api/dependencies:
  @prisma/client: ^6.19.0 → ^7.0.1

api/devDependencies:
  prisma: ^6.19.0 → ^7.0.1

database/dependencies:
  @prisma/client: ^6.19.0 → ^7.0.1

database/devDependencies:
  prisma: ^6.19.0 → ^7.0.1
```

**Migration notes:**

- Review Prisma 7 migration guide
- Check schema.prisma for deprecated features
- Regenerate Prisma client: `npm run db:generate`
- Test all database operations
- Review existing migrations for compatibility

**Testing:**

- Run `npm run db:validate`
- Run API tests: `npm run test --workspace=api`
- Manually verify database connectivity

---

### Phase 4: Major Version Upgrades - Backend Infrastructure

Upgrade Fastify plugins and backend dependencies.

#### Step 4.1: Fastify Plugins (@fastify/\* v10 → v11+)

**Packages affected:** `/api/package.json`

**Changes:**

```
api/dependencies:
  @fastify/cookie: ^10.0.0 → ^11.0.2
  @fastify/cors: ^10.0.0 → ^11.1.0
  @fastify/helmet: ^12.0.0 → ^13.0.2
  @fastify/jwt: ^9.0.0 → ^10.0.0
```

**Migration notes:**

- All Fastify plugins upgraded to support Fastify 5.x
- Review each plugin's changelog for breaking changes
- Test authentication flows (JWT)
- Verify CORS configuration
- Test cookie handling
- Check security headers (helmet)

**Testing:**

- Run API test suite: `npm run test --workspace=api`
- Manual testing of authentication endpoints
- Verify CORS behavior in frontend integration

#### Step 4.2: fastify-type-provider-zod v4 → v6

**Packages affected:** `/api/package.json`

**Changes:**

```
api/dependencies:
  fastify-type-provider-zod: ^4.0.0 → ^6.1.0
```

**Migration notes:**

- This upgrade must happen before Zod v4
- Review schema validation in all routes
- Check for changes in error handling
- Verify type inference still works correctly

**Testing:** Run API tests with focus on request validation

---

### Phase 5: Major Version Upgrades - Frontend Build Tooling

Upgrade Vite and related build tools before React.

#### Step 5.1: Vite v5 → v7

**Packages affected:** `/frontend/package.json`

**Breaking changes to review:**

- Vite 7 requires Node.js 24+
- Build output changes
- Plugin API updates

**Changes:**

```
frontend/devDependencies:
  vite: ^5.0.10 → ^7.2.6
  @vitejs/plugin-react: ^4.2.1 → ^5.1.1
```

**Migration notes:**

- Review vite.config.ts for deprecated options
- Check build output structure
- Test HMR (Hot Module Replacement)
- Verify production build works

**Testing:**

- Run `npm run build --workspace=frontend`
- Start dev server: `npm run dev --workspace=frontend`
- Test production preview: `npm run preview --workspace=frontend`

#### Step 5.2: Tailwind CSS v3 → v4

**Packages affected:** `/frontend/package.json`

**Breaking changes to review:**

- Tailwind 4 has significant config changes
- New CSS-first configuration approach
- Utility class changes

**Changes:**

```
frontend/devDependencies:
  tailwindcss: ^3.4.0 → ^4.1.17
```

**Migration notes:**

- Review Tailwind 4 migration guide carefully
- Update tailwind.config.js to new format
- Check for removed/renamed utility classes
- Test all UI components for visual regressions
- Update prettier-plugin-tailwindcss if needed (already done in Step 1.1)

**Testing:**

- Visual regression testing across all pages
- Verify responsive layouts
- Check dark mode if implemented

#### Step 5.3: jsdom v23 → v27

**Packages affected:** `/frontend/package.json`

**Changes:**

```
frontend/devDependencies:
  jsdom: ^23.0.1 → ^27.2.0
```

**Migration notes:**

- Used by Vitest for DOM testing
- Check for DOM API changes
- Verify test compatibility

**Testing:** Run frontend test suite: `npm run test --workspace=frontend`

---

### Phase 6: Major Version Upgrades - React Ecosystem

Upgrade React and related libraries together.

#### Step 6.1: React v18 → v19

**Packages affected:** `/frontend/package.json`

**Breaking changes to review:**

- React 19 removes some legacy APIs
- New automatic batching behavior
- Concurrent features changes

**Changes:**

```
frontend/dependencies:
  react: ^18.2.0 → ^19.2.0
  react-dom: ^18.2.0 → ^19.2.0

frontend/devDependencies:
  @types/react: ^18.2.45 → ^19.2.7
  @types/react-dom: ^18.2.18 → ^19.2.3
  @testing-library/react: ^14.1.2 → ^16.3.0
```

**Migration notes:**

- Review React 19 changelog for breaking changes
- Update component code for deprecated APIs
- Check for new React Server Components features (may not apply)
- Testing Library 16 is compatible with React 19
- Test all React hooks usage
- Verify Suspense boundaries work correctly

**Testing:**

- Full frontend test suite
- Manual testing of all features
- Check for console warnings

#### Step 6.2: React Router v6 → v7

**Packages affected:** `/frontend/package.json`

**Breaking changes to review:**

- React Router 7 has significant API changes
- New data loading patterns
- Route definition changes

**Changes:**

```
frontend/dependencies:
  react-router-dom: ^6.21.0 → ^7.10.0
```

**Migration notes:**

- Review React Router 7 migration guide thoroughly
- Update route definitions
- Check data loading patterns
- Update navigation code
- Test all routing scenarios

**Testing:**

- Test all routes and navigation
- Verify nested routes work
- Check query parameters and navigation state
- Test authentication routing

#### Step 6.3: Recharts v2 → v3

**Packages affected:** `/frontend/package.json`

**Breaking changes to review:**

- Chart API changes
- Component prop changes

**Changes:**

```
frontend/dependencies:
  recharts: ^2.15.4 → ^3.5.1
```

**Migration notes:**

- Review Recharts 3 migration guide
- Update all chart components
- Test chart rendering with actual data
- Verify responsive behavior

**Testing:**

- Visual testing of all charts
- Test with various data sets
- Check tooltips and interactions

---

### Phase 7: Major Version Upgrades - Validation Layer

Upgrade Zod last as it affects all packages.

#### Step 7.1: Zod v3 → v4 (All Packages)

**Packages affected:** `/api/package.json`, `/common/package.json`,
`/frontend/package.json`

**Breaking changes to review:**

- Zod 4 has API changes
- Schema definition updates
- Error message changes

**Changes:**

```
api/dependencies:
  zod: ^3.22.4 → ^4.1.13

common/dependencies:
  zod: ^3.22.4 → ^4.1.13

frontend/dependencies:
  zod: ^3.22.4 → ^4.1.13
```

**Migration notes:**

- Review Zod 4 changelog for breaking changes
- Update all schema definitions in common package
- Test validation throughout the application
- Verify error messages are user-friendly
- Check integration with fastify-type-provider-zod
- Update type inference patterns if changed

**Testing:**

- Run full test suite in all packages
- Test form validation in frontend
- Test API request/response validation
- Verify shared schemas work across packages

---

## Validation Checklist

After completing all upgrade steps, perform the following comprehensive
validation:

### 1. Build Validation

- [ ] Root package builds: `npm run build`
- [ ] All workspaces build successfully
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Production builds work: Test API and frontend builds

### 2. Test Validation

- [ ] All unit tests pass: `npm run test`
- [ ] Coverage reports generate: `npm run test:coverage`
- [ ] API integration tests pass
- [ ] Frontend component tests pass

### 3. Linting & Formatting

- [ ] ESLint passes: `npm run lint`
- [ ] No ESLint errors (warnings acceptable)
- [ ] Prettier check passes: `npm run format:check`

### 4. Database Validation

- [ ] Prisma schema validates: `npm run db:validate`
- [ ] Can generate Prisma client: `npm run db:generate`
- [ ] Migrations work (test in dev environment)

### 5. Runtime Validation

- [ ] API server starts: `npm run dev --workspace=api`
- [ ] Frontend dev server starts: `npm run dev --workspace=frontend`
- [ ] Authentication flow works (Keycloak integration)
- [ ] Database queries work
- [ ] All API endpoints respond correctly

### 6. Integration Testing

- [ ] Frontend connects to API
- [ ] CORS configuration works
- [ ] JWT authentication works
- [ ] File upload/download works (if applicable)
- [ ] Charts render correctly
- [ ] Forms validate correctly
- [ ] Navigation works across all routes

### 7. Docker Environment

- [ ] Docker Compose builds: `docker-compose build`
- [ ] All containers start: `docker-compose up`
- [ ] Application works in containerized environment

---

## Rollback Strategy

If issues arise during any step:

1. **Identify the failing step** - Note which specific upgrade caused issues
2. **Rollback the specific package** - Revert only the problematic dependency
3. **Commit working state** - Ensure code is stable before proceeding
4. **Research the issue** - Review migration guides, GitHub issues, changelogs
5. **Create isolated test case** - Reproduce the issue in minimal setup
6. **Fix or defer** - Either fix the incompatibility or defer that upgrade
7. **Document blockers** - Note any dependencies that couldn't be upgraded and
   why

### Git Strategy

- Commit after each major step
- Use descriptive commit messages referencing this plan (e.g., "Step 2.1:
  Upgrade Vitest v1 → v4")
- Tag successful phase completions (e.g., `phase-1-complete`)
- Create a branch for the full upgrade: `dependency-upgrades-2024-12`

---

## Special Considerations

### Cross-Package Dependencies

The following packages are shared across workspaces and must be upgraded in
sync:

- **Zod**: Used in api, common, frontend - upgrade last (Step 7.1)
- **TypeScript**: Used in all packages - upgrade early (Step 1.x)
- **@types/node**: Used in all packages - upgrade after Vitest (Step 2.2)
- **Vitest**: Used in api, common, frontend - upgrade together (Step 2.1)
- **Prisma**: Used in api and database - upgrade together (Step 3.1)

### Breaking Change Hotspots

Areas most likely to need code changes:

1. **ESLint v9** - Configuration format changes
2. **Tailwind v4** - Configuration and utility class changes
3. **React Router v7** - Route definition and data loading changes
4. **React v19** - Deprecated API removals
5. **Zod v4** - Schema API changes affecting all packages

### Performance Notes

- Expect longer install times after major version bumps
- Node modules may increase in size
- Build times may change (usually improve with newer tooling)
- Consider clearing node_modules between major steps:
  `npm run clean && npm install`

---

## Timeline Estimate

- **Phase 1** (Minor upgrades): 2-3 hours
- **Phase 2** (Testing infrastructure): 3-4 hours
- **Phase 3** (Database layer): 2-3 hours
- **Phase 4** (Backend infrastructure): 2-3 hours
- **Phase 5** (Frontend build tooling): 4-6 hours (Tailwind v4 is complex)
- **Phase 6** (React ecosystem): 4-6 hours (React Router v7 requires care)
- **Phase 7** (Validation layer): 3-4 hours (Zod affects all packages)

**Total estimated time**: 20-29 hours

**Recommended approach**: Execute one phase per day with thorough testing
between phases.

---

## Resources

### Migration Guides to Review

- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19)
- [React Router v7 Migration Guide](https://reactrouter.com/upgrading/v7)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Zod v4 Release Notes](https://github.com/colinhacks/zod/releases)
- [Fastify v5 Migration Guide](https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/)

### Useful Commands

```bash
# Clean and reinstall
npm run clean && npm install

# Update specific workspace
npm install <package>@<version> --workspace=<workspace-name>

# Check outdated packages
npm outdated

# Audit dependencies
npm audit

# Run all tests
npm run test

# Build all packages
npm run build

# Type check all packages
npm run type-check
```

---

**Document Version**: 1.0  
**Created**: December 2, 2024  
**Last Updated**: December 2, 2024
