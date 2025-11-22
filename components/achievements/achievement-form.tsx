"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface AchievementFormProps {
  appraisalId?: number
  type: string
  onSuccess: () => void
  onCancel: () => void
}

export function AchievementForm({ appraisalId, type, onSuccess, onCancel }: AchievementFormProps) {
  const [formData, setFormData] = useState<any>({})
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      let endpoint = ""
      let data = { ...formData, appraisalId }

      switch (type) {
        case "award":
          endpoint = "/api/awards"
          break
        case "course":
          endpoint = "/api/courses"
          data.semester = data.semester || "FALL"
          break
        case "research":
          endpoint = "/api/research-activities"
          break
        case "scientific":
          endpoint = "/api/scientific-activities"
          break
        case "university":
          endpoint = "/api/university-services"
          break
        case "community":
          endpoint = "/api/community-services"
          break
        default:
          throw new Error("Invalid achievement type")
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to save achievement")
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderFormFields = () => {
    switch (type) {
      case "award":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Award Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Best Research Paper Award"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area/Category</Label>
              <Input
                id="area"
                value={formData.area || ""}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Research, Teaching, Service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization || ""}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g., IEEE, ACM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateObtained">Date Obtained</Label>
              <Input
                id="dateObtained"
                type="date"
                value={formData.dateObtained || ""}
                onChange={(e) => setFormData({ ...formData, dateObtained: e.target.value })}
              />
            </div>
          </>
        )

      case "course":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={formData.academicYear || ""}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="e.g., 2024-2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={formData.semester || ""} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FALL">Fall</SelectItem>
                  <SelectItem value="SPRING">Spring</SelectItem>
                  <SelectItem value="SUMMER">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                value={formData.courseCode || ""}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                placeholder="e.g., CS101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseTitle">Course Title</Label>
              <Input
                id="courseTitle"
                value={formData.courseTitle || ""}
                onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                placeholder="e.g., Introduction to Computer Science"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit">Credit Hours</Label>
              <Input
                id="credit"
                type="number"
                value={formData.credit || ""}
                onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) })}
                placeholder="e.g., 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentsCount">Number of Students</Label>
              <Input
                id="studentsCount"
                type="number"
                value={formData.studentsCount || ""}
                onChange={(e) => setFormData({ ...formData, studentsCount: parseInt(e.target.value) })}
                placeholder="e.g., 30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentsEvalAvg">Student Evaluation Average</Label>
              <Input
                id="studentsEvalAvg"
                type="number"
                step="0.1"
                value={formData.studentsEvalAvg || ""}
                onChange={(e) => setFormData({ ...formData, studentsEvalAvg: parseFloat(e.target.value) })}
                placeholder="e.g., 4.5"
              />
            </div>
          </>
        )

      default:
        return <div>Invalid achievement type</div>
    }
  }

  const getTitle = () => {
    switch (type) {
      case "award": return "Add Award"
      case "course": return "Add Course Taught"
      default: return "Add Achievement"
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>
          Add details about your achievement for the current appraisal cycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Achievement
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
