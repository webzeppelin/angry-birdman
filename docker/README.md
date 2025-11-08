# Angry Birdman - Docker Infrastructure

This directory contains Docker-related configuration and documentation for the
Angry Birdman project.

## Overview

Angry Birdman uses Docker and Docker Compose to provide a consistent,
containerized development environment with all required services:

- **PostgreSQL 15** - Primary database for application data and Keycloak
- **Valkey 7.2** - Redis-compatible cache for session state and caching
- **Keycloak 23** - Identity provider for authentication and user management

## Quick Start

### Prerequisites

- Docker 24.0+ installed
- Docker Compose V2 (comes with Docker Desktop)
- 8GB RAM minimum (16GB recommended)
- 10GB free disk space

### Starting the Infrastructure

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```
2. **Review and customize .env file:** Edit `.env` with your preferred
   configuration (optional for development)

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```
4. **View logs:**

   ```bash
   docker-compose logs -f
   ```

5. **Check service health:**
   ```bash
   docker-compose ps
   ```

### First-Time Setup

After starting the infrastructure for the first time:

1. **Verify PostgreSQL:**

   ```bash
   docker exec -it angrybirdman-postgres psql -U angrybirdman -c "\l"
   ```

   You should see `angrybirdman` and `keycloak` databases.

2. **Verify Valkey:**

   ```bash
   docker exec -it angrybirdman-valkey valkey-cli ping
   ```

   Should return `PONG`.

3. **Access Keycloak Admin Console:**
   - URL: http://localhost:8080
   - Username: `admin` (or value from .env)
   - Password: `admin` (or value from .env)

4. **Import Keycloak Realm (if not auto-imported):** See
   `keycloak/config/README.md` for instructions.

## Service Details

### PostgreSQL

- **Container Name:** `angrybirdman-postgres`
- **Port:** 5432 (configurable via POSTGRES_PORT)
- **Databases:** `angrybirdman` (app), `keycloak` (IdP)
- **Volume:** `angrybirdman-postgres-data`
- **Initialization:** Scripts in `database/postgres/init/`

**Connection String (from host):**

```
postgresql://angrybirdman:angrybirdman_dev_password@localhost:5432/angrybirdman
```

**Connection String (from other containers):**

```
postgresql://angrybirdman:angrybirdman_dev_password@postgres:5432/angrybirdman
```

### Valkey

- **Container Name:** `angrybirdman-valkey`
- **Port:** 6379 (configurable via VALKEY_PORT)
- **Volume:** `angrybirdman-valkey-data`
- **Persistence:** AOF (Append-Only File) enabled
- **Max Memory:** 256MB (configurable via VALKEY_MAXMEMORY)
- **Eviction Policy:** allkeys-lru

**Connection String (from host):**

```
redis://localhost:6379
```

**Connection String (from other containers):**

```
redis://valkey:6379
```

### Keycloak

- **Container Name:** `angrybirdman-keycloak`
- **Port:** 8080 (configurable via KEYCLOAK_PORT)
- **Volume:** `angrybirdman-keycloak-data`
- **Mode:** Development (start-dev)
- **Realm:** `angrybirdman` (imported from config)

**Admin Console:** http://localhost:8080

**Realm Endpoints:**

- Account Console: http://localhost:8080/realms/angrybirdman/account
- OpenID Config:
  http://localhost:8080/realms/angrybirdman/.well-known/openid-configuration

## Docker Compose Files

### docker-compose.yml (Base Configuration)

The main Docker Compose file defining all services with production-ready
defaults. This file should work across all environments with environment
variable customization.

**Services:**

- `postgres` - PostgreSQL database
- `valkey` - Valkey cache
- `keycloak` - Identity provider

**Networks:**

- `angrybirdman-network` - Bridge network connecting all services

**Volumes:**

- `angrybirdman-postgres-data` - PostgreSQL data persistence
- `angrybirdman-valkey-data` - Valkey data persistence
- `angrybirdman-keycloak-data` - Keycloak data persistence

### docker-compose.override.yml (Local Development)

Override file automatically merged with `docker-compose.yml` for local
development. Contains development-specific customizations like verbose logging
and optional development tools.

**Customizations:**

- Verbose logging enabled
- Debug modes for troubleshooting
- Optional pgAdmin and Redis Commander (commented out)

## Management Commands

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Start with logs in foreground
docker-compose up
```

### Stopping Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop postgres

# Stop and remove containers
docker-compose down

# Stop and remove containers AND volumes (data loss!)
docker-compose down -v
```

### Viewing Logs

```bash
# View logs for all services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs postgres

# View last 100 lines
docker-compose logs --tail=100
```

### Service Health

```bash
# Check service status
docker-compose ps

# Check resource usage
docker stats

# Inspect a service
docker-compose exec postgres env
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it angrybirdman-postgres psql -U angrybirdman

# Run SQL file
docker exec -i angrybirdman-postgres psql -U angrybirdman < backup.sql

# Create database backup
docker exec angrybirdman-postgres pg_dump -U angrybirdman angrybirdman > backup.sql

# Restore database backup
docker exec -i angrybirdman-postgres psql -U angrybirdman angrybirdman < backup.sql
```

### Cache Operations

```bash
# Connect to Valkey CLI
docker exec -it angrybirdman-valkey valkey-cli

# Clear all cache
docker exec angrybirdman-valkey valkey-cli FLUSHALL

# View cache info
docker exec angrybirdman-valkey valkey-cli INFO
```

### Keycloak Operations

