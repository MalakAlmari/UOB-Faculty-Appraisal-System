import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHOD } from '@/lib/auth-utils'

export async function GET(req: Request) {
  const user = await requireHOD()
  const { searchParams } = new URL(req.url)
  const cycleIdParam = searchParams.get('cycleId')

  const hod = await prisma.user.findUnique({
    where: { id: Number(user.id) },
    include: { department: true }
  })
  if (!hod?.departmentId) return NextResponse.json({ error: 'No department' }, { status: 400 })

  // cycles
  const cycles = await prisma.appraisalCycle.findMany({ orderBy: [{ academicYear: 'desc' }] })
  const active = cycles.find(c => c.isActive)
  const cycleId = Number(cycleIdParam || active?.id || cycles[0]?.id)

  // appraisals for department + cycle
  const appraisals = await prisma.appraisal.findMany({
    where: { cycleId, faculty: { departmentId: hod.departmentId, role: 'INSTRUCTOR' } },
    include: {
      faculty: { select: { name: true } },
      evaluations: { where: { role: 'HOD' }, select: { researchPts: true, universityServicePts: true, communityServicePts: true, teachingQualityPts: true } }
    }
  })

  const total = appraisals.length
  const sentCount = appraisals.filter(a => a.status === 'sent').length
  const completeCount = appraisals.filter(a => a.status === 'complete').length
  const returnedCount = appraisals.filter(a => a.status === 'returned').length
  const completionRate = total ? completeCount / total : 0
  const avgTotal = avg(appraisals.map(a => a.totalScore ?? 0))

  const statusMap: Record<string, number> = {}
  for (const a of appraisals) statusMap[a.status] = (statusMap[a.status] || 0) + 1
  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  // section averages from HOD evaluation (if present)
  const secVectors = appraisals.map(a => {
    const e = a.evaluations[0]
    return {
      research: e?.researchPts ?? null,
      universityService: e?.universityServicePts ?? null,
      communityService: e?.communityServicePts ?? null,
      teaching: e?.teachingQualityPts ?? null,
    }
  })
  const sectionAverages = [
    { section: 'Research',          avg: avg(secVectors.map(v => v.research)) },
    { section: 'University Service',avg: avg(secVectors.map(v => v.universityService)) },
    { section: 'Community Service', avg: avg(secVectors.map(v => v.communityService)) },
    { section: 'Teaching',          avg: avg(secVectors.map(v => v.teaching)) },
  ]

  const topFaculty = appraisals
    .map(a => ({ name: a.faculty.name, total: a.totalScore ?? 0, status: a.status }))
    .sort((x, y) => y.total - x.total)
    .slice(0, 10)

  // trend across recent cycles (department)
  const allCycles = cycles.slice().reverse().slice(0, 8).reverse() // latest 8
  const totalsTrend = await Promise.all(allCycles.map(async c => {
    const depApps = await prisma.appraisal.findMany({
      where: { cycleId: c.id, faculty: { departmentId: hod.departmentId, role: 'INSTRUCTOR' } },
      select: { totalScore: true }
    })
    return { label: `${c.academicYear}`, avgTotal: avg(depApps.map(x => x.totalScore ?? 0)) }
  }))

  return NextResponse.json({
    cycles,
    kpis: { avgTotal, completionRate, sentCount, completeCount, returnedCount, total },
    statusDistribution,
    sectionAverages,
    topFaculty,
    totalsTrend,
  })
}

function avg(arr: Array<number | null | undefined>) {
  const nums = arr.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : 0
}
