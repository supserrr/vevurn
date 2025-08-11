#!/bin/bash
# URL Configuration Validation Script
# Validates all environment configurations match the correct URLs

echo "🔍 Validating URL Configuration Updates..."
echo "=========================================="
echo ""

# Define correct URLs
CORRECT_BACKEND_URL="https://vevurn.onrender.com"
CORRECT_FRONTEND_URL="https://vevurn.vercel.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_passed=0
check_failed=0

# Function to check file for old URLs
check_file() {
    local file="$1"
    local description="$2"
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  File not found: $file${NC}"
        return
    fi
    
    old_backend=$(grep -c "vevurn-backend.onrender.com" "$file" 2>/dev/null || echo "0")
    old_frontend=$(grep -c "vevurn-frontend.onrender.com" "$file" 2>/dev/null || echo "0")
    new_backend=$(grep -c "vevurn.onrender.com" "$file" 2>/dev/null || echo "0")
    new_frontend=$(grep -c "vevurn.vercel.app" "$file" 2>/dev/null || echo "0")
    
    if [ "$old_backend" -gt 0 ] || [ "$old_frontend" -gt 0 ]; then
        echo -e "${RED}❌ $description${NC}"
        echo "   File: $file"
        if [ "$old_backend" -gt 0 ]; then
            echo "   Found $old_backend instances of old backend URL"
        fi
        if [ "$old_frontend" -gt 0 ]; then
            echo "   Found $old_frontend instances of old frontend URL"
        fi
        ((check_failed++))
    else
        echo -e "${GREEN}✅ $description${NC}"
        ((check_passed++))
    fi
}

# Check environment files
echo -e "${BLUE}📁 Checking Environment Files...${NC}"
check_file "backend/.env" "Backend Environment (.env)"
check_file "backend/.env.production" "Backend Production Environment"
check_file "frontend/.env.local" "Frontend Local Environment"
check_file "frontend/.env.example" "Frontend Environment Template"

# Check configuration files
echo ""
echo -e "${BLUE}⚙️  Checking Configuration Files...${NC}"
check_file "frontend/next.config.js" "Next.js Configuration"
check_file "render.yaml" "Main Render Configuration"

# Check documentation
echo ""
echo -e "${BLUE}📚 Checking Documentation...${NC}"
check_file "docs/deployment/DEPLOYMENT.md" "Deployment Documentation"
check_file "docs/deployment/DEPLOYMENT_CHECKLIST.md" "Deployment Checklist"
check_file "docs/deployment/DEPLOYMENT_FRONTEND.md" "Frontend Deployment Guide"
check_file "docs/deployment/RENDER_DEPLOYMENT.md" "Render Deployment Guide"
check_file "docs/deployment/RENDER_DEPLOYMENT_COMPLETE.md" "Render Deployment Complete"

# Check render configurations
echo ""
echo -e "${BLUE}🔧 Checking Render Configuration Files...${NC}"
check_file "docs/deployment/render/render.yaml" "Main Render Blueprint"
check_file "docs/deployment/render/render-backend.yaml" "Backend Render Blueprint"
check_file "docs/deployment/render/render-frontend.yaml" "Frontend Render Blueprint"
check_file "docs/deployment/render/render-simple.yaml" "Simple Render Blueprint"
check_file "docs/deployment/render/render-frontend-only.yaml" "Frontend-only Blueprint"

# Check source code
echo ""
echo -e "${BLUE}💻 Checking Source Code...${NC}"
check_file "backend/src/demo-server.ts" "Demo Server Configuration"
check_file "frontend/app/api/auth/[...all]/route.ts" "Frontend Auth Route Handler"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Passed: $check_passed${NC}"
if [ "$check_failed" -gt 0 ]; then
    echo -e "${RED}❌ Failed: $check_failed${NC}"
    echo ""
    echo -e "${RED}⚠️  Some files still contain old URLs. Please review and update them.${NC}"
    exit 1
else
    echo -e "${RED}❌ Failed: $check_failed${NC}"
    echo ""
    echo -e "${GREEN}🎉 All URL configurations are correct!${NC}"
    echo ""
    echo -e "${BLUE}📋 Current URL Configuration:${NC}"
    echo "   Backend API: $CORRECT_BACKEND_URL"
    echo "   Frontend:    $CORRECT_FRONTEND_URL"
    echo ""
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo "   1. Update your deployment environment variables"
    echo "   2. Update OAuth redirect URLs in Google Console"
    echo "   3. Test the application with new URLs"
    echo "   4. Monitor deployment logs for any issues"
fi
