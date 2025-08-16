// Quick script to create a test user via Better Auth
// Run this in the backend terminal

import { auth } from './src/auth.js';

const BACKEND_URL = 'http://localhost:8000';

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    // Use Better Auth API to create user
    const response = await fetch(`${BACKEND_URL}/api/auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'admin123456',
      }),
    });

    const result = await response.json();
    console.log('User creation result:', result);
    
    if (response.ok) {
      console.log('✅ Test user created successfully!');
      console.log('Email: admin@test.com');
      console.log('Password: admin123456');
    } else {
      console.log('❌ Failed to create user:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
