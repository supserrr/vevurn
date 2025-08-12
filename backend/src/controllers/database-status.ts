import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDatabaseStatus = async (req: Request, res: Response) => {
  try {
    // Get user count and sample users
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeId: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        accounts: {
          select: {
            providerId: true,
            accountId: true,
          }
        },
        sessions: {
          select: {
            id: true,
            expiresAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get other table counts
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    const verificationCount = await prisma.verification.count();

    const result = {
      summary: {
        users: userCount,
        accounts: accountCount,
        sessions: sessionCount,
        verifications: verificationCount,
      },
      recentUsers: users,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Database Status Request:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Accounts: ${accountCount}`);
    console.log(`   Sessions: ${sessionCount}`);
    console.log(`   Verifications: ${verificationCount}`);

    res.json(result);
  } catch (error) {
    console.error('❌ Database status error:', error);
    res.status(500).json({ 
      error: 'Database query failed', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
