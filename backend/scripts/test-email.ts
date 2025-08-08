#!/usr/bin/env node

/**
 * Email Testing Utility for Vevurn POS
 * 
 * This script tests the email functionality to ensure proper configuration.
 * Run with: node test-email.js [recipient@email.com]
 */

import dotenv from 'dotenv'
import { sendEmail, createVerificationEmailTemplate, createPasswordResetEmailTemplate, createWelcomeEmailTemplate } from '../src/lib/email-service.js'

// Load environment variables
dotenv.config()

const testEmail = async (recipient: string) => {
  console.log('🧪 Testing Vevurn POS Email Service...\n')
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Missing SMTP credentials in environment variables')
    console.log('Please set SMTP_USER and SMTP_PASSWORD in your .env file')
    process.exit(1)
  }

  const testUser = {
    name: 'Test User',
    email: recipient,
    employeeId: 'EMP-0001',
    role: 'cashier'
  }

  const tests = [
    {
      name: 'Verification Email',
      template: createVerificationEmailTemplate(testUser.name, 'http://localhost:8000/verify?token=test-token-123'),
    },
    {
      name: 'Password Reset Email', 
      template: createPasswordResetEmailTemplate(testUser.name, 'http://localhost:8000/reset?token=reset-token-456'),
    },
    {
      name: 'Welcome Email',
      template: createWelcomeEmailTemplate(testUser.name, testUser.employeeId, testUser.role),
    }
  ]

  for (const test of tests) {
    try {
      console.log(`📧 Testing ${test.name}...`)
      
      await sendEmail({
        to: recipient,
        subject: `[TEST] ${test.template.subject}`,
        html: test.template.html,
        text: test.template.text,
      })
      
      console.log(`✅ ${test.name} sent successfully`)
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error)
    }
    
    // Wait 1 second between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n🎉 Email testing completed!')
  console.log('Check your inbox for the test emails.')
}

// Get recipient from command line or use default
const recipient = process.argv[2] || process.env.SMTP_USER || 'test@example.com'

if (!recipient.includes('@')) {
  console.error('❌ Invalid email address provided')
  console.log('Usage: node test-email.js recipient@email.com')
  process.exit(1)
}

testEmail(recipient).catch(error => {
  console.error('💥 Email test failed:', error)
  process.exit(1)
})
