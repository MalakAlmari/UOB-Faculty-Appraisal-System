import { UserRole } from "@prisma/client"
import { prisma } from "./prisma"

export interface UserContext {
  id: string
  role: UserRole
  departmentId?: string | null
  collegeId?: string | null
}

export async function getUserContext(session: any): Promise<UserContext | null> {
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: {
      department: {
        include: {
          college: true,
        },
      },
    },
  })

  if (!user) return null

  return {
    id: user.id.toString(),
    role: user.role,
    departmentId: user.departmentId?.toString(),
    collegeId: user.department?.collegeId?.toString(),
  }
}

export function canAccessAdminFeatures(user: UserContext): boolean {
  return user.role === UserRole.ADMIN
}

export function canAccessDeanFeatures(user: UserContext): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.DEAN
}

export function canAccessHodFeatures(user: UserContext): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.DEAN || user.role === UserRole.HOD
}

export function canAccessInstructorFeatures(user: UserContext): boolean {
  return user.role === UserRole.ADMIN ||
         user.role === UserRole.DEAN ||
         user.role === UserRole.HOD ||
         user.role === UserRole.INSTRUCTOR
}

export function canManageUsers(user: UserContext): boolean {
  return user.role === UserRole.ADMIN
}

export function canManageColleges(user: UserContext): boolean {
  return user.role === UserRole.ADMIN
}

export function canManageDepartments(user: UserContext): boolean {
  return user.role === UserRole.ADMIN
}

export function canManageCycles(user: UserContext): boolean {
  return user.role === UserRole.ADMIN
}

export function canViewCollegeAppraisals(user: UserContext, collegeId?: string): boolean {
  if (user.role === UserRole.ADMIN) return true
  if (user.role === UserRole.DEAN && user.collegeId === collegeId) return true
  return false
}

export function canViewDepartmentAppraisals(user: UserContext, departmentId?: string): boolean {
  if (user.role === UserRole.ADMIN) return true
  if (user.role === UserRole.DEAN && user.collegeId) {
    // Check if department belongs to dean's college
    return true // We'll check in query
  }
  if (user.role === UserRole.HOD && user.departmentId === departmentId) return true
  return false
}

export function canEvaluateAppraisal(user: UserContext, appraisal: any): boolean {
  if (user.role === UserRole.ADMIN) return true

  if (user.role === UserRole.DEAN) {
    // Can evaluate HOD appraisals in their college
    return appraisal.faculty.role === UserRole.HOD &&
           appraisal.faculty.department?.collegeId?.toString() === user.collegeId
  }

  if (user.role === UserRole.HOD) {
    // Can evaluate instructor appraisals in their department
    return appraisal.faculty.role === UserRole.INSTRUCTOR &&
           appraisal.faculty.departmentId?.toString() === user.departmentId
  }

  return false
}

export function canViewOwnAppraisal(user: UserContext, appraisal: any): boolean {
  return appraisal.facultyId.toString() === user.id
}

export function canManageOwnAchievements(user: UserContext, appraisal: any): boolean {
  return appraisal.facultyId.toString() === user.id && user.role === UserRole.INSTRUCTOR
}