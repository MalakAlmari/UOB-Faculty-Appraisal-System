"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserCheck } from "lucide-react"

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

export default function DeansPage() {
  const [deans, setDeans] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        const filteredDeans = data.filter((user: User) => user.role === 'DEAN')
        setDeans(filteredDeans)
      }
    } catch (error) {
      console.error("Error fetching deans:", error)
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
          <h1 className="text-3xl font-bold text-foreground">Deans</h1>
          <p className="text-muted-foreground">Manage deans in the system</p>
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <UserCheck className="h-5 w-5" />
            All Deans
          </CardTitle>
          <CardDescription>
            {deans.length} dean{deans.length !== 1 ? "s" : ""} in the system
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
              {deans.map((dean) => (
                <TableRow key={dean.id}>
                  <TableCell className="font-medium">{dean.name}</TableCell>
                  <TableCell>{dean.email}</TableCell>
                  <TableCell>
                    <Badge variant={dean.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {dean.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {dean.department ? `${dean.department.name} (${dean.department.college.name})` : "-"}
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