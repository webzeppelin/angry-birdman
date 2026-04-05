# Angry Birdman — Production Server Deployment Plan

**Version**: 1.0  
**Date**: April 4, 2026  
**Status**: Ready for Execution

## Overview

This plan takes a fresh Amazon LightSail instance (Amazon Linux 2023) to a fully
hardened, HTTPS-enabled production environment with automated deployments via
GitHub Actions over SSH. It covers everything from initial server provisioning
through an ongoing, repeatable deployment lifecycle.

### Architecture Summary

- **Application stack**: React frontend + Fastify API + PostgreSQL + Valkey +
  Keycloak — all running as Docker containers
- **TLS**: Let's Encrypt certificate via Certbot; nginx terminates HTTPS on port
  443 (app) and 8443 (Keycloak)
- **Deployment trigger**: Push a `prod-*` tag to GitHub → GitHub Actions builds
  images, SSHes into production, pulls and redeploys
- **Keycloak**: Runs HTTP-only internally; nginx acts as the TLS proxy
  (`KC_PROXY: edge`)
- **Backups**: Daily automated backups of both databases, 30-day retention
- **OS patches**: Automated security updates via `dnf-automatic`

### New Files Created by This Plan

| File                                           | Purpose                               |
| ---------------------------------------------- | ------------------------------------- |
| `docker/docker-compose.prod.yml`               | Production Docker Compose             |
| `docker/nginx-proxy-prod.conf`                 | Production nginx config (80/443/8443) |
| `docker/.env.prod.example`                     | Environment variable template         |
| `keycloak/config-prod/angrybirdman-realm.json` | Production Keycloak realm config      |
| `.github/workflows/deploy-prod.yml`            | GitHub Actions production pipeline    |
| `scripts/backup-prod-db.sh`                    | Daily database backup script          |
| `scripts/deploy-prod.sh`                       | Manual deployment script              |
| `scripts/rollback-prod.sh`                     | Rollback to previous image tag        |

### Reference Files (Templates)

| File                                      | Used As Template For                           |
| ----------------------------------------- | ---------------------------------------------- |
| `docker/docker-compose.test.yml`          | `docker-compose.prod.yml`                      |
| `docker/nginx-reverse-proxy.conf`         | `nginx-proxy-prod.conf`                        |
| `.github/workflows/deploy-test.yml`       | `deploy-prod.yml`                              |
| `scripts/backup-test-server-db.sh`        | `backup-prod-db.sh`                            |
| `scripts/deploy-test.sh`                  | `deploy-prod.sh`                               |
| `scripts/rollback-test.sh`                | `rollback-prod.sh`                             |
| `keycloak/config/angrybirdman-realm.json` | `keycloak/config-prod/angrybirdman-realm.json` |

### Key Decisions

1. **SSH-based deployment** over a self-hosted runner: standard practice for
   internet-facing production; no long-running runner process on the server; the
   exact commands sent to the server are fully auditable in the workflow file.
2. **nginx SSL termination on port 8443** for Keycloak (rather than Keycloak's
   own TLS): simpler — one certificate, one place to configure TLS;
   `KC_PROXY: edge` informs Keycloak that a trusted proxy handles HTTPS.
3. **Let's Encrypt / Certbot**: free, 90-day certs renewed automatically by a
   systemd timer; standalone initial issuance, webroot renewal (nginx serves
   `.well-known/acme-challenge/` on port 80 so renewal can happen while the app
   is running).
4. **`dnf-automatic` with `upgrade_type = security`**: automatically applies OS
   security patches nightly; excludes feature updates that could break the
   application.
5. **Docker daemon JSON log limits** (`max-file: 10`, `max-size: 10m`): built-in
   Docker log rotation caps each container at ~100 MB of logs without needing a
   separate logrotate configuration.
6. **`keycloak/config-prod/`** as a separate directory: prevents Keycloak from
   attempting to import both the dev and production realm JSONs on startup,
   which would conflict on the same realm name.
7. **Migration order** — fresh environment verified first, then data migrated:
   validates the production stack works before introducing test data; provides a
   clean rollback point if the migration encounters problems.

---

## Phase 1 — LightSail Server Bootstrap

_Manual, one-time steps performed via SSH and the AWS console._

### 1.1 — Provision the LightSail Instance (AWS Console)

