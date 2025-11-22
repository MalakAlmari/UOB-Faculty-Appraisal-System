import type React from "react"
import { requireAuth } from "@/lib/auth-utils"
import { FacultySidebar } from "./faculty-sidebar"
import { UserRole } from "@prisma/client"

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  if (user.role !== UserRole.INSTRUCTOR && user.role !== UserRole.HOD) {
    throw new Error("Access denied")
  }

  return (
    <div className="flex h-screen bg-background ml-2 divide-x divide-border">
      <FacultySidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
