import AuthComponent from "../../components/AuthComponent"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">POS Dashboard</h1>
        
        <div className="mb-8">
          <AuthComponent />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Sales</h2>
            <p className="text-gray-600">Manage your sales transactions</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-600">View sales reports and analytics</p>
          </div>
        </div>
      </div>
    </div>
  )
}
