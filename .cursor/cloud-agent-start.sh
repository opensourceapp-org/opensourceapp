#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

start_postgres() {
  if [[ -d /etc/postgresql ]]; then
    local ver
    ver="$(ls /etc/postgresql 2>/dev/null | head -1 || true)"
    if [[ -n "${ver}" ]]; then
      sudo pg_ctlcluster "${ver}" main start 2>/dev/null || true
    fi
  fi
  sudo service postgresql start 2>/dev/null || true
}

start_postgres
until PGPASSWORD=postgres psql -h localhost -U postgres -d opensourceapp -c 'SELECT 1' >/dev/null 2>&1; do
  start_postgres
  sleep 1
done

set -a
# shellcheck disable=SC1091
source .env
set +a

exec npm run dev -- --hostname 0.0.0.0 --port 3000
