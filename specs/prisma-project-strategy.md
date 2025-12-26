# Prisma 7 Project Integration Strategy

**Version**: 1.0  
**Date**: December 25, 2024  
**Status**: Draft - Awaiting Review

---

## Executive Summary

This specification defines the correct approach for integrating Prisma ORM 7
into the Angry Birdman TypeScript monorepo. The goal is to establish a unified
strategy that works seamlessly in both local development (using `tsx` for rapid
iteration) and production deployment (using compiled JavaScript), while adhering
to Prisma 7 best practices.

### Core Problem

The project attempted to use Prisma 7 with a mix of strategies that created
incompatibilities:

- **Dynamic imports** to work around `tsx` limitations with namespace re-exports
- **Root-level generation** of Prisma client to `node_modules/.prisma/client`
- **Custom compilation scripts** to convert TypeScript Prisma client to
  JavaScript

These approaches violated Prisma 7's design principles and created a paradox:
changes that fixed local development broke CI/deployment, and vice versa.

### Solution Approach

Following Prisma 7 best practices, we will:

1. **Generate Prisma client as TypeScript source code** into
   `database/generated/prisma/`
2. **Import directly from the generated source** using standard ESM import
   syntax
3. **Let our build process compile Prisma client** along with the rest of our
   code
4. **Use driver adapters** for all database connections (as required by
   Prisma 7)

---

## 1. Understanding Prisma 7 Architecture

### 1.1 The Paradigm Shift from Prisma 6

**Prisma 6 (`prisma-client-js`)**:

- Generated into `node_modules/@prisma/client`
- Included pre-compiled Rust query engine binaries
- Worked as a "magic" npm package
- Used different binaries per platform

**Prisma 7 (`prisma-client`)**:

- Generates **TypeScript source code only** into a custom output directory
- No Rust query engines (lighter, faster)
- Requires **driver adapters** to connect to databases
- Designed to be compiled alongside your application code
- Gives full control and visibility over generated code

### 1.2 Why This Matters for Our Project

1. **No more pre-compiled packages**: Prisma client must be compiled by your
   build process
2. **Direct source imports**: Import from the TypeScript source, not from
   `node_modules`
3. **Single compilation strategy**: One approach that works for dev and prod
4. **Driver adapters required**: Must use `@prisma/adapter-pg` for PostgreSQL

---

## 2. Recommended Project Structure

### 2.1 File Organization

```
angrybirdman/
├── database/
│   ├── generated/
│   │   └── prisma/               # Prisma client output (NOT in git)
│   │       ├── client.ts         # Main client export
│   │       ├── browser.ts        # Browser-compatible types
│   │       ├── models.ts         # Model types
│   │       ├── enums.ts          # Enum types
│   │       └── ...               # Other generated files
│   ├── prisma/
│   │   ├── schema.prisma         # Schema definition
│   │   ├── migrations/           # Migration files
│   │   └── seed.ts               # Seed script
│   ├── index.ts                  # Re-exports Prisma client
│   ├── package.json
│   └── tsconfig.json
├── prisma.config.ts              # Prisma configuration
├── .gitignore                    # Ignore generated/
└── ...
```

### 2.2 Key Principles

1. **Generated client location**: Inside `database/generated/prisma/`
   - Makes it clear it's generated code
   - Keeps it close to schema definition
   - Easy to clean and regenerate

2. **Single source of truth**: `database/index.ts` re-exports from generated
   client
   - All code imports from `@angrybirdman/database`
   - Abstracts the generated location
   - Allows consistent imports across the monorepo

3. **Not in version control**: `database/generated/` should be in `.gitignore`
   - Following Prisma 7 recommendations
   - Generated during `npm install` or build
   - Prevents query engine binary conflicts (Prisma 7 still includes them in
     generated code)

---

## 3. Implementation Specification

### 3.1 Prisma Schema Configuration

**File**: `database/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ... rest of schema ...
```

**Changes from current setup**:

- ✅ Use `prisma-client` generator (already done)
- ✅ Keep `output` relative to schema file: `"../generated/prisma"`
- ❌ Remove any custom `engineType` or compilation configuration

### 3.2 Prisma Configuration File

**File**: `prisma.config.ts`

```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'database/prisma/schema.prisma',
  migrations: {
    path: 'database/prisma/migrations',
    seed: 'tsx database/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

**Changes from current setup**:

- ✅ Already correct - no changes needed

### 3.3 Database Package Entry Point

**File**: `database/index.ts`

```typescript
/**
 * Database package entry point
 *
 * Re-exports Prisma Client and types for use throughout the application.
 *
 * This file provides a stable import path that abstracts the actual
 * Prisma client generation location.
 */

// Import from generated Prisma client using relative path
export { PrismaClient, Prisma } from './generated/prisma/client';

