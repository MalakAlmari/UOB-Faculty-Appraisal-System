'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Calculator, Eye, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface GradingConfig {
  weights: {
    research: number
    universityService: number
    communityService: number
    teaching: number
  }
  serviceParams: {
    pointsPerItem: number
    maxPoints: number
  }
  teachingBands: any
  researchMap: any
}

interface AchievementsSummary {
  research: Record<string, number>
  universityService: number
  communityService: number
  teaching: {
    average: number
    courseCount: number
  }
}

interface ComputedScores {
  research: number
  teaching: number
  universityService: number
  communityService: number
  total: number
}

export default function ComputePage() {
  const params = useParams()
  const appraisalId = params.appraisalId as string

  const [config, setConfig] = useState<GradingConfig | null>(null)
  const [achievements, setAchievements] = useState<AchievementsSummary | null>(null)
  const [computedScores, setComputedScores] = useState<ComputedScores | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now, assume cycleId is 1 - in real implementation, get from appraisal
        const cycleId = 1

        const [configRes, achievementsRes] = await Promise.all([
          fetch(`/api/grading/effective?cycleId=${cycleId}`),
          fetch(`/api/appraisals/${appraisalId}/achievements-summary`)
        ])

        if (configRes.ok) {
          const configData = await configRes.json()
          setConfig(configData)
        }

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json()
          setAchievements(achievementsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (appraisalId) {
      fetchData()
    }
  }, [appraisalId])

  useEffect(() => {
    if (config && achievements) {
      const scores = computeAllScores(config, achievements)
      setComputedScores(scores)
    }
  }, [config, achievements])

  const computeAllScores = (config: GradingConfig, achievements: AchievementsSummary): ComputedScores => {
    // Research score
    const researchScore = Object.entries(achievements.research).reduce((sum, [kind, count]) => {
      const points = config.researchMap?.[kind] || 0
      return sum + (points * count)
    }, 0)

    // Teaching score based on average
    let teachingScore = 0
    const avg = achievements.teaching.average
    if (avg >= 90) teachingScore = config.weights.teaching
    else if (avg >= 80) teachingScore = config.weights.teaching * 0.8
    else if (avg >= 60) teachingScore = config.weights.teaching * 0.6
    else if (avg >= 50) teachingScore = config.weights.teaching * 0.4
    else teachingScore = config.weights.teaching * 0.2

    // Service scores
    const universityServiceScore = Math.min(
      achievements.universityService * config.serviceParams.pointsPerItem,
      config.serviceParams.maxPoints
    )
    const communityServiceScore = Math.min(
      achievements.communityService * config.serviceParams.pointsPerItem,
      config.serviceParams.maxPoints
    )

    const total = researchScore + teachingScore + universityServiceScore + communityServiceScore

    return {
      research: researchScore,
      teaching: teachingScore,
      universityService: universityServiceScore,
      communityService: communityServiceScore,
      total
    }
  }

  const handleApplyAll = async () => {
    try {
      const response = await fetch(`/api/appraisals/${appraisalId}/evaluation/compute-all`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Scores applied successfully!')
        // Redirect back to evaluation
        window.location.href = `/hod/reviews/${appraisalId}?tab=evaluation`
      } else {
        alert('Failed to apply scores')
      }
    } catch (error) {
      console.error('Error applying scores:', error)
      alert('Error applying scores')
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hod/reviews/${appraisalId}?tab=evaluation`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Evaluation
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Score Calculator</h1>
          <p className="text-muted-foreground">Preview and apply computed scores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Effective Grading Config */}
        <Card>
          <CardHeader>
            <CardTitle>Effective Grading Config</CardTitle>
            <CardDescription>Current configuration for this cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Weights</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Research:</span>
                  <span>{config?.weights.research}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Teaching:</span>
                  <span>{config?.weights.teaching}%</span>
                </div>
                <div className="flex justify-between">
                  <span>University Service:</span>
                  <span>{config?.weights.universityService}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Community Service:</span>
                  <span>{config?.weights.communityService}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Service Parameters</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Points per Item:</span>
                  <span>{config?.serviceParams.pointsPerItem}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Points:</span>
                  <span>{config?.serviceParams.maxPoints}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Calculators */}
        <div className="space-y-4">
          {/* Research */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Research & Scientific Activities</CardTitle>
                  <CardDescription>Weight: {config?.weights.research}%</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Rubric
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Research Rubric</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <div>Highly Exceeds (30 pts): Exceptional research output</div>
                      <div>Exceeds (24 pts): Strong research record</div>
                      <div>Fully Meets (18 pts): Satisfactory research output</div>
                      <div>Partially Meets (12 pts): Limited research output</div>
                      <div>Needs Improvement (6 pts): Minimal research activity</div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(achievements?.research || {}).map(([kind, count]) => (
                  <div key={kind} className="flex justify-between text-sm">
                    <span>{kind}:</span>
                    <span>{count} × {config?.researchMap?.[kind] || 0} pts</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Score:</span>
                  <span>{computedScores?.research.toFixed(2)} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teaching */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality of Teaching</CardTitle>
              <CardDescription>Weight: {config?.weights.teaching}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Evaluation:</span>
                  <span>{achievements?.teaching.average.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Courses:</span>
                  <span>{achievements?.teaching.courseCount}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Score:</span>
                  <span>{computedScores?.teaching.toFixed(2)} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* University Service */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">University Service</CardTitle>
              <CardDescription>Weight: {config?.weights.universityService}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>{achievements?.universityService}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Formula:</span>
                  <span>{achievements?.universityService} × {config?.serviceParams.pointsPerItem} (max {config?.serviceParams.maxPoints})</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Score:</span>
                  <span>{computedScores?.universityService.toFixed(2)} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Service */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Service</CardTitle>
              <CardDescription>Weight: {config?.weights.communityService}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>{achievements?.communityService}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Formula:</span>
                  <span>{achievements?.communityService} × {config?.serviceParams.pointsPerItem} (max {config?.serviceParams.maxPoints})</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Score:</span>
                  <span>{computedScores?.communityService.toFixed(2)} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Total Score</h3>
                <div className="text-4xl font-bold">{computedScores?.total.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleApplyAll} className="w-full" size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply All Scores
          </Button>
        </div>
      </div>
    </div>
  )
}