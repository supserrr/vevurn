'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  FileText
} from 'lucide-react';

interface ReportData {
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    name: string;
    totalSpent: number;
    orders: number;
  }>;
}

async function fetchReportData(period: string): Promise<ReportData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const response = await fetch(`${baseUrl}/api/reports?period=${period}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    // Return mock data for now
    return {
      dailySales: [
        { date: '2025-08-20', sales: 450000, orders: 23 },
        { date: '2025-08-21', sales: 380000, orders: 19 },
        { date: '2025-08-22', sales: 520000, orders: 28 },
        { date: '2025-08-23', sales: 675000, orders: 35 },
        { date: '2025-08-24', sales: 590000, orders: 31 },
        { date: '2025-08-25', sales: 720000, orders: 38 },
      ],
      paymentMethods: [
        { method: 'Cash', amount: 1200000, percentage: 45 },
        { method: 'Mobile Money', amount: 1000000, percentage: 37 },
        { method: 'Bank Transfer', amount: 480000, percentage: 18 },
      ],
      topProducts: [
        { name: 'iPhone 15 Case', quantity: 45, revenue: 675000 },
        { name: 'Samsung Charger', quantity: 38, revenue: 380000 },
        { name: 'AirPods Case', quantity: 32, revenue: 480000 },
        { name: 'Phone Stand', quantity: 28, revenue: 210000 },
      ],
      topCustomers: [
        { name: 'MTN Rwanda', totalSpent: 2500000, orders: 15 },
        { name: 'Airtel Rwanda', totalSpent: 1800000, orders: 12 },
        { name: 'John Doe', totalSpent: 650000, orders: 8 },
        { name: 'Jane Smith', totalSpent: 420000, orders: 6 },
      ]
    };
  }

  return response.json();
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const [period, setPeriod] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', period],
    queryFn: () => fetchReportData(period),
  });

  const exportReport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} report for period: ${period}`);
    // In real implementation, this would generate and download the report
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <Label htmlFor="period">Quick Select</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === 'custom' && (
              <>
                <div className="flex-1">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            <Button>Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`RWF ${value?.toLocaleString()}`, 'Sales']} />
              <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reportData?.paymentMethods}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  nameKey="method"
                >
                  {reportData?.paymentMethods.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `RWF ${value?.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportData?.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `RWF ${value?.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Total Spent</th>
                  <th className="text-left p-2">Orders</th>
                  <th className="text-left p-2">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.topCustomers.map((customer, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{customer.name}</td>
                    <td className="p-2">RWF {customer.totalSpent.toLocaleString()}</td>
                    <td className="p-2">{customer.orders}</td>
                    <td className="p-2">RWF {Math.round(customer.totalSpent / customer.orders).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
