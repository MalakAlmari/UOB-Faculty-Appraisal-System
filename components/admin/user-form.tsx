"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, User } from "lucide-react"

type UserRole = "ADMIN" | "DEAN" | "HOD" | "INSTRUCTOR"
type UserStatus = "ACTIVE" | "INACTIVE"

interface Department {
  id: number
  name: string
  college: { id: number; name: string }
}
interface College { id: number; name: string }

interface UserFormProps {
  user?: any
  onSuccess: () => void
  onCancel: () => void
}

/** عناصر عرضية */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
)

const Row = ({
  label, htmlFor, children, hint,
}: { label: string; htmlFor?: string; children: React.ReactNode; hint?: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {hint}
  </div>
)

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  // ------- مصادر البيانات -------
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [role, setRole] = useState<UserRole>(user?.role ?? "INSTRUCTOR")
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(user?.status ?? "ACTIVE")
  const [image, setImage] = useState<string>(user?.image ?? "")

  const [collegeId, setCollegeId] = useState<string>(user?.collegeId ? String(user.collegeId) : "none")
  const [departmentId, setDepartmentId] = useState<string>(user?.departmentId ? String(user.departmentId) : "none")

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/admin/departments")
        if (res.ok) setDepartments(await res.json())
      } catch (err) {
        console.error(err)
      }
    }
    fetchDepartments()
  }, [])

  const colleges: College[] = useMemo(() => {
    const map = new Map<number, string>()
    for (const d of departments) map.set(d.college.id, d.college.name)
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [departments])

 
  useEffect(() => {
    if (role === "DEAN") {
      setDepartmentId("none")
    }
  }, [role])

  useEffect(() => {
    
      if (departmentId !== "none") {
        const dep = departments.find(d => String(d.id) === departmentId)
        if (dep) setCollegeId(String(dep.college.id))
      } else {
        setCollegeId("none")
      
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, role, departments])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const fd = new FormData(e.currentTarget)

      const email = String(fd.get("email") || "").trim()
      const name = String(fd.get("name") || "").trim()
      const password = String(fd.get("password") || "")

      // تحقق بسيط
      if (!email) throw new Error("Email is required")
      if (!/^[A-Za-z0-9._%+-]+@uob\.edu$/.test(email)) throw new Error("Email must end with @uob.edu")
      if (!name) throw new Error("Full name is required")
      if (!user && !password) throw new Error("Password is required for new users")
      // القسم مطلوب إذا لم يكن الدور DEAN
      if (role !== "DEAN" && (departmentId === "none")) throw new Error("Department is required")

      const idNumber = String(fd.get("idNumber") || "") || null
      const dateOfBirthRaw = String(fd.get("dateOfBirth") || "")
      const academicRank = String(fd.get("academicRank") || "") || null
      const nationality = String(fd.get("nationality") || "") || null
      const generalSpecialization = String(fd.get("generalSpecialization") || "") || null
      const specificSpecialization = String(fd.get("specificSpecialization") || "") || null
      const dateOfEmploymentRaw = String(fd.get("dateOfEmployment") || "")

      const body: any = {
        email,
        name,
        role,
        status,
        collegeId: collegeId !== "none" ? Number(collegeId) : null,
        departmentId: departmentId !== "none" ? Number(departmentId) : null,
        idNumber,
        dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
        academicRank,
        nationality,
        generalSpecialization,
        specificSpecialization,
        dateOfEmployment: dateOfEmploymentRaw ? new Date(dateOfEmploymentRaw) : null,
        image: image || null,
      }
      if (!user || password) body.password = password

      const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save user")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">{user ? "Edit User" : "Add New User"}</CardTitle>
        <CardDescription>{user ? "Update user information" : "Create a new user in the system"}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Identity */}
          <Section title="Identity">
            <Row label="Full Name" htmlFor="fullName">
              <Input
                id="fullName"
                name="name"
                autoFocus
                defaultValue={user?.name ?? ""}
                autoComplete="name"
              />
            </Row>

            <Row
              label="Email"
              htmlFor="email"
              hint={<p className="text-xs">Email must end with <span className="font-mono">@uob.edu</span></p>}
            >
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email ?? ""}
                placeholder="user@uob.edu"
                inputMode="email"
                autoComplete="email"
                pattern="^[A-Za-z0-9._%+-]+@uob\.edu$"
              />
            </Row>
          </Section>

          <div className="h-px bg-border" />

          {/* Profile Image */}
          <Section title="Profile Image">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={image} alt={user?.name || "User"} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            setImage(e.target?.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                      input.click()
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {image ? 'Change Image' : 'Upload Image'}
                  </Button>
                  {image && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImage("")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a profile image (JPG, PNG, GIF). Recommended size: 200x200px.
                </p>
              </div>
            </div>
          </Section>

          <div className="h-px bg-border" />

          {/* Role & Status */}
          <Section title="Role & Status">
            <Row label="Role" htmlFor="role">
              <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DEAN">Dean</SelectItem>
                  <SelectItem value="HOD">Head of Department</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row label="Status" htmlFor="status">
              <Select value={status} onValueChange={(v: UserStatus) => setStatus(v)}>
                <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </Section>

          <div className="h-px bg-border" />

          {/* Affiliation */}
          <Section title="Affiliation">
            <Row
              label="College"
              htmlFor="college"
              
            >
              <Select
                value={collegeId}
                onValueChange={setCollegeId}
                
              >
                <SelectTrigger id="college"><SelectValue placeholder="Select college" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No College</SelectItem>
                  {colleges.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {/* إخفاء القسم عند DEAN */}
            {role !== "DEAN" && (
              <Row label="Department" htmlFor="department">
                <Select
                  value={departmentId}
                  onValueChange={setDepartmentId}
                >
                  <SelectTrigger id="department"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} ({d.college.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            )}
          </Section>

          <div className="h-px bg-border" />

          {/* Personal Details */}
          <Section title="Personal Details">
            <Row label="ID Number" htmlFor="idNumber">
              <Input id="idNumber" name="idNumber" defaultValue={user?.idNumber ?? ""} autoComplete="off" />
            </Row>

            <Row label="Date of Birth" htmlFor="dob">
              <Input id="dob" name="dateOfBirth" type="date" defaultValue={user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : ""} />
            </Row>

            <Row label="Academic Rank" htmlFor="rank">
              <Input id="rank" name="academicRank" defaultValue={user?.academicRank ?? ""} />
            </Row>

            <Row label="Nationality" htmlFor="nationality">
              <Input id="nationality" name="nationality" defaultValue={user?.nationality ?? ""} />
            </Row>

            <Row label="General Specialization" htmlFor="genSpec">
              <Input id="genSpec" name="generalSpecialization" defaultValue={user?.generalSpecialization ?? ""} />
            </Row>

            <Row label="Specific Specialization" htmlFor="specSpec">
              <Input id="specSpec" name="specificSpecialization" defaultValue={user?.specificSpecialization ?? ""} />
            </Row>

            <Row label="Date of Employment" htmlFor="doe">
              <Input id="doe" name="dateOfEmployment" type="date" defaultValue={user?.dateOfEmployment ? user.dateOfEmployment.split("T")[0] : ""} />
            </Row>
          </Section>

          <div className="h-px bg-border" />

          {/* Security */}
          <Section title="Security">
            <Row label={`Password ${!user ? "(required)" : ""}`} htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={user ? "Leave blank to keep current password" : "Enter password"}
              />
            </Row>
          </Section>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Update" : "Create"} User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
