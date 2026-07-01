#!/bin/bash
set -e

cd "$(dirname "$0")/.."

BACKUP_DIR="$HOME/Documents/iowacyp-backups"
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M")
BACKUP_FILE="$BACKUP_DIR/site_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup of dist/..."
tar -czf "$BACKUP_FILE" dist/

echo "✅ Backup saved to: $BACKUP_FILE"

# Keep only the 30 most recent backups
cd "$BACKUP_DIR"
ls -t site_*.tar.gz | tail -n +31 | xargs rm -f 2>/dev/null && echo "🧹 Old backups pruned (keeping 30 most recent)" || true
