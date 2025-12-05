# Major Change 01: Centralized Master Battle Schedule Implementation Plan

**Date**: December 4, 2025  
**Status**: Planning Complete, Ready for Implementation  
**Related Documents**:

- `specs/epics-and-stories.md` - Updated user stories
- `implog/epics-and-stories-changes.md` - Specification changes log
- `specs/major-change-01-status.md` - Implementation status tracker

## Executive Summary

This plan outlines the step-by-step implementation of a centralized Master
Battle schedule system for Angry Birdman. The change addresses critical issues
with the current design:

1. **Inconsistent Battle IDs** across clans recording the same event
2. **Inefficient data entry** requiring manual date entry for every battle
3. **Inability to compare** performance across clans
4. **No timezone awareness** for Official Angry Birds Time (EST)

The solution introduces a Master Battle schedule managed by Superadmin with
automatic battle creation via a scheduled job, ensuring all clans use consistent
Battle IDs for the same events.

## Architecture Overview

### New Components

1. **Master Battle Table** - Centralized registry of all battles
2. **System Settings Table** - Stores next battle date and other config
3. **Battle Scheduler Service** - TypeScript service that runs periodically
4. **Scheduler Infrastructure** - Node.js-based job runner using `node-cron`
5. **New API Endpoints** - Battle schedule management and selection
6. **Updated Frontend Components** - Battle selection UI

### Scheduler Architecture Decision

**Selected Approach**: Embedded scheduler using `node-cron` within the API
service

**Rationale**:

- TypeScript-native, consistent with project architecture
- No additional infrastructure dependencies
- Simple deployment (runs within API container)
- Easy to develop and debug locally
- Sufficient for hourly job frequency
- Can be replaced with external scheduler (Kubernetes CronJob, etc.) in
  production if needed

**Alternative Considered**: Separate worker service with Bull/BullMQ + Valkey

- Rejected: Over-engineered for simple hourly job
- Can migrate to this later if job complexity increases

## Implementation Phases

The implementation is divided into 7 phases, executed sequentially. Each phase
has clear deliverables and can be verified before proceeding to the next.

---

## Phase 1: Database Schema Changes

**Objective**: Update database schema to support Master Battle schedule

**Duration Estimate**: 2-4 hours

### Tasks

#### 1.1: Create System Settings Model

Add to `database/prisma/schema.prisma`:

```prisma
/// System-wide configuration settings
model SystemSetting {
  // Primary Key
  key String @id @db.VarChar(100)

  // Core Fields
  value       String   @db.Text // JSON-encoded value
  description String?  @db.Text
  dataType    String   @db.VarChar(50) // 'string', 'number', 'boolean', 'date', 'json'

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

Initial settings to seed:

- `nextBattleStartDate` - ISO timestamp in EST timezone
- `schedulerEnabled` - Boolean to enable/disable automatic battle creation

#### 1.2: Create Master Battle Model

Add to `database/prisma/schema.prisma`:

```prisma
/// Master schedule of all CvC battles in Official Angry Birds Time
model MasterBattle {
  // Primary Key
  battleId String @id @map("battle_id") @db.VarChar(8) // Format: YYYYMMDD

  // Core Fields
  startTimestamp DateTime @map("start_timestamp") // Start in GMT
  endTimestamp   DateTime @map("end_timestamp")   // End in GMT

  // Metadata
  createdBy String? @map("created_by") @db.VarChar(255) // userId who created (NULL if automatic)
  notes     String? @db.Text // Optional notes about schedule changes

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relationships
  clanBattles ClanBattle[]

  @@map("master_battles")
  @@index([startTimestamp], name: "idx_master_battle_start")
}
```

#### 1.3: Modify Clan Battle Model

Update `ClanBattle` model in `database/prisma/schema.prisma`:

1. Add foreign key to `MasterBattle`:

```prisma
masterBattle MasterBattle @relation(fields: [battleId], references: [battleId], onDelete: Restrict)
```

2. Keep `startDate` and `endDate` fields for backward compatibility and query
   performance (denormalized)
   - These will be auto-populated from MasterBattle on create/update
   - Adds index for efficient date range queries

3. Add index:

```prisma
@@index([battleId], name: "idx_clan_battle_master")
```

#### 1.4: Create and Run Migration

```bash
cd database
npm run migrate:dev -- --name add_master_battle_schedule
```

#### 1.5: Seed Initial Data

Create `database/prisma/seeds/masterBattles.ts`:

```typescript
import { PrismaClient } from '../generated/client';

// Seed historical battles and next battle
// Convert existing ClanBattle dates to MasterBattle entries
// Set initial nextBattleStartDate
```

Add to existing seed script to populate:

- Master battles from existing clan battle data (deduplicated by battleId)
- Next battle date (3 days after most recent battle)
- System settings

**Verification**:

- Migration runs successfully
- All existing ClanBattle records have corresponding MasterBattle entries
- No orphaned battle IDs
- System settings table has required keys
- Test database rollback and re-migration

**Dependencies**: None

**Deliverables**:

- Migration file:
  `database/prisma/migrations/YYYYMMDDHHMMSS_add_master_battle_schedule/`
- Seed script: `database/prisma/seeds/masterBattles.ts`
- Updated schema.prisma with new models and relationships

---

## Phase 2: Common Library Utilities

**Objective**: Create shared utilities for battle schedule operations and
timezone handling

**Duration Estimate**: 3-4 hours

### Tasks

#### 2.1: Battle ID Utilities

Create `common/src/utils/battleId.ts`:

```typescript
/**
 * Utilities for working with Battle IDs (YYYYMMDD format)
 * All Battle IDs are based on Official Angry Birds Time (EST, never EDT)
 */

