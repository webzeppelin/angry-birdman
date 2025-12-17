# Getting Started with Angry Birdman API

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20 LTS+** installed
- **Docker Desktop** running (for Keycloak and PostgreSQL)
- **Git** for cloning the repository
- Basic understanding of REST APIs and HTTP

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/webzeppelin/angry-birdman.git
cd angry-birdman
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL, Keycloak, and Valkey
docker-compose up -d

# Verify services are running
docker ps
```

You should see three containers running:

- `angrybirdman-postgres`
- `angrybirdman-keycloak`
- `angrybirdman-valkey`

### 4. Set Up Environment Variables

```bash
# Copy example environment file
cp api/.env.example api/.env

# Edit with your preferred editor
nano api/.env
```

Key environment variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/angrybirdman"

# Keycloak
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="angrybirdman"
KEYCLOAK_CLIENT_ID="angrybirdman-frontend"
KEYCLOAK_ADMIN_USER="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"

# API Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Security
JWT_SECRET="your-development-secret-change-in-production"
COOKIE_SECRET="your-cookie-secret-change-in-production"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### 5. Initialize Database

```bash
# Run database migrations
npm run db:migrate --workspace=database

# Seed with sample data (optional)
npm run db:seed --workspace=database
```

### 6. Start the API Server

```bash
# Development mode with hot-reload
npm run dev --workspace=api

# Or from the api directory
cd api
npm run dev
```

The API will start at `http://localhost:3001`

### 7. Verify Installation

```bash
# Check health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-12-16T..."}
```

## Your First API Calls

### 1. Browse Clans (Public - No Auth Required)

```bash
curl http://localhost:3001/api/clans
```

Expected response:

```json
{
  "clans": [
    {
      "clanId": 1,
      "rovioId": 100001,
      "name": "Angry Flyers",
      "country": "United States",
      "registrationDate": "2023-01-15T00:00:00.000Z",
      "active": true,
      "battleCount": 24
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 2. Get Clan Details

```bash
curl http://localhost:3001/api/clans/1
```

### 3. View Clan Roster (Public)

```bash
curl http://localhost:3001/api/clans/1/roster
```

### 4. View Battle Statistics

```bash
curl http://localhost:3001/api/clans/1/battles
```

## Authentication Setup

To access protected endpoints, you need to authenticate:

### Option 1: Register a New User

```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response:

```json
{
  "userId": "keycloak:uuid-here",
  "message": "Registration successful"
}
```

### Option 2: Use Test Users (If Database Seeded)

The seed script creates test users:

- `alice` / `password` - Superadmin
- `bob` / `password` - Clan Owner (Angry Flyers)
- `charlie` / `password` - Clan Admin (Angry Flyers)
- `diana` / `password` - Regular User

### Authenticate and Get Token

```bash
curl -X POST http://localhost:3001/auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "password": "password"
  }' \
  -c cookies.txt
```

This saves cookies to `cookies.txt` for subsequent authenticated requests.

### Make Authenticated Request

```bash
# Add a new player to roster (requires clan-admin role)
curl -X POST http://localhost:3001/api/clans/1/roster \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "playerName": "TestPlayer123",
    "joinedDate": "2024-12-01"
  }'
```

## Interactive API Exploration

### Swagger UI

Visit `http://localhost:3001/docs` in your browser to access the interactive API
documentation.

Features:

- Browse all endpoints with descriptions
- View request/response schemas
- Try API calls directly in the browser
- Authenticate and test protected endpoints

### Using Swagger UI to Authenticate

1. Visit `http://localhost:3001/docs`
2. Obtain a token using the password login:
   ```bash
   curl -X POST http://localhost:3001/auth/login-with-password \
     -H "Content-Type: application/json" \
     -d '{"username":"bob","password":"password"}' \
     -c cookies.txt -v
   ```
3. Copy the `access_token` from the Set-Cookie header
4. In Swagger UI, click "Authorize" button
5. Enter: `Bearer <your-token-here>`
6. Click "Authorize" then "Close"
7. Now you can try protected endpoints directly in Swagger UI

## Common Tasks

### Create a New Clan

```bash
# Must be authenticated
curl -X POST http://localhost:3001/api/users/register-clan \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "rovioId": 123456,
    "name": "My New Clan",
    "country": "Canada"
  }'
```

### Record a Battle

```bash
# Requires clan-admin role
curl -X POST http://localhost:3001/api/clans/1/battles \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "startDate": "2024-12-15",
    "endDate": "2024-12-16",
    "opponentRovioId": 789012,
    "opponentName": "Rival Clan",
    "opponentCountry": "Mexico",
    "score": 4500000,
    "baselineFp": 85000,
    "opponentScore": 4200000,
    "opponentFp": 82000,
    "playerStats": [
      {
        "playerId": 1,
        "rank": 1,
        "score": 245000,
        "fp": 3200
      }
    ],
    "nonPlayerStats": []
  }'
```

### View Monthly Statistics

```bash
curl http://localhost:3001/api/clans/1/stats/months/202412
```

## Environment Configuration

### Development vs Production

**Development** (`NODE_ENV=development`):

- Detailed debug logging
- Pretty-printed logs
- CORS accepts localhost
- Lower rate limits

**Production** (`NODE_ENV=production`):

- JSON structured logging
- HTTPS required
- Strict CORS policy
- Higher security measures

### Important Environment Variables

| Variable                 | Default               | Description                  |
| ------------------------ | --------------------- | ---------------------------- |
| `PORT`                   | 3001                  | API server port              |
| `DATABASE_URL`           | -                     | PostgreSQL connection string |
| `KEYCLOAK_URL`           | http://localhost:8080 | Keycloak base URL            |
| `KEYCLOAK_REALM`         | angrybirdman          | Keycloak realm name          |
| `JWT_SECRET`             | -                     | JWT signing secret           |
| `COOKIE_SECRET`          | -                     | Cookie signing secret        |
| `CORS_ORIGIN`            | http://localhost:5173 | Allowed CORS origins         |
| `RATE_LIMIT_MAX`         | 100                   | Max requests per window      |
| `RATE_LIMIT_TIME_WINDOW` | 15 min                | Rate limit window            |
| `LOG_LEVEL`              | info                  | Logging level                |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:postgres@localhost:5432/angrybirdman

# Restart if needed
docker-compose restart postgres
```

### Keycloak Not Accessible

```bash
# Check Keycloak container
docker logs angrybirdman-keycloak

# Restart Keycloak
docker-compose restart keycloak

# Wait 30 seconds for startup, then verify
curl http://localhost:8080/health
```

### API Returns 500 Errors

```bash
# Check API logs
npm run dev --workspace=api

# Look for error details in console
# Common issues:
# - Missing environment variables
# - Database schema mismatch (run migrations)
# - Keycloak connection failure
```

### Authentication Fails

```bash
# Verify user exists in Keycloak
# Access Keycloak admin console: http://localhost:8080
# Username: admin
# Password: admin (or value from docker-compose.yml)

# Check user in realm "angrybirdman"
# Verify user has correct roles assigned
```

## Next Steps

1. **Explore the API** - Use Swagger UI at `http://localhost:3001/docs`
2. **Read Authentication Guide** - [AUTHENTICATION.md](./AUTHENTICATION.md)
3. **Review Integration Examples** -
   [INTEGRATION-EXAMPLES.md](./INTEGRATION-EXAMPLES.md)
4. **Check API Reference** - [API-REFERENCE.md](./API-REFERENCE.md)
5. **Build a Frontend** - See frontend documentation in `/frontend/README.md`

## Development Tips

### Hot Reload

The API uses `tsx watch` for automatic reload on file changes. Edit any file in
`api/src/` and the server will restart automatically.

### Database Changes

After modifying the Prisma schema:

```bash
# Generate migration
npm run db:migrate:create --workspace=database

# Apply migration
npm run db:migrate --workspace=database

# Regenerate Prisma client
npm run prisma:generate --workspace=database
```

### Testing

```bash
# Run all tests
npm test --workspace=api

# Run specific test file
npm test --workspace=api -- auth.test.ts

# Run with coverage
npm run test:coverage --workspace=api

# Watch mode for TDD
npm run test:watch --workspace=api
```

### Debugging

Add breakpoints in VS Code:

1. Set breakpoint in source file
2. Press F5 (or Run > Start Debugging)
3. Select "Node.js" configuration
4. Make API request to hit breakpoint

Or use console logging:

```typescript
fastify.log.debug('Debug message', { data });
fastify.log.info('Info message');
fastify.log.warn('Warning message');
fastify.log.error(error, 'Error message');
```

## Support

- **Documentation**: See `/api/docs/` directory
- **Issues**:
  [GitHub Issues](https://github.com/webzeppelin/angry-birdman/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/webzeppelin/angry-birdman/discussions)
