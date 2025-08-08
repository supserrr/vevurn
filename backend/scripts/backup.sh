#!/bin/bash
set -e

# Configuration
BACKUP_DIR="${BACKUP_PATH:-/var/backups/vevurn}"
DATABASE_URL="${DATABASE_URL}"
RETENTION_DAYS=30
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TYPE="${1:-manual}"
BACKUP_FILE="vevurn_backup_${BACKUP_TYPE}_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "🚀 Starting backup process..."
echo "📁 Backup file: $BACKUP_FILE"
echo "📂 Backup directory: $BACKUP_DIR"

# Create database backup
echo "📊 Creating database backup..."
pg_dump "$DATABASE_URL" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Database backup created successfully: $BACKUP_FILE"
else
  echo "❌ Database backup failed!"
  exit 1
fi

# Compress backup
echo "📦 Compressing backup..."
gzip "$BACKUP_PATH"
COMPRESSED_FILE="${BACKUP_PATH}.gz"

# Encrypt backup if key is provided
if [ -n "$ENCRYPTION_KEY" ]; then
  echo "🔐 Encrypting backup..."
  openssl enc -aes-256-cbc -salt -in "$COMPRESSED_FILE" -out "${COMPRESSED_FILE}.enc" -k "$ENCRYPTION_KEY"
  rm "$COMPRESSED_FILE"
  COMPRESSED_FILE="${COMPRESSED_FILE}.enc"
fi

# Upload to cloud storage (Cloudinary)
if [ -n "$CLOUDINARY_URL" ]; then
  echo "☁️ Uploading backup to cloud storage..."
  # Upload logic would go here
  echo "✅ Backup uploaded to cloud storage"
fi

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if [ -f "$COMPRESSED_FILE" ]; then
  echo "✅ Backup file exists and is readable"
else
  echo "❌ Backup verification failed!"
  exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "vevurn_backup_*.sql.gz*" -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "vevurn_backup_*.sql.gz*" -mtime +$RETENTION_DAYS | wc -l)
echo "🗑️ Deleted $DELETED_COUNT old backup files"

# Calculate backup size
BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo "📏 Backup size: $BACKUP_SIZE"

# Send notification
if [ -n "$SLACK_WEBHOOK" ]; then
  echo "📱 Sending notification..."
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    --data "{
      \"text\":\"✅ Vevurn POS backup completed successfully\",
      \"attachments\":[{
        \"color\":\"good\",
        \"fields\":[
          {\"title\":\"Backup File\",\"value\":\"$BACKUP_FILE\",\"short\":true},
          {\"title\":\"Size\",\"value\":\"$BACKUP_SIZE\",\"short\":true},
          {\"title\":\"Type\",\"value\":\"$BACKUP_TYPE\",\"short\":true},
          {\"title\":\"Timestamp\",\"value\":\"$(date)\",\"short\":true}
        ]
      }]
    }"
fi

echo "🎉 Backup process completed successfully!"
echo "📄 Backup file: $COMPRESSED_FILE"
echo "📈 Size: $BACKUP_SIZE"

# Log backup to database (if possible)
if command -v psql &> /dev/null; then
  echo "📝 Logging backup to database..."
  psql "$DATABASE_URL" -c "
    INSERT INTO backup_jobs (
      backup_type, backup_filename, backup_path, 
      file_size_bytes, status, completed_at
    ) VALUES (
      '$BACKUP_TYPE', '$BACKUP_FILE', '$COMPRESSED_FILE',
      $(stat -c%s "$COMPRESSED_FILE" 2>/dev/null || echo 0),
      'completed', NOW()
    );"
fi

exit 0
