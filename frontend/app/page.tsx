import AuthComponent from "../components/AuthComponent"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vevurn POS System</h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome to the Vevurn Point of Sale System
          </p>
        </div>

        <div className="mb-12">
          <AuthComponent />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/dashboard"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">Access the main POS dashboard</p>
            </Link>
            
            <Link 
              href="/auth/signin"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Sign In</h3>
              <p className="text-sm text-gray-600 mt-1">Access your account</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
