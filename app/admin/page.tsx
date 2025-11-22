import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Building2, GraduationCap, Users, Award } from "lucide-react"

async function getStats() {
  const [collegesCount, usersCount] = await Promise.all([
    prisma.college.count(),
    prisma.user.count(),
  ])

  return {
    colleges: collegesCount,
    majors: 0, // Placeholder, as Department model exists but client may not be updated
    users: usersCount,
    achievements: 0, // Placeholder, as there's no single Achievement model
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      title: "Total Colleges",
      value: stats.colleges,
      description: "Active colleges in the system",
      icon: Building2,
      color: "text-chart-1",
    },
    {
      title: "Total Majors",
      value: stats.majors,
      description: "Academic majors available",
      icon: GraduationCap,
      color: "text-chart-2",
    },
    {
      title: "Total Users",
      value: stats.users,
      description: "Faculty and staff members",
      icon: Users,
      color: "text-chart-3",
    },
    {
      title: "Total Achievements",
      value: stats.achievements,
      description: "Recorded achievements",
      icon: Award,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your faculty appraisal system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium ">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{stat.value}</div>
              <p className="text-xs ">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">Add College</p>
                    <p className="text-xs text-muted-foreground">Create new college</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">Add User</p>
                    <p className="text-xs text-muted-foreground">Create new user</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">System Status</CardTitle>
            <CardDescription>Current system information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">Database Status</span>
                <span className="text-sm text-chart-3 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">Last Backup</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">Active Sessions</span>
                <span className="text-sm text-card-foreground font-medium">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
