import { NextResponse } from "next/server"
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

const appraisals = await prisma.appraisal.findMany({
  select: {
    id: true,
    status: true,
    updatedAt: true,
    totalScore: true,
    researchScore: true,
    universityServiceScore: true,
    communityServiceScore: true,
    teachingQualityScore: true,
    faculty: {
      select: {
        id: true,
        name: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
            college: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    },
    cycle: {
      select: {
        academicYear: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    },
  },
  orderBy: { updatedAt: "desc" },
})


    return NextResponse.json(appraisals)
  } catch (error) {
    console.error("Error fetching appraisals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}