import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect("/auth/signin")
  }
  return session.user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized")
  }
  return user
}

export async function requireAdmin() {
  return await requireRole([UserRole.ADMIN])
}

export async function requireDean() {
  return await requireRole([UserRole.ADMIN, UserRole.DEAN])
}

export async function requireHOD() {
  return await requireRole([UserRole.ADMIN, UserRole.DEAN, UserRole.HOD])
}

export function canManageCollege(userRole: UserRole, userCollegeId: string | null, targetCollegeId: string) {
  if (userRole === UserRole.ADMIN) return true
  if (userRole === UserRole.DEAN && userCollegeId === targetCollegeId) return true
  return false
}

export function canManageMajor(
  userRole: UserRole,
  userCollegeId: string | null,
  userMajorId: string | null,
  targetCollegeId: string,
  targetMajorId: string,
) {
  if (userRole === UserRole.ADMIN) return true
  if (userRole === UserRole.DEAN && userCollegeId === targetCollegeId) return true
  if (userRole === UserRole.HOD && userCollegeId === targetCollegeId && userMajorId === targetMajorId) return true
  return false
}
