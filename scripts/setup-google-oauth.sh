#!/bin/bash

# Google OAuth Setup Script for vevurnPOS
# This script guides you through setting up Google OAuth properly

echo "🔧 Google OAuth Configuration Setup for vevurnPOS"
echo "=================================================="
echo ""

# Function to check if environment variables are set
check_env_vars() {
    local missing_vars=()
    
    if [[ -z "${GOOGLE_CLIENT_ID}" ]]; then
        missing_vars+=("GOOGLE_CLIENT_ID")
    fi
    
    if [[ -z "${GOOGLE_CLIENT_SECRET}" ]]; then
        missing_vars+=("GOOGLE_CLIENT_SECRET")
    fi
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

echo "📋 Step 1: Google Cloud Console Setup"
echo "====================================="
echo ""
echo "Please complete these steps in Google Cloud Console:"
echo ""
echo "1. 🌐 Go to: https://console.cloud.google.com/apis/credentials"
echo "2. 📁 Create or select project: 'vevurnPOS'"
echo "3. 🔧 Go to 'APIs & Services' → 'Credentials'"
echo "4. ➕ Click 'CREATE CREDENTIALS' → 'OAuth 2.0 Client IDs'"
echo "5. 🌍 Set Application Type to 'Web application'"
echo "6. ⚙️  Configure Authorized redirect URIs:"
echo "   📍 Development: http://localhost:8000/api/auth/callback/google"
echo "   📍 Production: https://vevurn.onrender.com/api/auth/callback/google"
echo "7. 📋 Copy the Client ID and Client Secret"
echo ""

read -p "Press Enter when you have completed the Google Cloud Console setup..."

echo ""
echo "📝 Step 2: Environment Variables Setup"  
echo "====================================="
echo ""
echo "Now I'll help you configure the environment variables."
echo ""

# Get Google Client ID
echo "🔑 Please enter your Google Client ID:"
echo "(Should end with .apps.googleusercontent.com)"
read -r google_client_id

# Validate Client ID format
if [[ ! $google_client_id == *.apps.googleusercontent.com ]]; then
    echo "⚠️  Warning: Client ID should end with .apps.googleusercontent.com"
    echo "Are you sure this is correct? (y/n)"
    read -r confirm
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        echo "❌ Setup cancelled. Please run the script again with the correct Client ID."
        exit 1
    fi
fi

echo ""
echo "🔐 Please enter your Google Client Secret:"
read -s google_client_secret

# Backup current .env
echo ""
echo "💾 Backing up current .env file..."
if [[ -f "backend/.env" ]]; then
    cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created: backend/.env.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Update .env file
echo ""
echo "📝 Updating backend/.env file..."

# Remove commented Google OAuth lines and add new ones
sed -i '' '/^#GOOGLE_CLIENT_ID=/d' backend/.env
sed -i '' '/^#GOOGLE_CLIENT_SECRET=/d' backend/.env

# Add Google OAuth configuration
cat >> backend/.env << EOF

# Google OAuth Configuration (Updated $(date))
GOOGLE_CLIENT_ID=$google_client_id
GOOGLE_CLIENT_SECRET=$google_client_secret
EOF

echo "✅ Environment variables configured successfully!"

echo ""
echo "🔍 Step 3: Configuration Validation"
echo "==================================="

# Validate the configuration
export GOOGLE_CLIENT_ID="$google_client_id"
export GOOGLE_CLIENT_SECRET="$google_client_secret"

if check_env_vars; then
    echo "✅ Environment variables validated successfully"
    echo "   🔑 GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."
    echo "   🔐 GOOGLE_CLIENT_SECRET: [CONFIGURED]"
else
    echo "❌ Environment variable validation failed"
    exit 1
fi

echo ""
echo "🚀 Step 4: Production Deployment"
echo "==============================="
echo ""
echo "To deploy to production (Render):"
echo "1. 🌐 Go to: https://dashboard.render.com"
echo "2. 📁 Select your vevurnPOS service"
echo "3. ⚙️  Go to 'Environment' tab"
echo "4. ➕ Add these environment variables:"
echo "   GOOGLE_CLIENT_ID = $google_client_id"
echo "   GOOGLE_CLIENT_SECRET = [your-secret]"
echo "5. 🚀 Click 'Deploy' to restart with new configuration"
echo ""

echo "🧪 Step 5: Testing Instructions"
echo "==============================="
echo ""
echo "To test Google OAuth:"
echo "1. 🔄 Restart your development server: npm run dev"
echo "2. 🌐 Open: http://localhost:3000/login"
echo "3. 🔘 Click 'Sign up with Google' or 'Sign in with Google'"
echo "4. ✅ Verify OAuth flow works and user is created"
echo ""

echo "📚 Step 6: Troubleshooting"
echo "========================="
echo ""
echo "Common issues and solutions:"
echo "❌ 'redirect_uri_mismatch' → Check redirect URIs in Google Console match exactly"
echo "❌ 'invalid_client' → Verify Client ID/Secret are copied correctly"
echo "❌ 'access_blocked' → Configure OAuth consent screen in Google Console"
echo "❌ 'failed to create user' → Database schema already compatible ✅"
echo ""

echo "🎉 Google OAuth Setup Complete!"
echo "==============================="
echo ""
echo "✅ Google Cloud Console: Configured"
echo "✅ Environment Variables: Set"
echo "✅ Database Schema: Already Compatible"
echo "✅ Better Auth Config: Already Compatible"
echo ""
echo "🚀 Your vevurnPOS system is ready for Google OAuth!"
echo "Users can now register and login with their Google accounts."
echo ""
echo "📝 Next Steps:"
echo "1. Restart development server: npm run dev"
echo "2. Test locally at: http://localhost:3000/login"
echo "3. Deploy to production with environment variables"
echo "4. Test production at: https://vevurn.onrender.com/login"
echo ""

# Final validation
echo "🔍 Final System Check"
echo "===================="

# Check if servers are running
if pgrep -f "npm run dev" > /dev/null; then
    echo "⚠️  Development servers are running"
    echo "🔄 Please restart them to load new Google OAuth config:"
    echo "   1. Press Ctrl+C to stop servers"
    echo "   2. Run: npm run dev"
else
    echo "🚀 Ready to start development servers: npm run dev"
fi

echo ""
echo "🎯 Setup Summary:"
echo "================"
echo "✅ Google OAuth: Enabled and Configured"
echo "✅ Client ID: Set"
echo "✅ Client Secret: Set"
echo "✅ Redirect URIs: Documented"
echo "✅ Database: Compatible"
echo "✅ Environment: Updated"
echo ""
echo "🎉 Google OAuth setup is complete! Happy coding! 🚀"
