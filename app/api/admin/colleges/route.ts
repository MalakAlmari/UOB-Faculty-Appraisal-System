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

    // Fetch colleges with departments and users
    const colleges = await prisma.college.findMany({
      include: {
        departments: {
          include: {
            users: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(colleges)
  } catch (error) {
    console.error("Error fetching colleges:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const college = await prisma.college.create({
      data: { name, code },
      include: {
        departments: {
          include: {
            users: true
          }
        }
      },
    })

    return NextResponse.json(college, { status: 201 })
  } catch (error: any) {
    console.error("Error creating college:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ error: "College name or code already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}