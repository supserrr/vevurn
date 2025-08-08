import SignUpForm from "../../../components/SignUpForm"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vevurn POS</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
