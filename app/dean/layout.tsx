import type React from "react"
import DeanLayout from "@/components/layout/dean-layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DeanLayout>{children}</DeanLayout>
}
