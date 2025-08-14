export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your POS dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="w-6 h-6 text-green-600 dark:text-green-400">
                💰
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Today's Sales
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                RWF 150,000
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <div className="w-6 h-6 text-blue-600 dark:text-blue-400">
                🛍️
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Orders Today
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                23
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <div className="w-6 h-6 text-yellow-600 dark:text-yellow-400">
                📦
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Low Stock Items
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                5
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <div className="w-6 h-6 text-purple-600 dark:text-purple-400">
                👥
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Customers
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                1,234
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="text-2xl mb-2">🛒</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New Sale
              </p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Add Product
              </p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="text-2xl mb-2">👤</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New Customer
              </p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                View Reports
              </p>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sales
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  iPhone 15 Case
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  10:30 AM
                </p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-medium">
                RWF 25,000
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Samsung Charger
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  10:15 AM
                </p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-medium">
                RWF 15,000
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Phone Screen Protector
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  9:45 AM
                </p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-medium">
                RWF 8,000
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
