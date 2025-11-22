// app/api/achievements/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client" // هذا لا يقوم بعمل ثقيل عادة

// ملاحظة: استورد prisma و authOptions داخل كل دالة لتجنّب تنفيذ عند import (وقت البناء)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // lazy imports — يمنع أي تنفيذ غير متوقع أثناء bundling
    const { getServerSession } = await import("next-auth/next")
    const { authOptions } = await import("@/lib/auth")
    const { prisma } = await import("@/lib/prisma")

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const achievement = await prisma.achievement.findUnique({
      where: { id },
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
      },
    })

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    const canView =
      session.user.id === achievement.userId ||
      (session.user.role === UserRole.HOD &&
        session.user.collegeId === achievement.collegeId &&
        session.user.majorId === achievement.majorId) ||
      (session.user.role === UserRole.DEAN && session.user.collegeId === achievement.collegeId) ||
      session.user.role === UserRole.ADMIN

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(achievement)
  } catch (error) {
    console.error("Error fetching achievement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { getServerSession } = await import("next-auth/next")
    const { authOptions } = await import("@/lib/auth")
    const { prisma } = await import("@/lib/prisma")

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { title, description, category, points, academicYear, dateAchieved, isVerified } = await request.json()

    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: "Achievement not found" }, { status: 404 })

    const canEdit =
      session.user.id === achievement.userId ||
      (session.user.role === UserRole.HOD &&
        session.user.collegeId === achievement.collegeId &&
        session.user.majorId === achievement.majorId) ||
      (session.user.role === UserRole.DEAN && session.user.collegeId === achievement.collegeId) ||
      session.user.role === UserRole.ADMIN

    if (!canEdit) return NextResponse.json({ error: "Access denied" }, { status: 403 })

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (points !== undefined) updateData.points = points
    if (academicYear !== undefined) updateData.academicYear = academicYear
    if (dateAchieved !== undefined) updateData.dateAchieved = new Date(dateAchieved)

    // ملاحظة: شرطك الحالي يسمح لأي دور غير INSTRUCTOR بتعيين isVerified — إن كان المقصود فقط ADMIN/HOD/DEAN عدّله حسب الحاجة
    if (isVerified !== undefined && session.user.role !== UserRole.INSTRUCTOR) {
      updateData.isVerified = isVerified
    }

    const updatedAchievement = await prisma.achievement.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        college: { select: { name: true } },
        major: { select: { name: true } },
      },
    })

    return NextResponse.json(updatedAchievement)
  } catch (error) {
    console.error("Error updating achievement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { getServerSession } = await import("next-auth/next")
    const { authOptions } = await import("@/lib/auth")
    const { prisma } = await import("@/lib/prisma")

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const achievement = await prisma.achievement.findUnique({ where: { id } })
    if (!achievement) return NextResponse.json({ error: "Achievement not found" }, { status: 404 })

    const canDelete =
      session.user.id === achievement.userId ||
      (session.user.role === UserRole.HOD &&
        session.user.collegeId === achievement.collegeId &&
        session.user.majorId === achievement.majorId) ||
      (session.user.role === UserRole.DEAN && session.user.collegeId === achievement.collegeId) ||
      session.user.role === UserRole.ADMIN

    if (!canDelete) return NextResponse.json({ error: "Access denied" }, { status: 403 })

    await prisma.achievement.delete({ where: { id } })

    return NextResponse.json({ message: "Achievement deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting achievement:", error)
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "Cannot delete achievement linked to appraisals" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




// import { type NextRequest, NextResponse } from "next/server"
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/lib/auth"
// import { prisma } from "@/lib/prisma"
// import { UserRole } from "@prisma/client"

// export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { id } = await params
//     const achievement = await prisma.achievement.findUnique({
//       where: { id },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             major: { select: { name: true } },
//           },
//         },
//         college: { select: { name: true } },
//         major: { select: { name: true } },
//         files: true,
//       },
//     })

//     if (!achievement) {
//       return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
//     }

//     // Check permissions
//     const canView =
//       session.user.id === achievement.userId ||
//       (session.user.role === UserRole.HOD &&
//         session.user.collegeId === achievement.collegeId &&
//         session.user.majorId === achievement.majorId) ||
//       (session.user.role === UserRole.DEAN && session.user.collegeId === achievement.collegeId) ||
//       session.user.role === UserRole.ADMIN

//     if (!canView) {
//       return NextResponse.json({ error: "Access denied" }, { status: 403 })
//     }

//     return NextResponse.json(achievement)
//   } catch (error) {
//     console.error("Error fetching achievement:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { id } = await params
//     const { title, description, category, points, academicYear, dateAchieved, isVerified } = await request.json()

//     const achievement = await prisma.achievement.findUnique({
//       where: { id },
//     })

//     if (!achievement) {
//       return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
//     }

//     // Check permissions
//     const canEdit =
//       session.user.id === achievement.userId ||
//       (session.user.role === UserRole.HOD &&
//         session.user.collegeId === achievement.collegeId &&
//         session.user.majorId === achievement.majorId) ||
//       (session.user.role === UserRole.DEAN && session.user.collegeId === achievement.collegeId) ||
//       session.user.role === UserRole.ADMIN

//     if (!canEdit) {
//       return NextResponse.json({ error: "Access denied" }, { status: 403 })
//     }

//     const updateData: any = {}

//     if (title !== undefined) updateData.title = title
//     if (description !== undefined) updateData.description = description
//     if (category !== undefined) updateData.category = category
//     if (points !== undefined) updateData.points = points
//     if (academicYear !== undefined) updateData.academicYear = academicYear
//     if (dateAchieved !== undefined) updateData.dateAchieved = new Date(dateAchieved)

//     // Only admins and higher can verify achievements
//     if (isVerified !== undefined && session.user.role !== UserRole.INSTRUCTOR) {
//       updateData.isVerified = isVerified
//     }

//     const updatedAchievement = await prisma.achievement.update({
//       where: { id },
//       data: updateData,
//       include: {
//         user: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true,
//           },
//         },
//         college: { select: { name: true } },
//         major: { select: { name: true } },
//       },
//     })

//     return NextResponse.json(updatedAchievement)
//   } catch (error) {
//     console.error("Error updating achievement:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { id } = await params
//     const achievement = await prisma.achievement.findUnique({
//       where: { id },
//     })

//     if (!achievement) {
//       return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
//     }

//     // Check permissions
//     const canDelete =
//       session.user.id === achievement.userId ||
//       (session.user.role === UserRole.HOD &&
//         session.user.collegeId === achievement.collegeId &&
//         session.user.majorId === achievement.majorId) ||
//       (session.user.role === UserRole.DEAN && session.user.collegeId === achievement.collegeId) ||
//       session.user.role === UserRole.ADMIN

//     if (!canDelete) {
//       return NextResponse.json({ error: "Access denied" }, { status: 403 })
//     }

//     await prisma.achievement.delete({
//       where: { id },
//     })

//     return NextResponse.json({ message: "Achievement deleted successfully" })
//   } catch (error: any) {
//     console.error("Error deleting achievement:", error)

//     if (error.code === "P2003") {
//       return NextResponse.json({ error: "Cannot delete achievement linked to appraisals" }, { status: 409 })
//     }

//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }
