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
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
}

async function fetchDashboardStats(): Promise<{ data: DashboardStats }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // For now, let's fetch products and create mock stats
  // Later this can be replaced with a real dashboard API endpoint
  const productsResponse = await fetch(`${baseUrl}/api/products`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!productsResponse.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const productsData = await productsResponse.json();
  const products = productsData.data || [];
  
  // Calculate basic stats from products
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum: number, product: any) => {
    return sum + (parseFloat(product.retailPrice) * product.stockQuantity);
  }, 0);
  
  const lowStockProducts = products.filter((product: any) => 
    product.stockQuantity <= product.minStockLevel
  );

  // Mock dashboard stats for now
  const mockStats: DashboardStats = {
    todaySales: {
      totalRevenue: 450000, // Mock revenue
      totalOrders: 12, // Mock orders
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
      quantitySold: Math.floor(Math.random() * 10) + 1, // Mock sales
      revenue: parseFloat(product.retailPrice) * (Math.floor(Math.random() * 10) + 1),
      category: product.category.name,
    })),
    inventoryAlerts: lowStockProducts.map((product: any) => ({
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
        description: 'Sale completed', 
        amount: 45000, 
        timestamp: new Date().toISOString() 
      },
      { 
        id: '2', 
        type: 'STOCK_UPDATE', 
        description: 'Stock updated for ' + (products[0]?.name || 'Product'), 
        amount: null, 
        timestamp: new Date(Date.now() - 1800000).toISOString() 
      },
    ],
    totalProducts,
    totalStockValue,
    lowStockCount: lowStockProducts.length,
  };

  return { data: mockStats };
}

export default function DashboardPage() {
  const router = useRouter();
  
  const {
    data: statsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = statsData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Loading dashboard...</div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.todaySales?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-600">
              {stats?.todaySales?.totalOrders || 0} orders today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.todaySales?.averageOrderValue || 0)}</div>
            <p className="text-xs text-gray-600">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventoryAlerts?.length || 0}</div>
            <p className="text-xs text-gray-600">
              Products low in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Payment</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.paymentMethods?.[0]?.method?.replace('_', ' ') || 'N/A'}
            </div>
            <p className="text-xs text-gray-600">
              {stats?.paymentMethods?.[0]?.percentage || 0}% of sales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-gray-600">
                      {activity.type} • {formatTime(activity.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <div className="font-semibold">{formatCurrency(activity.amount)}</div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.paymentMethods?.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <div>
                      <div className="font-medium">{method.method.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-600">{method.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(method.amount)}</div>
                    <div className="text-sm text-gray-600">{method.percentage}%</div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">No payment data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {stats?.inventoryAlerts && stats.inventoryAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
