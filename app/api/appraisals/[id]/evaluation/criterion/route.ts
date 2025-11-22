// // import { NextRequest, NextResponse } from 'next/server'
// // import { getServerSession } from 'next-auth'
// // import { authOptions } from '@/lib/auth'
// // import { prisma } from '@/lib/prisma'
// // import { getUserContext } from '@/lib/permissions'

// // export async function PATCH(
// //   request: NextRequest,
// //   { params }: { params: Promise<{ id: string }> }
// // ) {
// //   try {
// //     const session = await getServerSession(authOptions)
// //     if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// //     const user = await getUserContext(session)
// //     if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

// //     const { id } = await params
// //     const appraisalId = parseInt(id)

// //     const { criterion, band, score, notes } = await request.json()

// //     // Get appraisal to check permissions
// //     const appraisal = await prisma.appraisal.findUnique({
// //       where: { id: appraisalId },
// //       include: { faculty: true, evaluations: true }
// //     })

// //     if (!appraisal) {
// //       return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })
// //     }

// //     // Check permissions
// //     const canEvaluate = (
// //       user.role === 'ADMIN' ||
// //       (user.role === 'DEAN' && appraisal.faculty.role === 'HOD') ||
// //       (user.role === 'HOD' && appraisal.faculty.role === 'INSTRUCTOR')
// //     )

// //     if (!canEvaluate) {
// //       return NextResponse.json({ error: 'Not authorized to evaluate this appraisal' }, { status: 403 })
// //     }

// //     // Update the evaluation
// //     const evaluation = await prisma.evaluation.upsert({
// //       where: {
// //         appraisalId_role: {
// //           appraisalId,
// //           role: user.role as 'HOD' | 'DEAN'
// //         }
// //       },
// //       update: {
// //         [criterion]: score,
// //         notes: notes !== undefined ? notes : undefined
// //       },
// //       create: {
// //         appraisalId,
// //         role: user.role as 'HOD' | 'DEAN',
// //         [criterion]: score,
// //         notes
// //       }
// //     })

// //     return NextResponse.json({ evaluation })
// //   } catch (error) {
// //     console.error('Error updating evaluation criterion:', error)
// //     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
// //   }
// // }



// // import { NextRequest, NextResponse } from 'next/server'
// // import { prisma } from '@/lib/prisma'
// // import { getServerSession } from 'next-auth'
// // import { authOptions } from '@/lib/auth'
// // import { revalidatePath } from 'next/cache'
// // import { assertEvaluatorAccess } from '@/lib/eval-access'

// // type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'

// // export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
// //   const session = await getServerSession(authOptions)
// //   const user = session?.user as any
// //   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// //   const { id } = await params
// //   const appraisalId = Number(id)
// //   if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: 'Invalid appraisal id' }, { status: 400 })

// //   const body = await req.json().catch(()=>null)
// //   if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

// //   const { criterion, band, score, note, explanation } = body as {
// //     criterion: 'performance'|'capabilities'
// //     band?: BandKey; score?: number; note?: string; explanation?: string
// //   }

// //   if (!['performance','capabilities'].includes(criterion)) {
// //     return NextResponse.json({ error: 'Unknown criterion' }, { status: 400 })
// //   }

// //   const access = await assertEvaluatorAccess(appraisalId, user)
// //   if (!access.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

// //   const data: any = {}
// //   if (criterion === 'performance') {
// //     if (band !== undefined) data.performanceBand = band
// //     if (score !== undefined) data.performancePts = score
// //     if (note !== undefined) data.performanceNote = note
// //     if (explanation !== undefined) data.performanceExplanation = explanation
// //   } else {
// //     if (band !== undefined) data.capabilitiesBand = band
// //     if (score !== undefined) data.capabilitiesPts = score
// //     if (note !== undefined) data.capabilitiesNote = note
// //     if (explanation !== undefined) data.capabilitiesExplanation = explanation
// //   }

