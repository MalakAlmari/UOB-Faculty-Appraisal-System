import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { Users, Building2, GraduationCap, Calendar, FileText, MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"

async function getDashboardData() {
  const [
    totalUsers,
    usersByRole,
    totalColleges,
    totalDepartments,
    totalCycles,
    activeCycle,
    totalAppraisals,
    appraisalsByStatus,
    openAppealsCount,
    recentAppeals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    }),
    prisma.college.count(),
    prisma.department.count(),
    prisma.appraisalCycle.count(),
    prisma.appraisalCycle.findFirst({
      where: { isActive: true },
      select: { academicYear: true, semester: true },
    }),
    prisma.appraisal.count(),
    prisma.appraisal.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.appeal.count({
      where: { resolvedAt: null },
    }),
    prisma.appeal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        appraisal: {
          include: {
            faculty: { select: { name: true } },
            cycle: { select: { academicYear: true, semester: true } },
          },
        },
      },
    }),
  ])

  return {
    totalUsers,
    usersByRole: usersByRole.reduce((acc, curr) => {
      acc[curr.role] = curr._count.role
      return acc
    }, {} as Record<string, number>),
    totalColleges,
    totalDepartments,
    totalCycles,
    activeCycle: activeCycle ? `${activeCycle.academicYear} - ${activeCycle.semester}` : 'None',
    totalAppraisals,
    appraisalsByStatus: appraisalsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {} as Record<string, number>),
    openAppealsCount,
    recentAppeals,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const kpiCards = [
    {
      title: "Total Users",
      value: data.totalUsers,
      description: `Admins: ${data.usersByRole.ADMIN || 0}, Deans: ${data.usersByRole.DEAN || 0}, HODs: ${data.usersByRole.HOD || 0}, Instructors: ${data.usersByRole.INSTRUCTOR || 0}`,
      icon: Users,
    },
    {
      title: "Colleges",
      value: data.totalColleges,
      description: "Academic colleges",
      icon: Building2,
    },
    {
      title: "Departments",
      value: data.totalDepartments,
      description: "Academic departments",
      icon: GraduationCap,
    },
    {
      title: "Cycles",
      value: data.totalCycles,
      description: `Active: ${data.activeCycle}`,
      icon: Calendar,
    },
    {
      title: "Appraisals",
      value: data.totalAppraisals,
      description: "Total appraisal records",
      icon: FileText,
    },
    {
      title: "Open Appeals",
      value: data.openAppealsCount,
      description: "Pending appeals",
      icon: MessageSquare,
    },
  ]

  const statusColors = {
    NEW: "bg-blue-100 text-blue-800",
    sent: "bg-green-100 text-green-800",
    complete: "bg-purple-100 text-purple-800",
    returned: "bg-red-100 text-red-800",
    new: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Dashboard</h1>
        <p className="text-muted-foreground">One-glance health of the system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appraisals by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appraisals by Status</CardTitle>
            <CardDescription>Distribution of appraisal statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.appraisalsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                    {status.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Appeals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Appeals</CardTitle>
            <CardDescription>Latest appeal submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentAppeals.map((appeal) => (
                <div key={appeal.id} className="border-b pb-2 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{appeal.appraisal.faculty.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {appeal.appraisal.cycle.academicYear} {appeal.appraisal.cycle.semester}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {appeal.message.length > 50 ? `${appeal.message.substring(0, 50)}...` : appeal.message}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(appeal.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-between">
                Manage Users
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/cycles">
              <Button variant="outline" className="w-full justify-between">
                Open Cycles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/grading">
              <Button variant="outline" className="w-full justify-between">
                Grading
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}