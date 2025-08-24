'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { DollarSign, Package, Users, TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  todaySales: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load various stats from APIs (in parallel)
      const [salesResponse, productsResponse, customersResponse] = await Promise.all([
        api.sales.getAll().catch(() => ({ success: false, data: [] })),
        api.products.getAll().catch(() => ({ success: false, data: [] })),
        api.customers.getAll().catch(() => ({ success: false, data: [] }))
      ]);

      // Calculate stats
      const today = new Date().toDateString();
      const todaySales = salesResponse.success ? 
        salesResponse.data.filter((sale: any) => 
          new Date(sale.createdAt).toDateString() === today
        ).reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0) : 0;

      const totalProducts = productsResponse.success ? productsResponse.data.length : 0;
      const totalCustomers = customersResponse.success ? customersResponse.data.length : 0;
      const lowStockItems = productsResponse.success ? 
        productsResponse.data.filter((product: any) => product.currentStock < 10).length : 0;

      setStats({
        todaySales,
        totalProducts,
        totalCustomers,
        lowStockItems
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Vevurn POS - Your business overview</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/pos" as="/pos">
          <Button className="h-20 w-full text-lg bg-green-600 hover:bg-green-700">
            <ShoppingCart className="mr-2 h-6 w-6" />
            Start New Sale
          </Button>
        </Link>
        <Link href="/products" as="/products">
          <Button variant="outline" className="h-20 w-full text-lg">
            <Package className="mr-2 h-5 w-5" />
            Manage Products
          </Button>
        </Link>
        <Link href="/customers" as="/customers">
          <Button variant="outline" className="h-20 w-full text-lg">
            <Users className="mr-2 h-5 w-5" />
            Manage Customers
          </Button>
        </Link>
        <Link href="/sales" as="/sales">
          <Button variant="outline" className="h-20 w-full text-lg">
            <TrendingUp className="mr-2 h-5 w-5" />
            View Sales
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.todaySales.toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue generated today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items below 10 units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Process Sale</p>
                <p className="text-sm text-gray-600">Start a new sale transaction</p>
              </div>
              <Link href="/pos" as="/pos">
                <Button size="sm">Go to POS</Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Add Product</p>
                <p className="text-sm text-gray-600">Add new products to inventory</p>
              </div>
              <Link href="/products" as="/products">
                <Button size="sm" variant="outline">Add Product</Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-gray-600">Check sales and inventory reports</p>
              </div>
              <Link href="/reports" as="/reports">
                <Button size="sm" variant="outline">View Reports</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Backend API</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment System</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ready
              </span>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
