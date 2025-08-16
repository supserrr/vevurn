'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Star,
  Gift,
  Target,
  Award,
  Calendar,
  Search,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Phone,
  CreditCard,
  Clock,
  Heart,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Customer analysis interfaces
interface CustomerAnalysisData {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    totalLifetimeValue: number;
    averageLifetimeValue: number;
    averageOrderValue: number;
    customerRetentionRate: number;
    churnRate: number;
  };
  customerSegments: {
    segment: string;
    count: number;
    percentage: number;
    averageSpent: number;
    averageOrders: number;
    loyaltyPoints: number;
    description: string;
  }[];
  topCustomers: {
    id: string;
    name: string;
    phone: string;
    type: 'RETAIL' | 'WHOLESALE';
    totalSpent: number;
    totalOrders: number;
    averageOrder: number;
    lastPurchase: string;
    loyaltyTier: string;
    loyaltyPoints: number;
  }[];
  customerGrowth: {
    month: string;
    newCustomers: number;
    activeCustomers: number;
    churnedCustomers: number;
    reactivatedCustomers: number;
  }[];
  customerBehavior: {
    preferredPaymentMethods: {
      method: string;
      percentage: number;
      averageAmount: number;
    }[];
    purchaseFrequency: {
      frequency: string;
      customers: number;
      percentage: number;
      averageSpent: number;
    }[];
    customerTypes: {
      type: string;
      count: number;
      percentage: number;
      revenue: number;
      averageOrder: number;
    }[];
  };
  geographicDistribution: {
    location: string;
    customers: number;
    percentage: number;
    revenue: number;
    averageOrderValue: number;
  }[];
  loyaltyAnalysis: {
    tier: string;
    customers: number;
    percentage: number;
    totalSpent: number;
    averageSpent: number;
    pointsEarned: number;
    pointsRedeemed: number;
  }[];
  customerLifecycle: {
    stage: string;
    customers: number;
    percentage: number;
    averageDuration: number;
    conversionRate: number;
  }[];
}

