import type React from "react"
import { requireAdmin } from "@/lib/auth-utils"
import { AdminSidebar } from "./admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex h-screen bg-background ml-2 divide-x divide-border">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
