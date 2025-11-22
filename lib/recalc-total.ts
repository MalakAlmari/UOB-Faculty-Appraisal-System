import { prisma } from '@/lib/prisma'

/**
 * يعيد احتساب totalScore = Section1(أربع بنود) + Section2(capabilities.total من rubric JSON)
 * ويُحدّث Appraisal.totalScore. إن كانت الحالة NEW يُحوّلها إلى IN_REVIEW.
 * ملاحظة: نحسب من تقييم الدور الذي قام بالحفظ (HOD أو DEAN).
 */
export async function recalcTotal(appraisalId: number, role: 'HOD'|'DEAN') {
  const ev = await prisma.evaluation.findUnique({
    where: { appraisalId_role: { appraisalId, role } }
  })
  if (!ev) return

  const section1 =
    (ev.researchPts ?? 0) +
    (ev.universityServicePts ?? 0) +
    (ev.communityServicePts ?? 0) +
    (ev.teachingQualityPts ?? 0)

  let capTotal = 0
  try {
    const caps = (ev as any).rubric?.capabilities
    if (caps && typeof caps.total === 'number') capTotal = caps.total
  } catch {}

  const total = section1 + capTotal

  const app = await prisma.appraisal.findUnique({ where: { id: appraisalId } })
  if (!app) return

  await prisma.appraisal.update({
    where: { id: appraisalId },
    data: {
      totalScore: total,
      status: app.status === 'new' ? 'sent' : app.status
    }
  })
}
