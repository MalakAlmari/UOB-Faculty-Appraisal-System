import Link from "next/link"
import { getSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const user = await getSession()

  if (user) {
    const redirectPath ="/dashboard"
    redirect(redirectPath)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="hidden md:block md:w-1/2 h-full">
        <img
          src="login.jpg"
          alt="Faculty Appraisal System"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-white p-6">
        <h1 className="text-sm md:text-2xl font-bold mb-4 text-center">FACULTY APPRAISAL SYSTEM</h1>
        <img
          src="logo.png"
          alt="Logo"
          className="mb-6 w-30 md:w-40"
        />
        <Link
          href="/auth/signin"
          className="px-4 py-2 md:px-6 md:py-3 bg-yellow-700 text-white rounded hover:bg-yellow-800 transition text-xs md:text-base"
        >
          LOGIN AS FACULTY APPRAISAL SYSTEM
        </Link>
      </div>
    </div>
  )
}