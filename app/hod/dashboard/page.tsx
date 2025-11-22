import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { ClipboardList, Users, Award, TrendingUp, Calendar, CheckCircle, Clock } from "lucide-react"
import { EvaluationStatus } from "@prisma/client"

async function getHODStats(departmentId: number) {
  const [totalFaculty, pendingAppraisals, completedAppraisals, totalAchievements, recentAppraisals] = await Promise.all([
    prisma.user.count({
      where: {
        role: "INSTRUCTOR",
        departmentId: departmentId,
        status: "ACTIVE",
      },
    }),
    prisma.appraisal.count({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
        status: EvaluationStatus.new,
      },
    }),
    prisma.appraisal.count({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
        status: EvaluationStatus.sent,
      },
    }),
    prisma.appraisal.count({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
      },
    }),
    prisma.appraisal.findMany({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
      },
      include: {
        faculty: {
          select: {
            name: true,
            email: true,
          },
        },
        cycle: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 8, // زيادة العدد لملء المساحة
    }),
  ])

  return {
    totalFaculty,
    pendingAppraisals,
    completedAppraisals,
    totalAchievements,
    recentAppraisals,
  }
}

export default async function HODDashboard() {
  const user = await getCurrentUser()
  if (!user?.departmentId) {
    return <div className="p-6">User not associated with a department.</div>
  }
  const stats = await getHODStats(parseInt(user.departmentId))

  const statCards = [
    {
      title: "Total Faculty",
      value: stats.totalFaculty,
      description: "Active instructors",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Review",
      value: stats.pendingAppraisals,
      description: "Appraisals awaiting review",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Completed",
      value: stats.completedAppraisals,
      description: "Reviewed appraisals",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Appraisals",
      value: stats.totalAchievements,
      description: "All department appraisals",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  // دالة للحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100'
      case 'new':
        return 'text-amber-600 bg-amber-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  // دالة لتنسيق التاريخ
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HOD Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your department overview.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Appraisals - Full Width */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Faculty Appraisals</CardTitle>
              <CardDescription>Latest appraisal submissions in your department</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Recent</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentAppraisals.length > 0 ? (
              stats.recentAppraisals.map((appraisal) => (
                <div 
                  key={appraisal.id} 
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {appraisal.faculty.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{appraisal.faculty.name}</p>
                      <p className="text-sm text-gray-500">{appraisal.faculty.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{appraisal.cycle.academicYear}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">Semester {appraisal.cycle.semester}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(appraisal.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appraisal.status)}`}>
                      {appraisal.status === 'sent' ? 'Reviewed' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No appraisals yet</p>
                <p className="text-gray-400 text-sm mt-1">Appraisal submissions will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-white border border-gray-100 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalFaculty}</div>
          <div className="text-sm text-gray-600">Total Faculty Members</div>
        </div>
        <div className="text-center p-4 bg-white border border-gray-100 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.completedAppraisals}</div>
          <div className="text-sm text-gray-600">Completed Reviews</div>
        </div>
        <div className="text-center p-4 bg-white border border-gray-100 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{stats.pendingAppraisals}</div>
          <div className="text-sm text-gray-600">Pending Reviews</div>
        </div>
      </div>
    </div>
  )
}