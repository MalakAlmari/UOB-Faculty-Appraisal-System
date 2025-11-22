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

// /api/admin/appeals (المقطع المهم)
const appeals = await prisma.appeal.findMany({
  select: {
    id: true,
    message: true,
    createdAt: true,
    resolvedAt: true,
    resolutionNote: true,
    byUserId: true,

    appraisal: {
      select: {
        id: true,
        status: true,
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
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        cycle: {
          select: {
            academicYear: true,
            semester: true,
          },
        },
      },
    },
  },
  orderBy: { createdAt: "desc" },
})

    return NextResponse.json(appeals)
  } catch (error) {
    console.error("Error fetching appeals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}