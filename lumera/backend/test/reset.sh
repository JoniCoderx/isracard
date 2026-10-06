#!/bin/bash
# Rebuilds the local test database from the shim and every migration, in order.
set -e
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-54329} -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists silavu_test" -c "create database silavu_test" >/dev/null 2>&1
cd "$(dirname "$0")/.."
for f in test/shim.sql supabase/migrations/*.sql; do
  PGOPTIONS='--client-min-messages=warning' $P -d silavu_test -f "$f" || { echo "FAILED in $f"; exit 1; }
done
echo "database ready: $(ls supabase/migrations/*.sql | wc -l) migrations"
