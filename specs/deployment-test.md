# Angry Birdman - Test Environment Deployment Plan

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture & Requirements](#2-architecture--requirements)
3. [Project Source Changes](#3-project-source-changes)
4. [Test Server Setup](#4-test-server-setup)
5. [GitHub Actions Pipeline](#5-github-actions-pipeline)
6. [Pipeline Operations & Management](#6-pipeline-operations--management)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [Security Considerations](#8-security-considerations)
9. [Future Enhancements](#9-future-enhancements)

---

## 1. Overview

### Purpose

This document specifies the deployment pipeline for the Angry Birdman **test
environment**, which provides an automated continuous deployment (CD) system
that deploys code changes from the `main` branch to a dedicated Ubuntu mini-PC
test server on your home network.

### Goals

- **Automated Deployment**: Push to `main` triggers automatic build and
  deployment
- **HTTP Access**: Test environment accessible at `http://192.168.0.70` from
  home network
- **GitHub Actions**: Leverage GitHub's CI/CD platform for automation
- **Docker-based**: Deploy using Docker containers for consistency
- **Zero-downtime**: Use rolling updates to minimize service interruption
- **Rollback capability**: Support reverting to previous versions if issues
  arise

### Test vs Development Environments

| Aspect         | Development (Local)     | Test (Ubuntu Server)          |
| -------------- | ----------------------- | ----------------------------- |
| **Location**   | Developer workstation   | 192.168.0.70 (Ubuntu mini-PC) |
| **Access**     | localhost               | http://192.168.0.70           |
| **Deployment** | Manual (docker-compose) | Automated (GitHub Actions)    |
| **Purpose**    | Active development      | Pre-production validation     |
| **Data**       | Synthetic/seed data     | Realistic test data           |
| **Updates**    | Continuous (hot reload) | On `main` branch push         |
| **TLS/SSL**    | No (HTTP only)          | No (HTTP only)                |

### Technology Stack

- **CI/CD**: GitHub Actions workflows with self-hosted runner
- **Deployment**: Docker + Docker Compose
- **Transport**: Self-hosted runner (no external access required)
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Orchestration**: Docker Compose on test server
- **Reverse Proxy**: Nginx (bundled in deployment)

---

## 2. Architecture & Requirements

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes code to `main` branch                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow Triggered                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Self-Hosted Runner on Test Server (192.168.0.70)           │
│  - Runner polls GitHub for jobs (outbound only)             │
│  - No inbound connections required                           │
│  1. Checkout code                                            │
│  2. Set up Node.js + dependencies                            │
│  3. Run tests (unit + integration)                           │
│  4. Build Docker images (frontend, api)                      │
│  5. Push images to ghcr.io                                   │
│  6. Pull updated images locally                              │
│  7. Run database migrations                                  │
│  8. Deploy with docker-compose (rolling update)              │
│  9. Health checks                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Test Server (192.168.0.70)                                  │
│  - Running updated containers                                │
│  - Accessible at http://192.168.0.70 (home network only)     │
└─────────────────────────────────────────────────────────────┘
```

### Test Server Requirements

**Hardware (Ubuntu Mini-PC)**:

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum free space
- **Network**: Ethernet connection to home network, static IP 192.168.0.70

**Software**:

- **OS**: Ubuntu 22.04 LTS or later
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Git**: For repository checkout
- **GitHub Actions Runner**: Self-hosted runner service
- **Node.js**: 24 LTS (for building and testing)

**Network Configuration**:

- Static IP address: `192.168.0.70`
- Ports open on server firewall:
  - `80` (HTTP - for web access from home network)
- **No inbound ports required for deployment**
- Runner makes outbound HTTPS connections to:
  - `github.com` (443) - for job polling and updates
  - `ghcr.io` (443) - for container registry access
- Internal ports (not exposed):
  - `3000` (Frontend)
  - `3001` (API)
  - `5432` (PostgreSQL)
  - `6379` (Valkey)
  - `8080` (Keycloak)

### GitHub Requirements

- **Repository Access**: GitHub Actions enabled
- **Self-Hosted Runner**: Runner registered with repository
- **Runner Labels**: `self-hosted`, `test-environment`
- **Secrets Configuration**: Required secrets stored in repository settings
- **Container Registry**: GitHub Container Registry (ghcr.io) enabled
- **Branch Protection**: Optional rules on `main` branch
- **Personal Access Token**: For runner registration (classic token with `repo`
  scope)

### Network Architecture on Test Server

```
┌────────────────────────────────────────────────────────────┐
│  Home Network (192.168.0.x)                                 │
│                                                             │
│  Client Browser                                             │
│         ↓ HTTP :80                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ubuntu Test Server (192.168.0.70)                   │  │
│  │                                                       │  │
│  │  Nginx Reverse Proxy :80                             │  │
│  │       ├─ / → Frontend :3000                          │  │
│  │       └─ /api → Backend API :3001                    │  │
│  │                                                       │  │
│  │  Docker Network (angrybirdman-test)                  │  │
│  │    ├─ Frontend Container :3000                       │  │
│  │    ├─ API Container :3001                            │  │
│  │    ├─ PostgreSQL Container :5432                     │  │
│  │    ├─ Valkey Container :6379                         │  │
│  │    └─ Keycloak Container :8080                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Project Source Changes

### 3.1 Docker Production Images

**Create: `/docker/Dockerfile.frontend`**

Production Dockerfile for React frontend using multi-stage build:

```dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY common/package*.json ./common/

# Install dependencies
RUN npm ci --workspace=frontend --workspace=common

# Copy source code
COPY frontend/ ./frontend/
COPY common/ ./common/
COPY tsconfig.json ./

# Build common library first
RUN npm run build --workspace=common

# Build frontend
RUN npm run build --workspace=frontend

# Stage 2: Production
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Create: `/docker/Dockerfile.api`**

Production Dockerfile for Fastify API:

```dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY api/package*.json ./api/
COPY common/package*.json ./common/
COPY database/package*.json ./database/

# Install dependencies
RUN npm ci --workspace=api --workspace=common --workspace=database

# Copy source code
COPY api/ ./api/
COPY common/ ./common/
COPY database/ ./database/
COPY tsconfig.json ./
COPY prisma.config.ts ./

# Build common library first
RUN npm run build --workspace=common

# Generate Prisma client
RUN npm run generate --workspace=database

# Build API
RUN npm run build --workspace=api

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY api/package*.json ./api/
COPY common/package*.json ./common/
COPY database/package*.json ./database/

RUN npm ci --workspace=api --workspace=common --workspace=database --omit=dev

# Copy built artifacts
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/database/generated ./database/generated
COPY --from=builder /app/database/prisma ./database/prisma

# Copy Prisma config
COPY prisma.config.ts ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "api/dist/index.js"]
```

**Create: `/docker/nginx.conf`**

Nginx configuration for frontend serving:

```nginx
server {
    listen 3000;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Handle React Router - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

**Create: `/docker/docker-compose.test.yml`**

Docker Compose configuration for test environment:

**Important Notes**:

- PostgreSQL automatically creates both databases (`angrybirdman_test` and
  `keycloak_test`) using the init script mounted from `database/postgres/init/`
- Keycloak automatically imports the `angrybirdman` realm configuration on first
  start using the `--import-realm` flag and the config mounted from
  `keycloak/config/`
- These volume mounts ensure the test environment initializes consistently, just
  like the development environment

```yaml
services:
  # PostgreSQL - Primary database
  postgres:
    image: postgres:15-alpine
    container_name: angrybirdman-test-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_MULTIPLE_DATABASES: ${POSTGRES_DB},${KEYCLOAK_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../../database/postgres/init:/docker-entrypoint-initdb.d:ro
    networks:
      - angrybirdman-test
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  # Valkey - Session cache
  valkey:
    image: valkey/valkey:7.2-alpine
    container_name: angrybirdman-test-valkey
    restart: always
    command: >
      valkey-server --appendonly yes --appendfsync everysec --maxmemory
      ${VALKEY_MAXMEMORY:-256mb} --maxmemory-policy allkeys-lru
    volumes:
      - valkey_data:/data
    networks:
      - angrybirdman-test
    healthcheck:
      test: ['CMD', 'valkey-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Keycloak - Identity Provider
  keycloak:
    image: quay.io/keycloak/keycloak:25.0
    container_name: angrybirdman-test-keycloak
    restart: always
    command: start --import-realm
    environment:
      KC_DB: postgres
      KC_DB_URL_HOST: postgres
      KC_DB_URL_DATABASE: ${KEYCLOAK_DB}
      KC_DB_USERNAME: ${POSTGRES_USER}
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
      KC_DB_SCHEMA: public
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN_USER}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      KC_HOSTNAME: ${KEYCLOAK_HOSTNAME}
      KC_HTTP_ENABLED: true
      KC_PROXY: edge
      KC_HEALTH_ENABLED: true
      KC_METRICS_ENABLED: true
    volumes:
      - keycloak_data:/opt/keycloak/data
      - ../../keycloak/config:/opt/keycloak/data/import:ro
    networks:
      - angrybirdman-test
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD-SHELL', 'exec 3<>/dev/tcp/localhost/8080']
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 90s

  # API Backend
  api:
    image: ghcr.io/webzeppelin/angry-birdman-api:latest
    container_name: angrybirdman-test-api
    restart: always
    environment:
      NODE_ENV: test
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      KEYCLOAK_REALM_URL: http://keycloak:8080/realms/${KEYCLOAK_REALM}
      KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID}
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET}
      VALKEY_HOST: valkey
      VALKEY_PORT: 6379
      CORS_ORIGIN: http://192.168.0.70
    depends_on:
      postgres:
        condition: service_healthy
      valkey:
        condition: service_healthy
      keycloak:
        condition: service_healthy
    networks:
      - angrybirdman-test
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost:3001/health',
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend
  frontend:
    image: ghcr.io/webzeppelin/angry-birdman-frontend:latest
    container_name: angrybirdman-test-frontend
    restart: always
    depends_on:
      api:
        condition: service_healthy
    networks:
      - angrybirdman-test
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost:3000/',
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: angrybirdman-test-nginx
    restart: always
    ports:
      - '80:80'
    volumes:
      - ./docker/nginx-reverse-proxy.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
      - api
    networks:
      - angrybirdman-test
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost/health',
        ]
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  angrybirdman-test:
    name: angrybirdman-test
    driver: bridge

volumes:
  postgres_data:
    name: angrybirdman-test-postgres-data
  valkey_data:
    name: angrybirdman-test-valkey-data
  keycloak_data:
    name: angrybirdman-test-keycloak-data
```

**Create: `/docker/nginx-reverse-proxy.conf`**

Nginx reverse proxy configuration:

```nginx
upstream frontend {
    server frontend:3000;
}

upstream api {
    server api:3001;
}

server {
    listen 80;
    server_name localhost 192.168.0.70;

    client_max_body_size 10M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API backend
    location /api/ {
        proxy_pass http://api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint for nginx itself
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend application
    location / {
        proxy_pass http://frontend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.2 Environment Configuration

**Create: `/docker/.env.test.example`**

Template for test environment variables:

```bash
# Test Environment Configuration for Angry Birdman
# Copy to /docker/.env.test on test server and configure

# ============================================================================
# PostgreSQL Configuration
# ============================================================================
POSTGRES_USER=angrybirdman_test
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=angrybirdman_test
KEYCLOAK_DB=keycloak_test

# ============================================================================
# Valkey Configuration
# ============================================================================
VALKEY_MAXMEMORY=512mb

# ============================================================================
# Keycloak Configuration
# ============================================================================
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
KEYCLOAK_HOSTNAME=192.168.0.70
KEYCLOAK_REALM=angrybirdman
KEYCLOAK_CLIENT_ID=angrybirdman-api
KEYCLOAK_CLIENT_SECRET=CHANGE_ME_CLIENT_SECRET

# ============================================================================
# Application Configuration
# ============================================================================
NODE_ENV=test
```

### 3.3 Deployment Scripts

**Create: `/scripts/deploy-test.sh`**

Script to be run on test server for deployment:

```bash
#!/bin/bash
set -e

# Angry Birdman Test Environment Deployment Script
# This script is executed by GitHub Actions on the test server

echo "=== Angry Birdman Test Deployment ==="
echo "Timestamp: $(date)"

DEPLOY_DIR="/opt/angrybirdman"
COMPOSE_FILE="docker/docker-compose.test.yml"
ENV_FILE="docker/.env.test"

cd "$DEPLOY_DIR"

# Pull latest images
echo "Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

# Run database migrations
echo "Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
  -e DATABASE_URL="postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?schema=public" \
  api npx prisma migrate deploy

# Deploy with rolling update (no downtime)
echo "Deploying updated containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

# Wait for health checks
echo "Waiting for services to become healthy..."
sleep 10

# Verify deployment
echo "Verifying deployment..."
for service in postgres valkey keycloak api frontend nginx; do
  if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
    echo "✓ $service is running"
  else
    echo "✗ $service failed to start"
    exit 1
  fi
done

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f

echo "=== Deployment completed successfully ==="
echo "Application available at: http://192.168.0.70"
```

**Create: `/scripts/rollback-test.sh`**

Script for rolling back to previous version:

```bash
#!/bin/bash
set -e

# Angry Birdman Test Environment Rollback Script

echo "=== Angry Birdman Test Rollback ==="
echo "Timestamp: $(date)"

DEPLOY_DIR="/opt/angrybirdman"
COMPOSE_FILE="docker/docker-compose.test.yml"
ENV_FILE="docker/.env.test"

if [ -z "$1" ]; then
  echo "Error: Image tag required"
  echo "Usage: $0 <image-tag>"
  echo "Example: $0 sha-abc1234"
  exit 1
fi

TAG=$1

cd "$DEPLOY_DIR"

echo "Rolling back to tag: $TAG"

# Update image tags in compose file temporarily
export IMAGE_TAG=$TAG
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  config > docker-compose.rollback.yml

# Deploy with specified tag
docker compose -f docker-compose.rollback.yml --env-file "$ENV_FILE" \
  up -d --remove-orphans

# Clean up temp file
rm docker-compose.rollback.yml

echo "=== Rollback completed ==="
echo "Application running with tag: $TAG"
```

### 3.4 GitHub Actions Workflow

**Create: `/.github/workflows/deploy-test.yml`**

GitHub Actions workflow for automated deployment using self-hosted runner:

```yaml
name: Deploy to Test Environment

on:
  push:
    branches:
      - main
  workflow_dispatch: # Allow manual triggering

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_API: ${{ github.repository }}-api
  IMAGE_NAME_FRONTEND: ${{ github.repository }}-frontend

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Build all packages
        run: npm run build

  build-and-push:
    name: Build and Push Docker Images
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for API
        id: meta-api
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Extract metadata for Frontend
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile.api
          push: true
          tags: ${{ steps.meta-api.outputs.tags }}
          labels: ${{ steps.meta-api.outputs.labels }}
          cache-from:
            type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API
            }}:buildcache
          cache-to:
            type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API
            }}:buildcache,mode=max

      - name: Build and push Frontend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile.frontend
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          cache-from:
            type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND
            }}:buildcache
          cache-to:
            type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND
            }}:buildcache,mode=max

  deploy:
    name: Deploy to Test Server
    needs: build-and-push
    runs-on: [self-hosted, test-environment]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Pull latest images
        run: |
          docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API }}:latest
          docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}:latest

      - name: Run database migrations
        working-directory: /opt/angrybirdman
        run: |
          docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test run --rm \
            -e DATABASE_URL="postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?schema=public" \
            api npx prisma migrate deploy

      - name: Deploy with Docker Compose
        working-directory: /opt/angrybirdman
        run: |
          docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test up -d --remove-orphans

      - name: Wait for services to be healthy
        run: sleep 30

      - name: Verify deployment
        working-directory: /opt/angrybirdman
        run: |
          for service in postgres valkey keycloak api frontend nginx; do
            if docker compose -f docker/docker-compose.test.yml ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
              echo "✓ $service is running"
            else
              echo "✗ $service failed to start"
              exit 1
            fi
          done

      - name: Health check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" http://192.168.0.70/health || echo "000")
          if [ "$response" -eq 200 ]; then
            echo "✓ Health check passed"
          else
            echo "✗ Health check failed with status: $response"
            exit 1
          fi

      - name: Clean up old images
        run: docker image prune -f

      - name: Deployment notification
        if: always()
        run: |
          if [ "${{ job.status }}" == "success" ]; then
            echo "✓ Deployment to test environment successful"
            echo "Application URL: http://192.168.0.70"
          else
            echo "✗ Deployment to test environment failed"
          fi
