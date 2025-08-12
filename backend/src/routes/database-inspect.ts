import { Request, Response } from 'express';

// Import prisma from the main app (assuming it's exported or accessible)
export const inspectDatabase = async (req: Request, res: Response) => {
  try {
    // Use the backend's existing prisma connection
    const healthResponse = await fetch('http://localhost:8001/health');
    const healthData = await healthResponse.json();
    
    res.json({
      message: 'Database inspection endpoint',
      health: healthData,
      instructions: {
        prismaStudio: 'Visit http://localhost:5555 to view database visually',
        tables: [
          'User - User accounts and profiles',
          'Account - OAuth provider accounts', 
          'Session - Active user sessions',
          'Verification - Email verification tokens',
          'RateLimit - Rate limiting records'
        ],
        testOAuth: 'Try Google OAuth at http://localhost:3002 and watch backend logs'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database inspection error:', error);
    res.status(500).json({
      error: 'Failed to inspect database',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
