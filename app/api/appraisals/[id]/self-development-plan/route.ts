import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { EvaluationRole, UserRole } from '@prisma/client'
import { z } from 'zod'

// ملاحظة Next.js: params يجب انتظارها (to avoid the sync-dynamic-apis warning)
type Ctx = { params: Promise<{ id: string }> }

const Row = z.object({
  id: z.string(),
  developmentArea: z.string().optional().default(''),
  linkToGoals: z.string().optional().default(''),
  activities: z.string().optional().default(''),
  expectedResults: z.string().optional().default(''),
  timeframe: z.string().optional().default(''),
})

const Body = z.object({
  rows: z.array(Row).min(1),
  biAnnualComments: z.string().optional().default(''),
  annualComments: z.string().optional().default(''),
  hodSignature: z.object({ name: z.string(), signedAt: z.string() }).nullable().optional(),
  deanSignature: z.object({ name: z.string(), signedAt: z.string() }).nullable().optional(),
})

function parseNotes(notes?: string | null) {
  try {
    return notes ? JSON.parse(notes) : {}
  } catch {
    return {}
  }
}

// GET: تحميل الخطة من Evaluation.notes (HOD record)
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const appraisalId = Number(id)

    const session = await getSession()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const ev = await prisma.evaluation.findUnique({
      where: { appraisalId_role: { appraisalId, role: EvaluationRole.HOD } },
      select: { notes: true },
    })

    const base = parseNotes(ev?.notes)
    const plan = base?.sdp ?? null

    // عرف الدور الحالي من الجلسة للواجهة (لإظهار أزرار التوقيع المناسبة)
    const role = session.user.role as UserRole

    return NextResponse.json({ plan, role })
  } catch (e) {
    console.error('[SDP_GET]', e)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PATCH: حفظ/تحديث الخطة داخل notes.sdp
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const appraisalId = Number(id)
    const body = Body.parse(await req.json())

    const session = await getSession()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    // أنشئ سجل HOD إن لم يوجد
    const existing = await prisma.evaluation.findUnique({
      where: { appraisalId_role: { appraisalId, role: EvaluationRole.HOD } },
      select: { notes: true },
    })

    const base = parseNotes(existing?.notes)
    const merged = { ...base, sdp: body }

    await prisma.evaluation.upsert({
      where: { appraisalId_role: { appraisalId, role: EvaluationRole.HOD } },
      update: { notes: JSON.stringify(merged) },
      create: {
        appraisalId,
        role: EvaluationRole.HOD,
        notes: JSON.stringify(merged),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[SDP_PATCH]', e)
    return new NextResponse(e?.message || 'Internal Server Error', { status: 500 })
  }
}