/**
 * Generate Battle ID from Official Angry Birds Time date
 * @param date - Date in EST timezone
 * @returns Battle ID in YYYYMMDD format
 */
export function generateBattleId(date: Date): string;

/**
 * Parse Battle ID into date components
 * @param battleId - Battle ID in YYYYMMDD format
 * @returns Date components (year, month, day)
 */
export function parseBattleId(battleId: string): {
  year: number;
  month: number;
  day: number;
};

/**
 * Validate Battle ID format
 */
export function isValidBattleId(battleId: string): boolean;

/**
 * Get next battle ID (3 days after given battle)
 */
export function getNextBattleId(battleId: string): string;
```

#### 2.2: Timezone Utilities

Create `common/src/utils/timezone.ts`:

```typescript
/**
 * Utilities for Official Angry Birds Time (EST) and timezone conversions
 *
 * IMPORTANT: Official Angry Birds Time is ALWAYS Eastern Standard Time (EST),
 * it does NOT observe daylight saving time (never EDT).
 *
 * EST is UTC-5 year-round.
 */

/**
 * Convert any date to Official Angry Birds Time (EST)
 * @param date - Date in any timezone
 * @returns Date normalized to EST (UTC-5)
 */
export function toOfficialAngryBirdsTime(date: Date): Date;

/**
 * Convert EST date to GMT for database storage
 */
export function estToGmt(estDate: Date): Date;

/**
 * Convert GMT date to EST for display
 */
export function gmtToEst(gmtDate: Date): Date;

/**
 * Get current time in Official Angry Birds Time (EST)
 */
export function getCurrentAngryBirdsTime(): Date;

/**
 * Format date for display in user's local timezone
 */
export function formatForUserTimezone(date: Date, timezone?: string): string;
```

#### 2.3: Battle Schedule Validators

Create `common/src/validators/battleSchedule.ts`:

```typescript
import { z } from 'zod';

/**
 * Validation schemas for battle schedule operations
 */

export const masterBattleSchema = z.object({
  battleId: z.string().regex(/^\d{8}$/, 'Battle ID must be YYYYMMDD format'),
  startTimestamp: z.date(),
  endTimestamp: z.date(),
  createdBy: z.string().optional(),
  notes: z.string().optional(),
});

export const nextBattleUpdateSchema = z.object({
  nextBattleStartDate: z.string().datetime(), // ISO string in EST
});

export const battleSelectionSchema = z.object({
  battleId: z.string().regex(/^\d{8}$/),
});
```

#### 2.4: Battle Schedule Types

Create `common/src/types/battleSchedule.ts`:

```typescript
/**
 * TypeScript types for battle schedule domain
 */

export interface MasterBattle {
  battleId: string;
  startTimestamp: Date;
  endTimestamp: Date;
  createdBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json';
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleScheduleInfo {
  currentBattle: MasterBattle | null;
  nextBattle: MasterBattle | null;
  nextBattleStartDate: Date;
  availableBattles: MasterBattle[];
}
```

#### 2.5: Unit Tests

Create comprehensive tests for all utilities:

- `common/tests/utils/battleId.test.ts`
- `common/tests/utils/timezone.test.ts`
- `common/tests/validators/battleSchedule.test.ts`

**Verification**:

- All unit tests pass
- Utilities handle edge cases (leap years, timezone boundaries, invalid input)
- Type definitions are exported correctly
- Documentation is clear and accurate

**Dependencies**: Phase 1

**Deliverables**:

- `common/src/utils/battleId.ts`
- `common/src/utils/timezone.ts`
- `common/src/validators/battleSchedule.ts`
- `common/src/types/battleSchedule.ts`
- Comprehensive unit tests with >90% coverage

---

## Phase 3: Battle Scheduler Service

**Objective**: Implement the automated battle creation service

**Duration Estimate**: 4-6 hours

### Tasks

#### 3.1: Install Dependencies

Add to `api/package.json`:

```bash
npm install --workspace=api node-cron @types/node-cron
```

#### 3.2: Create Scheduler Service

Create `api/src/services/battleScheduler.ts`:

```typescript
/**
 * Battle Scheduler Service
 *
 * Automatically creates new Master Battle entries when current time
 * passes the scheduled next battle start date.
 *
 * Runs hourly via node-cron.
 */

import { PrismaClient } from '@angrybirdman/database';
import { generateBattleId, getNextBattleId } from '@angrybirdman/common';
import { getCurrentAngryBirdsTime, estToGmt } from '@angrybirdman/common';

export class BattleScheduler {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if new battle should be created and create it if needed
   * This is the main method called by the cron job
   */
  async checkAndCreateBattle(): Promise<void> {
    // 1. Get current time in Official Angry Birds Time (EST)
    // 2. Get nextBattleStartDate from system settings
    // 3. If current time >= next battle start:
    //    a. Create new MasterBattle entry
    //    b. Update nextBattleStartDate to +3 days
    //    c. Log to audit log
    // 4. Handle errors gracefully with logging
  }

  /**
   * Create a new Master Battle entry
   */
  private async createMasterBattle(startDate: Date): Promise<void> {
    // 1. Generate Battle ID from EST start date
    // 2. Calculate end timestamp (start + 2 days - 1 second)
    // 3. Convert EST times to GMT for storage
    // 4. Insert into MasterBattle table
    // 5. Log creation
  }

