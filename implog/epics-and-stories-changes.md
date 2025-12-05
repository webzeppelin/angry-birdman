# Epics and Stories Specification Changes - Battle Schedule Migration

**Date**: December 4, 2025  
**Purpose**: Update epics and stories to reflect centralized Master Battle
schedule management

## Overview

This document captures changes made to `specs/epics-and-stories.md` to align
with the new centralized battle schedule architecture. The previous design
required users to manually enter battle start and end dates, which resulted in:

1. Inconsistent Battle IDs across different clans for the same event
2. Inefficient data entry (requiring date entry for every battle)
3. Inability to compare performance across clans
4. No support for timezone-aware battle scheduling

The new architecture introduces a Master Battle schedule managed by the
Superadmin, with automatic battle creation via a scheduled job.

## Design Changes

### Core Architectural Changes

1. **Master Battle List**: Centralized table of all battles with Battle ID,
   start timestamp (GMT), and end timestamp (GMT)
2. **Next Battle Date**: System tracks the next scheduled battle start date in
   Official Angry Birds Time (EST)
3. **Scheduled Job**: Hourly job checks for new battles and automatically
   creates Master Battle entries
4. **Battle ID Generation**: Battle IDs are generated from the Official Angry
   Birds Time (EST) start date, not user input
5. **Timezone Handling**:
   - Battle IDs based on Official Angry Birds Time (EST, never EDT)
   - Timestamps stored in GMT
   - Display to users in their local timezone

### Official Angry Birds Time

The system now recognizes that Rovio uses Eastern Standard Time (EST) year-round
for battle scheduling:

- Battle starting on 12/04/2025: Battle ID = `20251204`
- Start: 12/04/2025 00:00:00 EST (05:00:00 GMT)
- End: 12/05/2025 23:59:59 EST (04:59:59 GMT the following day)
- Users see dates/times in their local timezone for convenience

## Detailed Story Changes

### Epic 2: User and Clan Management

#### NEW - Story 2.18: Manage Master Battle Schedule (Superadmin)

**Added comprehensive story for Superadmin battle schedule management**

**Capabilities Added**:

- View "Next Battle Start Date" in Official Angry Birds Time (EST)
- Edit "Next Battle Start Date" before battle starts (for schedule corrections)
- View complete Master Battle list (all past and current battles)
- Master Battle list displays: Battle ID (YYYYMMDD), Start Timestamp (GMT), End
  Timestamp (GMT)
- Local timezone display for user convenience
- Automatic battle creation when current time passes "Next Battle Start Date"
- Automatic next battle scheduling (3 days after newly created battle)
- Hourly scheduled job checks for and creates new battles
- Audit logging of all schedule changes

**Acceptance Criteria**:

- Date picker shows EST timezone with clear indication
- System validates future dates only
- Battle timestamps use Official Angry Birds Time (EST always, never EDT)
- All changes logged in audit log

**Rationale**: Provides Superadmin with tools to manage the central battle
schedule and correct it when Rovio changes their timing.

---

### Epic 4: Record Clan Battle Data

#### MODIFIED - Story 4.2: Select Battle and Enter Metadata

**Previous Title**: "Enter Battle Metadata"  
**New Title**: "Select Battle and Enter Metadata"

**Changes**:

**BEFORE**:

- Form fields: start date, end date, opponent name, opponent Rovio ID, opponent
  country
- System checks for existing battle on selected date
- Start date defaults to most recent battle + 3 days
- End date defaults to start date + 1 day
- Battle ID generated from user-entered start date
- Manual date entry with validation

**AFTER**:

- Battle selection dropdown shows available battles from Master Battle list
- Battles displayed with Battle ID (YYYYMMDD) and dates in user's local timezone
- Most recent uncompleted battle selected by default
- Dropdown sorted with most recent battles first
- Only started battles available (no future battles)
- System checks if selected battle already has data recorded
- Form fields after selection: opponent name, opponent Rovio ID, opponent
  country
- Battle start/end dates automatically populated from Master Battle entry
- No manual date entry required

**Rationale**: Eliminates manual date entry, ensures consistency across clans,
and defaults to the most common use case (recording the most recent battle).

---

#### MODIFIED - Story 4.10: Save Battle Draft

**Changes**:

**BEFORE**:

- Only one draft per battle date is allowed

**AFTER**:

- Only one draft per battle ID is allowed

**Rationale**: Aligns with new battle identification system where Battle ID (not
user-entered date) is the primary key.

---

### Epic 5: View Clan Battle Stats

#### MODIFIED - Story 5.1: View Battle List

**Changes**:

**BEFORE**:

- Battle list shows: date, opponent, result, clan score, opponent score, clan
  ratio
- List sorted by date (most recent first)

**AFTER**:

- Battle list shows: Battle ID (YYYYMMDD), date (displayed in user's local
  timezone), opponent, result, clan score, opponent score, clan ratio
- Battle dates retrieved from Master Battle schedule
- List sorted by Battle ID (most recent first) by default

**Rationale**: Makes Battle ID visible to users, clarifies timezone display, and
ensures consistency with Master Battle schedule.

---

#### MODIFIED - Story 5.2: View Battle Overview

**Changes**:

**BEFORE**:

- Battle detail page shows: date, opponent information, result

