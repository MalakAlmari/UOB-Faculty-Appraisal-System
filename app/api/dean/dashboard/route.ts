import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { UserRole, Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || (session.user.role !== UserRole.DEAN && session.user.role !== UserRole.ADMIN)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleIdParam = searchParams.get('cycleId')
    const departmentIdParam = searchParams.get('departmentId')

const me = await prisma.user.findUnique({
  where: { id: Number(session.user.id) },
  include: { department: true, college: true },
})

const collegeId =
  me?.collegeId ??
  me?.college?.id ??
  me?.department?.collegeId

    // cycles list (do NOT use startDate)
    const cycles = await prisma.appraisalCycle.findMany({
      orderBy: [{ academicYear: 'desc' }],
    })
    if (!collegeId || !cycles.length) {
      return NextResponse.json({
        kpis: {},
        charts: { byStatus: [], byDepartment: [] },
        recentActions: [],
        filters: { cycles, departments: [] }
      })
    }

    // 2) pick target cycle (active or by query)
    const targetCycle = cycleIdParam
      ? await prisma.appraisalCycle.findUnique({ where: { id: Number(cycleIdParam) } })
      : await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
    if (!targetCycle) {
      return NextResponse.json({
        kpis: {},
        charts: { byStatus: [], byDepartment: [] },
        recentActions: [],
        filters: { cycles, departments: [] }
      })
    }

    // 3) Build where directly (no need to prefetch HOD IDs)
    const where: Prisma.AppraisalWhereInput = {
      cycleId: targetCycle.id,
      faculty: {
        role: 'HOD',
        department: {
          collegeId: Number(collegeId),
          ...(departmentIdParam ? { id: Number(departmentIdParam) } : {})
        }
      }
    }

    // 4) Fetch appraisals
    const appraisals = await prisma.appraisal.findMany({
      where,
      include: {
        faculty: { include: { department: true } }
      }
    })

    // 5) KPIs
    const totalAppraisals = appraisals.length
    const validScores = appraisals.map(a => a.totalScore).filter((s): s is number => typeof s === 'number')
    const avgTotalScore = validScores.length ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0

    const statusCounts = appraisals.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {})

    // by department
    const byDeptAgg = appraisals.reduce<Record<string, { scores: number[]; count: number }>>((acc, a) => {
      const dept = a.faculty.department?.name ?? 'Unknown'
      if (!acc[dept]) acc[dept] = { scores: [], count: 0 }
      if (typeof a.totalScore === 'number') acc[dept].scores.push(a.totalScore)
      acc[dept].count++
      return acc
    }, {})
    const byDepartment = Object.entries(byDeptAgg).map(([department, { scores }]) => ({
      department,
      average: scores.length ? Number((scores.reduce((x, y) => x + y, 0) / scores.length).toFixed(2)) : 0
    }))

    // 6) recent appeals (HOD appraisals only)
    const recentAppeals = await prisma.appeal.findMany({
      where: {
        appraisal: {
          cycleId: targetCycle.id,
          faculty: { role: 'HOD', department: { collegeId: Number(collegeId) } }
        }
      },
      include: { appraisal: { include: { faculty: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // 7) filters: departments in this college
    const departments = await prisma.department.findMany({
      where: { collegeId: Number(collegeId) },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      kpis: {
        activeCycle: { id: targetCycle.id, name: `${targetCycle.academicYear}` },
        hodAppraisals: totalAppraisals,
        avgTotalScore: Number(avgTotalScore.toFixed(2)),
        statusDistribution: statusCounts
      },
      charts: {
        byStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        byDepartment
      },
      recentActions: recentAppeals,
      filters: { cycles, departments }
    })
  } catch (error) {
    console.error('[DEAN_DASHBOARD_API]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
