# Angry Birdman API

Fastify-based REST API backend for the Angry Birdman clan management system.

## Documentation

📚 **[Complete API Documentation](./docs/API-OVERVIEW.md)**

- **[Getting Started Guide](./docs/GETTING-STARTED.md)** - Setup, installation,
  and your first API calls
- **[Authentication Guide](./docs/AUTHENTICATION.md)** - OAuth2/JWT
  authentication flows
- **[Integration Examples](./docs/INTEGRATION-EXAMPLES.md)** - Code samples for
  JavaScript, TypeScript, Python, and React
- **[Interactive API Docs](http://localhost:3001/docs)** - Swagger UI (when
  server is running)

## Technology Stack

- **Node.js 20 LTS+** - Runtime
- **Fastify 5** - High-performance web framework
- **TypeScript 5** - Type safety and developer experience
- **Prisma 7** - Modern database ORM
- **Zod 4** - Schema validation
- **JWT** - Token-based authentication
- **Keycloak** - Identity provider (OAuth2/OIDC)

## Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL, Keycloak, Valkey)
- Git

### Installation

```bash
# Install dependencies
npm install

# Start infrastructure services
docker-compose up -d

# Set up environment
cp api/.env.example api/.env

# Run database migrations
npm run db:migrate --workspace=database

# (Optional) Seed with sample data
npm run db:seed --workspace=database
```

### Development

Run the development server with hot-reload:

```bash
npm run dev --workspace=api
# or from this directory
npm run dev
```

The API will be available at `http://localhost:3001`

Verify it's running:

```bash
curl http://localhost:3001/health
```

### Production Build

```bash
npm run build --workspace=api
npm start --workspace=api
```

### Testing

```bash
# Run all tests
npm test --workspace=api

# Run with coverage
npm run test:coverage --workspace=api

# Watch mode for TDD
npm run test:watch --workspace=api
```

## Project Structure

```
api/
├── docs/                    # API documentation
│   ├── API-OVERVIEW.md
│   ├── AUTHENTICATION.md
│   ├── GETTING-STARTED.md
│   └── INTEGRATION-EXAMPLES.md
├── src/
│   ├── routes/             # API endpoint handlers
│   │   ├── auth.ts         # Authentication & tokens
│   │   ├── clans.ts        # Clan management
│   │   ├── roster.ts       # Roster operations
│   │   ├── battles.ts      # Battle data entry
│   │   ├── monthly-stats.ts # Monthly summaries
│   │   ├── yearly-stats.ts # Yearly rollups
│   │   ├── reports.ts      # Analytics & trends
│   │   └── ...
│   ├── plugins/            # Fastify plugins
│   │   ├── swagger.ts      # OpenAPI documentation
│   │   ├── database.ts     # Prisma integration
│   │   ├── scheduler.ts    # Battle scheduler
│   │   └── config.ts       # Configuration management
│   ├── middleware/         # Request middleware
│   │   ├── auth.ts         # JWT validation
│   │   └── errorHandler.ts # Error responses
│   ├── services/           # Business logic
│   │   ├── battle.service.ts
│   │   ├── keycloak.service.ts
│   │   ├── audit.service.ts
│   │   └── scheduler.service.ts
│   ├── app.ts              # Fastify app configuration
│   └── index.ts            # Application entry point
└── tests/                  # Test suites
    ├── routes/
    └── services/
```

## Key Features

### Authentication & Authorization

- **OAuth2/OIDC** integration with Keycloak
- **JWT tokens** stored in httpOnly cookies (XSS protection)
- **Role-based access control**: user, clan-admin, clan-owner, superadmin
- **Automatic token refresh** for seamless user experience
- See [Authentication Guide](./docs/AUTHENTICATION.md) for details

### Battle Scheduler Service

Automated battle scheduler that creates new Master Battle entries:

- **Automatic Battle Creation**: Generates battles every 3 days
- **Timezone Aware**: Uses Official Angry Birds Time (EST, never EDT)
- **Graceful Error Handling**: Logs errors without crashing
- **Development Mode**: Runs immediate check on startup
- **Configurable**: Enable/disable via `BATTLE_SCHEDULER_ENABLED` env var

The scheduler uses `node-cron` to run at the top of each hour.

### Data Validation

All request data validated with Zod schemas:

