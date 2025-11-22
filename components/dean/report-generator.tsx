"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, BarChart3, Award, Loader2, Users, Building } from "lucide-react"

interface ReportGeneratorProps {
  userRole: string
  departments: string[]
  collegeId?: number
}

export default function ReportGenerator({ userRole, departments, collegeId }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState("appraisals")
  const [format, setFormat] = useState("csv")
  const [academicYear, setAcademicYear] = useState("all")
  const [department, setDepartment] = useState("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [pdfData, setPdfData] = useState<any>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const reportTypes = [
    { value: "appraisals", label: "Appraisals Report", icon: FileText },
    { value: "achievements", label: "Achievements Report", icon: Award },
    { value: "performance", label: "Performance Report", icon: BarChart3 },
    { value: "faculty", label: "Faculty Overview", icon: Users },
  ]

  const formats = [
    { value: "csv", label: "CSV" },
    { value: "json", label: "JSON" },
    { value: "pdf", label: "PDF" },
  ]

  // Generate academic year options
  const currentYear = new Date().getFullYear()
  const academicYears = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString())

  const handleGenerateReport = async () => {
    if (!reportType) {
      setError("Please select a report type")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
      })

      if (academicYear && academicYear !== "all") {
        params.append("academicYear", academicYear)
      }

      if (department && department !== "all") {
        params.append("department", department)
      }

      // Pass collegeId for proper role-based filtering
      if (userRole === "DEAN" && collegeId) {
        params.append("collegeId", collegeId.toString())
      }

      const response = await fetch(`/api/reports?${params}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate report")
      }

      if (format === "csv") {
        // Download CSV file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportType}-report-${academicYear !== 'all' ? academicYear : 'all-years'}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (format === "pdf") {
        // Display HTML report in modal for PDF saving (avoids popup blocking)
        const data = await response.json()
        setPdfData({ ...data, reportType, academicYear, department })
        setShowPdfModal(true)
      } else {
        // Display JSON data
        const data = await response.json()
        console.log("Report data:", data)
        // Create a new window to display the JSON data
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${reportType} Report</title></head>
              <body>
                <h1>${reportType} Report</h1>
                <pre>${JSON.stringify(data, null, 2)}</pre>
              </body>
            </html>
          `)
        } else {
          alert(`Report generated successfully! ${data.totalRecords || data.data?.length || 0} records found.`)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BarChart3 className="h-5 w-5" />
            Generate Reports
          </CardTitle>
          <CardDescription>Create detailed reports for analysis and documentation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments && departments.length > 0 ? (
                  departments.map((dept, index) => (
                    <SelectItem key={`${dept}-${index}`} value={dept}>
                      {dept}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="all">All departments</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleGenerateReport} disabled={isGenerating} className="w-full">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* PDF Modal */}
      {showPdfModal && pdfData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">📄 {pdfData.title || pdfData.reportType} Report</h2>
              <div className="flex gap-2">
                <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  Print / Save as PDF
                </Button>
                <Button variant="outline" onClick={() => setShowPdfModal(false)}>
                  ✕ Close
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]" style={{ fontSize: '12px' }}>
              <style>{`
                @media print {
                  .modal-header, .no-print { display: none !important; }
                  body { margin: 0; }
                  .report-content {
                    margin: 0;
                    padding: 20px;
                    font-size: 10px;
                  }
                  table { font-size: 8px; }
                  th, td { padding: 4px 2px; }
                }
                @page {
                  size: A4;
                  margin: 1cm;
                }
              `}</style>

              <div className="report-content">
                <h1 style={{
                  color: '#333',
                  borderBottom: '2px solid #333',
                  paddingBottom: '10px',
                  marginBottom: '20px',
                  fontSize: '18px'
                }}>
                  {pdfData.title || pdfData.reportType} Report
                </h1>
                
                <div style={{
                  marginBottom: '20px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '5px'
                }}>
                  <p><strong>Generated:</strong> {new Date(pdfData.generatedAt).toLocaleString()}</p>
                  {pdfData.totalRecords && <p><strong>Total Records:</strong> {pdfData.totalRecords}</p>}
                  {pdfData.summary && <p><strong>Total Achievements:</strong> {pdfData.summary.totalAchievements}</p>}
                  {pdfData.academicYear !== 'all' && <p><strong>Academic Year:</strong> {pdfData.academicYear}</p>}
                  {pdfData.department !== 'all' && <p><strong>Department:</strong> {pdfData.department}</p>}
                </div>

                {pdfData.summary && (
                  <div style={{
                    background: '#f5f5f5',
                    padding: '15px',
                    margin: '20px 0',
                    borderRadius: '5px'
                  }}>
                    <h2 style={{ color: '#666', marginBottom: '15px' }}>📊 Summary Statistics</h2>
                    <p><strong>🏆 Total Awards:</strong> {pdfData.summary.totalAwards || 0}</p>
                    <p><strong>📚 Total Research:</strong> {pdfData.summary.totalResearch || 0}</p>
                    <p><strong>🔬 Scientific Activities:</strong> {pdfData.summary.totalScientific || 0}</p>
                    <p><strong>🏛️ University Services:</strong> {pdfData.summary.totalUniversityServices || 0}</p>
                    <p><strong>🌍 Community Services:</strong> {pdfData.summary.totalCommunityServices || 0}</p>
                  </div>
                )}

                {pdfData.data && pdfData.data.length > 0 ? (
                  <>
                    <h2 style={{ color: '#666', marginBottom: '15px' }}>📋 Data Details</h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        margin: '20px 0',
                        fontSize: '10px'
                      }}>
                        <thead>
                          <tr>
                            {Object.keys(pdfData.data[0]).map(key => (
                              <th key={key} style={{
                                border: '1px solid #ddd',
                                padding: '6px 4px',
                                textAlign: 'left',
                                backgroundColor: '#f2f2f2',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pdfData.data.map((row: any, index: number) => (
                            <tr key={index}>
                              {Object.keys(pdfData.data[0]).map(key => {
                                const value = row[key]
                                return (
                                  <td key={key} style={{
                                    border: '1px solid #ddd',
                                    padding: '4px 2px',
                                    textAlign: 'left',
                                    wordWrap: 'break-word'
                                  }}>
                                    {typeof value === 'object' && value !== null
                                      ? JSON.stringify(value)
                                      : String(value || '')
                                    }
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No data available for this report.
                  </p>
                )}

                <div style={{
                  marginTop: '30px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '10px',
                  borderTop: '1px solid #ddd',
                  paddingTop: '10px'
                }}>
                  <p>Generated by Faculty Appraisal System | {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
