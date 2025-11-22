import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: ?cycleId=<number> to target a specific cycle; else use active cycle
    const { searchParams } = new URL(req.url);
    const cycleIdParam = searchParams.get("cycleId");
    const cycleId = cycleIdParam ? Number(cycleIdParam) : undefined;
    if (cycleIdParam && Number.isNaN(cycleId)) {
      return NextResponse.json({ error: "Invalid cycleId" }, { status: 400 });
    }

    // Find target cycle
    const cycle = cycleId
      ? await prisma.appraisalCycle.findUnique({ where: { id: cycleId } })
      : await prisma.appraisalCycle.findFirst({ where: { isActive: true } });

    if (!cycle) {
      return NextResponse.json(
        { error: "No target cycle (active or by id) was found" },
        { status: 404 }
      );
    }

    // Get or create the user's appraisal for this cycle
    // HODs and Deans can also have appraisals for their own evaluation
    let appraisal = await prisma.appraisal.findFirst({
      where: { facultyId: Number(user.id), cycleId: cycle.id },
    });

    if (!appraisal) {
      appraisal = await prisma.appraisal.create({
        data: {
          facultyId: Number(user.id),
          cycleId: cycle.id,
          status: "new",
        },
      });
    }

    // Fetch all achievements lists in parallel
    const [
      awards,
      courses,
      research,
      scientific,
      university,
      community,
    ] = await Promise.all([
      prisma.award.findMany({ where: { appraisalId: appraisal.id }, orderBy: { id: "desc" } }),
      prisma.courseTaught.findMany({ where: { appraisalId: appraisal.id }, orderBy: { id: "desc" } }),
      prisma.researchActivity.findMany({ where: { appraisalId: appraisal.id }, orderBy: { id: "desc" } }),
      prisma.scientificActivity.findMany({ where: { appraisalId: appraisal.id }, orderBy: { id: "desc" } }),
      prisma.universityService.findMany({ where: { appraisalId: appraisal.id }, orderBy: { id: "desc" } }),
      prisma.communityService.findMany({ where: { appraisalId: appraisal.id }, orderBy: { id: "desc" } }),
    ]);

    // Include a compact appraisal summary
    const appraisalSummary = {
      id: appraisal.id,
      cycleId: appraisal.cycleId,
      status: appraisal.status,
      researchScore: appraisal.researchScore,
      universityServiceScore: appraisal.universityServiceScore,
      communityServiceScore: appraisal.communityServiceScore,
      teachingQualityScore: appraisal.teachingQualityScore,
      totalScore: appraisal.totalScore,
      submittedAt: appraisal.submittedAt,
    };

    return NextResponse.json({
        appraisalId: appraisal.id,
        awards,
        courses,
        research,
        scientific,
        university,
        community,
      });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