// //   await prisma.evaluation.upsert({
// //     where: { appraisalId_role: { appraisalId, role: access.evaluatorRole } },
// //     update: { ...data },
// //     create: { appraisalId, role: access.evaluatorRole, ...data },
// //   })

// //   if (access.appraisal.status === 'NEW') {
// //     await prisma.appraisal.update({ where: { id: appraisalId }, data: { status: 'IN_REVIEW' } })
// //   }

// //   const path = user.role === 'DEAN' ? `/dean/reviews/${appraisalId}` : `/hod/reviews/${appraisalId}`
// //   revalidatePath(path)

// //   return NextResponse.json({ ok: true })
// // }










// // import { NextResponse } from 'next/server'
// // import { z } from 'zod'
// // import { prisma } from '@/lib/prisma'
// // import { requireHOD, requireDean } from '@/lib/auth-utils'
// // import { toRatingBand, UiBand } from '@/lib/rating'
// // import type { RatingBand } from '@prisma/client'

// // type Role = 'HOD' | 'DEAN'

// // const Body = z.object({
// //   criterion: z.enum(['research','universityService','communityService','teaching']),
// //   band: z.enum(['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS']),
// //   explanation: z.string().optional().nullable(),
// //   note: z.string().optional().nullable(),
// // })

// // const POINTS: Record<string, Record<UiBand, number>> = {
// //   research:         { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6 },
// //   universityService:{ HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL: 8, NEEDS:4 },
// //   communityService: { HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL: 8, NEEDS:4 },
// //   teaching:         { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6 },
// // }

// // const RUBRIC: Record<string, Record<UiBand, string>> = {
// //   research: {
// //     HIGH:    `1. 3+ international papers, 2+ intl. books, 3+ contract projects, or patents.\n2. Or equivalent combined set.`,
// //     EXCEEDS: `1. 2 intl. papers, or 1 intl. book, or 2+ indexed books, or 2 contracts.\n2. Or mixed pair (paper+book/contract/review/speaker).`,
// //     MEETS:   `1. 1 intl. paper, or 1 indexed book, or 1 contract.\n2. / 2+ intl. peer-reviews / speaking / patent.`,
// //     PARTIAL: `1. Local journal / informative articles.\n2. Participation in conferences.`,
// //     NEEDS:   `No accomplishments per partially-meets column.`,
// //   },
// //   universityService: {
// //     HIGH:    `Completed 5+ university-service items (4 pts each).`,
// //     EXCEEDS: `Completed 4 items (4 pts each).`,
// //     MEETS:   `Completed 3 items (4 pts each).`,
// //     PARTIAL: `Completed 2 items (4 pts each).`,
// //     NEEDS:   `Completed 1 item (4 pts).`,
// //   },
// //   communityService: {
// //     HIGH:    `Completed 5+ community-service items (4 pts each).`,
// //     EXCEEDS: `Completed 4 items (4 pts each).`,
// //     MEETS:   `Completed 3 items (4 pts each).`,
// //     PARTIAL: `Completed 2 items (4 pts each).`,
// //     NEEDS:   `Completed 1 item (4 pts).`,
// //   },
// //   teaching: {
// //     HIGH:    `Students evaluation ≥ 90%.`,
// //     EXCEEDS: `Students evaluation 80–89%.`,
// //     MEETS:   `Students evaluation 60–79%.`,
// //     PARTIAL: `Students evaluation 50–59%.`,
// //     NEEDS:   `Students evaluation < 50%.`,
// //   },
// // }

// // export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
// //   try {
// //     const { id } = await ctx.params            // ✅ await params
// //     const appraisalId = Number(id)
// //     if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

// //     const body = Body.parse(await req.json())

// //     // who is evaluating?
// //     let role: Role = 'HOD'
// //     let user = await requireHOD().catch(() => null)
// //     if (!user) { user = await requireDean(); role = 'DEAN' }

// //     const app = await prisma.appraisal.findUnique({ where: { id: appraisalId } })
// //     if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

