#!/usr/bin/env sh
# Drop unused Docker build cache and dangling images before n8n commands.
set -e

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found — skipping cache prune"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "docker daemon not running — skipping cache prune"
  exit 0
fi

echo "Pruning Docker build cache…"
docker builder prune -f >/dev/null 2>&1 || true

echo "Pruning dangling Docker images…"
docker image prune -f >/dev/null 2>&1 || true
