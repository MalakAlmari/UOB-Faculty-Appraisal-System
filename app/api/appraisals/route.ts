import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, EvaluationStatus } from "@prisma/client"
import { getUserContext, canViewDepartmentAppraisals, canViewCollegeAppraisals, canViewOwnAppraisal } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserContext(session)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const facultyId = searchParams.get('facultyId')

    let where: any = {}

    if (cycleId) {
      where.cycleId = parseInt(cycleId)
    }

    if (facultyId) {
      where.facultyId = parseInt(facultyId)
    }

    // Apply role-based filtering
    if (user.role === UserRole.ADMIN) {
      // Admin can see all
    } else if (user.role === UserRole.DEAN) {
      // Dean can see HOD appraisals in their college
      where.faculty = {
        role: UserRole.HOD,
        department: {
          college: {
            departments: {
              some: {
                users: {
                  some: {
                    id: parseInt(user.id)
                  }
                }
              }
            }
          }
        }
      }
    } else if (user.role === UserRole.HOD) {
      // HOD can see instructor appraisals in their department
      where.faculty = {
        role: UserRole.INSTRUCTOR,
        departmentId: parseInt(user.departmentId!)
      }
    } else if (user.role === UserRole.INSTRUCTOR) {
      // Instructor can only see their own
      where.facultyId = parseInt(user.id)
    }

    const appraisals = await prisma.appraisal.findMany({
      where,
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
        cycle: true,
        evaluations: {
          include: {
            behaviorRatings: true
          }
        },
        awards: true,
        courses: true,
        researchActivities: true,
        scientificActivities: true,
        universityServices: true,
        communityServices: true,
        evidences: true,
        appeals: true,
        signatures: true,
        _count: {
          select: {
            awards: true,
            courses: true,
            researchActivities: true,
            scientificActivities: true,
            universityServices: true,
            communityServices: true,
            evidences: true,
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })

    return NextResponse.json(appraisals)
  } catch (error) {
    console.error("Error fetching appraisals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Only instructors can create their own appraisals
    if (user.role !== UserRole.INSTRUCTOR) {
      return NextResponse.json({ error: "Only instructors can create appraisals" }, { status: 403 })
    }

    const { cycleId } = await request.json()

    if (!cycleId) {
      return NextResponse.json({ error: "Cycle ID is required" }, { status: 400 })
    }

    // Check if appraisal already exists
    const existing = await prisma.appraisal.findFirst({
      where: {
        facultyId: parseInt(user.id),
        cycleId: parseInt(cycleId)
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Appraisal already exists for this cycle" }, { status: 409 })
    }

    const appraisal = await prisma.appraisal.create({
      data: {
        facultyId: parseInt(user.id),
        cycleId: parseInt(cycleId),
        status: EvaluationStatus.NEW,
      },
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
        cycle: true,
      }
    })

    return NextResponse.json(appraisal, { status: 201 })
  } catch (error) {
    console.error("Error creating appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