- Create instance: platform **Amazon Linux 2023**, plan **$7/month** (1 GB / 2
  vCPU / 40 GB SSD)
- Allocate a **Static IP** from the LightSail Networking tab and attach it to
  the instance
- Record the static IP — a DNS A record will point `YOUR_DOMAIN` to it

### 1.2 — Configure the LightSail Firewall (AWS Console)

In the instance's Networking tab, delete default rules and allow only:

| Port | Protocol | Purpose                                |
| ---- | -------- | -------------------------------------- |
| 22   | TCP      | SSH administration                     |
| 80   | TCP      | HTTP → HTTPS redirect + ACME challenge |
| 443  | TCP      | HTTPS application                      |
| 8443 | TCP      | HTTPS Keycloak                         |

### 1.3 — Initial SSH Login and System Update

```bash
ssh -i ~/.ssh/lightsail-key.pem ec2-user@YOUR_STATIC_IP
sudo dnf update -y
sudo hostnamectl set-hostname angrybirdman-prod
```

### 1.4 — DNS Configuration

In your DNS registrar or Route 53, create an A record: `YOUR_DOMAIN` →
`YOUR_STATIC_IP`

Wait for DNS propagation (typically 5–30 minutes) before running Certbot in
Phase 2. Verify with: `dig +short YOUR_DOMAIN`

### 1.5 — SSH Hardening

Edit `/etc/ssh/sshd_config` — add or update these directives:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Protocol 2
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowUsers ec2-user angrybirdman
```

Apply the changes:

```bash
sudo systemctl restart sshd
```

> **Important**: Verify you can still open a _new_ SSH session before closing
> the current one.

### 1.6 — OS Firewall (firewalld)

`firewalld` is not installed by default on Amazon Linux 2023 — install it first:

```bash
sudo dnf install -y firewalld
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --permanent --remove-service=dhcpv6-client 2>/dev/null || true
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

### 1.7 — Install fail2ban (SSH Brute-Force Protection)

```bash
sudo dnf install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

Edit `/etc/fail2ban/jail.local` — set the following under `[DEFAULT]` and
`[sshd]`:

```ini
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

### 1.8 — Automated OS Security Updates (dnf-automatic)

```bash
sudo dnf install -y dnf-automatic
```

Edit `/etc/dnf/automatic.conf`:

```ini
[commands]
upgrade_type = security
apply_updates = yes
emit_via = stdio
```

```bash
sudo systemctl enable --now dnf-automatic.timer
sudo systemctl status dnf-automatic.timer
```

This automatically applies security patches nightly without requiring manual
intervention. Feature updates are excluded to avoid breaking the application.

### 1.9 — Install Docker and Docker Compose Plugin

`docker-compose-plugin` is not available in the Amazon Linux 2023 package
repositories. Install Docker via `dnf`, then manually install the Compose plugin
by downloading it directly from GitHub:

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Install the Docker Compose CLI plugin (not available via dnf on AL2023)
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL \
  https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Verify
docker --version
docker compose version
```

### 1.10 — Configure Docker Daemon Log Limits

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "10"
  }
}
```

```bash
sudo systemctl restart docker
```

This caps each container at 100 MB of logs (`10 files × 10 MB`) with automatic
rotation.

### 1.11 — Configure systemd Journal Retention

Edit `/etc/systemd/journald.conf` — add under `[Journal]`:

```ini
MaxRetentionSec=30day
SystemMaxUse=500M
```

```bash
sudo systemctl restart systemd-journald
```

### 1.12 — Add Swap Space

At 1 GB RAM, Keycloak alone can use 400–600 MB. Add a 2 GB swap file as a safety
buffer:

```bash
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# Persist across reboots
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
```

### 1.13 — Create Service Account and Clone Repository

```bash
sudo dnf install -y git
sudo useradd -m -s /bin/bash angrybirdman
sudo usermod -aG docker angrybirdman
sudo mkdir -p /opt/angrybirdman/backups /opt/angrybirdman/logs
sudo chown -R angrybirdman:angrybirdman /opt/angrybirdman
sudo -u angrybirdman git clone https://github.com/webzeppelin/angry-birdman.git \
  /opt/angrybirdman
```

---

## Phase 2 — SSL Certificate Setup

_Manual, one-time. Must be done before starting nginx on port 443/8443._

