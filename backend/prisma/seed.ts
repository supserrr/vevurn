import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vevurn.com' },
    update: {},
    create: {
      email: 'admin@vevurn.com',
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    }
  });

  // Create additional users
  console.log('👥 Creating additional users...');
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@vevurn.com' },
    update: {},
    create: {
      email: 'manager@vevurn.com',
      name: 'Store Manager',
      role: 'MANAGER',
      isActive: true,
      emailVerified: true,
    }
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@vevurn.com' },
    update: {},
    create: {
      email: 'cashier@vevurn.com',
      name: 'Sales Cashier',
      role: 'CASHIER',
      isActive: true,
      emailVerified: true,
    }
  });

  // Create categories
  console.log('📂 Creating product categories...');
  const categories = [
    { name: 'Phone Cases', description: 'Protective cases for smartphones', color: '#3B82F6' },
    { name: 'Screen Protectors', description: 'Screen protection films and glass', color: '#10B981' },
    { name: 'Chargers', description: 'Charging cables and adapters', color: '#F59E0B' },
    { name: 'Headphones', description: 'Audio accessories and headphones', color: '#8B5CF6' },
    { name: 'Power Banks', description: 'Portable charging devices', color: '#EF4444' },
    { name: 'Phone Holders', description: 'Car mounts and stands', color: '#06B6D4' },
    { name: 'Memory Cards', description: 'SD cards and flash drives', color: '#84CC16' },
    { name: 'Bluetooth Devices', description: 'Wireless accessories', color: '#F97316' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  // Create suppliers
  console.log('🏢 Creating suppliers...');
  const suppliers = [
    {
      name: 'Global Tech Supplies',
      contactName: 'John Smith',
      email: 'john@globaltechsupplies.com',
      phone: '+250788123456',
      address: 'Kigali Tech Hub, Kigali, Rwanda'
    },
    {
      name: 'Mobile Accessories Direct',
      contactName: 'Sarah Johnson',
      email: 'sarah@mobileaccessories.com',
      phone: '+250788765432',
      address: 'Nyarutarama, Kigali, Rwanda'
    },
    {
      name: 'East Africa Electronics',
      contactName: 'David Mukama',
      email: 'david@eaelectronics.rw',
      phone: '+250788999888',
      address: 'Remera, Kigali, Rwanda'
    }
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      update: {},
      create: supplier
    });
  }

  // Get created entities for reference
  const phoneCasesCategory = await prisma.category.findUnique({ where: { name: 'Phone Cases' } });
  const screenProtectorsCategory = await prisma.category.findUnique({ where: { name: 'Screen Protectors' } });
  const chargersCategory = await prisma.category.findUnique({ where: { name: 'Chargers' } });
  const headphonesCategory = await prisma.category.findUnique({ where: { name: 'Headphones' } });
  const powerBanksCategory = await prisma.category.findUnique({ where: { name: 'Power Banks' } });
  const globalSupplier = await prisma.supplier.findUnique({ where: { name: 'Global Tech Supplies' } });
  const mobileSupplier = await prisma.supplier.findUnique({ where: { name: 'Mobile Accessories Direct' } });

  // Create comprehensive product catalog
  console.log('📱 Creating comprehensive product catalog...');
  const products = [
    // Phone Cases
    {
      name: 'iPhone 15 Pro Clear Case',
      description: 'Crystal clear protective case for iPhone 15 Pro with shock absorption',
      sku: 'CASE-IPH15P-CLR',
      barcode: '1234567890001',
      categoryId: phoneCasesCategory!.id,
      supplierId: globalSupplier!.id,
      costPrice: 8000,
      wholesalePrice: 12000,
      retailPrice: 18000,
      minPrice: 10000,
      stockQuantity: 50,
      minStockLevel: 10,
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      color: 'Clear',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    {
      name: 'Samsung Galaxy S24 Leather Case',
      description: 'Premium leather case for Samsung Galaxy S24',
      sku: 'CASE-SAM24-LEA',
      barcode: '1234567890002',
      categoryId: phoneCasesCategory!.id,
      supplierId: mobileSupplier!.id,
      costPrice: 12000,
      wholesalePrice: 18000,
      retailPrice: 25000,
      minPrice: 15000,
      stockQuantity: 30,
      minStockLevel: 8,
      brand: 'Samsung',
      model: 'Galaxy S24',
      color: 'Black',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    // Screen Protectors
    {
      name: 'iPhone 15 Screen Protector',
      description: 'Tempered glass screen protector for iPhone 15',
      sku: 'SCRN-IPH15-TMP',
      barcode: '1234567890003',
      categoryId: screenProtectorsCategory!.id,
      supplierId: globalSupplier!.id,
      costPrice: 3000,
      wholesalePrice: 4500,
      retailPrice: 7000,
      minPrice: 4000,
      stockQuantity: 100,
      minStockLevel: 20,
      brand: 'Generic',
      model: 'iPhone 15',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    {
      name: 'Samsung Galaxy S24 Screen Protector',
      description: 'Tempered glass screen protector for Galaxy S24',
      sku: 'SCRN-SAM24-TMP',
      barcode: '1234567890004',
      categoryId: screenProtectorsCategory!.id,
      supplierId: globalSupplier!.id,
      costPrice: 3000,
      wholesalePrice: 4500,
      retailPrice: 7000,
      minPrice: 4000,
      stockQuantity: 80,
      minStockLevel: 15,
      brand: 'Samsung',
      model: 'Galaxy S24',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    // Chargers
    {
      name: 'USB-C Fast Charger 25W',
      description: '25W USB-C fast charging adapter',
      sku: 'CHRG-USBC-25W',
      barcode: '1234567890005',
      categoryId: chargersCategory!.id,
      supplierId: globalSupplier!.id,
      costPrice: 12000,
      wholesalePrice: 18000,
      retailPrice: 25000,
      minPrice: 15000,
      stockQuantity: 40,
      minStockLevel: 10,
      brand: 'Generic',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    {
      name: 'Lightning Cable 2M',
      description: '2 meter lightning to USB-A cable',
      sku: 'CABL-LGHT-2M',
      barcode: '1234567890006',
      categoryId: chargersCategory!.id,
      supplierId: mobileSupplier!.id,
      costPrice: 5000,
      wholesalePrice: 8000,
      retailPrice: 12000,
      minPrice: 7000,
      stockQuantity: 60,
      minStockLevel: 15,
      brand: 'Apple',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    // Headphones
    {
      name: 'Wireless Earbuds Pro',
      description: 'Premium wireless earbuds with noise cancellation',
      sku: 'HPHON-WRLSS-PRO',
      barcode: '1234567890007',
      categoryId: headphonesCategory!.id,
      supplierId: globalSupplier!.id,
      costPrice: 35000,
      wholesalePrice: 50000,
      retailPrice: 75000,
      minPrice: 45000,
      stockQuantity: 25,
      minStockLevel: 5,
      brand: 'Generic',
      color: 'White',
      createdById: adminUser.id,
      updatedById: adminUser.id
    },
    // Power Banks
    {
      name: '10000mAh Power Bank',
      description: 'Portable power bank with 10000mAh capacity',
      sku: 'PWRBNK-10K-BLK',
      barcode: '1234567890008',
      categoryId: powerBanksCategory!.id,
      supplierId: mobileSupplier!.id,
      costPrice: 18000,
      wholesalePrice: 25000,
      retailPrice: 35000,
      minPrice: 22000,
      stockQuantity: 35,
      minStockLevel: 8,
      brand: 'Generic',
      color: 'Black',
      createdById: adminUser.id,
      updatedById: adminUser.id
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }

  // Create sample customers
  console.log('👥 Creating sample customers...');
  const customers = [
    {
      firstName: 'Jean Baptiste',
      lastName: 'Uwimana',
      email: 'jean.uwimana@gmail.com',
      phone: '+250788111111',
      address: 'Kimisagara, Nyarugenge, Kigali',
      customerType: 'REGULAR'
    },
    {
      firstName: 'Marie Claire',
      lastName: 'Mukamana',
      email: 'marie.mukamana@yahoo.com',
      phone: '+250788222222',
      address: 'Remera, Gasabo, Kigali',
      customerType: 'WHOLESALE'
    },
    {
      firstName: 'Tech Solutions Ltd',
      email: 'info@techsolutions.rw',
      phone: '+250788333333',
      address: 'Nyarutarama, Gasabo, Kigali',
      companyName: 'Tech Solutions Ltd',
      taxNumber: 'TIN123456789',
      customerType: 'BUSINESS'
    },
    {
      firstName: 'Alice',
      lastName: 'Umutesi',
      email: 'alice.umutesi@hotmail.com',
      phone: '+250788444444',
      address: 'Kacyiru, Gasabo, Kigali',
      customerType: 'REGULAR'
    },
    {
      firstName: 'Paul',
      lastName: 'Nkurunziza',
      email: 'paul.nkurunziza@gmail.com',
      phone: '+250788555555',
      address: 'Gikondo, Kicukiro, Kigali',
      customerType: 'WHOLESALE'
    }
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: customer
    });
  }

  // Create sample sales
  console.log('💰 Creating sample sales transactions...');
  const sampleCustomer = await prisma.customer.findUnique({ 
    where: { email: 'jean.uwimana@gmail.com' } 
  });
  
  const sampleProduct = await prisma.product.findUnique({ 
    where: { sku: 'CASE-IPH15P-CLR' } 
  });

  if (sampleCustomer && sampleProduct) {
    const sale = await prisma.sale.create({
      data: {
        saleNumber: 'SALE-20250827-0001',
        customerId: sampleCustomer.id,
        cashierId: cashierUser.id,
        subtotal: 18000,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 18000,
        status: 'COMPLETED',
        paymentMethod: 'CASH'
      }
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: sampleProduct.id,
        quantity: 1,
        unitPrice: 18000,
        totalPrice: 18000
      }
    });

    await prisma.payment.create({
      data: {
        saleId: sale.id,
        amount: 18000,
        method: 'CASH',
        status: 'COMPLETED'
      }
    });
  }

  // Create sample invoices
  console.log('📄 Creating sample invoices...');
  const businessCustomer = await prisma.customer.findUnique({ 
    where: { email: 'info@techsolutions.rw' } 
  });

  if (businessCustomer && sampleProduct) {
    const businessSale = await prisma.sale.create({
      data: {
        saleNumber: 'SALE-20250827-0002',
        customerId: businessCustomer.id,
        cashierId: managerUser.id,
        subtotal: 90000, // 5 units
        taxAmount: 16200, // 18% tax
        discountAmount: 5000, // Bulk discount
        totalAmount: 101200,
        status: 'COMPLETED',
        paymentMethod: 'BANK_TRANSFER'
      }
    });

    await prisma.saleItem.create({
      data: {
        saleId: businessSale.id,
        productId: sampleProduct.id,
        quantity: 5,
        unitPrice: 18000,
        totalPrice: 90000
      }
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-20250827-0001',
        saleId: businessSale.id,
        customerId: businessCustomer.id,
        subtotal: 90000,
        taxAmount: 16200,
        discountAmount: 5000,
        totalAmount: 101200,
        amountPaid: 0,
        status: 'SENT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentTerms: 'Net 30',
        notes: 'Bulk order for Tech Solutions Ltd'
      }
    });
  }

  console.log('✅ Comprehensive database seeding completed successfully!');
  console.log('');
  console.log('🔑 Test Accounts Created:');
  console.log('  👤 Admin: admin@vevurn.com (password: admin123)');
  console.log('  👤 Manager: manager@vevurn.com (password: admin123)');
  console.log('  👤 Cashier: cashier@vevurn.com (password: admin123)');
  console.log('');
  console.log('📊 Data Summary:');
  console.log(`  📂 Categories: ${categories.length}`);
  console.log(`  🏢 Suppliers: ${suppliers.length}`);
  console.log(`  📱 Products: ${products.length}`);
  console.log(`  👥 Customers: ${customers.length}`);
  console.log('  💰 Sample sales and invoices created');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });