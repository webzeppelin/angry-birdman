# New Developer Guide

Welcome to the Angry Birdman development team! This guide will walk you through
setting up your local development environment from scratch. By the end of this
guide, you'll have a fully functional development environment with the
application running locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Infrastructure Setup](#infrastructure-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Verification & Testing](#verification--testing)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following tools installed on your
development machine:

### Required Software

| Tool               | Minimum Version | Purpose                       | Installation                                                  |
| ------------------ | --------------- | ----------------------------- | ------------------------------------------------------------- |
| **Git**            | Latest          | Version control               | [git-scm.com](https://git-scm.com/)                           |
| **Node.js**        | 24.0.0+         | JavaScript runtime            | [nodejs.org](https://nodejs.org/) (LTS version)               |
| **npm**            | 11.0.0+         | Package manager               | Included with Node.js                                         |
| **Docker Desktop** | 24.0+           | Container platform            | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Docker Compose** | 2.0+            | Multi-container orchestration | Included with Docker Desktop                                  |

### Verify Installations

Run these commands to verify everything is installed correctly:

```bash
git --version
node --version
npm --version
docker --version
docker-compose --version
```

All commands should output their respective version numbers.

### Recommended Tools

- **VS Code** - Code editor with excellent TypeScript support
- **Postman** or **Insomnia** - API testing
- **DBeaver** or **pgAdmin** - PostgreSQL database management

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/webzeppelin/angry-birdman.git
cd angrybirdman
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

**Important**: Update the following variables in your `.env` file:

```bash
# Keycloak admin password (used for realm creation)
KEYCLOAK_ADMIN_PASSWORD=your_secure_password_here
```

The other default values are suitable for local development. You'll update the
`KEYCLOAK_ADMIN_CLIENT_SECRET` later after creating the Keycloak realm.

### 3. Install Dependencies

Install all project dependencies (frontend, backend, common, database):

```bash
npm install
```

This installs dependencies for all workspaces in the monorepo.

---

## Infrastructure Setup

### 1. Start Docker Services

Start PostgreSQL, Keycloak, and Valkey (Redis) containers:

```bash
npm run docker:up
```

This command starts all infrastructure services in detached mode. The services
include:

- **PostgreSQL** (port 5432) - Application database
- **Keycloak** (port 8080) - Identity provider for authentication
- **Valkey** (port 6379) - Cache and session storage

**Wait for services to be healthy** (about 30-60 seconds):

```bash
npm run docker:ps
```

Look for "healthy" status for all services. If services show "starting", wait a
bit longer.

### 2. Create Keycloak Realm

Create the `angrybirdman` realm with necessary clients and configurations:

```bash
export KEYCLOAK_ADMIN_PASSWORD='your_secure_password_here'
./scripts/create-keycloak-realm.sh
```

**Important**: The script will output a client secret. Copy this value and
update your `.env` file:

```bash
KEYCLOAK_ADMIN_CLIENT_SECRET=<paste_secret_here>
```

### 3. Create Keycloak Test Users

Create test users for development and testing:

```bash
./scripts/create-keycloak-test-users.sh
```

This creates the following test users:

| Username         | Password         | Role       | Clan                     |
| ---------------- | ---------------- | ---------- | ------------------------ |
| `testsuperadmin` | `SuperAdmin123!` | Superadmin | None                     |
| `testowner`      | `ClanOwner123!`  | Clan Owner | Clan 54 (Angry Avengers) |
| `testadmin`      | `ClanAdmin123!`  | Clan Admin | Clan 54 (Angry Avengers) |
| `testuser`       | `TestUser123!`   | User       | Clan 54 (Angry Avengers) |
| `testowner2`     | `ClanOwner2123!` | Clan Owner | Clan 55 (Feather Fury)   |

The script also generates `scripts/local-keycloak-test-users.json` with user ID
mappings for database seeding.

---

## Database Setup

### 1. Run Database Migrations

Apply all database migrations to create the schema:

```bash
npm run db:migrate:deploy
```

This creates all tables, indexes, and constraints defined in the Prisma schema.

### 2. Seed the Database

Populate the database with test data:

```bash
npm run db:seed
```

This creates:

- System settings (battle scheduler configuration)
- Master battle schedule (historical and upcoming battles)
- Action codes (HOLD, WARN, KICK, RESERVE, PASS, LEFT)
- Sample clans (Angry Avengers, Feather Fury, Bird Brain Battalion)
- Test users (linked to Keycloak users)
- Roster members
- Sample battles with statistics
- Monthly and yearly performance summaries

---

## Running the Application

### Start Development Servers

Start both the API and frontend in development mode:

```bash
npm run dev
```

This starts:

- **API Server**: http://localhost:3001 (with hot reload)
- **Frontend**: http://localhost:3000 (with hot reload)

The servers will automatically restart when you make code changes.

### Alternative: Start Services Individually

If you prefer to run services in separate terminals:

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Frontend
npm run dev:frontend
```

---

## Verification & Testing

### 1. Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:3001/health
- **Keycloak Admin**: http://localhost:8080/admin
  - Username: `admin`
  - Password: `<your KEYCLOAK_ADMIN_PASSWORD>`

### 2. Test Authentication

Try logging in with one of the test users:

1. Navigate to http://localhost:3000
2. Click "Login"
3. Use credentials from the [test users table](#3-create-keycloak-test-users)
4. You should be redirected back to the application authenticated

### 3. Verify API Connection

Test the API authentication flow:

```bash
./scripts/test-keycloak-auth.js testuser TestUser123!
```

This should display the JWT token and decoded claims.

### 4. Run Automated Tests

Run the test suite to verify everything is working:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for active development)
npm run test:watch
```

### 5. Verify Database

Open Prisma Studio to browse the database:

```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555 where you can view and edit
data.

---

## Development Workflow

### Daily Development

1. **Start Docker services** (if not already running):

   ```bash
   npm run docker:up
   ```

2. **Start development servers**:

   ```bash
   npm run dev
   ```

3. **Make your changes** in `frontend/`, `api/`, or `common/`

4. **Test your changes**:

   ```bash
   npm test
   ```

5. **Format and lint** before committing:
   ```bash
   npm run format
   npm run lint:fix
   ```

### Common Tasks

#### Type Checking

```bash
npm run type-check
```

#### Database Operations

```bash
# Create a new migration
npm run db:migrate:dev

# Reset database (drops all data, reruns migrations and seed)
npm run db:reset-dev

# Backup database
npm run db:backup

# Restore database
npm run db:restore <backup-file>

# Open Prisma Studio
npm run db:studio
```

#### Docker Management

```bash
# View container status
npm run docker:ps

# View logs
npm run docker:logs

# Restart services
npm run docker:restart

# Stop services
npm run docker:down

# Clean everything (removes volumes)
npm run docker:clean
```

#### Building for Production

```bash
# Build all workspaces
npm run build:all

# Check deployment readiness
npm run check:ready
```

---

## Troubleshooting

### Docker Services Won't Start

**Problem**: Containers fail to start or show unhealthy status.

**Solutions**:

1. Check if ports are already in use:
   ```bash
   lsof -i :5432  # PostgreSQL
   lsof -i :8080  # Keycloak
   lsof -i :6379  # Valkey
   ```
2. Clean and restart:
   ```bash
   npm run docker:clean
   npm run docker:up
   ```
3. Check Docker logs:
   ```bash
   npm run docker:logs
   ```

### Database Connection Errors

**Problem**: Cannot connect to PostgreSQL.

**Solutions**:

1. Verify PostgreSQL is running and healthy:
   ```bash
   npm run docker:ps
   ```
2. Check database credentials in `.env` match `docker-compose.yml`
3. Ensure `DATABASE_URL` in `.env` is correct:
   ```
   DATABASE_URL=postgresql://angrybirdman:angrybirdman_dev_password@localhost:5432/angrybirdman?schema=public
   ```

### Keycloak Realm Creation Fails

**Problem**: Realm creation script fails.

**Solutions**:

1. Ensure `KEYCLOAK_ADMIN_PASSWORD` is set:
   ```bash
   export KEYCLOAK_ADMIN_PASSWORD='your_password'
   ```
2. Wait for Keycloak to be fully started (check health status)
3. If realm already exists, delete it first:
   - Login to http://localhost:8080/admin
   - Delete the `angrybirdman` realm
   - Re-run the creation script

### Database Migrations Fail

**Problem**: `npm run db:migrate:deploy` fails.

**Solutions**:

1. Reset the database:
   ```bash
   npm run db:reset-dev
   ```
2. If that doesn't work, clean Docker volumes:
   ```bash
   npm run docker:clean
   npm run docker:up
   # Wait for healthy status
   npm run db:migrate:deploy
   ```

### Test Users Don't Work

**Problem**: Cannot login with test users.

**Solutions**:

1. Verify users were created:
   - Check output from `create-keycloak-test-users.sh`
   - Login to Keycloak admin and verify users exist
2. Recreate users:
   ```bash
   ./scripts/create-keycloak-test-users.sh
   ```
3. Reseed database:
   ```bash
   npm run db:seed
   ```

### Port Already in Use

**Problem**: Cannot start dev servers - port 3000 or 3001 in use.

**Solutions**:

1. Find and kill the process:
   ```bash
   lsof -i :3000  # or :3001
   kill -9 <PID>
   ```
2. Or use different ports in `.env`:
   ```bash
   API_PORT=3002
   FRONTEND_PORT=3001
   ```

### Module Not Found Errors

**Problem**: TypeScript/Node can't find modules.

**Solutions**:

1. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. Regenerate Prisma Client:
   ```bash
   npm run db:generate
   ```
3. Rebuild common library:
   ```bash
   npm run build:common
   ```

---

## Next Steps

### Learn the Codebase

1. **Read the specifications**:
   - `specs/high-level-spec.md` - System overview and data model
   - `specs/user-experience-specs.md` - UX design and components
   - `specs/epics-and-stories.md` - User stories and features

2. **Explore the code structure**:
   - `frontend/src/` - React application
   - `api/src/` - Fastify REST API
   - `common/src/` - Shared code between frontend and backend
   - `database/prisma/` - Database schema and migrations

3. **Review implementation logs**:
   - `implog/` - Contains detailed logs of implementation decisions

### Development Resources

- **API Documentation**: http://localhost:3001/documentation (when API is
  running)
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio`)
- **Keycloak Admin Console**: http://localhost:8080/admin

### Contributing

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with commits following
   [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add battle statistics chart"
   git commit -m "fix: correct ratio calculation"
   ```

3. Run tests and checks:

   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. Push and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Getting Help

- **Documentation**: Check `docs/`, `specs/`, and `scripts/README.md`
- **Implementation Logs**: Review `implog/` for detailed implementation notes
- **Script Help**: Most scripts support `--help` flag:
  ```bash
  ./scripts/create-keycloak-realm.sh --help
  ```

---

## Quick Reference

### Essential Commands

```bash
# Start everything
npm run docker:up && npm run dev

# Stop everything
npm run docker:down

# Reset development environment
npm run docker:clean
npm run docker:up
npm run db:migrate:deploy
npm run db:seed

# Run tests
npm test

# Format and lint
npm run format && npm run lint:fix

# Build for production
npm run build:all

# Check deployment readiness
npm run check:ready
```

### Test User Credentials

```bash
# Superadmin
Username: testsuperadmin
Password: SuperAdmin123!

# Clan Owner (Clan 54)
Username: testowner
Password: ClanOwner123!

# Clan Admin (Clan 54)
Username: testadmin
Password: ClanAdmin123!

# Regular User (Clan 54)
Username: testuser
Password: TestUser123!
```

### Important URLs

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/documentation
- Keycloak: http://localhost:8080
- Prisma Studio: http://localhost:5555 (via `npm run db:studio`)

---

Welcome aboard! Happy coding! 🎮🐦
