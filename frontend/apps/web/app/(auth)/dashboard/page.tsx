'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Products',
      value: '1,234',
      change: '+12%',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Sales',
      value: 'RWF 45,678',
      change: '+18%',
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      title: 'Customers',
      value: '892',
      change: '+8%',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Revenue',
      value: 'RWF 123,456',
      change: '+23%',
      icon: DollarSign,
      color: 'text-yellow-600',
    },
  ];

  const alerts = [
    {
      title: 'Low Stock Alert',
      description: '5 products are running low on stock',
      type: 'warning',
    },
    {
      title: 'New Orders',
      description: '3 new orders need to be processed',
      type: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back to Vevurn POS
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Product Added</p>
                  <p className="text-sm text-gray-500">iPhone 15 Case - Clear</p>
                </div>
                <span className="text-sm text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sale Completed</p>
                  <p className="text-sm text-gray-500">RWF 25,000 - Cash</p>
                </div>
                <span className="text-sm text-gray-400">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stock Updated</p>
                  <p className="text-sm text-gray-500">Samsung Galaxy S24</p>
                </div>
                <span className="text-sm text-gray-400">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
              <Package className="h-4 w-4" />
              Add Product
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Users className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
