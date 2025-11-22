'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { Loader2, Download, ExternalLink, RotateCcw } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'


type AchievementType =
  | 'Award'
  | 'Course'
  | 'ResearchPaper'
  | 'ResearchArticle'
  | 'ScientificActivity'
  | 'UniversityService'
  | 'CommunityService'
  | string

type AchievementRow = {
  id: string | number
  appraisalId: number
  faculty: string
  type: AchievementType
  title: string
  date?: string | null
  status: string
  cycle: string
}

type ApiResponse = {
  achievements: AchievementRow[]
  total?: number
  types?: string[]
}

const FALLBACK_TYPES: { label: string; value: string }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Awards', value: 'Award' },
  { label: 'Research (Published Paper)', value: 'ResearchPaper' },
  { label: 'Research (Article)', value: 'ResearchArticle' },
  { label: 'Scientific Activities', value: 'ScientificActivity' },
  { label: 'University Service', value: 'UniversityService' },
  { label: 'Community Service', value: 'CommunityService' },
  { label: 'Courses Taught', value: 'Course' },
]

/* =============== CSV Export Helper =============== */
function toCSV(rows: AchievementRow[]) {
  const header = ['Faculty', 'Type', 'Title', 'Date', 'AppraisalId']
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = rows.map((r) =>
    [r.faculty, r.type, r.title, r.date ? new Date(r.date).toLocaleDateString() : '', r.appraisalId]
      .map(escape)
      .join(',')
  )
  return [header.join(','), ...body].join('\n')
}

function downloadBlob(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function getStatusColor(status: string) {
   switch (status) {
     case "new": return "bg-blue-100 text-blue-800"
     case "sent": return "bg-orange-100 text-orange-800"
     case "complete": return "bg-green-100 text-green-800"
     case "returned": return "bg-red-100 text-red-800"
     default: return "bg-gray-100 text-gray-800"
   }
 }

// function isWithinOneMonthOfYearEnd(): boolean {
//    const now = new Date()
//    const currentYear = now.getFullYear()
//    const yearEnd = new Date(currentYear, 11, 31) // December 31st of current year
//    const oneMonthBeforeYearEnd = new Date(currentYear, 11, 1) // December 1st of current year

//    return now >= oneMonthBeforeYearEnd && now <= yearEnd
//  }

// function shouldEnableEvaluationButton(status: string): boolean {
//    // Button should be disabled for "new" or "complete" status
//    // Only enable for "new" status AND within one month of year end
//    if (status === "complete") return false
//    if (status === "new") return isWithinOneMonthOfYearEnd()
//    return true // Disable for all other statuses
//  }

/* ================== Page ================== */
export default function DeanAchievements() {
  const [achievements, setAchievements] = useState<AchievementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<{ type: string; search: string; status: string }>({ type: '', search: '', status: '' })
  const debouncedSearch = useDebounce(filters.search, 350)

  const [apiTypes, setApiTypes] = useState<string[] | null>(null)
  const typeOptions = useMemo(() => {
    if (apiTypes && apiTypes.length) {
      return [{ label: 'All Types', value: 'all' }, ...apiTypes.map((t) => ({ label: t, value: t }))] as {
        label: string
        value: string
      }[]
    }
    return FALLBACK_TYPES
  }, [apiTypes])

  useEffect(() => {
    const controller = new AbortController()
    async function fetchAchievements() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (filters.type) params.append('type', filters.type)
        if (debouncedSearch) params.append('search', debouncedSearch)
        if (filters.status) params.append('status', filters.status)

        const res = await fetch(`/api/dean/achievements?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(txt || `Failed to fetch (status ${res.status})`)
        }
        const data: ApiResponse = await res.json()
        setAchievements(data.achievements || [])
        if (Array.isArray(data.types)) setApiTypes(data.types)
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message || 'Unknown error')
          setAchievements([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
    return () => controller.abort()
  }, [filters.type, debouncedSearch])

  const onExport = () => {
    if (!achievements.length) return
    const csv = toCSV(achievements)
    downloadBlob('college_achievements.csv', csv)
  }

  const resetFilters = () => setFilters({ type: '', search: '', status: '' })

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Achievements (College-wide)</CardTitle>
          <CardDescription>Aggregated achievements for HODs in your college.</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <Input
              placeholder="Search by title or faculty…"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="md:max-w-sm"
            />
            <div className="flex items-center gap-2">
              <Select
                value={filters.type || 'all'}
                onValueChange={(v) => setFilters((p) => ({ ...p, type: v === 'all' ? '' : v }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status || 'all'}
                onValueChange={(v) => setFilters((p) => ({ ...p, status: v === 'all' ? '' : v }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} title="Reset filters">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <Button
                variant="outline"
                onClick={onExport}
                disabled={loading || achievements.length === 0}
                title="Export current results as CSV"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : achievements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No achievements found.
                    </TableCell>
                  </TableRow>
                ) : (
                  achievements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{item.faculty}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium min-w-[240px]">{item.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.date ? new Date(item.date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"

                          onClick={() => {
                              window.open(`/dean/view/${item.appraisalId}`, '_blank')
                            
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Showing {achievements.length} item{achievements.length === 1 ? '' : 's'}
            {filters.type ? ` • type: ${filters.type}` : ''}
            {filters.status ? ` • status: ${filters.status}` : ''}
            {debouncedSearch ? ` • search: "${debouncedSearch}"` : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}