"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DepartmentForm } from "@/components/admin/department-form"
import { Plus, Edit, Trash2, Building } from "lucide-react"
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

interface Department {
  id: number
  name: string
  code: string | null
  collegeId: number
  college: {
    name: string
    code: string
  }
  users: Array<{
    id: number
    name: string
    role: string
  }>
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>(undefined)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments")
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleDelete = async (department: Department) => {
    try {
      const response = await fetch(`/api/admin/departments/${department.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDepartments(departments.filter((d) => d.id !== department.id))
        setDeletingDepartment(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete department")
      }
    } catch (error) {
      console.error("Error deleting department:", error)
      alert("Failed to delete department")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingDepartment(undefined)
    fetchDepartments()
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage departments in the system</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Building className="h-5 w-5" />
            All Departments
          </CardTitle>
          <CardDescription>
            {departments.length} department{departments.length !== 1 ? "s" : ""} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Faculty Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>
                    {department.code ? <Badge variant="secondary">{department.code}</Badge> : "-"}
                  </TableCell>
                  <TableCell>{department.college.name} ({department.college.code})</TableCell>
                  <TableCell>{department.users.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDepartment(department)
                          setShowForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingDepartment(department)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? "Update department information" : "Create a new department in the system"}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            department={editingDepartment}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingDepartment(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingDepartment?.name}" and all associated data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDepartment && handleDelete(deletingDepartment)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}