```

### 3.5 Frontend Environment Configuration

**Update: `/frontend/.env.test`**

Create test environment configuration for frontend:

```bash
# Frontend Test Environment Configuration
VITE_API_URL=http://192.168.0.70/api
VITE_KEYCLOAK_URL=http://192.168.0.70:8080
VITE_KEYCLOAK_REALM=angrybirdman
VITE_KEYCLOAK_CLIENT_ID=angrybirdman-frontend
```

**Update: `/frontend/vite.config.ts`**

Ensure environment-specific builds work correctly:

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
```

### 3.6 API Health Check Endpoint

**Update: `/api/src/index.ts`**

Ensure health check endpoint exists:

```typescript
// Health check endpoint
app.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };
});
```

---

## 4. Test Server Setup

### 4.1 Initial Server Configuration

#### Install Required Software

SSH into test server (`ssh user@192.168.0.70`) and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version

# Create deployment user (if needed)
sudo useradd -m -s /bin/bash angrybirdman
sudo usermod -aG docker angrybirdman
```

#### Configure Static IP

Edit netplan configuration:

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

Add or modify:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0: # or your interface name
      dhcp4: no
      addresses:
        - 192.168.0.70/24
      gateway4: 192.168.0.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

Apply changes:

```bash
sudo netplan apply
```

#### Configure Firewall

```bash
# Install UFW if not present
sudo apt install ufw -y

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw enable

