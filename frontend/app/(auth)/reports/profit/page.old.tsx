'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Types
interface ProfitData {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    marginGrowth: number;
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    change: number;
  }>;
  profitTargets: Array<{
    target: string;
    current: number;
    goal: number;
    percentage: number;
    status: 'exceeded' | 'on-track' | 'behind';
  }>;
}

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getTargetStatusIcon = (status: string) => {
  switch (status) {
    case 'exceeded':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'on-track':
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    case 'behind':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
};

const getTargetStatusColor = (status: string): string => {
  switch (status) {
    case 'exceeded':
      return 'text-green-600';
    case 'on-track':
      return 'text-blue-600';
    case 'behind':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

// Mock profit analysis data
const mockProfitData: ProfitAnalysisData = {
  summary: {
    totalRevenue: 12450000,
    totalCosts: 8115000,
    grossProfit: 4335000,
    netProfit: 3825000,
    profitMargin: 30.7,
    grossMargin: 34.8,
    profitGrowth: 18.5,
    marginGrowth: 2.3,
  },
  profitByCategory: [
    {
      category: 'Phone Cases',
      revenue: 4580000,
      cost: 2748000,
      profit: 1832000,
      margin: 40.0,
      growth: 22.1,
    },
    {
      category: 'Screen Protectors',
      revenue: 2850000,
      cost: 1995000,
      profit: 855000,
      margin: 30.0,
      growth: 15.8,
    },
    {
      category: 'Chargers & Cables',
      revenue: 2120000,
      cost: 1484000,
      profit: 636000,
      margin: 30.0,
      growth: 18.3,
    },
    {
      category: 'Phone Mounts',
      revenue: 1580000,
      cost: 1106000,
      profit: 474000,
      margin: 30.0,
      growth: 8.9,
    },
    {
      category: 'Headphones',
      revenue: 1320000,
      cost: 792000,
      profit: 528000,
      margin: 40.0,
      growth: 12.4,
    },
  ],
  profitByProduct: [
    {
      productId: 'PRD-001',
      productName: 'iPhone 15 Pro Case Premium',
      unitsSold: 245,
      revenue: 3675000,
      cost: 2205000,
      profit: 1470000,
      margin: 40.0,
      profitPerUnit: 6000,
    },
    {
      productId: 'PRD-002',
      productName: 'Samsung Galaxy Screen Protector',
      unitsSold: 198,
      revenue: 1584000,
      cost: 1108800,
      profit: 475200,
      margin: 30.0,
      profitPerUnit: 2400,
    },
    {
      productId: 'PRD-003',
      productName: 'USB-C Cable Premium 2m',
      unitsSold: 167,
      revenue: 1336000,
      cost: 935200,
      profit: 400800,
      margin: 30.0,
      profitPerUnit: 2400,
    },
    {
      productId: 'PRD-004',
      productName: 'Wireless Charger Stand',
      unitsSold: 134,
      revenue: 2010000,
      cost: 1407000,
      profit: 603000,
      margin: 30.0,
      profitPerUnit: 4500,
    },
    {
      productId: 'PRD-005',
      productName: 'Car Phone Mount Magnetic',
      unitsSold: 89,
      revenue: 801000,
      cost: 560700,
      profit: 240300,
      margin: 30.0,
      profitPerUnit: 2700,
    },
  ],
  monthlyProfitTrend: [
    { month: 'Jan', revenue: 2850000, cost: 1995000, profit: 855000, margin: 30.0 },
    { month: 'Feb', revenue: 3120000, cost: 2184000, profit: 936000, margin: 30.0 },
    { month: 'Mar', revenue: 2980000, cost: 2086000, profit: 894000, margin: 30.0 },
    { month: 'Apr', revenue: 3500000, cost: 2450000, profit: 1050000, margin: 30.0 },
  ],
  expenseBreakdown: [
    { category: 'Cost of Goods Sold', amount: 6890000, percentage: 84.9, change: 12.5 },
    { category: 'Staff Salaries', amount: 450000, percentage: 5.5, change: 3.2 },
    { category: 'Rent & Utilities', amount: 280000, percentage: 3.4, change: 0.0 },
    { category: 'Marketing', amount: 185000, percentage: 2.3, change: 25.0 },
    { category: 'Insurance', amount: 125000, percentage: 1.5, change: 0.0 },
    { category: 'Equipment & Maintenance', amount: 95000, percentage: 1.2, change: -15.0 },
    { category: 'Other Expenses', amount: 90000, percentage: 1.1, change: 8.5 },
  ],
  profitTargets: [
    {
      target: 'Monthly Profit Target',
      current: 3825000,
      goal: 4000000,
      percentage: 95.6,
      status: 'on-track',
    },
    {
      target: 'Profit Margin Target',
      current: 30.7,
      goal: 35.0,
      percentage: 87.7,
      status: 'behind',
    },
    {
      target: 'Quarterly Revenue Target',
      current: 12450000,
      goal: 15000000,
      percentage: 83.0,
      status: 'behind',
    },
    {
      target: 'Cost Reduction Target',
      current: 8115000,
      goal: 7500000,
      percentage: 92.4,
      status: 'behind',
    },
  ],
};

export default function ProfitAnalysisPage() {
  const [profitData, setProfitData] = useState<ProfitAnalysisData>(mockProfitData);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const loadProfitData = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch profit analysis data from API
        // const response = await ApiClient.request(`/reports/profit?range=${dateRange}`);
        // setProfitData(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfitData(mockProfitData);
      } catch (error: any) {
        console.error('Failed to load profit analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfitData();
  }, [dateRange]);

  const exportReport = () => {
    // In real app, call API to generate and download report
    console.log('Exporting profit analysis...');
    
    // Simulate file download
    const csvContent = `Category,Revenue,Cost,Profit,Margin
${profitData.profitByCategory.map(cat => 
  `${cat.category},${cat.revenue},${cat.cost},${cat.profit},${cat.margin}%`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `profit-analysis-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTargetStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'on-track':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'behind':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTargetStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-green-600';
      case 'on-track': return 'text-blue-600';
      case 'behind': return 'text-red-600';
      default: return 'text-muted-foreground';
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
            <h1 className="text-3xl font-bold">Profit Analysis</h1>
            <p className="text-muted-foreground">
              Comprehensive profitability insights and cost analysis
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

      {/* Profit Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(profitData.summary.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gross sales
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(profitData.summary.grossProfit)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{profitData.summary.profitGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(profitData.summary.netProfit)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  After all expenses
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
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">{profitData.summary.profitMargin}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{profitData.summary.marginGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Percent className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Profit Targets & Goals
          </CardTitle>
          <CardDescription>Track progress against key profit objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {profitData.profitTargets.map((target) => (
              <div key={target.target} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{target.target}</h4>
                  <div className="flex items-center gap-2">
                    {getTargetStatusIcon(target.status)}
                    <span className={`text-sm font-medium ${getTargetStatusColor(target.status)}`}>
                      {target.status === 'exceeded' ? 'Exceeded' :
                       target.status === 'on-track' ? 'On Track' : 'Behind'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{target.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        target.status === 'exceeded' ? 'bg-green-500' :
                        target.status === 'on-track' ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(target.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Current: {target.target.includes('Margin') || target.target.includes('Target') && typeof target.current === 'number' && target.current < 100 
                        ? `${target.current}%` 
                        : formatCurrency(target.current)}
                    </span>
                    <span>
                      Goal: {target.target.includes('Margin') || target.target.includes('Target') && typeof target.goal === 'number' && target.goal < 100 
                        ? `${target.goal}%` 
                        : formatCurrency(target.goal)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profit by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Profit by Category
            </CardTitle>
            <CardDescription>Profitability breakdown by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitData.profitByCategory.map((category) => (
                <div key={category.category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          Margin: {category.margin}%
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
                      <span className="font-semibold">{formatCurrency(category.profit)}</span>
                      <p className="text-sm text-muted-foreground">
                        Revenue: {formatCurrency(category.revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Profit Margin</span>
                      <span>{category.margin}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(category.margin, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Profitable Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Profitable Products
            </CardTitle>
            <CardDescription>Most profitable products by absolute profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitData.profitByProduct
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 5)
                .map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.unitsSold} units • {product.margin}% margin
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(product.profit)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(product.profitPerUnit)}/unit
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Profit Trend
          </CardTitle>
          <CardDescription>Profit performance over the last 4 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profitData.monthlyProfitTrend.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="font-semibold">{month.month}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-medium">{formatCurrency(month.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-medium">{formatCurrency(month.cost)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className="font-semibold text-green-600">{formatCurrency(month.profit)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{month.margin}%</p>
                  <p className="text-sm text-muted-foreground">Margin</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Expense Breakdown
          </CardTitle>
          <CardDescription>Detailed analysis of business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profitData.expenseBreakdown.map((expense) => (
              <div key={expense.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{expense.category}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {expense.percentage}% of total
                      </span>
                      <div className="flex items-center gap-1">
                        {expense.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-red-600" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-green-600" />
                        )}
                        <span className={`text-xs ${
                          expense.change >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {expense.change >= 0 ? '+' : ''}{expense.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${expense.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
