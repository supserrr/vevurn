import { auth } from './src/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🧪 Creating test user...');
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@vevurn.com' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return;
    }

    // Create user through Better Auth API
    const result = await auth.api.signUpEmail({
      body: {
        email: 'test@vevurn.com',
        password: 'password123',
        name: 'Test User'
      },
      headers: new Headers()
    });
    
    console.log('✅ Test user created successfully:', result);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

createTestUser().then(() => {
  console.log('🏁 Test user creation completed');
  process.exit(0);
}).catch(console.error);
