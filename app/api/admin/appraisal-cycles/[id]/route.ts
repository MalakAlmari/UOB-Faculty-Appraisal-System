import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { isActive } = await request.json()
    const cycleId = parseInt(id)

    if (isActive) {
      // Set all cycles to inactive, then set this one to active
      await prisma.appraisalCycle.updateMany({
        data: { isActive: false },
      })
      await prisma.appraisalCycle.update({
        where: { id: cycleId },
        data: { isActive: true },
      })
    } else {
      // Just deactivate this one
      await prisma.appraisalCycle.update({
        where: { id: cycleId },
        data: { isActive: false },
      })
    }

    const updatedCycle = await prisma.appraisalCycle.findUnique({
      where: { id: cycleId },
      include: {
        _count: {
          select: {
            appraisals: true,
          },
        },
        gradingConfigs: true,
      },
    })

    return NextResponse.json(updatedCycle)
  } catch (error) {
    console.error("Error updating appraisal cycle:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}