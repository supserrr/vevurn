#!/bin/bash
set -e

echo "🚀 Render Deployment Script Starting..."

# Navigate to backend directory if we're not already there
if [ ! -f "backend/package.json" ]; then
    echo "📁 Navigating to backend directory..."
    cd backend 2>/dev/null || {
        echo "❌ Error: backend directory not found"
        exit 1
    }
fi

# Check if we're in backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    exit 1
fi

echo "📦 Installing dependencies with --no-frozen-lockfile..."
cd ..
pnpm install --no-frozen-lockfile --ignore-scripts || {
    echo "⚠️ pnpm failed, trying npm..."
    npm install
}

echo "🔨 Building backend..."
cd backend
pnpm run build || {
    echo "⚠️ pnpm build failed, trying direct tsc..."
    npx tsc
}

echo "✅ Build completed successfully!"
