// Quick test script to verify the validation fixes
console.log('🔍 Testing firstName validation fixes...');

// Test the validateUserRegistration function
const testCases = [
  { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
  { firstName: '  John  ', lastName: '  Doe  ', email: 'john@test.com' },
  { firstName: '', lastName: 'Doe', email: 'john@test.com' },
  { firstName: '   ', lastName: 'Doe', email: 'john@test.com' },
  { firstName: 123, lastName: 'Doe', email: 'john@test.com' },
  { firstName: null, lastName: 'Doe', email: 'john@test.com' },
];

// Mock validation function (copy from backend)
function validateUserRegistration(userData) {
    const errors = [];

    console.log('🔍 Validating user registration data:', JSON.stringify(userData, null, 2));

    // Validate firstName with proper trimming
    if (!userData.firstName) {
        errors.push('firstName is required');
    } else if (typeof userData.firstName !== 'string') {
        errors.push('firstName must be a string');
    } else {
        const trimmedFirstName = userData.firstName.toString().trim();
        console.log('🔍 Trimmed firstName:', `"${trimmedFirstName}"`, 'length:', trimmedFirstName.length);
        
        if (trimmedFirstName.length === 0) {
            errors.push('firstName cannot be empty after trimming');
        } else if (trimmedFirstName.length > 50) {
            errors.push('firstName cannot exceed 50 characters');
        } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirstName)) {
            errors.push('firstName contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)');
        }
        
        // Update the userData with the trimmed value
        userData.firstName = trimmedFirstName;
    }

    // Validate lastName with proper trimming
    if (!userData.lastName) {
        errors.push('lastName is required');
    } else if (typeof userData.lastName !== 'string') {
        errors.push('lastName must be a string');
    } else {
        const trimmedLastName = userData.lastName.toString().trim();
        console.log('🔍 Trimmed lastName:', `"${trimmedLastName}"`, 'length:', trimmedLastName.length);
        
        if (trimmedLastName.length === 0) {
            errors.push('lastName cannot be empty after trimming');
        } else if (trimmedLastName.length > 50) {
            errors.push('lastName cannot exceed 50 characters');
        } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedLastName)) {
            errors.push('lastName contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)');
        }
        
        // Update the userData with the trimmed value
        userData.lastName = trimmedLastName;
    }

    console.log('🔍 Validation result:', { isValid: errors.length === 0, errors });
    
    return {
        isValid: errors.length === 0,
        errors,
        cleanedData: userData
    };
}

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\n=== Test Case ${index + 1} ===`);
  const result = validateUserRegistration({ ...testCase });
  console.log('✅ Result:', result.isValid ? 'VALID' : 'INVALID');
  if (!result.isValid) {
    console.log('❌ Errors:', result.errors);
  } else {
    console.log('✨ Cleaned data:', result.cleanedData);
  }
});

console.log('\n🎉 Validation tests completed!');