### 2.1 — Install Certbot

Using a Python virtual environment for the latest version on Amazon Linux 2023:

```bash
sudo dnf install -y python3 augeas-libs
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip certbot
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
certbot --version
```

### 2.2 — Obtain the Initial Certificate

Certbot's `--standalone` method binds temporarily to port 80. Ensure nothing is
running on port 80 yet:

```bash
sudo certbot certonly --standalone \
  -d YOUR_DOMAIN \
  --email YOUR_EMAIL \
  --agree-tos \
  --no-eff-email
```

Certificate files will be at `/etc/letsencrypt/live/YOUR_DOMAIN/`:

- `fullchain.pem` — certificate + intermediate chain (used for
  `ssl_certificate`)
- `privkey.pem` — private key (used for `ssl_certificate_key`)

### 2.3 — Create Webroot Directory for Renewals

This directory is served by nginx over port 80 so Certbot can renew the
certificate without stopping nginx:

```bash
sudo mkdir -p /var/www/certbot
sudo chown angrybirdman:angrybirdman /var/www/certbot
```

The production nginx config (Phase 3.2) mounts this directory and serves
`/.well-known/acme-challenge/` from it.

### 2.4 — Configure the Certbot Renewal Hook

Create a deploy hook that reloads nginx after each successful renewal:

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
docker compose -f /opt/angrybirdman/docker/docker-compose.prod.yml \
  --env-file /opt/angrybirdman/docker/.env.prod \
  exec nginx nginx -s reload
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### 2.5 — Automate Certificate Renewal via systemd

```bash
sudo tee /etc/systemd/system/certbot-renewal.service << 'EOF'
[Unit]
Description=Certbot Certificate Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --webroot -w /var/www/certbot
User=root
EOF

sudo tee /etc/systemd/system/certbot-renewal.timer << 'EOF'
[Unit]
Description=Twice-Daily Certbot Renewal Check

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now certbot-renewal.timer
```

After nginx is running (Phase 6), verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

---

## Phase 3 — Production Source Files

_These files are committed to the repository. Replace `YOUR_DOMAIN` with the
actual domain name before committing._

### 3.1 — `docker/docker-compose.prod.yml`

Modeled on `docker/docker-compose.test.yml`. Key differences from the test
compose:

- All container, volume, and network names are prefixed `angrybirdman-prod-*`
- `postgres` and `valkey` have **no external port bindings** (internal traffic
  only, never directly accessible from the host)
- `keycloak`: version 25.0, `start --import-realm`, no external port exposure,
  `KC_HOSTNAME: ${KEYCLOAK_HOSTNAME}`, `KC_PROXY: edge`,
  `KC_HTTP_ENABLED: true`; realm JSON imported from
  `../keycloak/config-prod:/opt/keycloak/data/import:ro`
- `api`: `CORS_ORIGIN: https://${APP_HOSTNAME}`;
  `KEYCLOAK_URL: https://${KEYCLOAK_HOSTNAME}:${KEYCLOAK_PORT}` (public URL);
  `KEYCLOAK_REALM_URL: http://keycloak:8080/realms/${KEYCLOAK_REALM}` (internal
  Docker network address — the API talks to Keycloak directly, not through
  nginx, for token validation)
- `nginx`: exposes ports `80`, `443`, and `8443`; mounts
  `./nginx-proxy-prod.conf`, `/etc/letsencrypt:/etc/letsencrypt:ro`, and
  `/var/www/certbot:/var/www/certbot:ro`

### 3.2 — `docker/nginx-proxy-prod.conf`

Modeled on `docker/nginx-reverse-proxy.conf`. Three server blocks:

**Port 80 — HTTP**

- Serves `/.well-known/acme-challenge/` from `/var/www/certbot` (for Certbot
  webroot renewal)
- Redirects all other requests to `https://$host$request_uri` (301)

**Port 443 — Application (HTTPS)**

- TLS 1.2/1.3 with certificates at
  `/etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem` and `privkey.pem`
- HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-XSS-Protection`
- `/api/` → proxy to `api:3001`
- `/auth/` → proxy to `api:3001`
- `/health` → returns `200 OK` inline (for load balancer / deployment checks)
- `/` → proxy to `frontend:3000`

**Port 8443 — Keycloak (HTTPS)**

- Same TLS certificate
- All requests proxied to `keycloak:8080`
- Sets `proxy_set_header X-Forwarded-Proto https` and
  `proxy_set_header X-Forwarded-Port 8443` so that Keycloak generates correct
  `https://` redirect URIs

