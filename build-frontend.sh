#!/bin/bash
# Frontend-specific build script for Render deployment

set -e

echo "=== Frontend Build Script ==="
echo "Node: $(node --version)"
echo "Working Directory: $(pwd)"

# Setup pnpm via corepack
echo "Setting up pnpm..."
corepack enable
corepack prepare pnpm@9.14.4 --activate

echo "PNPM Version: $(pnpm --version)"

# Remove any yarn artifacts
rm -f yarn.lock

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build shared package first, then frontend
echo "Building frontend..."
pnpm run shared:build
pnpm --filter frontend build

echo "Frontend build complete. Checking .next folder..."
ls -la frontend/.next/ || echo "No frontend/.next found"

echo "✅ Frontend build completed successfully!"
