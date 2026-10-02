#!/usr/bin/env bash
set -euo pipefail
# Disposable loopback-only test service. Never reads DATABASE_URL.
docker run -d --name kindai-audit-db -e MARIADB_ROOT_PASSWORD=local-test-only -e MARIADB_DATABASE=kindai_test -p 127.0.0.1:3307:3306 mariadb:11
for attempt in {1..30}; do
  if docker exec kindai-audit-db mariadb-admin ping -uroot -plocal-test-only --silent; then break; fi
  sleep 1
done
schema_file=$(mktemp)
trap 'rm -f "$schema_file"' EXIT
corepack pnpm exec drizzle-kit export --dialect mysql --schema drizzle/schema.ts | sed -n '/^CREATE TABLE/,$p' > "$schema_file"
docker exec -i kindai-audit-db mariadb -uroot -plocal-test-only kindai_test < "$schema_file"
# Run: KINDAI_LOCAL_DB_TESTS=1 corepack pnpm exec vitest run server/unifiedKindai.test.ts
# Remove the disposable service when finished: docker rm -f kindai-audit-db
