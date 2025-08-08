/**
 * Dashboard Client Component for Vevurn POS System
 * 
 * This client component handles interactive dashboard features
 */

'use client';

import { useVevurnAuth, useDiscountPermission, useBelowMinimumPermission } from '@/lib/auth-hooks';
import { UserProfile } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  initialSession?: any;
}

export function DashboardClient({ initialSession }: DashboardClientProps) {
  const { user, isLoading } = useVevurnAuth();
  const { maxDiscountAllowed, canApplyDiscount } = useDiscountPermission();
  const { canSellBelowMin } = useBelowMinimumPermission();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentUser = user || initialSession?.user;

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load user session</p>
      </div>
    );
  }

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      { name: 'Point of Sale', href: '/pos', description: 'Process sales transactions', roles: ['cashier', 'manager', 'admin'] },
      { name: 'Inventory', href: '/inventory', description: 'View inventory levels', roles: ['cashier', 'manager', 'admin'] },
    ];

    const managerItems = [
      { name: 'Sales Reports', href: '/reports/sales', description: 'View sales analytics', roles: ['manager', 'admin'] },
      { name: 'Manage Inventory', href: '/inventory/manage', description: 'Update inventory', roles: ['manager', 'admin'] },
    ];

    const adminItems = [
      { name: 'User Management', href: '/admin/users', description: 'Manage user accounts', roles: ['admin'] },
      { name: 'System Settings', href: '/admin/settings', description: 'Configure system', roles: ['admin'] },
    ];

    let items = [...baseItems];
    
    if (['manager', 'admin'].includes(currentUser.role)) {
      items = [...items, ...managerItems];
    }
    
    if (currentUser.role === 'admin') {
      items = [...items, ...adminItems];
    }

    return items.filter(item => item.roles.includes(currentUser.role));
  };

  const navItems = getNavItems();

  return (
    <div className="space-y-8">
      {/* User Info Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Session Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <UserProfile />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">POS Permissions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Discount:</span>
                    <span className="font-medium">{maxDiscountAllowed}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Below Minimum Sales:</span>
                    <span className={`font-medium ${canSellBelowMin ? 'text-green-600' : 'text-red-600'}`}>
                      {canSellBelowMin ? 'Allowed' : 'Not Allowed'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`font-medium ${currentUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {currentUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permission Tests */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Permission Tests</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Can apply 5% discount:</span>
                    <span className={`font-medium px-2 py-1 rounded text-xs ${
                      canApplyDiscount(5) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {canApplyDiscount(5) ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Can apply 15% discount:</span>
                    <span className={`font-medium px-2 py-1 rounded text-xs ${
                      canApplyDiscount(15) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {canApplyDiscount(15) ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(item.href)}
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {item.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {item.description}
              </p>
              <div className="mt-4">
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                  Open →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/pos')}
              className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors"
            >
              <div className="text-green-800 font-medium">Start Sale</div>
              <div className="text-green-600 text-sm">Begin new transaction</div>
            </button>
            
            <button
              onClick={() => router.push('/inventory')}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left transition-colors"
            >
              <div className="text-blue-800 font-medium">Check Inventory</div>
              <div className="text-blue-600 text-sm">View stock levels</div>
            </button>

            {['manager', 'admin'].includes(currentUser.role) && (
              <button
                onClick={() => router.push('/reports')}
                className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left transition-colors"
              >
                <div className="text-purple-800 font-medium">View Reports</div>
                <div className="text-purple-600 text-sm">Sales analytics</div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
