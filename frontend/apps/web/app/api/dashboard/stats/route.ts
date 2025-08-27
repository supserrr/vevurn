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

// Forward request to backend API
const getDashboardStats = async (): Promise<DashboardStats> => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${backendUrl}/api/dashboard/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const backendData = await response.json();
    
    // Transform backend data to frontend format
    return {
      todaysSales: {
        totalRevenue: backendData.data?.todaySales?.totalRevenue || 0,
        totalOrders: backendData.data?.todaySales?.totalOrders || 0,
        averageOrderValue: backendData.data?.todaySales?.averageOrderValue || 0,
      },
      paymentMethods: backendData.data?.paymentMethods || [],
      recentSales: backendData.data?.recentActivity?.map((activity: any) => ({
        id: activity.id,
        customerName: activity.description?.includes('Sale to') 
          ? activity.description.replace('Sale to ', '') 
          : 'Walk-in Customer',
        amount: activity.amount || 0,
        paymentMethod: 'CASH', // Default - TODO: add payment method to activity
        timestamp: activity.timestamp,
        items: 1, // Default - TODO: add item count to activity
      })) || [],
      topProducts: backendData.data?.topProducts || [],
      stockAlerts: backendData.data?.inventoryAlerts?.map((alert: any) => ({
        id: alert.id,
        name: alert.name,
        currentStock: alert.currentStock,
        minStockLevel: alert.minStock,
      })) || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard data from backend:', error);
    // Return empty data structure instead of mock data
    return {
      todaysSales: {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      },
      paymentMethods: [],
      recentSales: [],
      topProducts: [],
      stockAlerts: [],
    };
  }
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
