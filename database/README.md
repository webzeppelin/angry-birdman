# Angry Birdman Database

This directory contains the database schema, migrations, and seeding scripts for
the Angry Birdman clan management system.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Database Schema](#database-schema)
5. [Getting Started](#getting-started)
6. [Development Workflows](#development-workflows)
7. [Prisma Commands](#prisma-commands)
8. [Data Model Reference](#data-model-reference)
9. [Relationships](#relationships)
10. [Indexes and Performance](#indexes-and-performance)
11. [Seed Data](#seed-data)
12. [Backup and Restore](#backup-and-restore)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The Angry Birdman database uses **PostgreSQL** as the relational database and
**Prisma ORM** for schema management, migrations, and type-safe database access.
The schema is designed to support:

- Multi-clan management with role-based access control
- Efficient battle data capture and storage
- Complex performance calculations and rankings
- Monthly and yearly statistical rollups
- Comprehensive audit trails with timestamps

---

## Technology Stack

- **Database**: PostgreSQL 15+
- **ORM**: Prisma 6.19.0 (upgraded from 5.22.0 - see
  [PRISMA6-UPGRADE.md](./PRISMA6-UPGRADE.md))
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20 LTS+
- **Containerization**: Docker + Docker Compose

---

## Directory Structure

```
database/
├── prisma/
│   ├── migrations/           # Database migration files
│   │   └── 20241108002947_init/
│   │       └── migration.sql # Initial schema migration
│   ├── schema.prisma         # Prisma schema definition
│   ├── seed.ts               # Database seeding script
│   ├── .env                  # Prisma environment variables (not in git)
│   └── .gitignore            # Prisma-specific gitignore
├── node_modules/             # Dependencies
├── .gitignore                # Database directory gitignore
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
├── test-prisma.ts            # Prisma Client test script
└── README.md                 # This file
```

---

## Database Schema

The database consists of **13 core tables** organized into logical groups:

### System Configuration

- **system_settings** - Global configuration settings (next battle date,
  scheduler config)
- **master_battles** - Centralized schedule of all CvC battles (system-wide)

### Core Entities

- **clans** - Clan metadata and registration
- **users** - Administrator user accounts (linked to Keycloak)
- **roster_members** - Individual players in each clan
- **action_codes** - Post-battle action lookup table

### Battle Data

- **clan_battles** - Individual CvC battle records (linked to Master Battle)
- **clan_battle_player_stats** - Player performance in battles
- **clan_battle_nonplayer_stats** - Non-participating player tracking

### Aggregated Statistics

- **monthly_clan_performance** - Monthly clan performance summaries
- **monthly_individual_performance** - Monthly player performance summaries
- **yearly_clan_performance** - Yearly clan performance summaries
- **yearly_individual_performance** - Yearly player performance summaries

For detailed field definitions, see
[Data Model Reference](#data-model-reference) below.

---

## Getting Started

### Prerequisites

1. **Docker** and **Docker Compose** installed and running
2. **Node.js 20+** and **npm** installed
3. PostgreSQL container running (see `docker-compose.yml` in project root)

### Initial Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Verify database connection:**

   Ensure PostgreSQL is running:

   ```bash
   docker ps | grep postgres
   ```

   Expected output should show `angrybirdman-postgres` with status "Up" and
   "healthy".

3. **Run initial migration:**

   ```bash
   npm run migrate:dev
   ```

   This creates all tables, indexes, and constraints.

4. **Seed the database:**

   ```bash
   npm run seed
   ```

   This populates the database with sample data for development.

5. **Verify setup:**

   ```bash
   npx tsx test-prisma.ts
   ```

   This runs basic queries to ensure Prisma Client is working correctly.

---

## Development Workflows

### Making Schema Changes

1. **Edit `prisma/schema.prisma`** to modify the data model

2. **Create a new migration:**

   ```bash
   npm run migrate:dev -- --name descriptive_name
   ```

   This generates a new migration file and applies it to the database.

3. **Review the generated migration** in `prisma/migrations/`

4. **Test the changes** with your application code

### Resetting the Database

To completely reset the database (⚠️ **destroys all data**):

```bash
npm run migrate:reset
```

This will:

- Drop the database
- Recreate it
- Run all migrations
- Run the seed script

### Viewing Data

Use Prisma Studio for a web-based GUI:

```bash
npm run studio
```

This opens `http://localhost:5555` with a data browser.

---

## Prisma Commands

### Migration Commands

```bash
# Create and apply a new migration
npm run migrate:dev -- --name migration_name

# Apply pending migrations (production)
npm run migrate:deploy

# Reset database (development only)
npm run migrate:reset

# View migration status
npx prisma migrate status --schema=prisma/schema.prisma
```

### Generation Commands

```bash
# Generate Prisma Client
npm run generate

# Validate schema
npm run validate

# Format schema file
npm run format
```

### Database Commands

```bash
# Push schema changes without migrations (development)
npm run db:push

# Pull schema from database (introspection)
npm run db:pull
```

### Data Commands

```bash
# Run seed script
npm run seed

# Open Prisma Studio
npm run studio
```

---

## Data Model Reference

### System Settings

System-wide configuration settings.

| Field       | Type     | Description                                              | Nullable |
| :---------- | :------- | :------------------------------------------------------- | :------- |
| key         | String   | Primary key (e.g., "nextBattleStartDate")                | No       |
| value       | String   | JSON-encoded value                                       | No       |
| description | String   | Optional description of the setting                      | Yes      |
| dataType    | String   | Data type: 'string', 'number', 'boolean', 'date', 'json' | No       |
| createdAt   | DateTime | Record creation timestamp                                | No       |
| updatedAt   | DateTime | Record update timestamp                                  | No       |

**Key Settings**:

- `nextBattleStartDate` - ISO timestamp for next battle (EST timezone)
- `schedulerEnabled` - Boolean to enable/disable automatic battle creation

**Relationships**: System-wide, no foreign keys

### Master Battles

Centralized schedule of all CvC battles in Official Angry Birds Time (EST).

| Field          | Type     | Description                           | Nullable |
| :------------- | :------- | :------------------------------------ | :------- |
| battleId       | String   | Primary key (YYYYMMDD format)         | No       |
| startTimestamp | DateTime | Battle start time (GMT)               | No       |
| endTimestamp   | DateTime | Battle end time (GMT)                 | No       |
| createdBy      | String   | userId of creator (NULL if automatic) | Yes      |
| notes          | String   | Optional notes about schedule changes | Yes      |
| createdAt      | DateTime | Record creation timestamp             | No       |
| updatedAt      | DateTime | Record update timestamp               | No       |

**Indexes**: startTimestamp  
**Relationships**: Has many ClanBattles (one-to-many)

**Note**: Battles are automatically created every 3 days by the battle scheduler
service. Start/end times are stored in GMT but Battle IDs are based on EST
dates.

### Clans

Represents a clan using Angry Birdman to manage their data.

| Field            | Type     | Description                   | Default       | Nullable |
| :--------------- | :------- | :---------------------------- | :------------ | :------- |
| clanId           | Int      | Auto-increment primary key    | autoincrement | No       |
| rovioId          | Int      | Unique Rovio-assigned clan ID | -             | No       |
| name             | String   | Clan name                     | -             | No       |
| country          | String   | Clan's country                | -             | No       |
| registrationDate | DateTime | Date registered with system   | now()         | No       |
| active           | Boolean  | Whether clan is active        | true          | No       |
| createdAt        | DateTime | Record creation timestamp     | now()         | No       |
| updatedAt        | DateTime | Record update timestamp       | now()         | No       |

**Indexes**: rovioId (unique), active, name  
**Relationships**: Has many users, roster members, battles, and statistics

### Users

Administrator users managing clan data (backed by Keycloak).

| Field     | Type     | Description                            | Default | Nullable |
| :-------- | :------- | :------------------------------------- | :------ | :------- |
| userId    | String   | Primary key (matches Keycloak ID)      | -       | No       |
| username  | String   | Unique username                        | -       | No       |
| email     | String   | User email address                     | -       | No       |
| clanId    | Int      | Associated clan (null for superadmins) | -       | Yes      |
| owner     | Boolean  | True if Clan Owner                     | false   | No       |
| createdAt | DateTime | Record creation timestamp              | now()   | No       |
| updatedAt | DateTime | Record update timestamp                | now()   | No       |

**Indexes**: username (unique), clanId, email  
**Relationships**: Belongs to clan (optional)

### Roster Members

Individual players in a clan's roster.

| Field      | Type     | Description                | Default       | Nullable |
| :--------- | :------- | :------------------------- | :------------ | :------- |
| playerId   | Int      | Auto-increment primary key | autoincrement | No       |
| clanId     | Int      | Clan identifier            | -             | No       |
| playerName | String   | Player display name        | -             | No       |
| active     | Boolean  | Currently in clan          | true          | No       |
| joinedDate | DateTime | Date joined clan           | -             | No       |
| leftDate   | DateTime | Date left clan             | -             | Yes      |
| kickedDate | DateTime | Date kicked from clan      | -             | Yes      |
| createdAt  | DateTime | Record creation timestamp  | now()         | No       |
| updatedAt  | DateTime | Record update timestamp    | now()         | No       |

**Indexes**: clanId, active, playerName  
**Unique Constraint**: (clanId, playerName)  
**Relationships**: Belongs to clan, has many player/nonplayer stats

### Action Codes

Lookup table for post-battle actions.

| Field       | Type     | Description                | Nullable |
| :---------- | :------- | :------------------------- | :------- |
| actionCode  | String   | Primary key (e.g., "HOLD") | No       |
| displayName | String   | User-friendly name         | No       |
| createdAt   | DateTime | Record creation timestamp  | No       |
| updatedAt   | DateTime | Record update timestamp    | No       |

**Default Values**: HOLD, WARN, KICK, RESERVE, PASS

### Clan Battles

Individual Clan-vs-Clan (CvC) battle records.

| Field             | Type     | Description                              | Calculated | Nullable |
| :---------------- | :------- | :--------------------------------------- | :--------- | :------- |
| clanId            | Int      | Clan identifier (PK)                     | No         | No       |
| battleId          | String   | Battle ID: YYYYMMDD (PK, FK)             | Yes        | No       |
| startDate         | DateTime | Battle start date (denormalized from MB) | No         | No       |
| endDate           | DateTime | Battle end date (denormalized from MB)   | No         | No       |
| result            | Int      | 1=Win, -1=Loss, 0=Tie                    | Yes        | No       |
| score             | Int      | Clan's total score                       | No         | No       |
| fp                | Int      | Sum of all FP (excl. reserves)           | Yes        | No       |
| baselineFp        | Int      | Clan baseline FP                         | No         | No       |
| ratio             | Float    | (score / baselineFp) \* 10               | Yes        | No       |
| averageRatio      | Float    | (score / fp) \* 10                       | Yes        | No       |
| projectedScore    | Float    | Score if all played                      | Yes        | No       |
| opponentName      | String   | Opponent clan name                       | No         | No       |
| opponentRovioId   | Int      | Opponent Rovio ID                        | No         | No       |
| opponentCountry   | String   | Opponent country                         | No         | No       |
| opponentScore     | Int      | Opponent's score                         | No         | No       |
| opponentFp        | Int      | Opponent baseline FP                     | No         | No       |
| marginRatio       | Float    | Win/loss margin %                        | Yes        | No       |
| fpMargin          | Float    | FP difference %                          | Yes        | No       |
| nonplayingCount   | Int      | Non-players (excl. reserves)             | Yes        | No       |
| nonplayingFpRatio | Float    | % FP from non-players                    | Yes        | No       |
| reserveCount      | Int      | Reserve players count                    | Yes        | No       |
| reserveFpRatio    | Float    | % FP from reserves                       | Yes        | No       |
| createdAt         | DateTime | Record creation timestamp                | No         | No       |
| updatedAt         | DateTime | Record update timestamp                  | No         | No       |

**Indexes**: clanId, battleId, startDate  
**Composite Primary Key**: (clanId, battleId)  
**Foreign Keys**: battleId → MasterBattle.battleId (Restrict)  
**Relationships**: Belongs to Clan, Belongs to MasterBattle

**Note**: startDate and endDate are denormalized from MasterBattle for query
performance. Battle ID must exist in MasterBattle before ClanBattle can be
created.

### Clan Battle Player Stats

Individual player performance in a battle.

| Field        | Type     | Description               | Calculated | Nullable |
| :----------- | :------- | :------------------------ | :--------- | :------- |
| clanId       | Int      | Clan identifier (PK)      | No         | No       |
| battleId     | String   | Battle ID (PK)            | No         | No       |
| playerId     | Int      | Player identifier (PK)    | No         | No       |
| rank         | Int      | Overall score ranking     | No         | No       |
| score        | Int      | Battle points earned      | No         | No       |
| fp           | Int      | Player's flock power      | No         | No       |
| ratio        | Float    | (score / fp) \* 10        | Yes        | No       |
| ratioRank    | Int      | Ranking by ratio          | Yes        | No       |
| actionCode   | String   | Post-battle action        | No         | No       |
| actionReason | String   | Optional reason           | No         | Yes      |
| createdAt    | DateTime | Record creation timestamp | No         | No       |
| updatedAt    | DateTime | Record update timestamp   | No         | No       |

**Indexes**: (clanId, battleId), playerId, ratio  
**Composite Primary Key**: (clanId, battleId, playerId)

### Clan Battle Nonplayer Stats

Non-participating roster members in a battle.

| Field        | Type     | Description               | Nullable |
| :----------- | :------- | :------------------------ | :------- |
| clanId       | Int      | Clan identifier (PK)      | No       |
| battleId     | String   | Battle ID (PK)            | No       |
| playerId     | Int      | Player identifier (PK)    | No       |
| fp           | Int      | Player's flock power      | No       |
| reserve      | Boolean  | In reserve status         | No       |
| actionCode   | String   | Post-battle action        | No       |
| actionReason | String   | Optional reason           | Yes      |
| createdAt    | DateTime | Record creation timestamp | No       |
| updatedAt    | DateTime | Record update timestamp   | No       |

**Indexes**: (clanId, battleId), playerId, reserve  
**Composite Primary Key**: (clanId, battleId, playerId)

### Monthly Clan Performance

Monthly clan performance summary (calculated/aggregated).

| Field                    | Type     | Description               | Nullable |
| :----------------------- | :------- | :------------------------ | :------- |
| clanId                   | Int      | Clan identifier (PK)      | No       |
| monthId                  | String   | Month: YYYYMM (PK)        | No       |
| battleCount              | Int      | Battles in month          | No       |
| wonCount                 | Int      | Wins in month             | No       |
| lostCount                | Int      | Losses in month           | No       |
| tiedCount                | Int      | Ties in month             | No       |
| monthComplete            | Boolean  | Month closed              | No       |
| averageFp                | Float    | Avg total FP              | No       |
| averageBaselineFp        | Float    | Avg baseline FP           | No       |
| averageRatio             | Float    | Avg clan ratio            | No       |
| averageMarginRatio       | Float    | Avg win/loss margin       | No       |
| averageFpMargin          | Float    | Avg FP margin             | No       |
| averageNonplayingCount   | Float    | Avg non-players           | No       |
| averageNonplayingFpRatio | Float    | Avg non-player FP %       | No       |
| averageReserveCount      | Float    | Avg reserves              | No       |
| averageReserveFpRatio    | Float    | Avg reserve FP %          | No       |
| createdAt                | DateTime | Record creation timestamp | No       |
| updatedAt                | DateTime | Record update timestamp   | No       |

**Indexes**: monthId  
**Composite Primary Key**: (clanId, monthId)

### Monthly Individual Performance

Monthly player performance summary (calculated/aggregated).

_Note: Only includes players with 3+ battles in the month._

| Field            | Type     | Description               | Nullable |
| :--------------- | :------- | :------------------------ | :------- |
| clanId           | Int      | Clan identifier (PK)      | No       |
| monthId          | String   | Month: YYYYMM (PK)        | No       |
| playerId         | Int      | Player identifier (PK)    | No       |
| battlesPlayed    | Int      | Battles played (≥3)       | No       |
| averageScore     | Float    | Avg score                 | No       |
| averageFp        | Float    | Avg FP                    | No       |
| averageRatio     | Float    | Avg ratio                 | No       |
| averageRank      | Float    | Avg rank                  | No       |
| averageRatioRank | Float    | Avg ratio rank            | No       |
| createdAt        | DateTime | Record creation timestamp | No       |
| updatedAt        | DateTime | Record update timestamp   | No       |

**Indexes**: monthId, playerId  
**Composite Primary Key**: (clanId, monthId, playerId)

### Yearly Clan Performance

Yearly clan performance summary (same structure as monthly, different time
period).

**Composite Primary Key**: (clanId, yearId)  
**yearId Format**: YYYY (e.g., "2024")

### Yearly Individual Performance

Yearly player performance summary (same structure as monthly, different time
period).

**Composite Primary Key**: (clanId, yearId, playerId)  
**yearId Format**: YYYY (e.g., "2024")

---

## Relationships

### Entity Relationship Diagram (Text)

```
SystemSettings (system-wide config, no foreign keys)

MasterBattle (centralized schedule)
└─ Has Many: ClanBattles

Clan
├─ Has Many: Users
├─ Has Many: RosterMembers
├─ Has Many: ClanBattles
├─ Has Many: MonthlyClanPerformance
├─ Has Many: YearlyClanPerformance
├─ Has Many: MonthlyIndividualPerformance
└─ Has Many: YearlyIndividualPerformance

User
└─ Belongs To: Clan (optional)

RosterMember
├─ Belongs To: Clan
├─ Has Many: ClanBattlePlayerStats
├─ Has Many: ClanBattleNonplayerStats
├─ Has Many: MonthlyIndividualPerformance
└─ Has Many: YearlyIndividualPerformance

ClanBattle
├─ Belongs To: Clan
├─ Belongs To: MasterBattle (battleId FK)
├─ Has Many: ClanBattlePlayerStats
└─ Has Many: ClanBattleNonplayerStats

ClanBattlePlayerStats
├─ Belongs To: ClanBattle (composite FK)
├─ Belongs To: RosterMember
└─ Belongs To: ActionCode

ClanBattleNonplayerStats
├─ Belongs To: ClanBattle (composite FK)
├─ Belongs To: RosterMember
└─ Belongs To: ActionCode

ActionCode
├─ Has Many: ClanBattlePlayerStats
└─ Has Many: ClanBattleNonplayerStats
```

### Cascade Behavior

- **Clan deletion**: Cascades to all related records (users, roster, battles,
  stats)
- **Battle deletion**: Cascades to player/nonplayer stats
- **RosterMember deletion**: Cascades to all player/nonplayer stats
- **ActionCode deletion**: Restricted (cannot delete if in use)
- **User.clanId**: Set to NULL on clan deletion

---

## Indexes and Performance

### Primary Indexes

All tables have primary keys with automatic indexes:

- Single-column PKs: Auto-indexed
- Composite PKs: Indexed on all columns

### Foreign Key Indexes

All foreign keys are indexed for join performance:

- `users.clan_id`
- `roster_members.clan_id`
- `clan_battles.clan_id`
- Battle stats foreign keys

### Additional Indexes

**Performance-critical indexes:**

- `clans.rovio_id` (unique) - Clan lookup by Rovio ID
- `clans.active` - Filtering active clans
- `clans.name` - Clan search by name
- `roster_members.active` - Filtering active players
- `clan_battles.start_date` - Date range queries
- `clan_battle_player_stats.ratio` - Ratio-based sorting

**Unique Constraints:**

- `clans.rovio_id`
- `users.username`
- `roster_members(clan_id, player_name)` - No duplicate names per clan

### Query Optimization Tips

1. **Always filter by `clanId` first** - Most queries are clan-scoped
2. **Use indexed columns in WHERE clauses** - Leverage existing indexes
3. **Limit result sets** - Use pagination for large datasets
4. **Use `select` to fetch only needed fields** - Reduce data transfer
5. **Use `include` wisely** - Avoid N+1 queries

Example optimized query:

```typescript
const battles = await prisma.clanBattle.findMany({
  where: {
    clanId: 1, // Indexed
    startDate: {
      gte: startDate, // Indexed
      lte: endDate,
    },
  },
  include: {
    playerStats: {
      // Single query with join
      include: {
        player: true,
      },
    },
  },
  orderBy: {
    startDate: 'desc',
  },
  take: 20, // Pagination
});
```

---

## Seed Data

The seed script (`prisma/seed.ts`) populates the database with realistic sample
data for development and testing.

### What Gets Seeded

1. **Action Codes**: All 5 standard action codes (HOLD, WARN, KICK, RESERVE,
   PASS)
2. **Clans**: 3 sample clans (2 active, 1 inactive)
3. **Users**: 4 users with different roles
   - 2 Clan Owners
   - 1 Clan Admin
   - 1 Superadmin
4. **Roster Members**: 17 total players across clans
   - Active players with varying FP levels
   - Reserve players (low FP)
   - Inactive players (left/kicked)
5. **Battles**: 1 complete battle with:
   - 8 player stats records
   - 4 nonplayer stats records (2 non-reserve, 2 reserve)
   - Realistic calculated values
6. **Monthly Stats**: 1 monthly clan performance summary

### Running the Seed Script

```bash
# Run seed explicitly
npm run seed

# Seed automatically runs after migrate:reset
npm run migrate:reset
```

### Customizing Seed Data

Edit `prisma/seed.ts` to modify:

- Number of clans/users/players
- Battle dates and scores
- Player FP values
- Action code assignments

---

## Backup and Restore

### Backup Database

```bash
# Full database backup
docker exec angrybirdman-postgres pg_dump -U angrybirdman -d angrybirdman > backup.sql

# Backup with compression
docker exec angrybirdman-postgres pg_dump -U angrybirdman -d angrybirdman | gzip > backup.sql.gz

# Backup specific schema only
docker exec angrybirdman-postgres pg_dump -U angrybirdman -d angrybirdman --schema-only > schema.sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i angrybirdman-postgres psql -U angrybirdman -d angrybirdman < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | docker exec -i angrybirdman-postgres psql -U angrybirdman -d angrybirdman
```

### Automated Backups

For production, set up automated backups using:

- PostgreSQL built-in tools (pg_dump via cron)
- Docker volume backups
- Cloud provider backup services (AWS RDS, Google Cloud SQL, etc.)

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to database

**Solutions**:

1. Verify PostgreSQL container is running:

   ```bash
   docker ps | grep postgres
   ```

2. Check database connection string in `prisma/.env`:

   ```
   DATABASE_URL="postgresql://angrybirdman:angrybirdman_dev_password@localhost:5432/angrybirdman?schema=public"
   ```

3. Test connection manually:
   ```bash
   docker exec -it angrybirdman-postgres psql -U angrybirdman -d angrybirdman
   ```

### Migration Errors

**Problem**: Migration fails with "relation already exists"

**Solution**: Reset the database:

```bash
npm run migrate:reset
```

**Problem**: Migration history out of sync

**Solution**: Mark migrations as applied without running:

```bash
npx prisma migrate resolve --applied <migration_name> --schema=prisma/schema.prisma
```

### Prisma Client Issues

**Problem**: Prisma Client not generated or outdated

**Solution**: Regenerate Prisma Client:

```bash
npm run generate
```

**Problem**: Type errors after schema changes

**Solution**:

1. Run migration: `npm run migrate:dev`
2. Regenerate client: `npm run generate`
3. Restart TypeScript server in your IDE

### Seed Script Errors

**Problem**: Seed script fails with constraint violations

**Solution**: Reset database and run seed:

```bash
npm run migrate:reset
```

**Problem**: Duplicate key errors during seeding

**Solution**: The seed script uses `upsert` for most records. If issues persist,
check for hardcoded IDs that may conflict.

### Performance Issues

**Problem**: Slow queries

**Solutions**:

1. Check query plans using `EXPLAIN ANALYZE`
2. Ensure you're using indexed columns in WHERE clauses
3. Add indexes if needed (requires new migration)
4. Use `select` to fetch only required fields
5. Implement pagination for large datasets

**Problem**: High memory usage

**Solutions**:

1. Limit result sets with `take` and `skip`
2. Use streaming for large datasets
3. Implement cursor-based pagination
4. Increase PostgreSQL memory settings if needed

### Docker Issues

**Problem**: Cannot start PostgreSQL container

**Solution**: Check logs:

```bash
docker logs angrybirdman-postgres
```

**Problem**: Port 5432 already in use

**Solution**: Either:

1. Stop other PostgreSQL instances
2. Change port in `docker-compose.yml` and update `DATABASE_URL`

---

## Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Project Specification**: See `/specs/high-level-spec.md` Section 6 (Data
  Concepts)
- **Implementation Plan**: See `/specs/implementation-plan.md` Step 2.2

---

## Contributing

When making database changes:

1. **Update the schema**: Edit `prisma/schema.prisma`
2. **Create a migration**: Run `npm run migrate:dev -- --name descriptive_name`
3. **Update seed data**: If needed, modify `prisma/seed.ts`
4. **Update documentation**: Keep this README in sync with schema changes
5. **Test thoroughly**: Run `npm run migrate:reset` to test full setup
6. **Commit migration files**: Include migration SQL in version control

---

**Last Updated**: November 7, 2025  
**Schema Version**: 1.0 (Initial implementation)  
**Migration**: 20241108002947_init
