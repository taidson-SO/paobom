#!/usr/bin/env bash

set -euo pipefail

export E2E_DATABASE_URL="${E2E_DATABASE_URL:-postgresql://paobom_e2e:paobom_e2e@localhost:${E2E_POSTGRES_PORT:-55434}/paobom_e2e?schema=public}"

cleanup() {
  docker compose -f docker-compose.e2e.yml down -v
}

trap cleanup EXIT INT TERM

docker compose -f docker-compose.e2e.yml up -d --wait postgres-e2e
node scripts/run-e2e.mjs
