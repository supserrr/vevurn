#!/bin/bash
# Render build script
echo "Starting build process..."
cd frontend
npm install
npm run build
echo "Build completed!"
