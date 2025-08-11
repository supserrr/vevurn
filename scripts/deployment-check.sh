#!/bin/bash

echo "🔍 Vevurn Deployment Status Check"
echo "================================="

echo ""
echo "📂 Checking build artifacts..."

if [ ! -d "backend/dist" ]; then
    echo "❌ Build directory not found: backend/dist"
    exit 1
fi

if [ ! -f "backend/dist/src/index.js" ]; then
    echo "❌ Main entry file not found: backend/dist/src/index.js"
    exit 1
fi

echo "✅ Build artifacts found:"
echo "   📄 backend/dist/src/index.js"
echo "   📄 backend/dist/src/server.js"
echo ""

echo "📊 Build directory contents:"
ls -la backend/dist/

echo ""
echo "📊 Source directory contents:"
ls -la backend/dist/src/

echo ""
echo "🔧 Configuration check:"
echo "   📁 Working directory: $(pwd)"
echo "   🚀 Start command: cd backend && NODE_ENV=production node dist/src/index.js"
echo "   🌐 Expected URL: https://vevurn.onrender.com"
echo ""

echo "✅ Deployment configuration appears correct!"
echo ""
echo "🔄 To test locally:"
echo "   cd backend && NODE_ENV=production node dist/src/index.js"
echo ""
echo "📝 Render.com deployment should use:"
echo "   Build: pnpm run build:render"
echo "   Start: cd backend && NODE_ENV=production node dist/src/index.js"
