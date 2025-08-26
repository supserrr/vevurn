'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TouchButton } from './TouchButton';
import Link from 'next/link';

interface MobileDashboardProps {
  stats: {
    todaysSales: number;
    todaysTransactions: number;
    lowStockItems: number;
    totalProducts: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalCustomers: number;
    weeklyGrowth: number;
  };
}

export function MobileDashboard({ stats }: MobileDashboardProps) {
  const quickActions = [
    {
      name: 'New Sale',
      href: '/sales/mobile',
      icon: ShoppingCart,
      color: 'bg-green-500',
      description: 'Start a new transaction'
    },
    {
      name: 'Add Product',
      href: '/products/mobile',
      icon: Package,
      color: 'bg-blue-500',
      description: 'Add new inventory'
    },
    {
      name: 'View Reports',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-purple-500',
      description: 'Sales analytics'
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      color: 'bg-orange-500',
      description: 'Manage customers'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-sm text-gray-500">Sales</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.todaysSales)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500 mr-1" />
                <span className="text-sm text-gray-500">Transactions</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.todaysTransactions}
              </div>
            </div>
          </div>
          
          {/* Growth indicator */}
          <div className="flex items-center justify-center mt-4 pt-4 border-t">
            {stats.weeklyGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${stats.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(stats.weeklyGrowth)}% vs last week
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href as any}>
              <TouchButton
                variant="outline"
                className="w-full h-20 p-4 flex flex-col items-center justify-center space-y-2 border-2 hover:border-gray-300"
              >
                <div className={`p-2 rounded-full ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{action.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </div>
                </div>
              </TouchButton>
            </Link>
          ))}
        </div>
      </div>

      {/* Status Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">System Status</h2>
        
        {/* Low Stock Alert */}
        {stats.lowStockItems > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-800">Low Stock Alert</p>
                    <p className="text-sm text-orange-600">
                      {stats.lowStockItems} items need restocking
                    </p>
                  </div>
                </div>
                <Link href={"/products/mobile" as any}>
                  <TouchButton size="sm" variant="outline" className="border-orange-300 text-orange-700">
                    View
                  </TouchButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Clear */}
        {stats.lowStockItems === 0 && stats.overdueInvoices === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">All Systems Good</p>
                  <p className="text-sm text-green-600">
                    No urgent issues require attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-semibold">{stats.totalProducts}</div>
              <div className="text-xs text-gray-500">Products</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-semibold">{stats.totalCustomers}</div>
              <div className="text-xs text-gray-500">Customers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-lg font-semibold">
                {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}%
              </div>
              <div className="text-xs text-gray-500">Growth</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
