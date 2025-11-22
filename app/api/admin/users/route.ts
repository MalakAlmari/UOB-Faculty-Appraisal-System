import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

// -------- Helpers --------
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}
function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
function parseDate(d?: unknown): Date | null {
  if (!d) return null
  const v = typeof d === "string" ? d : String(d)
  const dt = new Date(v)
  return isNaN(dt.getTime()) ? null : dt
}
function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "none") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@uob\.edu$/i

// =============== GET ===============
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      return unauthorized()
    }

    const users = await prisma.user.findMany({
      include: {
        department: { include: { college: true } },
        college: true, 
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// =============== POST ===============
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      return unauthorized()
    }

    const payload = await request.json()

    const {
      email,
      name,
      role,
      status,
      password,
      // علاقات
      departmentId: departmentIdRaw,
      collegeId: collegeIdRaw,
      // حقول إضافية
      idNumber,
      dateOfBirth: dobRaw,
      academicRank,
      nationality,
      generalSpecialization,
      specificSpecialization,
      dateOfEmployment: doeRaw,
      image,
    } = payload ?? {}

    // --- Basic requireds ---
    if (!email || !name || !role || !password) {
      return badRequest("Email, name, role, and password are required")
    }

    // --- Email domain check ---
    if (!EMAIL_RE.test(String(email))) {
      return badRequest("Email must be a valid @uob.edu address")
    }

    // --- Role validation ---
    const roleVal: UserRole | null =
      Object.values(UserRole).includes(role) ? role : null
    if (!roleVal) {
      return badRequest("Invalid role")
    }

    // --- Status (default ACTIVE) ---
    const statusVal: UserStatus =
      Object.values(UserStatus).includes(status) ? status : UserStatus.ACTIVE

    // --- IDs normalization ---
    const departmentId = toNumOrNull(departmentIdRaw)
    const collegeId = toNumOrNull(collegeIdRaw)

    // --- Role-specific rules ---
    if (roleVal === UserRole.DEAN) {
      // DEAN: لا قسم. يفضَّل وجود كلية (إن نظامك يعتمدها)
      if (departmentId !== null) {
        return badRequest("DEAN must not have a departmentId")
      }
      // if (collegeId === null) return badRequest("collegeId is required for DEAN")
    } else if (roleVal === UserRole.HOD || roleVal === UserRole.INSTRUCTOR) {
      // HOD/INSTRUCTOR: قسم إلزامي
      if (departmentId === null) {
        return badRequest("departmentId is required for HOD/INSTRUCTOR")
      }
    } // ADMIN: كلاهما اختياري

    // --- Dates ---
    const dateOfBirth = parseDate(dobRaw)
    const dateOfEmployment = parseDate(doeRaw)

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(String(password), 12)

    // --- Create user ---
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        name: String(name),
        role: roleVal,
        status: statusVal,
        passwordHash,
        // العلاقات
        departmentId: roleVal === UserRole.DEAN ? null : departmentId,
        collegeId: roleVal === UserRole.DEAN ? collegeId : null,
        // الحقول الإضافية
        idNumber: idNumber ?? null,
        dateOfBirth,
        academicRank: academicRank ?? null,
        nationality: nationality ?? null,
        generalSpecialization: generalSpecialization ?? null,
        specificSpecialization: specificSpecialization ?? null,
        dateOfEmployment,
        image: image ?? null,
      },
      include: {
        department: { include: { college: true } },
        college: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)

    // Prisma unique constraint
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
