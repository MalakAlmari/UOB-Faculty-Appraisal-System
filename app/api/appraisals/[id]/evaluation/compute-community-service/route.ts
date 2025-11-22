import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHOD, requireDean } from '@/lib/auth-utils'
import { uiToRatingBand, UiBand } from '@/app/api/_utils/bands'
import { recalcTotal } from '@/lib/recalc-total'

type Role = 'HOD' | 'DEAN'
const pickBand = (n: number): UiBand =>
  n >= 5 ? 'HIGH' : n === 4 ? 'EXCEEDS' : n === 3 ? 'MEETS' : n === 2 ? 'PARTIAL' : 'NEEDS'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const appraisalId = Number(id)
  if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let role: Role = 'HOD'
  let user = await requireHOD().catch(() => null)
  if (!user) { user = await requireDean(); role = 'DEAN' }

  const app = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: { communityServices: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const count = app.communityServices.length
  const uiBand = pickBand(count)
  const dbBand = uiToRatingBand(uiBand)
  const score = Math.min(count * 4, 20)
  const explanation = [`Completed ${count} community-service item(s).`, `→ ${uiBand} (${score} pts).`].join('\n')

  const ev = await prisma.evaluation.upsert({
    where: { appraisalId_role: { appraisalId, role } },
    update: { communityServiceBand: dbBand, communityServicePts: score, communityServiceExplanation: explanation },
    create: { appraisalId, role, communityServiceBand: dbBand, communityServicePts: score, communityServiceExplanation: explanation },
  })

  await recalcTotal(appraisalId, role)

  return NextResponse.json({ band: uiBand, score, explanation })
}
