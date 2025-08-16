'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Sales report interfaces
interface SalesReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
    topSalesDay: {
      date: string;
      revenue: number;
    };
    bestPerformingHour: {
      hour: number;
      revenue: number;
    };
  };
  salesByPeriod: {
    period: string;
    revenue: number;
    orders: number;
    growth: number;
  }[];
  salesByCategory: {
    category: string;
    revenue: number;
    orders: number;
    percentage: number;
    growth: number;
  }[];
  salesByStaff: {
    staffId: string;
    staffName: string;
    revenue: number;
    orders: number;
    commission: number;
  }[];
  recentTransactions: {
    id: string;
    date: string;
    customerName: string;
    amount: number;
    items: number;
    paymentMethod: string;
    status: string;
  }[];
  hourlyBreakdown: {
    hour: number;
    revenue: number;
    orders: number;
  }[];
}

// Mock sales report data
const mockSalesReport: SalesReportData = {
  summary: {
    totalRevenue: 12450000,
    totalOrders: 486,
    averageOrderValue: 25617,
    revenueGrowth: 15.4,
    ordersGrowth: 8.2,
    topSalesDay: {
      date: '2024-01-15',
      revenue: 845000,
    },
    bestPerformingHour: {
      hour: 14, // 2 PM
      revenue: 125000,
    },
  },
  salesByPeriod: [
    { period: 'Week 1', revenue: 2850000, orders: 118, growth: 12.5 },
    { period: 'Week 2', revenue: 3120000, orders: 125, growth: 15.2 },
    { period: 'Week 3', revenue: 2980000, orders: 119, growth: 8.1 },
    { period: 'Week 4', revenue: 3500000, orders: 124, growth: 18.7 },
  ],
  salesByCategory: [
    { category: 'Phone Cases', revenue: 4580000, orders: 198, percentage: 36.8, growth: 22.1 },
    { category: 'Screen Protectors', revenue: 2850000, orders: 156, percentage: 22.9, growth: 15.8 },
    { category: 'Chargers & Cables', revenue: 2120000, orders: 89, percentage: 17.0, growth: 18.3 },
    { category: 'Phone Mounts', revenue: 1580000, orders: 67, percentage: 12.7, growth: 8.9 },
    { category: 'Headphones', revenue: 1320000, orders: 43, percentage: 10.6, growth: 12.4 },
  ],
  salesByStaff: [
    { staffId: 'ST001', staffName: 'Alice Mukamana', revenue: 4250000, orders: 156, commission: 85000 },
    { staffId: 'ST002', staffName: 'Jean Baptiste', revenue: 3890000, orders: 142, commission: 77800 },
    { staffId: 'ST003', staffName: 'Grace Uwimana', revenue: 2450000, orders: 98, commission: 49000 },
    { staffId: 'ST004', staffName: 'Emmanuel Habib', revenue: 1860000, orders: 90, commission: 37200 },
  ],
  recentTransactions: [
    {
      id: 'TXN-001',
      date: '2024-01-16T14:30:00Z',
      customerName: 'John Doe',
      amount: 45000,
      items: 3,
      paymentMethod: 'Mobile Money',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-002',
      date: '2024-01-16T13:15:00Z',
      customerName: 'Jane Smith',
      amount: 125000,
      items: 8,
      paymentMethod: 'Bank Transfer',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-003',
      date: '2024-01-16T11:45:00Z',
      customerName: 'Peter Wilson',
      amount: 32000,
      items: 2,
      paymentMethod: 'Cash',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-004',
      date: '2024-01-16T10:20:00Z',
      customerName: 'Mary Johnson',
      amount: 67000,
      items: 4,
      paymentMethod: 'Mobile Money',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-005',
      date: '2024-01-16T09:10:00Z',
      customerName: 'David Brown',
      amount: 89000,
      items: 5,
      paymentMethod: 'Cash',
      status: 'COMPLETED',
    },
  ],
  hourlyBreakdown: [
    { hour: 8, revenue: 45000, orders: 3 },
    { hour: 9, revenue: 89000, orders: 7 },
    { hour: 10, revenue: 125000, orders: 12 },
    { hour: 11, revenue: 156000, orders: 15 },
    { hour: 12, revenue: 98000, orders: 8 },
    { hour: 13, revenue: 187000, orders: 18 },
    { hour: 14, revenue: 234000, orders: 21 },
    { hour: 15, revenue: 198000, orders: 16 },
    { hour: 16, revenue: 167000, orders: 14 },
    { hour: 17, revenue: 145000, orders: 13 },
    { hour: 18, revenue: 87000, orders: 6 },
    { hour: 19, revenue: 34000, orders: 2 },
  ],
};