- Type-safe request/response handling
- Automatic validation error responses
- Shared schemas with frontend via `@angrybirdman/common`

### Security Features

- **Rate Limiting**: 100 requests per 15-minute window
- **CORS**: Configurable origin whitelist
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: SQL injection prevention via Prisma
- **HTTPS Ready**: Production-ready security configuration

### Audit Logging

Comprehensive audit trail for all mutations:

- User actions tracked with timestamps
- Action results logged (success/failure)
- Entity changes recorded with details
- Queryable via audit log API endpoints

## API Documentation

### Interactive Documentation (Swagger UI)

Once the server is running, access interactive API documentation:

- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI JSON**: http://localhost:3001/docs/json

Features:

- Browse all endpoints with descriptions
- View request/response schemas
- Try API calls directly in browser
- Authenticate and test protected endpoints

### Endpoint Categories

#### Authentication & Users

- User registration and profile management
- OAuth2 token exchange and refresh
- Password-based login (for testing)
- Session management and logout

#### Clan Management

- Public clan directory browsing
- Clan profile viewing and editing
- Admin user management
- Clan registration

#### Roster Operations

- Player addition and removal
- Status tracking (active, left, kicked)
- Player history and statistics
- Bulk operations and imports

#### Battle Data

- Battle entry and validation
- Player performance tracking
- Action code assignment
- Battle editing and deletion

#### Statistics & Analytics

- Monthly performance summaries
- Yearly rollup statistics
- Trend analysis and reports
- Performance comparisons

#### Master Battle Schedule

- Global battle schedule management
- Available battles for selection
- Automatic battle generation

#### Administration

- Superadmin user management
- System-wide audit logs
- Action code management
- Admin request approval

### Major Endpoints

#### Public Endpoints (No Auth Required)

- `GET /api/clans` - Browse clan directory
- `GET /api/clans/:id` - Get clan details
- `GET /api/clans/:id/roster` - View roster
- `GET /api/clans/:id/battles` - View battles
- `GET /api/clans/:id/stats/months/:monthId` - Monthly stats
- `GET /api/master-battles` - Master battle schedule

#### Protected Endpoints (Auth Required)

- `POST /api/users/register` - Register new user
- `POST /api/users/register-clan` - Register clan (become owner)
- `POST /api/clans/:id/roster` - Add player (clan-admin)
- `POST /api/clans/:id/battles` - Record battle (clan-admin)
- `PUT /api/clans/:id` - Update clan (clan-owner)
- `GET /api/admin/audit-logs` - View audit logs (superadmin)

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

## Environment Configuration

### Development Environment

Create `api/.env` file with:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/angrybirdman"

# Keycloak Authentication
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="angrybirdman"
KEYCLOAK_CLIENT_ID="angrybirdman-frontend"
KEYCLOAK_ADMIN_USER="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"

# API Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Security (Change in production!)
JWT_SECRET="your-development-secret-change-in-production"
COOKIE_SECRET="your-cookie-secret-change-in-production"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW="15 minutes"

# Battle Scheduler
BATTLE_SCHEDULER_ENABLED=true
```

### Production Considerations

- Use strong, unique secrets for `JWT_SECRET` and `COOKIE_SECRET`
- Set `NODE_ENV=production`
- Configure proper `CORS_ORIGIN` for your domain
- Use HTTPS (set `SECURE_COOKIES=true`)
- Adjust rate limits based on expected traffic

## Troubleshooting

### Common Issues

**Port Already in Use**:

```bash
lsof -i :3001
kill -9 <PID>
```

**Database Connection Errors**:

```bash
docker ps | grep postgres
docker logs angrybirdman-postgres
```

**Keycloak Connection Issues**:

```bash
docker logs angrybirdman-keycloak
curl http://localhost:8080/realms/angrybirdman/.well-known/openid-configuration
```

See [Getting Started Guide](./docs/GETTING-STARTED.md) for detailed
troubleshooting.

## Related Documentation

- [API Overview](./docs/API-OVERVIEW.md)
- [Getting Started](./docs/GETTING-STARTED.md)
- [Authentication Guide](./docs/AUTHENTICATION.md)
- [Integration Examples](./docs/INTEGRATION-EXAMPLES.md)
- [High-Level Specification](../specs/high-level-spec.md)
- [Technology Plan](../specs/technology-plan.md)
- [Database Documentation](../database/README.md)
