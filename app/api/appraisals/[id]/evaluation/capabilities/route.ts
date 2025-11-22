// import { NextResponse } from 'next/server'
// import { z } from 'zod'
// import { prisma } from '@/lib/prisma'
// import { requireHOD, requireDean } from '@/lib/auth-utils'
// import { toRatingBand, UiBand } from '@/lib/rating'
// import type { RatingBand } from '@prisma/client'

// // UI enum
// const BandEnum = z.enum(['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS'])

// // اختيارات Section 2 (مفاتيح معروفة + optional)
// const SelectionsSchema = z.object({
//   institutionalCommitment: BandEnum.optional(),
//   collaborationTeamwork:   BandEnum.optional(),
//   professionalism:         BandEnum.optional(),
//   clientService:           BandEnum.optional(),
//   achievingResults:        BandEnum.optional(),
// }).optional().default({})

// const Body = z.object({
//   selections: SelectionsSchema,
//   note: z.string().optional().nullable(),
// })

// const CAP_POINTS: Record<UiBand, number> = {
//   HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4
// }

// function bandFromCapabilitiesTotal(total: number): UiBand {
//   if (total >= 90) return 'HIGH'
//   if (total >= 80) return 'EXCEEDS'
//   if (total >= 60) return 'MEETS'
//   if (total >= 50) return 'PARTIAL'
//   return 'NEEDS'
// }

// function mergeRubric(existing: any, patch: any) {
//   const base = (existing && typeof existing === 'object') ? existing : {}
//   return { ...base, ...patch }
// }

// async function handler(req: Request, ctx: { params: Promise<{ id: string }> }) {
//   const { id } = await ctx.params
//   const appraisalId = Number(id)
//   if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

//   // صلاحيات: HOD أولاً ثم Dean
//   let role: 'HOD' | 'DEAN' = 'HOD'
//   let user = await requireHOD().catch(() => null)
//   if (!user) { user = await requireDean(); role = 'DEAN' }

//   const app = await prisma.appraisal.findUnique({
//     where: { id: appraisalId },
//     include: {
//       evaluations: { where: { role } }, // نحتاج الـrubric الحالي لهذا الـrole (إن وجد)
//     },
//   })
//   if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

//   const { selections, note } = Body.parse(await req.json())

//   let total = 0
//   const perDimBands: Record<string, RatingBand> = {}
//   const lines: string[] = []
//   const order: (keyof typeof selections)[] = [
//     'institutionalCommitment',
//     'collaborationTeamwork',
//     'professionalism',
//     'clientService',
//     'achievingResults',
//   ]

//   order.forEach((k) => {
//     const ui = selections[k] as UiBand | undefined
//     if (!ui) return
//     total += CAP_POINTS[ui]
//     perDimBands[k] = toRatingBand(ui)
//     lines.push(`${lines.length + 1}. ${k}: ${ui} (${CAP_POINTS[ui]} pts)`)
//   })

//   const uiOverall = bandFromCapabilitiesTotal(total)
//   const dbOverall: RatingBand = toRatingBand(uiOverall)

//   // جهّز rubric JSON الجديد (مع إبقاء بقية المفاتيح كما هي)
//   const currentEval = app.evaluations[0] ?? null
//   const currentRubric = currentEval?.rubric ?? null
//   const newRubric = mergeRubric(currentRubric, {
//     capabilities: {
//       total,                             // 0..100
//       overallBand: dbOverall,            // Prisma enum
//       selections: perDimBands,           // تفصيل الأبعاد كـ RatingBand
//       note: note ?? null,
//     }
//   })

//   // تخزين: capabilitiesBand + rubric (JSON). لا نستخدم حقول غير موجودة.
//   await prisma.evaluation.upsert({
//     where: { appraisalId_role: { appraisalId, role } },
//     update: {
//       capabilitiesBand: dbOverall,
//       rubric: newRubric as any,
//       // يمكن استخدام "notes" إن رغبت بدمج الشرح النصي:
//       // notes: [currentEval?.notes, `Capabilities total: ${total}/100`, ...lines].filter(Boolean).join('\n')
//     },
//     create: {
//       appraisalId,
//       role,
//       capabilitiesBand: dbOverall,
//       rubric: newRubric as any,
//       // notes: [`Capabilities total: ${total}/100`, ...lines].join('\n')
//     },
//   })

