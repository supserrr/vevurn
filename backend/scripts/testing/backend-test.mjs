// Simple Backend Test Script
// Run with: node backend-test.mjs

const BASE_URL = 'http://localhost:8001';

// Test function
async function testEndpoint(url, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing: ${method} ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
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
      console.log(`   Response:`, JSON.stringify(jsonData, null, 2).substring(0, 200) + '...');
    } catch {
      console.log(`   Response:`, data.substring(0, 100) + '...');
    }
    
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Backend API Tests');
  console.log('===================');
  
  const tests = [
    // Basic endpoints
    { url: `${BASE_URL}/`, name: 'Root' },
    { url: `${BASE_URL}/health`, name: 'Health' },
    { url: `${BASE_URL}/api/health`, name: 'API Health' },
    
    // Auth endpoints
    { url: `${BASE_URL}/api/auth-status`, name: 'Auth Status' },
    
    // API endpoints
    { url: `${BASE_URL}/api/users`, name: 'Users' },
    { url: `${BASE_URL}/api/products`, name: 'Products' },
    { url: `${BASE_URL}/api/categories`, name: 'Categories' },
    { url: `${BASE_URL}/api/sales`, name: 'Sales' },
    { url: `${BASE_URL}/api/customers`, name: 'Customers' },
    { url: `${BASE_URL}/api/suppliers`, name: 'Suppliers' },
    { url: `${BASE_URL}/api/loans`, name: 'Loans' },
    { url: `${BASE_URL}/api/reports`, name: 'Reports' },
    { url: `${BASE_URL}/api/settings`, name: 'Settings' },
    
    // Debug endpoint
    { url: `${BASE_URL}/api/debug/routes`, name: 'Debug Routes' },
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.url);
    if (success) passed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results');
  console.log('===============');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    console.log('💡 Make sure your backend server is running on http://localhost:8001');
  }
}

// Test specific endpoint functionality
async function testPostEndpoints() {
  console.log('\n🔧 Testing POST Endpoints');
  console.log('=========================');
  
  // Test user creation
  await testEndpoint(`${BASE_URL}/api/users`, 'POST', {
    name: 'Test User',
    email: 'test@example.com'
  });
  
  // Test settings update
  await testEndpoint(`${BASE_URL}/api/settings`, 'PUT', {
    theme: 'dark',
    language: 'en'
  });
  
  // Test signup
  await testEndpoint(`${BASE_URL}/api/test/signup`, 'POST', {
    email: 'test@example.com',
    password: 'testpassword',
    firstName: 'Test',
    lastName: 'User'
  });
}

// Run all tests
console.log('Starting backend tests...');
console.log('Make sure your backend server is running first!');
console.log('Command: pnpm run --filter=@vevurn/backend dev\n');

runTests()
  .then(() => testPostEndpoints())
  .then(() => {
    console.log('\n✅ All tests completed!');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
  });