### 3.3 — `docker/.env.prod.example`

Template file committed to the repository (no secrets). Copy to `.env.prod` on
the server and fill in real values:

```env
# PostgreSQL
POSTGRES_USER=angrybirdman_prod
POSTGRES_PASSWORD=CHANGE_ME_use_openssl_rand
POSTGRES_DB=angrybirdman
KEYCLOAK_DB=keycloak

# Valkey
VALKEY_MAXMEMORY=256mb

# Keycloak
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=CHANGE_ME_use_openssl_rand
KEYCLOAK_REALM=angrybirdman
KEYCLOAK_CLIENT_ID=angrybirdman-frontend
KEYCLOAK_ADMIN_CLIENT_ID=angrybirdman-api-service
KEYCLOAK_ADMIN_CLIENT_SECRET=RETRIEVE_AFTER_FIRST_KEYCLOAK_START
KEYCLOAK_HOSTNAME=YOUR_DOMAIN
KEYCLOAK_PORT=8443

# Application
APP_HOSTNAME=YOUR_DOMAIN
NODE_ENV=production
```

### 3.4 — `keycloak/config-prod/angrybirdman-realm.json`

A copy of `keycloak/config/angrybirdman-realm.json` with these changes made
before committing:

- `"frontendUrl"`: `"https://YOUR_DOMAIN:8443"`
- `angrybirdman-frontend` client `"redirectUris"`: `["https://YOUR_DOMAIN/*"]`
  (remove `localhost` and `192.168.x.x` entries)
- `angrybirdman-frontend` client `"webOrigins"`: `["https://YOUR_DOMAIN"]`
  (remove dev entries)

The separate `keycloak/config-prod/` directory ensures Keycloak only imports the
production realm JSON when mounted at `/opt/keycloak/data/import`, preventing
conflicts with the development realm configuration.

### 3.5 — `.github/workflows/deploy-prod.yml`

Modeled on `.github/workflows/deploy-test.yml`. Key differences:

**Trigger**:

```yaml
on:
  push:
    tags:
      - 'prod-*'
  workflow_dispatch:
```

**`test` job**: identical to `deploy-test.yml`

**`build-and-push` job** — frontend `build-args`:

```yaml
build-args: |
  VITE_API_URL=https://YOUR_DOMAIN
  VITE_KEYCLOAK_URL=https://YOUR_DOMAIN:8443
  VITE_KEYCLOAK_REALM=angrybirdman
  VITE_KEYCLOAK_CLIENT_ID=angrybirdman-frontend
  VITE_APP_URL=https://YOUR_DOMAIN
  VITE_APP_VERSION=${{ github.sha }}
  VITE_APP_ENVIRONMENT=production
```

These `VITE_*` values are statically embedded into the frontend bundle at build
time by Vite. They do not come from `.env.prod` at runtime.

**`deploy` job** — runs on `ubuntu-latest` (GitHub-hosted), uses SSH via
`appleboy/ssh-action` to deploy:

```yaml
deploy:
  name: Deploy to Production
  needs: build-and-push
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_SSH_USER }}
        key: ${{ secrets.PROD_SSH_KEY }}
        envs: GITHUB_TOKEN,GITHUB_ACTOR
        script: |
          cd /opt/angrybirdman
          git pull origin main
          echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
          source docker/.env.prod
          docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod pull
          docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod run --rm \
            -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public" \
            api npx prisma migrate deploy
          docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
            up -d --force-recreate --remove-orphans
          sleep 30
          for service in postgres valkey keycloak api frontend nginx; do
            docker compose -f docker/docker-compose.prod.yml ps "$service" \
              | grep -q "running" && echo "✓ $service running" \
              || (echo "✗ $service failed" && exit 1)
          done
          curl -sf https://YOUR_DOMAIN/health && echo "✓ Health check passed"
          docker image prune -f
```

### 3.6 — `scripts/backup-prod-db.sh`

Modeled on `scripts/backup-test-server-db.sh` with:

