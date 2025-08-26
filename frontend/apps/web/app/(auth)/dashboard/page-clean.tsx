'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { MobileDashboard } from '@/components/mobile/MobileDashboard';

interface DashboardStats {
  todaySales: {
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
  topProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
    category: string;
  }>;
  inventoryAlerts: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
    status: 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    amount: number | null;
    timestamp: string;
  }>;
}

const fetchDashboardStats = async (): Promise<{ data: DashboardStats }> => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const productsResponse = await fetch(`${API_BASE}/api/products`, {
      credentials: 'include',
    });

    if (!productsResponse.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const productsData = await productsResponse.json();
    const products = productsData.data || [];
    
    const totalProducts = products.length;
    const lowStockProducts = products.filter((product: any) => 
      product.stockQuantity <= product.minStockLevel
    );

    // Mock dashboard stats
    const mockStats: DashboardStats = {
      todaySales: {
        totalRevenue: 450000,
        totalOrders: 12,
        averageOrderValue: 37500,
      },
      paymentMethods: [
        { method: 'Cash', count: 7, amount: 210000, percentage: 46.7 },
        { method: 'Mobile Money', count: 4, amount: 180000, percentage: 40.0 },
        { method: 'Card', count: 1, amount: 60000, percentage: 13.3 },
      ],
      topProducts: products.slice(0, 5).map((product: any) => ({
        id: product.id,
        name: product.name,
        quantitySold: Math.floor(Math.random() * 10) + 1,
        revenue: parseFloat(product.retailPrice) * (Math.floor(Math.random() * 10) + 1),
        category: product.category || 'General',
      })),
      inventoryAlerts: lowStockProducts.slice(0, 10).map((product: any) => ({
        id: product.id,
        name: product.name,
        currentStock: product.stockQuantity,
        minStock: product.minStockLevel,
        status: product.stockQuantity === 0 ? 'OUT_OF_STOCK' as const : 'LOW_STOCK' as const,
      })),
      recentActivity: [
        {
          id: '1',
          type: 'SALE',
          description: 'Sale #1001 completed',
          amount: 25000,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'PRODUCT_ADDED',
          description: 'New product "Coffee Beans" added',
          amount: null,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'PAYMENT_RECEIVED',
          description: 'Payment received for Invoice #INV-1002',
          amount: 85000,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    };

    return { data: mockStats };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    data: statsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  const stats = statsData?.data;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-red-500">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  // Mobile view
  if (isMobile && stats) {
    return (
      <MobileDashboard stats={{
        todaysSales: stats.todaySales.totalRevenue,
        todaysTransactions: stats.todaySales.totalOrders,
        lowStockItems: stats.inventoryAlerts.length,
        totalProducts: 100,
        pendingInvoices: 5,
        overdueInvoices: stats.inventoryAlerts.filter(alert => alert.status === 'OUT_OF_STOCK').length,
        totalCustomers: 250,
        weeklyGrowth: 12.5
      }} />
    );
  }

  // Desktop view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => router.push('/products')} variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Manage Products
          </Button>
          <Button onClick={() => router.push('/sales')} className="bg-green-600 hover:bg-green-700">
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.todaySales.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +15% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySales.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                +3 from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.todaySales.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inventoryAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Alerts */}
      {stats && stats.inventoryAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.inventoryAlerts.map((product) => (
                <div key={product.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Current: {product.currentStock} | Min: {product.minStock}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => router.push('/products')}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
