import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Count records in key tables
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    const categoryCount = await prisma.category.count()
    
    console.log('📊 Database Stats:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Products: ${productCount}`)
    console.log(`   Categories: ${categoryCount}`)
    
    // Test a simple query with relations
    const usersWithRoles = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('\n👥 Users in system:')
    usersWithRoles.forEach(user => {
      console.log(`   ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`)
    })
    
    console.log('\n✅ Database schema test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
