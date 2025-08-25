const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('Users in database:', JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
      console.log('No users found. Creating a test user...');
      
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@vevurn.com',
          name: 'Admin User',
          role: 'ADMIN',
          hashedPassword: '$2b$12$dummy.hash.for.testing'
        }
      });
      
      console.log('Created user:', newUser);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
