import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, code, collegeId } = await request.json()

    if (!name || !collegeId) {
      return NextResponse.json({ error: "Name and collegeId are required" }, { status: 400 })
    }

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name, code, collegeId },
      include: {
        college: true,
        users: true,
      },
    })

    return NextResponse.json(department)
  } catch (error: any) {
    console.error("Error updating department:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ error: "Department name or code already exists" }, { status: 409 })
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.department.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting department:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    if (error.code === "P2003") {
      return NextResponse.json({ error: "Cannot delete department with existing users" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}