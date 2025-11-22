"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, CheckCircle } from "lucide-react"
import { signIn } from "next-auth/react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const urlEmail = searchParams.get("email")
    const urlToken = searchParams.get("token")
    
    if (urlEmail && urlToken) {
      setEmail(decodeURIComponent(urlEmail))
      setToken(urlToken)
    } else {
      setError("Invalid or missing reset token")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setIsSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    try {
      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard"
      })
    } catch (error) {
      console.error("Sign in error:", error)
      router.push("/auth/signin")
    }
  }

  if (isSuccess) {
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

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Password Reset Successful!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been updated successfully. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSignIn} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-xl">
                Continue to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && (!email || !token)) {
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

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/auth/signin")} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-xl">
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg border-gray-300"
                  placeholder="Enter your new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg border-gray-300"
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/auth/signin")}
                  disabled={isLoading}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}