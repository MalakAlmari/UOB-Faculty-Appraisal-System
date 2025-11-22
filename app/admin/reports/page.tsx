"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Download, FileText } from "lucide-react"

interface AppraisalCycle {
  id: number
  academicYear: string
  semester: string
}

interface College {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>("")
  const [cycles, setCycles] = useState<AppraisalCycle[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [selectedCollege, setSelectedCollege] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [includeAttachments, setIncludeAttachments] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cyclesRes, collegesRes, departmentsRes] = await Promise.all([
          fetch("/api/admin/appraisal-cycles"),
          fetch("/api/admin/colleges"),
          fetch("/api/admin/departments")
        ])

        if (cyclesRes.ok) {
          const cyclesData = await cyclesRes.json()
          setCycles(cyclesData)
        }

        if (collegesRes.ok) {
          const collegesData = await collegesRes.json()
          setColleges(collegesData)
        }

        if (departmentsRes.ok) {
          const departmentsData = await departmentsRes.json()
          setDepartments(departmentsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const handleGenerateReport = async () => {
    if (!reportType || !selectedCycle) {
      alert("Please select report type and cycle")
      return
    }

    setIsGenerating(true)

    try {
      const params = new URLSearchParams({
        type: reportType,
        cycleId: selectedCycle,
        ...(selectedCollege && { collegeId: selectedCollege }),
        ...(selectedDepartment && { departmentId: selectedDepartment }),
        ...(includeAttachments && { includeAttachments: 'true' }),
      })

      const response = await fetch(`/api/admin/reports/generate?${params}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url

        // Set filename based on report type
        const cycle = cycles.find(c => c.id.toString() === selectedCycle)
        const timestamp = new Date().toISOString().split('T')[0]
        let filename = `${reportType}_report_${cycle?.academicYear}_${cycle?.semester}_${timestamp}`

        if (reportType === 'by-college' && selectedCollege) {
          const college = colleges.find(c => c.id.toString() === selectedCollege)
          filename = `${college?.name}_${filename}`
        } else if (reportType === 'by-department' && selectedDepartment) {
          const dept = departments.find(d => d.id.toString() === selectedDepartment)
          filename = `${dept?.name}_${filename}`
        }

        a.download = filename + '.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        alert("Report generated and downloaded successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to generate report: ${error.error}`)
      }
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Reports</h1>
        <p className="text-muted-foreground">Produce CSV/PDF across colleges/departments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>Select report type and parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="by-college">By College</SelectItem>
                  <SelectItem value="by-department">By Department</SelectItem>
                  <SelectItem value="users-roles">Users & Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cycle">Cycle <span className="text-red-500">*</span></Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.academicYear} {cycle.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reportType === "by-college" && (
              <div>
                <Label htmlFor="college">College (Optional)</Label>
                <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Colleges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Colleges</SelectItem>
                    {colleges.map(college => (
                      <SelectItem key={college.id} value={college.id.toString()}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "by-department" && (
              <div>
                <Label htmlFor="department">Department (Optional)</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="attachments"
                checked={includeAttachments}
                onCheckedChange={(checked) => setIncludeAttachments(checked === true)}
              />
              <Label htmlFor="attachments">Include attachments list</Label>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportType || !selectedCycle}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <FileText className="mr-2 h-4 w-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Types Description */}
        <Card>
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
            <CardDescription>Available report formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">By College</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Counts by status, average totals, top/bottom HODs for selected cycle.
              </p>
              <Badge variant="secondary">CSV/PDF</Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">By Department</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Counts by status, average totals, top/bottom instructors for selected cycle.
              </p>
              <Badge variant="secondary">CSV/PDF</Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Users & Roles</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Export current roster with mappings.
              </p>
              <Badge variant="secondary">CSV</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent reports</p>
            <p className="text-sm">Generated reports will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}