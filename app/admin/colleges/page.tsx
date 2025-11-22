"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CollegeForm } from "@/components/admin/college-form"
import { Plus, Edit, Trash2, Building2 } from "lucide-react"
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
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCollege, setEditingCollege] = useState<College | undefined>(undefined)
  const [deletingCollege, setDeletingCollege] = useState<College | null>(null)

  const fetchColleges = async () => {
    try {
      const response = await fetch("/api/admin/colleges")
      if (response.ok) {
        const data = await response.json()
        setColleges(data)
      }
    } catch (error) {
      console.error("Error fetching colleges:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchColleges()
  }, [])

  const handleDelete = async (college: College) => {
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

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCollege(undefined)
    fetchColleges()
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Colleges</h1>
          <p className="text-muted-foreground">Manage colleges in the system</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add College
        </Button>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Building2 className="h-5 w-5" />
            All Colleges
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
                <TableHead>Code</TableHead>
                <TableHead>Majors</TableHead>
                <TableHead>Deans</TableHead>
                <TableHead>HODs</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college.id}>
                  <TableCell className="font-medium">{college.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{college.code}</Badge>
                  </TableCell>
                  <TableCell>{college.departments.length}</TableCell>
                  <TableCell>{college.departments.flatMap(d => d.users).filter(u => u.role === 'DEAN').length}</TableCell>
                  <TableCell>{college.departments.flatMap(d => d.users).filter(u => u.role === 'HOD').length}</TableCell>
                  <TableCell>{college.departments.flatMap(d => d.users).filter(u => u.role === 'INSTRUCTOR').length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCollege(college)
                          setShowForm(true)
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollege ? "Edit College" : "Add New College"}</DialogTitle>
            <DialogDescription>
              {editingCollege ? "Update college information" : "Create a new college in the system"}
            </DialogDescription>
          </DialogHeader>
          <CollegeForm
            college={editingCollege}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingCollege(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCollege} onOpenChange={() => setDeletingCollege(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingCollege?.name}" and all associated data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCollege && handleDelete(deletingCollege)}
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
