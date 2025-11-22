"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { UserForm } from "@/components/admin/user-form"
import { Plus, Edit, Trash2, Users, Upload, Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog"

interface User {
  id: number
  email: string
  name: string
  role: string
  status: string
  departmentId: number | null
  department: {
    id: number
    name: string
    college: {
      id: number
      name: string
    }
  } | null
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [collegeFilter, setCollegeFilter] = useState<string>("ALL")
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL")
  const [colleges, setColleges] = useState<{id: number, name: string}[]>([])
  const [departments, setDepartments] = useState<{id: number, name: string, collegeId: number}[]>([])
  const [showBulkImport, setShowBulkImport] = useState(false)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCollegesAndDepartments = async () => {
    try {
      const [collegesRes, departmentsRes] = await Promise.all([
        fetch("/api/admin/colleges"),
        fetch("/api/admin/departments")
      ])
      if (collegesRes.ok) {
        const collegesData = await collegesRes.json()
        setColleges(collegesData)
      }
      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json()
        setDepartments(departmentsData)
      }
    } catch (error) {
      console.error("Error fetching colleges/departments:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchCollegesAndDepartments()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter
    const matchesCollege = collegeFilter === "ALL" ||
      (user.role === "DEAN" && user.department?.college.id.toString() === collegeFilter)
    const matchesDepartment = departmentFilter === "ALL" ||
      (user.role !== "DEAN" && user.departmentId?.toString() === departmentFilter)

    return matchesSearch && matchesRole && matchesStatus && matchesCollege && matchesDepartment
  })

  const handleDelete = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== user.id))
        setDeletingUser(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingUser(undefined)
    fetchUsers()
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users & Roles</h1>
          <p className="text-muted-foreground">Manage accounts and role assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Create / Invite User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Input
              placeholder="Search name/email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="DEAN">Dean</SelectItem>
              <SelectItem value="HOD">HOD</SelectItem>
              <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 ">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>College (Dean)</TableHead>
                <TableHead>Department (HOD/Instructor)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.department?.college.name}
                  </TableCell>
                  <TableCell>
                    {user.role !== 'DEAN' ? user.department?.name : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {user.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user)
                          setShowForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent >
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user information" : "Create a new user in the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
          <UserForm
            user={editingUser}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingUser(undefined)
            }}
          />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingUser?.name}" and all associated data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && handleDelete(deletingUser)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Users</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple users at once. The CSV should contain the following columns: email, name, role, department, college, status, and optional fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Upload CSV File</p>
              <p className="text-sm text-muted-foreground mb-4">
                Select a CSV file with user data. Maximum file size: 5MB.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File size must be less than 5MB")
                      return
                    }

                    try {
                      const text = await file.text()
                      const lines = text.split('\n').filter(line => line.trim())
                      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

                      // Validate required headers
                      const requiredHeaders = ['email', 'name', 'role']
                      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

                      if (missingHeaders.length > 0) {
                        alert(`Missing required columns: ${missingHeaders.join(', ')}`)
                        return
                      }

                      const users = lines.slice(1).map((line, index) => {
                        const values = line.split(',').map(v => v.trim())
                        const user: any = {}

                        headers.forEach((header, i) => {
                          if (values[i]) {
                            user[header] = values[i]
                          }
                        })

                        return user
                      }).filter(user => user.email && user.name && user.role)

                      if (users.length === 0) {
                        alert("No valid users found in CSV file")
                        return
                      }

                      // Send to API
                      const response = await fetch('/api/admin/users/bulk-import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ users }),
                      })

                      if (response.ok) {
                        const result = await response.json()
                        alert(`Successfully imported ${result.imported} users. ${result.failed} failed.`)
                        setShowBulkImport(false)
                        fetchUsers()
                      } else {
                        const error = await response.json()
                        alert(`Import failed: ${error.error}`)
                      }
                    } catch (error) {
                      console.error('Error processing file:', error)
                      alert('Error processing file')
                    }
                  }
                }}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Select CSV File
                </Button>
              </label>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Required columns: email, name, role</li>
                <li>Optional columns: status, department, college, idNumber, academicRank, nationality, generalSpecialization, specificSpecialization</li>
                <li>Email must end with @uob.edu</li>
                <li>Role must be: ADMIN, DEAN, HOD, or INSTRUCTOR</li>
                <li>Status must be: ACTIVE or INACTIVE (default: ACTIVE)</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}