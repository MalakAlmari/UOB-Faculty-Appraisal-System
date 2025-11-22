import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHOD, requireDean } from '@/lib/auth-utils'
import { recalcTotal } from '@/lib/recalc-total'
import { toRatingBand } from '@/lib/rating'

type Band = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'
const BAND = (n: number): Band =>
  n >= 5 ? 'HIGH' : n === 4 ? 'EXCEEDS' : n === 3 ? 'MEETS' : n === 2 ? 'PARTIAL' : 'NEEDS'

const POINTS: Record<Band, number> = { HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL:8, NEEDS:4 }

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const appraisalId = Number(params.id)
  if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let role: 'HOD'|'DEAN' = 'HOD'
  let user = await requireHOD().catch(() => null)
  if (!user) { user = await requireDean(); role = 'DEAN' }

  const app = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: { universityServices: true, faculty: { include: { department: true } } },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // يمكنك إعادة استخدام assertScope من الملف السابق إن شئت

  const count = app.universityServices.length
  const band = BAND(count)
  const score = Math.min(count * 4, 20)
  const explanation = [
    `Completed ${count} university-service item(s).`,
    `→ ${band} (${score} pts).`,
  ].join('\n')

  const ev = await prisma.evaluation.upsert({
    where: { appraisalId_role: { appraisalId, role } },
    update: { universityServiceBand: toRatingBand(band), universityServicePts: score, universityServiceExplanation: explanation },
    create: { appraisalId, role, universityServiceBand: toRatingBand(band), universityServicePts: score, universityServiceExplanation: explanation },
  })
  await recalcTotal(appraisalId, role)

  return NextResponse.json({ band, score, explanation })
}
