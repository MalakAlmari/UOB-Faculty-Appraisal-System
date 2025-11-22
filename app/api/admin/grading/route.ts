import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get("cycleId")

    const config = await prisma.gradingConfig.findFirst({
      where: cycleId ? { cycleId: parseInt(cycleId) } : { scope: "GLOBAL" },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(config || {
      researchWeight: 30,
      universityServiceWeight: 20,
      communityServiceWeight: 20,
      teachingQualityWeight: 30,
      servicePointsPerItem: 4,
      serviceMaxPoints: 20,
      teachingBands: [],
      researchMap: {},
    })
  } catch (error) {
    console.error("Error fetching grading config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      scope,
      cycleId,
      researchWeight,
      universityServiceWeight,
      communityServiceWeight,
      teachingQualityWeight,
      servicePointsPerItem,
      serviceMaxPoints,
      teachingBands,
      researchMap,
    } = await request.json()

    const config = await prisma.gradingConfig.create({
      data: {
        scope: scope || "GLOBAL",
        cycleId: cycleId ? parseInt(cycleId) : null,
        researchWeight: researchWeight || 30,
        universityServiceWeight: universityServiceWeight || 20,
        communityServiceWeight: communityServiceWeight || 20,
        teachingQualityWeight: teachingQualityWeight || 30,
        servicePointsPerItem: servicePointsPerItem || 4,
        serviceMaxPoints: serviceMaxPoints || 20,
        teachingBands: teachingBands || [],
        researchMap: researchMap || {},
      },
    })

    return NextResponse.json(config, { status: 201 })
  } catch (error) {
    console.error("Error creating grading config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}