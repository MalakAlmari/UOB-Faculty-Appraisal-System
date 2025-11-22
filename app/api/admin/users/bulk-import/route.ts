import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function parseDate(d?: string): Date | null {
  if (!d) return null
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? null : dt
}

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@uob\.edu$/i

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      return unauthorized()
    }

    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return badRequest("Users array is required and cannot be empty")
    }

    if (users.length > 1000) {
      return badRequest("Maximum 1000 users can be imported at once")
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < users.length; i++) {
      const userData = users[i]

      try {
        // Basic validation
        if (!userData.email || !userData.name || !userData.role) {
          errors.push(`Row ${i + 1}: Missing required fields (email, name, role)`)
          failed++
          continue
        }

        // Email validation
        if (!EMAIL_RE.test(String(userData.email))) {
          errors.push(`Row ${i + 1}: Invalid email format (must end with @uob.edu)`)
          failed++
          continue
        }

        // Role validation
        const roleVal: UserRole | null =
          Object.values(UserRole).includes(userData.role) ? userData.role : null
        if (!roleVal) {
          errors.push(`Row ${i + 1}: Invalid role (must be ADMIN, DEAN, HOD, or INSTRUCTOR)`)
          failed++
          continue
        }

        // Status validation
        const statusVal: UserStatus =
          Object.values(UserStatus).includes(userData.status) ? userData.status : UserStatus.ACTIVE

        // Find department and college if provided
        let departmentId = null
        let collegeId = null

        if (userData.department) {
          const department = await prisma.department.findFirst({
            where: { name: { contains: userData.department, mode: 'insensitive' } }
          })
          if (department) {
            departmentId = department.id
            collegeId = department.collegeId
          }
        }

        if (userData.college && !collegeId) {
          const college = await prisma.college.findFirst({
            where: { name: { contains: userData.college, mode: 'insensitive' } }
          })
          if (college) {
            collegeId = college.id
          }
        }

        // Role-specific validation
        if (roleVal === UserRole.DEAN) {
          if (departmentId !== null) {
            errors.push(`Row ${i + 1}: DEAN must not have a department`)
            failed++
            continue
          }
        } else if (roleVal === UserRole.HOD || roleVal === UserRole.INSTRUCTOR) {
          if (departmentId === null) {
            errors.push(`Row ${i + 1}: HOD/INSTRUCTOR must have a department`)
            failed++
            continue
          }
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-12)
        const passwordHash = await bcrypt.hash(tempPassword, 12)

        // Create user
        await prisma.user.create({
          data: {
            email: String(userData.email).toLowerCase(),
            name: String(userData.name),
            role: roleVal,
            status: statusVal,
            passwordHash,
            departmentId: roleVal === UserRole.DEAN ? null : departmentId,
            collegeId: roleVal === UserRole.DEAN ? collegeId : null,
            idNumber: userData.idNumber || null,
            dateOfBirth: parseDate(userData.dateOfBirth),
            academicRank: userData.academicRank || null,
            nationality: userData.nationality || null,
            generalSpecialization: userData.generalSpecialization || null,
            specificSpecialization: userData.specificSpecialization || null,
            dateOfEmployment: parseDate(userData.dateOfEmployment),
            image: userData.image || null,
          },
        })

        imported++
      } catch (error: any) {
        console.error(`Error creating user at row ${i + 1}:`, error)
        if (error?.code === "P2002") {
          errors.push(`Row ${i + 1}: Email already exists`)
        } else {
          errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`)
        }
        failed++
      }
    }

    return NextResponse.json({
      imported,
      failed,
      errors: errors.slice(0, 10), // Return only first 10 errors
      totalProcessed: users.length
    })
  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}