// //     const uiBand = body.band
// //     const dbBand: RatingBand = toRatingBand(uiBand)     // ✅ map to Prisma enum
// //     const score = POINTS[body.criterion][uiBand]
// //     const explanation = body.explanation ?? RUBRIC[body.criterion][uiBand]

// //     // dynamic field names need casting to any for Prisma type
// //     const bandKey = `${body.criterion}Band`
// //     const ptsKey  = `${body.criterion}Pts`
// //     const expKey  = `${body.criterion}Explanation`
// //     const noteKey = `${body.criterion}Note`

// //     const ev = await prisma.evaluation.upsert({
// //       where: { appraisalId_role: { appraisalId, role } },
// //       update: { [bandKey]: dbBand, [ptsKey]: score, [expKey]: explanation, [noteKey]: body.note ?? null } as any,
// //       create: { appraisalId, role, [bandKey]: dbBand, [ptsKey]: score, [expKey]: explanation, [noteKey]: body.note ?? null } as any,
// //     })

// //     const s1 = (ev.researchPts ?? 0) + (ev.universityServicePts ?? 0) + (ev.communityServicePts ?? 0) + (ev.teachingPts ?? 0)
// //     await prisma.appraisal.update({
// //       where: { id: appraisalId },
// //       data: { totalScore: s1 || null, status: app.status === 'NEW' ? 'IN_REVIEW' : app.status },
// //     })

// //     // Explanation as numbered list
// //     const numbered = explanation
// //       .split(/\r?\n/).filter(Boolean)
// //       .map((l, i) => `${i + 1}. ${l.replace(/^\d+[\).]\s*/,'')}`)
// //       .join('\n')

// //     return NextResponse.json({ ok: true, score, band: uiBand, explanation: numbered })
// //   } catch (e: any) {
// //     return NextResponse.json({ error: e?.message ?? 'Bad Request' }, { status: 400 })
// //   }
// // }







// import { NextResponse } from 'next/server'
// import { z } from 'zod'
// import { prisma } from '@/lib/prisma'
// import { requireHOD, requireDean } from '@/lib/auth-utils'
// import { s1PointsFor, toNumbered, toRatingBand, UiBand } from '@/lib/rating'
// import { recalcTotal } from '@/lib/recalc-total'

// // body
// const Body = z.object({
//   criterion: z.enum(['research','universityService','communityService','teaching']),
//   band: z.enum(['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS']),
//   explanation: z.string().optional().nullable(),
//   note: z.string().optional().nullable(),
// })

// function keysFor(criterion: 'research'|'universityService'|'communityService'|'teaching') {
//   const base = criterion === 'teaching' ? 'teachingQuality' : criterion
//   return {
//     ptsKey:  `${base}Pts`,
//     bandKey: `${base}Band`,
//     expKey:  `${base}Explanation`,
//   } as const
// }

// async function handler(req: Request, ctx: { params: Promise<{ id: string }> }) {
//   const { id } = await ctx.params
//   const appraisalId = Number(id)
//   if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

//   // من له صلاحية التقييم؟
//   let role: 'HOD' | 'DEAN' = 'HOD'
//   let user = await requireHOD().catch(() => null)
//   if (!user) { user = await requireDean(); role = 'DEAN' }

//   const app = await prisma.appraisal.findUnique({ where: { id: appraisalId } })
//   if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

//   const body = Body.parse(await req.json())
//   const { criterion, band: uiBand, explanation, note } = body

//   const pts = s1PointsFor(criterion, uiBand as UiBand)
//   const dbBand = toRatingBand(uiBand as UiBand)
//   const { ptsKey, bandKey, expKey } = keysFor(criterion)

