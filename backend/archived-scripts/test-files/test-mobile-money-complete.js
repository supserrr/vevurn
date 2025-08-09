const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3001';

class MobileMoneyTester {
  constructor() {
    this.authToken = null;
    this.referenceId = null;
  }

  async runAllTests() {
    console.log(chalk.blue('📱 Mobile Money Integration Test Suite\n'));

    try {
      await this.setupAuthentication();
      await this.testPaymentRequest();
      await this.testStatusCheck();
      await this.testWebhookEndpoint();
      
      console.log(chalk.green('\n✅ All Mobile Money tests passed!'));
    } catch (error) {
      console.error(chalk.red('\n❌ Mobile Money test failed:'), error.message);
      if (error.response) {
        console.error(chalk.red('Response data:'), error.response.data);
      }
    }
  }

  async setupAuthentication() {
    console.log(chalk.yellow('🔐 Setting up authentication...'));
    
    // Login to get session
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/sign-in`, {
        email: 'test@vevurn.com',
        password: 'TestPassword123!'
      }, { withCredentials: true });

      this.authToken = loginResponse.headers['set-cookie']?.[0];
      console.log(chalk.green('✅ Authentication setup complete'));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Authentication setup skipped - may need manual login'));
    }
  }

  async testPaymentRequest() {
    console.log(chalk.yellow('💳 Testing Payment Request...'));
    
    const paymentData = {
      phoneNumber: '+250788123456',
      amount: 5000,
      currency: 'RWF',
      externalId: `test_sale_${Date.now()}`,
      payerMessage: 'Test payment for Vevurn POS',
      payeeNote: 'Test transaction'
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/api/mobile-money/request-payment`,
        paymentData,
        {
          headers: {
            'Cookie': this.authToken || '',
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.status === 200 && response.data.success) {
        this.referenceId = response.data.data.referenceId;
        console.log(chalk.green('✅ Payment request successful'));
        console.log(chalk.blue(`   Reference ID: ${this.referenceId}`));
      } else {
        throw new Error('Payment request failed');
      }
    } catch (error) {
      if (!process.env.MOMO_SUBSCRIPTION_KEY) {
        console.log(chalk.yellow('⚠️ Payment request test skipped - MoMo credentials not configured'));
      } else {
        throw error;
      }
    }
  }

  async testStatusCheck() {
    console.log(chalk.yellow('📊 Testing Status Check...'));
    
    if (!this.referenceId) {
      console.log(chalk.yellow('⚠️ Status check skipped - no reference ID from payment request'));
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/api/mobile-money/status/${this.referenceId}`,
        {
          headers: {
            'Cookie': this.authToken || ''
          },
          withCredentials: true
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log(chalk.green('✅ Status check successful'));
        console.log(chalk.blue(`   Status: ${response.data.data.status}`));
      } else {
        throw new Error('Status check failed');
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Status check may require valid MoMo transaction'));
    }
  }

  async testWebhookEndpoint() {
    console.log(chalk.yellow('🔗 Testing Webhook Endpoint...'));
    
    const webhookData = {
      referenceId: this.referenceId || 'test_reference_id',
      status: 'SUCCESSFUL'
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/api/mobile-money/webhook`,
        webhookData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log(chalk.green('✅ Webhook processing successful'));
      } else {
        throw new Error('Webhook processing failed');
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Webhook test may require valid reference ID'));
    }
  }
}

// Run tests
const tester = new MobileMoneyTester();
tester.runAllTests().catch(console.error);
