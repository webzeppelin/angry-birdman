# Prisma Client Deployment Issue

**Date**: December 24, 2024  
**Status**: Unresolved - Requires Research and Architectural Decision

## Problem Summary

The project is experiencing a fundamental incompatibility between local
development and CI/production deployment related to Prisma Client v7.2.0 usage
in a TypeScript monorepo environment.

### Core Issue

Prisma 7 generates TypeScript-only code (no compiled JavaScript), which creates
conflicting requirements:

1. **Local Development (tsx)**: Requires dynamic imports to work around tsx's
   inability to handle namespace re-exports
2. **CI Type-Checking (tsc)**: Requires static type information and proper
   namespace structure
3. **Production (Docker)**: Needs compiled JavaScript output

## Timeline of Changes

### Initial Setup (Pre-Pipeline)

- Prisma client generated in `database/node_modules/.prisma/client/`
- Local nested `node_modules` structure in database workspace
- Development worked with tsx for local dev

### Pipeline Development Changes

- Moved Prisma client generation to `node_modules/.prisma/client/` (root level)
- Customized Prisma compilation in CI/CD pipelines
- Changed `database/index.ts` to use dynamic imports to fix tsx runtime issues
- This broke TypeScript type-checking in CI

### Current State

- **Commit a4cfca4**: "fix: resolve Prisma client import issue in local dev"
  - Uses dynamic imports:
    `const module = await import('../node_modules/.prisma/client/client.js')`
  - Works locally with tsx
  - Breaks CI type-checking with 24+ TypeScript errors

## Specific Technical Challenges

### 1. Prisma Namespace Re-export Problem

**Issue**: tsx cannot handle this pattern:

```typescript
export { Prisma } from '../node_modules/.prisma/client/client';
```

**Error**:
`SyntaxError: The requested module does not provide an export named 'Prisma'`

**Root Cause**: tsx has known issues with namespace re-exports from certain
module structures

### 2. TypeScript Type Information Loss

**Issue**: Dynamic imports lose type information:

```typescript
const module = await import('../node_modules/.prisma/client/client.js');
export const PrismaClient = module.PrismaClient; // Type: any
export const Prisma = module.Prisma; // Type: any, not a namespace
```

**Consequences**:

- TypeScript sees `PrismaClient` as constructor, not instance type
- TypeScript doesn't recognize `Prisma` as a namespace
- Cannot use `Prisma.ModelWhereInput` patterns in type annotations

### 3. Constructor vs Instance Type Confusion

**Issue**: When exporting `const PrismaClient`, TypeScript infers it as a
constructor type, but code uses it for instance type annotations:

```typescript
// This fails because PrismaClient is the constructor, not the instance
const prisma: PrismaClient = new PrismaClient();
```

**Error**:
`'PrismaClient' refers to a value, but is being used as a type here. Did you mean 'typeof PrismaClient'?`

### 4. Dual Export Conflicts

**Attempted**: Export same name as both value and type:

```typescript
export const Prisma = module.Prisma; // Value export
export type { Prisma } from '...'; // Type export
```

**Error**: `Cannot redeclare exported variable 'Prisma'`

**Also Tried**: Type-only export causes runtime errors when code tries to access
Prisma as a value:

```typescript
const ErrorClass = Prisma.PrismaClientKnownRequestError; // Fails if Prisma is type-only
```

## Attempted Solutions (20+ Iterations)

### Attempt 1: Static Re-export with .js Extension

```typescript
export { PrismaClient, Prisma } from '../node_modules/.prisma/client/client.js';
```

- ✅ Type-checking passes
- ❌ tsx runtime fails (namespace re-export issue)

### Attempt 2: Static Re-export without Extension

```typescript
export { PrismaClient, Prisma } from '../node_modules/.prisma/client/client';
```

- ✅ Type-checking passes
- ❌ tsx runtime fails

### Attempt 3: Dynamic Import with Type Assertions

```typescript
import type { PrismaClient as PC, Prisma as P } from '...';
const module = await import('...js');
export const PrismaClient = module.PrismaClient as typeof PC;
export const Prisma = module.Prisma as typeof P;
```

- ❌ PrismaClient type still wrong (constructor vs instance)
- ❌ Prisma namespace structure lost

### Attempt 4: Separate Type Aliases

```typescript
export const PrismaClient = module.PrismaClient;
export type PrismaClientInstance = InstanceType<typeof PrismaClientConstructor>;
export const Prisma = module.Prisma;
export type Prisma = typeof PrismaNamespace; // Conflict!
```

- ❌ Cannot have same name for value and type export

### Attempt 5: PrismaClientInstance Type + Prisma Value/Type Dual Export

```typescript
export const PrismaClient = module.PrismaClient;
export type PrismaClientInstance = PrismaClientType;
export const Prisma = module.Prisma;
export type { Prisma } from '...'; // Conflict!
```

- ✅ PrismaClient issues resolved
- ❌ Prisma redeclaration error
- ❌ Cannot have both `export const` and `export type` with same name

### Attempt 6: Type Annotation on Const Export

