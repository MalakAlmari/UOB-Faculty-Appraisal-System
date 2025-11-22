import { prisma } from '@/lib/prisma'

export async function assertEvaluatorAccess(appraisalId: number, user: any) {
  const appraisal = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: {
      faculty: { include: { department: { include: { college: true } } } },
      cycle: true,
    },
  })
  if (!appraisal) return { ok: false as const }

  const facultyRole = appraisal.faculty.role
  const facultyDeptId = appraisal.faculty.departmentId
  const facultyCollegeId = appraisal.faculty.department?.collegeId ?? null

  if (user.role === 'HOD') {
    const sameDept = user.departmentId === facultyDeptId
    const targetIsInstructor = facultyRole === 'INSTRUCTOR'
    const notSelf = appraisal.facultyId !== user.id
    if (sameDept && targetIsInstructor && notSelf) {
      return { ok: true as const, appraisal, evaluatorRole: 'HOD' as const }
    }
  } else if (user.role === 'DEAN') {
    const managesCollege = user.managedCollegeId && user.managedCollegeId === facultyCollegeId
    const targetIsHod = facultyRole === 'HOD'
    if (managesCollege && targetIsHod) {
      return { ok: true as const, appraisal, evaluatorRole: 'DEAN' as const }
    }
  }
  return { ok: false as const }
}
