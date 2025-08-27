const { exec } = require('child_process');
const fs = require('fs');

async function testSystem() {
  console.log('🧪 Testing Vevurn POS System...\n');

  // Test 1: Backend compilation
  console.log('1. Testing Backend TypeScript Compilation...');
  try {
    await runCommand('cd backend && npx tsc --noEmit');
    console.log('✅ Backend compiles successfully\n');
  } catch (error) {
    console.log('❌ Backend compilation failed\n');
    return;
  }

  // Test 2: Frontend compilation
  console.log('2. Testing Frontend TypeScript Compilation...');
  try {
    await runCommand('cd frontend && npx next build --dry-run');
    console.log('✅ Frontend compiles successfully\n');
  } catch (error) {
    console.log('❌ Frontend compilation failed\n');
    return;
  }

  // Test 3: Database connection
  console.log('3. Testing Database Connection...');
  try {
    await runCommand('cd backend && npx prisma db push --preview-feature');
    console.log('✅ Database connected and schema updated\n');
  } catch (error) {
    console.log('❌ Database connection failed\n');
    return;
  }

  // Test 4: Environment files
  console.log('4. Checking Environment Files...');
  const backendEnv = fs.existsSync('./backend/.env');
  const frontendEnv = fs.existsSync('./frontend/.env.local');
  
  if (backendEnv && frontendEnv) {
    console.log('✅ Environment files exist\n');
  } else {
    console.log('⚠️  Environment files missing - please create from .env.example\n');
  }

  console.log('🎉 System Test Complete!\n');
  
  console.log('📋 Next Steps:');
  console.log('1. Start backend: cd backend && npm run dev');
  console.log('2. Start frontend: cd frontend && npm run dev');
  console.log('3. Visit http://localhost:3000 to test the system');
  console.log('4. Create your first business via onboarding');
  console.log('5. Add cashiers and test POS functionality\n');
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

testSystem().catch(console.error);
