'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data for now - will be replaced with real API calls
  const stats = {
    todaysSales: { amount: 2450000, count: 23, change: 12.5 },
    weekSales: { amount: 15680000, count: 156, change: -3.2 },
    monthSales: { amount: 48250000, count: 542, change: 8.7 },
    inventory: { totalProducts: 1247, lowStock: 23, totalValue: 125000000 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Vevurn POS! Phase 3 completed. Now ready for Phase 4: POS Interface.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pos">
              <Calculator className="h-4 w-4 mr-2" />
              Open POS
            </Link>
          </Button>
        </div>
      </div>

      {/* Phase Progress */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">✅ Phase 1 & 2 Complete!</CardTitle>
          <CardDescription className="text-green-600">
            Authentication and Dashboard Foundation implemented successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-green-700">✅ Better Auth integration working</p>
            <p className="text-sm text-green-700">✅ Login/Registration system functional</p>
            <p className="text-sm text-green-700">✅ Dashboard layout responsive</p>
            <p className="text-sm text-green-700">✅ UI components library ready</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todaysSales.amount)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{stats.todaysSales.change}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventory.totalProducts}</div>
            <div className="text-xs text-muted-foreground">
              Value: {formatCurrency(stats.inventory.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.inventory.lowStock}</div>
            <div className="text-xs text-muted-foreground">
              Items need restocking
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.weekSales.amount)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              {stats.weekSales.change}% from last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Phase */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🚀 Ready for Phase 3: Product Management</CardTitle>
          <CardDescription className="text-blue-600">
            Let's implement the core product management functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link href="/products">
                <Package className="h-6 w-6 mb-2" />
                <span>View Products</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link href="/products/new">
                <Plus className="h-6 w-6 mb-2" />
                <span>Add Product</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link href="/products/categories">
                <Package className="h-6 w-6 mb-2" />
                <span>Categories</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
