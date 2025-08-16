// frontend/test-auth-connection.js
// Simple test file to verify auth connection - delete after testing

const BACKEND_URL = 'http://localhost:8000';

async function testAuthConnection() {
  console.log('🧪 Testing auth connection...');
  
  try {
    // Test basic server connection
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend server is reachable');
    }
    
    // Test auth endpoint
    const authResponse = await fetch(`${BACKEND_URL}/api/auth/session`, {
      credentials: 'include'
    });
    
    if (authResponse.ok) {
      const data = await authResponse.json();
      console.log('✅ Auth endpoint is working:', data);
    } else {
      console.log('ℹ️ Auth endpoint returned:', authResponse.status, await authResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testAuthConnection();
}

export { testAuthConnection };
