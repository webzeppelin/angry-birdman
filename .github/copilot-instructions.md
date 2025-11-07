# Angry Birdman - AI Coding Agent Instructions

## Project Overview
Angry Birdman is a clan management system for Angry Birds 2, focused on tracking Clan-vs-Clan (CvC) battle performance, calculating advanced statistics (especially **Ratio Scores**), and managing clan rosters. The system enables clan administrators to efficiently capture battle data, analyze performance over time, and make data-driven roster decisions.

## Architecture & Tech Stack

### Three-Tier Architecture
1. **Frontend**: React + Vite + TypeScript, Tailwind CSS, React Query, React Router
2. **API/Backend**: Node.js + TypeScript, Fastify, JWT auth via Keycloak
3. **Database**: PostgreSQL with Prisma ORM
4. **Common Library**: Shared TypeScript code between frontend and backend to avoid duplication
5. **Identity Provider**: Keycloak (backed by PostgreSQL)
6. **Infrastructure**: Docker + Docker Compose for local dev, optional Kubernetes for production

### Project Structure (Target State)
```
angrybirdman/
├── frontend/          # React + Vite app
├── api/               # Fastify REST API
├── common/            # Shared TypeScript library
├── database/          # Prisma schema & migrations
├── implog/            # Summary log of implementation steps
├── keycloak/          # IdP configuration
├── docker/            # Docker configs
├── specs/             # Project specifications (source of truth)
└── README.md          # Project overview and setup instructions
```

## Core Domain Concepts

### Battle Statistics
- **Flock Power (FP)**: Player's base multiplier (50-4000+), grows with game progression
- **Ratio Score**: The key performance metric = `(score / fp) * 10` - normalizes performance across different FP levels
- **Baseline FP**: Clan's total FP when capturing stats, used for official clan ratio
- **Reserve Players**: Low-FP inactive players kept to suppress clan's total FP for easier matchmaking

### Data Entities & Relationships
- **Clan** → has many **Roster Members** (players)
- **Clan Battle** → belongs to Clan, has many **Player Stats** and **Nonplayer Stats**
- **Battle ID Format**: `YYYYMMDD` (generated from start date)
- **Monthly/Yearly Summaries**: Automatically calculated rollups (see `specs/high-level-spec.md` Section 7)

### Critical Calculations (see spec Section 7 for full details)
- Battle result: Win (+1), Loss (-1), Tie (0)
- Clan ratio: `(score / baselineFp) * 10`
- Average ratio: `(score / fp) * 10` (where fp = sum of all player FPs)
- Margin ratio: `((score - opponentScore) / score) * 100`
- Nonplaying FP ratio: percentage of total FP from non-players (excluding reserves)
- Reserve FP ratio: percentage including reserves
- Ratio rank: sorted by individual player ratio scores

## Development Workflows

### Starting from Specs
1. **Always consult `specs/high-level-spec.md` before implementing features** - it's the source of truth
2. Keep implementation aligned with spec; if approach changes, update specs first
3. Data model in Section 6 defines all entities, fields, types, and relationships
4. Section 7 defines exact calculation formulas - implement precisely as specified

### Data Entry Workflow (Epic 4)
When implementing battle data capture, respect the specified field order for efficiency:
- Battle metadata: `startDate → endDate → opponentRovioId → opponentName → opponentCountry`
- Clan performance: `score → baselineFp`
- Opponent data: `opponentScore → opponentFp`
- Player stats (per player): `rank → playerName → score → fp`
- Nonplayer stats: `name → fp`
- Actions: `actionCode → actionReason`

### Code Organization Principles
- Keep source files focused and reasonably sized (avoid monolithic files)
- Use TypeScript throughout with strict type checking
- Share common types/logic via the `common/` library (e.g., calculation functions, validation schemas)
- Document complex logic with inline comments
- Follow conventional project structure for React/Fastify/Prisma projects

### Commit Strategy
- Make small, targeted commits focused on specific features or changes
- Reference spec sections in commit messages when implementing specified behavior
- Use conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, etc.

## User Roles & Permissions
- **Superadmin**: Full access to all clans, manages action codes and system settings
- **Clan Owner**: Full control over their clan, can promote/demote admins
- **Clan Admin**: Can manage roster and battle data for their clan
- **Anonymous**: Read-only access to all battle stats and reports (no login required for viewing)

## Key Business Rules

### Roster Management
- Active flag tracks current membership
- Track `joinedDate`, `leftDate`, `kickedDate` for each player
- Action codes after each battle: HOLD, WARN, KICK, RESERVE, PASS

### Monthly/Yearly Summaries
- Monthly individual stats: Only include players with 3+ battles in the month
- Yearly individual stats: Only include players with 3+ battles in the year
- Summaries are marked complete when period ends (manual flag)

### Data Validation
- All FP values must be positive integers
- Scores must be >= 0
- Battle start/end dates: end is typically 1 day after start (2-day battles)
- Ratio scores should always be calculated, never manually entered

## UI/UX Priorities
1. **Responsive design**: Works on desktop, tablet, mobile
2. **Keyboard-first data entry**: Tab between fields, keyboard shortcuts for navigation
3. **Efficiency**: Minimize clicks/taps, especially for battle data capture
4. **Lighthearted tone**: This is for a mobile game - keep it fun while being functional

## Testing & Quality
- Use Vitest + React Testing Library for frontend
- Use Vitest for API tests
- Test calculation logic thoroughly against spec Section 7
- Ensure data integrity constraints are enforced at database level

## Documentation Standards
- Document "why" decisions, not just "what" (especially for non-obvious calculations)
- Keep in-code comments professional and concise
- Maintain implementation summaries for agentic development continuity
- Update specs if implementation approach changes

## Integration Points
- **Keycloak**: JWT-based auth, OAuth2 flows
- **Valkey/Redis**: Session state management
- **PostgreSQL**: All persistent data (app + Keycloak)
- **Docker Compose**: Local development orchestration

## When Implementing Features
1. Check which Epic (1-7) the feature belongs to in `specs/high-level-spec.md` Section 5
2. Review relevant data entities in Section 6
3. If calculations involved, verify formulas in Section 7
4. Consider multi-clan support (most features are clan-scoped via `clanId`)
5. Remember: Anonymous users can view everything, only admins need auth for mutations
