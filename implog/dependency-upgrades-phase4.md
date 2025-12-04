# Dependency Upgrades - Phase 4: Backend Infrastructure

**Date:** December 3, 2024  
**Phase:** Phase 4 - Major Version Upgrades - Backend Infrastructure  
**Status:** ✅ Complete

---

## Overview

Successfully completed Phase 4 of the dependency upgrade plan, focusing on
upgrading backend infrastructure dependencies including Fastify plugins and the
Zod validation library. This phase also included an unplanned but necessary
upgrade of Zod from v3 to v4 across the API and common packages.

---

## Changes Implemented

### Step 4.1: Fastify Plugins Upgrade (@fastify/\* v10 → v11+)

**Package:** `/api/package.json`

**Dependencies upgraded:**

- `@fastify/cookie`: ^10.0.0 → ^11.0.2
- `@fastify/cors`: ^10.0.0 → ^11.1.0
- `@fastify/helmet`: ^12.0.0 → ^13.0.2
- `@fastify/jwt`: ^9.0.0 → ^10.0.0

**Status:** ✅ Complete

All Fastify plugins successfully upgraded to support Fastify 5.x. No breaking
changes encountered that required code modifications.

### Step 4.2: fastify-type-provider-zod v4 → v6

**Package:** `/api/package.json`

**Dependencies upgraded:**

- `fastify-type-provider-zod`: ^4.0.0 → ^6.1.0

**Additional upgrade required:**

- `zod`: ^3.22.4 → ^4.1.13 (API package)
- `zod`: ^3.22.4 → ^4.1.13 (common package)

**Status:** ✅ Complete

**Note:** The `fastify-type-provider-zod` v6 has a peer dependency on Zod v4,
which required upgrading Zod earlier than originally planned (was scheduled for
Phase 7). This created a cascading upgrade across shared packages.

---

## Zod v3 → v4 Migration

### Breaking Changes Addressed

Zod v4 introduced several API changes that required code modifications:

#### 1. `required_error` Parameter Removed

**Old API (Zod v3):**

```typescript
z.number({
  required_error: 'Field is required',
  invalid_type_error: 'Field must be a number',
});
```

**New API (Zod v4):**

```typescript
z.number({
  message: 'Field is required and must be a number',
});
```

**Files modified:**

- `/common/src/schemas/battle.ts` - Updated 27 schema definitions
- `/common/src/schemas/user-management.ts` - Updated 1 schema definition

#### 2. `invalid_type_error` Parameter Removed

Both `required_error` and `invalid_type_error` were consolidated into a single
`message` parameter in Zod v4.

#### 3. `z.enum` API Change

**Old API (Zod v3):**

```typescript
z.enum(['approve', 'reject'], {
  errorMap: () => ({ message: 'Action must be either approve or reject' }),
});
```

**New API (Zod v4):**

```typescript
z.enum(['approve', 'reject'], {
  message: 'Action must be either approve or reject',
});
```

#### 4. Error Object Property Renamed

**Old API (Zod v3):**

```typescript
error.errors; // Array of validation errors
```

**New API (Zod v4):**

```typescript
error.issues; // Array of validation issues
```

**Files modified:**

- `/api/src/middleware/errorHandler.ts` - Updated error handling
- `/api/src/routes/clans.ts` - Updated validation error responses (3 locations)

---

## Files Modified

### Common Package

1. `/common/src/schemas/battle.ts`
   - Updated `battleMetadataSchema`
   - Updated `clanPerformanceSchema`
   - Updated `opponentPerformanceSchema`
   - Updated `playerStatsInputSchema`
   - Updated `nonplayerStatsInputSchema`
   - Updated `battleEntrySchema`

2. `/common/src/schemas/user-management.ts`
   - Updated `adminRequestReviewSchema`

### API Package

1. `/api/src/middleware/errorHandler.ts`
   - Changed `error.errors` → `error.issues`

2. `/api/src/routes/clans.ts`
   - Changed `queryResult.error.errors` → `queryResult.error.issues` (GET route)
   - Changed `bodyResult.error.errors` → `bodyResult.error.issues` (POST route)
   - Changed `bodyResult.error.errors` → `bodyResult.error.issues` (PATCH route)

---

## Testing Results

### Common Package Tests

```
✓ tests/period-calculations.test.ts (24 tests)
✓ tests/calculations.test.ts (48 tests)
✓ tests/date-formatting.test.ts (38 tests)
✓ tests/schemas.test.ts (33 tests)

Test Files  4 passed (4)
Tests       143 passed (143)
```

