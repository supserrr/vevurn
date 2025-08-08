#!/usr/bin/env node

/**
 * OAuth Configuration Testing Utility for Vevurn POS
 * 
 * This script tests OAuth provider configurations and validates settings.
 * Run with: npm run test:oauth
 */

import dotenv from 'dotenv'
import { auth } from '../src/lib/auth.js'

// Load environment variables
dotenv.config()

interface OAuthProvider {
  name: string
  clientIdEnv: string
  clientSecretEnv: string
  requiredScopes: string[]
  callbackUrl: string
}

const providers: OAuthProvider[] = [
  {
    name: 'Google',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    requiredScopes: ['email', 'profile'],
    callbackUrl: '/api/auth/callback/google'
  },
  {
    name: 'Microsoft',
    clientIdEnv: 'MICROSOFT_CLIENT_ID', 
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
    requiredScopes: ['openid', 'profile', 'email'],
    callbackUrl: '/api/auth/callback/microsoft'
  },
  {
    name: 'GitHub',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    requiredScopes: ['user:email'],
    callbackUrl: '/api/auth/callback/github'
  }
]

const testOAuthConfiguration = async () => {
  console.log('🔐 Testing Vevurn POS OAuth Configuration...\n')

  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:8000'
  let configuredProviders = 0
  let totalProviders = 0

  for (const provider of providers) {
    totalProviders++
    console.log(`📋 Checking ${provider.name} OAuth Configuration...`)

    const clientId = process.env[provider.clientIdEnv]
    const clientSecret = process.env[provider.clientSecretEnv]

    if (!clientId || !clientSecret) {
      console.log(`⚠️  ${provider.name}: Missing credentials`)
      console.log(`   Set ${provider.clientIdEnv} and ${provider.clientSecretEnv} in .env file`)
      console.log(`   Callback URL: ${baseUrl}${provider.callbackUrl}`)
      console.log('')
      continue
    }

    configuredProviders++
    console.log(`✅ ${provider.name}: Credentials configured`)
    
    // Validate client ID format
    const isValidClientId = validateClientIdFormat(provider.name.toLowerCase(), clientId)
    if (isValidClientId) {
      console.log(`✅ ${provider.name}: Client ID format valid`)
    } else {
      console.log(`⚠️  ${provider.name}: Client ID format may be incorrect`)
    }

    console.log(`📍 ${provider.name}: Callback URL - ${baseUrl}${provider.callbackUrl}`)
    console.log(`🔍 ${provider.name}: Required scopes - ${provider.requiredScopes.join(', ')}`)
    console.log('')
  }

  // Summary
  console.log('📊 Configuration Summary:')
  console.log(`   Configured Providers: ${configuredProviders}/${totalProviders}`)
  console.log(`   Base URL: ${baseUrl}`)
  console.log(`   Better Auth Secret: ${process.env.BETTER_AUTH_SECRET ? 'Set' : 'Missing'}`)

  if (configuredProviders === 0) {
    console.log('\n❌ No OAuth providers configured!')
    console.log('   Please set up at least one OAuth provider to enable social authentication.')
    console.log('   See docs/OAUTH_SETUP_GUIDE.md for detailed setup instructions.')
  } else if (configuredProviders < totalProviders) {
    console.log('\n⚠️  Partial OAuth configuration detected.')
    console.log('   Consider configuring all providers for maximum user flexibility.')
  } else {
    console.log('\n✅ All OAuth providers configured!')
    console.log('   Your system is ready for social authentication.')
  }

  // Test Better Auth configuration
  console.log('\n🧪 Testing Better Auth Configuration...')
  try {
    // Just check if auth object can be created (basic validation)
    const authKeys = Object.keys(auth)
    console.log(`✅ Better Auth initialized successfully`)
    console.log(`   Available endpoints: ${authKeys.length > 0 ? 'Yes' : 'No'}`)
  } catch (error) {
    console.log(`❌ Better Auth configuration error:`, error)
  }

  // Generate test authorization URLs
  if (configuredProviders > 0) {
    console.log('\n🔗 Test Authorization URLs:')
    console.log('   Use these URLs to manually test OAuth flows:')
    
    for (const provider of providers) {
      const clientId = process.env[provider.clientIdEnv]
      if (clientId) {
        const testUrl = generateTestAuthUrl(provider, clientId, baseUrl)
        console.log(`   ${provider.name}: ${testUrl}`)
      }
    }
    
    console.log('\n💡 To test:')
    console.log('   1. Copy a URL above and visit it in your browser')
    console.log('   2. Complete the OAuth flow')
    console.log('   3. Check if you\'re redirected back successfully')
  }

  console.log('\n🎉 OAuth configuration testing completed!')
}

const validateClientIdFormat = (provider: string, clientId: string): boolean => {
  switch (provider) {
    case 'google':
      return clientId.includes('.apps.googleusercontent.com')
    case 'microsoft':
      // Microsoft client IDs are typically UUIDs
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
    case 'github':
      // GitHub client IDs are typically alphanumeric
      return /^[a-z0-9]+$/i.test(clientId) && clientId.length >= 16
    default:
      return true
  }
}

const generateTestAuthUrl = (provider: OAuthProvider, clientId: string, baseUrl: string): string => {
  const redirectUri = encodeURIComponent(`${baseUrl}${provider.callbackUrl}`)
  const scopes = encodeURIComponent(provider.requiredScopes.join(' '))
  const state = 'test-' + Math.random().toString(36).substring(7)

  switch (provider.name.toLowerCase()) {
    case 'google':
      return `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${state}&access_type=offline&prompt=consent`
    
    case 'microsoft':
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&response_mode=query`
    
    case 'github':
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`
    
    default:
      return `# No test URL generator for ${provider.name}`
  }
}

// Run the test
testOAuthConfiguration().catch(error => {
  console.error('💥 OAuth configuration test failed:', error)
  process.exit(1)
})