# Verify
sudo ufw status
```

### 4.2 Deploy Directory Setup

```bash
# Create deployment directory (as your current user with sudo)
sudo mkdir -p /opt/angrybirdman
sudo chown angrybirdman:angrybirdman /opt/angrybirdman

# Switch to angrybirdman user for all subsequent commands
sudo su - angrybirdman

# Now as angrybirdman user, navigate to deployment directory
cd /opt/angrybirdman

# Clone repository
git clone https://github.com/webzeppelin/angry-birdman.git .

# Create necessary directories
mkdir -p docker
mkdir -p logs

# Set permissions
chmod +x scripts/*.sh
```

**Note**: All remaining commands in sections 4.3-4.6 should be run as the
`angrybirdman` user. Stay in the `angrybirdman` user session (don't exit) until
you complete the initial setup.

### 4.3 Environment Configuration

```bash
# These commands run as angrybirdman user (from previous section)
# Copy environment template
cd /opt/angrybirdman/docker
cp .env.test.example .env.test

# Edit with actual values
nano .env.test
```

**IMPORTANT**: Set strong passwords for:

- `POSTGRES_PASSWORD`
- `KEYCLOAK_ADMIN_PASSWORD`
- `KEYCLOAK_CLIENT_SECRET`

Generate secure passwords:

```bash
# Generate random passwords
openssl rand -base64 32
```

### 4.4 GitHub Actions Self-Hosted Runner Setup

#### Create GitHub Personal Access Token

**Note**: This token is used for downloading the runner software and for future
runner management. It is **not** the registration token (see next section).

1. Go to GitHub → Settings → Developer settings → Personal access tokens →
   Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "Angry Birdman Test Runner"
4. Set expiration (recommended: 90 days, then rotate)
5. Select scopes:
   - `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again)
8. Store it securely (you may need it later for runner maintenance)

#### Get Runner Registration Token

Before you can configure the runner, you need to get a registration token from
GitHub. This is different from the Personal Access Token above.

#### Install and Configure Runner

On the test server:

```bash
# If not already as angrybirdman user from previous section, switch now
sudo su - angrybirdman
cd ~

# Create runner directory
mkdir -p actions-runner && cd actions-runner

# Download latest runner (check GitHub for current version)
# For x64 Linux:
curl -o actions-runner-linux-x64-2.330.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.330.0/actions-runner-linux-x64-2.330.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.330.0.tar.gz

# STOP HERE: Get your registration token from GitHub (see section above)
# The token expires in 1 hour, so get it right before running the next command

# Configure runner (replace YOUR_REGISTRATION_TOKEN with the actual token from GitHub)
./config.sh --url https://github.com/webzeppelin/angry-birdman \
  --token YOUR_REGISTRATION_TOKEN \
  --name test-server-runner \
  --labels test-environment \
  --work _work \
  --unattended

# Exit back to your regular user account (the one with sudo privileges)
exit

# Now as your regular user (NOT angrybirdman), install the service
# The service will run AS angrybirdman, but installation requires sudo
# Start an elevated shell and navigate to the runner directory
sudo bash
cd /home/angrybirdman/actions-runner

# Install runner service (runs as angrybirdman user)
./svc.sh install angrybirdman

# Start runner service
./svc.sh start

# Check status
./svc.sh status

# Exit the elevated shell
exit
```

**Important**: The runner configuration must be done AS the `angrybirdman` user,
but the service installation/management commands must be run from an elevated
shell using `sudo bash` (since the svc.sh script requires being in the runner
directory, which requires elevated privileges to access). The service will run
as `angrybirdman` even though it's installed from an elevated shell.

**Get Registration Token**:

**IMPORTANT**: The registration token is NOT your Personal Access Token. It's a
separate, short-lived token generated by GitHub for runner registration.

1. Go to your repository on GitHub:
   `https://github.com/webzeppelin/angry-birdman`
2. Navigate to: Settings → Actions → Runners
3. Click the green "New self-hosted runner" button
4. Select "Linux" as the operating system
5. Select "x64" as the architecture
6. In the "Configure" section, you'll see a command like:
   ```bash
   ./config.sh --url https://github.com/webzeppelin/angry-birdman --token ABCDEFG1234567890HIJKLMNOP
   ```
7. Copy **only the token value** (the long string after `--token`)
8. This token is only valid for 1 hour, so use it immediately
9. If it expires, just repeat steps 1-7 to get a new one

**Verify Runner**:

1. Go to: Repository → Settings → Actions → Runners
2. You should see "test-server-runner" with status "Idle"
3. Labels should include: `self-hosted`, `Linux`, `X64`, `test-environment`

### 4.5 Initial Deployment

Manual first-time setup:

```bash
# SSH to test server as angrybirdman user directly
ssh angrybirdman@192.168.0.70

# Or if you're already on the server as another user:
# sudo su - angrybirdman

cd /opt/angrybirdman

# Pull base images
docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test pull postgres valkey keycloak

# Start infrastructure services (PostgreSQL will create both databases, Keycloak will import realm automatically)
docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test up -d postgres valkey keycloak

# Wait for services to be ready (this may take 60-90 seconds for Keycloak to fully start)
docker compose -f docker/docker-compose.test.yml ps

# Verify PostgreSQL databases were created
docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test exec postgres \
  psql -U angrybirdman_test -d angrybirdman_test -c "SELECT 1;"

docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test exec postgres \
  psql -U angrybirdman_test -d keycloak_test -c "SELECT 1;"

# Verify Keycloak realm was imported (check logs)
docker logs angrybirdman-test-keycloak | grep -i "import"

# Run initial database migrations
docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test run --rm \
  -e DATABASE_URL="postgresql://angrybirdman_test:PASSWORD@postgres:5432/angrybirdman_test" \
  api npx prisma migrate deploy

# Seed initial data (optional)
docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test run --rm \
  -e DATABASE_URL="postgresql://angrybirdman_test:PASSWORD@postgres:5432/angrybirdman_test" \
  api npx prisma db seed
```

**Note**: All deployment commands should be run as the `angrybirdman` user who
owns the `/opt/angrybirdman` directory and the Docker containers.

After initial setup, all subsequent deployments will be automated via GitHub
Actions.

### 4.6 System Service (Optional)

Create systemd service for auto-start on reboot:

**Create: `/etc/systemd/system/angrybirdman.service`**

```ini
[Unit]
Description=Angry Birdman Test Environment
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/angrybirdman
ExecStart=/usr/bin/docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test up -d
ExecStop=/usr/bin/docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test down
User=angrybirdman
Group=angrybirdman

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable angrybirdman
sudo systemctl start angrybirdman
sudo systemctl status angrybirdman
```

---

## 5. GitHub Actions Pipeline

### 5.1 Workflow Overview

The deployment workflow consists of three jobs:

1. **Test Job**: Runs linting, type checking, and unit tests
2. **Build Job**: Builds Docker images and pushes to ghcr.io
3. **Deploy Job**: SSH to test server and deploy containers

Workflow triggers:

- Push to `main` branch (automatic)
- Manual workflow dispatch (on-demand)

### 5.2 Container Registry Setup

#### Enable GitHub Container Registry

1. Go to repository Settings → Packages
2. Ensure "Inherit access from repository" is enabled
3. Package visibility should match repository visibility

#### Configure Package Permissions

After first workflow run:

1. Go to repository → Packages
2. Click on each package (api, frontend)
3. Settings → Manage Actions access
4. Ensure workflow has write access

### 5.3 GitHub Secrets Configuration

Navigate to: Repository → Settings → Secrets and variables → Actions

**Note**: With self-hosted runner, you need fewer secrets since the runner has
direct access to the server.

Optional secrets (for future enhancements):

| Secret Name           | Description                  | Use Case                 |
| --------------------- | ---------------------------- | ------------------------ |
| `SLACK_WEBHOOK_URL`   | Slack notification webhook   | Deployment notifications |
| `DISCORD_WEBHOOK_URL` | Discord notification webhook | Deployment notifications |

**Self-hosted runner manages deployment credentials locally:**

- Runner service account has access to `/opt/angrybirdman`
- Environment variables stored in `docker/.env.test` on server
- Docker registry authentication handled via workflow
- No SSH keys or server credentials needed in GitHub

### 5.4 Workflow Permissions

Ensure workflow has necessary permissions:

1. Go to: Repository → Settings → Actions → General
2. Under "Workflow permissions":
   - Select: "Read and write permissions"
   - Enable: "Allow GitHub Actions to create and approve pull requests"
3. Save

### 5.5 Testing the Pipeline

#### Manual Trigger Test

1. Go to: Repository → Actions
2. Select: "Deploy to Test Environment" workflow
3. Click: "Run workflow"
4. Select branch: `main`
5. Click: "Run workflow"
6. Monitor workflow execution

#### Automatic Trigger Test

```bash
# Make a small change
git checkout main
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger deployment pipeline"
git push origin main

# Watch GitHub Actions
# Open: https://github.com/webzeppelin/angry-birdman/actions
```

### 5.6 Workflow Monitoring

View workflow execution:

- **Live logs**: Actions tab → Select workflow run → Click on job
- **Deployment status**: Check status badge in README
- **Test server**: `ssh angrybirdman@192.168.0.70` and run `docker ps`

---

## 6. Pipeline Operations & Management

### 6.1 Deployment Verification

After each deployment, verify:

#### Check Deployment Status

```bash
# SSH to test server
ssh angrybirdman@192.168.0.70

# View running containers
docker ps

# Check container health
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml ps

# View logs
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml logs --tail=50
```

#### Access Application

From a browser on your home network:

- **Application**: http://192.168.0.70
- **API Health**: http://192.168.0.70/api/health
- **Keycloak Admin**: http://192.168.0.70:8080 (if port exposed)

### 6.2 Viewing Logs

```bash
# All services
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml logs -f

# Specific service
docker logs angrybirdman-test-api -f --tail=100

# Error logs only
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml logs | grep -i error
```

### 6.3 Rolling Back Deployment

If a deployment introduces issues:

#### Method 1: Using Rollback Script

```bash
ssh angrybirdman@192.168.0.70
cd /opt/angrybirdman

# Find previous image tag
docker images | grep angry-birdman

# Rollback to specific commit
./scripts/rollback-test.sh sha-abc1234
```

#### Method 2: Manual Rollback

```bash
# SSH to server
ssh angrybirdman@192.168.0.70
cd /opt/angrybirdman

# Pull specific image version
docker pull ghcr.io/webzeppelin/angry-birdman-api:sha-abc1234
docker pull ghcr.io/webzeppelin/angry-birdman-frontend:sha-abc1234

# Update docker-compose to use specific tags
# Edit docker/docker-compose.test.yml temporarily

# Restart services
docker compose -f docker/docker-compose.test.yml --env-file docker/.env.test up -d
```

### 6.4 Database Management

#### Backup Database

```bash
ssh angrybirdman@192.168.0.70
cd /opt/angrybirdman

# Create backup
docker compose -f docker/docker-compose.test.yml exec postgres \
  pg_dump -U angrybirdman_test angrybirdman_test > backup_$(date +%Y%m%d_%H%M%S).sql

# Download backup to local machine
scp angrybirdman@192.168.0.70:/opt/angrybirdman/backup_*.sql ./backups/
```

#### Restore Database

```bash
# Upload backup to server
scp ./backups/backup_YYYYMMDD_HHMMSS.sql angrybirdman@192.168.0.70:/opt/angrybirdman/

# SSH to server and restore
ssh angrybirdman@192.168.0.70
cd /opt/angrybirdman

docker compose -f docker/docker-compose.test.yml exec -T postgres \
  psql -U angrybirdman_test angrybirdman_test < backup_YYYYMMDD_HHMMSS.sql
```

#### Run Migrations Manually

```bash
ssh angrybirdman@192.168.0.70
cd /opt/angrybirdman

docker compose -f docker/docker-compose.test.yml run --rm api \
  npx prisma migrate deploy
```

### 6.5 Stopping/Starting Services

```bash
# Stop all services
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml down

# Start all services
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml up -d

# Restart specific service
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml restart api

# Stop specific service
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml stop frontend
```

### 6.6 Cleaning Up Resources

```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes (CAUTION: This deletes data)
docker volume prune -f

# Remove everything (CAUTION: Complete reset)
docker system prune -a --volumes -f
```

### 6.7 Monitoring Resources

```bash
# View resource usage
docker stats

# View disk usage
docker system df

# View specific container resources
docker stats angrybirdman-test-api
```

### 6.8 Update Environment Variables

```bash
# SSH to server
ssh angrybirdman@192.168.0.70

# Edit environment file
nano /opt/angrybirdman/docker/.env.test

# Restart affected services
docker compose -f /opt/angrybirdman/docker/docker-compose.test.yml up -d --force-recreate
```

---

## 7. Troubleshooting Guide

### 7.1 Deployment Fails - Image Pull Error

**Symptom**: GitHub Actions workflow fails at "Pull latest images" step

**Causes**:

- Test server cannot access ghcr.io
- Authentication issue with container registry
- Network connectivity problem

**Solutions**:

```bash
# On test server, login to ghcr.io
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# Test connectivity
ping -c 4 ghcr.io
curl -I https://ghcr.io

# Check DNS resolution
nslookup ghcr.io

# Try manual pull
docker pull ghcr.io/webzeppelin/angry-birdman-api:latest
```

### 7.2 Service Won't Start - Health Check Failing

**Symptom**: Container starts but fails health checks

**Debugging Steps**:

```bash
# View container logs
docker logs angrybirdman-test-api --tail=100

# Check container state
docker inspect angrybirdman-test-api

# Enter container for debugging
docker exec -it angrybirdman-test-api /bin/sh

# Test health endpoint manually
docker exec angrybirdman-test-api wget -O- http://localhost:3001/health

# Check if port is listening
docker exec angrybirdman-test-api netstat -tlnp
```

### 7.3 Database Connection Issues

**Symptom**: API cannot connect to PostgreSQL

**Solutions**:

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs angrybirdman-test-postgres

# Test database connection from API container
docker exec angrybirdman-test-api \
  sh -c 'wget -O- postgres:5432'

# Verify DATABASE_URL is correct
docker exec angrybirdman-test-api env | grep DATABASE_URL

# Test direct connection
docker exec angrybirdman-test-postgres \
  psql -U angrybirdman_test -d angrybirdman_test -c "SELECT 1;"
```

### 7.4 Keycloak Authentication Fails

**Symptom**: Frontend cannot authenticate users

**Solutions**:

```bash
# Check Keycloak is running and healthy
docker logs angrybirdman-test-keycloak

# Verify realm configuration
# Access: http://192.168.0.70:8080/admin
# Login with admin credentials
# Check: angrybirdman realm exists and clients configured

# Check JWT endpoint accessibility from API
docker exec angrybirdman-test-api \
  wget -O- http://keycloak:8080/realms/angrybirdman/.well-known/openid-configuration

# Verify environment variables
docker exec angrybirdman-test-api env | grep KEYCLOAK
```

### 7.5 Frontend Not Loading

**Symptom**: http://192.168.0.70 returns 502 or connection refused

**Solutions**:

```bash
# Check nginx is running
docker ps | grep nginx

# Check nginx logs
docker logs angrybirdman-test-nginx

# Verify frontend container is running
docker ps | grep frontend

# Test nginx configuration
docker exec angrybirdman-test-nginx nginx -t

# Check proxy configuration
docker exec angrybirdman-test-nginx cat /etc/nginx/conf.d/default.conf

# Test frontend directly (bypass nginx)
curl http://192.168.0.70:3000
```

### 7.6 Self-Hosted Runner Not Picking Up Jobs

**Symptom**: Workflow queued but not running, or runner shows offline

**Solutions**:

1. **Check runner service status**:

   ```bash
   # On test server
   sudo systemctl status actions.runner.webzeppelin-angry-birdman.test-server-runner.service
   ```

2. **Check runner logs**:

   ```bash
   # On test server
   cd /home/angrybirdman/actions-runner
   tail -f _diag/Runner_*.log
   ```

3. **Verify runner is registered**:
   - Go to: Repository → Settings → Actions → Runners
   - Runner should show as "Idle" (green) when ready
   - If offline, restart the service

4. **Restart runner service**:

   ```bash
   sudo /home/angrybirdman/actions-runner/svc.sh stop
   sudo /home/angrybirdman/actions-runner/svc.sh start
   sudo /home/angrybirdman/actions-runner/svc.sh status
   ```

5. **Check network connectivity**:

   ```bash
   # Test GitHub connectivity
   curl -I https://github.com
   curl -I https://ghcr.io
   ```

6. **Verify runner labels**:
   - Workflow requires: `[self-hosted, test-environment]`
   - Runner must have both labels
   - Check in GitHub UI: Repository → Settings → Actions → Runners

7. **Re-register runner** (if necessary):
   ```bash
   cd /home/angrybirdman/actions-runner
   sudo ./svc.sh stop
   sudo ./svc.sh uninstall
   ./config.sh remove --token YOUR_REMOVAL_TOKEN
   # Then follow registration steps again (section 4.4)
   ```

### 7.7 Port Already in Use

**Symptom**: Container fails to start due to port conflict

**Solutions**:

```bash
# Find what's using the port
sudo lsof -i :80
sudo netstat -tlnp | grep :80

# Kill conflicting process
sudo kill -9 <PID>

# Or change ports in docker-compose.test.yml
```

### 7.8 Out of Disk Space

**Symptom**: Deployment fails with "no space left on device"

**Solutions**:

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes -f

# Remove old images
docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi

# Check log file sizes
du -sh /var/lib/docker/containers/*/*-json.log

