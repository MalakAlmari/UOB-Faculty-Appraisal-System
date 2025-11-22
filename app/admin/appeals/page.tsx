"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Eye, User } from "lucide-react"
import Link from "next/link"

interface Appeal {
  id: number
  message: string
  createdAt: string
  resolvedAt: string | null
  appraisal: {
    id: number
    status: string
    faculty: {
      id: number
      name: string
      role: string
      department: {
        name: string
        college: {
          name: string
        }
      } | null
    }
    cycle: {
      academicYear: string
      semester: string
    }
  }
}

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>("ALL")

  const fetchAppeals = async () => {
    try {
      const response = await fetch("/api/admin/appeals")
      if (response.ok) {
        const data = await response.json()
        setAppeals(data)
      }
    } catch (error) {
      console.error("Error fetching appeals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppeals()
  }, [])

  const getEvaluator = (appeal: Appeal) => {
    if (appeal.appraisal.faculty.role === 'INSTRUCTOR') {
      return 'HOD'
    } else if (appeal.appraisal.faculty.role === 'HOD') {
      return 'Dean'
    }
    return 'N/A'
  }

  const filteredAppeals = appeals.filter(appeal => {
    if (evaluatorFilter === "ALL") return true
    return getEvaluator(appeal) === evaluatorFilter
  })

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Appeals Center</h1>
        <p className="text-muted-foreground">Track all appeals and ensure routing to evaluators</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={evaluatorFilter} onValueChange={setEvaluatorFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Evaluator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Evaluators</SelectItem>
              <SelectItem value="HOD">HOD</SelectItem>
              <SelectItem value="Dean">Dean</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Appeals
          </CardTitle>
          <CardDescription>
            {filteredAppeals.length} appeal{filteredAppeals.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted At</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Evaluator</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppeals.map((appeal) => (
                <TableRow key={appeal.id}>
                  <TableCell>{new Date(appeal.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{appeal.appraisal.faculty.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{appeal.appraisal.faculty.role}</Badge>
                  </TableCell>
                  <TableCell>{appeal.appraisal.cycle.academicYear} {appeal.appraisal.cycle.semester}</TableCell>
                  <TableCell>
                    <Badge className={appeal.resolvedAt ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {appeal.resolvedAt ? "Resolved" : "Open"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {appeal.message.length > 50 ? `${appeal.message.substring(0, 50)}...` : appeal.message}
                  </TableCell>
                  <TableCell>{getEvaluator(appeal)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/appraisals/${appeal.appraisal.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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