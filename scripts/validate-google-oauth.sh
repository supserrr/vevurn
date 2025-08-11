#!/bin/bash

# Google OAuth Environment Validation Script
# Validates that all required environment variables and configurations are set correctly

echo "🔍 Google OAuth Configuration Validator"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_checks=0
passed_checks=0
failed_checks=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    total_checks=$((total_checks + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "  ✅ ${GREEN}PASS${NC}: $message"
        passed_checks=$((passed_checks + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "  ❌ ${RED}FAIL${NC}: $message"
        failed_checks=$((failed_checks + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "  ⚠️  ${YELLOW}WARN${NC}: $message"
    else
        echo -e "  ℹ️  ${BLUE}INFO${NC}: $message"
    fi
}

# Check if .env file exists
echo "📝 Environment File Check"
echo "========================"
if [ -f "backend/.env" ]; then
    print_status "PASS" ".env file exists at backend/.env"
else
    print_status "FAIL" ".env file not found at backend/.env"
    echo "❌ Cannot continue without .env file"
    exit 1
fi

# Load environment variables from .env file
set -a
source backend/.env
set +a

echo ""
echo "🔑 Google OAuth Credentials Check"
echo "================================="

# Check Google Client ID
if [ -n "$GOOGLE_CLIENT_ID" ]; then
    if [[ "$GOOGLE_CLIENT_ID" == *".apps.googleusercontent.com" ]]; then
        print_status "PASS" "Google Client ID is set and has correct format"
        print_status "INFO" "Client ID: ${GOOGLE_CLIENT_ID:0:20}..."
    else
        print_status "FAIL" "Google Client ID format is incorrect (should end with .apps.googleusercontent.com)"
    fi
else
    print_status "FAIL" "GOOGLE_CLIENT_ID is not set"
fi

# Check Google Client Secret
if [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    if [[ ${#GOOGLE_CLIENT_SECRET} -gt 20 ]]; then
        print_status "PASS" "Google Client Secret is set and appears valid"
    else
        print_status "WARN" "Google Client Secret seems too short"
    fi
else
    print_status "FAIL" "GOOGLE_CLIENT_SECRET is not set"
fi

echo ""
echo "🗄️  Database Configuration Check"
echo "==============================="

# Check Database URL
if [ -n "$DATABASE_URL" ]; then
    print_status "PASS" "DATABASE_URL is configured"
    # Test database connection
    if command -v psql >/dev/null 2>&1; then
        if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            print_status "PASS" "Database connection successful"
        else
            print_status "FAIL" "Cannot connect to database"
        fi
    else
        print_status "INFO" "psql not available, skipping connection test"
    fi
else
    print_status "FAIL" "DATABASE_URL is not set"
fi

echo ""
echo "🔐 Better Auth Configuration Check"
echo "=================================="

# Check Better Auth Secret
if [ -n "$BETTER_AUTH_SECRET" ]; then
    if [[ ${#BETTER_AUTH_SECRET} -ge 32 ]]; then
        print_status "PASS" "BETTER_AUTH_SECRET is set and meets length requirement"
    else
        print_status "FAIL" "BETTER_AUTH_SECRET should be at least 32 characters long"
    fi
else
    print_status "FAIL" "BETTER_AUTH_SECRET is not set"
fi

# Check Better Auth URL
if [ -n "$BETTER_AUTH_URL" ]; then
    print_status "PASS" "BETTER_AUTH_URL is configured: $BETTER_AUTH_URL"
else
    print_status "WARN" "BETTER_AUTH_URL is not explicitly set (will use default)"
fi

echo ""
echo "📄 File Structure Check"
echo "======================"

# Check key files exist
files_to_check=(
    "backend/src/lib/auth.ts"
    "backend/prisma/schema.prisma"
    "frontend/app/login/page.tsx"
    "scripts/setup-google-oauth.sh"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        print_status "PASS" "$file exists"
    else
        print_status "FAIL" "$file not found"
    fi
done

echo ""
echo "⚙️  Server Process Check"
echo "======================"

# Check if development servers are running
if pgrep -f "npm run dev" > /dev/null; then
    print_status "INFO" "Development servers are running"
    print_status "WARN" "Restart servers after configuration changes"
else
    print_status "INFO" "No development servers running"
fi

echo ""
echo "🌐 OAuth Redirect URI Validation"
echo "==============================="

expected_uris=(
    "http://localhost:8000/api/auth/callback/google"
    "https://vevurn.onrender.com/api/auth/callback/google"
)

print_status "INFO" "Expected redirect URIs in Google Cloud Console:"
for uri in "${expected_uris[@]}"; do
    print_status "INFO" "  - $uri"
done

echo ""
echo "📊 Validation Summary"
echo "===================="

echo -e "Total Checks: $total_checks"
echo -e "${GREEN}Passed: $passed_checks${NC}"
echo -e "${RED}Failed: $failed_checks${NC}"

if [ $failed_checks -eq 0 ]; then
    echo ""
    echo -e "🎉 ${GREEN}All Critical Checks Passed!${NC}"
    echo "✅ Your Google OAuth configuration appears to be correct"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. If servers are running, restart them: Ctrl+C then npm run dev"
    echo "2. Test OAuth at: http://localhost:3000/login"
    echo "3. Click 'Sign up with Google' to test the flow"
    echo ""
    echo "🔧 For production deployment:"
    echo "1. Add the same GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Render"
    echo "2. Deploy and test at: https://vevurn.onrender.com/login"
    
else
    echo ""
    echo -e "⚠️  ${YELLOW}Configuration Issues Found${NC}"
    echo "Please fix the failed checks above before proceeding."
    echo ""
    echo "🔧 Common Solutions:"
    echo "• Missing credentials: Run scripts/setup-google-oauth.sh"
    echo "• Wrong format: Ensure Client ID ends with .apps.googleusercontent.com" 
    echo "• Secret too short: Get a new secret from Google Cloud Console"
    echo "• Database issues: Check DATABASE_URL and database connectivity"
    echo ""
    echo "📚 For detailed setup instructions, see:"
    echo "   docs/troubleshooting/GOOGLE_OAUTH_FIX.md"
fi

echo ""
echo "🏁 Validation Complete"
