import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HODCurrentAchievementsScreen from './screen'

export default async function HODCurrentAchievementsPage(){
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  // Get current active cycle
  const currentCycle = await prisma.appraisalCycle.findFirst({
    where: { isActive: true }
  })

  if (!currentCycle) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold">Update Achievements</h1>
        <div className="rounded-2xl border p-4 bg-white text-center">
          No active appraisal cycle found.
        </div>
      </div>
    )
  }

  // Get or create current appraisal for HOD
  let appraisal = await prisma.appraisal.findFirst({
    where: {
      facultyId: parseInt(user.id),
      cycleId: currentCycle.id
    }
  })

  if (!appraisal) {
    appraisal = await prisma.appraisal.create({
      data: {
        facultyId: parseInt(user.id),
        cycleId: currentCycle.id,
        status: 'new'
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Update Achievements</h1>
      <div className="text-sm text-muted-foreground mb-4">
        Academic Year: {currentCycle.academicYear} | Status: {appraisal.status}
      </div>
      <HODCurrentAchievementsScreen appraisalId={appraisal.id} />
    </div>
  )
}