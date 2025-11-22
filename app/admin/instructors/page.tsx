"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface User {
  id: number
  email: string
  name: string
  role: string
  status: string
  departmentId: number | null
  department: {
    name: string
    college: {
      name: string
    }
  } | null
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        const filteredInstructors = data.filter((user: User) => user.role === 'INSTRUCTOR')
        setInstructors(filteredInstructors)
      }
    } catch (error) {
      console.error("Error fetching instructors:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instructors</h1>
          <p className="text-muted-foreground">Manage instructors in the system</p>
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Users className="h-5 w-5" />
            All Instructors
          </CardTitle>
          <CardDescription>
            {instructors.length} instructor{instructors.length !== 1 ? "s" : ""} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">{instructor.name}</TableCell>
                  <TableCell>{instructor.email}</TableCell>
                  <TableCell>
                    <Badge variant={instructor.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {instructor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {instructor.department ? `${instructor.department.name} (${instructor.department.college.name})` : "-"}
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