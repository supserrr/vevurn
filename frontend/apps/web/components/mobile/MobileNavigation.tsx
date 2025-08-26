'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Bell, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Store,
  Search
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Point of Sale', href: '/sales/mobile', icon: ShoppingCart, badge: 'POS' },
  { name: 'Products', href: '/products/mobile', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface MobileNavigationProps {
  overdueInvoices?: number;
  lowStockItems?: number;
}

export function MobileNavigation({ overdueInvoices = 0, lowStockItems = 0 }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 h-16">
        <div className="flex items-center justify-between px-4 py-3 h-full">
          <Button variant="ghost" size="sm" onClick={toggleMenu} className="p-2">
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-green-600" />
            <h1 className="font-bold text-lg">Vevurn</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="h-5 w-5" />
              {(overdueInvoices > 0 || lowStockItems > 0) && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {overdueInvoices + lowStockItems}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="grid grid-cols-5 py-1">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href as any} onClick={closeMenu}>
                <div className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 relative',
                  isActive 
                    ? 'text-green-600' 
                    : 'text-gray-600 hover:text-green-600'
                )}>
                  <item.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium truncate w-full text-center">
                    {item.name === 'Point of Sale' ? 'POS' : item.name}
                  </span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 h-4 w-8 text-xs p-0 flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={closeMenu}
        />
      )}

      {/* Slide-out Menu */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50',
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Store className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vevurn POS</h2>
              <p className="text-sm text-gray-600">Point of Sale System</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={closeMenu} className="p-2">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href as any} onClick={closeMenu}>
                  <div className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors',
                    isActive 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  )}>
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.badge && !isActive && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="px-4 mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              {overdueInvoices > 0 && (
                <Link href="/invoices?status=OVERDUE" onClick={closeMenu}>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">Overdue Invoices</span>
                    <Badge variant="destructive">{overdueInvoices}</Badge>
                  </div>
                </Link>
              )}
              {lowStockItems > 0 && (
                <Link href="/products?filter=low-stock" onClick={closeMenu}>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Low Stock Items</span>
                    <Badge className="bg-orange-100 text-orange-800">{lowStockItems}</Badge>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Menu Footer */}
        <div className="border-t p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
            onClick={closeMenu}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
