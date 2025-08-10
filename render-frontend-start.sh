#!/bin/bash

echo "=== Starting Vevurn Frontend ==="

# Navigate to frontend directory
cd frontend

# Check if standalone build exists
if [ -f ".next/standalone/frontend/server.js" ]; then
  echo "✅ Starting standalone server..."
  node .next/standalone/frontend/server.js
else
  echo "❌ Standalone server not found! Trying alternative..."
  if [ -f "package.json" ]; then
    npm start
  else
    echo "❌ No valid start method found!"
    exit 1
  fi
fi
