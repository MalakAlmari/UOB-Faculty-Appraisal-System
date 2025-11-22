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

    const universityServiceScore = Math.min(appraisal.universityServices.length * 4, 30);
    const communityServiceScore = Math.min(appraisal.communityServices.length * 4, 20);

    const teachingScore = appraisal.courses.length > 0
        ? appraisal.courses.reduce((sum, course) => sum + (course.studentsEvalAvg || 0), 0) / appraisal.courses.length
        : 0;

    const totalScore = researchScore + universityServiceScore + communityServiceScore + teachingScore;

    await prisma.$transaction([
        prisma.evaluation.upsert({
            where: { appraisalId_role: { appraisalId, role: 'DEAN' } },
            update: {
                researchPts: researchScore,
                universityServicePts: universityServiceScore,
                communityServicePts: communityServiceScore,
                teachingQualityPts: teachingScore,
                totalScore
            },
            create: {
                appraisalId,
                role: 'DEAN',
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
    revalidatePath(`/dean/reviews/${appraisalId}`);
}

async function sendScores(appraisalId: number) {
    await prisma.appraisal.update({
        where: { id: appraisalId },
        data: { status: EvaluationStatus.sent },
    });
    revalidatePath(`/dean/reviews/${appraisalId}`);
}

// --- DATA FETCHING ---
async function getAppraisalData(appraisalId: number, deanUserId: number) {
    // Get dean with their college
    const dean = await prisma.user.findUnique({ 
        where: { id: deanUserId }, 
        include: { college: true } 
    });
    
    if (!dean) {
        console.error('Dean user not found:', deanUserId);
        return null;
    }

    // Get appraisal with all required data
    const appraisal = await prisma.appraisal.findUnique({
        where: { id: appraisalId },
        include: {
            faculty: { 
                include: { 
                    department: { include: { college: true } } 
                } 
            },
            cycle: true,
            evaluations: true,
            awards: true, 
            courses: true, 
            researchActivities: true, 
            scientificActivities: true, 
            universityServices: true, 
            communityServices: true,
        }
    });

    if (!appraisal) {
        console.error('Appraisal not found:', appraisalId);
        return null;
    }
    
    // Check if the faculty member is an HOD
    if (appraisal.faculty.role !== 'HOD') {
        console.error('Faculty is not an HOD:', appraisal.faculty.role);
        return null;
    }
    
    // Check if HOD belongs to a department
    if (!appraisal.faculty.department) {
        console.error('HOD does not belong to a department');
        return null;
    }
    
    // Get HOD's college through department relationship
    const hodCollegeId = appraisal.faculty.department.collegeId;
    
    // Check if dean and HOD are in the same college
    if (dean.collegeId !== hodCollegeId) {
        console.error('Dean and HOD are not in the same college:', {
            deanCollegeId: dean.collegeId,
            hodCollegeId: hodCollegeId,
            deanId: deanUserId,
            hodId: appraisal.facultyId
        });
        return null;
    }
    
    // Check if dean is not trying to review themselves
    if (appraisal.facultyId === deanUserId) {
        console.error('Dean cannot review themselves');
        return null;
    }
    
    console.log('Dean review access granted:', {
        deanId: deanUserId,
        hodId: appraisal.facultyId,
        hodName: appraisal.faculty.name,
        hodDept: appraisal.faculty.department.name,
        collegeId: hodCollegeId
    });
    
    return appraisal;
}

// --- PAGE COMPONENT ---
export default async function ReviewPage({ params }: { params: Promise<{ appraisalId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        notFound();
    }

    // Check if user is DEAN
    if (session.user.role !== 'DEAN') {
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
                            <CardTitle className="text-2xl">HOD Appraisal Review</CardTitle>
                            <p className="text-muted-foreground">{faculty.name} - {faculty.department?.name ?? 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{faculty.department?.college?.name ?? 'N/A'}</p>
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
                            <p className="text-muted-foreground">Read-only view of the HOD's submitted achievements.</p>
                        </CardHeader>
                        <CardContent>
                            <AchievementViewer appraisal={appraisal} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="evaluation">
                    <EvaluationForm
                        appraisalId={appraisal.id}
                        role="DEAN"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
