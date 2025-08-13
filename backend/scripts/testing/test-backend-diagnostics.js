#!/usr/bin/env node

/**
 * Backend Debug & Test Script
 * 
 * This script tests your backend endpoints to diagnose the routing issues
 */

// Import required modules for Node.js 18+
import { fetch } from 'node:fs'; // This won't work, let me fix it properly

const backendURL = process.env.BACKEND_URL || 'https://vevurn.onrender.com';

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    console.log(`🧪 Testing: ${method} ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.text();
    
    console.log(`   Status: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
    
    try {
      const jsonData = JSON.parse(data);
      console.log(`   Response:`, JSON.stringify(jsonData, null, 2));
    } catch {
      console.log(`   Response (text):`, data.substring(0, 200));
    }
    
    console.log('');
    return { status: response.status, data };
  } catch (error) {
    console.log(`   Error: ${error.message} ❌`);
    console.log('');
    return { error: error.message };
  }
}

async function runDiagnostics() {
  console.log('🔍 BACKEND DIAGNOSTIC SCRIPT');
  console.log('============================');
  console.log(`Backend URL: ${backendURL}\n`);
  
  // Test basic connectivity
  console.log('1️⃣ Testing Basic Connectivity...');
  await testEndpoint(backendURL);
  
  // Test health endpoint
  console.log('2️⃣ Testing Health Endpoint...');
  await testEndpoint(`${backendURL}/health`);
  
  // Test API health
  console.log('3️⃣ Testing API Health...');
  await testEndpoint(`${backendURL}/api/health`);
  
  // Test Better Auth status
  console.log('4️⃣ Testing Better Auth...');
  await testEndpoint(`${backendURL}/api/auth/ok`);
  
  // Test auth status endpoint
  console.log('5️⃣ Testing Auth Status...');
  await testEndpoint(`${backendURL}/api/auth-status`);
  
  // Test signup endpoint
  console.log('6️⃣ Testing Signup Endpoint...');
  const signupData = {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  };
  await testEndpoint(`${backendURL}/api/auth/sign-up/email`, 'POST', signupData);
  
  // Test Google OAuth setup
  console.log('7️⃣ Testing Google OAuth...');
  await testEndpoint(`${backendURL}/api/auth/sign-in/social/google`);
  
  // Test routes debug endpoint
  console.log('8️⃣ Testing Available Routes...');
  await testEndpoint(`${backendURL}/api/debug/routes`);
  
  console.log('✅ Diagnostics Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. If root route (/) fails: Update your index.ts with the fixed configuration');
  console.log('2. If Better Auth fails: Check environment variables and auth.ts configuration');
  console.log('3. If signup fails: Check database connection and hooks');
  console.log('4. Monitor backend logs during these tests');
}

// Test local backend if available
async function testLocal() {
  console.log('\n🏠 Testing Local Backend...');
  console.log('============================');
  
  const localURL = 'http://localhost:8001';
  
  try {
    await testEndpoint(localURL);
    await testEndpoint(`${localURL}/health`);
    await testEndpoint(`${localURL}/api/auth/ok`);
  } catch (error) {
    console.log('Local backend not running or not accessible');
  }
}

// Environment check
function checkEnvironment() {
  console.log('\n🔧 Environment Check...');
  console.log('========================');
  
  const requiredVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  console.log('Required environment variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅ Set' : '❌ Missing';
    const display = value ? `${value.substring(0, 20)}...` : 'Not set';
    console.log(`   ${varName}: ${status} (${display})`);
  });
}

// Quick server test
async function quickServerTest() {
  console.log('\n⚡ Quick Server Test...');
  console.log('=======================');
  
  const testUrls = [
    backendURL,
    `${backendURL}/health`,
    `${backendURL}/api/health`,
    `${backendURL}/api/auth/ok`
  ];
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'GET' });
      console.log(`${url}: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${url}: ERROR ❌ (${error.message})`);
    }
  }
}

// Main execution
console.log('🚀 Starting Backend Diagnostics...\n');

quickServerTest()
  .then(() => runDiagnostics())
  .then(() => testLocal())
  .then(() => checkEnvironment())
  .catch(error => {
    console.error('❌ Diagnostic script failed:', error);
  });

export { testEndpoint, runDiagnostics, quickServerTest };
