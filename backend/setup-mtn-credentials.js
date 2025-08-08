#!/usr/bin/env node

/**
 * MTN Rwanda API User Setup Script
 * This script creates the API user and API key required for MTN Mobile Money integration
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configuration from .env file
const MOMO_BASE_URL = "https://sandbox.momodeveloper.mtn.co.rw";
const SUBSCRIPTION_KEY = "fdb37d46a3594198bd75ae6f5da36a5c";

class MTNSetup {
  constructor() {
    this.referenceId = uuidv4();
    this.apiUser = null;
    this.apiKey = null;
  }

  async setup() {
    console.log('🇷🇼 MTN Rwanda API Setup - Generating Credentials\n');
    
    try {
      await this.createApiUser();
      await this.generateApiKey();
      await this.updateEnvFile();
      
      console.log('✅ MTN Rwanda API setup completed successfully!');
      console.log('\nCredentials generated:');
      console.log(`API User: ${this.apiUser}`);
      console.log(`API Key: ${this.apiKey.substring(0, 8)}...`);
      console.log('\n🔥 Your .env file has been updated with the credentials!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }
  }

  async createApiUser() {
    console.log('👤 Creating API User...');
    
    try {
      const response = await axios.post(
        `${MOMO_BASE_URL}/v1_0/apiuser`,
        {
          providerCallbackHost: "webhook.site" // Temporary callback for setup
        },
        {
          headers: {
            'X-Reference-Id': this.referenceId,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        this.apiUser = this.referenceId;
        console.log('✅ API User created successfully');
        console.log(`   API User ID: ${this.apiUser}`);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  API User already exists, using existing one');
        this.apiUser = this.referenceId;
      } else {
        throw error;
      }
    }
  }

  async generateApiKey() {
    console.log('🔑 Generating API Key...');
    
    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await axios.post(
        `${MOMO_BASE_URL}/v1_0/apiuser/${this.apiUser}/apikey`,
        {},
        {
          headers: {
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
          }
        }
      );

      if (response.status === 201) {
        this.apiKey = response.data.apiKey;
        console.log('✅ API Key generated successfully');
      }
    } catch (error) {
      // Try to get the API key if it already exists
      try {
        const getUserResponse = await axios.get(
          `${MOMO_BASE_URL}/v1_0/apiuser/${this.apiUser}`,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
            }
          }
        );
        
        if (getUserResponse.data) {
          console.log('⚠️  Using existing API user, generating new API key...');
          // Try again after a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResponse = await axios.post(
            `${MOMO_BASE_URL}/v1_0/apiuser/${this.apiUser}/apikey`,
            {},
            {
              headers: {
                'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
              }
            }
          );
          this.apiKey = retryResponse.data.apiKey;
        }
      } catch (retryError) {
        throw error;
      }
    }
  }

  async updateEnvFile() {
    console.log('📝 Updating .env file...');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update the API user and API key
    envContent = envContent.replace(
      /MOMO_API_USER=""/,
      `MOMO_API_USER="${this.apiUser}"`
    );
    
    envContent = envContent.replace(
      /MOMO_API_KEY=""/,
      `MOMO_API_KEY="${this.apiKey}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file updated');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new MTNSetup();
  setup.setup().catch(console.error);
}

module.exports = MTNSetup;
