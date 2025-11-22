// app/api/hod-appraisals/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { UserRole, EvaluationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== UserRole.HOD) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!user.departmentId) {
      return NextResponse.json({ appraisals: [], cycles: [] });
    }
    const departmentId = user.departmentId;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const status = searchParams.get('status') as EvaluationStatus;
    const search = searchParams.get('search');

    const whereClause: any = {
      faculty: { departmentId, role: UserRole.INSTRUCTOR },
    };

    if (cycleId) whereClause.cycleId = parseInt(cycleId);
    if (status) whereClause.status = status;
    if (search) {
      whereClause.faculty.name = { contains: search, mode: 'insensitive' };
    }

    // Fetch appraisals including evaluations
    const appraisals = await prisma.appraisal.findMany({
      where: whereClause,
      include: {
        faculty: { select: { id: true, name: true, department: true } },
        cycle: true,
        awards: true,
        courses: true,
        researchActivities: true,
        scientificActivities: true,
        communityServices: true,
        universityServices: true,
        evaluations: { 
          orderBy: { createdAt: 'desc' }, 
          include: { behaviorRatings: true } 
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Map evaluations array to single latest evaluation and normalize behaviorRatings
    const appraisalsWithEvaluation = appraisals.map(a => {
      const latestEval = a.evaluations?.[0] ?? null;
      const behaviorRatings = latestEval?.behaviorRatings ?? [];

      // Normalize capacities to exact names used in CSV
      const normalizedRatings = [
        { capacity: 'Institutional Commitment', points: behaviorRatings.find(b => /institutional/i.test(b.capacity))?.points ?? 0 },
        { capacity: 'Collaboration & Teamwork', points: behaviorRatings.find(b => /collaboration/i.test(b.capacity))?.points ?? 0 },
        { capacity: 'Professionalism', points: behaviorRatings.find(b => /professionalism/i.test(b.capacity))?.points ?? 0 },
        { capacity: 'Client Service', points: behaviorRatings.find(b => /client/i.test(b.capacity))?.points ?? 0 },
        { capacity: 'Achieving Results', points: behaviorRatings.find(b => /achieving/i.test(b.capacity))?.points ?? 0 },
      ];

      return {
        ...a,
        evaluation: latestEval
          ? {
              totalScore: latestEval.totalScore,
              researchPts: latestEval.researchPts,
              universityServicePts: latestEval.universityServicePts,
              communityServicePts: latestEval.communityServicePts,
              teachingQualityPts: latestEval.teachingQualityPts,
              behaviorRatings: normalizedRatings,
            }
          : {
              totalScore: 0,
              researchPts: 0,
              universityServicePts: 0,
              communityServicePts: 0,
              teachingQualityPts: 0,
              behaviorRatings: normalizedRatings,
            },
      };
    });

    const cycles = await prisma.appraisalCycle.findMany({
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ appraisals: appraisalsWithEvaluation, cycles });
  } catch (error) {
    console.error('[HOD_APPRAISALS_API]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
