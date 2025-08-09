#!/bin/bash
# Backend-specific build script for Render deployment

set -e

echo "=== Backend Build Script ==="
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
# Check if we're in backend directory already (for rootDir configuration)
if [[ $(basename $(pwd)) == "backend" ]]; then
  echo "Running from backend directory"
  cd ..
  pnpm install --frozen-lockfile
  cd backend
else
  echo "Running from root directory"
  pnpm install --frozen-lockfile
fi

# Generate Prisma client first
echo "Generating Prisma client..."
cd backend || echo "Already in backend"
pnpm exec prisma generate

# Go back to root for building
cd .. 2>/dev/null || echo "Already at root"

# Build shared package first, then backend
echo "Building backend..."
pnpm --filter @vevurn/shared build
pnpm --filter @vevurn/backend build

echo "Backend build complete. Checking dist folder..."
ls -la backend/dist/ || echo "No backend/dist found"

echo "✅ Backend build completed successfully!"
