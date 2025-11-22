"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, Search, Award, Eye } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description?: string
  category: string
  points: number
  academicYear: string
  dateAchieved: string
  isVerified: boolean
  user: {
    firstName: string
    lastName: string
    email: string
    major?: { name: string }
  }
  college: { name: string }
  major?: { name: string }
}

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")

  useEffect(() => {
    fetchAchievements()
  }, [])

  useEffect(() => {
    filterAchievements()
  }, [achievements, searchTerm, categoryFilter, verificationFilter])

  const fetchAchievements = async () => {
    try {
      const response = await fetch("/api/achievements")
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      }
    } catch (error) {
      console.error("Error fetching achievements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAchievements = () => {
    let filtered = achievements

    if (searchTerm) {
      filtered = filtered.filter(
        (achievement) =>
          achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          achievement.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          achievement.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((achievement) => achievement.category === categoryFilter)
    }

    if (verificationFilter !== "all") {
      filtered = filtered.filter((achievement) =>
        verificationFilter === "verified" ? achievement.isVerified : !achievement.isVerified,
      )
    }

    setFilteredAchievements(filtered)
  }

  const handleVerificationToggle = async (achievementId: string, isVerified: boolean) => {
    try {
      const response = await fetch(`/api/achievements/${achievementId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      })

      if (response.ok) {
        setAchievements(
          achievements.map((achievement) =>
            achievement.id === achievementId ? { ...achievement, isVerified } : achievement,
          ),
        )
      }
    } catch (error) {
      console.error("Error updating verification:", error)
    }
  }

  const categories = [...new Set(achievements.map((a) => a.category))].sort()

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Achievements</h1>
          <p className="text-muted-foreground">Manage and verify faculty achievements</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-chart-1" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-card-foreground">{achievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-chart-3" />
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {achievements.filter((a) => a.isVerified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-chart-4" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {achievements.filter((a) => !a.isVerified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-chart-2" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {achievements.reduce((sum, a) => sum + a.points, 0).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search achievements or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
                setVerificationFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Achievements</CardTitle>
          <CardDescription>{filteredAchievements.length} achievements found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAchievements.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div>
                      <p className="truncate">{achievement.title}</p>
                      {achievement.description && (
                        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {achievement.user.firstName} {achievement.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{achievement.user.major?.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{achievement.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{achievement.points}</TableCell>
                  <TableCell>{achievement.academicYear}</TableCell>
                  <TableCell>
                    {achievement.isVerified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={achievement.isVerified ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleVerificationToggle(achievement.id, !achievement.isVerified)}
                        className={achievement.isVerified ? "" : "bg-green-600 text-white hover:bg-green-700"}
                      >
                        {achievement.isVerified ? "Unverify" : "Verify"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
