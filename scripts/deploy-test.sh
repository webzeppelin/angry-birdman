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
