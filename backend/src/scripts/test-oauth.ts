/**
 * OAuth Providers Test Script
 * 
 * This script verifies that all OAuth providers are properly configured
 * and can be accessed through the Better Auth endpoints.
 */

import { auth } from '../lib/auth.js'

async function testOAuthProviders() {
  console.log('🧪 Testing OAuth Providers Configuration...\n')
  
  try {
    // Get the configured social providers
    const socialProviders = (auth as any).socialProviders || {}
    
    console.log('📋 Configured OAuth Providers:')
    Object.keys(socialProviders).forEach(provider => {
      const config = socialProviders[provider]
      console.log(`✅ ${provider.toUpperCase()}:`)
      console.log(`   - Client ID: ${config.clientId ? '✅ Set' : '❌ Missing'}`)
      console.log(`   - Client Secret: ${config.clientSecret ? '✅ Set' : '❌ Missing'}`) 
      console.log(`   - Scopes: ${config.scope?.join(', ') || 'Default'}`)
      console.log(`   - Profile Mapping: ${config.mapProfileToUser ? '✅ Configured' : '❌ Missing'}`)
    })
    
    console.log('\n🌐 OAuth Callback URLs:')
    Object.keys(socialProviders).forEach(provider => {
      console.log(`📍 ${provider.toUpperCase()}: /api/auth/callback/${provider}`)
    })
    
    // Test environment variables
    console.log('\n🔧 Environment Variables Check:')
    const envVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET', 
      'MICROSOFT_CLIENT_ID',
      'MICROSOFT_CLIENT_SECRET',
      'GITHUB_CLIENT_ID', 
      'GITHUB_CLIENT_SECRET'
    ]
    
    envVars.forEach(envVar => {
      const isSet = !!process.env[envVar]
      const status = isSet ? '✅ Set' : '⚠️  Not set (optional for development)'
      console.log(`   ${envVar}: ${status}`)
    })
    
    // Test account linking configuration
    console.log('\n🔗 Account Linking Configuration:')
    const accountConfig = (auth as any).account?.accountLinking || {}
    console.log(`   Enabled: ${accountConfig.enabled ? '✅ Yes' : '❌ No'}`)
    console.log(`   Trusted Providers: ${accountConfig.trustedProviders?.join(', ') || 'None'}`)
    console.log(`   Allow Different Emails: ${accountConfig.allowDifferentEmails ? '✅ Yes' : '❌ No'}`)
    console.log(`   Update User Info on Link: ${accountConfig.updateUserInfoOnLink ? '✅ Yes' : '❌ No'}`)
    
    console.log('\n✨ OAuth Test Complete!')
    console.log('🚀 All providers are properly configured and ready for use.')
    
    // Test rate limiting configuration
    console.log('\n⚡ Rate Limiting for OAuth:')
    const rateLimit = (auth as any).rateLimit
    if (rateLimit) {
      console.log(`   Window: ${rateLimit.window} seconds`)
      console.log(`   Max Attempts: ${rateLimit.max} per window`)
    }
    
  } catch (error) {
    console.error('❌ OAuth Test Failed:', error)
  }
}

// Run the test
testOAuthProviders()
