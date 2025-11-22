'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, Edit, Printer } from 'lucide-react'
import { Appraisal, AppraisalCycle } from '@prisma/client'
import { useDebounce } from '@/hooks/use-debounce'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'

// Define EvaluationStatus locally
const EvaluationStatus = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete',
  SENT:'sent',
} as const

// Updated type with evaluation included
type AppraisalWithDetails = Appraisal & {
  faculty: { name: string; department: { name: string } | null };
  cycle: AppraisalCycle;
  awards?: any[];
  courses?: any[];
  researchActivities?: any[];
  scientificActivities?: any[];
  communityServices?: any[];
  universityServices?: any[];
  evaluation?: {
    behaviorRatings?: { capacity: string; points: number }[];
    totalScore?: number;
    researchPts?: number;
    universityServicePts?: number;
    communityServicePts?: number;
    teachingQualityPts?: number;
  };
};

interface AppraisalsData {
  appraisals: AppraisalWithDetails[];
  cycles: AppraisalCycle[];
}

export default function HODAppraisalsTable() {
  const router = useRouter()
  const [data, setData] = useState<AppraisalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({ cycle: '', status: '', search: '' })
  const debouncedSearch = useDebounce(filters.search, 300)

  // Helper to check if evaluation should be enabled
  const shouldEnableEvaluation = (appraisal: AppraisalWithDetails) => {
    if (appraisal.status === 'complete') return false
    if (appraisal.status === 'new') {
      const cycleEndDate = new Date(appraisal.cycle.endDate)
      const oneMonthBeforeEnd = new Date(cycleEndDate)
      oneMonthBeforeEnd.setMonth(oneMonthBeforeEnd.getMonth() - 1)
      const now = new Date()
      return now >= oneMonthBeforeEnd && now <= cycleEndDate
    }
    return true
  }

  // Fetch appraisals from API
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (filters.cycle) params.append('cycleId', filters.cycle)
    if (filters.status) params.append('status', filters.status)
    if (debouncedSearch) params.append('search', debouncedSearch)

    try {
      const res = await fetch(`/api/hod/appraisals?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch appraisals')
      const result = await res.json()

      // Ensure evaluation exists
      const appraisalsWithEval: AppraisalWithDetails[] = result.appraisals.map((a: any) => ({
        ...a,
        evaluation: {
          behaviorRatings: a.evaluation?.behaviorRatings ?? [],
          researchPts: a.evaluation?.researchPts ?? 0,
          universityServicePts: a.evaluation?.universityServicePts ?? 0,
          communityServicePts: a.evaluation?.communityServicePts ?? 0,
          teachingQualityPts: a.evaluation?.teachingQualityPts ?? 0,
          totalScore: a.evaluation?.totalScore ?? a.totalScore ?? 0,
        }
      }))

      setData({ ...result, appraisals: appraisalsWithEval })

      if (!filters.cycle && result?.cycles?.some((c: AppraisalCycle) => c.isActive)) {
        const active = result.cycles.find((c: AppraisalCycle) => c.isActive)
        if (active) setFilters(prev => ({ ...prev, cycle: String(active.id) }))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters.cycle, filters.status, debouncedSearch])

  const handleFilterChange = (key: 'cycle' | 'status' | 'search', value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Print achievements PDF
  const printAchievements = (appraisal: AppraisalWithDetails) => {
    const doc = new jsPDF()
    let y = 10

    doc.setFontSize(14)
    doc.text(`Instructor: ${appraisal.faculty.name}`, 10, y)
    y += 8
    doc.setFontSize(12)
    doc.text(`Department: ${appraisal.faculty.department?.name || '-'}`, 10, y)
    y += 8
    doc.text(`Appraisal Cycle: ${appraisal.cycle.academicYear}`, 10, y)
    y += 10

    const addTable = (title: string, head: string[], body: any[][]) => {
      doc.setFontSize(12)
      doc.text(title, 10, y)
      y += 4
      autoTable(doc, {
        head: [head],
        body,
        startY: y,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [240, 240, 240], textColor: 0 },
        theme: 'grid',
      })
      y = (doc as any).lastAutoTable.finalY + 10
    }

    addTable('Awards', ['Name', 'Area', 'Organization', 'Date'],
      appraisal.awards?.map(a => [
        a.name, a.area || '-', a.organization || '-', a.dateObtained ? new Date(a.dateObtained).toLocaleDateString() : '-'
      ]) || [['No records', '', '', '']]
    )

    addTable('Courses', ['Year', 'Semester', 'Course Code', 'Section', 'Title', 'Credit', 'Students', 'Eval Avg'],
      appraisal.courses?.map(c => [
        c.academicYear, c.semester, c.courseCode || '-', c.section || '-', c.courseTitle, c.credit ?? '-', c.studentsCount ?? '-', c.studentsEvalAvg?.toFixed(2) ?? '-'
      ]) || [['No records', '', '', '', '', '', '', '']]
    )

    addTable('Research Activities', ['Title', 'Type', 'Kind', 'Journal/Publisher', 'Participation', 'Publication Date'],
      appraisal.researchActivities?.map(r => [
        r.title, r.type, r.kind, r.journalOrPublisher || '-', r.participation || '-', r.publicationDate ? new Date(r.publicationDate).toLocaleDateString() : '-'
      ]) || [['No records', '', '', '', '', '']]
    )

    addTable('Scientific Activities', ['Title', 'Type', 'Date', 'Participation', 'Organizing Authority', 'Venue'],
      appraisal.scientificActivities?.map(s => [
        s.title, s.type, s.date ? new Date(s.date).toLocaleDateString() : '-', s.participation || '-', s.organizingAuth || '-', s.venue || '-'
      ]) || [['No records', '', '', '', '', '']]
    )

    addTable('Community Services', ['Committee/Task', 'Authority', 'Participation', 'Date From', 'Date To'],
      appraisal.communityServices?.map(c => [
        c.committeeOrTask, c.authority || '-', c.participation || '-', c.dateFrom ? new Date(c.dateFrom).toLocaleDateString() : '-', c.dateTo ? new Date(c.dateTo).toLocaleDateString() : '-'
      ]) || [['No records', '', '', '', '']]
    )

    addTable('University Services', ['Committee/Task', 'Authority', 'Participation', 'Date From', 'Date To'],
      appraisal.universityServices?.map(u => [
        u.committeeOrTask, u.authority || '-', u.participation || '-', u.dateFrom ? new Date(u.dateFrom).toLocaleDateString() : '-', u.dateTo ? new Date(u.dateTo).toLocaleDateString() : '-'
      ]) || [['No records', '', '', '', '']]
    )

    doc.save(`${appraisal.faculty.name}-achievements.pdf`)
  }

  // CSV Export
  
  const exportCSV = () => {
  if (!data?.appraisals?.length) return

  const rows = data.appraisals.map(a => {
    const evalData = a.evaluation ?? {}
    const ratings = Array.isArray(evalData.behaviorRatings) ? evalData.behaviorRatings : []

    const getPoints = (capacity: string) =>
      ratings.find(r => r.capacity === capacity)?.points ?? 0

    // Raw totals
    const rawPerformance =
      (evalData.researchPts ?? 0) +
      (evalData.universityServicePts ?? 0) +
      (evalData.communityServicePts ?? 0) +
      (evalData.teachingQualityPts ?? 0)

    const rawCapabilities =
      getPoints('Institutional Commitment') +
      getPoints('Collaboration & Teamwork') +
      getPoints('Professionalism') +
      getPoints('Client Service') +
      getPoints('Achieving Results')

    // Scale to desired ranges
    const scalePerformance = (points: number) => +(points * 3 / 100).toFixed(2)
    const scaleCapabilities = (points: number) => +(points * 7 / 100).toFixed(2)
    const totalPerformanceScaled = scalePerformance(rawPerformance)
    const totalCapabilitiesScaled = scaleCapabilities(rawCapabilities)
    const overallTotalScaled = +((totalPerformanceScaled + totalCapabilitiesScaled) / 2).toFixed(2)
    return {
      Instructor: a.faculty.name,

      // Raw points out of 100
      'Research & Scientific Activities ': evalData.researchPts ?? 0,
      'University Service ': evalData.universityServicePts ?? 0,
      'Community Service ': evalData.communityServicePts ?? 0,
      'Quality of Teaching ': evalData.teachingQualityPts ?? 0,
      'Total Performance (out of 100)': rawPerformance,

      // Scaled performance out of 3
      'Total Performance (out of 3)': totalPerformanceScaled,

      // Capabilities raw out of 100
      'Institutional Commitment ': getPoints('Institutional Commitment'),
      'Collaboration & Teamwork ': getPoints('Collaboration & Teamwork'),
      'Professionalism ': getPoints('Professionalism'),
      'Client Service ': getPoints('Client Service'),
      'Achieving Results ': getPoints('Achieving Results'),
      'Total Capabilities ( out of 100)': rawCapabilities,

      // Capabilities scaled out of 7
      'Total Capabilities (out of 7)': totalCapabilitiesScaled,

      // Overall
      'Overall Total (out of 5)': overallTotalScaled,
    }
  })

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, 'Faculty_Appraisals_Detailed.csv')
}

  
  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Instructor Appraisals</CardTitle>
            <CardDescription>Browse and evaluate instructor appraisals in your department.</CardDescription>
          </div>
          <Button onClick={exportCSV}>Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search by instructor name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Select value={filters.cycle} onValueChange={(v) => handleFilterChange('cycle', v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
                <SelectContent>
                  {data?.cycles?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.academicYear}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(EvaluationStatus).map(s => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : !data?.appraisals || data.appraisals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No appraisals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.appraisals.map(appraisal => (
                    <TableRow key={appraisal.id}>
                      <TableCell className="font-medium">{appraisal.faculty.name}</TableCell>
                      <TableCell><Badge variant="outline">{appraisal.status}</Badge></TableCell>
                      <TableCell>{appraisal.evaluation?.totalScore?.toFixed(2) ?? '-'}</TableCell>
                      <TableCell>{new Date(appraisal.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" title="View" onClick={() => router.push(`/hod/view/${appraisal.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Evaluate"
                          disabled={!shouldEnableEvaluation(appraisal)}
                          onClick={() => router.push(`/hod/reviews/${appraisal.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Print Achievements"
                          onClick={() => printAchievements(appraisal)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
