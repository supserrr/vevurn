#!/bin/bash
set -e

echo "=== Render Build Script ==="

# Create build directory (but don't commit it, let Render create it)
mkdir -p build

# Change to frontend directory
cd frontend

echo "Installing frontend dependencies..."
# Use npm ci if package-lock.json exists, otherwise npm install
if [ -f "package-lock.json" ]; then
  npm ci --only=production --no-audit || npm install --only=production --no-audit
else
  npm install --only=production --no-audit
fi

echo "Building frontend..."
npm run build

echo "Checking build output..."
if [ ! -d ".next/standalone" ]; then
  echo "Error: No standalone build found!"
  exit 1
fi

echo "Copying files to build directory..."
cd ..
cp -r frontend/.next/standalone/frontend/* build/
cp -r frontend/.next/static build/.next/ 2>/dev/null || echo "No static files to copy"

echo "Creating production package.json..."
cat > build/package.json << 'EOF'
{
  "name": "vevurn-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "next": "15.4.6"
  }
}
EOF

echo "Build completed successfully!"
ls -la build/
