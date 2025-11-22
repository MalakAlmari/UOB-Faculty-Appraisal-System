import type React from "react"
import { requireDean } from "@/lib/auth-utils"
import { DeanSidebar } from "./dean-sidebar"

export default async function DeanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireDean()

  return (
    <div className="flex h-screen bg-background ml-2 divide-x divide-border">
      <DeanSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto">{children}</div>
      </main>
    </div>
  )
}
