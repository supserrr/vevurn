#!/bin/bash
set -e

echo "🚀 Custom Build Script Starting..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found. Are we in the right directory?"
    exit 1
fi

echo "📦 Installing dependencies..."
# Try to install with no frozen lockfile
if ! pnpm install --no-frozen-lockfile; then
    echo "⚠️  pnpm install failed, trying npm as fallback..."
    npm install
fi

echo "🔨 Building TypeScript..."
# Run the build
if ! pnpm run build; then
    echo "⚠️  pnpm build failed, trying npx tsc..."
    npx tsc
fi

echo "✅ Build completed successfully!"
