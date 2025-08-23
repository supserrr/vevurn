'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface BusinessOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topSellingProduct: string;
  revenueTrend: number;
  ordersTrend: number;
  customersTrend: number;
  profitMargin: number;
}

interface QuickStats {
  todaySales: { amount: number; count: number; target: number };
  weekSales: { amount: number; count: number; target: number };
  monthSales: { amount: number; count: number; target: number };
  lowStockCount: number;
  pendingOrders: number;
  activeCustomers: number;
}

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('month');

  // Mock data - replace with actual API calls
  const [businessOverview, setBusinessOverview] = useState<BusinessOverview>({
    totalRevenue: 48250000,
    totalOrders: 542,
    totalCustomers: 234,
    averageOrderValue: 89032,
    topSellingProduct: 'iPhone 15 Pro Case',
    revenueTrend: 12.5,
    ordersTrend: 8.3,
    customersTrend: 15.2,
    profitMargin: 35.8,
  });

  const [quickStats, setQuickStats] = useState<QuickStats>({
    todaySales: { amount: 2450000, count: 23, target: 3000000 },
    weekSales: { amount: 15680000, count: 156, target: 18000000 },
    monthSales: { amount: 48250000, count: 542, target: 50000000 },
    lowStockCount: 23,
    pendingOrders: 5,
    activeCustomers: 189,
  });

  // Sample charts data
  const salesTrendData = [
    { name: 'Jan', sales: 35000000, orders: 420 },
    { name: 'Feb', sales: 38000000, orders: 456 },
    { name: 'Mar', sales: 42000000, orders: 502 },
    { name: 'Apr', sales: 39000000, orders: 468 },
    { name: 'May', sales: 45000000, orders: 538 },
    { name: 'Jun', sales: 41000000, orders: 491 },
    { name: 'Jul', sales: 47000000, orders: 562 },
    { name: 'Aug', sales: 48250000, orders: 542 },
  ];

  const categoryData = [
    { name: 'Phone Cases', value: 35, color: '#8884d8' },
    { name: 'Chargers', value: 25, color: '#82ca9d' },
    { name: 'Screen Protectors', value: 20, color: '#ffc658' },
    { name: 'Earphones', value: 12, color: '#ff7c7c' },
    { name: 'Other', value: 8, color: '#8dd1e1' },
  ];

  const weeklyPerformance = [
    { name: 'Mon', target: 500000, actual: 520000 },
    { name: 'Tue', target: 600000, actual: 580000 },
    { name: 'Wed', target: 550000, actual: 610000 },
    { name: 'Thu', target: 650000, actual: 720000 },
    { name: 'Fri', target: 800000, actual: 850000 },
    { name: 'Sat', target: 900000, actual: 950000 },
    { name: 'Sun', target: 400000, actual: 380000 },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (err) {
        setError('Failed to load business overview');
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  const getTargetProgress = (actual: number, target: number) => {
    return Math.round((actual / target) * 100);
  };

  const formatTrend = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
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
            <Button variant="outline" size="sm" className="ml-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive view of your business performance and insights
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(businessOverview.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {businessOverview.revenueTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${businessOverview.revenueTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatTrend(businessOverview.revenueTrend)}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{businessOverview.totalOrders}</p>
                <div className="flex items-center gap-1 mt-2">
                  {businessOverview.ordersTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${businessOverview.ordersTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatTrend(businessOverview.ordersTrend)}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{businessOverview.totalCustomers}</p>
                <div className="flex items-center gap-1 mt-2">
                  {businessOverview.customersTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${businessOverview.customersTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatTrend(businessOverview.customersTrend)}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(businessOverview.averageOrderValue)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    {businessOverview.profitMargin}% margin
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Targets Progress */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sales Target</span>
                <span className="text-sm font-medium">
                  {getTargetProgress(quickStats.todaySales.amount, quickStats.todaySales.target)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(getTargetProgress(quickStats.todaySales.amount, quickStats.todaySales.target), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(quickStats.todaySales.amount)}</span>
                <span>{formatCurrency(quickStats.todaySales.target)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sales Target</span>
                <span className="text-sm font-medium">
                  {getTargetProgress(quickStats.weekSales.amount, quickStats.weekSales.target)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(getTargetProgress(quickStats.weekSales.amount, quickStats.weekSales.target), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(quickStats.weekSales.amount)}</span>
                <span>{formatCurrency(quickStats.weekSales.target)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sales Target</span>
                <span className="text-sm font-medium">
                  {getTargetProgress(quickStats.monthSales.amount, quickStats.monthSales.target)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(getTargetProgress(quickStats.monthSales.amount, quickStats.monthSales.target), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(quickStats.monthSales.amount)}</span>
                <span>{formatCurrency(quickStats.monthSales.target)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly revenue and order volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'sales' ? formatCurrency(Number(value)) : value,
                    name === 'sales' ? 'Sales' : 'Orders'
                  ]}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="Sales" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Product category performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Performance vs Target</CardTitle>
            <CardDescription>Daily sales performance against targets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Most common business tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Button asChild className="h-16">
                <Link href="/pos" className="flex flex-col gap-1">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm font-medium">New Sale</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-16">
                <Link href="/products/new" className="flex flex-col gap-1">
                  <Package className="h-6 w-6" />
                  <span className="text-sm font-medium">Add Product</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-16">
                <Link href="/customers/new" className="flex flex-col gap-1">
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Add Customer</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-16">
                <Link href="/inventory" className="flex flex-col gap-1">
                  <Eye className="h-6 w-6" />
                  <span className="text-sm font-medium">Check Inventory</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{quickStats.lowStockCount} products</strong> are running low on stock.
                  <Button variant="link" className="h-auto p-0 ml-2" asChild>
                    <Link href="/inventory">View Details</Link>
                  </Button>
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>{quickStats.pendingOrders} orders</strong> are pending processing.
                  <Button variant="link" className="h-auto p-0 ml-2" asChild>
                    <Link href="/orders">Process Orders</Link>
                  </Button>
                </AlertDescription>
              </Alert>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{quickStats.activeCustomers} customers</strong> have been active this month.
                  <Button variant="link" className="h-auto p-0 ml-2" asChild>
                    <Link href="/customers">View Customers</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
