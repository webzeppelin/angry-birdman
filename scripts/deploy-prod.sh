#!/bin/bash
set -e

# Angry Birdman Production Deployment Script
# For manual deployments outside of GitHub Actions.

echo "=== Angry Birdman Production Deployment ==="
echo "Timestamp: $(date)"

DEPLOY_DIR="/opt/angrybirdman"
COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE="docker/.env.prod"

cd "$DEPLOY_DIR"

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Pull latest images
echo "Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

# Run database migrations
echo "Running database migrations..."
set -a
source "$ENV_FILE"
set +a
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public" \
  api npx prisma migrate deploy

# Deploy with force-recreate to pick up new images and env changes
echo "Deploying updated containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate --remove-orphans

# Wait for health checks
echo "Waiting for services to become healthy..."
sleep 30

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

# Health check
echo "Running health check..."
if curl -sf https://www.angrybirdman.org/health > /dev/null; then
  echo "✓ Health check passed"
else
  echo "✗ Health check failed"
  exit 1
fi

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f

echo "=== Deployment completed successfully ==="
echo "Application available at: https://www.angrybirdman.org"