```bash
# View Keycloak logs
docker-compose logs keycloak

# Restart Keycloak
docker-compose restart keycloak

# Access Keycloak CLI
docker exec -it angrybirdman-keycloak /opt/keycloak/bin/kc.sh
```

## Development Workflow

### Fresh Start (Reset Everything)

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Remove any orphaned volumes
docker volume prune

# Start fresh
docker-compose up -d

# Check initialization logs
docker-compose logs postgres keycloak
```

### Update Configuration

After changing configuration files:

```bash
# Rebuild and restart services
docker-compose up -d --build

# Or recreate specific service
docker-compose up -d --force-recreate postgres
```

### Add Development Tools

Uncomment pgAdmin and Redis Commander in `docker-compose.override.yml`:

```yaml
# Uncomment these services in docker-compose.override.yml
pgadmin: # http://localhost:5050
redis-commander: # http://localhost:8081
```

Then restart:

```bash
docker-compose up -d
```

## Networking

All services are connected via the `angrybirdman-network` bridge network:

```
angrybirdman-network (172.x.x.x/16)
├── postgres (service name: postgres, container: angrybirdman-postgres)
├── valkey (service name: valkey, container: angrybirdman-valkey)
└── keycloak (service name: keycloak, container: angrybirdman-keycloak)
```

**Inter-service communication:**

- Services use service names as hostnames (e.g., `postgres:5432`)
- No need for IP addresses, Docker DNS handles resolution
- All services can communicate on internal network

**External access:**

- Ports are exposed to host via port mappings
- Accessible via `localhost:<port>` from host machine

## Data Persistence

### Volumes

Data is persisted in named Docker volumes:

```bash
# List volumes
docker volume ls | grep angrybirdman

# Inspect volume
docker volume inspect angrybirdman-postgres-data

# Backup volume
docker run --rm -v angrybirdman-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v angrybirdman-postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

### Backup Strategy

For development:

1. **Regular database dumps** (see Database Operations above)
2. **Version control** for initialization scripts and configuration
3. **Volume backups** before major changes

For production:

1. **Automated database backups** with retention policy
2. **Point-in-time recovery** enabled on PostgreSQL
3. **Volume snapshots** on cloud provider
4. **Off-site backup storage**

## Environment Variables

All services use environment variables for configuration. See `.env.example` for
complete list.

**Critical Variables:**

- `POSTGRES_PASSWORD` - Database password
- `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin password
- `VALKEY_MAXMEMORY` - Cache memory limit

**Override in .env file** (not committed to git)

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon is running
docker info

# Check Docker Compose version
docker-compose version

# View error logs
docker-compose logs
```

### Port Conflicts

If ports are already in use, change them in `.env`:

```
POSTGRES_PORT=5433
KEYCLOAK_PORT=8081
VALKEY_PORT=6380
```

### Database Connection Errors

```bash
# Verify database is running
docker-compose ps postgres

# Check health status
docker inspect angrybirdman-postgres | grep -A5 Health

# Test connection
docker exec angrybirdman-postgres pg_isready -U angrybirdman
```

### Keycloak Won't Start

```bash
# Check Keycloak logs
docker-compose logs keycloak

# Common issues:
# - Waiting for PostgreSQL (check postgres health)
# - Port conflict (change KEYCLOAK_PORT)
# - Memory issues (increase Docker memory allocation)
```

### Volume Permission Issues

```bash
# Fix PostgreSQL volume permissions
docker-compose down
docker volume rm angrybirdman-postgres-data
docker-compose up -d postgres
```

### Network Issues

```bash
# Recreate network
docker-compose down
docker network rm angrybirdman-network
docker-compose up -d

# Check network connectivity
docker exec angrybirdman-keycloak ping postgres
```

## Security Considerations

### Development Environment

Current configuration is optimized for development:

- Weak passwords
- HTTP (not HTTPS)
- Debug logging enabled
- Exposed ports on all interfaces

**This is NOT suitable for production deployment.**

### Production Deployment

For production, you must:

1. **Use strong, random passwords**
2. **Enable HTTPS/TLS** on all services
3. **Restrict port exposure** (use reverse proxy)
4. **Enable production mode** on Keycloak (remove `start-dev`)
5. **Configure firewalls** and network segmentation
6. **Enable authentication** on Valkey
7. **Implement monitoring** and alerting
8. **Set up automated backups**
9. **Use secrets management** (not .env files)
10. **Regular security updates** and patch management

## Performance Tuning

### PostgreSQL

For production workloads, tune PostgreSQL in `docker/postgres/postgresql.conf`:

- `shared_buffers` - 25% of available RAM
- `effective_cache_size` - 50-75% of available RAM
- `work_mem` - Depends on query complexity
- `max_connections` - Based on application needs

### Valkey

Adjust memory and persistence settings:

- `VALKEY_MAXMEMORY` - Based on dataset size
- Eviction policy - Choose based on use case
- Persistence - Balance between durability and performance

### Keycloak

Optimize for production:

- Enable caching (Infinispan)
- Configure connection pooling
- Set appropriate session timeouts
- Enable CDN for static assets

## Related Documentation

- Docker Compose: [Documentation](https://docs.docker.com/compose/)
- PostgreSQL Docker: [Docker Hub](https://hub.docker.com/_/postgres)
- Valkey: [GitHub](https://github.com/valkey-io/valkey)
- Keycloak: [Documentation](https://www.keycloak.org/documentation)

## Next Steps

After infrastructure is running:

1. **Verify all services** are healthy
2. **Import Keycloak realm** if not auto-imported
3. **Proceed to Step 2.2** - Database Schema Implementation
4. **Set up development environment** for frontend and API
