import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number(params.id)
    const body = await request.json()
    const {
      email,
      name,
      role,
      status,
      password,
      collegeId,
      departmentId,
      idNumber,
      dateOfBirth,
      academicRank,
      nationality,
      generalSpecialization,
      specificSpecialization,
      dateOfEmployment,
      image,
    } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Email, name, and role are required" }, { status: 400 })
    }

    if (!email.endsWith("@uob.edu")) {
      return NextResponse.json({ error: "Email must end with @uob.edu" }, { status: 400 })
    }

    let passwordHash: string | undefined
    if (password) {
      passwordHash = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email,
        name,
        role,
        status: status || UserStatus.ACTIVE,
        ...(passwordHash && { passwordHash }),
        collegeId: collegeId ? Number(collegeId) : null,
        departmentId: departmentId ? Number(departmentId) : null,
        idNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        academicRank,
        nationality,
        generalSpecialization,
        specificSpecialization,
        dateOfEmployment: dateOfEmployment ? new Date(dateOfEmployment) : null,
        image,
      },
      include: {
        department: { include: { college: true } },
        college: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ========== DELETE: حذف مستخدم ==========
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = Number(id)

    // First, delete all related appraisals to avoid foreign key constraint
    await prisma.appraisal.deleteMany({
      where: { facultyId: userId }
    })

    // Then delete the user
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
