import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EvaluationStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { appraisalId } = body;

    if (!appraisalId) {
      return NextResponse.json({ error: "Appraisal ID is required" }, { status: 400 });
    }

    // Verify the user has access to this appraisal
    const appraisal = await prisma.appraisal.findUnique({
      where: { id: parseInt(appraisalId) },
      include: { faculty: true }
    });

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
    }

    // Check if user can approve this appraisal
    if (user.role === 'HOD' && appraisal.facultyId !== parseInt(user.id)) {
      return NextResponse.json({ error: "You can only approve your own appraisals" }, { status: 403 });
    }

    // Update appraisal status to complete
    const updatedAppraisal = await prisma.appraisal.update({
      where: { id: parseInt(appraisalId) },
      data: {
        status: EvaluationStatus.complete,
        deanReviewedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Appraisal approved successfully",
      appraisal: updatedAppraisal
    });

  } catch (error) {
    console.error("Error approving appraisal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}