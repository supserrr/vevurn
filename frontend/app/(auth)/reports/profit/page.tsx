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
import { apiClient } from '@/lib/api-client';

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

// Mock data
const mockProfitData: ProfitData = {
  summary: {
    totalRevenue: 12450000,
    totalCosts: 8115000,
    netProfit: 4335000,
    profitMargin: 34.8,
    marginGrowth: 12.5,
  },
  monthlyTrends: [
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
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const loadProfitData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const dateRanges = {
          '7d': { days: 7 },
          '30d': { days: 30 },
          '90d': { days: 90 },
          '1y': { days: 365 }
        };

        const range = dateRanges[dateRange as keyof typeof dateRanges] || dateRanges['30d'];
        const dateTo = new Date().toISOString();
        const dateFrom = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString();

        const response = await apiClient.getProfitReport(dateFrom, dateTo);
        
        if (response.success) {
          setProfitData(response.data);
        } else {
          throw new Error(response.message || 'Failed to load profit data');
        }
      } catch (error) {
        console.error('Failed to load profit data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profit data');
        
        // Fallback to mock data in development
        if (process.env.NODE_ENV === 'development') {
          setProfitData(mockProfitData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfitData();
  }, [dateRange]);

  const pieChartColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#6b7280'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profit Analysis</h1>
          <p className="text-muted-foreground">Monitor profit margins and cost breakdown</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profit data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !profitData && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Failed to Load Data</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content - Only show if data is available */}
      {!isLoading && profitData && (
        <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(profitData.summary.totalRevenue)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold">{formatCurrency(profitData.summary.totalCosts)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(profitData.summary.netProfit)}</p>
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
                      Current: {target.target.includes('Margin') ? `${target.current}%` : formatCurrency(target.current)}
                    </span>
                    <span>
                      Goal: {target.target.includes('Margin') ? `${target.goal}%` : formatCurrency(target.goal)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Profit Trends</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit Trends</CardTitle>
              <CardDescription>Revenue, costs, and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={profitData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Costs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Cost distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={profitData.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                    >
                      {profitData.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
                <CardDescription>Detailed breakdown with change indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profitData.expenseBreakdown.map((expense) => (
                    <div key={expense.category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{expense.category}</p>
                        <p className="text-xs text-muted-foreground">{expense.percentage}% of total</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(expense.amount)}</p>
                        <div className="flex items-center gap-1">
                          {expense.change > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-red-500" />
                          ) : expense.change < 0 ? (
                            <ArrowDownRight className="h-3 w-3 text-green-500" />
                          ) : null}
                          <span className={`text-xs ${
                            expense.change > 0 ? 'text-red-500' : 
                            expense.change < 0 ? 'text-green-500' : 
                            'text-gray-500'
                          }`}>
                            {expense.change > 0 ? '+' : ''}{expense.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}
