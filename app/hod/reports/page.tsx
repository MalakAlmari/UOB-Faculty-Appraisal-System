'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, TrendingUp, Award } from 'lucide-react'

export default function HODReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<string>('json')
  const [isLoading, setIsLoading] = useState(false)

  const reportTypes = [
    { value: 'appraisals', label: 'Appraisals Report', icon: FileText, description: 'Comprehensive appraisal data for the department' },
    { value: 'achievements', label: 'Achievements Report', icon: Award, description: 'Faculty achievements and accomplishments' },
    { value: 'performance', label: 'Performance Report', icon: TrendingUp, description: 'Performance metrics and trends' },
  ]

  const formats = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
  ]

  const handleDownload = async () => {
    if (!selectedReport) {
      alert('Please select a report type')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports?type=${selectedReport}&format=${selectedFormat}`)

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      if (selectedFormat === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedReport}-report.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        console.log('Report data:', data)
        alert('Report generated successfully. Check console for data.')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedReportInfo = reportTypes.find(r => r.value === selectedReport)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Downloads</h1>
        <p className="text-muted-foreground">Generate and download department reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Choose the type of report and format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.value} value={report.value}>
                        <div className="flex items-center gap-2">
                          <report.icon className="h-4 w-4" />
                          {report.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleDownload}
                disabled={!selectedReport || isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>

          {/* Report Preview */}
          {selectedReportInfo && (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedReportInfo.icon className="h-5 w-5" />
                  {selectedReportInfo.label}
                </CardTitle>
                <CardDescription>{selectedReportInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  This report includes data for all faculty members in your department.
                  The report will be generated based on the current academic year unless specified otherwise.
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportTypes.map((report) => (
                  <div
                    key={report.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReport === report.value
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedReport(report.value)}
                  >
                    <div className="flex items-center gap-2">
                      <report.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{report.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Export Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>CSV:</strong> For spreadsheet applications
                </div>
                <div className="text-sm">
                  <strong>JSON:</strong> For programmatic access
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}