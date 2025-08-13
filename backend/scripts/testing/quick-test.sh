#!/bin/bash

# Simple Backend Test Script
echo "🧪 Testing Backend Endpoints"
echo "============================"

BASE_URL="http://localhost:8001"

# Function to test an endpoint
test_endpoint() {
    local url=$1
    local name=$2
    echo -n "Testing $name... "
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅"
    else
        echo "❌"
    fi
}

echo "Make sure your backend is running with:"
echo "pnpm run --filter=@vevurn/backend dev"
echo ""

# Test endpoints
test_endpoint "$BASE_URL/" "Root"
test_endpoint "$BASE_URL/health" "Health"
test_endpoint "$BASE_URL/api/health" "API Health"
test_endpoint "$BASE_URL/api/auth-status" "Auth Status"
test_endpoint "$BASE_URL/api/users" "Users"
test_endpoint "$BASE_URL/api/products" "Products" 
test_endpoint "$BASE_URL/api/categories" "Categories"
test_endpoint "$BASE_URL/api/sales" "Sales"
test_endpoint "$BASE_URL/api/customers" "Customers"
test_endpoint "$BASE_URL/api/suppliers" "Suppliers"
test_endpoint "$BASE_URL/api/loans" "Loans"
test_endpoint "$BASE_URL/api/reports" "Reports"
test_endpoint "$BASE_URL/api/settings" "Settings"

echo ""
echo "✅ Test completed!"
echo "If any tests failed, make sure the backend server is running."
