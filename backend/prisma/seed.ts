import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default categories
  const categories = [
    {
      name: 'Phone Cases',
      description: 'Protective cases for smartphones',
      color: '#3B82F6'
    },
    {
      name: 'Screen Protectors',
      description: 'Tempered glass and film protectors',
      color: '#10B981'
    },
    {
      name: 'Chargers & Cables',
      description: 'USB chargers, cables and adapters',
      color: '#F59E0B'
    },
    {
      name: 'Headphones & Audio',
      description: 'Earphones, headphones and speakers',
      color: '#8B5CF6'
    },
    {
      name: 'Phone Accessories',
      description: 'Stands, grips and other accessories',
      color: '#EF4444'
    }
  ];

  console.log('📂 Creating categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  // Create system settings (if you have a settings table)
  console.log('⚙️ Creating system settings...');
  
  // You can add more initial data here as needed
  // For example: default tax rates, business settings, etc.

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
