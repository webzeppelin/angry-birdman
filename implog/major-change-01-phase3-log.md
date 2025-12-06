# Major Change 01 - Phase 3 Implementation Log

**Date**: December 4, 2025  
**Phase**: Phase 3 - Battle Scheduler Service  
**Status**: ✅ Complete  
**Related Documents**:

- `specs/major-change-01-plan.md` - Master implementation plan
- `specs/major-change-01-status.md` - Status tracker
- `implog/major-change-01-phase1-log.md` - Database schema implementation
- `implog/major-change-01-phase2-log.md` - Common utilities implementation

---

## Overview

Successfully implemented Phase 3 of the Master Battle Schedule major change.
This phase adds automated battle creation using a cron-based scheduler service
that runs hourly to check if new battles should be created based on the schedule
stored in system settings.

The scheduler ensures all clans have consistent Battle IDs for the same events
by creating `MasterBattle` entries automatically at scheduled times.

## Implementation Summary

### 1. Scheduler Service (`api/src/services/battleScheduler.service.ts`)

Created `BattleSchedulerService` class to manage automatic battle creation:

**Core Methods**:

- `checkAndCreateBattle()`: Main scheduler logic called by cron job
  - Gets current time in Official Angry Birds Time (EST)
  - Retrieves `nextBattleStartDate` from system settings
  - Creates battle if current time >= scheduled time
  - Updates next battle date (+3 days)
  - Handles errors gracefully without throwing

- `createMasterBattle(startDate)`: Creates new MasterBattle entry
  - Generates Battle ID from EST start date
  - Checks for duplicate battles (skips if exists)
  - Calculates end timestamp (48 hours = 2 days)
  - Converts EST times to GMT for database storage
  - Sets `createdBy` to `null` for automatic creation

- `updateNextBattleDate(newDate)`: Updates system setting
  - Uses upsert pattern for atomic updates
  - Creates setting if not exists

- `getNextBattleStartDate()`: Retrieves scheduled date from database

- `manuallyCreateBattle(startDate)`: Admin/test method
  - Bypasses time check
  - Allows manual battle creation for testing

- `isSchedulerEnabled()`: Checks database setting
  - Returns `true` if setting not found (default enabled)

**Dependencies**:

- `@angrybirdman/common`: Timezone utilities, battle ID generation
- `PrismaClient`: Database operations
- `FastifyBaseLogger`: Structured logging

**Key Features**:

