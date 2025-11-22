import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireDean } from '@/lib/auth-utils'
import { EvaluationStatus } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const dean = await requireDean()
    const { searchParams } = new URL(req.url)
    const cycleIdParam = searchParams.get('cycleId')

    const me = await prisma.user.findUnique({
      where: { id: Number(dean.id) },
      include: { department: { select: { id: true, name: true, collegeId: true } } },
    })

    // const collegeId = (me as any)?.collegeId ?? me?.department?.collegeId
    const collegeId = me?.department?.collegeId
    const cycles = await prisma.appraisalCycle.findMany({
      orderBy: [{ academicYear: 'desc' }],
    })

    if (!collegeId) {
      return NextResponse.json({
        cycles,
        kpis: { avgTotal: 0, completionRate: 0, sentCount: 0, completeCount: 0, returnedCount: 0, total: 0 },
        byDepartment: [],
        totalsTrend: [],
        sectionAverages: [],
      })
    }

    const fallbackCycleId = cycles.find(c => c.isActive)?.id ?? cycles[0]?.id
    const cycleId = Number(cycleIdParam || fallbackCycleId)

    const departments = await prisma.department.findMany({
      where: { collegeId: Number(collegeId) },
      select: { id: true, name: true },
    })

    const collegeApps = await prisma.appraisal.findMany({
      where: { cycleId, faculty: { role: 'INSTRUCTOR', department: { collegeId: Number(collegeId) } } },
      select: { totalScore: true, status: true },
    })
    const total = collegeApps.length
    const sentCount = collegeApps.filter(a => a.status === EvaluationStatus.sent).length
    const completeCount = collegeApps.filter(a => a.status === EvaluationStatus.complete).length
    const returnedCount = collegeApps.filter(a => a.status === EvaluationStatus.returned).length
    const completionRate = total ? completeCount / total : 0
    const avgTotal = avg(collegeApps.map(a => a.totalScore ?? 0))

    const byDepartment = await Promise.all(
      departments.map(async d => {
        const apps = await prisma.appraisal.findMany({
          where: { cycleId, faculty: { role: 'INSTRUCTOR', departmentId: d.id } },
          select: { totalScore: true, status: true },
        })
        const deptTotal = apps.length
        const complete = apps.filter(a => a.status === EvaluationStatus.complete).length
        return {
          department: d.name,
          avgTotal: avg(apps.map(a => a.totalScore ?? 0)),
          completeRate: deptTotal ? Number((complete / deptTotal).toFixed(2)) : 0,
          facultyCount: deptTotal,
        }
      })
    )

    const evals = await prisma.evaluation.findMany({
      where: {
        role: 'HOD',
        appraisal: { cycleId, faculty: { role: 'INSTRUCTOR', department: { collegeId: Number(collegeId) } } },
      },
      select: {
        researchPts: true,
        universityServicePts: true,
        communityServicePts: true,
        teachingQualityPts: true,
      },
    })
    const sectionAverages = [
      { section: 'Research',           avg: avg(evals.map(e => e.researchPts ?? 0)) },
      { section: 'University Service', avg: avg(evals.map(e => e.universityServicePts ?? 0)) },
      { section: 'Community Service',  avg: avg(evals.map(e => e.communityServicePts ?? 0)) },
      { section: 'Teaching',           avg: avg(evals.map(e => e.teachingQualityPts ?? 0)) },
    ]

    const trendCycles = cycles.slice().reverse().slice(0, 8).reverse()
    const totalsTrend = await Promise.all(
      trendCycles.map(async c => {
        const apps = await prisma.appraisal.findMany({
          where: { cycleId: c.id, faculty: { role: 'INSTRUCTOR', department: { collegeId: Number(collegeId) } } },
          select: { totalScore: true },
        })
        return { label: `${c.academicYear}`, avgTotal: avg(apps.map(x => x.totalScore ?? 0)) }
      })
    )

    return NextResponse.json({
      cycles,
      kpis: { avgTotal, completionRate, sentCount, completeCount, returnedCount, total },
      byDepartment,
      totalsTrend,
      sectionAverages,
    })
  } catch (error) {
    console.error('[DEAN_ANALYTICS_API]', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return new NextResponse(JSON.stringify({ message }), { status: 500 })
  }
}

function avg(arr: Array<number | null | undefined>) {
  const nums = arr.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : 0
}
