"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Printer, FileText } from "lucide-react"

interface Appraisal {
  id: string
  academicYear: string
  status: string
  finalScore?: number
  user: {
    firstName: string
    lastName: string
    email: string
  }
  evaluator?: {
    firstName: string
    lastName: string
  }
  evaluations: any[]
  achievements: any[]
}

export default function FacultyPrintPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [selectedAppraisal, setSelectedAppraisal] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAppraisals()
  }, [])

  const fetchAppraisals = async () => {
    try {
      const response = await fetch("/api/appraisals")
      if (response.ok) {
        const data = await response.json()
        setAppraisals(data.filter((a: Appraisal) => a.status === "complete"))
      }
    } catch (error) {
      console.error("Error fetching appraisals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    if (!selectedAppraisal) return

    const appraisal = appraisals.find((a) => a.id === selectedAppraisal)
    if (!appraisal) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = generatePrintContent(appraisal)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Faculty Appraisal Report - ${appraisal.academicYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #555; }
            .score-box { background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; }
            .score-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .signature-box { border-top: 1px solid #333; padding-top: 10px; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const generatePrintContent = (appraisal: Appraisal) => {
    return `
      <div class="header">
        <h1>Faculty Performance Appraisal Report</h1>
        <h2>Academic Year ${appraisal.academicYear}</h2>
      </div>

      <div class="section">
        <h3>Faculty Information</h3>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Name:</span> ${appraisal.user.firstName} ${appraisal.user.lastName}
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span> ${appraisal.user.email}
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Academic Year:</span> ${appraisal.academicYear}
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span> ${appraisal.status}
            </div>
          </div>
        </div>
      </div>

      ${
        appraisal.finalScore
          ? `
        <div class="section">
          <h3>Overall Performance Score</h3>
          <div class="score-box">
            <div class="score-value">${appraisal.finalScore}%</div>
            <div>Final Evaluation Score</div>
          </div>
        </div>
      `
          : ""
      }

      <div class="section">
        <h3>Evaluation Criteria</h3>
        <table>
          <thead>
            <tr>
              <th>Criteria</th>
              <th>Self Points</th>
              <th>Final Points</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${appraisal.evaluations
              .map(
                (evaluation) => `
              <tr>
                <td>${evaluation.criteria?.name || "N/A"}</td>
                <td>${evaluation.selfPoints || "N/A"}</td>
                <td>${evaluation.finalPoints || "N/A"}</td>
                <td>${evaluation.comments || "No comments"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Linked Achievements</h3>
        <p>Total achievements linked to this appraisal: ${appraisal.achievements?.length || 0}</p>
      </div>

      ${
        appraisal.evaluator
          ? `
        <div class="section">
          <h3>Evaluator Information</h3>
          <div class="info-item">
            <span class="info-label">Evaluated by:</span> ${appraisal.evaluator.firstName} ${appraisal.evaluator.lastName}
          </div>
        </div>
      `
          : ""
      }

      <div class="signature-section">
        <div class="signature-box">
          <div>Faculty Signature</div>
          <div style="margin-top: 10px; font-size: 12px;">Date: ___________</div>
        </div>
        <div class="signature-box">
          <div>Evaluator Signature</div>
          <div style="margin-top: 10px; font-size: 12px;">Date: ___________</div>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        Generated on ${new Date().toLocaleDateString()} - Faculty Appraisal System
      </div>
    `
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Print Reports</h1>
        <p className="text-muted-foreground">Generate printable appraisal reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Printer className="h-5 w-5" />
              Print Appraisal Report
            </CardTitle>
            <CardDescription>Select a completed appraisal to generate a printable report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Appraisal</label>
              <Select value={selectedAppraisal} onValueChange={setSelectedAppraisal}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an appraisal to print" />
                </SelectTrigger>
                <SelectContent>
                  {appraisals.map((appraisal) => (
                    <SelectItem key={appraisal.id} value={appraisal.id}>
                      Academic Year {appraisal.academicYear}
                      {appraisal.finalScore && ` - ${appraisal.finalScore}%`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAppraisal && (
              <div className="space-y-4">
                {(() => {
                  const appraisal = appraisals.find((a) => a.id === selectedAppraisal)
                  return appraisal ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Report Preview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Academic Year:</span>
                          <span>{appraisal.academicYear}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant="secondary">{appraisal.status}</Badge>
                        </div>
                        {appraisal.finalScore && (
                          <div className="flex justify-between">
                            <span>Final Score:</span>
                            <span className="font-bold text-accent">{appraisal.finalScore}%</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Evaluations:</span>
                          <span>{appraisal.evaluations.length} criteria</span>
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}

                <Button onClick={handlePrint} className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
              </div>
            )}

            {appraisals.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed appraisals available for printing</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Print Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">What's included in the report:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Faculty personal information</li>
                  <li>Overall performance score</li>
                  <li>Detailed evaluation criteria scores</li>
                  <li>Evaluator comments</li>
                  <li>Linked achievements summary</li>
                  <li>Signature sections</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Print tips:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Use portrait orientation</li>
                  <li>Ensure printer has sufficient paper</li>
                  <li>Check print preview before printing</li>
                  <li>Save as PDF for digital archiving</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