//   // أول تعديل ينقل new → sent
//   await prisma.appraisal.update({
//     where: { id: appraisalId },
//     data: { status: app.status === 'new' ? 'sent' : app.status },
//   })

//   return NextResponse.json({
//     ok: true,
//     total,                // 0..100
//     band: uiOverall,      // 'HIGH' | ...
//     explanation: [`Capabilities total: ${total} / 100`, ...lines].join('\n'),
//   })
// }

// export const PATCH = handler
// export const POST = handler

// // Add GET method to retrieve existing capabilities evaluations
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
//       return NextResponse.json({ selections: {}, notes: {} })
//     }

//     // Extract capabilities data from rubric JSON
//     const rubric = evaluation.rubric as any
//     const capabilitiesData = rubric?.capabilities || {}

//     // Map database RatingBand back to UI band
//     const bandMap: Record<string, string> = {
//       'HIGHLY_EXCEEDS': 'HIGH',
//       'EXCEEDS': 'EXCEEDS',
//       'FULLY_MEETS': 'MEETS',
//       'PARTIALLY_MEETS': 'PARTIAL',
//       'NEEDS_IMPROVEMENT': 'NEEDS',
//     }

//     const selections: Record<string, string> = {}
//     if (capabilitiesData.selections) {
//       Object.entries(capabilitiesData.selections).forEach(([key, value]: [string, any]) => {
//         selections[key] = bandMap[value] || value
//       })
//     }

//     return NextResponse.json({
//       selections,
//       notes: capabilitiesData.note || null,
//       capabilitiesPts: evaluation.capabilitiesPts,
//     })
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message ?? 'Bad Request' }, { status: 400 })
//   }
// }









import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireHOD, requireDean } from '@/lib/auth-utils'
import { recalcTotal } from '@/lib/recalc-total'

// UI enum
const BandEnum = z.enum(['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS'])

// اختيارات Section 2
const SelectionsSchema = z.object({
  institutionalCommitment: BandEnum.optional(),
  collaborationTeamwork: BandEnum.optional(),
  professionalism: BandEnum.optional(),
  clientService: BandEnum.optional(),
  achievingResults: BandEnum.optional(),
  customerService: BandEnum.optional(),
  leadingIndividuals: BandEnum.optional(),
  leadingChange: BandEnum.optional(),
  strategicVision: BandEnum.optional(),
}).optional().default({})

const Body = z.object({
  selections: SelectionsSchema,
  role: z.enum(['HOD', 'DEAN']).optional(),
})

const CAP_POINTS: Record<string, number> = {
  HIGH: 20, 
  EXCEEDS: 16, 
  MEETS: 12, 
  PARTIAL: 8, 
  NEEDS: 4
}

// دالة مبسطة لتحويل الـ band
function normalizeBand(band: string): any {
  const bandMap: Record<string, any> = {
    'HIGH': 'HIGHLY_EXCEEDS',
    'EXCEEDS': 'EXCEEDS',
    'MEETS': 'FULLY_MEETS',
    'PARTIAL': 'PARTIALLY_MEETS',
    'NEEDS': 'NEEDS_IMPROVEMENT'
  }
  return bandMap[band] || 'NEEDS_IMPROVEMENT'
}

function bandFromCapabilitiesTotal(total: number): string {
  if (total >= 90) return 'HIGH'
  if (total >= 80) return 'EXCEEDS'
  if (total >= 60) return 'MEETS'
  if (total >= 50) return 'PARTIAL'
  return 'NEEDS'
}

function mergeRubric(existing: any, patch: any) {
  const base = (existing && typeof existing === 'object') ? existing : {}
  return { ...base, ...patch }
}

