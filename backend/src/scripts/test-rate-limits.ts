#!/usr/bin/env tsx

/**
 * Rate Limit Configuration Tester
 * Shows the new more generous rate limits
 */

console.log('🛡️ Updated Rate Limit Configuration');
console.log('=====================================');

// Simulate the rate limit configuration without requiring environment setup
const simulateRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const multiplier = isProduction ? 1 : 5;
  
  return {
    enabled: true,
    window: 60,
    max: isProduction ? 200 : 1000,
    storage: 'secondary-storage' as const,
    customRules: {
      // Authentication endpoints - MUCH more generous limits
      "/sign-in/email": {
        window: 60,
        max: 10 * multiplier,
      },
      "/sign-up/email": {
        window: 300,
        max: 10 * multiplier,
      },
      "/reset-password": {
        window: 300,
        max: 5 * multiplier,
      },
      "/forgot-password": {
        window: 300,
        max: 5 * multiplier,
      },
      "/verify-email": {
        window: 300,
        max: 10 * multiplier,
      },
      
      // Social OAuth endpoints - VERY generous limits
      "/sign-in/social/*": {
        window: 60,
        max: 30 * multiplier,
      },
      "/callback/*": {
        window: 60,
        max: 50 * multiplier,
      },
      "/oauth2callback": {
        window: 60,
        max: 50 * multiplier,
      },
      
      // Session management
      "/sign-out": {
        window: 60,
        max: 50 * multiplier,
      },
      "/session": {
        window: 60,
        max: isProduction ? 500 : 1000,
      },
      "/refresh": {
        window: 60,
        max: 200 * multiplier,
      },
    }
  };
};

const config = simulateRateLimitConfig();

console.log('\n📊 Baseline Configuration:');
console.log(`Enabled: ${config.enabled}`);
console.log(`Window: ${config.window} seconds`);
console.log(`Max requests: ${config.max} per window`);
console.log(`Storage: ${config.storage}`);

console.log('\n🔧 Custom Rules (Key Changes):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const customRules = config.customRules;

// OAuth endpoints (most important for the current issue)
console.log('\n🌐 OAuth & Social Authentication:');
console.log(`/sign-in/social/*: ${customRules['/sign-in/social/*']?.max || 'N/A'} attempts per ${customRules['/sign-in/social/*']?.window || 'N/A'} seconds`);
console.log(`/callback/*: ${customRules['/callback/*']?.max || 'N/A'} attempts per ${customRules['/callback/*']?.window || 'N/A'} seconds`);
console.log(`/oauth2callback: ${customRules['/oauth2callback']?.max || 'N/A'} attempts per ${customRules['/oauth2callback']?.window || 'N/A'} seconds`);

// User creation endpoints
console.log('\n👤 User Authentication:');
console.log(`/sign-up/email: ${customRules['/sign-up/email']?.max || 'N/A'} attempts per ${customRules['/sign-up/email']?.window || 'N/A'} seconds`);
console.log(`/sign-in/email: ${customRules['/sign-in/email']?.max || 'N/A'} attempts per ${customRules['/sign-in/email']?.window || 'N/A'} seconds`);

// Session management
console.log('\n🔐 Session Management:');
console.log(`/session: ${customRules['/session']?.max || 'N/A'} attempts per ${customRules['/session']?.window || 'N/A'} seconds`);
console.log(`/sign-out: ${customRules['/sign-out']?.max || 'N/A'} attempts per ${customRules['/sign-out']?.window || 'N/A'} seconds`);

// Other important endpoints
console.log('\n🔑 Password & Verification:');
console.log(`/reset-password: ${customRules['/reset-password']?.max || 'N/A'} attempts per ${customRules['/reset-password']?.window || 'N/A'} seconds`);
console.log(`/verify-email: ${customRules['/verify-email']?.max || 'N/A'} attempts per ${customRules['/verify-email']?.window || 'N/A'} seconds`);

console.log('\n🎯 Key Improvements Made:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ OAuth attempts: 10 → 30 per minute (3x increase)');
console.log('✅ OAuth callbacks: 20 per 5min → 50 per minute (12x increase)');
console.log('✅ User signup: 3 per hour → 10 per 5min (40x increase)');
console.log('✅ User signin: 3 per 10sec → 10 per minute (20x increase)');
console.log('✅ Baseline limit: 100 → 200 in production (2x increase)');
console.log('✅ Development multiplier: 3x → 5x (67% increase)');

console.log('\n🔥 Environment Detection:');
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Current environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`Multiplier applied: ${isProduction ? '1x' : '5x'}`);

console.log('\n🚀 Expected Results:');
console.log('• Google OAuth should work without rate limit errors');
console.log('• Users can retry authentication multiple times');
console.log('• Development and testing becomes much easier');
console.log('• Still maintains reasonable protection against abuse');

console.log('\n⚡ Next Steps:');
console.log('1. Restart the backend server to apply new limits');
console.log('2. Try Google OAuth flow - should work now!');
console.log('3. Check logs for successful user creation messages');
console.log('4. No more "unable_to_create_user" from rate limiting');

console.log('\n💡 Pro Tip:');
console.log('If you still get "unable_to_create_user", the issue is likely:');
console.log('- Missing environment variables (GOOGLE_CLIENT_ID, etc.)');
console.log('- Database validation issues (check the debug logs)');
console.log('- Terms of service validation (already disabled)');
