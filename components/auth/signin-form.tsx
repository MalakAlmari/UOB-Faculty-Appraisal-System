"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import ResetPasswordModal from "@/components/ResetPasswordModal";

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showReset, setShowReset] = useState(false);
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-900 font-medium text-base">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="h-12 rounded-xl border-gray-300 text-base"
          placeholder="Enter your email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-900 font-medium text-base">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="h-12 rounded-xl border-gray-300 text-base"
          placeholder="Enter your password"
        />
      </div>
      <div className="text-center">
  <button
    type="button"
    onClick={() => setShowReset(true)}
    className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
  >
    FORGOT PASSWORD? RESET PASSWORD
  </button>
</div>


      
      <Button
        type="submit"
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-xl"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "LOGIN"
        )}
      </Button>
    </form>

    <ResetPasswordModal open={showReset} onClose={() => setShowReset(false)} />

  </div>
  )
}
