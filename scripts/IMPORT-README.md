# Newdoodles Data Import Scripts

This directory contains scripts for importing historical battle data for the
Newdoodles clan into the Angry Birdman database.

## Scripts

### import-newdoodles.sh

Imports battle data from `scripts/data/newdoodles-battles.csv` into the
database.

**Usage:**

```bash
./scripts/import-newdoodles.sh
```

**What it does:**

1. Creates the Newdoodles clan if it doesn't exist (Rovio ID: 551148)
2. Assigns ownership to the specified user
3. Parses the custom CSV format containing multiple battles
4. For each battle:
   - Automatically adds new players to the roster
   - Detects and records player departures
   - Records kicks based on action codes
   - Imports all battle data with proper calculations
   - Creates player and nonplayer stats

**Features:**

- Automatic roster management (adds new players, detects departures)
- Skips battles that already exist in the database
- Uses calculation functions from the common library
- Handles "you play, you stay" policy (all players get HOLD action)
- Processes kicks and departures based on action codes

### delete-newdoodles.sh

Deletes all battle data and roster information for the Newdoodles clan while
preserving the clan record itself. This allows for clean re-imports.

**Usage:**

```bash
./scripts/delete-newdoodles.sh              # With confirmation prompt
./scripts/delete-newdoodles.sh -y          # Skip confirmation
```

**What it deletes:**

- All battle records
- Player stats
- Nonplayer stats
- Monthly/yearly summaries
- Roster members

**What it preserves:**

- The clan record
- The user ownership assignment

### verify-import.ts

Helper script to verify imported data.

**Usage:**

```bash
npx tsx scripts/verify-import.ts
```

## Data Format

The CSV file (`scripts/data/newdoodles-battles.csv`) uses a custom multi-part
format:

```
Battle Header Row
Battle Data Values
<blank>
Players Header Row
Player 1 CSV Data
Player 2 CSV Data
...
<blank>
Nonplayers:
<blank>
Nonplayer Data Line
...
<blank>
Reserve:
<blank>
Reserve Player Data
...
<blank>
---
<blank>
<NEXT BATTLE>
```

### Battle Data Fields

- Battle Id (YYYYMMDD format, used as start date)
- Opponent Name
- Country
- Our Score
- Their Score
- Our FP (baseline FP)
- Their FP

### Player Data Fields

- Position (score rank)
- Player Name
- Score
- FP

### Nonplayer/Reserve Data Fields

- Player Name
- FP
- Action (KICK, HOLD, LEFT, etc. - blank defaults to HOLD)

## Notes

- Battles are processed in chronological order (oldest to newest)
- The script uses automatic roster management:
  - New players are added with join date = day before first battle
  - Players who left are detected by comparing active roster vs battle
    participants
  - Kicks are processed based on action codes in the data
- All calculated values (ratios, ranks, etc.) are computed using the calculation
  functions from the common library
- Action codes are case-insensitive (converted to uppercase)

## Requirements

- Docker containers must be running (postgres)
- Node.js and TypeScript tooling
- Prisma Client generated and up-to-date
