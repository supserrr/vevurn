/**
 * Session Management Test Script
 * 
 * Tests the session management functionality for the Vevurn POS system
 */

import { SessionService } from './src/lib/session-management'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSessionManagement() {
  console.log('🧪 Testing Session Management Service...')
  
  try {
    // Test 1: Get session statistics
    console.log('\n📊 Testing session statistics...')
    const stats = await SessionService.getSessionStats()
    console.log(`✅ Found ${stats.totalActiveSessions} active sessions`)
    console.log(`✅ Active users: ${stats.totalUsers}`)
    console.log('✅ Sessions by role:', stats.sessionsByRole)
    
    // Test 2: Clean up expired sessions
    console.log('\n🧹 Testing expired session cleanup...')
    const cleanedCount = await SessionService.cleanupExpiredSessions()
    console.log(`✅ Cleaned up ${cleanedCount} expired sessions`)
    
    // Test 3: Create a test user and session (if none exist)
    console.log('\n👤 Checking for test users...')
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@vevurn.com' }
    })
    
    if (!testUser) {
      console.log('📝 Creating test user for session testing...')
      const newUser = await prisma.user.create({
        data: {
          email: 'test@vevurn.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          role: 'cashier',
          employeeId: 'TEST001'
        }
      })
      console.log(`✅ Created test user: ${newUser.id}`)
      
      // Create a test session
      const testSession = await prisma.session.create({
        data: {
          userId: newUser.id,
          expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
          sessionToken: 'test-session-token-' + Date.now()
        }
      })
      console.log(`✅ Created test session: ${testSession.id}`)
      
      // Test session details
      console.log('\n🔍 Testing session details...')
      const sessionDetails = await SessionService.getSessionDetails(testSession.id)
      if (sessionDetails) {
        console.log('✅ Session details retrieved successfully')
        console.log(`   - Session ID: ${sessionDetails.id}`)
        console.log(`   - User: ${sessionDetails.user?.name} (${sessionDetails.user?.email})`)
        console.log(`   - Active: ${sessionDetails.isActive}`)
        console.log(`   - Fresh: ${sessionDetails.isFresh}`)
        console.log(`   - Expires: ${sessionDetails.expires}`)
      } else {
        console.log('❌ Failed to get session details')
      }
      
      // Test user active sessions
      console.log('\n📱 Testing user active sessions...')
      const userSessions = await SessionService.getUserActiveSessions(newUser.id)
      console.log(`✅ Found ${userSessions.length} active sessions for user`)
      
      // Test session freshness check
      console.log('\n🕐 Testing session freshness...')
      const isFresh = await SessionService.isSessionFresh(testSession.id)
      console.log(`✅ Session freshness: ${isFresh}`)
      
      // Test session by employee ID
      console.log('\n🆔 Testing sessions by employee ID...')
      const empSessions = await SessionService.getSessionsByEmployeeId('TEST001')
      console.log(`✅ Found ${empSessions.length} sessions for employee TEST001`)
      
      // Clean up test data
      console.log('\n🧽 Cleaning up test data...')
      await SessionService.revokeAllSessions(newUser.id)
      await prisma.user.delete({ where: { id: newUser.id } })
      console.log('✅ Test data cleaned up')
    } else {
      console.log('✅ Test user already exists, skipping creation tests')
      
      // Test with existing user
      const userSessions = await SessionService.getUserActiveSessions(testUser.id)
      console.log(`✅ Found ${userSessions.length} active sessions for existing test user`)
    }
    
    // Test 4: Performance test - session stats
    console.log('\n⚡ Performance test - Session statistics...')
    const startTime = Date.now()
    const perfStats = await SessionService.getSessionStats()
    const endTime = Date.now()
    console.log(`✅ Session stats retrieved in ${endTime - startTime}ms`)
    console.log(`   - Active sessions: ${perfStats.totalActiveSessions}`)
    console.log(`   - Recent sessions shown: ${perfStats.recentSessions.length}`)
    
  } catch (error) {
    console.error('❌ Session management test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testSessionManagement().then(() => {
  console.log('\n✨ Session Management tests completed!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test suite failed:', error)
  process.exit(1)
})
