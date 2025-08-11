#!/bin/bash

# Google OAuth Credentials Check and Fix
# This script helps identify and fix Google OAuth configuration issues

echo "🔍 Google OAuth Configuration Status Check"
echo "========================================"

# Check if running from correct directory
if [ ! -f "backend/.env" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check current credentials in backend/.env
echo "📋 Current Credentials Status:"
echo "----------------------------"

GOOGLE_CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" backend/.env | cut -d'=' -f2 | tr -d '"')
GOOGLE_CLIENT_SECRET=$(grep "GOOGLE_CLIENT_SECRET=" backend/.env | cut -d'=' -f2 | tr -d '"')

echo "Google Client ID: ${GOOGLE_CLIENT_ID}"

if [ "$GOOGLE_CLIENT_ID" = "your-google-client-id.apps.googleusercontent.com" ]; then
    echo "❌ Using placeholder Google Client ID"
    NEEDS_SETUP=true
else
    echo "✅ Custom Google Client ID configured"
fi

if [ "$GOOGLE_CLIENT_SECRET" = "your-google-client-secret" ]; then
    echo "❌ Using placeholder Google Client Secret"
    NEEDS_SETUP=true
else
    echo "✅ Custom Google Client Secret configured"
fi

echo ""

if [ "$NEEDS_SETUP" = "true" ]; then
    echo "🔧 Google OAuth Setup Required"
    echo "=============================="
    echo ""
    echo "Options:"
    echo "1. 🚀 Set up Google OAuth (recommended)"
    echo "2. 🚫 Temporarily disable Google OAuth"
    echo ""
    read -p "Choose option (1 or 2): " choice
    
    case $choice in
        1)
            echo ""
            echo "📚 Setting up Google OAuth:"
            echo "1. Go to: https://console.cloud.google.com/"
            echo "2. Create or select project: 'vevurnPOS'"
            echo "3. Enable Google+ API"
            echo "4. Create OAuth 2.0 Client ID"
            echo "5. Add redirect URIs:"
            echo "   - https://vevurn.onrender.com/api/auth/callback/google"
            echo "   - http://localhost:8000/api/auth/callback/google"
            echo "6. Copy Client ID and Secret"
            echo "7. Update backend/.env file"
            echo "8. Add to Render environment variables"
            echo ""
            echo "📖 Full guide: docs/troubleshooting/GOOGLE_OAUTH_FIX.md"
            ;;
        2)
            echo ""
            echo "🚫 Temporarily disabling Google OAuth..."
            
            # Backup current .env
            cp backend/.env backend/.env.backup
            
            # Comment out Google OAuth credentials
            sed -i '' 's/^GOOGLE_CLIENT_ID=/#GOOGLE_CLIENT_ID=/' backend/.env
            sed -i '' 's/^GOOGLE_CLIENT_SECRET=/#GOOGLE_CLIENT_SECRET=/' backend/.env
            
            echo "✅ Google OAuth disabled in backend/.env"
            echo "📝 Backup created: backend/.env.backup"
            echo "🔄 Restart development server to apply changes"
            echo ""
            echo "ℹ️  Users can still register with email/password"
            echo "🔧 Run this script again later to enable Google OAuth"
            ;;
        *)
            echo "❌ Invalid option selected"
            exit 1
            ;;
    esac
else
    echo "✅ Google OAuth appears to be properly configured!"
    echo "🔄 If still having issues, check:"
    echo "   - Redirect URIs in Google Console match exactly"
    echo "   - Production environment variables in Render"
    echo "   - OAuth consent screen configuration"
fi

echo ""
echo "🏁 Done!"
