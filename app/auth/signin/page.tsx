import { getSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SignInForm } from "@/components/auth/signin-form"

export default async function SignInPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Appraisal System</h1>
          <p className="text-gray-600">University Performance Management Portal</p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-white rounded-3xl shadow-sm border border-gray-200 flex items-center justify-center p-4">
            <img
              src="/logo.png"
              alt="University of Bahrain - Faculty Appraisal System"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
