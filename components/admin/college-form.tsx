"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface College {
  id: string
  name: string
  code: string
}

interface CollegeFormProps {
  college?: College
  onSuccess: () => void
  onCancel: () => void
}

export function CollegeForm({ college, onSuccess, onCancel }: CollegeFormProps) {
  const [name, setName] = useState(college?.name || "")
  const [code, setCode] = useState(college?.code || "")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = college ? `/api/admin/colleges/${college.id}` : "/api/admin/colleges"
      const method = college ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save college")
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{college ? "Edit College" : "Add New College"}</CardTitle>
        <CardDescription>
          {college ? "Update college information" : "Create a new college in the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">College Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., College of Engineering"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">College Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., COE"
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {college ? "Update" : "Create"} College
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
