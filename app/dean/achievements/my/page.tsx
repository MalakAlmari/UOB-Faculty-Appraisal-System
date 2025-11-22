import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AllAchievementsScreen from '@/app/faculty/achievements/screen'

export default async function DeanAchievementsPage(){
const session = await getServerSession(authOptions)
const user = session?.user as any
if (!user) redirect('/login')

const appraisals = await prisma.appraisal.findMany({
where: { facultyId: parseInt(user.id) },
include: { cycle: true },
orderBy: { id: 'desc' },
})

const cycles = appraisals.map(a => ({
id: a.id,
label: `${a.cycle?.academicYear ?? ''}`.trim() || String(a.id),
status: a.status,
}))

return (
<div className="p-6 space-y-6">
<h1 className="text-xl font-semibold">My Achievements (All Cycles)</h1>
<AllAchievementsScreen cycles={cycles} />
</div>
)
}