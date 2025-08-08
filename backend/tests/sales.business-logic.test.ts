// Sales Business Logic Test - No Database Required
// This test validates the core sales logic without requiring database connection

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

interface Product {
  id: string;
  name: string;
  sku: string;
  basePriceRwf: number;
  minPriceRwf: number;
  stockQuantity: number;
}

class SalesBusinessLogic {
  static generateReceiptNumber(date: Date = new Date()): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = '0001'; // In real implementation, this would be from database
    return `VEV${dateStr}${counter}`;
  }

  static calculateItemTotal(basePrice: number, quantity: number, negotiatedPrice?: number): number {
    const finalPrice = negotiatedPrice || basePrice;
    return finalPrice * quantity;
  }

  static calculateDiscount(basePrice: number, negotiatedPrice: number, quantity: number): {
    discountAmount: number;
    discountPercentage: number;
  } {
    const discountAmount = (basePrice - negotiatedPrice) * quantity;
    const discountPercentage = basePrice > 0 ? ((basePrice - negotiatedPrice) / basePrice) * 100 : 0;
    
    return {
      discountAmount: Math.max(0, discountAmount),
      discountPercentage: Math.max(0, Math.round(discountPercentage * 100) / 100)
    };
  }

  static validateStockAvailability(products: Product[], requestedItems: CreateSaleRequest['items']): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    for (const item of requestedItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }
      
      if (product.stockQuantity < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Required: ${item.quantity}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePricing(products: Product[], requestedItems: CreateSaleRequest['items']): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    for (const item of requestedItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
      
      const negotiatedPrice = item.negotiatedPrice || item.basePrice;
      if (negotiatedPrice < product.minPriceRwf) {
        errors.push(`Price ${negotiatedPrice} for ${product.name} is below minimum price ${product.minPriceRwf}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static calculateSaleTotals(items: CreateSaleRequest['items']): {
    subtotal: number;
    totalDiscount: number;
    calculatedTotal: number;
  } {
    let subtotal = 0;
    let totalDiscount = 0;
    
    for (const item of items) {
      const itemSubtotal = item.basePrice * item.quantity;
      const itemTotal = (item.negotiatedPrice || item.basePrice) * item.quantity;
      
      subtotal += itemSubtotal;
      totalDiscount += (itemSubtotal - itemTotal);
    }
    
    return {
      subtotal,
      totalDiscount: Math.max(0, totalDiscount),
      calculatedTotal: subtotal - totalDiscount
    };
  }
}

// Test runner
function runBusinessLogicTests() {
  console.log('🚀 Starting Sales Business Logic Tests');
  console.log('=====================================');

  let passed = 0;
  let failed = 0;

  // Test receipt number generation
  console.log('\n1. Testing receipt number generation...');
  try {
    const receiptNumber = SalesBusinessLogic.generateReceiptNumber(new Date('2024-08-08'));
    const expected = 'VEV202408080001';
    if (receiptNumber === expected) {
      console.log(`✓ Receipt number generated correctly: ${receiptNumber}`);
      passed++;
    } else {
      console.log(`✗ Expected ${expected}, got ${receiptNumber}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ Receipt generation failed: ${error}`);
    failed++;
  }

  // Test item total calculation
  console.log('\n2. Testing item total calculation...');
  try {
    const total1 = SalesBusinessLogic.calculateItemTotal(1000, 2); // No negotiation
    const total2 = SalesBusinessLogic.calculateItemTotal(1000, 2, 950); // With negotiation
    
    if (total1 === 2000 && total2 === 1900) {
      console.log(`✓ Item totals calculated correctly: ${total1}, ${total2}`);
      passed++;
    } else {
      console.log(`✗ Expected 2000, 1900, got ${total1}, ${total2}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ Item total calculation failed: ${error}`);
    failed++;
  }

  // Test discount calculation
  console.log('\n3. Testing discount calculation...');
  try {
    const discount = SalesBusinessLogic.calculateDiscount(1000, 950, 2);
    
    if (discount.discountAmount === 100 && discount.discountPercentage === 5) {
      console.log(`✓ Discount calculated correctly: ${discount.discountAmount} (${discount.discountPercentage}%)`);
      passed++;
    } else {
      console.log(`✗ Expected 100 (5%), got ${discount.discountAmount} (${discount.discountPercentage}%)`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ Discount calculation failed: ${error}`);
    failed++;
  }

  // Test stock validation
  console.log('\n4. Testing stock validation...');
  try {
    const products: Product[] = [
      { id: '1', name: 'Test Product', sku: 'TEST001', basePriceRwf: 1000, minPriceRwf: 800, stockQuantity: 10 }
    ];
    
    const validItems = [{ productId: '1', quantity: 5, basePrice: 1000 }];
    const invalidItems = [{ productId: '1', quantity: 15, basePrice: 1000 }];
    
    const validResult = SalesBusinessLogic.validateStockAvailability(products, validItems);
    const invalidResult = SalesBusinessLogic.validateStockAvailability(products, invalidItems);
    
    if (validResult.isValid && !invalidResult.isValid) {
      console.log(`✓ Stock validation working: Valid=${validResult.isValid}, Invalid=${invalidResult.isValid}`);
      console.log(`  Error: ${invalidResult.errors[0]}`);
      passed++;
    } else {
      console.log(`✗ Stock validation failed`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ Stock validation failed: ${error}`);
    failed++;
  }

  // Test pricing validation
  console.log('\n5. Testing pricing validation...');
  try {
    const products: Product[] = [
      { id: '1', name: 'Test Product', sku: 'TEST001', basePriceRwf: 1000, minPriceRwf: 800, stockQuantity: 10 }
    ];
    
    const validItems = [{ productId: '1', quantity: 1, basePrice: 1000, negotiatedPrice: 900 }];
    const invalidItems = [{ productId: '1', quantity: 1, basePrice: 1000, negotiatedPrice: 700 }];
    
    const validResult = SalesBusinessLogic.validatePricing(products, validItems);
    const invalidResult = SalesBusinessLogic.validatePricing(products, invalidItems);
    
    if (validResult.isValid && !invalidResult.isValid) {
      console.log(`✓ Pricing validation working: Valid=${validResult.isValid}, Invalid=${invalidResult.isValid}`);
      console.log(`  Error: ${invalidResult.errors[0]}`);
      passed++;
    } else {
      console.log(`✗ Pricing validation failed`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ Pricing validation failed: ${error}`);
    failed++;
  }

  // Test sale totals calculation
  console.log('\n6. Testing sale totals calculation...');
  try {
    const items = [
      { productId: '1', quantity: 2, basePrice: 1000, negotiatedPrice: 950 },
      { productId: '2', quantity: 1, basePrice: 500, negotiatedPrice: 500 }
    ];
    
    const totals = SalesBusinessLogic.calculateSaleTotals(items);
    const expectedSubtotal = 2500; // (1000 * 2) + (500 * 1)
    const expectedDiscount = 100;  // (1000 - 950) * 2 + 0
    const expectedTotal = 2400;    // 2500 - 100
    
    if (totals.subtotal === expectedSubtotal && 
        totals.totalDiscount === expectedDiscount && 
        totals.calculatedTotal === expectedTotal) {
      console.log(`✓ Sale totals calculated correctly:`);
      console.log(`  Subtotal: ${totals.subtotal}, Discount: ${totals.totalDiscount}, Total: ${totals.calculatedTotal}`);
      passed++;
    } else {
      console.log(`✗ Expected subtotal: ${expectedSubtotal}, discount: ${expectedDiscount}, total: ${expectedTotal}`);
      console.log(`  Got subtotal: ${totals.subtotal}, discount: ${totals.totalDiscount}, total: ${totals.calculatedTotal}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ Sale totals calculation failed: ${error}`);
    failed++;
  }

  // Summary
  console.log('\n=====================================');
  if (failed === 0) {
    console.log(`✅ All ${passed} business logic tests passed!`);
    console.log('🎉 Sales business logic is working correctly!');
  } else {
    console.log(`❌ ${failed} tests failed, ${passed} tests passed`);
  }
  console.log('=====================================');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBusinessLogicTests();
}

export { SalesBusinessLogic, runBusinessLogicTests };
