import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category")
    const academicYear = searchParams.get("academicYear")
    const isVerified = searchParams.get("isVerified")

    const whereClause: any = {}

    // Role-based filtering
    if ((session.user.role as any) === "INSTRUCTOR") {
      whereClause.userId = session.user.id
    } else if ((session.user.role as any) === "HOD") {
      whereClause.collegeId = (session.user as any).collegeId
      whereClause.majorId = (session.user as any).majorId
    } else if ((session.user.role as any) === "DEAN") {
      whereClause.collegeId = (session.user as any).collegeId
    }

    // Additional filters
    if (userId) whereClause.userId = userId
    if (category) whereClause.category = category
    if (academicYear) whereClause.academicYear = academicYear
    if (isVerified !== null) whereClause.isVerified = isVerified === "true"

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            major: { select: { name: true } },
          },
        },
        college: { select: { name: true } },
        major: { select: { name: true } },
        files: true,
        _count: {
          select: {
            appraisalAchievements: true,
          },
        },
      },
      orderBy: { dateAchieved: "desc" },
    })

    return NextResponse.json(achievements)
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, appraisalId, ...achievementData } = body

    if (!type || !appraisalId) {
      return NextResponse.json({ error: "Type and appraisalId are required" }, { status: 400 })
    }

    let result

    // Handle different achievement types
    switch (type) {
      case "awards":
        if (!achievementData.name || !achievementData.generatingOrganization) {
          return NextResponse.json({ error: "Name and generating organization are required" }, { status: 400 })
        }
        result = await prisma.award.create({
          data: {
            appraisalId: parseInt(appraisalId),
            name: achievementData.name,
            area: achievementData.generatedArea,
            organization: achievementData.generatingOrganization,
            dateObtained: achievementData.dateObtained ? new Date(achievementData.dateObtained) : null,
            fileUrl: achievementData.attachment,
            fileKey: achievementData.attachment
          }
        })
        break

      case "courses":
        if (!achievementData.courseTitle || achievementData.courseCredit === undefined || achievementData.studentsCount === undefined) {
          return NextResponse.json({ error: "Course title, credit, and student count are required" }, { status: 400 })
        }
        result = await prisma.courseTaught.create({
          data: {
            appraisalId: parseInt(appraisalId),
            academicYear: achievementData.academicYear,
            semester: achievementData.semester === "First" ? "FALL" : achievementData.semester === "Second" ? "SPRING" : "SUMMER",
            courseTitle: achievementData.courseTitle,
            credit: achievementData.courseCredit,
            studentsCount: achievementData.studentsCount
          }
        })
        break

      case "researchPublished":
      case "researchArticle":
        if (!achievementData.title) {
          return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }
        result = await prisma.researchActivity.create({
          data: {
            appraisalId: parseInt(appraisalId),
            title: achievementData.title,
            kind: type === "researchPublished" ? "PUBLISHED" : "ACCEPTED",
            journalOrPublisher: achievementData.nameOfTheJournal,
            publicationDate: achievementData.dateOfPublication ? new Date(achievementData.dateOfPublication) : null,
            fileUrl: achievementData.attachment,
            fileKey: achievementData.attachment
          }
        })
        break

      case "scientific":
        if (!achievementData.title) {
          return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }
        result = await prisma.scientificActivity.create({
          data: {
            appraisalId: parseInt(appraisalId),
            title: achievementData.title,
            type: achievementData.type || "CONFERENCE",
            date: achievementData.date ? new Date(achievementData.date) : null,
            organizingAuth: achievementData.organizingAuthority,
            venue: achievementData.venue,
            fileUrl: achievementData.attachment,
            fileKey: achievementData.attachment
          }
        })
        break

      case "universityService":
        if (!achievementData.committeeOrTask) {
          return NextResponse.json({ error: "Committee or task is required" }, { status: 400 })
        }
        result = await prisma.universityService.create({
          data: {
            appraisalId: parseInt(appraisalId),
            committeeOrTask: achievementData.committeeOrTask,
            authority: achievementData.authority,
            participation: achievementData.natureOfParticipation,
            dateFrom: achievementData.dateFrom ? new Date(achievementData.dateFrom) : null,
            dateTo: achievementData.dateTo ? new Date(achievementData.dateTo) : null,
            fileUrl: achievementData.attachment,
            fileKey: achievementData.attachment
          }
        })
        break

      case "communityService":
        if (!achievementData.committeeOrTask) {
          return NextResponse.json({ error: "Committee or task is required" }, { status: 400 })
        }
        result = await prisma.communityService.create({
          data: {
            appraisalId: parseInt(appraisalId),
            committeeOrTask: achievementData.committeeOrTask,
            authority: achievementData.authority,
            participation: achievementData.natureOfParticipation,
            dateFrom: achievementData.dateFrom ? new Date(achievementData.dateFrom) : null,
            dateTo: achievementData.dateTo ? new Date(achievementData.dateTo) : null,
            fileUrl: achievementData.attachment,
            fileKey: achievementData.attachment
          }
        })
        break

      default:
        return NextResponse.json({ error: "Invalid achievement type" }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating achievement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
