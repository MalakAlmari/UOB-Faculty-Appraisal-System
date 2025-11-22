import type React from "react"
import { requireAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { FacultySidebar } from "@/components/layout/faculty-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  switch (user.role) {
    case UserRole.ADMIN:
      return redirect("/admin");
    case UserRole.DEAN:
      return redirect("/dean");
    case UserRole.HOD:
      return redirect("/hod");
    case UserRole.INSTRUCTOR:
      // For instructors, render the faculty layout
      return (
        <div className="flex h-screen bg-background">
          <FacultySidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      );
    default:
      return redirect("/auth/signin");
  }
}
