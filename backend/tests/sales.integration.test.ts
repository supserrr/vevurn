// Sales API Integration Test Script
// This script demonstrates the complete sales workflow

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateSaleRequest {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
    negotiatedPrice?: number;
    discountAmount?: number;
    discountPercentage?: number;
    discountReason?: string;
  }>;
  paymentMethod: 'CASH' | 'MTN_MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  currency: string;
  mtnTransactionId?: string;
  staffNotes?: string;
}

async function setupTestData() {
  console.log('Setting up test data...');

  // Clean existing test data
  await prisma.saleItem.deleteMany({ where: { sale: { receiptNumber: { startsWith: 'TEST' } } } });
  await prisma.sale.deleteMany({ where: { receiptNumber: { startsWith: 'TEST' } } });

  // Create test category
  const category = await prisma.category.upsert({
    where: { name: 'Test Electronics' },
    update: {},
    create: {
      name: 'Test Electronics',
      description: 'Electronics for testing',
      isActive: true,
    },
  });

  // Create test product
  const product = await prisma.product.upsert({
    where: { sku: 'TEST001' },
    update: {
      stockQuantity: 100,
      basePriceRwf: 1000,
    },
    create: {
      name: 'Test Product',
      sku: 'TEST001',
      basePriceRwf: 1000,
      minPriceRwf: 800,
      stockQuantity: 100,
      minStockLevel: 10,
      maxStockLevel: 200,
      isActive: true,
      category: {
        connect: { id: category.id }
      },
    },
  });

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test.cashier@vevurn.com' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'Cashier',
      email: 'test.cashier@vevurn.com',
      role: 'cashier',
      isActive: true,
    },
  });

  console.log('Test data setup complete.');
  return { category, product, user };
}

async function testSaleCreation(productId: string, cashierId: string) {
  console.log('\nTesting sale creation...');

  const saleData: CreateSaleRequest = {
    customerName: 'John Doe',
    customerPhone: '+250788123456',
    customerEmail: 'john@example.com',
    items: [
      {
        productId: productId,
        quantity: 2,
        basePrice: 1000,
        negotiatedPrice: 950,
        discountAmount: 50,
        discountPercentage: 5,
        discountReason: 'Customer loyalty'
      }
    ],
    paymentMethod: 'CASH',
    paymentStatus: 'COMPLETED',
    subtotal: 1900,
    taxAmount: 190,
    discountAmount: 100,
    totalAmount: 1990,
    currency: 'RWF',
    staffNotes: 'Regular customer - integration test'
  };

  try {
    // Simulate SalesService.createSale logic
    const receiptNumber = `TEST${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`;
    
    const sale = await prisma.sale.create({
      data: {
        receiptNumber,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone || null,
        customerEmail: saleData.customerEmail || null,
        paymentMethod: saleData.paymentMethod,
        paymentStatus: saleData.paymentStatus,
        subtotal: saleData.subtotal,
        taxAmount: saleData.taxAmount || 0,
        discountAmount: saleData.discountAmount || 0,
        totalAmount: saleData.totalAmount,
        currency: 'RWF' as any,
        mtnTransactionId: saleData.mtnTransactionId || null,
        staffNotes: saleData.staffNotes || null,
        status: 'COMPLETED',
        cashier: {
          connect: { id: cashierId }
        },
      },
    });

    // Create sale items
    for (const item of saleData.items) {
      // Get product details for snapshot
      const productDetails = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, sku: true }
      });

      await prisma.saleItem.create({
        data: {
          sale: {
            connect: { id: sale.id }
          },
          product: {
            connect: { id: item.productId }
          },
          quantity: item.quantity,
          basePrice: item.basePrice,
          negotiatedPrice: item.negotiatedPrice || item.basePrice,
          totalPrice: (item.negotiatedPrice || item.basePrice) * item.quantity,
          discountAmount: item.discountAmount || 0,
          discountPercentage: item.discountPercentage || 0,
          discountReason: item.discountReason || 'none',
          productName: productDetails?.name || 'Unknown Product',
          productSku: productDetails?.sku || 'UNKNOWN',
        },
      });

      // Update stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    console.log(`✓ Sale created successfully with receipt: ${sale.receiptNumber}`);
    console.log(`✓ Total amount: ${sale.totalAmount} ${sale.currency}`);
    
    return sale;
  } catch (error) {
    console.error('✗ Sale creation failed:', error);
    throw error;
  }
}

async function testSaleRetrieval(saleId: string) {
  console.log('\nTesting sale retrieval...');

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        cashier: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    console.log(`✓ Retrieved sale: ${sale.receiptNumber}`);
    console.log(`✓ Customer: ${sale.customerName}`);
    console.log(`✓ Items: ${sale.items.length}`);
    console.log(`✓ Cashier: ${sale.cashier.firstName} ${sale.cashier.lastName}`);
    
    return sale;
  } catch (error) {
    console.error('✗ Sale retrieval failed:', error);
    throw error;
  }
}

async function testSalesAnalytics() {
  console.log('\nTesting sales analytics...');

  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const totalSales = await prisma.sale.count({
      where: {
        createdAt: {
          gte: yesterday,
          lte: today,
        },
        status: 'COMPLETED',
      },
    });

    const totalRevenue = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: yesterday,
          lte: today,
        },
        status: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const salesByMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: yesterday,
          lte: today,
        },
        status: 'COMPLETED',
      },
      _count: {
        paymentMethod: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    console.log(`✓ Total sales: ${totalSales}`);
    console.log(`✓ Total revenue: ${totalRevenue._sum.totalAmount || 0}`);
    console.log(`✓ Sales by method:`, salesByMethod);
    
    return { totalSales, totalRevenue: totalRevenue._sum.totalAmount || 0, salesByMethod };
  } catch (error) {
    console.error('✗ Analytics retrieval failed:', error);
    throw error;
  }
}

async function runIntegrationTest() {
  console.log('🚀 Starting Sales API Integration Test');
  console.log('=====================================');

  try {
    // Setup
    const { product, user } = await setupTestData();

    // Test sale creation
    const sale = await testSaleCreation(product.id, user.id);

    // Test sale retrieval
    await testSaleRetrieval(sale.id);

    // Test analytics
    await testSalesAnalytics();

    console.log('\n✅ All integration tests passed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

export { runIntegrationTest, setupTestData, testSaleCreation };
