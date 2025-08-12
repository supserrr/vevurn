#!/usr/bin/env tsx

/**
 * OAuth Debug Test Script
 * 
 * This script helps debug OAuth issues by:
 * 1. Checking environment variables
 * 2. Testing database connections
 * 3. Validating Google OAuth configuration
 * 4. Testing rate limiting settings
 */

import { config } from '../config/environment.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOAuthConfiguration() {
  console.log('🔍 OAuth Configuration Debug');
  console.log('================================');
  
  // Check Google OAuth environment variables
  console.log('\n📋 Environment Variables:');
  console.log(`GOOGLE_CLIENT_ID: ${config.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${config.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`BETTER_AUTH_URL: ${config.BETTER_AUTH_URL}`);
  console.log(`BETTER_AUTH_SECRET: ${config.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`NODE_ENV: ${config.NODE_ENV}`);
  
  // Test database connection
  console.log('\n🗄️ Database Connection:');
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test users table
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test accounts table (for OAuth)
    const accountCount = await prisma.account.count();
    console.log(`🔗 OAuth accounts in database: ${accountCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  
  // Check rate limiting configuration
  console.log('\n⏱️ Rate Limiting:');
  const isProduction = config.NODE_ENV === 'production';
  const signUpLimit = isProduction ? 3 : 9; // From rate-limit-config.ts
  console.log(`Sign-up attempts allowed per hour: ${signUpLimit}`);
  console.log(`Current environment: ${isProduction ? 'Production' : 'Development'}`);
  
  // OAuth URL test
  console.log('\n🌐 OAuth URLs:');
  const baseUrl = config.BETTER_AUTH_URL;
  console.log(`Google OAuth redirect URL: ${baseUrl}/api/auth/callback/google`);
  console.log(`Google sign-in URL: ${baseUrl}/api/auth/sign-in/social/google`);
  
  // Test user creation validation
  console.log('\n🔬 Testing User Creation Validation:');
  
  // Simulate OAuth user data
  const testOAuthUser = {
    email: 'test@gmail.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'cashier',
    provider: 'google'
  };
  
  console.log('OAuth user data structure:', JSON.stringify(testOAuthUser, null, 2));
  
  // Clean up
  await prisma.$disconnect();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Try OAuth flow and check logs for detailed error information');
  console.log('2. Monitor console for "🔍 OAuth user creation attempt" messages');
  console.log('3. Look for rate limiting messages in logs');
  console.log('4. Check if terms of service validation is causing issues');
  
  console.log('\n🚀 Debug logging is now active. Try OAuth again!');
}

// Run the test
testOAuthConfiguration().catch(console.error);
