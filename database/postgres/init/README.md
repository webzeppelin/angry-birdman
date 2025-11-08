# PostgreSQL Initialization Scripts

This directory contains initialization scripts that are automatically executed
when the PostgreSQL container is first created.

## Execution Order

Scripts in this directory are executed in alphabetical order by PostgreSQL's
Docker entrypoint. The numbering prefix ensures proper execution sequence:

1. **01-create-multiple-databases.sh** - Creates multiple databases
   (angrybirdman and keycloak)
2. **02-init-angrybirdman-db.sql** - Initializes the Angry Birdman database with
   extensions and configuration

## Script Details

### 01-create-multiple-databases.sh

Creates multiple PostgreSQL databases based on the `POSTGRES_MULTIPLE_DATABASES`
environment variable. This allows both the application database and Keycloak
database to be created from a single PostgreSQL instance.

**Environment Variables:**

- `POSTGRES_MULTIPLE_DATABASES`: Comma-separated list of database names to
  create

### 02-init-angrybirdman-db.sql

Initializes the Angry Birdman database with:

- Required PostgreSQL extensions (uuid-ossp, pg_trgm)
- UTF-8 encoding and locale settings
- UTC timezone configuration
- Optimal database settings for the application

**Note:** This script does NOT create table schemas. Table schemas are managed
by Prisma migrations which will be executed separately during application setup.

## Important Notes

### First Run Only

These scripts are only executed when the PostgreSQL container is **first
created**. If you need to re-run initialization:

1. Stop and remove the container: `docker-compose down`
2. Remove the PostgreSQL volume: `docker volume rm angrybirdman-postgres-data`
3. Start the container again: `docker-compose up postgres`

### Manual Execution

If you need to manually execute these scripts on an existing database:

```bash
# Connect to PostgreSQL container
docker exec -it angrybirdman-postgres psql -U angrybirdman

# Execute SQL commands manually or load a file
\i /docker-entrypoint-initdb.d/02-init-angrybirdman-db.sql
```

### Adding New Initialization Scripts

To add additional initialization scripts:

1. Create a new file with an appropriate numeric prefix (e.g.,
   `03-my-script.sql`)
2. Make shell scripts executable: `chmod +x script-name.sh`
3. Rebuild and restart containers

## Security Considerations

### Development vs Production

These initialization scripts are designed for **development environments**. For
production:

- Use stronger, randomly-generated passwords
- Consider using separate PostgreSQL instances for app and Keycloak
- Implement proper backup and recovery procedures
- Use connection pooling and read replicas for scalability
- Enable SSL/TLS for database connections
- Implement row-level security if needed

### Credential Management

Never commit `.env` files with actual credentials to version control. Use:

- `.env.example` as a template (checked into git)
- `.env` for actual credentials (in .gitignore)
- Secret management tools for production (AWS Secrets Manager, HashiCorp Vault,
  etc.)

## Troubleshooting

### Scripts Not Executing

If initialization scripts don't run:

- Ensure scripts are readable: `chmod +r *.sql`
- Ensure shell scripts are executable: `chmod +x *.sh`
- Check Docker logs: `docker-compose logs postgres`
- Verify volume is empty (scripts only run on empty volume)

### Database Already Exists

If you see "database already exists" errors:

- This is normal if the volume persists between container restarts
- Scripts are idempotent where possible (using IF NOT EXISTS)
- For a fresh start, remove the volume

### Connection Issues

If applications can't connect to PostgreSQL:

- Verify the container is healthy: `docker-compose ps`
- Check connection string matches environment variables
- Ensure network connectivity: `docker network inspect angrybirdman-network`
- Review PostgreSQL logs for authentication errors

## Related Documentation

- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [PostgreSQL Initialization Scripts](https://github.com/docker-library/docs/blob/master/postgres/README.md#initialization-scripts)
- [Prisma PostgreSQL Setup](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
