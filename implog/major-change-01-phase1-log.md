# Major Change 01 - Phase 1 Implementation Log

**Date**: December 4, 2025  
**Phase**: Phase 1 - Database Schema Changes  
**Status**: ✅ Complete  
**Related Documents**:

- `specs/major-change-01-plan.md` - Master implementation plan
- `specs/major-change-01-status.md` - Status tracker
- `implog/epics-and-stories-changes.md` - Specification changes

---

## Overview

Successfully implemented Phase 1 of the Master Battle Schedule major change.
This phase establishes the foundational database schema for centralized battle
scheduling, enabling consistent Battle IDs across all clans and preparing for
automated battle creation.

## Implementation Summary

### Schema Changes

#### 1. SystemSetting Model

Created new `SystemSetting` model for storing system-wide configuration:

- **Primary Key**: `key` (string, max 100 chars)
- **Fields**:
  - `value` (TEXT): JSON-encoded configuration value
  - `description` (TEXT, optional): Human-readable description
  - `dataType` (VARCHAR 50): Type indicator ('string', 'number', 'boolean',
    'date', 'json')
  - `createdAt`, `updatedAt`: Standard timestamps

**Initial Settings**:

- `nextBattleStartDate`: Next scheduled battle in EST (ISO 8601 format)
- `schedulerEnabled`: Boolean flag to enable/disable automatic battle creation

#### 2. MasterBattle Model

Created new `MasterBattle` model as centralized registry of all battles:

- **Primary Key**: `battleId` (VARCHAR 8, format: YYYYMMDD)
- **Fields**:
  - `startTimestamp` (TIMESTAMP): Battle start in GMT
  - `endTimestamp` (TIMESTAMP): Battle end in GMT
  - `createdBy` (VARCHAR 255, nullable): User ID who created (NULL for
    automatic)
  - `notes` (TEXT, optional): Notes about schedule changes
  - `createdAt`, `updatedAt`: Standard timestamps
- **Indexes**:
  - `idx_master_battle_start` on `startTimestamp`

#### 3. ClanBattle Model Updates

Modified `ClanBattle` to reference `MasterBattle`:

- **Added Relationship**: Foreign key `battleId` → `master_battles.battle_id`
  - Constraint: `ON DELETE RESTRICT` (cannot delete master battle if clan
    battles exist)
  - Cascade: `ON UPDATE CASCADE`
- **Kept Fields**: `startDate` and `endDate` remain for backward compatibility
  and query performance (denormalized)

### Migration Implementation

**Migration**: `20251205050207_add_master_battle_schedule`

The migration handles both fresh database installation and migration of existing
data:

1. **Create Tables**:
   - `system_settings` table
   - `master_battles` table with index

2. **Populate master_battles**:
   - Extracts unique `battleId` values from existing `clan_battles`
   - Creates corresponding `MasterBattle` entries
   - Converts DATE fields to TIMESTAMP (midnight GMT for start, 23:59:59 GMT for
     end)
   - Marks entries as migrated with notes

3. **Initialize system_settings**:
   - Calculates `nextBattleStartDate` as 3 days after most recent battle
   - Handles empty database case (uses current date + 3 days)
   - Sets `schedulerEnabled` to `true`

4. **Add Foreign Key**:
   - Establishes constraint after data population to avoid conflicts

### Seed Script Updates

Updated `database/prisma/seed.ts` to include:

1. **System Settings Seeding** (Section 1.5):
   - Seeds `nextBattleStartDate` = 2025-11-22T05:00:00Z (3 days after last
     seeded battle)
   - Seeds `schedulerEnabled` = true

2. **Master Battle Seeding** (Section 1.6):
   - Seeds 9 master battles matching the battle IDs used in clan battle seeds
   - Dates: 20241101, 20251023, 20251026, 20251101, 20251104, 20251107,
     20251110, 20251116, 20251119
   - All marked with `createdBy: null` (indicates seeded/automatic)

## Technical Challenges & Solutions

### Challenge 1: Prisma 7 Configuration

**Issue**: Migration commands failed with "datasource property is required"
error.

**Root Cause**: Project uses Prisma 7 which moved datasource configuration from
`schema.prisma` to `prisma.config.ts`.

**Solution**:

- Confirmed `prisma.config.ts` has correct datasource configuration
- Removed `url = env("DATABASE_URL")` from schema.prisma
- Ran migrations from project root (not database subdirectory)

### Challenge 2: Foreign Key Constraint on Existing Data

**Issue**: Initial migration failed because existing `clan_battles` data
referenced Battle IDs that didn't exist in `master_battles` yet.

**Solution**:

- Modified migration SQL to populate `master_battles` BEFORE adding foreign key
  constraint
- Extracted unique Battle IDs from existing data
- Migration order: Create tables → Populate master_battles → Add foreign key

### Challenge 3: Empty Database Handling

**Issue**: When resetting database, `system_settings` INSERT failed because
SELECT from empty `clan_battles` returned no rows.

