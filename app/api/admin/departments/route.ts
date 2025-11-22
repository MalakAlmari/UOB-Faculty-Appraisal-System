import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const departments = await prisma.department.findMany({
      include: {
        college: true,
        users: true,
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, code, collegeId } = await request.json()

    if (!name || !collegeId) {
      return NextResponse.json({ error: "Name and collegeId are required" }, { status: 400 })
    }

    const department = await prisma.department.create({
      data: { name, code, collegeId },
      include: {
        college: true,
        users: true,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error: any) {
    console.error("Error creating department:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ error: "Department name or code already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}