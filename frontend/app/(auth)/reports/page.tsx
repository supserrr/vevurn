'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Clock,
  Award,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Analytics data interfaces
interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customerGrowth: number;
  topSellingProducts: {
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  salesByCustomerType: {
    type: string;
    amount: number;
    percentage: number;
  }[];
  dailySales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

interface QuickReport {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  value?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

// Mock analytics data
const mockSalesMetrics: SalesMetrics = {
  totalRevenue: 12450000,
  totalOrders: 486,
  averageOrderValue: 25617,
  totalCustomers: 124,
  revenueGrowth: 15.4,
  ordersGrowth: 8.2,
  customerGrowth: 12.1,
  topSellingProducts: [
    { id: '1', name: 'iPhone 15 Pro Case', sold: 245, revenue: 3675000 },
    { id: '2', name: 'Samsung Galaxy Screen Protector', sold: 198, revenue: 1584000 },
    { id: '3', name: 'USB-C Cable Premium', sold: 167, revenue: 1336000 },
    { id: '4', name: 'Wireless Charger Stand', sold: 134, revenue: 2010000 },
    { id: '5', name: 'Phone Mount Car Holder', sold: 89, revenue: 801000 },
  ],
  salesByPaymentMethod: [
    { method: 'Mobile Money', amount: 5980000, percentage: 48.1 },
    { method: 'Cash', amount: 3735000, percentage: 30.0 },
    { method: 'Bank Transfer', amount: 1990000, percentage: 16.0 },
    { method: 'Credit', amount: 745000, percentage: 5.9 },
  ],
  salesByCustomerType: [
    { type: 'Retail', amount: 8715000, percentage: 70.0 },
    { type: 'Wholesale', amount: 3735000, percentage: 30.0 },
  ],
  dailySales: [
    { date: '2024-01-01', revenue: 385000, orders: 15 },
    { date: '2024-01-02', revenue: 420000, orders: 18 },
    { date: '2024-01-03', revenue: 315000, orders: 12 },
    { date: '2024-01-04', revenue: 480000, orders: 21 },
    { date: '2024-01-05', revenue: 525000, orders: 23 },
    { date: '2024-01-06', revenue: 395000, orders: 16 },
    { date: '2024-01-07', revenue: 445000, orders: 19 },
  ],
};

const quickReports: QuickReport[] = [
  {
    title: 'Sales Report',
    description: 'Detailed sales analysis with trends and comparisons',
    href: '/reports/sales',
    icon: BarChart3,
    color: 'bg-blue-500',
    value: formatCurrency(mockSalesMetrics.totalRevenue),
    change: `+${mockSalesMetrics.revenueGrowth}%`,
    changeType: 'positive',
  },
  {
    title: 'Profit Analysis',
    description: 'Profit margins, costs, and profitability insights',
    href: '/reports/profit',
    icon: TrendingUp,
    color: 'bg-green-500',
    value: formatCurrency(mockSalesMetrics.totalRevenue * 0.35), // Assuming 35% profit margin
    change: '+18.2%',
    changeType: 'positive',
  },
  {
    title: 'Inventory Report',
    description: 'Stock levels, turnover rates, and inventory insights',
    href: '/reports/inventory',
    icon: Package,
    color: 'bg-purple-500',
    value: '248 Products',
    change: '+5.1%',
    changeType: 'positive',
  },
  {
    title: 'Customer Analysis',
    description: 'Customer behavior, loyalty, and lifetime value',
    href: '/reports/customers',
    icon: Users,
    color: 'bg-orange-500',
    value: `${mockSalesMetrics.totalCustomers} Customers`,
    change: `+${mockSalesMetrics.customerGrowth}%`,
    changeType: 'positive',
  },
];

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<SalesMetrics>(mockSalesMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch analytics data from API
        // const response = await ApiClient.request(`/analytics/overview?range=${dateRange}`);
        // setMetrics(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        setMetrics(mockSalesMetrics);
      } catch (error: any) {
        console.error('Failed to load metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [dateRange]);

  const getChangeIcon = (changeType: QuickReport['changeType']) => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your business
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {['7d', '30d', '90d', '1y'].map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
          >
            {range === '7d' ? '7 Days' :
             range === '30d' ? '30 Days' :
             range === '90d' ? '90 Days' : '1 Year'}
          </Button>
        ))}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{metrics.revenueGrowth}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{metrics.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{metrics.ordersGrowth}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Order</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+6.2%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{metrics.customerGrowth}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Access detailed reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickReports.map((report) => {
              const Icon = report.icon;
              return (
                <Link key={report.href} href={report.href}>
                  <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${report.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{report.title}</h3>
                        {report.value && (
                          <p className="text-sm text-muted-foreground">{report.value}</p>
                        )}
                      </div>
                      {report.change && (
                        <div className="flex items-center gap-1">
                          {getChangeIcon(report.changeType)}
                          <span className={`text-sm font-medium ${
                            report.changeType === 'positive' ? 'text-green-600' :
                            report.changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {report.change}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(product.revenue / product.sold)}/unit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sales by Payment Method
            </CardTitle>
            <CardDescription>Revenue breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.salesByPaymentMethod.map((method) => (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{method.method}</span>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(method.amount)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({method.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Customer Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sales by Customer Type
            </CardTitle>
            <CardDescription>Revenue split between retail and wholesale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.salesByCustomerType.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.type} Customers</span>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(type.amount)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({type.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        type.type === 'Retail' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${type.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Sales Trend
            </CardTitle>
            <CardDescription>Sales performance over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.dailySales.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{day.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(day.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(day.revenue / day.orders)} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/reports/sales">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Sales Report
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/reports/profit">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analyze Profit Margins
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/reports/inventory">
            <Package className="h-4 w-4 mr-2" />
            Check Inventory Report
          </Link>
        </Button>
      </div>
    </div>
  );
}
