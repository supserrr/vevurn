#!/usr/bin/env node

/**
 * Rate Limiting Testing Utility for Vevurn POS
 * 
 * This script tests rate limiting configurations and simulates various scenarios.
 * Run with: npm run test:rate-limit
 */

import dotenv from 'dotenv'
import fetch from 'node-fetch'
import { rateLimitService, POSRateLimits } from '../src/lib/rate-limit-service.js'

// Load environment variables
dotenv.config()

interface RateLimitTest {
  name: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  payload?: any
  expectedLimit: number
  window: number
  description: string
}

const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:8000'

const rateLimitTests: RateLimitTest[] = [
  {
    name: 'Email Sign-In Rate Limit',
    endpoint: '/api/auth/sign-in/email',
    method: 'POST',
    payload: { email: 'test@example.com', password: 'wrongpassword' },
    expectedLimit: 5,
    window: 60,
    description: 'Should limit failed login attempts to 5 per minute'
  },
  {
    name: 'Email Sign-Up Rate Limit',
    endpoint: '/api/auth/sign-up/email',
    method: 'POST',
    payload: { 
      email: 'test@example.com', 
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    },
    expectedLimit: 3,
    window: 300,
    description: 'Should limit signup attempts to 3 per 5 minutes'
  },
  {
    name: 'Password Reset Rate Limit',
    endpoint: '/api/auth/reset-password',
    method: 'POST',
    payload: { email: 'test@example.com' },
    expectedLimit: 3,
    window: 300,
    description: 'Should limit password reset requests to 3 per 5 minutes'
  },
  {
    name: 'Session Check Rate Limit',
    endpoint: '/api/auth/session',
    method: 'GET',
    expectedLimit: 200,
    window: 60,
    description: 'Should allow high frequency session checks for POS operations'
  }
]

