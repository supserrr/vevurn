'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  Plus,
  Calculator,
  BarChart3,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Types for dashboard data
interface DashboardStats {
  todaysSales: {
    amount: number;
    count: number;
    change: number;
  };
  weekSales: {
    amount: number;
    count: number;
    change: number;
  };
  monthSales: {
    amount: number;
    count: number;
    change: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    totalValue: number;
  };
}

interface RecentTransaction {
  id: string;
  timestamp: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  customerName?: string;
  itemCount: number;
}

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  sku: string;
}

interface PaymentStatus {
  method: string;
  count: number;
  amount: number;
  status: 'active' | 'inactive' | 'warning';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all dashboard data in parallel
      const [statsResponse, transactionsResponse, lowStockResponse, paymentsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-transactions'),
        fetch('/api/dashboard/low-stock'),
        fetch('/api/dashboard/payment-status')
      ]);

      if (!statsResponse.ok) throw new Error('Failed to fetch dashboard stats');
      
      const stats = await statsResponse.json();
      const transactions = await transactionsResponse.json();
      const lowStock = await lowStockResponse.json();
      const payments = await paymentsResponse.json();

      setStats(stats);
      setRecentTransactions(transactions);
      setLowStockItems(lowStock);
      setPaymentStatuses(payments);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      // Fallback to mock data for development
      setStats({
        todaysSales: { amount: 2450000, count: 23, change: 12.5 },
        weekSales: { amount: 15680000, count: 156, change: 8.3 },
        monthSales: { amount: 67300000, count: 684, change: 15.2 },
        inventory: { totalProducts: 1247, lowStock: 23, totalValue: 125000000 }
      });
      
      const mockTransactions: RecentTransaction[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          amount: 85000,
          paymentMethod: 'MTN MoMo',
          status: 'completed',
          customerName: 'John Doe',
          itemCount: 3,
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          amount: 45000,
          paymentMethod: 'Cash',
          status: 'completed',
          itemCount: 2,
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          amount: 125000,
          paymentMethod: 'Bank Transfer',
          status: 'pending',
          customerName: 'Jane Smith',
          itemCount: 5,
        },
      ];

      const mockLowStock: LowStockItem[] = [
        { id: '1', name: 'iPhone 15 Pro Case', currentStock: 5, minStock: 20, sku: 'IPH15-CASE-001' },
        { id: '2', name: 'Samsung Galaxy Charger', currentStock: 2, minStock: 15, sku: 'SAM-CHAR-002' },
        { id: '3', name: 'AirPods Pro 2', currentStock: 1, minStock: 10, sku: 'APP-PRO2-003' },
      ];

      const mockPaymentStatuses: PaymentStatus[] = [
        { method: 'MTN MoMo', count: 15, amount: 1850000, status: 'active' },
        { method: 'Airtel Money', count: 8, amount: 920000, status: 'active' },
        { method: 'Cash', count: 12, amount: 680000, status: 'active' },
        { method: 'Bank Transfer', count: 3, amount: 450000, status: 'warning' },
      ];

      setRecentTransactions(mockTransactions);
      setLowStockItems(mockLowStock);
      setPaymentStatuses(mockPaymentStatuses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={fetchDashboardData}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Vevurn POS! Monitor your business performance and quick actions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Business Overview
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Fast access to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild size="lg" className="h-16">
              <Link href="/pos" className="flex flex-col gap-1">
                <Calculator className="h-6 w-6" />
                <span className="text-sm font-medium">New Sale</span>
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-16">
              <Link href="/products/new" className="flex flex-col gap-1">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Product</span>
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-16">
              <Link href="/customers" className="flex flex-col gap-1">
                <Users className="h-6 w-6" />
                <span className="text-sm font-medium">Customers</span>
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-16">
              <Link href="/reports/sales" className="flex flex-col gap-1">
                <Eye className="h-6 w-6" />
                <span className="text-sm font-medium">View Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.todaysSales.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.todaysSales.count} transactions
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {stats.todaysSales.change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${stats.todaysSales.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.todaysSales.change > 0 ? '+' : ''}{stats.todaysSales.change}%
              </span>
              <span className="text-sm text-muted-foreground">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.weekSales.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.weekSales.count} transactions
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {stats.weekSales.change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${stats.weekSales.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.weekSales.change > 0 ? '+' : ''}{stats.weekSales.change}%
              </span>
              <span className="text-sm text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthSales.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.monthSales.count} transactions
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {stats.monthSales.change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${stats.monthSales.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.monthSales.change > 0 ? '+' : ''}{stats.monthSales.change}%
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.inventory.totalValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.inventory.totalProducts} products
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">
                {stats.inventory.lowStock} low stock
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest sales and payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent transactions</p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.customerName || 'Walk-in customer'} • {transaction.itemCount} items
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={transaction.status === 'completed' ? 'default' : 
                                   transaction.status === 'pending' ? 'secondary' : 'destructive'}>
                        {transaction.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/reports/sales">
                    View All Transactions
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">All products are well stocked</p>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {item.currentStock} / {item.minStock}
                      </p>
                      <p className="text-xs text-muted-foreground">Current / Min</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {lowStockItems.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/products?filter=lowstock">
                    Manage Inventory
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods Status
          </CardTitle>
          <CardDescription>Today's transactions by payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paymentStatuses.map((payment) => (
              <div key={payment.method} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{payment.method}</p>
                  <div className={`h-2 w-2 rounded-full bg-current ${getPaymentStatusColor(payment.status)}`} />
                </div>
                <p className="text-2xl font-bold">{payment.count}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
