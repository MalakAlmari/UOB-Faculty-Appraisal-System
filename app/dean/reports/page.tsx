import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ReportGenerator from '@/components/dean/report-generator'

export default async function DeanReportsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  // Get dean's college information for departments
  const dean = await prisma.user.findUnique({
    where: { id: parseInt(user.id) },
    include: {
      department: {
        include: {
          college: true
        }
      }
    }
  })

  // Get all departments in the dean's college
  const departments = await prisma.department.findMany({
    where: { collegeId: dean?.department?.collegeId },
    select: { id: true, name: true }
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Dean Reports</h1>
      <ReportGenerator
        userRole="DEAN"
        departments={departments.map(d => d.name)}
        collegeId={dean?.department?.collegeId}
      />
    </div>
  )
}