# Clear old logs (if needed)
sudo sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log'
```

### 7.9 Container Restart Loop

**Symptom**: Container constantly restarting

**Solutions**:

```bash
# View recent restarts
docker ps -a | grep Restarting

# Check logs for error
docker logs --tail=200 <container-id>

# Disable restart policy temporarily
docker update --restart=no <container-id>

# Fix issue and re-enable
docker update --restart=unless-stopped <container-id>
```

---

## 8. Security Considerations

### 8.1 Network Security

- ✅ Test server only accessible on home network (192.168.0.x)
- ✅ HTTP only (no external exposure, TLS not required for home network)
- ✅ UFW firewall enabled with minimal open ports
- ✅ **No inbound ports required for deployment** (self-hosted runner uses
  outbound connections only)
- ✅ Runner polls GitHub via HTTPS (port 443 outbound)
- ✅ No SSH exposure required
- ⚠️ Keycloak admin port (8080) should not be exposed externally
- ⚠️ Consider restricting outbound connections to GitHub IPs only (optional)

### 8.2 Secrets Management

- ✅ Environment variables stored in `.env.test` (not in git)
- ✅ GitHub Secrets used for SSH keys
- ✅ Strong database passwords generated
- ✅ Keycloak admin credentials secured
- ⚠️ Rotate credentials periodically (quarterly recommended)

### 8.3 Container Security

- ✅ Images pulled from trusted registry (ghcr.io)
- ✅ Non-root users in production containers (where possible)
- ✅ Health checks configured for all services
- ✅ Resource limits set (memory, CPU)
- ⚠️ Scan images for vulnerabilities regularly

### 8.4 Access Control

- ✅ Dedicated deployment user (`angrybirdman`)
- ✅ Limited sudo access
- ✅ SSH key unique to GitHub Actions
- ⚠️ Audit logs reviewed periodically
- ⚠️ Consider separate SSH key per developer if manual access needed

### 8.5 Data Protection

- ✅ Database volumes persist across restarts
- ✅ Regular automated backups (implement via cron)
- ✅ Backup retention policy (30 days recommended)
- ⚠️ Test restore procedures regularly
- ⚠️ Consider off-server backup storage

### 8.6 Security Monitoring

Implement basic monitoring:

```bash
# Create monitoring script: /opt/angrybirdman/scripts/monitor.sh
#!/bin/bash

# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -10

# Check running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check disk usage
df -h /

# Check memory usage
free -h

# Check recent docker events
docker events --since 24h --until 1s
```

Run periodically via cron:

```bash
# Add to crontab
0 */6 * * * /opt/angrybirdman/scripts/monitor.sh >> /opt/angrybirdman/logs/monitor.log 2>&1
```

---

## 9. Future Enhancements

### 9.1 Deployment Notifications

Add Slack/Discord/Email notifications:

```yaml
# Add to .github/workflows/deploy-test.yml
- name: Notify deployment
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to test environment ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 9.2 Automated Backups

Create automated backup workflow:

**Create: `.github/workflows/backup-test.yml`**

```yaml
name: Backup Test Database

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup database
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.TEST_SERVER_HOST }}
          username: ${{ secrets.TEST_SERVER_USER }}
          key: ${{ secrets.TEST_SERVER_SSH_KEY }}
          script: |
            /opt/angrybirdman/scripts/backup-db.sh
```

### 9.3 Staging Environment

Add staging environment with TLS:

- Domain: `test.angrybirdman.com`
- Cloudflare Tunnel for external access
- Separate `deploy-staging.yml` workflow
- Production-like environment for final QA

### 9.4 Performance Monitoring

Integrate monitoring tools:

- **Prometheus + Grafana**: Metrics and dashboards
- **Loki**: Log aggregation
- **cAdvisor**: Container metrics
- **Node Exporter**: System metrics

