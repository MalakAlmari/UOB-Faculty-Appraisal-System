'use server'

import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AchievementViewer from '@/components/dean/achievement-viewer';
import EvaluationForm from '@/components/dean/evaluation-form';
import { EvaluationStatus, ResearchKind } from '@prisma/client';

// --- SERVER ACTIONS ---
async function computeAll(appraisalId: number) {
    'use server'
    const appraisal = await prisma.appraisal.findUnique({
        where: { id: appraisalId },
        include: { researchActivities: true, universityServices: true, communityServices: true, courses: true }
    });
    if (!appraisal) throw new Error('Appraisal not found');

    // Calculate scores based on the actual grading configuration
    const researchScore = appraisal.researchActivities.reduce((sum, activity) => {
        // Use the actual research kind values from the database
        switch (activity.kind) {
            case ResearchKind.PUBLISHED: return sum + 10;
            case ResearchKind.ACCEPTED: return sum + 8;
            case ResearchKind.REFEREED_PAPER: return sum + 4;
            default: return sum + 2;
        }
    }, 0);

    const universityServiceScore = Math.min(appraisal.universityServices.length * 4, 20);
    const communityServiceScore = Math.min(appraisal.communityServices.length * 4, 20);

    const teachingScore = appraisal.courses.length > 0
        ? appraisal.courses.reduce((sum, course) => sum + (course.studentsEvalAvg || 0), 0) / appraisal.courses.length
        : 0;

    const totalScore = researchScore + universityServiceScore + communityServiceScore + teachingScore;

    await prisma.$transaction([
        prisma.evaluation.upsert({
            where: { appraisalId_role: { appraisalId, role: 'HOD' } },
            update: {
                researchPts: researchScore,
                universityServicePts: universityServiceScore,
                communityServicePts: communityServiceScore,
                teachingQualityPts: teachingScore,
                totalScore
            },
            create: {
                appraisalId,
                role: 'HOD',
                researchPts: researchScore,
                universityServicePts: universityServiceScore,
                communityServicePts: communityServiceScore,
                teachingQualityPts: teachingScore,
                totalScore
            },
        }),
        prisma.appraisal.update({
            where: { id: appraisalId },
            data: {
                researchScore,
                universityServiceScore,
                communityServiceScore,
                teachingQualityScore: teachingScore,
                totalScore,
                status: EvaluationStatus.sent
            },
        })
    ]);
    revalidatePath(`/hod/reviews/${appraisalId}`);
}

async function sendScores(appraisalId: number) {
    await prisma.appraisal.update({
        where: { id: appraisalId },
        data: { status: EvaluationStatus.sent },
    });
    revalidatePath(`/hod/reviews/${appraisalId}`);
}

// --- DATA FETCHING ---
async function getAppraisalData(appraisalId: number, hodUserId: number) {
    const hod = await prisma.user.findUnique({ where: { id: hodUserId }, include: { department: true } });
    const appraisal = await prisma.appraisal.findUnique({
        where: { id: appraisalId },
        include: {
            faculty: { include: { department: true } },
            cycle: true,
            evaluations: true,
            awards: true, courses: true, researchActivities: true, scientificActivities: true, universityServices: true, communityServices: true,
        }
    });

    if (!appraisal || appraisal.faculty.departmentId !== hod?.departmentId || appraisal.faculty.role !== 'INSTRUCTOR' || appraisal.facultyId === hodUserId) {
        return null;
    }
    return appraisal;
}

// --- PAGE COMPONENT ---
export default async function ReviewPage({ params }: { params: Promise<{ appraisalId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        notFound();
    }

    // Check if user is HOD
    if (session.user.role !== 'HOD') {
        notFound();
    }

    const { appraisalId: appraisalIdStr } = await params;
    const appraisalId = parseInt(appraisalIdStr, 10);

    if (isNaN(appraisalId)) {
        notFound();
    }

    const appraisal = await getAppraisalData(appraisalId, parseInt(session.user.id));

    if (!appraisal) {
        notFound();
    }

    const { faculty, cycle, status } = appraisal;

    return (
        <div className="p-6 space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Instructor Appraisal Review</CardTitle>
                            <p className="text-muted-foreground">{faculty.name} - {faculty.department?.name ?? 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">
                                {cycle.academicYear} ({new Date(cycle.startDate).getFullYear()} - {new Date(cycle.endDate).getFullYear()})
                            </p>
                            <Badge>{status}</Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="achievements">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                </TabsList>
                <TabsContent value="achievements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Achievements</CardTitle>
                            <p className="text-muted-foreground">Read-only view of the instructor's submitted achievements.</p>
                        </CardHeader>
                        <CardContent>
                            <AchievementViewer appraisal={appraisal} />
                        </CardContent>
                    </Card>
                </TabsContent>
<TabsContent value="evaluation">
  <EvaluationForm
    appraisalId={appraisal.id}
    role="HOD"
  />
</TabsContent>
            </Tabs>
        </div>
    );
}