### API Package Tests

```
✓ tests/routes/clans.test.ts (20 tests)
✓ tests/infrastructure.test.ts (3 tests)

Test Files  2 passed (2)
Tests       23 passed (23)
```

### Type Checking

- ✅ Common package: `tsc --noEmit` passed
- ✅ API package: `tsc --noEmit` passed

---

## Migration Challenges

### Challenge 1: Unexpected Zod v4 Upgrade

**Issue:** `fastify-type-provider-zod` v6 requires Zod v4 as a peer dependency,
but the upgrade plan scheduled Zod for Phase 7.

**Resolution:** Performed Zod v4 upgrade for API and common packages during
Phase 4. Frontend will still need Zod v4 upgrade in Phase 6 or 7.

### Challenge 2: Multiple Schema Files

**Issue:** Zod schemas are used extensively throughout the common package with
many instances of deprecated API usage.

**Resolution:** Systematically updated all schema definitions using multi-file
replacements. Some duplicates required manual fixes.

### Challenge 3: Error Property Rename

**Issue:** The `errors` → `issues` property rename affected error handling
throughout the API.

**Resolution:** Updated all error handling code to use the new `issues`
property.

---

## Validation Performed

1. ✅ All unit tests pass in common package
2. ✅ All integration tests pass in API package
3. ✅ TypeScript compilation succeeds with no errors
4. ✅ Validation schemas work correctly with new Zod v4 API
5. ✅ Error handling produces correct error messages
6. ✅ Authentication flows work correctly with upgraded JWT plugin
7. ✅ CORS configuration validated
8. ✅ Request/response validation functioning properly

---

## Dependencies Updated Summary

### API Package (`/api/package.json`)

| Package                   | Old Version | New Version | Type  |
| ------------------------- | ----------- | ----------- | ----- |
| @fastify/cookie           | ^10.0.0     | ^11.0.2     | MAJOR |
| @fastify/cors             | ^10.0.0     | ^11.1.0     | MAJOR |
| @fastify/helmet           | ^12.0.0     | ^13.0.2     | MAJOR |
| @fastify/jwt              | ^9.0.0      | ^10.0.0     | MAJOR |
| fastify-type-provider-zod | ^4.0.0      | ^6.1.0      | MAJOR |
| zod                       | ^3.22.4     | ^4.1.13     | MAJOR |

### Common Package (`/common/package.json`)

| Package | Old Version | New Version | Type  |
| ------- | ----------- | ----------- | ----- |
| zod     | ^3.22.4     | ^4.1.13     | MAJOR |

**Total packages upgraded:** 7 (6 in API, 1 in common)

---

## Impact on Remaining Phases

### Frontend Zod Upgrade

The frontend package still uses Zod v3.22.4. This will need to be upgraded in
Phase 6 or 7 using the same migration patterns documented here.

### Phase 7 Adjustment

Step 7.1 (Zod v3 → v4 upgrade) is now partially complete:

- ✅ API package upgraded
- ✅ Common package upgraded
- ⏳ Frontend package remains (scheduled for Phase 6/7)

---

## Notes for Future Phases

1. **Frontend Zod Migration:** When upgrading frontend to Zod v4, use the same
   patterns documented here:
   - Replace `required_error` and `invalid_type_error` with `message`
   - Update `z.enum` to use `message` instead of `errorMap`
   - Change `error.errors` to `error.issues` in error handling

2. **Shared Schemas:** All shared schemas in the common package are now Zod v4
   compatible, so frontend can safely import and use them once upgraded.

3. **Testing:** All existing tests passed without modification, indicating good
   backward compatibility in validation behavior.

---

## Completion Checklist

- ✅ Fastify plugins upgraded to v11+
- ✅ fastify-type-provider-zod upgraded to v6
- ✅ Zod upgraded to v4 in API and common packages
- ✅ All schema definitions migrated to Zod v4 API
- ✅ Error handling updated to use `issues` instead of `errors`
- ✅ All tests passing
- ✅ Type checking passing
- ✅ Implementation log created

---

## Next Steps

Proceed to **Phase 5: Major Version Upgrades - Frontend Build Tooling**

- Step 5.1: Vite v5 → v7
- Step 5.2: Tailwind CSS v3 → v4
- Step 5.3: jsdom v23 → v27

---

**Phase 4 Duration:** Approximately 1 hour  
**Complexity:** Medium-High (due to unexpected Zod v4 migration)  
**Risk Level:** Low (all tests passing, no runtime issues detected)
