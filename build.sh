#!/bin/bash
# This script completely bypasses Render's auto-detection and sets up the proper build environment

set -e

echo "=== Vevurn POS Deployment Build Script ==="
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# If package.json was renamed to avoid auto-detection, restore it
if [ -f "package.json.render" ]; then
    echo "Restoring package.json from package.json.render..."
    mv package.json.render package.json
fi

# Force disable yarn and any auto-detection
echo "Setting up environment to prevent yarn conflicts..."
export YARN_ENABLE_GLOBAL_CACHE=false
export COREPACK_ENABLE_STRICT=0

# Enable corepack and set up pnpm
echo "Setting up corepack and pnpm..."
corepack enable
corepack prepare pnpm@9.14.4 --activate

# Verify pnpm is working
echo "PNPM version: $(pnpm --version)"

# Clean any potential yarn artifacts
if [ -f "yarn.lock" ]; then
    echo "Removing yarn.lock to prevent conflicts..."
    rm yarn.lock
fi

# Install dependencies with pnpm
echo "Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

# Build based on service
echo "Building application..."
if [ -n "$RENDER_SERVICE_NAME" ]; then
    if [[ "$RENDER_SERVICE_NAME" == *"backend"* ]]; then
        echo "Building backend service..."
        pnpm run backend:build
    elif [[ "$RENDER_SERVICE_NAME" == *"frontend"* ]]; then
        echo "Building frontend service..."
        pnpm run frontend:build  
    fi
else
    echo "Service name not detected, building all services..."
    pnpm run build
fi

echo "✅ Build completed successfully!"
echo "Files in backend/dist:" 
ls -la backend/dist/ 2>/dev/null || echo "Backend dist not found"
echo "Files in frontend/.next:"
ls -la frontend/.next/ 2>/dev/null || echo "Frontend .next not found"
