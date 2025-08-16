'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SalesAnalytics, Product } from '@/lib/types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    // Mock analytics data
    setTimeout(() => {
      setAnalytics({
        totalSales: 1247,
        totalRevenue: 2456789,
        averageOrderValue: 1971,
        topProducts: [
          {
            product: {
              id: '1',
              name: 'Samsung Galaxy S24',
              sku: 'SGS24-128-BLK',
              categoryId: '1',
              basePrice: 899.99,
              stockQuantity: 25,
              minStockLevel: 5,
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantitySold: 156,
            revenue: 140398
          },
          {
            product: {
              id: '2',
              name: 'iPhone 15 Case',
              sku: 'IP15-CASE-CLR',
              categoryId: '2',
              basePrice: 29.99,
              stockQuantity: 150,
              minStockLevel: 20,
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantitySold: 89,
            revenue: 2669
          },
          {
            product: {
              id: '3',
              name: 'Wireless Charger',
              sku: 'WC-FAST-15W',
              categoryId: '2',
              basePrice: 49.99,
              stockQuantity: 75,
              minStockLevel: 10,
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantitySold: 67,
            revenue: 3349
          }
        ],
        salesByPeriod: [
          { period: '2024-08-10', sales: 45, revenue: 89234 },
          { period: '2024-08-11', sales: 52, revenue: 103456 },
          { period: '2024-08-12', sales: 38, revenue: 75891 },
          { period: '2024-08-13', sales: 61, revenue: 121234 },
          { period: '2024-08-14', sales: 48, revenue: 95678 },
          { period: '2024-08-15', sales: 55, revenue: 108901 },
          { period: '2024-08-16', sales: 42, revenue: 83456 },
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
  ];

  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading || !analytics) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock growth calculations
  const revenueGrowth = 15.2;
  const salesGrowth = 8.7;
  const customerGrowth = 12.4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your business performance and insights
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 px-3 border border-input bg-background rounded-md text-sm"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(salesGrowth).toFixed(1)}%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                5.2%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customerGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(customerGrowth).toFixed(1)}%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.salesByPeriod.map((period, index) => (
                <div key={period.period} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm">
                      {new Date(period.period).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{period.sales} sales</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(period.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.product.name}</div>
                      <div className="text-xs text-gray-500">{item.product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.quantitySold} sold</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">#R001234</TableCell>
                <TableCell>John Uwimana</TableCell>
                <TableCell>3 items</TableCell>
                <TableCell>{formatCurrency(125000)}</TableCell>
                <TableCell>
                  <Badge variant="outline">Cash</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Completed</Badge>
                </TableCell>
                <TableCell>2 hours ago</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">#R001233</TableCell>
                <TableCell>Marie Mukamana</TableCell>
                <TableCell>1 item</TableCell>
                <TableCell>{formatCurrency(45000)}</TableCell>
                <TableCell>
                  <Badge variant="outline">Mobile Money</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Completed</Badge>
                </TableCell>
                <TableCell>4 hours ago</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">#R001232</TableCell>
                <TableCell>Guest Customer</TableCell>
                <TableCell>2 items</TableCell>
                <TableCell>{formatCurrency(85000)}</TableCell>
                <TableCell>
                  <Badge variant="outline">Card</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Completed</Badge>
                </TableCell>
                <TableCell>6 hours ago</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
