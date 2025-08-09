#!/bin/bash
# Vevurn POS Build Script for Render Deployment

set -e

echo "=== Vevurn POS Build Script ==="
echo "Node: $(node --version)"
echo "Working Directory: $(pwd)"
echo "Service: ${RENDER_SERVICE_NAME:-unknown}"

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

# Build based on service
echo "Building application..."
if [[ "${RENDER_SERVICE_NAME:-}" == *"backend"* ]]; then
    echo "Building backend..."
    pnpm run backend:build
    echo "Backend build complete. Checking dist folder..."
    ls -la backend/dist/ || echo "No backend/dist found"
elif [[ "${RENDER_SERVICE_NAME:-}" == *"frontend"* ]]; then
    echo "Building frontend..."
    pnpm run frontend:build
    echo "Frontend build complete. Checking .next folder..."
    ls -la frontend/.next/ || echo "No frontend/.next found"
else
    echo "Building all services..."
    pnpm run build
fi

echo "✅ Build completed!"
