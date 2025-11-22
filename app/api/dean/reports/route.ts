import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== UserRole.DEAN && session.user.role !== UserRole.ADMIN)) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const cycleId = searchParams.get('cycleId');
        const departmentId = searchParams.get('departmentId');
        const includeTopBottom = searchParams.get('includeTopBottom') === 'true';

        if (!cycleId) {
            return new NextResponse('Cycle ID is required', { status: 400 });
        }

        const userWithDept = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) }, include: { department: true } });
        if (!userWithDept?.department?.collegeId) {
            return NextResponse.json({ message: 'No data available.' });
        }
        const collegeId = userWithDept.department.collegeId;

        const departmentFilter = departmentId ? { id: parseInt(departmentId) } : { collegeId };

        const appraisals = await prisma.appraisal.findMany({
            where: {
                cycleId: parseInt(cycleId),
                faculty: {
                    role: 'HOD',
                    department: departmentFilter,
                }
            },
            include: { faculty: { include: { department: true } } }
        });

        if (appraisals.length === 0) {
            return NextResponse.json({ message: 'No appraisals found for the selected criteria.' });
        }

        const scores = appraisals.map(a => a.totalScore).filter((s): s is number => s !== null);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const statusDistribution = appraisals.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        let topHods = [], bottomHods = [];
        if (includeTopBottom) {
            const sortedAppraisals = appraisals.filter(a => a.totalScore !== null).sort((a, b) => b.totalScore! - a.totalScore!);
            if (sortedAppraisals.length > 0) {
                topHods.push({ name: sortedAppraisals[0].faculty.name, score: sortedAppraisals[0].totalScore });
            }
            if (sortedAppraisals.length > 1) {
                bottomHods.push({ name: sortedAppraisals[sortedAppraisals.length - 1].faculty.name, score: sortedAppraisals[sortedAppraisals.length - 1].totalScore });
            }
        }

        const reportData = {
            kpis: {
                totalAppraisals: appraisals.length,
                averageScore: avgScore,
                statusDistribution,
            },
            departmentTable: appraisals.map(a => ({
                name: a.faculty.department?.name ?? 'N/A',
                hod: a.faculty.name,
                score: a.totalScore,
                status: a.status,
            })),
            topHods,
            bottomHods,
            generatedAt: new Date().toISOString(),
        };

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('[DEAN_REPORTS_API]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
