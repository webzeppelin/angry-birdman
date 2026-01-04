# Test Server Backup and Restore Guide

This guide covers backing up and restoring databases on the Angry Birdman test
server deployment.

## Overview

The test server runs two PostgreSQL databases that require regular backups:

1. **Application Database** (`angrybirdman_test`) - Contains all clan data,
   battles, rosters, and user profiles
2. **Keycloak Database** (`keycloak_test`) - Contains authentication data,
   users, roles, and sessions

## Backup Scripts

### Manual Backup

To create an immediate backup of both databases:

```bash
cd /opt/angrybirdman
./scripts/backup-test-server-db.sh --verbose
```

#### Backup Options

- `-v, --verbose` - Show detailed output (recommended for manual runs)
- `-k, --keep DAYS` - Keep backups for N days (default: 30)
- `-o, --output DIR` - Output directory (default: `/opt/angrybirdman/backups`)
- `-h, --help` - Show help message

#### Examples

```bash
# Verbose backup with default settings
./scripts/backup-test-server-db.sh --verbose

# Keep backups for 60 days
./scripts/backup-test-server-db.sh --verbose --keep 60

# Use custom backup directory
./scripts/backup-test-server-db.sh --verbose --output /mnt/backup/angrybirdman
```

### Backup Output

Backups are stored as compressed SQL files with checksums:

```
/opt/angrybirdman/backups/
├── angrybirdman_20260103_120000.sql.gz
├── angrybirdman_20260103_120000.sql.gz.sha256
├── keycloak_20260103_120000.sql.gz
└── keycloak_20260103_120000.sql.gz.sha256
```

Each backup includes:

- Compressed SQL dump (`.sql.gz`)
- SHA-256 checksum (`.sha256`)
- Timestamp in filename (`YYYYMMDD_HHMMSS`)

## Automated Backups with Cron

### Setting Up Daily Backups

To schedule automatic daily backups at 2:00 AM:

1. Edit the crontab as the `angrybirdman` user:

   ```bash
   crontab -e
   ```

2. Add the following line:

   ```cron
   0 2 * * * /opt/angrybirdman/scripts/backup-test-server-db.sh > /opt/angrybirdman/backups/cron.log 2>&1
   ```

3. Save and exit the editor.

### Verify Cron Job

To verify the cron job is scheduled:

```bash
crontab -l
```

### Check Backup Logs

The cron job logs output to `/opt/angrybirdman/backups/cron.log`:

```bash
tail -f /opt/angrybirdman/backups/cron.log
```

### Cron Schedule Examples

```cron
# Every day at 2:00 AM
0 2 * * * /opt/angrybirdman/scripts/backup-test-server-db.sh

# Every day at 2:00 AM and 2:00 PM
0 2,14 * * * /opt/angrybirdman/scripts/backup-test-server-db.sh

# Every Sunday at 3:00 AM (weekly backup)
0 3 * * 0 /opt/angrybirdman/scripts/backup-test-server-db.sh

# Every 6 hours
0 */6 * * * /opt/angrybirdman/scripts/backup-test-server-db.sh
```

## Restore Scripts

### Restoring from Backup

To restore one or both databases from backup:

```bash
cd /opt/angrybirdman

# Restore both databases
./scripts/restore-test-server-db.sh \
  --app /opt/angrybirdman/backups/angrybirdman_20260103_120000.sql.gz \
  --keycloak /opt/angrybirdman/backups/keycloak_20260103_120000.sql.gz

# Restore only application database
./scripts/restore-test-server-db.sh \
  --app /opt/angrybirdman/backups/angrybirdman_20260103_120000.sql.gz

# Restore only Keycloak database
./scripts/restore-test-server-db.sh \
  --keycloak /opt/angrybirdman/backups/keycloak_20260103_120000.sql.gz
```

#### Restore Options

- `-a, --app FILE` - Application database backup file
- `-k, --keycloak FILE` - Keycloak database backup file
- `-y, --yes` - Skip confirmation prompts (use with caution!)
- `-h, --help` - Show help message

#### Restore with Auto-Confirm

For automated restore (e.g., disaster recovery scripts):

```bash
./scripts/restore-test-server-db.sh \
  --app /opt/angrybirdman/backups/angrybirdman_20260103_120000.sql.gz \
  --keycloak /opt/angrybirdman/backups/keycloak_20260103_120000.sql.gz \
  --yes
```

### Restore Process

The restore script:

1. Verifies backup file exists
2. Validates SHA-256 checksum (if available)
3. Shows backup details and confirmation prompt
4. Restores database from backup
5. Reports success and elapsed time

**⚠️ WARNING**: Restore operations overwrite the existing database. Always
confirm you're restoring the correct backup file.

## Backup Management

### Viewing Available Backups

List all backups sorted by date:

```bash
ls -lht /opt/angrybirdman/backups/*.sql.gz
```

### Checking Backup Integrity

Verify a backup's checksum:

```bash
cd /opt/angrybirdman/backups
sha256sum -c angrybirdman_20260103_120000.sql.gz.sha256
```

### Disk Space Management

Check backup directory size:

```bash
du -sh /opt/angrybirdman/backups
```

The backup script automatically deletes backups older than the retention period
(default: 30 days).

## Disaster Recovery

### Full System Recovery

If the test server needs to be rebuilt:

1. Deploy fresh containers using docker-compose
2. Stop all services except PostgreSQL:
   ```bash
   docker compose -f docker/docker-compose.test.yml stop api frontend keycloak
   ```
