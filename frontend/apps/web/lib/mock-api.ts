import { apiService } from './api-service';

// Mock mode toggle - useful for development
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_API === 'true';

// Mock data generators
function generateMockProducts() {
  return [
    {
      id: '1',
      name: 'Samsung Galaxy S24',
      sku: 'SGS24-128-BLK',
      categoryId: '1',
      basePrice: 899999,
      stockQuantity: 25,
      minStockLevel: 5,
      status: 'ACTIVE' as const,
      description: 'Latest Samsung flagship smartphone with advanced camera system',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-08-15'),
    },
    {
      id: '2',
      name: 'iPhone 15 Pro Max',
      sku: 'IP15PM-256-TB',
      categoryId: '1',
      basePrice: 1399999,
      stockQuantity: 15,
      minStockLevel: 5,
      status: 'ACTIVE' as const,
      description: 'Premium iPhone with titanium build and pro camera features',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-08-10'),
    },
    {
      id: '3',
      name: 'MacBook Pro M3',
      sku: 'MBP-M3-14-SLV',
      categoryId: '3',
      basePrice: 1999999,
      stockQuantity: 0,
      minStockLevel: 3,
      status: 'ACTIVE' as const,
      description: '14-inch MacBook Pro with M3 chip, perfect for professionals',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-08-05'),
    },
    {
      id: '4',
      name: 'iPhone 15 Case',
      sku: 'IP15-CASE-CLR',
      categoryId: '2',
      basePrice: 29999,
      stockQuantity: 2,
      minStockLevel: 10,
      status: 'ACTIVE' as const,
      description: 'Protective clear case for iPhone 15',
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-08-12'),
    },
    {
      id: '5',
      name: 'Wireless Charger',
      sku: 'WC-FAST-15W',
      categoryId: '2',
      basePrice: 49999,
      stockQuantity: 50,
      minStockLevel: 10,
      status: 'ACTIVE' as const,
      description: '15W fast wireless charging pad compatible with all devices',
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date('2024-08-14'),
    },
  ];
}

