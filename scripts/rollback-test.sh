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
