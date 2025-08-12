import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database contents...\n');
    
    // Check User table
    console.log('👥 USERS TABLE:');
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
        sessions: true,
      }
    });
    console.log(`Found ${users.length} users`);
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  First Name: ${user.firstName || 'N/A'}`);
      console.log(`  Last Name: ${user.lastName || 'N/A'}`);
      console.log(`  Role: ${user.role || 'N/A'}`);
      console.log(`  Employee ID: ${user.employeeId || 'N/A'}`);
      console.log(`  Email Verified: ${user.emailVerified || 'No'}`);
      console.log(`  Is Active: ${user.isActive}`);
      console.log(`  Accounts: ${user.accounts.length}`);
      console.log(`  Sessions: ${user.sessions.length}`);
      
      user.accounts.forEach((account, accIndex) => {
        console.log(`    Account ${accIndex + 1}: ${account.providerId} (${account.providerAccountId})`);
      });
    });
    
    // Check Account table
    console.log('\n🔐 ACCOUNTS TABLE:');
    const accounts = await prisma.account.findMany();
    console.log(`Found ${accounts.length} accounts`);
    
    // Check Session table
    console.log('\n🎫 SESSIONS TABLE:');
    const sessions = await prisma.session.findMany();
    console.log(`Found ${sessions.length} sessions`);
    
    // Check Verification table
    console.log('\n✉️ VERIFICATION TABLE:');
    const verifications = await prisma.verification.findMany();
    console.log(`Found ${verifications.length} verification records`);
    
    // Show recent database activity
    console.log('\n📊 RECENT ACTIVITY:');
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { accounts: true }
    });
    
    if (recentUsers.length > 0) {
      console.log('Most recent users:');
      recentUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.createdAt}) - ${user.accounts.length} accounts`);
      });
    } else {
      console.log('No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