### 9.5 Blue-Green Deployment

Implement zero-downtime deployments:

- Maintain two identical environments
- Deploy to inactive environment
- Switch traffic after verification
- Instant rollback capability

### 9.6 Smoke Tests

Add post-deployment smoke tests:

```yaml
- name: Run smoke tests
  run: |
    # Test critical endpoints
    curl -f http://192.168.0.70/api/health
    curl -f http://192.168.0.70/api/clans
    # Add more critical path tests
```

### 9.7 Database Migration Verification

Add migration safety checks:

```yaml
- name: Verify migrations
  run: |
    # Dry-run migrations first
    # Check for destructive operations
    # Require approval for breaking changes
```

### 9.8 Container Security Scanning

Add vulnerability scanning:

```yaml
- name: Scan images
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/webzeppelin/angry-birdman-api:latest
    format: 'sarif'
    output: 'trivy-results.sarif'
```

---

## Implementation Checklist

Use this checklist when implementing the deployment pipeline:

### Phase 1: Project Setup

- [ ] Create all Docker files (Dockerfile.api, Dockerfile.frontend)
- [ ] Create nginx configurations
- [ ] Create docker-compose.test.yml
- [ ] Create deployment scripts (deploy-test.sh, rollback-test.sh)
- [ ] Create GitHub Actions workflow
- [ ] Create .env.test.example
- [ ] Update frontend vite.config.ts for environment handling
- [ ] Ensure API health endpoint exists
- [ ] Test Docker builds locally
- [ ] Commit and push changes