//   // حفظ البند المحدد
//   const ev = await prisma.evaluation.upsert({
//     where: { appraisalId_role: { appraisalId, role } },
//     update: {
//       [ptsKey]: pts,
//       [bandKey]: dbBand,
//       [expKey]: toNumbered(explanation || ''),
//       notes: note ? (note + '\n' + ( (await prisma.evaluation.findUnique({ where:{ appraisalId_role:{ appraisalId, role }}}))?.notes ?? '' )) : undefined
//     } as any,
//     create: {
//       appraisalId,
//       role,
//       [ptsKey]: pts,
//       [bandKey]: dbBand,
//       [expKey]: toNumbered(explanation || ''),
//       notes: note ?? null
//     } as any,
//   })

//   // NEW → IN_REVIEW + حساب المجموع الكلي
//   await recalcTotal(appraisalId, role)

//   return NextResponse.json({
//     ok: true,
//     criterion,
//     points: pts,
//     band: dbBand,
//   })
// }

// export const PATCH = handler
// export const POST  = handler

// // Add GET method to retrieve existing evaluations
// export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
//   try {
//     const { id } = await ctx.params
//     const appraisalId = Number(id)
//     if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

//     // Get user role for evaluation lookup
//     let role: 'HOD' | 'DEAN' = 'HOD'
//     let user = await requireHOD().catch(() => null)
//     if (!user) { user = await requireDean(); role = 'DEAN' }

//     // Find existing evaluation for this role
//     const evaluation = await prisma.evaluation.findUnique({
//       where: {
//         appraisalId_role: { appraisalId, role }
//       }
//     })

//     if (!evaluation) {
//       return NextResponse.json([])
//     }

//     // Return evaluation data in the format expected by the frontend
//     const evaluations = [
//       {
//         criterion: 'research',
//         band: evaluation.researchBand,
//         score: evaluation.researchPts,
//         explanation: evaluation.researchExplanation,
//         note: null, // Notes are stored in general notes field
//       },
//       {
//         criterion: 'universityService',
//         band: evaluation.universityServiceBand,
//         score: evaluation.universityServicePts,
//         explanation: evaluation.universityServiceExplanation,
//         note: null,
//       },
//       {
//         criterion: 'communityService',
//         band: evaluation.communityServiceBand,
//         score: evaluation.communityServicePts,
//         explanation: evaluation.communityServiceExplanation,
//         note: null,
//       },
//       {
//         criterion: 'teaching',
//         band: evaluation.teachingQualityBand,
//         score: evaluation.teachingQualityPts,
//         explanation: evaluation.teachingQualityExplanation,
//         note: null,
//       },
//     ].filter(e => e.band || e.score) // Only return criteria that have been evaluated

//     return NextResponse.json(evaluations)
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message ?? 'Bad Request' }, { status: 400 })
//   }
// }








import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireHOD, requireDean } from '@/lib/auth-utils'
import { s1PointsFor, toNumbered, toRatingBand, UiBand } from '@/lib/rating'
import { recalcTotal } from '@/lib/recalc-total'

// body - تحديث ليقبل كلا النوعين من الـ bands
const Body = z.object({
  criterion: z.enum(['research','universityService','communityService','teaching']),
  band: z.string(), // تغيير إلى string لأخذ أي قيمة
  score: z.number().optional(),
  explanation: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  role: z.enum(['HOD', 'DEAN']).optional(),
})

function keysFor(criterion: 'research'|'universityService'|'communityService'|'teaching') {
  const base = criterion === 'teaching' ? 'teachingQuality' : criterion
  return {
    ptsKey:  `${base}Pts`,
    bandKey: `${base}Band`,
    expKey:  `${base}Explanation`,
  } as const
}

// دالة لتحويل أي band إلى UiBand
function normalizeToUiBand(band: string): UiBand {
  const bandMap: Record<string, UiBand> = {
    'HIGH': 'HIGH',
    'EXCEEDS': 'EXCEEDS', 
    'MEETS': 'MEETS',
    'PARTIAL': 'PARTIAL',
    'NEEDS': 'NEEDS',
    'HIGHLY_EXCEEDS': 'HIGH',
    'FULLY_MEETS': 'MEETS',
    'PARTIALLY_MEETS': 'PARTIAL',
    'NEEDS_IMPROVEMENT': 'NEEDS'
  }
  return bandMap[band] || 'NEEDS'
}

