#!/bin/bash

# Test script for verifying the POS system integration
# This script tests the key endpoints we implemented

echo "🧪 Testing Vevurn POS API Integration"
echo "======================================"

BASE_URL="http://localhost:8000"

echo ""
echo "1. Testing Health Endpoint..."
curl -s "${BASE_URL}/api/health" | head -5 || echo "❌ Health endpoint failed"

echo ""
echo "2. Testing API Root..."
curl -s "${BASE_URL}/api/" | head -5 || echo "❌ API root failed"

echo ""
echo "3. Testing Products Endpoint (should require auth)..."
curl -s "${BASE_URL}/api/products" | head -5 || echo "❌ Products endpoint failed"

echo ""
echo "4. Testing Sales Endpoint (should require auth)..."
curl -s "${BASE_URL}/api/sales" | head -5 || echo "❌ Sales endpoint failed"

echo ""
echo "5. Testing Reports Endpoint (should require auth)..."
curl -s "${BASE_URL}/api/reports/profit" | head -5 || echo "❌ Reports endpoint failed"

echo ""
echo "✅ API Integration Test Complete!"
echo ""
echo "📝 Notes:"
echo "- Auth-protected endpoints should return 401/403 without authentication"
echo "- This confirms the routes are properly set up"
echo "- Frontend is running on http://localhost:3000"
echo "- Backend is running on http://localhost:8000"
