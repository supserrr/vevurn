#!/bin/bash

echo "=== Render Frontend Build Script ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building frontend..."
npm run build

# Check if build was successful
if [ -d ".next/standalone" ]; then
  echo "✅ Build successful! Standalone output created."
  ls -la .next/standalone/
else
  echo "❌ Build failed! No standalone output found."
  exit 1
fi

echo "Frontend build completed successfully!"