// Mock customer analysis data
const mockCustomerData: CustomerAnalysisData = {
  summary: {
    totalCustomers: 487,
    activeCustomers: 324,
    newCustomersThisMonth: 42,
    totalLifetimeValue: 45650000,
    averageLifetimeValue: 93730,
    averageOrderValue: 25617,
    customerRetentionRate: 78.5,
    churnRate: 12.3,
  },
  customerSegments: [
    {
      segment: 'VIP Customers',
      count: 28,
      percentage: 5.7,
      averageSpent: 450000,
      averageOrders: 18,
      loyaltyPoints: 1850,
      description: 'High-value customers with exceptional loyalty',
    },
    {
      segment: 'Loyal Customers',
      count: 89,
      percentage: 18.3,
      averageSpent: 185000,
      averageOrders: 12,
      loyaltyPoints: 925,
      description: 'Regular customers with strong engagement',
    },
    {
      segment: 'Regular Customers',
      count: 207,
      percentage: 42.5,
      averageSpent: 85000,
      averageOrders: 6,
      loyaltyPoints: 425,
      description: 'Consistent customers with moderate spending',
    },
    {
      segment: 'New Customers',
      count: 98,
      percentage: 20.1,
      averageSpent: 32000,
      averageOrders: 2,
      loyaltyPoints: 160,
      description: 'Recently acquired customers in onboarding phase',
    },
    {
      segment: 'At-Risk Customers',
      count: 45,
      percentage: 9.2,
      averageSpent: 125000,
      averageOrders: 8,
      loyaltyPoints: 625,
      description: 'Previously active customers showing decline',
    },
    {
      segment: 'Inactive Customers',
      count: 20,
      percentage: 4.1,
      averageSpent: 58000,
      averageOrders: 3,
      loyaltyPoints: 290,
      description: 'Customers with no recent activity',
    },
  ],
  topCustomers: [
    {
      id: 'CUST-001',
      name: 'Rwanda Electronics Ltd',
      phone: '+250788123456',
      type: 'WHOLESALE',
      totalSpent: 2450000,
      totalOrders: 45,
      averageOrder: 54444,
      lastPurchase: '2024-01-15',
      loyaltyTier: 'Platinum',
      loyaltyPoints: 2450,
    },
    {
      id: 'CUST-002',
      name: 'Jane Smith',
      phone: '+250788234567',
      type: 'WHOLESALE',
      totalSpent: 1890000,
      totalOrders: 38,
      averageOrder: 49737,
      lastPurchase: '2024-01-14',
      loyaltyTier: 'Platinum',
      loyaltyPoints: 1890,
    },
    {
      id: 'CUST-003',
      name: 'TechMart Kigali',
      phone: '+250788345678',
      type: 'WHOLESALE',
      totalSpent: 1650000,
      totalOrders: 32,
      averageOrder: 51563,
      lastPurchase: '2024-01-13',
      loyaltyTier: 'Gold',
      loyaltyPoints: 1650,
    },
    {
      id: 'CUST-004',
      name: 'John Doe',
      phone: '+250788456789',
      type: 'RETAIL',
      totalSpent: 850000,
      totalOrders: 28,
      averageOrder: 30357,
      lastPurchase: '2024-01-12',
      loyaltyTier: 'Gold',
      loyaltyPoints: 850,
    },
    {
      id: 'CUST-005',
      name: 'PhoneWorld Nyarugenge',
      phone: '+250788567890',
      type: 'WHOLESALE',
      totalSpent: 780000,
      totalOrders: 22,
      averageOrder: 35455,
      lastPurchase: '2024-01-11',
      loyaltyTier: 'Gold',
      loyaltyPoints: 780,
    },
  ],
  customerGrowth: [
    {
      month: 'Oct 2023',
      newCustomers: 28,
      activeCustomers: 285,
      churnedCustomers: 8,
      reactivatedCustomers: 5,
    },
    {
      month: 'Nov 2023',
      newCustomers: 35,
      activeCustomers: 312,
      churnedCustomers: 12,
      reactivatedCustomers: 8,
    },
    {
      month: 'Dec 2023',
      newCustomers: 41,
      activeCustomers: 341,
      churnedCustomers: 9,
      reactivatedCustomers: 12,
    },
    {
      month: 'Jan 2024',
      newCustomers: 42,
      activeCustomers: 374,
      churnedCustomers: 7,
      reactivatedCustomers: 15,
    },
  ],
  customerBehavior: {
    preferredPaymentMethods: [
      { method: 'Mobile Money', percentage: 48.2, averageAmount: 28500 },
      { method: 'Cash', percentage: 31.5, averageAmount: 22000 },
      { method: 'Bank Transfer', percentage: 16.8, averageAmount: 125000 },
      { method: 'Credit', percentage: 3.5, averageAmount: 85000 },
    ],
    purchaseFrequency: [
      { frequency: 'Weekly', customers: 45, percentage: 9.2, averageSpent: 185000 },
      { frequency: 'Bi-weekly', customers: 89, percentage: 18.3, averageSpent: 125000 },
      { frequency: 'Monthly', customers: 156, percentage: 32.0, averageSpent: 85000 },
      { frequency: 'Quarterly', customers: 97, percentage: 19.9, averageSpent: 65000 },
      { frequency: 'Rarely', customers: 100, percentage: 20.5, averageSpent: 35000 },
    ],
    customerTypes: [
      { type: 'Retail', count: 342, percentage: 70.2, revenue: 18450000, averageOrder: 22500 },
      { type: 'Wholesale', count: 145, percentage: 29.8, revenue: 27200000, averageOrder: 45800 },
    ],
  },
  geographicDistribution: [
    { location: 'Kigali City', customers: 298, percentage: 61.2, revenue: 28450000, averageOrderValue: 28500 },
    { location: 'Northern Province', customers: 85, percentage: 17.5, revenue: 8950000, averageOrderValue: 24200 },
    { location: 'Southern Province', customers: 67, percentage: 13.8, revenue: 5980000, averageOrderValue: 21800 },
    { location: 'Eastern Province', customers: 23, percentage: 4.7, revenue: 1850000, averageOrderValue: 19500 },
    { location: 'Western Province', customers: 14, percentage: 2.9, revenue: 1420000, averageOrderValue: 18900 },
  ],
  loyaltyAnalysis: [
    {
      tier: 'Platinum',
      customers: 28,
      percentage: 5.7,
      totalSpent: 8950000,
      averageSpent: 319643,
      pointsEarned: 17900,
      pointsRedeemed: 3580,
    },
    {
      tier: 'Gold',
      customers: 67,
      percentage: 13.8,
      totalSpent: 12450000,
      averageSpent: 185821,
      pointsEarned: 18675,
      pointsRedeemed: 4669,
    },
    {
      tier: 'Silver',
      customers: 145,
      percentage: 29.8,
      totalSpent: 15890000,
      averageSpent: 109586,
      pointsEarned: 19863,
      pointsRedeemed: 3973,
    },
    {
      tier: 'Bronze',
      customers: 247,
      percentage: 50.7,
      totalSpent: 8360000,
      averageSpent: 33846,
      pointsEarned: 8360,
      pointsRedeemed: 836,
    },
  ],
  customerLifecycle: [
    { stage: 'New', customers: 98, percentage: 20.1, averageDuration: 2.5, conversionRate: 85.7 },
    { stage: 'Active', customers: 324, percentage: 66.5, averageDuration: 8.2, conversionRate: 92.3 },
    { stage: 'At Risk', customers: 45, percentage: 9.2, averageDuration: 12.5, conversionRate: 45.2 },
    { stage: 'Churned', customers: 20, percentage: 4.1, averageDuration: 15.8, conversionRate: 15.0 },
  ],
};

