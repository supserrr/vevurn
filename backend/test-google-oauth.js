#!/usr/bin/env node

import https from 'https';
import { config } from 'dotenv';

console.log('🧪 Testing Google OAuth Configuration...\n');

// Load environment variables
config({ path: '.env' });

// Test 1: Check if auth endpoint responds
console.log('📡 Testing Better Auth endpoint...');
const authUrl = 'https://vevurn.onrender.com/api/auth/google';

https.get(authUrl, (res) => {
  console.log(`✅ Auth endpoint status: ${res.statusCode}`);
  console.log(`📍 Redirect location: ${res.headers.location || 'None'}`);
  
  if (res.statusCode === 302 && res.headers.location) {
    const redirectUrl = new URL(res.headers.location);
    console.log('🔗 OAuth Provider: Google');
    console.log(`📋 Client ID: ${redirectUrl.searchParams.get('client_id')}`);
    console.log(`🎯 Redirect URI: ${redirectUrl.searchParams.get('redirect_uri')}`);
    console.log(`🔐 Scopes: ${redirectUrl.searchParams.get('scope')}`);
    console.log('✅ Google OAuth redirect working correctly!');
  } else {
    console.log('❌ OAuth redirect not working as expected');
  }
}).on('error', (err) => {
  console.error('❌ Error testing auth endpoint:', err.message);
});

// Test 2: Verify environment variables
console.log('\n📋 Environment Variables Check:');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;

console.log(`✅ Google Client ID: ${googleClientId ? 'Set' : 'Missing'}`);
console.log(`✅ Google Client Secret: ${googleClientSecret ? 'Set' : 'Missing'}`);
console.log(`✅ Better Auth URL: ${betterAuthUrl || 'Missing'}`);

if (googleClientId && googleClientSecret) {
  console.log('\n🎯 Test URLs for manual verification:');
  console.log(`🔗 Google OAuth: ${betterAuthUrl}/api/auth/google`);
  console.log(`🔗 Callback URL: ${betterAuthUrl}/api/auth/callback/google`);
  console.log('\n💡 To test: Visit the Google OAuth URL in your browser');
}
