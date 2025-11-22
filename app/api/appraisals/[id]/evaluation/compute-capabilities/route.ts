import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { assertEvaluatorAccess } from '@/lib/eval-access'

type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'

export async function POST(_req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appraisalId = Number(context.params.id)
  if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: 'Invalid appraisal id' }, { status: 400 })

  const access = await assertEvaluatorAccess(appraisalId, user)
  if (!access.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // استبدل المصدر بجدول capabilitiesItem إن وجد
  const count = await prisma.universityService.count({ where: { appraisalId } })

  const pointsPerItem = 4
  const maxPoints = 20
  const raw = count * pointsPerItem
  const score = Math.min(raw, maxPoints)

  let band: BandKey = 'NEEDS'
  if (count >= 5) band = 'HIGH'
  else if (count === 4) band = 'EXCEEDS'
  else if (count === 3) band = 'MEETS'
  else if (count === 2) band = 'PARTIAL'
  else if (count === 1) band = 'NEEDS'

  await prisma.$transaction(async (tx) => {
    await tx.evaluation.upsert({
      where: { appraisalId_role: { appraisalId, role: access.evaluatorRole } },
      update: { capabilitiesBand: band, capabilitiesPts: score, computedById: user.id, computedAt: new Date() },
      create: { appraisalId, role: access.evaluatorRole, capabilitiesBand: band, capabilitiesPts: score, computedById: user.id, computedAt: new Date() },
    })
    const app = await tx.appraisal.findUnique({ where: { id: appraisalId } })
    if (app && app.status === 'NEW') {
      await tx.appraisal.update({ where: { id: appraisalId }, data: { status: 'IN_REVIEW' } })
    }
  })

  const path = user.role === 'DEAN' ? `/dean/reviews/${appraisalId}` : `/hod/reviews/${appraisalId}`
  revalidatePath(path)

  return NextResponse.json({ ok: true, appraisalId, count, score, band })
}
