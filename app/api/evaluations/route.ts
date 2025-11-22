import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, EvaluationStatus, EvaluationRole } from "@prisma/client"
import { getUserContext, canEvaluateAppraisal } from "@/lib/permissions"

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

    const { appraisalId, role, researchPts, universityServicePts, communityServicePts, teachingQualityPts, notes, behaviorRatings } = await request.json()

    if (!appraisalId || !role) {
      return NextResponse.json({ error: "Appraisal ID and role are required" }, { status: 400 })
    }

    // Get the appraisal to check permissions
    const appraisal = await prisma.appraisal.findUnique({
      where: { id: parseInt(appraisalId) },
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
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    // Check if user can evaluate this appraisal
    if (!canEvaluateAppraisal(user, appraisal)) {
      return NextResponse.json({ error: "You don't have permission to evaluate this appraisal" }, { status: 403 })
    }

    // Check if evaluation already exists
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        appraisalId_role: {
          appraisalId: parseInt(appraisalId),
          role: role as EvaluationRole
        }
      }
    })

    const evaluationData = {
      researchPts: researchPts || null,
      universityServicePts: universityServicePts || null,
      communityServicePts: communityServicePts || null,
      teachingQualityPts: teachingQualityPts || null,
      totalScore: (researchPts || 0) + (universityServicePts || 0) + (communityServicePts || 0) + (teachingQualityPts || 0),
      notes: notes || null,
      submittedAt: new Date(),
    }

    let evaluation
    if (existingEvaluation) {
      // Update existing evaluation
      evaluation = await prisma.evaluation.update({
        where: {
          appraisalId_role: {
            appraisalId: parseInt(appraisalId),
            role: role as EvaluationRole
          }
        },
        data: evaluationData,
        include: {
          behaviorRatings: true
        }
      })

      // Update behavior ratings if provided
      if (behaviorRatings && Array.isArray(behaviorRatings)) {
        await prisma.behaviorRating.deleteMany({
          where: { evaluationId: evaluation.id }
        })

        for (const rating of behaviorRatings) {
          await prisma.behaviorRating.create({
            data: {
              evaluationId: evaluation.id,
              capacity: rating.capacity,
              band: rating.band,
              points: rating.points,
            }
          })
        }
      }
    } else {
      // Create new evaluation
      evaluation = await prisma.evaluation.create({
        data: {
          appraisalId: parseInt(appraisalId),
          role: role as EvaluationRole,
          startedAt: new Date(),
          ...evaluationData,
        },
        include: {
          behaviorRatings: true
        }
      })

      // Create behavior ratings if provided
      if (behaviorRatings && Array.isArray(behaviorRatings)) {
        for (const rating of behaviorRatings) {
          await prisma.behaviorRating.create({
            data: {
              evaluationId: evaluation.id,
              capacity: rating.capacity,
              band: rating.band,
              points: rating.points,
            }
          })
        }
      }
    }

    // Update appraisal status to sent if it was new
    if (appraisal.status === EvaluationStatus.new) {
      await prisma.appraisal.update({
        where: { id: parseInt(appraisalId) },
        data: { status: EvaluationStatus.sent }
      })
    }

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error("Error creating/updating evaluation:", error)
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

    const { appraisalId, role, action } = await request.json()

    if (!appraisalId || !role || !action) {
      return NextResponse.json({ error: "Appraisal ID, role, and action are required" }, { status: 400 })
    }

    // Get the appraisal
    const appraisal = await prisma.appraisal.findUnique({
      where: { id: parseInt(appraisalId) },
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
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    // Check permissions
    if (!canEvaluateAppraisal(user, appraisal)) {
      return NextResponse.json({ error: "You don't have permission to perform this action" }, { status: 403 })
    }

    let newStatus: EvaluationStatus

    if (action === 'send_scores') {
      newStatus = EvaluationStatus.sent
      // Update the appraisal with reviewer timestamps
      const updateData: any = {}
      if (role === EvaluationRole.HOD) {
        updateData.hodReviewedAt = new Date()
      } else if (role === EvaluationRole.DEAN) {
        updateData.deanReviewedAt = new Date()
      }

      await prisma.appraisal.update({
        where: { id: parseInt(appraisalId) },
        data: updateData
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update appraisal status
    const updatedAppraisal = await prisma.appraisal.update({
      where: { id: parseInt(appraisalId) },
      data: { status: newStatus },
      include: {
        faculty: {
          include: {
            department: {
              include: {
                college: true
              }
            }
          }
        },
        evaluations: {
          include: {
            behaviorRatings: true
          }
        }
      }
    })

    return NextResponse.json(updatedAppraisal)
  } catch (error) {
    console.error("Error updating evaluation status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}