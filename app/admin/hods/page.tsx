"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"

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

export default function HodsPage() {
  const [hods, setHods] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        const filteredHods = data.filter((user: User) => user.role === 'HOD')
        setHods(filteredHods)
      }
    } catch (error) {
      console.error("Error fetching hods:", error)
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
          <h1 className="text-3xl font-bold text-foreground">Heads of Department</h1>
          <p className="text-muted-foreground">Manage HODs in the system</p>
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BookOpen className="h-5 w-5" />
            All HODs
          </CardTitle>
          <CardDescription>
            {hods.length} HOD{hods.length !== 1 ? "s" : ""} in the system
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
              {hods.map((hod) => (
                <TableRow key={hod.id}>
                  <TableCell className="font-medium">{hod.name}</TableCell>
                  <TableCell>{hod.email}</TableCell>
                  <TableCell>
                    <Badge variant={hod.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {hod.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {hod.department ? `${hod.department.name} (${hod.department.college.name})` : "-"}
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