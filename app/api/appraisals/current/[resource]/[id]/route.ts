import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ResourceKey =
  | 'awards'
  | 'courses'
  | 'research'
  | 'scientific'
  | 'university'
  | 'community'

const allowed: Record<ResourceKey, string[]> = {
  awards: ['name', 'area', 'organization', 'dateObtained', 'attachment', 'fileUrl', 'fileKey'],
  courses: ['academicYear', 'semester', 'courseTitle', 'courseCode','section', 'credit', 'studentsCount', 'studentsEvalAvg'],
  research: ['title', 'kind', 'journalOrPublisher', 'participation', 'publicationDate', 'refereedArticleRef', 'attachment', 'fileUrl', 'fileKey'],
  scientific: ['title', 'type', 'date', 'participation', 'organizingAuth', 'venue', 'attachment', 'fileUrl', 'fileKey'],
  university: ['committeeOrTask', 'authority', 'participation', 'dateFrom', 'dateTo', 'attachment', 'fileUrl', 'fileKey'],
  community: ['committeeOrTask', 'authority', 'participation', 'dateFrom', 'dateTo', 'attachment', 'fileUrl', 'fileKey'],
}

function toDateOrNull(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function pick(obj: any, keys: string[]) {
  const out: any = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

// Override pick to allow empty strings for attachment fields (for file removal)
function pickWithFileSupport(obj: any, keys: string[]) {
  const out: any = {}
  const attachmentFields = ['attachment', 'fileUrl', 'fileKey']
  
  for (const k of keys) {
    // Always include attachment fields if they exist, even if empty (for file removal)
    if (attachmentFields.includes(k) && obj.hasOwnProperty(k)) {
      out[k] = obj[k]
    } else if (obj[k] !== undefined) {
      out[k] = obj[k]
    }
  }
  return out
}

function sanitizePayload(resource: ResourceKey, body: Record<string, any>) {
  const b = { ...body };
  delete (b as any).id;
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

function resourceToModel(resource: ResourceKey) {
  switch (resource) {
    case 'awards': return prisma.award
    case 'courses': return prisma.courseTaught
    case 'research': return prisma.researchActivity
    case 'scientific': return prisma.scientificActivity
    case 'university': return prisma.universityService
    case 'community': return prisma.communityService
  }
}

async function getCurrentAppraisalId(userId: number, req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cycleIdParam = searchParams.get('cycleId')
  const cycleId = cycleIdParam ? Number(cycleIdParam) : undefined
  if (cycleIdParam && Number.isNaN(cycleId)) return null

  const cycle = cycleId
    ? await prisma.appraisalCycle.findUnique({ where: { id: cycleId } })
    : await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) return null

  // HODs and Deans can also have their own appraisals for self-evaluation
  const appraisal = await prisma.appraisal.findFirst({
    where: { facultyId: userId, cycleId: cycle.id },
  })
  return appraisal?.id ?? null
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resource, id } = await params
    const resourceKey = resource as ResourceKey
    if (!['awards','courses','research','scientific','university','community'].includes(resourceKey)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
    const itemId = Number(id)
    if (Number.isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const appraisalId = await getCurrentAppraisalId(Number(user.id), req)
    if (!appraisalId) return NextResponse.json({ error: 'No target appraisal' }, { status: 404 })

    const model = resourceToModel(resourceKey)
    const item = await (model as any).findUnique({ where: { id: itemId } })
    if (!item || item.appraisalId !== appraisalId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await (model as any).delete({ where: { id: itemId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resource, id } = await params
    const resourceKey = resource as ResourceKey
    if (!['awards','courses','research','scientific','university','community'].includes(resourceKey)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
    const itemId = Number(id)
    if (Number.isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const appraisalId = await getCurrentAppraisalId(Number(user.id), req)
    if (!appraisalId) return NextResponse.json({ error: 'No target appraisal' }, { status: 404 })

    const model = resourceToModel(resourceKey)
    const item = await (model as any).findUnique({ where: { id: itemId } })
    if (!item || item.appraisalId !== appraisalId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const rawData = pickWithFileSupport(body, allowed[resourceKey])
    const data = sanitizePayload(resourceKey, rawData)

    // Special handling for courses to convert numeric fields
    if (resourceKey === 'courses') {
      if (data.credit != null) data.credit = Number(data.credit)
      if (data.studentsCount != null) data.studentsCount = Number(data.studentsCount)
      if (data.studentsEvalAvg != null) data.studentsEvalAvg = Number(data.studentsEvalAvg)
    }

    // Handle file updates - check if a new file was uploaded or file was removed
    const hasNewFile = data.fileUrl && data.fileUrl !== item.fileUrl
    const hasRemovedFile = data.fileUrl === '' && item.fileUrl !== null && item.fileUrl !== undefined
    
    const updated = await (model as any).update({ where: { id: itemId }, data })
    
    // Link new files if uploaded (similar to POST route logic)
    if (hasNewFile && (resourceKey === "awards" || resourceKey === "research" || resourceKey === "scientific" || resourceKey === "university" || resourceKey === "community")) {
      try {
        // Find the most recent unlinked evidence file for this achievement type and appraisal
        const relatedFile = await prisma.evidence.findFirst({
          where: {
            appraisalId: appraisalId,
            achievementType: resourceKey,
            linkedAchievementId: null,
          },
          orderBy: {
            createdAt: 'desc' // Get the most recent file
          }
        })

        if (relatedFile) {
          // Link the file to this achievement
          await prisma.evidence.update({
            where: { id: relatedFile.id },
            data: { linkedAchievementId: updated.id },
          })

          // Update the achievement record with all three file fields from the Evidence record
          await (model as any).update({
            where: { id: updated.id },
            data: {
              attachment: relatedFile.url,
              fileUrl: relatedFile.url,
              fileKey: relatedFile.fileKey,
            },
          })
        }
      } catch (error) {
        console.error("Error linking files to achievement during update:", error)
        // Don't fail the request if file linking fails
      }
    }

    // Handle file removal - unlink files if file was removed
    if (hasRemovedFile && (resourceKey === "awards" || resourceKey === "research" || resourceKey === "scientific" || resourceKey === "university" || resourceKey === "community")) {
      try {
        // Find linked evidence files for this achievement
        const linkedFiles = await prisma.evidence.findMany({
          where: {
            linkedAchievementId: updated.id,
            achievementType: resourceKey,
          },
        })

        // Unlink each file from this achievement
        for (const file of linkedFiles) {
          await prisma.evidence.update({
            where: { id: file.id },
            data: {
              linkedAchievementId: null,
              appraisalId: appraisalId, // Keep file in the appraisal but unlinked
            },
          })
        }
      } catch (error) {
        console.error("Error unlinking files during update:", error)
        // Don't fail the request if file unlinking fails
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