  /**
   * Update next battle start date
   */
  private async updateNextBattleDate(newDate: Date): Promise<void> {
    // Update system_settings.nextBattleStartDate
  }

  /**
   * Get next battle start date from system settings
   */
  private async getNextBattleStartDate(): Promise<Date> {
    // Query system_settings table
  }
}
```

#### 3.3: Create Scheduler Plugin

Create `api/src/plugins/scheduler.ts`:

```typescript
/**
 * Fastify plugin for battle scheduler
 *
 * Initializes and manages the cron job for automatic battle creation
 */

import fp from 'fastify-plugin';
import cron from 'node-cron';
import { BattleScheduler } from '../services/battleScheduler';

export default fp(async (fastify) => {
  const scheduler = new BattleScheduler(fastify.prisma);

  // Run every hour at minute 0
  const task = cron.schedule(
    '0 * * * *',
    async () => {
      try {
        fastify.log.info('Running battle scheduler check...');
        await scheduler.checkAndCreateBattle();
        fastify.log.info('Battle scheduler check completed');
      } catch (error) {
        fastify.log.error({ error }, 'Battle scheduler error');
      }
    },
    {
      scheduled: true,
      timezone: 'America/New_York', // EST/EDT timezone
    }
  );

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    task.stop();
    fastify.log.info('Battle scheduler stopped');
  });

  // Run once on startup (for testing)
  if (process.env.NODE_ENV === 'development') {
    await scheduler.checkAndCreateBattle();
  }

  fastify.log.info('Battle scheduler initialized');
});
```

#### 3.4: Register Plugin

Update `api/src/app.ts` to register the scheduler plugin:

```typescript
import scheduler from './plugins/scheduler';

// Register after database plugin
await app.register(scheduler);
```

#### 3.5: Configuration

Add to `.env` and `.env.example`:

```bash
# Battle Scheduler Configuration
BATTLE_SCHEDULER_ENABLED=true  # Enable/disable automatic battle creation
```

#### 3.6: Unit and Integration Tests

Create tests:

- `api/tests/services/battleScheduler.test.ts` - Unit tests for scheduler logic
- `api/tests/plugins/scheduler.test.ts` - Integration test for plugin

Test scenarios:

- Battle created when time passes next battle date
- Next battle date updated correctly (+3 days)
- No duplicate battles created
- Handles errors gracefully
- Respects scheduler enabled flag
- Timezone conversions are correct

**Verification**:

- Scheduler runs on API startup
- Battle created at correct time
- Next battle date updated automatically
- Audit logs record automatic creation
- No crashes or memory leaks
- Tests pass with >85% coverage

**Dependencies**: Phase 1, Phase 2

**Deliverables**:

- `api/src/services/battleScheduler.ts`
- `api/src/plugins/scheduler.ts`
- Updated `api/src/app.ts`
- Comprehensive tests
- Configuration documentation

---

## Phase 4: API Endpoints - Master Battle Management

**Objective**: Create API endpoints for Master Battle schedule management

**Duration Estimate**: 4-6 hours

### Tasks

#### 4.1: Master Battle Service

Create `api/src/services/masterBattleService.ts`:

```typescript
/**
 * Service for Master Battle operations
 */

import { PrismaClient } from '@angrybirdman/database';
import type { MasterBattle } from '@angrybirdman/common';

export class MasterBattleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all master battles (paginated)
   */
  async getAllBattles(
    options: PaginationOptions
  ): Promise<PaginatedResult<MasterBattle>>;

  /**
   * Get available battles for selection (started but not future)
   */
  async getAvailableBattles(): Promise<MasterBattle[]>;

  /**
   * Get next scheduled battle date
   */
  async getNextBattleDate(): Promise<Date>;

  /**
   * Update next battle date (Superadmin only)
   */
  async updateNextBattleDate(newDate: Date, userId: string): Promise<void>;

  /**
   * Manually create a master battle (for corrections)
   */
  async createMasterBattle(
    data: CreateMasterBattleInput,
    userId: string
  ): Promise<MasterBattle>;

  /**
   * Get battle schedule info (current, next, available)
   */
  async getBattleScheduleInfo(): Promise<BattleScheduleInfo>;
}
```

#### 4.2: Master Battle Routes

Create `api/src/routes/masterBattles.ts`:

```typescript
/**
 * Routes for Master Battle schedule management
 */

import { FastifyPluginAsync } from 'fastify';
import { MasterBattleService } from '../services/masterBattleService';

const routes: FastifyPluginAsync = async (fastify) => {
  const service = new MasterBattleService(fastify.prisma);

  // GET /api/master-battles - List all master battles (public)
  fastify.get('/', async (request, reply) => {
    // Query params: page, limit, sort
    // Returns paginated list of master battles
  });

  // GET /api/master-battles/available - Get available battles for selection (public)
  fastify.get('/available', async (request, reply) => {
    // Returns battles that have started but are not in future
    // Used by battle entry form dropdown
  });

  // GET /api/master-battles/schedule-info - Get schedule info (public)
  fastify.get('/schedule-info', async (request, reply) => {
    // Returns current battle, next battle, next battle date
  });

  // GET /api/master-battles/next-battle-date - Get next scheduled battle (Superadmin)
  fastify.get(
    '/next-battle-date',
    {
      preHandler: [fastify.requireSuperadmin],
    },
    async (request, reply) => {
      // Returns next battle start date from system settings
    }
  );

  // PUT /api/master-battles/next-battle-date - Update next battle date (Superadmin)
  fastify.put(
    '/next-battle-date',
    {
      preHandler: [fastify.requireSuperadmin],
      schema: {
        body: nextBattleUpdateSchema,
      },
    },
    async (request, reply) => {
      // Updates next battle start date
      // Validates date is in future
      // Logs to audit log
    }
  );

  // POST /api/master-battles - Create master battle manually (Superadmin)
  fastify.post(
    '/',
    {
      preHandler: [fastify.requireSuperadmin],
      schema: {
        body: masterBattleSchema,
      },
    },
    async (request, reply) => {
      // Create master battle entry manually
      // For schedule corrections or historical data
    }
  );
};

