#!/usr/bin/env node
/**
 * Better Auth Express Integration Test
 * 
 * This script demonstrates how Better Auth works with Express middleware
 * and tests the various authentication endpoints.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test configuration
const tests = [
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Better Auth Status',
    endpoint: '/api/auth/ok',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Better Auth Demo - Public Status',
    endpoint: '/api/better-auth-demo/status',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Better Auth Demo - Protected Route (Should fail without auth)',
    endpoint: '/api/better-auth-demo/protected',
    method: 'GET',
    expectedStatus: 401
  },
  {
    name: 'Better Auth Demo - Admin Route (Should fail without auth)',
    endpoint: '/api/better-auth-demo/admin',
    method: 'GET',
    expectedStatus: 401
  },
  {
    name: 'Better Auth Demo - Staff Route (Should fail without auth)',
    endpoint: '/api/better-auth-demo/staff',
    method: 'GET',
    expectedStatus: 401
  }
];

async function runTest(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    const data = await response.json();
    
    console.log(`   Status: ${status} ${status === test.expectedStatus ? '✅' : '❌'}`);
    
    if (data.message) {
      console.log(`   Message: ${data.message}`);
    }
    
    if (data.authenticated !== undefined) {
      console.log(`   Authenticated: ${data.authenticated}`);
    }

    if (data.user) {
      console.log(`   User: ${data.user.name || data.user.email || data.user.id}`);
    }

    return status === test.expectedStatus;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Better Auth Express Integration Tests');
  console.log('=========================================');
  
  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const success = await runTest(test);
    if (success) passed++;
  }

  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Better Auth Express integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs for details.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Server is not running on port 3001');
    console.log('💡 Start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  
  await runAllTests();
}

main().catch(console.error);
