const axios = require('axios');

async function quickTest() {
  console.log('🇷🇼 MTN Rwanda Quick Connection Test');
  
  const baseUrl = 'https://sandbox.momodeveloper.mtn.co.rw';
  const primaryKey = 'fdb37d46a3594198bd75ae6f5da36a5c';
  
  try {
    console.log('Testing basic connectivity...');
    
    // Simple GET request to test connectivity
    const response = await axios.get(`${baseUrl}/collection/v1_0/account/balance`, {
      headers: {
        'Ocp-Apim-Subscription-Key': primaryKey,
        'Authorization': 'Bearer dummy-token-for-test'
      },
      timeout: 5000
    });
    
    console.log('✅ Connected successfully');
    
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log('❌ Cannot connect to MTN server - DNS issue');
    } else if (error.response) {
      console.log(`Response received: ${error.response.status} ${error.response.statusText}`);
      console.log('✅ Server is reachable');
      
      if (error.response.status === 401) {
        if (error.response.data.message?.includes('subscription key')) {
          console.log('❌ Subscription key issue');
          console.log('💡 Your keys might not be activated yet');
        } else if (error.response.data.message?.includes('token')) {
          console.log('✅ Subscription key OK, just need proper auth token');
        }
      }
    } else {
      console.log('❌ Connection failed:', error.message);
    }
  }
  
  console.log('\n📋 Account Status:');
  console.log('• Email: vevurn@gmail.com');
  console.log('• Name: Shima Serein');
  console.log('• Registration: 08/07/2025 (2 days ago)');
  console.log('• Product: Collection Widget');
  
  console.log('\n💭 Possible Issues:');
  console.log('• Account too new (might need activation time)');
  console.log('• Sandbox environment setup required');
  console.log('• API access not enabled for Collection product');
  console.log('• Keys need to be regenerated');
}

quickTest();
