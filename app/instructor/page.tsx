"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Award, BookOpen, Microscope, Users, Heart, Eye, AlertCircle } from "lucide-react"
import { AchievementForm } from "@/components/achievements/achievement-form"

interface Appraisal {
  id: number
  status: string
  submittedAt: string | null
  cycle: {
    academicYear: string
    semester: string
  }
  _count: {
    awards: number
    courses: number
    researchActivities: number
    scientificActivities: number
    universityServices: number
    communityServices: number
    evidences: number
  }
}

interface Achievement {
  id: number
  type: string
  title: string
  date?: string
  status?: string
}

export default function InstructorPage() {
  const { data: session } = useSession()
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [activeCycle, setActiveCycle] = useState<any>(null)
  const [currentAppraisal, setCurrentAppraisal] = useState<Appraisal | null>(null)
  const [showAchievementForm, setShowAchievementForm] = useState(false)
  const [selectedAchievementType, setSelectedAchievementType] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch active cycle
      const cycleResponse = await fetch("/api/appraisal-cycles?active=true")
      if (cycleResponse.ok) {
        const cycles = await cycleResponse.json()
        if (cycles.length > 0) {
          setActiveCycle(cycles[0])
        }
      }

      // Fetch user's appraisals
      const appraisalResponse = await fetch("/api/appraisals")
      if (appraisalResponse.ok) {
        const data = await appraisalResponse.json()
        setAppraisals(data)

        // Find current appraisal for active cycle
        if (activeCycle) {
          const current = data.find((app: Appraisal) => app.cycle.id === activeCycle.id)
          setCurrentAppraisal(current || null)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAppraisal = async () => {
    if (!activeCycle) return

    try {
      const response = await fetch("/api/appraisals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: activeCycle.id }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error creating appraisal:", error)
    }
  }

  const handleSubmitAppraisal = async () => {
    if (!currentAppraisal) return

    try {
      const response = await fetch(`/api/appraisals/${currentAppraisal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error submitting appraisal:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      NEW: "secondary",
      sent: "outline",
      complete: "default",
      returned: "destructive",
      new: "default",
    }
    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Appraisals</h1>
          <p className="text-muted-foreground">Manage your achievements and track evaluation progress</p>
        </div>
      </div>

      {/* Active Cycle Status */}
      {activeCycle && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Active Cycle: {activeCycle.academicYear} {activeCycle.semester}
            </CardTitle>
            <CardDescription>
              {currentAppraisal ? (
                <div className="flex items-center gap-2">
                  Status: {getStatusBadge(currentAppraisal.status)}
                  {currentAppraisal.submittedAt && (
                    <span className="text-sm text-muted-foreground">
                      Submitted: {new Date(currentAppraisal.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : (
                "No appraisal started yet"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentAppraisal ? (
              <Button onClick={handleCreateAppraisal} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Start Appraisal
              </Button>
            ) : currentAppraisal.status === "NEW" ? (
              <div className="flex gap-2">
                <Button onClick={() => setShowAchievementForm(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Achievement
                </Button>
                <Button onClick={handleSubmitAppraisal} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Submit for Review
                </Button>
              </div>
            ) : currentAppraisal.status === "sent" ? (
              <div className="flex gap-2">
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Submit Appeal
                </Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Approve Scores
                </Button>
              </div>
            ) : (
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                View Results
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievement Categories */}
      {currentAppraisal && (
        <Tabs defaultValue="awards" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="awards" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Awards ({currentAppraisal._count.awards})
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Courses ({currentAppraisal._count.courses})
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              Research ({currentAppraisal._count.researchActivities})
            </TabsTrigger>
            <TabsTrigger value="scientific" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Scientific ({currentAppraisal._count.scientificActivities})
            </TabsTrigger>
            <TabsTrigger value="university" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              University ({currentAppraisal._count.universityServices})
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Community ({currentAppraisal._count.communityServices})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="awards" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Awards & Honors</CardTitle>
                <CardDescription>Academic and professional awards received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No awards added yet
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedAchievementType("award")
                      setShowAchievementForm(true)
                    }}
                  >
                    Add your first award
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Courses Taught</CardTitle>
                <CardDescription>Courses taught during the evaluation period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No courses added yet
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedAchievementType("course")
                      setShowAchievementForm(true)
                    }}
                  >
                    Add your first course
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="research" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Research Activities</CardTitle>
                <CardDescription>Publications, projects, and research contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No research activities added yet
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedAchievementType("research")
                      setShowAchievementForm(true)
                    }}
                  >
                    Add your first research activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scientific" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scientific Activities</CardTitle>
                <CardDescription>Conferences, seminars, workshops, and training</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No scientific activities added yet
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedAchievementType("scientific")
                      setShowAchievementForm(true)
                    }}
                  >
                    Add your first scientific activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="university" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>University Services</CardTitle>
                <CardDescription>Committee work and university service contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No university services added yet
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedAchievementType("university")
                      setShowAchievementForm(true)
                    }}
                  >
                    Add your first university service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Services</CardTitle>
                <CardDescription>Community outreach and service activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No community services added yet
                  <br />
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedAchievementType("community")
                      setShowAchievementForm(true)
                    }}
                  >
                    Add your first community service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Achievement Form Modal */}
      {showAchievementForm && (
        <AchievementForm
          appraisalId={currentAppraisal?.id}
          type={selectedAchievementType}
          onSuccess={() => {
            setShowAchievementForm(false)
            setSelectedAchievementType("")
            fetchData()
          }}
          onCancel={() => {
            setShowAchievementForm(false)
            setSelectedAchievementType("")
          }}
        />
      )}
    </div>
  )
}