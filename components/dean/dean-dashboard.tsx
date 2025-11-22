'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bar, BarChart, Pie, PieChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, TrendingUp, FileText, Clock } from 'lucide-react'
import Link from 'next/link'
import type { AppraisalCycle, Department, Appeal } from '@prisma/client'

// بديل خفيف للـ enum
const EVAL = { NEW:'NEW', IN_REVIEW:'IN_REVIEW', SCORES_SENT:'SCORES_SENT', COMPLETE:'COMPLETE', RETURNED:'RETURNED' } as const

interface DashboardData {
  kpis: {
    activeCycle?: { id: number; name: string };
    hodAppraisals?: number;
    avgTotalScore?: number;
    statusDistribution?: Record<string, number>;
  };
  charts: {
    byStatus: { name: string; value: number }[];
    byDepartment: { department: string; average: number }[];
  };
  recentActions: (Appeal & { appraisal: { faculty: { name: string } } })[];
  filters: {
    cycles: AppraisalCycle[];
    departments: Department[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  [EVAL.NEW]: 'hsl(var(--chart-1))',
  [EVAL.IN_REVIEW]: 'hsl(var(--chart-2))',
  [EVAL.SCORES_SENT]: 'hsl(var(--chart-3))',
  [EVAL.COMPLETE]: 'hsl(var(--chart-4))',
  [EVAL.RETURNED]: 'hsl(var(--chart-5))',
}

export default function DeanDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('')

  // الجلب
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (selectedCycle) params.append('cycleId', selectedCycle)
      if (selectedDept) params.append('departmentId', selectedDept)

      try {
        const res = await fetch(`/api/dean/dashboard?${params.toString()}`)
        if (!res.ok) throw new Error(`Failed to fetch dashboard data (status: ${res.status})`)
        const result: DashboardData = await res.json()
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCycle, selectedDept])

  // ضبط الدورة النشطة تلقائيًا بعد أول جلب
  useEffect(() => {
    if (!selectedCycle && data?.filters?.cycles?.length) {
      const active = data.filters.cycles.find(c => c.isActive) ?? data.filters.cycles[0]
      if (active) setSelectedCycle(String(active.id))
    }
  }, [data, selectedCycle])

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {}
    for (const s of data?.charts.byStatus ?? []) {
      cfg[s.name] = { label: s.name, color: STATUS_COLORS[s.name] || '#ccc' }
    }
    cfg.average = { label: 'Average Score', color: 'hsl(var(--chart-1))' }
    return cfg
  }, [data])

  const statusChartData = useMemo(() => {
    const src = data?.charts?.byStatus ?? []
    if (src.length === 0) return [{ name: 'No Data', value: 1, fill: '#eee' }]
    return src.map(s => ({ ...s, fill: STATUS_COLORS[s.name] || '#ccc' }))
  }, [data])

  const orderedBadges = useMemo(() => {
    const order = [EVAL.NEW, EVAL.IN_REVIEW, EVAL.SCORES_SENT, EVAL.RETURNED, EVAL.COMPLETE]
    const dist = data?.kpis.statusDistribution ?? {}
    return order
      .filter(k => k in dist)
      .map(k => ({ name: k, value: dist[k] }))
  }, [data])

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Dean&apos;s Dashboard</h1>
          <p className="text-muted-foreground">College-wide performance overview for HODs.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedCycle} onValueChange={setSelectedCycle} disabled={loading}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
            <SelectContent>
              {data?.filters?.cycles?.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.academicYear} - {c.semester}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDept || 'all'} onValueChange={(v) => setSelectedDept(v === 'all' ? '' : v)} disabled={loading}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {data?.filters?.departments?.map(d => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : !data || !data.kpis.activeCycle ? (
        <Card>
          <CardHeader><CardTitle>No Data</CardTitle></CardHeader>
          <CardContent><p>No appraisal cycle found or no data available for the selected filters.</p></CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Cycle</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.kpis.activeCycle.name}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">HOD Appraisals</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.kpis.hodAppraisals}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Total Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.kpis.avgTotalScore?.toFixed(2) ?? 'N/A'}</div></CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {orderedBadges.map(({ name, value }) => (
                  <Badge key={name} variant="secondary">{value} {name}</Badge>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Appraisals by Status</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={50}>
                      {statusChartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Average Score by Department</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <BarChart data={data.charts.byDepartment} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="department" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="average" fill="var(--color-average)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Actions & Appeals</CardTitle>
              <CardDescription>Latest appeals submitted by HODs in your college.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActions.length > 0 ? data.recentActions.map(action => (
                    <TableRow key={action.id}>
                      <TableCell>{action.appraisal.faculty.name}</TableCell>
                      <TableCell className="max-w-sm truncate">{action.message}</TableCell>
                      <TableCell>{new Date(action.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/dean/reviews/${action.appraisalId}`} className="text-sm font-medium text-primary hover:underline">
                          View Appraisal
                        </Link>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center">No recent actions.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
