import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const appraisalId = parseInt(id)

    const appraisal = await prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: {
        researchActivities: true,
        universityServices: true,
        communityServices: true,
        courses: true
      }
    })

    if (!appraisal) {
      return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })
    }

    // Calculate research counts by kind
    const researchCounts = appraisal.researchActivities.reduce((acc, activity) => {
      acc[activity.kind] = (acc[activity.kind] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate service counts
    const universityServiceCount = appraisal.universityServices.length
    const communityServiceCount = appraisal.communityServices.length

    // Calculate average teaching evaluation
    const teachingAvg = appraisal.courses.length > 0
      ? appraisal.courses.reduce((sum, course) => sum + (course.studentsEvalAvg || 0), 0) / appraisal.courses.length
      : 0

    // Fetch all achievements for this appraisal
    const [
      awards,
      courses,
      research,
      scientific,
      university,
      community,
    ] = await Promise.all([
      prisma.award.findMany({ where: { appraisalId }, orderBy: { id: "desc" } }),
      prisma.courseTaught.findMany({ where: { appraisalId }, orderBy: { id: "desc" } }),
      prisma.researchActivity.findMany({ where: { appraisalId }, orderBy: { id: "desc" } }),
      prisma.scientificActivity.findMany({ where: { appraisalId }, orderBy: { id: "desc" } }),
      prisma.universityService.findMany({ where: { appraisalId }, orderBy: { id: "desc" } }),
      prisma.communityService.findMany({ where: { appraisalId }, orderBy: { id: "desc" } }),
    ])

    return NextResponse.json({
      awards,
      courses,
      research,
      scientific,
      university,
      community,
    })
  } catch (error) {
    console.error('Error fetching achievements summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}