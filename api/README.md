# API - Angry Birdman

Fastify-based REST API backend for the Angry Birdman clan management system.

## Technology Stack

- **Node.js 20 LTS+** - Runtime
- **Fastify 4+** - Web framework
- **TypeScript 5+** - Type safety
- **Prisma Client** - Database ORM
- **JWT** - Authentication
- **Zod** - Request validation

## Getting Started

### Install Dependencies

From the project root:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev --workspace=api
# or from this directory
npm run dev
```

The API will be available at http://localhost:3001

### Build

Build for production:

```bash
npm run build --workspace=api
# or from this directory
npm run build
```

### Test

Run tests:

```bash
npm run test --workspace=api
# or from this directory
npm test
```

## Project Structure

```
api/
├── src/
│   ├── routes/      # API route handlers
│   ├── plugins/     # Fastify plugins (scheduler, auth, etc.)
│   ├── middleware/  # Authentication, logging, etc.
│   ├── schemas/     # Request/response schemas
│   ├── services/    # Business logic (including scheduler)
│   └── index.ts     # Application entry point
└── tests/           # Test files
```

## Key Features

### Battle Scheduler Service

The API includes an automated battle scheduler that runs hourly to create new
Master Battle entries. Key features:

- **Automatic Battle Creation**: Creates new battles every 3 days
- **Timezone Aware**: Uses Official Angry Birds Time (EST, never EDT)
- **Graceful Error Handling**: Logs errors without crashing
- **Development Mode**: Runs immediate check on startup
- **Configurable**: Enable/disable via `BATTLE_SCHEDULER_ENABLED` env var

The scheduler uses `node-cron` to run at the top of each hour (e.g., 1:00 AM,
2:00 AM) and checks if it's time to create the next battle based on the
`nextBattleStartDate` system setting.

## API Documentation

Once running, OpenAPI documentation is available at:

- Swagger UI: http://localhost:3001/docs
- OpenAPI JSON: http://localhost:3001/docs/json

### Major Endpoints

#### Master Battle Schedule (Public)

- `GET /api/master-battles` - List all master battles (paginated)
- `GET /api/master-battles/available` - Get available battles for selection
- `GET /api/master-battles/schedule-info` - Get current/next battle info

#### Master Battle Management (Superadmin Only)

- `GET /api/master-battles/next-battle-date` - Get next scheduled battle date
- `PUT /api/master-battles/next-battle-date` - Update next battle date
- `POST /api/master-battles` - Create master battle manually

#### Battle Entry (Clan Admin)

- `POST /api/clans/:clanId/battles` - Create battle (requires battleId
  selection)
- `PUT /api/clans/:clanId/battles/:battleId` - Update battle
- `GET /api/clans/:clanId/battles` - List clan battles

## Development Guidelines

- Follow RESTful API conventions
- Use TypeScript for all new files
- Validate requests with Zod schemas
- Write integration tests for all endpoints
- Use Prisma Client for database operations
- Import shared types and utilities from @angrybirdman/common