async function handler(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const appraisalId = Number(id)
    if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    console.log('=== CRITERION API CALL ===')
    console.log('Appraisal ID:', appraisalId)

    // من له صلاحية التقييم؟
    let role: 'HOD' | 'DEAN' = 'HOD'
    let user = await requireHOD().catch(() => null)
    if (!user) { user = await requireDean(); role = 'DEAN' }

    console.log('User role:', role)

    const app = await prisma.appraisal.findUnique({ where: { id: appraisalId } })
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    console.log('Request body:', body)

    const parsedBody = Body.parse(body)
    const { criterion, band: incomingBand, score, explanation, note } = parsedBody

    console.log('Criterion:', criterion)
    console.log('Incoming band:', incomingBand)

    // تحويل الـ band إلى UiBand أولاً
    const uiBand = normalizeToUiBand(incomingBand)
    console.log('Normalized UI band:', uiBand)

    const pts = score !== undefined ? score : s1PointsFor(criterion, uiBand)
    const dbBand = toRatingBand(uiBand)
    const { ptsKey, bandKey, expKey } = keysFor(criterion)

    console.log('Points:', pts)
    console.log('Database band:', dbBand)

    // البحث عن التقييم الحالي للحصول على الـ notes
    const currentEvaluation = await prisma.evaluation.findUnique({
      where: { appraisalId_role: { appraisalId, role } }
    })

    // إعداد بيانات التحديث
    const updateData: any = {
      [ptsKey]: pts,
      [bandKey]: dbBand,
      [expKey]: toNumbered(explanation || ''),
    }

    // التعامل مع الـ notes
    if (note) {
      const currentNotes = currentEvaluation?.notes || ''
      updateData.notes = currentNotes ? `${currentNotes}\n${note}` : note
    }

    console.log('Update data:', updateData)

    // حفظ البند المحدد
    const ev = await prisma.evaluation.upsert({
      where: { appraisalId_role: { appraisalId, role } },
      update: updateData,
      create: {
        appraisalId,
        role,
        ...updateData
      },
    })

    console.log('Evaluation saved successfully:', ev.id)

    // NEW → IN_REVIEW + حساب المجموع الكلي
    await recalcTotal(appraisalId, role)

    return NextResponse.json({
      ok: true,
      criterion,
      points: pts,
      band: dbBand,
    })

  } catch (error: any) {
    console.error('=== CRITERION API ERROR ===')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export const PATCH = handler
export const POST  = handler

// GET method يبقى كما هو
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const appraisalId = Number(id)
    if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Get user role for evaluation lookup
    let role: 'HOD' | 'DEAN' = 'HOD'
    let user = await requireHOD().catch(() => null)
    if (!user) { user = await requireDean(); role = 'DEAN' }

    // Find existing evaluation for this role
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        appraisalId_role: { appraisalId, role }
      }
    })

    if (!evaluation) {
      return NextResponse.json([])
    }

    // Return evaluation data in the format expected by the frontend
    const evaluations = [
      {
        criterion: 'research',
        band: evaluation.researchBand,
        score: evaluation.researchPts,
        explanation: evaluation.researchExplanation,
        note: null,
      },
      {
        criterion: 'universityService',
        band: evaluation.universityServiceBand,
        score: evaluation.universityServicePts,
        explanation: evaluation.universityServiceExplanation,
        note: null,
      },
      {
        criterion: 'communityService',
        band: evaluation.communityServiceBand,
        score: evaluation.communityServicePts,
        explanation: evaluation.communityServiceExplanation,
        note: null,
      },
      {
        criterion: 'teaching',
        band: evaluation.teachingQualityBand,
        score: evaluation.teachingQualityPts,
        explanation: evaluation.teachingQualityExplanation,
        note: null,
      },
    ].filter(e => e.band || e.score)

    return NextResponse.json(evaluations)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad Request' }, { status: 400 })
  }
}