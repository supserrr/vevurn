/**
 * Google OAuth Testing Utilities
 * For debugging OAuth consent screen and flow issues
 */

export const testGoogleOAuth = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:8001';
  const redirectUri = `${baseUrl}/api/auth/callback/google`;
  const scope = encodeURIComponent('email profile');
  
  // Manual OAuth URL for testing consent screen
  const testUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=online&prompt=consent`;
  
  console.log('🧪 Google OAuth Test Configuration:');
  console.log(`   Client ID: ${clientId?.substring(0, 20)}...`);
  console.log(`   Redirect URI: ${redirectUri}`);
  console.log(`   Scopes: email profile`);
  console.log('');
  console.log('🔗 Manual Test URL:');
  console.log(testUrl);
  console.log('');
  console.log('📋 Instructions:');
  console.log('   1. Copy the URL above');
  console.log('   2. Paste it in your browser');
  console.log('   3. Complete Google OAuth consent');
  console.log('   4. Check backend logs for callback results');
  
  return {
    url: testUrl,
    config: {
      clientId: clientId,
      redirectUri: redirectUri,
      scopes: ['email', 'profile']
    }
  };
};

export const logOAuthDebugInfo = () => {
  console.log('🔍 OAuth Debug Information:');
  console.log(`   Backend URL: ${process.env.BETTER_AUTH_URL}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`   Google Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`);
  console.log(`   Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? '[SET]' : '[NOT SET]'}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
};

// Export for use in development
if (process.env.NODE_ENV === 'development') {
  // Auto-log debug info on import in development
  setTimeout(() => {
    logOAuthDebugInfo();
    console.log('');
    console.log('🚀 To test OAuth manually, run:');
    console.log('   testGoogleOAuth()');
  }, 100);
}