async function handler(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const appraisalId = Number(id)
    if (Number.isNaN(appraisalId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    console.log('=== CAPABILITIES API CALL ===')
    console.log('Appraisal ID:', appraisalId)

    // صلاحيات: HOD أولاً ثم Dean
    let role: 'HOD' | 'DEAN' = 'HOD'
    let user = await requireHOD().catch(() => null)
    if (!user) { 
      user = await requireDean(); 
      role = 'DEAN' 
    }

    console.log('User role:', role)

    const app = await prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: {
        evaluations: { where: { role } },
      },
    })
    if (!app) {
      return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })
    }

    const body = await req.json()
    console.log('Request body:', body)

    const { selections } = Body.parse(body)

    let total = 0
    const perDimBands: Record<string, any> = {}
    const lines: string[] = []

    // معالجة جميع المفاتيح الممكنة
    const allKeys = [
      'institutionalCommitment',
      'collaborationTeamwork',
      'professionalism',
      'clientService',
      'achievingResults',
      'customerService', 
      'leadingIndividuals',
      'leadingChange',
      'strategicVision',
    ]

    allKeys.forEach((k) => {
      const uiBand = selections[k]
      if (!uiBand) return
      
      const points = CAP_POINTS[uiBand] || 0
      total += points
      perDimBands[k] = normalizeBand(uiBand)
      lines.push(`${lines.length + 1}. ${k}: ${uiBand} (${points} pts)`)
    })

    const uiOverall = bandFromCapabilitiesTotal(total)
    const dbOverall = normalizeBand(uiOverall)

    console.log('Capabilities total:', total)
    console.log('Overall band:', dbOverall)

    // جهّز rubric JSON الجديد
    const currentEval = app.evaluations[0] ?? null
    const currentRubric = currentEval?.rubric ?? null
    const newRubric = mergeRubric(currentRubric, {
      capabilities: {
        total,
        overallBand: dbOverall,
        selections: perDimBands,
      }
    })

    console.log('New rubric:', newRubric)

    // تخزين البيانات
    const ev = await prisma.evaluation.upsert({
      where: { appraisalId_role: { appraisalId, role } },
      update: {
        capabilitiesBand: dbOverall,
        capabilitiesPts: total,
        rubric: newRubric as any,
      },
      create: {
        appraisalId,
        role,
        capabilitiesBand: dbOverall,
        capabilitiesPts: total,
        rubric: newRubric as any,
      },
    })

    console.log('Capabilities saved successfully:', ev.id)

    // إعادة حساب المجموع الكلي
    await recalcTotal(appraisalId, role)

    return NextResponse.json({
      ok: true,
      total,
      band: uiOverall,
      explanation: [`Capabilities total: ${total} / 100`, ...lines].join('\n'),
    })

  } catch (error: any) {
    console.error('=== CAPABILITIES API ERROR ===')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export const PATCH = handler
export const POST = handler

// GET method to retrieve existing capabilities evaluations
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const appraisalId = Number(id)
    if (Number.isNaN(appraisalId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    console.log('=== GET CAPABILITIES API CALL ===')
    console.log('Appraisal ID:', appraisalId)

    // Get user role for evaluation lookup
    let role: 'HOD' | 'DEAN' = 'HOD'
    let user = await requireHOD().catch(() => null)
    if (!user) { 
      user = await requireDean(); 
      role = 'DEAN' 
    }

    console.log('Loading capabilities for role:', role)

    // Find existing evaluation for this role
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        appraisalId_role: { appraisalId, role }
      }
    })

    if (!evaluation) {
      console.log('No evaluation found for this role')
      return NextResponse.json({ selections: {}, notes: {} })
    }

    console.log('Found evaluation:', evaluation.id)

    // Extract capabilities data from rubric JSON
    const rubric = evaluation.rubric as any
    const capabilitiesData = rubric?.capabilities || {}

    console.log('Capabilities data from rubric:', capabilitiesData)

    // Map database RatingBand back to UI band
    const bandMap: Record<string, string> = {
      'HIGHLY_EXCEEDS': 'HIGH',
      'EXCEEDS': 'EXCEEDS',
      'FULLY_MEETS': 'MEETS',
      'PARTIALLY_MEETS': 'PARTIAL',
      'NEEDS_IMPROVEMENT': 'NEEDS',
    }

    const selections: Record<string, string> = {}
    if (capabilitiesData.selections) {
      Object.entries(capabilitiesData.selections).forEach(([key, value]: [string, any]) => {
        selections[key] = bandMap[value] || value
        console.log(`Mapping ${key}: ${value} -> ${selections[key]}`)
      })
    }

    const response = {
      selections,
      notes: capabilitiesData.note || null,
      capabilitiesPts: evaluation.capabilitiesPts || 0,
    }

    console.log('Final capabilities response:', response)

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('GET capabilities error:', e)
    return NextResponse.json({ 
      error: e?.message ?? 'Bad Request',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 400 })
  }
}