#!/bin/bash
# This script prevents Render's auto-detection and sets up the proper build environment

set -e

echo "Starting Render deployment for Vevurn POS System..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# Verify package.json integrity
echo "Checking package.json integrity..."
if grep -q '"packageManager": "pnpm@9.14.4"' package.json; then
    echo "✅ Package manager field is correct"
else
    echo "❌ Package manager field is missing or incorrect"
    echo "Current package.json packageManager field:"
    grep '"packageManager"' package.json || echo "Field not found"
    exit 1
fi

# Enable corepack
echo "Enabling corepack..."
corepack enable
corepack prepare pnpm@9.14.4 --activate

echo "PNPM version: $(pnpm --version)"

# Install dependencies  
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build based on service
if [ -n "$RENDER_SERVICE_NAME" ]; then
    if [[ "$RENDER_SERVICE_NAME" == *"backend"* ]]; then
        echo "Building backend service..."
        pnpm run backend:build
    elif [[ "$RENDER_SERVICE_NAME" == *"frontend"* ]]; then
        echo "Building frontend service..."
        pnpm run frontend:build  
    fi
else
    echo "No specific service detected, building all..."
    pnpm run build
fi

echo "Build completed successfully!"
