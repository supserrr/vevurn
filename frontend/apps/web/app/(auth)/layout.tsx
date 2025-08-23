import { authClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await authClient.getSession();
    
    if (!session?.data?.user) {
      redirect('/login');
    }

    if (!session.data.user.isActive) {
      redirect('/account-suspended');
    }

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
                <a href="/dashboard" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md dark:text-gray-200 dark:bg-gray-700">
                  Dashboard
                </a>
                <a href="/products" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  Products
                </a>
                <a href="/sales" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  Sales
                </a>
                <a href="/customers" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  Customers
                </a>
                <a href="/inventory" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  Inventory
                </a>
                <a href="/reports" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  Reports
                </a>
                <a href="/settings" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                  Settings
                </a>
              </nav>

              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.data.user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.data.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.data.user.role}
                    </p>
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
  } catch (error) {
    redirect('/login');
  }
}
