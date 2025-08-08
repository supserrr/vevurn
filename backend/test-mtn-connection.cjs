const axios = require('axios');

// MTN Rwanda Configuration
const MOMO_BASE_URL = "https://sandbox.momodeveloper.mtn.co.rw";
const SUBSCRIPTION_KEY = "fdb37d46a3594198bd75ae6f5da36a5c";
const API_USER = "37160397-d97c-48ba-bcf1-beb5ec6770a8";

class MTNTester {
  async testConnection() {
    console.log('🇷🇼 Testing MTN Rwanda Mobile Money Connection\n');
    
    try {
      // Test 1: Create API User (might already exist)
      console.log('1. 👤 Testing API User Creation...');
      await this.createApiUser();
      
      // Test 2: Generate API Key
      console.log('2. 🔑 Testing API Key Generation...');
      await this.generateApiKey();
      
      // Test 3: Test Token Generation
      console.log('3. 🎫 Testing OAuth Token...');
      await this.testTokenGeneration();
      
      console.log('\n✅ MTN Rwanda integration test completed!');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  }
  
  async createApiUser() {
    try {
      const response = await axios.post(
        `${MOMO_BASE_URL}/v1_0/apiuser`,
        {
          providerCallbackHost: "webhook.site"
        },
        {
          headers: {
            'X-Reference-Id': API_USER,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ API User created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ✅ API User already exists (good!)');
      } else {
        throw error;
      }
    }
  }
  
  async generateApiKey() {
    try {
      const response = await axios.post(
        `${MOMO_BASE_URL}/v1_0/apiuser/${API_USER}/apikey`,
        {},
        {
          headers: {
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
          }
        }
      );
      
      const apiKey = response.data.apiKey;
      console.log('   ✅ API Key generated successfully');
      console.log(`   🔑 API Key: ${apiKey.substring(0, 8)}...`);
      
      // Save to a temp variable for token test
      this.apiKey = apiKey;
      return apiKey;
      
    } catch (error) {
      console.log('   ⚠️  API Key generation failed (might need manual setup)');
      console.log('   📝 Check MTN Developer Portal for API Key');
      throw error;
    }
  }
  
  async testTokenGeneration() {
    if (!this.apiKey) {
      console.log('   ⚠️  Skipping token test - no API Key available');
      return;
    }
    
    try {
      const credentials = Buffer.from(`${API_USER}:${this.apiKey}`).toString('base64');
      
      const response = await axios.post(
        `${MOMO_BASE_URL}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
          }
        }
      );
      
      console.log('   ✅ OAuth token generated successfully');
      console.log('   🎫 Token received and valid');
      
    } catch (error) {
      console.log('   ⚠️  Token generation test failed');
      throw error;
    }
  }
}

// Run the test
const tester = new MTNTester();
tester.testConnection();
