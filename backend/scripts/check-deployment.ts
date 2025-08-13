#!/usr/bin/env node

/**
 * Production Deployment Checker
 * Validates production deployment configuration and provides optimization recommendations
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple config interface for the checker
interface SimpleConfig {
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  NODE_ENV?: string;
  REDIS_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

// Create a simple config object from environment variables
const simpleConfig: SimpleConfig = {
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  REDIS_URL: process.env.REDIS_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
};

interface DeploymentCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
  recommendation?: string;
}

class ProductionChecker {
  private checks: DeploymentCheck[] = [];
  private productionUrl: string;

  constructor(productionUrl = 'https://vevurn.onrender.com') {
    this.productionUrl = productionUrl;
  }

  private addCheck(check: DeploymentCheck) {
    this.checks.push(check);
    const emoji = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${emoji} ${check.name}: ${check.message}`);
    if (check.details) {
      console.log(`   Details: ${check.details}`);
    }
    if (check.recommendation) {
      console.log(`   💡 Recommendation: ${check.recommendation}`);
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n🔍 Checking Environment Variables...');

    // Critical variables
    const criticalVars = [
      { name: 'DATABASE_URL', value: simpleConfig.DATABASE_URL },
      { name: 'BETTER_AUTH_SECRET', value: simpleConfig.BETTER_AUTH_SECRET },
      { name: 'NODE_ENV', value: simpleConfig.NODE_ENV },
    ];

    for (const variable of criticalVars) {
      if (!variable.value) {
        this.addCheck({
          name: `Environment Variable: ${variable.name}`,
          status: 'fail',
          message: 'Missing critical environment variable',
          recommendation: `Set ${variable.name} in production environment`
        });
      } else {
        this.addCheck({
          name: `Environment Variable: ${variable.name}`,
          status: 'pass',
          message: 'Configured correctly'
        });
      }
    }

    // Optional but recommended variables
    const optionalVars = [
      { name: 'REDIS_URL', value: simpleConfig.REDIS_URL },
      { name: 'GOOGLE_CLIENT_ID', value: simpleConfig.GOOGLE_CLIENT_ID },
      { name: 'GOOGLE_CLIENT_SECRET', value: simpleConfig.GOOGLE_CLIENT_SECRET },
    ];

    for (const variable of optionalVars) {
      if (!variable.value) {
        this.addCheck({
          name: `Optional Variable: ${variable.name}`,
          status: 'warning',
          message: 'Not configured - feature may be limited',
          recommendation: `Configure ${variable.name} for full functionality`
        });
      } else {
        this.addCheck({
          name: `Optional Variable: ${variable.name}`,
          status: 'pass',
          message: 'Configured'
        });
      }
    }
  }

  async checkRedisConnection() {
    console.log('\n🔍 Checking Redis Connection...');

    if (!simpleConfig.REDIS_URL) {
      this.addCheck({
        name: 'Redis Configuration',
        status: 'warning',
        message: 'Redis URL not configured',
        details: 'System will use memory fallback for rate limiting',
        recommendation: 'Configure Redis for distributed rate limiting and Better Auth caching'
      });
      return;
    }

    // For the deployment checker, we'll just validate the URL format
    try {
      const url = new URL(simpleConfig.REDIS_URL);
      if (url.protocol === 'redis:' || url.protocol === 'rediss:') {
        this.addCheck({
          name: 'Redis URL Format',
          status: 'pass',
          message: 'Valid Redis URL format'
        });
      } else {
        this.addCheck({
          name: 'Redis URL Format',
          status: 'warning',
          message: 'Unexpected Redis URL protocol',
          details: `Protocol: ${url.protocol}`,
          recommendation: 'Use redis:// or rediss:// (for SSL) protocol'
        });
      }
    } catch (error) {
      this.addCheck({
        name: 'Redis URL Format',
        status: 'fail',
        message: 'Invalid Redis URL format',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: 'Fix REDIS_URL format: redis://host:port or redis://username:password@host:port'
      });
    }
  }

  async checkProductionEndpoints() {
    console.log('\n🔍 Checking Production Endpoints...');

    const endpoints = [
      { path: '/api/health/live', name: 'Liveness Probe' },
      { path: '/api/health/ready', name: 'Readiness Probe' },
      { path: '/api/health/detailed', name: 'Detailed Health' },
      { path: '/api/auth-status', name: 'Auth System Status' },
      { path: '/api/monitoring/performance', name: 'Performance Metrics' }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.productionUrl}${endpoint.path}`, {
          timeout: 10000, // 10 second timeout
          validateStatus: () => true // Don't throw on 4xx/5xx
        });
        const responseTime = Date.now() - startTime;

        if (response.status === 200) {
          const status = responseTime > 1000 ? 'warning' : 'pass';
          this.addCheck({
            name: `Endpoint: ${endpoint.name}`,
            status,
            message: `Responding (${responseTime}ms)`,
            ...(responseTime > 1000 && {
              recommendation: 'Response time is slow, investigate performance issues'
            })
          });
        } else {
          this.addCheck({
            name: `Endpoint: ${endpoint.name}`,
            status: 'fail',
            message: `HTTP ${response.status}`,
            recommendation: 'Investigate endpoint availability and server health'
          });
        }
      } catch (error) {
        this.addCheck({
          name: `Endpoint: ${endpoint.name}`,
          status: 'fail',
          message: 'Connection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Check server availability and network connectivity'
        });
      }
    }
  }

  async checkProductionHealth() {
    console.log('\n🔍 Checking Production Health Status...');

    try {
      const response = await axios.get(`${this.productionUrl}/api/health/detailed`, {
        timeout: 15000
      });

      if (response.data.success) {
        const healthData = response.data;
        
        this.addCheck({
          name: 'Overall Health Status',
          status: healthData.status === 'healthy' ? 'pass' : 
                  healthData.status === 'degraded' ? 'warning' : 'fail',
          message: `Status: ${healthData.status}`,
          details: `Uptime: ${Math.round(healthData.uptime)}s, Environment: ${healthData.environment}`
        });

        // Check individual services
        if (healthData.services) {
          for (const [serviceName, serviceData] of Object.entries(healthData.services)) {
            const service = serviceData as any;
            this.addCheck({
              name: `Service: ${serviceName}`,
              status: service.status === 'healthy' ? 'pass' :
                      service.status === 'unavailable' || service.status === 'degraded' ? 'warning' : 'fail',
              message: `Status: ${service.status}`,
              details: service.fallback ? `Fallback: ${service.fallback}` : undefined
            });
          }
        }
      } else {
        this.addCheck({
          name: 'Production Health Check',
          status: 'fail',
          message: 'Health check returned unsuccessful response',
          recommendation: 'Investigate server health and service status'
        });
      }
    } catch (error) {
      this.addCheck({
        name: 'Production Health Check',
        status: 'fail',
        message: 'Failed to retrieve health status',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: 'Verify server is running and accessible'
      });
    }
  }

  async checkDatabaseConnection() {
    console.log('\n🔍 Checking Database Configuration...');

    if (!simpleConfig.DATABASE_URL) {
      this.addCheck({
        name: 'Database URL',
        status: 'fail',
        message: 'DATABASE_URL not configured',
        recommendation: 'Configure PostgreSQL database connection string'
      });
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(simpleConfig.DATABASE_URL);
      
      if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        this.addCheck({
          name: 'Database URL Format',
          status: 'warning',
          message: 'Unexpected database protocol',
          details: `Protocol: ${url.protocol}`,
          recommendation: 'Ensure using PostgreSQL connection string'
        });
      } else {
        this.addCheck({
          name: 'Database URL Format',
          status: 'pass',
          message: 'Valid PostgreSQL connection string'
        });
      }

      if (!url.hostname) {
        this.addCheck({
          name: 'Database Host',
          status: 'fail',
          message: 'No hostname specified in DATABASE_URL',
          recommendation: 'Include database host in connection string'
        });
      } else {
        this.addCheck({
          name: 'Database Host',
          status: 'pass',
          message: `Host: ${url.hostname}`
        });
      }
    } catch (error) {
      this.addCheck({
        name: 'Database URL Format',
        status: 'fail',
        message: 'Invalid DATABASE_URL format',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: 'Fix DATABASE_URL format: postgresql://user:pass@host:port/dbname'
      });
    }
  }

  async checkSecurityConfiguration() {
    console.log('\n🔍 Checking Security Configuration...');

    // Check Better Auth secret
    if (simpleConfig.BETTER_AUTH_SECRET && simpleConfig.BETTER_AUTH_SECRET.length < 32) {
      this.addCheck({
        name: 'Better Auth Secret',
        status: 'warning',
        message: 'Secret may be too short',
        recommendation: 'Use a secret key of at least 32 characters for security'
      });
    } else if (simpleConfig.BETTER_AUTH_SECRET) {
      this.addCheck({
        name: 'Better Auth Secret',
        status: 'pass',
        message: 'Configured with adequate length'
      });
    }

    // Check environment
    if (simpleConfig.NODE_ENV === 'production') {
      this.addCheck({
        name: 'Production Environment',
        status: 'pass',
        message: 'Running in production mode'
      });
    } else {
      this.addCheck({
        name: 'Production Environment',
        status: 'warning',
        message: `Running in ${simpleConfig.NODE_ENV} mode`,
        recommendation: 'Set NODE_ENV=production for production deployment'
      });
    }

    // Check HTTPS in production URL
    if (this.productionUrl.startsWith('https://')) {
      this.addCheck({
        name: 'HTTPS Configuration',
        status: 'pass',
        message: 'Using secure HTTPS connection'
      });
    } else {
      this.addCheck({
        name: 'HTTPS Configuration',
        status: 'warning',
        message: 'Not using HTTPS',
        recommendation: 'Configure HTTPS for production security'
      });
    }
  }

  async generateReport() {
    console.log('\n📊 PRODUCTION DEPLOYMENT REPORT');
    console.log('===============================');

    const passed = this.checks.filter(c => c.status === 'pass').length;
    const warnings = this.checks.filter(c => c.status === 'warning').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;

    console.log(`\n📈 Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total Checks: ${this.checks.length}`);

    const score = Math.round((passed / this.checks.length) * 100);
    console.log(`🎯 Deployment Score: ${score}%`);

    if (failed > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Must Fix):');
      this.checks.filter(c => c.status === 'fail').forEach(check => {
        console.log(`❌ ${check.name}: ${check.message}`);
        if (check.recommendation) {
          console.log(`   💡 ${check.recommendation}`);
        }
      });
    }

    if (warnings > 0) {
      console.log('\n⚠️  WARNINGS (Recommended Fixes):');
      this.checks.filter(c => c.status === 'warning').forEach(check => {
        console.log(`⚠️  ${check.name}: ${check.message}`);
        if (check.recommendation) {
          console.log(`   💡 ${check.recommendation}`);
        }
      });
    }

    console.log('\n🎉 PASSED CHECKS:');
    this.checks.filter(c => c.status === 'pass').forEach(check => {
      console.log(`✅ ${check.name}: ${check.message}`);
    });

    // Overall assessment
    console.log('\n🎯 DEPLOYMENT ASSESSMENT:');
    if (failed === 0 && warnings === 0) {
      console.log('🟢 EXCELLENT: Production deployment is fully optimized');
    } else if (failed === 0 && warnings <= 2) {
      console.log('🟡 GOOD: Deployment is functional with minor optimization opportunities');
    } else if (failed <= 2) {
      console.log('🟠 NEEDS ATTENTION: Some issues need to be addressed');
    } else {
      console.log('🔴 CRITICAL: Significant issues must be fixed before production use');
    }

    return {
      score,
      passed,
      warnings,
      failed,
      checks: this.checks
    };
  }

  async runAllChecks() {
    console.log('🚀 Starting Production Deployment Check...');
    console.log(`🌐 Production URL: ${this.productionUrl}`);
    
    await this.checkEnvironmentVariables();
    await this.checkDatabaseConnection();
    await this.checkRedisConnection();
    await this.checkSecurityConfiguration();
    await this.checkProductionEndpoints();
    await this.checkProductionHealth();
    
    return await this.generateReport();
  }
}

// Run the checker if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ProductionChecker();
  try {
    await checker.runAllChecks();
    process.exit(0);
  } catch (error) {
    console.error('❌ Deployment check failed:', error);
    process.exit(1);
  }
}

export { ProductionChecker };
