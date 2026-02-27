#!/bin/bash
# InstaTG Agent - Automated Backup Script
# Strategy: Dump Postgres and Redis RDB, then compress.

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting backup for $TIMESTAMP..."

# 1. Postgres Backup
if docker ps | grep -q "instatg-db"; then
    echo "📦 Dumping Postgres..."
    docker exec instatg-db pg_dump -U instatg instatg_db | gzip > "$BACKUP_DIR/postgres_dump.sql.gz"
else
    echo "⚠️  Postgres container not found, skipping."
fi

# 2. Redis Backup
if docker ps | grep -q "instatg-redis"; then
    echo "📦 Dumping Redis..."
    docker exec instatg-redis redis-cli SAVE
    docker cp instatg-redis:/data/dump.rdb "$BACKUP_DIR/redis_dump.rdb"
else
    echo "⚠️  Redis container not found, skipping."
fi

# 3. Retention Policy (Delete backups older than 7 days)
find ./backups -type d -mtime +7 -exec rm -rf {} +

echo "✅ Backup completed: $BACKUP_DIR"
