// import { NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'
// import { getUserContext } from '@/lib/permissions'

// export async function POST(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//     const user = await getUserContext(session)
//     if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

//     const { id } = await params
//     const appraisalId = parseInt(id)

//     // Get appraisal with all achievements
//     const appraisal = await prisma.appraisal.findUnique({
//       where: { id: appraisalId },
//       include: {
//         faculty: true,
//         cycle: true,
//         researchActivities: true,
//         universityServices: true,
//         communityServices: true,
//         courses: true,
//         evaluations: true
//       }
//     })

//     if (!appraisal) {
//       return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })
//     }

//     // Check permissions
//     const canEvaluate = (
//       user.role === 'ADMIN' ||
//       (user.role === 'DEAN' && appraisal.faculty.role === 'HOD') ||
//       (user.role === 'HOD' && appraisal.faculty.role === 'INSTRUCTOR')
//     )

//     if (!canEvaluate) {
//       return NextResponse.json({ error: 'Not authorized to evaluate this appraisal' }, { status: 403 })
//     }

//     // Get grading config
//     const gradingConfig = await prisma.gradingConfig.findFirst({
//       where: {
//         OR: [
//           { cycleId: appraisal.cycleId, scope: 'CYCLE' },
//           { scope: 'GLOBAL' }
//         ]
//       },
//       orderBy: [
//         { scope: 'desc' },
//         { updatedAt: 'desc' }
//       ]
//     })

//     if (!gradingConfig) {
//       return NextResponse.json({ error: 'No grading configuration found' }, { status: 404 })
//     }

//     // Calculate scores
//     const researchScore = calculateResearchScore(appraisal.researchActivities, gradingConfig)
//     const teachingScore = calculateTeachingScore(appraisal.courses, gradingConfig)
//     const universityServiceScore = calculateServiceScore(appraisal.universityServices, gradingConfig.servicePointsPerItem, gradingConfig.serviceMaxPoints)
//     const communityServiceScore = calculateServiceScore(appraisal.communityServices, gradingConfig.servicePointsPerItem, gradingConfig.serviceMaxPoints)

//     const totalScore = researchScore + teachingScore + universityServiceScore + communityServiceScore

//     // Update evaluation
//     const evaluation = await prisma.evaluation.upsert({
//       where: {
//         appraisalId_role: {
//           appraisalId,
//           role: user.role as 'HOD' | 'DEAN'
//         }
//       },
//       update: {
//         researchPts: researchScore,
//         teachingQualityPts: teachingScore,
//         universityServicePts: universityServiceScore,
//         communityServicePts: communityServiceScore,
//         totalScore
//       },
//       create: {
//         appraisalId,
//         role: user.role as 'HOD' | 'DEAN',
//         researchPts: researchScore,
//         teachingQualityPts: teachingScore,
//         universityServicePts: universityServiceScore,
//         communityServicePts: communityServiceScore,
//         totalScore
//       }
//     })

//     // Update appraisal status if NEW
//     if (appraisal.status === 'NEW') {
//       await prisma.appraisal.update({
//         where: { id: appraisalId },
//         data: { status: 'IN_REVIEW' }
//       })
//     }

//     return NextResponse.json({
//       evaluation,
//       scores: {
//         research: researchScore,
//         teaching: teachingScore,
//         universityService: universityServiceScore,
//         communityService: communityServiceScore,
//         total: totalScore
//       }
//     })
//   } catch (error) {
//     console.error('Error computing all scores:', error)
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
//   }
// }

// function calculateResearchScore(researchActivities: any[], config: any): number {
//   // Simple implementation - count published papers
//   const publishedCount = researchActivities.filter(r => r.kind === 'PUBLISHED').length
//   return Math.min(publishedCount * 5, config.researchWeight) // Cap at weight
// }

// function calculateTeachingScore(courses: any[], config: any): number {
//   if (courses.length === 0) return 0
//   const avgEval = courses.reduce((sum, course) => sum + (course.studentsEvalAvg || 0), 0) / courses.length

//   // Map to bands based on average
//   if (avgEval >= 90) return config.teachingQualityWeight
//   if (avgEval >= 80) return config.teachingQualityWeight * 0.8
//   if (avgEval >= 60) return config.teachingQualityWeight * 0.6
//   if (avgEval >= 50) return config.teachingQualityWeight * 0.4
//   return config.teachingQualityWeight * 0.2
// }

// function calculateServiceScore(services: any[], pointsPerItem: number, maxPoints: number): number {
//   return Math.min(services.length * pointsPerItem, maxPoints)
// }




import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { assertEvaluatorAccess } from '@/lib/eval-access'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const appraisalId = Number(id)
  if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: 'Invalid appraisal id' }, { status: 400 })

  const access = await assertEvaluatorAccess(appraisalId, user)
  if (!access.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // مثال مبسّط لتجميع درجات من جداول أخرى (لا يغيّر Performance)
  const appraisal = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: { courses: true, communityServices: true },
  })

  // Teaching (متوسط studentsEvalAvg، سقوف يمكن إضافتها لاحقًا)
  const teachingQuality = appraisal?.courses.length
    ? appraisal!.courses.reduce((a,c)=>a+(c.studentsEvalAvg ?? 0), 0) / appraisal!.courses.length
    : 0

  // Community Service (مثال: عدد × 2)
  const communityPts = (appraisal?.communityServices.length ?? 0) * 2

  await prisma.evaluation.upsert({
    where: { appraisalId_role: { appraisalId, role: access.evaluatorRole } },
    update: { teachingQualityPts: teachingQuality, communityServicePts: communityPts },
    create: { appraisalId, role: access.evaluatorRole, teachingQualityPts: teachingQuality, communityServicePts: communityPts },
  })

  if (access.appraisal.status === 'NEW') {
    await prisma.appraisal.update({ where: { id: appraisalId }, data: { status: 'IN_REVIEW' } })
  }

  const path = user.role === 'DEAN' ? `/dean/reviews/${appraisalId}` : `/hod/reviews/${appraisalId}`
  revalidatePath(path)

  return NextResponse.json({ ok: true, appraisalId, teachingQuality, communityPts })
}
