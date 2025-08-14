'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  CreditCard,
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { DashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');
      setStats(response.data);
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statsCards = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        title: "Today's Sales",
        value: formatCurrency(stats.todaySales.amount),
        subtitle: `${stats.todaySales.count} transactions`,
        icon: DollarSign,
      },
      {
        title: "This Month",
        value: formatCurrency(stats.monthSales.amount),
        subtitle: `${stats.monthSales.count} transactions`,
        icon: TrendingUp,
      },
      {
        title: "Low Stock Items",
        value: stats.lowStockProducts.toString(),
        subtitle: "View items",
        icon: Package,
        href: "/products?lowStock=true",
      },
      {
        title: "Total Customers",
        value: stats.totalCustomers.toString(),
        subtitle: "Active customers",
        icon: Users,
      },
    ];
  }, [stats]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/sales/new">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todaySales.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todaySales.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthSales.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthSales.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/products?lowStock=true" className="text-blue-600 hover:underline">
                View items
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.lowStockProducts} products with low stock levels.{' '}
            <Link href="/products?lowStock=true" className="font-medium underline underline-offset-4">
              Review inventory
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top-products">Top Products</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Your sales performance over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {/* Sales chart would go here */}
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sales chart component would be implemented here
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest transactions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        New sale completed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2 minutes ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Low stock alert
                      </p>
                      <p className="text-sm text-muted-foreground">
                        iPhone 15 case running low
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Payment received
                      </p>
                      <p className="text-sm text-muted-foreground">
                        MTN MoMo payment confirmed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Your best performing products this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantitySold} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(item.revenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.product.retailPrice)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Breakdown of payment methods used this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">
                        {method.method.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {method.count} transactions
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(method.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