const testRateLimits = async () => {
  console.log('🛡️  Testing Vevurn POS Rate Limiting...\n')

  // Check if server is running
  try {
    const response = await fetch(`${baseUrl}/api/auth/session`)
    console.log(`✅ Server is running at ${baseUrl}`)
  } catch (error) {
    console.error(`❌ Cannot connect to server at ${baseUrl}`)
    console.log('Please start the server with: npm run dev')
    process.exit(1)
  }

  // Test Redis connection for custom rate limiting
  console.log('\n📊 Testing Custom Rate Limit Service...')
  try {
    const testResult = await rateLimitService.checkRateLimit({
      key: 'test',
      window: 10,
      max: 5,
      identifier: 'test-user'
    })
    console.log(`✅ Redis rate limiting service working`)
    console.log(`   Test result: ${testResult.allowed ? 'Allowed' : 'Blocked'}, Remaining: ${testResult.remaining}`)
    
    // Clean up test
    await rateLimitService.resetRateLimit('test', 'test-user')
  } catch (error) {
    console.error('❌ Redis rate limiting service failed:', error)
    console.log('   Make sure Redis is running and properly configured')
  }

  // Test POS-specific rate limits
  console.log('\n🛍️  Testing POS-Specific Rate Limits...')
  for (const [operation, config] of Object.entries(POSRateLimits)) {
    try {
      const result = await rateLimitService.getRateLimitStatus({
        key: operation.toLowerCase(),
        window: config.window,
        max: config.max,
        identifier: 'test-employee'
      })
      
      console.log(`✅ ${operation}: ${config.max} requests per ${config.window}s window`)
      console.log(`   Current: ${result.total - result.remaining}/${result.total} used`)
    } catch (error) {
      console.log(`❌ ${operation}: Test failed`)
    }
  }

  // Test Better Auth endpoint rate limits
  console.log('\n🔐 Testing Better Auth Endpoint Rate Limits...')
  
  for (const test of rateLimitTests) {
    console.log(`\n📋 Testing: ${test.name}`)
    console.log(`   Description: ${test.description}`)
    console.log(`   Endpoint: ${test.method} ${test.endpoint}`)
    console.log(`   Expected Limit: ${test.expectedLimit} requests per ${test.window}s`)

    let successfulRequests = 0
    let blockedRequests = 0
    let errors = 0

    // Make requests up to expected limit + 2 extra to test blocking
    const totalRequests = Math.min(test.expectedLimit + 2, 10) // Cap at 10 for safety

    for (let i = 0; i < totalRequests; i++) {
      try {
        const fetchOptions: any = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Vevurn-Rate-Limit-Test',
          }
        }

        if (test.payload) {
          fetchOptions.body = JSON.stringify(test.payload)
        }

        const response = await fetch(`${baseUrl}${test.endpoint}`, fetchOptions)
        
        if (response.status === 429) {
          blockedRequests++
          const retryAfter = response.headers.get('X-Retry-After')
          console.log(`   Request ${i + 1}: ⛔ Rate limited (retry after ${retryAfter}s)`)
        } else {
          successfulRequests++
          console.log(`   Request ${i + 1}: ✅ Allowed (${response.status})`)
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        errors++
        console.log(`   Request ${i + 1}: ❌ Error (${error instanceof Error ? error.message : 'Unknown'})`)
      }
    }

    // Results summary
    console.log(`   Results: ${successfulRequests} allowed, ${blockedRequests} blocked, ${errors} errors`)
    
    if (blockedRequests > 0 && successfulRequests <= test.expectedLimit) {
      console.log(`   ✅ Rate limiting appears to be working correctly`)
    } else if (successfulRequests > test.expectedLimit) {
      console.log(`   ⚠️  Warning: More requests allowed than expected`)
    } else if (blockedRequests === 0 && totalRequests > test.expectedLimit) {
      console.log(`   ⚠️  Warning: No requests were rate limited`)
    }
  }

  // Test rate limit monitoring
  console.log('\n📈 Testing Rate Limit Monitoring...')
  try {
    const rateLimitInfo = await rateLimitService.getRateLimitInfo('test', 'monitoring-test')
    console.log(`✅ Rate limit monitoring working`)
    console.log(`   Key: ${rateLimitInfo.key}`)
    console.log(`   Request count: ${rateLimitInfo.requestCount}`)
  } catch (error) {
    console.log(`❌ Rate limit monitoring failed:`, error)
  }

  // Performance test
  console.log('\n⚡ Performance Test - Rate Limit Check Speed...')
  const startTime = Date.now()
  const performanceTests = 100

  try {
    const promises = []
    for (let i = 0; i < performanceTests; i++) {
      promises.push(rateLimitService.checkRateLimit({
        key: 'performance-test',
        window: 60,
        max: 1000,
        identifier: `test-${i % 10}` // Use 10 different identifiers
      }))
    }

    await Promise.all(promises)
    const endTime = Date.now()
    const duration = endTime - startTime
    const avgTime = duration / performanceTests

    console.log(`✅ Performance test completed`)
    console.log(`   ${performanceTests} rate limit checks in ${duration}ms`)
    console.log(`   Average: ${avgTime.toFixed(2)}ms per check`)

    if (avgTime < 10) {
      console.log(`   🚀 Excellent performance (< 10ms per check)`)
    } else if (avgTime < 50) {
      console.log(`   ✅ Good performance (< 50ms per check)`)
    } else {
      console.log(`   ⚠️  Slow performance (> 50ms per check) - consider Redis optimization`)
    }

    // Clean up performance test data
    for (let i = 0; i < 10; i++) {
      await rateLimitService.resetRateLimit('performance-test', `test-${i}`)
    }

  } catch (error) {
    console.log(`❌ Performance test failed:`, error)
  }

  console.log('\n🎉 Rate limiting tests completed!')
  console.log('\n💡 Recommendations:')
  console.log('   • Monitor rate limit violations in production')
  console.log('   • Adjust limits based on actual usage patterns')
  console.log('   • Consider IP whitelisting for trusted internal networks')
  console.log('   • Implement user-based rate limiting for authenticated endpoints')
}

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Run the tests
testRateLimits().catch(error => {
  console.error('💥 Rate limiting test failed:', error)
  process.exit(1)
})
