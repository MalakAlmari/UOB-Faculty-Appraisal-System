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
    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const college = await prisma.college.update({
      where: { id: parseInt(id) as any },
      data: { name, code },
      include: {
        departments: {
          include: {
            users: true
          }
        }
      },
    })

    return NextResponse.json(college)
  } catch (error: any) {
    console.error("Error updating college:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ error: "College name or code already exists" }, { status: 409 })
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "College not found" }, { status: 404 })
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
    await prisma.college.delete({
      where: { id: parseInt(id) as any },
    })

    return NextResponse.json({ message: "College deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting college:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ error: "College not found" }, { status: 404 })
    }

    if (error.code === "P2003") {
      return NextResponse.json({ error: "Cannot delete college with existing majors or users" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
