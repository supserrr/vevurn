#!/bin/bash

# Quick Development Startup Script
echo "🚀 Starting Vevurn Development Servers"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}Starting Backend on http://localhost:8001${NC}"
echo "Opening new terminal tab for backend..."

# Start backend in new terminal
osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/backend && echo \"🔧 Starting Backend Server...\" && npm run dev"'

sleep 2

echo ""
echo -e "${BLUE}Starting Frontend on http://localhost:3000${NC}"
echo "Opening new terminal tab for frontend..."

# Start frontend in new terminal  
osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/frontend && echo \"🎨 Starting Frontend Server...\" && npm run dev"'

echo ""
echo -e "${GREEN}✅ Development servers starting in separate terminal tabs${NC}"
echo ""
echo -e "${YELLOW}📋 Testing URLs:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Backend: http://localhost:8001"
echo "• Login Page: http://localhost:3000/login"
echo ""
echo -e "${YELLOW}🧪 Test Both Signup Methods:${NC}"
echo "1. Email/Password signup (should work without 'firstname is required')"
echo "2. Google OAuth signup (should work without 'unable_to_create_user')"
echo ""
echo -e "${YELLOW}🔍 Check logs in the new terminal tabs for detailed debugging info${NC}"
