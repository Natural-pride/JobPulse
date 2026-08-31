#!/usr/bin/env bash
# Daily SQLite backup with rotation.
# Cron: 0 3 * * * /home/jobpulse/backup.sh >> /home/jobpulse/backup.log 2>&1

set -euo pipefail

REPO_DIR="/home/jobpulse/JobPulse"
DB_FILE="$REPO_DIR/backend/data/jobpulse.db"
BACKUP_DIR="/home/jobpulse/backups"
KEEP_DAYS=7

if [[ ! -f "$DB_FILE" ]]; then
    echo "[$(date -Iseconds)] DB not found at $DB_FILE — nothing to back up" >&2
    exit 0
fi

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d)"
DEST="$BACKUP_DIR/backup-$STAMP.db"

# SQLite hot-backup: use the .backup command (safe under WAL).
# Falls back to cp if sqlite3 CLI isn't installed.
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_FILE" ".backup '$DEST'"
else
    # cp -p preserves mode/timestamps; fine when WAL is empty
    cp -p "$DB_FILE" "$DEST"
fi

# Compress to save disk (SQLite compresses ~10x)
gzip -f "$DEST"
DEST_GZ="$DEST.gz"

echo "[$(date -Iseconds)] backed up → $DEST_GZ ($(du -h "$DEST_GZ" | cut -f1))"

# Rotate: delete backups older than KEEP_DAYS days
DELETED=$(find "$BACKUP_DIR" -name "backup-*.db.gz" -mtime +$KEEP_DAYS -print -delete | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
    echo "[$(date -Iseconds)] rotated $DELETED old backup(s)"
fi
