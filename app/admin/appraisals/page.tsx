"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Eye } from "lucide-react"
import Link from "next/link"

interface Appraisal {
  id: number
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
  status: string
  totalScore: number | null
  updatedAt: string
}

interface FilterOptions {
  cycles: { id: number, academicYear: string, semester: string }[]
  colleges: { id: number, name: string }[]
  departments: { id: number, name: string }[]
}

export default function AppraisalsPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [filters, setFilters] = useState<FilterOptions>({ cycles: [], colleges: [], departments: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cycleFilter, setCycleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [collegeFilter, setCollegeFilter] = useState<string>("ALL")
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL")

  const fetchData = async () => {
    try {
      const [appraisalsRes, cyclesRes, collegesRes, departmentsRes] = await Promise.all([
        fetch("/api/admin/appraisals"),
        fetch("/api/admin/appraisal-cycles"),
        fetch("/api/admin/colleges"),
        fetch("/api/admin/departments")
      ])

      if (appraisalsRes.ok) {
        const appraisalsData = await appraisalsRes.json()
        setAppraisals(appraisalsData)
      }

      if (cyclesRes.ok) {
        const cyclesData = await cyclesRes.json()
        setFilters(prev => ({ ...prev, cycles: cyclesData }))
      }

      if (collegesRes.ok) {
        const collegesData = await collegesRes.json()
        setFilters(prev => ({ ...prev, colleges: collegesData }))
      }

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json()
        setFilters(prev => ({ ...prev, departments: departmentsData }))
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

  const filteredAppraisals = appraisals.filter(appraisal => {
    const matchesSearch = searchQuery === "" ||
      appraisal.faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCycle = cycleFilter === "ALL" || appraisal.cycle.academicYear + " " + appraisal.cycle.semester === cycleFilter
    const matchesStatus = statusFilter === "ALL" || appraisal.status === statusFilter
    const matchesRole = roleFilter === "ALL" || appraisal.faculty.role === roleFilter
    const matchesCollege = collegeFilter === "ALL" || appraisal.faculty.department?.college.name === collegeFilter
    const matchesDepartment = departmentFilter === "ALL" || appraisal.faculty.department?.name === departmentFilter

    return matchesSearch && matchesCycle && matchesStatus && matchesRole && matchesCollege && matchesDepartment
  })

  const statusColors = {
    NEW: "bg-blue-100 text-blue-800",
    sent: "bg-green-100 text-green-800",
    complete: "bg-purple-100 text-purple-800",
    returned: "bg-red-100 text-red-800",
    new: "bg-gray-100 text-gray-800",
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Appraisals</h1>
        <p className="text-muted-foreground">System-wide appraisal observatory</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search faculty name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Cycles</SelectItem>
                {filters.cycles.map(cycle => (
                  <SelectItem key={cycle.id} value={`${cycle.academicYear} ${cycle.semester}`}>
                    {cycle.academicYear} {cycle.semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="HOD">HOD</SelectItem>
                <SelectItem value="DEAN">Dean</SelectItem>
              </SelectContent>
            </Select>
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Colleges</SelectItem>
                {filters.colleges.map(college => (
                  <SelectItem key={college.id} value={college.name}>{college.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {filters.departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Appraisals
          </CardTitle>
          <CardDescription>
            {filteredAppraisals.length} appraisal{filteredAppraisals.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Updated</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppraisals.map((appraisal) => (
                <TableRow key={appraisal.id}>
                  <TableCell className="font-medium">{appraisal.faculty.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{appraisal.faculty.role}</Badge>
                  </TableCell>
                  <TableCell>{appraisal.faculty.department?.college.name || "-"}</TableCell>
                  <TableCell>{appraisal.faculty.department?.name || "-"}</TableCell>
                  <TableCell>{appraisal.cycle.academicYear} {appraisal.cycle.semester}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[appraisal.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                      {appraisal.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{appraisal.totalScore || "-"}</TableCell>
                  <TableCell>{new Date(appraisal.updatedAt).toLocaleDateString()}</TableCell>
                  {/* <TableCell className="text-right">
                    <Link href={`/admin/appraisals/${appraisal.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}