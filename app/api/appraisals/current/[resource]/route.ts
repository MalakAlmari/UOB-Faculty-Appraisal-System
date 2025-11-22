import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ResKey = "awards" | "courses" | "research" | "scientific" | "university" | "community" | "achievements";

function isAllowedResource(x: string): x is ResKey {
  return ["awards", "courses", "research", "scientific", "university", "community", "achievements"].includes(x);
}

function toDateOrNull(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function sanitizePayload(resource: ResKey, body: Record<string, any>) {
  const b = { ...body };
  delete (b as any).id;
  delete (b as any).errors;
  delete (b as any).appraisalId;
  delete (b as any).createdAt;
  delete (b as any).updatedAt;

  const dateKeys = [
    "date", "dateFrom", "dateTo", "dateObtained", "publicationDate"
  ];
  for (const k of dateKeys) {
    if (b[k]) {
      const d = toDateOrNull(b[k]);
      if (d) b[k] = d;
    }
  }

  // Normalize semester enum values
  if (b.semester) {
    const semesterMap: Record<string, string> = {
      "first": "FALL",
      "second": "SPRING",
      "summer": "SUMMER"
    };
    if (semesterMap[b.semester.toLowerCase()]) {
      b.semester = semesterMap[b.semester.toLowerCase()];
    }
  }

  // Normalize ResearchActivityType enum values
  if (b.type) {
    const researchTypeMap: Record<string, string> = {
      "journal": "JOURNAL",
      "conference": "CONFERENCE",
      "other": "OTHER"
    };
    const normalizedType = researchTypeMap[b.type.toLowerCase()];
    if (normalizedType) {
      b.type = normalizedType;
    }
  }

  // Normalize ResearchKind enum values
  if (b.kind) {
    const researchKindMap: Record<string, string> = {
      "accepted": "ACCEPTED",
      "published": "PUBLISHED",
      "in_process": "IN_PROCESS",
      "arbitration": "ARBITRATION",
      "thesis_supervision": "THESIS_SUPERVISION",
      "funded_project": "FUNDED_PROJECT",
      "contractual_research": "CONTRACTUAL_RESEARCH",
      "registered_patent": "REGISTERED_PATENT",
      "refereed_paper": "REFEREED_PAPER",
      "other": "OTHER"
    };
    const normalizedKind = researchKindMap[b.kind.toLowerCase()];
    if (normalizedKind) {
      b.kind = normalizedKind;
    }
  }

  return b;
}

function delegateByResource(resource: ResKey) {
  switch (resource) {
    case "awards":      return prisma.award;
    case "courses":     return prisma.courseTaught;
    case "research":    return prisma.researchActivity;
    case "scientific":  return prisma.scientificActivity;
    case "university":  return prisma.universityService;
    case "community":   return prisma.communityService;
    case "achievements": return prisma.award;
  }
}

export async function POST(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resource = (await params).resource;
    if (!isAllowedResource(resource)) {
      return NextResponse.json({ error: "Unsupported resource" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const cycleIdParam = searchParams.get("cycleId");
    const cycleId = cycleIdParam ? Number(cycleIdParam) : undefined;
    if (cycleIdParam && Number.isNaN(cycleId)) {
      return NextResponse.json({ error: "Invalid cycleId" }, { status: 400 });
    }

    const cycle = cycleId
      ? await prisma.appraisalCycle.findUnique({ where: { id: cycleId } })
      : await prisma.appraisalCycle.findFirst({ where: { isActive: true } });

    if (!cycle) return NextResponse.json({ error: "No target cycle found" }, { status: 404 });

    // HODs and Deans can also have their own appraisals for self-evaluation
    let appraisal = await prisma.appraisal.findFirst({
      where: { facultyId: Number(user.id), cycleId: cycle.id },
    });
    if (!appraisal) {
      appraisal = await prisma.appraisal.create({
        data: { facultyId: Number(user.id), cycleId: cycle.id, status: "new" },
      });
    }

    const payload = await req.json().catch(() => ({}));
    const data = sanitizePayload(resource, payload);

    const delegate = delegateByResource(resource);
    const created = await (delegate as any).create({
      data: { ...data, appraisalId: appraisal.id },
    });

    // Link uploaded files from Evidence table to the newly created achievement
    if (resource === "awards" || resource === "research" || resource === "scientific" || resource === "university" || resource === "community") {
      try {
        // Find unlinked evidence files for this achievement type and appraisal
        const relatedFiles = await prisma.evidence.findMany({
          where: {
            appraisalId: appraisal.id,
            achievementType: resource, // resource matches achievementType (awards, research, etc.)
            linkedAchievementId: null, // Only unlinked files
          },
        });

        // Link each file to the newly created achievement
        for (const file of relatedFiles) {
          await prisma.evidence.update({
            where: { id: file.id },
            data: { linkedAchievementId: created.id },
          });

          // Also update the achievement record with file information
          if (created.attachment !== file.url) {
            await (delegate as any).update({
              where: { id: created.id },
              data: {
                attachment: file.url,
                fileUrl: file.url,
                fileKey: file.fileKey,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error linking files to achievement:", error);
        // Don't fail the request if file linking fails
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
