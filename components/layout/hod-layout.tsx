import type React from "react"
import { requireHOD } from "@/lib/auth-utils"
import { HODSidebar } from "./hod-sidebar"

export default async function HODLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireHOD()

  return (
    <div className="flex h-screen bg-background ml-2 divide-x divide-border">
      <HODSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