**AFTER**:

- Battle detail page shows: Battle ID (YYYYMMDD), battle dates (start/end in
  user's local timezone, with indication they are from Official Angry Birds
  Time), opponent information, result
- Battle dates retrieved from Master Battle schedule

**Rationale**: Provides complete battle identification including Battle ID,
clarifies timezone display, and indicates the official timing source.

---

### Epic 7: Analyze and Visualize Clan Data

#### MODIFIED - Story 7.9: Dashboard Summary View

**Changes**:

**BEFORE**:

- Dashboard shows: recent battles (last 5), current month stats summary, next
  battle countdown

**AFTER**:

- Dashboard shows: recent battles (last 5), current month stats summary, next
  battle countdown (using Master Battle schedule)
- Next battle information displays Battle ID, start date/time in user's local
  timezone

**Rationale**: Integrates Master Battle schedule into dashboard, provides clear
next battle information.

---

## Stories NOT Changed

The following stories were reviewed but did not require changes:

### Epic 1: General and Navigation

- All navigation stories remain unchanged
- Navigation concepts (Record Battle, etc.) are implementation-agnostic
- No references to specific date entry mechanisms

### Epic 3: Maintain Clan Roster

- Roster management is independent of battle scheduling
- No changes needed

### Epic 4: Record Clan Battle Data

- Stories 4.1, 4.3-4.9, 4.11 remain unchanged
- These focus on data entry workflow, not battle identification

### Epic 5: View Clan Battle Stats

- Stories 5.3-5.10 remain unchanged
- These focus on displaying calculated statistics, not battle identification

### Epic 6: View Rolled-Up Monthly and Yearly Stats

- All stories remain unchanged
- Monthly/yearly aggregations use Battle IDs regardless of how they're generated

### Epic 7: Analyze and Visualize Clan Data

- Stories 7.1-7.8 remain unchanged
- Reports and visualizations work with Battle IDs regardless of source

## Implementation Impact

### Database Schema Changes Required

1. **New Table: MasterBattle**
   - battleId (String, PK) - Format: YYYYMMDD
   - startTimestamp (DateTime, GMT)
   - endTimestamp (DateTime, GMT)

2. **New System Setting: NextBattleStartDate**
   - Store as timestamp in Official Angry Birds Time (EST)

3. **Modified: ClanBattle Table**
   - battleId now foreign key to MasterBattle
   - Remove startDate and endDate fields (get from MasterBattle)
   - OR keep as denormalized for query performance

### API Changes Required

1. **New Endpoints**:
   - GET /api/admin/master-battles - List all master battles
   - GET /api/admin/next-battle - Get next scheduled battle
   - PUT /api/admin/next-battle - Update next battle date (Superadmin only)
   - GET /api/battles/available - Get available battles for selection (started
     but not in future)

2. **Modified Endpoints**:
   - POST /api/clans/{clanId}/battles - Accept battleId instead of
     startDate/endDate
   - PUT /api/clans/{clanId}/battles/{battleId} - Battle ID is now from master
     schedule
   - GET /api/clans/{clanId}/battles - Return Master Battle metadata with clan
     data

### Frontend Changes Required

1. **New Components**:
   - MasterBattleScheduleManager (Superadmin)
   - BattleSelector dropdown component
   - NextBattleDisplay component

2. **Modified Components**:
   - BattleEntryForm - Replace date inputs with battle selector
   - BattleList - Display Battle ID and timezone-adjusted dates
   - BattleDashboard - Show next battle from Master schedule

### Scheduled Job Required

1. **New Job: Battle Schedule Checker**
   - Runs hourly
   - Checks if current time (GMT) > next battle start time
   - Creates new MasterBattle entry if needed
   - Updates NextBattleStartDate to +3 days
   - Logs actions to audit log

## Benefits of Changes

1. **Consistency**: All clans use same Battle IDs for same events
2. **Efficiency**: 99% of users just select default battle (most recent)
3. **Cross-Clan Comparison**: Future feature enabling comparison between clans
4. **Timezone Clarity**: Clear distinction between Official Angry Birds Time
   (EST) and user display timezone
5. **Reduced Errors**: No manual date entry eliminates date-related data entry
   errors
6. **Automation**: Scheduled job reduces Superadmin burden for routine battle
   creation

## Migration Strategy

Since data will be reseeded after these changes:

1. Create Master Battle table
2. Seed with historical battles from existing ClanBattle dates
3. Set NextBattleStartDate based on most recent battle + 3 days
4. Deploy scheduled job
5. Update API endpoints
6. Update frontend components
7. Import clan data referencing new Master Battle IDs

## Future Enhancements

The centralized battle schedule enables future features:

1. **Cross-Clan Leaderboards**: Compare performance across all clans for same
   battle
2. **Battle Reminders**: Notify users of upcoming battles
3. **Historical Battle Browser**: Browse all battles system-wide
4. **Schedule Changes**: Handle Rovio schedule changes gracefully
5. **Battle Analytics**: System-wide battle statistics and trends

## Conclusion

These specification changes lay the foundation for a more robust, consistent,
and user-friendly battle data management system. By centralizing the battle
schedule, we eliminate inconsistencies, reduce manual data entry, and enable
future cross-clan features while maintaining clarity about timezone handling.
