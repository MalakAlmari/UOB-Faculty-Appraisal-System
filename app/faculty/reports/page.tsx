"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, CheckCircle } from "lucide-react"

interface AppraisalCycle {
  id: number
  academicYear: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface AppraisalData {
  id: number
  status: string
  totalScore?: number
  submittedAt?: string
  createdAt: string
  updatedAt: string
  appraisal: {
    id: number
    status: string
    totalScore?: number
  }
  faculty: {
    id: number
    name: string
    email: string
    academicRank?: string
    department: {
      name: string
      college: {
        name: string
      }
    }
  }
  cycle: {
    academicYear: string
    startDate: string
    endDate: string
  }
  achievements: {
    total: number
    awards: any[]
    courses: any[]
    research: any[]
    scientific: any[]
    universityServices: any[]
    communityServices: any[]
  }
}

export default function FacultyReportsPage() {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [includeAttachments, setIncludeAttachments] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [appraisalData, setAppraisalData] = useState<AppraisalData | null>(null)

  useEffect(() => {
    fetchCycles()
  }, [])

  useEffect(() => {
    if (selectedCycle) {
      fetchAppraisalData()
    }
  }, [selectedCycle])

  const fetchCycles = async () => {
    try {
      const response = await fetch("/api/appraisal-cycles")
      if (response.ok) {
        const data = await response.json()
        setCycles(data)
      }
    } catch (error) {
      console.error("Error fetching cycles:", error)
    }
  }

  const fetchAppraisalData = async () => {
    if (!selectedCycle) return

    try {
      const response = await fetch(`/api/faculty/reports?cycleId=${selectedCycle}`)
      if (response.ok) {
        const data = await response.json()
        setAppraisalData(data)
      }
    } catch (error) {
      console.error("Error fetching appraisal data:", error)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedCycle || !appraisalData) return

    setIsGenerating(true)
    try {
      // Call the API to generate the report
      const response = await fetch(`/api/faculty/reports?cycleId=${selectedCycle}&format=pdf`)

      if (response.ok) {
        // Get the PDF blob
        const pdfBlob = await response.blob()

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `appraisal-report-${appraisalData.cycle.academicYear}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        alert("PDF report downloaded successfully!")
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate PDF report")
      }
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-100 text-green-800"
      case "sent": return "bg-orange-100 text-orange-800"
      case "new": return "bg-blue-100 text-blue-800"
      case "returned": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Downloads</h1>
          <p className="text-muted-foreground">Generate PDF reports for your appraisal cycles</p>
        </div>
      </div>

      {/* Report Generator */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Appraisal Report
          </CardTitle>
          <CardDescription>
            Create a comprehensive PDF report containing your scores and achievements for a selected cycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cycle Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Appraisal Cycle</label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cycle to generate report" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.academicYear} ({new Date(cycle.startDate).getFullYear()} - {new Date(cycle.endDate).getFullYear()}) {cycle.isActive && "(Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Preview */}
          {appraisalData && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">Report Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Faculty:</span>
                  <span className="ml-2 font-medium">{appraisalData.faculty.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <span className="ml-2 font-medium">{appraisalData.faculty.department.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cycle:</span>
                  <span className="ml-2 font-medium">{appraisalData.cycle.academicYear}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`ml-2 ${getStatusColor(appraisalData.appraisal.status)}`}>
                    {appraisalData.appraisal.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Score:</span>
                  <span className="ml-2 font-medium">{appraisalData.appraisal.totalScore || "Pending"}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Achievements:</span>
                  <span className="ml-2 font-medium">{appraisalData.achievements.total}</span>
                </div>
              </div>
            </div>
          )}

         {/* Options */}
         <div className="space-y-4">
           <div className="flex items-center space-x-2">
             <Checkbox
               id="attachments"
               checked={includeAttachments}
               onCheckedChange={(checked) => setIncludeAttachments(checked === true)}
             />
             <label
               htmlFor="attachments"
               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
             >
               Include attachment list in report
             </label>
           </div>
         </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedCycle || !appraisalData || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download PDF Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Contents Info */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
          <CardDescription>What will be included in your appraisal report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Performance Scores
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overall total score</li>
                <li>• Research score (30% weight)</li>
                <li>• University service score (20% weight)</li>
                <li>• Community service score (20% weight)</li>
                <li>• Teaching quality score (30% weight)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Achievement Sections
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Awards and certificates</li>
                <li>• Courses taught</li>
                <li>• Research publications</li>
                <li>• Scientific activities</li>
                <li>• University service</li>
                <li>• Community service</li>
                {includeAttachments && <li>• Attachment references</li>}
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Additional Information</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Appraisal status and timestamps</li>
              <li>• Evaluator feedback and comments</li>
              <li>• Cycle information and deadlines</li>
              <li>• Performance trends and comparisons</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>Your previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reports generated yet</p>
            <p className="text-sm">Generate your first report using the form above</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
