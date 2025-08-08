#!/bin/bash

# Vevurn Database Backup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="vevurn_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

print_status "Starting database backup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://username:password@host:port/database
DB_PARAMS=$(echo $DATABASE_URL | sed 's/postgresql:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([^\/]*\)\/\(.*\)/\1 \2 \3 \4 \5/')
read DB_USER DB_PASS DB_HOST DB_PORT DB_NAME <<< "$DB_PARAMS"

print_status "Backing up database: $DB_NAME"
print_status "Host: $DB_HOST:$DB_PORT"
print_status "User: $DB_USER"

# Perform the backup
export PGPASSWORD="$DB_PASS"

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --no-password \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --file="$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    print_status "Database backup completed successfully ✅"
    print_status "Backup file: $BACKUP_DIR/$BACKUP_FILE"
    
    # Compress the backup file
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    print_status "Backup compressed: $BACKUP_DIR/$BACKUP_FILE.gz"
    
    # Show backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
    
    # Cleanup old backups (keep last 7 days)
    print_status "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "vevurn_backup_*.sql.gz" -mtime +7 -delete
    print_status "Old backups cleaned up"
    
else
    print_error "Database backup failed ❌"
    exit 1
fi

unset PGPASSWORD

print_status "🎉 Database backup process completed!"
