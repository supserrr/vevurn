/**
 * Better Auth Express Integration - Documentation Compliance Test
 * Tests all patterns mentioned in /docs/integrations/express
 */

import fs from 'fs';
import path from 'path';

interface ComplianceTest {
  pattern: string;
  description: string;
  implemented: boolean;
  location: string;
}

function checkExpressIntegrationCompliance(): ComplianceTest[] {
  const tests: ComplianceTest[] = [];

  // 1. ES Modules Configuration
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    tests.push({
      pattern: '"type": "module" in package.json',
      description: 'ES Modules configuration as required by documentation',
      implemented: packageJson.type === 'module',
      location: 'package.json'
    });
  } catch {
    tests.push({
      pattern: '"type": "module" in package.json',
      description: 'ES Modules configuration as required by documentation',
      implemented: false,
      location: 'package.json'
    });
  }

  // 2. Better Auth Handler Mounting
  try {
    const indexContent = fs.readFileSync('src/index.ts', 'utf8');
    const hasProperMounting = indexContent.includes('app.all(\'/api/auth/*\', toNodeHandler(auth))');
    tests.push({
      pattern: 'app.all("/api/auth/*", toNodeHandler(auth))',
      description: 'Better Auth handler mounted with catch-all route',
      implemented: hasProperMounting,
      location: 'src/index.ts'
    });
  } catch {
    tests.push({
      pattern: 'app.all("/api/auth/*", toNodeHandler(auth))',
      description: 'Better Auth handler mounted with catch-all route',
      implemented: false,
      location: 'src/index.ts'
    });
  }

  // 3. Middleware Ordering (express.json after Better Auth)
  try {
    const indexContent = fs.readFileSync('src/index.ts', 'utf8');
    const authIndex = indexContent.indexOf('toNodeHandler(auth)');
    const jsonIndex = indexContent.indexOf('express.json(');
    const correctOrder = authIndex < jsonIndex && authIndex !== -1 && jsonIndex !== -1;
    tests.push({
      pattern: 'express.json() after Better Auth handler',
      description: 'Prevents client API from getting stuck on "pending"',
      implemented: correctOrder,
      location: 'src/index.ts'
    });
  } catch {
    tests.push({
      pattern: 'express.json() after Better Auth handler',
      description: 'Prevents client API from getting stuck on "pending"',
      implemented: false,
      location: 'src/index.ts'
    });
  }

  // 4. CORS with Credentials
  try {
    const indexContent = fs.readFileSync('src/index.ts', 'utf8');
    const hasCredentials = indexContent.includes('credentials: true');
    tests.push({
      pattern: 'CORS with credentials: true',
      description: 'Allow credentials (cookies, authorization headers, etc.)',
      implemented: hasCredentials,
      location: 'src/index.ts'
    });
  } catch {
    tests.push({
      pattern: 'CORS with credentials: true',
      description: 'Allow credentials (cookies, authorization headers, etc.)',
      implemented: false,
      location: 'src/index.ts'
    });
  }

  // 5. fromNodeHeaders Usage
  try {
    const indexContent = fs.readFileSync('src/index.ts', 'utf8');
    const hasFromNodeHeaders = indexContent.includes('fromNodeHeaders');
    tests.push({
      pattern: 'fromNodeHeaders(req.headers) usage',
      description: 'Convert Node.js headers to Better Auth format',
      implemented: hasFromNodeHeaders,
      location: 'src/index.ts or middleware'
    });
  } catch {
    tests.push({
      pattern: 'fromNodeHeaders(req.headers) usage',
      description: 'Convert Node.js headers to Better Auth format',
      implemented: false,
      location: 'src/index.ts or middleware'
    });
  }

  // 6. Session Endpoint Example
  try {
    const indexContent = fs.readFileSync('src/index.ts', 'utf8');
    const hasSessionEndpoint = indexContent.includes('/api/me') && indexContent.includes('auth.api.getSession');
    tests.push({
      pattern: '/api/me endpoint with getSession',
      description: 'Session retrieval example from documentation',
      implemented: hasSessionEndpoint,
      location: 'src/index.ts'
    });
  } catch {
    tests.push({
      pattern: '/api/me endpoint with getSession',
      description: 'Session retrieval example from documentation',
      implemented: false,
      location: 'src/index.ts'
    });
  }

  return tests;
}

function generateComplianceReport(): void {
  console.log('\n📋 Better Auth Express Integration - Documentation Compliance Report');
  console.log('================================================================================\n');

  const tests = checkExpressIntegrationCompliance();
  const passedTests = tests.filter(test => test.implemented);
  const failedTests = tests.filter(test => !test.implemented);

  console.log('🧪 Testing against official documentation patterns from:');
  console.log('   https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/integrations/express.mdx\n');

  tests.forEach((test, index) => {
    const status = test.implemented ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${test.pattern}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Location: ${test.location}`);
    if (!test.implemented) {
      console.log('   ⚠️  MISSING: Please implement this pattern\n');
    } else {
      console.log('   ✅ IMPLEMENTED\n');
    }
  });

  console.log('📊 Summary:');
  console.log('===========');
  console.log(`✅ Passed: ${passedTests.length}/${tests.length} patterns implemented`);
  console.log(`❌ Failed: ${failedTests.length}/${tests.length} patterns missing`);

  const compliancePercentage = Math.round((passedTests.length / tests.length) * 100);
  console.log(`📈 Compliance: ${compliancePercentage}%\n`);

  if (failedTests.length === 0) {
    console.log('🎉 FULL COMPLIANCE: All Better Auth Express integration patterns implemented!');
    console.log('✅ Your implementation follows all official documentation guidelines.\n');
  } else {
    console.log('⚠️  PARTIAL COMPLIANCE: Some patterns need implementation:');
    failedTests.forEach(test => {
      console.log(`   - ${test.pattern} (${test.location})`);
    });
    console.log('');
  }

  console.log('================================================================================\n');
}

// Run compliance check
generateComplianceReport();
