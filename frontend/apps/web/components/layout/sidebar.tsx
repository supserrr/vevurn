'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Store
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Point of Sale', href: '/sales', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <Store className="h-8 w-8 mr-2 text-green-400" />
        <h1 className="text-xl font-bold">Vevurn POS</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href as any}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start text-left h-12',
                  isActive 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-gray-700 p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white h-12"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
