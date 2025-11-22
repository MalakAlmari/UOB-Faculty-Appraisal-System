"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Send } from "lucide-react"

interface EvaluationCriteria {
  id: string
  name: string
  description: string
  weight: number
  maxPoints: number
}

interface CriteriaEvaluation {
  id?: string
  criteriaId: string
  selfPoints?: number
  finalPoints?: number
  comments?: string
}

interface AppraisalFormProps {
  appraisalId: string
  isReadOnly?: boolean
  isEvaluator?: boolean
  evaluations?: CriteriaEvaluation[]
  onSave?: () => void
}

export function AppraisalForm({
  appraisalId,
  isReadOnly = false,
  isEvaluator = false,
  evaluations = [],
  onSave,
}: AppraisalFormProps) {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([])
  const [formEvaluations, setFormEvaluations] = useState<CriteriaEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCriteria()
  }, [])

  useEffect(() => {
    if (criteria.length > 0) {
      const initialEvaluations = criteria.map((c) => {
        const existing = evaluations.find((e) => e.criteriaId === c.id)
        return existing || { criteriaId: c.id, selfPoints: 0, finalPoints: 0, comments: "" }
      })
      setFormEvaluations(initialEvaluations)
    }
  }, [criteria, evaluations])

  const fetchCriteria = async () => {
    try {
      const response = await fetch("/api/admin/criteria")
      if (response.ok) {
        const data = await response.json()
        setCriteria(data.filter((c: any) => c.isActive))
      }
    } catch (error) {
      console.error("Error fetching criteria:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateEvaluation = (criteriaId: string, field: string, value: any) => {
    setFormEvaluations((prev) =>
      prev.map((evaluation) => (evaluation.criteriaId === criteriaId ? { ...evaluation, [field]: value } : evaluation)),
    )
  }

  const handleSave = async (submit = false) => {
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/appraisals/${appraisalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: submit ? "submit" : "save",
          evaluations: formEvaluations,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save appraisal")
      }

      onSave?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const calculateTotalScore = () => {
    let totalScore = 0
    let totalWeight = 0

    formEvaluations.forEach((evaluation) => {
      const criteriaItem = criteria.find((c) => c.id === evaluation.criteriaId)
      if (criteriaItem) {
        const points = isEvaluator ? evaluation.finalPoints || 0 : evaluation.selfPoints || 0
        const percentage = (points / criteriaItem.maxPoints) * 100
        totalScore += percentage * (criteriaItem.weight / 100)
        totalWeight += criteriaItem.weight
      }
    })

    return totalWeight > 0 ? totalScore.toFixed(1) : "0.0"
  }

  if (isLoading) {
    return <div className="p-6">Loading evaluation criteria...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Performance Evaluation</CardTitle>
          <CardDescription>
            {isEvaluator ? "Evaluate performance based on criteria" : "Self-evaluate your performance"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {criteria.map((criteriaItem) => {
              const evaluation = formEvaluations.find((e) => e.criteriaId === criteriaItem.id)
              return (
                <Card key={criteriaItem.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-card-foreground">{criteriaItem.name}</h4>
                        <p className="text-sm text-muted-foreground">{criteriaItem.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Weight: {criteriaItem.weight}%</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Max: {criteriaItem.maxPoints} pts</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {!isEvaluator && (
                        <div className="space-y-2">
                          <Label htmlFor={`self-${criteriaItem.id}`}>Self-Evaluation Points</Label>
                          <Input
                            id={`self-${criteriaItem.id}`}
                            type="number"
                            min="0"
                            max={criteriaItem.maxPoints}
                            value={evaluation?.selfPoints || 0}
                            onChange={(e) =>
                              updateEvaluation(criteriaItem.id, "selfPoints", Number.parseInt(e.target.value) || 0)
                            }
                            disabled={isReadOnly}
                          />
                        </div>
                      )}

                      {isEvaluator && (
                        <div className="space-y-2">
                          <Label htmlFor={`final-${criteriaItem.id}`}>Final Points</Label>
                          <Input
                            id={`final-${criteriaItem.id}`}
                            type="number"
                            min="0"
                            max={criteriaItem.maxPoints}
                            value={evaluation?.finalPoints || 0}
                            onChange={(e) =>
                              updateEvaluation(criteriaItem.id, "finalPoints", Number.parseInt(e.target.value) || 0)
                            }
                            disabled={isReadOnly}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor={`comments-${criteriaItem.id}`}>Comments</Label>
                        <Textarea
                          id={`comments-${criteriaItem.id}`}
                          value={evaluation?.comments || ""}
                          onChange={(e) => updateEvaluation(criteriaItem.id, "comments", e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Add comments about this criteria..."
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total Score:</span>
            <span className="text-2xl font-bold text-accent">{calculateTotalScore()}%</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isReadOnly && (
        <div className="flex gap-4">
          <Button onClick={() => handleSave(false)} disabled={isSaving} variant="outline">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving} className="bg-accent text-accent-foreground">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  )
}