- `COMPOSE_FILE=docker/docker-compose.prod.yml`
- `ENV_FILE=docker/.env.prod`
- `BACKUP_DIR=/opt/angrybirdman/backups`
- `KEEP_DAYS=30`
- Backs up both the `angrybirdman` and `keycloak` databases in sequence using
  `docker exec ... pg_dump`
- After each backup run, prunes files older than `KEEP_DAYS`:
  ```bash
  find "$BACKUP_DIR" -name "*.sql" -mtime +"$KEEP_DAYS" -delete
  find "$BACKUP_DIR" -name "*.sha256" -mtime +"$KEEP_DAYS" -delete
  ```
- SHA-256 checksum file written alongside each backup
- Designed for unattended cron execution; all output to stdout for log capture

### 3.7 — `scripts/deploy-prod.sh`

Modeled on `scripts/deploy-test.sh` with:

- `COMPOSE_FILE=docker/docker-compose.prod.yml`
- `ENV_FILE=docker/.env.prod`
- Health check URL: `https://YOUR_DOMAIN/health`

Used for manual deployments outside GitHub Actions.

### 3.8 — `scripts/rollback-prod.sh`

Modeled on `scripts/rollback-test.sh`:

```bash
./scripts/rollback-prod.sh sha-abc1234
```

Accepts a Docker image tag (e.g., `sha-XXXXXXX` visible in GHCR or GitHub
Actions logs), pins `IMAGE_TAG` in the compose environment, and redeploys using
that specific image.

---

## Phase 4 — GitHub Repository Configuration

_Manual, one-time._

### 4.1 — Generate the SSH Deploy Key

On your local machine:

```bash
ssh-keygen -t ed25519 \
  -f ~/.ssh/angrybirdman-prod-deploy \
  -C "angrybirdman-prod-deploy-github-actions"
# Two files created:
#   ~/.ssh/angrybirdman-prod-deploy      (private key — goes in GitHub Secrets)
#   ~/.ssh/angrybirdman-prod-deploy.pub  (public key — goes on the server)
```

### 4.2 — Install the Public Key on the Production Server

```bash
# SSH into the server as ec2-user, then:
sudo -u angrybirdman mkdir -p /home/angrybirdman/.ssh
sudo -u angrybirdman chmod 700 /home/angrybirdman/.ssh
# Paste the contents of ~/.ssh/angrybirdman-prod-deploy.pub:
echo "YOUR_PUBLIC_KEY_CONTENT" | sudo -u angrybirdman \
  tee /home/angrybirdman/.ssh/authorized_keys
sudo -u angrybirdman chmod 600 /home/angrybirdman/.ssh/authorized_keys
# Verify
sudo -u angrybirdman cat /home/angrybirdman/.ssh/authorized_keys
```

Test the connection from your local machine:

```bash
ssh -i ~/.ssh/angrybirdman-prod-deploy angrybirdman@YOUR_STATIC_IP \
  'echo "SSH connection successful"'
```

### 4.3 — Add GitHub Actions Secrets

GitHub repo → Settings → Secrets and variables → Actions → New repository
secret:

| Secret name     | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| `PROD_HOST`     | Production server static IP address                              |
| `PROD_SSH_USER` | `angrybirdman`                                                   |
| `PROD_SSH_KEY`  | Full contents of `~/.ssh/angrybirdman-prod-deploy` (private key) |

`GITHUB_TOKEN` is automatically provided by GitHub Actions — no manual secret is
needed for authenticating against GHCR.

---

## Phase 5 — Production Server Configuration

_Manual, one-time, done as the `angrybirdman` user (or as `ec2-user` where
noted)._

### 5.1 — Create `/opt/angrybirdman/docker/.env.prod`

```bash
sudo -u angrybirdman cp /opt/angrybirdman/docker/.env.prod.example \
  /opt/angrybirdman/docker/.env.prod
sudo chmod 600 /opt/angrybirdman/docker/.env.prod
```

Generate strong passwords:

```bash
echo "POSTGRES_PASSWORD: $(openssl rand -base64 32)"
echo "KEYCLOAK_ADMIN_PASSWORD: $(openssl rand -base64 32)"
```

Edit `.env.prod` and fill in:

- All `CHANGE_ME` values with the generated passwords above
- Both `YOUR_DOMAIN` placeholders with the actual domain name
- Leave `KEYCLOAK_ADMIN_CLIENT_SECRET` as a placeholder — it is retrieved after
  Keycloak's first startup (Phase 6.3)

