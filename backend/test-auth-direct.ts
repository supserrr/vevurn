import { auth } from './src/auth';

async function testAuth() {
  console.log('🧪 Testing Better Auth...');
  
  try {
    // Try to create a test user
    const result = await auth.api.signUpEmail({
      body: {
        email: 'test@vevurn.com',
        password: 'password123',
        name: 'Test User'
      }
    });
    
    console.log('✅ Sign up result:', result);
  } catch (error) {
    console.error('❌ Sign up error:', error);
  }
}

testAuth().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
});