export default routes;
```

#### 4.3: Register Routes

Update `api/src/routes/index.ts`:

```typescript
import masterBattles from './masterBattles';

await app.register(masterBattles, { prefix: '/api/master-battles' });
```

#### 4.4: Authentication Middleware

Ensure `requireSuperadmin` middleware exists in `api/src/middleware/auth.ts`:

```typescript
export const requireSuperadmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.user || !request.user.roles.includes('superadmin')) {
    return reply.code(403).send({ error: 'Superadmin access required' });
  }
};
```

#### 4.5: API Tests

Create `api/tests/routes/masterBattles.test.ts`:

Test scenarios:

- Public endpoints accessible without auth
- Superadmin-only endpoints require proper role
- Available battles only include started battles
- Next battle date can be updated with valid date
- Invalid dates rejected
- Schedule info returns correct data
- Audit logging works correctly

**Verification**:

- All endpoints return correct data
- Authorization works as expected
- Error handling is proper
- OpenAPI/Swagger docs generated correctly
- Tests pass with >85% coverage

**Dependencies**: Phase 1, Phase 2, Phase 3

**Deliverables**:

- `api/src/services/masterBattleService.ts`
- `api/src/routes/masterBattles.ts`
- Updated route registration
- Comprehensive API tests
- Swagger documentation

---

## Phase 5: API Endpoints - Updated Battle Entry

**Objective**: Update battle entry endpoints to use Master Battle selection

**Duration Estimate**: 4-6 hours

### Tasks

#### 5.1: Update Clan Battle Service

Modify `api/src/services/clanBattleService.ts`:

```typescript
/**
 * Updated to use Master Battle selection instead of date entry
 */

// BEFORE: createBattle(data: { startDate, endDate, ... })
// AFTER: createBattle(data: { battleId, ... })

export class ClanBattleService {
  async createBattle(
    clanId: number,
    data: CreateBattleInput
  ): Promise<ClanBattle> {
    // 1. Validate battleId exists in MasterBattle table
    // 2. Check if clan already has data for this battleId (duplicate check)
    // 3. Get start/end dates from MasterBattle for denormalization
    // 4. Create ClanBattle with battleId foreign key
    // 5. Recalculate monthly/yearly summaries
    // 6. Log to audit log
  }

  async updateBattle(
    clanId: number,
    battleId: string,
    data: UpdateBattleInput
  ): Promise<ClanBattle> {
    // Similar updates - battleId cannot be changed, dates from MasterBattle
  }
}
```

#### 5.2: Update Battle Input Schemas

Modify `api/src/validators/battle.ts`:

```typescript
import { z } from 'zod';

// BEFORE:
// export const createBattleSchema = z.object({
//   startDate: z.string().datetime(),
//   endDate: z.string().datetime(),
//   ...
// });

// AFTER:
export const createBattleSchema = z.object({
  battleId: z.string().regex(/^\d{8}$/, 'Battle ID must be YYYYMMDD format'),
  // startDate and endDate removed - comes from MasterBattle
  opponentName: z.string().min(1).max(100),
  opponentRovioId: z.number().positive(),
  opponentCountry: z.string().min(1).max(100),
  score: z.number().int().min(0),
  baselineFp: z.number().int().positive(),
  opponentScore: z.number().int().min(0),
  opponentFp: z.number().int().positive(),
});

export const updateBattleSchema = createBattleSchema
  .partial()
  .omit({ battleId: true });
// battleId cannot be changed in updates
```

#### 5.3: Update Battle Routes

Modify `api/src/routes/battles.ts`:

No major changes to route structure, but ensure:

- POST /api/clans/:clanId/battles accepts battleId instead of dates
- PUT /api/clans/:clanId/battles/:battleId doesn't allow battleId change
- GET endpoints return Master Battle metadata alongside clan data

#### 5.4: Update Battle Response DTOs

Create/update data transfer objects to include Master Battle info:

```typescript
export interface BattleDetailResponse {
  // Clan battle data
  clanId: number;
  battleId: string;
  score: number;
  // ...

  // Master battle data (from join)
  battleStartTimestamp: Date; // From MasterBattle
  battleEndTimestamp: Date; // From MasterBattle

