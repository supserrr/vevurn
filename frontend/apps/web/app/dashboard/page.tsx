'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  Settings,
  Bell,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CreateCashierModal } from '@/components/team/CreateCashierModal';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface DashboardStats {
  business: {
    name: string;
    logo?: string;
    userCount: number;
    productCount: number;
    customerCount: number;
  };
  todaySales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  recentCashiers: Array<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    lastLoginAt?: string;
  }>;
  stockAlerts: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
  }>;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !user.businessId) {
      router.push('/onboarding');
      return;
    }

    if (user?.role === 'CASHIER') {
      router.push('/pos');
      return;
    }

    fetchDashboardStats();
  }, [user, loading, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role === 'CASHIER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {stats?.business?.logo && (
                <img 
                  src={stats.business.logo} 
                  alt="Business logo" 
                  className="h-8 w-8 rounded"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {stats?.business?.name || 'Vevurn POS'}
                </h1>
                <p className="text-sm text-gray-600">Management Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter userId={user.id} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.todaySales?.totalRevenue?.toLocaleString('en-RW', {
                      style: 'currency',
                      currency: 'RWF'
                    }) || 'RWF 0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.todaySales?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.business?.productCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.business?.userCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => router.push('/products')}
            className="h-24 flex flex-col space-y-2"
            variant="outline"
          >
            <Package className="h-6 w-6" />
            <span>Manage Products</span>
          </Button>

          <Button
            onClick={() => router.push('/pos')}
            className="h-24 flex flex-col space-y-2"
            variant="outline"
          >
            <ShoppingCart className="h-6 w-6" />
            <span>Point of Sale</span>
          </Button>

          <Button
            onClick={() => setShowCashierModal(true)}
            className="h-24 flex flex-col space-y-2"
            variant="outline"
          >
            <Users className="h-6 w-6" />
            <span>Add Cashier</span>
          </Button>

          <Button
            onClick={() => router.push('/reports')}
            className="h-24 flex flex-col space-y-2"
            variant="outline"
          >
            <TrendingUp className="h-6 w-6" />
            <span>View Reports</span>
          </Button>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Team Members</span>
                <Button
                  size="sm"
                  onClick={() => setShowCashierModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cashier
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentCashiers?.length ? (
                <div className="space-y-3">
                  {stats.recentCashiers.map((cashier) => (
                    <div key={cashier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cashier.name}</p>
                        <p className="text-sm text-gray-600">{cashier.email}</p>
                      </div>
                      <Badge variant={cashier.isActive ? 'default' : 'secondary'}>
                        {cashier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No team members yet. Add your first cashier!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-orange-500" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.stockAlerts?.length ? (
                <div className="space-y-3">
                  {stats.stockAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{alert.name}</p>
                        <p className="text-sm text-orange-600">
                          Stock: {alert.currentStock} (Min: {alert.minStock})
                        </p>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No stock alerts. All products are well-stocked!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cashier Creation Modal */}
      <CreateCashierModal
        open={showCashierModal}
        onOpenChange={setShowCashierModal}
        onSuccess={() => {
          fetchDashboardStats();
          setShowCashierModal(false);
        }}
      />
    </div>
  );
}
