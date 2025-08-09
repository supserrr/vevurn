#!/bin/bash
set -e

echo "🚀 Initializing Vevurn POS Database..."

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if database exists
psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null || {
    echo "❌ Database connection failed. Please check DATABASE_URL"
    exit 1
}

# Run the main schema creation
echo "📊 Creating database schema..."
psql "$DATABASE_URL" -f database_schema.sql

# Verify schema creation
echo "🔍 Verifying schema installation..."
TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLES_COUNT" -gt 0 ]; then
    echo "✅ Database schema created successfully with $TABLES_COUNT tables"
else
    echo "❌ Schema creation failed"
    exit 1
fi

# Run data consistency checks
echo "🔍 Running data consistency checks..."
psql "$DATABASE_URL" -c "SELECT * FROM check_data_consistency();"

echo "🎉 Database initialization completed successfully!"
