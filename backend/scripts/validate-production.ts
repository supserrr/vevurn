#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * 
 * This script validates that all required environment variables
 * are properly configured for production deployment.
 */

import { getEnvironmentConfig } from '../src/config/environment.js';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateProduction() {
  log('\n🔍 Validating Production Environment Configuration...\n', colors.blue + colors.bold);
  
  try {
    const config = getEnvironmentConfig();
    
    // Check if running in production
    if (config.NODE_ENV !== 'production') {
      log(`⚠️  NODE_ENV is "${config.NODE_ENV}" (should be "production")`, colors.yellow);
    } else {
      log('✅ NODE_ENV: production', colors.green);
    }
    
    // Check required variables
    const checks = [
      { name: 'DATABASE_URL', value: config.DATABASE_URL, required: true },
      { name: 'REDIS_URL', value: config.REDIS_URL, required: true },
      { name: 'BETTER_AUTH_SECRET', value: config.BETTER_AUTH_SECRET, required: true },
      { name: 'BETTER_AUTH_URL', value: config.BETTER_AUTH_URL, required: true },
      { name: 'FRONTEND_URL', value: config.FRONTEND_URL, required: false },
      { name: 'PORT', value: config.PORT.toString(), required: false },
      { name: 'HOST', value: config.HOST, required: false },
    ];
    
    let allValid = true;
    
    for (const check of checks) {
      if (check.required && (!check.value || check.value.includes('localhost'))) {
        log(`❌ ${check.name}: Missing or contains localhost`, colors.red);
        allValid = false;
      } else if (check.value && check.value.includes('localhost')) {
        log(`⚠️  ${check.name}: Contains localhost (${check.value})`, colors.yellow);
      } else if (check.value) {
        // Mask sensitive values
        const displayValue = check.name.includes('SECRET') 
          ? '***CONFIGURED***' 
          : check.value;
        log(`✅ ${check.name}: ${displayValue}`, colors.green);
      } else {
        log(`⚠️  ${check.name}: Using default value`, colors.yellow);
      }
    }
    
    // Additional checks
    log('\n🔧 Additional Checks:', colors.blue);
    
    // Check for localhost in URLs
    const urlChecks = [
      { name: 'DATABASE_URL', url: config.DATABASE_URL },
      { name: 'REDIS_URL', url: config.REDIS_URL },
      { name: 'BETTER_AUTH_URL', url: config.BETTER_AUTH_URL },
      { name: 'FRONTEND_URL', url: config.FRONTEND_URL },
    ];
    
    for (const check of urlChecks) {
      if (check.url && check.url.includes('localhost')) {
        log(`❌ ${check.name} contains localhost: ${check.url}`, colors.red);
        allValid = false;
      }
    }
    
    // Security checks
    if (config.BETTER_AUTH_SECRET === 'dev-secret-key-not-for-production') {
      log('❌ BETTER_AUTH_SECRET is using development default!', colors.red);
      allValid = false;
    }
    
    if (config.BETTER_AUTH_SECRET && config.BETTER_AUTH_SECRET.length < 32) {
      log('⚠️  BETTER_AUTH_SECRET is shorter than recommended 32 characters', colors.yellow);
    }
    
    // Final result
    log('\n' + '='.repeat(50), colors.blue);
    if (allValid) {
      log('🎉 Production environment validation passed!', colors.green + colors.bold);
      log('✅ Ready for deployment', colors.green);
      process.exit(0);
    } else {
      log('❌ Production environment validation failed!', colors.red + colors.bold);
      log('🛠️  Please fix the issues above before deploying', colors.red);
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Environment validation failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run validation
validateProduction();
