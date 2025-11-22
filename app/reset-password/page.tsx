"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState("")
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlToken = searchParams.get("token")
    if (urlToken) {
      setToken(urlToken)
      setIsValidatingToken(false)
    } else {
      setError("Invalid reset link")
      setIsValidatingToken(false)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = () => {
    router.push("/")
  }

  // Show loading while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    )
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Password Reset Successful!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your password has been successfully reset. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignIn} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-gray-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full h-11">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your new password below. Make sure it's secure and easy to remember.
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

            <div className="text-sm text-gray-500">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1">
                <li>At least 6 characters long</li>
                <li>Passwords must match</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => router.push("/")}
            >
              Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}