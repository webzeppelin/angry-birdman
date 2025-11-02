# Angry Birdman PostgreSQL Database

This directory contains the PostgreSQL database schema and seed data for the Angry Birdman clan management system.

## Files

- **`schema.sql`** - Complete database schema with all tables, constraints, indexes, and triggers
- **`seed-data.sql`** - Initial data for lookup tables (action codes) and optional test data
- **`README.md`** - This file - documentation for the database schema

## Database Overview

The Angry Birdman database uses PostgreSQL 15+ and implements a normalized relational schema designed for data integrity, performance, and maintainability.

### Design Principles

1. **Referential Integrity** - Foreign key constraints ensure valid relationships
2. **Data Validation** - Check constraints validate data at the database level
3. **Performance** - Indexes optimize common query patterns
4. **Auditability** - Timestamps and audit log track changes
5. **Documentation** - SQL comments document purpose and relationships

## Schema Structure

### Lookup Tables

#### `action_codes`
Post-battle player action codes (HOLD, WARN, KICK, RESERVE, PASS).
- Managed by Superadmin
- Extensible for future actions
- Soft deletion via `active` flag

### Core Entity Tables

#### `clans`
Registered clans using Angry Birdman.
- Primary Key: `clan_id` (auto-generated)
- Unique: `rovio_id` (Rovio's clan identifier)
- Tracks active/inactive status

#### `clan_admin_users`
Administrative users with clan associations.
- Primary Key: `user_id` (Keycloak subject ID)
- Unique: `username` (user-chosen, can be changed)
- Authentication via Keycloak - passwords NOT stored here
- Foreign Key: `clan_id` (nullable - may not be assigned yet)
- Roles: regular admin, clan owner, superadmin

#### `admin_requests`
Pending and historical admin access requests.
- Users request admin access to clans
- Existing admins approve/reject requests
- Status: PENDING, ACCEPTED, REJECTED
- Includes optional request message (max 256 chars)

#### `roster_members`
Clan member rosters (players).
- Primary Key: `player_id` (auto-generated)
- Tracks active/inactive status
- Records join, leave, and kick dates
- Cannot have both `left_date` and `kicked_date` set

### Battle Data Tables

#### `clan_battles`
Core battle records with comprehensive performance metrics.
- Composite Primary Key: `(clan_id, battle_id)`
- Battle ID format: `YYYYMMDD` (generated from start date)
- Captures clan performance, opponent data, calculated statistics
- Result: -1 (loss), 0 (tie), 1 (win)
- Key metrics:
  - `ratio` - Official clan ratio: (score / baseline_fp) * 10
  - `average_ratio` - Average ratio: (score / fp) * 10
  - `margin_ratio` - Win/loss margin as % of our score
  - `fp_margin` - FP advantage/disadvantage as %
  - Participation metrics (nonplaying counts and ratios)

#### `battle_player_stats`
Individual player performance in battles.
- Composite Primary Key: `(clan_id, battle_id, player_id)`
- Performance metrics: rank, score, FP, ratio, ratio_rank
- Post-battle action code and optional reason
- Ratio calculation: (score / fp) * 10

#### `battle_nonplayer_stats`
Non-participating roster members in battles.
- Composite Primary Key: `(clan_id, battle_id, player_id)`
- Tracks FP and reserve status
- Reserve players excluded from participation stats
- Post-battle action code and optional reason

### Aggregated Statistics Tables

#### `monthly_clan_stats`
Rolled-up monthly clan performance statistics.
- Composite Primary Key: `(clan_id, month_id)`
- Month ID format: `YYYYMM`
- Battle counts (total, won, lost, tied)
- Averaged performance and participation metrics
- `month_complete` flag indicates finalized month

#### `monthly_individual_stats`
Rolled-up monthly player performance statistics.
- Composite Primary Key: `(clan_id, month_id, player_id)`
- **Minimum 3 battles** required for inclusion
- Averaged metrics: score, FP, ratio, rank, ratio_rank

#### `yearly_clan_stats`
Rolled-up yearly clan performance statistics.
- Composite Primary Key: `(clan_id, year_id)`
- Year ID format: `YYYY`
- Structure mirrors monthly stats but aggregates over full year

#### `yearly_individual_stats`
Rolled-up yearly player performance statistics.
- Composite Primary Key: `(clan_id, year_id, player_id)`
- **Minimum 3 battles** required for inclusion
- Structure mirrors monthly individual stats

### Audit and Administrative Tables

#### `audit_log`
Immutable audit trail of administrative actions.
- Primary Key: `log_id` (auto-generated)
- Records: timestamp, user, action type, entity type/ID
- Supports JSON metadata for additional context
- Preserves history even if referenced entities are deleted

## Key Relationships

```
clans
  ├── clan_admin_users (via clan_id)
  ├── admin_requests (via clan_id)
  ├── roster_members (via clan_id)
  ├── clan_battles (via clan_id)
  ├── monthly_clan_stats (via clan_id)
  └── yearly_clan_stats (via clan_id)

clan_battles
  ├── battle_player_stats (via clan_id, battle_id)
  └── battle_nonplayer_stats (via clan_id, battle_id)

roster_members
  ├── battle_player_stats (via player_id)
  ├── battle_nonplayer_stats (via player_id)
  ├── monthly_individual_stats (via player_id)
  └── yearly_individual_stats (via player_id)

action_codes
  ├── battle_player_stats (via action_code)
  └── battle_nonplayer_stats (via action_code)

monthly_clan_stats
  └── monthly_individual_stats (via clan_id, month_id)

yearly_clan_stats
  └── yearly_individual_stats (via clan_id, year_id)
```

## Data Validation Rules

### Battle ID Format
- Format: `YYYYMMDD` (8 digits)
- Generated from battle start date
- Example: Battle starting on 2025-11-01 → battle_id = "20251101"

### Month/Year ID Format
- Month: `YYYYMM` (6 digits) - Example: "202511"
- Year: `YYYY` (4 digits) - Example: "2025"

### Ratio Calculations

See `specs/high-level-spec.md` Section 7 for detailed calculation formulas.

**Clan Ratio** (official):
```
ratio = (score / baseline_fp) * 10
```

**Average Ratio**:
```
average_ratio = (score / fp) * 10
```

**Player Ratio**:
```
player_ratio = (score / fp) * 10
```

**Margin Ratio**:
```
margin_ratio = ((score - opponent_score) / score) * 100
```

**FP Margin**:
```
fp_margin = ((baseline_fp - opponent_fp) / baseline_fp) * 100
```

### Constraints Summary

- **Positive Integers**: All FP values, battle counts
- **Non-negative Integers**: Scores (can be 0), counts
- **Positive Floats**: Ratios, averages
- **Result Values**: -1 (loss), 0 (tie), 1 (win)
- **Date Logic**: end_date >= start_date
- **Exclusive Dates**: Cannot have both left_date and kicked_date
- **Request Status**: PENDING, ACCEPTED, or REJECTED
- **Admin Request Consistency**: Pending requests have no reviewer; accepted/rejected have reviewer

## Indexes

Indexes are created for common query patterns:

- **Lookups by clan** - All clan-scoped tables indexed on `clan_id`
- **Time-based queries** - Battle dates, audit log timestamps
- **Filtering** - Active/inactive flags, status fields
- **Sorting** - Names, dates, rankings
- **Foreign key columns** - Improve join performance

## Triggers

### Automatic Timestamp Updates

The `update_updated_at_column()` function automatically updates the `updated_at` timestamp on all tables when rows are modified.

Trigger naming convention: `update_<table_name>_updated_at`

## Initial Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE angrybirdman;

# Connect to database
\c angrybirdman
```

### 2. Run Schema

```bash
# Run schema creation script
psql -U postgres -d angrybirdman -f schema.sql
```

### 3. Load Seed Data

```bash
# Run seed data script
psql -U postgres -d angrybirdman -f seed-data.sql
```

### 4. Verify Installation

```sql
-- Check tables created
\dt

-- Check action codes loaded
SELECT * FROM action_codes;

-- Verify constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'clans'::regclass;
```

## Docker Setup

For local development with Docker:

```yaml
# docker-compose.yml snippet
services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: angrybirdman
      POSTGRES_USER: angrybirdman
      POSTGRES_PASSWORD: your_password_here
    volumes:
      - ./database/postgres/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/postgres/seed-data.sql:/docker-entrypoint-initdb.d/02-seed-data.sql
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Scripts in `/docker-entrypoint-initdb.d/` run automatically in alphabetical order when the container is first created.

## Connection Strings

### Development (local)
```
postgresql://angrybirdman:password@localhost:5432/angrybirdman
```

### Production
Use environment variables and connection pooling:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

## Prisma Integration

This schema is designed to work with Prisma ORM. After database setup:

```bash
# Introspect database to generate Prisma schema
npx prisma db pull

# Generate Prisma Client
npx prisma generate
```

## Maintenance

### Backup

```bash
# Full database backup
pg_dump -U postgres angrybirdman > backup_$(date +%Y%m%d).sql

# Schema-only backup
pg_dump -U postgres --schema-only angrybirdman > schema_backup.sql

# Data-only backup
pg_dump -U postgres --data-only angrybirdman > data_backup.sql
```

### Restore

```bash
# Restore from backup
psql -U postgres angrybirdman < backup_20251101.sql
```

### Migrations

For production deployments, use Prisma Migrate:

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy
```

## Performance Considerations

### Query Optimization

1. **Use indexes** - All common query patterns are indexed
2. **Select only needed columns** - Avoid `SELECT *`
3. **Batch operations** - Use bulk inserts for battle data entry
4. **Connection pooling** - Configure Prisma connection pool
5. **Analyze queries** - Use `EXPLAIN ANALYZE` for slow queries

### Monitoring

Monitor these metrics:
- Query execution time
- Index usage (`pg_stat_user_indexes`)
- Table bloat
- Connection count
- Cache hit ratio

### Maintenance Tasks

Run periodically:
```sql
-- Update statistics
ANALYZE;

-- Reclaim space and update statistics
VACUUM ANALYZE;

-- Full vacuum (requires downtime)
VACUUM FULL;
```

## Security

### User Permissions

Create dedicated application user with limited permissions:

```sql
-- Create application user
CREATE USER angrybirdman_app WITH PASSWORD 'secure_password';

-- Grant schema access
GRANT USAGE ON SCHEMA public TO angrybirdman_app;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO angrybirdman_app;

-- Grant sequence permissions (for serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO angrybirdman_app;

-- Make grants default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO angrybirdman_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO angrybirdman_app;
```

### Audit Log

The `audit_log` table should be:
- **Append-only** - No updates or deletes
- **Monitored** - Alert on suspicious activity
- **Retained** - Archive old logs periodically

Consider implementing row-level security (RLS) for sensitive operations.

## Troubleshooting

### Common Issues

**Foreign key constraint violations**:
```sql
-- Check existing foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint WHERE contype = 'f';
```

**Duplicate key violations**:
```sql
-- Find duplicate values
SELECT column_name, COUNT(*) 
FROM table_name 
GROUP BY column_name 
HAVING COUNT(*) > 1;
```

**Check constraint violations**:
```sql
-- List all check constraints
SELECT conname, consrc 
FROM pg_constraint 
WHERE contype = 'c' AND conrelid = 'table_name'::regclass;
```

### Reset Database

**Warning: This destroys all data!**

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS angrybirdman;"
psql -U postgres -c "CREATE DATABASE angrybirdman;"
psql -U postgres -d angrybirdman -f schema.sql
psql -U postgres -d angrybirdman -f seed-data.sql
```

## Additional Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **Project Specifications**: See `../specs/` directory
  - `high-level-spec.md` - Complete data model and calculations
  - `technology-plan.md` - Technology stack details
  - `implementation-plan.md` - Development roadmap

## Support

For issues or questions:
1. Check project specifications in `specs/` directory
2. Review implementation status in `specs/implementation-status.md`
3. Open issue on project repository
