"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, TrendingUp, Award, Calendar } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface FacultyDashboardProps {
  user: User
}

export default function FacultyDashboard({ user }: FacultyDashboardProps) {
  const [currentAppraisal, setCurrentAppraisal] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAppraisals: 0,
    completedAppraisals: 0,
    averageScore: 0,
    lastUpdate: null as string | null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch current appraisal
      const appraisalResponse = await fetch("/api/appraisals?limit=1")
      if (appraisalResponse.ok) {
        const appraisals = await appraisalResponse.json()
        if (appraisals.length > 0) {
          setCurrentAppraisal(appraisals[0])
        }
      }

      // Fetch stats (placeholder for now)
      setStats({
        totalAppraisals: 3,
        completedAppraisals: 2,
        averageScore: 85,
        lastUpdate: "2024-01-15"
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800"
      // case "IN_REVIEW": return "bg-yellow-100 text-yellow-800"
      case "sent": return "bg-orange-100 text-orange-800"
      case "complete": return "bg-green-100 text-green-800"
      case "returned": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }


  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">Here's your performance overview</p>
        </div>
        <div className="flex items-center gap-4">
          {currentAppraisal && (
            <Badge className={getStatusColor(currentAppraisal.status)}>
              Current Cycle: {currentAppraisal.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Cycle</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {currentAppraisal?.status || "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Appraisals</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.totalAppraisals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-sm font-bold text-card-foreground">
                  {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Appraisal Status */}
      {currentAppraisal && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Current Appraisal Status
            </CardTitle>
            <CardDescription>
              Academic Year {currentAppraisal.academicYear} - {currentAppraisal.cycle?.semester}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(currentAppraisal.status)}>
                  {currentAppraisal.status}
                </Badge>
                {currentAppraisal.totalScore && (
                  <span className="text-lg font-bold">
                    Score: {currentAppraisal.totalScore}%
                  </span>
                )}
              </div>
              <Button variant="outline" onClick={() => window.location.href = '/faculty/appraisal/results'}>
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Message */}
      <Card className="bg-card">
        <CardContent className="text-center py-8">
          <h2 className="text-2xl font-bold text-card-foreground mb-2">Welcome to Your Faculty Portal</h2>
          <p className="text-muted-foreground">
            Use the sidebar navigation to access your appraisal management tools, view results, and generate reports.
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest appraisal activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Appraisal submitted for review</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Achievement added: Research Paper</p>
                <p className="text-xs text-muted-foreground">1 week ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}