**Solution**:

- Changed from `INSERT INTO ... SELECT ...` to `INSERT INTO ... VALUES (...)`
- Used subquery with `COALESCE` to handle empty table case
- Provides default value (current date + 3 days) when no battles exist

### Challenge 4: NULL Constraint Violation

**Issue**: `updated_at` field had NULL values in initial migration attempts.

**Solution**:

- Explicitly set `created_at` and `updated_at` to `CURRENT_TIMESTAMP` in
  migration
- Prisma generates these automatically in application code, but migration SQL
  needs explicit values

## Verification

### Migration Verification

```sql
-- Verify master_battles populated
SELECT COUNT(*) FROM master_battles;
-- Result: 9 battles

-- Verify system_settings populated
SELECT * FROM system_settings;
-- Result: 2 settings (nextBattleStartDate, schedulerEnabled)

-- Verify foreign key relationship
SELECT cb.clan_id, cb.battle_id, mb.start_timestamp, mb.end_timestamp
FROM clan_battles cb
JOIN master_battles mb ON cb.battle_id = mb.battle_id;
-- Result: All clan_battles have matching master_battles
```

### Seed Verification

- Reset database and re-ran seed: ✅ Success
- Verified counts:
  - 9 master battles created
  - 2 system settings created
  - 1 clan battle created (properly references master battle)
- Foreign key constraint working correctly

### Code Verification

- TypeScript compilation (common): ✅ No errors
- TypeScript compilation (api): ✅ No errors
- Prisma client regenerated successfully
- All relationships properly typed in generated client

## Database State

### Tables Created

1. `system_settings` (2 rows)
2. `master_battles` (9 rows in seed)

### Tables Modified

1. `clan_battles` (added foreign key to master_battles)

### Indexes Added

1. `idx_master_battle_start` on `master_battles(start_timestamp)`

## Files Changed

### Schema

- `database/prisma/schema.prisma`
  - Added `SystemSetting` model
  - Added `MasterBattle` model
  - Modified `ClanBattle` to add `masterBattle` relationship

### Migration

- `database/prisma/migrations/20251205050207_add_master_battle_schedule/migration.sql`
  - New migration file with table creation and data population

### Seed

- `database/prisma/seed.ts`
  - Added Section 1.5: Seed System Settings
  - Added Section 1.6: Seed Master Battles

### Generated (not in version control)

- `database/generated/client/` - Regenerated with new models

## Key Design Decisions

### 1. Denormalization of Dates

**Decision**: Keep `startDate` and `endDate` in `ClanBattle` even though they're
in `MasterBattle`.

**Rationale**:

- Query performance: Avoid joins for date range queries
- Backward compatibility: Existing queries still work
- Minimal storage overhead
- Dates never change after creation

### 2. Foreign Key Constraint Type

**Decision**: `ON DELETE RESTRICT` (not CASCADE or SET NULL)

**Rationale**:

- Master battles should never be deleted if clan data exists
- Prevents accidental data loss
- Forces intentional cleanup of clan battles before removing master battles

### 3. Null createdBy for Migrated Data

**Decision**: Set `createdBy = NULL` for migrated/seeded battles

**Rationale**:

- Distinguishes automatic/historical battles from manually created ones
- NULL indicates system-generated or migrated data
- User ID will be set for future manual creations by Superadmin

### 4. Timestamp Storage in GMT

**Decision**: Store all timestamps in GMT, not EST

**Rationale**:

- Database best practice (single timezone)
- Avoids DST ambiguity
- Battle IDs still based on EST dates for user clarity
- Conversion to EST happens in application layer

## Next Steps

Phase 1 is complete. Ready to proceed with Phase 2:

**Phase 2: Common Library Utilities** (3-4 hours estimated)

- Create battle ID utilities (`common/src/utils/battleId.ts`)
- Create timezone utilities (`common/src/utils/timezone.ts`)
- Create validation schemas (`common/src/validators/battleSchedule.ts`)
- Create TypeScript types (`common/src/types/battleSchedule.ts`)
- Write comprehensive unit tests

## Lessons Learned

1. **Prisma 7 Configuration**: Always run Prisma commands from project root with
   `prisma.config.ts` in Prisma 7 projects.

2. **Migration Dependencies**: When adding foreign keys to existing data, always
   populate the referenced table first.

3. **Empty State Handling**: Migrations must handle both fresh installs and
   migrations from existing data.

4. **Explicit Timestamps**: When inserting via raw SQL in migrations, explicitly
   set timestamp fields even if they have defaults.

5. **Testing Order**: Always test migration on clean database AND database with
   existing data.

## Commit

**Commit Hash**: e7f46f9  
**Commit Message**:
`feat(database): Phase 1 - Add Master Battle schedule and System Settings`

---

**Implementation Time**: ~2.5 hours  
**Estimated Time**: 2-4 hours  
**Status**: ✅ On Schedule