// Re-export useful types for external consumers
export type {
  Clan,
  User,
  RosterMember,
  ClanBattle,
  // ... other model types as needed
} from './generated/prisma/client';
```

**Why this works**:

1. ✅ **Standard static imports**: No dynamic imports needed
2. ✅ **Type safety**: TypeScript understands the namespace structure
3. ✅ **Works with tsx**: Modern tsx handles this correctly
4. ✅ **Works with tsc**: Standard TypeScript compilation
5. ✅ **Works in production**: Compiles to JavaScript with proper exports

### 3.4 Prisma Client Instantiation

**File**: `database/client.ts` (new file)

```typescript
/**
 * Singleton Prisma Client instance
 *
 * This file creates and exports a single PrismaClient instance
 * configured with the appropriate driver adapter.
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/prisma/client';

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString,
  // Optional: Configure connection pool
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create and export Prisma Client instance
export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});
```

**File**: Update `database/index.ts` to also export the client instance:

```typescript
// ... existing exports ...

// Export singleton client instance
export { prisma } from './client';
```

**Why this approach**:

1. ✅ **Driver adapter required**: Prisma 7 mandates driver adapters
2. ✅ **Connection pooling**: Proper configuration for production
3. ✅ **Singleton pattern**: Reuses same client instance
4. ✅ **Environment-specific logging**: Helpful in dev, quiet in prod
5. ✅ **Graceful shutdown**: Properly closes connections

### 3.5 Usage in API and Scripts

**File**: `api/src/plugins/database.ts`

```typescript
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '@angrybirdman/database';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Attach Prisma client to Fastify instance
  fastify.decorate('prisma', prisma);

  // Close Prisma connection on app close
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
};

export default fp(databasePlugin);
```

**File**: Any API route or service:

```typescript
import type { Prisma } from '@angrybirdman/database';

// Use in route handler
fastify.get('/clans', async (request, reply) => {
  const clans = await fastify.prisma.clan.findMany();
  return clans;
});

// Use types
const where: Prisma.ClanWhereInput = {
  active: true,
  rovioId: { gt: 1000 },
};
```

### 3.6 Dependencies

**File**: `database/package.json`

```json
{
  "name": "@angrybirdman/database",
  "version": "0.1.0",
  "type": "module",
  "main": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./client": "./client.ts"
  },
  "scripts": {
    "generate": "cd .. && prisma generate",
    "migrate:dev": "cd .. && prisma migrate dev",
    "migrate:deploy": "cd .. && prisma migrate deploy",
    "studio": "cd .. && prisma studio"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.2.0",
    "@prisma/client": "^7.2.0",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "@types/pg": "^8.11.10",
    "prisma": "^7.2.0",
    "tsx": "^4.19.2",
    "typescript": "^5.9.3"
  }
}
```

**Changes**:

- ✅ Add `@prisma/adapter-pg` and `pg` as dependencies
- ✅ Add `@types/pg` as devDependency
- ❌ Remove custom compilation scripts
- ✅ Simplify `generate` script

---

## 4. Build and Deployment Strategy

### 4.1 Local Development Workflow

**With tsx (rapid development)**:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Run development servers (using tsx)
npm run dev
```

**How it works**:

- `tsx` runs TypeScript directly
- Imports from `database/generated/prisma/client.ts` work natively
- No compilation needed for rapid iteration
- Hot reloading works as expected

### 4.2 Production Build Workflow

**Build process**:

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma client (TypeScript)
npm run db:generate

# 3. Build common library
npm run build --workspace=common

# 4. Build API (includes compiling database imports)
npm run build --workspace=api

# 5. Build frontend
npm run build --workspace=frontend
```

**What happens**:

1. Prisma generates TypeScript source in `database/generated/prisma/`
2. Common library compiles to `common/dist/`
3. API compilation includes:
   - API source code → `api/dist/`
   - Database module imports compile with API code
   - Prisma client code is bundled/compiled by TypeScript
4. Final artifacts are pure JavaScript

### 4.3 TypeScript Compilation Configuration

**File**: `database/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true
  },
  "include": ["index.ts", "client.ts", "generated/**/*"],
  "exclude": ["node_modules", "dist", "prisma"]
}
```

**File**: `api/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../database" }, { "path": "../common" }],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Key points**:

- ✅ Use TypeScript project references for monorepo
- ✅ Include generated Prisma code in compilation
- ✅ Let TypeScript handle all compilation

### 4.4 Docker Build Strategy

**File**: `docker/Dockerfile.api`

```dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY api/package.json ./api/
COPY common/package.json ./common/
COPY database/package.json ./database/
COPY tsconfig.json prisma.config.ts ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY api/ ./api/
COPY common/ ./common/
COPY database/ ./database/
COPY scripts/ ./scripts/

# Generate Prisma client (TypeScript source)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run db:generate

# Build common library
RUN npm run build --workspace=common

# Build API (this compiles database imports too)
RUN npm run build --workspace=api

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY api/package.json ./api/
COPY common/package.json ./common/
COPY database/package.json ./database/
COPY prisma.config.ts ./

# Install production dependencies only
RUN npm ci --omit=dev

# Install Prisma CLI for migrations (needed at runtime)
RUN npm install prisma --workspace=database

# Copy built artifacts
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/common/dist ./common/dist

# Copy Prisma schema and migrations
COPY --from=builder /app/database/prisma ./database/prisma

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -f http://127.0.0.1:3001/health || exit 1

# Run with node (compiled JavaScript)
CMD ["node", "api/dist/api/src/index.js"]
```

**Key changes**:

- ❌ Remove copying of `node_modules/.prisma` (no longer generated there)
- ❌ Remove custom Prisma compilation scripts
- ✅ Let TypeScript compilation handle everything
- ✅ Simpler, more maintainable approach

### 4.5 CI/CD Configuration

**File**: `.github/workflows/ci.yml`

```yaml
type-check:
  name: Type Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '24.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate Prisma Client
      env:
        DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
      run: npm run db:generate

    - name: Run TypeScript type checking
      run: npm run type-check
```

**Changes**:

- ✅ Simplified - just generate and type-check
- ✅ No custom compilation steps needed

---

## 5. Migration Guide

### 5.1 Migration Steps

**Step 1: Update Prisma schema**

```bash
# Edit database/prisma/schema.prisma
# Change output to: output = "../generated/prisma"
```

**Step 2: Update database package**

```bash
cd database

# Install new dependencies
npm install @prisma/adapter-pg pg
npm install -D @types/pg

# Update package.json scripts (remove compilation)
# Create new client.ts file
# Update index.ts with static imports
```

**Step 3: Update .gitignore**

```bash
# Add to .gitignore:
database/generated/
```

**Step 4: Clean and regenerate**

```bash
# Remove old generated code
rm -rf node_modules/.prisma
rm -rf database/generated

# Regenerate Prisma client
npm run db:generate
```

**Step 5: Update all imports**

```bash
# Search and replace in all files:
# No changes needed! Still import from '@angrybirdman/database'
```

**Step 6: Test locally**

```bash
npm run dev
# Verify everything works with tsx
```

**Step 7: Test build**

```bash
npm run build
# Verify TypeScript compilation works
```

**Step 8: Test type-checking**

```bash
npm run type-check
# Verify no TypeScript errors
```

**Step 9: Test Docker build**

```bash
docker build -f docker/Dockerfile.api -t angrybirdman-api:test .
# Verify Docker build succeeds
```

### 5.2 Rollback Plan

If migration fails:

1. Revert schema.prisma changes
2. Restore old database/index.ts with dynamic imports
3. Regenerate with old settings: `npm run db:generate`
4. Run `git checkout database/` to restore files

**Emergency hotfix**: Use git to restore to last working commit of database
package.

---

## 6. Testing Strategy

### 6.1 Unit Tests

**No changes required** - existing tests will continue to work:

```typescript
import { prisma } from '@angrybirdman/database';

// Mock as before
vi.mock('@angrybirdman/database', () => ({
  prisma: {
    clan: {
      findMany: vi.fn(),
      // ... other methods
    },
  },
}));
```

### 6.2 Integration Tests

**Database tests** - verify Prisma client works:

```typescript
describe('Prisma Client', () => {
  it('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should perform queries', async () => {
    const clans = await prisma.clan.findMany({ take: 1 });
    expect(Array.isArray(clans)).toBe(true);
  });
});
```

### 6.3 Build Verification Tests

Add to CI:

```yaml
build-verification:
  name: Build Verification
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run db:generate
    - run: npm run build
    - name: Verify compiled output exists
      run: |
        test -f api/dist/api/src/index.js
        echo "Build artifacts verified"
```

---

## 7. Benefits of This Approach

### 7.1 Alignment with Prisma 7 Best Practices

✅ **Uses recommended `prisma-client` generator**  
✅ **Custom output directory as required**  
✅ **Driver adapters as mandated**  
✅ **Treats generated code as source, not artifact**  
✅ **Follows official documentation patterns**

### 7.2 Simplified Architecture

❌ **No more dynamic imports**  
❌ **No more custom compilation scripts**  
❌ **No more root-level generation**  
❌ **No more juggling between TypeScript and JavaScript**  
✅ **One build strategy for all environments**

### 7.3 Developer Experience

✅ **Fast local development with tsx**  
✅ **Full TypeScript type safety**  
✅ **Proper IDE autocomplete**  
✅ **Clear error messages**  
✅ **Easy to understand and maintain**

### 7.4 Production Ready

