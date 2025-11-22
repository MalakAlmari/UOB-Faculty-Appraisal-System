'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, Edit, Trophy, Printer } from 'lucide-react'
import { Appraisal, AppraisalCycle, User, Department, EvaluationStatus } from '@prisma/client'
import { useDebounce } from '@/hooks/use-debounce'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'

// --- Types ---
type AppraisalWithDetails = Appraisal & {
  faculty: User & { department: Department | null }
  cycle: AppraisalCycle
  evaluation?: {
    behaviorRatings?: { capacity: string; points: number }[]
    totalScore?: number
    researchPts?: number
    universityServicePts?: number
    communityServicePts?: number
    teachingQualityPts?: number
  } | null
  awards?: any[]
  courses?: any[]
  researchActivities?: any[]
  scientificActivities?: any[]
  communityServices?: any[]
  universityServices?: any[]
}


interface AppraisalsData {
  appraisals: AppraisalWithDetails[]
  cycles: AppraisalCycle[]
}

// --- Achievements Details Component ---
function AchievementDetails({ appraisalId }: { appraisalId: number }) {
  return (
    <div className="p-4">
      <p>Achievements for appraisal {appraisalId} will be displayed here.</p>
    </div>
  )
}

// --- Main Table Component ---
export default function AppraisalsTable() {
  const router = useRouter()
  const [data, setData] = useState<AppraisalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ cycle: '', status: '', search: '' })
  const debouncedSearch = useDebounce(filters.search, 300)

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

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.cycle) params.append('cycleId', filters.cycle)
    if (filters.status) params.append('status', filters.status)
    if (debouncedSearch) params.append('search', debouncedSearch)

    try {
      const res = await fetch(`/api/dean/appraisals?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch appraisals')
      const result = await res.json()
      setData(result)
      if (!filters.cycle && result.cycles.some((c: AppraisalCycle) => c.isActive)) {
        setFilters(prev => ({ ...prev, cycle: result.cycles.find((c: AppraisalCycle) => c.isActive)!.id.toString() }))
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

 // --- Print Achievements PDF ---
const printAchievements = (appraisal: AppraisalWithDetails & {
  awards?: any[],
  courses?: any[],
  researchActivities?: any[],
  scientificActivities?: any[],
  communityServices?: any[],
  universityServices?: any[],
}) => {
  const doc = new jsPDF()
  let y = 10

  doc.setFontSize(14)
  doc.text(`HOD: ${appraisal.faculty.name}`, 10, y)
  y += 8
  doc.setFontSize(12)
  doc.text(`Department: ${appraisal.faculty.department?.name ?? '-'}`, 10, y)
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
  saveAs(blob, 'HoD_Appraisals_Detailed.csv')
}




  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>HOD Appraisals</CardTitle>
          <CardDescription>Browse and evaluate HOD appraisals in your college.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search by HOD name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center justify-between gap-2 mb-4">
 
</div>
            <div className="flex gap-2">
              <Select value={filters.cycle} onValueChange={(v) => handleFilterChange('cycle', v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
                <SelectContent>
                  {data?.cycles.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.academicYear}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(EvaluationStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between gap-2 mb-4">
 
  <div className="flex gap-2">
    {/* Cycle and Status Selects */}
    
    <Button onClick={exportCSV} variant="secondary">Export CSV</Button>
  </div>
</div>
            </div>
          </div>
          


          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HOD</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                ) : data?.appraisals.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No appraisals found.</TableCell></TableRow>
                ) : (
                  data?.appraisals.map(appraisal => (
                    <TableRow key={appraisal.id}>
                      <TableCell className="font-medium">{appraisal.faculty.name}</TableCell>
                      <TableCell>{appraisal.faculty.department?.name ?? 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{appraisal.status}</Badge></TableCell>
                      <TableCell>{appraisal.totalScore?.toFixed(2) ?? '-'}</TableCell>
                      <TableCell>{new Date(appraisal.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" title="Print Achievements" onClick={() => printAchievements(appraisal)}><Printer className="h-4 w-4" /></Button>
                        <Sheet>
                          <SheetTrigger asChild>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-2xl">
                            <SheetHeader>
                              <SheetTitle>Achievements: {appraisal.faculty.name}</SheetTitle>
                            </SheetHeader>
                            <AchievementDetails appraisalId={appraisal.id} />
                          </SheetContent>
                        </Sheet>
                        <Button variant="ghost" size="icon" title="View" onClick={() => router.push(`/dean/view/${appraisal.id}`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Evaluate" disabled={!shouldEnableEvaluation(appraisal)} onClick={() => router.push(`/dean/reviews/${appraisal.id}`)}><Edit className="h-4 w-4" /></Button>
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
