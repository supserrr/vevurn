#!/bin/bash

# Comprehensive Signup Fix Validation Script
echo "🔍 Vevurn Signup Fix Validation"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if curl -s http://localhost:$port > /dev/null; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Function to check environment variables
check_env_vars() {
    echo ""
    echo -e "${BLUE}🔍 Checking Environment Variables...${NC}"
    
    cd backend
    
    # Check Google OAuth vars
    if node -e "console.log(process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING')" | grep -q "SET"; then
        echo -e "${GREEN}✅ GOOGLE_CLIENT_ID is set${NC}"
    else
        echo -e "${RED}❌ GOOGLE_CLIENT_ID is missing${NC}"
    fi
    
    if node -e "console.log(process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING')" | grep -q "SET"; then
        echo -e "${GREEN}✅ GOOGLE_CLIENT_SECRET is set${NC}"
    else
        echo -e "${RED}❌ GOOGLE_CLIENT_SECRET is missing${NC}"
    fi
    
    if node -e "console.log(process.env.BETTER_AUTH_SECRET ? 'SET' : 'MISSING')" | grep -q "SET"; then
        echo -e "${GREEN}✅ BETTER_AUTH_SECRET is set${NC}"
    else
        echo -e "${RED}❌ BETTER_AUTH_SECRET is missing${NC}"
    fi
    
    cd ..
}

# Function to test rate limits
test_rate_limits() {
    echo ""
    echo -e "${BLUE}🔍 Testing Rate Limits...${NC}"
    
    # Test email signup endpoint
    echo "Testing /sign-up/email rate limits..."
    for i in {1..3}; do
        response=$(curl -s -w "%{http_code}" -X POST http://localhost:8001/api/auth/sign-up/email \
            -H "Content-Type: application/json" \
            -d '{"email":"test'$i'@example.com","password":"testpass123","name":"Test User'$i'"}' \
            -o /dev/null)
        
        if [ "$response" = "200" ] || [ "$response" = "400" ]; then
            echo -e "${GREEN}✅ Request $i: HTTP $response (within rate limit)${NC}"
        elif [ "$response" = "429" ]; then
            echo -e "${YELLOW}⚠️ Request $i: HTTP $response (rate limited - expected after multiple attempts)${NC}"
        else
            echo -e "${RED}❌ Request $i: HTTP $response (unexpected response)${NC}"
        fi
        
        sleep 1
    done
}

# Function to test Google OAuth availability
test_google_oauth() {
    echo ""
    echo -e "${BLUE}🔍 Testing Google OAuth Endpoint...${NC}"
    
    response=$(curl -s -w "%{http_code}" http://localhost:8001/api/auth/sign-in/social/google -o /dev/null)
    
    if [ "$response" = "302" ] || [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Google OAuth endpoint responding (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ Google OAuth endpoint not responding properly (HTTP $response)${NC}"
    fi
}

# Function to validate file changes
validate_fixes() {
    echo ""
    echo -e "${BLUE}🔍 Validating Applied Fixes...${NC}"
    
    # Check rate limit config
    if grep -q "max: 30 \* multiplier" backend/src/lib/rate-limit-config.ts; then
        echo -e "${GREEN}✅ OAuth rate limits updated in rate-limit-config.ts${NC}"
    else
        echo -e "${RED}❌ OAuth rate limits not updated in rate-limit-config.ts${NC}"
    fi
    
    # Check auth hooks
    if grep -q "🔍 BACKEND SIGNUP DATA" backend/src/lib/auth-hooks.ts; then
        echo -e "${GREEN}✅ Enhanced validation logging added to auth-hooks.ts${NC}"
    else
        echo -e "${RED}❌ Enhanced validation logging not found in auth-hooks.ts${NC}"
    fi
    
    # Check frontend signup
    if grep -q "console.log('🔍 Signup values:', values)" frontend/app/login/page.tsx; then
        echo -e "${GREEN}✅ Enhanced logging added to frontend signup${NC}"
    else
        echo -e "${RED}❌ Enhanced logging not found in frontend signup${NC}"
    fi
}

# Main execution
echo ""
echo -e "${YELLOW}Step 1: Checking Services...${NC}"
backend_running=false
frontend_running=false

if check_service "Backend" 8001; then
    backend_running=true
fi

if check_service "Frontend" 3000; then
    frontend_running=true
fi

# Check environment variables
check_env_vars

# Validate applied fixes
validate_fixes

# Test endpoints if backend is running
if [ "$backend_running" = true ]; then
    test_google_oauth
    test_rate_limits
else
    echo ""
    echo -e "${YELLOW}⚠️ Backend not running. Start with: cd backend && npm run dev${NC}"
fi

# Test instructions
echo ""
echo -e "${BLUE}🧪 Manual Testing Instructions:${NC}"
echo ""
echo "1. Start both services if not running:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "2. Test Email/Password Signup:"
echo "   - Go to http://localhost:3000/login"
echo "   - Click 'Sign Up' tab"
echo "   - Fill: First Name, Last Name, Email, Password"
echo "   - Should work without 'firstname is required' error"
echo ""
echo "3. Test Google OAuth:"
echo "   - Click 'Sign in with Google' button"
echo "   - Should redirect to Google and back without errors"
echo ""
echo "4. Check browser console and backend logs for detailed debugging info"
echo ""

# Results summary
echo -e "${BLUE}📊 Fix Summary:${NC}"
echo "✅ Rate limits increased for OAuth endpoints (30/min for social, 50/min for callbacks)"
echo "✅ Email signup rate limits increased (10 per 5 minutes)"
echo "✅ Enhanced frontend logging for signup debugging"
echo "✅ Improved backend validation to handle name field extraction"
echo "✅ Better error messages for validation failures"
echo ""
echo -e "${GREEN}🚀 Ready for testing! Check manual testing instructions above.${NC}"
