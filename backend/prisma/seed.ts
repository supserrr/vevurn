import { PrismaClient, UserRole, ProductStatus, PaymentMethod, SaleStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vevurn.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@vevurn.com',
      emailVerified: true,
      role: UserRole.ADMIN,
      isActive: true,
      employeeId: 'EMP001',
      phoneNumber: '+250788123456',
      department: 'Management',
      hireDate: new Date(),
      salary: 500000,
    },
  })

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@vevurn.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@vevurn.com',
      emailVerified: true,
      role: UserRole.MANAGER,
      isActive: true,
      employeeId: 'EMP002',
      phoneNumber: '+250788123457',
      department: 'Sales',
      hireDate: new Date(),
      salary: 300000,
    },
  })

  // Create cashier user
  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@vevurn.com' },
    update: {},
    create: {
      name: 'Cashier User',
      email: 'cashier@vevurn.com',
      emailVerified: true,
      role: UserRole.CASHIER,
      isActive: true,
      employeeId: 'EMP003',
      phoneNumber: '+250788123458',
      department: 'Sales',
      hireDate: new Date(),
      salary: 150000,
    },
  })

  console.log('👥 Created users:', { adminUser: adminUser.id, managerUser: managerUser.id, cashierUser: cashierUser.id })

  // Create categories
  const electronicsCategory = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      image: '/images/categories/electronics.jpg',
      isActive: true,
    },
  })

  const clothingCategory = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Apparel and fashion items',
      image: '/images/categories/clothing.jpg',
      isActive: true,
    },
  })

  const foodCategory = await prisma.category.upsert({
    where: { name: 'Food & Beverages' },
    update: {},
    create: {
      name: 'Food & Beverages',
      description: 'Food items and drinks',
      image: '/images/categories/food.jpg',
      isActive: true,
    },
  })

  console.log('📂 Created categories:', { 
    electronics: electronicsCategory.id, 
    clothing: clothingCategory.id, 
    food: foodCategory.id 
  })

  // Create suppliers
  const techSupplier = await prisma.supplier.upsert({
    where: { name: 'TechWorld Supply' },
    update: {},
    create: {
      name: 'TechWorld Supply',
      contactName: 'John Doe',
      email: 'john@techworld.com',
      phone: '+250788111111',
      address: 'Kigali, Rwanda',
      taxNumber: 'TAX001',
      paymentTerms: 'Net 30',
      isActive: true,
    },
  })

  const fashionSupplier = await prisma.supplier.upsert({
    where: { name: 'Fashion Forward Ltd' },
    update: {},
    create: {
      name: 'Fashion Forward Ltd',
      contactName: 'Jane Smith',
      email: 'jane@fashionforward.com',
      phone: '+250788222222',
      address: 'Kigali, Rwanda',
      taxNumber: 'TAX002',
      paymentTerms: 'Net 15',
      isActive: true,
    },
  })

  console.log('🏢 Created suppliers:', { tech: techSupplier.id, fashion: fashionSupplier.id })

  // Create sample products
  const smartphone = await prisma.product.upsert({
    where: { sku: 'PHONE001' },
    update: {},
    create: {
      name: 'Smartphone Pro Max',
      description: 'Latest smartphone with advanced features',
      sku: 'PHONE001',
      barcode: '1234567890123',
      categoryId: electronicsCategory.id,
      supplierId: techSupplier.id,
      costPrice: 800000,
      wholesalePrice: 950000,
      retailPrice: 1200000,
      minPrice: 900000,
      stockQuantity: 25,
      minStockLevel: 5,
      maxStockLevel: 100,
      reorderPoint: 10,
      brand: 'TechBrand',
      model: 'Pro Max 2024',
      color: 'Black',
      size: '6.7 inch',
      weight: 228,
      dimensions: '160.8 x 78.1 x 7.65 mm',
      status: ProductStatus.ACTIVE,
      tags: ['smartphone', 'electronics', 'mobile'],
      createdById: adminUser.id,
    },
  })

  const tshirt = await prisma.product.upsert({
    where: { sku: 'SHIRT001' },
    update: {},
    create: {
      name: 'Classic Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt for everyday wear',
      sku: 'SHIRT001',
      barcode: '2345678901234',
      categoryId: clothingCategory.id,
      supplierId: fashionSupplier.id,
      costPrice: 8000,
      wholesalePrice: 12000,
      retailPrice: 18000,
      minPrice: 10000,
      stockQuantity: 50,
      minStockLevel: 10,
      reorderPoint: 15,
      brand: 'FashionBrand',
      color: 'White',
      size: 'M',
      status: ProductStatus.ACTIVE,
      tags: ['clothing', 'cotton', 'casual'],
      createdById: adminUser.id,
    },
  })

  // Create product variations for the t-shirt
  const tshirtVariations = [
    { size: 'S', color: 'White', stock: 15 },
    { size: 'M', color: 'White', stock: 20 },
    { size: 'L', color: 'White', stock: 15 },
    { size: 'M', color: 'Black', stock: 18 },
    { size: 'L', color: 'Black', stock: 12 },
  ]

  for (const variation of tshirtVariations) {
    await prisma.productVariation.create({
      data: {
        productId: tshirt.id,
        name: `Classic Cotton T-Shirt - ${variation.color} - ${variation.size}`,
        sku: `SHIRT001-${variation.color}-${variation.size}`,
        attributes: {
          size: variation.size,
          color: variation.color,
        },
        stockQuantity: variation.stock,
        isActive: true,
      },
    })
  }

  console.log('📱 Created products:', { smartphone: smartphone.id, tshirt: tshirt.id })

  // Create a sample customer
  const customer = await prisma.customer.upsert({
    where: { email: 'john.customer@email.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Customer',
      email: 'john.customer@email.com',
      phone: '+250788999999',
      address: 'Kigali, Rwanda',
      city: 'Kigali',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'Male',
      totalSpent: 0,
      totalPurchases: 0,
      preferredPaymentMethod: PaymentMethod.MOBILE_MONEY,
      tags: ['regular', 'tech-lover'],
      isActive: true,
    },
  })

  console.log('👤 Created customer:', customer.id)

  // Create system settings
  const settings = [
    { key: 'TAX_RATE', value: '18', type: 'NUMBER', category: 'TAX', description: 'Default tax rate percentage' },
    { key: 'CURRENCY', value: 'RWF', type: 'STRING', category: 'GENERAL', description: 'Default currency' },
    { key: 'COMPANY_NAME', value: 'Vevurn POS', type: 'STRING', category: 'COMPANY', description: 'Company name for receipts' },
    { key: 'COMPANY_ADDRESS', value: 'Kigali, Rwanda', type: 'STRING', category: 'COMPANY', description: 'Company address' },
    { key: 'COMPANY_PHONE', value: '+250788000000', type: 'STRING', category: 'COMPANY', description: 'Company phone number' },
    { key: 'RECEIPT_FOOTER', value: 'Thank you for your business!', type: 'STRING', category: 'RECEIPT', description: 'Footer text for receipts' },
    { key: 'LOW_STOCK_THRESHOLD', value: '10', type: 'NUMBER', category: 'INVENTORY', description: 'Default low stock alert threshold' },
    { key: 'AUTO_GENERATE_BARCODES', value: 'true', type: 'BOOLEAN', category: 'PRODUCT', description: 'Automatically generate barcodes for new products' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('⚙️ Created system settings')

  // Create audit log entry for seeding
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SEED_DATABASE',
      resourceType: 'DATABASE',
      newValues: {
        message: 'Database seeded with initial data',
        timestamp: new Date().toISOString(),
      },
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
