#!/bin/bash
set -e

echo "🚀 Enhanced Render Deployment Script Starting..."
echo "================================================"

# Environment validation
echo "🔍 Validating environment..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    exit 1
fi

if [ -z "$BETTER_AUTH_SECRET" ]; then
    echo "❌ ERROR: BETTER_AUTH_SECRET not set"
    exit 1
fi

echo "✅ Required environment variables validated"

# Package manager setup
echo "📦 Setting up package manager..."
corepack enable
corepack prepare pnpm@9.14.4 --activate

# Navigate to root if needed
if [ ! -f "package.json" ]; then
    echo "📁 Navigating to project root..."
    cd .. 2>/dev/null || {
        echo "❌ Error: Could not find project root"
        exit 1
    }
fi

echo "📥 Installing dependencies..."
pnpm install --no-frozen-lockfile

# Build shared package first
echo "🔧 Building shared package..."
pnpm --filter @vevurn/shared build

echo "🔨 Building backend..."
pnpm --filter @vevurn/backend build

echo "✅ Build process completed successfully!"
echo "📊 Build artifacts:"
ls -la backend/dist/

echo "🎉 Ready for deployment!"
