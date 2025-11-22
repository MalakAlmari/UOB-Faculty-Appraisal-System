"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CollegeForm } from "@/components/admin/college-form"
import { DepartmentForm } from "@/components/admin/department-form"
import { Plus, Edit, Trash2, Building2, GraduationCap, Users, FileText } from "lucide-react"
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

interface College {
  id: string
  name: string
  code: string
  departments: Array<{
    users: Array<{
      role: string
    }>
  }>
  _count?: {
    departments: number
  }
  hodCount: number
  hodAppraisalsCount: number
}

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
  instructorCount: number
  appraisalsCount: number
}

export default function StructurePage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCollegeForm, setShowCollegeForm] = useState(false)
  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [editingCollege, setEditingCollege] = useState<College | undefined>(undefined)
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>(undefined)
  const [deletingCollege, setDeletingCollege] = useState<College | null>(null)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)

  const fetchData = async () => {
    try {
      const [collegesRes, departmentsRes] = await Promise.all([
        fetch("/api/admin/colleges"),
        fetch("/api/admin/departments")
      ])

      if (collegesRes.ok) {
        const collegesData = await collegesRes.json()
        // Enhance with counts
        const enhancedColleges = await Promise.all(collegesData.map(async (college: any) => {
          const hodCount = college.departments.flatMap((d: any) => d.users).filter((u: any) => u.role === 'HOD').length
          // For simplicity, assume current cycle, count appraisals for HODs in this college
          const hodAppraisalsCount = 0 // TODO: implement with actual cycle
          return { ...college, hodCount, hodAppraisalsCount }
        }))
        setColleges(enhancedColleges)
      }

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json()
        const enhancedDepartments = departmentsData.map((dept: any) => ({
          ...dept,
          instructorCount: dept.users.filter((u: any) => u.role === 'INSTRUCTOR').length,
          appraisalsCount: 0 // TODO: implement with actual cycle
        }))
        setDepartments(enhancedDepartments)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteCollege = async (college: College) => {
    try {
      const response = await fetch(`/api/admin/colleges/${college.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setColleges(colleges.filter((c) => c.id !== college.id))
        setDeletingCollege(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete college")
      }
    } catch (error) {
      console.error("Error deleting college:", error)
      alert("Failed to delete college")
    }
  }

  const handleDeleteDepartment = async (department: Department) => {
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
    setShowCollegeForm(false)
    setShowDepartmentForm(false)
    setEditingCollege(undefined)
    setEditingDepartment(undefined)
    fetchData()
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Colleges & Departments</h1>
        <p className="text-muted-foreground">CRUD for academic hierarchy</p>
      </div>

      <Tabs defaultValue="colleges" className="w-full">
        <TabsList>
          <TabsTrigger value="colleges">Colleges</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="colleges">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <Button onClick={() => setShowCollegeForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Create College
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Colleges
              </CardTitle>
              <CardDescription>
                {colleges.length} college{colleges.length !== 1 ? "s" : ""} in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>#Departments</TableHead>
                    <TableHead>#HODs</TableHead>
                    <TableHead>#HOD Appraisals (this cycle)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colleges.map((college) => (
                    <TableRow key={college.id}>
                      <TableCell className="font-medium">{college.name}</TableCell>
                      <TableCell>{college.departments.length}</TableCell>
                      <TableCell>{college.hodCount}</TableCell>
                      <TableCell>{college.hodAppraisalsCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCollege(college)
                              setShowCollegeForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCollege(college)}
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
        </TabsContent>

        <TabsContent value="departments">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <Button onClick={() => setShowDepartmentForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Department
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Departments
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
                    <TableHead>College</TableHead>
                    <TableHead>#Instructors</TableHead>
                    <TableHead>#Appraisals (this cycle)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{department.college.name}</TableCell>
                      <TableCell>{department.instructorCount}</TableCell>
                      <TableCell>{department.appraisalsCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDepartment(department)
                              setShowDepartmentForm(true)
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
        </TabsContent>
      </Tabs>

      {/* College Form Dialog */}
      <Dialog open={showCollegeForm} onOpenChange={setShowCollegeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollege ? "Edit College" : "Create College"}</DialogTitle>
            <DialogDescription>
              {editingCollege ? "Update college information" : "Create a new college in the system"}
            </DialogDescription>
          </DialogHeader>
          <CollegeForm
            college={editingCollege}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowCollegeForm(false)
              setEditingCollege(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Department Form Dialog */}
      <Dialog open={showDepartmentForm} onOpenChange={setShowDepartmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Create Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? "Update department information" : "Create a new department in the system"}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            department={editingDepartment}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowDepartmentForm(false)
              setEditingDepartment(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete College Alert */}
      <AlertDialog open={!!deletingCollege} onOpenChange={() => setDeletingCollege(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingCollege?.name}" and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCollege && handleDeleteCollege(deletingCollege)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Department Alert */}
      <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingDepartment?.name}" and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDepartment && handleDeleteDepartment(deletingDepartment)}
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