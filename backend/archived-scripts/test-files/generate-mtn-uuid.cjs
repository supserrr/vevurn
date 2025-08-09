const { v4: uuidv4 } = require('uuid');

// Generate API User UUID for MTN Rwanda
const apiUser = uuidv4();

console.log('🇷🇼 MTN Rwanda Mobile Money - API Credentials');
console.log('='.repeat(50));
console.log(`API User ID: ${apiUser}`);
console.log(`Subscription Key: fdb37d46a3594198bd75ae6f5da36a5c`);
console.log(`Base URL: https://sandbox.momodeveloper.mtn.co.rw/collection`);
console.log('='.repeat(50));

console.log('\n📋 Manual Setup Steps:');
console.log('1. Copy the API User ID above');
console.log('2. Update your .env file with this API User');
console.log('3. Use MTN portal or API to generate API Key');
console.log('\n✅ Ready to configure your environment!');
