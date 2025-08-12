#!/usr/bin/env tsx

/**
 * Simple OAuth Test - Test user creation without validation
 * This helps isolate the "unable_to_create_user" issue
 */

console.log('🔍 Testing OAuth User Creation Logic');
console.log('====================================');

// Simulate the OAuth user creation process
function simulateOAuthUserCreation() {
  // This is what Google OAuth typically sends
  const googleProfile = {
    id: "123456789",
    email: "test@gmail.com", 
    verified_email: true,
    name: "Test User",
    given_name: "Test",
    family_name: "User",
    picture: "https://lh3.googleusercontent.com/a/default-user=s96-c"
  };
  
  console.log('📥 Google Profile Data:', JSON.stringify(googleProfile, null, 2));
  
  // Simulate the mapProfileToUser function
  const mappedUser = {
    firstName: googleProfile.given_name || googleProfile.name?.split(' ')[0] || '',
    lastName: googleProfile.family_name || googleProfile.name?.split(' ').slice(1).join(' ') || '',
  };
  
  console.log('🗂️ Mapped User Data:', JSON.stringify(mappedUser, null, 2));
  
  // Simulate the database hooks before function
  const enhancedUser = {
    ...mappedUser,
    email: googleProfile.email,
    role: "cashier", // Default role
    isActive: true,
    maxDiscountAllowed: 0,
    canSellBelowMin: false,
    employeeId: `EMP-${Date.now().toString().slice(-4)}` // Auto-generated
  };
  
  console.log('✅ Enhanced User Data (after hooks):', JSON.stringify(enhancedUser, null, 2));
  
  // Check for potential validation failures
  console.log('\n🔍 Validation Checks:');
  console.log(`✅ Email: ${enhancedUser.email ? 'Present' : '❌ Missing'}`);
  console.log(`✅ First Name: ${enhancedUser.firstName ? 'Present' : '❌ Missing'}`);  
  console.log(`✅ Last Name: ${enhancedUser.lastName ? 'Present' : '❌ Missing'}`);
  console.log(`✅ Employee ID Format: ${enhancedUser.employeeId.match(/^EMP-\d{4}$/) ? 'Valid' : '❌ Invalid'}`);
  console.log(`✅ Role: ${enhancedUser.role}`);
  
  // Potential issues that could cause "unable_to_create_user"
  console.log('\n⚠️ Potential Issues:');
  console.log('1. Terms of Service validation (DISABLED in our debug version)');
  console.log('2. Rate limiting (check if too many attempts from same IP)');
  console.log('3. Database connection issues');
  console.log('4. Unique constraint violations (email already exists)');
  console.log('5. Missing required fields in database schema');
  
  return enhancedUser;
}

const testUser = simulateOAuthUserCreation();

console.log('\n🚀 Recommendations:');
console.log('1. Check server logs for "🔍 OAuth user creation attempt" messages');
console.log('2. Verify Google OAuth credentials are properly set');
console.log('3. Test with a fresh email address not in database');
console.log('4. Check rate limiting - wait 5+ minutes between attempts');
console.log('5. Ensure database is accepting connections');

console.log('\n📋 Environment Check:');
console.log('Set these environment variables in .env:');
console.log('- GOOGLE_CLIENT_ID=your-actual-client-id');
console.log('- GOOGLE_CLIENT_SECRET=your-actual-client-secret'); 
console.log('- DATABASE_URL=your-database-connection-string');
console.log('- BETTER_AUTH_SECRET=your-32-char-secret');

console.log('\n✨ Debug mode is active. Try OAuth now and check console logs!');
