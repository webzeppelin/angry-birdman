#!/bin/bash
set -e

# Angry Birdman Production Rollback Script
# Rolls back to a specific Docker image tag.
#
# Usage: ./scripts/rollback-prod.sh <image-tag>
# Example: ./scripts/rollback-prod.sh sha-abc1234
#
# The image tag can be found in GHCR or GitHub Actions logs.

echo "=== Angry Birdman Production Rollback ==="
echo "Timestamp: $(date)"

DEPLOY_DIR="/opt/angrybirdman"
COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE="docker/.env.prod"

if [ -z "$1" ]; then
  echo "Error: Image tag required"
  echo "Usage: $0 <image-tag>"
  echo "Example: $0 sha-abc1234"
  exit 1
fi

TAG=$1

cd "$DEPLOY_DIR"

echo "Rolling back to tag: $TAG"

# Pin the image tag, generate a resolved compose config, and redeploy
export IMAGE_TAG=$TAG
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  config > docker-compose.rollback.yml

docker compose -f docker-compose.rollback.yml --env-file "$ENV_FILE" \
  up -d --force-recreate --remove-orphans

# Clean up temp file
rm docker-compose.rollback.yml

echo "=== Rollback completed ==="
echo "Application running with tag: $TAG"
echo "Application available at: https://www.angrybirdman.org"
