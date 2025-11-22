"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"

interface ResetPasswordModalProps {
  open: boolean
  onClose: () => void
}

export default function ResetPasswordModal({ open, onClose }: ResetPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Password validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)
      // Auto-close modal after success
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Password Reset Successful!</h2>
            <p className="text-gray-600 mt-2">You can now login with your new password.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Reset Your Password</DialogTitle>
              <DialogDescription className="text-gray-600">
                Enter your email and your new password below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-gray-900 font-medium">
                  Email Address
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg border-gray-300"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-900 font-medium">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg border-gray-300"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-900 font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg border-gray-300"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-2">
  <Button
    type="button"
    variant="outline"
    onClick={handleClose}
    disabled={isLoading}
    className="flex-1 h-11"
  >
    Cancel
  </Button>

  <Button
    type="submit"
    disabled={isLoading || !email || !newPassword || !confirmPassword}
    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
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
    </div>

            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
