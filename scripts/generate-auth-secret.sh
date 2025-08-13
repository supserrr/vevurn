#!/bin/bash

# Generate Better Auth Secret Script
echo "🔐 Generating Better Auth Secret..."

# Generate a secure 32-character secret
AUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo "✅ Generated Better Auth Secret:"
echo "BETTER_AUTH_SECRET=$AUTH_SECRET"
echo ""
echo "📋 Add this to your .env file:"
echo "sed -i '' 's/BETTER_AUTH_SECRET=.*/BETTER_AUTH_SECRET=$AUTH_SECRET/' backend/.env"
echo ""
echo "🔄 Or manually update backend/.env with:"
echo "BETTER_AUTH_SECRET=$AUTH_SECRET"
