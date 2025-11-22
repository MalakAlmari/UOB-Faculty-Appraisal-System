import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { ClipboardList, Award, TrendingUp, Calendar } from "lucide-react"

async function getFacultyStats(userId: string) {
  // Get the current active appraisal cycle
  const currentCycle = await prisma.appraisalCycle.findFirst({
    where: { isActive: true },
  })

  if (!currentCycle) {
    return {
      currentAppraisal: null,
      totalAchievements: 0,
      recentAchievements: [],
    }
  }

  // Find or create current appraisal for this user
  let currentAppraisal = await prisma.appraisal.findFirst({
    where: {
      facultyId: parseInt(userId),
      cycleId: currentCycle.id,
    },
  })

  if (!currentAppraisal) {
    currentAppraisal = await prisma.appraisal.create({
      data: {
        facultyId: parseInt(userId),
        cycleId: currentCycle.id,
        status: "new",
      },
    })
  }

  // Fetch all achievements for the current appraisal
  const [
    awards,
    courses,
    researchActivities,
    scientificActivities,
    universityServices,
    communityServices,
  ] = await Promise.all([
    prisma.award.findMany({
      where: { appraisalId: currentAppraisal.id },
      orderBy: { dateObtained: "desc" },
      take: 5,
    }),
    prisma.courseTaught.findMany({
      where: { appraisalId: currentAppraisal.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.researchActivity.findMany({
      where: { appraisalId: currentAppraisal.id },
      orderBy: { publicationDate: "desc" },
      take: 5,
    }),
    prisma.scientificActivity.findMany({
      where: { appraisalId: currentAppraisal.id },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.universityService.findMany({
      where: { appraisalId: currentAppraisal.id },
      orderBy: { dateFrom: "desc" },
      take: 5,
    }),
    prisma.communityService.findMany({
      where: { appraisalId: currentAppraisal.id },
      orderBy: { dateFrom: "desc" },
      take: 5,
    }),
  ])

  // Calculate total achievements
  const totalAchievements =
    awards.length +
    courses.length +
    researchActivities.length +
    scientificActivities.length +
    universityServices.length +
    communityServices.length

  // Combine and sort recent achievements
  const allAchievements = [
    ...awards.map((a) => ({
      id: a.id,
      title: a.name,
      category: "Award",
      dateAchieved: a.dateObtained,
      points: 0, // Will be calculated based on grading config
    })),
    ...courses.map((c) => ({
      id: c.id,
      title: c.courseTitle,
      category: "Course",
      dateAchieved: new Date(c.createdAt),
      points: 0,
    })),
    ...researchActivities.map((r) => ({
      id: r.id,
      title: r.title,
      category: "Research",
      dateAchieved: r.publicationDate,
      points: 0,
    })),
    ...scientificActivities.map((s) => ({
      id: s.id,
      title: s.title,
      category: "Scientific Activity",
      dateAchieved: s.date,
      points: 0,
    })),
    ...universityServices.map((u) => ({
      id: u.id,
      title: u.committeeOrTask,
      category: "University Service",
      dateAchieved: u.dateFrom,
      points: 0,
    })),
    ...communityServices.map((c) => ({
      id: c.id,
      title: c.committeeOrTask,
      category: "Community Service",
      dateAchieved: c.dateFrom,
      points: 0,
    })),
  ]

  // Sort by date and take the 5 most recent
  const recentAchievements = allAchievements
    .filter((achievement) => achievement.dateAchieved)
    .sort((a, b) => new Date(b.dateAchieved!).getTime() - new Date(a.dateAchieved!).getTime())
    .slice(0, 5)

  return {
    currentAppraisal,
    totalAchievements,
    recentAchievements,
  }
}

export default async function FacultyDashboard() {
  const user = await getCurrentUser()
  const stats = await getFacultyStats(user!.id)

  const statCards = [
    {
      title: "Current Appraisal",
      value: stats.currentAppraisal?.status || "Not Started",
      description: `${new Date().getFullYear()} Academic Year`,
      icon: ClipboardList,
      color: "text-chart-1",
    },
    {
      title: "Total Achievements",
      value: stats.totalAchievements,
      description: "Career achievements",
      icon: Award,
      color: "text-chart-3",
    },
    {
      title: "Performance Score",
      value: stats.currentAppraisal?.totalScore ? `${stats.currentAppraisal.totalScore}%` : "Pending",
      description: "Current year score",
      icon: TrendingUp,
      color: "text-chart-2",
    },
    {
      title: "Last Updated",
      value: stats.currentAppraisal ? new Date(stats.currentAppraisal.updatedAt).toLocaleDateString() : "Never",
      description: "Appraisal last modified",
      icon: Calendar,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Track your performance and achievements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Achievements</CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAchievements.length > 0 ? (
                stats.recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.category} • {new Date(achievement.dateAchieved).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-accent">{achievement.points} pts</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No achievements recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}