  // Calculated fields
  // ...
}
```

#### 5.5: Update API Tests

Update `api/tests/routes/battles.test.ts`:

- Remove tests for date entry validation
- Add tests for battleId validation
- Test that invalid battleId is rejected
- Test that duplicate battleId for same clan is rejected
- Test that dates come from MasterBattle correctly

**Verification**:

- Battle creation requires valid battleId from MasterBattle
- Cannot create battle for future battleId
- Cannot create duplicate battle for same clan+battleId
- Start/end dates correctly populated from MasterBattle
- All existing battle list/view endpoints still work
- Tests pass with >85% coverage

**Dependencies**: Phase 1, Phase 2, Phase 4

**Deliverables**:

- Updated `api/src/services/clanBattleService.ts`
- Updated `api/src/validators/battle.ts`
- Updated response DTOs
- Updated API tests
- Migration guide for API changes

---

## Phase 6: Frontend Implementation

**Objective**: Update frontend to use battle selection instead of date entry

**Duration Estimate**: 6-8 hours

### Tasks

#### 6.1: API Client Updates

Update `frontend/src/api/battles.ts`:

```typescript
// Update type definitions
export interface CreateBattleRequest {
  battleId: string; // Changed from startDate/endDate
  opponentName: string;
  opponentRovioId: number;
  opponentCountry: string;
  score: number;
  baselineFp: number;
  opponentScore: number;
  opponentFp: number;
}

// Add new endpoints
export const battleApi = {
  // ... existing methods

  getAvailableBattles: () =>
    api.get<MasterBattle[]>('/api/master-battles/available'),

  getBattleScheduleInfo: () =>
    api.get<BattleScheduleInfo>('/api/master-battles/schedule-info'),

  // Superadmin only
  getNextBattleDate: () =>
    api.get<{ nextBattleStartDate: string }>(
      '/api/master-battles/next-battle-date'
    ),

  updateNextBattleDate: (data: { nextBattleStartDate: string }) =>
    api.put('/api/master-battles/next-battle-date', data),
};
```

#### 6.2: Battle Selector Component

Create `frontend/src/components/battles/BattleSelector.tsx`:

```typescript
/**
 * Dropdown component for selecting battle from Master Battle list
 *
 * Features:
 * - Loads available battles from API
 * - Displays Battle ID (YYYYMMDD) and dates in user's local timezone
 * - Defaults to most recent uncompleted battle
 * - Sorted with most recent first
 * - Only shows started battles (no future battles)
 */

interface BattleSelectorProps {
  value: string;
  onChange: (battleId: string) => void;
  clanId: number; // To check for existing battles
  error?: string;
}

export function BattleSelector({
  value,
  onChange,
  clanId,
  error,
}: BattleSelectorProps) {
  // 1. Fetch available battles on mount
  // 2. Fetch clan's existing battles to mark as already recorded
  // 3. Format dates for display in user's timezone
  // 4. Render dropdown with Battle ID + formatted dates
  // 5. Handle selection change
}
```

#### 6.3: Update Battle Entry Form

Modify `frontend/src/components/battles/BattleEntryForm.tsx`:

```typescript
// BEFORE: Date pickers for startDate and endDate
// AFTER: BattleSelector component

export function BattleEntryForm() {
  const [selectedBattleId, setSelectedBattleId] = useState<string>('');

  return (
    <form>
      {/* Step 1: Select Battle */}
      <BattleSelector
        value={selectedBattleId}
        onChange={setSelectedBattleId}
        clanId={clanId}
      />

      {/* Step 2: Opponent Info */}
      {/* ... opponent fields ... */}

      {/* Steps 3-7: Rest of form unchanged */}
    </form>
  );
}
```

#### 6.4: Dashboard Updates

Update `frontend/src/components/dashboard/Dashboard.tsx`:

```typescript
/**
 * Add next battle info to dashboard
 */

export function Dashboard() {
  const { data: scheduleInfo } = useQuery({
    queryKey: ['battle-schedule-info'],
    queryFn: () => battleApi.getBattleScheduleInfo(),
  });

  return (
    <div>
      {/* Existing dashboard content */}

      {/* Next Battle Card */}
      <Card>
        <h3>Next Battle</h3>
        <p>Battle ID: {scheduleInfo?.nextBattle?.battleId}</p>
        <p>Starts: {formatForUserTimezone(scheduleInfo?.nextBattle?.startTimestamp)}</p>
        <CountdownTimer targetDate={scheduleInfo?.nextBattle?.startTimestamp} />
      </Card>
    </div>
  );
}
```

#### 6.5: Battle List Updates

Update `frontend/src/components/battles/BattleList.tsx`:

```typescript
/**
 * Display Battle ID in battle list
 */