function generateMockCustomers() {
  return [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Uwimana',
      email: 'john.uwimana@email.com',
      phone: '+250788123456',
      address: '123 KN 5 Ave, Kigali',
      loyaltyLevel: 'GOLD' as const,
      totalSpent: 2500000,
      lastPurchase: new Date('2024-08-10'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-08-10'),
    },
    {
      id: '2',
      firstName: 'Marie',
      lastName: 'Mukamana',
      email: 'marie.mukamana@email.com',
      phone: '+250788765432',
      address: '456 KG 2 St, Kigali',
      loyaltyLevel: 'SILVER' as const,
      totalSpent: 850000,
      lastPurchase: new Date('2024-08-12'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-08-12'),
    },
    {
      id: '3',
      firstName: 'David',
      lastName: 'Nkurunziza',
      email: 'david.nkurunziza@email.com',
      phone: '+250788987654',
      address: '789 KK 12 Ave, Kigali',
      loyaltyLevel: 'PLATINUM' as const,
      totalSpent: 5200000,
      lastPurchase: new Date('2024-08-14'),
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-08-14'),
    },
  ];
}

function generateMockSales() {
  return [
    {
      id: '1',
      receiptNumber: 'R001234',
      customerId: '1',
      userId: 'user1',
      items: [
        {
          id: 'item1',
          productId: '1',
          quantity: 1,
          unitPrice: 899999,
          totalPrice: 899999,
        }
      ],
      subtotal: 899999,
      taxAmount: 161999.82,
      totalAmount: 1061998.82,
      paymentMethod: 'CASH' as const,
      status: 'COMPLETED' as const,
      createdAt: new Date('2024-08-10'),
      updatedAt: new Date('2024-08-10'),
    },
    {
      id: '2',
      receiptNumber: 'R001235',
      customerId: '2',
      userId: 'user1',
      items: [
        {
          id: 'item2',
          productId: '4',
          quantity: 1,
          unitPrice: 29999,
          totalPrice: 29999,
        }
      ],
      subtotal: 29999,
      taxAmount: 5399.82,
      totalAmount: 35398.82,
      paymentMethod: 'MOBILE_MONEY' as const,
      status: 'COMPLETED' as const,
      createdAt: new Date('2024-08-12'),
      updatedAt: new Date('2024-08-12'),
    },
  ];
}

function generateMockAnalytics() {
  return {
    totalSales: 1247,
    totalRevenue: 24567890,
    averageOrderValue: 197100,
    topProducts: [
      {
        product: generateMockProducts()[0],
        quantitySold: 156,
        revenue: 140398440
      },
      {
        product: generateMockProducts()[1],
        quantitySold: 89,
        revenue: 124559911
      },
      {
        product: generateMockProducts()[4],
        quantitySold: 67,
        revenue: 3349933
      }
    ],
    salesByPeriod: [
      { period: '2024-08-10', sales: 45, revenue: 8923400 },
      { period: '2024-08-11', sales: 52, revenue: 10345600 },
      { period: '2024-08-12', sales: 38, revenue: 7589100 },
      { period: '2024-08-13', sales: 61, revenue: 12123400 },
      { period: '2024-08-14', sales: 48, revenue: 9567800 },
      { period: '2024-08-15', sales: 55, revenue: 10890100 },
      { period: '2024-08-16', sales: 42, revenue: 8345600 },
    ]
  };
}

// Enhanced API service with mock fallback
class EnhancedApiService {
  // Products
  async getProducts() {
    if (MOCK_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockProducts();
    }
    return apiService.getProducts();
  }

  async getProduct(id: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const products = generateMockProducts();
      const product = products.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return product;
    }
    return apiService.getProduct(id);
  }

  async createProduct(product: any) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        ...product,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return apiService.createProduct(product);
  }

  async updateProduct(id: string, product: any) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        ...product,
        id,
        updatedAt: new Date(),
      };
    }
    return apiService.updateProduct(id, product);
  }

  async deleteProduct(id: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return;
    }
    return apiService.deleteProduct(id);
  }

  async searchProducts(query: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const products = generateMockProducts();
      return products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      );
    }
    return apiService.searchProducts(query);
  }

  // Customers
  async getCustomers() {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockCustomers();
    }
    return apiService.getCustomers();
  }

  async getCustomer(id: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const customers = generateMockCustomers();
      const customer = customers.find(c => c.id === id);
      if (!customer) throw new Error('Customer not found');
      return customer;
    }
    return apiService.getCustomer(id);
  }

  async createCustomer(customer: any) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        ...customer,
        id: Date.now().toString(),
        totalSpent: 0,
        loyaltyLevel: 'BRONZE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return apiService.createCustomer(customer);
  }

  async updateCustomer(id: string, customer: any) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        ...customer,
        id,
        updatedAt: new Date(),
      };
    }
    return apiService.updateCustomer(id, customer);
  }

  async deleteCustomer(id: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return;
    }
    return apiService.deleteCustomer(id);
  }

  async searchCustomers(query: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const customers = generateMockCustomers();
      return customers.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
      );
    }
    return apiService.searchCustomers(query);
  }

  // Sales
  async getSales() {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 700));
      return generateMockSales();
    }
    return apiService.getSales();
  }

  async createSale(sale: any) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return {
        ...sale,
        id: Date.now().toString(),
        receiptNumber: `R${String(Date.now()).slice(-6)}`,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return apiService.createSale(sale);
  }

  // Analytics
  async getAnalytics(dateRange?: string) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 900));
      return generateMockAnalytics();
    }
    return apiService.getAnalytics(dateRange);
  }

  // Inventory
  async getLowStockProducts() {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const products = generateMockProducts();
      return products.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0);
    }
    return apiService.getLowStockProducts();
  }

  async updateStock(productId: string, quantity: number) {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const products = generateMockProducts();
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');
      return {
        ...product,
        stockQuantity: quantity,
        updatedAt: new Date(),
      };
    }
    return apiService.updateStock(productId, quantity);
  }
}

export const enhancedApiService = new EnhancedApiService();
