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

    const cycles = await prisma.appraisalCycle.findMany({
      include: {
        _count: {
          select: {
            appraisals: true,
          },
        },
        gradingConfigs: true,
      },
      orderBy: {
        startDate: "desc"
      }
    })

    return NextResponse.json(cycles)
  } catch (error) {
    console.error("Error fetching appraisal cycles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { academicYear, startDate, endDate, isActive } = await request.json()

    if (!academicYear || !startDate || !endDate) {
      return NextResponse.json({ error: "Academic year, start date, and end date are required" }, { status: 400 })
    }

    const cycle = await prisma.appraisalCycle.create({
      data: {
        academicYear,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
      },
      include: {
        _count: {
          select: {
            appraisals: true,
          },
        },
        gradingConfigs: true,
      },
    })

    return NextResponse.json(cycle, { status: 201 })
  } catch (error: any) {
    console.error("Error creating appraisal cycle:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ error: "Appraisal cycle for this academic year already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}