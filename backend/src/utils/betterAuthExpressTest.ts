import { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/index.js';

/**
 * Test Better Auth Express Integration
 * Following official documentation patterns
 */
export class BetterAuthExpressTest {
  /**
   * Test the /ok endpoint to verify Better Auth is running
   */
  static async testAuthOk(baseUrl: string = 'http://localhost:8000'): Promise<boolean> {
    try {
      console.log('🧪 Testing Better Auth /ok endpoint...');
      
      const response = await fetch(`${baseUrl}/api/auth/ok`);
      const isOk = response.ok;
      
      console.log(`${isOk ? '✅' : '❌'} Better Auth /ok endpoint: ${response.status}`);
      return isOk;
    } catch (error) {
      console.log('❌ Better Auth /ok endpoint: FAILED');
      console.error(error);
      return false;
    }
  }

  /**
   * Test session retrieval endpoint
   */
  static async testSessionEndpoint(baseUrl: string = 'http://localhost:8000'): Promise<boolean> {
    try {
      console.log('🧪 Testing session endpoint...');
      
      const response = await fetch(`${baseUrl}/api/me`, {
        credentials: 'include'
      });
      
      // Should return 401 for unauthenticated request
      const isCorrect = response.status === 401;
      
      console.log(`${isCorrect ? '✅' : '❌'} Session endpoint (unauthenticated): ${response.status}`);
      return isCorrect;
    } catch (error) {
      console.log('❌ Session endpoint test: FAILED');
      console.error(error);
      return false;
    }
  }

  /**
   * Test authentication middleware
   */
  static async testAuthMiddleware(): Promise<boolean> {
    try {
      console.log('🧪 Testing authentication middleware...');
      
      // Mock request and response objects
      const mockReq = {
        headers: {
          'user-agent': 'test',
          'accept': 'application/json'
        }
      } as Request;

      const mockRes = {
        status: (code: number) => mockRes,
        json: (data: any) => mockRes,
        locals: {}
      } as Response;

      // Test session retrieval with mock headers
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(mockReq.headers),
      });

      // Should be null for unauthenticated request
      const isCorrect = session === null;
      
      console.log(`${isCorrect ? '✅' : '❌'} Auth middleware (no session): ${session === null ? 'null' : 'has session'}`);
      return isCorrect;
    } catch (error) {
      console.log('❌ Auth middleware test: FAILED');
      console.error(error);
      return false;
    }
  }

  /**
   * Test CORS configuration
   */
  static async testCorsConfiguration(baseUrl: string = 'http://localhost:8000'): Promise<boolean> {
    try {
      console.log('🧪 Testing CORS configuration...');
      
      const response = await fetch(`${baseUrl}/api/auth/ok`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        }
      });
      
      const corsHeaders = response.headers.get('access-control-allow-credentials');
      const isCorrect = corsHeaders === 'true';
      
      console.log(`${isCorrect ? '✅' : '❌'} CORS credentials header: ${corsHeaders}`);
      return isCorrect;
    } catch (error) {
      console.log('❌ CORS configuration test: FAILED');
      console.error(error);
      return false;
    }
  }

  /**
   * Test Express JSON middleware ordering
   */
  static async testMiddlewareOrdering(baseUrl: string = 'http://localhost:8000'): Promise<boolean> {
    try {
      console.log('🧪 Testing middleware ordering...');
      
      // Test that Better Auth handler is mounted before express.json()
      const response = await fetch(`${baseUrl}/api/auth/ok`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      // Better Auth should handle this regardless of JSON body
      const isCorrect = response.status !== 400; // Not a JSON parsing error
      
      console.log(`${isCorrect ? '✅' : '❌'} Middleware ordering (Better Auth before JSON): ${response.status}`);
      return isCorrect;
    } catch (error) {
      console.log('❌ Middleware ordering test: FAILED');
      console.error(error);
      return false;
    }
  }

  /**
   * Test ES Modules configuration
   */
  static testESModules(): boolean {
    try {
      console.log('🧪 Testing ES Modules configuration...');
      
      // Check if we're running in ES modules mode
      const isESM = typeof require === 'undefined';
      
      console.log(`${isESM ? '✅' : '❌'} ES Modules: ${isESM ? 'Enabled' : 'Disabled'}`);
      return isESM;
    } catch (error) {
      console.log('❌ ES Modules test: FAILED');
      console.error(error);
      return false;
    }
  }

  /**
   * Run comprehensive Express integration tests
   */
  static async runAllTests(baseUrl: string = 'http://localhost:8000'): Promise<void> {
    console.log('\n🧪 ============================================');
    console.log('🔍 Better Auth Express Integration Tests');
    console.log('============================================\n');

    const tests = [
      { name: 'ES Modules Configuration', test: () => this.testESModules() },
      { name: 'Better Auth /ok Endpoint', test: () => this.testAuthOk(baseUrl) },
      { name: 'Session Endpoint', test: () => this.testSessionEndpoint(baseUrl) },
      { name: 'Authentication Middleware', test: () => this.testAuthMiddleware() },
      { name: 'CORS Configuration', test: () => this.testCorsConfiguration(baseUrl) },
      { name: 'Middleware Ordering', test: () => this.testMiddlewareOrdering(baseUrl) },
    ];

    const results: { name: string; passed: boolean }[] = [];

    for (const { name, test } of tests) {
      try {
        const result = await test();
        results.push({ name, passed: result });
      } catch (error) {
        console.error(`Test "${name}" failed with error:`, error);
        results.push({ name, passed: false });
      }
    }

    // Summary
    console.log('\n📋 Test Results Summary:');
    console.log('========================\n');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(({ name, passed }) => {
      console.log(`${passed ? '✅' : '❌'} ${name}`);
    });

    console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All Better Auth Express integration tests PASSED!');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }

    console.log('\n============================================\n');
  }
}

/**
 * Express route to trigger integration tests
 */
export const createTestRoute = () => {
  return async (req: Request, res: Response) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Capture console output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      await BetterAuthExpressTest.runAllTests(baseUrl);

      // Restore console.log
      console.log = originalLog;

      res.json({
        success: true,
        message: 'Better Auth Express integration tests completed',
        logs: logs,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Test execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};