✅ **Compiled to optimized JavaScript**  
✅ **Smaller bundle size (no Rust engines)**  
✅ **Faster query execution**  
✅ **Proper connection pooling**  
✅ **Production-grade error handling**

---

## 8. Potential Issues and Solutions

### 8.1 Issue: tsx doesn't work with generated client

**Symptom**: `SyntaxError` when running with tsx

**Solution**:

- Ensure tsx is version 4.x or later
- Use Node.js 20+ which has better ESM support
- Verify `"type": "module"` is in all package.json files

### 8.2 Issue: TypeScript can't find types

**Symptom**: `Cannot find module` errors in IDE

**Solution**:

- Run `npm run db:generate` to create client
- Restart TypeScript server in IDE
- Check `tsconfig.json` includes generated directory

### 8.3 Issue: Build fails in CI

**Symptom**: TypeScript errors during `tsc` compilation

**Solution**:

- Ensure `db:generate` runs before type-check/build
- Verify DATABASE_URL is set (even dummy value works)
- Check all tsconfig.json files are properly configured

### 8.4 Issue: Runtime errors in production

**Symptom**: `Cannot find module` at runtime

**Solution**:

- Verify build artifacts include compiled Prisma client
- Check module resolution in package.json exports
- Ensure proper relative paths in imports

---

## 9. Long-term Maintenance

### 9.1 Upgrading Prisma

When upgrading Prisma ORM:

```bash
# 1. Update dependencies
npm install prisma@latest @prisma/client@latest @prisma/adapter-pg@latest

# 2. Clean and regenerate
rm -rf database/generated
npm run db:generate

# 3. Test thoroughly
npm run type-check
npm run test
npm run build
```

### 9.2 Adding New Models

When adding models to schema:

```bash
# 1. Edit schema
vim database/prisma/schema.prisma

# 2. Create migration
npm run db:migrate:dev -- --name add_new_model

# 3. Regenerate client (happens automatically with migrate:dev)
# No manual steps needed!

# 4. Use new types
import type { NewModel } from '@angrybirdman/database';
```

### 9.3 Monitoring Generated Code Size

Generated Prisma client can grow large with many models:

```bash
# Check size
du -sh database/generated/prisma

# If too large, consider:
# - Using Prisma's tree-shaking (import only what you need)
# - Splitting schema into multiple databases if appropriate
```

---

## 10. References

### 10.1 Official Documentation

- [Prisma 7 Generator Documentation](https://www.prisma.io/docs/orm/prisma-schema/overview/generators#prisma-client)
- [Upgrading to Prisma 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers#driver-adapters)

### 10.2 Example Projects

- [Prisma Examples Repository](https://github.com/prisma/prisma-examples)
- [Next.js 15 + Prisma 7 Starter](https://github.com/prisma/prisma-examples/tree/latest/typescript/nextjs-starter-webpack)

### 10.3 Related Issues

- [Prisma 7 Mapped Enums Issue #28591](https://github.com/prisma/prisma/issues/28591)

---

## 11. Approval and Next Steps

### 11.1 Review Checklist

Before implementing:

- [ ] Review this spec with team
- [ ] Verify all dependencies are compatible
- [ ] Test on local development environment
- [ ] Verify CI/CD pipeline changes
- [ ] Plan deployment strategy
- [ ] Prepare rollback procedures

### 11.2 Implementation Phases

**Phase 1: Local Setup** (Estimated: 2-4 hours)

- Update Prisma schema
- Create new database/client.ts
- Update database/index.ts
- Update .gitignore
- Test local development

**Phase 2: Build Configuration** (Estimated: 2-3 hours)

- Update tsconfig files
- Update Dockerfile
- Test production build locally

**Phase 3: CI/CD** (Estimated: 1-2 hours)

- Update GitHub Actions workflows
- Test CI pipeline
- Verify type-checking works

**Phase 4: Production Deployment** (Estimated: 1-2 hours)

- Deploy to test environment
- Verify functionality
- Monitor for issues
- Deploy to production if successful

**Total Estimated Time**: 6-11 hours

---

## 12. Conclusion

This specification provides a clear, maintainable path forward for integrating
Prisma 7 into the Angry Birdman project. By following Prisma's recommended
practices and eliminating custom workarounds, we achieve:

1. **Consistency**: Same code works in dev and production
2. **Simplicity**: No complex build scripts or dynamic imports
3. **Performance**: Leverages Prisma 7's performance improvements
4. **Maintainability**: Easy to understand and troubleshoot
5. **Future-proof**: Aligned with Prisma's long-term direction

The key insight is that **Prisma 7 treats generated code as source code**, not
as a pre-compiled package. Once we embrace this paradigm, everything else falls
into place naturally.

---

**Document Status**: Ready for Review  
**Next Action**: Team review and approval before implementation
