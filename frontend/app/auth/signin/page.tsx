import SignInForm from "../../../components/SignInForm"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vevurn POS</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
