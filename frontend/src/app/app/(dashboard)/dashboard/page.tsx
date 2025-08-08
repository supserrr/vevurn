export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Vevurn POS Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome to your Point of Sale system!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Today's Sales */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Today's Sales</h3>
            </div>
            <div className="text-2xl font-bold">RWF 125,000</div>
            <p className="text-xs text-gray-600">23 transactions today</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Monthly Revenue</h3>
            </div>
            <div className="text-2xl font-bold">RWF 2,450,000</div>
            <p className="text-xs text-gray-600">+12.5% from last month</p>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Products</h3>
            </div>
            <div className="text-2xl font-bold">145</div>
            <p className="text-xs text-gray-600">8 low stock items</p>
          </div>

          {/* Active Customers */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Active Customers</h3>
            </div>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-gray-600">This month</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Recent Sales */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold">Recent Sales</h3>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium text-sm">VEV-001</span>
                      <p className="text-xs text-gray-600">John Mugisha</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">RWF 25,000</span>
                      <p className="text-xs text-gray-600">15m ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium text-sm">VEV-002</span>
                      <p className="text-xs text-gray-600">Alice Uwimana</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">RWF 15,000</span>
                      <p className="text-xs text-gray-600">30m ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium text-sm">VEV-003</span>
                      <p className="text-xs text-gray-600">Walk-in customer</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">RWF 45,000</span>
                      <p className="text-xs text-gray-600">45m ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <button className="text-sm text-blue-600 hover:underline w-full text-center">
                    View all sales →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 pb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    5
                  </span>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div>
                      <span className="font-medium text-sm">iPhone 14 Case</span>
                      <p className="text-xs text-gray-600">CASE-IP14-BLK</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-red-600">3 / 10</span>
                      <p className="text-xs text-gray-600">Critical</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div>
                      <span className="font-medium text-sm">USB-C Charger</span>
                      <p className="text-xs text-gray-600">CHG-USBC-20W</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-orange-600">2 / 5</span>
                      <p className="text-xs text-gray-600">Very Low</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div>
                      <span className="font-medium text-sm">Screen Protector</span>
                      <p className="text-xs text-gray-600">GLASS-SGS23</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-red-600">0 / 5</span>
                      <p className="text-xs text-gray-600">Out of Stock</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <button className="text-sm text-blue-600 hover:underline w-full text-center">
                    View inventory →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
