import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, EvaluationStatus } from '@prisma/client';

// A helper to unify the shape of different achievement types
const transformAchievement = (item: any, type: string) => {
    const base = {
        id: `${type}-${item.id}`,
        type,
        faculty: item.appraisal.faculty.name,
        department: item.appraisal.faculty.department?.name ?? 'N/A',
        appraisalId: item.appraisalId,
        status: item.appraisal.status,
        cycle: `${item.appraisal.cycle.academicYear}`,
    };

    switch (type) {
        case 'Award': return { ...base, title: item.name, date: item.dateObtained };
        case 'Research': return { ...base, title: item.title, date: item.publicationDate };
        case 'Course': return { ...base, title: item.courseTitle, date: new Date(item.appraisal.cycle.startDate) }; // No specific date, use cycle start
        default: return { ...base, title: item.title || item.name, date: item.createdAt };
    }
};

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== UserRole.DEAN) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const statusParam = searchParams.get('status');
        const status = statusParam && Object.values(EvaluationStatus).includes(statusParam as EvaluationStatus)
            ? statusParam as EvaluationStatus
            : null;

        // Get dean's college ID
        const deanUser = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: { department: { select: { collegeId: true } } }
        });

        if (!deanUser?.department?.collegeId) {
            return NextResponse.json({ achievements: [], types: [] });
        }

        // Build the base where clause for appraisals
        const appraisalWhereClause: any = {
            faculty: {
                role: UserRole.HOD,
                department: {
                    collegeId: deanUser.department.collegeId
                }
            }
        };

        if (status) {
            appraisalWhereClause.status = status;
        }

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
            ...courses.map(item => ({ ...transformAchievement(item, 'Course'), title: item.courseTitle, date: new Date(item.appraisal.cycle.startDate) })),
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
        console.error('[DEAN_ACHIEVEMENTS_API] Error:', error);
        return new NextResponse(JSON.stringify({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
