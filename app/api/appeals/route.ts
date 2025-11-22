import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, EvaluationStatus } from "@prisma/client"
import { getUserContext } from "@/lib/permissions"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserContext(session)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Only instructors can submit appeals
    if (user.role !== UserRole.INSTRUCTOR) {
      return NextResponse.json({ error: "Only instructors can submit appeals" }, { status: 403 })
    }

    const { appraisalId, message } = await request.json()

    if (!appraisalId || !message) {
      return NextResponse.json({ error: "Appraisal ID and message are required" }, { status: 400 })
    }

    // Check if appraisal belongs to user and is in SCORES_SENT status
    const appraisal = await prisma.appraisal.findFirst({
      where: {
        id: parseInt(appraisalId),
        facultyId: parseInt(user.id),
        status: EvaluationStatus.sent
      }
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found or not eligible for appeal" }, { status: 404 })
    }

    // Create appeal
    const appeal = await prisma.appeal.create({
      data: {
        appraisalId: parseInt(appraisalId),
        byUserId: parseInt(user.id),
        message,
      }
    })

    // Update appraisal status to returned
    await prisma.appraisal.update({
      where: { id: parseInt(appraisalId) },
      data: { status: EvaluationStatus.returned }
    })

    return NextResponse.json(appeal, { status: 201 })
  } catch (error) {
    console.error("Error creating appeal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserContext(session)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { appealId, resolutionNote } = await request.json()

    if (!appealId) {
      return NextResponse.json({ error: "Appeal ID is required" }, { status: 400 })
    }

    // Get the appeal and check permissions
    const appeal = await prisma.appeal.findUnique({
      where: { id: parseInt(appealId) },
      include: {
        appraisal: {
          include: {
            faculty: {
              include: {
                department: {
                  include: {
                    college: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 })
    }

    // Check if user can resolve this appeal
    const canResolve = (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.DEAN && appeal.appraisal.faculty.role === UserRole.HOD && appeal.appraisal.faculty.department?.collegeId?.toString() === user.collegeId) ||
      (user.role === UserRole.HOD && appeal.appraisal.faculty.role === UserRole.INSTRUCTOR && appeal.appraisal.faculty.departmentId?.toString() === user.departmentId)
    )

    if (!canResolve) {
      return NextResponse.json({ error: "You don't have permission to resolve this appeal" }, { status: 403 })
    }

    // Resolve the appeal
    const updatedAppeal = await prisma.appeal.update({
      where: { id: parseInt(appealId) },
      data: {
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || null,
      }
    })

    // Update appraisal status back to sent for re-evaluation
    await prisma.appraisal.update({
      where: { id: appeal.appraisalId },
      data: { status: EvaluationStatus.sent }
    })

    return NextResponse.json(updatedAppeal)
  } catch (error) {
    console.error("Error resolving appeal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}