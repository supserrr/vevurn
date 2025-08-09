#!/bin/bash

# Script to generate a secure BETTER_AUTH_SECRET
echo "Generating secure BETTER_AUTH_SECRET..."

# Generate a 64-character random string
SECRET=$(openssl rand -hex 32)

echo ""
echo "🔐 Your BETTER_AUTH_SECRET:"
echo "BETTER_AUTH_SECRET=\"$SECRET\""
echo ""
echo "Add this to your .env file!"
echo ""

# Also create a Node.js version for those who prefer it
echo "Or run this in Node.js:"
echo "console.log('BETTER_AUTH_SECRET=\"' + require('crypto').randomBytes(32).toString('hex') + '\"')"