### 5.2 — Configure Cron Jobs

As `ec2-user` (sudoing to set up the angrybirdman user's crontab):

```bash
sudo -u angrybirdman crontab -e
```

Add:

```cron
# Daily database backup at 2:00 AM (both app and keycloak databases)
0 2 * * * /opt/angrybirdman/scripts/backup-prod-db.sh >> /opt/angrybirdman/logs/backup.log 2>&1

# Trim backup log to last 1000 lines every Sunday at 3:00 AM
0 3 * * 0 tail -1000 /opt/angrybirdman/logs/backup.log > /tmp/backup.log.tmp \
  && mv /tmp/backup.log.tmp /opt/angrybirdman/logs/backup.log
```

### 5.3 — Grant angrybirdman Limited sudo for Certbot Reload Hook

The Certbot renewal hook (Phase 2.4) runs as root and already has the necessary
permissions. No additional `sudo` grants are needed unless future scripts
require it.

### 5.4 — Verify Docker Access for angrybirdman User

```bash
sudo -u angrybirdman docker ps
```

Should run without `sudo`. If it fails, the `docker` group membership from Phase
1.13 may require a re-login:

```bash
sudo -u angrybirdman newgrp docker
```

---

## Phase 6 — Initial Manual Deployment

_Done in order on the production server. Skip Phase 6.6 if migrating data from
the test server (Phase 7)._

### 6.1 — Start Infrastructure Services

```bash
cd /opt/angrybirdman
# Start postgres and valkey first and wait for them to be healthy
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d postgres valkey
sleep 15
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod ps
```

### 6.2 — Start Keycloak (First Run — Realm Import)

```bash
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d keycloak
```

The first startup is slow (1–2 minutes) because it imports the realm JSON.
Monitor progress:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  logs -f keycloak
# Wait for: "Running the server in production mode. ..." or "Listening on: ..."
```

### 6.3 — Retrieve the Keycloak API Client Secret

Start nginx temporarily so you can reach the Keycloak admin UI:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d nginx
```

Navigate to `https://YOUR_DOMAIN:8443/admin` → log in with the
`KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD` from `.env.prod`.

Go to: `angrybirdman` realm → **Clients** → `angrybirdman-api-service` →
**Credentials** tab → copy the **Client Secret**.

Update `.env.prod`:

```bash
nano /opt/angrybirdman/docker/.env.prod
# Set KEYCLOAK_ADMIN_CLIENT_SECRET=<copied_secret>
```

### 6.4 — Run Prisma Database Migrations

```bash
source /opt/angrybirdman/docker/.env.prod
docker compose -f /opt/angrybirdman/docker/docker-compose.prod.yml \
  --env-file /opt/angrybirdman/docker/.env.prod run --rm \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public" \
  api npx prisma migrate deploy
```

### 6.5 — Start All Application Services

```bash
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d api frontend
# nginx should already be running from 6.3; this completes the stack
sleep 30
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod ps
```

All six services (`postgres`, `valkey`, `keycloak`, `api`, `frontend`, `nginx`)
should show as running.

### 6.6 — Initialize the Application (Fresh Database Only)

_Skip this step if performing a data migration from the test server in Phase 7.
The migrated data already includes action codes, system settings, and the
superadmin account._

```bash
cd /opt/angrybirdman
source docker/.env.prod
# Run the database initialization script (creates action codes, system settings,
# and the superadmin user in both Keycloak and the application database)
bash scripts/finish-init.sh
```

The `finish-init.sh` script detects if the superadmin already exists and exits
cleanly if so (idempotent).

### 6.7 — Verify the Deployment

```bash
# All services running
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod ps

# Application health check
curl -sf https://YOUR_DOMAIN/health

# Application loads in browser
# https://YOUR_DOMAIN — React app loads
# https://YOUR_DOMAIN:8443 — Keycloak admin console loads over HTTPS

# Certbot dry-run (proves auto-renewal will work)
sudo certbot renew --dry-run
```

---

## Phase 7 — Data Migration from Test Server

_One-time migration of production-appropriate data from the test server. Perform
this after Phase 6 has verified the production environment works._

> **Caution**: This operation overwrites the production databases. Stop the
> application first (postgres stays running) and work quickly to minimize
> downtime.

### 7.1 — Create Backups on the Test Server

```bash
# SSH into the test server
ssh 192.168.0.70
cd /opt/angrybirdman

DATESTAMP=$(date +%Y%m%d)
COMPOSE_FILE="docker/docker-compose.test.yml"
ENV_FILE="docker/.env.test"
PGUSER=$(grep ^POSTGRES_USER $ENV_FILE | cut -d= -f2)

# Dump app database
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$PGUSER" angrybirdman > /tmp/angrybirdman_migration_${DATESTAMP}.sql

# Dump Keycloak database
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$PGUSER" keycloak > /tmp/keycloak_migration_${DATESTAMP}.sql

ls -lh /tmp/*_migration_*.sql
```

### 7.2 — Transfer Backup Files to Production

From your local machine (bridging between the two servers):

```bash
# Download from test server
scp 192.168.0.70:/tmp/angrybirdman_migration_*.sql ~/tmp/
scp 192.168.0.70:/tmp/keycloak_migration_*.sql ~/tmp/

# Upload to production server
scp -i ~/.ssh/lightsail-key.pem ~/tmp/angrybirdman_migration_*.sql \
  ec2-user@YOUR_STATIC_IP:/tmp/
scp -i ~/.ssh/lightsail-key.pem ~/tmp/keycloak_migration_*.sql \
  ec2-user@YOUR_STATIC_IP:/tmp/

# Move to angrybirdman-accessible location
ssh -i ~/.ssh/lightsail-key.pem ec2-user@YOUR_STATIC_IP \
  "sudo mv /tmp/*_migration_*.sql /opt/angrybirdman/ && \
   sudo chown angrybirdman:angrybirdman /opt/angrybirdman/*_migration_*.sql"
```

### 7.3 — Stop Application Services (Keep Postgres Running)

```bash
# SSH into production as ec2-user or angrybirdman
cd /opt/angrybirdman
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  stop api frontend keycloak nginx
```

### 7.4 — Restore the Application Database

```bash
source /opt/angrybirdman/docker/.env.prod
PGUSER=$POSTGRES_USER

# Drop and recreate the database
docker exec angrybirdman-prod-postgres psql -U "$PGUSER" \
  -c "DROP DATABASE IF EXISTS angrybirdman"
docker exec angrybirdman-prod-postgres psql -U "$PGUSER" \
  -c "CREATE DATABASE angrybirdman OWNER $PGUSER"

# Restore
docker exec -i angrybirdman-prod-postgres psql -U "$PGUSER" -d angrybirdman \
  < /opt/angrybirdman/angrybirdman_migration_*.sql

echo "App database restored."
```

### 7.5 — Restore the Keycloak Database

```bash
# Drop and recreate
docker exec angrybirdman-prod-postgres psql -U "$PGUSER" \
  -c "DROP DATABASE IF EXISTS keycloak"
docker exec angrybirdman-prod-postgres psql -U "$PGUSER" \
  -c "CREATE DATABASE keycloak OWNER $PGUSER"

# Restore
docker exec -i angrybirdman-prod-postgres psql -U "$PGUSER" -d keycloak \
  < /opt/angrybirdman/keycloak_migration_*.sql

echo "Keycloak database restored."
```

### 7.6 — Run Prisma Migrations Against Restored Data

The restored database should already be at the correct schema version, but run
migrations to be safe (Prisma deploy is idempotent):

```bash
docker compose -f /opt/angrybirdman/docker/docker-compose.prod.yml \
  --env-file /opt/angrybirdman/docker/.env.prod run --rm \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public" \
  api npx prisma migrate deploy
```

### 7.7 — Restart Services

```bash
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d keycloak
sleep 90  # wait for Keycloak to start with migrated data

docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d api frontend nginx
sleep 30
```

### 7.8 — Update Keycloak Realm URLs

The migrated Keycloak database still contains the test server URLs
(`http://192.168.0.70:8000`). Update them via the Keycloak Admin UI at
`https://YOUR_DOMAIN:8443/admin`:

1. **Realm Settings** → General tab → **Frontend URL** →
   `https://YOUR_DOMAIN:8443`
2. **Clients** → `angrybirdman-frontend` → Settings:
   - **Valid Redirect URIs**: add `https://YOUR_DOMAIN/*`, remove
     `http://192.168.0.70/*`
   - **Web Origins**: add `https://YOUR_DOMAIN`, remove `http://192.168.0.70`
3. Retrieve the updated API client secret: **Clients** →
   `angrybirdman-api-service` → **Credentials** → copy the Client Secret. Update
   `.env.prod` (`KEYCLOAK_ADMIN_CLIENT_SECRET=<new_secret>`) and restart the
   API:
   ```bash
   docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
     restart api
   ```

### 7.9 — Verify Migration and Clean Up

```bash
# Health check
curl -sf https://YOUR_DOMAIN/health

# In browser:
# - https://YOUR_DOMAIN — battle data visible and matches test server
# - Log in with a migrated user account — Keycloak redirects back correctly
# - Keycloak admin shows migrated accounts

# Clean up migration files
rm /opt/angrybirdman/*_migration_*.sql
```

---

## Phase 8 — Ongoing Deployment Lifecycle

### Normal Deployment

1. Develop and merge changes to `main`
2. Tag the release:
   ```bash
   git tag prod-YYYY-MM-DD.N
   git push origin prod-YYYY-MM-DD.N
   ```
3. GitHub Actions `deploy-prod.yml` automatically:
   - Runs lint, type-check, and builds all packages
   - Builds and pushes Docker images to GHCR tagged with the tag, `sha-XXXXX`,
     and `latest`
   - SSHes into production as `angrybirdman`
   - Pulls new images, runs Prisma migrations, force-recreates containers
   - Verifies all 6 services are healthy
   - Hits `https://YOUR_DOMAIN/health`
   - Prunes old Docker images to conserve disk space

### Rollback

```bash
# Find the SHA from GHCR or GitHub Actions logs, then:
./scripts/rollback-prod.sh sha-abc1234
```

### Manual Deployment

```bash
# If you need to deploy without a tag push:
cd /opt/angrybirdman
source docker/.env.prod
bash scripts/deploy-prod.sh
```

### Database Backups

Backups run automatically at 2:00 AM daily via cron. Both the `angrybirdman` and
`keycloak` databases are backed up. Files older than 30 days are automatically
deleted.

Manual backup:

```bash
bash /opt/angrybirdman/scripts/backup-prod-db.sh
ls -lh /opt/angrybirdman/backups/
```

### Checking Deployment Health

```bash
# Service status
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod ps

# View logs
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  logs --tail=100 api
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  logs --tail=100 nginx

# Disk usage
df -h /
du -sh /opt/angrybirdman/backups/
docker system df
```

### Certificate Renewal Status

```bash
sudo certbot certificates
sudo systemctl status certbot-renewal.timer
sudo journalctl -u certbot-renewal.service -n 50
```

### Applying Manual Software Updates

The OS security patches are automated. For Docker image updates and other server
software:

```bash
# Update Docker and system packages
sudo dnf update -y

# Update Docker base images used by compose
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod pull
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod \
  up -d --force-recreate
```

---

## Final Verification Checklist

After completing all phases:

- [ ] `https://YOUR_DOMAIN` loads the React application
- [ ] `https://YOUR_DOMAIN/api/health` returns `{"status":"ok",...}`
- [ ] `https://YOUR_DOMAIN:8443` — Keycloak admin console loads over HTTPS
- [ ] Browser shows a valid Let's Encrypt certificate (not self-signed) for all
      HTTPS URLs
- [ ] Login flow completes end-to-end (Keycloak redirects correctly back to
      `https://YOUR_DOMAIN`)
- [ ] `sudo certbot renew --dry-run` exits 0
- [ ] Push a `prod-*` tag; GitHub Actions pipeline completes all 3 jobs (test,
      build-and-push, deploy)
- [ ] Next day: `ls /opt/angrybirdman/backups/` shows `.sql` and `.sha256` files
      from the 2:00 AM cron
- [ ] `sudo dnf check-update --security` shows no outstanding patches
      (confirming `dnf-automatic` is working)
- [ ] `sudo fail2ban-client status sshd` confirms fail2ban is active
- [ ] `sudo firewall-cmd --list-all` shows only expected ports open
- [ ] `free -h` shows swap is active
- [ ] Migration verified: battle data from test server is present in production
      (if Phase 7 was executed)
