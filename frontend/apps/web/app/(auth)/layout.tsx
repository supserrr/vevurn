import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Vevurn POS
              </span>
            </div>
            
            <nav className="flex-1 space-y-1 p-4">
              <a
                href="/dashboard"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md dark:text-gray-200 dark:bg-gray-700"
              >
                <span>Dashboard</span>
              </a>
              <a
                href="/products"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span>Products</span>
              </a>
              <a
                href="/sales"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span>Sales</span>
              </a>
              <a
                href="/customers"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span>Customers</span>
              </a>
              <a
                href="/inventory"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span>Inventory</span>
              </a>
              <a
                href="/reports"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span>Reports</span>
              </a>
              <a
                href="/settings"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span>Settings</span>
              </a>
            </nav>

            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cashier</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pl-64">
          <div className="px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
