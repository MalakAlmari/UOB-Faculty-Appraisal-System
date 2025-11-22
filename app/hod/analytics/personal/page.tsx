import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HODPersonalCharts from './charts'

export default async function HODPersonalAnalyticsPage(){
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  const appraisals = await prisma.appraisal.findMany({
    where: { facultyId: parseInt(user.id) },
    include: {
      cycle: true,
      evaluations: true
    },
    orderBy: { id: 'asc' },
  })

  const data = appraisals.map(a => {
    // Calculate scores from evaluations if available, otherwise use Appraisal fields
    let research = a.researchScore ?? 0
    let university = a.universityServiceScore ?? 0
    let community = a.communityServiceScore ?? 0
    let teaching = a.teachingQualityScore ?? 0
    let total = a.totalScore ?? 0

    // If evaluations exist, calculate from the latest evaluation
    if (a.evaluations && a.evaluations.length > 0) {
      const latestEval = a.evaluations.sort((x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime())[0]

      if (latestEval) {
        research = latestEval.researchPts ?? 0
        university = latestEval.universityServicePts ?? 0
        community = latestEval.communityServicePts ?? 0
        teaching = latestEval.teachingQualityPts ?? 0
        total = latestEval.totalScore ?? (research + university + community + teaching)
      }
    } else {
      // If no evaluations, calculate total from individual appraisal scores
      total = research + university + community + teaching
    }

    return {
      id: a.id,
      label: `${a.cycle?.academicYear ?? ''}`.trim(),
      status: a.status,
      research,
      university,
      community,
      teaching,
      total,
    }
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">My Performance Analytics</h1>
      <HODPersonalCharts rows={data} />
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Cycle</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.label || r.id}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.total.toFixed(2)}</td>
                <td className="p-2">
                  <a className="underline" href={`/hod/appraisal/achievements`}>Open Achievements</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}