```typescript
export const Prisma: typeof PrismaNamespace = module.Prisma;
```

- ✅ tsx runtime works
- ❌ TypeScript doesn't recognize namespace structure
- ❌ Error: "Cannot find namespace 'Prisma'" when using `Prisma.SomeType`

### Attempt 7: Direct Re-export from .ts Source

```typescript
export { Prisma } from '../node_modules/.prisma/client/client.ts';
```

- ✅ Type-checking passes
- ❌ tsx runtime fails (module resolution issues with .ts extension)

### Attempt 8: Dual Export - Const + Type-only

```typescript
export const Prisma = module.Prisma;
export type { Prisma } from '...';
```

- ❌ Redeclaration error
- ❌ Files using Prisma as value fail: "cannot be used as a value because it was
  exported using 'export type'"

## Files Affected (12 files changed in attempts)

### Core Export Files

- `database/index.ts` - Main entry point for database package

### API Service Files Needing PrismaClientInstance

- `api/src/plugins/database.ts`
- `api/src/routes/admin.ts`
- `api/src/routes/clans.ts`
- `api/src/services/audit.service.ts`
- `api/src/services/battle.service.ts`
- `api/src/services/battleScheduler.service.ts`
- `api/src/services/masterBattle.service.ts`

### Test Files

- `api/tests/setup.ts`
- `api/tests/teardown.ts`
- `api/tests/routes/master-battles.test.ts`
- `api/tests/services/masterBattle.service.test.ts`

## Error Patterns Encountered

### Pattern 1: Namespace Not Found

```
error TS2503: Cannot find namespace 'Prisma'.
195     const where: Prisma.ClanBattleWhereInput = {
                     ~~~~~~
```

**Cause**: Dynamic import doesn't preserve namespace structure

### Pattern 2: Constructor vs Instance Type

```
error TS2749: 'PrismaClient' refers to a value, but is being used as a type here. Did you mean 'typeof PrismaClient'?
```

**Cause**: Exporting constructor type when code needs instance type

### Pattern 3: Unused Import Warning

```
error TS6133: 'Prisma' is declared but its value is never read.
```

**Cause**: Importing Prisma as value when only used in type position (or vice
versa)

### Pattern 4: Type vs Value Conflict

```
error TS1362: 'Prisma' cannot be used as a value because it was exported using 'export type'.
```

**Cause**: Attempting to access runtime properties when only type export exists

### Pattern 5: Redeclaration Error

```
error TS2323: Cannot redeclare exported variable 'Prisma'.
```

**Cause**: Trying to export same name as both value and type

## Current Hypothesis

The fundamental issue is that **Prisma 7's TypeScript-only generation is
incompatible with tsx's module resolution limitations**, particularly around:

1. **Namespace re-exports**: tsx cannot properly handle `export { Prisma }` when
   Prisma is a complex namespace structure
2. **TypeScript-first design**: Prisma 7 expects compilation before runtime, but
   tsx tries to run TypeScript directly
3. **Monorepo complexity**: The root-level `.prisma/client` location may be
   causing module resolution confusion

## Potential Research Directions

1. **Prisma Configuration**:
   - Investigate Prisma's custom output paths
   - Explore pre-compilation strategies for Prisma client
   - Review Prisma 7 migration guides for monorepo setups

2. **Build Process Changes**:
   - Consider compiling Prisma client to JavaScript as a pre-dev step
   - Investigate if database package should be compiled before use
   - Explore using `tsup` or `tsc` to compile database package

3. **Alternative Runtime Loaders**:
   - Test with `ts-node` instead of tsx
   - Try `node --loader` with TypeScript loaders
   - Investigate if `tsx` has configuration options for namespace handling

4. **Monorepo Structure**:
   - Consider reverting to nested `node_modules` in database workspace
   - Explore different workspace linking strategies
   - Review whether Prisma client should be a separate compiled package

5. **Prisma Alternatives**:
   - Investigate if Prisma Client Extensions could help
   - Check if Prisma's `@prisma/client` edge client has different behavior
   - Review if downgrading to Prisma 6 would resolve issues

## Questions to Answer

1. How do other TypeScript monorepos handle Prisma 7 with tsx?
2. Is there a recommended Prisma 7 setup for monorepos that need both dev (tsx)
   and CI (tsc) workflows?
3. Should the database package be pre-compiled before development?
4. Is the root-level `.prisma/client` location causing the issues?
5. Would a completely different module resolution strategy work better?
6. Are there tsx configuration options we haven't explored?

## Next Steps

1. Research Prisma 7 monorepo best practices
2. Look for example projects using Prisma 7 + tsx + TypeScript
3. Review Prisma GitHub issues for similar problems
4. Consider architectural changes to database package structure
5. Evaluate if custom Prisma generation/compilation pipeline is needed
6. Test alternative TypeScript runtime loaders

## References

- Current commit that works locally: `a4cfca4`
- CI failure: GitHub Actions "Type Check" job
- Related files: `database/index.ts`, all service/route files using Prisma
- Error count at peak: 24+ TypeScript errors from attempted fixes
