#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v psql >/dev/null; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-client
fi

npm ci --legacy-peer-deps

if [[ ! -f .env ]]; then
  cp .env.example .env
  sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=\"$(openssl rand -base64 32)\"|" .env
fi

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
until PGPASSWORD=postgres psql -h localhost -U postgres -c 'SELECT 1' >/dev/null 2>&1; do
  start_postgres
  sleep 1
done

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null 2>&1 || true
if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'opensourceapp'" | grep -q 1; then
  sudo -u postgres createdb opensourceapp
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

npm run db:push
npm run db:seed