export default function SalesReportPage() {
  const [reportData, setReportData] = useState<SalesReportData>(mockSalesReport);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch sales report data from API
        // const response = await ApiClient.request(`/reports/sales?range=${dateRange}&category=${filterCategory}`);
        // setReportData(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReportData(mockSalesReport);
      } catch (error: any) {
        console.error('Failed to load sales report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [dateRange, filterCategory]);

  const exportReport = () => {
    // In real app, call API to generate and download report
    console.log('Exporting sales report...');
    
    // Simulate file download
    const csvContent = `Date,Revenue,Orders,Average Order Value
${reportData.salesByPeriod.map(period => 
  `${period.period},${period.revenue},${period.orders},${Math.round(period.revenue / period.orders)}`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `sales-report-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'PENDING': return 'secondary';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sales Report</h1>
            <p className="text-muted-foreground">
              Detailed sales analysis and performance metrics
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Categories</option>
            <option value="phone-cases">Phone Cases</option>
            <option value="screen-protectors">Screen Protectors</option>
            <option value="chargers">Chargers & Cables</option>
            <option value="mounts">Phone Mounts</option>
            <option value="headphones">Headphones</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{reportData.summary.revenueGrowth}%</span>
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
                <p className="text-2xl font-bold">{reportData.summary.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{reportData.summary.ordersGrowth}%</span>
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
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary.averageOrderValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Per transaction
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Top Sales Day</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary.topSalesDay.revenue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(reportData.summary.topSalesDay.date).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sales by Period
          </CardTitle>
          <CardDescription>Revenue and order trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.salesByPeriod.map((period) => (
              <div key={period.period} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-semibold">{period.period}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{formatCurrency(period.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{period.orders} orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {period.growth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    period.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {period.growth >= 0 ? '+' : ''}{period.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue breakdown by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.salesByCategory.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {category.orders} orders
                        </span>
                        <div className="flex items-center gap-1">
                          {category.growth >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs ${
                            category.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {category.growth >= 0 ? '+' : ''}{category.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(category.revenue)}</span>
                      <p className="text-sm text-muted-foreground">
                        {category.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Sales performance by team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.salesByStaff.map((staff, index) => (
                <div key={staff.staffId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{staff.staffName}</p>
                      <p className="text-sm text-muted-foreground">{staff.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(staff.revenue)}</p>
                    <p className="text-sm text-green-600">
                      Commission: {formatCurrency(staff.commission)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.recentTransactions
              .filter(tx => 
                searchQuery === '' || 
                tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.id.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice(0, 10)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.customerName} • {transaction.items} items
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} at{' '}
                        {new Date(transaction.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {transaction.paymentMethod}
                      </span>
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Hourly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Sales Breakdown</CardTitle>
          <CardDescription>Sales performance by hour of the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reportData.hourlyBreakdown.map((hour) => (
              <div key={hour.hour} className="p-3 border rounded-lg text-center">
                <p className="font-semibold">
                  {hour.hour === 0 ? '12 AM' :
                   hour.hour < 12 ? `${hour.hour} AM` :
                   hour.hour === 12 ? '12 PM' :
                   `${hour.hour - 12} PM`}
                </p>
                <p className="text-sm font-medium text-primary">
                  {formatCurrency(hour.revenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hour.orders} orders
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
