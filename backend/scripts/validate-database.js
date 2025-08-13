#!/usr/bin/env node

/**
 * Comprehensive Database Validation Script
 * 
 * This script validates that user data is being properly stored in the database
 * and helps debug signup/OAuth issues.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateDatabaseSetup() {
  console.log('🔍 DATABASE VALIDATION & DEBUG SCRIPT');
  console.log('=====================================\n');

  try {
    // 1. Test database connection
    console.log('1️⃣ Testing Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // 2. Check table structure
    console.log('2️⃣ Checking Required Tables...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const requiredTables = ['users', 'sessions', 'accounts', 'verification_tokens'];
    console.log('📋 Found tables:', tables.map(t => t.table_name).join(', '));
    
    requiredTables.forEach(table => {
      const exists = tables.some(t => t.table_name === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    console.log();

    // 3. Check users table structure
    console.log('3️⃣ Validating Users Table Structure...');
    
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const requiredUserFields = [
      'id', 'email', 'firstName', 'lastName', 'name', 
      'emailVerified', 'image', 'role', 'employeeId',
      'isActive', 'maxDiscountAllowed', 'canSellBelowMin',
      'createdAt', 'updatedAt'
    ];
    
    console.log('📊 Users table columns:');
    userColumns.forEach(col => {
      const isRequired = requiredUserFields.includes(col.column_name);
      console.log(`   ${isRequired ? '✅' : '📄'} ${col.column_name} (${col.data_type})`);
    });
    
    // Check for missing required fields
    const missingFields = requiredUserFields.filter(
      field => !userColumns.some(col => col.column_name === field)
    );
    
    if (missingFields.length > 0) {
      console.log(`\n❌ Missing required fields: ${missingFields.join(', ')}`);
      console.log('   Run the database migration to add missing fields.');
    } else {
      console.log('\n✅ All required user fields present');
    }
    console.log();

    // 4. Check existing user data
    console.log('4️⃣ Checking Existing User Data...');
    
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          accounts: true,
          sessions: true
        }
      });
      
      console.log('\n👥 Recent Users:');
      users.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.name || 'N/A'}`);
        console.log(`   🏷️ First Name: ${user.firstName || 'N/A'}`);
        console.log(`   🏷️ Last Name: ${user.lastName || 'N/A'}`);
        console.log(`   👔 Role: ${user.role}`);
        console.log(`   🆔 Employee ID: ${user.employeeId || 'N/A'}`);
        console.log(`   ✅ Active: ${user.isActive}`);
        console.log(`   📅 Created: ${user.createdAt}`);
        console.log(`   🔗 OAuth Accounts: ${user.accounts.length}`);
        console.log(`   🎫 Active Sessions: ${user.sessions.length}`);
        
        // Check for data quality issues
        const issues = [];
        if (!user.firstName) issues.push('Missing firstName');
        if (!user.lastName) issues.push('Missing lastName');
        if (!user.name) issues.push('Missing name');
        if (!user.role) issues.push('Missing role');
        
        if (issues.length > 0) {
          console.log(`   ⚠️ Data Issues: ${issues.join(', ')}`);
        }
      });
    }
    console.log();

    // 5. Check OAuth accounts
    console.log('5️⃣ Checking OAuth Integration...');
    
    const oauthAccounts = await prisma.account.findMany({
      include: { user: true }
    });
    
    console.log(`📊 OAuth accounts: ${oauthAccounts.length}`);
    
    if (oauthAccounts.length > 0) {
      const providers = [...new Set(oauthAccounts.map(acc => acc.providerId))];
      console.log(`   Providers: ${providers.join(', ')}`);
      
      oauthAccounts.forEach((account, index) => {
        console.log(`\n   OAuth Account ${index + 1}:`);
        console.log(`   🔗 Provider: ${account.providerId}`);
        console.log(`   👤 User: ${account.user.email}`);
        console.log(`   📅 Created: ${account.createdAt}`);
      });
    }
    console.log();

    // 6. Check active sessions
    console.log('6️⃣ Checking Active Sessions...');
    
    const activeSessions = await prisma.session.findMany({
      where: {
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    
    console.log(`📊 Active sessions: ${activeSessions.length}`);
    
    if (activeSessions.length > 0) {
      activeSessions.forEach((session, index) => {
        console.log(`\n   Session ${index + 1}:`);
        console.log(`   👤 User: ${session.user.email}`);
        console.log(`   📅 Expires: ${session.expiresAt}`);
        console.log(`   🌐 IP: ${session.ipAddress || 'N/A'}`);
      });
    }
    console.log();

    // 7. Test user creation simulation
    console.log('7️⃣ Testing User Creation Logic...');
    
    const testEmailUser = {
      email: 'test-email@example.com',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      role: 'cashier'
    };
    
    const testOAuthUser = {
      email: 'test-oauth@gmail.com',
      firstName: 'OAuth',
      lastName: 'User', 
      name: 'OAuth User',
      role: 'cashier'
    };
    
    console.log('📝 Email signup data structure:');
    console.log(JSON.stringify(testEmailUser, null, 2));
    
    console.log('\n📝 OAuth signup data structure:');
    console.log(JSON.stringify(testOAuthUser, null, 2));
    
    // Validate required fields
    const validateUser = (userData, type) => {
      const errors = [];
      if (!userData.email) errors.push('email is required');
      if (!userData.firstName) errors.push('firstName is required');
      if (!userData.lastName) errors.push('lastName is required');
      
      if (errors.length > 0) {
        console.log(`❌ ${type} validation failed: ${errors.join(', ')}`);
      } else {
        console.log(`✅ ${type} validation passed`);
      }
    };
    
    validateUser(testEmailUser, 'Email signup');
    validateUser(testOAuthUser, 'OAuth signup');
    console.log();

    // 8. Check for common issues
    console.log('8️⃣ Checking for Common Issues...');
    
    // Check for users without names
    const usersWithoutNames = await prisma.user.count({
      where: {
        OR: [
          { firstName: null },
          { lastName: null },
          { firstName: '' },
          { lastName: '' }
        ]
      }
    });
    
    console.log(`⚠️ Users with missing names: ${usersWithoutNames}`);
    
    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1;
    `;
    
    console.log(`⚠️ Duplicate emails: ${duplicateEmails.length}`);
    
    // Check for orphaned sessions
    const orphanedSessions = await prisma.session.count({
      where: {
        user: null
      }
    });
    
    console.log(`⚠️ Orphaned sessions: ${orphanedSessions}`);
    console.log();

    // 9. Performance check
    console.log('9️⃣ Performance Check...');
    
    const start = Date.now();
    await prisma.user.findMany({ take: 10 });
    const queryTime = Date.now() - start;
    
    console.log(`⚡ Sample query time: ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.log('⚠️ Slow queries detected - consider adding database indexes');
    } else {
      console.log('✅ Database performance looks good');
    }
    console.log();

    // 10. Recommendations
    console.log('🔟 Recommendations...');
    
    if (userCount === 0) {
      console.log('📝 No users found. Test signup flows:');
      console.log('   1. Try email/password signup');
      console.log('   2. Try Google OAuth signup');
      console.log('   3. Check backend logs for errors');
    } else {
      console.log('✅ Database has users - signup flows are working');
    }
    
    if (usersWithoutNames > 0) {
      console.log('📝 Fix users with missing names:');
      console.log('   - Update validation logic');
      console.log('   - Run data cleanup script');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Test both signup methods');
    console.log('   2. Monitor backend logs during signup');
    console.log('   3. Run this script after each test');
    console.log('   4. Check browser network tab for API errors');

  } catch (error) {
    console.error('❌ Database validation error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check DATABASE_URL environment variable');
    console.log('   2. Ensure database is running and accessible');
    console.log('   3. Run database migrations if needed');
    console.log('   4. Check database permissions');
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to run cleanup if needed
async function cleanupTestData() {
  console.log('\n🧹 Cleanup (Optional)...');
  
  const testEmails = [
    'test-email@example.com',
    'test-oauth@gmail.com'
  ];
  
  const deleted = await prisma.user.deleteMany({
    where: {
      email: { in: testEmails }
    }
  });
  
  console.log(`🗑️ Deleted ${deleted.count} test users`);
}

// Run the validation
if (require.main === module) {
  validateDatabaseSetup()
    .then(() => {
      console.log('\n✅ Database validation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateDatabaseSetup, cleanupTestData };
