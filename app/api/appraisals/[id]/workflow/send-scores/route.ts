import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { assertEvaluatorAccess } from '@/lib/eval-access'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const appraisalId = Number(id)
  if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: 'Invalid appraisal id' }, { status: 400 })

  const access = await assertEvaluatorAccess(appraisalId, user)
  if (!access.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // تحقّق أن القسمين مكتملان (performance & capabilities) قبل الإرسال
  const ev = await prisma.evaluation.findUnique({
    where: { appraisalId_role: { appraisalId, role: access.evaluatorRole } },
    select: { performancePts: true, capabilitiesPts: true }
  })
  if (!ev?.performancePts || !ev?.capabilitiesPts) {
    return NextResponse.json({ error: 'Both sections must have scores before sending.' }, { status: 400 })
  }

  await prisma.appraisal.update({
    where: { id: appraisalId },
    data: { status: 'sent' },
  })

  const path = user.role === 'DEAN' ? `/dean/reviews/${appraisalId}` : `/hod/reviews/${appraisalId}`
  revalidatePath(path)

  return NextResponse.json({ ok:true })
}
