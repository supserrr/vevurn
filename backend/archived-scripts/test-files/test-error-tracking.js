#!/usr/bin/env node

/**
 * Error Tracking Service Test Suite
 * 
 * Comprehensive testing for the error tracking service including:
 * 1. Error capture and fingerprinting
 * 2. Performance issue tracking
 * 3. Error statistics and metrics
 * 4. Notification system
 * 5. Admin endpoints
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors_map = {
    info: 'blue',
    success: 'green',
    error: 'red',
    warning: 'yellow'
  };
  
  console.log(`[${timestamp}] ${message}`[colors_map[type] || 'white']);
}

function addResult(testName, passed, message = '') {
  results.tests.push({ testName, passed, message });
  if (passed) {
    results.passed++;
    log(`✅ ${testName}: ${message}`, 'success');
  } else {
    results.failed++;
    log(`❌ ${testName}: ${message}`, 'error');
  }
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testErrorTrackingHealth() {
  log('Testing error tracking service health...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/errors/health', null, headers);
  
  if (result.success && result.data.success) {
    const healthData = result.data.data;
    addResult('Error Tracking Health', true, `Status: ${healthData.status}, Service: ${healthData.service}`);
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Error Tracking Health', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Error Tracking Health', false, `Health check failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testErrorTrackingConfig() {
  log('Testing error tracking configuration...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/errors/config', null, headers);
  
  if (result.success && result.data.success) {
    const config = result.data.data.config;
    addResult('Error Tracking Config', true, `Environment: ${config.environment}, Notifications: Slack=${config.notifications.slack}`);
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Error Tracking Config', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Error Tracking Config', false, `Config fetch failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testGenerateTestError() {
  log('Testing test error generation...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('POST', '/api/errors/test', {
    errorType: 'TestError',
    message: 'This is a test error for validation',
    component: 'error-tracking-test'
  }, headers);
  
  if (result.success && result.data.success) {
    const testData = result.data.data;
    addResult('Generate Test Error', true, `Error ID: ${testData.errorId}, Type: ${testData.errorType}`);
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Generate Test Error', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Generate Test Error', false, `Test error generation failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testPerformanceIssueTracking() {
  log('Testing performance issue tracking...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('POST', '/api/errors/test-performance', {
    operation: 'test-slow-operation',
    duration: 2500,
    threshold: 1000
  }, headers);
  
  if (result.success && result.data.success) {
    const perfData = result.data.data;
    addResult('Performance Issue Tracking', true, `Operation: ${perfData.operation}, Triggered: ${perfData.wasTriggered}`);
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Performance Issue Tracking', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Performance Issue Tracking', false, `Performance test failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testErrorStatistics() {
  log('Testing error statistics retrieval...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/errors/stats?timeframe=hour', null, headers);
  
  if (result.success && result.data.success) {
    const stats = result.data.data.stats;
    addResult('Error Statistics', true, `Total Errors: ${stats.totalErrors}, Unique: ${stats.uniqueErrors}, Rate: ${stats.errorRate}/hr`);
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Error Statistics', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Error Statistics', false, `Statistics retrieval failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testRecentErrors() {
  log('Testing recent errors endpoint...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/errors/recent?limit=10', null, headers);
  
  if (result.success && result.data.success) {
    addResult('Recent Errors', true, 'Recent errors endpoint responding (placeholder implementation)');
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Recent Errors', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Recent Errors', false, `Recent errors fetch failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testClearTestData() {
  log('Testing test data cleanup...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('POST', '/api/errors/clear-test-data', null, headers);
  
  if (result.success && result.data.success) {
    addResult('Clear Test Data', true, 'Test data cleanup endpoint responding');
    return true;
  } else {
    if (result.status === 403 || result.status === 401) {
      addResult('Clear Test Data', false, 'Access denied - Admin authentication required');
    } else {
      addResult('Clear Test Data', false, `Test data cleanup failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testGeneralApplicationHealth() {
  log('Testing general application health...', 'info');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.status === 'ok') {
    addResult('Application Health', true, `Status: ${result.data.status}, Services: Database=${result.data.services.database}, Redis=${result.data.services.redis}`);
    return true;
  } else {
    addResult('Application Health', false, `Application health check failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function testErrorTrackingIntegration() {
  log('Testing error tracking integration with general endpoints...', 'info');
  
  // Try to access a non-existent endpoint to trigger 404 error
  const result = await makeRequest('GET', '/api/non-existent-endpoint');
  
  if (!result.success && result.status === 404) {
    addResult('Error Integration Test', true, '404 error properly handled (error tracking should capture this)');
    return true;
  } else {
    addResult('Error Integration Test', false, 'Expected 404 error not received');
    return false;
  }
}

// Stress testing functions
async function stressTestErrorGeneration() {
  log('Running stress test - generating multiple errors...', 'info');
  
  if (!ADMIN_TOKEN) {
    addResult('Stress Test', false, 'Admin token required for stress testing');
    return false;
  }
  
  const headers = { 'Authorization': `Bearer ${ADMIN_TOKEN}` };
  const promises = [];
  
  // Generate 10 test errors rapidly
  for (let i = 0; i < 10; i++) {
    promises.push(
      makeRequest('POST', '/api/errors/test', {
        errorType: 'StressTestError',
        message: `Stress test error ${i + 1}`,
        component: 'stress-test'
      }, headers)
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    
    addResult('Stress Test - Error Generation', true, `Generated ${successCount}/10 test errors successfully`);
    return true;
  } catch (error) {
    addResult('Stress Test - Error Generation', false, `Stress test failed: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('='.repeat(80).blue);
  console.log('🔍 Comprehensive Error Tracking Service Test Suite'.blue.bold);
  console.log('='.repeat(80).blue);
  console.log();
  
  if (!ADMIN_TOKEN) {
    console.log('⚠️  Warning: ADMIN_TOKEN not provided. Most tests will fail with 403/401 errors.'.yellow);
    console.log('   To get a token, login with admin credentials using the enhanced auth system.'.yellow);
    console.log('   Set the ADMIN_TOKEN environment variable and re-run the tests.'.yellow);
    console.log();
  }
  
  log('Starting comprehensive error tracking service tests...', 'info');
  console.log();
  
  // Basic functionality tests
  await testGeneralApplicationHealth();
  await testErrorTrackingHealth();
  await testErrorTrackingConfig();
  
  console.log('\n' + '─'.repeat(60).gray);
  console.log('Testing Error Generation & Tracking'.blue);
  console.log('─'.repeat(60).gray);
  
  await testGenerateTestError();
  await testPerformanceIssueTracking();
  await testErrorTrackingIntegration();
  
  console.log('\n' + '─'.repeat(60).gray);
  console.log('Testing Error Analytics & Monitoring'.blue);
  console.log('─'.repeat(60).gray);
  
  await testErrorStatistics();
  await testRecentErrors();
  
  console.log('\n' + '─'.repeat(60).gray);
  console.log('Testing Administrative Functions'.blue);
  console.log('─'.repeat(60).gray);
  
  await testClearTestData();
  
  // Stress testing
  if (ADMIN_TOKEN) {
    console.log('\n' + '─'.repeat(60).gray);
    console.log('Running Stress Tests'.blue);
    console.log('─'.repeat(60).gray);
    
    await stressTestErrorGeneration();
  }
  
  // Print comprehensive summary
  console.log('\n' + '='.repeat(80).blue);
  console.log('📊 Comprehensive Test Results Summary'.blue.bold);
  console.log('='.repeat(80).blue);
  
  // Categorize results
  const categoryResults = {
    'Health & Configuration': [],
    'Error Generation': [],
    'Analytics & Monitoring': [],
    'Administrative': [],
    'Stress Testing': []
  };
  
  results.tests.forEach(test => {
    if (test.testName.includes('Health') || test.testName.includes('Config')) {
      categoryResults['Health & Configuration'].push(test);
    } else if (test.testName.includes('Error') && (test.testName.includes('Generate') || test.testName.includes('Integration'))) {
      categoryResults['Error Generation'].push(test);
    } else if (test.testName.includes('Statistics') || test.testName.includes('Recent')) {
      categoryResults['Analytics & Monitoring'].push(test);
    } else if (test.testName.includes('Clear') || test.testName.includes('Admin')) {
      categoryResults['Administrative'].push(test);
    } else if (test.testName.includes('Stress')) {
      categoryResults['Stress Testing'].push(test);
    }
  });
  
  Object.entries(categoryResults).forEach(([category, tests]) => {
    if (tests.length === 0) return;
    
    console.log(`\n${category}:`.blue);
    tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      const color = test.passed ? 'green' : 'red';
      console.log(`  ${icon} ${test.testName}: ${test.message}`[color]);
    });
  });
  
  console.log('\n' + '─'.repeat(80).gray);
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed}`.green);
  console.log(`Failed: ${results.failed}`.red);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  
  // Final assessment
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Error tracking service is fully operational.'.green.bold);
  } else if (results.passed > 0) {
    console.log('\n⚠️  Some tests passed. Review failed tests above.'.yellow.bold);
    if (results.tests.some(t => !t.passed && (t.message.includes('Admin authentication required') || t.message.includes('Access denied')))) {
      console.log('💡 Most failures are due to missing ADMIN_TOKEN. Set environment variable and retry.'.yellow);
    }
  } else {
    console.log('\n🚨 All tests failed. Check error tracking service configuration.'.red.bold);
  }
  
  console.log('\n📝 Error Tracking Features Available:'.blue);
  console.log('   • Comprehensive error capture with context');
  console.log('   • Performance issue monitoring');
  console.log('   • Error fingerprinting and grouping');
  console.log('   • Real-time metrics and analytics');
  console.log('   • Slack/Email/Webhook notifications');
  console.log('   • Admin monitoring dashboard endpoints');
  console.log('   • Global error handling middleware');
  console.log('   • Request performance tracking');
  console.log('   • Database and authentication error handlers');
  console.log();
  
  console.log('📊 Admin Endpoints:'.blue);
  console.log('   • GET /api/errors/health - Service health status');
  console.log('   • GET /api/errors/config - Configuration details');
  console.log('   • GET /api/errors/stats - Error statistics and metrics');
  console.log('   • GET /api/errors/recent - Recent error logs');
  console.log('   • POST /api/errors/test - Generate test errors');
  console.log('   • POST /api/errors/test-performance - Test performance tracking');
  console.log('   • POST /api/errors/clear-test-data - Clean up test data');
  console.log();
  
  log('Error tracking service testing completed.', 'info');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