3. Restore both databases:
   ```bash
   ./scripts/restore-test-server-db.sh \
     --app /opt/angrybirdman/backups/angrybirdman_LATEST.sql.gz \
     --keycloak /opt/angrybirdman/backups/keycloak_LATEST.sql.gz
   ```
4. Restart all services:
   ```bash
   docker compose -f docker/docker-compose.test.yml up -d
   ```
5. Verify application functionality at https://192.168.0.70

### Partial Recovery

#### Application Data Only

If only application data is corrupted:

```bash
./scripts/restore-test-server-db.sh \
  --app /opt/angrybirdman/backups/angrybirdman_20260103_120000.sql.gz
```

No restart required.

#### Keycloak Data Only

If authentication data is corrupted:

```bash
./scripts/restore-test-server-db.sh \
  --keycloak /opt/angrybirdman/backups/keycloak_20260103_120000.sql.gz

# Restart Keycloak to reload configuration
docker compose -f docker/docker-compose.test.yml restart keycloak
```

## Off-Site Backups

For additional protection, copy backups to off-site storage.

### Using rsync to Remote Server

```bash
# One-time sync
rsync -avz /opt/angrybirdman/backups/ user@backup-server:/backups/angrybirdman/

# Automated daily sync (add to crontab after backup)
0 3 * * * rsync -avz --delete /opt/angrybirdman/backups/ user@backup-server:/backups/angrybirdman/
```

### Using Cloud Storage (rclone)

Install rclone and configure a remote:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure remote (e.g., AWS S3, Google Drive)
rclone config

# Sync backups to cloud
rclone sync /opt/angrybirdman/backups/ remote:angrybirdman-backups/

# Automated sync (add to crontab)
0 4 * * * rclone sync /opt/angrybirdman/backups/ remote:angrybirdman-backups/
```

## Monitoring and Alerts

### Email Notifications on Backup Failure

Modify the cron job to send email on errors:

```cron
0 2 * * * /opt/angrybirdman/scripts/backup-test-server-db.sh || echo "Backup failed!" | mail -s "Angry Birdman Backup Failed" admin@example.com
```

### Monitoring Backup Age

Create a monitoring script to alert if backups are too old:

```bash
#!/bin/bash
# /opt/angrybirdman/scripts/check-backup-age.sh

BACKUP_DIR="/opt/angrybirdman/backups"
MAX_AGE_HOURS=30

LATEST=$(find "$BACKUP_DIR" -name "angrybirdman_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
AGE_SECONDS=$(( $(date +%s) - $(stat -c %Y "$LATEST") ))
AGE_HOURS=$(( AGE_SECONDS / 3600 ))

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
  echo "WARNING: Latest backup is $AGE_HOURS hours old"
  exit 1
fi

echo "Latest backup is $AGE_HOURS hours old - OK"
exit 0
```

Add to crontab to run every hour:

```cron
0 * * * * /opt/angrybirdman/scripts/check-backup-age.sh || echo "Backup too old!" | mail -s "Angry Birdman Backup Alert" admin@example.com
```

## Testing Backups

Regularly test backup restoration to ensure backups are valid:

1. Create a test restore in a separate environment
2. Verify data integrity
3. Test application functionality
4. Document any issues

**Best Practice**: Test disaster recovery procedures quarterly.

## Troubleshooting

### Backup Script Fails

Check Docker services:

```bash
docker compose -f docker/docker-compose.test.yml ps
```

Check disk space:

```bash
df -h /opt/angrybirdman
```

View detailed errors:

```bash
./scripts/backup-test-server-db.sh --verbose
```

### Restore Fails

Verify backup file integrity:

```bash
sha256sum -c backup-file.sql.gz.sha256
gunzip -t backup-file.sql.gz
```

Check PostgreSQL logs:

```bash
docker compose -f docker/docker-compose.test.yml logs postgres
```

### Permission Issues

Ensure the `angrybirdman` user owns the backup directory:

```bash
sudo chown -R angrybirdman:angrybirdman /opt/angrybirdman/backups
sudo chmod 755 /opt/angrybirdman/backups
```

Ensure scripts are executable:

```bash
chmod +x /opt/angrybirdman/scripts/backup-test-server-db.sh
chmod +x /opt/angrybirdman/scripts/restore-test-server-db.sh
```

## Security Considerations

1. **Backup Encryption**: Consider encrypting backups before sending off-site:

   ```bash
   gpg --encrypt --recipient admin@example.com backup-file.sql.gz
   ```

2. **Access Control**: Restrict backup directory permissions:

   ```bash
   chmod 700 /opt/angrybirdman/backups
   ```

3. **Backup Rotation**: Implement 3-2-1 backup strategy:
   - 3 copies of data
   - 2 different storage types
   - 1 off-site copy

4. **Database Credentials**: Backups contain sensitive data. Protect them
   appropriately.

## Reference

### Script Locations

- Backup script: `/opt/angrybirdman/scripts/backup-test-server-db.sh`
- Restore script: `/opt/angrybirdman/scripts/restore-test-server-db.sh`
- Backup directory: `/opt/angrybirdman/backups`

### Docker Compose Configuration

- Compose file: `/opt/angrybirdman/docker/docker-compose.test.yml`
- Environment: `/opt/angrybirdman/docker/.env.test`
- PostgreSQL container: `angrybirdman-test-postgres`

### Databases

- Application: `angrybirdman_test`
- Keycloak: `keycloak_test`
- PostgreSQL user: `angrybirdman_test`

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Cron Guide](https://crontab.guru/)
- [Disaster Recovery Best Practices](https://www.postgresql.org/docs/current/backup-file.html)
