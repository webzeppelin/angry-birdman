# Angry Birdman

A comprehensive clan management system for Angry Birds 2, focused on tracking
Clan-vs-Clan (CvC) battle performance, calculating advanced statistics, and
managing clan rosters.

## Overview

Angry Birdman helps clan administrators efficiently manage their Angry Birds 2
clans by providing:

- **Battle Data Capture** - Streamlined data entry for CvC battle results
- **Performance Analytics** - Advanced statistics including ratio scores that
  normalize performance across different flock power levels
- **Roster Management** - Track active/inactive members, joins, departures, and
  kicks
- **Monthly/Yearly Summaries** - Automated rollup statistics for trend analysis
- **Reporting & Visualization** - Charts and reports showing clan performance
  over time
- **Multi-Clan Support** - Manage multiple clans independently within one system

## Key Concepts

### Flock Power (FP)

Each player's base multiplier (50-4000+) that grows with game progression.
Higher FP means higher potential scores.

### Ratio Score

The key performance metric: `(score / fp) * 1000`. Normalizes performance across
different FP levels so players can be fairly compared regardless of their power
level.

### Baseline FP

The clan's total FP when capturing stats, used for calculating the official clan
ratio score.

### Reserve Players

Low-FP inactive players kept to suppress the clan's total FP for easier
matchmaking.

### Master Battle Schedule

A centralized schedule of all CvC battles maintained by the system. All clans
select battles from this master schedule, ensuring consistent Battle IDs across
all clans and enabling cross-clan performance comparisons. New battles are
automatically created every 3 days by the battle scheduler service.

## Architecture

Three-tier web application built with modern open-source technologies:

```
┌─────────────────────────────────────────┐
│   Frontend (React + Vite + TypeScript)  │
│   Tailwind CSS, React Query, Router     │
└─────────────────────────────────────────┘
                    ↕ REST API
┌─────────────────────────────────────────┐
│  Backend API (Node.js + Fastify)        │
│  TypeScript, JWT Auth, OpenAPI          │
└─────────────────────────────────────────┘
                    ↕ SQL/ORM
┌─────────────────────────────────────────┐
│  Database (PostgreSQL + Prisma ORM)     │
└─────────────────────────────────────────┘

      Supporting Infrastructure:
  Keycloak (IdP) | Valkey (Cache) | Docker
```

### Technology Stack

- **Frontend**: React 18+, Vite 5+, TypeScript 5+, Tailwind CSS, React Query,
  React Router
- **Backend**: Node.js 20 LTS+, Fastify 4+, TypeScript 5+, JWT authentication
- **Database**: PostgreSQL 15+, Prisma ORM 6+
- **Authentication**: Keycloak 25+ (OAuth2/OpenID Connect)
- **Cache**: Valkey (Redis fork) for session management
- **Scheduler**: node-cron for automated battle creation
- **Infrastructure**: Docker 24+, Docker Compose for local dev
- **Common**: Shared TypeScript library for code reuse between frontend and
  backend

## User Roles

- **Anonymous** - Read-only access to all clan statistics and reports (no login
  required)
- **Clan Admin** - Manage roster and battle data for their clan
- **Clan Owner** - Full control over their clan, can promote/demote admins
- **Superadmin** - Full access to all clans and system settings

## Key Features

### Battle Scheduling & Management

- **Automated Battle Creation** - Scheduler automatically creates new battles
  every 3 days
- **Centralized Schedule** - All clans share the same Master Battle schedule
- **Consistent Battle IDs** - Each battle has a unique ID (YYYYMMDD format)
  across all clans
- **Timezone Support** - Official Angry Birds Time (EST) with user-local display
- **Cross-Clan Comparisons** - Compare performance across different clans for
  the same battle

### Battle Data Entry (Epic 4)

- Efficient keyboard-first data entry workflow
- Battle selection from dropdown (no manual date entry required)
- Automatic calculation of ratio scores and rankings
- Draft saving for interrupted sessions
- Validation to prevent data entry errors

### Performance Statistics (Epic 5-6)

- Individual battle stats with player rankings
- Participation tracking (players, non-players, reserves)
- Monthly and yearly aggregated statistics
- Minimum 3 battles required for inclusion in summaries

### Analytics & Reporting (Epic 7)

- Flock power trends over time
- Ratio score performance tracking
- Win/loss margin analysis
- Participation rate monitoring

### Roster Management (Epic 3)

- Track active/inactive members
- Record join, leave, and kick dates
- Post-battle action assignments (HOLD, WARN, KICK, RESERVE, PASS)
- Player history and performance summaries

## Project Structure

```
angrybirdman/
├── frontend/          # React + Vite application
├── api/               # Fastify REST API
├── common/            # Shared TypeScript library
├── database/          # Prisma schema & PostgreSQL scripts
│   └── postgres/      # Schema, seed data, README
├── specs/             # Project specifications (source of truth)
│   ├── high-level-spec.md
│   ├── user-experience-specs.md
│   ├── epics-and-stories.md
│   ├── technology-plan.md
│   ├── implementation-plan.md
│   └── implementation-status.md
├── docker/            # Docker configurations
└── keycloak/          # Identity provider configuration
```

