'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'

type Cycle = { id: number; academicYear: string; semester: string; isActive: boolean }
type KPI = { avgTotal: number; completionRate: number; sentCount: number; completeCount: number; returnedCount: number; total: number }
type DeptRow = { department: string; avgTotal: number; completeRate: number; facultyCount: number }
type TrendPoint = { label: string; avgTotal: number }
type SectionAvg = { section: string; avg: number }

type DeanAnalytics = {
  cycles: Cycle[]
  kpis: KPI
  byDepartment: DeptRow[]
  totalsTrend: TrendPoint[]
  sectionAverages: SectionAvg[]
}

export default function DeanAnalyticsPage() {
  const [data, setData] = useState<DeanAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycleId, setCycleId] = useState<string>('')

  const activeCycleId = useMemo(() => {
    if (!data?.cycles?.length) return ''
    const active = data.cycles.find(c => c.isActive) ?? data.cycles[0]
    return String(active.id)
  }, [data?.cycles])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (cycleId) params.set('cycleId', cycleId)
    fetch(`/api/dean/analytics?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((json) => { setData(json); setError(null) })
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [cycleId])

  useEffect(() => { if (activeCycleId && !cycleId) setCycleId(activeCycleId) }, [activeCycleId, cycleId])

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">College Analytics</h1>
          <p className="text-sm text-muted-foreground">Cross-department appraisal insights for your college.</p>
        </div>
        <div className="flex gap-2">
          <Select value={cycleId} onValueChange={setCycleId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Cycle" />
            </SelectTrigger>
            <SelectContent>
              {data?.cycles?.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.academicYear} — {c.semester}{c.isActive ? ' (Active)' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setCycleId(cycleId)}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>
      </div>

      {loading && <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {!loading && !error && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi title="Avg Total" value={fmtNum(data.kpis.avgTotal)} />
            <Kpi title="Completion" value={`${Math.round(data.kpis.completionRate * 100)}%`} />
            <Kpi title="Sent" value={String(data.kpis.sentCount)} />
            <Kpi title="Returned" value={String(data.kpis.returnedCount)} />
            <Kpi title="Complete" value={String(data.kpis.completeCount)} />
          </div>

          {/* College trend */}
          <Card>
            <CardHeader><CardTitle>Average Total by Cycle</CardTitle><CardDescription>College-wide trend</CardDescription></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.totalsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgTotal" stroke="#7c3aed" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* By-department bars */}
          <Card>
            <CardHeader><CardTitle>By Department</CardTitle><CardDescription>Average total & completion rate</CardDescription></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgTotal" name="Avg Total" fill="#0ea5e9" />
                  <Bar yAxisId="right" dataKey="completeRate" name="Completion Rate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Section averages (college) */}
          <Card>
            <CardHeader><CardTitle>Section Averages (College)</CardTitle><CardDescription>Research, University Service, Community Service, Teaching</CardDescription></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sectionAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="pt-0"><div className="text-2xl font-semibold">{value}</div></CardContent>
    </Card>
  )
}
function fmtNum(n: number) { return Number.isFinite(n) ? n.toFixed(1) : '-' }
