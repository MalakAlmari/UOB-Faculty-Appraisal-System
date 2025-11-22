import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, EvaluationStatus } from '@prisma/client';

// A helper to unify the shape of different achievement types
const transformAchievement = (item: any, type: string) => {
    // Safely extract faculty information
    const faculty = item.appraisal?.faculty;
    const cycle = item.appraisal?.cycle;

    if (!faculty || !cycle) {
        console.error('Missing faculty or cycle data for achievement:', item.id);
        return null;
    }

    const base = {
        id: `${type}-${item.id}`,
        type,
        faculty: faculty.name || 'Unknown',
        department: faculty.department?.name ?? 'N/A',
        appraisalId: item.appraisalId,
        status: item.appraisal.status,
        cycle: cycle.academicYear || 'Unknown',
    };

    switch (type) {
        case 'Award':
            return { ...base, title: item.name || 'Untitled Award', date: item.dateObtained };
        case 'Research':
            return { ...base, title: item.title || 'Untitled Research', date: item.publicationDate };
        case 'Course':
            return { ...base, title: item.courseTitle || 'Untitled Course', date: cycle.startDate ? new Date(cycle.startDate) : new Date() };
        case 'Scientific':
            return { ...base, title: item.title || 'Untitled Scientific Activity', date: item.date };
        case 'University':
            return { ...base, title: item.committeeOrTask || 'Untitled University Service', date: item.dateFrom };
        case 'Community':
            return { ...base, title: item.committeeOrTask || 'Untitled Community Service', date: item.dateFrom };
        default:
            return { ...base, title: item.title || item.name || 'Untitled Achievement', date: item.createdAt };
    }
};

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== UserRole.HOD) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const statusParam = searchParams.get('status');

        // Properly handle status parameter
        let status: EvaluationStatus | null = null;
        if (statusParam && statusParam !== 'all' && statusParam !== '') {
            const validStatuses = Object.values(EvaluationStatus);
            if (validStatuses.includes(statusParam as EvaluationStatus)) {
                status = statusParam as EvaluationStatus;
            }
        }

        // Get HOD's department ID
        const hodUser = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: { departmentId: true }
        });

        if (!hodUser?.departmentId) {
            return NextResponse.json({ achievements: [], types: [] });
        }

        // Build the base where clause for appraisals
        const appraisalWhereClause: any = {
            faculty: {
                departmentId: hodUser.departmentId,
                role: UserRole.INSTRUCTOR // Only instructors, not other HODs or deans
            },
            ...(status && { status })
        };

        let results: any[] = [];

        // Fetch all achievement types with correct relationship structure
        const [
            awards,
            courses,
            research,
            scientific,
            university,
            community,
        ] = await Promise.all([
            (!type || type === 'Award') ? prisma.award.findMany({
                where: { appraisal: appraisalWhereClause },
                include: {
                    appraisal: {
                        include: {
                            faculty: {
                                include: { department: true }
                            },
                            cycle: true
                        }
                    }
                }
            }) : [],
            (!type || type === 'Course') ? prisma.courseTaught.findMany({
                where: { appraisal: appraisalWhereClause },
                include: {
                    appraisal: {
                        include: {
                            faculty: {
                                include: { department: true }
                            },
                            cycle: true
                        }
                    }
                }
            }) : [],
            (!type || type === 'Research') ? prisma.researchActivity.findMany({
                where: { appraisal: appraisalWhereClause },
                include: {
                    appraisal: {
                        include: {
                            faculty: {
                                include: { department: true }
                            },
                            cycle: true
                        }
                    }
                }
            }) : [],
            (!type || type === 'Scientific') ? prisma.scientificActivity.findMany({
                where: { appraisal: appraisalWhereClause },
                include: {
                    appraisal: {
                        include: {
                            faculty: {
                                include: { department: true }
                            },
                            cycle: true
                        }
                    }
                }
            }) : [],
            (!type || type === 'University') ? prisma.universityService.findMany({
                where: { appraisal: appraisalWhereClause },
                include: {
                    appraisal: {
                        include: {
                            faculty: {
                                include: { department: true }
                            },
                            cycle: true
                        }
                    }
                }
            }) : [],
            (!type || type === 'Community') ? prisma.communityService.findMany({
                where: { appraisal: appraisalWhereClause },
                include: {
                    appraisal: {
                        include: {
                            faculty: {
                                include: { department: true }
                            },
                            cycle: true
                        }
                    }
                }
            }) : [],
        ]);

        // Transform and combine all achievements, filtering out null values
        const allAchievements = [
            ...awards.map(item => transformAchievement(item, 'Award')),
            ...courses.map(item => transformAchievement(item, 'Course')),
            ...research.map(item => transformAchievement(item, 'Research')),
            ...scientific.map(item => transformAchievement(item, 'Scientific')),
            ...university.map(item => transformAchievement(item, 'University')),
            ...community.map(item => transformAchievement(item, 'Community')),
        ].filter(Boolean) as any[]; // Remove null values and cast to array

        results.push(...allAchievements);

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            results = results.filter(r =>
                (r.title && r.title.toLowerCase().includes(searchLower)) ||
                (r.faculty && r.faculty.toLowerCase().includes(searchLower))
            );
        }

        // Sort by date (most recent first) - handle null dates safely
        results.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });

        // Get unique achievement types for filter dropdown
        const uniqueTypes = [...new Set(results.map(r => r.type))].sort();

        return NextResponse.json({
            achievements: results,
            types: uniqueTypes,
            total: results.length
        });

    } catch (error) {
        console.error('[HOD_ACHIEVEMENTS_API] Error:', error);
        return new NextResponse(JSON.stringify({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}