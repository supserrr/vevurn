const axios = require('axios');

// Test different MTN endpoints and configurations
const configs = [
  {
    name: "MTN Rwanda Collection API",
    baseUrl: "https://sandbox.momodeveloper.mtn.co.rw",
    subscriptionKey: "fdb37d46a3594198bd75ae6f5da36a5c"
  },
  {
    name: "MTN Rwanda Alternative",
    baseUrl: "https://sandbox.momodeveloper.mtn.co.rw/collection",
    subscriptionKey: "fdb37d46a3594198bd75ae6f5da36a5c"
  }
];

const API_USER = "37160397-d97c-48ba-bcf1-beb5ec6770a8";

async function testMTNEndpoints() {
  console.log('🇷🇼 MTN Rwanda API Endpoint Testing\n');
  
  for (const config of configs) {
    console.log(`Testing: ${config.name}`);
    console.log(`URL: ${config.baseUrl}`);
    
    try {
      // Test creating API user
      const response = await axios.post(
        `${config.baseUrl}/v1_0/apiuser`,
        {
          providerCallbackHost: "webhook.site"
        },
        {
          headers: {
            'X-Reference-Id': API_USER,
            'Ocp-Apim-Subscription-Key': config.subscriptionKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('✅ Success! Status:', response.status);
      console.log('✅ API User creation endpoint works');
      break;
      
    } catch (error) {
      console.log('❌ Failed with error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    console.log('─'.repeat(50));
  }
  
  // Test secondary key
  console.log('\n🔄 Testing with Secondary Key...');
  try {
    const response = await axios.post(
      `https://sandbox.momodeveloper.mtn.co.rw/v1_0/apiuser`,
      {
        providerCallbackHost: "webhook.site"
      },
      {
        headers: {
          'X-Reference-Id': API_USER,
          'Ocp-Apim-Subscription-Key': "f007a3e266834b3b9eda9a834af6f193", // Secondary key
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Secondary key works! Status:', response.status);
    
  } catch (error) {
    console.log('❌ Secondary key failed:', error.response?.status, error.response?.data?.message || error.message);
  }
  
  // Check what subscription keys we have
  console.log('\n📋 Subscription Details:');
  console.log('Primary Key: fdb37d46a3594198bd75ae6f5da36a5c');
  console.log('Secondary Key: f007a3e266834b3b9eda9a834af6f193');
  console.log('Account: vevurn@gmail.com');
  console.log('Product: vevurn (Collection Widget)');
  
  console.log('\n💡 Next Steps:');
  console.log('1. Verify your MTN Developer Portal subscription is active');
  console.log('2. Check if Collection API is enabled for your account');
  console.log('3. Try using the MTN Developer Portal directly to test');
  console.log('4. Contact MTN Rwanda support if keys are not working');
}

testMTNEndpoints();
