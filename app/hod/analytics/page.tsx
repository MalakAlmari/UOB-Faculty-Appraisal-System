'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts'

type Cycle = { id: number; academicYear: string; semester: string; isActive: boolean }
type KPI = { avgTotal: number; completionRate: number; sentCount: number; completeCount: number; returnedCount: number; total: number }
type StatusBucket = { status: string; count: number }
type SectionAvg = { section: string; avg: number }
type FacultyRow = { name: string; total: number; status: string }
type TrendPoint = { label: string; avgTotal: number }

type HodAnalytics = {
  cycles: Cycle[]
  kpis: KPI
  statusDistribution: StatusBucket[]
  sectionAverages: SectionAvg[]
  topFaculty: FacultyRow[]
  totalsTrend: TrendPoint[]
}

const STATUS_COLORS: Record<string, string> = {
  new: '#999999',
  sent: '#f59e0b',
  complete: '#10b981',
  returned: '#ef4444',
}

export default function HODAnalyticsPage() {
  const [data, setData] = useState<HodAnalytics | null>(null)
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
    fetch(`/api/hod/analytics?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((json) => { setData(json); setError(null) })
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [cycleId])

  useEffect(() => {
    if (activeCycleId && !cycleId) setCycleId(activeCycleId)
  }, [activeCycleId, cycleId])

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Department Analytics</h1>
          <p className="text-sm text-muted-foreground">Trends and breakdowns for your department’s appraisals.</p>
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

          {/* Trend line */}
          <Card>
            <CardHeader><CardTitle>Average Total by Cycle</CardTitle><CardDescription>Department trend across recent cycles</CardDescription></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.totalsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgTotal" stroke="#2563eb" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Section Averages + Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Section Averages</CardTitle><CardDescription>Research, University Service, Community Service, Teaching</CardDescription></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sectionAverages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="section" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Status Distribution</CardTitle><CardDescription>Appraisal statuses in the selected cycle</CardDescription></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusDistribution} dataKey="count" nameKey="status" outerRadius={100} label>
                      {data.statusDistribution.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLORS[s.status] ?? '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Faculty */}
          <Card>
            <CardHeader><CardTitle>Top Faculty by Total</CardTitle><CardDescription>Top performers in the department (current cycle)</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Faculty</th>
                      <th className="p-2 text-left">Total</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topFaculty.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{fmtNum(r.total)}</td>
                        <td className="p-2">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
