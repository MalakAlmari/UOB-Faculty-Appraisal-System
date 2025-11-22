"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, CheckCircle, XCircle, Clock, Send, Calculator, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// Using new enum values
type EvaluationStatus = "new" | "sent" | "complete" | "returned"

interface FacultyAppraisal {
  id: string
  academicYear: string
  status: EvaluationStatus
  finalScore?: number
  submittedAt?: string
  faculty: {
    id: string
    name: string
    email: string
  }
  cycle: {
    academicYear: string
    semester: string
  }
  evaluations: any[]
  _count: {
    awards: number
    courses: number
    researchActivities: number
    scientificActivities: number
    universityServices: number
    communityServices: number
    evidences: number
  }
}

export default function HODAppraisalPage() {
  const [appraisals, setAppraisals] = useState<FacultyAppraisal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [selectedAppraisal, setSelectedAppraisal] = useState<FacultyAppraisal | null>(null)

  useEffect(() => {
    fetchFacultyAppraisals()
  }, [])

  const fetchFacultyAppraisals = async () => {
    try {
      const response = await fetch("/api/hod/appraisals")
      if (response.ok) {
        const data = await response.json()
        setAppraisals(data)
      }
    } catch (error) {
      console.error("Error fetching faculty appraisals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4" />
      case "sent":
        return <Send className="h-4 w-4" />
      case "complete":
        return <CheckCircle className="h-4 w-4" />
      case "returned":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "sent":
        return "bg-orange-100 text-orange-800"
      case "complete":
        return "bg-green-100 text-green-800"
      case "returned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canEvaluate = (status: string) => {
    return status === "new"
  }

  const canSendScores = (status: string) => {
    return status === "new"
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Faculty Appraisals</h1>
          <p className="text-muted-foreground">Review and evaluate faculty performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appraisals.map((appraisal) => (
          <Card key={appraisal.id} className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {appraisal.faculty.name}
                </CardTitle>
                <Badge className={getStatusColor(appraisal.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(appraisal.status)}
                    {appraisal.status}
                  </div>
                </Badge>
              </div>
              <CardDescription>
                {appraisal.cycle.academicYear} - {appraisal.cycle.semester}
              </CardDescription>
              <CardDescription>
                Awards: {appraisal._count.awards} | Courses: {appraisal._count.courses} | Research: {appraisal._count.researchActivities} | Scientific: {appraisal._count.scientificActivities} | Services: {appraisal._count.universityServices + appraisal._count.communityServices} | Evidence: {appraisal._count.evidences}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {appraisal.finalScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Final Score:</span>
                  <span className="font-bold text-accent">{appraisal.finalScore}%</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAppraisal(appraisal)
                    setShowEvaluationForm(true)
                  }}
                  className="flex-1"
                  disabled={!canEvaluate(appraisal.status)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {canEvaluate(appraisal.status) ? "Evaluate" : "View"}
                </Button>

                {canSendScores(appraisal.status) && (
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Calculator className="mr-2 h-4 w-4" />
                    Send Scores
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {appraisals.length === 0 && (
        <Card className="bg-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No faculty appraisals to review</p>
            <p className="text-sm text-muted-foreground">
              Faculty appraisals will appear here once they submit their achievements for evaluation.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEvaluationForm} onOpenChange={setShowEvaluationForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Evaluate {selectedAppraisal?.faculty.name} - {selectedAppraisal?.cycle.academicYear}
            </DialogTitle>
            <DialogDescription>
              Review achievements and provide evaluation scores
            </DialogDescription>
          </DialogHeader>
          {selectedAppraisal && (
            <div className="mt-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Faculty Information</h3>
                <p><strong>Name:</strong> {selectedAppraisal.faculty.name}</p>
                <p><strong>Email:</strong> {selectedAppraisal.faculty.email}</p>
                <p><strong>Academic Year:</strong> {selectedAppraisal.cycle.academicYear}</p>
                <p><strong>Semester:</strong> {selectedAppraisal.cycle.semester}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This is where the evaluation form would be rendered. The HOD can review all achievements and provide scores for different categories.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEvaluationForm(false)}>
                  Close
                </Button>
                <Button className="bg-accent text-accent-foreground">
                  Save Evaluation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