export default function CustomerAnalysisPage() {
  const [customerData, setCustomerData] = useState<CustomerAnalysisData>(mockCustomerData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  useEffect(() => {
    const loadCustomerData = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch customer analysis data from API
        // const response = await ApiClient.request('/reports/customers');
        // setCustomerData(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCustomerData(mockCustomerData);
      } catch (error: any) {
        console.error('Failed to load customer analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  const exportReport = () => {
    // In real app, call API to generate and download report
    console.log('Exporting customer analysis...');
    
    // Simulate file download
    const csvContent = `Customer,Type,Total Spent,Orders,Average Order,Loyalty Tier
${customerData.topCustomers.map(customer => 
  `${customer.name},${customer.type},${customer.totalSpent},${customer.totalOrders},${customer.averageOrder},${customer.loyaltyTier}`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'customer-analysis.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP Customers': return 'bg-purple-500';
      case 'Loyal Customers': return 'bg-blue-500';
      case 'Regular Customers': return 'bg-green-500';
      case 'New Customers': return 'bg-yellow-500';
      case 'At-Risk Customers': return 'bg-orange-500';
      case 'Inactive Customers': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTopCustomers = customerData.topCustomers.filter(customer => {
    const matchesSearch = searchQuery === '' || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
    return matchesSearch;
  });

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
            <h1 className="text-3xl font-bold">Customer Analysis</h1>
            <p className="text-muted-foreground">
              Customer behavior insights, segmentation, and loyalty analysis
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

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customerData.summary.totalCustomers}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    +{customerData.summary.newCustomersThisMonth} this month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{customerData.summary.activeCustomers}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((customerData.summary.activeCustomers / customerData.summary.totalCustomers) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer LTV</p>
                <p className="text-2xl font-bold">{formatCurrency(customerData.summary.averageLifetimeValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Average per customer
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">{customerData.summary.customerRetentionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Churn: {customerData.summary.churnRate}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Customer Segments
          </CardTitle>
          <CardDescription>Customer classification based on behavior and value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customerData.customerSegments.map((segment) => (
              <div key={segment.segment} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${getSegmentColor(segment.segment)}`}></div>
                  <h3 className="font-semibold">{segment.segment}</h3>
                  <Badge variant="outline">{segment.count}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{segment.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Percentage:</span>
                    <span className="font-medium">{segment.percentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Spent:</span>
                    <span className="font-medium">{formatCurrency(segment.averageSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Orders:</span>
                    <span className="font-medium">{segment.averageOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Loyalty Points:</span>
                    <span className="font-medium">{segment.loyaltyPoints}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Customers
          </CardTitle>
          <CardDescription>Highest value customers by total spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTopCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{customer.phone}</span>
                      <Badge variant={customer.type === 'WHOLESALE' ? 'default' : 'outline'} className="text-xs">
                        {customer.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last purchase: {new Date(customer.lastPurchase).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.totalOrders} orders • {formatCurrency(customer.averageOrder)} avg
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTierBadgeColor(customer.loyaltyTier)}>
                      {customer.loyaltyTier}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Gift className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-muted-foreground">{customer.loyaltyPoints} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Customer Growth Trend
            </CardTitle>
            <CardDescription>Customer acquisition and retention over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.customerGrowth.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-muted-foreground">
                      {month.activeCustomers} active customers
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-green-600 font-medium">+{month.newCustomers}</p>
                        <p className="text-xs text-muted-foreground">New</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-600 font-medium">+{month.reactivatedCustomers}</p>
                        <p className="text-xs text-muted-foreground">Returned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-red-600 font-medium">-{month.churnedCustomers}</p>
                        <p className="text-xs text-muted-foreground">Churned</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Customer distribution across Rwanda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.geographicDistribution.map((location) => (
                <div key={location.location} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{location.location}</span>
                      <p className="text-sm text-muted-foreground">
                        {location.customers} customers • {formatCurrency(location.averageOrderValue)} AOV
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(location.revenue)}</span>
                      <p className="text-sm text-muted-foreground">{location.percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${location.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Behavior Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerData.customerBehavior.preferredPaymentMethods.map((method) => (
                <div key={method.method} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{method.method}</span>
                    <span className="font-medium">{method.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(method.averageAmount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Purchase Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerData.customerBehavior.purchaseFrequency.map((freq) => (
                <div key={freq.frequency} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{freq.frequency}</p>
                    <p className="text-sm text-muted-foreground">{freq.customers} customers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{freq.percentage}%</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(freq.averageSpent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.customerBehavior.customerTypes.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{type.type} Customers</span>
                    <span className="font-semibold">{type.count}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Revenue:</span>
                      <span>{formatCurrency(type.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Order:</span>
                      <span>{formatCurrency(type.averageOrder)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          type.type === 'Retail' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Loyalty Program Analysis
          </CardTitle>
          <CardDescription>Customer distribution and engagement across loyalty tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {customerData.loyaltyAnalysis.map((tier) => (
              <div key={tier.tier} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getTierBadgeColor(tier.tier)}>
                    {tier.tier}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tier.customers} customers
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Percentage:</span>
                    <span className="font-medium">{tier.percentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Spent:</span>
                    <span className="font-medium">{formatCurrency(tier.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Spent:</span>
                    <span className="font-medium">{formatCurrency(tier.averageSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Points Earned:</span>
                    <span className="font-medium">{tier.pointsEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Points Redeemed:</span>
                    <span className="font-medium">{tier.pointsRedeemed.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
