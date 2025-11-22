"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Calendar, CheckCircle, Lock, Copy } from "lucide-react"

interface AppraisalCycle {
   id: number
   academicYear: string
   startDate: string
   endDate: string
   isActive: boolean
   _count: {
     appraisals: number
   }
 }

export default function CyclesPage() {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [settingActive, setSettingActive] = useState<AppraisalCycle | null>(null)
  const [lockingCycle, setLockingCycle] = useState<AppraisalCycle | null>(null)

  const fetchCycles = async () => {
    try {
      const response = await fetch("/api/admin/appraisal-cycles")
      if (response.ok) {
        const data = await response.json()
        setCycles(data)
      }
    } catch (error) {
      console.error("Error fetching cycles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCycles()
  }, [])

  const handleSetActive = async (cycle: AppraisalCycle) => {
    try {
      const response = await fetch(`/api/admin/appraisal-cycles/${cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      })

      if (response.ok) {
        fetchCycles()
        setSettingActive(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to set active")
      }
    } catch (error) {
      console.error("Error setting active:", error)
      alert("Failed to set active")
    }
  }

  const handleLock = async (cycle: AppraisalCycle) => {
    // TODO: Implement lock functionality
    alert("Lock functionality not implemented yet")
    setLockingCycle(null)
  }

  const handleCopyFromPrevious = async (cycle: AppraisalCycle) => {
    // TODO: Implement copy from previous
    alert("Copy from previous not implemented yet")
  }

  const handleCreateCycle = async (formData: FormData) => {
    const academicYear = formData.get("academicYear") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    try {
      const response = await fetch("/api/admin/appraisal-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear, startDate, endDate }),
      })

      if (response.ok) {
        fetchCycles()
        setShowCreateForm(false)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create cycle")
      }
    } catch (error) {
      console.error("Error creating cycle:", error)
      alert("Failed to create cycle")
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appraisal Cycles</h1>
          <p className="text-muted-foreground">Manage appraisal cycles</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Cycle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appraisal Cycles
          </CardTitle>
          <CardDescription>
            {cycles.length} cycle{cycles.length !== 1 ? "s" : ""} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Academic Year</TableHead>
                <TableHead>Active?</TableHead>
                <TableHead>Start/End</TableHead>
                <TableHead>Appraisals</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.academicYear}</TableCell>
                  <TableCell>
                    {cycle.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{cycle._count.appraisals}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!cycle.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettingActive(cycle)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLockingCycle(cycle)}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyFromPrevious(cycle)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Cycle Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Appraisal Cycle</DialogTitle>
            <DialogDescription>
              Create a new appraisal cycle
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreateCycle} className="space-y-4">
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input id="academicYear" name="academicYear" placeholder="2024/2025" required />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Active Alert */}
      <AlertDialog open={!!settingActive} onOpenChange={() => setSettingActive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Active Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              This will set "{settingActive?.academicYear}" as the active cycle.
              Only one cycle can be active at a time. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => settingActive && handleSetActive(settingActive)}
            >
              Set Active
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Cycle Alert */}
      <AlertDialog open={!!lockingCycle} onOpenChange={() => setLockingCycle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock "{lockingCycle?.academicYear}" preventing new edits.
              Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => lockingCycle && handleLock(lockingCycle)}
            >
              Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}