- Comprehensive logging at debug, info, warn, and error levels
- Graceful error handling (doesn't throw, logs and continues)
- Duplicate prevention
- EST to GMT timezone conversions

### 2. Scheduler Plugin (`api/src/plugins/scheduler.ts`)

Created Fastify plugin to initialize and manage the cron scheduler:

**Features**:

- **Cron Schedule**: Runs every hour at minute 0 (`0 * * * *`)
- **Timezone**: Uses `America/New_York` for cron scheduling (EST/EDT)
- **Environment Check**: Respects `BATTLE_SCHEDULER_ENABLED` env var
- **Database Setting**: Checks `schedulerEnabled` system setting
- **Development Mode**: Runs immediate check on startup in dev mode
- **Graceful Shutdown**: Stops cron task on server close
- **Fastify Decoration**: Adds `battleScheduler` service to instance for manual
  ops

**Configuration**:

```typescript
const cronSchedule = '0 * * * *'; // Every hour at minute 0
timezone: 'America/New_York';
```

**Plugin Registration**:

- Registered in `app.ts` after database plugin
- Dependency: `['database']`

### 3. Environment Configuration

Added `BATTLE_SCHEDULER_ENABLED` to environment files:

**Root `.env.example`**:

```bash
# Battle Scheduler Configuration
# Enable or disable automatic battle creation
# Set to 'false' to disable the scheduler (useful for testing or maintenance)
BATTLE_SCHEDULER_ENABLED=true
```

**API `.env.example`**:

```bash
# Battle Scheduler Configuration
# Enable or disable automatic battle creation
BATTLE_SCHEDULER_ENABLED=true
```

### 4. Dependencies

Added node-cron for scheduling:

**`api/package.json`**:

```json
"dependencies": {
  "node-cron": "^4.2.1",
  "@types/node-cron": "^3.0.11"
}
```

### 5. Test Infrastructure

#### Unit Tests (`api/tests/services/battleScheduler.service.test.ts`)

Created 13 comprehensive unit tests:

**Battle Creation Logic**:

- ✅ Create battle when current time passes next battle date
- ✅ Don't create battle when current time is before next battle date
- ✅ Don't create duplicate battle if already exists
- ✅ Handle missing nextBattleStartDate gracefully
- ✅ Handle errors gracefully without throwing

**Manual Battle Creation**:

- ✅ Create battle for specified date
- ✅ Calculate correct end timestamp (48 hours)

**Scheduler Control**:

- ✅ Return true when schedulerEnabled is "true"
- ✅ Return false when schedulerEnabled is "false"
- ✅ Return true when setting does not exist (default)

**Timezone Handling**:

- ✅ Create battles with correct EST to GMT conversion

**System Settings Integration**:

- ✅ Update nextBattleStartDate atomically
- ✅ Create setting if not exists when updating

#### Integration Tests (`api/tests/plugins/scheduler.test.ts`)

Created 6 plugin integration tests:

- ✅ Register scheduler plugin successfully
- ✅ Respect BATTLE_SCHEDULER_ENABLED=false environment variable
- ✅ Not register scheduler when database setting is false
- ✅ Allow manual battle creation through decorated service
- ✅ Handle graceful shutdown
- ✅ Start in development mode and run initial check

#### Test Database Setup

Updated `api/tests/setup.ts` to clean new tables:

```typescript
await prisma.masterBattle.deleteMany();
await prisma.systemSetting.deleteMany();
```

### 6. Common Library Fixes

Fixed duplicate exports in `common/src/utils/index.ts`:

**Problem**: `parseBattleId` and `validateBattleId` exported from both
`date-formatting.ts` and `battleId.ts`

**Solution**: Explicitly list exports from `date-formatting.ts`, excluding
duplicates:

```typescript
export {
  generateBattleId,
  generateMonthId,
  generateYearId,
  parseMonthId,
  parseYearId,
  validateMonthId,
  validateYearId,
  getBattleIdsForMonth,
  getMonthIdsForYear,
  getMonthIdFromBattleId,
  getYearIdFromBattleId,
  getYearIdFromMonthId,
  formatDateISO,
  formatMonthDisplay,
  formatBattleDisplay,
} from './date-formatting.js';

// Battle ID utilities (authoritative for battle ID operations)
export * from './battleId.js';
```

## Challenges and Solutions

### Challenge 1: Battle Duration Calculation

**Problem**: Initial implementation used `+2 days` for end timestamp, resulting
in 72 hours (3 days) instead of 48 hours (2 days).

**Root Cause**: Misunderstanding of "2 days" - thought it meant "add 2 days"
rather than "duration of 2 days ending on second day".

**Solution**: Changed calculation to:

```typescript
const endDate = new Date(startDate);
endDate.setUTCDate(endDate.getUTCDate() + 1); // Go to second day
endDate.setUTCHours(23, 59, 59, 999); // End of second day
```

This gives exactly 48 hours: Dec 15 00:00:00 → Dec 16 23:59:59.999

### Challenge 2: Database Migration for Tests

**Problem**: Tests failed with "relation 'master_battles' does not exist"
because migrations weren't applied to test database.

**Root Cause**: Prisma 7 uses `prisma.config.ts` for datasource URL
configuration, and tests use separate `angrybirdman_test` database.

**Solution**: Applied migrations with explicit DATABASE_URL override:

```bash
DATABASE_URL="postgresql://angrybirdman:angrybirdman_dev_password@localhost:5432/angrybirdman_test?schema=public" npx prisma migrate reset --force
```

### Challenge 3: ESLint Floating Promises

**Problem**: ESLint flagged "floating promises" in cron callback and
task.stop().

**Root Cause**:

- Cron callbacks are fire-and-forget by design
- `task.stop()` returns void but ESLint thought it might return Promise

**Solution**: Added targeted eslint-disable comments:

```typescript
// eslint-disable-next-line @typescript-eslint/no-floating-promises
task.start();

// eslint-disable-next-line @typescript-eslint/no-floating-promises
task.stop();
```

### Challenge 4: Common Library Export Conflicts

**Problem**: TypeScript error about duplicate exports of `parseBattleId` and
`validateBattleId` from both `date-formatting.ts` and `battleId.ts`.

**Root Cause**: Both files exported these functions, causing ambiguity when
re-exported via barrel file.

**Solution**: Made `battleId.ts` the authoritative source, explicitly listed
exports from `date-formatting.ts` to exclude duplicates.

## Testing Results

### Test Execution

**Unit Tests** (`battleScheduler.service.test.ts`):

```
✓ 13 tests passed
  ✓ checkAndCreateBattle (6 tests)
  ✓ manuallyCreateBattle (2 tests)
  ✓ isSchedulerEnabled (3 tests)
  ✓ battle timing calculations (1 test)
  ✓ integration with system settings (2 tests)
```

**Integration Tests** (`scheduler.test.ts`):

```
✓ 6 tests passed
  ✓ Plugin registration and decoration
  ✓ Environment variable handling
  ✓ Database setting checks
  ✓ Manual battle creation
  ✓ Graceful shutdown
  ✓ Development mode immediate execution
```

**Total**: 19/19 tests passing

### Code Quality

**TypeScript**: No type errors

```bash
npx tsc --noEmit
```

**ESLint**: No linting errors

```bash
npx eslint src/plugins/scheduler.ts src/services/battleScheduler.service.ts tests/**/*scheduler*.ts
```

## Verification Checklist

- ✅ BattleSchedulerService class implemented with all required methods
- ✅ Scheduler plugin created with cron integration
- ✅ Plugin registered in app.ts after database plugin
- ✅ BATTLE_SCHEDULER_ENABLED environment variable added
- ✅ node-cron dependency installed
- ✅ 13 unit tests created and passing
- ✅ 6 integration tests created and passing
- ✅ Test database setup updated for new tables
- ✅ Duplicate exports resolved in common library
- ✅ Battle duration calculation fixed (48 hours)
- ✅ EST to GMT timezone conversions working
- ✅ Duplicate battle prevention working
- ✅ Graceful error handling implemented
- ✅ Development mode immediate check working
- ✅ Graceful shutdown implemented
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ All changes committed to git

## Files Changed

### New Files

- `api/src/services/battleScheduler.service.ts` (234 lines)
- `api/src/plugins/scheduler.ts` (133 lines)
- `api/tests/services/battleScheduler.service.test.ts` (comprehensive unit
  tests)
- `api/tests/plugins/scheduler.test.ts` (integration tests)

### Modified Files

- `api/src/app.ts` - Registered scheduler plugin
- `.env.example` - Added BATTLE_SCHEDULER_ENABLED
- `api/.env.example` - Added BATTLE_SCHEDULER_ENABLED
- `api/package.json` - Added node-cron dependencies
- `api/tests/setup.ts` - Added masterBattle and systemSetting cleanup
- `common/src/utils/index.ts` - Fixed duplicate exports

## Next Steps

**Phase 4**: Battle Query Utilities

- Implement `getCurrentBattleId()` function
- Implement `getActiveBattleForClan()` function
- Add comprehensive tests
- Update API routes to use centralized battle retrieval

**Future Enhancements**:

- Admin UI for managing battle schedule
- Ability to pause/resume scheduler
- Notifications when battles are created
- Historical battle schedule view

## Notes

### Scheduler Behavior

The scheduler runs hourly at minute 0 (e.g., 1:00 AM, 2:00 AM, etc.) to check if
the current time has passed the `nextBattleStartDate`. This means battles are
created within 1 hour of their scheduled time.

**Example Timeline**:

- **Next Battle Date**: Dec 15, 2025 00:00:00 EST
- **Scheduler Checks**: Every hour (12:00, 1:00, 2:00, etc.)
- **Battle Created**: At 12:00 AM (midnight) or 1:00 AM EST, depending on when
  the first check after midnight occurs
- **New Next Date**: Dec 18, 2025 00:00:00 EST (+3 days)

### Timezone Handling

All battle scheduling logic uses Official Angry Birds Time (EST, UTC-5):

- `nextBattleStartDate` stored in ISO 8601 format (EST)
- Battle ID generated from EST date (YYYYMMDD)
- Start/end timestamps converted to GMT for database storage
- Cron job runs in `America/New_York` timezone

### Development Mode

In development (`NODE_ENV=development`), the scheduler runs an immediate check
on startup in addition to the hourly cron schedule. This helps with testing and
debugging without waiting for the hourly trigger.

### Error Handling

The scheduler is designed to be resilient:

- Errors are logged but don't stop the scheduler
- Next scheduled run will retry
- Duplicate battles are prevented
- Missing settings are handled gracefully
- Invalid dates logged as warnings

## Conclusion

Phase 3 implementation is complete and fully functional. The battle scheduler
service automatically creates `MasterBattle` entries on schedule, ensuring all
clans have consistent Battle IDs for events. The implementation includes
comprehensive testing, proper error handling, timezone conversions, and
integration with the Fastify application lifecycle.

The scheduler can be easily disabled via environment variable or database
setting, making it suitable for testing, maintenance, or manual battle
management scenarios.
