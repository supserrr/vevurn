#!/bin/bash
# Vevurn POS Build Script for Render Deployment

set -e

echo "=== Vevurn POS Build Script ==="
echo "Node: $(node --version)"
echo "Working Directory: $(pwd)"
echo "Service Type: ${SERVICE_TYPE:-auto-detect}"
echo "Render Service: ${RENDER_SERVICE_NAME:-unknown}"

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

# Build based on service type or auto-detection
echo "Building application..."
if [[ "${SERVICE_TYPE:-}" == "backend" ]] || [[ "${RENDER_SERVICE_NAME:-}" == *"backend"* ]]; then
    echo "Building backend service..."
    pnpm run shared:build
    pnpm --filter @vevurn/backend build
    echo "Backend build complete. Checking dist folder..."
    ls -la backend/dist/ || echo "No backend/dist found"
elif [[ "${SERVICE_TYPE:-}" == "frontend" ]] || [[ "${RENDER_SERVICE_NAME:-}" == *"frontend"* ]]; then
    echo "Building frontend service..."
    pnpm run shared:build
    pnpm --filter frontend build
    echo "Frontend build complete. Checking .next folder..."
    ls -la frontend/.next/ || echo "No frontend/.next found"
else
    echo "Building all services..."
    pnpm run build
fi

echo "✅ Build completed!"
