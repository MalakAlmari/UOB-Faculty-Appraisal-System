"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface College {
  id: number
  name: string
  code: string
}

interface Department {
  id: number
  name: string
  code: string | null
  collegeId: number
}

interface DepartmentFormProps {
  department?: Department
  onSuccess: () => void
  onCancel: () => void
}

export function DepartmentForm({ department, onSuccess, onCancel }: DepartmentFormProps) {
  const [name, setName] = useState(department?.name || "")
  const [code, setCode] = useState(department?.code || "")
  const [collegeId, setCollegeId] = useState(department?.collegeId?.toString() || "")
  const [colleges, setColleges] = useState<College[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch colleges for the select
    const fetchColleges = async () => {
      try {
        const response = await fetch("/api/admin/colleges")
        if (response.ok) {
          const data = await response.json()
          setColleges(data)
        }
      } catch (error) {
        console.error("Error fetching colleges:", error)
      }
    }
    fetchColleges()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = department ? `/api/admin/departments/${department.id}` : "/api/admin/departments"
      const method = department ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code || null, collegeId: parseInt(collegeId) }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save department")
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
        <CardTitle>{department ? "Edit Department" : "Add New Department"}</CardTitle>
        <CardDescription>
          {department ? "Update department information" : "Create a new department in the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Computer Science"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Department Code (Optional)</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., CS"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="college">College</Label>
            <Select value={collegeId} onValueChange={setCollegeId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a college" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id.toString()}>
                    {college.name} ({college.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !collegeId} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {department ? "Update" : "Create"} Department
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