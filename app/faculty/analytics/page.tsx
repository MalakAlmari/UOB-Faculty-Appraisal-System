import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Charts from './charts'


export default async function AnalyticsPage(){
const session = await getServerSession(authOptions)
const user = session?.user as any
if (!user) redirect('/login')


const apps = await prisma.appraisal.findMany({
where: { facultyId: parseInt(user.id) },
include: {
  cycle: true,
  evaluations: true,
},
orderBy: { id: 'asc' },
})

const data = apps.map(a => {
  // Calculate scores from evaluations if available, otherwise use Appraisal fields
  let research = a.researchScore ?? 0
  let university = a.universityServiceScore ?? 0
  let community = a.communityServiceScore ?? 0
  let teaching = a.teachingQualityScore ?? 0
  let total = a.totalScore ?? 0

  // If evaluations exist, calculate from the latest evaluation
  if (a.evaluations && a.evaluations.length > 0) {
    const latestEval = a.evaluations.sort((x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime())[0]

    if (latestEval) {
      research = latestEval.researchPts ?? 0
      university = latestEval.universityServicePts ?? 0
      community = latestEval.communityServicePts ?? 0
      teaching = latestEval.teachingQualityPts ?? 0
      total = latestEval.totalScore ?? (research + university + community + teaching)
    }
  } else {
    // If no evaluations, calculate total from individual appraisal scores
    total = research + university + community + teaching
  }

  return {
    id: a.id,
    label: `${a.cycle?.academicYear ?? ''}`.trim(),
    status: a.status,
    research,
    university,
    community,
    teaching,
    total,
  }
})


return (
<div className="p-6 space-y-6 ">
<h1 className="text-xl font-semibold">My Analytics</h1>
<Charts rows={data} />
<div className="rounded-2xl border bg-white overflow-hidden">
<table className="w-full text-sm">
<thead className="bg-gray-50">
<tr>
<th className="p-2 text-left">Cycle</th>
<th className="p-2 text-left">Status</th>
<th className="p-2 text-left">Total</th>
<th className="p-2 text-left">Actions</th>
</tr>
</thead>
<tbody>
{data.map(r => (
<tr key={r.id} className="border-t">
<td className="p-2">{r.label || r.id}</td>
<td className="p-2">{r.status}</td>
<td className="p-2">{r.total.toFixed(2)}</td>
<td className="p-2">
<a className="underline" href={`/me/appraisal/achievements?cycleId=${r.id}`}>Open Achievements</a>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)
}



{/* "use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, BarChart3, Eye, Download } from "lucide-react"
import Link from "next/link"

interface AppraisalData {
  id: string
  academicYear: string
  semester: string
  status: string
  totalScore?: number
  researchScore?: number
  universityServiceScore?: number
  communityServiceScore?: number
  teachingQualityScore?: number
  submittedAt?: string
  completedAt?: string
}

export default function FacultyAnalyticsPage() {
  const [appraisals, setAppraisals] = useState<AppraisalData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch all appraisals for the current user
      const response = await fetch("/api/appraisals")
      if (response.ok) {
        const data = await response.json()
        setAppraisals(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800"
      case "IN_REVIEW": return "bg-yellow-100 text-yellow-800"
      case "SCORES_SENT": return "bg-orange-100 text-orange-800"
      case "COMPLETE": return "bg-green-100 text-green-800"
      case "RETURNED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate statistics
  const completedAppraisals = appraisals.filter(a => a.status === "complete")
  const averageScore = completedAppraisals.length > 0
    ? completedAppraisals.reduce((sum, a) => sum + (a.totalScore || 0), 0) / completedAppraisals.length
    : 0

  const trendData = appraisals
    .filter(a => a.totalScore)
    .sort((a, b) => `${a.academicYear}-${a.semester}`.localeCompare(`${b.academicYear}-${b.semester}`))
    .map(a => ({
      period: `${a.academicYear} ${a.semester}`,
      score: a.totalScore || 0
    }))

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground">Track your performance trends across appraisal cycles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Appraisals</p>
                <p className="text-2xl font-bold text-card-foreground">{appraisals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-card-foreground">{completedAppraisals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-card-foreground">{averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest Score</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {completedAppraisals.length > 0
                    ? `${completedAppraisals[completedAppraisals.length - 1].totalScore}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trend Over Time
          </CardTitle>
          <CardDescription>Your total scores across different appraisal cycles</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed appraisals with scores available for trend analysis
            </div>
          ) : (
            <div className="space-y-4">
              {trendData.map((point, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{point.period}</span>
                  <div className="flex items-center gap-4 flex-1 mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${point.score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{point.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Section Scores Breakdown</CardTitle>
          <CardDescription>Average performance across different evaluation categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Research", weight: 30, scores: completedAppraisals.map(a => a.researchScore || 0) },
              { name: "University Service", weight: 20, scores: completedAppraisals.map(a => a.universityServiceScore || 0) },
              { name: "Community Service", weight: 20, scores: completedAppraisals.map(a => a.communityServiceScore || 0) },
              { name: "Teaching Quality", weight: 30, scores: completedAppraisals.map(a => a.teachingQualityScore || 0) }
            ].map((section) => {
              const avgScore = section.scores.length > 0
                ? section.scores.reduce((sum, score) => sum + score, 0) / section.scores.length
                : 0

              return (
                <div key={section.name} className="text-center">
                  <div className="text-2xl font-bold text-accent">{avgScore.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">{section.name}</div>
                  <div className="text-xs text-muted-foreground">Weight: {section.weight}%</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Appraisal History</CardTitle>
          <CardDescription>Complete history of your appraisal cycles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Score</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appraisals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No appraisals found
                  </TableCell>
                </TableRow>
              ) : (
                appraisals.map((appraisal) => (
                  <TableRow key={appraisal.id}>
                    <TableCell className="font-medium">
                      {appraisal.academicYear} - {appraisal.semester}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appraisal.status)}>
                        {appraisal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appraisal.totalScore ? `${appraisal.totalScore}%` : "Pending"}
                    </TableCell>
                    <TableCell>
                      {appraisal.submittedAt
                        ? new Date(appraisal.submittedAt).toLocaleDateString()
                        : "Not submitted"}
                    </TableCell>
                    <TableCell>
                      {appraisal.completedAt
                        ? new Date(appraisal.completedAt).toLocaleDateString()
                        : "In progress"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/faculty/appraisal/results?appraisalId=${appraisal.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/faculty/reports?appraisalId=${appraisal.id}`}>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Report
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} */}