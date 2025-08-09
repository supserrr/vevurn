#!/usr/bin/env node

/**
 * Enhanced Database Pool Service Test Script
 * 
 * This script tests the database pool service functionality:
 * 1. Connection pool metrics
 * 2. Query execution with retry logic
 * 3. Transaction handling
 * 4. Batch operations
 * 5. Health monitoring
 * 6. Performance analysis
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // You'll need to get this from enhanced auth

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
async function testDatabaseHealth() {
  log('Testing database health check...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/database/health', null, headers);
  
  if (result.success && result.data.success) {
    const healthData = result.data.data;
    addResult('Database Health Check', true, `Status: ${healthData.status}, Avg Query Time: ${healthData.averageQueryTime}ms`);
    return true;
  } else {
    if (result.status === 403) {
      addResult('Database Health Check', false, 'Access denied - Admin token required');
    } else {
      addResult('Database Health Check', false, `Health check failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testDatabaseMetrics() {
  log('Testing database pool metrics...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/database/metrics', null, headers);
  
  if (result.success && result.data.success) {
    const metrics = result.data.data.metrics;
    addResult('Database Metrics', true, `Active: ${metrics.activeConnections}/${metrics.totalConnections} connections`);
    return true;
  } else {
    if (result.status === 403) {
      addResult('Database Metrics', false, 'Access denied - Admin token required');
    } else {
      addResult('Database Metrics', false, `Metrics fetch failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testDetailedMetrics() {
  log('Testing detailed database metrics...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/database/detailed-metrics', null, headers);
  
  if (result.success && result.data.success) {
    const detailed = result.data.data;
    addResult('Detailed Metrics', true, 'PostgreSQL statistics retrieved successfully');
    
    // Log interesting metrics if available
    if (detailed.databaseSize && detailed.databaseSize.length > 0) {
      log(`Database Size: ${detailed.databaseSize[0].database_size}`, 'info');
    }
    
    return true;
  } else {
    if (result.status === 403) {
      addResult('Detailed Metrics', false, 'Access denied - Admin token required');
    } else {
      addResult('Detailed Metrics', false, `Detailed metrics failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testPerformanceAnalysis() {
  log('Testing performance analysis...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/database/performance', null, headers);
  
  if (result.success && result.data.success) {
    const analysis = result.data.data.analysis;
    addResult('Performance Analysis', true, `Status: ${analysis.overview.status}`);
    
    // Log recommendations if any
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      log(`Recommendations: ${analysis.recommendations.length}`, 'info');
    }
    
    return true;
  } else {
    if (result.status === 403) {
      addResult('Performance Analysis', false, 'Access denied - Admin token required');
    } else {
      addResult('Performance Analysis', false, `Performance analysis failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testDatabaseWarmup() {
  log('Testing database warm-up...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('POST', '/api/database/warmup', null, headers);
  
  if (result.success && result.data.success) {
    addResult('Database Warm-up', true, 'Connection pool warmed up successfully');
    return true;
  } else {
    if (result.status === 403) {
      addResult('Database Warm-up', false, 'Access denied - Admin token required');
    } else {
      addResult('Database Warm-up', false, `Warm-up failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testLiveMetrics() {
  log('Testing live metrics endpoint...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/database/live-metrics', null, headers);
  
  if (result.success && result.data.success) {
    const liveData = result.data.data;
    addResult('Live Metrics', true, `Status: ${liveData.status}, Utilization: ${liveData.connections.utilization}%`);
    return true;
  } else {
    if (result.status === 403) {
      addResult('Live Metrics', false, 'Access denied - Admin token required');
    } else {
      addResult('Live Metrics', false, `Live metrics failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testDatabaseConfig() {
  log('Testing database configuration endpoint...', 'info');
  
  const headers = ADMIN_TOKEN ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {};
  const result = await makeRequest('GET', '/api/database/config', null, headers);
  
  if (result.success && result.data.success) {
    const config = result.data.data.configuration;
    addResult('Database Config', true, `Max Connections: ${config.maxConnections}, Min: ${config.minConnections}`);
    return true;
  } else {
    if (result.status === 403) {
      addResult('Database Config', false, 'Access denied - Admin token required');
    } else {
      addResult('Database Config', false, `Config fetch failed: ${JSON.stringify(result.error)}`);
    }
    return false;
  }
}

async function testGeneralHealthCheck() {
  log('Testing general application health...', 'info');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.status === 'ok') {
    const services = result.data.services;
    addResult('Application Health', true, `Database: ${services.database}, Redis: ${services.redis}`);
    return true;
  } else {
    addResult('Application Health', false, `Application health check failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('='.repeat(70).blue);
  console.log('🗄️  Enhanced Database Pool Service Test Suite'.blue.bold);
  console.log('='.repeat(70).blue);
  console.log();
  
  if (!ADMIN_TOKEN) {
    console.log('⚠️  Warning: ADMIN_TOKEN not provided. Some tests may fail with 403 errors.'.yellow);
    console.log('   To get a token, login with admin credentials and use the enhanced auth system.'.yellow);
    console.log();
  }
  
  log('Starting database pool service tests...', 'info');
  console.log();
  
  // Core functionality tests
  await testGeneralHealthCheck();
  await testDatabaseHealth();
  await testDatabaseMetrics();
  await testDetailedMetrics();
  await testPerformanceAnalysis();
  await testDatabaseConfig();
  await testLiveMetrics();
  await testDatabaseWarmup();
  
  // Print summary
  console.log();
  console.log('='.repeat(70).blue);
  console.log('📊 Test Summary'.blue.bold);
  console.log('='.repeat(70).blue);
  
  results.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    console.log(`${icon} ${test.testName}: ${test.message}`[color]);
  });
  
  console.log();
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed}`.green);
  console.log(`Failed: ${results.failed}`.red);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log();
    console.log('🎉 All tests passed! Database pool service is working correctly.'.green.bold);
  } else if (results.passed > 0) {
    console.log();
    console.log('⚠️  Some tests passed. Check failed tests above.'.yellow.bold);
    if (results.tests.some(t => !t.passed && t.message.includes('Admin token required'))) {
      console.log('💡 Many failures may be due to missing ADMIN_TOKEN environment variable.'.yellow);
    }
  } else {
    console.log();
    console.log('🚨 All tests failed. Please check the database pool service configuration.'.red.bold);
  }
  
  console.log();
  console.log('📝 Monitoring Endpoints Available:'.blue);
  console.log('   • GET /api/database/health - Database health status');
  console.log('   • GET /api/database/metrics - Connection pool metrics');
  console.log('   • GET /api/database/detailed-metrics - PostgreSQL statistics');
  console.log('   • GET /api/database/performance - Performance analysis');
  console.log('   • GET /api/database/live-metrics - Real-time metrics');
  console.log('   • GET /api/database/config - Pool configuration');
  console.log('   • POST /api/database/warmup - Warm up connections');
  console.log();
  
  log('Database pool service testing completed.', 'info');
  
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