### Phase 2: Test Server Setup

- [ ] Install Docker and Docker Compose
- [ ] Configure static IP (192.168.0.70)
- [ ] Configure firewall (UFW) - only port 80 inbound
- [ ] Create deployment user (angrybirdman)
- [ ] Create deployment directory (/opt/angrybirdman)
- [ ] Clone repository
- [ ] Configure .env.test with strong passwords
- [ ] Install Node.js 24 LTS
- [ ] Create GitHub Personal Access Token
- [ ] Download and install GitHub Actions runner
- [ ] Configure runner with repository
- [ ] Install runner as systemd service
- [ ] Verify runner shows as "Idle" in GitHub
- [ ] Perform initial manual deployment
- [ ] Verify services are running
- [ ] Create systemd service for application (optional)

### Phase 3: GitHub Configuration

- [ ] Enable GitHub Container Registry
- [ ] Verify runner appears in Settings → Actions → Runners
- [ ] Verify runner has correct labels (self-hosted, test-environment)
- [ ] Configure workflow permissions (read and write)
- [ ] Test manual workflow dispatch
- [ ] Monitor runner logs during first deployment
- [ ] Test automatic deployment (push to main)
- [ ] Verify containers updated on test server
- [ ] Verify application accessible at http://192.168.0.70

### Phase 4: Validation & Documentation

