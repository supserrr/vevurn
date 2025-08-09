#!/bin/bash

# Vevurn Database Restore Script
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
BACKUP_FILE="$1"

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    print_error "Usage: $0 <backup_file>"
    print_status "Available backups:"
    ls -la "$BACKUP_DIR"/vevurn_backup_*.sql.gz 2>/dev/null || print_warning "No backup files found"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

print_status "Starting database restore..."
print_status "Backup file: $BACKUP_DIR/$BACKUP_FILE"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database connection details from DATABASE_URL
DB_PARAMS=$(echo $DATABASE_URL | sed 's/postgresql:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([^\/]*\)\/\(.*\)/\1 \2 \3 \4 \5/')
read DB_USER DB_PASS DB_HOST DB_PORT DB_NAME <<< "$DB_PARAMS"

print_status "Restoring to database: $DB_NAME"
print_status "Host: $DB_HOST:$DB_PORT"
print_status "User: $DB_USER"

# Confirmation prompt
print_warning "⚠️  This will OVERWRITE the existing database: $DB_NAME"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Database restore cancelled"
    exit 0
fi

# Prepare backup file for restore
TEMP_FILE="/tmp/vevurn_restore_$(date +%s).sql"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    print_status "Decompressing backup file..."
    gunzip -c "$BACKUP_DIR/$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_DIR/$BACKUP_FILE" "$TEMP_FILE"
fi

# Perform the restore
export PGPASSWORD="$DB_PASS"

print_status "Restoring database..."
psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    --no-password \
    --file="$TEMP_FILE"

# Check if restore was successful
if [ $? -eq 0 ]; then
    print_status "Database restore completed successfully ✅"
    
    # Run migrations to ensure schema is up to date
    print_status "Running database migrations..."
    cd backend && npx prisma migrate deploy
    
    print_status "Generating Prisma client..."
    cd backend && npx prisma generate
    
else
    print_error "Database restore failed ❌"
    exit 1
fi

# Cleanup temporary file
rm -f "$TEMP_FILE"
unset PGPASSWORD

print_status "🎉 Database restore process completed!"
print_status "Database $DB_NAME has been restored from $BACKUP_FILE"
