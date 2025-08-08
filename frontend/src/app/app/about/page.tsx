export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Vevurn POS System
          </h1>
          <p className="text-xl text-gray-600">
            Professional Point of Sale System for Rwandan Businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              ✅ System Features
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Real-time sales tracking</li>
              <li>• Multi-currency support (RWF, USD, EUR)</li>
              <li>• MTN Mobile Money integration</li>
              <li>• Inventory management</li>
              <li>• Customer relationship management</li>
              <li>• Loan tracking system</li>
              <li>• Professional dashboard</li>
              <li>• Mobile-responsive design</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              🛠️ Technical Stack
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Frontend:</strong> Next.js 14 + TypeScript</li>
              <li>• <strong>Styling:</strong> Tailwind CSS</li>
              <li>• <strong>Database:</strong> PostgreSQL + Prisma ORM</li>
              <li>• <strong>Authentication:</strong> Clerk (optional)</li>
              <li>• <strong>Deployment:</strong> Docker + GitHub Actions</li>
              <li>• <strong>Monitoring:</strong> Custom health checks</li>
              <li>• <strong>Caching:</strong> Redis integration</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">
            🚀 Current Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">✅</div>
              <div className="text-sm text-gray-600 mt-2">Frontend Ready</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">✅</div>
              <div className="text-sm text-gray-600 mt-2">API Functional</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">⚡</div>
              <div className="text-sm text-gray-600 mt-2">DB Setup Needed</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">
            📋 Next Steps for Production
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Set up PostgreSQL database (Neon, Supabase, or Railway recommended)</li>
            <li>Configure environment variables for database connection</li>
            <li>Run <code className="bg-gray-200 px-2 py-1 rounded">npm run db:push</code> to create database schema</li>
            <li>Optional: Configure Clerk authentication keys</li>
            <li>Deploy using the included GitHub Actions workflow</li>
            <li>Start processing real sales and inventory data!</li>
          </ol>
        </div>

        <div className="text-center mt-8">
          <div className="space-x-4">
            <a 
              href="/dashboard" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              View Dashboard
            </a>
            <a 
              href="/api/demo" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block"
            >
              Test API
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
