import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EvaluationStatus, UserRole } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const appraisalId = Number(id)
    if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const appraisal = await prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
                collegeId: true,
                college: { select: { id: true, name: true } }
              }
            }
          },
        },
        cycle: {
          select: {
            academicYear: true,
            startDate: true,
            endDate: true,
            isActive: true
          }
        },
        evaluations: true,
        awards: true,
        courses: true,
        researchActivities: true,
        scientificActivities: true,
        universityServices: true,
        communityServices: true,
        evidences: true,
      },
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    // Check permissions
    const canView =
      session.user.id === appraisal.facultyId.toString() ||
      (session.user.role === UserRole.HOD &&
        session.user.departmentId === appraisal.faculty?.departmentId?.toString()) ||
      (session.user.role === UserRole.DEAN &&
        session.user.collegeId &&
        appraisal.faculty?.department?.collegeId?.toString() === session.user.collegeId) ||
      session.user.role === UserRole.ADMIN

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(appraisal)
  } catch (error) {
    console.error("Error fetching appraisal:", error)

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Connection timeout") || error.message.includes("connection pool")) {
        return NextResponse.json({
          error: "Database connection error. Please try again in a moment."
        }, { status: 503 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const appraisalId = Number(id)
    if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const { action, evaluations, comments, appealReason } = await request.json()

    const appraisal = await prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
                collegeId: true,
                college: { select: { id: true, name: true } }
              }
            }
          },
        },
        evaluations: true,
      },
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    // Permission checks
    const isFaculty = session.user.id === appraisal.facultyId.toString()
    const isHod = session.user.role === UserRole.HOD && session.user.departmentId === appraisal.faculty?.departmentId?.toString()
    const isDean = session.user.role === UserRole.DEAN && session.user.collegeId && appraisal.faculty?.department?.collegeId?.toString() === session.user.collegeId
    const isAdmin = session.user.role === UserRole.ADMIN

    let updateData: any = {}

    switch (action) {
      case "submit":
        if (!isFaculty) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        updateData = {
          status: EvaluationStatus.sent,
          submittedAt: new Date(),
        }
        break

      case "evaluate":
        if (!(isHod || isDean || isAdmin)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        // Update criteria evaluations and calculate final score
        let totalScore = 0
        let totalWeight = 0

        // TODO: Implement criteria evaluation logic when CriteriaEvaluation and EvaluationCriteria models are added to schema
        // if (evaluations && evaluations.length > 0) {
        //   for (const evaluation of evaluations) {
        //     // Criteria evaluation logic here
        //   }
        // }

        updateData = {
          evaluatorId: session.user.id,
          finalScore: totalWeight > 0 ? totalScore : null,
          comments,
          status: EvaluationStatus.sent,
          evaluatedAt: new Date(),
        }
        break

      case "approve":
        if (!isFaculty) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        updateData = {
          status: EvaluationStatus.complete,
          completedAt: new Date(),
        }
        break

      case "appeal":
        if (!isFaculty) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        updateData = {
          status: EvaluationStatus.returned,
          appealReason,
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedAppraisal = await prisma.appraisal.update({
      where: { id: appraisalId },
      data: updateData,
      include: {
        faculty: {
          select: {
            name: true,
            email: true,
          },
        },
        evaluations: true,
        cycle: {
          select: {
            academicYear: true,
          },
        },
      },
    })

    // TODO: Create notification when Notification model is added to schema
    // if (["evaluate", "approve", "appeal"].includes(action)) {
    //   const notificationUserId = action === "evaluate" ? appraisal.facultyId : updatedAppraisal.evaluations.find(e => e.role === (isDean ? UserRole.HOD : UserRole.DEAN))?.appraisalId
    //   if (notificationUserId) {
    //     await prisma.notification.create({
    //       data: {
    //         userId: notificationUserId,
    //         title: `Appraisal ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    //         message: `Your appraisal for ${updatedAppraisal.cycle.academicYear} has been ${action}.`,
    //         type: `APPRAISAL_${action.toUpperCase()}`,
    //       },
    //     })
    //   }
    // }

    return NextResponse.json(updatedAppraisal)
  } catch (error) {
    console.error("Error updating appraisal:", error)

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Connection timeout") || error.message.includes("connection pool")) {
        return NextResponse.json({
          error: "Database connection error. Please try again in a moment."
        }, { status: 503 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
