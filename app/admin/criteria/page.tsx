"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings } from "lucide-react"

interface Criteria {
  id: number
  name: string
  description: string | null
  weight: number
  maxPoints: number
}

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCriteria = async () => {
    try {
      const response = await fetch("/api/admin/criteria")
      if (response.ok) {
        const data = await response.json()
        setCriteria(data)
      }
    } catch (error) {
      console.error("Error fetching criteria:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCriteria()
  }, [])

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Evaluation Criteria</h1>
          <p className="text-muted-foreground">Manage evaluation criteria in the system</p>
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Settings className="h-5 w-5" />
            All Criteria
          </CardTitle>
          <CardDescription>
            {criteria.length} criteria in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Max Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criteria.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description || "-"}</TableCell>
                  <TableCell>{item.weight}</TableCell>
                  <TableCell>{item.maxPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}