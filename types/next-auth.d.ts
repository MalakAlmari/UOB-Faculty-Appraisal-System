import type { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      departmentId: string | null
      departmentName: string | null
      collegeName: string | null
    }
  }

  interface User {
    role: UserRole
    departmentId: string | null
    departmentName: string | null
    collegeName: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    departmentId: string | null
    departmentName: string | null
    collegeName: string | null
  }
}