## Getting Started

New to the project? Follow our comprehensive setup guide:

**📖 [New Developer Guide](docs/new-developer-guide.md)**

This guide walks you through:

- Installing prerequisites (Docker, Node.js, etc.)
- Cloning and configuring the repository
- Setting up Keycloak and creating test users
- Initializing and seeding the database
- Running the application locally
- Troubleshooting common issues

**Quick Start** (for experienced developers):

```bash
# Clone and install
git clone https://github.com/webzeppelin/angry-birdman.git
cd angry-birdman
npm install

# Start infrastructure (Keycloak realm auto-created from mounted config)
npm run docker:up

# Create test users in Keycloak
./scripts/create-keycloak-test-users.sh

# Initialize database
npm run db:generate
npm run db:migrate:deploy
npm run db:seed

# Start development servers
npm run dev
```

Access the application at http://localhost:3000

**Note**: You'll need to get the `KEYCLOAK_ADMIN_CLIENT_SECRET` from the
Keycloak admin console and add it to your `.env` file. See the
[New Developer Guide](docs/new-developer-guide.md) for details.

## Documentation

Comprehensive documentation is available in the `specs/` directory:

- **[high-level-spec.md](specs/high-level-spec.md)** - Complete system
  specification including data model and calculations
- **[user-experience-specs.md](specs/user-experience-specs.md)** - UX design,
  components, and interaction patterns
- **[epics-and-stories.md](specs/epics-and-stories.md)** - User stories
  organized into 7 epics
- **[technology-plan.md](specs/technology-plan.md)** - Detailed technology stack
  documentation
- **[implementation-plan.md](specs/implementation-plan.md)** - 12-week
  implementation strategy
- **[implementation-status.md](specs/implementation-status.md)** - Progress
  tracking
- **[index.md](specs/index.md)** - Complete specification index

Additional documentation:

- **[database/postgres/README.md](database/postgres/README.md)** - Database
  schema documentation

## Development Workflow

See the **[New Developer Guide](docs/new-developer-guide.md)** for detailed
workflow information, including common tasks, testing procedures, and
troubleshooting.

**Key Commands**:

```bash
npm run dev              # Start API and frontend dev servers
npm test                 # Run all tests
npm run lint             # Lint code
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run db:studio        # Open Prisma Studio
```

**Commit Conventions**: Follow
[Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`,
`fix:`, `docs:`, `refactor:`, `test:`, `chore:`)

## Data Model Highlights

### Core Entities

- **Master Battles** - Centralized schedule of all CvC battles (system-wide)
- **System Settings** - Global configuration (next battle date, scheduler
  settings)
- **Clans** - Registered clans with Rovio ID, name, country
- **Roster Members** - Players with join/leave/kick tracking
- **Clan Battles** - Comprehensive battle data with calculated metrics (linked
  to Master Battle)
- **Battle Player Stats** - Individual player performance
- **Battle Nonplayer Stats** - Non-participants (including reserves)
- **Monthly/Yearly Stats** - Aggregated performance summaries

### Key Calculations

**Clan Ratio (Official)**:

```
ratio = (score / baselineFp) * 1000
```

**Average Ratio**:

```
averageRatio = (score / fp) * 1000
```

**Player Ratio**:

```
playerRatio = (score / fp) * 1000
```

**Margin Ratio** (Win/Loss margin):

```
marginRatio = ((score - opponentScore) / score) * 100
```

**FP Margin** (Power advantage/disadvantage):

```
fpMargin = ((baselineFp - opponentFp) / baselineFp) * 100
```

## Contributing

This project will be open-sourced to enable community collaboration.
Contributions are welcome!

### Guidelines

1. Follow the established code style and conventions
2. Write tests for new features
3. Update documentation for significant changes
4. Keep commits small and focused
5. Reference issue numbers in commits
6. Ensure all tests pass before submitting PR

### Development Standards

- TypeScript strict mode enabled
- Minimum 80% code coverage for critical paths
- ESLint and Prettier for code quality
- React Testing Library for component tests
- Vitest for unit and integration tests

## Security

- **Authentication**: Keycloak with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Access**: Anonymous users have read-only access, admins can modify
  their clan data
- **API Security**: Rate limiting, CORS, security headers via Helmet
- **Password Management**: Handled by Keycloak (bcrypt, password policies)
- **Audit Trail**: All admin actions logged in `audit_log` table

## Performance

- **Frontend**: Code splitting, lazy loading, CDN for static assets
- **Backend**: Connection pooling, response caching, query optimization
- **Database**: Indexed queries, aggregated statistics tables
- **Caching**: Valkey for session state and frequently accessed data

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Android 10+

## License

Apache 2.0

## Acknowledgments

Built for the Angry Birds 2 clan management community to make clan
administration easier and more data-driven.

## Contact & Support

[Project repository and issue tracking information to be added]

---

**Status**: 🟡 In Development

See [implementation-status.md](specs/implementation-status.md) for current
progress.
