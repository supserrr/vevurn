// Create user for Better Auth
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBetterAuthUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@vevurn.com' }
    });
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return;
    }
    
    // Create user with Better Auth compatible structure
    const user = await prisma.user.create({
      data: {
        email: 'admin@vevurn.com',
        name: 'Admin User',
        emailVerified: true,
        role: 'ADMIN',
        isActive: true,
        employeeId: 'EMP001',
        department: 'Management',
        hireDate: new Date(),
        accounts: {
          create: {
            providerId: 'credential',
            accountId: 'admin@vevurn.com',
            // Better Auth will handle password hashing
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYhBJ5KcnXj3F7C' // admin123 hashed
          }
        }
      }
    });
    
    console.log('Created Better Auth user:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBetterAuthUser();