- [ ] Test health checks
- [ ] Test rollback procedure
- [ ] Test database backup/restore
- [ ] Document access procedures
- [ ] Document troubleshooting steps
- [ ] Train team on pipeline usage
- [ ] Create runbook for operations

---

## Appendix A: Quick Reference Commands

### Deployment Status

```bash
# Check deployment status (from test server or via SSH)
docker ps

# View recent logs
cd /opt/angrybirdman && docker compose -f docker/docker-compose.test.yml logs --tail=50

# Health check (from any home network device)
curl http://192.168.0.70/api/health

# Check runner status
sudo systemctl status actions.runner.webzeppelin-angry-birdman.test-server-runner.service

# View runner logs
tail -f /home/angrybirdman/actions-runner/_diag/Runner_*.log
```

### Emergency Commands

```bash
# Stop all services (run on test server)
cd /opt/angrybirdman && docker compose -f docker/docker-compose.test.yml down

# Restart specific service
cd /opt/angrybirdman && docker compose -f docker/docker-compose.test.yml restart api

# Quick rollback
cd /opt/angrybirdman && ./scripts/rollback-test.sh sha-PREVIOUS

# Stop runner (prevents new deployments)
sudo /home/angrybirdman/actions-runner/svc.sh stop
```

### Maintenance Commands

```bash
# Backup database
/opt/angrybirdman/scripts/backup-db.sh

# Clean up Docker resources
docker system prune -f

# View disk usage
df -h

# Restart runner
sudo /home/angrybirdman/actions-runner/svc.sh restart
```

---

## Appendix B: Network Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Home Network                             │
│                      192.168.0.0/24                           │
│                                                               │
│  ┌────────────┐         ┌────────────┐                       │
│  │  Dev PC    │         │  Laptop    │                       │
│  │192.168.0.x │         │192.168.0.x │                       │
│  └──────┬─────┘         └──────┬─────┘                       │
│         │                      │                             │
│         └──────────┬───────────┘                             │
│                    │                                         │
│              ┌─────▼──────┐                                  │
│              │   Router   │                                  │
│              │192.168.0.1 │                                  │
│              └─────┬──────┘                                  │
│                    │                                         │
│         ┌──────────▼────────────┐                            │
│         │   Test Server         │                            │
│         │   192.168.0.70        │                            │
│         │  Ubuntu Mini-PC       │                            │
│         │                       │                            │
│         │  Docker Containers:   │                            │
│         │  • Nginx :80          │                            │
│         │  • Frontend :3000     │                            │
│         │  • API :3001          │                            │
│         │  • PostgreSQL :5432   │                            │
│         │  • Valkey :6379       │                            │
│         │  • Keycloak :8080     │                            │
│         └───────────────────────┘                            │
│                                                               │
│  External Access (GitHub Actions):                           │
│  Self-Hosted Runner → HTTPS Outbound → GitHub.com            │
│  ✓ No port forwarding required                               │
│  ✓ No inbound connections needed                             │
│  ✓ Runner polls GitHub for jobs over port 443                │
└──────────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: December 17, 2024  
**Author**: Angry Birdman Development Team  
**Status**: Ready for Implementation
