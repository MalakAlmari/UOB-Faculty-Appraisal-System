import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
    }

    // Get global config or cycle-specific config
    const config = await prisma.gradingConfig.findFirst({
      where: {
        OR: [
          { cycleId: parseInt(cycleId), scope: 'CYCLE' },
          { scope: 'GLOBAL' }
        ]
      },
      orderBy: [
        { scope: 'desc' }, // CYCLE first, then GLOBAL
        { updatedAt: 'desc' }
      ]
    })

    if (!config) {
      return NextResponse.json({ error: 'No grading config found' }, { status: 404 })
    }

    return NextResponse.json({
      id: config.id,
      scope: config.scope,
      cycleId: config.cycleId,
      weights: {
        research: config.researchWeight,
        universityService: config.universityServiceWeight,
        communityService: config.communityServiceWeight,
        teaching: config.teachingQualityWeight
      },
      serviceParams: {
        pointsPerItem: config.servicePointsPerItem,
        maxPoints: config.serviceMaxPoints
      },
      teachingBands: config.teachingBands,
      researchMap: config.researchMap,
      updatedAt: config.updatedAt
    })
  } catch (error) {
    console.error('Error fetching effective grading config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}