export function BattleList() {
  return (
    <table>
      <thead>
        <tr>
          <th>Battle ID</th>
          <th>Date</th>
          <th>Opponent</th>
          <th>Result</th>
          {/* ... */}
        </tr>
      </thead>
      <tbody>
        {battles.map(battle => (
          <tr key={battle.battleId}>
            <td>{battle.battleId}</td>
            <td>{formatForUserTimezone(battle.battleStartTimestamp)}</td>
            {/* ... */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### 6.6: Superadmin Battle Schedule Manager

Create `frontend/src/components/admin/BattleScheduleManager.tsx`:

```typescript
/**
 * Superadmin interface for managing battle schedule
 *
 * Features:
 * - View next battle start date (in EST)
 * - Edit next battle start date
 * - View master battle list
 * - Manually create master battles (for corrections)
 */

export function BattleScheduleManager() {
  // 1. Fetch next battle date
  // 2. Display in EST timezone with clear indication
  // 3. Edit form with date/time picker (EST)
  // 4. Validation: must be future date
  // 5. Master battle list table
  // 6. Manual battle creation form
}
```

#### 6.7: Timezone Display Utilities

Create `frontend/src/utils/timezone.ts`:

```typescript
/**
 * Frontend timezone utilities
 *
 * Uses browser's Intl API for timezone conversions
 */

export function formatForUserTimezone(
  date: Date | string,
  format?: string
): string {
  // Format date in user's local timezone
}

export function formatInEST(date: Date | string): string {
  // Format date in EST timezone (for Superadmin schedule manager)
}

export function getUserTimezone(): string {
  // Get user's timezone from browser
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
```

#### 6.8: Component Tests

Create/update component tests:

- `frontend/tests/components/battles/BattleSelector.test.tsx`
- `frontend/tests/components/battles/BattleEntryForm.test.tsx`
- `frontend/tests/components/dashboard/Dashboard.test.tsx`
- `frontend/tests/components/admin/BattleScheduleManager.test.tsx`

**Verification**:

- Battle selector loads and displays correctly
- Default selection works (most recent battle)
- Cannot select future battles
- Duplicate battle warning shown
- Dates display in user's timezone
- Dashboard shows next battle countdown
- Superadmin can update next battle date
- All forms validate correctly
- Tests pass with >80% coverage

**Dependencies**: Phase 1, Phase 2, Phase 4, Phase 5

**Deliverables**:

- Updated `frontend/src/api/battles.ts`
- `frontend/src/components/battles/BattleSelector.tsx`
- Updated `frontend/src/components/battles/BattleEntryForm.tsx`
- Updated `frontend/src/components/dashboard/Dashboard.tsx`
- Updated `frontend/src/components/battles/BattleList.tsx`
- `frontend/src/components/admin/BattleScheduleManager.tsx`
- `frontend/src/utils/timezone.ts`
- Comprehensive component tests
- Updated Storybook stories (if applicable)

---

## Phase 7: Data Migration and Deployment

**Objective**: Migrate existing data and deploy changes to production

**Duration Estimate**: 3-4 hours

### Tasks

#### 7.1: Create Data Migration Script

Create `scripts/migrate-to-master-battles.ts`:

```typescript
/**
 * Migration script to populate Master Battles from existing Clan Battles
 *
 * Process:
 * 1. Extract unique battleIds from all ClanBattle records
 * 2. For each unique battleId:
 *    a. Parse battleId to get date
 *    b. Create corresponding MasterBattle entry
 *    c. Set timestamps (start = midnight EST, end = 23:59:59 2 days later)
 * 3. Verify all ClanBattle.battleId values have MasterBattle entry
 * 4. Set nextBattleStartDate = most recent battle + 3 days
 * 5. Generate migration report
 */

async function migrateBattleSchedule() {
  // Implementation
}
```

#### 7.2: Run Migration (Staging)

```bash
# Backup database first
npm run db:backup

# Run migration script
npx tsx scripts/migrate-to-master-battles.ts

# Verify data
npm run db:validate
```

#### 7.3: Validation Script

Create `scripts/validate-battle-schedule.ts`:

```typescript
/**
 * Validation script to verify battle schedule integrity
 *
 * Checks:
 * - All ClanBattle records have corresponding MasterBattle
 * - No orphaned MasterBattle entries
 * - Next battle date is set and valid
 * - Battle IDs follow YYYYMMDD format
 * - Timestamps are correct (EST -> GMT conversion)
 * - No duplicate battleIds in MasterBattle
 */
```

#### 7.4: Update Documentation

Update the following docs:

- `README.md` - Add battle scheduler info
- `database/README.md` - Document new schema
- `api/README.md` - Document API changes
- `specs/high-level-spec.md` - Update data model section

#### 7.5: Update Environment Variables

Update `.env.example` with new variables:

```bash
# Battle Scheduler
BATTLE_SCHEDULER_ENABLED=true
```

#### 7.6: Docker Compose Updates

No changes needed - scheduler runs within API container

#### 7.7: Deployment Checklist

Create `docs/deployment-checklist.md`:

```markdown
# Major Change 01 Deployment Checklist

## Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Database migration tested on staging
- [ ] Backup production database
- [ ] Review audit logs for any pending battles

## Deployment Steps

- [ ] Apply database migration
- [ ] Run data migration script
- [ ] Run validation script
- [ ] Deploy API with scheduler
- [ ] Deploy frontend
- [ ] Verify scheduler is running
- [ ] Test battle creation workflow
- [ ] Monitor logs for errors

## Post-Deployment

- [ ] Verify next battle is scheduled correctly
- [ ] Test Superadmin schedule management
- [ ] Test battle entry with new selector
- [ ] Monitor scheduler for 24 hours
- [ ] Document any issues

## Rollback Plan

- [ ] Database backup location: **\_\_\_**
- [ ] Previous API version: **\_\_\_**
- [ ] Previous frontend version: **\_\_\_**
- [ ] Rollback procedure documented
```

**Verification**:

- All existing battle data migrated successfully
- Master battles created for all unique battleIds
- Next battle date set correctly
- No data loss or corruption
- Scheduler creates battles automatically
- All functionality works end-to-end

**Dependencies**: Phase 1-6

**Deliverables**:

- `scripts/migrate-to-master-battles.ts`
- `scripts/validate-battle-schedule.ts`
- Updated documentation
- `docs/deployment-checklist.md`
- Migration report
- Validated production-ready system

---

## Testing Strategy

### Unit Tests

- **Common utilities**: Battle ID, timezone conversions, validators
- **Services**: BattleScheduler, MasterBattleService, ClanBattleService
- **Target**: >90% coverage for business logic

### Integration Tests

- **API endpoints**: All Master Battle routes, updated battle routes
- **Database**: Schema constraints, foreign keys, triggers
- **Scheduler**: Cron job execution, battle creation logic
- **Target**: >85% coverage for API routes

### E2E Tests

- **Battle entry workflow**: Select battle → enter data → submit
- **Superadmin workflow**: View schedule → update next battle date
- **Dashboard**: Next battle display, countdown timer
- **Battle list**: Display with Battle IDs and dates

### Manual Testing

- **Timezone display**: Verify dates show correctly in different timezones
- **Scheduler monitoring**: Watch logs for automatic battle creation
- **Error scenarios**: Invalid battle IDs, future battles, duplicates
- **Performance**: Battle selector load time with many battles

---

## Rollback Plan

If critical issues are discovered post-deployment:

### Quick Rollback (< 1 hour)

1. Disable scheduler via environment variable: `BATTLE_SCHEDULER_ENABLED=false`
2. Revert API deployment to previous version
3. Revert frontend deployment to previous version
4. Keep database changes (backward compatible)
5. Old system can still function with denormalized dates in ClanBattle

### Full Rollback (requires maintenance window)

1. Stop all services
2. Restore database from pre-migration backup
3. Deploy previous API version
4. Deploy previous frontend version
5. Verify data integrity
6. Resume services

### Rollback Considerations

- Master Battle table doesn't break existing functionality
- ClanBattle still has startDate/endDate (denormalized)
- Can operate without scheduler if needed
- Frontend gracefully degrades to date entry if API unavailable

---

## Monitoring and Observability

### Metrics to Track

- Battle creation rate (automatic vs manual)
- Scheduler execution time and success rate
- API endpoint response times for battle selection
- Error rates for battle creation/update
- Master Battle table growth

### Logging

- Scheduler: Log each check, battle creation, next date update
- API: Log all Master Battle mutations (create, update)
- Audit: Log all Superadmin schedule changes
- Errors: Detailed error context for debugging

### Alerts

- Scheduler failed to create battle when due
- Next battle date not set
- Database constraint violations
- Unusual spike in battle creation errors

---

## Success Criteria

The implementation is considered successful when:

1. **Data Integrity**
   - All existing battles have Master Battle entries
   - No orphaned or duplicate Battle IDs
   - Foreign key relationships intact

2. **Functionality**
   - Scheduler automatically creates battles hourly
   - Battle entry uses selection instead of date entry
   - Superadmin can manage schedule
   - All dates display correctly in user timezones

3. **Performance**
   - Battle selector loads in < 500ms
   - Scheduler job completes in < 5 seconds
   - No degradation in battle list/view performance

4. **Testing**
   - All unit tests pass (>90% coverage for business logic)
   - All integration tests pass (>85% coverage for API)
   - E2E tests pass for critical workflows
   - No regressions in existing functionality

5. **Operations**
   - Scheduler runs reliably for 7+ days without issues
   - Zero data loss or corruption
   - Monitoring and alerting functional
   - Documentation complete and accurate

---

## Timeline Estimate

| Phase                        | Duration  | Dependencies  | Risk   |
| ---------------------------- | --------- | ------------- | ------ |
| Phase 1: Database Schema     | 2-4 hours | None          | Low    |
| Phase 2: Common Utilities    | 3-4 hours | Phase 1       | Low    |
| Phase 3: Scheduler Service   | 4-6 hours | Phase 1, 2    | Medium |
| Phase 4: API - Master Battle | 4-6 hours | Phase 1, 2, 3 | Medium |
| Phase 5: API - Battle Entry  | 4-6 hours | Phase 1, 2, 4 | Medium |
| Phase 6: Frontend            | 6-8 hours | Phase 1-5     | Medium |
| Phase 7: Migration & Deploy  | 3-4 hours | Phase 1-6     | High   |

**Total Estimated Time**: 26-38 hours (3-5 days of focused work)

**Recommended Approach**:

- Implement phases sequentially
- Test thoroughly after each phase
- Review and refactor before moving to next phase
- Plan deployment during low-usage period

---

## Risk Assessment and Mitigation

### High Risk Items

1. **Data Migration**
   - Risk: Data loss or corruption during migration
   - Mitigation: Comprehensive backup, validation scripts, staged rollout

2. **Timezone Conversions**
   - Risk: Incorrect EST<->GMT conversions cause wrong Battle IDs
   - Mitigation: Extensive unit tests, manual verification of edge cases

3. **Scheduler Reliability**
   - Risk: Scheduler fails, battles not created automatically
   - Mitigation: Error handling, logging, manual fallback, monitoring

### Medium Risk Items

4. **Breaking API Changes**
   - Risk: Frontend breaks due to API changes
   - Mitigation: Backward-compatible API initially, coordinated deployment

5. **Performance**
   - Risk: Battle selector slow with many battles
   - Mitigation: Pagination, caching, database indexing

### Low Risk Items

6. **User Experience**
   - Risk: Users confused by new battle selection UI
   - Mitigation: Clear UI labels, help text, documentation

---

## Future Enhancements

After this major change is complete, the centralized schedule enables:

1. **Cross-Clan Leaderboards** - Compare performance across all clans for same
   battle
2. **Battle Reminders** - Email/push notifications for upcoming battles
3. **Historical Battle Browser** - System-wide battle calendar and search
4. **Schedule Change Management** - Better handling of Rovio schedule changes
5. **Battle Analytics** - System-wide statistics and trends
6. **Predictive Scheduling** - ML-based prediction of schedule changes
7. **Multi-Region Support** - Different schedules for different game regions

---

## Appendix A: Key Design Decisions

### Why Node-Cron Instead of External Scheduler?

**Decision**: Use node-cron embedded in API service

**Alternatives Considered**:

1. Bull/BullMQ + Valkey queue
2. Kubernetes CronJob
3. External cron daemon
4. AWS EventBridge / Cloud Scheduler

**Rationale**:

- Simple hourly job doesn't justify queue infrastructure
- TypeScript-native, easy to test and debug
- No additional deployment complexity
- Can be replaced later if job complexity increases
- Works consistently across all environments (dev, staging, prod)

### Why Denormalize Dates in ClanBattle?

**Decision**: Keep startDate/endDate in ClanBattle table

**Rationale**:

- Query performance: Avoid joins for date range queries
- Backward compatibility: Existing queries still work
- Rollback safety: Can revert to old system if needed
- Minimal storage overhead: Dates are small
- Update complexity is low: Dates never change after creation

### Why EST Instead of UTC for Battle IDs?

**Decision**: Battle IDs use Official Angry Birds Time (EST)

**Rationale**:

- Matches Rovio's official battle timing
- Consistent with how players experience battles
- Easier for users to understand (battle on "12/04" has ID "20251204")
- Storage/calculation still uses GMT/UTC for precision

---

## Appendix B: Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ BattleSelector   │  │ ScheduleManager  │                 │
│  │ (Dropdown)       │  │ (Superadmin)     │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
└───────────┼─────────────────────┼────────────────────────────┘
            │                     │
            │ HTTP/REST API       │
            │                     │
┌───────────▼─────────────────────▼────────────────────────────┐
│                          API Server                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Battle Scheduler Plugin                  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         node-cron (runs hourly)                │  │   │
│  │  │  - Checks current time vs nextBattleStartDate  │  │   │
│  │  │  - Creates MasterBattle if due                 │  │   │
│  │  │  - Updates nextBattleStartDate (+3 days)       │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ MasterBattle     │  │ ClanBattle       │                 │
│  │ Service          │  │ Service          │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
└───────────┼─────────────────────┼────────────────────────────┘
            │                     │
            │ Prisma ORM          │
            │                     │
┌───────────▼─────────────────────▼────────────────────────────┐
│                      PostgreSQL Database                      │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ master_battles   │  │ clan_battles     │                 │
│  │ ─────────────    │  │ ─────────────    │                 │
│  │ battleId (PK)    │  │ clanId (PK)      │                 │
│  │ startTimestamp   │  │ battleId (PK,FK) │──┐              │
│  │ endTimestamp     │  │ score            │  │              │
│  │ createdBy        │  │ baselineFp       │  │ Foreign Key  │
│  │ ...              │  │ startDate*       │  │              │
│  └──────────────────┘  │ endDate*         │◄─┘              │
│           ▲            │ ...              │                 │
│           │            └──────────────────┘                 │
│           │                                                  │
│  ┌────────┴─────────┐                                       │
│  │ system_settings  │                                       │
│  │ ──────────────   │  * denormalized for query performance│
│  │ key (PK)         │                                       │
│  │ value            │                                       │
│  │ ...              │                                       │
│  │                  │                                       │
│  │ Key: nextBattleStartDate                                │
│  └──────────────────┘                                       │
└───────────────────────────────────────────────────────────────┘
```

---

## Appendix C: API Endpoint Summary

### Public Endpoints (No Auth Required)

| Method | Endpoint                               | Description                                     |
| ------ | -------------------------------------- | ----------------------------------------------- |
| GET    | `/api/master-battles`                  | List all master battles (paginated)             |
| GET    | `/api/master-battles/available`        | Get available battles for selection             |
| GET    | `/api/master-battles/schedule-info`    | Get current/next battle info                    |
| GET    | `/api/clans/:clanId/battles`           | List clan battles (includes Master Battle data) |
| GET    | `/api/clans/:clanId/battles/:battleId` | Get battle details                              |

### Authenticated Endpoints (Clan Admin/Owner)

| Method | Endpoint                               | Description                       |
| ------ | -------------------------------------- | --------------------------------- |
| POST   | `/api/clans/:clanId/battles`           | Create battle (requires battleId) |
| PUT    | `/api/clans/:clanId/battles/:battleId` | Update battle                     |
| DELETE | `/api/clans/:clanId/battles/:battleId` | Delete battle                     |

### Superadmin Endpoints

| Method | Endpoint                               | Description                    |
| ------ | -------------------------------------- | ------------------------------ |
| GET    | `/api/master-battles/next-battle-date` | Get next scheduled battle date |
| PUT    | `/api/master-battles/next-battle-date` | Update next battle date        |
| POST   | `/api/master-battles`                  | Create master battle manually  |

---

## Appendix D: Environment Variables Reference

```bash
# Database (existing)
POSTGRES_USER=angrybirdman
POSTGRES_PASSWORD=angrybirdman_dev_password
POSTGRES_DB=angrybirdman

# Battle Scheduler (new)
BATTLE_SCHEDULER_ENABLED=true  # Set to false to disable automatic battle creation

# Logging (existing, relevant for monitoring)
LOG_LEVEL=info  # Set to 'debug' for verbose scheduler logs

# Development (existing)
NODE_ENV=development  # Scheduler runs immediately on startup in dev mode
```

---

## Document Control

**Version**: 1.0  
**Status**: Planning Complete  
**Last Updated**: December 4, 2025  
**Author**: AI Development Agent  
**Reviewers**: Project Owner  
**Approvals**: Pending

**Change History**:

- v1.0 (2025-12-04): Initial plan created
