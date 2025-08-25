import { NextRequest, NextResponse } from 'next/server';

interface DashboardStats {
  todaysSales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  recentSales: Array<{
    id: string;
    customerName?: string;
    amount: number;
    paymentMethod: string;
    timestamp: string;
    items: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  stockAlerts: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStockLevel: number;
  }>;
}

// Mock data - replace with actual database queries
const getMockDashboardData = (): DashboardStats => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    todaysSales: {
      totalRevenue: 2750000, // RWF
      totalOrders: 18,
      averageOrderValue: 152777, // RWF
    },
    paymentMethods: [
      {
        method: 'MOBILE_MONEY',
        count: 12,
        amount: 1650000,
        percentage: 60,
      },
      {
        method: 'CASH',
        count: 5,
        amount: 825000,
        percentage: 30,
      },
      {
        method: 'BANK_TRANSFER',
        count: 1,
        amount: 275000,
        percentage: 10,
      },
    ],
    recentSales: [
      {
        id: 'sale-001',
        customerName: 'Jean Baptiste',
        amount: 185000,
        paymentMethod: 'MOBILE_MONEY',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        items: 3,
      },
      {
        id: 'sale-002',
        customerName: 'Marie Claire',
        amount: 95000,
        paymentMethod: 'CASH',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        items: 2,
      },
      {
        id: 'sale-003',
        customerName: 'Walk-in Customer',
        amount: 65000,
        paymentMethod: 'MOBILE_MONEY',
        timestamp: new Date(now.getTime() - 75 * 60 * 1000).toISOString(), // 1 hour 15 minutes ago
        items: 1,
      },
      {
        id: 'sale-004',
        customerName: 'Agnes Mukamana',
        amount: 275000,
        paymentMethod: 'BANK_TRANSFER',
        timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), // 2 hours ago
        items: 5,
      },
      {
        id: 'sale-005',
        customerName: 'Eric Niyonzima',
        amount: 125000,
        paymentMethod: 'CASH',
        timestamp: new Date(now.getTime() - 180 * 60 * 1000).toISOString(), // 3 hours ago
        items: 2,
      },
    ],
    topProducts: [
      {
        id: 'prod-001',
        name: 'iPhone 15 Pro Case',
        quantitySold: 8,
        revenue: 640000,
      },
      {
        id: 'prod-002',
        name: 'Samsung Galaxy Charger',
        quantitySold: 12,
        revenue: 360000,
      },
      {
        id: 'prod-003',
        name: 'AirPods Pro 2',
        quantitySold: 3,
        revenue: 825000,
      },
      {
        id: 'prod-004',
        name: 'Screen Protector Kit',
        quantitySold: 15,
        revenue: 225000,
      },
      {
        id: 'prod-005',
        name: 'Bluetooth Speaker',
        quantitySold: 4,
        revenue: 480000,
      },
    ],
    stockAlerts: [
      {
        id: 'prod-006',
        name: 'iPhone 14 Pro Max Case',
        currentStock: 3,
        minStockLevel: 10,
      },
      {
        id: 'prod-007',
        name: 'USB-C Cable 2m',
        currentStock: 2,
        minStockLevel: 15,
      },
      {
        id: 'prod-008',
        name: 'Wireless Charger Pad',
        currentStock: 1,
        minStockLevel: 8,
      },
    ],
  };
};

// In a real application, these would be database queries
const getDashboardStats = async (): Promise<DashboardStats> => {
  // Example database queries - uncomment and adapt for your database
  
  /*
  // Get today's sales stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todaysSales = await prisma.sale.aggregate({
    where: {
      createdAt: {
        gte: todayStart,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Get payment method breakdown
  const paymentMethods = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: {
      createdAt: {
        gte: todayStart,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Get recent sales
  const recentSales = await prisma.sale.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      customer: {
        select: {
          name: true,
        },
      },
      items: true,
    },
  });

  // Get top products
  const topProducts = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: {
      sale: {
        createdAt: {
          gte: todayStart,
        },
      },
    },
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: {
      _sum: {
        totalPrice: 'desc',
      },
    },
    take: 5,
  });

  // Get stock alerts
  const stockAlerts = await prisma.product.findMany({
    where: {
      currentStock: {
        lte: prisma.product.fields.minStockLevel,
      },
    },
    select: {
      id: true,
      name: true,
      currentStock: true,
      minStockLevel: true,
    },
    take: 10,
  });
  */

  // For now, return mock data
  return getMockDashboardData();
};

export async function GET(request: NextRequest) {
  try {
    // In production, you'd verify authentication here
    // const user = await verifyAuthToken(request);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
      },
      { status: 500 }
    );
  }
}

// Optional: Add a POST endpoint for refreshing specific stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh } = body;

    if (refresh === 'stats') {
      const stats = await getDashboardStats();
      
      return NextResponse.json({
        success: true,
        data: stats,
        refreshed: true,
      });
    }

    return NextResponse.json(
      { error: 'Invalid refresh request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Dashboard refresh error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh dashboard data',
      },
      { status: 500 }
    );
  }
}
